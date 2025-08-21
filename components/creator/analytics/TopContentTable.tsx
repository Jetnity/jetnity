'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type TopItem = {
  session_id: string
  title?: string | null
  created_at?: string | null
  impact_score?: number | null
  impressions?: number | null
  views?: number | null
  likes?: number | null
  comments?: number | null
  content_type?: string | null
}

type SortKey = 'impact' | 'views' | 'impressions' | 'engagement' | 'date'

export default function TopContentTable({
  items,
  className,
}: {
  items: TopItem[]
  className?: string
}) {
  const [q, setQ] = React.useState('')
  const [sort, setSort] = React.useState<SortKey>('impact')
  const [dir, setDir] = React.useState<'desc' | 'asc'>('desc')

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    const arr = term
      ? items.filter((i) => (i.title ?? '').toLowerCase().includes(term))
      : items.slice()

    arr.sort((a, b) => {
      const get = (x: TopItem) =>
        sort === 'impact'
          ? Number(x.impact_score ?? 0)
          : sort === 'views'
          ? Number(x.views ?? 0)
          : sort === 'impressions'
          ? Number(x.impressions ?? 0)
          : sort === 'engagement'
          ? Number((x.likes ?? 0) + (x.comments ?? 0))
          : new Date(x.created_at ?? 0).getTime()
      const va = get(a)
      const vb = get(b)
      return dir === 'desc' ? vb - va : va - vb
    })
    return arr
  }, [items, q, sort, dir])

  function toggleSort(k: SortKey) {
    if (sort === k) setDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSort(k)
      setDir('desc')
    }
  }

  function downloadCsv() {
    const header = [
      'created_at',
      'session_id',
      'title',
      'impact_score',
      'impressions',
      'views',
      'likes',
      'comments',
      'engagement',
      'content_type',
    ]
    const rows = filtered.map((r) => [
      r.created_at ?? '',
      r.session_id ?? '',
      r.title ?? '',
      r.impact_score ?? '',
      r.impressions ?? 0,
      r.views ?? 0,
      r.likes ?? 0,
      r.comments ?? 0,
      (Number(r.likes ?? 0) + Number(r.comments ?? 0)) || 0,
      r.content_type ?? '',
    ])
    const esc = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv =
      header.join(',') + '\n' + rows.map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'top_content.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className={cn('rounded-2xl border border-border bg-card/60 p-4', className)}>
      <header className="mb-3 flex items-center gap-3">
        <div>
          <h3 className="text-base font-semibold">Top Content</h3>
          <p className="text-xs text-muted-foreground">Deine stärksten Sessions (Such- & Sortierbar)</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suchen…"
            className="h-8 rounded-md border border-input bg-background px-3 text-sm"
          />
          <button
            onClick={downloadCsv}
            className="inline-flex h-8 items-center rounded-md border border-input px-3 text-sm hover:bg-accent"
          >
            CSV (gefiltert)
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <Th>Title</Th>
              <Th right onClick={() => toggleSort('impact')} active={sort === 'impact'} dir={dir}>
                Impact
              </Th>
              <Th right onClick={() => toggleSort('views')} active={sort === 'views'} dir={dir}>
                Views
              </Th>
              <Th right onClick={() => toggleSort('impressions')} active={sort === 'impressions'} dir={dir}>
                Impr.
              </Th>
              <Th right onClick={() => toggleSort('engagement')} active={sort === 'engagement'} dir={dir}>
                Engag.
              </Th>
              <Th>Segment</Th>
              <Th right onClick={() => toggleSort('date')} active={sort === 'date'} dir={dir}>
                Datum
              </Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.session_id} className="border-b border-border/60 hover:bg-accent/40">
                <Td className="max-w-[320px] truncate" title={r.title ?? ''}>
                  {r.title ?? 'Ohne Titel'}
                </Td>
                <Td right className="tabular-nums">{Math.round(Number(r.impact_score ?? 0))}</Td>
                <Td right className="tabular-nums">{Number(r.views ?? 0).toLocaleString()}</Td>
                <Td right className="tabular-nums">{Number(r.impressions ?? 0).toLocaleString()}</Td>
                <Td right className="tabular-nums">
                  {((Number(r.likes ?? 0) + Number(r.comments ?? 0)) || 0).toLocaleString()}
                </Td>
                <Td className="capitalize">{r.content_type ?? 'other'}</Td>
                <Td right className="text-xs text-muted-foreground">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Th({
  children,
  right,
  onClick,
  active,
  dir,
}: React.PropsWithChildren<{ right?: boolean; onClick?: () => void; active?: boolean; dir?: 'asc' | 'desc' }>) {
  return (
    <th
      onClick={onClick}
      className={cn(
        'cursor-default select-none px-3 py-2 text-left',
        right && 'text-right',
        onClick && 'cursor-pointer hover:text-foreground',
        active && 'text-foreground'
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && (dir === 'asc' ? '▲' : '▼')}
      </span>
    </th>
  )
}

function Td({
  children,
  className,
  right,
  title,
}: React.PropsWithChildren<{ className?: string; right?: boolean; title?: string }>) {
  return (
    <td className={cn('px-3 py-2', right && 'text-right', className)} title={title}>
      {children}
    </td>
  )
}
