import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { Header } from '~/components/header'
import { Footer } from '~/components/footer'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SUPPORT_PHONE_DISPLAY } from '~/lib/site'
import appCss from '~/styles/app.css?url'

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_NAME,
  url: SITE_URL,
  telephone: SUPPORT_PHONE_DISPLAY.replace(/\s+/g, ''),
  description: SITE_DESCRIPTION,
  areaServed: ['England', 'Scotland', 'Wales'],
  priceRange: '££',
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
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: `${SITE_NAME} — UK vehicle recovery, booked online` },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
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
