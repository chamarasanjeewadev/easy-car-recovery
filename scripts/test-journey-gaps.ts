// Standalone regression test for the booking-journey readiness predicate.
// Run: node --experimental-strip-types scripts/test-journey-gaps.ts
// (No test framework in this repo yet; this locks down the guard that caused
// the "I filled everything but I'm told details are missing" dead-end.)
import assert from 'node:assert/strict'
import { journeyGaps, isJourneyReady } from '../app/lib/booking-search.ts'

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok - ${name}`)
}

// The reported bug: the summary shows a route as TEXT, so it looks complete,
// but coordinates were never captured (postcode typed, not picked) and no reg
// was looked up. /quote let this through; /details dead-ended. The predicate
// must flag both gaps.
check('text-only route with no reg is NOT ready (the reported bug)', () => {
  const gaps = journeyGaps({
    from: 'SW1A 1AA',
    to: 'London SW1A 2AA, UK',
    requestType: 'RECOVERY',
    date: '2026-09-24',
    slot: '10:00 – 12:00',
  })
  assert.ok(gaps.includes('vehicle'), 'expected a vehicle gap')
  assert.ok(gaps.includes('pickup'), 'expected a pickup gap (missing coords)')
  assert.ok(gaps.includes('dropoff'), 'expected a dropoff gap (missing coords)')
})

check('a fully-specified recovery journey is ready', () => {
  assert.equal(
    isJourneyReady({
      reg: 'AB21ABC',
      from: 'SW1A 1AA',
      fromLat: 51.5,
      fromLng: -0.14,
      to: 'SW1A 2AA',
      toLat: 51.5,
      toLng: -0.12,
      requestType: 'RECOVERY',
      date: '2026-09-24',
      slot: '10:00 – 12:00',
    }),
    true,
  )
})

check('/quote subset (vehicle + locations, no date/slot yet) has only date/slot gaps', () => {
  const gaps = journeyGaps({
    reg: 'AB21ABC',
    from: 'SW1A 1AA',
    fromLat: 51.5,
    fromLng: -0.14,
    to: 'SW1A 2AA',
    toLat: 51.5,
    toLng: -0.12,
    requestType: 'RECOVERY',
  })
  assert.deepEqual(gaps, ['date', 'slot'])
})

check('on-site service (JUMPSTART) needs no drop-off', () => {
  const gaps = journeyGaps({
    reg: 'AB21ABC',
    from: 'SW1A 1AA',
    fromLat: 51.5,
    fromLng: -0.14,
    requestType: 'JUMPSTART',
    date: '2026-09-24',
    slot: '10:00 – 12:00',
  })
  assert.ok(!gaps.includes('dropoff'), 'on-site service should not require a drop-off')
  assert.equal(gaps.length, 0)
})

console.log(`\n${passed} passed`)
