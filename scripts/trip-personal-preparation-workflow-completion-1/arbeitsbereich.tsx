import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import TripWorkspace from '@/components/trips/TripWorkspace'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { gastReadinessEntfernen, gastReadinessSetzen } from '@/lib/readiness/gast'
import type { ReadinessAktualisierung } from '@/lib/readiness/personal-preparation-workflow'
import { aktiveV3GastreiseLesen, gastreiseSpeichern, SCHLUESSEL } from '@/lib/trips/gastspeicher'
import type { Trip } from '@/types/trips'

type Start = {
  seam: 'guest' | 'account'
  reise: Trip
  kanonisch?: Trip
  geschwister?: boolean
}

type Job = {
  ausfuehren: () => string | null
  resolve: (wert: string | null) => void
  reject: () => void
}

type Bruecke = {
  writes: number
  entries: number
  reads: number
  queued: number
  letzte: unknown
  bytes: () => string | null
  verzoegern: (wert: boolean) => void
  freigeben: () => void
  scheitern: () => void
  reiseSetzen: (reise: Trip) => void
  kanonischSetzen: (reise: Trip | undefined) => void
  speicherSetzen: (roh: string | null) => void
  lesenAls: (art: 'normal' | 'unreadable' | 'wrong_trip') => void
  fremdSchreiben: () => string | null
}

declare global {
  interface Window {
    __START__: Start
    __ARBEIT__: Bruecke
  }
}

function ausgang(start: Start): Trip {
  const gespeichert = gastreiseSpeichern({ ...start.reise, readinessItems: start.reise.readinessItems ?? [] })
  if (!start.geschwister) return gespeichert
  return gastReadinessSetzen(gespeichert, {
    clientRef: 'entry-geschwister',
    kind: 'entry_check',
    userStatus: 'open',
    countryCode: 'IT',
    tripItemId: null,
    title: null,
  })
}

function Host() {
  const start = window.__START__
  const [reise, setReise] = useState(() => (start.seam === 'guest' ? ausgang(start) : start.reise))
  const [kanonisch, setKanonisch] = useState<Trip | undefined>(start.kanonisch)
  const reiseRef = useRef(reise)
  const writes = useRef(0)
  const entries = useRef(0)
  const reads = useRef(0)
  const letzte = useRef<unknown>(null)
  const verzoegern = useRef(false)
  const lesart = useRef<'normal' | 'unreadable' | 'wrong_trip'>('normal')
  const wartend = useRef<Job[]>([])

  const fertig = (basis: Trip, next: Trip): string | null => {
    writes.current += 1
    if (reiseRef.current.id === basis.id) {
      reiseRef.current = next
      setReise(next)
    }
    return null
  }

  const setzen = (eingabe: Parameters<typeof gastReadinessSetzen>[1]) => {
    entries.current += 1
    letzte.current = eingabe
    if (start.seam === 'account') {
      const ausfuehren = () => {
        writes.current += 1
        return null
      }
      if (!verzoegern.current) return Promise.resolve().then(ausfuehren)
      return new Promise<string | null>((resolve, reject) => {
        wartend.current.push({ ausfuehren, resolve, reject })
      })
    }
    const basis = reiseRef.current
    let ergebnis: string | null
    try {
      ergebnis = fertig(basis, gastReadinessSetzen(basis, eingabe))
    } catch (fehler) {
      ergebnis = fehler instanceof Error ? fehler.message : 'Die Vorbereitung konnte nicht gespeichert werden.'
    }
    if (!verzoegern.current) return Promise.resolve(ergebnis)
    return new Promise<string | null>((resolve, reject) => {
      wartend.current.push({ ausfuehren: () => ergebnis, resolve, reject })
    })
  }

  const entfernen = (clientRef: string) => {
    entries.current += 1
    const basis = reiseRef.current
    if (start.seam === 'account') {
      writes.current += 1
      return Promise.resolve(null)
    }
    try {
      return Promise.resolve(fertig(basis, gastReadinessEntfernen(basis, clientRef)))
    } catch (fehler) {
      return Promise.resolve(fehler instanceof Error ? fehler.message : 'Die Vorbereitung konnte nicht entfernt werden.')
    }
  }

  const lesen = async (): Promise<ReadinessAktualisierung> => {
    reads.current += 1
    if (start.seam === 'account') return { art: 'props' }
    if (lesart.current === 'wrong_trip') return { art: 'wrong_trip' }
    const id = reiseRef.current.id
    if (lesart.current === 'unreadable') {
      const original = Storage.prototype.getItem
      Storage.prototype.getItem = () => {
        throw new Error('gesperrt')
      }
      try {
        return aktiveV3GastreiseLesen(id)
      } finally {
        Storage.prototype.getItem = original
      }
    }
    const lesung = aktiveV3GastreiseLesen(id)
    if (lesung.art === 'success' && reiseRef.current.id === id) {
      reiseRef.current = lesung.reise
      setReise(lesung.reise)
    }
    return lesung
  }

  useEffect(() => {
    window.__ARBEIT__ = {
      get writes() {
        return writes.current
      },
      get entries() {
        return entries.current
      },
      get reads() {
        return reads.current
      },
      get queued() {
        return wartend.current.length
      },
      get letzte() {
        return letzte.current
      },
      bytes: () => window.localStorage.getItem(SCHLUESSEL.aktiv),
      verzoegern: (wert) => {
        verzoegern.current = wert
      },
      freigeben: () => {
        const job = wartend.current.shift()
        if (!job) return
        job.resolve(job.ausfuehren())
      },
      scheitern: () => {
        wartend.current.shift()?.reject()
      },
      reiseSetzen: (naechste) => {
        reiseRef.current = naechste
        setReise(naechste)
      },
      kanonischSetzen: setKanonisch,
      speicherSetzen: (roh) => {
        if (roh == null) window.localStorage.removeItem(SCHLUESSEL.aktiv)
        else window.localStorage.setItem(SCHLUESSEL.aktiv, roh)
      },
      lesenAls: (art) => {
        lesart.current = art
      },
      fremdSchreiben: () => {
        gastreiseSpeichern(beispielreise({ id: 'fremd-reise', readinessItems: [] }))
        return window.localStorage.getItem(SCHLUESSEL.aktiv)
      },
    }
  }, [])

  return (
    <div data-workspace-harness="trip">
      <TripWorkspace
        reise={reise}
        quelle={start.seam === 'account' ? 'account' : 'guest'}
        onPunktAnlegen={async () => null}
        onPunktEntfernen={async () => null}
        onReadinessSetzen={setzen}
        onReadinessEntfernen={entfernen}
        onReadinessAktualisieren={lesen}
        readinessKanonischeReise={kanonisch}
      />
    </div>
  )
}

const wurzel = document.getElementById('root')
if (!wurzel) throw new Error('Montagepunkt fehlt')
createRoot(wurzel).render(<Host />)
