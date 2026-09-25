// Standalone test for the pure Stripe Checkout Session param builder.
// Run: node --experimental-strip-types scripts/test-checkout-params.ts
import assert from 'node:assert/strict'
import { buildCheckoutSessionParams, isAllowedCheckoutOrigin } from '../app/lib/api/checkout-params.ts'

// Open-redirect guard: only our own hosts (and localhost for dev) may be used
// as Stripe success/cancel URLs; anything else is rejected so a crafted
// server-fn call can't mint an ECR-branded session that redirects off-site.
assert.equal(isAllowedCheckoutOrigin('https://easycarrecovery.uk'), true)
assert.equal(isAllowedCheckoutOrigin('https://www.easycarrecovery.uk'), true)
assert.equal(isAllowedCheckoutOrigin('http://localhost:3000'), true)
assert.equal(isAllowedCheckoutOrigin('http://127.0.0.1:5173'), true)
assert.equal(isAllowedCheckoutOrigin('http://localhost:3000/date?x=1'), true)
assert.equal(isAllowedCheckoutOrigin('https://evil.example'), false)
assert.equal(isAllowedCheckoutOrigin('https://easycarrecovery.uk.evil.com'), false)
assert.equal(isAllowedCheckoutOrigin('http://easycarrecovery.uk'), false) // http on prod host
assert.equal(isAllowedCheckoutOrigin('not a url'), false)
console.log('ok - origin allowlist')


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
