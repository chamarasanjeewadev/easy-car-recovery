export interface CalendarDay {
  iso: string
  day: number
  month: string
  isWeekend: boolean
  isPast: boolean
  isToday: boolean
  isCheap: boolean
  price: number
}

export function buildMonth(reference: Date, basePrice: number): { label: string; days: (CalendarDay | null)[]; cheapestIso: string | null } {
  const year = reference.getFullYear()
  const month = reference.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (firstOfMonth.getDay() + 6) % 7

  const days: (CalendarDay | null)[] = []
  for (let i = 0; i < firstDow; i++) days.push(null)

  let cheapest: CalendarDay | null = null

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const date = new Date(year, month, d)
    const dow = date.getDay()
    const isWeekend = dow === 0 || dow === 6
    const isPast = date < today
    const isToday = date.getTime() === today.getTime()
    const isCheap = !isPast && !isWeekend && d % 4 === 1
    const price = isPast ? 0 : isWeekend ? basePrice + 24 : isCheap ? Math.max(40, basePrice - 18) : basePrice

    const cell: CalendarDay = {
      iso,
      day: d,
      month: firstOfMonth.toLocaleString('en-GB', { month: 'short' }),
      isWeekend,
      isPast,
      isToday,
      isCheap,
      price,
    }
    days.push(cell)

    if (!isPast && (cheapest === null || cell.price < cheapest.price)) {
      cheapest = cell
    }
  }

  return {
    label: firstOfMonth.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    days,
    cheapestIso: cheapest?.iso ?? null,
  }
}

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
