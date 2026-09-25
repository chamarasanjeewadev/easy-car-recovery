// Standalone test for the pure Stripe Checkout Session param builder.
// Run: node --experimental-strip-types scripts/test-checkout-params.ts
import assert from 'node:assert/strict'
import { buildCheckoutSessionParams } from '../app/lib/api/checkout-params.ts'

const p = buildCheckoutSessionParams({
  amountPence: 17600,
  email: 'j@x.com',
  description: 'Easy Car Recovery — AB21ABC SW1A 1AA → SW1A 2AA',
  metadata: { source: 'easy-car-recovery', amountPence: '17600' },
  origin: 'https://easycarrecovery.uk',
  cancelUrl: 'https://easycarrecovery.uk/date?x=1',
  summaryQuery: 'reg=AB21ABC&date=2026-09-24',
})

assert.equal(p.mode, 'payment')
assert.equal(p.line_items?.[0]?.price_data?.currency, 'gbp')
assert.equal(p.line_items?.[0]?.price_data?.unit_amount, 17600)
assert.equal(p.customer_email, 'j@x.com')
assert.equal(p.metadata?.source, 'easy-car-recovery')
assert.equal(p.payment_intent_data?.metadata?.source, 'easy-car-recovery')
assert.equal(p.payment_intent_data?.metadata?.amountPence, '17600')
assert.ok(String(p.success_url).includes('session_id={CHECKOUT_SESSION_ID}'))
assert.ok(String(p.success_url).includes('reg=AB21ABC'))
assert.equal(p.cancel_url, 'https://easycarrecovery.uk/date?x=1')

console.log('ok - checkout params')
