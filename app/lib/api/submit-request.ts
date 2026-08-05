import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { conditionOptions, sizeOptions } from '~/lib/booking-search'
import { conditionLabel, sizeLabel } from '~/lib/mock-quote'
import { normalizeUkMobile } from '~/lib/phone'

const inputSchema = z.object({
  reg: z.string().min(2).max(10),
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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100),
  email: z.string().email(),
  mobile: z.string().min(7),
  notes: z.string().max(2000).optional(),
  indicativeTotal: z.number(),
  distanceMiles: z.number().optional(),
  termsAcceptedAt: z.string(),
})

export type SubmitRequestInput = z.infer<typeof inputSchema>

export type SubmitRequestResult =
  | { ok: true; requestId: number }
  | { ok: false; code: 'DUPLICATE' | 'BLOCKED' | 'VALIDATION' | 'UNAVAILABLE'; message: string }

const TERMS_VERSION = 'ecr-v1'
const SOURCE = 'easy-car-recovery' // fits the backend's varchar(20) source column

function todayInLondon(): string {
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

interface VerifyResponse {
  weight?: string | null
  make?: string | null
  makeModel?: string | null
  color?: string | null
  regNo?: string | null
}

/** Best-effort server-side vehicle lookup so the payload carries make/model/colour/weight. */
async function lookupVehicle(base: string, regNo: string): Promise<VerifyResponse> {
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

export const submitRecoveryRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<SubmitRequestResult> => {
    const base = process.env.TOWMYCAR_API_BASE_URL
    if (!base) {
      return { ok: false, code: 'UNAVAILABLE', message: 'Booking service is not configured.' }
    }

    const mobileNumber = normalizeUkMobile(data.mobile)
    if (!mobileNumber) {
      return { ok: false, code: 'VALIDATION', message: 'Enter a valid UK mobile number.' }
    }

    const regNo = data.reg.replace(/\s+/g, '').toUpperCase()
    const vehicle = await lookupVehicle(base, regNo)

    const isToday = data.date === todayInLondon()
    const slotStart = data.slot.split('–')[0].trim() // "08:00 – 10:00" -> "08:00"
    const preferredDate = /^\d{2}:\d{2}$/.test(slotStart)
      ? new Date(`${data.date}T${slotStart}:00Z`).toISOString()
      : new Date(`${data.date}T09:00:00Z`).toISOString()

    const description = [
      conditionLines(data.condition),
      `Vehicle size: ${sizeLabel(data.size)}`,
      `Condition: ${conditionLabel(data.condition)}`,
      `Preferred pick-up: ${data.date} · ${data.slot}`,
      `Indicative online price: £${data.indicativeTotal}`,
      ...(data.notes?.trim() ? [`Additional details: ${data.notes.trim()}`] : []),
    ].join('\n')

    const payload = {
      requestType: 'RECOVERY',
      address: data.from,
      toAddress: data.to ?? null,
      postCode: data.fromPostcode ?? null,
      toPostCode: data.toPostcode ?? null,
      make: vehicle.make ?? '',
      makeModel: vehicle.makeModel ?? vehicle.make ?? '',
      regNo,
      weight: vehicle.weight ?? '',
      color: vehicle.color ?? '',
      deliveryTimeframe: isToday ? 'ASAP' : 'BYDATE',
      preferredDates: [preferredDate],
      mobileNumber,
      userLocation: { latitude: data.fromLat, longitude: data.fromLng },
      userToLocation:
        data.toLat != null && data.toLng != null
          ? { latitude: data.toLat, longitude: data.toLng }
          : null,
      description,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
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
  })
