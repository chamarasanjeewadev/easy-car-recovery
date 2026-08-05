const BRANDS = ['Halfords', 'Kwik Fit', 'RAC Garages', 'Admiral', 'Direct Line']

export function PressStrip() {
  return (
    <div className="container-app flex flex-wrap items-center gap-7 pb-4 pt-8">
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Trusted by</span>
      <div className="flex flex-wrap items-center gap-7 opacity-60">
        {BRANDS.map((b) => (
          <span key={b} className="text-lg font-bold tracking-tight text-on-surface-variant">
            {b}
          </span>
        ))}
      </div>
    </div>
  )
}
