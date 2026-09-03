import { useMemo, useState } from 'react'
import { buildMonth, type CalendarDay } from '~/lib/calendar'
import { applyUrgencyPence } from '~/lib/pricing/urgency'
import { formatPounds } from '~/lib/money'
import { Icon } from './icon'

interface DateCalendarProps {
  value?: string
  onChange: (iso: string) => void
  /**
   * Date-neutral base price (pence) for the current journey. When present, each
   * day cell shows its urgency-adjusted price and the cheapest upcoming day is
   * badged "Best price". null = not enough inputs yet → plain day grid.
   */
  baseAmountPence?: number | null
  /** "Today" (YYYY-MM-DD) used to compute lead-day urgency. */
  todayIso: string
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function DateCalendar({ value, onChange, baseAmountPence, todayIso }: DateCalendarProps) {
  const [reference, setReference] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      return new Date(y, m - 1, 1)
    }
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const month = buildMonth(reference)
  const isCurrentMonth =
    reference.getFullYear() === today.getFullYear() && reference.getMonth() === today.getMonth()

  const showPrices = baseAmountPence != null

  // Price per day (pence) and the ISO of the cheapest upcoming day in this month,
  // so we can badge it "Best price" like the AnyVan reference. The earliest day at
  // the minimum price wins ties (usually the first day in the flat "best" band).
  const { priceByIso, bestIso } = useMemo(() => {
    const map: Record<string, number> = {}
    if (baseAmountPence == null) return { priceByIso: map, bestIso: null as string | null }
    let best: string | null = null
    let bestPrice = Infinity
    for (const day of month.days) {
      if (!day || day.isPast) continue
      const price = applyUrgencyPence(baseAmountPence, day.iso, todayIso)
      map[day.iso] = price
      if (price < bestPrice) {
        bestPrice = price
        best = day.iso
      }
    }
    return { priceByIso: map, bestIso: best }
  }, [baseAmountPence, todayIso, month.days])

  const shift = (delta: number) => {
    setReference((r) => new Date(r.getFullYear(), r.getMonth() + delta, 1))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={isCurrentMonth}
          aria-label="Previous month"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-c text-on-surface transition hover:bg-surface-high disabled:cursor-not-allowed disabled:text-outline disabled:opacity-50"
        >
          <Icon name="arrow-left" size={16} />
        </button>
        <div className="text-[22px] font-bold tracking-tight">{month.label}</div>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-c text-on-surface transition hover:bg-surface-high"
        >
          <Icon name="arrow-right" size={16} />
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1.5 text-center text-xs font-semibold text-on-surface-variant">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {month.days.map((day, i) => (
          <DayCell
            key={i}
            day={day}
            selected={value === day?.iso}
            onSelect={onChange}
            pricePence={day ? priceByIso[day.iso] : undefined}
            isBest={showPrices && !!day && day.iso === bestIso}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-high pt-4 text-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-inverse-surface" />
          Selected
        </span>
        {showPrices && (
          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
            <Icon name="star" size={13} /> Best price
          </span>
        )}
        <span>
          {showPrices
            ? 'Same-day and next-day recovery cost more — book a few days ahead for the best price.'
            : 'Prices show once your vehicle and route are set.'}
        </span>
      </div>
    </div>
  )
}

function DayCell({
  day,
  selected,
  onSelect,
  pricePence,
  isBest,
}: {
  day: CalendarDay | null
  selected: boolean
  onSelect: (iso: string) => void
  pricePence?: number
  isBest?: boolean
}) {
  if (!day) return <div />
  const hasPrice = pricePence != null
  const base =
    'relative flex flex-col items-center justify-start gap-0.5 rounded-[var(--radius)] px-1 text-center transition active:scale-[0.97] ' +
    (hasPrice ? 'py-2 min-h-[58px]' : 'py-3.5')
  let cls = base
  if (day.isPast) {
    cls += ' bg-transparent text-outline opacity-50 cursor-not-allowed'
  } else if (selected) {
    cls += ' bg-inverse-surface text-inverse-on-surface'
  } else if (isBest) {
    cls += ' bg-[rgba(136,176,0,0.12)] ring-1 ring-inset ring-primary/40 hover:bg-[rgba(136,176,0,0.18)]'
  } else {
    cls += ' bg-surface-low hover:bg-surface-c'
  }

  return (
    <button
      type="button"
      onClick={() => !day.isPast && onSelect(day.iso)}
      disabled={day.isPast}
      className={cls}
    >
      <span className="flex items-center gap-1 text-sm font-bold leading-none">
        {day.day}
        {day.isToday && <span className="inline-block h-1 w-1 rounded-full bg-primary-c align-middle" />}
      </span>
      {hasPrice && (
        <span
          className={
            'text-[11px] font-semibold leading-tight ' +
            (selected ? 'text-inverse-on-surface' : isBest ? 'text-primary' : 'text-on-surface-variant')
          }
        >
          {formatPounds(pricePence!)}
        </span>
      )}
      {isBest && !selected && (
        <Icon name="star" size={11} className="absolute right-1 top-1 text-primary" />
      )}
    </button>
  )
}
