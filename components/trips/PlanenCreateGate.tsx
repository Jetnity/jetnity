'use client'

// components/trips/PlanenCreateGate.tsx
//
// TW-6: /planen bleibt der eine Create-Ort. Hat ein Gast bereits seine eine
// Reise, ist ein zweites Formular eine Lüge – nicht ein alternativer Weg.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'

import { gastCreateGate } from '@/lib/trips/create-entry'
import { GastreiseBestehtFehler, gastspeicherLaden } from '@/lib/trips/gastspeicher'

type PlanenCreateGateProps = {
  angemeldet: boolean
  children: React.ReactNode
}

export default function PlanenCreateGate({ angemeldet, children }: PlanenCreateGateProps) {
  const [aktiv, setAktiv] = React.useState<{ id: string; title: string } | null>(null)

  React.useEffect(() => {
    if (angemeldet) {
      setAktiv(null)
      return
    }
    const reise = gastspeicherLaden().aktiv
    setAktiv(reise ? { id: reise.id, title: reise.title } : null)
  }, [angemeldet])

  const gate = gastCreateGate({
    angemeldet,
    aktiveReiseId: aktiv?.id ?? null,
  })

  if (!gate.erlaubt) {
    const meldung = new GastreiseBestehtFehler(gate.bestehendeId).message
    return (
      <section className="rounded-[30px] border border-line-200 bg-white px-6 py-14 text-center shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Eine Reise. Eine Oberfläche.
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-brand-900 sm:text-4xl">
          Du hast bereits eine Reise.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink-800">
          {meldung}
          {aktiv?.title ? ` Dein Entwurf „${aktiv.title}“ liegt auf diesem Gerät.` : ''}
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href={`/reisen/${gate.bestehendeId}` as Route}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            Reise fortsetzen
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-5 text-sm font-semibold text-brand-800"
          >
            Konto erstellen
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-5 text-sm font-semibold text-brand-800"
          >
            Anmelden
          </Link>
        </div>
      </section>
    )
  }

  return children
}
