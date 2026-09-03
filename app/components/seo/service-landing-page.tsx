import { Link } from '@tanstack/react-router'
import { Button } from '../ui/button'
import { Icon } from '../icon'
import { Reviews } from '../reviews'
import { CtaBanner } from '../cta-banner'
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '~/lib/site'
import { getSeoPage, type SeoPage } from '~/lib/seo-pages'
import { buildSeoJsonLd } from './seo-jsonld'
import { SeoPageLink } from './seo-page-link'

// Shared presentational template for every SEO content page (per-service and
// vehicle-type). Data-driven from SeoPage; emits Service + FAQPage JSON-LD.
export function ServiceLandingPage({ page }: { page: SeoPage }) {
  const related = page.related
    .map((slug) => getSeoPage(slug))
    .filter((p): p is SeoPage => Boolean(p))

  return (
    <>
      <section className="relative">
        <div className="hero-gradient pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-app relative py-14 md:py-16">
          <Link
            to="/services"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="arrow-left" size={15} /> All services
          </Link>
          <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="mb-6 grid h-[52px] w-[52px] place-items-center rounded-[var(--radius)] bg-surface-c text-on-surface">
                <Icon name={page.ic} size={24} />
              </div>
              <h1 className="text-[clamp(34px,5vw,60px)] font-bold leading-[1.05] tracking-[-0.025em]">
                {page.h1}
              </h1>
              <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-on-surface-variant">
                {page.intro}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/quote">
                    See your fixed price <Icon name="arrow-right" size={16} />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={SUPPORT_PHONE_TEL}>
                    <Icon name="phone" size={16} /> {SUPPORT_PHONE_DISPLAY}
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-white p-7 shadow-[var(--shadow-card)]">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
                What&apos;s included
              </h2>
              <ul className="mt-5 flex flex-col gap-3.5">
                {page.included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-c/15 text-primary">
                      <Icon name="check" size={14} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Reviews />

      <section className="container-app py-20">
        <div className="mb-10 max-w-[700px]">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            <span className="h-px w-4 bg-current" />
            FAQ
          </span>
          <h2 className="mt-3.5 text-[clamp(28px,3.6vw,44px)] font-bold leading-tight tracking-[-0.015em]">
            {page.h1} — your questions
          </h2>
        </div>
        <div className="mx-auto flex max-w-[820px] flex-col gap-3">
          {page.faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-card)] open:pb-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-7 py-5 text-[17px] font-bold tracking-tight [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-c transition-transform group-open:rotate-45">
                  <Icon name="plus" size={16} />
                </span>
              </summary>
              <p className="px-7 text-[15px] leading-relaxed text-on-surface-variant">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-app pb-20">
          <h2 className="mb-6 text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
            Related recovery services
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <SeoPageLink
                key={r.slug}
                page={r}
                className="group flex items-center gap-4 rounded-[var(--radius-md)] bg-white p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] bg-surface-c text-on-surface">
                  <Icon name={r.ic} size={20} />
                </span>
                <span className="flex-1 font-bold tracking-tight">{r.h1}</span>
                <Icon name="arrow-up-right" size={16} className="text-on-surface-variant" />
              </SeoPageLink>
            ))}
          </div>
        </section>
      )}

      <CtaBanner />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildSeoJsonLd(page) }} />
    </>
  )
}
