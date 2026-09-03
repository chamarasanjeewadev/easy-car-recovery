import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { SeoPage } from '~/lib/seo-pages'

// Cluster-aware typed Link to an SEO content page. Keeps the router's typed
// `to`/`params` happy (service → /services/$slug, vehicle → /recovery/$slug)
// without scattering conditionals across the callers.
export function SeoPageLink({
  page,
  className,
  children,
}: {
  page: SeoPage
  className?: string
  children: ReactNode
}) {
  if (page.cluster === 'service') {
    return (
      <Link to="/services/$slug" params={{ slug: page.slug }} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <Link to="/recovery/$slug" params={{ slug: page.slug }} className={className}>
      {children}
    </Link>
  )
}
