import { Link } from '@tanstack/react-router'
import { Logo } from './logo'
import { SITE_NAME, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '~/lib/site'

export function Footer() {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface">
      <div className="container-app py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="col-span-2 max-w-[320px] md:col-span-1">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed opacity-70">
              Pay-as-you-go vehicle recovery across England, Scotland and Wales — no yearly
              subscription, no upfront payment.
            </p>
          </div>
          <div>
            <div className="mb-4 text-[13px] font-bold uppercase tracking-wider opacity-85">Book</div>
            <Link to="/quote" className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100">
              Get a quote
            </Link>
            <a
              href={SUPPORT_PHONE_TEL}
              className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              Call {SUPPORT_PHONE_DISPLAY}
            </a>
          </div>
          <div>
            <div className="mb-4 text-[13px] font-bold uppercase tracking-wider opacity-85">Legal</div>
            <Link to="/terms" className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100">
              Terms of service
            </Link>
            <Link to="/privacy" className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100">
              Privacy policy
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6 text-xs opacity-55">
          <span>© 2026 {SITE_NAME}</span>
          <span>Part of the TowMyCar recovery network</span>
        </div>
      </div>
    </footer>
  )
}
