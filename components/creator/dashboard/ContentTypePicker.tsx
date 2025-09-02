'use client'

import * as React from 'react'
import { useId, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Video, Image as ImageIcon, BookOpen, FileText, BookText, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type ContentType = 'video' | 'image' | 'guide' | 'blog' | 'story' | 'other'
const ICONS: Record<ContentType, React.ReactNode> = {
  video: <Video className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  guide: <BookOpen className="h-3.5 w-3.5" />,
  blog: <FileText className="h-3.5 w-3.5" />,
  story: <BookText className="h-3.5 w-3.5" />,
  other: <MoreHorizontal className="h-3.5 w-3.5" />,
}
const OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Bild' },
  { value: 'guide', label: 'Guide' },
  { value: 'blog', label: 'Blog' },
  { value: 'story', label: 'Story' },
  { value: 'other', label: 'Sonstiges' },
]
const ALLOWED = new Set<ContentType>(OPTIONS.map(o => o.value))

export default function ContentTypePicker({
  sessionId,
  initialType,
  className,
  onSaved,
  renderMode = 'segmented',
}: {
  sessionId: string
  initialType?: string | null
  className?: string
  onSaved?: (t: ContentType) => void
  renderMode?: 'segmented' | 'select'
}) {
  const init = (() => {
    const t = (initialType as ContentType) ?? 'other'
    return ALLOWED.has(t) ? t : 'other'
  })()
  const [value, setValue] = useState<ContentType>(init)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const uid = useId()
  const seq = useRef(0)
  const lastCommitted = useRef<ContentType>(init)
  const queuedNext = useRef<ContentType | null>(null)

  async function persistViaRpc(next: ContentType) {
    type RpcRow = { session_id: string; content_type: ContentType }
    const res = (await supabase.rpc('set_content_type' as any, {
      p_session_id: sessionId, p_type: next,
    })) as { data: RpcRow[] | null; error: { message: string } | null }
    if (res.error) throw new Error(res.error.message)
    return res.data?.[0]?.content_type ?? next
  }

  async function persistViaApi(next: ContentType) {
    const r = await fetch('/api/content-type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, contentType: next }),
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      throw new Error(j?.error || `HTTP ${r.status}`)
    }
    const j = (await r.json()) as { contentType: ContentType }
    return j.contentType ?? next
  }

  async function persist(next: ContentType) {
    const mySeq = ++seq.current
    setSaving(true)
    setStatusMsg('')
    try {
      // 1) Versuche RPC
      let saved = await persistViaRpc(next)
      // 2) Wenn RPC nicht existiert/fehlschlägt → API-Fallback
      if (!ALLOWED.has(saved)) saved = await persistViaApi(next)

      // Wenn inzwischen neuere Änderung kam → ignorieren
      if (mySeq < seq.current) return

      lastCommitted.current = saved
      setValue(saved)
      setStatusMsg('Gespeichert')
      onSaved?.(saved)

      toast.success('Segment aktualisiert', {
        action: {
          label: 'Rückgängig',
          onClick: () => handleChange(lastCommitted.current),
        },
      })

      // queued Wunsch direkt hinterher
      if (queuedNext.current && queuedNext.current !== saved) {
        const follow = queuedNext.current
        queuedNext.current = null
        setValue(follow)
        void persist(follow)
      }
    } catch (err) {
      // Rollback
      setValue(lastCommitted.current)
      setStatusMsg('')
      toast.error((err as any)?.message || 'Konnte Segment nicht speichern')
    } finally {
      setSaving(false)
    }
  }

  function handleChange(nextRaw: string | ContentType) {
    const next = nextRaw as ContentType
    if (!ALLOWED.has(next) || next === value) return
    setValue(next)
    if (saving) { queuedNext.current = next; return }
    void persist(next)
  }

  return (
    <div className={cn('inline-flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-2">
        <label htmlFor={`content-type-${uid}`} className="text-[11px] font-medium text-muted-foreground">
          Segment
        </label>
        <span className={cn('text-[11px]', saving ? 'text-muted-foreground' : 'text-emerald-600')} aria-live="polite">
          {saving ? '…' : statusMsg}
        </span>
      </div>

      {renderMode === 'segmented' ? (
        <Segmented
          id={`content-type-${uid}`}
          value={value}
          onChange={handleChange}
          options={OPTIONS}
          saving={saving}
        />
      ) : (
        <div className="relative w-full max-w-[220px]">
          <select
            id={`content-type-${uid}`}
            className={cn(
              'w-full appearance-none rounded-md border border-input bg-background px-2 py-2 pr-7 text-sm',
              'outline-none ring-0 focus:ring-2 focus:ring-primary/40 disabled:opacity-60'
            )}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            aria-busy={saving}
          >
            {OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {saving && <Loader2 className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}

function Segmented({
  id, value, onChange, options, saving,
}: {
  id: string
  value: ContentType
  onChange: (v: ContentType) => void
  options: { value: ContentType; label: string }[]
  saving: boolean
}) {
  return (
    <div id={id} role="radiogroup" aria-disabled={saving}
      className={cn('inline-flex w-full max-w-full flex-wrap gap-1 rounded-xl border border-input bg-background p-1 shadow-sm', saving && 'opacity-90')}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={saving}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={cn(
              'group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition',
              active ? 'bg-foreground text-background shadow-sm' : 'text-foreground/80 hover:bg-accent'
            )}
          >
            <span className={cn('inline-flex items-center justify-center', active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100')} aria-hidden="true">
              {ICONS[opt.value as ContentType]}
            </span>
            <span className="whitespace-nowrap">{opt.label}</span>
            {saving && active && <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin opacity-80" />}
          </button>
        )
      })}
    </div>
  )
}
