// components/creator/media-studio/GalleryGrid.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import MediaItemCard from './MediaItemCard'
import type { Tables } from '@/types/supabase'
import { cn as _cn } from '@/lib/utils'
import {
  Loader2, Search as SearchIcon, SlidersHorizontal, ChevronDown, Check, X,
  Eye, Download, Tag as TagIcon, Trash2, Sparkles, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { renewSignedUrl } from '@/lib/media/signing'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type MediaItem = Tables<'session_media'>

type SortKey = 'newest' | 'oldest' | 'title' | 'ai-first'

interface GalleryGridProps {
  media?: MediaItem[] | null
  onLoadMore?: () => void | Promise<void>
  hasMore?: boolean
  renderItem?: (item: MediaItem) => React.ReactNode
  className?: string
  columnsMin?: number
  gap?: number | string
  emptyHint?: React.ReactNode
  localBatchSize?: number

  /** Optional – Bulk Aktionen werden nur angezeigt, wenn Handler existieren */
  onBulkDelete?: (ids: string[]) => void | Promise<void>
  onBulkTag?: (ids: string[], tag: string) => void | Promise<void>
  onOpenItem?: (item: MediaItem) => void | Promise<void>
}

/* -------------------- helpers (schema-agnostisch) -------------------- */

function getUrl(m: MediaItem): string {
  const anyM = m as unknown as Record<string, any>
  return (anyM.image_url ?? anyM.url ?? anyM.video_url ?? anyM.thumbnail_url ?? '') as string
}
function getThumb(m: MediaItem): string {
  const anyM = m as unknown as Record<string, any>
  return (anyM.thumbnail_url ?? anyM.thumb_url ?? getUrl(m)) as string
}
function storageInfo(m: MediaItem): { bucket?: string; path?: string } {
  const anyM = m as unknown as Record<string, any>
  return {
    bucket: anyM.storage_bucket ?? anyM.bucket ?? undefined,
    path: anyM.storage_path ?? anyM.path ?? undefined,
  }
}
function thumbStorageInfo(m: MediaItem): { bucket?: string; path?: string } {
  const anyM = m as unknown as Record<string, any>
  return {
    bucket: anyM.thumb_bucket ?? anyM.thumbnail_bucket ?? undefined,
    path: anyM.thumb_path ?? anyM.thumbnail_path ?? undefined,
  }
}
function isVideoLike(m: MediaItem): boolean {
  const anyM = m as unknown as Record<string, any>
  const mime = (anyM.mime_type as string | undefined) ?? ''
  if (mime.startsWith('video/')) return true
  const u = getUrl(m).split('?')[0].toLowerCase()
  return ['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.avi'].some(ext => u.endsWith(ext))
}
function fileExtFromUrl(u: string): string {
  const clean = u.split('?')[0]
  const dot = clean.lastIndexOf('.')
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : 'bin'
}
function safeTitle(m: MediaItem): string {
  const anyM = m as unknown as Record<string, any>
  return (anyM.title ?? anyM.description ?? 'media') as string
}

/* -------------------- component -------------------- */

export default function GalleryGrid({
  media,
  onLoadMore,
  hasMore = false,
  renderItem,
  className,
  columnsMin = 220,
  gap = 16,
  emptyHint,
  localBatchSize = 30,
  onBulkDelete,
  onBulkTag,
  onOpenItem,
}: GalleryGridProps) {
  const list = Array.isArray(media) ? media : []
  const [localCount, setLocalCount] = useState(localBatchSize)
  const [loadingMore, setLoadingMore] = useState(false)
  const [query, setQuery] = useState('')
  const [aiOnly, setAiOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  const [overrides, setOverrides] = useState<Record<string, { url?: string; thumb?: string }>>({})

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const inflightRef = useRef(false)
  const lastClickedIndex = useRef<number | null>(null)

  // Persist Zustand (pro Route)
  const persistKey = typeof window !== 'undefined' ? `gallery:v2:${location.pathname}` : 'gallery:v2'
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(persistKey)
    if (!raw) return
    try {
      const j = JSON.parse(raw)
      if (typeof j.q === 'string') setQuery(j.q)
      if (typeof j.ai === 'boolean') setAiOnly(j.ai)
      if (typeof j.s === 'string') setSortKey(j.s as SortKey)
      if (Array.isArray(j.t)) setActiveTags(j.t.filter(Boolean))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload = JSON.stringify({ q: query, ai: aiOnly, s: sortKey, t: activeTags })
    localStorage.setItem(persistKey, payload)
  }, [persistKey, query, aiOnly, sortKey, activeTags])

  // Progressive reveal (ohne Pagination)
  useEffect(() => {
    if (onLoadMore) return
    setLocalCount((prev) => Math.min(prev, list.length || localBatchSize))
  }, [list.length, onLoadMore, localBatchSize])

  // Infinite Scroll
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const obs = new IntersectionObserver(
      (entries) => {
        const ent = entries[0]
        if (!ent?.isIntersecting) return
        if (onLoadMore && hasMore && !inflightRef.current) {
          inflightRef.current = true
          Promise.resolve(onLoadMore())
            .catch(() => {})
            .finally(() => { inflightRef.current = false })
          return
        }
        if (!onLoadMore && list.length > localCount) {
          setLocalCount((c) => Math.min(c + localBatchSize, list.length))
        }
      },
      { rootMargin: '600px 0px 600px 0px', threshold: 0 }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [onLoadMore, hasMore, list.length, localCount, localBatchSize])

  useEffect(() => setLoadingMore(Boolean(onLoadMore) && hasMore), [onLoadMore, hasMore])

  // Tags aggregieren
  const allTags = useMemo(() => {
    const s = new Set<string>()
    for (const m of list) {
      const tags = ((m as any).tags ?? []) as string[]
      tags?.forEach(t => t && s.add(t))
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [list])

  // Filter + Sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const ok = (m: MediaItem) => {
      const isAi = Boolean((m as any).is_ai_generated)
      if (aiOnly && !isAi) return false
      if (activeTags.length) {
        const tags = (((m as any).tags ?? []) as string[]).map(t => t?.toLowerCase())
        if (!activeTags.every(t => tags.includes(t.toLowerCase()))) return false
      }
      if (!q) return true
      const hay = [
        (m as any).title ?? '',
        (m as any).description ?? '',
        getUrl(m) ?? '',
        ...((((m as any).tags ?? []) as string[]))
      ].join(' ').toLowerCase()
      return hay.includes(q)
    }
    const base = list.filter(ok)
    switch (sortKey) {
      case 'oldest': base.sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()); break
      case 'title':  base.sort((a, b) => ((a as any).title ?? '').localeCompare(((b as any).title ?? ''), undefined, { sensitivity: 'base' })); break
      case 'ai-first': base.sort((a, b) => (Number((b as any).is_ai_generated) - Number((a as any).is_ai_generated)) || (new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())); break
      case 'newest':
      default: base.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    }
    return base
  }, [list, query, aiOnly, sortKey, activeTags])

  // Anzeige (progressiv wenn kein Pagination-Handler)
  const itemsToRender = useMemo(() => (onLoadMore ? filtered : filtered.slice(0, localCount)), [filtered, onLoadMore, localCount])

  // Auswahl
  const toggleSelect = useCallback((id: string, index: number, withRange: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (withRange && lastClickedIndex.current !== null) {
        const last = lastClickedIndex.current
        const [from, to] = [Math.min(last, index), Math.max(last, index)]
        for (let i = from; i <= to; i++) next.add(itemsToRender[i].id as string)
      } else {
        if (next.has(id)) next.delete(id); else next.add(id)
      }
      lastClickedIndex.current = index
      return next
    })
  }, [itemsToRender])

  const clearSelection = useCallback(() => setSelected(new Set()), [])
  const selectedArray = useMemo(() => Array.from(selected), [selected])
  const inSelectionMode = selected.size > 0

  // Preview
  const openPreview = useCallback((idx: number) => setPreviewIdx(idx), [])
  const closePreview = useCallback(() => setPreviewIdx(null), [])
  const prevPreview = useCallback(() => setPreviewIdx(i => (i === null ? i : Math.max(0, i - 1))), [])
  const nextPreview = useCallback(() => setPreviewIdx(i => (i === null ? i : Math.min(itemsToRender.length - 1, i + 1))), [itemsToRender.length])

  // Bulk Handler
  const onBulkDeleteClick = useCallback(() => {
    if (!onBulkDelete || selectedArray.length === 0) return
    Promise.resolve(onBulkDelete(selectedArray)).finally(() => clearSelection())
  }, [onBulkDelete, selectedArray, clearSelection])

  const onBulkTagClick = useCallback((tag: string) => {
    if (!onBulkTag || selectedArray.length === 0) return
    Promise.resolve(onBulkTag(selectedArray, tag)).finally(() => clearSelection())
  }, [onBulkTag, selectedArray, clearSelection])

  // Keybindings im Grid
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewIdx !== null) { e.preventDefault(); closePreview(); return }
        if (inSelectionMode) { e.preventDefault(); clearSelection(); return }
      }
      if ((e.key.toLowerCase() === 'a') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSelected(new Set(itemsToRender.map(x => x.id as string)))
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && onBulkDelete && inSelectionMode) {
        e.preventDefault()
        onBulkDeleteClick()
      }
      if (e.key === 'ArrowLeft' && previewIdx !== null) { e.preventDefault(); prevPreview() }
      if (e.key === 'ArrowRight' && previewIdx !== null) { e.preventDefault(); nextPreview() }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [itemsToRender, previewIdx, inSelectionMode, onBulkDelete, onBulkDeleteClick, prevPreview, nextPreview, closePreview, clearSelection])

  // Re-Sign logic
  const renewForItem = useCallback(async (m: MediaItem) => {
    const id = m.id as string
    const { bucket, path } = storageInfo(m)
    if (!bucket || !path) return
    const fresh = await renewSignedUrl({ bucket, path })
    const tInfo = thumbStorageInfo(m)
    const freshThumb = (tInfo.bucket && tInfo.path) ? await renewSignedUrl({ bucket: tInfo.bucket, path: tInfo.path }) : undefined
    setOverrides(prev => ({ ...prev, [id]: { url: fresh ?? prev[id]?.url, thumb: freshThumb ?? prev[id]?.thumb } }))
  }, [])

  const renewForSelected = useCallback(async () => {
    await Promise.all(itemsToRender.filter(m => selected.has(m.id as string)).map(m => renewForItem(m)))
  }, [itemsToRender, selected, renewForItem])

  // Empty
  if (!itemsToRender.length) {
    return (
      <div className={cn('rounded-xl border bg-card/50 p-6 text-sm text-muted-foreground', className)}>
        {emptyHint ?? 'Noch keine Medien vorhanden. Lade ein Bild/Video hoch oder generiere eines mit KI.'}
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} ref={gridRef} tabIndex={0}>
      <Toolbar
        query={query}
        setQuery={setQuery}
        aiOnly={aiOnly}
        setAiOnly={setAiOnly}
        sortKey={sortKey}
        setSortKey={setSortKey}
        allTags={allTags}
        activeTags={activeTags}
        setActiveTags={setActiveTags}
        selectionCount={selected.size}
        onClearSelection={clearSelection}
        onBulkDelete={onBulkDelete ? onBulkDeleteClick : undefined}
        onBulkTag={onBulkTag ? onBulkTagClick : undefined}
        onRenewSelected={renewForSelected}
        canRenew={itemsToRender.some(m => storageInfo(m).bucket && storageInfo(m).path)}
      />

      <div
        role="grid"
        aria-busy={loadingMore}
        className="mt-3 grid"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${columnsMin}px, 1fr))`, gap }}
      >
        {itemsToRender.map((item, i) => {
          const isSelected = selected.has(item.id as string)
          const key = item.id as string
          const override = overrides[key]
          const url = override?.url ?? getUrl(item)
          const thumb = override?.thumb ?? getThumb(item)
          const isVideo = isVideoLike(item)

          return (
            <div key={item.id} role="gridcell" className="group relative min-w-0">
              {/* Auswahl-Overlay */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleSelect(item.id as string, i, e.shiftKey) }}
                className={cn(
                  'absolute left-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-md border bg-white/80 backdrop-blur transition',
                  isSelected ? 'border-primary text-primary' : 'opacity-0 group-hover:opacity-100'
                )}
                aria-pressed={isSelected}
                title="Auswählen (Shift für Bereich)"
              >
                {isSelected ? <Check className="h-3.5 w-3.5" /> : <Checkbox checked={isSelected} className="h-4 w-4" />}
              </button>

              <div
                className={cn('cursor-zoom-in overflow-hidden rounded-xl border bg-card/60', isSelected && 'ring-2 ring-primary')}
                onClick={() => {
                  onOpenItem ? onOpenItem(item) : openPreview(i)
                }}
              >
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <CardSmart
                    item={item}
                    src={url}
                    thumb={thumb}
                    isVideo={isVideo}
                    onSrcExpired={() => renewForItem(item)}
                  />
                )}
              </div>

              {/* Hover-Actions */}
              <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
                <div className="pointer-events-auto flex items-center gap-2">
                  {Boolean((item as any).is_ai_generated) && (
                    <Badge className="bg-emerald-600/90 text-white"><Sparkles className="mr-1 h-3 w-3" /> KI</Badge>
                  )}
                  {(((item as any).tags ?? []) as string[]).slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary" className="bg-white/90 backdrop-blur">#{t}</Badge>
                  ))}
                </div>
                <div className="pointer-events-auto flex items-center gap-1">
                  <IconButton title="Öffnen" onClick={() => (onOpenItem ? onOpenItem(item) : openPreview(i))}><Eye className="h-4 w-4" /></IconButton>
                  <IconButton title="Download" onClick={() => downloadAsset(url, `${safeTitle(item)}.${fileExtFromUrl(url)}`)}><Download className="h-4 w-4" /></IconButton>
                  {storageInfo(item).bucket && storageInfo(item).path && (
                    <IconButton title="URL erneuern" onClick={() => renewForItem(item)}><RefreshCw className="h-4 w-4" /></IconButton>
                  )}
                  {onBulkDelete && (
                    <IconButton title="Löschen" destructive onClick={() => onBulkDelete([item.id as string])}><Trash2 className="h-4 w-4" /></IconButton>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={sentinelRef} aria-hidden="true" />
      </div>

      <div className="mt-3 flex items-center justify-center">
        {Boolean(onLoadMore) && hasMore ? (
          <div className="inline-flex items-center gap-2 rounded-md border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Weitere Medien werden geladen …
          </div>
        ) : !onLoadMore && filtered.length > itemsToRender.length ? (
          <div className="text-center text-xs text-muted-foreground">
            Zeige {itemsToRender.length} von {filtered.length} – scrolle weiter …
          </div>
        ) : null}
      </div>

      {/* Preview */}
      {previewIdx !== null && itemsToRender[previewIdx] && (
        <PreviewModal
          items={itemsToRender}
          index={previewIdx}
          onClose={closePreview}
          onPrev={prevPreview}
          onNext={nextPreview}
        />
      )}
    </div>
  )
}

/* -------------------- smart card (bild+video + auto re-sign) -------------------- */

function CardSmart({
  item, src, thumb, isVideo, onSrcExpired,
}: { item: MediaItem; src: string; thumb: string; isVideo: boolean; onSrcExpired: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [err, setErr] = useState(false)

  if (isVideo) {
    return (
      <div className="relative">
        {!loaded && <div className="absolute inset-0 animate-pulse bg-muted/40" />}
        <video
          src={src}
          poster={thumb || undefined}
          className={cn('aspect-[4/3] w-full object-cover', loaded ? 'opacity-100' : 'opacity-0')}
          muted
          playsInline
          preload="metadata"
          onCanPlay={() => setLoaded(true)}
          onError={() => { setErr(true); onSrcExpired() }}
          onMouseEnter={(e) => { const v = e.currentTarget; v.muted = true; v.play().catch(() => {}) }}
          onMouseLeave={(e) => { const v = e.currentTarget; v.pause() }}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted/40" />}
      <img
        src={err ? placeholder() : (thumb || src)}
        alt={(item as any).title || (item as any).description || 'Medieninhalt'}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { setErr(true); onSrcExpired() }}
        className={cn('aspect-[4/3] w-full object-cover transition will-change-transform', loaded ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  )
}

/* -------------------- UI Bits -------------------- */

function Toolbar(props: {
  query: string
  setQuery: (v: string) => void
  aiOnly: boolean
  setAiOnly: (v: boolean) => void
  sortKey: SortKey
  setSortKey: (v: SortKey) => void
  allTags: string[]
  activeTags: string[]
  setActiveTags: (vs: string[]) => void
  selectionCount: number
  onClearSelection: () => void
  onBulkDelete?: () => void
  onBulkTag?: (tag: string) => void
  onRenewSelected?: () => void
  canRenew?: boolean
}) {
  const {
    query, setQuery, aiOnly, setAiOnly, sortKey, setSortKey,
    allTags, activeTags, setActiveTags, selectionCount, onClearSelection,
    onBulkDelete, onBulkTag, onRenewSelected, canRenew
  } = props

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card/60 p-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen…"
          className="h-9 w-60 pl-8"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filter
            <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={aiOnly} onCheckedChange={(v) => setAiOnly(Boolean(v))} />
              Nur KI-generiert
            </label>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Keine Tags vorhanden.</span>
                ) : allTags.map((t) => {
                  const active = activeTags.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (active) setActiveTags(activeTags.filter(x => x !== t))
                        else setActiveTags([...activeTags, t])
                      }}
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-xs',
                        active ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
                      )}
                    >
                      #{t}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Sortieren
            <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Reihenfolge</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(['newest','oldest','title','ai-first'] as SortKey[]).map(k => (
            <DropdownMenuItem key={k} onClick={() => setSortKey(k)} className={cn(sortKey===k && 'bg-muted')}>
              {k === 'newest' && 'Neueste zuerst'}
              {k === 'oldest' && 'Älteste zuerst'}
              {k === 'title'  && 'Titel (A–Z)'}
              {k === 'ai-first' && 'KI zuerst'}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selection info + bulk */}
      <div className="ml-auto flex items-center gap-2">
        {selectionCount > 0 && (
          <>
            <Badge variant="secondary" className="px-2 py-1 text-xs">{selectionCount} ausgewählt</Badge>
            {onBulkTag && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline"><TagIcon className="mr-2 h-4 w-4" /> Tag zuweisen</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Schnell-Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {['featured','portfolio','ad','draft'].map(t => (
                    <DropdownMenuItem key={t} onClick={() => onBulkTag(t)}>#{t}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canRenew && (
              <Button size="sm" variant="outline" onClick={onRenewSelected}>
                <RefreshCw className="mr-2 h-4 w-4" /> URLs erneuern
              </Button>
            )}
            {onBulkDelete && (
              <Button size="sm" variant="danger" onClick={onBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Entfernen
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClearSelection}>
              <X className="mr-1 h-4 w-4" /> Auswahl aufheben
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function PreviewModal({
  items, index, onClose, onPrev, onNext,
}: { items: MediaItem[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const [zoom, setZoom] = useState(1)
  const item = items[index]
  const isVideo = isVideoLike(item)
  const src = getUrl(item)
  const poster = getThumb(item)

  // Preload Nachbarn (nur Bilder)
  useEffect(() => {
    if (isVideo) return
    const preload = (i: number) => {
      const it = items[i]; if (!it) return
      const img = new Image(); img.src = getUrl(it)
    }
    preload(index + 1)
    preload(index - 1)
  }, [index, items, isVideo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  const download = async () => {
    await downloadAsset(src, `${safeTitle(item)}.${fileExtFromUrl(src)}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
      <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 p-2 backdrop-blur hover:bg-white" onClick={onPrev} aria-label="Vorheriges">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 p-2 backdrop-blur hover:bg-white" onClick={onNext} aria-label="Nächstes">
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="mx-auto w-full max-w-6xl rounded-2xl border bg-card p-3">
        <div className="flex items-center justify-between gap-2 border-b px-2 pb-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{safeTitle(item)}</div>
            <div className="text-xs text-muted-foreground">{new Date(item.created_at ?? Date.now()).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2">
            {!isVideo && (
              <>
                <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}><ZoomOut className="mr-1 h-4 w-4" />Zoom–</Button>
                <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.min(4, z + 0.25))}><ZoomIn className="mr-1 h-4 w-4" />Zoom+</Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" />Download</Button>
            <Button size="sm" onClick={onClose}><X className="mr-2 h-4 w-4" />Schließen</Button>
          </div>
        </div>

        <div className="relative grid place-items-center overflow-hidden rounded-xl bg-muted/40 p-2">
          {isVideo ? (
            <video src={src} poster={poster || undefined} controls className="max-h-[80vh] w-auto" />
          ) : (
            <img
              src={src}
              alt={safeTitle(item)}
              style={{ transform: `scale(${zoom})` }}
              className="max-h-[80vh] w-auto select-none object-contain transition-transform"
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------- small UI + utils ------------- */

function IconButton({ children, onClick, title, destructive }: { children: React.ReactNode; onClick: () => void; title?: string; destructive?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white/90 text-foreground backdrop-blur transition hover:bg-white',
        destructive ? 'border-destructive text-destructive' : 'border-input'
      )}
    >
      {children}
    </button>
  )
}

async function downloadAsset(url: string, filename: string) {
  const res = await fetch(url, { cache: 'no-store' })
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(a.href)
}

function placeholder() {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3" viewBox="0 0 4 3"><rect width="4" height="3" fill="#f1f3f5"/></svg>`
  )
}
