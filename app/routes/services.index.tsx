import { createFileRoute } from '@tanstack/react-router'
import { Icon } from '~/components/icon'
import { CtaBanner } from '~/components/cta-banner'
import { SeoPageLink } from '~/components/seo/seo-page-link'
import { SERVICE_PAGES, VEHICLE_PAGES, type SeoPage } from '~/lib/seo-pages'
import { SITE_URL } from '~/lib/site'

const HUB_TITLE = 'Car Recovery Services — Booked Online, Fixed Price | Easy Car Recovery'
const HUB_DESCRIPTION =
  'Every recovery service, booked online at a fixed price: vehicle recovery, jump start, wrong fuel, breakdown transport and EV recovery, plus motorcycle and van recovery across the UK.'

export const Route = createFileRoute('/services/')({
  head: () => {
    const canonical = `${SITE_URL}/services`
    return {
      meta: [
        { title: HUB_TITLE },
        { name: 'description', content: HUB_DESCRIPTION },
        { property: 'og:title', content: HUB_TITLE },
        { property: 'og:description', content: HUB_DESCRIPTION },
        { property: 'og:url', content: canonical },
        { name: 'twitter:title', content: HUB_TITLE },
        { name: 'twitter:description', content: HUB_DESCRIPTION },
      ],
      links: [{ rel: 'canonical', href: canonical }],
    }
  },
  component: ServicesHub,
})

function ServicesHub() {
  return (
    <>
      <section className="relative">
        <div className="hero-gradient pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-app relative py-14 md:py-16">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            <span className="h-px w-4 bg-current" />
            Services
          </span>
          <h1 className="mt-3.5 max-w-[16ch] text-[clamp(34px,5vw,60px)] font-bold leading-[1.05] tracking-[-0.025em]">
            Car recovery, booked online.
          </h1>
          <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-on-surface-variant">
            Whatever has stopped you, book it online at a fixed price and a vetted operator from the
            TowMyCar network is on the way. Choose the service that fits your situation.
          </p>
        </div>
      </section>

      <HubGrid heading="Recovery services" pages={SERVICE_PAGES} />
      <HubGrid heading="Recovery by vehicle" pages={VEHICLE_PAGES} />

      <CtaBanner />
    </>
  )
}

function HubGrid({ heading, pages }: { heading: string; pages: SeoPage[] }) {
  return (
    <section className="container-app pt-4 pb-12">
      <h2 className="mb-6 text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
        {heading}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((p) => (
          <SeoPageLink
            key={p.slug}
            page={p}
            className="group flex flex-col gap-4 rounded-[var(--radius-md)] bg-white p-7 shadow-[var(--shadow-card)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
          >
            <div className="grid h-[52px] w-[52px] place-items-center rounded-[var(--radius)] bg-surface-c text-on-surface">
              <Icon name={p.ic} size={22} />
            </div>
            <h3 className="text-[20px] font-bold tracking-tight">{p.h1}</h3>
            <p className="flex-1 text-[15px] leading-relaxed text-on-surface-variant">
              {p.intro.split('. ')[0]}.
            </p>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
              View service <Icon name="arrow-up-right" size={14} />
            </div>
          </SeoPageLink>
        ))}
      </div>
    </section>
  )
}
