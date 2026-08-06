import { Icon } from './icon'
import { REVIEWS, PLATFORM_RATINGS } from '~/lib/reviews-data'

export function Reviews() {
  return (
    <section id="reviews" className="bg-surface-low">
      <div className="container-app py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[560px]">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              <span className="h-px w-4 bg-current" />
              Reviews
            </span>
            <h2 className="mt-3.5 text-[clamp(28px,3.6vw,44px)] font-bold leading-tight tracking-[-0.015em]">
              Rated by drivers we've rescued.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {PLATFORM_RATINGS.map((p) => (
              <a
                key={p.platform}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[var(--radius)] bg-white px-5 py-3.5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[rgba(136,176,0,0.14)] text-primary">
                  <Icon name="star" size={16} />
                </span>
                <span>
                  <span className="block text-sm font-bold">
                    {p.platform} {p.rating.toFixed(1)}
                  </span>
                  <span className="block text-xs text-on-surface-variant">{p.totalReviews} reviews</span>
                </span>
                <Icon name="arrow-up-right" size={14} className="text-on-surface-variant" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure
              key={r.id}
              className="flex flex-col gap-4 rounded-[var(--radius-md)] bg-white p-7 shadow-[var(--shadow-card)]"
            >
              <div className="flex gap-0.5 text-primary-c" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Icon key={i} name="star" size={15} />
                ))}
              </div>
              <blockquote className="flex-1 text-[15px] leading-relaxed text-on-surface-variant">
                {r.text}
              </blockquote>
              <figcaption className="flex items-center justify-between text-sm">
                <strong className="font-semibold">{r.author}</strong>
                <span className="text-xs text-on-surface-variant">
                  {r.platform === 'google' ? 'Google' : 'Trustpilot'}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-on-surface-variant">
          Reviews of the TowMyCar recovery network, which fulfils Easy Car Recovery bookings.
        </p>
      </div>
    </section>
  )
}
