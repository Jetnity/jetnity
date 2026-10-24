import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'

import Reiseidee from '@/components/trips/Reiseidee'
import TripPlanner from '@/components/trips/TripPlanner'
import type { Ort } from '@/lib/places/domain'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import { VORSCHLAG_MIT_DATUM } from '@/lib/reisevorschlag/fixtures/antworten'
import { VORSCHLAG_FASSUNG } from '@/lib/reisevorschlag/schema'

const NAMEN: Record<string, string> = {
  'geonames:1861060': 'Japan',
  'geonames:2657896': 'Zürich',
  'geonames:3169070': 'Rom',
}

const KONTO_MELDUNG = 'Diese Reise konnte im Konto nicht gespeichert werden.'
const ORT_FREI = 'Die Orte konnten gerade nicht bestätigt werden.'
const ENTWURF_MELDUNG = 'Aus dieser Beschreibung wird gerade kein Entwurf.'
const UEBERNAHME_MELDUNG = 'Dieser Vorschlag konnte im Konto nicht gespeichert werden.'
const WARNUNG = 'Noch ohne bestätigte Unterkunft.'

type Modus = 'ok' | 'domain' | 'domain-plain' | 'reject' | 'throw' | 'hold'
type Auftrag = { modus: Modus; danach?: Exclude<Modus, 'hold'> }
type Aufruf = { name: string; eingabe: unknown }
type Props = {
  ansicht: 'manual' | 'idea'
  konto: boolean
  destination: string
  destinationId: string
  weitere: { id: string; name: string }[]
  idee: string
}

function ort(id: string): Ort {
  const airport = id.startsWith('airport:')
  return {
    id,
    source: airport ? 'ourairports' : 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name: NAMEN[id] ?? id,
    typ: airport ? 'airport' : 'city',
    country: 'Schweiz',
    countryCode: 'CH',
    region: null,
    lat: 47.37,
    lon: 8.54,
    iata: airport ? id.slice('airport:'.length) : null,
    keywords: null,
  }
}

function domain(name: string, art: 'domain' | 'domain-plain') {
  if (name === 'orte' && art === 'domain-plain') return { ok: false, meldung: ORT_FREI }
  if (name === 'orte') {
    return { ok: false, meldung: ORT_MELDUNG.zielUnbekannt, feld: 'destination' as const, zielIndex: 0 }
  }
  if (name === 'anlegen') return { ok: false, meldung: KONTO_MELDUNG }
  if (name === 'erzeugen') return { ok: false, meldung: ENTWURF_MELDUNG, klasse: 'eingabe' as const }
  if (name === 'uebernehmen') return { ok: false, meldung: UEBERNAHME_MELDUNG }
  return { ok: false, meldung: ORT_FREI }
}

function erfolg(name: string, eingabe: unknown) {
  if (name === 'orte') {
    const body = eingabe as { zielId: string; abreiseId: string; weitereZielIds?: string[] }
    return {
      ok: true,
      ziel: ort(body.zielId),
      abreise: ort(body.abreiseId),
      weitereZiele: (body.weitereZielIds ?? []).map(ort),
    }
  }
  if (name === 'anlegen') return { ok: true, wert: 'reise-konto-synthetisch' }
  if (name === 'erzeugen') {
    return {
      ok: true,
      vorschlag: {
        ...VORSCHLAG_MIT_DATUM,
        fassung: VORSCHLAG_FASSUNG,
        reisewunsch: typeof eingabe === 'string' ? eingabe : null,
      },
      warnungen: [WARNUNG],
    }
  }
  if (name === 'uebernehmen') return { ok: true, wert: 'reise-vorschlag-konto' }
  if (name === 'aufloesen') return { origin: null, stages: [null] }
  throw new Error(`Unbekannte Grenze ${name}`)
}

function antwort(name: string, art: Exclude<Modus, 'hold'>, eingabe: unknown) {
  if (art === 'throw') throw new Error('synthetic throw')
  if (art === 'reject') return Promise.reject(new Error('synthetic rejection'))
  if (art === 'domain' || art === 'domain-plain') return Promise.resolve(domain(name, art))
  return Promise.resolve(erfolg(name, eingabe))
}

const calls: Aufruf[] = []
const pushes: string[] = []
const uuids: string[] = []
const release: Record<string, () => void> = {}
const auftrag: Record<string, Auftrag> = {}

const props: Props = {
  ansicht: 'manual',
  konto: false,
  destination: 'Japan',
  destinationId: 'geonames:1861060',
  weitere: [{ id: 'geonames:3169070', name: 'Rom' }],
  idee: 'Sieben Tage Japan ab Zürich, zwei Personen.',
}

function grenzen(name: string, eingabe: unknown) {
  calls.push({ name, eingabe: structuredClone(eingabe) })
  const lauf = auftrag[name] ?? { modus: 'ok' as const }
  if (lauf.modus !== 'hold') return antwort(name, lauf.modus, eingabe)
  return new Promise((resolve, reject) => {
    release[name] = () => {
      const danach = lauf.danach ?? 'ok'
      try {
        Promise.resolve(antwort(name, danach, eingabe)).then(resolve, reject)
      } catch (fehler) {
        reject(fehler)
      }
    }
  })
}

window.fixture = {
  calls,
  pushes,
  uuids,
  props,
  texte: {
    zielUnbekannt: ORT_MELDUNG.zielUnbekannt,
    ortFrei: ORT_FREI,
    konto: KONTO_MELDUNG,
    entwurf: ENTWURF_MELDUNG,
    uebernahme: UEBERNAHME_MELDUNG,
    warnung: WARNUNG,
    transportManuell:
      'Die Reise konnte gerade nicht erstellt werden. Deine Angaben bleiben hier. Bitte versuche es erneut.',
    transportEntwurf:
      'Der Entwurf konnte gerade nicht erstellt werden. Deine Beschreibung bleibt hier. Bitte versuche es erneut.',
    transportUebernahme:
      'Dieser Vorschlag konnte gerade nicht übernommen werden. Er bleibt hier. Bitte versuche es erneut.',
  },
  arm(name: string, modus: Modus, danach?: Exclude<Modus, 'hold'>) {
    auftrag[name] = { modus, danach }
  },
  los(name: string) {
    const fn = release[name]
    if (!fn) throw new Error(`Kein gehaltener Aufruf: ${name}`)
    delete release[name]
    fn()
  },
  grenzen,
  steuerung: {
    wieder() {},
    weg() {},
  },
}

const randomUUID = crypto.randomUUID.bind(crypto)
crypto.randomUUID = () => {
  const id = `00000000-0000-4000-8000-${String(uuids.length + 1).padStart(12, '0')}`
  uuids.push(id)
  void randomUUID
  return id
}

function Shell() {
  const [sichtbar, setSichtbar] = useState(true)
  const [n, setN] = useState(0)
  const [stand, setStand] = useState<Props>(props)

  useEffect(() => {
    window.fixture.steuerung = {
      wieder(next?: Partial<Props>) {
        if (next) Object.assign(props, next)
        setStand({ ...props, weitere: props.weitere.map((ziel) => ({ ...ziel })) })
        setN((wert) => wert + 1)
        setSichtbar(true)
      },
      weg() {
        setSichtbar(false)
      },
    }
  }, [])

  if (!sichtbar) return <p data-unmounted="1">weg</p>

  const key = `${stand.ansicht}-${stand.konto}-${n}`
  if (stand.ansicht === 'idea') {
    return (
      <div data-ready="1">
        <Reiseidee key={key} angemeldet={stand.konto} initialIdee={stand.idee} />
      </div>
    )
  }
  return (
    <div data-ready="1">
      <TripPlanner
        key={key}
        angemeldet={stand.konto}
        initialDestination={stand.destination}
        initialDestinationId={stand.destinationId}
        initialWeitereZiele={stand.weitere}
      />
    </div>
  )
}

const host = document.getElementById('root')
if (!host) throw new Error('missing root')
createRoot(host).render(<Shell />)

declare global {
  interface Window {
    fixture: {
      calls: Aufruf[]
      pushes: string[]
      uuids: string[]
      props: Props
      texte: Record<string, string>
      arm: (name: string, modus: Modus, danach?: Exclude<Modus, 'hold'>) => void
      los: (name: string) => void
      grenzen: (name: string, eingabe: unknown) => Promise<unknown>
      steuerung: { wieder: (next?: Partial<Props>) => void; weg: () => void }
    }
  }
}
