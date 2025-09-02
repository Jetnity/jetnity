'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/**
 * Pro-Button (shadcn-kompatibel) – rückwärtskompatibel:
 * - Varianten: default, primary, secondary, soft, outline, ghost, destructive, danger, warning, link, success
 * - Größen: xs, sm, default, lg, icon
 * - Props: isLoading, loadingText, leftIcon, rightIcon, asChild
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all ring-offset-background disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md',
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 btn-premium shadow-e1 rounded-md',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md',
        soft: 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 rounded-md',
        outline: 'border border-input bg-background hover:bg-muted/60 rounded-md',
        ghost: 'hover:bg-muted/60 rounded-md',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md', // alias
        warning: 'bg-amber-500 text-white hover:bg-amber-600 rounded-md',
        link: 'text-primary underline-offset-4 hover:underline',
        // ➜ NEU: success (grün)
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 rounded-md',
      },
      size: {
        xs: 'h-8 px-2.5 rounded-md text-xs',
        sm: 'h-9 px-3 rounded-md',
        default: 'h-10 px-4 py-2 rounded-lg',
        lg: 'h-11 px-5 rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  disabled?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const content = (
      <>
        {/* Left icon / Spinner */}
        {isLoading ? (
          <Loader2 className={cn('mr-2 h-4 w-4 animate-spin', size === 'xs' && 'h-3.5 w-3.5')} />
        ) : (
          leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>
        )}

        {/* Label */}
        <span>{isLoading && loadingText ? loadingText : children}</span>

        {/* Right icon (nur wenn nicht lädt) */}
        {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
      </>
    )

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        aria-busy={isLoading || undefined}
        disabled={disabled || isLoading}
        {...props}
      >
        {variant === 'link' ? children : content}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button }
