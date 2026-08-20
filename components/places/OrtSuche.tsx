'use client'

// Gemeinsame Ortssuche für Startseite und /planen.
// Speichert niemals den freien Text als kanonischen Ort.

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { ariaBeschrieben } from '@/lib/formular/feldfehler'
import type { OrtAuswahl } from '@/lib/places/auswahl'
import type { OrtOption, OrtRolle } from '@/lib/places/domain'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 280

type OrtSucheProps = {
  rolle: OrtRolle
  variante: 'hero' | 'field'
  value: OrtAuswahl | null
  onChange: (wert: OrtAuswahl | null, text: string) => void
  initialText?: string
  placeholder?: string
  inputId?: string
  inputClassName?: string
  disabled?: boolean
  ungueltig?: boolean
  describedBy?: string
  inputRef?: React.Ref<HTMLInputElement>
}

function typText(typ: OrtOption['typ']): string {
  if (typ === 'country') return 'Land'
  if (typ === 'region') return 'Region'
  if (typ === 'island') return 'Insel'
  if (typ === 'airport') return 'Flughafen'
  return 'Stadt'
}

export default function OrtSuche({
  rolle,
  variante,
  value,
  onChange,
  initialText = '',
  placeholder,
  inputId,
  inputClassName,
  disabled = false,
  ungueltig = false,
  describedBy,
  inputRef,
}: OrtSucheProps) {
  const [text, setText] = React.useState(value?.name ?? initialText)
  const [treffer, setTreffer] = React.useState<OrtOption[]>([])
  const [offen, setOffen] = React.useState(false)
  const [laedt, setLaedt] = React.useState(false)
  const [fehler, setFehler] = React.useState('')
  const [aktiv, setAktiv] = React.useState(-1)
  const wurzel = React.useRef<HTMLDivElement>(null)
  const listeId = React.useId()

  React.useEffect(() => {
    if (value?.name) setText(value.name)
  }, [value?.id, value?.name])

  React.useEffect(() => {
    const suche = text.trim()
    if (value && suche === value.name) {
      setTreffer([])
      setLaedt(false)
      setFehler('')
      return
    }
    if (suche.length < 2) {
      setTreffer([])
      setLaedt(false)
      setFehler('')
      return
    }

    const steuer = new AbortController()
    setLaedt(true)
    setFehler('')
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/places?q=${encodeURIComponent(suche)}&rolle=${rolle}`,
          { signal: steuer.signal },
        )
        if (!res.ok) {
          setFehler(
            rolle === 'ziel' ? ORT_MELDUNG.zielUnbekannt : 'Die Ortssuche ist gerade nicht erreichbar.',
          )
          setTreffer([])
          return
        }
        const json = (await res.json()) as OrtOption[]
        if (!Array.isArray(json)) {
          setFehler('Die Ortssuche ist gerade nicht erreichbar.')
          setTreffer([])
          return
        }
        setTreffer(json)
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return
        setFehler('Die Ortssuche ist gerade nicht erreichbar.')
        setTreffer([])
      } finally {
        setLaedt(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      steuer.abort()
    }
  }, [text, rolle, value])

  React.useEffect(() => {
    const schliessen = (ereignis: MouseEvent) => {
      if (!wurzel.current?.contains(ereignis.target as Node)) setOffen(false)
    }
    document.addEventListener('mousedown', schliessen)
    return () => document.removeEventListener('mousedown', schliessen)
  }, [])

  const waehlen = (option: OrtOption) => {
    onChange({ id: option.id, name: option.label.replace(/^[A-Z]{3} — /, '') }, option.label)
    setText(option.label.replace(/^[A-Z]{3} — /, ''))
    setOffen(false)
    setTreffer([])
    setAktiv(-1)
  }

  const tippen = (wert: string) => {
    setText(wert)
    setOffen(true)
    setAktiv(-1)
    if (!value || wert.trim() !== value.name) onChange(null, wert)
  }

  const taste = (ereignis: React.KeyboardEvent<HTMLInputElement>) => {
    if (ereignis.key === 'Escape') {
      setOffen(false)
      return
    }
    if (!offen || treffer.length === 0) return
    if (ereignis.key === 'ArrowDown') {
      ereignis.preventDefault()
      setAktiv((bisher) => (bisher + 1) % treffer.length)
    }
    if (ereignis.key === 'ArrowUp') {
      ereignis.preventDefault()
      setAktiv((bisher) => (bisher <= 0 ? treffer.length - 1 : bisher - 1))
    }
    if (ereignis.key === 'Enter' && aktiv >= 0 && treffer[aktiv]) {
      ereignis.preventDefault()
      waehlen(treffer[aktiv]!)
    }
  }

  const leer =
    offen &&
    !laedt &&
    !fehler &&
    text.trim().length >= 2 &&
    !value &&
    treffer.length === 0

  const listeSichtbar = offen && (laedt || fehler || treffer.length > 0 || leer)

  return (
    <div ref={wurzel} className="relative min-w-0">
      <input
        id={inputId}
        ref={inputRef}
        value={text}
        onChange={(ereignis) => tippen(ereignis.target.value)}
        onFocus={() => setOffen(true)}
        onKeyDown={taste}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={Boolean(listeSichtbar)}
        aria-controls={listeId}
        aria-autocomplete="list"
        aria-activedescendant={aktiv >= 0 ? `${listeId}-${aktiv}` : undefined}
        aria-invalid={ungueltig || undefined}
        aria-describedby={ariaBeschrieben(describedBy)}
        disabled={disabled}
        className={inputClassName}
      />
      {laedt && (
        <Loader2
          className={cn(
            'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-700',
            variante === 'hero' ? 'right-3' : 'right-3.5',
          )}
          aria-hidden="true"
        />
      )}
      {listeSichtbar && (
        <ul
          id={listeId}
          role="listbox"
          className={cn(
            'absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-line-200 bg-white py-1 shadow-[0_18px_50px_rgba(15,46,42,0.12)]',
            variante === 'hero' && 'left-0 right-0',
          )}
        >
          {laedt && treffer.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink-700">Suche …</li>
          )}
          {fehler && (
            <li role="alert" className="px-4 py-3 text-sm text-red-700">
              {fehler}
            </li>
          )}
          {leer && (
            <li className="px-4 py-3 text-sm text-ink-700">
              {rolle === 'ziel' ? ORT_MELDUNG.zielUnbekannt : ORT_MELDUNG.abreiseUnbekannt}
            </li>
          )}
          {treffer.map((option, index) => (
            <li
              key={option.id}
              id={`${listeId}-${index}`}
              role="option"
              aria-selected={aktiv === index}
            >
              <button
                type="button"
                onMouseDown={(ereignis) => ereignis.preventDefault()}
                onClick={() => waehlen(option)}
                className={cn(
                  'flex min-h-11 w-full items-start justify-between gap-3 px-4 py-2.5 text-left text-sm transition',
                  aktiv === index ? 'bg-surface-50' : 'hover:bg-surface-25',
                )}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-brand-800">{option.label}</span>
                  {option.description && (
                    <span className="mt-0.5 block text-xs text-ink-700">{option.description}</span>
                  )}
                </span>
                <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-700">
                  {typText(option.typ)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
