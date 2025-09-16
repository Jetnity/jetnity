// components/admin/CopilotPanel.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea' // falls du keine Textarea hast: einfach durch <textarea> ersetzen
import { Loader2, Sparkles, Send, Lightbulb } from 'lucide-react'

type Suggestion = { title: string; detail?: string }

export default function CopilotPanel({ className }: { className?: string }) {
  const [prompt, setPrompt] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [ideas, setIdeas] = React.useState<Suggestion[]>([])
  const [error, setError] = React.useState<string | null>(null)

  async function fetchIdeas(bodyPrompt: string) {
    setLoading(true)
    setError(null)
    setIdeas([])
    try {
      const res = await fetch('/api/admin/copilot/suggest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: bodyPrompt }),
      })
      if (!res.ok) throw new Error('Serverfehler')
      const data = await res.json()
      setIdeas(data?.ideas ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const p = prompt.trim()
    if (!p) return
    await fetchIdeas(p)
  }

  return (
    <div className={cn('p-4', className)}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">CoPilot Pro</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-2">
        <Textarea
          value={prompt}
          onChange={setPrompt}
          placeholder="Frag mich alles… z.B. „Schalte AI-Review für CH-Creator schärfer, stoppe Jobs > 5min, sende Warnung.“"
          rows={4}
          className="w-full"
        />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ausführen
          </Button>
          <Input
            placeholder="Schnellsuche: Nutzer, Session-ID…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const v = (e.currentTarget as HTMLInputElement).value.trim()
                if (v) fetchIdeas(`find ${v}`)
              }
            }}
          />
        </div>
      </form>

      {!!error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-4 space-y-2">
        {ideas.map((s, i) => (
          <div key={i} className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {s.title}
            </div>
            {s.detail && <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>}
            {/* Hier könntest du Buttons für „Übernehmen“ einblenden, die Server Actions triggern */}
          </div>
        ))}
        {!ideas.length && !loading && (
          <p className="text-xs text-muted-foreground">
            Gib eine Anweisung ein – CoPilot schlägt Aktionen vor (Review-Regeln, Bulk-Änderungen, Kampagnen, Sicherheit).
          </p>
        )}
      </div>
    </div>
  )
}
