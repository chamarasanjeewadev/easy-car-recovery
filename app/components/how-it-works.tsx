const STEPS = [
  {
    n: 1,
    title: 'Tell us where',
    body:
      'Enter your reg, pick-up and drop-off. We verify your vehicle and give you an instant indicative price.',
  },
  {
    n: 2,
    title: 'Pick a time',
    body:
      'Now, later today, or next week. Choose the day and pick-up window that suits you best.',
  },
  {
    n: 3,
    title: 'We confirm & dispatch',
    body:
      'Our team confirms availability and the final price with you, then dispatches the nearest vetted recovery driver.',
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
