import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Icon } from './icon'

const CITIES = [
  'London',
  'Birmingham',
  'Manchester',
  'Leeds',
  'Liverpool',
  'Sheffield',
  'Bristol',
  'Newcastle',
  'Nottingham',
  'Glasgow',
  'Edinburgh',
  'Cardiff',
] as const

export function Coverage() {
  return (
    <section id="coverage" className="container-app py-20">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            <span className="h-px w-4 bg-current" />
            Coverage
          </span>
          <h2 className="mt-3.5 text-[clamp(28px,3.6vw,44px)] font-bold leading-tight tracking-[-0.015em]">
            England, Scotland and Wales — 50+ service areas.
          </h2>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-on-surface-variant">
            The TowMyCar network covers major cities, motorway corridors and everywhere in between.
            Wherever you've stopped, submit your request and nearby drivers respond.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/quote">
              Check your route <Icon name="arrow-right" size={16} />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {CITIES.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-card)]"
            >
              <Icon name="map-pin" size={14} className="text-primary" />
              {city}
            </span>
          ))}
          <span className="inline-flex items-center gap-2 rounded-full bg-inverse-surface px-4 py-2.5 text-sm font-semibold text-inverse-on-surface">
            + many more
          </span>
        </div>
      </div>
    </section>
  )
}
