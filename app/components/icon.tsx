import * as React from 'react'

export type IconName =
  | 'arrow-right' | 'arrow-left' | 'arrow-up-right'
  | 'check' | 'phone' | 'menu' | 'x'
  | 'truck' | 'battery' | 'fuel' | 'wrench' | 'zap' | 'car'
  | 'lock' | 'upload' | 'clock' | 'spark' | 'shield' | 'star'
  | 'map-pin' | 'plus' | 'pound'

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'stroke'> {
  name: IconName
  size?: number
  stroke?: number
}

export function Icon({ name, size = 18, stroke = 1.8, ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  }
  switch (name) {
    case 'arrow-right':
      return <svg {...common}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
    case 'arrow-left':
      return <svg {...common}><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>
    case 'arrow-up-right':
      return <svg {...common}><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>
    case 'check':
      return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>
    case 'phone':
      return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
    case 'menu':
      return <svg {...common}><path d="M4 7h16"/><path d="M4 17h16"/></svg>
    case 'x':
      return <svg {...common}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    case 'truck':
      return <svg {...common}><path d="M14 18V6H1v12h2"/><path d="M14 8h5l4 4v6h-5"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>
    case 'battery':
      return <svg {...common}><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="m11 10-2 4h3l-2 4"/></svg>
    case 'fuel':
      return <svg {...common}><path d="M3 22V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v18"/><path d="M3 14h11"/><path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8L18 4"/></svg>
    case 'wrench':
      return <svg {...common}><path d="M14.7 6.3a4.5 4.5 0 0 0 5.7 5.7l-1.2 1.2-2.5 2.5-7.5 7.5a2.1 2.1 0 0 1-3-3L13.7 13l2.5-2.5 1.2-1.2"/></svg>
    case 'zap':
      return <svg {...common}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>
    case 'car':
      return <svg {...common}><path d="M5 17h14l-1.5-6.5a2 2 0 0 0-2-1.5H8.5a2 2 0 0 0-2 1.5L5 17Z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>
    case 'lock':
      return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>
    case 'upload':
      return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8 12 3 7 8"/><path d="M12 3v12"/></svg>
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    case 'spark':
      return <svg {...common}><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/></svg>
    case 'shield':
      return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
    case 'star':
      return <svg {...common} fill="currentColor"><path d="m12 2 3 7 7 .9-5.1 4.9 1.5 7.2L12 18l-6.4 4 1.5-7.2L2 9.9 9 9z"/></svg>
    case 'map-pin':
      return <svg {...common}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    case 'plus':
      return <svg {...common}><path d="M12 5v14"/><path d="M5 12h14"/></svg>
    case 'pound':
      return <svg {...common}><path d="M18 7c0-2.5-2-4-5-4s-5 1.5-5 4v3"/><path d="M5 13h11"/><path d="M5 21h13c1 0 2-.5 2-2"/><path d="M9 13c0 4-1 6-3 8"/></svg>
    default:
      return null
  }
}
