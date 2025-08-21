'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Rule = {
  id: string
  user_id: string
  metric: 'impressions'|'views'|'view_rate'|'engagement_rate'|'impact_score'
  comparator: 'above'|'below'
  threshold: number
  window_days: number
  content_type: 'video'|'image'|'guide'|'blog'|'story'|'other'|null
  is_active: boolean
  title: string | null
  created_at: string
  updated_at: string
}

type EventRow = {
  id: string
  rule_id: string
  user_id: string
  happened_at: string
  current_value: number
  message: string
}

const METRICS = [
  { v: 'views', l: 'Views' },
  { v: 'impressions', l: 'Impressions' },
  { v: 'view_rate', l: 'View-Rate' },
  { v: 'engagement_rate', l: 'Engagement-Rate' },
  { v: 'impact_score', l: 'Impact Score (Ø)' },
] as const

const SEGMENTS = [
  { v: 'all', l: 'Alle Segmente' },
  { v: 'video', l: 'Video' },
  { v: 'image', l: 'Bild' },
  { v: 'guide', l: 'Guide' },
  { v: 'blog', l: 'Blog' },
  { v: 'story', l: 'Story' },
  { v: 'other', l: 'Sonstiges' },
] as const

export default function AlertsPanel({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [rules, setRules] = useState<Rule[]>([])
  const [events, setEvents] = useState<EventRow[]>([])

  const [form, setForm] = useState({
    title: '',
    metric: 'views' as Rule['metric'],
    comparator: 'above' as Rule['comparator'],
    threshold: 1000,
    window_days: 7,
    segment: 'all',
  })

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Nicht eingeloggt')
      setLoading(false)
      return
    }

    const [r, e] = await Promise.all([
      supabase
        .from('creator_alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('creator_alert_events')
        .select('*')
        .eq('user_id', user.id)
        .order('happened_at', { ascending: false })
        .limit(50),
    ])

    if (r.error) toast.error('Regeln laden fehlgeschlagen')
    else setRules((r.data ?? []) as Rule[])

    if (e.error) toast.error('Events laden fehlgeschlagen')
    else setEvents((e.data ?? []) as EventRow[])

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addRule() {
    const seg = form.segment === 'all' ? null : (form.segment as Rule['content_type'])
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    const { error } = await supabase.from('creator_alert_rules').insert({
      user_id: user.id,
      title: form.title || null,
      metric: form.metric,
      comparator: form.comparator,
      threshold: Number.isFinite(form.threshold) ? Number(form.threshold) : 0,
      window_days: Math.max(1, Number(form.window_days) || 1),
      content_type: seg,
      is_active: true,
    } as any)
    setSaving(false)

    if (error) {
      console.error('[addRule] supabase error', error)
      toast.error('Regel konnte nicht angelegt werden')
    } else {
      toast.success('Regel gespeichert')
      setForm({ ...form, title: '' })
      load()
    }
  }

  async function delRule(id: string) {
    const { error } = await supabase.from('creator_alert_rules').delete().eq('id', id)
    if (error) {
      console.error('[delRule] supabase error', error)
      toast.error('Löschen fehlgeschlagen')
    } else {
      toast.success('Regel gelöscht')
      setRules((r) => r.filter((x) => x.id !== id))
    }
  }

  async function toggleActive(rule: Rule) {
    const { error } = await supabase
      .from('creator_alert_rules')
      .update({ is_active: !rule.is_active } as any)
      .eq('id', rule.id)
    if (error) {
      console.error('[toggleActive] supabase error', error)
      toast.error('Aktualisierung fehlgeschlagen')
    } else {
      setRules((r) => r.map((x) => (x.id === rule.id ? { ...x, is_active: !x.is_active } : x)))
    }
  }

  // Besser direkt die RPC aufrufen (DB-seitig, security definer):
  async function runEval() {
    setEvaluating(true)
    const { data, error } = await supabase.rpc('creator_alerts_eval_current_user' as any)
    setEvaluating(false)

    if (error) {
      console.error('[runEval] RPC error', error)
      toast.error('Evaluierung fehlgeschlagen')
    } else {
      const inserted = typeof data === 'number' ? data : undefined
      toast.success(`Evaluierung fertig${inserted != null ? ` · neue Events: ${inserted}` : ''}`)
      load()
    }
  }

  const empty = !rules.length && !events.length

  return (
    <section className={cn('rounded-2xl border border-border bg-card/60 p-4', className)}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Alerts & Ziele</h3>
          <p className="text-xs text-muted-foreground">Schwellen definieren & automatisch benachrichtigt werden.</p>
        </div>
        <button
          onClick={runEval}
          disabled={evaluating}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm',
            evaluating ? 'opacity-60 cursor-not-allowed' : 'hover:bg-accent'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', evaluating && 'animate-spin')} /> Jetzt prüfen
        </button>
      </header>

      {/* Formular */}
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-6">
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Titel (optional)"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
        />
        <select
          value={form.metric}
          onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value as Rule['metric'] }))}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {METRICS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <select
          value={form.comparator}
          onChange={(e) => setForm((f) => ({ ...f, comparator: e.target.value as Rule['comparator'] }))}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="above">über</option>
          <option value="below">unter</option>
        </select>
        <input
          type="number"
          min={0}
          value={form.threshold}
          onChange={(e) => setForm((f) => ({ ...f, threshold: Number(e.target.value) }))}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Schwelle"
        />
        <input
          type="number"
          min={1}
          value={form.window_days}
          onChange={(e) => setForm((f) => ({ ...f, window_days: Number(e.target.value) }))}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Tage"
        />
        <select
          value={form.segment}
          onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {SEGMENTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        <button
          onClick={addRule}
          disabled={saving}
          className={cn(
            'md:col-span-6 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary',
            saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary/15'
          )}
        >
          <Plus className="h-4 w-4" /> {saving ? 'Speichere…' : 'Regel hinzufügen'}
        </button>
      </div>

      {/* Inhalt */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Lade…</div>
      ) : empty ? (
        <div className="text-sm text-muted-foreground">Noch keine Regeln oder Events.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Regeln */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Regeln</h4>
            <ul className="space-y-2">
              {rules.map((r) => (
                <li key={r.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {r.title || `${labelMetric(r.metric)} ${r.comparator === 'above' ? '>' : '<'} ${r.threshold}`}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Fenster: {r.window_days} Tage
                        {r.content_type ? ` · Segment: ${r.content_type}` : ' · Segment: Alle'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(r)}
                        className={cn(
                          'h-7 rounded-md border px-2 text-xs',
                          r.is_active
                            ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-border text-muted-foreground'
                        )}
                        title={r.is_active ? 'deaktivieren' : 'aktivieren'}
                      >
                        {r.is_active ? 'aktiv' : 'inaktiv'}
                      </button>
                      <button
                        onClick={() => delRule(r.id)}
                        className="inline-flex h-7 items-center justify-center rounded-md border border-input px-2 text-xs hover:bg-accent"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Events */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Events</h4>
            <ul className="space-y-2">
              {events.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="text-sm">{ev.message}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(ev.happened_at).toLocaleString()} · Wert: {Number(ev.current_value).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

function labelMetric(m: Rule['metric']) {
  switch (m) {
    case 'views': return 'Views'
    case 'impressions': return 'Impressions'
    case 'view_rate': return 'View-Rate'
    case 'engagement_rate': return 'Engagement-Rate'
    default: return 'Impact Score'
  }
}
