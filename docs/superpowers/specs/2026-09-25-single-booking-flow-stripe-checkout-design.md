# Design: Single booking flow + hosted Stripe Checkout

**Date:** 2026-09-25
**Status:** Approved design → pending implementation plan
**Author:** chamara (with Claude)

## Intent / brief

Easy Car Recovery is a **pay-first** recovery booking site (customer pays a fixed
price online, then a vetted driver is assigned). Today's funnel is longer than it
needs to be and has an embedded card form that has been unreliable in production.

**Goal:** collapse the flow to the shortest sensible pay-first journey, borrow
TowMyCar's form UX/components (already shared), and make production payments work
by switching to Stripe's hosted Checkout and setting the missing secret.

This is a UX/flow consolidation and a payment-integration change — not a change to
the pricing model. The AnyVan-style per-day urgency pricing already exists
(`app/lib/pricing/urgency.ts`) and is kept as-is.

### Approved decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Flow shape | Short two-page flow (Approach A) |
| Payment | Redirect to **hosted Stripe Checkout** (not embedded Elements) |
| Contact details | Compact form on the schedule page |
| Phone OTP | **Keep** (backend expects a phone-bound `verifiedToken`); still env-toggleable |
| Optional extras (notes / passengers / photos) | **Keep**, behind an "Add details (optional)" expander |
| Homepage hero-card | **Keep** as a prefill accelerator into Page 1 |
| Route names | Keep `/quote` and `/date`; `/date` absorbs `/details`; delete `/details` and `/pay` |

### Non-goals

- Changing the pricing algorithm or the shared backend pricing config.
- Changing TowMyCar itself (only the sister site, easy-car-recovery).
- Moving away from URL-driven funnel state.
- Reworking the DVLA lookup or Google Places integration.

## Route structure

```
Home (hero-card: reg + pickup + dropoff)  ──prefill──▶
  /quote      Page 1 — Journey     service · vehicle · route · size · condition
    ▼ "See prices"  (gated: journeyGaps must be empty for vehicle+locations)
  /date       Page 2 — Schedule & details
                calendar (per-day pricing) · time slot
                contact form (name / email / mobile [+ OTP])
                optional extras (notes / passengers / photos)  · terms
    ▼ "Pay & book"  (server creates Checkout Session)
  pay.stripe.com  hosted Checkout
    ▼ success_url = /success?session_id={CHECKOUT_SESSION_ID}
  /success    finalize booking from the Checkout Session
```

Deleted: `/details` (merged into `/date`) and `/pay` (replaced by the redirect).

## Components

### Page 1 — Journey (`/quote`, repurposed)
Essentially today's `/quote`, already gated by the `journeyGaps` predicate added in
the prior bug fix (`app/lib/booking-search.ts`). Collects service type, vehicle
(reg lookup + manual fallback), pickup/dropoff via `PostcodeInput`, size, condition.

- CTA label changes to **"See prices"**; navigates to `/date` with all params.
- Reuses `PlateInput`, `PostcodeInput`, `useQuote`, `BookingSummary`. No rebuild.

### Page 2 — Schedule & details (`/date`, absorbing `/details`)
One route, three stacked cards + summary aside:

1. **Calendar + slot** — existing `DateCalendar` (per-day prices via
   `applyUrgencyPence`) + `TimeSlotGrid`. Default date = today, default slot =
   first slot; both persisted to the URL on mount (so the journey is always
   schedule-complete once here).
2. **Contact** — first/last name, email, UK mobile, `OtpVerify` (when
   `phoneVerificationEnabled()`), validated by the existing `contactSchema`.
3. **Optional extras** — an "Add details (optional)" expander wrapping the current
   notes textarea, passenger `SegmentControl`, and `PhotoUpload`. Collapsed by
   default.
4. **Terms** checkbox (required) + **"Pay & book"** CTA in `BookingSummary`.

On submit (reusing today's `/details` submit logic):
- Validate contact + terms + OTP (if enabled).
- Upload photos if any → capture `uploadToken`.
- Call `createCheckoutSessionFn` with the full booking payload.
- `window.location.assign(session.url)`.

The guard that currently lives on `/details` (`isJourneyReady`) stays on `/date`
as a redirect-back-to-`/quote` fallback for the incomplete-URL case.

## Payment — hosted Stripe Checkout

### New server fn: `createCheckoutSessionFn` (replaces `createPaymentIntentFn`)
In `app/lib/api/payment.ts`, validated by the existing booking input schema.

- **Recompute price server-side** with `computeQuotePence(...)` (client never sends
  an amount) — identical to today, including the urgency multiplier for the chosen
  date. Reject if `< MIN_PENCE`.
- Create a Checkout Session:
  ```
  mode: 'payment'
  line_items: [{ quantity: 1, price_data: {
    currency: 'gbp',
    unit_amount: amountPence,
    product_data: { name: `Easy Car Recovery — ${vehicle} ${from} → ${to}` },
  }}]
  customer_email: data.email
  payment_intent_data: {
    receipt_email: data.email,
    description,
    metadata: bookingToMetadata(data, amountPence, distanceMiles),  // reused verbatim
  }
  success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`
  cancel_url:  `${origin}/date?...preserved params...`
  ```
- Returns `{ url }`. Payment methods (card + wallets) are controlled from the
  Stripe dashboard, so no client method config is needed.

Putting the booking payload on `payment_intent_data.metadata` means the metadata
lands on the PaymentIntent exactly as today, so **all existing finalize and
idempotency logic in `payment-core.ts` is reused unchanged**.

### Removed
- `/pay` route + `CheckoutForm` + Elements setup.
- Client packages `@stripe/react-stripe-js` and `@stripe/stripe-js` (hosted
  Checkout needs no client SDK).
- `createPaymentIntentFn`.

## Success & webhook (finalize from the Session)

### `/success`
- Search schema switches from `payment_intent` to `session_id`.
- New `finalizeFromSessionFn(session_id)`: retrieve the Checkout Session
  (expand `payment_intent`), assert `payment_status === 'paid'`, then call the
  **existing** `finalizeFromIntent(paymentIntentId)` — same idempotent metadata
  claim → backend POST → retry/poll. Success/pending/not-paid states unchanged.

### Webhook (`app/routes/api.stripe.webhook.ts`)
- Switch the handled event from `payment_intent.succeeded` to
  **`checkout.session.completed`**.
- Verify signature with `STRIPE_WEBHOOK_SECRET`, read `session.payment_intent`,
  call `finalizeFromIntent`. Same 2xx-only-on-success contract (Stripe retries on
  5xx). This is the tab-closed backstop.

## Production Stripe fix (the actual "not working")

Root cause: `payment-core.ts` reads `process.env.STRIPE_SECRET_KEY` and throws
`'STRIPE_SECRET_KEY is not set'` when absent. It is set **nowhere** — not in
`.env`, `.env.production`, or `wrangler.jsonc`. `TOWMYCAR_API_BASE_URL` (a plaintext
`var`) is read the same way and works, so `process.env` population under
`nodejs_compat` is fine — the key is simply missing.

Fix (config, not code):
- Production: `wrangler secret put STRIPE_SECRET_KEY` and
  `wrangler secret put STRIPE_WEBHOOK_SECRET` on the `easy-car-recovery` Worker.
- Local dev: add `STRIPE_SECRET_KEY` (test key) + `STRIPE_WEBHOOK_SECRET` to `.env`
  (gitignored) and `.env.example` (names only).
- Register the `checkout.session.completed` webhook endpoint in the Stripe
  dashboard for the Easy Car Recovery account and capture its signing secret.

## Reuse vs. remove

**Reused unchanged:** `PlateInput`, `PostcodeInput`, `DateCalendar`,
`TimeSlotGrid`, `lib/pricing/*`, `OtpVerify`/`useOtp`, `PhotoUpload`/`uploadPhotos`,
`bookingToMetadata`, `finalizeFromIntent`, `payment-core.ts`, `journeyGaps`.

**Removed:** `/details` route, `/pay` route, `CheckoutForm`,
`createPaymentIntentFn`, `@stripe/stripe-js`, `@stripe/react-stripe-js`.

**Changed:** `/quote` (CTA label), `/date` (absorbs details + triggers Checkout),
`payment.ts` (new session fn + finalize-from-session), webhook (event type),
`booking-search.ts` `successSearchSchema` (`session_id`).

## Data flow (unchanged trust model)

Client never supplies the amount. Server recomputes from route + vehicle + date on
every session creation, encodes the whole booking into PaymentIntent metadata, and
the booking is created **only after** Stripe confirms payment — via `/success`
finalize or the webhook backstop, whichever fires first, guarded by the existing
metadata compare-and-swap lock.

## Error handling

- Missing/invalid journey on `/date` → redirect to `/quote` (existing guard).
- Contact/terms/OTP invalid → inline field errors; no session created.
- Session creation failure → surface an error on `/date`, stay on page, allow retry.
- Stripe cancel → `cancel_url` returns to `/date` with params; no booking created.
- Payment succeeds but backend POST fails → `/success` shows "pending"; webhook
  retries; metadata lock prevents double-booking.

## Testing

- **Pure unit tests** (standalone, `node --experimental-strip-types`, matching the
  existing `scripts/test-journey-gaps.ts` pattern — no framework added):
  - `journeyGaps` (already covered).
  - A pure `buildCheckoutSessionParams(data, amountPence, distanceMiles)` extracted
    from `createCheckoutSessionFn` — assert currency/amount/metadata/urls.
  - Metadata round-trip via `bookingToMetadata` + parser, if pure.
- **Stripe test mode** end-to-end: journey → session → hosted checkout (test card
  `4242…`) → `/success` finalize; and 3DS card for the redirect path; and the
  `checkout.session.completed` webhook via Stripe CLI `stripe listen`.
- `tsc --noEmit` clean.

## Risks / open questions

- **Backend booking contract** already accepts the metadata shape from the current
  PaymentIntent flow, so no backend change is expected — confirm during
  implementation that nothing keys off the `/pay` path specifically.
- **Checkout metadata size:** unchanged from today (already near the 500-char/key
  limit for notes + verifiedToken); keeping extras collapsible does not increase it.
- **SEO/links:** deleting `/details` and `/pay` is safe (both are `noindex` funnel
  routes); confirm no external links point at them.
```
