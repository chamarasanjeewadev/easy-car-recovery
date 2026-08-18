import { useEffect, useState } from 'react'
import { getQuoteFn } from '~/lib/api/quote'
import { serviceNeedsDropoff, type RequestType, type Size } from '~/lib/booking-search'

interface QuoteSearch {
  reg?: string
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  requestType?: RequestType
  size?: Size
  manualVehicle?: boolean
}

/**
 * Fetches the fixed recovery price for the current journey (vehicle + pick-up
 * and, for relocation services, drop-off coords) so the funnel can show it
 * upfront, AnyVan-style. Returns { amountPence: null } until enough inputs are
 * present, and re-quotes whenever any of them change. On-site services
 * (jump-start / fuel / scrap) don't need a drop-off — the pick-up coords are
 * used as the destination so distance is 0.
 */
export function useQuote(search: QuoteSearch): {
  amountPence: number | null
  loading: boolean
} {
  const [amountPence, setAmountPence] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const needsDropoff = serviceNeedsDropoff(search.requestType)
  const hasVehicle = !!search.reg || !!search.manualVehicle
  const hasFrom = search.fromLat != null && search.fromLng != null
  const hasTo = search.toLat != null && search.toLng != null
  const ready = hasVehicle && hasFrom && (needsDropoff ? hasTo : true)

  // For on-site services the destination is the pick-up (distance 0).
  const toLat = needsDropoff ? search.toLat : search.fromLat
  const toLng = needsDropoff ? search.toLng : search.fromLng

  useEffect(() => {
    if (!ready) {
      setAmountPence(null)
      return
    }
    let cancelled = false
    setLoading(true)
    getQuoteFn({
      data: {
        reg: search.reg,
        fromLat: search.fromLat!,
        fromLng: search.fromLng!,
        toLat: toLat!,
        toLng: toLng!,
        requestType: search.requestType,
        size: search.size,
      },
    })
      .then((r) => {
        if (!cancelled) setAmountPence(r.amountPence)
      })
      .catch(() => {
        if (!cancelled) setAmountPence(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, search.reg, search.fromLat, search.fromLng, toLat, toLng, search.requestType, search.size])

  return { amountPence, loading }
}
