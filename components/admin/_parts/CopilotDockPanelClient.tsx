// components/admin/_parts/CopilotDockPanelClient.tsx
'use client'

import * as React from 'react'
import { Loader2, Rocket, Wand2, Play } from 'lucide-react'

export type Suggestion = {
  id: string
  title: string | null
  body: string | null
  mode: 'assist' | 'auto' | 'simulate' | null
  created_at: string
}

function parseModeFromSource(src?: string | null): Suggestion['mode'] {
  if (!src) return null
  const s = String(src).toLowerCase()
  if (s.includes('assist')) return 'assist'
  if (s.includes('auto')) return 'auto'
  if (s.includes('simulate')) return 'simulate'
  return null
}

export default function CopilotDockPanelClient({ initialSuggestions }: { initialSuggestions: Suggestion[] }) {
  const [prompt, setPrompt] = React.useState('')
  const [busy, setBusy] = React.useState<Suggestion['mode']>(null)
  const [items, setItems] = React.useState<Suggestion[]>(initialSuggestions)

  async function run(mode: NonNullable<Suggestion['mode']>) {
    if (!prompt && mode === 'assist') return
    setBusy(mode)
    try {
      const res = await fetch('/api/admin/copilot/actions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode, prompt }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Fehler')

      if (json?.suggestion) {
        const s = json.suggestion as {
          id: string | number
          title?: string | null
          detail?: string | null
          prompt?: string | null
          source?: string | null
          created_at: string
        }
        const normalized: Suggestion = {
          id: String(s.id),
          title: s.title ?? null,
          body: s.detail ?? s.prompt ?? null,
          mode: parseModeFromSource(s.source) ?? mode, // Fallback: aktueller Modus
          created_at: s.created_at,
        }
        setItems((prev) => [normalized, ...prev].slice(0, 12))
      }

      setPrompt('')
    } catch {
      alert('Aktion fehlgeschlagen.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-2 bg-background">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Frag CoPilot… (z. B. 'Top Creator mit sinkendem Impact anzeigen')"
          className="w-full bg-transparent outline-none px-2 py-2 text-sm"
        />
        <div className="flex gap-2 p-2 pt-0">
          <button
            onClick={() => run('assist')}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
            title="Assist: Antwort & nächste Schritte"
          >
            {busy === 'assist' ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Assist
          </button>
          <button
            onClick={() => run('auto')}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
            title="Auto: führe smarte Aktion automatisch aus"
          >
            {busy === 'auto' ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            Auto
          </button>
          <button
            onClick={() => run('simulate')}
            disabled={busy !== null}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
            title="Simulate: Simulation (keine echten Änderungen)"
          >
            {busy === 'simulate' ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Simulate
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.mode ?? 'assist'}</span>
              <time className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</time>
            </div>
            <p className="mt-1 font-medium">{s.title ?? 'Vorschlag'}</p>
            {s.body && <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{s.body}</p>}
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-muted-foreground">Noch keine Einträge – starte oben mit einer Aktion.</li>
        )}
      </ul>
    </div>
  )
}
