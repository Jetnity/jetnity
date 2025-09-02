'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Session = Database['public']['Tables']['creator_sessions']['Row']

interface Props {
  session: Session
}

type Baseline = {
  title: string
  content: string
  updatedAt: Date | null
}

export default function SessionEditor({ session }: Props) {
  // ── Baseline & Initials
  const initialTitle = session.title ?? ''
  const initialContent = session.content ?? ''
  const initialUpdatedAt =
    (session as any)?.updated_at ? new Date((session as any).updated_at) : null

  const baselineRef = useRef<Baseline>({
    title: initialTitle,
    content: initialContent,
    updatedAt: initialUpdatedAt,
  })

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )
  const [hasQueuedSave, setHasQueuedSave] = useState(false)

  // Draft / Restore
  const draftKey = `session:draft:${session.id}`
  const [restoreAvailable, setRestoreAvailable] = useState<null | {
    title: string
    content: string
    updatedAt: number
  }>(null)

  // Remote change detection
  const [remoteUpdate, setRemoteUpdate] = useState<null | {
    title: string
    content: string
    updatedAt: Date
  }>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Derived
  const canSave = useMemo(
    () =>
      title !== baselineRef.current.title ||
      content !== baselineRef.current.content,
    [title, content]
  )

  const savedText = useMemo(() => {
    if (offline) return 'Offline – Änderungen werden zwischengespeichert'
    if (saving) return 'Speichere …'
    if (error) return `Fehler: ${error}`
    if (savedAt) return `Gespeichert · ${savedAt.toLocaleTimeString()}`
    return '—'
  }, [saving, savedAt, error, offline])

  // ── Session-Wechsel
  useEffect(() => {
    const t = session.title ?? ''
    const c = session.content ?? ''
    const u =
      (session as any)?.updated_at ? new Date((session as any).updated_at) : null

    baselineRef.current = { title: t, content: c, updatedAt: u }
    setTitle(t)
    setContent(c)
    setSavedAt(null)
    setError(null)
    setRemoteUpdate(null)

    // Draft prüfen
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const j = JSON.parse(raw) as {
          title: string
          content: string
          updatedAt: number
        }
        if (!u || (j.updatedAt && j.updatedAt > u.getTime())) {
          setRestoreAvailable(j)
        } else {
          localStorage.removeItem(draftKey)
          setRestoreAvailable(null)
        }
      } else {
        setRestoreAvailable(null)
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  // ── Online/Offline
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // ── Realtime: externe Updates
  useEffect(() => {
    const ch = supabase
      .channel(`creator_sessions_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creator_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const row = payload.new as any
          const updatedAt = row?.updated_at
            ? new Date(row.updated_at)
            : new Date()
          const isExternal =
            row.title !== baselineRef.current.title ||
            row.content !== baselineRef.current.content

          if (isExternal) {
            setRemoteUpdate({
              title: row.title ?? '',
              content: row.content ?? '',
              updatedAt,
            })
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(ch)
    }
  }, [session.id])

  // ── Autosave (debounced) + Draft persistieren
  useEffect(() => {
    try {
      const payload = { title, content, updatedAt: Date.now() }
      localStorage.setItem(draftKey, JSON.stringify(payload))
    } catch {}

    if (!canSave) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void doSave()
    }, 800)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [title, content, canSave, draftKey])

  // ── Save
  const doSave = useCallback(
    async (force = false) => {
      if (!canSave && !force) return
      if (offline) {
        setHasQueuedSave(true)
        setSavedAt(null)
        return
      }
      setSaving(true)
      setError(null)

      try {
        const conditional = baselineRef.current.updatedAt?.toISOString()
        let q = supabase
          .from('creator_sessions')
          .update({ title: title.trim(), content })
          .eq('id', session.id)

        // Optimistic Concurrency
        if (conditional) q = q.eq('updated_at', conditional as unknown as string)

        const { data, error } = await q
          .select('id, updated_at, title, content')
          .single()

        if (error) {
          const msg = error.message || 'Update fehlgeschlagen'
          setError(
            msg.includes('No rows')
              ? 'Konflikt: Diese Session wurde extern geändert.'
              : msg
          )
          setSaving(false)
          return
        }

        const newUpdatedAt =
          (data as any)?.updated_at
            ? new Date((data as any).updated_at)
            : new Date()

        baselineRef.current = {
          title: title.trim(),
          content,
          updatedAt: newUpdatedAt,
        }
        setSavedAt(new Date())
        setSaving(false)
        setError(null)
        setRemoteUpdate(null)

        try {
          localStorage.removeItem(draftKey)
          setRestoreAvailable(null)
        } catch {}
      } catch (e: any) {
        setSaving(false)
        setError(e?.message || 'Speichern fehlgeschlagen')
      }
    },
    [title, content, session.id, offline, canSave, draftKey]
  )

  // ── Nach Online wieder speichern
  useEffect(() => {
    if (!offline && hasQueuedSave) {
      setHasQueuedSave(false)
      void doSave(true)
    }
  }, [offline, hasQueuedSave, doSave])

  // ── Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && (k === 's' || k === 'enter')) {
        e.preventDefault()
        void doSave(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.altKey && k === 's') {
        e.preventDefault()
        void createSnapshot()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doSave])

  // ── Actions
  const restoreDraft = useCallback(() => {
    if (!restoreAvailable) return
    setTitle(restoreAvailable.title)
    setContent(restoreAvailable.content)
    setRestoreAvailable(null)
  }, [restoreAvailable])

  const discardChanges = useCallback(() => {
    setTitle(baselineRef.current.title)
    setContent(baselineRef.current.content)
    setError(null)
    setSavedAt(null)
  }, [])

  const applyRemoteUpdate = useCallback(() => {
    if (!remoteUpdate) return
    setTitle(remoteUpdate.title)
    setContent(remoteUpdate.content)
    baselineRef.current.updatedAt = remoteUpdate.updatedAt
    setRemoteUpdate(null)
  }, [remoteUpdate])

  // ── Snapshot (session_versions)
  const [snapBusy, setSnapBusy] = useState(false)
  const [snapMsg, setSnapMsg] = useState<string | null>(null)

  const createSnapshot = useCallback(async () => {
    if (snapBusy) return
    setSnapBusy(true)
    setSnapMsg(null)
    try {
      await doSave(true)

      const payload: any = {
        session_id: session.id,
        title: title.trim(),
        content,
        meta: {
          title_len: title.trim().length,
          content_len: (content ?? '').length,
          created_from: 'editor',
        },
      }

      const { error } = await supabase.from('session_versions').insert(payload)
      if (error) throw error
      setSnapMsg('Snapshot gespeichert.')
      setTimeout(() => setSnapMsg(null), 2500)
    } catch (e: any) {
      setSnapMsg(`Fehler: ${e?.message || e}`)
    } finally {
      setSnapBusy(false)
    }
  }, [session.id, title, content, doSave, snapBusy])

  // ── UI
  return (
    <div className="relative flex min-h-full flex-col">
      {/* Hinweise */}
      {restoreAvailable && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Lokaler Entwurf gefunden (neuere Änderungen).{' '}
          <button
            onClick={restoreDraft}
            className="underline underline-offset-2 hover:opacity-80"
          >
            Entwurf wiederherstellen
          </button>{' '}
          oder{' '}
          <button
            onClick={() => {
              localStorage.removeItem(draftKey)
              setRestoreAvailable(null)
            }}
            className="underline underline-offset-2 hover:opacity-80"
          >
            verwerfen
          </button>
          .
        </div>
      )}

      {remoteUpdate && (
        <div className="mx-4 mt-3 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-xs text-sky-900">
          Diese Session wurde in der Zwischenzeit <strong>aktualisiert</strong>.{' '}
          <button
            onClick={applyRemoteUpdate}
            className="underline underline-offset-2 hover:opacity-80"
          >
            Änderungen übernehmen
          </button>{' '}
          oder weiter bearbeiten (deine Änderungen bleiben erhalten).
        </div>
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <Input
            value={title}
            onChange={(e: any) => {
              const v =
                typeof e === 'string'
                  ? e
                  : (e?.target as HTMLInputElement)?.value ?? ''
              setTitle(v.slice(0, 120))
            }}
            placeholder="Titel"
            className="h-9 min-w-0 flex-1 font-medium"
            aria-label="Session-Titel"
            maxLength={120}
          />
          <span className="text-[11px] text-muted-foreground">
            {title.trim().length}/120
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() => void doSave(true)}
            isLoading={saving}
            disabled={!canSave || offline}
          >
            Speichern
          </Button>

          <Button
            size="sm"
            variant="soft"
            onClick={createSnapshot}
            isLoading={snapBusy}
            loadingText="Speichere…"
            title="Snapshot speichern (⌘/Ctrl+Alt+S)"
          >
            Snapshot
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={discardChanges}
            disabled={!canSave}
            title="Änderungen verwerfen"
          >
            Verwerfen
          </Button>

          <span
            className="min-w-[220px] text-right text-xs text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {snapMsg ? snapMsg : savedText}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          Story, Shots, Szenen, Hooks, Captions …
        </label>
        <Textarea
          value={content}
          onChange={(e: any) => {
            const v =
              typeof e === 'string'
                ? e
                : (e?.target as HTMLTextAreaElement)?.value ?? ''
            setContent(v)
          }}
          placeholder="Beschreibe deine Story, Shots, Szenen, Hooks, Captions …"
          className="min-h-[48vh] w-full resize-y text-sm leading-6"
          aria-label="Session-Inhalt"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Tipp: ⌘/Ctrl + S speichert, ⌘/Ctrl + ⌥/Alt + S Snapshot.
          </p>
          {error && (
            <Button
              size="xs"
              variant="link"
              onClick={() => void doSave(true)}
              className="px-0"
            >
              Erneut versuchen
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
