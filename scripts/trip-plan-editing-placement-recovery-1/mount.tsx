import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  | { id: number; art: 'edit'; original: TripItem; change: PlanAenderung }
  | { id: number; art: 'delete'; tagId: string; punktId: string }
  | { id: number; art: 'create' }

type Pending = {
  resolve: (wert: string | null) => void
  reject: (fehler: unknown) => void
}

const aufrufe: Aufruf[] = []
const wartend = new Map<number, Pending>()
let naechsteId = 0
let aufgeloest = 0
let gastLoeschen = false

function neueId() {
  naechsteId += 1
  return naechsteId
}

function vormerken(id: number) {
  return new Promise<string | null>((resolve, reject) => {
    wartend.set(id, { resolve, reject })
  })
}

function juengsteId() {
  let letzte: number | null = null
  for (const id of wartend.keys()) letzte = id
  return letzte
}

function loesenId(id: number, wert: string | null) {
  const eintrag = wartend.get(id)
  if (!eintrag) return false
  wartend.delete(id)
  aufgeloest += 1
  eintrag.resolve(wert)
  return true
}

function allePunkte(reise: Trip) {
  return [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag]
}

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
  useLayoutEffect(() => {
    reiseRef.current = reise
  }, [reise])

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
        wartend.clear()
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
      offen() {
        return [...wartend.keys()]
      },
      aufgeloest() {
        return aufgeloest
      },
      loesen(wert: string | null) {
        const id = juengsteId()
        if (id == null) return false
        return loesenId(id, wert)
      },
      loesenId,
      werfen(meldung: string) {
        const id = juengsteId()
        if (id == null) return false
        const eintrag = wartend.get(id)
        if (!eintrag) return false
        wartend.delete(id)
        aufgeloest += 1
        eintrag.reject(new Error(meldung))
        return true
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
      inhaltFremd() {
        const letzter = [...aufrufe].reverse().find((aufruf) => aufruf.art === 'edit')
        const stand = reiseRef.current
        if (!letzter || letzter.art !== 'edit' || !stand) return null
        const ziel = allePunkte(stand).find((punkt) => punkt.id === letzter.original.id)
        if (!ziel) return null
        return punktAuf(stand, ziel.id, { ...ziel, title: `${ziel.title} · fremd` })
      },
      platzFremd() {
        const letzter = [...aufrufe].reverse().find((aufruf) => aufruf.art === 'edit')
        const stand = reiseRef.current
        if (!letzter || letzter.art !== 'edit' || !stand) return null
        const ziel = allePunkte(stand).find((punkt) => punkt.id === letzter.original.id)
        if (!ziel || ziel.dayId == null) return null
        return {
          ...stand,
          days: stand.days.map((tag) => ({ ...tag, items: tag.items.filter((punkt) => punkt.id !== ziel.id) })),
          ohneTag: [...stand.ohneTag, { ...ziel, dayId: null }],
        }
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
      onPunktAnlegen={async (tagId: string, eingabe: PlanpunktFormular) => {
        void tagId
        void eingabe
        const id = neueId()
        aufrufe.push({ id, art: 'create' })
        return vormerken(id)
      }}
      onPunktBearbeiten={async (original, change) => {
        const id = neueId()
        aufrufe.push({ id, art: 'edit', original, change })
        return vormerken(id)
      }}
      onPunktEntfernen={async (tagId, punktId) => {
        const id = neueId()
        aufrufe.push({ id, art: 'delete', tagId, punktId })
        if (!gastLoeschen) return vormerken(id)
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
      offen: () => number[]
      aufgeloest: () => number
      loesen: (wert: string | null) => boolean
      loesenId: (id: number, wert: string | null) => boolean
      werfen: (meldung: string) => boolean
      erwartetesGraph: (rowVersion?: string) => Trip | null
      versionNur: () => Trip | null
      ohneZiel: () => Trip | null
      duplikat: () => Trip | null
      inhaltFremd: () => Trip | null
      platzFremd: () => Trip | null
      speicher: () => string | null
      reise: () => Trip | null
    }
  }
}

const host = document.getElementById('root')
if (!host) throw new Error('missing root')
createRoot(host).render(<App />)
