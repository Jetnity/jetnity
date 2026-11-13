'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { suggestedDay, type SavedOffer } from '@/lib/saved-offers/contract'
import { savedOfferDays, savedOfferToPlan, savedOfferTrips } from '@/lib/saved-offers/plan-actions'
import type { PlanChoice, PlanDays } from '@/lib/saved-offers/plan'
import Suchkalender from '@/components/trips/organisieren/auswahl/Suchkalender'

const field = 'min-h-11 w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-base'
export default function OfferPlan({ offer }: { offer: SavedOffer }) {
  const [open, setOpen] = useState(false)
  const [trips, setTrips] = useState<PlanChoice[]>([])
  const [trip, setTrip] = useState('')
  const [days, setDays] = useState<PlanDays>({ days: [], stages: [] })
  const [day, setDay] = useState('')
  const [start, setStart] = useState(offer.starts_on ?? '')
  const [end, setEnd] = useState(offer.ends_on ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('')
  const generation = useRef(0)
  const choose = async (id: string) => {
    const ticket = ++generation.current
    setTrip(id); setDay(''); setDays({ days: [], stages: [] }); setMessage('')
    if (!id) return
    setBusy(true)
    try {
      const result = await savedOfferDays(id)
      if (ticket !== generation.current) return
      if (result.ok) { setDays(result.value); setDay(suggestedDay(offer, result.value.days, result.value.stages)) } else setMessage(result.message)
    } catch { if (ticket === generation.current) setMessage('Die Reisetage konnten nicht geladen werden.') }
    finally { if (ticket === generation.current) setBusy(false) }
  }
  return <div className="mt-3">
    <button type="button" className="inline-flex min-h-11 items-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white" aria-expanded={open} onClick={async () => {
      setOpen(!open)
      if (open || trips.length) return
      setBusy(true)
      try { const result = await savedOfferTrips(); if (result.ok) { setTrips(result.value); if (result.value.length === 1) await choose(result.value[0].id) } else setMessage(result.message) } catch { setMessage('Die Reisen konnten nicht geladen werden.') } finally { setBusy(false) }
    }}>In Reiseplan übernehmen</button>
    {open && <form className="mt-4 grid gap-3 rounded-2xl bg-surface-50 p-4 sm:grid-cols-2" onSubmit={async e => {
      e.preventDefault(); const form = new FormData(e.currentTarget); setBusy(true); setMessage(''); setTarget('')
      try {
        const result = await savedOfferToPlan({ offerId: offer.id, tripId: trip, dayId: day, timing: { starts_on: start || null, ends_on: end || null, starts_at: String(form.get('starts_at') ?? '') || null, ends_at: String(form.get('ends_at') ?? '') || null } })
        if (result.ok) { setTarget(result.value); setMessage('Im Reiseplan vorgemerkt – nicht gebucht.') } else setMessage(result.message)
      } catch { setMessage('Speichern konnte nicht bestätigt werden. Bitte prüfe die Reise; ein erneuter Versuch legt keinen zweiten Eintrag an.') } finally { setBusy(false) }
    }}>
      <label className="grid gap-1 text-sm">Reise<select required disabled={busy} value={trip} onChange={e => void choose(e.target.value)} className={field}><option value="">Reise wählen</option>{trips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
      <label className="grid gap-1 text-sm">Etappe und Tag<select required disabled={busy || !trip} value={day} onChange={e => { setDay(e.target.value); if (!start) setStart(days.days.find(d => d.id === e.target.value)?.dayDate ?? '') }} className={field}><option value="">Tag wählen</option>{days.days.map(d => <option key={d.id} value={d.id}>{days.stages.find(s => s.id === d.stageId)?.name ?? 'Ohne Etappe'} · {d.dayDate ?? `Tag ${d.dayIndex}`}</option>)}</select></label>
      <Suchkalender start={start} ende="" einzeln optional startLabel={offer.category === 'stay' ? 'Check-in' : 'Anfang / Abflug'} endeLabel="" min="1900-01-01" max="9999-12-31" minTage={0} disabled={busy} setzen={setStart} />
      <Suchkalender start={end} ende="" einzeln optional startLabel={offer.category === 'stay' ? 'Check-out' : 'Ende / Ankunft'} endeLabel="" min="1900-01-01" max="9999-12-31" minTage={0} disabled={busy} setzen={setEnd} />
      <label className="grid gap-1 text-sm">Anfangszeit<input type="time" name="starts_at" defaultValue={offer.starts_at?.slice(0, 5) ?? ''} disabled={busy} className={field} /></label>
      <label className="grid gap-1 text-sm">Endzeit<input type="time" name="ends_at" defaultValue={offer.ends_at?.slice(0, 5) ?? ''} disabled={busy} className={field} /></label>
      <p className="text-xs leading-5 text-ink-700 sm:col-span-2">Bitte prüfe Ziel, Datum und Ortszeiten. Ein Hotel wird bis zum Check-out eingeplant; dieser zählt nicht als zusätzliche Nacht. Ein Nachtflug behält sein eigenes Ankunftsdatum. Preis und Verfügbarkeit sind nicht bestätigt.</p>
      {!busy && !trips.length && <p className="text-sm sm:col-span-2">Hier erscheinen deine im Konto gespeicherten Reisen. Eine Gastreise kannst du zuerst über „Meine Reisen“ ins Konto übernehmen.</p>}
      <button type="submit" disabled={busy || !day} className="min-h-11 rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{busy ? 'Bitte warten …' : 'Als geplant hinzufügen'}</button>
    </form>}
    {message && <p role="status" className="mt-3 text-sm">{message} {target && <Link href={target as Route} className="underline">Reiseplan öffnen</Link>}</p>}
  </div>
}
