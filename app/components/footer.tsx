import { Link } from '@tanstack/react-router'
import { Logo } from './logo'
import {
  COMPANY_ADDRESS,
  COMPANY_NAME,
  GOOGLE_REVIEWS_URL,
  SITE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_HREF,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  TOWMYCAR_URL,
  TRUSTPILOT_URL,
} from '~/lib/site'

export function Footer() {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface">
      <div className="container-app py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-[320px] md:col-span-1">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed opacity-70">
              Pay-as-you-go vehicle recovery across England, Scotland and Wales — a fixed price
              online, no yearly subscription.
            </p>
          </div>
          <div>
            <div className="mb-4 text-[13px] font-bold uppercase tracking-wider opacity-85">Book</div>
            <Link to="/quote" className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100">
              Book a recovery
            </Link>
            <a
              href={SUPPORT_PHONE_TEL}
              className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              Call {SUPPORT_PHONE_DISPLAY}
            </a>
            <a
              href={SUPPORT_EMAIL_HREF}
              className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div>
            <div className="mb-4 text-[13px] font-bold uppercase tracking-wider opacity-85">Network</div>
            <a
              href={TOWMYCAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              TowMyCar.uk
            </a>
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              Google reviews
            </a>
            <a
              href={TRUSTPILOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              Trustpilot
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
          <span>
            Part of the TowMyCar network — operated by {COMPANY_NAME}, {COMPANY_ADDRESS}
          </span>
        </div>
      </div>
    </footer>
  )
}
