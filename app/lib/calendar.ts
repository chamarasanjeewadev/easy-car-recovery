export interface CalendarDay {
  iso: string
  day: number
  month: string
  isWeekend: boolean
  isPast: boolean
  isToday: boolean
}

export function buildMonth(reference: Date): { label: string; days: (CalendarDay | null)[] } {
  const year = reference.getFullYear()
  const month = reference.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (firstOfMonth.getDay() + 6) % 7

  const days: (CalendarDay | null)[] = []
  for (let i = 0; i < firstDow; i++) days.push(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const date = new Date(year, month, d)
    const dow = date.getDay()

    days.push({
      iso,
      day: d,
      month: firstOfMonth.toLocaleString('en-GB', { month: 'short' }),
      isWeekend: dow === 0 || dow === 6,
      isPast: date < today,
      isToday: date.getTime() === today.getTime(),
    })
  }

  return {
    label: firstOfMonth.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    days,
  }
}

// The en-dash format is load-bearing: submit-request.ts derives the preferred
// pick-up time by splitting each slot on '–'.
export const TIME_SLOTS = [
  '08:00 – 10:00',
  '10:00 – 12:00',
  '12:00 – 14:00',
  '14:00 – 16:00',
  '16:00 – 18:00',
  '18:00 – 20:00',
] as const

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Local "today" as YYYY-MM-DD, for seeding the calendar and computing client-side
// urgency. The server charge uses todayInLondon() authoritatively; this is display.
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
