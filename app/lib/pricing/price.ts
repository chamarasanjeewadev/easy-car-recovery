// Server-side charge computation. Runs the mirrored TowMyCar pricing
// calculator against the platform's live config so the amount we charge via
// Stripe is the same "recommended" price the TowMyCar apps would show —
// computed here, never taken from the client.
import { calculatePriceRange, DEFAULT_PRICING_CONFIG } from './calculator'
import type { PricingConfig } from './types'
import { approxRoadMiles } from '~/lib/distance'
import type { Size } from '~/lib/booking-search'

const CONFIG_TIMEOUT_MS = 5_000

// Representative kerb weights (kg) per selected vehicle size, used to keep the
// weight tier meaningful when the reg lookup returns no weight — e.g. a manual
// (reg-less) vehicle, or a lookup that omitted the revenue weight. Chosen to sit
// mid-tier: car -> Light, suv -> Medium, van -> Heavy.
export function sizeToWeightKg(size?: Size): number {
  switch (size) {
    case 'suv':
      return 2100
    case 'van':
      return 2800
    case 'car':
      return 1300
    default:
      return 0
  }
}

// Stripe's minimum chargeable amount for GBP.
export const MIN_PENCE = 30

export async function fetchPricingConfig(
  base: string,
): Promise<{ version: number; config: PricingConfig }> {
  try {
    const res = await fetch(`${base}/pricing/config`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(CONFIG_TIMEOUT_MS),
    })
    if (!res.ok) return { version: 0, config: DEFAULT_PRICING_CONFIG }
    const body = (await res.json()) as { version?: number; config?: PricingConfig }
    if (!body?.config || typeof body.config.baseCalloutDefault !== 'number') {
      return { version: 0, config: DEFAULT_PRICING_CONFIG }
    }
    return { version: body.version ?? 0, config: body.config }
  } catch {
    // Unreachable/slow config endpoint must not block taking a booking.
    return { version: 0, config: DEFAULT_PRICING_CONFIG }
  }
}

/**
 * Kerb weight arrives from /user/verify-vehicle-registration base64-encoded
 * (mirrors the backend's decodeWeightFromBase64). 0 = unknown, which prices
 * in the lightest weight tier (multiplier 1.0).
 */
export function decodeWeightKg(encoded: string | null | undefined): number {
  if (!encoded) return 0
  try {
    const kg = Number(atob(encoded))
    return Number.isFinite(kg) && kg > 0 ? kg : 0
  } catch {
    return 0
  }
}

export interface ChargeInput {
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  /** Base64 kerb weight from the vehicle lookup; '' when unknown. */
  weight: string
  /** Service type — drives the requestType multiplier. Defaults to RECOVERY. */
  requestType?: string
  /** Selected vehicle size — used to estimate weight when the lookup has none. */
  size?: Size
}

export function computeChargePence(
  input: ChargeInput,
  config: PricingConfig,
): { amountPence: number; distanceMiles: number; vehicleWeightKg: number } {
  const distanceMiles = approxRoadMiles(
    { lat: input.fromLat, lng: input.fromLng },
    { lat: input.toLat, lng: input.toLng },
  )
  // Prefer the DVLA kerb weight; fall back to a size-derived estimate so manual
  // and weight-less vehicles still land in a sensible tier.
  const vehicleWeightKg = decodeWeightKg(input.weight) || sizeToWeightKg(input.size)
  const range = calculatePriceRange(
    { requestType: input.requestType ?? 'RECOVERY', vehicleWeightKg, distanceMiles },
    config,
  )
  return { amountPence: Math.round(range.recommended * 100), distanceMiles, vehicleWeightKg }
}
