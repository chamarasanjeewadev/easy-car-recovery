import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Icon } from './icon'
import { Logo } from './logo'
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '~/lib/site'

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'How it works', to: '/#how' },
  { label: 'Reviews', to: '/#reviews' },
  { label: 'FAQ', to: '/#faq' },
] as const

export function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const onHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-50 border-b border-surface-high bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70">
      <div className="container-app flex items-center gap-7 py-3.5">
        <Link to="/" className="shrink-0" aria-label="Easy Recovery home">
          <Logo />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.to}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-c hover:text-on-surface ${
                onHome && item.to === '/' ? 'bg-surface-c text-on-surface' : 'text-on-surface-variant'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <a
            href={SUPPORT_PHONE_TEL}
            className="hidden items-center gap-2 rounded-full bg-surface-c px-3.5 py-2 text-[13px] font-semibold text-on-surface transition-colors hover:bg-surface-high sm:inline-flex"
          >
            <Icon name="phone" size={14} /> {SUPPORT_PHONE_DISPLAY}
          </a>
          <Button asChild size="sm">
            <Link to="/quote">Book recovery</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-c text-on-surface transition-colors hover:bg-surface-high md:hidden"
          >
            <Icon name={open ? 'x' : 'menu'} size={20} />
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-surface-high bg-surface px-6 pb-4 pt-2 md:hidden">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.to}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius)] px-3.5 py-3 text-[15px] font-semibold transition-colors hover:bg-surface-c"
            >
              {item.label}
            </a>
          ))}
          <a
            href={SUPPORT_PHONE_TEL}
            className="rounded-[var(--radius)] px-3.5 py-3 text-[15px] font-semibold transition-colors hover:bg-surface-c"
          >
            Call {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      )}
    </header>
  )
}
