import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/hero'
import { PressStrip } from '~/components/press-strip'
import { HowItWorks } from '~/components/how-it-works'
import { ServicesGrid } from '~/components/services-grid'
import { CtaBanner } from '~/components/cta-banner'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Hero />
      <PressStrip />
      <HowItWorks />
      <ServicesGrid />
      <CtaBanner />
    </>
  )
}
