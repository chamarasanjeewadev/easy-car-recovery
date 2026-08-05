interface RouteMiniMapProps {
  fromLabel?: string
  toLabel?: string
}

export function RouteMiniMap({ fromLabel, toLabel }: RouteMiniMapProps) {
  return (
    <div className="h-[220px] overflow-hidden rounded-[var(--radius)] bg-surface-c" aria-label="Route map">
      <svg viewBox="0 0 600 220" preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <pattern id="ecr-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#e2e3dd" strokeWidth="0.6" />
          </pattern>
          <linearGradient id="ecr-lime" x1="0" x2="1">
            <stop offset="0" stopColor="#88b000" />
            <stop offset="1" stopColor="#abd535" />
          </linearGradient>
        </defs>
        <rect width="600" height="220" fill="#f3f4ee" />
        <rect width="600" height="220" fill="url(#ecr-grid)" />
        <path d="M0 150 Q150 140 300 120 T600 70" stroke="#d9dbd5" strokeWidth="8" fill="none" />
        <path d="M0 70 Q200 90 350 110 T600 160" stroke="#e8e9e3" strokeWidth="5" fill="none" />
        <path d="M120 0 L160 220" stroke="#e8e9e3" strokeWidth="4" fill="none" />
        <path d="M460 0 L420 220" stroke="#e8e9e3" strokeWidth="4" fill="none" />
        <path
          d="M70 150 Q200 130 320 115 Q440 105 530 75"
          stroke="url(#ecr-lime)"
          strokeWidth="4"
          fill="none"
        />
        <circle cx="70" cy="150" r="9" fill="#1a1c19" />
        <circle cx="70" cy="150" r="14" fill="none" stroke="#1a1c19" strokeWidth="1.5" opacity="0.25" />
        <circle cx="530" cy="75" r="10" fill="#88b000" stroke="#1a1c19" strokeWidth="2.5" />
        {fromLabel && (
          <text x="78" y="174" fontSize="11" fontWeight="700" fill="#1a1c19">
            {fromLabel}
          </text>
        )}
        {toLabel && (
          <text x="538" y="59" fontSize="11" fontWeight="700" fill="#1a1c19" textAnchor="end">
            {toLabel}
          </text>
        )}
      </svg>
    </div>
  )
}
