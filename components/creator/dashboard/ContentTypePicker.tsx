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
  const allowed = new Set<ContentType>(OPTIONS.map(o => o.value))
  const initial =
    allowed.has((initialType as ContentType) ?? 'other')
      ? ((initialType as ContentType) ?? 'other')
      : 'other'

  const [value, setValue] = useState<ContentType>(initial)
  const [saving, setSaving] = useState(false)
  const uid = useId()

  async function onChange(nextRaw: string) {
    const next = (nextRaw as ContentType)
    if (!allowed.has(next) || next === value) return

    // Optimistic UI
    const prev = value
    setValue(next)
    setSaving(true)

    const payload = { content_type: next } as any // <- fix: Types kennen Spalte noch nicht

    const { error } = await supabase
      .from('creator_session_metrics')
      .update(payload)
      .eq('session_id', sessionId)
      .select('session_id')
      .single()

    setSaving(false)
    if (error) {
      setValue(prev) // rollback
      toast.error('Konnte Segment nicht speichern')
      console.error('[content_type update] ', error)
    } else {
      toast.success('Segment aktualisiert')
    }
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
