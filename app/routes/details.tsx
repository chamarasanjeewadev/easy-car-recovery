import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import {
  bookingSearchSchema,
  serviceNeedsDropoff,
  type Passengers,
} from '~/lib/booking-search'
import { formatLongDate } from '~/lib/calendar'
import { approxRoadMiles } from '~/lib/distance'
import { lookupVehicleFn, titleCase, type VehicleResult } from '~/lib/api/lookup-vehicle'
import { uploadPhotos } from '~/lib/api/photos'
import { normalizeUkMobile } from '~/lib/phone'
import { Stepper } from '~/components/stepper'
import { BookingSummary } from '~/components/booking-summary'
import { SegmentControl } from '~/components/segment-control'
import { PhotoUpload } from '~/components/photo-upload'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useQuote } from '~/lib/use-quote'

export const Route = createFileRoute('/details')({
  validateSearch: bookingSearchSchema,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: DetailsPage,
})

const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name'),
  lastName: z.string().trim(),
  email: z.string().trim().email('Enter a valid email address'),
  mobile: z
    .string()
    .refine((v) => normalizeUkMobile(v) !== null, 'Enter a valid UK mobile number (07…)'),
})

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'mobile' | 'terms', string>>

function DetailsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { amountPence, loading: priceLoading } = useQuote(search)

  const needsDropoff = serviceNeedsDropoff(search.requestType)
  const hasVehicle = !!search.reg || !!search.manualVehicle

  // Drop-off is required for relocation services: the charged price is computed
  // from the pick-up -> drop-off distance, so it must never fall back to a guess.
  // On-site services (jump-start / fuel / scrap) price against the pick-up only.
  const ready =
    hasVehicle &&
    !!search.from &&
    search.fromLat != null &&
    search.fromLng != null &&
    (needsDropoff ? !!search.to && search.toLat != null && search.toLng != null : true) &&
    !!search.date &&
    !!search.slot

  const [vehicle, setVehicle] = useState<VehicleResult | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [notes, setNotes] = useState('')
  const [passengers, setPassengers] = useState<Passengers>(search.passengers ?? '0')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (!search.reg) return
    let cancelled = false
    lookupVehicleFn({ data: { reg: search.reg } })
      .then((v) => {
        if (!cancelled) setVehicle(v)
      })
      .catch(() => {
        // Non-blocking: the server re-runs the lookup at submit time anyway.
      })
    return () => {
      cancelled = true
    }
  }, [search.reg])

  if (!ready) {
    return (
      <div className="container-app max-w-[560px] py-20 text-center">
        <h1 className="text-2xl font-bold">Let's finish your journey details first</h1>
        <p className="mt-3 text-on-surface-variant">
          We need your vehicle, locations, and a pick-up time before you can book.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/quote" search={search}>
            Back to your journey
          </Link>
        </Button>
      </div>
    )
  }

  const distanceMi =
    needsDropoff && search.toLat != null && search.toLng != null
      ? approxRoadMiles(
          { lat: search.fromLat!, lng: search.fromLng! },
          { lat: search.toLat, lng: search.toLng },
        )
      : 0

  const submit = async () => {
    const parsed = contactSchema.safeParse({ firstName, lastName, email, mobile })
    const nextErrors: FieldErrors = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (!nextErrors[key]) nextErrors[key] = issue.message
      }
    }
    if (!terms) nextErrors.terms = 'Please accept the terms to continue'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !parsed.success) return

    // Upload any photos now (final set only) and carry just the link token to
    // /pay — it goes into the PaymentIntent metadata and links the photos to the
    // booking on the backend after payment succeeds.
    let uploadToken: string | undefined
    if (photoFiles.length > 0) {
      setUploading(true)
      setUploadErr(null)
      try {
        const result = await uploadPhotos(photoFiles)
        uploadToken = result?.uploadToken
      } catch (e) {
        setUploadErr(e instanceof Error ? e.message : 'Photo upload failed. Please try again.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    // No booking is created here — /pay charges first, and the booking is
    // submitted only after Stripe confirms the payment.
    navigate({
      to: '/pay',
      search: {
        ...search,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        mobile: parsed.data.mobile,
        notes: notes.trim() || undefined,
        passengers,
        uploadToken,
        termsAcceptedAt: new Date().toISOString(),
      },
    })
  }

  return (
    <div className="container-app py-6 md:py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/date" search={search}>
            <Icon name="arrow-left" size={16} /> Back
          </Link>
        </Button>
        <Stepper step={2} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          {vehicle && (
            <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Vehicle
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-[var(--radius)] bg-surface-c">
                  <Icon name="car" size={22} />
                </div>
                <div>
                  <div className="font-bold">{titleCase(vehicle.makeModel || vehicle.make)}</div>
                  <div className="text-sm text-on-surface-variant">{vehicle.plate}</div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Your details
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="John"
                />
                {errors.firstName && <FieldError message={errors.firstName} />}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  placeholder="Smith"
                />
                {errors.lastName && <FieldError message={errors.lastName} />}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mobile">UK mobile number</Label>
                <Input
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="07123 456789"
                />
                {errors.mobile && <FieldError message={errors.mobile} />}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                />
                {errors.email && <FieldError message={errors.email} />}
              </div>
            </div>
            <p className="mt-4 text-[13px] text-on-surface-variant">
              Recovery drivers and our team use these details to confirm your booking and arrange pick-up.
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Anything the driver should know? <span className="normal-case font-normal">· optional</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. on a narrow driveway, keys with neighbour, front wheels locked…"
              className="w-full rounded-[var(--radius)] border-[1.5px] border-transparent bg-surface-c px-4 py-3.5 text-[15px] font-medium placeholder:text-outline focus:border-primary-c focus:bg-white focus:outline-none"
            />
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Passengers</span>
              <span className="text-[13px] text-on-surface-variant">Anyone travelling with the vehicle?</span>
            </div>
            <SegmentControl
              value={passengers}
              onChange={setPassengers}
              options={[
                { value: '0', label: 'None' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3+', label: '3+' },
              ]}
            />
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Photos <span className="normal-case font-normal">· optional</span>
            </div>
            <PhotoUpload files={photoFiles} onChange={setPhotoFiles} disabled={uploading} />
            {uploadErr && <p className="mt-2 text-xs font-medium text-[#b00020]">{uploadErr}</p>}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] bg-white p-5 shadow-[var(--shadow-card)]">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm text-on-surface-variant">
              I accept the{' '}
              <Link to="/terms" className="font-semibold text-on-surface underline">
                terms of service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="font-semibold text-on-surface underline">
                privacy policy
              </Link>
              , and agree to be contacted about this recovery request.
              {errors.terms && <FieldError message={errors.terms} />}
            </span>
          </label>

        </div>

        <aside className="lg:sticky lg:top-24">
          <BookingSummary
            rows={[
              { label: 'Pick-up', value: formatLongDate(search.date!) },
              { label: 'Window', value: search.slot! },
              {
                label: needsDropoff ? 'Route' : 'Location',
                value: needsDropoff ? `${search.from} → ${search.to}` : `${search.from}`,
              },
              ...(needsDropoff ? [{ label: 'Distance', value: `${distanceMi} mi` }] : []),
            ]}
            pricePence={amountPence}
            priceLoading={priceLoading}
            ctaLabel="Continue to payment"
            onCta={submit}
            disabled={uploading}
            busyLabel="Uploading photos…"
            fine="Next: secure card payment. Your booking is only confirmed once payment succeeds."
          />
        </aside>
      </div>
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return <span className="block text-xs font-medium text-[#b00020]">{message}</span>
}
