'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { generateStoryInsights } from '@/lib/openai/generateStoryInsights'
import { Loader2, Sparkles } from 'lucide-react'

type Props = {
  sessionId: string
  storyText?: string
  existingRating?: number | null
  existingInsights?: string | null
  onChange?: (p: { rating: number | null; insights: string }) => void
}

export default function SessionRating({
  sessionId,
  storyText,
  existingRating,
  existingInsights,
  onChange,
}: Props) {
  // ❗️ WICHTIG: null statt undefined erlauben
  const [rating, setRating] = useState<number | null>(existingRating ?? null)
  const [insights, setInsights] = useState<string>(existingInsights ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleRate = () => {
    if (!storyText?.trim()) {
      setError('Kein Text vorhanden, der analysiert werden kann.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const res = await generateStoryInsights(storyText)
        setRating(res.rating ?? null)
        setInsights(res.insights ?? '')
        onChange?.({ rating: res.rating ?? null, insights: res.insights ?? '' })
      } catch (e: any) {
        setError(e?.message ?? 'Analyse fehlgeschlagen.')
      }
    })
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card/60 p-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium">CoPilot-Bewertung</div>
          <div className="text-xs text-muted-foreground">
            Automatische Kurzbewertung & Hinweise.
          </div>
        </div>
        <Button size="sm" onClick={handleRate} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analysiere…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Neu analysieren
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="rating">Rating (0–100)</Label>
          <Input
            id="rating"
            type="number"
            min={0}
            max={100}
            value={rating ?? ''}
            onChange={(e) => {
              const v = e.currentTarget.value
              setRating(v === '' ? null : Math.max(0, Math.min(100, Number(v))))
            }}
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="insights">Insights</Label>
          <Input
            id="insights"
            value={insights}
            onChange={(e) => setInsights(e.currentTarget.value)}
            placeholder="Kurzes Feedback / To-dos…"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
