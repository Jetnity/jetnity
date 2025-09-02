// components/ui/checkbox.tsx
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Indeterminate = boolean | 'indeterminate'

/** sichtbare Box (ohne disabled-Variante – die stylen wir separat, siehe unten) */
const box = cva(
  [
    'inline-flex items-center justify-center rounded-[4px] border',
    'bg-background text-foreground',
    'outline-none select-none transition',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
    // optisch konsistent mit shadcn
    'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-4 w-4 text-[10px]',
        md: 'h-5 w-5 text-[12px]',
        lg: 'h-6 w-6 text-[14px]',
      },
      invalid: {
        true: 'border-destructive ring-destructive',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  }
)

export interface CheckboxProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'checked' | 'onChange' | 'size'
    >,
    VariantProps<typeof box> {
  /** controlled: true | false | 'indeterminate' */
  checked?: Indeterminate
  /** uncontrolled initial value (falls `checked` nicht gesetzt) */
  defaultChecked?: boolean
  /** Callback mit boolean (bei indeterminate → true beim Klick) */
  onCheckedChange?: (next: boolean) => void
  /** Optionaler Label-Text rechts neben der Box */
  label?: React.ReactNode
  /** Optional: kleine Erklärung unter dem Label */
  description?: React.ReactNode
  /** Klassen für den äußeren Wrapper */
  containerClassName?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      containerClassName,
      label,
      description,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      size,
      invalid,
      id,
      ...inputProps
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    // indeterminate an das native input weiterreichen
    React.useEffect(() => {
      if (!inputRef.current) return
      inputRef.current.indeterminate = checked === 'indeterminate'
    }, [checked])

    const isControlled = typeof checked !== 'undefined'
    const isChecked = checked === true || (!isControlled && !!defaultChecked)
    const isIndet = checked === 'indeterminate'

    const toggle = () => {
      if (disabled) return
      const next = isIndet ? true : !isChecked
      onCheckedChange?.(next)
      if (!isControlled && inputRef.current) {
        inputRef.current.checked = next
        inputRef.current.indeterminate = false
      }
    }

    return (
      <div className={cn('flex flex-col', containerClassName)}>
        <label className="inline-flex items-center gap-2">
          {/* sichtbare Box */}
          <span
            role="checkbox"
            aria-checked={isIndet ? 'mixed' : isChecked}
            aria-disabled={disabled || undefined}
            data-state={isIndet ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
            tabIndex={disabled ? -1 : 0}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                toggle()
              }
            }}
            className={cn(
              box({ size, invalid }),
              disabled && 'opacity-50 cursor-not-allowed',
              (isChecked || isIndet) && 'border-primary bg-primary text-primary-foreground',
              className
            )}
          >
            {isIndet ? (
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            ) : isChecked ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : null}
          </span>

          {/* Label */}
          {label ? (
            <span
              className={cn('text-sm leading-5', disabled && 'opacity-70')}
              onClick={toggle}
            >
              {label}
            </span>
          ) : null}

          {/* echtes, unsichtbares Input */}
          <input
            ref={inputRef}
            id={id}
            type="checkbox"
            className="sr-only"
            disabled={disabled}
            {...(isControlled ? { checked: checked === true } : { defaultChecked })}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            {...inputProps}
          />
        </label>

        {description ? (
          <p className={cn('ms-6 mt-1 text-xs text-muted-foreground', disabled && 'opacity-70')}>
            {description}
          </p>
        ) : null}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'
