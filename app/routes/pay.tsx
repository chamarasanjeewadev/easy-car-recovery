import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { bookingSearchSchema } from '~/lib/booking-search'
import { priceQuote } from '~/lib/mock-quote'
import { buildMonth, formatLongDate } from '~/lib/mock-calendar'
import { approxRoadMiles } from '~/lib/distance'
import { createPaymentIntentFn } from '~/lib/api/payment'
import { Stepper } from '~/components/stepper'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/pay')({
  validateSearch: bookingSearchSchema,
  component: PayPage,
})

const FALLBACK_DISTANCE_MI = 12

let stripePromise: Promise<StripeJs | null> | null = null
function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    stripePromise = key ? loadStripe(key) : Promise.resolve(null)
  }
  return stripePromise
}

function newRef() {
  return `ECR-${Date.now().toString(36).toUpperCase().slice(-6)}`
}

function PayPage() {
  const search = Route.useSearch()

  const distanceMi =
    search.fromLat != null && search.fromLng != null && search.toLat != null && search.toLng != null
      ? approxRoadMiles(
          { lat: search.fromLat, lng: search.fromLng },
          { lat: search.toLat, lng: search.toLng },
        )
      : FALLBACK_DISTANCE_MI

  const baseQuote = priceQuote({
    size: search.size ?? 'car',
    condition: search.condition ?? 'drives',
    distanceMiles: distanceMi,
  })
  const date = search.date ?? new Date().toISOString().slice(0, 10)
  const month = buildMonth(new Date(date), baseQuote.total)
  const day = month.days.find((d) => d?.iso === date)
  const total = day?.price ?? baseQuote.total

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingRef, setBookingRef] = useState<string | null>(null)
  const [setupErr, setSetupErr] = useState<string | null>(null)

  const created = useRef(false)
  useEffect(() => {
    if (created.current) return
    created.current = true
    const ref = newRef()
    setBookingRef(ref)
    createPaymentIntentFn({
      data: {
        ref,
        reg: search.reg,
        fromAddress: search.from,
        toAddress: search.to,
        // Pricing inputs — the server recomputes the amount from these so the
        // client can't set the price. Must mirror the total shown above.
        size: search.size,
        condition: search.condition,
        fromLat: search.fromLat,
        fromLng: search.fromLng,
        toLat: search.toLat,
        toLng: search.toLng,
        date,
      },
    })
      .then((r) => setClientSecret(r.clientSecret))
      .catch((e: Error) => setSetupErr(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subtotal = Math.round(total / 1.2)
  const vat = total - subtotal

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: 'flat' as const,
              variables: {
                colorPrimary: '#88b000',
                colorBackground: '#edeee8',
                colorText: '#1a1c19',
                colorDanger: '#b00020',
                fontFamily: '"Inter Variable", system-ui, sans-serif',
                borderRadius: '16px',
                fontSizeBase: '15px',
              },
              rules: {
                '.Input': {
                  border: '1.5px solid transparent',
                  padding: '14px 16px',
                  fontWeight: '500',
                },
                '.Input:focus': {
                  border: '1.5px solid #88b000',
                  backgroundColor: '#ffffff',
                  boxShadow: 'none',
                },
                '.Label': { fontSize: '13px', fontWeight: '600', marginBottom: '8px' },
              },
            },
          }
        : null,
    [clientSecret],
  )

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
          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Payment</span>
              <span className="text-xs text-on-surface-variant">
                Powered by <b className="text-[#635bff]">stripe</b>
              </span>
            </div>

            {setupErr && (
              <div className="rounded-[var(--radius)] bg-[rgba(176,0,32,0.08)] px-4 py-3 text-sm text-[#b00020]">
                Payment setup failed: {setupErr}
              </div>
            )}

            {!setupErr && !clientSecret && (
              <div className="flex h-32 items-center justify-center text-sm text-on-surface-variant">
                Preparing secure payment…
              </div>
            )}

            {clientSecret && elementsOptions && (
              <Elements stripe={getStripe()} options={elementsOptions}>
                <CheckoutForm
                  total={total}
                  bookingRef={bookingRef ?? newRef()}
                  date={date}
                  slot={search.slot}
                />
              </Elements>
            )}

            <div className="mt-5 flex items-center gap-2.5 rounded-[var(--radius)] bg-surface-low px-3.5 py-3 text-sm text-on-surface-variant">
              <Icon name="lock" size={14} />
              256-bit TLS · 3D Secure · We never store your card details.
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Order</div>
            <Row
              label={`${search.size === 'van' ? 'Van' : search.size === 'suv' ? 'SUV' : 'Car'}`}
              value={`${shortLabel(search.from)} → ${shortLabel(search.to)}`}
            />
            <Row label={formatLongDate(date)} value={search.slot ?? '08:00 – 10:00'} />
            <Row label="Subtotal" value={`£${subtotal}`} />
            <Row label="VAT (20%)" value={`£${vat}`} />
            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-surface-high pt-4">
              <span className="text-on-surface-variant text-sm">Charge today</span>
              <strong className="text-[28px] font-bold tracking-[-0.02em]">£{total}</strong>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-on-surface-variant">
            By paying you accept our terms and refund policy.
          </p>
        </aside>
      </div>
    </div>
  )
}

function CheckoutForm({
  total,
  bookingRef,
  date,
  slot,
}: {
  total: number
  bookingRef: string
  date: string
  slot?: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    setErr(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/success?ref=${bookingRef}&total=${total}&date=${encodeURIComponent(date)}${slot ? `&slot=${encodeURIComponent(slot)}` : ''}`
            : '/success',
      },
    })

    if (error) {
      setErr(error.message ?? 'Payment failed')
      setBusy(false)
      return
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      navigate({ to: '/success', search: { ref: bookingRef, total, date, slot } })
    } else {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {err && (
        <div className="rounded-[var(--radius)] bg-[rgba(176,0,32,0.08)] px-4 py-3 text-sm text-[#b00020]">
          {err}
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || busy}>
        {busy ? 'Authorising…' : (
          <>
            Pay £{total} now <Icon name="arrow-right" size={16} />
          </>
        )}
      </Button>
    </form>
  )
}

function shortLabel(s?: string) {
  if (!s) return '—'
  return s.split(',')[0]
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <strong className="text-right font-semibold">{value}</strong>
    </div>
  )
}
