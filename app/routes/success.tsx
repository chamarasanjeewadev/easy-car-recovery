import { createFileRoute, Link } from '@tanstack/react-router'
import { successSearchSchema } from '~/lib/booking-search'
import { formatLongDate } from '~/lib/calendar'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/success')({
  validateSearch: successSearchSchema,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: SuccessPage,
})

function SuccessPage() {
  const { requestId, reg, date, slot, from, to } = Route.useSearch()
  const niceDate = date ? formatLongDate(date) : 'your preferred day'

  return (
    <div className="container-app max-w-[640px] py-20 md:py-24">
      <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-primary-c text-on-primary-c">
        <Icon name="check" size={32} stroke={2.5} />
      </div>
      <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
        <span className="h-px w-4 bg-current" />
        Request received
      </span>
      <h1 className="mt-3 text-[clamp(32px,5vw,48px)] font-bold leading-tight tracking-[-0.02em]">
        Your recovery request is in.
      </h1>
      <p className="mt-4 text-[17px] text-on-surface-variant">
        Recovery drivers in your area are being notified now. Our team will contact you on the number
        you provided to share quotes and confirm — the network averages a 15-minute response.
      </p>

      <div className="my-8 rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
        <Row label="Reference" value={`#${requestId}`} />
        {reg && <Row label="Vehicle reg" value={reg.toUpperCase()} />}
        {from && <Row label="Route" value={`${from} → ${to ?? 'TBC'}`} />}
        <Row label="Preferred pick-up" value={slot ? `${niceDate} · ${slot}` : niceDate} />
      </div>

      <p className="mb-8 text-sm text-on-surface-variant">
        Keep your reference number handy if you call us about this booking. No payment has been taken.
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
