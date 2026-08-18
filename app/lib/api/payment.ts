import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { bookingInputSchema, todayInLondon } from './submit-request'
import { computeQuotePence } from './quote'
import { MIN_PENCE } from '~/lib/pricing/price'
import { normalizeUkMobile } from '~/lib/phone'
import { serviceNeedsDropoff } from '~/lib/booking-search'

// NOTE: Stripe/booking internals live in payment-core.ts and are imported only
// inside handlers, so the server-fn compiler keeps them out of the client bundle.
export type { FinalizeResult } from './payment-core'

export const createPaymentIntentFn = createServerFn({ method: 'POST' })
  .inputValidator(bookingInputSchema)
  .handler(async ({ data }) => {
    const { getStripe, bookingToMetadata } = await import('./payment-core')

    const base = process.env.TOWMYCAR_API_BASE_URL
    if (!base) throw new Error('Booking service is not configured.')

    if (!normalizeUkMobile(data.mobile)) {
      throw new Error('Enter a valid UK mobile number.')
    }
    if (data.date < todayInLondon()) {
      throw new Error('The selected pick-up date has passed. Please pick a new date.')
    }

    const requestType = data.requestType ?? 'RECOVERY'
    const needsDropoff = serviceNeedsDropoff(requestType)
    if (needsDropoff && (data.toLat == null || data.toLng == null)) {
      throw new Error('A drop-off location is needed to price your recovery.')
    }
    // On-site services price against the pick-up (distance 0).
    const toLat = needsDropoff ? data.toLat! : data.fromLat
    const toLng = needsDropoff ? data.toLng! : data.fromLng

    const regNo = data.reg ? data.reg.replace(/\s+/g, '').toUpperCase() : ''
    // Recompute the charge server-side from the same shared logic the displayed
    // quote uses — the client never supplies the amount.
    const { amountPence, distanceMiles } = await computeQuotePence(base, {
      reg: regNo || undefined,
      fromLat: data.fromLat,
      fromLng: data.fromLng,
      toLat,
      toLng,
      requestType,
      size: data.size,
    })

    if (amountPence < MIN_PENCE) {
      throw new Error('Invalid booking: no valid price for the selected options.')
    }

    const vehicleLabel = regNo || [data.make, data.makeModel].filter(Boolean).join(' ') || 'Vehicle'
    const s = getStripe()
    const intent = await s.paymentIntents.create({
      amount: amountPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      receipt_email: data.email,
      description: `Easy Car Recovery — ${vehicleLabel} ${data.from.split(',')[0]} → ${(data.to ?? '').split(',')[0]}`,
      metadata: bookingToMetadata(data, amountPence, distanceMiles),
    })

    return {
      clientSecret: intent.client_secret as string,
      paymentIntentId: intent.id,
      amountPence,
    }
  })

export const finalizeBookingFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ paymentIntentId: z.string().startsWith('pi_') }))
  .handler(async ({ data }) => {
    const { finalizeFromIntent } = await import('./payment-core')
    try {
      return await finalizeFromIntent(data.paymentIntentId)
    } catch (e) {
      console.error('finalizeBookingFn failed:', e)
      return {
        ok: false as const,
        code: 'UNAVAILABLE' as const,
        message: 'We could not confirm your booking yet. Your payment is safe — please wait a moment.',
      }
    }
  })
