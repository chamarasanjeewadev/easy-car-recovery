import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Icon } from './icon'
import { HeroCard } from './hero-card'
import { FloatCard } from './float-card'

export function Hero() {
  return (
    <section className="relative">
      <div className="hero-gradient pointer-events-none absolute inset-0" aria-hidden />
      <div className="container-app relative grid items-center gap-14 py-14 md:grid-cols-[1.1fr_1fr] md:py-16">
        <div>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-outline-variant bg-white py-1.5 pl-2 pr-3.5 text-[13px] font-medium text-on-surface-variant">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-primary-c shadow-[0_0_0_4px_rgba(136,176,0,0.18)]"
            />
            Available now · 41 drivers on shift
          </span>
          <h1 className="text-[clamp(40px,6vw,72px)] font-bold leading-[1.05] tracking-[-0.025em]">
            Stay moving,
            <br />
            no matter <span className="text-primary">what.</span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-on-surface-variant">
            Fixed-price vehicle recovery across England, Scotland and Wales. DBS-checked drivers, live tracking,
            and zero surge fees — book in 30 seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/quote">
                Book a recovery <Icon name="arrow-right" size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="tel:08081570111">
                <Icon name="phone" size={16} /> Call us
              </a>
            </Button>
          </div>

          <div className="mt-9 flex flex-wrap gap-8 border-t border-surface-high pt-6">
            <Trust k="4.86 / 5" v="14,902 reviews" />
            <Trust k="38 min" v="Avg. ETA · greater London" />
            <Trust k="£0" v="Cancellation up to 1h out" />
          </div>
        </div>

        <div className="relative">
          <HeroCard />
          <FloatCard />
        </div>
      </div>
    </section>
  )
}

function Trust({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[22px] font-bold tracking-tight">{k}</span>
      <span className="text-[13px] text-on-surface-variant">{v}</span>
    </div>
  )
}
