import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/hero'
import { HowItWorks } from '~/components/how-it-works'
import { ServicesGrid } from '~/components/services-grid'
import { CtaBanner } from '~/components/cta-banner'
import { SITE_URL } from '~/lib/site'

export const Route = createFileRoute('/')({
  head: () => ({
    links: [{ rel: 'canonical', href: `${SITE_URL}/` }],
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ServicesGrid />
      <CtaBanner />
    </>
  )
}
