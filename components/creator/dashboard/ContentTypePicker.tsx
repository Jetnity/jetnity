'use client'

import { useId, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ContentType = 'video' | 'image' | 'guide' | 'blog' | 'story' | 'other'

const OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Bild' },
  { value: 'guide', label: 'Guide' },
  { value: 'blog', label: 'Blog' },
  { value: 'story', label: 'Story' },
  { value: 'other', label: 'Sonstiges' },
]

export default function ContentTypePicker({
  sessionId,
  initialType,
  className,
}: {
  sessionId: string
  initialType?: string | null
  className?: string
}) {
  const allowed = new Set<ContentType>(OPTIONS.map((o) => o.value))
  const initial = allowed.has((initialType as ContentType) ?? 'other')
    ? ((initialType as ContentType) ?? 'other')
    : 'other'

  const [value, setValue] = useState<ContentType>(initial)
  const [saving, setSaving] = useState(false)
  const uid = useId()

  async function onChange(nextRaw: string) {
    const next = nextRaw as ContentType
    if (!allowed.has(next) || next === value) return

    const prev = value
    setValue(next)
    setSaving(true)

    // RPC aufrufen (Rückgabe lokal typisieren, damit TS nicht 'never' annimmt)
    type RpcRow = { session_id: string; content_type: ContentType }
    const res = (await supabase.rpc(
      'set_content_type' as unknown as never,
      { p_session_id: sessionId, p_type: next } as unknown as never
    )) as { data: RpcRow[] | null; error: { message: string } | null }

    setSaving(false)

    if (res.error) {
      setValue(prev) // rollback
      toast.error('Konnte Segment nicht speichern')
      console.error('[set_content_type]', res.error)
      return
    }

    const rows = (res.data ?? []) as RpcRow[]
    if (rows[0]?.content_type) {
      setValue(rows[0].content_type)
    }

    toast.success('Segment aktualisiert')
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <label
        htmlFor={`content-type-${uid}`}
        className="text-[11px] text-muted-foreground"
      >
        Segment
      </label>
      <div className="relative">
        <select
          id={`content-type-${uid}`}
          className={cn(
            'appearance-none rounded-md border border-input bg-background px-2 py-1 pr-6 text-xs',
            'focus:outline-none focus:ring-2 focus:ring-primary/40'
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={saving}
          aria-busy={saving}
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {saving && (
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </span>
        )}
      </div>
    </div>
  )
}
