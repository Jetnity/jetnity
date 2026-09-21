'use client'

// components/trips/PlanenCreateGate.tsx
//
// TW-6: /planen bleibt der eine Create-Ort. Hat ein Gast bereits seine eine
// Reise, ist ein zweites Formular eine Lüge – nicht ein alternativer Weg.
// Ein belegter, aber unlesbarer aktiver Schlüssel ist ebenfalls kein freier
// Slot. Vor der ersten Beobachtung darf Create nicht so tun, als läge nichts.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'

import {
  GAST_CREATE_ERHALTUNG_TEXTE,
  gastCreateBelegungLesen,
  planenCreateGateSicht,
  type GastCreateBelegung,
} from '@/lib/trips/create-entry'

type PlanenCreateGateProps = {
  angemeldet: boolean
  children: React.ReactNode
}

const gateRahmenClass =
  'min-w-0 max-w-full rounded-[30px] border border-line-200 bg-white px-6 py-14 text-center shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:px-10'
const gateHauptClass =
  'mt-4 min-w-0 max-w-full break-words [overflow-wrap:anywhere] text-3xl font-semibold tracking-[-0.04em] text-brand-900 sm:text-4xl'
const gateNebenClass =
  'mx-auto mt-4 w-full min-w-0 max-w-xl break-words [overflow-wrap:anywhere] text-sm leading-6 text-ink-800'
const primaerKnopfClass =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-900'
const sekundaerKnopfClass =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-5 text-sm font-semibold text-brand-800'

function KontoWege() {
  return (
    <>
      <Link href="/register" className={sekundaerKnopfClass}>
        Konto erstellen
      </Link>
      <Link href="/login" className={sekundaerKnopfClass}>
        Anmelden
      </Link>
    </>
  )
}

export default function PlanenCreateGate({ angemeldet, children }: PlanenCreateGateProps) {
  const [beobachtet, setBeobachtet] = React.useState(angemeldet)
  const [belegung, setBelegung] = React.useState<GastCreateBelegung | null>(
    angemeldet ? { art: 'fehlend' } : null,
  )
  const [aktivTitel, setAktivTitel] = React.useState<string | null>(null)

  const beobachten = React.useCallback(() => {
    if (angemeldet) {
      setBelegung({ art: 'fehlend' })
      setAktivTitel(null)
      setBeobachtet(true)
      return
    }
    const naechste = gastCreateBelegungLesen()
    setBelegung(naechste)
    setAktivTitel(naechste.art === 'gueltig' ? naechste.titel?.trim() || null : null)
    setBeobachtet(true)
  }, [angemeldet])

  React.useEffect(() => {
    beobachten()
  }, [beobachten])

  const sicht = planenCreateGateSicht({
    angemeldet,
    beobachtet,
    belegung,
    aktivTitel,
  })

  if (sicht.art === 'kinder') return children

  if (sicht.art === 'besteht') {
    return (
      <section className={gateRahmenClass}>
        <p className="min-w-0 max-w-full text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Eine Reise. Eine Oberfläche.
        </p>
        <h1 className={gateHauptClass}>
          Du hast bereits eine Reise.
        </h1>
        <p className={gateNebenClass}>
          {sicht.neben}
          {sicht.titel ? ` Dein Entwurf „${sicht.titel}“ liegt auf diesem Gerät.` : ''}
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href={`/reisen/${sicht.bestehendeId}` as Route} className={primaerKnopfClass}>
            Reise fortsetzen
          </Link>
          <KontoWege />
        </div>
      </section>
    )
  }

  const haupt =
    sicht.art === 'warte'
      ? GAST_CREATE_ERHALTUNG_TEXTE.wartetHaupt
      : sicht.art === 'ungueltig'
        ? GAST_CREATE_ERHALTUNG_TEXTE.ungueltigHaupt
        : GAST_CREATE_ERHALTUNG_TEXTE.unlesbarHaupt
  const neben =
    sicht.art === 'warte' ? GAST_CREATE_ERHALTUNG_TEXTE.wartetNeben : sicht.neben

  return (
    <section className={gateRahmenClass} role={sicht.art === 'warte' ? 'status' : 'alert'}>
      <p className="min-w-0 max-w-full text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        Eine Reise. Eine Oberfläche.
      </p>
      <h1 className={gateHauptClass}>
        {haupt}
      </h1>
      <p className={gateNebenClass}>{neben}</p>
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={beobachten} className={primaerKnopfClass}>
          {GAST_CREATE_ERHALTUNG_TEXTE.erneut}
        </button>
        <KontoWege />
      </div>
    </section>
  )
}
