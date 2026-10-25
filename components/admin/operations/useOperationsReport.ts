'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { lade, type Antwortartig } from '@/lib/admin/ladezustand'
import {
  abmelden,
  abschluss,
  alterFortschreiben,
  buchAusBericht,
  endpunktSetzen,
  erlaubnisSetzen,
  getBeginnen,
  getErfolg,
  HISTORISCHER_SATZ,
  laufGueltig,
  liesUhren,
  misserfolg,
  propsBeginnen,
  propsErfolg,
  propsMisserfolg,
  signaturVon,
  standAnfang,
  verweigerung,
  type Buch,
  type Stand,
} from '@/lib/admin/operations-read-lifecycle'

export { HISTORISCHER_SATZ }

type Frische = { state: 'fresh' | 'stale' | 'unknown'; ageMs: number | null; ttlMs: number }
type Knoten = {
  id: string
  checkedAt: string
  freshness: Frische
  checks?: Array<{ id: string; freshness: Frische }> | undefined
}
type BerichtBasis = { checkedAt: string; items: Knoten[] }
export type OperationsHinweis = {
  id: string
  state: Frische['state']
  ageMs: number | null
  checks: Array<{ id: string; state: Frische['state']; ageMs: number | null }>
}

const UNLESBAR = 'Die Antwort des Servers war nicht lesbar.'

function tor(): Promise<void> {
  const sperre = (globalThis as { __JETNITY_OPS_PROPS_SPERRE__?: unknown }).__JETNITY_OPS_PROPS_SPERRE__
  if (typeof sperre !== 'function') return Promise.resolve()
  return Promise.resolve((sperre as () => unknown)()).then(() => undefined)
}

function synthetisch(koerper: unknown): Antwortartig {
  return {
    ok: true,
    status: 200,
    json: async () => {
      await tor()
      return koerper
    },
  }
}

function standardVerweigerung(status: number): string {
  return status === 401 ? 'Nicht angemeldet.' : 'Für diese Ansicht fehlt die Berechtigung.'
}

function hinweiseAus<R extends BerichtBasis>(
  bericht: R,
  wand: unknown,
  hinweis: (bericht: R, wand: number) => OperationsHinweis[],
) {
  if (typeof wand !== 'number' || !Number.isFinite(wand)) return null
  return hinweis(bericht, wand).map((eintrag) => ({
    id: eintrag.id,
    hinweis: { state: eintrag.state, ageMs: eintrag.ageMs },
    checks: eintrag.checks.map((check) => ({ state: check.state, ageMs: check.ageMs })),
  }))
}

function mitAnzeige<R extends BerichtBasis>(bericht: R, aktuell: Buch): R {
  const karten = new Map(aktuell.karten.map((karte) => [karte.id, karte]))
  return {
    ...bericht,
    items: bericht.items.map((item) => {
      const karte = karten.get(item.id)
      if (!karte) return item
      const checks = item.checks?.map((check) => {
        const teil = karte.checks.find((eintrag) => eintrag.id === check.id)
        return teil ? { ...check, freshness: teil.anzeige } : check
      })
      return { ...item, freshness: karte.anzeige, checks }
    }),
  }
}

export function useOperationsReport<R extends BerichtBasis>(input: {
  anfang: R
  endpunkt: string
  aktualisierenErlaubt: boolean
  deute: (wert: unknown) => R
  hinweis: (bericht: R, wand: number) => OperationsHinweis[]
}): {
  phase: Stand<R>['phase']
  pending: boolean
  meldung: string | null
  anzeige: R | null
  erneut: () => void
} {
  const anfangSig = signaturVon(input.anfang)
  const [stand, setStand] = useState(() => standAnfang<R>(1, input.endpunkt, input.aktualisierenErlaubt))
  const [buch, setBuch] = useState<Buch | null>(null)
  const standRef = useRef(stand)
  const buchRef = useRef<Buch | null>(null)
  const anfangRef = useRef(input.anfang)
  const deuteRef = useRef(input.deute)
  const hinweisRef = useRef(input.hinweis)
  const controllerRef = useRef<AbortController | null>(null)
  anfangRef.current = input.anfang
  deuteRef.current = input.deute
  hinweisRef.current = input.hinweis

  const commit = useCallback((next: Stand<R>, naechstesBuch?: Buch | null) => {
    standRef.current = next
    if (naechstesBuch !== undefined) {
      buchRef.current = naechstesBuch
      setBuch(naechstesBuch)
    }
    if (!next.montiert) return
    setStand(next)
  }, [])

  useEffect(() => {
    let aktiv = true
    let standJetzt = standRef.current
    if (standJetzt.endpunkt !== input.endpunkt) {
      standJetzt = endpunktSetzen(standJetzt, input.endpunkt)
      standRef.current = standJetzt
      if (standJetzt.montiert) setStand(standJetzt)
      controllerRef.current?.abort()
      controllerRef.current = null
    }
    if (standJetzt.getGesperrt || standJetzt.latch || standJetzt.bericht) {
      standRef.current = standJetzt
      if (standJetzt.montiert) setStand(standJetzt)
      return () => {
        aktiv = false
      }
    }
    const begonnen = propsBeginnen(standJetzt)
    if (!begonnen.lauf) {
      standRef.current = begonnen.stand
      if (begonnen.stand.montiert) setStand(begonnen.stand)
      return () => {
        aktiv = false
      }
    }
    const lauf = begonnen.lauf
    standRef.current = begonnen.stand
    if (begonnen.stand.montiert) setStand(begonnen.stand)
    const koerper = anfangRef.current
    void (async () => {
      const ladung = await lade(async () => synthetisch(koerper), (wert) => deuteRef.current(wert))
      if (!aktiv || !laufGueltig(standRef.current, lauf)) return
      if (ladung.fehler || !ladung.daten) {
        commit(propsMisserfolg(standRef.current, lauf, ladung.fehler?.meldung ?? UNLESBAR))
        return
      }
      const nach = propsErfolg(standRef.current, lauf, ladung.daten, signaturVon(ladung.daten))
      if (nach.bericht !== ladung.daten) return
      commit(nach, buchAusBericht(ladung.daten, liesUhren(), (wert, wand) => hinweisRef.current(wert, wand)))
    })().finally(() => {
      if (!aktiv) return
      const nach = abschluss(standRef.current, lauf)
      if (nach !== standRef.current) commit(nach)
    })
    return () => {
      aktiv = false
    }
  }, [anfangSig, input.endpunkt, commit])

  useEffect(() => {
    if (standRef.current.erlaubt === input.aktualisierenErlaubt) return
    if (standRef.current.erlaubt && !input.aktualisierenErlaubt) {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
    commit(erlaubnisSetzen(standRef.current, input.aktualisierenErlaubt))
  }, [input.aktualisierenErlaubt, commit])

  useEffect(() => {
    const tick = () => {
      const bericht = standRef.current.bericht
      const aktuell = buchRef.current
      if (!bericht || !aktuell || !standRef.current.montiert || standRef.current.latch) return
      const uhren = liesUhren()
      const fort = alterFortschreiben({
        anker: aktuell.anker,
        karten: aktuell.karten,
        wand: uhren.wand,
        mono: uhren.mono,
        hinweise: hinweiseAus(bericht, uhren.wand, hinweisRef.current),
      })
      buchRef.current = fort
      setBuch(fort)
    }
    const id = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('pageshow', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('pageshow', tick)
    }
  }, [])

  useEffect(() => {
    standRef.current = { ...standRef.current, montiert: true }
    return () => {
      standRef.current = abmelden(standRef.current)
      controllerRef.current?.abort()
    }
  }, [])

  const erneut = () => {
    const begonnen = getBeginnen(standRef.current)
    if (!begonnen.lauf) return
    const lauf = begonnen.lauf
    const controller = new AbortController()
    controllerRef.current = controller
    commit(begonnen.stand)
    void (async () => {
      try {
        const response = await fetch(lauf.endpunkt, { cache: 'no-store', signal: controller.signal })
        const status = response.status
        const ladung = await lade(async () => response, (wert) => deuteRef.current(wert))
        if (!laufGueltig(standRef.current, lauf)) return
        if (status === 401 || status === 403) {
          commit(verweigerung(standRef.current, lauf, ladung.fehler?.meldung ?? standardVerweigerung(status)), null)
          return
        }
        if (ladung.fehler || !ladung.daten) {
          commit(misserfolg(standRef.current, lauf, ladung.fehler?.meldung ?? UNLESBAR))
          return
        }
        commit(
          getErfolg(standRef.current, lauf, ladung.daten, signaturVon(ladung.daten)),
          buchAusBericht(ladung.daten, liesUhren(), (wert, wand) => hinweisRef.current(wert, wand)),
        )
      } catch (error) {
        if (!laufGueltig(standRef.current, lauf)) return
        const ladung = await lade(async () => {
          throw error
        }, (wert) => deuteRef.current(wert))
        if (!laufGueltig(standRef.current, lauf)) return
        commit(misserfolg(standRef.current, lauf, ladung.fehler?.meldung ?? 'Der Server ist nicht erreichbar.'))
      } finally {
        const nach = abschluss(standRef.current, lauf)
        if (nach !== standRef.current) commit(nach)
      }
    })()
  }

  const anzeige = stand.bericht && buch && stand.phase !== 'verweigert' && !stand.latch ? mitAnzeige(stand.bericht, buch) : null
  return { phase: stand.phase, pending: stand.getGesperrt, meldung: stand.meldung, anzeige, erneut }
}
