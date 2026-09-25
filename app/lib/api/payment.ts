import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { bookingInputSchema, todayInLondon } from './submit-request'
import { computeQuotePence } from './quote'
import { buildCheckoutSessionParams } from './checkout-params'
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
      // Charge the urgency-adjusted amount for the chosen pick-up date so the
      // Stripe total matches the price shown on the calendar.
      date: data.date,
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

// Hosted Stripe Checkout: recompute the price server-side (client never supplies
// an amount), stamp the full booking onto payment_intent_data.metadata so the
// existing finalize path works unchanged, and return the hosted Checkout URL the
// browser redirects to.
export const createCheckoutSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    bookingInputSchema.and(z.object({ origin: z.string().url(), cancelUrl: z.string().url() })),
  )
  .handler(async ({ data }) => {
    const { getStripe, bookingToMetadata } = await import('./payment-core')

    const base = process.env.TOWMYCAR_API_BASE_URL
    if (!base) throw new Error('Booking service is not configured.')
    if (!normalizeUkMobile(data.mobile)) throw new Error('Enter a valid UK mobile number.')
    if (data.date < todayInLondon()) {
      throw new Error('The selected pick-up date has passed. Please pick a new date.')
    }

    const requestType = data.requestType ?? 'RECOVERY'
    const needsDropoff = serviceNeedsDropoff(requestType)
    if (needsDropoff && (data.toLat == null || data.toLng == null)) {
      throw new Error('A drop-off location is needed to price your recovery.')
    }
    const toLat = needsDropoff ? data.toLat! : data.fromLat
    const toLng = needsDropoff ? data.toLng! : data.fromLng
    const regNo = data.reg ? data.reg.replace(/\s+/g, '').toUpperCase() : ''

    const { amountPence, distanceMiles } = await computeQuotePence(base, {
      reg: regNo || undefined,
      fromLat: data.fromLat,
      fromLng: data.fromLng,
      toLat,
      toLng,
      requestType,
      size: data.size,
      date: data.date,
    })
    if (amountPence < MIN_PENCE) {
      throw new Error('Invalid booking: no valid price for the selected options.')
    }

    const vehicleLabel = regNo || [data.make, data.makeModel].filter(Boolean).join(' ') || 'Vehicle'
    const description = `Easy Car Recovery — ${vehicleLabel} ${data.from.split(',')[0]} → ${(data.to ?? '').split(',')[0]}`

    const summary = new URLSearchParams()
    if (regNo) summary.set('reg', regNo)
    if (data.date) summary.set('date', data.date)
    if (data.slot) summary.set('slot', data.slot)
    if (data.from) summary.set('from', data.from)
    if (data.to) summary.set('to', data.to)

    const params = buildCheckoutSessionParams({
      amountPence,
      email: data.email,
      description,
      metadata: bookingToMetadata(data, amountPence, distanceMiles),
      origin: data.origin,
      cancelUrl: data.cancelUrl,
      summaryQuery: summary.toString(),
    })

    const session = await getStripe().checkout.sessions.create(params)
    if (!session.url) throw new Error('Could not start checkout. Please try again.')
    return { url: session.url }
  })

// Temporary: PI-based finalize, still used by /success until Task 4 switches it
// to session-based. Removed in the cleanup task.
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

export const finalizeBookingFromSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ sessionId: z.string().startsWith('cs_') }))
  .handler(async ({ data }) => {
    const { finalizeFromSession } = await import('./payment-core')
    try {
      return await finalizeFromSession(data.sessionId)
    } catch (e) {
      console.error('finalizeBookingFromSessionFn failed:', e)
      return {
        ok: false as const,
        code: 'UNAVAILABLE' as const,
        message: 'We could not confirm your booking yet. Your payment is safe — please wait a moment.',
      }
    }
  })
