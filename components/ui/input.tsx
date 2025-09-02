// components/ui/input.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Eye, EyeOff, X } from 'lucide-react'

export type FieldSize = 'sm' | 'md' | 'lg'

export interface InputProps
  // WICHTIG: 'size' UND 'prefix' aus den HTML Props ausschließen
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Label oberhalb */
  label?: string
  /** Kleine Beschreibung unterhalb */
  description?: string
  /** Fehlermeldung (setzt aria-invalid etc.) */
  error?: string
  /** Linkes Icon innerhalb des Feldes (dekorativ) */
  leftIcon?: React.ReactNode
  /** Rechtes Icon innerhalb des Feldes (dekorativ) */
  rightIcon?: React.ReactNode
  /** Inhalt direkt links IM Feld (z.B. „€“, „+49“) */
  prefix?: React.ReactNode
  /** Inhalt direkt rechts IM Feld (z.B. „kg“, „cm“) */
  suffix?: React.ReactNode
  /** Grösse der Komponente (keine Kollision mit HTML `size`) */
  fieldSize?: FieldSize
  /** Volle Breite */
  fullWidth?: boolean
  /** Ladeindikator rechts anzeigen */
  loading?: boolean
  /** Clear-Button anzeigen (wenn Wert vorhanden, nicht disabled/readonly) */
  allowClear?: boolean
  /** Bei type="password": Auge zum Ein-/Ausblenden anzeigen */
  revealable?: boolean
  /** Zusätzliche Klassen für Wrapper/Inner/Input */
  containerClassName?: string
  innerClassName?: string
  inputClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      innerClassName,
      inputClassName,
      id,
      type = 'text',
      label,
      description,
      error,
      leftIcon,
      rightIcon,
      prefix,
      suffix,
      fieldSize = 'md',
      fullWidth = true,
      loading = false,
      allowClear = false,
      revealable = true,
      disabled,
      readOnly,
      maxLength,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? `in-${generatedId}`
    const helpId = error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined

    const inputRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    // Für Counter & Clear-Button brauchen wir den aktuellen Wert
    const isControlled = props.value !== undefined
    const [innerValue, setInnerValue] = React.useState<string>(String(props.defaultValue ?? ''))
    const valueStr = String((isControlled ? props.value : innerValue) ?? '')
    const showClear = allowClear && !!valueStr && !disabled && !readOnly && type !== 'password'

    const [reveal, setReveal] = React.useState(false)
    const effectiveType = type === 'password' && revealable ? (reveal ? 'text' : 'password') : type

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (!isControlled) setInnerValue(e.target.value)
      onChange?.(e)
    }

    function clear() {
      if (!inputRef.current) return
      if (isControlled) {
        const t = inputRef.current
        const evt = new Event('input', { bubbles: true })
        Object.defineProperty(evt, 'target', { value: Object.assign(t, { value: '' }), writable: false })
        onChange?.(evt as unknown as React.ChangeEvent<HTMLInputElement>)
      } else {
        inputRef.current.value = ''
        setInnerValue('')
        inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
      }
      inputRef.current.focus()
    }

    const sizeCls =
      fieldSize === 'sm'
        ? { h: 'h-9', text: 'text-sm', px: 'px-3', gap: 'gap-2', icon: 'h-4 w-4', padX: 'px-2' }
        : fieldSize === 'lg'
        ? { h: 'h-12', text: 'text-base', px: 'px-4', gap: 'gap-3', icon: 'h-5 w-5', padX: 'px-3' }
        : { h: 'h-10', text: 'text-sm', px: 'px-3.5', gap: 'gap-2.5', icon: 'h-4.5 w-4.5', padX: 'px-2.5' }

    return (
      <div className={cn(fullWidth && 'w-full', 'space-y-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <div
          className={cn(
            'group/input relative flex items-center',
            sizeCls.h,
            sizeCls.px,
            'rounded-xl border border-input bg-background shadow-sm transition-all',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background',
            error && 'border-red-500 focus-within:ring-red-500',
            disabled && 'opacity-60 cursor-not-allowed',
            innerClassName,
            className
          )}
        >
          {leftIcon && <span className={cn('mr-2 shrink-0 text-muted-foreground', sizeCls.icon)}>{leftIcon}</span>}
          {prefix && <span className={cn('mr-2 shrink-0 text-muted-foreground', sizeCls.padX)}>{prefix}</span>}

          <input
            id={inputId}
            ref={inputRef}
            type={effectiveType}
            className={cn(
              'peer block w-full bg-transparent placeholder:text-muted-foreground outline-none',
              sizeCls.text,
              inputClassName
            )}
            aria-invalid={!!error || undefined}
            aria-describedby={helpId}
            disabled={disabled}
            readOnly={readOnly}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />

          {suffix && <span className={cn('ml-2 shrink-0 text-muted-foreground', sizeCls.padX)}>{suffix}</span>}
          {loading && <Loader2 aria-hidden className={cn('ml-2 animate-spin text-muted-foreground', sizeCls.icon)} />}

          {type === 'password' && revealable && !disabled && (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="ml-1 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={reveal ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {reveal ? <EyeOff className={sizeCls.icon} /> : <Eye className={sizeCls.icon} />}
            </button>
          )}

          {showClear && (
            <button
              type="button"
              onClick={clear}
              className="ml-1 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Eingabe löschen"
            >
              <X className={sizeCls.icon} />
            </button>
          )}

          {!loading && !showClear && !(type === 'password' && revealable) && rightIcon && (
            <span className={cn('ml-2 shrink-0 text-muted-foreground', sizeCls.icon)}>{rightIcon}</span>
          )}
        </div>

        <div className="flex items-start justify-between">
          <div className="min-h-[1rem]">
            {error ? (
              <p id={helpId} className="text-xs text-red-600">
                {error}
              </p>
            ) : description ? (
              <p id={helpId} className="text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {typeof maxLength === 'number' && (
            <span className="ml-2 text-xs tabular-nums text-muted-foreground">
              {valueStr.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = 'Input'
