'use client'

import { useState, type ReactNode } from 'react'
import { BedDouble, Landmark, PlaneLanding } from 'lucide-react'
import { PARIS_ORTE } from '@/lib/maps/reisekarte'
import type { Trip } from '@/types/trips'
import { Kartenknopf } from './Reisekarte'

const bereiche = [
  { id: 'fluege', name: 'Flüge', icon: PlaneLanding },
  { id: 'unterkunft', name: 'Unterkunft', icon: BedDouble },
  { id: 'aktivitaeten', name: 'Aktivitäten', icon: Landmark },
] as const
export type Suchbereich = typeof bereiche[number]['id']
export default function ParisKartenSuche({ reise, start, fluege, unterkunft, aktivitaeten }: {
  reise: Trip; start?: Suchbereich; fluege: ReactNode; unterkunft: ReactNode; aktivitaeten: ReactNode
}) {
  const [auswahl, setAuswahl] = useState<Suchbereich | undefined>(start)
  const [besucht, setBesucht] = useState<Suchbereich[]>(start ? [start] : [])
  const inhalte = { fluege, unterkunft, aktivitaeten }
  return <main className="org-wrap mx-auto w-full max-w-6xl px-4 py-8">
    <p className="text-sm text-ink-700">Beispielreise · 2 Tage</p>
    <h1 className="mb-3 text-4xl font-semibold text-brand-800">Paris</h1>
    <Kartenknopf reise={reise} />
    <nav aria-label="Reise organisieren" className="my-5 flex flex-wrap gap-2">
      {bereiche.map(({ id, name, icon: Icon }) => <button key={id} type="button" aria-pressed={auswahl === id}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-200 px-4 font-semibold text-brand-800 aria-pressed:bg-brand-800 aria-pressed:text-white"
        onClick={() => { setAuswahl(id); setBesucht(liste => liste.includes(id) ? liste : [...liste,id]) }}>
        <Icon size={16} aria-hidden />{name}</button>)}</nav>
    {!auswahl && <section><h2 className="mb-2 text-xl font-semibold">Dein Reiseplan</h2><ol className="divide-y divide-line-200">
      {PARIS_ORTE.map(o => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><strong>{o.name}</strong><p className="text-sm text-ink-700">{o.art} · {o.detail}</p></div>
        <Kartenknopf reise={reise} ort={o}>Auf Karte ansehen</Kartenknopf></li>)}</ol></section>}
    {bereiche.filter(b => besucht.includes(b.id)).map(({ id, name }) => <section key={id} hidden={auswahl !== id} aria-label={name}>
      {id !== 'fluege' && <div className="mb-4 rounded-xl border border-line-200 p-4"><h2 className="font-semibold">{id === 'unterkunft' ? 'Geplantes Hotel' : 'Besuche im Reiseplan'}</h2>
        {PARIS_ORTE.filter(o => o.art === (id === 'unterkunft' ? 'Hotel' : 'Besuch')).map(o => <div key={o.id} className="flex flex-wrap items-center gap-x-3">
          <span>{o.name}</span><Kartenknopf reise={reise} ort={o}>Auf Karte ansehen</Kartenknopf></div>)}</div>}
      {inhalte[id]}</section>)}
  </main>
}
