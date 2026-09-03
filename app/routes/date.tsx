import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { bookingSearchSchema } from '~/lib/booking-search'
import { TIME_SLOTS, formatLongDate, todayIso } from '~/lib/calendar'
import { Stepper } from '~/components/stepper'
import { DateCalendar } from '~/components/date-calendar'
import { TimeSlotGrid } from '~/components/time-slot-grid'
import { BookingSummary } from '~/components/booking-summary'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'
import { useQuote } from '~/lib/use-quote'
import { applyUrgencyPence, hasUrgencyPremium } from '~/lib/pricing/urgency'

export const Route = createFileRoute('/date')({
  validateSearch: bookingSearchSchema,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: DatePage,
})

function DatePage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const today = todayIso()
  const [date, setDate] = useState(search.date ?? today)
  const [slot, setSlot] = useState(search.slot ?? TIME_SLOTS[0])
  // Date-neutral base for the journey; the calendar and summary apply the urgency
  // multiplier per selected day so the figure matches the server-side charge.
  const { amountPence: baseAmountPence, loading: priceLoading } = useQuote(search)
  const selectedPence =
    baseAmountPence != null ? applyUrgencyPence(baseAmountPence, date, today) : null
  const showUrgencyNote = baseAmountPence != null && hasUrgencyPremium(date, today)

  useEffect(() => {
    navigate({
      to: '/date',
      search: (prev) => ({ ...prev, date, slot }),
      replace: true,
    })
  }, [date, slot])

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
        </div>

        <aside className="lg:sticky lg:top-24">
          <BookingSummary
            rows={[
              { label: 'Pick-up', value: formatLongDate(date) },
              { label: 'Window', value: slot },
              { label: 'Route', value: `${search.from || 'Pick-up'} → ${search.to || 'TBC'}` },
            ]}
            pricePence={selectedPence}
            priceLoading={priceLoading}
            priceNote={showUrgencyNote ? 'Includes urgency for your chosen date' : undefined}
            ctaLabel="Continue"
            ctaHref={{ to: '/details', search: { ...search, date, slot } }}
            fine="Next: your details, then secure online payment at a fixed price."
          />
        </aside>
      </div>
    </div>
  )
}
