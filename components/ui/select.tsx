'use client'

import * as React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDown, Check, X, Loader2, Search } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  description?: string
  group?: string
  leftIcon?: React.ReactNode
}

export interface SelectProps {
  options?: SelectOption[]
  onSearchOptions?: (query: string) => Promise<SelectOption[]>

  value?: string | number
  defaultValue?: string | number
  onValueChange?: (value: string) => void

  placeholder?: string
  label?: string
  description?: string
  error?: string

  variant?: 'outline' | 'solid' | 'soft' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  radius?: 'md' | 'lg' | 'xl' | '2xl'
  compact?: boolean

  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  disabled?: boolean

  name?: string
  id?: string
  containerClassName?: string
  className?: string
  contentMaxHeight?: number
  portal?: boolean

  renderOption?: (opt: SelectOption) => React.ReactNode
  renderEmpty?: (query: string) => React.ReactNode
}

function triggerClasses({
  variant,
  size,
  radius,
  hasError,
  compact,
  loading,
  disabled,
}: {
  variant: NonNullable<SelectProps['variant']>
  size: NonNullable<SelectProps['size']>
  radius: NonNullable<SelectProps['radius']>
  hasError: boolean
  compact?: boolean
  loading?: boolean
  disabled?: boolean
}) {
  const base =
    'w-full inline-flex items-center justify-between gap-2 outline-none transition rounded border text-sm shadow-sm ' +
    'focus:ring-2 focus:ring-primary data-[state=open]:ring-2 data-[state=open]:ring-primary ' +
    'disabled:opacity-60 disabled:cursor-not-allowed'
  const pad = compact
    ? { sm: 'h-9 px-3', md: 'h-10 px-3', lg: 'h-11 px-3.5' }[size]
    : { sm: 'h-10 px-3.5', md: 'h-12 px-4', lg: 'h-14 px-4.5' }[size]
  const rad = { md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', '2xl': 'rounded-2xl' }[
    radius
  ]
  const palette: Record<NonNullable<SelectProps['variant']>, string> = {
    outline: 'bg-background border-border hover:bg-muted/30',
    solid: 'bg-muted border-transparent hover:bg-muted/80',
    soft: 'bg-background/60 border-border/70 backdrop-blur hover:bg-background/80',
    ghost: 'bg-transparent border-transparent hover:bg-muted/30',
  }
  const errorRing = hasError ? 'border-destructive/70 focus:ring-destructive' : ''
  const loadingCls = loading ? 'cursor-progress' : ''
  return cn(base, pad, rad, palette[variant], errorRing, loadingCls, disabled ? '' : '')
}

function itemClasses(disabled?: boolean) {
  return cn(
    'relative flex select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none',
    'data-[highlighted]:bg-muted data-[highlighted]:text-foreground',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
  )
}

function groupOptions(options: SelectOption[]) {
  const map = new Map<string | undefined, SelectOption[]>()
  for (const o of options) map.set(o.group, [...(map.get(o.group) ?? []), o])
  return [...map.entries()].map(([group, items]) => ({ group, items }))
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    options = [],
    onSearchOptions,
    value,
    defaultValue,
    onValueChange,
    placeholder = 'Bitte auswählen',
    label,
    description,
    error,
    variant = 'outline',
    size = 'md',
    radius = 'xl',
    compact = false,
    searchable = true,
    clearable = true,
    loading = false,
    disabled = false,
    name,
    id,
    containerClassName,
    className,
    contentMaxHeight = 320,
    portal = true,
    renderOption,
    renderEmpty,
  },
  _ref,
) {
  const labelId = React.useId()
  const triggerId = id ?? React.useId()
  const [internal, setInternal] = React.useState<string | undefined>(
    value != null ? String(value) : defaultValue != null ? String(defaultValue) : undefined,
  )
  const controlled = value !== undefined
  const currentValue = controlled ? (value != null ? String(value) : '') : internal ?? ''
  const hasError = Boolean(error)

  const [query, setQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [asyncOpts, setAsyncOpts] = React.useState<SelectOption[] | null>(null)
  const [asyncLoading, setAsyncLoading] = React.useState(false)

  const hiddenRef = React.useRef<HTMLInputElement | null>(null)
  React.useEffect(() => {
    if (hiddenRef.current) hiddenRef.current.value = currentValue ?? ''
  }, [currentValue])

  React.useEffect(() => {
    let active = true
    const run = async () => {
      if (!onSearchOptions) return
      setAsyncLoading(true)
      try {
        const res = await onSearchOptions(query)
        if (active) setAsyncOpts(res)
      } catch {
        if (active) setAsyncOpts([])
      } finally {
        if (active) setAsyncLoading(false)
      }
    }
    const t = setTimeout(run, 250)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [query, onSearchOptions])

  const baseOptions = onSearchOptions ? asyncOpts ?? [] : options

  const filtered = React.useMemo(() => {
    if (onSearchOptions) return baseOptions
    if (!searchable || !query.trim()) return baseOptions
    const q = query.toLowerCase()
    return baseOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        (o.group && o.group.toLowerCase().includes(q)),
    )
  }, [baseOptions, onSearchOptions, searchable, query])

  const groups = React.useMemo(() => groupOptions(filtered), [filtered])

  function handleChange(next: string) {
    if (!controlled) setInternal(next)
    onValueChange?.(next)
  }

  const selected = baseOptions.find((o) => String(o.value) === currentValue)

  return (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      {(label || description) && (
        <div className="flex items-end justify-between">
          {label && (
            <label htmlFor={triggerId} id={labelId} className="block text-sm font-medium">
              {label}
            </label>
          )}
          {description && <span className="text-xs text-muted-foreground ml-3">{description}</span>}
        </div>
      )}

      {name ? <input ref={hiddenRef} type="hidden" name={name} value={currentValue} /> : null}

      <RadixSelect.Root
        value={currentValue}
        onValueChange={handleChange}
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setQuery('')
        }}
        disabled={disabled || loading}
      >
        <RadixSelect.Trigger
          id={triggerId}
          aria-labelledby={label ? labelId : undefined}
          className={cn(
            triggerClasses({
              variant,
              size,
              radius,
              hasError,
              compact,
              loading: loading || asyncLoading,
              disabled: disabled || loading,
            }),
            className,
          )}
          ref={_ref}
        >
          <RadixSelect.Value
            placeholder={<span className="text-muted-foreground">{placeholder}</span>}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selected?.leftIcon && <span className="shrink-0">{selected.leftIcon}</span>}
              <span className="truncate">{selected?.label ?? ''}</span>
            </div>
          </RadixSelect.Value>
          <div className="flex items-center gap-1 pl-2">
            {(loading || asyncLoading) && (
              <Loader2 className="h-4 w-4 animate-spin opacity-70" aria-hidden />
            )}
            {clearable && !!currentValue && !disabled && !loading && !asyncLoading && (
              <button
                type="button"
                className="rounded-md p-1 -mr-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Auswahl zurücksetzen"
                onClick={(e) => {
                  e.stopPropagation()
                  handleChange('')
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <RadixSelect.Icon>
              <ChevronDown className="h-4 w-4 opacity-80" aria-hidden />
            </RadixSelect.Icon>
          </div>
        </RadixSelect.Trigger>

        {portal ? (
          <RadixSelect.Portal>
            <SelectContent
              searchable={searchable}
              query={query}
              setQuery={setQuery}
              groups={groups}
              maxHeight={contentMaxHeight}
              asyncLoading={asyncLoading}
              renderOption={renderOption}
              renderEmpty={renderEmpty}
            />
          </RadixSelect.Portal>
        ) : (
          <SelectContent
            searchable={searchable}
            query={query}
            setQuery={setQuery}
            groups={groups}
            maxHeight={contentMaxHeight}
            asyncLoading={asyncLoading}
            renderOption={renderOption}
            renderEmpty={renderEmpty}
          />
        )}
      </RadixSelect.Root>

      {hasError && (
        <p className="text-xs text-destructive" id={`${triggerId}-error`}>
          {error}
        </p>
      )}
    </div>
  )
})

function SelectContent({
  searchable,
  query,
  setQuery,
  groups,
  maxHeight,
  asyncLoading,
  renderOption,
  renderEmpty,
}: {
  searchable: boolean
  query: string
  setQuery: (q: string) => void
  groups: { group?: string; items: SelectOption[] }[]
  maxHeight: number
  asyncLoading: boolean
  renderOption?: (opt: SelectOption) => React.ReactNode
  renderEmpty?: (q: string) => React.ReactNode
}) {
  const empty = groups.every((g) => g.items.length === 0)
  return (
    <RadixSelect.Content
      position="popper"
      sideOffset={8}
      className={cn(
        'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg',
        'data-[side=bottom]:animate-in data-[side=bottom]:fade-in-0 data-[side=bottom]:zoom-in-95',
        'data-[side=top]:animate-in data-[side=top]:fade-in-0 data-[side=top]:zoom-in-95',
      )}
    >
      <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1">
        <ChevronDown className="h-4 w-4 rotate-180" />
      </RadixSelect.ScrollUpButton>

      <RadixSelect.Viewport className="p-2" style={{ maxHeight }}>
        {searchable && (
          <div className="p-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suchen…"
                className="pl-8 h-9"
                autoFocus
              />
            </div>
          </div>
        )}

        {asyncLoading ? (
          <div className="px-3 py-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
          </div>
        ) : empty ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">
            {renderEmpty ? renderEmpty(query) : 'Keine Treffer.'}
          </div>
        ) : (
          groups.map(({ group, items }, gi) => (
            <RadixSelect.Group key={group ?? `__group-${gi}`}>
              {group && (
                <div className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                  {group}
                </div>
              )}
              {items.map((opt) => (
                <RadixSelect.Item
                  key={String(opt.value)}
                  value={String(opt.value)}
                  disabled={opt.disabled}
                  className={itemClasses(opt.disabled)}
                >
                  <RadixSelect.ItemIndicator className="absolute left-2 inline-flex">
                    <Check className="h-4 w-4" />
                  </RadixSelect.ItemIndicator>
                  <div className="ml-6 mr-2 flex items-center gap-2">
                    {opt.leftIcon && <span className="shrink-0">{opt.leftIcon}</span>}
                    <div className="flex flex-col">
                      <RadixSelect.ItemText>
                        {renderOption ? renderOption(opt) : opt.label}
                      </RadixSelect.ItemText>
                      {opt.description && (
                        <span className="text-xs text-muted-foreground leading-snug">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>
                </RadixSelect.Item>
              ))}
              {gi < groups.length - 1 && <div className="my-2 h-px bg-border/80" />}
            </RadixSelect.Group>
          ))
        )}
      </RadixSelect.Viewport>

      <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1">
        <ChevronDown className="h-4 w-4" />
      </RadixSelect.ScrollDownButton>
    </RadixSelect.Content>
  )
}

Select.displayName = 'Select'

export default Select
