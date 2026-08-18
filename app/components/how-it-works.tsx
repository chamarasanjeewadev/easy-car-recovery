const STEPS = [
  {
    n: 1,
    title: 'Tell us your journey',
    body:
      'Enter your reg, pick-up and drop-off. We verify your vehicle against official DVLA data in seconds.',
  },
  {
    n: 2,
    title: 'Pay a fixed price online',
    body:
      'Your price is calculated from your route and vehicle, and you pay securely by card at checkout. No haggling, no call-out surprises.',
  },
  {
    n: 3,
    title: 'We dispatch & recover',
    body:
      'Vetted recovery drivers near you are notified the moment you book — the network averages a 15-minute response, 24/7.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="container-app py-20">
      <div className="mb-12 max-w-[700px]">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          <span className="h-px w-4 bg-current" />
          How it works
        </span>
        <h2 className="mt-3.5 text-[clamp(28px,3.6vw,44px)] font-bold leading-tight tracking-[-0.015em]">
          Three quick steps — we handle the rest.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="flex flex-col gap-4 rounded-[var(--radius-md)] bg-white p-8 shadow-[var(--shadow-card)]"
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-fixed text-lg font-extrabold text-on-primary-fixed">
              {s.n}
            </div>
            <h3 className="text-[22px] font-bold tracking-tight">{s.title}</h3>
            <p className="text-[15px] leading-relaxed text-on-surface-variant">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
