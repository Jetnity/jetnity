'use client'

// Natürliche Flughafensuche. Persistiert nur bestätigte IATA-Codes.

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import Suchliste from '@/components/suche/Suchliste'
import type { FlughafenAuswahl } from '@/lib/airports/auswahl'
import { FLUGHAFEN_MELDUNG } from '@/lib/airports/auswahl'
import type { FlughafenOption } from '@/lib/airports/suche'
import { ariaBeschrieben } from '@/lib/formular/feldfehler'
import { iataLesen } from '@/lib/route/referenz'
import { sucheAnfrageDarfSchreiben, sucheAnfrageStarten } from '@/lib/suche/anfrage'
import { sucheLage, sucheListeSichtbar } from '@/lib/suche/lage'
import { sucheListeIndex, sucheListeSchliesst, sucheListeWaehlt } from '@/lib/suche/tastatur'

const DEBOUNCE_MS = 280

export default function FlughafenSuche({
  value,
  onChange,
  placeholder,
  inputId,
  inputClassName,
  disabled = false,
  ungueltig = false,
  describedBy,
  inputRef,
}: {
  value: FlughafenAuswahl | null
  onChange: (wert: FlughafenAuswahl | null, text: string) => void
  placeholder?: string
  inputId?: string
  inputClassName?: string
  disabled?: boolean
  ungueltig?: boolean
  describedBy?: string
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const [text, setText] = React.useState(value?.name ?? '')
  const [treffer, setTreffer] = React.useState<FlughafenOption[]>([])
  const [offen, setOffen] = React.useState(false)
  const [laedt, setLaedt] = React.useState(false)
  const [fehlerArt, setFehlerArt] = React.useState<'error' | 'unavailable' | null>(null)
  const [aktiv, setAktiv] = React.useState(-1)
  const wurzel = React.useRef<HTMLDivElement>(null)
  const anfrage = React.useRef({ aktuell: 0 })
  const listeId = React.useId()

  React.useEffect(() => {
    if (value?.name) setText(value.name)
  }, [value?.iata, value?.name])

  React.useEffect(() => {
    const suche = text.trim()
    if (value && suche === value.name) {
      setTreffer([])
      setLaedt(false)
      setFehlerArt(null)
      return
    }
    if (suche.length < 1) {
      setTreffer([])
      setLaedt(false)
      setFehlerArt(null)
      return
    }
    const istIata = /^[a-z]{3}$/i.test(suche)
    if (!istIata && suche.length < 2) {
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
        const res = await fetch(`/api/search/airports?q=${encodeURIComponent(suche)}`, {
          signal: steuer.signal,
        })
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
        const json = (await res.json()) as FlughafenOption[]
        if (!darf()) return
        if (!Array.isArray(json)) {
          setFehlerArt('error')
          setTreffer([])
          return
        }
        setTreffer(json.filter((option) => Boolean(iataLesen(option.value))))
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
  }, [text, value])

  React.useEffect(() => {
    const schliessen = (ereignis: MouseEvent) => {
      if (!wurzel.current?.contains(ereignis.target as Node)) setOffen(false)
    }
    document.addEventListener('mousedown', schliessen)
    return () => document.removeEventListener('mousedown', schliessen)
  }, [])

  const waehlen = (option: FlughafenOption) => {
    const iata = iataLesen(option.value)
    if (!iata) return
    const name = option.label
    onChange({ iata, name }, name)
    setText(name)
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
    minQueryLen: /^[a-z]{3}$/i.test(text.trim()) ? 1 : 2,
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
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-700"
          aria-hidden="true"
        />
      )}
      {listeSichtbar && (
        <Suchliste
          id={listeId}
          lage={lage}
          eintraege={treffer.map((option, index) => ({
            id: `${option.value}-${index}`,
            primaer: option.label,
            sekundaer: option.description && option.description !== 'Stadt' ? option.description : undefined,
            extra: option.description === 'Stadt' ? 'Stadt' : option.value,
          }))}
          aktiv={aktiv}
          onWaehlen={(index) => {
            const option = treffer[index]
            if (option) waehlen(option)
          }}
          leerText={FLUGHAFEN_MELDUNG.unbekannt}
          fehlerText={
            lage === 'unavailable'
              ? 'Die Flughafensuche ist gerade nicht erreichbar.'
              : 'Die Flughafensuche ist fehlgeschlagen.'
          }
        />
      )}
    </div>
  )
}
