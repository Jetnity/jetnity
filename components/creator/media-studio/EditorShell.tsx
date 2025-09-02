// components/creator/media-studio/EditorShell.tsx
'use client'

import * as React from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import {
  Film,
  ImageIcon,
  Import,
  Redo2,
  Undo2,
  Settings2,
  Play,
  Square,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  Ruler,
  Sparkles,
  SlidersHorizontal,
  Eraser,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Timeline from './Timeline'
import InspectorPanel from './InspectorPanel'
import SmartToolsPanel from './SmartToolsPanel'
import RendersPanel from './RendersPanel'
import VersionTimeline from './VersionTimeline'
import MaskEditor from './MaskEditor'
import Presence from './Presence'
import SessionCommentPanel from './SessionCommentPanel'
import { supabase } from '@/lib/supabase/client'

export type EditorMediaItem = {
  id: string
  kind: 'image' | 'video'
  src: string
  thumb?: string
  width?: number
  height?: number
  durationMs?: number
  name?: string
  createdAt?: string
}

type Mode = 'dock' | 'canvas' | 'inspector'

type Props = {
  sessionId: string
  sessionTitle: string
  media: EditorMediaItem[]
}

export default function EditorShell({ sessionId, sessionTitle, media }: Props) {
  const [selectedId, setSelectedId] = React.useState<string | null>(media[0]?.id ?? null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [mobileMode, setMobileMode] = React.useState<Mode>('canvas')
  const [zoom, setZoom] = React.useState(1)
  const [maskMode, setMaskMode] = React.useState(false)
  const [maskUrl, setMaskUrl] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  const selected = React.useMemo(() => media.find((m) => m.id === selectedId) ?? null, [media, selectedId])

  // safe state helpers
  const mountedRef = React.useRef(true)
  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // load user once (for presence / panels)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!cancelled && mountedRef.current) setUserId(data.user?.id ?? null)
      } catch (err) {
        console.error('Failed to get user in EditorShell', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Edit doc hook (kept as-is, local helper below)
  const { editDoc, patchEditDoc, isLoadingEdit } = useEditDoc(sessionId, selectedId)

  // keyboard shortcuts
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    const isTyping =
      !!target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

    if (isTyping) return

    // Space: toggle playback
    if (e.code === 'Space') {
      e.preventDefault()
      setIsPlaying((p) => !p)
      return
    }

    // Cmd/Ctrl + shortcuts
    const meta = e.ctrlKey || e.metaKey
    if (!meta) return

    const key = e.key.toLowerCase()
    if (key === 's') {
      e.preventDefault()
      // TODO: persist save
      console.log('Save (todo)')
    } else if (key === 'z') {
      e.preventDefault()
      console.log(e.shiftKey ? 'Redo' : 'Undo')
    } else if (key === '=' || key === '+') {
      e.preventDefault()
      setZoom((z) => Math.min(2, Math.round((z + 0.1) * 100) / 100))
    } else if (key === '-') {
      e.preventDefault()
      setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 100) / 100))
    } else if (key === '0') {
      e.preventDefault()
      setZoom(1)
    }
  }, [])

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // css filter preview from editDoc
  const cssFilter = React.useMemo(() => {
    const a = editDoc?.doc?.adjustments ?? {}
    const exposure = 1 + toNum(a.exposure) / 200
    const contrast = 1 + toNum(a.contrast) / 200
    const saturation = 1 + toNum(a.saturation) / 200
    const hue = toNum(a.temperature) * 0.5
    return `brightness(${exposure}) contrast(${contrast}) saturate(${saturation}) hue-rotate(${hue}deg)`
  }, [editDoc])

  // render job helper with error handling
  const onRender = React.useCallback(
    async (type: 'export' | 'auto_color' | 'object_remove' | 'auto_cut' | 'subtitles' = 'export', params: Record<string, any> = {}) => {
      try {
        const res = await fetch('/api/media/render', {
          method: 'POST',
          body: JSON.stringify({ sessionId, itemId: selectedId, jobType: type, params }),
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: 'unknown' }))
          console.error('Render API error', json)
        }
      } catch (err) {
        console.error('Render request failed', err)
      }
    },
    [sessionId, selectedId]
  )

  const onObjectRemove = React.useCallback(async () => {
    if (!maskUrl || !selectedId) return
    await onRender('object_remove', { mask: maskUrl })
    setMaskMode(false)
  }, [maskUrl, selectedId, onRender])

  React.useEffect(() => {
    setMaskUrl(null)
    setMaskMode(false)
  }, [selectedId])

  // toolbar helpers
  const incZoom = React.useCallback(() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 100) / 100)), [])
  const decZoom = React.useCallback(() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 100) / 100)), [])

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-background/60 backdrop-blur px-3 py-2">
        <span className="inline-flex h-8 items-center rounded-md bg-muted px-2 text-xs font-medium">
          Session: {sessionTitle}
        </span>

        <button
          className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-sm hover:bg-accent"
          title="Medien importieren"
          aria-label="Import media"
        >
          <Import className="h-4 w-4" />
          Import
        </button>

        <div className="mx-2 w-px self-stretch bg-border" />

        <button
          className="inline-flex h-8 items-center rounded-md border px-2 text-sm hover:bg-accent"
          title="Rückgängig (Ctrl/Cmd+Z)"
          onClick={() => console.log('undo (todo)')}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-8 items-center rounded-md border px-2 text-sm hover:bg-accent"
          title="Wiederherstellen (Shift+Ctrl/Cmd+Z)"
          onClick={() => console.log('redo (todo)')}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-2 w-px self-stretch bg-border" />

        <button
          className={cn(
            'inline-flex h-8 items-center gap-2 rounded-md border px-2 text-sm hover:bg-accent',
            isPlaying && 'bg-primary/10'
          )}
          onClick={() => setIsPlaying((p) => !p)}
          title={isPlaying ? 'Pause (Leertaste)' : 'Play (Leertaste)'}
          aria-pressed={isPlaying}
        >
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
          <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div className="mx-2 w-px self-stretch bg-border" />

        <div className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-sm">
          <button aria-label="Zoom In" onClick={incZoom} className="inline-flex items-center gap-1">
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="px-2">{Math.round(zoom * 100)}%</span>
          <button aria-label="Zoom Out" onClick={decZoom} className="inline-flex items-center gap-1">
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        <span className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-sm text-muted-foreground" title="Safe Areas anzeigen">
          <Ruler className="h-4 w-4" /> Safe
        </span>

        <div className="mx-2 w-px self-stretch bg-border" />

        {/* Mask mode */}
        <button
          className={cn(
            'inline-flex h-8 items-center gap-2 rounded-md border px-2 text-sm hover:bg-accent',
            maskMode && 'bg-primary/10'
          )}
          onClick={() => setMaskMode((v) => !v)}
          title="Objekt entfernen – Maske zeichnen"
          disabled={!selected || selected.kind !== 'image'}
          aria-pressed={maskMode}
        >
          <Eraser className="h-4 w-4" />
          <span className="hidden sm:inline">{maskMode ? 'Maskenmodus' : 'Maske'}</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {userId && <Presence sessionId={sessionId} userId={userId} />}
          <button
            className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-sm hover:bg-accent"
            onClick={() => console.log('Gespeichert.')}
            title="Speichern (Ctrl/Cmd+S)"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Speichern</span>
          </button>
          <button
            className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-sm hover:bg-accent"
            onClick={() => onRender('export')}
            title="Render starten"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Rendern</span>
          </button>
          <button className="inline-flex h-8 items-center rounded-md border px-2 text-sm hover:bg-accent" title="Einstellungen">
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block">
        <PanelGroup direction="horizontal" className="rounded-xl border bg-background/60 backdrop-blur">
          <Panel defaultSize={24} minSize={16} className="p-3">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Film className="h-4 w-4" /> Medien
            </h3>

            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {media.length === 0 && (
                <div className="col-span-full rounded-lg border p-4 text-sm text-muted-foreground">
                  Noch keine Medien. Nutze „Import“.
                </div>
              )}

              {media.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    'group relative aspect-video overflow-hidden rounded-lg border',
                    selectedId === m.id && 'ring-2 ring-primary'
                  )}
                  title={m.name ?? m.id}
                  aria-pressed={selectedId === m.id}
                >
                  {m.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.thumb || m.src} alt={m.name ?? 'Bild'} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="relative h-full w-full bg-black">
                      <video src={m.src} className="h-full w-full object-cover opacity-80" muted playsInline />
                      <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <Film className="h-6 w-6 text-white/80 drop-shadow" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="my-3 h-px bg-border" />

            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" /> Smart Tools (AI)
            </h3>
            <SmartToolsPanel sessionId={sessionId} selectedItemId={selectedId} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border" />

          <Panel defaultSize={52} minSize={36} className="p-3">
            <div className="relative rounded-xl border bg-black">
              <div className="relative mx-auto my-0 overflow-hidden" style={{ width: `${Math.round(zoom * 100)}%` }}>
                <div className="relative aspect-video">
                  {!selected && (
                    <div className="grid h-full w-full place-items-center text-sm text-muted-foreground bg-black">
                      Wähle ein Medium links aus.
                    </div>
                  )}

                  {maskMode && selected && selected.kind === 'image' && (
                    <MaskEditor
                      src={selected.src}
                      onSaved={(url) => {
                        setMaskUrl(url)
                        onObjectRemove().catch(console.error)
                      }}
                    />
                  )}

                  {!maskMode && selected && selected.kind === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.src} alt={selected.name ?? 'Bild'} className="h-full w-full object-contain" style={{ filter: cssFilter }} />
                  )}

                  {!maskMode && selected && selected.kind === 'video' && (
                    <video key={selected.src} src={selected.src} className="h-full w-full object-contain" controls playsInline style={{ filter: cssFilter }} />
                  )}

                  {!maskMode && (
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute left-1/3 top-0 h-full w-px bg-white/10" />
                      <div className="absolute left-2/3 top-0 h-full w-px bg-white/10" />
                      <div className="absolute top-1/3 left-0 w-full h-px bg-white/10" />
                      <div className="absolute top-2/3 left-0 w-full h-px bg-white/10" />
                      <div className="absolute inset-0 border border-white/10" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Timeline items={media} selectedId={selectedId} onSelect={setSelectedId} isPlaying={isPlaying} zoom={zoom} />
            </div>

            {userId && (
              <div className="mt-3">
                <VersionTimeline sessionId={sessionId} userId={userId} itemId={selectedId} />
              </div>
            )}
          </Panel>

          <PanelResizeHandle className="w-1 bg-border" />

          <Panel defaultSize={24} minSize={16} className="p-3">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4" /> Inspector
            </h3>

            <InspectorPanel
              loading={isLoadingEdit}
              item={selected ?? undefined}
              editDoc={editDoc ? { id: editDoc.id, doc: editDoc.doc } : null}
              onChange={(patch) => patchEditDoc(patch)}
              selectionName={selected?.name}
            />

            <div className="mt-3 rounded-lg border p-3">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" /> Export/Render
              </h4>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent" onClick={() => onRender('export')}>
                  Exportieren
                </button>
                <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent" onClick={() => onRender('auto_color')}>
                  Auto-Color
                </button>
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                  disabled={!selected || selected.kind !== 'video'}
                  onClick={() => onRender('auto_cut', { targetDurationSec: 30 })}
                >
                  Auto-Cut
                </button>
                <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent" onClick={() => onRender('subtitles')} disabled={!selected || selected.kind !== 'video'}>
                  Untertitel (AI)
                </button>
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                  disabled={!selected || selected.kind !== 'image'}
                  onClick={() => setMaskMode(true)}
                  title="Objekt entfernen – Maske zeichnen"
                >
                  Objekt entfernen
                </button>
              </div>
            </div>

            {userId && (
              <div className="mt-3">
                <RendersPanel userId={userId} sessionId={sessionId} />
              </div>
            )}

            {userId && (
              <div className="mt-3">
                <SessionCommentPanel sessionId={sessionId} itemId={selectedId} me={{ id: userId, name: 'Ich' }} />
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="mb-2 grid grid-cols-3 gap-1">
          <button className={tabBtnCls(mobileMode === 'dock')} onClick={() => setMobileMode('dock')}>
            Medien
          </button>
          <button className={tabBtnCls(mobileMode === 'canvas')} onClick={() => setMobileMode('canvas')}>
            Canvas
          </button>
          <button className={tabBtnCls(mobileMode === 'inspector')} onClick={() => setMobileMode('inspector')}>
            Inspector
          </button>
        </div>

        <div className="rounded-xl border bg-background/60 p-3 backdrop-blur">
          {mobileMode === 'dock' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {media.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id)
                      setMobileMode('canvas')
                    }}
                    className={cn('group relative aspect-video overflow-hidden rounded-lg border', selectedId === m.id && 'ring-2 ring-primary')}
                  >
                    {m.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.thumb || m.src} alt={m.name ?? 'Bild'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="relative h-full w-full bg-black">
                        <video src={m.src} className="h-full w-full object-cover opacity-80" muted playsInline />
                        <div className="pointer-events-none absolute inset-0 grid place-items-center">
                          <Film className="h-6 w-6 text-white/80 drop-shadow" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <SmartToolsPanel sessionId={sessionId} selectedItemId={selectedId} compact />
              </div>
            </>
          )}

          {mobileMode === 'canvas' && (
            <div className="relative aspect-video overflow-hidden rounded-xl border bg-black">
              {!selected && <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">Wähle ein Medium</div>}

              {maskMode && selected && selected.kind === 'image' && (
                <MaskEditor
                  src={selected.src}
                  onSaved={(url) => {
                    setMaskUrl(url)
                    onObjectRemove().catch(console.error)
                  }}
                />
              )}

              {!maskMode && selected && selected.kind === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.src} alt={selected.name ?? 'Bild'} className="h-full w-full object-contain" style={{ filter: cssFilter }} />
              )}

              {!maskMode && selected && selected.kind === 'video' && (
                <video key={selected.src} src={selected.src} className="h-full w-full object-contain" controls playsInline style={{ filter: cssFilter }} />
              )}
            </div>
          )}

          {mobileMode === 'inspector' && (
            <InspectorPanel loading={isLoadingEdit} item={selected ?? undefined} editDoc={editDoc ? { id: editDoc.id, doc: editDoc.doc } : null} onChange={(p) => patchEditDoc(p)} selectionName={selected?.name} />
          )}
        </div>

        <div className="mt-2">
          <Timeline items={media} selectedId={selectedId} onSelect={setSelectedId} isPlaying={isPlaying} compact zoom={zoom} />
        </div>

        {userId && (
          <div className="mt-3 space-y-3">
            <VersionTimeline sessionId={sessionId} userId={userId} itemId={selectedId} />
            <RendersPanel userId={userId} sessionId={sessionId} />
            <SessionCommentPanel sessionId={sessionId} itemId={selectedId} me={{ id: userId, name: 'Ich' }} />
          </div>
        )}
      </div>
    </div>
  )
}

/* Helpers */
function tabBtnCls(active: boolean) {
  return cn('h-10 rounded-lg border text-sm font-medium', active ? 'bg-primary/10 border-primary' : 'hover:bg-accent')
}
function round2(n: number) {
  return Math.round(n * 100) / 100
}
function toNum(v: unknown): number {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

/* Hook: edit doc (leicht modernisiert, behaviour unchanged) */
type EditDocState = { id: string; doc: any; type?: 'photo' | 'video' }
function useEditDoc(sessionId: string, itemId: string | null) {
  const [editDoc, setEditDoc] = React.useState<EditDocState | null>(null)
  const [isLoadingEdit, setLoading] = React.useState(false)
  const patchQueue = React.useRef<Record<string, any> | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = React.useCallback(async () => {
    if (!itemId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/media/edits/${sessionId}/${encodeURIComponent(itemId)}`)
      if (!res.ok) {
        console.error('Failed to load edit doc', await res.text())
        setLoading(false)
        return
      }
      const doc = await res.json()
      setEditDoc({ id: doc.id, doc: doc.doc ?? {}, type: doc.type })
    } catch (err) {
      console.error('load edit doc error', err)
    } finally {
      setLoading(false)
    }
  }, [sessionId, itemId])

  React.useEffect(() => {
    setEditDoc(null)
    if (itemId) void load()
  }, [itemId, load])

  const patchEditDoc = React.useCallback((patch: Record<string, any>) => {
    if (!editDoc || !itemId) return
    const merged = { ...(editDoc.doc ?? {}), ...(patch ?? {}) }
    setEditDoc({ ...editDoc, doc: merged })

    patchQueue.current = { ...(patchQueue.current ?? {}), ...(patch ?? {}) }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const body = patchQueue.current
      patchQueue.current = null
      try {
        const res = await fetch(`/api/media/edits/${sessionId}/${encodeURIComponent(itemId)}`, {
          method: 'PATCH',
          body: JSON.stringify(body ?? {}),
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) console.error('PATCH edit_doc failed', await res.text())
      } catch (err) {
        console.error('PATCH edit_doc error', err)
      }
    }, 350)
  }, [editDoc, itemId, sessionId])

  return { editDoc, patchEditDoc, isLoadingEdit }
}
