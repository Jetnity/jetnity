'use client'

import { useId, useState } from 'react'

import { COUNTRY_COPY } from '@/lib/country/copy'
import {
  COUNTRY_UI_LOCALE,
  landAuswahlUebernehmen,
  landDarstellung,
} from '@/lib/country/darstellung'
import { landFeldOptionen } from '@/lib/country/land-feld'

const feldKlasse =
  'min-h-11 min-w-0 w-full max-w-full rounded-2xl border border-line-200 bg-white px-3 text-sm text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'

const sucheKlasse =
  'min-h-11 min-w-0 w-full max-w-full rounded-2xl border border-line-200 bg-white px-3 text-sm text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'

export default function LandFeld({
  label,
  hinweis,
  value,
  onChange,
  optional = true,
  locale = COUNTRY_UI_LOCALE,
  disabled = false,
  id,
}: {
  label: string
  hinweis?: string
  value: string
  onChange: (code: string) => void
  optional?: boolean
  locale?: string
  disabled?: boolean
  id?: string
}) {
  const generiert = useId()
  const basisId = id ?? generiert
  const sucheId = `${basisId}-suche`
  const selectId = `${basisId}-select`
  const labelId = `${basisId}-label`
  const [suche, setSuche] = useState('')
  const optionen = landFeldOptionen({
    suche,
    aktuellerCode: value,
    optional,
    locale,
  })
  const aktuell = landDarstellung(value, locale)

  return (
    <div className="grid min-w-0 w-full gap-1">
      <span id={labelId} className="text-sm font-medium text-brand-800">
        {label}
      </span>
      <label className="sr-only" htmlFor={sucheId}>
        {label}: {COUNTRY_COPY.suchen}
      </label>
      <input
        id={sucheId}
        type="text"
        role="searchbox"
        value={suche}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        inputMode="search"
        placeholder={COUNTRY_COPY.suchen}
        aria-controls={selectId}
        aria-describedby={`${basisId}-suche-hinweis`}
        onChange={(event) => setSuche(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.preventDefault()
        }}
        className={sucheKlasse}
      />
      <p id={`${basisId}-suche-hinweis`} className="sr-only">
        {COUNTRY_COPY.suchenHinweis}
      </p>
      <select
        id={selectId}
        aria-labelledby={labelId}
        disabled={disabled}
        value={value}
        onChange={(event) => {
          onChange(landAuswahlUebernehmen(event.target.value, value))
          setSuche('')
        }}
        className={feldKlasse}
      >
        <option value="">{optionen.leerLabel}</option>
        {optionen.bestehend ? (
          <option value={optionen.bestehend.code}>{optionen.bestehend.label}</option>
        ) : null}
        {optionen.katalog.map((eintrag) => (
          <option key={eintrag.code} value={eintrag.code}>
            {eintrag.label}
          </option>
        ))}
      </select>
      {aktuell.art === 'unbekannt' ? (
        <p className="text-xs font-normal leading-5 text-ink-700">{COUNTRY_COPY.bestehendHinweis}</p>
      ) : null}
      {hinweis ? <p className="text-xs font-normal leading-5 text-ink-700">{hinweis}</p> : null}
    </div>
  )
}
