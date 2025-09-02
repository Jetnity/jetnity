'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

import SessionList from './SessionList'
import SessionEditor from './SessionEditor'
import RightDock from './RightDock'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn as _cn } from '@/lib/utils'

import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels'

import {
  RefreshCw,
  Search,
  Save,
  Play,
  Eye,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { useRenderJob } from '@/lib/media/useRenderJob'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Session = Database['public']['Tables']['creator_sessions']['Row']

interface Props {
  userId: string
  activeSessionId?: string | null
  className?: string
}

export default function MediaStudioShell({
  userId,
  activeSessionId = null,
  className,
}: Props) {
  // ────────────────────────────────────────────────────────────────────────────
  // State
  // ────────────────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(activeSessionId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const firstLoadDone = useRef(false)
  const rightRef = useRef<ImperativePanelHandle>(null)

  // Render-Job Hook
  const { job, loading: jobStarting, error: jobError, startForSession } = useRenderJob()

  // ────────────────────────────────────────────────────────────────────────────
  // Data: Load + Realtime
  // ────────────────────────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('creator_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      const list = Array.isArray(data) ? data : []
      setSessions(list)

      if (!firstLoadDone.current) {
        firstLoadDone.current = true
        if (!selectedSessionId && list.length > 0) {
          setSelectedSessionId(list[0].id)
        }
      }
    } catch (e: any) {
      console.error('[MediaStudioShell] fetch error:', e?.message || e)
      setError('Konnte deine Sessions nicht laden.')
      setSessions([])
    } finally {
      setLoading(false)
      setBusy(false)
    }
  }, [userId, selectedSessionId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    if (activeSessionId) setSelectedSessionId(activeSessionId)
  }, [activeSessionId])

  useEffect(() => {
    const channel = supabase
      .channel('creator_sessions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creator_sessions', filter: `user_id=eq.${userId}` },
        (payload) => {
          setSessions((prev) => {
            if (payload.eventType === 'INSERT') {
              const row = payload.new as Session
              if (prev.some((p) => p.id === row.id)) return prev
              return [row, ...prev]
            }
            if (payload.eventType === 'UPDATE') {
              const row = payload.new as Session
              return prev.map((p) => (p.id === row.id ? row : p))
            }
            if (payload.eventType === 'DELETE') {
              const row = payload.old as Session
              const next = prev.filter((p) => p.id !== row.id)
              setSelectedSessionId((cur) => (cur === row.id ? next[0]?.id ?? null : cur))
              return next
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  // ────────────────────────────────────────────────────────────────────────────
  // Derived
  // ────────────────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter((s) => {
      const t = (s.title ?? '').toLowerCase()
      const c = (s.content ?? '').toLowerCase()
      return t.includes(q) || c.includes(q)
    })
  }, [sessions, filter])

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  )

  // ────────────────────────────────────────────────────────────────────────────
  // Actions & UX
  // ────────────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    window.dispatchEvent(new CustomEvent('media-studio:save', { detail: { sessionId: selectedSessionId } }))
  }, [selectedSessionId])

  const handleRender = useCallback(async () => {
    if (!selectedSessionId) return
    try {
      await startForSession(selectedSessionId, 'photo')
    } catch {
      /* Fehlerzustand wird bereits im Hook gesetzt */
    }
    window.dispatchEvent(new CustomEvent('media-studio:render', { detail: { sessionId: selectedSessionId } }))
  }, [selectedSessionId, startForSession])

  const handlePreview = useCallback(() => {
    window.dispatchEvent(new CustomEvent('media-studio:preview', { detail: { sessionId: selectedSessionId } }))
  }, [selectedSessionId])

  // Panel rechts ein-/ausklappen – robust gegen stale state
  const toggleRight = useCallback(() => {
    const api = rightRef.current
    if (!api) return
    setRightCollapsed((prev) => {
      const next = !prev
      if (next) api.collapse()
      else api.expand()
      return next
    })
  }, [])

  // Shortcuts: ⌘S / ⌘/
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey
      if (mod && key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (mod && e.key === '/') {
        e.preventDefault()
        toggleRight()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, toggleRight])

  const jobStatusBadge = useMemo(() => {
    if (jobStarting) {
      return (
        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-700" aria-live="polite">
          Render startet…
        </span>
      )
    }
    if (jobError) {
      return (
        <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs text-red-700" aria-live="polite">
          Render-Fehler
        </span>
      )
    }
    if (!job) return null

    const status = (job.status || '').toLowerCase()
    const color =
      status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
      status === 'failed' ? 'bg-red-100 text-red-700' :
      status === 'processing' ? 'bg-blue-100 text-blue-700' :
      status === 'queued' ? 'bg-gray-100 text-gray-700' :
      'bg-gray-100 text-gray-700'

    return (
      <div className="flex items-center gap-2" aria-live="polite">
        <span className={cn('rounded-md px-2 py-0.5 text-xs', color)}>
          {status.toUpperCase()}
        </span>
        {typeof job.progress === 'number' && (
          <div className="h-1.5 w-28 overflow-hidden rounded bg-muted" aria-hidden>
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${Math.max(0, Math.min(100, job.progress))}%` }}
            />
          </div>
        )}
      </div>
    )
  }, [job, jobStarting, jobError])

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn('h-[calc(100vh-4rem)] w-full', className)}>
      <PanelGroup direction="horizontal" className="bg-background">
        {/* LEFT – Sessionliste + Suche (Sticky) */}
        <Panel defaultSize={22} minSize={16} maxSize={32} className="border-r">
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="text-xs text-muted-foreground">
                  {loading ? 'Lade…' : `${sessions.length} Session${sessions.length === 1 ? '' : 's'}`}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-[220px]">
                    <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Suchen…"
                      className="h-9 pl-8"
                      aria-label="Sessions durchsuchen"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSessions}
                    disabled={busy}
                    title="Neu laden"
                    aria-label="Neu laden"
                  >
                    <RefreshCw className={cn('mr-2 h-4 w-4', busy && 'animate-spin')} />
                    Aktualisieren
                  </Button>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {error ? (
                <div className="p-4 text-sm text-destructive">{error}</div>
              ) : (
                <SessionList
                  sessions={filtered}
                  selectedSessionId={selectedSessionId}
                  onSelect={setSelectedSessionId}
                />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="group data-[orientation=vertical]:w-2">
          <div className="mx-auto h-8 w-0.5 rounded-full bg-border opacity-50 group-hover:opacity-100" />
        </PanelResizeHandle>

        {/* MIDDLE – Editor mit Sticky Actions */}
        <Panel defaultSize={56} minSize={36} className="border-r">
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between gap-2 px-4 py-2">
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold leading-6">
                    {selectedSession?.title || 'Media Studio'}
                  </h1>
                  <p className="hidden text-xs text-muted-foreground md:block">
                    ⌘S Speichern · ⌘/ Snippets · Z/Y Undo/Redo (bald)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {jobStatusBadge}
                  <Button size="sm" variant="outline" onClick={handlePreview} disabled={!selectedSession}>
                    <Eye className="mr-2 h-4 w-4" />
                    Vorschau
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleRender} disabled={!selectedSession || jobStarting}>
                    <Play className="mr-2 h-4 w-4" />
                    {jobStarting ? 'Startet…' : 'Rendern'}
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!selectedSession}>
                    <Save className="mr-2 h-4 w-4" />
                    Speichern
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={rightCollapsed ? 'Snippets einblenden' : 'Snippets ausblenden'}
                    onClick={toggleRight}
                    className="ml-1"
                  >
                    {rightCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              {selectedSession ? (
                <SessionEditor session={selectedSession} />
              ) : (
                <div className="grid h-full place-items-center p-6 text-sm text-muted-foreground">
                  Bitte wähle links eine Session aus oder erstelle eine neue.
                </div>
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="group data-[orientation=vertical]:w-2">
          <div className="mx-auto h-8 w-0.5 rounded-full bg-border opacity-50 group-hover:opacity-100" />
        </PanelResizeHandle>

        {/* RIGHT – KI / Snippets / Publish (collapsible) */}
        <Panel
          ref={rightRef}
          defaultSize={22}
          minSize={16}
          maxSize={32}
          collapsible
          className="bg-muted/20"
        >
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between px-4 py-2">
                <h2 className="text-sm font-medium">KI-Snippets</h2>
                <span className="text-xs text-muted-foreground">⌘/</span>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <RightDock
                userId={userId}
                sessionId={selectedSession?.id ?? null}
                title={selectedSession?.title ?? ''}
                content={selectedSession?.content ?? ''}
                kind="photo"  // aktuell: Foto-Inspector anzeigen; später dynamisch setzen
              />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
