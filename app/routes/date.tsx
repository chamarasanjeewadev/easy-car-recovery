import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import {
  bookingSearchSchema,
  journeyGaps,
  serviceNeedsDropoff,
  type Passengers,
} from '~/lib/booking-search'
import { TIME_SLOTS, formatLongDate, todayIso } from '~/lib/calendar'
import { lookupVehicleFn, titleCase, type VehicleResult } from '~/lib/api/lookup-vehicle'
import { uploadPhotos } from '~/lib/api/photos'
import { createCheckoutSessionFn } from '~/lib/api/payment'
import { normalizeUkMobile } from '~/lib/phone'
import { Stepper } from '~/components/stepper'
import { DateCalendar } from '~/components/date-calendar'
import { TimeSlotGrid } from '~/components/time-slot-grid'
import { BookingSummary } from '~/components/booking-summary'
import { SegmentControl } from '~/components/segment-control'
import { PhotoUpload } from '~/components/photo-upload'
import { OtpVerify } from '~/components/otp-verify'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useQuote } from '~/lib/use-quote'
import { useOtp } from '~/lib/use-otp'
import { phoneVerificationEnabled, verifiedTokenForPhone } from '~/lib/otp-verification'
import { applyUrgencyPence, hasUrgencyPremium } from '~/lib/pricing/urgency'

export const Route = createFileRoute('/date')({
  validateSearch: bookingSearchSchema,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: SchedulePage,
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

function SchedulePage() {
  const search = Route.useSearch()

  const today = todayIso()
  const [date, setDate] = useState(search.date ?? today)
  const [slot, setSlot] = useState(search.slot ?? TIME_SLOTS[0])

  // Date-neutral base; the calendar and summary apply the urgency multiplier per
  // selected day so the figure matches the server-side charge at checkout.
  const { amountPence: baseAmountPence, loading: priceLoading } = useQuote(search)
  const selectedPence =
    baseAmountPence != null ? applyUrgencyPence(baseAmountPence, date, today) : null
  const showUrgencyNote = baseAmountPence != null && hasUrgencyPremium(date, today)

  const needsDropoff = serviceNeedsDropoff(search.requestType)

  const [vehicle, setVehicle] = useState<VehicleResult | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [notes, setNotes] = useState('')
  const [passengers, setPassengers] = useState<Passengers>(search.passengers ?? '0')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [extrasOpen, setExtrasOpen] = useState(false)
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  const otp = useOtp()
  const verifyEnabled = phoneVerificationEnabled()
  const mobileE164 = normalizeUkMobile(mobile)

  // Keep the selected date + slot in the URL so the quote/summary stay in sync
  // and a refresh preserves the choice.
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('date', date)
    url.searchParams.set('slot', slot)
    window.history.replaceState(window.history.state, '', url)
  }, [date, slot])

  // Show the verified vehicle (non-blocking; the server re-runs lookup at charge time).
  useEffect(() => {
    if (!search.reg) return
    let cancelled = false
    lookupVehicleFn({ data: { reg: search.reg } })
      .then((v) => {
        if (!cancelled) setVehicle(v)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [search.reg])

  // The journey (vehicle + locations) must be complete before we can price a day.
  const journeyIncomplete =
    journeyGaps(search).filter((g) => g !== 'date' && g !== 'slot').length > 0
  if (journeyIncomplete) {
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
    if (
      verifyEnabled &&
      parsed.success &&
      !otp.isVerifiedForPhone(normalizeUkMobile(parsed.data.mobile))
    ) {
      nextErrors.mobile = 'Please verify your mobile number to continue.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !parsed.success) return

    setSubmitting(true)
    setSubmitErr(null)

    // Upload any photos now; only the link token travels into the booking metadata.
    let uploadToken: string | undefined
    if (photoFiles.length > 0) {
      try {
        const result = await uploadPhotos(photoFiles)
        uploadToken = result?.uploadToken
      } catch (e) {
        setSubmitErr(e instanceof Error ? e.message : 'Photo upload failed. Please try again.')
        setSubmitting(false)
        return
      }
    }

    const verifiedToken = verifyEnabled
      ? verifiedTokenForPhone(normalizeUkMobile(parsed.data.mobile)) || undefined
      : undefined

    try {
      const { url } = await createCheckoutSessionFn({
        data: {
          reg: search.reg,
          from: search.from!,
          fromLat: search.fromLat!,
          fromLng: search.fromLng!,
          to: search.to,
          toLat: search.toLat,
          toLng: search.toLng,
          fromPostcode: search.fromPostcode,
          toPostcode: search.toPostcode,
          size: search.size ?? 'car',
          condition: search.condition ?? 'drives',
          requestType: search.requestType ?? 'RECOVERY',
          passengers,
          make: search.make,
          makeModel: search.makeModel,
          vehicleClass: search.vehicleClass,
          manualVehicle: search.manualVehicle,
          uploadToken,
          date,
          slot,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          mobile: parsed.data.mobile,
          notes: notes.trim() || undefined,
          verifiedToken,
          termsAcceptedAt: new Date().toISOString(),
          origin: window.location.origin,
          cancelUrl: window.location.href,
        },
      })
      // Hand off to Stripe's hosted checkout.
      window.location.assign(url)
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Could not start payment. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="container-app py-6 md:py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/quote" search={search}>
            <Icon name="arrow-left" size={16} /> Back
          </Link>
        </Button>
        <Stepper step={1} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <DateCalendar
              value={date}
              onChange={setDate}
              baseAmountPence={baseAmountPence}
              todayIso={today}
            />
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Pick-up window</span>
              <span className="text-[13px] text-on-surface-variant">Driver arrives within window</span>
            </div>
            <TimeSlotGrid value={slot} onChange={setSlot} />
            <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius)] bg-[rgba(136,176,0,0.10)] px-4 py-3 text-sm font-medium text-primary">
              <Icon name="clock" size={14} />
              Need recovery today? Pick today's date — same-day recovery is dispatched as urgent.
            </div>
          </div>

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
            {verifyEnabled && <OtpVerify otp={otp} e164={mobileE164} disabled={submitting} />}
            <p className="mt-4 text-[13px] text-on-surface-variant">
              Recovery drivers and our team use these details to confirm your booking and arrange pick-up.
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => setExtrasOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={extrasOpen}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Add details <span className="normal-case font-normal">· optional</span>
              </span>
              <Icon name={extrasOpen ? 'x' : 'plus'} size={16} />
            </button>

            {extrasOpen && (
              <div className="mt-5 flex flex-col gap-5">
                <div>
                  <div className="mb-2 text-[13px] font-semibold">Anything the driver should know?</div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="e.g. on a narrow driveway, keys with neighbour, front wheels locked…"
                    className="w-full rounded-[var(--radius)] border-[1.5px] border-transparent bg-surface-c px-4 py-3.5 text-[15px] font-medium placeholder:text-outline focus:border-primary-c focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <div className="mb-2 text-[13px] font-semibold">Passengers travelling with the vehicle?</div>
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
                <div>
                  <div className="mb-2 text-[13px] font-semibold">Photos</div>
                  <PhotoUpload files={photoFiles} onChange={setPhotoFiles} disabled={submitting} />
                </div>
              </div>
            )}
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

          {submitErr && (
            <div className="rounded-[var(--radius)] bg-[rgba(176,0,32,0.08)] px-4 py-3 text-sm text-[#b00020]">
              {submitErr}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <BookingSummary
            rows={[
              { label: 'Pick-up', value: formatLongDate(date) },
              { label: 'Window', value: slot },
              {
                label: needsDropoff ? 'Route' : 'Location',
                value: needsDropoff ? `${search.from} → ${search.to}` : `${search.from}`,
              },
            ]}
            pricePence={selectedPence}
            priceLoading={priceLoading}
            priceNote={showUrgencyNote ? 'Includes urgency for your chosen date' : undefined}
            ctaLabel="Pay & book"
            onCta={submit}
            disabled={submitting}
            busyLabel="Redirecting to secure payment…"
            fine="You'll pay securely on Stripe. Your booking is confirmed once payment succeeds."
          />
        </aside>
      </div>
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return <span className="block text-xs font-medium text-[#b00020]">{message}</span>
}
