import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/hero'
import { StatsBar } from '~/components/stats-bar'
import { HowItWorks } from '~/components/how-it-works'
import { ServicesGrid } from '~/components/services-grid'
import { Reviews } from '~/components/reviews'
import { Coverage } from '~/components/coverage'
import { Faq, FAQ_ITEMS } from '~/components/faq'
import { CtaBanner } from '~/components/cta-banner'
import { SITE_URL } from '~/lib/site'

const FAQ_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
})

const HOME_TITLE = 'Car Recovery Booked Online — Fixed Price, UK-Wide | Easy Car Recovery'
const HOME_DESCRIPTION =
  'Book car recovery online at a fixed price. Check your reg, tell us your route, and a vetted driver is dispatched across England, Scotland & Wales — no membership, no call-out surprises.'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: 'description', content: HOME_DESCRIPTION },
      { property: 'og:title', content: HOME_TITLE },
      { property: 'og:description', content: HOME_DESCRIPTION },
      { name: 'twitter:title', content: HOME_TITLE },
      { name: 'twitter:description', content: HOME_DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/` }],
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <HowItWorks />
      <ServicesGrid />
      <Reviews />
      <Coverage />
      <Faq />
      <CtaBanner />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }} />
    </>
  )
}
