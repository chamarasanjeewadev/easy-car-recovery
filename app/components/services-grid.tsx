import { Link } from '@tanstack/react-router'
import { Icon, type IconName } from './icon'

interface Service {
  ic: IconName
  name: string
  desc: string
  variant?: 'feature' | 'dark'
}

const SERVICES: Service[] = [
  {
    ic: 'truck',
    name: 'Vehicle recovery',
    desc: 'Flatbed transport for cars, vans and light commercials up to 3.5t.',
    variant: 'feature',
  },
  {
    ic: 'battery',
    name: 'Jump start & battery',
    desc: 'Roadside boost and battery help for most makes and models.',
  },
  {
    ic: 'fuel',
    name: 'Wrong fuel & empty',
    desc: 'Recovery to a garage when the wrong fuel — or none — leaves you stranded.',
  },
  {
    ic: 'wrench',
    name: 'Breakdown transport',
    desc: 'Non-runners, accident-damaged and seized vehicles moved safely.',
    variant: 'dark',
  },
  {
    ic: 'zap',
    name: 'EV recovery',
    desc: 'Flatbed handling for EVs and PHEVs, matched to drivers with the right kit.',
  },
]

export function ServicesGrid() {
  return (
    <section id="services" className="container-app py-20">
      <div className="mb-12 max-w-[700px]">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          <span className="h-px w-4 bg-current" />
          Services
        </span>
        <h2 className="mt-3.5 text-[clamp(28px,3.6vw,44px)] font-bold leading-tight tracking-[-0.015em]">
          Whatever broke down, we'll move it.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        {SERVICES.map((s) => (
          <ServiceCard key={s.name} service={s} />
        ))}
      </div>
    </section>
  )
}

function ServiceCard({ service: s }: { service: Service }) {
  const isFeature = s.variant === 'feature'
  const isDark = s.variant === 'dark'
  const baseBg = isFeature
    ? 'lime-gradient text-on-primary-fixed lg:col-span-1'
    : isDark
      ? 'bg-inverse-surface text-inverse-on-surface'
      : 'bg-white text-on-surface'
  const featureColCls = isFeature ? 'md:col-span-2 lg:col-span-1' : ''
  const iconBg = isFeature
    ? 'bg-on-primary-fixed text-primary-fixed'
    : isDark
      ? 'bg-primary-c text-on-primary-c'
      : 'bg-surface-c text-on-surface'
  const arrowBg = isFeature
    ? 'bg-on-primary-fixed text-primary-fixed'
    : isDark
      ? 'bg-primary-c text-on-primary-c'
      : 'bg-surface-c text-on-surface group-hover:bg-on-surface group-hover:text-white'
  const descCls = isFeature || isDark ? 'opacity-75' : 'text-on-surface-variant'

  return (
    <Link
      to="/quote"
      className={`group flex flex-col gap-4 rounded-[var(--radius-md)] p-7 shadow-[var(--shadow-card)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)] ${baseBg} ${featureColCls}`}
    >
      <div className={`grid h-13 w-13 h-[52px] w-[52px] place-items-center rounded-[var(--radius)] ${iconBg}`}>
        <Icon name={s.ic} size={22} />
      </div>
      <h3 className="text-[22px] font-bold tracking-tight">{s.name}</h3>
      <p className={`flex-1 text-[15px] leading-relaxed ${descCls}`}>{s.desc}</p>
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold opacity-70">Get quotes</div>
        <span
          className={`grid h-9 w-9 place-items-center rounded-full transition ${arrowBg} ${
            isFeature || isDark ? 'group-hover:-rotate-45' : ''
          }`}
          aria-hidden
        >
          <Icon name="arrow-up-right" size={16} />
        </span>
      </div>
    </Link>
  )
}
