import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'
import { finalizeFromIntent, getStripe } from '~/lib/api/payment-core'

// Booking payment now flows through hosted Checkout, so the durable backstop
// listens for the Session's completion (tab closed after paying, backend down).
// finalizeFromIntent stays idempotent via the booking_status metadata lock.

// Stripe webhook — the durable backstop that creates the TowMyCar booking when
// a customer paid but the success-page finalize never completed (tab closed,
// backend down). Stripe redelivers non-2xx responses with backoff for days,
// which is our retry queue; finalizeFromIntent is idempotent via the
// booking_status metadata lock.
export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET
        if (!secret) return new Response('Webhook not configured', { status: 500 })
        const signature = request.headers.get('stripe-signature')
        if (!signature) return new Response('Missing signature', { status: 400 })
        const payload = await request.text()

        let event: Stripe.Event
        try {
          // Async + SubtleCrypto variant — required on Cloudflare Workers.
          event = await getStripe().webhooks.constructEventAsync(
            payload,
            signature,
            secret,
            undefined,
            Stripe.createSubtleCryptoProvider(),
          )
        } catch {
          return new Response('Invalid signature', { status: 400 })
        }

        if (event.type !== 'checkout.session.completed') {
          return new Response('Ignored', { status: 200 })
        }
        const session = event.data.object
        // Session-level metadata carries our source tag (set in buildCheckoutSessionParams).
        if (session.metadata?.source !== 'easy-car-recovery') {
          return new Response('Ignored', { status: 200 })
        }
        const pi =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id
        if (!pi) {
          return new Response('Ignored', { status: 200 })
        }

        const result = await finalizeFromIntent(pi)
        if (!result.ok && (result.code === 'UNAVAILABLE' || result.code === 'IN_FLIGHT')) {
          // Non-2xx -> Stripe redelivers later; by then the in-flight actor has
          // finished ('created' -> 200 no-op) or its stale claim is reclaimable.
          return new Response(result.code, { status: 500 })
        }
        // ok / MANUAL / MISMATCH / NOT_PAID: redelivery cannot change the outcome.
        return new Response('OK', { status: 200 })
      },
    },
  },
})
