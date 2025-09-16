// components/admin/AdminReviewTable.tsx
'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ListChecks,
} from 'lucide-react'

type ReviewStatus = 'pending' | 'approved' | 'rejected'

type Session = {
  id: string
  title: string | null
  user_id: string
  review_status: ReviewStatus
  created_at: string
}

type Props = {
  sessions: Session[]
  /** Einzel-Update – wird bereits von dir übergeben */
  onUpdate: (formData: FormData) => Promise<void>
  /**
   * Optional: Bulk-Update (z. B. aus app/(admin)/admin/media-studio/review/actions.ts -> bulkUpdateReviewStatus)
   * Wenn nicht übergeben, fällt die Tabelle auf mehrere Einzel-Updates zurück.
   */
  onBulkUpdate?: (formData: FormData) => Promise<number | void>
}

const statusUI: Record<ReviewStatus, { label: string; cls: string }> = {
  pending: {
    label: 'Pending',
    cls: 'border border-border text-foreground/70 bg-transparent',
  },
  approved: {
    label: 'Approved',
    cls:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
  },
  rejected: {
    label: 'Rejected',
    cls:
      'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300',
  },
}

function fmt(dateISO: string) {
  try {
    return new Intl.DateTimeFormat('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateISO))
  } catch {
    return dateISO
  }
}

export default function AdminReviewTable({ sessions, onUpdate, onBulkUpdate }: Props) {
  // Optimistic Status per ID
  const [optimistic, setOptimistic] = React.useState(() => new Map<string, ReviewStatus>())
  const currentStatus = (id: string, initial: ReviewStatus) => optimistic.get(id) ?? initial

  // Suche/Filter
  const [q, setQ] = React.useState('')
  const [filter, setFilter] = React.useState<ReviewStatus | 'all'>('all')

  // Auswahl (Bulk)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [busy, setBusy] = React.useState(false)

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    return sessions.filter((s) => {
      const statusOk = filter === 'all' ? true : s.review_status === filter
      const text = `${s.title ?? ''} ${s.user_id}`.toLowerCase()
      const searchOk = term ? text.includes(term) : true
      return statusOk && searchOk
    })
  }, [q, filter, sessions])

  // Auswahl-Helper
  const isSelected = (id: string) => selected.has(id)
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const allIds = filtered.map((s) => s.id)
      const allSelected = allIds.every((id) => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        allIds.forEach((id) => next.delete(id))
        return next
      } else {
        const next = new Set(prev)
        allIds.forEach((id) => next.add(id))
        return next
      }
    })
  const clearSelection = () => setSelected(new Set())

  // Einzel-Update
  const submit = async (id: string, review_status: ReviewStatus) => {
    const fd = new FormData()
    fd.set('id', id)
    fd.set('review_status', review_status)
    setOptimistic((prev) => new Map(prev).set(id, review_status))
    try {
      await onUpdate(fd)
      toast.success(`Status aktualisiert (#${id.slice(0, 6)} → ${review_status})`)
    } catch (e) {
      // rollback
      setOptimistic((prev) => {
        const clone = new Map(prev)
        clone.delete(id)
        return clone
      })
      toast.error((e as Error)?.message || 'Update fehlgeschlagen')
    }
  }

  // Bulk-Update
  const bulk = async (review_status: ReviewStatus) => {
    if (!selected.size) return
    setBusy(true)

    const ids = Array.from(selected)
    // Optimistisch setzen
    setOptimistic((prev) => {
      const next = new Map(prev)
      ids.forEach((id) => next.set(id, review_status))
      return next
    })

    try {
      if (onBulkUpdate) {
        const fd = new FormData()
        fd.set('ids', JSON.stringify(ids))
        fd.set('review_status', review_status)
        const n = (await onBulkUpdate(fd)) as number | void
        toast.success(
          `Bulk: ${n ?? ids.length} Einträge → ${review_status}`
        )
      } else {
        // Fallback: nacheinander über onUpdate
        for (const id of ids) {
          const fd = new FormData()
          fd.set('id', id)
          fd.set('review_status', review_status)
          // Fehler einzelner Einträge fangen, aber Bulk fortsetzen
          try {
            await onUpdate(fd)
          } catch (e) {
            toast.error(`Fehler bei #${id.slice(0, 6)}: ${(e as Error)?.message ?? 'Update fehlgeschlagen'}`)
          }
        }
        toast.success(`Bulk: ${ids.length} Einträge → ${review_status}`)
      }
      clearSelection()
    } catch (e) {
      // rollback gesamt
      setOptimistic((prev) => {
        const next = new Map(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
      toast.error((e as Error)?.message || 'Bulk-Update fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k as any)}
                className={cn(
                  'text-sm px-3 py-1.5 rounded-full border',
                  filter === k ? 'bg-accent' : 'bg-background'
                )}
              >
                {k === 'all' ? 'Alle' : (k as string).replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="ml-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={toggleAllFiltered}
              disabled={!filtered.length}
              title="Gefilterte auswählen/abwählen"
            >
              <ListChecks className="h-4 w-4" />
              {filtered.length
                ? `Gefilterte (${filtered.length})`
                : 'Keine Einträge'}
            </Button>

            {!!selected.size && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulk('pending')}
                  disabled={busy}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Pending
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => bulk('approved')}
                  disabled={busy}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => bulk('rejected')}
                  disabled={busy}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection} disabled={busy}>
                  Auswahl löschen
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Suche nach Titel oder User-ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 w-10">
                {/* Kopf-Checkbox (nur visuell – Nutzung via Button oben) */}
              </th>
              <th className="px-4 py-3 w-[42%]">Titel</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Review-Status</th>
              <th className="px-4 py-3">Erstellt</th>
              <th className="px-4 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const st = currentStatus(s.id, s.review_status)
              const cfg = statusUI[st]
              return (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      aria-label="Auswählen"
                      className="h-4 w-4 accent-primary"
                      checked={isSelected(s.id)}
                      onChange={() => toggleOne(s.id)}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="line-clamp-2 font-medium">{s.title || 'Untitled'}</div>
                    <div className="text-xs text-muted-foreground">ID: {s.id}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="font-mono text-xs">{s.user_id}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge className={cn('capitalize', cfg.cls)}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 align-top">{fmt(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => submit(s.id, 'pending')}
                        title="Auf Pending setzen"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => submit(s.id, 'approved')}
                        title="Freigeben"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => submit(s.id, 'rejected')}
                        title="Ablehnen"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="Detail im Admin öffnen">
                        <a href={`/admin/media-studio/review/${s.id}`}>
                          Admin <ArrowUpRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="Creator-Editor in neuem Tab">
                        <a
                          href={`/creator/media-studio/session/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Editor <ArrowUpRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Keine Einträge gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer-Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>Gefunden: {filtered.length} · Insgesamt: {sessions.length}</div>
        <div>Ausgewählt: {selected.size}</div>
      </div>
    </section>
  )
}
