import { createFileRoute } from '@tanstack/react-router'
import { SITE_URL } from '~/lib/site'
import {
  CONTENT_LAST_UPDATED,
  INDEXABLE_SEO_PAGES,
  seoPagePath,
} from '~/lib/seo-pages'

// Generated sitemap — sourced from the same seo-pages data the routes render
// from, so new indexable pages appear automatically. Replaces the old static
// public/sitemap.xml (which has been removed). Funnel pages (/date, /pay,
// /details, /success) are intentionally excluded — they are noindex.
type Entry = { loc: string; changefreq: string; priority: string; lastmod?: string }

function buildSitemap(): string {
  const staticEntries: Entry[] = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/quote`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE_URL}/services`, changefreq: 'monthly', priority: '0.8', lastmod: CONTENT_LAST_UPDATED },
    { loc: `${SITE_URL}/terms`, changefreq: 'yearly', priority: '0.2' },
    { loc: `${SITE_URL}/privacy`, changefreq: 'yearly', priority: '0.2' },
  ]

  const pageEntries: Entry[] = INDEXABLE_SEO_PAGES.map((p) => ({
    loc: `${SITE_URL}${seoPagePath(p)}`,
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: CONTENT_LAST_UPDATED,
  }))

  const urls = [...staticEntries, ...pageEntries]
    .map((e) => {
      const lastmod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${e.loc}</loc>${lastmod}\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemap(), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        }),
    },
  },
})
