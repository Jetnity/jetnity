'use client'

import * as React from 'react'
import { Switch as HSwitch } from '@headlessui/react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'
type Variant = 'default' | 'success' | 'warning' | 'info' | 'danger'

export interface SwitchProps {
  /** Controlled: aktueller Zustand */
  checked?: boolean
  /** Uncontrolled: initialer Zustand */
  defaultChecked?: boolean
  /** Callback bei Änderungen */
  onCheckedChange?: (checked: boolean) => void

  /** Optionales sichtbares Label (klickbar) */
  label?: React.ReactNode
  /** Position des Labels */
  labelPosition?: 'left' | 'right'
  /** Optionale sekundäre Beschreibung unter dem Label */
  description?: React.ReactNode
  /** Screenreader-Label (falls kein sichtbares Label gesetzt ist) */
  srLabel?: string

  /** Formular-Integration: Name & Value (hidden input) */
  name?: string
  value?: string | number

  /** Optik/Größe */
  size?: Size
  variant?: Variant
  className?: string
  id?: string

  /** Interaktivität */
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
}

const SIZE: Record<Size, { track: string; thumb: string; onX: string; offX: string }> = {
  sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', onX: 'translate-x-4', offX: 'translate-x-1' },
  md: { track: 'h-6 w-11', thumb: 'h-5 w-5', onX: 'translate-x-5', offX: 'translate-x-1' },
  lg: { track: 'h-7 w-14', thumb: 'h-6 w-6', onX: 'translate-x-7', offX: 'translate-x-1' },
}

const VARIANT_ON: Record<Variant, string> = {
  default: 'bg-primary',
  success: 'bg-emerald-600 dark:bg-emerald-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-600 dark:bg-sky-500',
  danger: 'bg-rose-600 dark:bg-rose-500',
}

const OFF = 'bg-muted-foreground/25 dark:bg-muted/30'

/** Kleines Hook für Controlled/Uncontrolled */
function useControllableBoolean(
  controlled: boolean | undefined,
  defaultValue = false,
  onChange?: (v: boolean) => void
) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const isControlled = controlled !== undefined
  const value = isControlled ? (controlled as boolean) : uncontrolled
  const set = React.useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolled(v)
      onChange?.(v)
    },
    [isControlled, onChange]
  )
  return [value, set] as const
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked: checkedProp,
      defaultChecked,
      onCheckedChange,
      label,
      labelPosition = 'right',
      description,
      srLabel,
      name,
      value,
      size = 'md',
      variant = 'default',
      className,
      id: idProp,
      disabled = false,
      readOnly = false,
      loading = false,
    },
    ref
  ) => {
    const reactId = React.useId()
    const id = idProp ?? `switch-${reactId}`

    const [checked, setChecked] = useControllableBoolean(checkedProp, !!defaultChecked, onCheckedChange)

    const handleChange = (v: boolean) => {
      if (disabled || readOnly || loading) return
      setChecked(v)
    }

    return (
      <HSwitch.Group
        as="div"
        className={cn('inline-flex items-start gap-2', className)}
        data-state={checked ? 'checked' : 'unchecked'}
        data-variant={variant}
        data-disabled={disabled || undefined}
      >
        {label && labelPosition === 'left' && (
          <div className="min-w-0 select-none">
            <HSwitch.Label className={cn('cursor-pointer text-sm font-medium', disabled && 'opacity-60')}>
              {label}
            </HSwitch.Label>
            {description && (
              <HSwitch.Label passive className="mt-0.5 block text-xs text-muted-foreground">
                {description}
              </HSwitch.Label>
            )}
          </div>
        )}

        <div className="relative">
          <HSwitch
            id={id}
            ref={ref}
            checked={checked}
            onChange={handleChange}
            disabled={disabled || loading}
            aria-readonly={readOnly || undefined}
            aria-label={srLabel}
            className={cn(
              'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
              'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60',
              SIZE[size].track,
              checked ? VARIANT_ON[variant] : OFF
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none inline-grid place-items-center rounded-full bg-white shadow',
                'transform transition-transform motion-reduce:transition-none',
                SIZE[size].thumb,
                checked ? SIZE[size].onX : SIZE[size].offX
              )}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </span>
          </HSwitch>

          {/* Hidden input: wird nur im checked-Case submitbar, wie Checkbox-Semantik */}
          {name && checked && (
            <input type="hidden" name={name} value={value?.toString() ?? 'on'} />
          )}
        </div>

        {label && labelPosition === 'right' && (
          <div className="min-w-0 select-none">
            <HSwitch.Label className={cn('cursor-pointer text-sm font-medium', disabled && 'opacity-60')}>
              {label}
            </HSwitch.Label>
            {description && (
              <HSwitch.Label passive className="mt-0.5 block text-xs text-muted-foreground">
                {description}
              </HSwitch.Label>
            )}
          </div>
        )}
      </HSwitch.Group>
    )
  }
)

Switch.displayName = 'Switch'

export default Switch
