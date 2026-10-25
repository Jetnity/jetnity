'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { Besuch } from '@/lib/account/besuche'
import {
  VISIT_PRUEFUNG_MS,
  visitAenderungenAnsehen,
  visitAnlegenSetzen,
  visitAnwenden,
  visitAufnehmen,
  visitBestaetigungOeffnen,
  visitBestaetigungSchliessen,
  visitBestaetigungUnterwegs,
  visitDispatchStart,
  visitEditorOeffnen,
  visitEditorSchliessen,
  visitEditorSetzen,
  visitEntwurfBewaffnen,
  visitEntwurfVerwerfen,
  visitErneutBestaetigen,
  visitHinweis,
  visitListeUebernehmen,
  visitPropsBeobachten,
  visitPruefungBeenden,
  visitPruefungOeffnen,
  visitSurfaceUnterwegs,
  visitThunkBeenden,
  visitVorgangSchliessen,
  visitWorkflowAnfang,
  type VisitAufnahme,
  type VisitBestaetigung,
  type VisitFormularWert,
  type VisitStand,
  type VisitSurface,
} from '@/lib/account/account-visit-workflow'
import type { Problem } from '@/lib/api/datenbank-lesen'

export type VisitWorkflowApi = {
  stand: VisitStand
  anlegenSetzen: (wert: VisitFormularWert) => void
  bearbeiten: (wert: { id: string; wert: VisitFormularWert } | null) => void
  editorSchliessen: () => void
  hinweis: (surface: VisitSurface, meldung: string) => void
  senden: (aufnahme: VisitAufnahme, aufruf: () => Promise<unknown>, bewusst?: boolean) => void
  bestaetigung: () => VisitBestaetigung | null
  bestaetigungOeffnen: (id: string) => void
  bestaetigungSchliessen: () => void
  erneutBestaetigen: (id: string) => void
  unterwegs: (surface: VisitSurface) => boolean
  bestaetigungLaeuft: (id: string) => boolean
  lesen: (id: string) => void
  schliessen: (id: string) => void
  ansehen: () => void
  uebernehmen: (besuch: Besuch) => void
  bewaaffnen: (besuch: Besuch) => VisitStand
  verwerfen: (surface: VisitSurface) => boolean
}

function commitGleich(links: VisitStand, rechts: VisitStand): boolean {
  return links === rechts
}

export function useAccountVisitWorkflow(
  props: {
    problem: Problem | null
    besuche: readonly Besuch[]
  },
  leer: VisitFormularWert,
): VisitWorkflowApi {
  const router = useRouter()
  const leerRef = useRef(leer)
  const [stand, setStand] = useState(() => visitWorkflowAnfang(1, leer))
  const standRef = useRef(stand)
  const propsRef = useRef(props)
  const sperre = useRef<string | null>(null)

  function commit(naechster: VisitStand) {
    standRef.current = naechster
    setStand(naechster)
  }

  function refreshEinmal(id: string) {
    const beenden = () => commit(visitPruefungBeenden(standRef.current, id))
    try {
      const wert: unknown = router.refresh()
      if (wert && typeof wert === 'object' && typeof (wert as { then?: unknown }).then === 'function') {
        void (wert as Promise<unknown>).then(() => undefined, beenden)
      }
    } catch {
      beenden()
    }
  }

  useEffect(() => {
    propsRef.current = props
    leerRef.current = leer
  }, [props, leer])

  useEffect(() => {
    const naechster = visitPropsBeobachten(standRef.current, {
      problem: props.problem,
      besuche: props.besuche,
    })
    if (!commitGleich(naechster, standRef.current)) commit(naechster)
  }, [props.problem, props.besuche])

  const leaseKey = stand.vorgaenge
    .filter((vorgang) => vorgang.pruefung === 'offen' && vorgang.pruefungSeit !== null)
    .map((vorgang) => `${vorgang.id}:${vorgang.pruefungSeit}`)
    .join('|')

  useEffect(() => {
    const offen = standRef.current.vorgaenge.find((vorgang) => vorgang.pruefung === 'offen' && vorgang.pruefungSeit !== null)
    if (!offen?.pruefungSeit) return
    const rest = Math.max(0, VISIT_PRUEFUNG_MS - (Date.now() - offen.pruefungSeit))
    const timer = window.setTimeout(() => commit(visitPruefungBeenden(standRef.current, offen.id)), rest)
    return () => window.clearTimeout(timer)
  }, [leaseKey])

  function senden(aufnahme: VisitAufnahme, aufruf: () => Promise<unknown>, bewusst = false) {
    const id = crypto.randomUUID()
    const entscheid = visitDispatchStart(sperre.current, id)
    if (!entscheid.starten) return
    sperre.current = entscheid.gehalten
    let aufgenommen = false
    try {
      const ergebnis = visitAufnehmen(
        standRef.current,
        id,
        aufnahme,
        { problem: propsRef.current.problem, besuche: propsRef.current.besuche },
        bewusst,
      )
      if (!ergebnis.ok) return
      aufgenommen = true
      commit(ergebnis.stand)
      void visitThunkBeenden(
        aufruf,
        (ausgang) => {
          const nachher = visitAnwenden(standRef.current, id, ausgang, Date.now())
          commit(nachher)
          const vorgang = nachher.vorgaenge.find((eintrag) => eintrag.id === id)
          if (vorgang?.phase === 'angenommen') refreshEinmal(id)
        },
        () => {
          if (sperre.current === id) sperre.current = null
        },
      )
    } finally {
      if (!aufgenommen && sperre.current === id) sperre.current = null
    }
  }

  return {
    stand,
    anlegenSetzen(wert) {
      commit(visitAnlegenSetzen(standRef.current, wert))
    },
    bearbeiten(wert) {
      if (wert === null) {
        commit(visitEditorSchliessen(standRef.current))
        return
      }
      const editor = standRef.current.editor
      if (editor?.ereignisId === wert.id) {
        commit(visitEditorSetzen(standRef.current, wert.wert))
        return
      }
      const besuch = propsRef.current.besuche.find((eintrag) => eintrag.id === wert.id)
      if (!besuch || propsRef.current.problem) return
      commit(visitEditorOeffnen(standRef.current, besuch, wert.wert))
    },
    editorSchliessen() {
      commit(visitEditorSchliessen(standRef.current))
    },
    hinweis(surface, meldung) {
      commit(visitHinweis(standRef.current, surface, meldung))
    },
    senden,
    bestaetigung: () => standRef.current.bestaetigung,
    bestaetigungOeffnen(id) {
      const besuch = propsRef.current.besuche.find((eintrag) => eintrag.id === id)
      if (!besuch || propsRef.current.problem) return
      commit(visitBestaetigungOeffnen(standRef.current, besuch, crypto.randomUUID()))
    },
    bestaetigungSchliessen() {
      commit(visitBestaetigungSchliessen(standRef.current))
    },
    erneutBestaetigen(id) {
      const besuch = propsRef.current.besuche.find((eintrag) => eintrag.id === id)
      if (!besuch || propsRef.current.problem) return
      commit(visitErneutBestaetigen(standRef.current, besuch, crypto.randomUUID()))
    },
    unterwegs: (surface) => visitSurfaceUnterwegs(stand, surface),
    bestaetigungLaeuft: (id) => visitBestaetigungUnterwegs(stand, id),
    lesen(id) {
      const naechster = visitPruefungOeffnen(standRef.current, id, Date.now())
      if (naechster === standRef.current) return
      commit(naechster)
      refreshEinmal(id)
    },
    schliessen(id) {
      commit(visitVorgangSchliessen(standRef.current, id))
    },
    ansehen() {
      commit(visitAenderungenAnsehen(standRef.current))
    },
    uebernehmen(besuch) {
      commit(visitListeUebernehmen(standRef.current, besuch))
    },
    bewaaffnen(besuch) {
      const naechster = visitEntwurfBewaffnen(standRef.current, besuch)
      commit(naechster)
      return naechster
    },
    verwerfen(surface) {
      const naechster = visitEntwurfVerwerfen(standRef.current, surface, leerRef.current)
      if (naechster === standRef.current) return false
      commit(naechster)
      return true
    },
  }
}
