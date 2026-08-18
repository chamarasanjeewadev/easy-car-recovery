// Mirror of @towmycar/common/src/pricing/types.ts. DO NOT EDIT BY HAND.
// Canonical lives in the backend repo:
//   towmycar-backend/packages/common/src/pricing/types.ts
// Edit canonical first, then regenerate every mirror with:
//   node packages/common/scripts/sync-pricing-mirrors.mjs

export type WeightTier = {
  // Upper bound in kg, inclusive. The final tier MUST use null to mean "no upper bound".
  maxKg: number | null;
  multiplier: number;
  label: string;
};

export type DistanceTier = {
  // Upper bound in miles, inclusive. The final tier MUST use null to mean "no upper bound".
  maxMiles: number | null;
  multiplier: number;
  label: string;
};

export type PriceExtraKind = "flat" | "perMile" | "percent";

// Optional line-items a driver can toggle when building a quote in the calculator
// modal. flat = £ added once; perMile = £ × distanceMiles; percent = fraction of
// the running subtotal (applied last). Server may omit `extras`; clients fall
// back to a hardcoded default catalogue.
export type PriceExtra = {
  key: string;
  label: string;
  kind: PriceExtraKind;
  amount: number;
  defaultEnabled?: boolean;
};

export type PricingConfig = {
  version: number;
  baseCalloutMin: number;
  baseCalloutMax: number;
  baseCalloutDefault: number;
  perMileMin: number;
  perMileMax: number;
  perMileDefault: number;
  // Keyed by BreakdownRequestType value. Unknown types fall back to 1.0.
  requestTypeMultipliers: Record<string, number>;
  // Ordered ascending by maxKg; the final entry must have maxKg = null.
  weightTiers: WeightTier[];
  // Ordered ascending by maxMiles; the final entry must have maxMiles = null.
  // Applied MARGINALLY to the per-mile portion (tax-bracket style): the miles that
  // fall in each band are priced at that band's multiplier, so longer trips can
  // cost less per mile while the total stays monotonic. Absent/empty = no taper
  // (raw distance × per-mile), preserving the pre-taper linear behaviour.
  distanceTiers?: DistanceTier[];
  // Platform commission as a fraction of the customer-facing quote (e.g. 0.15 = 15%).
  // Folded into calculatePriceRange so the suggested band is customer-facing.
  // Clamped to [0, 0.99] at calc time so an out-of-range value can't blow up the bar.
  commissionRate: number;
  // Over-range approval gate: a driver quote above `recommended × this` is held
  // for manual admin approval before reaching the customer. Undefined/null/<=1
  // disables the gate (quotes always flow straight through). e.g. 1.5 = hold
  // anything more than 50% above the recommended price.
  quoteApprovalMultiplier?: number;
  extras?: PriceExtra[];
};

export type PriceRange = {
  min: number;
  recommended: number;
  max: number;
};

// Customer-fairness scale:
//   below  = quote < min (under suggested band — unrealistically low)
//   green  = min <= quote <= recommended (good price for customer)
//   yellow = recommended < quote <= max (within suggested band)
//   red    = quote > max (above suggested band)
export type PriceZone = "below" | "green" | "yellow" | "red";

export type PriceInput = {
  distanceMiles: number;
  requestType: string;
  vehicleWeightKg: number;
};

export type SuggestedPriceSnapshot = PriceRange & {
  configVersion: number;
};
