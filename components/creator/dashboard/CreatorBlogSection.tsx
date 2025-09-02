'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import {
  Search,
  ListFilter,
  ArrowUpDown,
  RefreshCw,
  ChevronDown,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Status = 'all' | 'draft' | 'published' | 'scheduled' | 'archived'
type SortKey = 'recent' | 'updated' | 'popular'

/**
 * Wichtig: Wir casten die dynamischen Components auf "any".
 * So kannst du optionale Props wie onSaved/query/status sicher durchreichen,
 * ohne dass TypeScript meckert – die Ziel-Komponente ignoriert sie einfach,
 * falls sie diese Props nicht unterstützt.
 */
const BlogEditor = dynamic<any>(() => import('@/components/blog/BlogEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
})

const CreatorBlogList = dynamic<any>(
  () => import('@/components/blog/CreatorBlogList'),
  {
    ssr: false,
    loading: () => <ListSkeleton />,
  }
)

export default function CreatorBlogSection({
  defaultOpenEditor = false,
  defaultStatus = 'all' as Status,
  defaultSort = 'recent' as SortKey,
}: {
  defaultOpenEditor?: boolean
  defaultStatus?: Status
  defaultSort?: SortKey
}) {
  const [openEditor, setOpenEditor] = React.useState(defaultOpenEditor)
  const [status, setStatus] = React.useState<Status>(defaultStatus)
  const [sort, setSort] = React.useState<SortKey>(defaultSort)
  const [query, setQuery] = React.useState('')
  const [qInput, setQInput] = React.useState('')
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [refreshing, setRefreshing] = React.useState(false)

  // Debounce Suche
  React.useEffect(() => {
    const t = setTimeout(() => setQuery(qInput.trim()), 300)
    return () => clearTimeout(t)
  }, [qInput])

  // ⌘/Ctrl + K → Suche fokussieren
  const searchRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function doRefresh() {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 200))
    setRefreshKey((k) => k + 1)
    setRefreshing(false)
  }

  // Wird vom Editor genutzt, FALLS er diese Props unterstützt – sonst ignoriert.
  const handleEditorSaved = React.useCallback(
    (action: 'saved' | 'published') => {
      toast.success(
        action === 'published' ? 'Beitrag veröffentlicht' : 'Entwurf gespeichert'
      )
      void doRefresh()
      if (action === 'published' && window.innerWidth < 1024) setOpenEditor(false)
    },
    []
  )

  return (
    <section aria-label="Blog & Stories" className="space-y-6">
      {/* ===== Toolbar (sticky) ===== */}
      <div
        className={cn(
          'sticky top-14 z-[5] -mx-3 md:mx-0',
          'border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70'
        )}
      >
        <div className="px-3 md:px-0 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Suche */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                inputMode="search"
                placeholder="Suche nach Titel, Tags, …  (⌘/Ctrl + K)"
                className={cn(
                  'w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none',
                  'focus:ring-2 focus:ring-primary/40'
                )}
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                aria-label="Beiträge durchsuchen"
              />
            </div>

            {/* Status-Filter */}
            <StatusSegmented value={status} onChange={setStatus} />

            {/* Sortierung */}
            <SortMenu value={sort} onChange={setSort} />

            {/* Refresh */}
            <button
              type="button"
              onClick={doRefresh}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm',
                'hover:bg-accent'
              )}
              aria-label="Liste aktualisieren"
              disabled={refreshing}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  refreshing && 'animate-spin text-muted-foreground'
                )}
              />
              Aktualisieren
            </button>

            {/* Editor toggeln */}
            <button
              type="button"
              onClick={() => setOpenEditor((v) => !v)}
              className={cn(
                'ml-auto inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm',
                'hover:bg-accent'
              )}
              aria-expanded={openEditor}
              aria-controls="blog-editor-panel"
            >
              <Plus className="h-4 w-4" />
              Neuer Beitrag
              <ChevronDown
                className={cn(
                  'ml-1 h-4 w-4 transition-transform',
                  openEditor ? 'rotate-180' : ''
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Editor (collapsible) ===== */}
      <div
        id="blog-editor-panel"
        hidden={!openEditor}
        className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm')}
      >
        {/* BlogEditor akzeptiert evtl. keine onSaved/onPublished – dank dynamic<any> unproblematisch */}
        <BlogEditor onSaved={() => handleEditorSaved('saved')} onPublished={() => handleEditorSaved('published')} />
      </div>

      {/* ===== Liste ===== */}
      <div className="space-y-4">
        {/* CreatorBlogList akzeptiert evtl. keine Props – dynamic<any> macht das tolerant */}
        <CreatorBlogList
          key={refreshKey}
          status={status}
          query={query}
          sort={sort}
          onLoaded={(count?: number) => {
            if (typeof count === 'number' && refreshKey > 0) {
              toast.message(`Aktualisiert • ${count} Einträge`)
            }
          }}
        />
      </div>
    </section>
  )
}

/* ----------------------------- UI-Bausteine ----------------------------- */

function StatusSegmented({
  value,
  onChange,
}: {
  value: Status
  onChange: (s: Status) => void
}) {
  const opts: { v: Status; label: string }[] = [
    { v: 'all', label: 'Alle' },
    { v: 'draft', label: 'Entwürfe' },
    { v: 'published', label: 'Veröffentlicht' },
    { v: 'scheduled', label: 'Geplant' },
    { v: 'archived', label: 'Archiv' },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Status filtern"
      className="inline-flex flex-wrap gap-1 rounded-xl border border-input bg-background p-1 shadow-sm"
    >
      {opts.map((o) => {
        const active = o.v === value
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.v)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-xs transition',
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-foreground/80 hover:bg-accent'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function SortMenu({
  value,
  onChange,
}: {
  value: SortKey
  onChange: (s: SortKey) => void
}) {
  const label =
    value === 'recent'
      ? 'Neueste'
      : value === 'updated'
      ? 'Zuletzt bearbeitet'
      : 'Beliebt'
  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm',
          'hover:bg-accent'
        )}
        aria-haspopup="menu"
        aria-expanded="false"
      >
        <ArrowUpDown className="h-4 w-4" />
        Sortieren: {label}
      </button>
      {/* unsichtbares Select als simples Dropdown */}
      <select
        aria-label="Sortierung auswählen"
        className="absolute inset-0 opacity-0 cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
      >
        <option value="recent">Neueste</option>
        <option value="updated">Zuletzt bearbeitet</option>
        <option value="popular">Beliebt</option>
      </select>
    </div>
  )
}

/* ------------------------------ Skeletons ------------------------------ */

function EditorSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-pulse">
      <div className="h-9 w-2/3 rounded-md bg-muted" />
      <div className="mt-3 h-28 rounded-md bg-muted" />
      <div className="mt-3 h-9 w-1/3 rounded-md bg-muted" />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-2xl border border-border bg-card shadow-sm animate-pulse"
        />
      ))}
    </div>
  )
}
