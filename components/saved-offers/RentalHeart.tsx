'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { removeSavedOffer, saveRentalOffer } from '@/lib/saved-offers/actions'

export default function RentalHeart({ token, title, context, disabled }: {
  token: string; title: string; disabled: boolean
  context: { destination: string | null; starts_on: string | null; ends_on: string | null; starts_at: string | null; ends_at: string | null }
}) {
  const [savedId, setSavedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return <div className="mt-2">
    <button type="button" disabled={busy || (disabled && !savedId)} aria-pressed={!!savedId} aria-label={`${savedId ? 'Entfernen' : 'Merken'}: ${title}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-line-200 px-4 text-sm font-medium text-brand-800 disabled:opacity-50" onClick={async () => {
      setBusy(true); setMessage('')
      try {
        if (savedId) { const result = await removeSavedOffer(savedId); if (result.ok) { setSavedId(null); setMessage('Aus deiner Merkliste entfernt.') } else setMessage(result.message) }
        else { const result = await saveRentalOffer({ token, context }); if (result.ok) { setSavedId(result.value.id); setMessage('In deinem Konto gemerkt.') } else setMessage(result.message) }
      } catch { setMessage('Speichern konnte nicht bestätigt werden. Bitte prüfe deine Merkliste und versuche es bei Bedarf erneut.') }
      finally { setBusy(false) }
    }}><Heart className="h-4 w-4" fill={savedId ? 'currentColor' : 'none'} aria-hidden="true" />{busy ? 'Bitte warten …' : savedId ? 'Gemerkt' : 'Merken'}</button>
    {message && <p role="status" className="mt-2 text-xs leading-5 text-ink-700">{message} <Link href="/account/merkliste" className="underline">Merkliste öffnen</Link></p>}
  </div>
}
