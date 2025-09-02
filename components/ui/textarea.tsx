'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  /** Fehlermeldung → roter Rahmen & aria-invalid */
  error?: string
  /** Kleiner Hinweistext unter dem Feld */
  hint?: React.ReactNode
  /** Sichtbares Label (optional) */
  label?: React.ReactNode
  /** Resize-Verhalten: none | vertical | auto(=autogrow) */
  resize?: 'none' | 'vertical' | 'auto'
  /** Auto-Grow explizit (standard: true bei resize="auto") */
  autoGrow?: boolean
  /** Min./Max.-Zeilen fürs Auto-Grow */
  minRows?: number
  maxRows?: number
  /** Zähler zeigen (default: true, wenn maxLength gesetzt ist) */
  showCount?: boolean
  /** Bequemeres onChange */
  onChange?: (value: string) => void
}

const lineHeightPx = (el: HTMLElement) => {
  const lh = window.getComputedStyle(el).lineHeight
  const n = Number(lh.replace('px', ''))
  return Number.isFinite(n) && n > 0 ? n : 20
}

const _Textarea = (
  {
    className,
    error,
    hint,
    label,
    resize = 'auto',
    autoGrow,
    minRows = 3,
    maxRows,
    showCount,
    maxLength,
    onChange,
    id: idProp,
    value,
    defaultValue,
    ...props
  }: TextareaProps,
  ref: React.Ref<HTMLTextAreaElement>
) => {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null)
  const mergedRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
    },
    [ref]
  )

  const reactId = React.useId()
  const id = idProp ?? `ta-${reactId}`

  const isAuto = resize === 'auto' || autoGrow === true || autoGrow === undefined
  const showCounter = showCount ?? typeof maxLength === 'number'

  const grow = React.useCallback(() => {
    const el = internalRef.current
    if (!el || !isAuto) return
    const lh = lineHeightPx(el)
    const minH = Math.max(minRows, 1) * lh
    const maxH = typeof maxRows === 'number' && maxRows > 0 ? maxRows * lh : Infinity
    el.style.height = 'auto'
    const next = Math.min(Math.max(el.scrollHeight, minH), maxH)
    el.style.height = `${next}px`
  }, [isAuto, minRows, maxRows])

  React.useEffect(() => {
    grow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (value !== undefined) grow()
  }, [value, grow])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
    if (value === undefined) grow()
  }

  const base =
    'flex w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm ' +
    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

  const border = error ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
  const resizeCls =
    resize === 'none' ? 'resize-none' : resize === 'vertical' ? 'resize-y' : 'resize-none'
  const rows = Math.max(minRows, 1)

  const currentLength =
    typeof value === 'string'
      ? value.length
      : typeof defaultValue === 'string'
      ? defaultValue.length
      : 0

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          id={id}
          ref={mergedRef}
          rows={rows}
          className={cn(base, border, resizeCls, 'min-h-[80px]', className)}
          aria-invalid={!!error || undefined}
          value={value as any}
          defaultValue={defaultValue as any}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />

        {showCounter && typeof maxLength === 'number' && (
          <div className="pointer-events-none absolute bottom-1.5 right-2 rounded bg-background/70 px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {currentLength}/{maxLength}
          </div>
        )}
      </div>

      {(hint || error) && (
        <div className="mt-1 text-xs">
          {error ? (
            <p className="text-destructive">{error}</p>
          ) : (
            hint && <p className="text-muted-foreground">{hint}</p>
          )}
        </div>
      )}
    </div>
  )
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(_Textarea)
Textarea.displayName = 'Textarea'
