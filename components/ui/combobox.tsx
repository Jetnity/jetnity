'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, Loader2, Plus, Search, X, Check } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export interface ComboboxOption {
  label: string
  value: string
  description?: string
}

export interface ComboboxProps {
  options?: ComboboxOption[]
  onSearchOptions?: (query: string) => Promise<ComboboxOption[]>

  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void

  multiple?: boolean
  values?: string[]
  defaultValues?: string[]
  onValuesChange?: (values: string[]) => void

  allowCreate?: boolean
  onCreateOption?: (label: string) => Promise<ComboboxOption | string> | ComboboxOption | string

  placeholder?: string
  label?: string
  description?: string
  error?: string

  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  name?: string
  id?: string
  className?: string
  containerClassName?: string
  contentMaxHeight?: number
}

export default function Combobox({
  options = [],
  onSearchOptions,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  values,
  defaultValues,
  onValuesChange,
  allowCreate = false,
  onCreateOption,
  placeholder = 'Suchen oder erstellen…',
  label,
  description,
  error,
  clearable = true,
  disabled = false,
  loading = false,
  name,
  id,
  className,
  containerClassName,
  contentMaxHeight = 320,
}: ComboboxProps) {
  const labelId = React.useId()
  const triggerId = id ?? React.useId()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [asyncOpts, setAsyncOpts] = React.useState<ComboboxOption[] | null>(null)
  const [asyncLoading, setAsyncLoading] = React.useState(false)
  const isSingle = !multiple

  const [internalSingle, setInternalSingle] = React.useState<string | undefined>(
    value ?? defaultValue,
  )
  const currentSingle = value ?? internalSingle

  const [internalMulti, setInternalMulti] = React.useState<string[]>(defaultValues ?? [])
  const currentMulti = values ?? internalMulti

  const baseOptions = onSearchOptions ? asyncOpts ?? [] : options

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

  const filtered = React.useMemo(() => {
    if (onSearchOptions) return baseOptions
    if (!query.trim()) return baseOptions
    const q = query.toLowerCase()
    return baseOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)),
    )
  }, [baseOptions, onSearchOptions, query])

  function selectSingle(v: string) {
    if (disabled || loading) return
    onValueChange?.(v)
    setInternalSingle(v)
    setOpen(false)
    setQuery('')
  }
  function toggleMulti(v: string) {
    if (disabled || loading) return
    const exists = currentMulti.includes(v)
    const next = exists ? currentMulti.filter((x) => x !== v) : [...currentMulti, v]
    onValuesChange?.(next)
    setInternalMulti(next)
  }

  const selectedSingleObj = isSingle ? baseOptions.find((o) => o.value === currentSingle) : undefined
  const selectedMultiObjs = !isSingle
    ? baseOptions
        .concat(options)
        .filter((o, idx, arr) => arr.findIndex((x) => x.value === o.value) === idx)
        .filter((o) => currentMulti.includes(o.value))
    : []

  const hiddenRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (!name || !hiddenRef.current) return
    hiddenRef.current.innerHTML = ''
    if (isSingle) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = currentSingle ?? ''
      hiddenRef.current.appendChild(input)
    } else {
      currentMulti.forEach((v) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name.endsWith('[]') ? name : `${name}[]`
        input.value = v
        hiddenRef.current!.appendChild(input)
      })
    }
  }, [name, isSingle, currentSingle, currentMulti])

  async function handleCreate() {
    if (!allowCreate || !query.trim()) return
    const label = query.trim()
    let created: ComboboxOption
    if (onCreateOption) {
      const res = await onCreateOption(label)
      if (typeof res === 'string') created = { label: res, value: res }
      else created = res as ComboboxOption
    } else {
      created = { label, value: label }
    }
    if (!baseOptions.some((o) => o.value === created.value)) {
      setAsyncOpts([created, ...baseOptions])
    }
    if (isSingle) selectSingle(created.value)
    else toggleMulti(created.value)
    setQuery('')
  }

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

      {name && <div ref={hiddenRef} />}

      <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery('') }}>
        <Popover.Trigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled || loading}
            className={cn(
              'w-full rounded-xl border bg-background text-left text-sm shadow-sm transition outline-none',
              'focus:ring-2 focus:ring-primary',
              error ? 'border-destructive/70' : 'border-border',
              'hover:bg-muted/30 min-h-[2.75rem] px-3 py-2',
              (disabled || loading) && 'opacity-60 cursor-not-allowed',
              className,
            )}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {isSingle ? (
                currentSingle ? (
                  <span className="truncate">{selectedSingleObj?.label ?? currentSingle}</span>
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )
              ) : currentMulti.length > 0 ? (
                <>
                  {selectedMultiObjs.slice(0, 4).map((o) => (
                    <Badge key={o.value} variant="secondary" className="flex items-center gap-1">
                      {o.label}
                      <X
                        className="h-3.5 w-3.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMulti(o.value)
                        }}
                      />
                    </Badge>
                  ))}
                  {currentMulti.length > 4 && <Badge variant="outline">+{currentMulti.length - 4}</Badge>}
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              <div className="ml-auto flex items-center gap-1">
                {clearable && ((isSingle && currentSingle) || (!isSingle && currentMulti.length)) && (
                  <button
                    type="button"
                    className="rounded-md p-1 -mr-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Zurücksetzen"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isSingle) {
                        onValueChange?.('')
                        setInternalSingle('')
                      } else {
                        onValuesChange?.([])
                        setInternalMulti([])
                      }
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
              <div className="p-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={allowCreate ? 'Suchen oder erstellen…' : 'Suchen…'}
                    className="pl-8 h-9"
                    autoFocus
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const exact = filtered.find(
                          (o) => o.label.toLowerCase() === query.trim().toLowerCase(),
                        )
                        if (exact) {
                          isSingle ? selectSingle(exact.value) : toggleMulti(exact.value)
                        } else if (allowCreate) {
                          await handleCreate()
                        }
                      }
                      if (e.key === 'Backspace' && !isSingle && query === '' && currentMulti.length) {
                        toggleMulti(currentMulti[currentMulti.length - 1])
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mt-1 max-h-[var(--cb-height,320px)] overflow-auto pr-1" style={{ ['--cb-height' as any]: `${contentMaxHeight}px` }}>
                {asyncLoading ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground">
                    Keine Treffer{allowCreate && query ? (
                      <>
                        .&nbsp;
                        <button
                          className="inline-flex items-center gap-1 underline underline-offset-2 hover:no-underline"
                          onClick={handleCreate}
                        >
                          <Plus className="h-4 w-4" /> „{query}“ erstellen
                        </button>
                      </>
                    ) : '.'}
                  </div>
                ) : (
                  filtered.map((opt) => {
                    const checked = !isSingle && currentMulti.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          'w-full text-left px-2.5 py-2 rounded-md text-sm',
                          'hover:bg-muted focus:bg-muted outline-none',
                        )}
                        onClick={() => (isSingle ? selectSingle(opt.value) : toggleMulti(opt.value))}
                      >
                        <div className="flex items-start gap-2">
                          {!isSingle && (
                            <div className="h-5 w-5 rounded border flex items-center justify-center">
                              {checked && <Check className="h-4 w-4" />}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span>{opt.label}</span>
                              {isSingle && currentSingle === opt.value && <Check className="h-4 w-4" />}
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

              <div className="p-2 pt-1 flex items-center justify-between gap-2">
                {allowCreate && query && filtered.length === 0 && (
                  <Button variant="outline" size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-1" /> „{query}“ erstellen
                  </Button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Schließen
                  </Button>
                  <Button size="sm" onClick={() => setOpen(false)}>
                    Übernehmen
                  </Button>
                </div>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
