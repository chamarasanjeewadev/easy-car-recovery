// Server-only Stripe core. MUST NOT be imported from client-rendered code —
// only from server-fn handlers (payment.ts) and the webhook server route, so
// the Stripe SDK stays out of the browser bundle.
import Stripe from 'stripe'
import { postBookingToTowMyCar, type SubmitRequestInput } from './submit-request'
import { normalizeUkMobile } from '~/lib/phone'
import type { Condition, Passengers, RequestType, Size } from '~/lib/booking-search'

let stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (stripe) return stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  stripe = new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
  })
  return stripe
}

export const METADATA_VERSION = '1'
export const METADATA_SOURCE = 'easy-car-recovery'
// A 'creating' claim older than this is treated as crashed and can be re-claimed.
const CLAIM_TTL_MS = 60_000

// The PaymentIntent metadata carries the complete booking so the client
// finalize path, the 3DS-redirect path, and the webhook backstop can all
// create the booking from the intent alone. Only the secret key can write
// metadata, so finalize trusts it (including amountPence) without re-running
// live pricing, which may legitimately drift between creation and a webhook
// retry days later.
export function bookingToMetadata(
  data: SubmitRequestInput,
  amountPence: number,
  distanceMiles: number,
): Record<string, string> {
  const meta: Record<string, string> = {
    v: METADATA_VERSION,
    source: METADATA_SOURCE,
    reg: data.reg ? data.reg.replace(/\s+/g, '').toUpperCase() : '',
    size: data.size,
    condition: data.condition,
    requestType: data.requestType ?? 'RECOVERY',
    date: data.date,
    slot: data.slot,
    from: data.from.slice(0, 450),
    fromLat: String(data.fromLat),
    fromLng: String(data.fromLng),
    firstName: data.firstName.slice(0, 100),
    lastName: data.lastName.slice(0, 100),
    email: data.email,
    mobile: normalizeUkMobile(data.mobile) ?? data.mobile,
    termsAcceptedAt: data.termsAcceptedAt,
    amountPence: String(amountPence),
    distanceMiles: String(distanceMiles),
  }
  if (data.to) meta.to = data.to.slice(0, 450)
  if (data.toLat != null) meta.toLat = String(data.toLat)
  if (data.toLng != null) meta.toLng = String(data.toLng)
  if (data.fromPostcode) meta.fromPostcode = data.fromPostcode
  if (data.toPostcode) meta.toPostcode = data.toPostcode
  if (data.notes?.trim()) meta.notes = data.notes.trim().slice(0, 450)
  if (data.passengers) meta.passengers = data.passengers
  if (data.make?.trim()) meta.make = data.make.trim().slice(0, 100)
  if (data.makeModel?.trim()) meta.makeModel = data.makeModel.trim().slice(0, 100)
  if (data.vehicleClass?.trim()) meta.vehicleClass = data.vehicleClass.trim().slice(0, 50)
  if (data.manualVehicle) meta.manualVehicle = '1'
  if (data.uploadToken) meta.uploadToken = data.uploadToken.slice(0, 200)
  // Phone-verification proof (bound to `mobile`). Stripe caps metadata at 500
  // chars/key; a phone-verified JWT fits comfortably.
  if (data.verifiedToken) meta.verifiedToken = data.verifiedToken.slice(0, 500)
  return meta
}

function metadataToBooking(meta: Record<string, string>): SubmitRequestInput {
  return {
    reg: meta.reg,
    from: meta.from,
    fromLat: Number(meta.fromLat),
    fromLng: Number(meta.fromLng),
    to: meta.to || undefined,
    toLat: meta.toLat ? Number(meta.toLat) : undefined,
    toLng: meta.toLng ? Number(meta.toLng) : undefined,
    fromPostcode: meta.fromPostcode || undefined,
    toPostcode: meta.toPostcode || undefined,
    size: meta.size as Size,
    condition: meta.condition as Condition,
    requestType: (meta.requestType as RequestType) || 'RECOVERY',
    passengers: (meta.passengers as Passengers) || undefined,
    make: meta.make || undefined,
    makeModel: meta.makeModel || undefined,
    vehicleClass: meta.vehicleClass || undefined,
    manualVehicle: meta.manualVehicle === '1' || undefined,
    uploadToken: meta.uploadToken || undefined,
    verifiedToken: meta.verifiedToken || undefined,
    date: meta.date,
    slot: meta.slot,
    firstName: meta.firstName,
    lastName: meta.lastName,
    email: meta.email,
    mobile: meta.mobile,
    notes: meta.notes || undefined,
    distanceMiles: meta.distanceMiles ? Number(meta.distanceMiles) : undefined,
    termsAcceptedAt: meta.termsAcceptedAt,
  }
}

export type FinalizeResult =
  | { ok: true; requestId: number | null; amountPence: number }
  | {
      ok: false
      code: 'NOT_PAID' | 'MISMATCH' | 'IN_FLIGHT' | 'UNAVAILABLE' | 'MANUAL'
      message: string
    }

/**
 * Creates the TowMyCar booking for a paid intent. Shared by the success page's
 * finalizeBookingFn and the Stripe webhook. Always re-retrieves the intent so
 * the booking_status advisory lock reflects the latest state, then:
 *   'created'            -> return the existing booking, no second POST
 *   fresh 'creating'     -> IN_FLIGHT (caller retries; covers the racing actor)
 *   otherwise            -> claim and POST; backend duplicate detection closes
 *                           the residual double-claim window.
 */
/**
 * Finalize from a hosted-Checkout Session id (cs_…). Resolves the Session's
 * PaymentIntent and delegates to finalizeFromIntent, which owns all the
 * validation and the idempotent booking claim. Used by the /success page and
 * the checkout.session.completed webhook.
 */
export async function finalizeFromSession(sessionId: string): Promise<FinalizeResult> {
  const s = getStripe()
  let session: Stripe.Checkout.Session
  try {
    session = await s.checkout.sessions.retrieve(sessionId)
  } catch {
    return { ok: false, code: 'NOT_PAID', message: 'Payment not found.' }
  }
  const pi =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id
  if (!pi || session.payment_status !== 'paid') {
    return { ok: false, code: 'NOT_PAID', message: 'Payment was not completed.' }
  }
  return finalizeFromIntent(pi)
}

export async function finalizeFromIntent(paymentIntentId: string): Promise<FinalizeResult> {
  const s = getStripe()

  let intent: Stripe.PaymentIntent
  try {
    intent = await s.paymentIntents.retrieve(paymentIntentId)
  } catch {
    return { ok: false, code: 'NOT_PAID', message: 'Payment not found.' }
  }

  const meta = intent.metadata ?? {}
  if (meta.source !== METADATA_SOURCE || meta.v !== METADATA_VERSION) {
    return { ok: false, code: 'NOT_PAID', message: 'Payment is not recognised.' }
  }
  if (intent.status !== 'succeeded' || intent.currency !== 'gbp') {
    return { ok: false, code: 'NOT_PAID', message: 'Payment was not completed.' }
  }
  if (intent.amount !== Number(meta.amountPence)) {
    console.error(
      `MISMATCH: intent ${intent.id} amount ${intent.amount} != metadata amountPence ${meta.amountPence}`,
    )
    return { ok: false, code: 'MISMATCH', message: 'Payment could not be verified.' }
  }

  if (meta.booking_status === 'created') {
    return {
      ok: true,
      requestId: meta.booking_request_id ? Number(meta.booking_request_id) : null,
      amountPence: intent.amount,
    }
  }
  if (meta.booking_status === 'error') {
    return {
      ok: false,
      code: 'MANUAL',
      message: 'Your payment is received; our team will confirm your booking shortly.',
    }
  }
  if (
    meta.booking_status === 'creating' &&
    Date.now() - Number(meta.booking_attempt_at || 0) < CLAIM_TTL_MS
  ) {
    return { ok: false, code: 'IN_FLIGHT', message: 'Your booking is being confirmed.' }
  }

  // Claim the intent. Not atomic (Stripe metadata has no compare-and-set), but
  // the backend's one-open-request-per-vehicle dedupe catches the rare double
  // claim, so the worst case is a benign QUOTATION_ALREADY_EXISTS.
  await s.paymentIntents.update(intent.id, {
    metadata: { booking_status: 'creating', booking_attempt_at: String(Date.now()) },
  })

  const result = await postBookingToTowMyCar(metadataToBooking(meta), {
    paymentRef: intent.id,
    amountPence: intent.amount,
  })

  if (result.ok) {
    await s.paymentIntents.update(intent.id, {
      metadata: { booking_status: 'created', booking_request_id: String(result.requestId) },
    })
    return { ok: true, requestId: result.requestId, amountPence: intent.amount }
  }

  if (result.code === 'DUPLICATE') {
    // Vehicle already has an open request — the payment is recorded on the
    // intent; support reconciles via the Stripe reference. Treat as booked.
    await s.paymentIntents.update(intent.id, {
      metadata: { booking_status: 'created', booking_request_id: '' },
    })
    return { ok: true, requestId: null, amountPence: intent.amount }
  }

  if (result.code === 'BLOCKED' || result.code === 'VALIDATION') {
    // Deterministic rejection — retrying the same payload cannot succeed.
    // Money is taken, so flag for manual follow-up rather than retry forever.
    console.error(`Booking rejected for paid intent ${intent.id}: ${result.code} ${result.message}`)
    await s.paymentIntents.update(intent.id, {
      metadata: { booking_status: 'error', booking_error: result.code },
    })
    return {
      ok: false,
      code: 'MANUAL',
      message: 'Your payment is received; our team will confirm your booking shortly.',
    }
  }

  // Transient (UNAVAILABLE): release the claim so the webhook retry can take it.
  await s.paymentIntents.update(intent.id, {
    metadata: { booking_status: '', booking_attempt_at: '' },
  })
  return { ok: false, code: 'UNAVAILABLE', message: result.message }
}
