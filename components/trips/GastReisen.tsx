'use client'

// components/trips/GastReisen.tsx
//
// „Meine Reisen" ohne Konto.
//
// Ein Gast hat genau eine aktive Reise. Diese Liste zeigt sie – und, falls das
// Gerät noch Entwürfe aus der Fassung vor Phase 1.5 trägt, deren Anzahl. Die
// Entwürfe sind nicht bearbeitbar, aber sie sind auch nicht verloren: Der
// nächste Login übernimmt sie vollständig ins Konto
// (`lib/trips/gastspeicher.ts`).
//
// Ein leerer Loader ist nicht automatisch „noch keine Reise“. Unlesbare,
// ungültige oder widersprüchliche Bytes bleiben ein prüfbarer Lesefehler.
// Nichts wird dabei gelöscht.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { MapPin, Plus } from 'lucide-react'

import { gastReisenPrimaerCta } from '@/lib/trips/gast-reisen-cta'
import {
  gastListeBeobachten,
  gastListeDarfErstellen,
  type GastListeLesung,
} from '@/components/trips/gast-reise-lesezustand'
import {
  GastReiseLesefehler,
  GastReiseLeseWarte,
  GastReiseWarteschlange,
} from '@/components/trips/GastReiseLesefehler'
import { tripAlsUebersicht } from '@/lib/trips/reise-orte'
import Reisekarte from '@/components/trips/Reisekarte'

const primaerKlasse =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto'

export default function GastReisen() {
  const [lese, setLese] = React.useState<GastListeLesung>({ art: 'nicht_beobachtet' })
  const [pruefung, setPruefung] = React.useState(0)

  React.useEffect(() => {
    let lebend = true
    const ergebnis = gastListeBeobachten()
    // The compatible loader may migrate a valid legacy draft. That write stays
    // in the effect, after paint, and must not run during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (lebend) setLese(ergebnis)
    return () => {
      lebend = false
    }
  }, [pruefung])

  const erneut = () => {
    setLese({ art: 'nicht_beobachtet' })
    setPruefung((wert) => wert + 1)
  }

  if (lese.art === 'nicht_beobachtet') {
    return <GastReiseLeseWarte />
  }

  if (
    lese.art === 'speicher_unlesbar' ||
    lese.art === 'ungueltig' ||
    lese.art === 'abweichend' ||
    lese.art === 'belegt_ohne_kennung'
  ) {
    return (
      <GastReiseLesefehler
        art={lese.art}
        onPruefen={erneut}
        warteschlange={lese.art === 'ungueltig' ? lese.warteschlange : []}
      />
    )
  }

  const aktiv = lese.art === 'gueltig' ? lese.reise : null
  const warteschlange = lese.art === 'fehlend' ? [] : lese.warteschlange
  const primaer = gastReisenPrimaerCta(aktiv)
  const erstellen = gastListeDarfErstellen(lese)

  if (lese.art === 'fehlend') {
    return (
      <section
        data-gast-leseart="fehlend"
        className="min-w-0 max-w-full rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-5 min-w-0 max-w-full break-words text-2xl font-semibold tracking-[-0.03em] text-brand-800 [overflow-wrap:anywhere]">
          Deine erste Reise beginnt hier.
        </h2>
        <p className="mx-auto mt-3 max-w-md break-words text-sm leading-6 text-ink-700 [overflow-wrap:anywhere]">
          Erstelle kostenlos einen privaten Entwurf. Er bleibt zunächst auf diesem Gerät gespeichert und
          wandert bei einer Anmeldung in dein Konto.
        </p>
        <Link href={primaer.href as Route} className={`${primaerKlasse} mt-6`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {primaer.label}
        </Link>
      </section>
    )
  }

  return (
    <div data-gast-leseart={lese.art} className="min-w-0 max-w-full space-y-6">
      {erstellen ? (
        <Link href={primaer.href as Route} className={primaerKlasse}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {primaer.label}
        </Link>
      ) : null}
      {aktiv ? (
        <div className="space-y-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <Link href={primaer.href as Route} className={primaerKlasse}>
              {primaer.label}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Reisekarte reise={tripAlsUebersicht(aktiv)} href={`/reisen/${aktiv.id}` as Route} quelle="guest" />
          </div>
        </div>
      ) : null}
      <GastReiseWarteschlange reisen={warteschlange} />
    </div>
  )
}
