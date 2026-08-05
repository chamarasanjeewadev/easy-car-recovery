import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import Stripe from 'stripe'
import { priceQuote } from '../mock-quote'
import { buildMonth } from '../mock-calendar'
import { approxRoadMiles } from '../distance'
import { sizeOptions, conditionOptions } from '../booking-search'

let stripe: Stripe | null = null
function getStripe(): Stripe {
  if (stripe) return stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  stripe = new Stripe(key, {
    apiVersion: '2025-04-30.basil',
    httpClient: Stripe.createFetchHttpClient(),
  })
  return stripe
}

// Straight-line fallback when the caller didn't send both endpoints' coords —
// mirrors pay.tsx so the displayed total matches the charged amount.
const FALLBACK_DISTANCE_MI = 12
// Stripe's minimum chargeable amount for GBP.
const MIN_PENCE = 30

// SECURITY: the amount is computed here from the booking inputs, NOT taken from
// the client. Previously the client sent `amountPence` and it was charged
// verbatim, so a user could pay any amount (including ~£0). The server now
// derives the price from trusted inputs using the same pure functions the UI
// uses (priceQuote + buildMonth + approxRoadMiles), so client and server totals
// agree while the client can no longer set the price.
const createIntentSchema = z.object({
  ref: z.string().min(4).max(64),
  reg: z.string().optional(),
  fromAddress: z.string().optional(),
  toAddress: z.string().optional(),
  size: z.enum(sizeOptions).optional(),
  condition: z.enum(conditionOptions).optional(),
  fromLat: z.number().optional(),
  fromLng: z.number().optional(),
  toLat: z.number().optional(),
  toLng: z.number().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

type CreateIntentInput = z.infer<typeof createIntentSchema>

function computeAmountPence(data: CreateIntentInput): number {
  const hasCoords =
    data.fromLat != null && data.fromLng != null && data.toLat != null && data.toLng != null
  const distanceMiles = hasCoords
    ? approxRoadMiles(
        { lat: data.fromLat!, lng: data.fromLng! },
        { lat: data.toLat!, lng: data.toLng! },
      )
    : FALLBACK_DISTANCE_MI

  const baseQuote = priceQuote({
    size: data.size ?? 'car',
    condition: data.condition ?? 'drives',
    distanceMiles,
  })

  const date = data.date ?? new Date().toISOString().slice(0, 10)
  const month = buildMonth(new Date(date), baseQuote.total)
  const day = month.days.find((d) => d?.iso === date)
  const total = day?.price ?? baseQuote.total

  return Math.round(total * 100)
}

export const createPaymentIntentFn = createServerFn({ method: 'POST' })
  .inputValidator(createIntentSchema)
  .handler(async ({ data }) => {
    const amountPence = computeAmountPence(data)

    // Rejects past dates (price 0) and any input that prices below Stripe's floor.
    if (amountPence < MIN_PENCE) {
      throw new Error('Invalid booking: no valid price for the selected options.')
    }

    const s = getStripe()
    const intent = await s.paymentIntents.create({
      amount: amountPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      description: `Easy Car Recovery booking ${data.ref}`,
      metadata: {
        ref: data.ref,
        reg: data.reg ?? '',
        from: data.fromAddress?.slice(0, 200) ?? '',
        to: data.toAddress?.slice(0, 200) ?? '',
        size: data.size ?? 'car',
        condition: data.condition ?? 'drives',
        date: data.date ?? '',
        amountPence: String(amountPence),
        brand: 'easy-car-recovery',
      },
    })

    return {
      clientSecret: intent.client_secret as string,
      paymentIntentId: intent.id,
      amountPence,
    }
  })
