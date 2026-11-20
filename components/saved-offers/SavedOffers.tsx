'use client'

import { useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, safeOfferUrl, type SavedOffer } from '@/lib/saved-offers/contract'
import { removeSavedOffer } from '@/lib/saved-offers/actions'
import { savedOfferEvidence } from '@/lib/saved-offers/evidence'
import { Leerzustand } from '@/components/ui/leerzustand'
import ManualOffer from './ManualOffer'
import OfferPlan from './OfferPlan'

export default function SavedOffers({ offers }: { offers: SavedOffer[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  return <div className="grid gap-5">
    <ManualOffer merklisteLink={false} onSaved={() => router.refresh()} />
    {message && <p role="status" className="text-sm text-brand-800">{message}</p>}
    {!offers.length ? <Leerzustand symbol={Heart} titel="Deine Merkliste ist noch leer.">Merke einen Mietwagen direkt am Ergebnis oder erfasse oben ein Angebot selbst.</Leerzustand> : <ul className="grid gap-4">{offers.map(o => {
      const url = safeOfferUrl(o.url)
      const evidence = savedOfferEvidence(o)
      return <li key={o.id} className="min-w-0 rounded-card border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="flex items-center gap-2 text-xs text-ink-600"><Heart className="h-4 w-4" fill="currentColor" aria-hidden="true" />{CATEGORIES[o.category as keyof typeof CATEGORIES] ?? 'Angebot'} · Gemerkt</p><h2 className="mt-2 break-words text-xl font-semibold text-brand-800">{o.title}</h2></div><button type="button" disabled={pending !== null} aria-label={`${o.title} aus Merkliste entfernen`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-200 text-brand-800 disabled:opacity-50" onClick={async () => {
          setPending(o.id); setMessage('')
          try { const result = await removeSavedOffer(o.id); if (result.ok) { setMessage('Angebot entfernt.'); router.refresh() } else setMessage(result.message) } catch { setMessage('Entfernen konnte nicht bestätigt werden. Bitte lade die Merkliste erneut.') } finally { setPending(null) }
        }}><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>
        <p className="mt-2 break-words text-sm text-ink-700">{o.destination ? `${o.destination} · ` : ''}{o.provider} · {o.source === 'manual' ? 'Selbst erfasst' : 'Angebotsreferenz von DiscoverCars'}</p>
        {(o.starts_on || o.ends_on) && <p className="mt-2 text-sm text-ink-700">{o.starts_on ?? 'Anfang offen'} {o.starts_at?.slice(0, 5)} {o.start_timezone} → {o.ends_on ?? 'Ende offen'} {o.ends_at?.slice(0, 5)} {o.end_timezone}</p>}
        <dl className="mt-3 grid gap-2 rounded-2xl border border-line-200 bg-surface-50 p-3 text-sm text-ink-800 sm:grid-cols-2" data-offer-evidence>
          <div><dt className="font-semibold">Herkunft</dt><dd>{evidence.herkunft}</dd></div>
          <div><dt className="font-semibold">Preis- und Verfügbarkeitsstand</dt><dd>{evidence.preis}</dd></div>
          <div><dt className="font-semibold">Gültigkeit der gespeicherten Referenz</dt><dd>{evidence.frist}</dd></div>
          <div><dt className="font-semibold">Buchungsstand</dt><dd>{evidence.buchung}</dd></div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-ink-600">Die Merkliste speichert keine aktuelle Preiszusage. Prüfe beim Anbieter selbst das konkrete Angebot mit Datum, Personen und Bedingungen. Ein Klick oder eine Übernahme in den Reiseplan ist keine Buchung.</p>
        {url ? <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line-200 px-5 text-sm font-semibold text-brand-800">Preis und Verfügbarkeit beim Anbieter neu prüfen<span className="sr-only">, neuer Tab</span></a> : <p className="mt-3 text-sm">Der gespeicherte Link kann nicht sicher geöffnet werden. Bitte starte eine neue Suche beim Anbieter.</p>}
        <OfferPlan offer={o} />
      </li>
    })}</ul>}
  </div>
}
