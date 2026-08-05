import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[transform,background-color,box-shadow,color] disabled:pointer-events-none disabled:opacity-60 active:translate-y-px',
  {
    variants: {
      variant: {
        primary: 'bg-primary-c text-on-primary-c hover:bg-primary-fixed-dim',
        dark: 'bg-inverse-surface text-inverse-on-surface hover:bg-on-surface',
        tonal: 'bg-surface-c text-on-surface hover:bg-surface-high',
        outline: 'border-[1.5px] border-outline-variant bg-transparent text-on-surface hover:bg-surface-c hover:border-outline',
        ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-c hover:text-on-surface',
        outlineLight: 'border-[1.5px] border-on-primary-fixed bg-transparent text-on-primary-fixed hover:bg-black/5',
      },
      size: {
        default: 'rounded-full px-5 py-3 text-[15px]',
        lg: 'rounded-full px-7 py-4 text-base',
        sm: 'rounded-full px-3.5 py-2 text-[13px]',
        icon: 'rounded-full w-11 h-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
