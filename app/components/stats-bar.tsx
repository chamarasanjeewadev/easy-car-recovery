const STATS = [
  { value: '50+', label: 'Service areas' },
  { value: '15 min', label: 'Average response' },
  { value: '99%', label: 'Success rate' },
  { value: '100+', label: 'Recovery drivers' },
] as const

export function StatsBar() {
  return (
    <section className="bg-inverse-surface text-inverse-on-surface">
      <div className="container-app py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="text-[clamp(28px,3.4vw,40px)] font-bold tracking-[-0.02em] text-primary-fixed">
                {s.value}
              </span>
              <span className="text-sm opacity-70">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 border-t border-white/10 pt-4 text-xs opacity-55">
          Across the TowMyCar recovery network, which fulfils Easy Car Recovery bookings.
        </p>
      </div>
    </section>
  )
}
