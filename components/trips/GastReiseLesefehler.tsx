'use client'

// components/trips/GastReiseLesefehler.tsx
//
// Shared presentation for a guest read that is not yet known, failed, or
// belongs to a different stored draft. No create link and no raw bytes.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { Archive, MapPin } from 'lucide-react'

import {
  GAST_CREATE_ERHALTUNG_TEXTE,
  gastCreateGateMeldung,
} from '@/lib/trips/create-entry'
import type { Trip } from '@/types/trips'

const rahmen =
  'min-w-0 max-w-full rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-10 text-center sm:px-10'
const hauptKlasse =
  'mt-5 min-w-0 max-w-full break-words text-2xl font-semibold tracking-[-0.03em] text-brand-800 [overflow-wrap:anywhere] sm:text-3xl'
const nebenKlasse =
  'mx-auto mt-3 w-full min-w-0 max-w-md break-words text-sm leading-6 text-ink-700 [overflow-wrap:anywhere]'
const aktionenKlasse =
  'mt-6 flex w-full min-w-0 flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center'
const primaerKlasse =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-800 px-5 text-center text-sm font-semibold leading-tight text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto'
const sekundaerKlasse =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line-300 bg-white px-5 text-center text-sm font-semibold leading-tight text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto'

type FehlerArt = 'speicher_unlesbar' | 'ungueltig' | 'abweichend' | 'belegt_ohne_kennung'

/**
 * Remember a keyboard recheck, then restore focus after the fresh observation.
 *
 * Loading unmounts the button. Focus returns to the settled recheck control,
 * or to the recovered primary control, only while it would otherwise sit on
 * the document body. A move the user made in between is left alone.
 */
export function useGastLeseFokus(beobachtet: boolean) {
  const merken = React.useRef(false)

  const vormerken = React.useCallback(() => {
    const aktiv = document.activeElement
    merken.current = aktiv instanceof HTMLElement && aktiv.getAttribute('data-gast-fokus') === 'erneut'
  }, [])

  React.useEffect(() => {
    if (!beobachtet || !merken.current) return
    merken.current = false
    const aktiv = document.activeElement
    if (aktiv instanceof HTMLElement && aktiv !== document.body && aktiv !== document.documentElement) return
    const ziel = document.querySelector<HTMLElement>('[data-gast-fokus="erneut"], [data-gast-fokus="weiter"]')
    if (!ziel) return
    const setzen = ziel.focus as (optionen?: { focusVisible?: boolean }) => void
    setzen.call(ziel, { focusVisible: true })
  }, [beobachtet])

  return vormerken
}

function titel(ebene: 'h1' | 'h2', text: string) {
  const Klasse = ebene === 'h1' ? 'h1' : 'h2'
  return <Klasse className={hauptKlasse}>{text}</Klasse>
}

export function GastReiseLeseWarte({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-gast-leseart="nicht_beobachtet"
      className={className ?? 'min-w-0 max-w-full'}
    >
      <p className="max-w-full break-words text-sm font-semibold text-brand-800 [overflow-wrap:anywhere]">
        {GAST_CREATE_ERHALTUNG_TEXTE.wartetHaupt}
      </p>
      <p className="mt-1 max-w-full break-words text-sm leading-6 text-ink-700 [overflow-wrap:anywhere]">
        {GAST_CREATE_ERHALTUNG_TEXTE.wartetNeben}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden="true">
        <div className="h-40 animate-pulse rounded-[26px] bg-white/70 motion-reduce:animate-none" />
        <div className="h-40 animate-pulse rounded-[26px] bg-white/70 motion-reduce:animate-none" />
      </div>
    </div>
  )
}

export function GastReiseWarteschlange({ reisen }: { reisen: Trip[] }) {
  if (reisen.length === 0) return null
  return (
    <section className="min-w-0 max-w-full rounded-[26px] border border-line-200 bg-white p-5">
      <p className="flex min-w-0 items-start gap-3 break-words text-sm leading-6 text-ink-800 [overflow-wrap:anywhere]">
        <Archive className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        <span>
          Auf diesem Gerät liegen{' '}
          <strong className="font-semibold text-brand-800">
            {reisen.length} weitere {reisen.length === 1 ? 'Entwurf' : 'Entwürfe'}
          </strong>{' '}
          aus einer früheren Fassung. Ohne Konto lässt sich eine Reise bearbeiten – bei deiner
          Anmeldung werden alle Entwürfe vollständig in dein Konto übernommen.
        </span>
      </p>
      <ul className="mt-4 space-y-2 border-t border-line-100 pt-4">
        {reisen.map((reise) => (
          <li key={reise.id} className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-brand-800">{reise.title}</span>
            <span className="shrink-0 text-xs text-ink-700">
              {reise.days.length} {reise.days.length === 1 ? 'Tag' : 'Tage'}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/register" className={primaerKlasse}>
          Konto erstellen
        </Link>
        <Link href="/login" className={sekundaerKlasse}>
          Anmelden
        </Link>
      </div>
    </section>
  )
}

export function GastReiseLesefehler({
  art,
  onPruefen,
  warteschlange = [],
  listenLink = false,
  ebene = 'h2',
}: {
  art: FehlerArt
  onPruefen: () => void
  warteschlange?: Trip[]
  listenLink?: boolean
  ebene?: 'h1' | 'h2'
}) {
  const haupt =
    art === 'ungueltig'
      ? GAST_CREATE_ERHALTUNG_TEXTE.ungueltigHaupt
      : art === 'speicher_unlesbar'
        ? GAST_CREATE_ERHALTUNG_TEXTE.unlesbarHaupt
        : art === 'belegt_ohne_kennung'
          ? 'Dieser Entwurf kann nicht fortgesetzt werden.'
          : 'Der Speicherstand ist nicht eindeutig.'
  const neben =
    art === 'ungueltig'
      ? gastCreateGateMeldung({ erlaubt: false, grund: 'ungueltig' })
      : art === 'speicher_unlesbar'
        ? gastCreateGateMeldung({ erlaubt: false, grund: 'speicher_unlesbar' })
        : art === 'belegt_ohne_kennung'
          ? gastCreateGateMeldung({ erlaubt: false, grund: 'belegt_ohne_kennung' })
          : 'Die Prüfung und das Laden haben nicht denselben Stand ergeben. Bitte prüfe den Speicher erneut.'

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <section role="alert" data-gast-leseart={art} className={rahmen}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        {titel(ebene, haupt)}
        <p className={nebenKlasse}>{neben}</p>
        <div className={aktionenKlasse}>
          <button type="button" data-gast-fokus="erneut" onClick={onPruefen} className={primaerKlasse}>
            {GAST_CREATE_ERHALTUNG_TEXTE.erneut}
          </button>
          {listenLink ? (
            <Link href="/reisen" className={sekundaerKlasse}>
              Meine Reisen
            </Link>
          ) : null}
        </div>
      </section>
      <GastReiseWarteschlange reisen={warteschlange} />
    </div>
  )
}

export function GastReiseAndere({
  id,
  titelText,
  ebene = 'h1',
}: {
  id: string
  titelText: string
  ebene?: 'h1' | 'h2'
}) {
  return (
    <section role="status" data-gast-leseart="andere_reise" className={rahmen}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
        <MapPin className="h-5 w-5" aria-hidden="true" />
      </span>
      {titel(ebene, 'Auf diesem Gerät liegt eine andere Reise.')}
      <p className={nebenKlasse}>
        Die angeforderte Reise wird nicht durch diesen Entwurf ersetzt.
        {titelText ? ` Auf diesem Gerät liegt „${titelText}“.` : ''}
      </p>
      <div className={aktionenKlasse}>
        <Link href={`/reisen/${id}` as Route} data-gast-fokus="weiter" className={primaerKlasse}>
          Reise fortsetzen
        </Link>
        <Link href="/reisen" className={sekundaerKlasse}>
          Meine Reisen
        </Link>
      </div>
    </section>
  )
}
