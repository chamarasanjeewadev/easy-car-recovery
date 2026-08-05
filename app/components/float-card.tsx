import { Icon } from './icon'

interface FloatCardProps {
  label?: string
  value?: string
}

export function FloatCard({ label = 'Booked just now', value = '£142 · M25 → Slough' }: FloatCardProps) {
  return (
    <div className="absolute -bottom-7 -left-8 hidden -rotate-3 items-center gap-3.5 rounded-[var(--radius-md)] bg-inverse-surface px-5 py-4 text-inverse-on-surface shadow-[var(--shadow-float)] sm:flex">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-c text-on-primary-c">
        <Icon name="check" size={20} stroke={2.5} />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider opacity-65">{label}</div>
        <div className="text-base font-bold">{value}</div>
      </div>
    </div>
  )
}
