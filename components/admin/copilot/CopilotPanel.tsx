// components/admin/copilot/CopilotPanel.tsx
'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bot, Play, Beaker, Settings2 } from 'lucide-react'

type Mode = 'assist' | 'auto' | 'simulate'

const MODULES = [
  { key: 'security', label: 'Security' },
  { key: 'payments', label: 'Payments' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'content', label: 'Content' },
  { key: 'ux', label: 'UX' },
  { key: 'localization', label: 'Localization' },
] as const

type LogItem = { ts: string; mode: Mode; summary: string; ok: boolean }

export default function CopilotPanel() {
  const [mode, setMode] = React.useState<Mode>('assist')
  const [mods, setMods] = React.useState<string[]>(['security', 'payments'])
  const [prompt, setPrompt] = React.useState(
    'Analysiere die letzten 24h: erkenne Security-Anomalien und schlage Maßnahmen vor.'
  )
  const [busy, setBusy] = React.useState(false)
  const [log, setLog] = React.useState<LogItem[]>([])

  const toggleModule = (k: string) =>
    setMods((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))

  const run = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/admin/copilot/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, mode, modules: mods }),
      })
      const json = await r.json()
      if (json?.ok) {
        toast.success(json.summary ?? 'Ausgeführt')
        setLog((l) => [{ ts: new Date().toISOString(), mode, summary: json.summary, ok: true }, ...l])
      } else {
        toast.error(json?.summary ?? 'Fehlgeschlagen')
        setLog((l) => [{ ts: new Date().toISOString(), mode, summary: json?.summary ?? 'Fehlgeschlagen', ok: false }, ...l])
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Fehler')
      setLog((l) => [{ ts: new Date().toISOString(), mode, summary: e?.message ?? 'Fehler', ok: false }, ...l])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h2 className="text-sm font-semibold">CoPilot Pro</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings2 className="h-4 w-4" />
          Policy: Genehmigung für Auto-Tasks empfohlen
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-4 p-4 lg:grid-cols-12">
        {/* Prompt */}
        <div className="lg:col-span-8">
          <label className="text-xs font-medium text-muted-foreground">Prompt</label>
          <textarea
            className="mt-1 w-full min-h-[148px] rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Beschreibe dein Ziel…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" onClick={run} disabled={busy} className="gap-2">
              <Play className="h-4 w-4" />
              {busy ? 'Läuft…' : 'Ausführen'}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy}
              onClick={() => {
                setPrompt('Führe einen Performance-Check der Landingpage durch und nenne 3 konkrete Maßnahmen.')
                setMode('assist')
                setMods(['ux'])
              }}>
              Beispiel: Performance Audit
            </Button>
            <Button size="sm" variant="outline" disabled={busy}
              onClick={() => {
                setPrompt('Setze IP 203.0.113.42 auf die Blockliste und erstelle einen 24h-Security-Report.')
                setMode('simulate')
                setMods(['security'])
              }}>
              Beispiel: Security (simulate)
            </Button>
          </div>
        </div>

        {/* Modus + Module */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Modus</div>
            <div className="grid grid-cols-3 gap-2">
              {(['assist', 'auto', 'simulate'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm',
                    mode === m ? 'bg-primary/10 border-primary/40' : 'hover:bg-muted'
                  )}
                >
                  {m === 'assist' ? 'Assist' : m === 'auto' ? 'Auto' : 'Simulate'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              <b>Assist:</b> Vorschläge &amp; Genehmigung • <b>Auto:</b> führt selbst aus • <b>Simulate:</b> nur trocken.
            </p>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Module</div>
            <div className="grid grid-cols-2 gap-2">
              {MODULES.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={mods.includes(m.key)}
                    onChange={() => toggleModule(m.key)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Log */}
      <div className="border-t">
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">Protokoll</div>
        <ul className="max-h-64 overflow-auto px-4 pb-3 space-y-2 text-sm">
          {log.length === 0 && (
            <li className="text-muted-foreground">Noch keine Einträge.</li>
          )}
          {log.map((e, i) => (
            <li key={i} className="rounded-lg border p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(e.ts).toLocaleString()}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px]',
                    e.ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                  )}
                >
                  {e.mode.toUpperCase()}
                </span>
              </div>
              <div className="mt-1">{e.summary}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
