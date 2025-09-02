'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export interface MultiSelectOption {
  label: string
  value: string | number
  disabled?: boolean
  description?: string
  group?: string
}

export interface MultiSelectProps {
  options?: MultiSelectOption[]
  onSearchOptions?: (query: string) => Promise<MultiSelectOption[]>

  values?: (string | number)[]
  defaultValues?: (string | number)[]
  onValuesChange?: (values: string[]) => void

  placeholder?: string
  label?: string
  description?: string
  error?: string

  maxSelected?: number
  clearable?: boolean
  searchable?: boolean
  disabled?: boolean
  loading?: boolean

  name?: string
  id?: string
  className?: string
  containerClassName?: string
  contentMaxHeight?: number
}

function useControlledArray(
  controlled: string[] | undefined,
  defaultValues?: (string | number)[],
) {
  const [internal, setInternal] = React.useState<string[]>((defaultValues ?? []).map(String))
  const isControlled = controlled !== undefined
  return {
    values: isControlled ? controlled! : internal,
    setValues: (next: string[]) => (isControlled ? undefined : setInternal(next)),
    isControlled,
  }
}

export default function MultiSelect({
  options = [],
  onSearchOptions,
  values: controlledValues,
  defaultValues,
  onValuesChange,
  placeholder = 'Auswählen …',
  label,
  description,
  error,
  maxSelected,
  clearable = true,
  searchable = true,
  disabled = false,
  loading = false,
  name,
  id,
  className,
  containerClassName,
  contentMaxHeight = 320,
}: MultiSelectProps) {
  const labelId = React.useId()
  const triggerId = id ?? React.useId()

  const { values, setValues, isControlled } = useControlledArray(
    controlledValues?.map(String),
    defaultValues,
  )
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [asyncOpts, setAsyncOpts] = React.useState<MultiSelectOption[] | null>(null)
  const [asyncLoading, setAsyncLoading] = React.useState(false)

  const hiddenContainerRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (!name || !hiddenContainerRef.current) return
    hiddenContainerRef.current.innerHTML = ''
    values.forEach((v) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name.endsWith('[]') ? name : `${name}[]`
      input.value = v
      hiddenContainerRef.current?.appendChild(input)
    })
  }, [values, name])

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

  const selectedObjects = filtered
    .concat(options)
    .filter((o, idx, arr) => arr.findIndex((x) => x.value === o.value) === idx)
    .filter((o) => values.includes(String(o.value)))

  function toggleValue(v: string) {
    const exists = values.includes(v)
    let next = exists ? values.filter((x) => x !== v) : [...values, v]
    if (maxSelected && next.length > maxSelected) next = next.slice(0, maxSelected)
    if (!isControlled) setValues(next)
    onValuesChange?.(next)
  }

  function clearAll() {
    if (!isControlled) setValues([])
    onValuesChange?.([])
  }

  const hasError = Boolean(error)

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

      {name && <div ref={hiddenContainerRef} />}

      <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery('') }}>
        <Popover.Trigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled || loading}
            className={cn(
              'w-full rounded-xl border text-left text-sm shadow-sm transition outline-none',
              'focus:ring-2 focus:ring-primary',
              hasError ? 'border-destructive/70' : 'border-border',
              'bg-background hover:bg-muted/30',
              'min-h-[2.75rem] px-3 py-2',
              (disabled || loading) && 'opacity-60 cursor-not-allowed',
              className,
            )}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {values.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <>
                  {selectedObjects.slice(0, 4).map((o) => (
                    <Badge
                      key={String(o.value)}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {o.label}
                      <X
                        className="h-3.5 w-3.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleValue(String(o.value))
                        }}
                      />
                    </Badge>
                  ))}
                  {values.length > 4 && <Badge variant="outline">+{values.length - 4}</Badge>}
                </>
              )}
              <div className="ml-auto flex items-center gap-1">
                {clearable && values.length > 0 && !disabled && !loading && (
                  <button
                    type="button"
                    className="rounded-md p-1 -mr-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Alle löschen"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearAll()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {(loading || asyncLoading) && (
                  <Loader2 className="h-4 w-4 animate-spin opacity-70" aria-hidden />
                )}
                <ChevronDown className="h-4 w-4 opacity-80" aria-hidden />
              </div>
            </div>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            className={cn(
              'z-50 min-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg',
            )}
          >
            <div className="p-2" style={{ maxHeight: contentMaxHeight }}>
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
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && query === '' && values.length > 0) {
                          toggleValue(values[values.length - 1])
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-1 max-h-[var(--ms-height,320px)] overflow-auto pr-1" style={{ ['--ms-height' as any]: `${contentMaxHeight}px` }}>
                {asyncLoading ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
                  </div>
                ) : baseOptions.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground">Keine Treffer.</div>
                ) : (
                  baseOptions.map((opt) => {
                    const v = String(opt.value)
                    const checked = values.includes(v)
                    return (
                      <button
                        key={v}
                        type="button"
                        className={cn(
                          'w-full text-left px-2.5 py-2 rounded-md text-sm',
                          'hover:bg-muted focus:bg-muted outline-none',
                          opt.disabled && 'opacity-50 cursor-not-allowed',
                        )}
                        onClick={() => !opt.disabled && toggleValue(v)}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox checked={checked} onCheckedChange={() => toggleValue(v)} />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span>{opt.label}</span>
                              {checked && <Check className="h-4 w-4" />}
                            </div>
                            {opt.description && (
                              <span className="text-xs text-muted-foreground">{opt.description}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              <div className="p-2 pt-1 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Schließen
                </Button>
                {clearable && values.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Alle löschen
                  </Button>
                )}
                <Button size="sm" onClick={() => setOpen(false)}>
                  Übernehmen
                </Button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {hasError && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
