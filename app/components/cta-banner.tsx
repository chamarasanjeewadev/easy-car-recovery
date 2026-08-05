import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Icon } from './icon'

export function CtaBanner() {
  return (
    <section className="lime-gradient relative overflow-hidden text-on-primary-fixed">
      <div className="container-app grid items-end gap-8 py-20 md:grid-cols-[1.4fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] opacity-90">
            <span className="h-px w-4 bg-current" />
            Ready when you are
          </span>
          <h2 className="mt-3.5 text-[clamp(36px,5vw,60px)] font-bold leading-[1.05] tracking-[-0.025em]">
            One price.
            <br />
            One driver.
            <br />
            One tap.
          </h2>
          <p className="mt-4 max-w-[44ch] text-[17px] opacity-80">
            No memberships, no annual fees. Pay-as-you-go recovery — only when you actually need it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="dark" size="lg" className="bg-on-surface hover:bg-inverse-surface text-white">
              <Link to="/quote">
                Book a recovery <Icon name="arrow-right" size={16} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outlineLight"
              size="lg"
            >
              <a href="tel:08081570111">
                <Icon name="phone" size={16} /> 0808 157 0111
              </a>
            </Button>
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] bg-black/[0.08] p-6 backdrop-blur-md">
          <Row label="Coverage" value="England · Scotland · Wales" />
          <Row label="Operating" value="24 / 7 / 365" />
          <Row label="Avg. response" value="38 minutes" />
          <Row label="Price match" value="Yes — refund on the spot" />
        </div>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 text-sm">
      <span className="opacity-75">{label}</span>
      <strong className="font-bold">{value}</strong>
    </div>
  )
}
