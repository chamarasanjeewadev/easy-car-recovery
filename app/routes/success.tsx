import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { successSearchSchema } from '~/lib/booking-search'
import { formatLongDate } from '~/lib/calendar'
import { finalizeBookingFromSessionFn } from '~/lib/api/payment'
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '~/lib/site'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/success')({
  validateSearch: successSearchSchema,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: SuccessPage,
})

const MAX_ATTEMPTS = 5
const RETRY_DELAY_MS = 3_000

type FinalizeState =
  | { phase: 'confirming' }
  | { phase: 'done'; requestId: number | null; amountPence: number }
  // Paid, but the booking couldn't be auto-confirmed yet — the webhook or our
  // team completes it.
  | { phase: 'pending' }
  | { phase: 'not_paid' }

function SuccessPage() {
  const { session_id, reg, date, slot, from, to } = Route.useSearch()
  const niceDate = date ? formatLongDate(date) : 'your preferred day'

  const [state, setState] = useState<FinalizeState>(() =>
    session_id ? { phase: 'confirming' } : { phase: 'not_paid' },
  )

  const started = useRef(false)
  useEffect(() => {
    if (!session_id || started.current) return
    started.current = true
    let cancelled = false

    const run = async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        let result
        try {
          result = await finalizeBookingFromSessionFn({ data: { sessionId: session_id } })
        } catch {
          result = { ok: false as const, code: 'UNAVAILABLE' as const, message: '' }
        }
        if (cancelled) return

        if (result.ok) {
          setState({ phase: 'done', requestId: result.requestId, amountPence: result.amountPence })
          return
        }
        if (result.code === 'NOT_PAID') {
          setState({ phase: 'not_paid' })
          return
        }
        if (result.code === 'MANUAL' || result.code === 'MISMATCH') {
          setState({ phase: 'pending' })
          return
        }
        // IN_FLIGHT / UNAVAILABLE: another actor may be creating the booking,
        // or the booking service is briefly down — retry.
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
          if (cancelled) return
        }
      }
      // Payment is safe; the Stripe webhook keeps retrying the booking.
      setState({ phase: 'pending' })
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id])

  if (state.phase === 'confirming') {
    return (
      <div className="container-app max-w-[640px] py-20 md:py-24">
        <div className="grid h-[72px] w-[72px] animate-pulse place-items-center rounded-full bg-surface-c">
          <Icon name="check" size={32} stroke={2.5} />
        </div>
        <h1 className="mt-7 text-[clamp(28px,5vw,40px)] font-bold leading-tight tracking-[-0.02em]">
          Confirming your booking…
        </h1>
        <p className="mt-4 text-[17px] text-on-surface-variant">
          Your payment has been received. We're creating your recovery request — this normally
          takes a few seconds. Please keep this page open.
        </p>
      </div>
    )
  }

  if (state.phase === 'not_paid') {
    return (
      <div className="container-app max-w-[640px] py-20 md:py-24">
        <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[#fdf3f4] text-[#b00020]">
          <Icon name="x" size={32} stroke={2.5} />
        </div>
        <h1 className="mt-7 text-[clamp(28px,5vw,40px)] font-bold leading-tight tracking-[-0.02em]">
          Payment was not completed
        </h1>
        <p className="mt-4 text-[17px] text-on-surface-variant">
          You have not been charged and no booking was made. You can start again, or call us on{' '}
          <a href={SUPPORT_PHONE_TEL} className="font-semibold underline">
            {SUPPORT_PHONE_DISPLAY}
          </a>{' '}
          and we'll take your booking over the phone.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/quote" search={{ reg, from, to }}>
              Try again
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (state.phase === 'pending') {
    return (
      <div className="container-app max-w-[640px] py-20 md:py-24">
        <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-primary-c text-on-primary-c">
          <Icon name="check" size={32} stroke={2.5} />
        </div>
        <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          <span className="h-px w-4 bg-current" />
          Payment received
        </span>
        <h1 className="mt-3 text-[clamp(28px,5vw,40px)] font-bold leading-tight tracking-[-0.02em]">
          Payment received — booking confirmation to follow.
        </h1>
        <p className="mt-4 text-[17px] text-on-surface-variant">
          Your payment is safe and a receipt is on its way to your email. We're finishing your
          booking confirmation and will text and email you shortly. If you'd like to confirm now,
          call us on{' '}
          <a href={SUPPORT_PHONE_TEL} className="font-semibold underline">
            {SUPPORT_PHONE_DISPLAY}
          </a>
          .
        </p>
        {(reg || from) && (
          <div className="my-8 rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            {reg && <Row label="Vehicle reg" value={reg.toUpperCase()} />}
            {from && <Row label="Route" value={`${from} → ${to ?? 'TBC'}`} />}
          </div>
        )}
        <Button asChild size="lg">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container-app max-w-[640px] py-20 md:py-24">
      <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-primary-c text-on-primary-c">
        <Icon name="check" size={32} stroke={2.5} />
      </div>
      <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
        <span className="h-px w-4 bg-current" />
        Booking confirmed
      </span>
      <h1 className="mt-3 text-[clamp(32px,5vw,48px)] font-bold leading-tight tracking-[-0.02em]">
        Your recovery is booked.
      </h1>
      <p className="mt-4 text-[17px] text-on-surface-variant">
        Recovery drivers in your area are being notified now. Our team will contact you on the number
        you provided to confirm pick-up — the network averages a 15-minute response.
      </p>

      <div className="my-8 rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
        <Row
          label="Reference"
          value={state.requestId != null ? `#${state.requestId}` : 'Sent by text shortly'}
        />
        {state.amountPence > 0 && (
          <Row label="Paid" value={`£${(state.amountPence / 100).toFixed(2)}`} />
        )}
        {reg && <Row label="Vehicle reg" value={reg.toUpperCase()} />}
        {from && <Row label="Route" value={`${from} → ${to ?? 'TBC'}`} />}
        <Row label="Preferred pick-up" value={slot ? `${niceDate} · ${slot}` : niceDate} />
      </div>

      <p className="mb-8 text-sm text-on-surface-variant">
        Keep your reference number handy if you call us about this booking. A payment receipt has
        been sent to your email.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <strong className="text-right font-semibold">{value}</strong>
    </div>
  )
}
