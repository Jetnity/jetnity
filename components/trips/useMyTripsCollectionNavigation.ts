'use client'

// components/trips/useMyTripsCollectionNavigation.ts
//
// Besitz der Sammlung über die beobachtete Adresse, die Server-Hülle und
// eine lokale UI-Frist. Es gibt keine Antwort-Generation. Die sichtbare
// Hülle liegt im State: ein neuer Entwurf rendert dieselbe Server-Referenz
// und erzeugt keine neue Beobachtung.

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import {
  REISEN_SAMMLUNG_NAV_LEASE_MS,
  kanonischeAdresse,
  type SammlungErgebnis,
} from '@/lib/trips/reisen-sammlung-abfrage'

export type NavigationsArt = 'commit' | 'retry' | 'continue' | 'clear' | 'restart' | 'selection' | 'url'

type Absicht = {
  intentId: number
  address: string
  kind: NavigationsArt
  urlAtIssue: string
  serverSnapshot: number
  leaseDeadline: number
}

type Uebernommen = {
  snapshot: number
  ergebnis: SammlungErgebnis
}

export function useMyTripsCollectionNavigation(ergebnis: SammlungErgebnis) {
  const router = useRouter()
  const parameter = useSearchParams()
  const live = kanonischeAdresse(parameter)
  const [huelle, setHuelle] = useState(ergebnis)
  const [snapshot, setSnapshot] = useState(0)
  const [vorherigeAdresse, setVorherigeAdresse] = useState<string | null>(null)
  const [angenommen, setAngenommen] = useState<Uebernommen | null>(() =>
    ergebnis.adresse === live ? { snapshot: 0, ergebnis } : null,
  )
  const [absicht, setAbsicht] = useState<Absicht | null>(null)
  const [idStand, setIdStand] = useState(0)
  const [urlFolge, setUrlFolge] = useState<{ address: string; serverSnapshot: number } | null>(null)
  const idRef = useRef(0)
  const montiert = useRef(true)

  const serverSnapshot = ergebnis === huelle ? snapshot : snapshot + 1
  const ersteBeobachtung = vorherigeAdresse === null
  const adresseNeu = vorherigeAdresse !== null && vorherigeAdresse !== live

  if (ergebnis !== huelle || vorherigeAdresse !== live) {
    if (ergebnis !== huelle) {
      setHuelle(ergebnis)
      setSnapshot(serverSnapshot)
    }
    if (vorherigeAdresse !== live) setVorherigeAdresse(live)

    let offen = absicht
    let naechsteAbsicht: Absicht | null | undefined
    if (adresseNeu && offen && live !== offen.address) {
      offen = null
      naechsteAbsicht = null
    }

    const passt = ergebnis.adresse === live
    const ueberholt = serverSnapshot > (angenommen?.snapshot ?? -1)
    if (passt && ueberholt) {
      setAngenommen({ snapshot: serverSnapshot, ergebnis })
      if (offen && live === offen.address && serverSnapshot > offen.serverSnapshot) {
        naechsteAbsicht = null
      }
    }

    if ((ersteBeobachtung || adresseNeu) && offen === null && !passt) {
      setUrlFolge({ address: live, serverSnapshot })
    }
    if (naechsteAbsicht !== undefined) setAbsicht(naechsteAbsicht)
  }

  useEffect(() => {
    if (!urlFolge) return
    const id = idRef.current + 1
    idRef.current = id
    setIdStand(id)
    setAbsicht({
      intentId: id,
      address: urlFolge.address,
      kind: 'url',
      urlAtIssue: urlFolge.address,
      serverSnapshot: urlFolge.serverSnapshot,
      leaseDeadline: Date.now() + REISEN_SAMMLUNG_NAV_LEASE_MS,
    })
    setUrlFolge(null)
  }, [urlFolge])

  useEffect(() => {
    montiert.current = true
    return () => {
      montiert.current = false
    }
  }, [])

  useEffect(() => {
    if (!absicht) return
    const id = absicht.intentId
    const warten = Math.max(0, absicht.leaseDeadline - Date.now())
    const timer = window.setTimeout(() => {
      if (!montiert.current) return
      setAbsicht((aktuell) => (aktuell?.intentId === id ? null : aktuell))
    }, warten)
    return () => window.clearTimeout(timer)
  }, [absicht])

  function neueId() {
    const id = Math.max(idRef.current, idStand) + 1
    idRef.current = id
    setIdStand(id)
    return id
  }

  function loeschenWenn(id: number) {
    setAbsicht((aktuell) => (aktuell?.intentId === id ? null : aktuell))
  }

  function abschicken(art: Exclude<NavigationsArt, 'retry' | 'url'>, href: string) {
    const id = neueId()
    const frist = Date.now() + REISEN_SAMMLUNG_NAV_LEASE_MS
    setAbsicht({
      intentId: id,
      address: href,
      kind: art,
      urlAtIssue: live,
      serverSnapshot,
      leaseDeadline: frist,
    })
    try {
      router.push(href)
    } catch {
      loeschenWenn(id)
    }
  }

  function erneut() {
    const ziel = angenommen?.ergebnis.adresse
    if (!ziel || live !== ziel) return
    if (absicht?.kind === 'retry' && absicht.address === ziel && Date.now() < absicht.leaseDeadline) return
    const id = neueId()
    const frist = Date.now() + REISEN_SAMMLUNG_NAV_LEASE_MS
    setAbsicht({
      intentId: id,
      address: ziel,
      kind: 'retry',
      urlAtIssue: live,
      serverSnapshot,
      leaseDeadline: frist,
    })
    try {
      router.refresh()
    } catch {
      loeschenWenn(id)
    }
  }

  const sichtbar = angenommen?.ergebnis ?? null
  return {
    live,
    angenommen: sichtbar,
    laden: absicht !== null,
    art: absicht?.kind ?? null,
    einig: sichtbar !== null && sichtbar.adresse === live,
    abschicken,
    erneut,
  }
}
