'use client'

// Formular zum Bestätigen und Ändern eines Besuchs.
//
// Es schickt nur zwei Dinge: eine Ortsreferenz oder einen Ländercode, dazu eine
// Zeitangabe. Niemals einen Ortsnamen, niemals Koordinaten – die holt der
// Server aus der Jetnity-Ortsreferenz. Ein frei getippter Text kann deshalb nie
// zu einem Ort werden, auch nicht versehentlich.
//
// Die Zeitangabe darf leer bleiben, und zwar jedes Feld einzeln. „Irgendwann
// 2004“ ist eine gültige Erinnerung; ein erfundener 1. Januar wäre es nicht.

import { useId, useState, type FormEvent } from 'react'

import LandFeld from '@/components/country/LandFeld'
import OrtSuche from '@/components/places/OrtSuche'
import { BESUCHE_COPY } from '@/lib/account/besuche-copy'
import { BESUCH_JAHR_MINIMUM } from '@/lib/account/besuche-eingabe'
import type { OrtAuswahl } from '@/lib/places/auswahl'

export type BesuchFormularWert = {
  ort: OrtAuswahl | null
  countryCode: string
  jahr: string
  monat: string
  tag: string
}

export const BESUCH_FORMULAR_LEER: BesuchFormularWert = {
  ort: null,
  countryCode: '',
  jahr: '',
  monat: '',
  tag: '',
}

const MONATE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const

const feldKlasse =
  'min-h-11 w-full rounded-2xl border border-line-200 bg-white px-3 text-sm text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'

function zahlOderNull(wert: string): number | null {
  const getrimmt = wert.trim()
  if (!getrimmt) return null
  const zahl = Number(getrimmt)
  return Number.isInteger(zahl) ? zahl : Number.NaN
}

/** Was die Server-Aktion bekommt: Referenzen und Zahlen, kein Anzeigetext. */
export function besuchEingabeAus(wert: BesuchFormularWert) {
  return {
    placeId: wert.ort?.id ?? null,
    countryCode: wert.ort ? null : wert.countryCode.trim() || null,
    jahr: zahlOderNull(wert.jahr),
    monat: zahlOderNull(wert.monat),
    tag: zahlOderNull(wert.tag),
  }
}

export default function AccountBesuchFormular({
  titel,
  aktionText,
  wert,
  onWert,
  onAbsenden,
  onAbbrechen,
  laeuft,
}: {
  titel: string
  aktionText: string
  wert: BesuchFormularWert
  onWert: (wert: BesuchFormularWert) => void
  onAbsenden: () => void
  onAbbrechen?: () => void
  laeuft: boolean
}) {
  const basisId = useId()
  const [jahrMaximum] = useState(() => new Date().getUTCFullYear())

  function absenden(ereignis: FormEvent<HTMLFormElement>) {
    ereignis.preventDefault()
    onAbsenden()
  }

  return (
    <form
      onSubmit={absenden}
      data-besuch-formular="ein"
      className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-6"
    >
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-brand-800">{titel}</h2>

      <div className="mt-4 grid min-w-0 gap-4">
        <div className="grid min-w-0 gap-1">
          <label htmlFor={`${basisId}-ort`} className="text-sm font-medium text-brand-800">
            {BESUCHE_COPY.ortLabel}
          </label>
          <OrtSuche
            rolle="ziel"
            variante="field"
            inputId={`${basisId}-ort`}
            value={wert.ort}
            placeholder={BESUCHE_COPY.ortPlatzhalter}
            inputClassName={feldKlasse}
            describedBy={`${basisId}-ort-hinweis`}
            disabled={laeuft}
            onChange={(auswahl) => onWert({ ...wert, ort: auswahl })}
          />
          <p id={`${basisId}-ort-hinweis`} className="text-xs leading-5 text-ink-700">
            {BESUCHE_COPY.ortHinweis}
          </p>
        </div>

        {/* Das Land ist keine Ergänzung zum Ort, sondern die Alternative dazu:
            zu einem gewählten Ort kommt der Ländercode aus der Ortsreferenz.
            Deshalb ist das Feld gesperrt, solange ein Ort gewählt ist. */}
        <LandFeld
          id={`${basisId}-land`}
          label={BESUCHE_COPY.landLabel}
          hinweis={BESUCHE_COPY.landHinweis}
          value={wert.countryCode}
          disabled={laeuft || wert.ort !== null}
          onChange={(countryCode) => onWert({ ...wert, countryCode })}
        />

        <fieldset className="grid min-w-0 gap-2 border-0 p-0">
          <legend className="text-sm font-medium text-brand-800">{BESUCHE_COPY.zeitTitel}</legend>
          <p className="text-xs leading-5 text-ink-700">{BESUCHE_COPY.zeitHinweis}</p>
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">
              {BESUCHE_COPY.jahrLabel}
              <input
                type="number"
                inputMode="numeric"
                min={BESUCH_JAHR_MINIMUM}
                max={jahrMaximum}
                step={1}
                value={wert.jahr}
                disabled={laeuft}
                autoComplete="off"
                onChange={(ereignis) => onWert({ ...wert, jahr: ereignis.target.value })}
                className={feldKlasse}
              />
            </label>
            <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">
              {BESUCHE_COPY.monatLabel}
              <select
                value={wert.monat}
                disabled={laeuft || !wert.jahr.trim()}
                onChange={(ereignis) => onWert({ ...wert, monat: ereignis.target.value })}
                className={feldKlasse}
              >
                <option value="">{BESUCHE_COPY.monatOhneAngabe}</option>
                {MONATE.map((name, stelle) => (
                  <option key={name} value={String(stelle + 1)}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">
              {BESUCHE_COPY.tagLabel}
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                step={1}
                value={wert.tag}
                disabled={laeuft || !wert.monat.trim()}
                autoComplete="off"
                onChange={(ereignis) => onWert({ ...wert, tag: ereignis.target.value })}
                className={feldKlasse}
              />
            </label>
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={laeuft}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900 disabled:opacity-60"
        >
          {aktionText}
        </button>
        {onAbbrechen ? (
          <button
            type="button"
            onClick={onAbbrechen}
            disabled={laeuft}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-200 bg-white px-5 text-sm font-semibold text-brand-800 transition hover:bg-surface-50 disabled:opacity-60"
          >
            {BESUCHE_COPY.abbrechen}
          </button>
        ) : null}
      </div>
    </form>
  )
}
