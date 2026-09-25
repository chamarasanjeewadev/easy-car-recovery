// Pure builder for the Stripe Checkout Session parameters. Kept free of any
// `~/` alias or runtime Stripe import (type-only) so it stays unit-testable with
// `node --experimental-strip-types`. The full booking payload rides on
// `payment_intent_data.metadata`, so the resulting PaymentIntent carries exactly
// the metadata `finalizeFromIntent` already expects — no finalize changes needed.
import type Stripe from 'stripe'

export function buildCheckoutSessionParams(args: {
  amountPence: number
  email: string
  description: string
  /** Full booking metadata from bookingToMetadata(); includes `source` + `amountPence`. */
  metadata: Record<string, string>
  /** Absolute site origin, e.g. https://easycarrecovery.uk */
  origin: string
  /** Absolute URL to return to if the customer cancels on Stripe (the /date page). */
  cancelUrl: string
  /** Pre-encoded summary query (reg/date/slot/from/to) appended to success_url. */
  summaryQuery: string
}): Stripe.Checkout.SessionCreateParams {
  const { amountPence, email, description, metadata, origin, cancelUrl, summaryQuery } = args
  return {
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: amountPence,
          product_data: { name: description },
        },
      },
    ],
    customer_email: email,
    // Session-level metadata lets the checkout.session.completed webhook filter
    // to our sessions cheaply; the finalize path reads the PaymentIntent metadata.
    metadata: { source: metadata.source },
    payment_intent_data: {
      receipt_email: email,
      description,
      metadata,
    },
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}${summaryQuery ? '&' + summaryQuery : ''}`,
    cancel_url: cancelUrl,
  }
}
