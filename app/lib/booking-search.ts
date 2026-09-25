import { z } from 'zod'

export const sizeOptions = ['car', 'suv', 'van'] as const
export const conditionOptions = ['drives', 'rolls', 'winch'] as const

// Service types mirror towmycar.uk's request-form enum + labels (see
// towmycar-frontend .../lib/commonUtils.ts). The shared backend and pricing
// calculator key off these exact values, so keep them in sync.
export const requestTypeOptions = [
  { value: 'RECOVERY', label: 'Car recovery / tow' },
  { value: 'BREAKDOWN', label: 'Breakdown assistance' },
  { value: 'ACCIDENT', label: 'Accident recovery' },
  { value: 'JUMPSTART', label: 'Jump start' },
  { value: 'SCRAPE', label: 'Scrap vehicle' },
  { value: 'FUEL', label: 'Fuel delivery' },
  { value: 'OTHER', label: 'Other' },
] as const
export const requestTypeValues = requestTypeOptions.map((o) => o.value) as [
  RequestType,
  ...RequestType[],
]
export type RequestType = (typeof requestTypeOptions)[number]['value']

// On-site services that don't relocate the vehicle. For these we hide the
// drop-off input and mirror the pick-up into the drop-off fields (the backend
// always expects a destination), so distance is 0 and the price is the base
// call-out × the service multiplier — the correct on-site pricing.
export const SERVICES_WITHOUT_DROPOFF: RequestType[] = ['JUMPSTART', 'FUEL', 'SCRAPE']
export function serviceNeedsDropoff(requestType?: string | null): boolean {
  return !SERVICES_WITHOUT_DROPOFF.includes(requestType as RequestType)
}

export const vehicleClassOptions = [
  'Saloon',
  'Hatchback',
  'Estate',
  'SUV',
  'Van',
  'Other',
] as const

export const passengerOptions = ['0', '1', '2', '3+'] as const
export type Passengers = (typeof passengerOptions)[number]

export const bookingSearchSchema = z.object({
  reg: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  fromLat: z.coerce.number().optional(),
  fromLng: z.coerce.number().optional(),
  toLat: z.coerce.number().optional(),
  toLng: z.coerce.number().optional(),
  fromPostcode: z.string().optional(),
  toPostcode: z.string().optional(),
  size: z.enum(sizeOptions).optional(),
  condition: z.enum(conditionOptions).optional(),
  requestType: z.enum(requestTypeValues).optional(),
  passengers: z.enum(passengerOptions).optional(),
  // Manual vehicle fallback when the DVLA reg lookup fails / has no reg.
  make: z.string().optional(),
  makeModel: z.string().optional(),
  vehicleClass: z.string().optional(),
  // Only ever written as `true`; cleared by omitting it (never the string
  // 'false'), so z.coerce.boolean() is safe here.
  manualVehicle: z.coerce.boolean().optional(),
  date: z.string().optional(),
  slot: z.string().optional(),
})

export type BookingSearch = z.infer<typeof bookingSearchSchema>
export type Size = (typeof sizeOptions)[number]
export type Condition = (typeof conditionOptions)[number]

export function sizeLabel(size: Size): string {
  return size === 'car' ? 'Car · saloon' : size === 'suv' ? 'SUV · 4×4' : 'Van · LCV'
}

export function conditionLabel(condition: Condition): string {
  return condition === 'drives' ? 'Drives on' : condition === 'rolls' ? 'Non-runner · rolls' : 'Winch required'
}

export function requestTypeLabel(requestType?: string | null): string {
  return requestTypeOptions.find((o) => o.value === requestType)?.label ?? 'Car recovery / tow'
}

// Single source of truth for "is the journey complete enough to proceed".
// /quote gates the vehicle+location subset before /date; /details requires the
// full set (adds date + slot) before payment. These used to be computed inline
// on each page and drifted: /quote let you advance with no coords / no reg, then
// /details dead-ended to "finish your journey details first". One predicate keeps
// the guards in lockstep so that can't happen again.
export type JourneyGap = 'vehicle' | 'pickup' | 'dropoff' | 'date' | 'slot'

export function journeyGaps(s: BookingSearch): JourneyGap[] {
  const gaps: JourneyGap[] = []
  // A reg string OR a manual vehicle — presence only; the server re-verifies at pay time.
  if (!s.reg && !s.manualVehicle) gaps.push('vehicle')
  // Coordinates (not just text) are required: the price is computed from lat/lng,
  // which only exist once a location is picked from the suggestions.
  if (!s.from || s.fromLat == null || s.fromLng == null) gaps.push('pickup')
  if (serviceNeedsDropoff(s.requestType) && (!s.to || s.toLat == null || s.toLng == null))
    gaps.push('dropoff')
  if (!s.date) gaps.push('date')
  if (!s.slot) gaps.push('slot')
  return gaps
}

export function isJourneyReady(s: BookingSearch): boolean {
  return journeyGaps(s).length === 0
}

export const journeyGapLabels: Record<JourneyGap, string> = {
  vehicle: 'Add your vehicle registration',
  pickup: 'Select your pick-up location from the suggestions',
  dropoff: 'Select your drop-off location from the suggestions',
  date: 'Choose a pick-up date',
  slot: 'Choose a pick-up time',
}

// /pay carries the contact details collected on /details on top of the journey
// params. PII-in-URL tradeoff is accepted: funnel pages are noindex and state
// is URL-driven throughout the app.
export const paySearchSchema = bookingSearchSchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  mobile: z.string().optional(),
  notes: z.string().optional(),
  termsAcceptedAt: z.string().optional(),
  // Photos are uploaded to S3 on /details; only the short link token rides
  // through the URL/flow (not the S3 URLs) — the backend links photos by token.
  uploadToken: z.string().optional(),
})

export type PaySearch = z.infer<typeof paySearchSchema>

export const successSearchSchema = z.object({
  requestId: z.coerce.number().optional(),
  // Stripe appends payment_intent/payment_intent_client_secret/redirect_status
  // to the return_url on redirect flows (3DS); the non-redirect path navigates
  // here with payment_intent + paid explicitly.
  payment_intent: z.string().optional(),
  payment_intent_client_secret: z.string().optional(),
  redirect_status: z.string().optional(),
  /** Amount paid in pence. */
  paid: z.coerce.number().optional(),
  reg: z.string().optional(),
  date: z.string().optional(),
  slot: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type SuccessSearch = z.infer<typeof successSearchSchema>
