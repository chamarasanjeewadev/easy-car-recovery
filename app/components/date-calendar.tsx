import { useState } from 'react'
import { buildMonth, type CalendarDay } from '~/lib/calendar'
import { Icon } from './icon'

interface DateCalendarProps {
  value?: string
  onChange: (iso: string) => void
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function DateCalendar({ value, onChange }: DateCalendarProps) {
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
          <DayCell key={i} day={day} selected={value === day?.iso} onSelect={onChange} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-surface-high pt-4 text-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-inverse-surface" />
          Selected
        </span>
        <span>Same fixed price every day — your total is shown at checkout</span>
      </div>
    </div>
  )
}

function DayCell({
  day,
  selected,
  onSelect,
}: {
  day: CalendarDay | null
  selected: boolean
  onSelect: (iso: string) => void
}) {
  if (!day) return <div />
  const base = 'relative rounded-[var(--radius)] py-3.5 px-1 text-center transition active:scale-[0.97]'
  let cls = base
  if (day.isPast) {
    cls += ' bg-transparent text-outline opacity-50 cursor-not-allowed'
  } else if (selected) {
    cls += ' bg-inverse-surface text-inverse-on-surface'
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
      <div className="text-sm font-bold">
        {day.day}
        {day.isToday && <span className="ml-1 inline-block h-1 w-1 rounded-full bg-primary-c align-middle" />}
      </div>
    </button>
  )
}
