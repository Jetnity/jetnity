'use client'

import { useId, useState } from 'react'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import Suchkalender from '@/components/trips/organisieren/auswahl/Suchkalender'
import { CATEGORIES, type OfferInput } from '@/lib/saved-offers/contract'
import { saveManualOffer } from '@/lib/saved-offers/actions'

const field = 'min-h-11 w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-base text-brand-800'
export default function ManualOffer({ category = 'stay', destination = '', startsOn = '', endsOn = '', onSaved }: {
  category?: OfferInput['category']; destination?: string; startsOn?: string; endsOn?: string; onSaved?: () => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState(category)
  const [start, setStart] = useState(startsOn)
  const [end, setEnd] = useState(endsOn)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return <section className="min-w-0 rounded-2xl border border-line-200 bg-white p-4 sm:p-5" aria-label="Konkretes Angebot merken">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-brand-800"><Heart className="h-4 w-4" aria-hidden="true" />Angebot selbst merken</button>
      <Link href="/account/merkliste" className="inline-flex min-h-11 items-center px-3 text-sm text-brand-800 underline underline-offset-4">Meine Merkliste</Link>
    </div>
    {open && <form id={id} className="mt-4 grid gap-4" onSubmit={async event => {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      const text = (key: string) => String(form.get(key) ?? '').trim() || null
      setBusy(true); setMessage('')
      try {
        const result = await saveManualOffer({ category: kind, title: text('title'), url: text('url'), destination: text('destination'), starts_on: start || null, ends_on: end || null, starts_at: text('starts_at'), ends_at: text('ends_at'), start_timezone: text('start_timezone'), end_timezone: text('end_timezone') })
        setMessage(result.ok ? 'In deinem Konto gemerkt. Preis und Verfügbarkeit bitte beim Anbieter erneut prüfen.' : result.message)
        if (result.ok) { onSaved?.(); setOpen(false) }
      } catch { setMessage('Die Verbindung wurde unterbrochen. Du kannst es erneut versuchen; dasselbe Angebot wird nicht doppelt angelegt.') }
      finally { setBusy(false) }
    }}>
      <p className="text-sm leading-6 text-ink-700">Bei eingebetteten Hotel-, Flug- und Aktivitätssuchen übernimmt Jetnity keine einzelnen Angebote automatisch. Trage hier das konkrete Angebot mit seinem direkten Link ein. Deine Angaben bleiben als selbst erfasst gekennzeichnet.</p>
      <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <legend className="sr-only">Angebotsangaben</legend>
        <label className="grid min-w-0 gap-1 text-sm">Kategorie<select className={field} value={kind} onChange={e => setKind(e.target.value as OfferInput['category'])}>{Object.entries(CATEGORIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="grid min-w-0 gap-1 text-sm">Konkretes Angebot<input className={field} name="title" required maxLength={200} placeholder="z. B. Hotelname oder Flugnummer" /></label>
        <label className="grid min-w-0 gap-1 text-sm sm:col-span-2">Direkter Angebotslink<input className={field} name="url" type="url" required maxLength={2048} placeholder="https://…" /></label>
        <label className="grid min-w-0 gap-1 text-sm sm:col-span-2">Ziel / Ort<input className={field} name="destination" defaultValue={destination} maxLength={200} /></label>
        <Suchkalender start={start} ende="" einzeln optional startLabel={kind === 'stay' ? 'Check-in' : 'Anfangsdatum'} endeLabel="" min="1900-01-01" max="9999-12-31" minTage={0} disabled={busy} setzen={setStart} />
        <Suchkalender start={end} ende="" einzeln optional startLabel={kind === 'stay' ? 'Check-out' : 'Enddatum'} endeLabel="" min="1900-01-01" max="9999-12-31" minTage={0} disabled={busy} setzen={setEnd} />
        <label className="grid min-w-0 gap-1 text-sm">Anfangszeit, optional<input className={field} name="starts_at" type="time" /></label>
        <label className="grid min-w-0 gap-1 text-sm">Endzeit, optional<input className={field} name="ends_at" type="time" /></label>
        {kind === 'flight' && <><label className="grid min-w-0 gap-1 text-sm">Abflug-Zeitzone, falls bekannt<input className={field} name="start_timezone" maxLength={64} placeholder="z. B. Europe/Zurich" /></label><label className="grid min-w-0 gap-1 text-sm">Ankunfts-Zeitzone, falls bekannt<input className={field} name="end_timezone" maxLength={64} placeholder="z. B. Asia/Bangkok" /></label></>}
        <label className="flex min-h-11 items-start gap-2 text-sm sm:col-span-2"><input required type="checkbox" className="mt-1 h-4 w-4" />Ich merke ein bestimmtes Angebot. Der Link führt nicht nur zu einer allgemeinen Suche.</label>
        <p className="text-xs leading-5 text-ink-700 sm:col-span-2">Alle Zeiten sind Ortszeiten. Ein Flug kann am Folgetag ankommen. Merken bestätigt keine Buchung.</p>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white sm:col-span-2"><Heart className="h-4 w-4" aria-hidden="true" />{busy ? 'Wird gespeichert …' : 'Im Konto merken'}</button>
      </fieldset>
    </form>}
    {message && <p role="status" className="mt-3 text-sm leading-6 text-brand-800">{message}</p>}
  </section>
}
