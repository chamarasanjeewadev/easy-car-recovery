# Single Booking Flow + Hosted Stripe Checkout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native execution chosen) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Collapse the funnel to two pages + hosted Stripe Checkout, and make production payments work.

**Architecture:** Keep `/quote` (Journey). Merge `/details` into `/date` (Schedule + contact + pay). Replace embedded Elements `/pay` with a server-created **Stripe Checkout Session** the browser redirects to. `/success` and the webhook finalize from the Session's PaymentIntent, reusing the existing `finalizeFromIntent` idempotent path unchanged.

**Tech Stack:** TanStack Start (server fns), Stripe node SDK (server-only), Cloudflare Workers, Zod.

**Spec:** `docs/superpowers/specs/2026-09-25-single-booking-flow-stripe-checkout-design.md`

## Global Constraints

- Client never supplies the amount; server recomputes via `computeQuotePence` (verbatim from current `createPaymentIntentFn`).
- Booking payload rides on `payment_intent_data.metadata` via existing `bookingToMetadata`, so `finalizeFromIntent` is reused unchanged.
- Server-only Stripe stays in `payment-core.ts` / server fns / webhook (never client bundle).
- Currency `gbp`; reject `amountPence < MIN_PENCE`.
- Keep OTP phone verification (env-toggled by `phoneVerificationEnabled()`); extras (notes/passengers/photos) collapsible; hero-card unchanged (prefills `/quote`).
- No dependency/lockfile changes in this plan (parallel sessions active): leave `@stripe/*` client packages installed but unused after `/pay` is deleted — tree-shaken out. Flag as follow-up.

## Review Focus

- **Stripe cancel** → user hits "back" on hosted checkout: `cancel_url` must return to `/date` with journey intact, no booking created. (Task 5)
- **session_id missing/garbage on /success** → show "not paid", never spin forever. (Task 4)
- **Foreign / non-ECR checkout.session.completed webhook** → ignored with 200, not finalized. (Task 3)
- **Journey incomplete but user deep-links /date** → redirect to `/quote`, not a broken pay. (Task 5)
- **OTP required but unverified at submit** → block session creation with inline error. (Task 5)

---

### Task 1: Checkout Session server fn (pure params + handler)

**Files:**
- Modify: `app/lib/api/payment.ts` (add `buildCheckoutSessionParams` + `createCheckoutSessionFn`; keep `createPaymentIntentFn` until Task 6)
- Test: `scripts/test-checkout-params.ts`

**Interfaces:**
- Produces: `buildCheckoutSessionParams(data, amountPence, distanceMiles, opts:{origin,cancelUrl,vehicleLabel}) => Stripe.Checkout.SessionCreateParams`
- Produces: `createCheckoutSessionFn({ data: bookingInputSchema & {origin,cancelUrl} }) => { url: string }`

- [ ] **Step 1 — Failing test** `scripts/test-checkout-params.ts`:
```ts
import assert from 'node:assert/strict'
import { buildCheckoutSessionParams } from '../app/lib/api/payment.ts'
const data = { reg:'AB21ABC', from:'SW1A 1AA', fromLat:51.5, fromLng:-0.14, to:'SW1A 2AA',
  toLat:51.5, toLng:-0.12, size:'car', condition:'drives', requestType:'RECOVERY',
  date:'2026-09-24', slot:'10:00 – 12:00', firstName:'John', lastName:'Doe',
  email:'j@x.com', mobile:'07123456789', termsAcceptedAt:'2026-09-24T00:00:00Z' } as any
const p = buildCheckoutSessionParams(data, 17600, 12, { origin:'https://easycarrecovery.uk', cancelUrl:'https://easycarrecovery.uk/date?x=1', vehicleLabel:'AB21ABC' })
assert.equal(p.mode, 'payment')
assert.equal(p.line_items?.[0]?.price_data?.currency, 'gbp')
assert.equal(p.line_items?.[0]?.price_data?.unit_amount, 17600)
assert.equal(p.customer_email, 'j@x.com')
assert.equal((p.metadata as any)?.source, 'easy-car-recovery')
assert.equal((p.payment_intent_data as any)?.metadata?.source, 'easy-car-recovery')
assert.equal((p.payment_intent_data as any)?.metadata?.amountPence, '17600')
assert.ok(String(p.success_url).includes('session_id={CHECKOUT_SESSION_ID}'))
assert.equal(p.cancel_url, 'https://easycarrecovery.uk/date?x=1')
console.log('ok - checkout params')
```
- [ ] **Step 2 — Run, expect FAIL** (`buildCheckoutSessionParams` not exported):
  `node --experimental-strip-types scripts/test-checkout-params.ts`
- [ ] **Step 3 — Implement** in `payment.ts`. `buildCheckoutSessionParams` is pure and importable without Stripe (returns a plain object typed as `Stripe.Checkout.SessionCreateParams`, but do NOT import the Stripe runtime at module top — import the *type* only via `import type Stripe from 'stripe'`). Metadata built by importing `bookingToMetadata` — but that's in `payment-core` (server-only). To keep the pure fn client-safe and node-testable, inline metadata via a param: the handler computes `metadata = bookingToMetadata(...)` and passes it in. Signature:
```ts
export function buildCheckoutSessionParams(
  args: { amountPence: number; email: string; description: string; metadata: Record<string,string>;
          origin: string; cancelUrl: string; summaryQuery: string },
): import('stripe').Checkout.SessionCreateParams {
  return {
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { currency: 'gbp', unit_amount: args.amountPence,
      product_data: { name: args.description } } }],
    customer_email: args.email,
    metadata: { source: 'easy-car-recovery' },
    payment_intent_data: { receipt_email: args.email, description: args.description, metadata: args.metadata },
    success_url: `${args.origin}/success?session_id={CHECKOUT_SESSION_ID}${args.summaryQuery ? '&'+args.summaryQuery : ''}`,
    cancel_url: args.cancelUrl,
  }
}
```
  (Test calls it with a simplified shape — align the test to this final signature: pass `metadata:{source:'easy-car-recovery',amountPence:'17600'}`, `email`, `description`, `origin`, `cancelUrl`, `summaryQuery:''`, `amountPence`.) Then `createCheckoutSessionFn` mirrors `createPaymentIntentFn`'s validation + `computeQuotePence`, builds metadata via `bookingToMetadata`, calls `buildCheckoutSessionParams`, then `getStripe().checkout.sessions.create(params)`, returns `{ url: session.url! }`. Input schema: `bookingInputSchema.and(z.object({ origin: z.string(), cancelUrl: z.string() }))` — or extend a copy. Build `summaryQuery` from reg/date/slot/from/to via `URLSearchParams`.
- [ ] **Step 4 — Run, expect PASS.**
- [ ] **Step 5 — Commit** `feat: add Stripe Checkout Session server fn`.

### Task 2: finalize-from-session (payment-core + server fn)

**Files:** Modify `app/lib/api/payment-core.ts`, `app/lib/api/payment.ts`
**Interfaces:** Produces `finalizeFromSession(sessionId) => FinalizeResult`; `finalizeBookingFromSessionFn({ data:{ sessionId } }) => FinalizeResult`

- [ ] **Step 1 — Implement `finalizeFromSession`** in `payment-core.ts`:
```ts
export async function finalizeFromSession(sessionId: string): Promise<FinalizeResult> {
  const s = getStripe()
  let session: Stripe.Checkout.Session
  try { session = await s.checkout.sessions.retrieve(sessionId) }
  catch { return { ok: false, code: 'NOT_PAID', message: 'Payment not found.' } }
  const pi = typeof session.payment_intent === 'string'
    ? session.payment_intent : session.payment_intent?.id
  if (!pi || session.payment_status !== 'paid') {
    return { ok: false, code: 'NOT_PAID', message: 'Payment was not completed.' }
  }
  return finalizeFromIntent(pi)
}
```
- [ ] **Step 2 — Add server fn** in `payment.ts`:
```ts
export const finalizeBookingFromSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ sessionId: z.string().startsWith('cs_') }))
  .handler(async ({ data }) => {
    const { finalizeFromSession } = await import('./payment-core')
    try { return await finalizeFromSession(data.sessionId) }
    catch (e) { console.error('finalizeBookingFromSessionFn failed:', e)
      return { ok: false as const, code: 'UNAVAILABLE' as const,
        message: 'We could not confirm your booking yet. Your payment is safe — please wait a moment.' } }
  })
```
- [ ] **Step 3 — Verify** `npx tsc --noEmit` (exit 0).
- [ ] **Step 4 — Commit** `feat: finalize booking from Checkout Session`.

### Task 3: Webhook → checkout.session.completed

**Files:** Modify `app/routes/api.stripe.webhook.ts`
- [ ] **Step 1 — Implement:** change event filter to `checkout.session.completed`; object is `Stripe.Checkout.Session`; ignore (200) unless `session.metadata?.source === 'easy-car-recovery'`; resolve `pi` from `session.payment_intent`; if no `pi` return 200; else `finalizeFromIntent(pi)` with the SAME result→status mapping (UNAVAILABLE/IN_FLIGHT → 500 for redelivery; else 200).
- [ ] **Step 2 — Verify** `npx tsc --noEmit`.
- [ ] **Step 3 — Commit** `feat: switch Stripe webhook to checkout.session.completed`.

### Task 4: /success reads session_id

**Files:** Modify `app/lib/booking-search.ts` (`successSearchSchema`), `app/routes/success.tsx`
- [ ] **Step 1 — Schema:** replace `payment_intent`/`payment_intent_client_secret`/`redirect_status`/`paid` with `session_id: z.string().optional()`; keep `reg/date/slot/from/to`; keep `requestId?` unused-safe or drop.
- [ ] **Step 2 — success.tsx:** read `session_id`; initial state `session_id ? 'confirming' : 'not_paid'`; the effect polls `finalizeBookingFromSessionFn({ data:{ sessionId: session_id } })` with the existing retry loop and result→phase mapping (ok→done, NOT_PAID→not_paid, MANUAL/MISMATCH→pending, else retry→pending). Remove Elements/`payment_intent` branches. Keep the three summary states' copy; replace `payment_intent` reference row with nothing (or the session id). "Try again" still links `/quote`.
- [ ] **Step 3 — Verify** `npx tsc --noEmit`.
- [ ] **Step 4 — Commit** `feat: finalize on /success from Checkout session_id`.

### Task 5: Merge /details into /date (Schedule + contact + pay)

**Files:** Modify `app/routes/date.tsx` (absorb details); Modify `app/components/stepper.tsx` (2 on-site steps)
**Interfaces:** Consumes `createCheckoutSessionFn` (Task 1), `isJourneyReady`/`journeyGaps` (existing), `contactSchema` pattern (from details.tsx), `useOtp`, `phoneVerificationEnabled`, `verifiedTokenForPhone`, `uploadPhotos`, `OtpVerify`, `PhotoUpload`, `SegmentControl`.

- [ ] **Step 1 — Guard:** at top of `/date`, if `journeyGaps(search).filter(g=>g!=='date'&&g!=='slot').length` → render the existing "Let's finish your journey details first" block linking `/quote`.
- [ ] **Step 2 — Compose page:** keep calendar + `TimeSlotGrid` (existing). Below them add the details.tsx cards: contact (first/last/email/mobile + `OtpVerify` when enabled), an **"Add details (optional)"** toggle (`useState(false)`) wrapping notes + passengers + `PhotoUpload`, and the terms checkbox. Persist `date`/`slot` to URL via the existing effect.
- [ ] **Step 3 — Submit** (`onCta` of `BookingSummary`, label **"Pay & book"**): port details.tsx `submit` — validate `contactSchema` + terms + (if enabled) `otp.isVerifiedForPhone`; upload photos → `uploadToken`; compute `verifiedToken` via `verifiedTokenForPhone(normalizeUkMobile(mobile))`; assemble the booking `data` exactly as `/pay` did (reg, from, coords, to, coords, postcodes, size, condition, requestType, passengers, make/makeModel/vehicleClass/manualVehicle, uploadToken, date, slot, firstName, lastName, email, mobile, notes, verifiedToken, termsAcceptedAt) plus `origin: window.location.origin`, `cancelUrl: window.location.href`; call `createCheckoutSessionFn({ data })`; on success `window.location.assign(url)`; on error show inline message. Disable CTA while busy (`busyLabel="Redirecting to secure payment…"`).
- [ ] **Step 4 — Stepper:** update to a 2-step on-site flow (Journey → Schedule); `/quote` uses step 0, `/date` step 1.
- [ ] **Step 5 — Verify:** `npx tsc --noEmit`; run predicate + checkout-params tests.
- [ ] **Step 6 — Commit** `feat: merge details into schedule page, pay via Checkout redirect`.

### Task 6: Delete /pay + /details; retire PaymentIntent path; clean links

**Files:** Delete `app/routes/pay.tsx`, `app/routes/details.tsx`; Modify `app/lib/api/payment.ts` (remove `createPaymentIntentFn`); Modify `app/lib/booking-search.ts` (remove `paySearchSchema` if unused); grep-clean `/pay` & `/details` links.
- [ ] **Step 1 —** `git rm app/routes/pay.tsx app/routes/details.tsx`.
- [ ] **Step 2 —** Remove `createPaymentIntentFn` from `payment.ts`. Remove `paySearchSchema` if `grep -rn paySearchSchema app` shows no other users.
- [ ] **Step 3 —** `grep -rn "'/pay'\|\"/pay\"\|/details" app` → fix `/quote` CTA label to **"See prices"** (already targets `/date`); ensure no dangling `to="/pay"`/`to="/details"`.
- [ ] **Step 4 — Verify** `npx tsc --noEmit` (this catches every dangling reference).
- [ ] **Step 5 — Commit** `chore: remove embedded Elements pay + details routes`.

### Task 7: Env + docs for the production Stripe secret

**Files:** Modify `.env` (local, gitignored), `.env.example`; add `docs/superpowers/plans/…` note is already here.
- [ ] **Step 1 —** Add to `.env` (local dev, test keys): `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`. Add the names to `.env.example`.
- [ ] **Step 2 —** Document (in commit body / README note) the production commands the user must run: `wrangler secret put STRIPE_SECRET_KEY`, `wrangler secret put STRIPE_WEBHOOK_SECRET`, and register a `checkout.session.completed` webhook endpoint at `https://easycarrecovery.uk/api/stripe/webhook` in the Easy Car Recovery Stripe dashboard.
- [ ] **Step 3 — Commit** `chore: document Stripe secrets for prod + dev`.

### Task 8: Full verification

- [ ] `npx tsc --noEmit` → 0
- [ ] `node --experimental-strip-types scripts/test-journey-gaps.ts` → pass
- [ ] `node --experimental-strip-types scripts/test-checkout-params.ts` → pass
- [ ] `npm run build` → succeeds (confirms no client import of server-only Stripe, no dangling routes)
- [ ] Manual (Stripe test mode, user-run): journey → "Pay & book" → hosted checkout `4242…` → `/success` confirms; cancel → returns to `/date`.

## Self-review

- **Spec coverage:** route structure (T5,T6), Checkout redirect (T1), finalize-from-session + webhook (T2,T3,T4), prod secret fix (T7), reuse/remove lists (T1,T6). ✓
- **Placeholders:** none; code given for tricky steps.
- **Type consistency:** `finalizeFromSession`/`finalizeBookingFromSessionFn`/`buildCheckoutSessionParams` names used consistently; `FinalizeResult` reused.
- **Review Focus:** cancel (T5), bad session_id (T4), foreign webhook (T3), incomplete journey (T5), unverified OTP (T5) — each owned.
- **Dependency note:** client `@stripe/*` left installed but unused (parallel-session lockfile safety) — follow-up cleanup.
