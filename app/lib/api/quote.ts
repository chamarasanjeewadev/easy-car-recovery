import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { lookupVehicle, type VerifyResponse } from './submit-request'
import { computeChargePence, fetchPricingConfig } from '~/lib/pricing/price'
import { requestTypeValues, sizeOptions } from '~/lib/booking-search'

// A price quote for display only — deliberately Stripe-free so the customer can
// see the fixed price on the journey/date/details steps before (and independently
// of) any payment setup. /pay recomputes the amount server-side authoritatively
// via computeQuotePence, so the charged amount always matches this logic.

const quoteInputSchema = z.object({
  // Optional: manual (reg-less) vehicles price off size instead of kerb weight.
  reg: z.string().min(2).max(10).optional(),
  fromLat: z.number(),
  fromLng: z.number(),
  toLat: z.number(),
  toLng: z.number(),
  requestType: z.enum(requestTypeValues).optional(),
  size: z.enum(sizeOptions).optional(),
})

export type QuoteInput = z.infer<typeof quoteInputSchema>

/**
 * Computes the recovery charge (in pence) from the pricing algorithm: looks up
 * the vehicle's kerb weight, fetches the live pricing config (falling back to
 * DEFAULT_PRICING_CONFIG), then runs the mirrored TowMyCar calculator. Shared by
 * getQuoteFn (display) and createPaymentIntentFn (the actual charge).
 */
export async function computeQuotePence(
  base: string,
  input: QuoteInput,
): Promise<{ amountPence: number; distanceMiles: number }> {
  const regNo = input.reg ? input.reg.replace(/\s+/g, '').toUpperCase() : ''
  const [vehicle, pricing] = await Promise.all([
    regNo ? lookupVehicle(base, regNo) : Promise.resolve({} as VerifyResponse),
    fetchPricingConfig(base),
  ])
  const { amountPence, distanceMiles } = computeChargePence(
    {
      fromLat: input.fromLat,
      fromLng: input.fromLng,
      toLat: input.toLat,
      toLng: input.toLng,
      weight: vehicle.weight ?? '',
      requestType: input.requestType,
      size: input.size,
    },
    pricing.config,
  )
  return { amountPence, distanceMiles }
}

export const getQuoteFn = createServerFn({ method: 'POST' })
  .inputValidator(quoteInputSchema)
  .handler(async ({ data }) => {
    const base = process.env.TOWMYCAR_API_BASE_URL
    if (!base) throw new Error('Pricing service is not configured.')
    const { amountPence } = await computeQuotePence(base, data)
    return { amountPence }
  })
