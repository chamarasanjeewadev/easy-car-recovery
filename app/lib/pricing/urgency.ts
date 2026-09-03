// Date/urgency multiplier applied on top of the TowMyCar "recommended" price.
//
// The base price (distance × weight × request type × commission) is computed by
// the shared TMC calculator in ./calculator.ts and never changes here. This layer
// only adjusts for WHEN the recovery is booked: same-day and next-day pick-ups
// carry an urgency premium that tapers to nothing a few days out, and weekend
// pick-ups carry a small out-of-hours uplift.
//
// It is intentionally a pure, deterministic function of the two ISO dates so the
// per-day price shown in the calendar (client) and the amount charged via Stripe
// (server, recomputed at /pay) are byte-identical. Both sides call
// applyUrgencyPence with the same base and dates.

// Multiplier by lead time in whole days from "today": index 0 = same-day.
// Any lead day at or beyond the array length prices flat at 1.0 (the "best price"
// band). Tuned as the "Moderate" curve: +35% same-day, +18% next-day, then a
// quick taper so booking a few days ahead is visibly cheaper.
export const URGENCY_BY_LEAD_DAYS = [1.35, 1.18, 1.1, 1.05, 1.02] as const

// Extra uplift for a weekend (Sat/Sun) pick-up, stacked on the lead-day factor.
export const WEEKEND_MULTIPLIER = 1.08

// Parse a YYYY-MM-DD string to a local Date at midnight. Uses the numeric parts
// (not Date.parse) so it is timezone-stable and matches how buildMonth/date.tsx
// construct their dates.
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Whole days from todayIso to dateIso, floored at 0 (past dates are treated as
// same-day so they can never price below the "best price" band).
export function leadDays(dateIso: string, todayIso: string): number {
  const target = parseIsoDate(dateIso).getTime()
  const today = parseIsoDate(todayIso).getTime()
  const diff = Math.round((target - today) / MS_PER_DAY)
  return diff > 0 ? diff : 0
}

export function isWeekendIso(dateIso: string): boolean {
  const dow = parseIsoDate(dateIso).getDay()
  return dow === 0 || dow === 6
}

// Combined lead-day × weekend multiplier for a given pick-up date.
export function urgencyMultiplier(dateIso: string, todayIso: string): number {
  const d = leadDays(dateIso, todayIso)
  const lead = d < URGENCY_BY_LEAD_DAYS.length ? URGENCY_BY_LEAD_DAYS[d] : 1.0
  return lead * (isWeekendIso(dateIso) ? WEEKEND_MULTIPLIER : 1.0)
}

// True when the pick-up date attracts any premium over the flat "best price"
// band — used to surface an "includes same-day/weekend uplift" note.
export function hasUrgencyPremium(dateIso: string, todayIso: string): boolean {
  return urgencyMultiplier(dateIso, todayIso) > 1.000001
}

// Apply the multiplier to a date-neutral base price (pence). We round to whole
// pounds THEN convert back to pence, so both the calendar cell and the Stripe
// charge land on the exact same figure regardless of where it is computed.
export function applyUrgencyPence(
  baseAmountPence: number,
  dateIso: string,
  todayIso: string,
): number {
  const basePounds = baseAmountPence / 100
  const pounds = Math.round(basePounds * urgencyMultiplier(dateIso, todayIso))
  return pounds * 100
}
