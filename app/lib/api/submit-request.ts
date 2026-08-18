import { z } from 'zod'
import {
  conditionLabel,
  conditionOptions,
  passengerOptions,
  requestTypeLabel,
  requestTypeValues,
  serviceNeedsDropoff,
  sizeLabel,
  sizeOptions,
} from '~/lib/booking-search'
import { normalizeUkMobile } from '~/lib/phone'

export const bookingInputSchema = z
  .object({
    // Optional: manual (reg-less) vehicles supply make + model instead. The
    // refine below enforces "reg OR make+model", mirroring the backend DTO.
    reg: z.string().max(10).optional(),
    from: z.string().min(1),
    fromLat: z.number(),
    fromLng: z.number(),
    to: z.string().optional(),
    toLat: z.number().optional(),
    toLng: z.number().optional(),
    fromPostcode: z.string().optional(),
    toPostcode: z.string().optional(),
    size: z.enum(sizeOptions),
    condition: z.enum(conditionOptions),
    requestType: z.enum(requestTypeValues).default('RECOVERY'),
    passengers: z.enum(passengerOptions).optional(),
    make: z.string().max(100).optional(),
    makeModel: z.string().max(100).optional(),
    vehicleClass: z.string().max(50).optional(),
    manualVehicle: z.boolean().optional(),
    uploadToken: z.string().max(200).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slot: z.string().min(1),
    firstName: z.string().min(1).max(100),
    lastName: z.string().max(100),
    email: z.string().email(),
    mobile: z.string().min(7),
    notes: z.string().max(2000).optional(),
    distanceMiles: z.number().optional(),
    termsAcceptedAt: z.string(),
  })
  .superRefine((data, ctx) => {
    const hasReg = !!data.reg && data.reg.replace(/\s+/g, '').length >= 2
    const hasMakeModel = !!data.make?.trim() && !!data.makeModel?.trim()
    if (!hasReg && !hasMakeModel) {
      ctx.addIssue({
        path: ['reg'],
        code: z.ZodIssueCode.custom,
        message: 'Provide a registration number, or the vehicle make and model.',
      })
    }
  })

export type SubmitRequestInput = z.infer<typeof bookingInputSchema>

export type SubmitRequestResult =
  | { ok: true; requestId: number }
  | { ok: false; code: 'DUPLICATE' | 'BLOCKED' | 'VALIDATION' | 'UNAVAILABLE'; message: string }

/** Stripe payment already taken for this booking; recorded in the request description. */
export interface PaymentReference {
  /** Stripe PaymentIntent id (pi_…). */
  paymentRef: string
  amountPence: number
}

export const TERMS_VERSION = 'ecr-v3'
const SOURCE = 'easy-car-recovery' // fits the backend's varchar(20) source column

export function todayInLondon(): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
}

function conditionLines(condition: SubmitRequestInput['condition']): string {
  switch (condition) {
    case 'drives':
      return 'Car starting normally.\nCar rolling freely.'
    case 'rolls':
      return 'Car not starting.\nCar rolling freely.'
    case 'winch':
      return 'Car not rolling freely.\nWinch required.'
  }
}

export interface VerifyResponse {
  weight?: string | null
  make?: string | null
  makeModel?: string | null
  color?: string | null
  regNo?: string | null
}

/** Best-effort server-side vehicle lookup so the payload carries make/model/colour/weight. */
export async function lookupVehicle(base: string, regNo: string): Promise<VerifyResponse> {
  try {
    const res = await fetch(`${base}/user/verify-vehicle-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ registrationNumber: regNo }),
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return {}
    return (await res.json()) as VerifyResponse
  } catch {
    return {}
  }
}

/**
 * Creates the recovery request on the TowMyCar backend. Plain function (not a
 * server fn) so both the post-payment finalize path and the Stripe webhook
 * backstop share it. Callers must have verified payment before calling.
 */
export async function postBookingToTowMyCar(
  data: SubmitRequestInput,
  payment?: PaymentReference,
): Promise<SubmitRequestResult> {
  const base = process.env.TOWMYCAR_API_BASE_URL
  if (!base) {
    return { ok: false, code: 'UNAVAILABLE', message: 'Booking service is not configured.' }
  }

  const mobileNumber = normalizeUkMobile(data.mobile)
  if (!mobileNumber) {
    return { ok: false, code: 'VALIDATION', message: 'Enter a valid UK mobile number.' }
  }

  const requestType = data.requestType ?? 'RECOVERY'
  const regNo = data.reg ? data.reg.replace(/\s+/g, '').toUpperCase() : ''
  // Only look up when we have a reg; manual (reg-less) vehicles carry make/model.
  const vehicle = regNo ? await lookupVehicle(base, regNo) : {}
  const make = vehicle.make || data.make || ''
  const makeModel = vehicle.makeModel || vehicle.make || data.makeModel || data.make || ''

  // On-site services (jump-start / fuel / scrap) don't relocate the vehicle;
  // mirror the pick-up into the drop-off so the backend always has a destination.
  const needsDropoff = serviceNeedsDropoff(requestType)
  const toAddress = needsDropoff ? (data.to ?? null) : data.from
  const toPostCode = needsDropoff ? (data.toPostcode ?? null) : (data.fromPostcode ?? null)
  const userToLocation = needsDropoff
    ? data.toLat != null && data.toLng != null
      ? { latitude: data.toLat, longitude: data.toLng }
      : null
    : { latitude: data.fromLat, longitude: data.fromLng }

  const isToday = data.date === todayInLondon()
  const slotStart = data.slot.split('–')[0].trim() // "08:00 – 10:00" -> "08:00"
  const preferredDate = /^\d{2}:\d{2}$/.test(slotStart)
    ? new Date(`${data.date}T${slotStart}:00Z`).toISOString()
    : new Date(`${data.date}T09:00:00Z`).toISOString()

  const description = [
    conditionLines(data.condition),
    `Service: ${requestTypeLabel(requestType)}`,
    `Vehicle size: ${sizeLabel(data.size)}`,
    ...(!regNo && data.vehicleClass ? [`Vehicle type: ${data.vehicleClass}`] : []),
    `Condition: ${conditionLabel(data.condition)}`,
    `Preferred pick-up: ${data.date} · ${data.slot}`,
    ...(data.passengers && data.passengers !== '0' ? [`Passengers: ${data.passengers}`] : []),
    ...(payment
      ? [`Paid online: £${(payment.amountPence / 100).toFixed(2)} (Stripe ${payment.paymentRef})`]
      : []),
    ...(data.notes?.trim() ? [`Additional details: ${data.notes.trim()}`] : []),
  ].join('\n')

  const payload = {
    requestType,
    address: data.from,
    toAddress,
    postCode: data.fromPostcode ?? null,
    toPostCode,
    make,
    makeModel,
    regNo,
    weight: vehicle.weight ?? '',
    color: vehicle.color ?? '',
    deliveryTimeframe: isToday ? 'ASAP' : 'BYDATE',
    preferredDates: [preferredDate],
    mobileNumber,
    userLocation: { latitude: data.fromLat, longitude: data.fromLng },
    userToLocation,
    description,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    numberOfPassengers: data.passengers,
    // Backend links the pre-uploaded S3 photos to the request by this token.
    uploadToken: data.uploadToken,
    deliveryDistance: data.distanceMiles != null ? String(data.distanceMiles) : undefined,
    termsAcceptedAt: data.termsAcceptedAt,
    termsVersion: TERMS_VERSION,
    source: SOURCE,
  }

  let res: Response
  try {
    res = await fetch(`${base}/user/anonymous-breakdown-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return {
      ok: false,
      code: 'UNAVAILABLE',
      message: 'We could not reach the booking service. Please try again, or call us.',
    }
  }

  let body: {
    requestId?: number
    message?: string
    errorCode?: string
    info?: { errorCode?: string; message?: string }
  } = {}
  try {
    body = (await res.json()) as typeof body
  } catch {
    // fall through with empty body
  }

  if (res.ok && typeof body.requestId === 'number') {
    return { ok: true, requestId: body.requestId }
  }

  const errorCode = body.info?.errorCode ?? body.errorCode ?? ''
  const message = body.info?.message ?? body.message ?? ''

  if (errorCode === 'QUOTATION_ALREADY_EXISTS') {
    return {
      ok: false,
      code: 'DUPLICATE',
      message:
        'We already have an open recovery request for this vehicle. Our team will be in touch — or call us to update it.',
    }
  }
  if (errorCode === 'BLOCKED_CONTACT') {
    return {
      ok: false,
      code: 'BLOCKED',
      message: 'We could not accept this request. Please call us to book.',
    }
  }
  if (res.status >= 400 && res.status < 500) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: message || 'Some booking details were not accepted. Please check and try again.',
    }
  }
  return {
    ok: false,
    code: 'UNAVAILABLE',
    message: 'Something went wrong submitting your request. Please try again, or call us.',
  }
}
