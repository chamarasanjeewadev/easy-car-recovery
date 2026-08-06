import { TIME_SLOTS } from '~/lib/calendar'

interface TimeSlotGridProps {
  value?: string
  onChange: (slot: string) => void
}

export function TimeSlotGrid({ value, onChange }: TimeSlotGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
      {TIME_SLOTS.map((slot) => {
        const active = value === slot
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onChange(slot)}
            className={`rounded-full px-4 py-3.5 text-sm font-semibold transition ${
              active
                ? 'bg-white text-on-surface shadow-[0_1px_2px_rgba(0,0,0,0.08)] ring-2 ring-primary-c'
                : 'bg-surface-c text-on-surface-variant hover:bg-surface-high hover:text-on-surface'
            }`}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}
