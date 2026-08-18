// Mirror of @towmycar/common/src/pricing/calculator.ts. DO NOT EDIT BY HAND.
// Canonical lives in the backend repo:
//   towmycar-backend/packages/common/src/pricing/calculator.ts
// Edit canonical first, then regenerate every mirror with:
//   node packages/common/scripts/sync-pricing-mirrors.mjs

import {
  DistanceTier,
  PriceExtra,
  PriceInput,
  PriceRange,
  PriceZone,
  PricingConfig,
  WeightTier,
} from "./types";

export function resolveRequestMultiplier(
  config: PricingConfig,
  requestType: string,
): number {
  const m = config.requestTypeMultipliers[requestType];
  return typeof m === "number" && m > 0 ? m : 1.0;
}

// Whether a request type is "free-priced": shown a flat guideline band instead
// of the computed one and exempted from the approval gate. Off when the config
// lists no free-priced types.
export function isFreePriced(
  config: PricingConfig,
  requestType: string | null | undefined,
): boolean {
  const types = config.freePricingTypes;
  if (!types || !types.length) return false;
  return types.includes(String(requestType));
}

export function resolveWeightMultiplier(
  config: PricingConfig,
  weightKg: number,
): { multiplier: number; tier: WeightTier | null } {
  if (!config.weightTiers.length) return { multiplier: 1.0, tier: null };
  for (const tier of config.weightTiers) {
    if (tier.maxKg === null || weightKg <= tier.maxKg) {
      return { multiplier: tier.multiplier, tier };
    }
  }
  const last = config.weightTiers[config.weightTiers.length - 1];
  return { multiplier: last.multiplier, tier: last };
}

// Sum of miles in each distance band weighted by that band's multiplier. Applied
// marginally (tax-bracket style): the miles in each band are scaled by that band's
// multiplier and accumulated, so the result is continuous in distance — there is
// no boundary cliff and the price stays monotonic. Falls back to raw distance when
// no tiers are configured, preserving the pre-taper linear behaviour.
export function taperedMiles(
  config: PricingConfig,
  distanceMiles: number,
): number {
  const d = Math.max(0, distanceMiles);
  const tiers = config.distanceTiers;
  if (!tiers || !tiers.length) return d;
  let prev = 0;
  let acc = 0;
  for (const tier of tiers) {
    const upper = tier.maxMiles === null ? Infinity : tier.maxMiles;
    const seg = Math.min(upper, d) - prev;
    if (seg > 0) acc += seg * tier.multiplier;
    prev = upper;
    if (d <= upper) break;
  }
  // Defensive: a config whose final tier isn't open-ended still prices its tail at
  // the last band's multiplier rather than dropping those miles entirely.
  if (prev < d) acc += (d - prev) * tiers[tiers.length - 1].multiplier;
  return acc;
}

export function resolveDistanceTier(
  config: PricingConfig,
  distanceMiles: number,
): DistanceTier | null {
  const tiers = config.distanceTiers;
  if (!tiers || !tiers.length) return null;
  const d = Math.max(0, distanceMiles);
  for (const tier of tiers) {
    if (tier.maxMiles === null || d <= tier.maxMiles) return tier;
  }
  return tiers[tiers.length - 1];
}

export function calculatePriceRange(
  input: PriceInput,
  config: PricingConfig,
): PriceRange {
  // Free-priced types (e.g. fuel, jump start, other) get a flat guideline band
  // independent of distance/weight/commission — the computed band is misleading
  // for these unpredictable jobs. Rounded for consistency with the computed path.
  if (isFreePriced(config, input.requestType) && config.freePricingBand) {
    const b = config.freePricingBand;
    return {
      min: Math.round(b.min),
      recommended: Math.round(b.recommended),
      max: Math.round(b.max),
    };
  }
  const requestMul = resolveRequestMultiplier(config, String(input.requestType));
  const { multiplier: weightMul } = resolveWeightMultiplier(
    config,
    input.vehicleWeightKg,
  );
  // Base config values represent the driver's target take-home. Gross up by
  // 1/(1-rate) so that splitCommission(customerQuote, rate) recovers the
  // original driver-net at the recommended quote. (Using 1+rate instead would
  // under-pay drivers by rate²/(1+rate) ≈ 2% at 15%.)
  const rawRate = Number.isFinite(config.commissionRate) ? config.commissionRate : 0;
  const commissionRate = Math.min(0.99, Math.max(0, rawRate));
  const grossUp = 1 / (1 - commissionRate);
  const mul = requestMul * weightMul * grossUp;
  // Taper-adjusted mileage. Scales all three per-mile bands identically so the
  // discount applies to the mileage portion only, never the base call-out.
  const miles = taperedMiles(config, input.distanceMiles);

  const min = (config.baseCalloutMin + miles * config.perMileMin) * mul;
  const recommended =
    (config.baseCalloutDefault + miles * config.perMileDefault) * mul;
  const max = (config.baseCalloutMax + miles * config.perMileMax) * mul;

  return {
    min: Math.round(min),
    recommended: Math.round(recommended),
    max: Math.round(max),
  };
}

export function getPriceZone(quote: number, range: PriceRange): PriceZone {
  if (quote < range.min) return "below";
  if (quote <= range.recommended) return "green";
  if (quote <= range.max) return "yellow";
  return "red";
}

// The price above which a quote must be held for manual admin approval, derived
// from `recommended × quoteApprovalMultiplier`. Returns null when the gate is
// disabled (multiplier missing or <= 1), so callers treat the quote as normal.
export function getQuoteApprovalCeiling(
  range: Pick<PriceRange, "recommended">,
  config: PricingConfig,
): number | null {
  const mult = config.quoteApprovalMultiplier;
  if (typeof mult !== "number" || !Number.isFinite(mult) || mult <= 1) {
    return null;
  }
  return range.recommended * mult;
}

// Whether a quote must be held for manual admin approval. A quote is held when
// it lands in the "red" zone (above the suggested max) OR exceeds the
// configurable `recommended × quoteApprovalMultiplier` ceiling. The red-zone
// check ensures an above-max quote is never sent to the customer unreviewed,
// even when the ceiling sits higher than max. Returns false when the band is
// unknown and the gate provides no signal.
export function quoteRequiresApproval(
  quote: number,
  range: Pick<PriceRange, "recommended" | "max"> | null | undefined,
  config: PricingConfig,
  requestType?: string | null,
): boolean {
  // Free-priced types are never held — the driver prices these freely, the
  // flat band is guidance only.
  if (isFreePriced(config, requestType)) return false;
  if (!range) return false;
  const q = Number(quote);
  if (Number.isFinite(range.max) && q > range.max) return true;
  const ceiling = getQuoteApprovalCeiling(range, config);
  if (ceiling === null) return false;
  return q > ceiling;
}

export function parseWeightToKg(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const trimmed = String(raw).trim().toLowerCase();
  if (!trimmed) return 0;
  const num = parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (trimmed.includes("t")) return num * 1000;
  if (trimmed.includes("lb")) return num * 0.453592;
  return num;
}

// Applies enabled extras to a base price. flat + perMile are summed onto the
// base; percent extras are applied last as a fraction of the running subtotal,
// so "+15%" stacks predictably even when multiple percent extras are enabled.
// Unknown keys in `enabledKeys` are ignored.
export function applyExtras(
  base: number,
  distanceMiles: number,
  extras: PriceExtra[],
  enabledKeys: Iterable<string>,
): number {
  const enabled = new Set(enabledKeys);
  const distance = Math.max(0, distanceMiles);
  let subtotal = Math.max(0, base);
  let percentBoost = 0;
  for (const extra of extras) {
    if (!enabled.has(extra.key)) continue;
    if (extra.kind === "flat") subtotal += extra.amount;
    else if (extra.kind === "perMile") subtotal += extra.amount * distance;
    else if (extra.kind === "percent") percentBoost += extra.amount;
  }
  return subtotal * (1 + percentBoost);
}

export type CommissionSplit = {
  quote: number;
  commission: number;
  driverNet: number;
};

// Splits a customer-facing quote into the platform's commission and the
// driver's take-home. Rate is a fraction (0.15 = 15%). Negative quotes and
// out-of-range rates are clamped so callers can pass raw user input safely.
export function splitCommission(quote: number, rate: number): CommissionSplit {
  const q = Math.max(0, Number.isFinite(quote) ? quote : 0);
  const r = Math.min(1, Math.max(0, Number.isFinite(rate) ? rate : 0));
  const commission = q * r;
  return { quote: q, commission, driverNet: q - commission };
}

export function parseDistanceToMiles(
  raw: string | number | null | undefined,
): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const trimmed = String(raw).trim().toLowerCase();
  if (!trimmed) return 0;
  const num = parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (trimmed.includes("km")) return num * 0.621371;
  return num;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  version: 1,
  baseCalloutMin: 75,
  baseCalloutMax: 110,
  baseCalloutDefault: 80,
  perMileMin: 1,
  perMileMax: 3,
  perMileDefault: 2,
  requestTypeMultipliers: {
    // Standard car recovery / tow — the explicit pricing baseline.
    RECOVERY: 1.0,
    BREAKDOWN: 0.9,
    ACCIDENT: 1.3,
    JUMPSTART: 0.5,
    SCRAPE: 0.8,
    FUEL: 0.4,
    MOBILEMECHANIC: 0.7,
    OTHER: 1.0,
    // Legacy alias for RECOVERY (customer app historically submitted "TOW",
    // priced via the 1.0 fallback). Keep at 1.0 so old rows price identically;
    // do not remove while TOW rows exist.
    TOW: 1.0,
  },
  weightTiers: [
    { maxKg: 1500, multiplier: 1.0, label: "Light (< 1500kg)" },
    { maxKg: 2500, multiplier: 1.15, label: "Medium (1500-2500kg)" },
    { maxKg: 3500, multiplier: 1.3, label: "Heavy (2500-3500kg)" },
    { maxKg: null, multiplier: 1.5, label: "Extra heavy (> 3500kg)" },
  ],
  // Neutral by default (all 1.0 = no taper, identical to raw distance). Admins opt
  // into the long-haul discount by lowering the later bands, e.g. 1.0 / 0.9 / 0.8.
  distanceTiers: [
    { maxMiles: 50, multiplier: 1.0, label: "First 50 mi" },
    { maxMiles: 100, multiplier: 1.0, label: "50-100 mi" },
    { maxMiles: null, multiplier: 1.0, label: "Beyond 100 mi" },
  ],
  commissionRate: 0.15,
  // Hold quotes more than 50% above the recommended price for admin approval.
  quoteApprovalMultiplier: 1.5,
  // Fuel, jump start and "other" are unpredictable to price by distance/weight,
  // so drivers price them freely against a flat £50/£80/£100 guideline and are
  // never held for approval.
  freePricingTypes: ["FUEL", "JUMPSTART", "OTHER"],
  freePricingBand: { min: 50, recommended: 80, max: 100 },
};
