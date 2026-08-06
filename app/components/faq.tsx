import { Icon } from './icon'

export const FAQ_ITEMS = [
  {
    q: 'How much does vehicle recovery cost?',
    a: 'There is no fixed price list. When you submit a request, vetted recovery drivers near you respond with real quotes for your exact job, and our team confirms the price with you before anything is dispatched. You are free to decline at no cost.',
  },
  {
    q: 'Do I pay anything online?',
    a: 'No. Nothing is charged on this website. You agree the price during the confirmation call and pay the driver directly once the job is done.',
  },
  {
    q: 'How fast can someone reach me?',
    a: 'It depends on your location and driver availability, but the TowMyCar network averages a 15-minute response to new requests, 24/7, every day of the year.',
  },
  {
    q: 'Who actually recovers my vehicle?',
    a: 'Independent, vetted recovery operators on the TowMyCar platform — the same network behind towmycar.uk. Easy Car Recovery is part of the same company, 3C NET (PVT) LTD.',
  },
  {
    q: 'What does the free vehicle check show?',
    a: "Official DVLA data for your reg: make, colour, fuel type, year, plus current MOT and tax status. It's free and helps drivers quote accurately.",
  },
  {
    q: 'Is my breakdown an emergency?',
    a: 'We are not an emergency service. If you are in immediate danger — for example stopped in a live lane — call 999 first, then arrange recovery.',
  },
] as const

export function Faq() {
  return (
    <section id="faq" className="container-app py-20">
      <div className="mb-10 max-w-[700px]">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          <span className="h-px w-4 bg-current" />
          FAQ
        </span>
        <h2 className="mt-3.5 text-[clamp(28px,3.6vw,44px)] font-bold leading-tight tracking-[-0.015em]">
          Questions, answered honestly.
        </h2>
      </div>
      <div className="mx-auto flex max-w-[820px] flex-col gap-3">
        {FAQ_ITEMS.map((item) => (
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
  )
}
