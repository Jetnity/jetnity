import { createRoot, type Root } from 'react-dom/client'

import GastArbeitsbereich from '@/components/trips/GastArbeitsbereich'
import GastReisen from '@/components/trips/GastReisen'
import { SCHLUESSEL, gastreiseAnlegen, kennungErzeugen } from '@/lib/trips/gastspeicher'
import type { CreateTripInput } from '@/types/trips'

type Vorgang = { art: 'set' | 'remove'; schluessel: string }

const host = document.getElementById('root')
if (!host) throw new Error('missing root')

let root: Root | null = null
let werfen = false
const werfende = new Set<string>()
const vorgaenge: Vorgang[] = []

const proto = Storage.prototype
const getItem = proto.getItem
const setItem = proto.setItem
const removeItem = proto.removeItem
const clear = proto.clear

proto.getItem = function (schluessel: string) {
  if (werfen || werfende.has(schluessel)) throw new Error('SecurityError')
  return getItem.call(this, schluessel)
}
proto.setItem = function (schluessel: string, wert: string) {
  vorgaenge.push({ art: 'set', schluessel })
  return setItem.call(this, schluessel, wert)
}
proto.removeItem = function (schluessel: string) {
  vorgaenge.push({ art: 'remove', schluessel })
  return removeItem.call(this, schluessel)
}

let listenLauf = 0

function sicherRoot() {
  if (!root) root = createRoot(host!)
  return root
}

function eingabe(clientRef: string, title: string): CreateTripInput {
  return {
    clientRef,
    title,
    destination: 'Japan',
    destinationPlaceId: 'geonames:1861060',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-14',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    pace: 'balanced',
    interests: [],
    travelWish: null,
  }
}

function legacyOhneAktiv(id: string, title: string) {
  setItem.call(
    window.localStorage,
    SCHLUESSEL.legacy,
    JSON.stringify([
      {
        id,
        title,
        destination: 'Barcelona',
        origin: 'Zürich',
        startDate: '2026-09-12',
        endDate: '2026-09-14',
        travelers: 1,
        pace: 'ruhig',
        interests: ['Kultur'],
        budget: 1800,
        days: [
          { id: 'day-2026-09-12', date: '2026-09-12', items: [] },
          { id: 'day-2026-09-13', date: '2026-09-13', items: [] },
          { id: 'day-2026-09-14', date: '2026-09-14', items: [] },
        ],
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
    ]),
  )
}

window.gastNachweis = {
  schluessel: SCHLUESSEL,
  vorgaenge,
  roh() {
    return {
      aktiv: getItem.call(window.localStorage, SCHLUESSEL.aktiv),
      warteschlange: getItem.call(window.localStorage, SCHLUESSEL.warteschlange),
      legacy: getItem.call(window.localStorage, SCHLUESSEL.legacy),
    }
  },
  leeren() {
    clear.call(window.localStorage)
    vorgaenge.length = 0
    werfen = false
    werfende.clear()
  },
  zaehlerLeeren() {
    vorgaenge.length = 0
  },
  setzen(schluessel: string, wert: string | null) {
    if (wert === null) removeItem.call(window.localStorage, schluessel)
    else setItem.call(window.localStorage, schluessel, wert)
  },
  werfen(an: boolean) {
    werfen = an
  },
  werfenFuer(schluessel: string | null) {
    werfende.clear()
    if (schluessel) werfende.add(schluessel)
  },
  anlegen(clientRef: string, title: string) {
    return gastreiseAnlegen(eingabe(clientRef, title)).id
  },
  kennung(prefix: string) {
    return kennungErzeugen(prefix)
  },
  legacy(id: string, title: string) {
    legacyOhneAktiv(id, title)
  },
  text() {
    return document.body.innerText
  },
  leseart() {
    return document.querySelector('[data-gast-leseart]')?.getAttribute('data-gast-leseart') ?? null
  },
  renderListe() {
    listenLauf += 1
    sicherRoot().render(<GastReisen key={listenLauf} />)
  },
  renderBereich(tripId: string) {
    sicherRoot().render(<GastArbeitsbereich tripId={tripId} />)
  },
}

declare global {
  interface Window {
    gastNachweis: {
      schluessel: typeof SCHLUESSEL
      vorgaenge: Vorgang[]
      roh: () => { aktiv: string | null; warteschlange: string | null; legacy: string | null }
      leeren: () => void
      zaehlerLeeren: () => void
      setzen: (schluessel: string, wert: string | null) => void
      werfen: (an: boolean) => void
      werfenFuer: (schluessel: string | null) => void
      anlegen: (clientRef: string, title: string) => string
      kennung: (prefix: string) => string
      legacy: (id: string, title: string) => void
      text: () => string
      leseart: () => string | null
      renderListe: () => void
      renderBereich: (tripId: string) => void
    }
  }
}
