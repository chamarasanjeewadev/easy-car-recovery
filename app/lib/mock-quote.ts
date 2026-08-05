import type { Condition, Size } from './booking-search'

const BASE: Record<Size, number> = { car: 89, suv: 129, van: 159 }
const CONDITION_FEE: Record<Condition, number> = { drives: 0, rolls: 25, winch: 60 }

export interface QuoteInput {
  size: Size
  condition: Condition
  distanceMiles: number
}

export interface Quote {
  base: number
  conditionFee: number
  distanceFee: number
  total: number
  etaMin: number
}

export function priceQuote({ size, condition, distanceMiles }: QuoteInput): Quote {
  const base = BASE[size]
  const conditionFee = CONDITION_FEE[condition]
  const distanceFee = Math.round(distanceMiles * 1.15)
  return {
    base,
    conditionFee,
    distanceFee,
    total: base + conditionFee + distanceFee,
    etaMin: 30 + Math.floor(distanceMiles / 8),
  }
}

export function sizeLabel(size: Size): string {
  return size === 'car' ? 'Car · saloon' : size === 'suv' ? 'SUV · 4×4' : 'Van · LCV'
}

export function conditionLabel(condition: Condition): string {
  return condition === 'drives' ? 'Drives on' : condition === 'rolls' ? 'Non-runner · rolls' : 'Winch required'
}
