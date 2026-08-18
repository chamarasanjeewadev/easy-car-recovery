import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from './ui/button'
import { Icon } from './icon'
import { formatPounds } from '~/lib/money'

interface SummaryRow {
  label: string
  value: string | number
}

interface BookingSummaryProps {
  rows: SummaryRow[]
  /** Fixed recovery price in pence. null = not yet known (needs both locations). */
  pricePence?: number | null
  /** True while the quote is being fetched. */
  priceLoading?: boolean
  fine?: ReactNode
  ctaLabel: string
  onCta?: () => void
  ctaHref?: { to: '/quote' | '/date' | '/details' | '/pay' | '/success'; search?: Record<string, unknown> }
  disabled?: boolean
  busyLabel?: string
}

export function BookingSummary({ rows, pricePence, priceLoading, fine, ctaLabel, onCta, ctaHref, disabled, busyLabel }: BookingSummaryProps) {
  const showPrice = pricePence != null || priceLoading
  const cta = (
    <Button
      size="lg"
      className="w-full"
      onClick={onCta}
      disabled={disabled}
    >
      {disabled && busyLabel ? busyLabel : (
        <>
          {ctaLabel} <Icon name="arrow-right" size={16} />
        </>
      )}
    </Button>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Summary</div>
        <div className="space-y-1">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 py-1.5 text-sm">
              <span className="text-on-surface-variant">{row.label}</span>
              <strong className="text-right font-semibold">{row.value}</strong>
            </div>
          ))}
        </div>
        {showPrice && (
          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-surface-high pt-4">
            <span className="text-sm text-on-surface-variant">Fixed price</span>
            <strong className="text-[26px] font-bold tracking-[-0.02em]">
              {pricePence != null ? formatPounds(pricePence) : 'Calculating…'}
            </strong>
          </div>
        )}
        <div className="mt-3 border-t border-surface-high pt-4 text-sm text-on-surface-variant">
          Fixed price, paid securely online — a vetted recovery driver is assigned to your booking.
        </div>
      </div>

      {ctaHref ? (
        <Button asChild size="lg" className="w-full">
          <Link to={ctaHref.to} search={ctaHref.search as never}>
            {ctaLabel} <Icon name="arrow-right" size={16} />
          </Link>
        </Button>
      ) : (
        cta
      )}

      {fine && <p className="text-center text-xs text-on-surface-variant">{fine}</p>}
    </div>
  )
}
