// components/creator/media-studio/PublishSessionButton.tsx
'use client'

import { useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { generateStoryInsights } from '@/lib/openai/generateStoryInsights'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Loader2, CheckCircle2, Globe, Link as LinkIcon, Shield, EyeOff, X, Sparkles,
  RotateCcw, CalendarClock, UploadCloud, DownloadCloud, Ban, AlertTriangle
} from 'lucide-react'

/* ---------- Types ---------- */

type Visibility = 'public' | 'unlisted' | 'private'
type Action = 'publish' | 'analyze' | 'unpublish' | 'republish' | 'schedule'

interface Props {
  sessionId: string
  defaultVisibility?: Visibility
  onPublished?: (opts: { sessionId: string; visibility: Visibility; rating?: number | null }) => void
}

/* ---------- Component ---------- */

export default function PublishSessionButton({
  sessionId,
  defaultVisibility = 'public',
  onPublished,
}: Props) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<Action>('publish')

  const [visibility, setVisibility] = useState<Visibility>(defaultVisibility)
  const [note, setNote] = useState('')
  const [scheduleAt, setScheduleAt] = useState<string>('') // "yyyy-MM-ddTHH:mm"
  const [unpublishReason, setUnpublishReason] = useState('')

  const [step, setStep] = useState<'idle' | 'preflight' | 'loading' | 'analyzing' | 'updating' | 'done'>('idle')
  const [error, setError] = useState<string>('')
  const [warn, setWarn] = useState<string>('')
  const [success, setSuccess] = useState<{ rating?: number | null; insights?: string } | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const lastPublishedRef = useRef<{ visibility?: Visibility | null } | null>(null)

  const canInteract = step === 'idle' || step === 'done'

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    // Passe an eure öffentliche Route an
    return `${window.location.origin}/story/${sessionId}`
  }, [sessionId])

  /* ---------- Helpers ---------- */

  function resetState() {
    setStep('idle')
    setError('')
    setWarn('')
    setSuccess(null)
    abortRef.current?.abort()
    abortRef.current = null
  }

  async function updateOptionalColumnsSafe(table: string, id: string, patch: Record<string, any>) {
    for (const [key, value] of Object.entries(patch)) {
      try {
        const { error } = await (supabase.from as any)(table).update({ [key]: value }).eq('id', id)
        if (error) {
          const msg = (error as any)?.message ?? ''
          // Spalte existiert nicht → ignorieren, damit Code in allen Schemas läuft
          if (/column .* does not exist/i.test(msg) || /unknown column/i.test(msg)) continue
        }
      } catch {}
    }
  }

  async function fetchSnippets() {
    const { data, error } = await supabase
      .from('session_snippets')
      .select('content')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })
    if (error || !data?.length) {
      throw new Error('Snippets konnten nicht geladen werden.')
    }
    return data.map(s => s.content ?? '').filter(Boolean)
  }

  async function readSession() {
    const { data, error } = await supabase
      .from('creator_sessions')
      .select('id, user_id, status, visibility, published_at, rating, insights')
      .eq('id', sessionId)
      .single()
    if (error || !data) throw new Error('Session konnte nicht gelesen werden.')
    return data
  }

  function copyShareLink() {
    if (!shareUrl) return
    navigator.clipboard?.writeText(shareUrl).catch(() => {})
  }

  /* ---------- Preflight (Qualität + Policy Heuristics) ---------- */

  function quickHeuristic(text: string) {
    const minChars = 120
    const banned = ['bomb', 'terror', 'kill'] // simple demo; erweiterbar
    const warnList = ['nsfw', 'hate', 'drugs']

    if (text.replace(/\s+/g, '').length < minChars) {
      return { ok: false, error: `Text zu kurz (${text.length} Zeichen).` }
    }
    const low = text.toLowerCase()
    if (banned.some(w => low.includes(w))) {
      return { ok: false, error: 'Inhalt enthält gesperrte Begriffe.' }
    }
    if (warnList.some(w => low.includes(w))) {
      return { ok: true, warn: 'Inhalt könnte sensibel sein. Prüfe Sichtbarkeit & Richtlinien.' }
    }
    return { ok: true as const }
  }

  /* ---------- Actions ---------- */

  async function runAnalyzeOnly() {
    setError(''); setWarn(''); setSuccess(null)
    setStep('loading')
    try {
      const snippets = await fetchSnippets()
      const storyText = snippets.join('\n')

      // Preflight
      setStep('preflight')
      const pf = quickHeuristic(storyText)
      if (!pf.ok) { setError(pf.error!); setStep('idle'); return }
      if (pf.warn) setWarn(pf.warn)

      setStep('analyzing')
      abortRef.current = new AbortController()
      const { rating, insights } = await generateStoryInsights(storyText)
      abortRef.current = null

      setStep('updating')
      await updateOptionalColumnsSafe('creator_sessions', sessionId, {
        rating: rating ?? null,
        insights: insights ?? null,
        analysis_hash: await safeHash(storyText), // optional column
        analysis_updated_at: new Date().toISOString(),
      })

      setSuccess({ rating, insights })
      setStep('done')
    } catch (e: any) {
      setError(e?.message ?? 'Analyse fehlgeschlagen.')
      setStep('idle')
    } finally {
      abortRef.current = null
    }
  }

  async function runPublish() {
    setError(''); setWarn(''); setSuccess(null)
    setStep('loading')
    try {
      const current = await readSession()
      lastPublishedRef.current = { visibility: current.visibility as Visibility | null }

      const snippets = await fetchSnippets()
      const storyText = snippets.join('\n')

      // Preflight
      setStep('preflight')
      const pf = quickHeuristic(storyText)
      if (!pf.ok) { setError(pf.error!); setStep('idle'); return }
      if (pf.warn) setWarn(pf.warn)

      setStep('analyzing')
      abortRef.current = new AbortController()
      let rating: number | null | undefined = null
      let insights: string | undefined
      try {
        const ai = await generateStoryInsights(storyText)
        rating = ai?.rating ?? null
        insights = ai?.insights ?? ''
      } catch {
        insights = (insights ?? '') + '\n\n(Analyse momentan nicht verfügbar.)'
      } finally {
        abortRef.current = null
      }

      setStep('updating')

      // Pflicht-Update
      const basePatch: Record<string, any> = {
        status: 'approved',
        visibility,
        published_at: new Date().toISOString(),
      }
      await updateOptionalColumnsSafe('creator_sessions', sessionId, basePatch)

      // Optionale Analysefelder
      await updateOptionalColumnsSafe('creator_sessions', sessionId, {
        rating: rating ?? null,
        insights: insights ?? null,
        analysis_hash: await safeHash(storyText),
        analysis_updated_at: new Date().toISOString(),
      })

      // Events (best-effort)
      try {
        await (supabase.from as any)('creator_publish_events').insert({
          session_id: sessionId,
          type: 'publish',
          visibility,
          note: note || null,
          rating,
          created_at: new Date().toISOString(),
        })
      } catch {}

      // Metrics anlegen (best-effort)
      try {
        await (supabase.from as any)('creator_session_metrics')
          .upsert({ session_id: sessionId, impressions: 0, views: 0 }, { onConflict: 'session_id' })
      } catch {}

      setSuccess({ rating, insights })
      setStep('done')
      onPublished?.({ sessionId, visibility, rating: rating ?? null })
    } catch (e: any) {
      setError(e?.message ?? 'Veröffentlichung fehlgeschlagen.')
      setStep('idle')
    }
  }

  async function runUnpublish() {
    setError(''); setWarn(''); setSuccess(null)
    setStep('updating')
    try {
      const current = await readSession()
      lastPublishedRef.current = { visibility: current.visibility as Visibility | null }

      await updateOptionalColumnsSafe('creator_sessions', sessionId, {
        status: 'draft',
        visibility: 'private',
        unpublished_at: new Date().toISOString(),
        unpublish_reason: unpublishReason || null,
      })

      try {
        await (supabase.from as any)('creator_publish_events').insert({
          session_id: sessionId,
          type: 'unpublish',
          visibility_before: current.visibility ?? null,
          reason: unpublishReason || null,
          created_at: new Date().toISOString(),
        })
      } catch {}

      setSuccess({}) // simple „done“
      setStep('done')
    } catch (e: any) {
      setError(e?.message ?? 'Unpublish fehlgeschlagen.')
      setStep('idle')
    }
  }

  async function runRepublish() {
    // nutzt gemerkte Sichtbarkeit (falls vorhanden), sonst default
    const prev = lastPublishedRef.current?.visibility ?? defaultVisibility
    setVisibility(prev as Visibility)
    await runPublish()
  }

  async function runSchedule() {
    setError(''); setWarn(''); setSuccess(null)
    // minimal validieren
    const when = parseLocalDate(scheduleAt)
    if (!when || when.getTime() <= Date.now() + 60_000) {
      setError('Bitte ein zukünftiges Datum/Uhrzeit wählen (mind. +1 Minute).')
      return
    }
    setStep('updating')
    try {
      // Versuche geplanten Job zu speichern; wenn Tabelle fehlt → Fallback: sofort publizieren
      const { error } = await (supabase.from as any)('creator_publish_schedule')
        .insert({
          session_id: sessionId,
          visibility,
          run_at: when.toISOString(),
          note: note || null,
          status: 'scheduled',
          created_at: new Date().toISOString(),
        })
      if (error) {
        // Fallback
        await runPublish()
        return
      }
      try {
        await (supabase.from as any)('creator_publish_events').insert({
          session_id: sessionId,
          type: 'schedule',
          visibility,
          scheduled_for: when.toISOString(),
          created_at: new Date().toISOString(),
        })
      } catch {}
      setSuccess({})
      setStep('done')
    } catch (e: any) {
      setError(e?.message ?? 'Terminieren fehlgeschlagen.')
      setStep('idle')
    }
  }

  /* ---------- crypto helper for analysis hash ---------- */

  async function safeHash(text: string) {
    try {
      const enc = new TextEncoder().encode(text)
      const buf = await crypto.subtle.digest('SHA-256', enc)
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      return null
    }
  }

  /* ---------- Render ---------- */

  const isBusy = step === 'loading' || step === 'analyzing' || step === 'updating' || step === 'preflight'
  const progressLabel =
    step === 'preflight'  ? 'Preflight-Checks …'
    : step === 'loading'   ? 'Snippets laden …'
    : step === 'analyzing' ? 'KI-Analyse läuft …'
    : step === 'updating'  ? 'Wird aktualisiert …'
    : step === 'done'      ? 'Fertig'
    : ''

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); setOpen(o) }}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full" disabled={!canInteract}>
            {step === 'done' ? '✅ Fertig' : '🌍 Veröffentlichen / Verwalten'}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Session veröffentlichen & verwalten</DialogTitle>
            <DialogDescription>
              Veröffentliche sofort, plane einen Termin, analysiere erneut oder nimm die Session offline.
            </DialogDescription>
          </DialogHeader>

          {/* Action Switch */}
          <ActionSwitch action={action} setAction={setAction} />

          {/* Panels */}
          <div className="mt-3 space-y-4">
            {(action === 'publish' || action === 'republish' || action === 'schedule') && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">Sichtbarkeit</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <VisibilityPill icon={Globe}  label="Öffentlich" active={visibility === 'public'} onClick={() => setVisibility('public')} />
                    <VisibilityPill icon={Shield} label="Unlisted"  active={visibility === 'unlisted'} onClick={() => setVisibility('unlisted')} />
                    <VisibilityPill icon={EyeOff} label="Privat"    active={visibility === 'private'} onClick={() => setVisibility('private')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="note" className="text-sm">Notiz (optional)</Label>
                  <Input id="note" placeholder="Kurze Notiz für Verlauf/Events …" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>

                {action === 'schedule' && (
                  <div className="space-y-1">
                    <Label htmlFor="dt" className="text-sm">Termin (Datum & Uhrzeit)</Label>
                    <Input id="dt" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Zeitzone des Browsers. Minimum: +1 Minute.</p>
                  </div>
                )}
              </div>
            )}

            {action === 'unpublish' && (
              <div className="space-y-2">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Die Session wird aus dem öffentlichen Feed entfernt.</span>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reason" className="text-sm">Grund (optional)</Label>
                  <Input id="reason" placeholder="z.B. Fehler entdeckt, Rework notwendig …" value={unpublishReason} onChange={(e) => setUnpublishReason(e.target.value)} />
                </div>
              </div>
            )}

            {/* Status / Messages */}
            {(isBusy || progressLabel) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{progressLabel}</span>
              </div>
            )}
            {warn && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {warn}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Aktion erfolgreich{typeof success.rating === 'number' ? ` • Rating ${success.rating}/100` : ''}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 flex items-center justify-between gap-2">
            {/* Left cluster */}
            <div className="flex flex-wrap items-center gap-2">
              {action !== 'analyze' && (
                <Button type="button" size="sm" variant="outline" onClick={runAnalyzeOnly} disabled={isBusy}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Nur analysieren
                </Button>
              )}
              {success && (
                <Button type="button" size="sm" variant="outline" onClick={copyShareLink}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Link kopieren
                </Button>
              )}
            </div>

            {/* Right cluster */}
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isBusy}>
                <X className="mr-2 h-4 w-4" />
                Schließen
              </Button>

              {action === 'publish' && (
                <Button type="button" size="sm" onClick={runPublish} disabled={isBusy}>
                  {isBusy ? <BusyLabel label="Veröffentlichen" /> : <><UploadCloud className="mr-2 h-4 w-4" />Veröffentlichen</>}
                </Button>
              )}
              {action === 'republish' && (
                <Button type="button" size="sm" onClick={runRepublish} disabled={isBusy}>
                  {isBusy ? <BusyLabel label="Re-Publish" /> : <><DownloadCloud className="mr-2 h-4 w-4" />Re-Publish</>}
                </Button>
              )}
              {action === 'unpublish' && (
                <Button type="button" size="sm" variant="danger" onClick={runUnpublish} disabled={isBusy}>
                  {isBusy ? <BusyLabel label="Unpublish" /> : <><Ban className="mr-2 h-4 w-4" />Unpublish</>}
                </Button>
              )}
              {action === 'schedule' && (
                <Button type="button" size="sm" onClick={runSchedule} disabled={isBusy}>
                  {isBusy ? <BusyLabel label="Planen" /> : <><CalendarClock className="mr-2 h-4 w-4" />Planen</>}
                </Button>
              )}
              {action === 'analyze' && (
                <Button type="button" size="sm" onClick={runAnalyzeOnly} disabled={isBusy}>
                  {isBusy ? <BusyLabel label="Analysieren" /> : <><Sparkles className="mr-2 h-4 w-4" />Analysieren</>}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schnellzugriff nach Erfolg */}
      {success && (
        <div className="flex items-center justify-between gap-2">
          <Button size="sm" variant="outline" onClick={copyShareLink} className="w-full">
            <LinkIcon className="mr-2 h-4 w-4" />
            Öffentlichen Link kopieren
          </Button>
        </div>
      )}
    </div>
  )
}

/* ---------- Small UI bits ---------- */

function ActionSwitch({ action, setAction }: { action: Action; setAction: (a: Action) => void }) {
  const items: { id: Action; label: string; icon: any }[] = [
    { id: 'publish',   label: 'Publish',    icon: UploadCloud },
    { id: 'schedule',  label: 'Planen',     icon: CalendarClock },
    { id: 'analyze',   label: 'Analyse',    icon: Sparkles },
    { id: 'unpublish', label: 'Unpublish',  icon: Ban },
    { id: 'republish', label: 'Re-Publish', icon: RotateCcw },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {items.map(({ id, label, icon: Icon }) => {
        const active = action === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setAction(id)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-2 py-1.5 text-xs',
              active ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
            )}
            aria-pressed={active}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function VisibilityPill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-lg border px-2 py-1.5 text-xs',
        active ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
      )}
      aria-pressed={active}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function BusyLabel({ label }: { label: string }) {
  return (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label} …
    </>
  )
}

/* ---------- tiny utils ---------- */

function parseLocalDate(v: string): Date | null {
  // expects "yyyy-MM-ddTHH:mm"
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}
