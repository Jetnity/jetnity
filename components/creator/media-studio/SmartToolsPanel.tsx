// components/creator/media-studio/SmartToolsPanel.tsx
'use client'

import * as React from 'react'
import { Wand2, Scissors, Eraser, Captions, Loader2, Info } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type JobType = 'auto_color' | 'auto_cut' | 'object_remove' | 'subtitles'

export default function SmartToolsPanel({
  sessionId,
  selectedItemId,
  selectedItemKind,
  compact,
  onRequestMask,
  onStarted,
  className,
}: {
  sessionId: string
  selectedItemId: string | null
  /** optional: steuert Enable/Disable (image/video) */
  selectedItemKind?: 'image' | 'video' | null
  /** optional: Kompaktmodus für kleinere Darstellung */
  compact?: boolean
  /** optional: Parent kann damit in den Maskenmodus wechseln */
  onRequestMask?: () => void
  /** optional: Callback, wenn Render-Job gestartet wurde */
  onStarted?: (jobId: string) => void
  className?: string
}) {
  const [busy, setBusy] = React.useState<JobType | null>(null)
  const [jobId, setJobId] = React.useState<string | null>(null)
  const [progress, setProgress] = React.useState<number>(0)
  const [status, setStatus] = React.useState<'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled' | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Realtime-Subscribe für den aktiven Job
  React.useEffect(() => {
    if (!jobId) return
    const ch = supabase
      .channel(`render_job_${jobId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'render_jobs', filter: `id=eq.${jobId}` },
        (p: any) => {
          const row = (p.new ?? p.old) as any
          if (!row) return
          if (typeof row.progress === 'number') setProgress(Math.max(0, Math.min(100, row.progress)))
          if (row.status) setStatus(row.status)
          if (row.error_message) setError(row.error_message)
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(ch) }
  }, [jobId])

  // Beende Busy-State, wenn Job fertig
  React.useEffect(() => {
    if (!status || !busy) return
    if (status === 'succeeded' || status === 'failed' || status === 'canceled') {
      const t = setTimeout(() => {
        setBusy(null)
        // Kleine Abklingzeit für die Progress-Anzeige
        setJobId(null)
        setStatus(null)
        setProgress(0)
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [status, busy])

  async function run(type: JobType, params: Record<string, any> = {}) {
    if (!selectedItemId) return
    setError(null)
    setBusy(type)
    setProgress(0)
    setStatus('queued')
    setJobId(null)

    try {
      const res = await fetch('/api/media/render', {
        method: 'POST',
        body: JSON.stringify({ sessionId, itemId: selectedItemId, jobType: type, params }),
      })

      if (!res.ok) {
        const j = await safeJson(res)
        throw new Error(j?.error ?? `Request failed (${res.status})`)
      }

      const json = await safeJson(res)
      const id = json?.id ?? json?.jobId ?? json?.job?.id ?? null
      if (id) {
        setJobId(String(id))
        onStarted?.(String(id))
      } else {
        // Falls Backend keine ID zurückgibt, lassen wir Busy nach kurzer Zeit enden
        setTimeout(() => {
          setBusy(null)
          setStatus(null)
        }, 1000)
      }
    } catch (e: any) {
      setError(e?.message || String(e))
      setBusy(null)
      setStatus('failed')
    }
  }

  const canRun = Boolean(selectedItemId) && !busy
  const isVideo = selectedItemKind === 'video'
  const isImage = selectedItemKind === 'image'

  return (
    <div className={cn('rounded-lg border bg-background/60', compact ? 'p-2' : 'p-3', className)}>
      <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1')}>
        {/* Auto-Color */}
        <ToolButton
          icon={<Wand2 className="h-4 w-4" />}
          label="Auto-Color"
          title="Automatische Farboptimierung (AI)"
          onClick={() => run('auto_color')}
          disabled={!canRun}
          active={busy === 'auto_color'}
        />

        {/* Auto-Cut (nur Video sinnvoll) */}
        <ToolButton
          icon={<Scissors className="h-4 w-4" />}
          label="Auto-Cut (30s)"
          title="Highlightschnitt erzeugen (AI)"
          onClick={() => run('auto_cut', { targetDurationSec: 30 })}
          disabled={!canRun || (selectedItemKind ? !isVideo : false)}
          active={busy === 'auto_cut'}
        />

        {/* Untertitel (nur Video) */}
        <ToolButton
          icon={<Captions className="h-4 w-4" />}
          label="Untertitel (AI)"
          title="Automatisch transkribieren & Untertitel erzeugen"
          onClick={() => run('subtitles')}
          disabled={!canRun || (selectedItemKind ? !isVideo : false)}
          active={busy === 'subtitles'}
        />

        {/* Objekt entfernen (Bild) – wenn onRequestMask vorhanden, in Maskenmodus wechseln */}
        <ToolButton
          icon={<Eraser className="h-4 w-4" />}
          label="Objekt entfernen"
          title="Unerwünschte Objekte entfernen (AI) · Tipp: Maske zeichnen"
          onClick={() => {
            if (onRequestMask) onRequestMask()
            else void run('object_remove') // Fallback ohne Maske
          }}
          disabled={!canRun || (selectedItemKind ? !isImage : false)}
          active={busy === 'object_remove'}
        />
      </div>

      {/* Status/Progress */}
      <div className="mt-2 space-y-1">
        {!selectedItemId && (
          <p className="text-xs text-muted-foreground">Wähle oben ein Medium aus.</p>
        )}

        {busy && (
          <div className="rounded-md border bg-muted/30 p-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Starte {labelOf(busy)} …</span>
              {status && <span className="ml-auto uppercase tracking-wide">{status}</span>}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted">
              <div
                className={cn(
                  'h-full transition-all',
                  status === 'failed' ? 'bg-red-500' : 'bg-foreground'
                )}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
          </div>
        )}

        {!busy && (
          <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5" />
            <span>
              Auto-Color für Bild & Video · Auto-Cut/Untertitel für Video · Objekt entfernen für Bilder.
              Im <em>Editor</em> kannst du optional eine Maske zeichnen, bevor du „Objekt entfernen“ startest.
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

/* ───────────────────── UI Subcomponent ───────────────────── */

function ToolButton({
  icon,
  label,
  title,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode
  label: string
  title?: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition',
        'hover:bg-accent disabled:opacity-50',
        active && 'bg-primary/10'
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
      {label}
    </button>
  )
}

/* ───────────────────── Helpers ───────────────────── */

function labelOf(t: JobType) {
  switch (t) {
    case 'auto_color': return 'Auto-Color'
    case 'auto_cut': return 'Auto-Cut'
    case 'subtitles': return 'Untertitel'
    case 'object_remove': return 'Objekt entfernen'
    default: return t
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}
