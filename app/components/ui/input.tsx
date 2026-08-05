import * as React from 'react'
import { cn } from '~/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-[var(--radius)] border-[1.5px] border-transparent bg-surface-c px-4 py-3.5 text-[15px] font-medium placeholder:text-outline transition-[border-color,background-color] focus:border-primary-c focus:bg-white focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
