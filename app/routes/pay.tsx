import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { paySearchSchema, serviceNeedsDropoff } from '~/lib/booking-search'
import { formatLongDate } from '~/lib/calendar'
import { createPaymentIntentFn } from '~/lib/api/payment'
import { formatPounds } from '~/lib/money'
import { Stepper } from '~/components/stepper'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/pay')({
  validateSearch: paySearchSchema,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: PayPage,
})

let stripePromise: Promise<StripeJs | null> | null = null
function getStripeJs() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    stripePromise = key ? loadStripe(key) : Promise.resolve(null)
  }
  return stripePromise
}

function PayPage() {
  const search = Route.useSearch()

  const needsDropoff = serviceNeedsDropoff(search.requestType)
  const journeyReady =
    (!!search.reg || !!search.manualVehicle) &&
    !!search.from &&
    search.fromLat != null &&
    search.fromLng != null &&
    (needsDropoff ? !!search.to && search.toLat != null && search.toLng != null : true) &&
    !!search.date &&
    !!search.slot
  const contactReady =
    !!search.firstName && !!search.email && !!search.mobile && !!search.termsAcceptedAt

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amountPence, setAmountPence] = useState<number | null>(null)
  const [setupErr, setSetupErr] = useState<string | null>(null)

  const created = useRef(false)
  useEffect(() => {
    if (!journeyReady || !contactReady || created.current) return
    created.current = true
    // The server recomputes the price from these inputs (distance, vehicle
    // weight, live pricing config) — the client never supplies the amount.
    createPaymentIntentFn({
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
        passengers: search.passengers,
        make: search.make,
        makeModel: search.makeModel,
        vehicleClass: search.vehicleClass,
        manualVehicle: search.manualVehicle,
        uploadToken: search.uploadToken,
        date: search.date!,
        slot: search.slot!,
        firstName: search.firstName!,
        lastName: search.lastName ?? '',
        email: search.email!,
        mobile: search.mobile!,
        notes: search.notes,
        termsAcceptedAt: search.termsAcceptedAt!,
      },
    })
      .then((r) => {
        setAmountPence(r.amountPence)
        setClientSecret(r.clientSecret)
      })
      .catch((e: Error) => setSetupErr(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyReady, contactReady])

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

  if (!journeyReady || !contactReady) {
    return (
      <div className="container-app max-w-[560px] py-20 text-center">
        <h1 className="text-2xl font-bold">
          {journeyReady ? 'We need your contact details first' : "Let's finish your journey details first"}
        </h1>
        <p className="mt-3 text-on-surface-variant">
          {journeyReady
            ? 'Add your name and contact details so we can confirm your recovery.'
            : 'We need your vehicle, locations, and a pick-up time before you can pay.'}
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to={journeyReady ? '/details' : '/quote'} search={search}>
            {journeyReady ? 'Back to your details' : 'Back to your journey'}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container-app py-6 md:py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/details" search={search}>
            <Icon name="arrow-left" size={16} /> Back
          </Link>
        </Button>
        <Stepper step={3} />
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

            {clientSecret && elementsOptions && amountPence != null && (
              <Elements stripe={getStripeJs()} options={elementsOptions}>
                <CheckoutForm amountPence={amountPence} />
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
              label="Vehicle"
              value={
                search.reg
                  ? search.reg.toUpperCase()
                  : [search.make, search.makeModel].filter(Boolean).join(' ') || 'Vehicle'
              }
            />
            <Row
              label={needsDropoff ? 'Route' : 'Location'}
              value={needsDropoff ? `${shortLabel(search.from)} → ${shortLabel(search.to)}` : shortLabel(search.from)}
            />
            <Row label={formatLongDate(search.date!)} value={search.slot!} />
            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-surface-high pt-4">
              <span className="text-on-surface-variant text-sm">Charge today</span>
              <strong className="text-[28px] font-bold tracking-[-0.02em]">
                {amountPence != null ? formatPounds(amountPence) : '—'}
              </strong>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-on-surface-variant">
            Fixed price for your booking. Fully refunded if we can't fulfil your recovery.
          </p>
        </aside>
      </div>
    </div>
  )
}

function CheckoutForm({ amountPence }: { amountPence: number }) {
  const search = Route.useSearch()
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

    // Journey summary params for the success page; Stripe appends
    // payment_intent/payment_intent_client_secret/redirect_status on 3DS return.
    const successParams = new URLSearchParams()
    if (search.reg) successParams.set('reg', search.reg)
    if (search.date) successParams.set('date', search.date)
    if (search.slot) successParams.set('slot', search.slot)
    if (search.from) successParams.set('from', search.from)
    if (search.to) successParams.set('to', search.to)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/success?${successParams.toString()}`
            : '/success',
      },
    })

    if (error) {
      setErr(error.message ?? 'Payment failed')
      setBusy(false)
      return
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      navigate({
        to: '/success',
        search: {
          payment_intent: paymentIntent.id,
          paid: paymentIntent.amount,
          reg: search.reg,
          date: search.date,
          slot: search.slot,
          from: search.from,
          to: search.to,
        },
      })
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
            Pay {formatPounds(amountPence)} now <Icon name="arrow-right" size={16} />
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
