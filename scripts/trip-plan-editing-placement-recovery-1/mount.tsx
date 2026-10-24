import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import {
  SCHLUESSEL,
  gastPlanpunktAnlegen,
  gastPlanpunktEntfernen,
  gastreiseAnlegen,
  kennungErzeugen,
} from '@/lib/trips/gastspeicher'
import { allePlanpunkte, punktAendern, type PlanAenderung } from '@/lib/trips/trip-plan-integrated/manual'
import { reiseLesen, type PlanpunktFormular } from '@/lib/trips/schema'
import type { Trip, TripItem } from '@/types/trips'

type Aufruf =
  | { art: 'edit'; original: TripItem; change: PlanAenderung }
  | { art: 'delete'; tagId: string; punktId: string }
  | { art: 'create' }

type Pending = {
  resolve: (wert: string | null) => void
  reject: (fehler: unknown) => void
}

const aufrufe: Aufruf[] = []
let pending: Pending | null = null
let gastLoeschen = false

function eingabe(titel: string) {
  return {
    clientRef: kennungErzeugen('trip'),
    title: titel,
    destination: 'Japan',
    destinationPlaceId: 'geonames:1861060',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-14',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    pace: 'balanced' as const,
    interests: [] as string[],
    travelWish: null,
  }
}

function punktAuf(reise: Trip, id: string, naechster: TripItem): Trip {
  const ersetzen = (punkt: TripItem) => (punkt.id === id ? naechster : punkt)
  return {
    ...reise,
    days: reise.days.map((tag) => ({ ...tag, items: tag.items.map(ersetzen) })),
    ohneTag: reise.ohneTag.map(ersetzen),
  }
}

function fest(reise: Trip): Trip {
  const gelesen = reiseLesen(reise)
  if (!gelesen) throw new Error('Die Montage-Reise ist kein gültiger Entwurf.')
  window.localStorage.setItem(SCHLUESSEL.aktiv, JSON.stringify(gelesen))
  return gelesen
}

function ohnePunkt(reise: Trip, id: string): Trip {
  return {
    ...reise,
    days: reise.days.map((tag) => ({ ...tag, items: tag.items.filter((punkt) => punkt.id !== id) })),
    ohneTag: reise.ohneTag.filter((punkt) => punkt.id !== id),
  }
}

function App() {
  const [reise, setReise] = useState<Trip | null>(null)
  const [aktiv, setAktiv] = useState('')
  const [sichtbar, setSichtbar] = useState(true)
  const reiseRef = useRef(reise)
  reiseRef.current = reise

  const rootReise = (naechste: Trip) => {
    reiseRef.current = naechste
    setReise(naechste)
    setAktiv((bisher) => (naechste.days.some((tag) => tag.id === bisher) ? bisher : naechste.days[0]?.id ?? ''))
  }

  useEffect(() => {
    window.__plan = {
      leer() {
        window.localStorage.clear()
        aufrufe.length = 0
        pending = null
        gastLoeschen = false
      },
      tagesreise(titel = 'Tagesreise') {
        this.leer()
        let gebaut = gastreiseAnlegen(eingabe(titel))
        const tag = gebaut.days[0]!
        gebaut = gastPlanpunktAnlegen(gebaut, {
          dayId: tag.id,
          kind: 'activity',
          title: 'Marktbesuch',
          note: 'früh',
          startsAt: null,
        })
        gebaut = gastPlanpunktAnlegen(gebaut, {
          dayId: tag.id,
          kind: 'note',
          title: 'Hinweis mit einem sehr langen Namen für den Tagesplan',
          note: null,
          startsAt: null,
        })
        const flug = gebaut.days[0]!.items[0]!
        gebaut = {
          ...gebaut,
          days: gebaut.days.map((eintrag, index) =>
            index === 0
              ? {
                  ...eintrag,
                  title: 'Ein sehr langer Tagesname für die schmale Darstellung des Plans',
                  items: [
                    { ...flug, id: 'item-flug', kind: 'flight', title: 'Flug nach Osaka', dayId: eintrag.id },
                    ...eintrag.items,
                  ],
                }
              : eintrag,
          ),
        }
        const festGebaut = fest(gebaut)
        rootReise(festGebaut)
        setSichtbar(true)
        return festGebaut
      },
      ohneTage() {
        const gebaut = this.tagesreise('Ohne Tage')
        const aktivitaet = gebaut.days[0]!.items.find((punkt) => punkt.kind === 'activity')!
        const notiz = gebaut.days[0]!.items.find((punkt) => punkt.kind === 'note')!
        const flug = gebaut.days[0]!.items.find((punkt) => punkt.kind === 'flight')!
        const naechste: Trip = {
          ...gebaut,
          startDate: null,
          endDate: null,
          days: [],
          ohneTag: [
            { ...aktivitaet, dayId: null },
            { ...notiz, dayId: null },
            { ...flug, dayId: null },
          ],
        }
        const festNaechste = fest(naechste)
        rootReise(festNaechste)
        return festNaechste
      },
      setReise(naechste: Trip) {
        rootReise(naechste)
      },
      andereReise() {
        const stand = reiseRef.current
        if (!stand) return null
        const naechste = fest({ ...stand, id: `andere-${stand.id}`.slice(0, 80), title: 'Andere Reise' })
        rootReise(naechste)
        return naechste
      },
      setAktiv(tagId: string) {
        setAktiv(tagId)
      },
      unmount() {
        setSichtbar(false)
      },
      gastLoeschen(an: boolean) {
        gastLoeschen = an
      },
      aufrufe() {
        return aufrufe
      },
      loesen(wert: string | null) {
        const aktuell = pending
        pending = null
        aktuell?.resolve(wert)
      },
      werfen(meldung: string) {
        const aktuell = pending
        pending = null
        aktuell?.reject(new Error(meldung))
      },
      erwartetesGraph(rowVersion?: string) {
        const letzter = [...aufrufe].reverse().find((aufruf) => aufruf.art === 'edit')
        const stand = reiseRef.current
        if (!letzter || letzter.art !== 'edit' || !stand) return null
        const nachher = punktAendern(stand, letzter.original, letzter.change)
        if (!rowVersion) return nachher
        const ziel = allePlanpunkte(nachher).find((punkt) => punkt.id === letzter.original.id)
        if (!ziel) return nachher
        return punktAuf(nachher, ziel.id, { ...ziel, rowVersion })
      },
      versionNur() {
        const letzter = [...aufrufe].reverse().find((aufruf) => aufruf.art === 'edit')
        const stand = reiseRef.current
        if (!letzter || letzter.art !== 'edit' || !stand) return null
        return punktAuf(stand, letzter.original.id, { ...letzter.original, rowVersion: '2026-10-24T16:00:00.000Z' })
      },
      ohneZiel() {
        const letzter = [...aufrufe].reverse().find((aufruf) => aufruf.art === 'edit')
        const stand = reiseRef.current
        if (!letzter || letzter.art !== 'edit' || !stand) return null
        return ohnePunkt(stand, letzter.original.id)
      },
      duplikat() {
        const letzter = [...aufrufe].reverse().find((aufruf) => aufruf.art === 'edit')
        const stand = reiseRef.current
        if (!letzter || letzter.art !== 'edit' || !stand) return null
        return { ...stand, ohneTag: [...stand.ohneTag, { ...letzter.original, dayId: null }] }
      },
      speicher() {
        return window.localStorage.getItem(SCHLUESSEL.aktiv)
      },
      reise() {
        return reiseRef.current
      },
    }
  }, [])

  if (!sichtbar || !reise) return <p data-plan-leer-mount="ja">Kein Plan</p>
  return (
    <TripWorkspacePlan
      reise={reise}
      ohneTag={reise.ohneTag}
      aktiverTag={aktiv}
      kompakt={false}
      onTagWechseln={setAktiv}
      onPunktAnlegen={async (_tagId: string, _eingabe: PlanpunktFormular) => {
        aufrufe.push({ art: 'create' })
        return new Promise((resolve, reject) => {
          pending = { resolve, reject }
        })
      }}
      onPunktBearbeiten={async (original, change) => {
        aufrufe.push({ art: 'edit', original, change })
        return new Promise((resolve, reject) => {
          pending = { resolve, reject }
        })
      }}
      onPunktEntfernen={async (tagId, punktId) => {
        aufrufe.push({ art: 'delete', tagId, punktId })
        if (!gastLoeschen) {
          return new Promise((resolve, reject) => {
            pending = { resolve, reject }
          })
        }
        const stand = reiseRef.current
        if (!stand) return 'Keine Reise'
        try {
          const naechste = gastPlanpunktEntfernen(stand, punktId)
          rootReise(naechste)
          return null
        } catch (fehler) {
          return fehler instanceof Error ? fehler.message : 'Der Punkt konnte nicht entfernt werden.'
        }
      }}
    />
  )
}

declare global {
  interface Window {
    __plan: {
      leer: () => void
      tagesreise: (titel?: string) => Trip
      ohneTage: () => Trip
      setReise: (reise: Trip) => void
      andereReise: () => Trip | null
      setAktiv: (tagId: string) => void
      unmount: () => void
      gastLoeschen: (an: boolean) => void
      aufrufe: () => Aufruf[]
      loesen: (wert: string | null) => void
      werfen: (meldung: string) => void
      erwartetesGraph: (rowVersion?: string) => Trip | null
      versionNur: () => Trip | null
      ohneZiel: () => Trip | null
      duplikat: () => Trip | null
      speicher: () => string | null
      reise: () => Trip | null
    }
  }
}

const host = document.getElementById('root')
if (!host) throw new Error('missing root')
createRoot(host).render(<App />)
