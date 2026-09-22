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
    // Fokusring kommt vom nativen Input via peer-focus-visible.
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
        true: 'border-danger-600 ring-danger-600',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  }
)

/**
 * Trefferflaeche um die sichtbare Box.
 *
 * Die Box selbst ist je nach Groesse nur 16 bis 24 px gross und damit als
 * Fingerziel zu klein. Der bedienbare Bereich ist deshalb 44 px gross und wird
 * per negativem Rand wieder auf die Groesse der Box zurueckgerechnet: das
 * Layout bleibt unveraendert, nur die Trefferflaeche waechst.
 *
 * Das native Input liegt auf dieser Flaeche (opacity 0). Es ist das einzige
 * interaktive Kontrollkaestchen — kein zweites role=checkbox, kein extra Toggle.
 */
const hit = cva('relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full', {
  variants: {
    size: {
      sm: '-m-3.5',
      md: '-m-3',
      lg: '-m-2.5',
    },
  },
  defaultVariants: { size: 'md' },
})

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
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const inputRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const isControlled = typeof checked !== 'undefined'
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(!!defaultChecked)

    const isIndet = checked === 'indeterminate'
    const isChecked = isControlled ? checked === true : uncontrolledChecked

    React.useEffect(() => {
      if (!inputRef.current) return
      inputRef.current.indeterminate = isIndet
    }, [isIndet])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      const next = event.target.checked
      if (!isControlled) setUncontrolledChecked(next)
      onCheckedChange?.(next)
    }

    const control = (
      <span
        data-checkbox-hit=""
        className={cn(hit({ size }), disabled && 'cursor-not-allowed')}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          {...(isControlled ? { checked: checked === true } : { defaultChecked })}
          {...inputProps}
          onChange={handleChange}
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          data-state={isIndet ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
          className={cn(
            box({ size, invalid }),
            'pointer-events-none',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
            disabled && 'opacity-50',
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
      </span>
    )

    return (
      <div className={cn('flex flex-col', containerClassName)}>
        {label ? (
          <label className="inline-flex items-center gap-2" htmlFor={inputId}>
            {control}
            <span className={cn('text-sm leading-5', disabled && 'opacity-70')}>{label}</span>
          </label>
        ) : (
          control
        )}

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
