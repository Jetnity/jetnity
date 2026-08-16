'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/**
 * Schaltflaeche.
 *
 * `default` traegt die auffaellige Markenflaeche. Ohne Angabe steht hier immer
 * die Hauptaktion einer Maske – Anmelden, Konto erstellen, Passwort setzen –,
 * und die darf nicht wie eine Nebenaktion aussehen. Vorher lag auf `default`
 * die gedaempfte Sekundaerflaeche, wodurch genau diese Aktionen zurueckwichen.
 *
 * Nebenaktionen bekommen `outline` (Rahmen) oder `ghost` (nur bei Zeigen),
 * gefaehrliche `destructive`. Weitere Varianten kommen dazu, wenn eine
 * Oberflaeche sie braucht; ungenutzte Varianten muessten sonst bei jeder
 * Farbaenderung mitgeprueft werden, ohne je gezeigt zu werden.
 *
 * Die Hoehen folgen der Regel aus dem Designsystem: Hauptaktionen sind auf
 * Touch mindestens 44 px hoch. `min-h` statt `h`, damit umbrechende
 * Aufschriften nicht ueber den Rand laufen. Geraete mit Maus erhalten ueber
 * `pointer-fine` die kompaktere Hoehe – ein Mauszeiger trifft genauer als eine
 * Fingerkuppe.
 *
 * Props: isLoading, loadingText, leftIcon, rightIcon, asChild
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all ring-offset-background disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 btn-premium shadow-e1',
        outline: 'border border-input bg-background hover:bg-muted/60',
        ghost: 'hover:bg-muted/60',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      // Der Radius liegt nur hier, nicht zusaetzlich in den Varianten: Sonst
      // setzen beide `rounded-*` und es entscheidet die Auflaesungsreihenfolge
      // von twMerge, welcher gilt.
      size: {
        default: 'min-h-11 px-4 py-2 rounded-lg pointer-fine:min-h-0 pointer-fine:h-10',
        sm: 'min-h-11 px-3 rounded-md pointer-fine:min-h-0 pointer-fine:h-9',
        icon: 'h-11 w-11 rounded-lg pointer-fine:h-10 pointer-fine:w-10',
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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        {content}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button }
