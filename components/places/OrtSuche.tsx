'use client'

// Gemeinsame Ortssuche für Startseite und /planen.
// Speichert niemals den freien Text als kanonischen Ort.

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import Suchliste from '@/components/suche/Suchliste'
import { ariaBeschrieben } from '@/lib/formular/feldfehler'
import type { OrtAuswahl } from '@/lib/places/auswahl'
import type { OrtOption, OrtRolle } from '@/lib/places/domain'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import { sucheAnfrageDarfSchreiben, sucheAnfrageStarten } from '@/lib/suche/anfrage'
import { sucheLage, sucheListeSichtbar } from '@/lib/suche/lage'
import { sucheListeIndex, sucheListeSchliesst, sucheListeWaehlt } from '@/lib/suche/tastatur'
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
  const [fehlerArt, setFehlerArt] = React.useState<'error' | 'unavailable' | null>(null)
  const [aktiv, setAktiv] = React.useState(-1)
  const wurzel = React.useRef<HTMLDivElement>(null)
  const anfrage = React.useRef({ aktuell: 0 })
  const listeId = React.useId()

  React.useEffect(() => {
    if (value?.name) setText(value.name)
  }, [value?.id, value?.name])

  React.useEffect(() => {
    const suche = text.trim()
    if (value && suche === value.name) {
      setTreffer([])
      setLaedt(false)
      setFehlerArt(null)
      return
    }
    if (suche.length < 2) {
      setTreffer([])
      setLaedt(false)
      setFehlerArt(null)
      return
    }

    const id = sucheAnfrageStarten(anfrage.current)
    const steuer = new AbortController()
    setLaedt(true)
    setFehlerArt(null)
    const timer = window.setTimeout(async () => {
      const darf = () => sucheAnfrageDarfSchreiben(anfrage.current, id, steuer.signal)
      try {
        const res = await fetch(
          `/api/search/places?q=${encodeURIComponent(suche)}&rolle=${rolle}`,
          { signal: steuer.signal },
        )
        if (!darf()) return
        if (res.status === 503) {
          setFehlerArt('unavailable')
          setTreffer([])
          return
        }
        if (!res.ok) {
          setFehlerArt('error')
          setTreffer([])
          return
        }
        const json = (await res.json()) as OrtOption[]
        if (!darf()) return
        if (!Array.isArray(json)) {
          setFehlerArt('error')
          setTreffer([])
          return
        }
        setTreffer(json)
      } catch (err) {
        if (!darf()) return
        if ((err as { name?: string }).name === 'AbortError') return
        setFehlerArt('error')
        setTreffer([])
      } finally {
        if (darf()) setLaedt(false)
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
    onChange({ id: option.id, name: option.label }, option.label)
    setText(option.label)
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
    if (sucheListeSchliesst(ereignis.key)) {
      setOffen(false)
      return
    }
    if (!offen || treffer.length === 0) return
    if (ereignis.key === 'ArrowDown' || ereignis.key === 'ArrowUp') {
      ereignis.preventDefault()
      const pfeil = ereignis.key
      setAktiv((bisher) => sucheListeIndex(bisher, treffer.length, pfeil))
    }
    if (sucheListeWaehlt(ereignis.key, aktiv) && treffer[aktiv]) {
      ereignis.preventDefault()
      waehlen(treffer[aktiv]!)
    }
  }

  const lage = sucheLage({
    offen,
    laedt,
    treffer: treffer.length,
    queryLen: text.trim().length,
    minQueryLen: 2,
    hatAuswahl: Boolean(value),
    fehlerArt,
    ungueltig,
  })
  const listeSichtbar = sucheListeSichtbar(lage)

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
        <Suchliste
          id={listeId}
          lage={lage}
          eintraege={treffer.map((option) => ({
            id: option.id,
            primaer: option.iata ? `${option.label} · ${option.iata}` : option.label,
            sekundaer: option.description,
            extra: typText(option.typ),
          }))}
          aktiv={aktiv}
          onWaehlen={(index) => {
            const option = treffer[index]
            if (option) waehlen(option)
          }}
          leerText={rolle === 'ziel' ? ORT_MELDUNG.zielUnbekannt : ORT_MELDUNG.abreiseUnbekannt}
          fehlerText={
            lage === 'unavailable'
              ? 'Die Ortssuche ist gerade nicht erreichbar.'
              : 'Die Ortssuche ist fehlgeschlagen.'
          }
          className={variante === 'hero' ? 'left-0 right-0' : undefined}
        />
      )}
    </div>
  )
}
