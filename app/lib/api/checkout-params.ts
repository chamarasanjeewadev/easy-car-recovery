// Pure builder for the Stripe Checkout Session parameters. Kept free of any
// `~/` alias or runtime Stripe import (type-only) so it stays unit-testable with
// `node --experimental-strip-types`. The full booking payload rides on
// `payment_intent_data.metadata`, so the resulting PaymentIntent carries exactly
// the metadata `finalizeFromIntent` already expects — no finalize changes needed.
import type Stripe from 'stripe'

// Canonical ECR hosts. Kept here (not imported from ~/lib/site) so this module
// stays node-testable without alias resolution.
const ALLOWED_CHECKOUT_HOSTS = ['easycarrecovery.uk', 'www.easycarrecovery.uk']

/**
 * True if `value` is a URL we may hand to Stripe as a success/cancel target:
 * an https ECR host, or localhost/127.0.0.1 (any port) for dev. Everything else
 * is rejected so a crafted createCheckoutSessionFn call can't produce an
 * ECR-branded Checkout session that redirects to an attacker origin.
 */
export function isAllowedCheckoutOrigin(value: string): boolean {
  let u: URL
  try {
    u = new URL(value)
  } catch {
    return false
  }
  if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true
  return u.protocol === 'https:' && ALLOWED_CHECKOUT_HOSTS.includes(u.hostname)
}

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
