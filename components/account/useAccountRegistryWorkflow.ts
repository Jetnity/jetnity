'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { Problem } from '@/lib/api/datenbank-lesen'
import {
  registryCitizenshipAnlegen,
  registryCitizenshipLoeschen,
  registryDocumentAendern,
  registryDocumentAnlegen,
  registryDocumentLoeschen,
  registryTravellerAendern,
  registryTravellerAnlegen,
  registryTravellerLoeschen,
} from '@/lib/traveller/account-registry-aktionen'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import {
  registryAnwenden,
  registryAusgangLesen,
  registryBeginnen,
  registryEditorOeffnen,
  registryEditorSchliessen,
  registryFeldSetzen,
  registryFokusGelesen,
  registryFristPruefen,
  registryHinweisSetzen,
  registryKanonisch,
  registryLesenAnfordern,
  registryLesenBeenden,
  registryPropsBeobachten,
  registrySlot,
  registrySurfaceSchliessen,
  registryUebernehmen,
  registryWorkflowAnfang,
  type FokusLage,
  type IdQuelle,
  type RegistryAktion,
  type RegistryBeleg,
  type RegistrySlot,
  type RegistryStand,
  type RegistryVersuch,
} from '@/lib/traveller/account-registry-workflow'

export type RegistryWorkflow = {
  stand: RegistryStand
  slot: (editor: string) => RegistrySlot | null
  oeffnen: (editor: string, surface: string, felder: unknown) => void
  setzen: (editor: string, felder: unknown) => void
  schliessen: (editor: string) => void
  surfaceSchliessen: (surface: string) => void
  hinweis: (editor: string, text: string | null) => void
  senden: (editor: string) => void
  erneut: (beleg: RegistryBeleg) => void
  uebernehmen: (editor: string) => void
  lesen: () => void
  unterwegs: (surface: string) => boolean
}

function felderVon(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {}
  return payload as Record<string, string>
}

function serverArgument(versuch: RegistryVersuch): unknown {
  const felder = felderVon(versuch.payload)
  const travellerId = versuch.ziel.travellerId ?? ''
  if (versuch.aktion === 'traveller-anlegen') {
    return { label: felder.label ?? '', residenceCountryCode: felder.residenceCountryCode ?? '' }
  }
  if (versuch.aktion === 'traveller-aendern') {
    return { id: travellerId, label: felder.label ?? '', residenceCountryCode: felder.residenceCountryCode ?? '' }
  }
  if (versuch.aktion === 'traveller-loeschen') return { id: travellerId }
  if (versuch.aktion === 'citizenship-anlegen') return { travellerId, countryCode: felder.countryCode ?? '' }
  if (versuch.aktion === 'citizenship-loeschen') {
    return { travellerId, citizenshipId: versuch.ziel.citizenshipId ?? '' }
  }
  if (versuch.aktion === 'document-loeschen') {
    return { travellerId, documentId: versuch.ziel.documentId ?? '' }
  }
  const dokument = {
    travellerId,
    documentType: felder.documentType ?? '',
    issuingCountryCode: felder.issuingCountryCode ?? '',
    citizenshipId: felder.citizenshipId ?? '',
    expiresOn: felder.expiresOn ?? '',
  }
  if (versuch.aktion === 'document-aendern') return { ...dokument, documentId: versuch.ziel.documentId ?? '' }
  return dokument
}

function routerAktualisieren(refresh: () => void, beiFehler: () => void) {
  try {
    const wert: unknown = refresh()
    if (wert && typeof wert === 'object' && typeof (wert as { then?: unknown }).then === 'function') {
      void (wert as Promise<unknown>).then(() => undefined, beiFehler)
    }
  } catch {
    beiFehler()
  }
}

async function aktionAufrufen(aktion: RegistryAktion, argument: unknown): Promise<unknown> {
  if (aktion === 'traveller-anlegen') return registryTravellerAnlegen(argument)
  if (aktion === 'traveller-aendern') return registryTravellerAendern(argument)
  if (aktion === 'traveller-loeschen') return registryTravellerLoeschen(argument)
  if (aktion === 'citizenship-anlegen') return registryCitizenshipAnlegen(argument)
  if (aktion === 'citizenship-loeschen') return registryCitizenshipLoeschen(argument)
  if (aktion === 'document-anlegen') return registryDocumentAnlegen(argument)
  if (aktion === 'document-aendern') return registryDocumentAendern(argument)
  return registryDocumentLoeschen(argument)
}

export function useAccountRegistryWorkflow(props: {
  problem: Problem | null
  travellers: AccountRegistryTraveller[] | null
}): RegistryWorkflow {
  const router = useRouter()
  const [stand, setStand] = useState(registryWorkflowAnfang)
  const propsRef = useRef(props)
  const standRef = useRef(stand)
  const innenRef = useRef<{ innen: string | null; traeger: string | null }>({ innen: null, traeger: null })
  const ids = useRef<IdQuelle>({ naechste: () => crypto.randomUUID() })

  function commit(naechster: RegistryStand) {
    standRef.current = naechster
    setStand(naechster)
  }

  function lage(): FokusLage {
    if (typeof document === 'undefined') return { innen: null, traeger: null, aufBody: false }
    const aktiv = document.activeElement
    return {
      innen: innenRef.current.innen,
      traeger: innenRef.current.traeger,
      aufBody: aktiv == null || aktiv === document.body || aktiv === document.documentElement,
    }
  }

  function aktuell(): RegistryStand {
    return registryPropsBeobachten(standRef.current, propsRef.current, lage())
  }

  useEffect(() => {
    propsRef.current = props
  }, [props])

  useEffect(() => {
    function merken(event: FocusEvent) {
      const ziel = (event.target as HTMLElement | null)?.closest('[data-registry-innen]')
      innenRef.current = {
        innen: ziel?.getAttribute('data-registry-innen') ?? null,
        traeger: ziel?.getAttribute('data-registry-traeger') ?? null,
      }
    }
    document.addEventListener('focusin', merken)
    return () => document.removeEventListener('focusin', merken)
  }, [])

  useEffect(() => {
    const naechster = registryPropsBeobachten(standRef.current, propsRef.current, lage())
    if (naechster !== standRef.current) commit(naechster)
  }, [props.problem, props.travellers])

  useEffect(() => {
    if (!stand.lesen.offen || stand.lesen.seit == null) return
    const rest = Math.max(0, 4000 - (Date.now() - stand.lesen.seit))
    const timer = window.setTimeout(() => commit(registryFristPruefen(standRef.current, Date.now())), rest)
    return () => window.clearTimeout(timer)
  }, [stand.lesen.offen, stand.lesen.seit])

  useEffect(() => {
    const fokus = stand.fokus
    if (!fokus || typeof document === 'undefined') return
    const aktiv = document.activeElement as HTMLElement | null
    const body = aktiv == null || aktiv === document.body || aktiv === document.documentElement
    const imEditor = fokus.editor
      ? Boolean(aktiv?.closest?.(`[data-registry-editor="${CSS.escape(fokus.editor)}"]`))
      : false
    if (fokus.bedingung === 'body' ? body : body || imEditor) {
      document.querySelector<HTMLElement>(`[data-fokus="${CSS.escape(fokus.ziel)}"]`)?.focus()
    }
    commit(registryFokusGelesen(standRef.current))
  }, [stand.fokus])

  async function abschliessen(versuch: RegistryVersuch) {
    let wert: unknown
    try {
      wert = await aktionAufrufen(versuch.aktion, serverArgument(versuch))
    } catch {
      wert = null
    }
    const ausgang = registryAusgangLesen(wert)
    commit(registryAnwenden(standRef.current, versuch.id, ausgang))
    if (ausgang.art !== 'gespeichert') return
    routerAktualisieren(
      () => router.refresh(),
      () => commit(registryLesenBeenden(standRef.current)),
    )
  }

  function starten(editor: string, anerkennung?: { belegId: string; schluessel: string }) {
    const basis = aktuell()
    const slot = registrySlot(basis, editor)
    if (!slot) {
      if (basis !== standRef.current) commit(basis)
      return
    }
    const ergebnis = registryBeginnen(
      basis,
      { editor, payload: slot.felder, anerkennung },
      ids.current,
    )
    commit(ergebnis.stand)
    if (!ergebnis.versuch) return
    void abschliessen(ergebnis.versuch)
  }

  return {
    stand,
    slot: (editor) => registrySlot(standRef.current, editor),
    oeffnen: (editor, surface, felder) => {
      let basis = aktuell()
      for (const slot of basis.slots) {
        if (slot.surface === surface && slot.offen && slot.editor !== editor) {
          basis = registryEditorSchliessen(basis, slot.editor)
        }
      }
      const kanonisch = registryKanonisch(editor, basis.props)
      commit(registryEditorOeffnen(basis, editor, surface, kanonisch?.felder ?? felder, kanonisch?.kontext ?? 'offen'))
    },
    setzen: (editor, felder) => commit(registryFeldSetzen(standRef.current, editor, felder)),
    schliessen: (editor) => commit(registryEditorSchliessen(standRef.current, editor)),
    surfaceSchliessen: (surface) => commit(registrySurfaceSchliessen(standRef.current, surface)),
    hinweis: (editor, text) => commit(registryHinweisSetzen(standRef.current, editor, text)),
    senden: (editor) => starten(editor),
    erneut: (beleg) => starten(beleg.editor, { belegId: beleg.id, schluessel: beleg.schluessel }),
    uebernehmen: (editor) => commit(registryUebernehmen(standRef.current, editor)),
    lesen: () => {
      commit(registryLesenAnfordern(standRef.current, Date.now()))
      routerAktualisieren(
        () => router.refresh(),
        () => commit(registryLesenBeenden(standRef.current)),
      )
    },
    unterwegs: (surface) => standRef.current.unterwegs.includes(surface),
  }
}
