import { Logo } from './logo'

const COLS = [
  {
    h: 'Service',
    items: ['Recovery', 'Battery & jump-start', 'Wrong fuel', 'Roadside repair', 'EV recovery'],
  },
  {
    h: 'Company',
    items: ['About', 'Coverage map', 'For garages', 'For insurers', 'Careers'],
  },
  {
    h: 'Help',
    items: ['Contact', 'FAQ', 'Track booking', 'Terms', 'Privacy'],
  },
]

export function Footer() {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface">
      <div className="container-app py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-[320px] md:col-span-1">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed opacity-70">
              The UK's most-booked breakdown service. Pay-as-you-go recovery, scheduled tows, and EV-trained
              drivers — without a yearly subscription.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.h}>
              <div className="mb-4 text-[13px] font-bold uppercase tracking-wider opacity-85">{col.h}</div>
              {col.items.map((label) => (
                <a
                  key={label}
                  href="#"
                  className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
                >
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6 text-xs opacity-55">
          <span>© 2026 Easy Recovery Ltd · Co. № 09124551</span>
          <span>VAT GB 234 5678 91 · London EC1Y 8AF</span>
        </div>
      </div>
    </footer>
  )
}
