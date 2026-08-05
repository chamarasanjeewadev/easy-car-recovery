interface LogoProps {
  light?: boolean
  className?: string
}

export function Logo({ light = false, className = '' }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-[17px] font-bold tracking-tight ${
        light ? 'text-inverse-on-surface' : 'text-on-surface'
      } ${className}`}
    >
      <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-primary-c text-[14px] font-extrabold text-on-primary-c">
        E
      </span>
      Easy Recovery
    </span>
  )
}
