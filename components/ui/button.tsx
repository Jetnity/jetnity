'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  // Basisklassen – dein alter Look bleibt erhalten
  'inline-flex items-center justify-center rounded-2xl font-medium transition-all ring-offset-background ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:opacity-50 disabled:pointer-events-none shadow-sm gap-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-900 text-white hover:bg-gray-800',
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        search: 'bg-blue-500 text-white hover:bg-blue-600',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-muted hover:text-muted-foreground',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
        xl: 'h-14 px-6 text-lg',
        icon: 'h-10 w-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shadcn-Pattern: erlaubt polymorphes Rendering (z. B. <Link> als Button) */
  asChild?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        // bei asChild ist das Ref technisch ein anderes Element – das ist ok
        ref={ref as any}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        // disabled nur sinnvoll, wenn es wirklich ein <button> ist
        {...(!asChild ? { disabled: isLoading || (props as any).disabled } : {})}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {!isLoading && leftIcon ? <span className="mr-1">{leftIcon}</span> : null}
        <span className="inline-flex items-center">{children}</span>
        {!isLoading && rightIcon ? <span className="ml-1">{rightIcon}</span> : null}
      </Comp>
    )
  }
)
Button.displayName = 'Button'
