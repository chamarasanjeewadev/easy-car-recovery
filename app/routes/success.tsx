import { createFileRoute, Link } from '@tanstack/react-router'
import { successSearchSchema } from '~/lib/booking-search'
import { formatLongDate } from '~/lib/mock-calendar'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/success')({
  validateSearch: successSearchSchema,
  component: SuccessPage,
})

function SuccessPage() {
  const { ref, total, date, slot } = Route.useSearch()
  const niceDate = date ? formatLongDate(date) : 'your scheduled day'

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
        We'll see you on {niceDate}.
      </h1>
      <p className="mt-4 text-[17px] text-on-surface-variant">
        A confirmation is on its way to your inbox. Live tracking opens 30 minutes before pick-up — we'll text you a link.
      </p>

      <div className="my-8 rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
        <Row label="Reference" value={ref} />
        <Row label="Vehicle" value="VW Golf · LG19 KXR" />
        <Row label="Pick-up" value={slot ? `${niceDate} · ${slot}` : niceDate} />
        <Row label="Driver" value="Assigned 30 min before" />
        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-surface-high pt-4">
          <span className="text-on-surface-variant text-sm">Paid</span>
          <strong className="text-[28px] font-bold tracking-[-0.02em]">£{total ?? '—'}</strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/">Back to home</Link>
        </Button>
        <Button variant="outline" size="lg">
          Add to calendar
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
