'use client'

import { useTransition, useState } from 'react'
import { rateSession } from '@/lib/supabase/actions'
import { Button } from '@/components/ui/button'

interface Props {
  sessionId: string
  storyText: string
  existingRating?: number
  existingInsights?: string
}

export default function SessionRating({
  sessionId,
  storyText,
  existingRating,
  existingInsights
}: Props) {
  const [rating, setRating] = useState<number | undefined>(existingRating)
  const [insights, setInsights] = useState<string | undefined>(existingInsights)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleRate = () => {
    startTransition(async () => {
      setError(null)
      try {
        const { rating: newRating, insights: newInsights } = await rateSession(sessionId, storyText)
        setRating(newRating)
        setInsights(newInsights)
      } catch (err) {
        console.error('Fehler bei der Bewertung:', err)
        setError('❌ Die Analyse ist fehlgeschlagen. Bitte erneut versuchen.')
      }
    })
  }

  return (
    <div className="space-y-4 mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold">🧠 CoPilot Pro Bewertung</h3>

      {rating !== undefined ? (
        <>
          <p className="text-sm">🟢 Score: <strong>{rating}</strong>/100</p>
          {insights && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {insights}
            </p>
          )}
        </>
      ) : (
        <Button disabled={isPending} onClick={handleRate}>
          🔍 Analyse jetzt starten
        </Button>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
