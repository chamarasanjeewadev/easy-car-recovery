import { SITE_NAME, SITE_URL } from '~/lib/site'
import { seoPagePath, type SeoPage } from '~/lib/seo-pages'

// Builds the Service + FAQPage JSON-LD graph for a content page. Service is the
// safe @type (no fabricated aggregateRating — see the note in __root.tsx and
// towmycar-user-app's reviewsSchema.ts). FAQPage mirrors the visible FAQ.
export function buildSeoJsonLd(page: SeoPage): string {
  const url = `${SITE_URL}${seoPagePath(page)}`
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: page.h1,
        serviceType: page.serviceType,
        description: page.metaDescription,
        url,
        areaServed: [
          { '@type': 'Country', name: 'England' },
          { '@type': 'Country', name: 'Scotland' },
          { '@type': 'Country', name: 'Wales' },
        ],
        provider: {
          '@type': 'LocalBusiness',
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: page.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  })
}
