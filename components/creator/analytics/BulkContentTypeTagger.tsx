'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ContentType = 'video' | 'image' | 'guide' | 'blog' | 'story' | 'other'

const OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Bild' },
  { value: 'guide', label: 'Guide' },
  { value: 'blog', label: 'Blog' },
  { value: 'story', label: 'Story' },
  { value: 'other', label: 'Sonstiges' },
]

export type BulkItem = {
  session_id: string
  title?: string | null
  created_at?: string | null
  content_type?: string | null
}

export default function BulkContentTypeTagger({
  items,
  className,
  backHref,
}: {
  items: BulkItem[]
  className?: string
  /** optionaler Link zurück (wird im Erfolgstoast angeboten) */
  backHref?: string
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [type, setType] = useState<ContentType>('other')
  const [saving, setSaving] = useState(false)
  const [localItems, setLocalItems] = useState<BulkItem[]>(items)

  const allSelected = selected.size > 0 && selected.size === localItems.length
  const anySelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(localItems.map(i => i.session_id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCount = selected.size

  const selectedPreview = useMemo(() => {
    const first = localItems.find(i => selected.has(i.session_id))
    return first?.title ?? null
  }, [localItems, selected])

  async function apply() {
    if (!anySelected) return
    setSaving(true)
    const ids = Array.from(selected)

    const payload = { content_type: type } as any // Types evtl. noch ohne Spalte

    const { error } = await supabase
      .from('creator_session_metrics')
      .update(payload)
      .in('session_id', ids)
      .select('session_id')

    setSaving(false)

    if (error) {
      toast.error('Massen-Update fehlgeschlagen')
      console.error('[bulk content_type update]', error)
      return
    }

    // Lokal updaten
    setLocalItems(prev =>
      prev.map(it => (ids.includes(it.session_id) ? { ...it, content_type: type } : it))
    )
    setSelected(new Set())

    toast.success(
      `${selectedCount} Session${selectedCount === 1 ? '' : 's'} als „${type}“ markiert.`,
      {
        action: backHref
          ? {
              label: 'Zurück',
              onClick: () => {
                window.location.assign(backHref!)
              },
            }
          : undefined,
      }
    )
  }

  return (
    <section className={cn('rounded-2xl border border-border bg-card/60 p-4 backdrop-blur', className)}>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleAll}
          className={cn(
            'inline-flex items-center rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-accent'
          )}
        >
          {allSelected ? 'Auswahl aufheben' : 'Alle auswählen'}
        </button>

        <div className="text-sm text-muted-foreground">
          {anySelected ? (
            <>
              <span className="font-medium">{selectedCount}</span> ausgewählt
              {selectedPreview ? <> · z. B. „{truncate(selectedPreview, 30)}“</> : null}
            </>
          ) : (
            <>Nichts ausgewählt</>
          )}
        </div>

        <div className="ml-auto" />

        <label className="text-[11px] text-muted-foreground">Als Segment setzen</label>
        <select
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={type}
          onChange={e => setType(e.target.value as ContentType)}
          disabled={saving}
        >
          {OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={apply}
          disabled={!anySelected || saving}
          className={cn(
            'inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition',
            anySelected && !saving
              ? 'border border-primary/30 bg-primary text-primary-foreground hover:opacity-95'
              : 'border border-input bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {saving ? 'Speichere…' : 'Übernehmen'}
        </button>
      </div>

      {/* Liste */}
      <ul className="divide-y divide-border rounded-lg border border-border">
        {localItems.map(it => {
          const checked = selected.has(it.session_id)
          const ct = (it.content_type as ContentType) ?? 'other'
          return (
            <li
              key={it.session_id}
              className={cn(
                'flex items-center gap-3 px-3 py-2',
                checked ? 'bg-accent/40' : 'bg-background/60'
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleOne(it.session_id)}
                className="h-4 w-4 accent-current"
                aria-label="Auswählen"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{truncate(it.title ?? 'Ohne Titel', 80)}</div>
                <div className="text-xs text-muted-foreground">
                  {it.created_at ? new Date(it.created_at).toLocaleString() : ''}
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 capitalize">
                {ct}
              </Badge>
              <Link
                href={`/story/${it.session_id}`}
                className="shrink-0 text-xs underline-offset-2 hover:underline"
              >
                Öffnen
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function truncate(s: string, max = 50) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
