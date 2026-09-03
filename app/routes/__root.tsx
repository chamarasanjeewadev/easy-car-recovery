import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { Header } from '~/components/header'
import { Footer } from '~/components/footer'
import {
  COMPANY_NAME,
  GOOGLE_REVIEWS_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  TOWMYCAR_URL,
  TRUSTPILOT_URL,
} from '~/lib/site'
import appCss from '~/styles/app.css?url'

const OG_IMAGE = `${SITE_URL}/og.png`

// NOTE: aggregateRating / review markup is intentionally omitted from this
// LocalBusiness. Reviews shown on our own site about our own business
// ("self-serving") are not eligible for review rich results under Google's
// structured-data policy — true even when the reviews are real. Kept consistent
// with towmycar-user-app/src/utils/schemas/reviewsSchema.ts.
const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_NAME,
  url: SITE_URL,
  image: OG_IMAGE,
  telephone: SUPPORT_PHONE_DISPLAY.replace(/\s+/g, ''),
  email: SUPPORT_EMAIL,
  description: SITE_DESCRIPTION,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '46 Throwley Way',
    addressLocality: 'Sutton',
    postalCode: 'SM1 4AF',
    addressCountry: 'GB',
  },
  parentOrganization: { '@type': 'Organization', name: COMPANY_NAME },
  sameAs: [TOWMYCAR_URL, TRUSTPILOT_URL, GOOGLE_REVIEWS_URL],
  areaServed: ['England', 'Scotland', 'Wales'],
  openingHours: 'Mo-Su 00:00-24:00',
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: `${SITE_NAME} — UK vehicle recovery, booked online` },
      { name: 'description', content: SITE_DESCRIPTION },
      { name: 'theme-color', content: '#88b000' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: `${SITE_NAME} — UK vehicle recovery, booked online` },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: `${SITE_NAME} — UK vehicle recovery, booked online` },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      </head>
      <body className="min-h-screen bg-surface font-sans text-on-surface antialiased">
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
        <Scripts />
      </body>
    </html>
  )
}
