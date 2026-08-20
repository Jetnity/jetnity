'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, MapPin } from 'lucide-react'

import OrtSuche from '@/components/places/OrtSuche'
import { feldFehlerId } from '@/lib/formular/feldfehler'
import { feldInSichtNehmen } from '@/lib/formular/sicht'
import { auswahlFehlt, zielHref, type OrtAuswahl } from '@/lib/places/auswahl'
import { cn } from '@/lib/utils'

const FELD_ID = 'travel-idea'

export default function StartzielForm() {
  const router = useRouter()
  const [auswahl, setAuswahl] = React.useState<OrtAuswahl | null>(null)
  const [text, setText] = React.useState('')
  const [meldung, setMeldung] = React.useState('')
  const eingabe = React.useRef<HTMLInputElement>(null)

  const absenden = (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    const fehlt = auswahlFehlt(text, auswahl, 'ziel')
    if (fehlt) {
      setMeldung(fehlt)
      feldInSichtNehmen(eingabe.current)
      return
    }
    const href = zielHref(auswahl)
    if (!href) {
      setMeldung('Bitte wähle ein Reiseziel aus der Liste.')
      feldInSichtNehmen(eingabe.current)
      return
    }
    router.push(href)
  }

  return (
    <form
      noValidate
      onSubmit={absenden}
      className="mt-8 max-w-2xl rounded-[24px] border border-white/15 bg-white p-2 shadow-[0_22px_60px_rgba(0,0,0,0.22)]"
    >
      <label htmlFor={FELD_ID} className="sr-only">
        Wohin möchtest du reisen?
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div
          className={cn(
            'relative flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3 py-2',
            meldung && 'bg-surface-50 ring-2 ring-danger-600/20',
          )}
        >
          <MapPin className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <OrtSuche
              rolle="ziel"
              variante="hero"
              value={auswahl}
              initialText={text}
              onChange={(wert, roh) => {
                setAuswahl(wert)
                setText(roh)
                if (wert) setMeldung('')
              }}
              inputId={FELD_ID}
              inputRef={eingabe}
              ungueltig={Boolean(meldung)}
              describedBy={meldung ? feldFehlerId(FELD_ID) : undefined}
              placeholder="Wohin möchtest du reisen?"
              inputClassName="h-11 w-full min-w-0 flex-1 bg-transparent text-base text-brand-800 outline-none placeholder:text-ink-650"
            />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-citrus-400 px-5 text-sm font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:bg-citrus-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-citrus-400/40"
        >
          Reise planen
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {meldung ? (
        <p
          id={feldFehlerId(FELD_ID)}
          role="alert"
          className="flex items-start gap-1.5 px-4 pb-2 pt-1 text-sm text-danger-600"
        >
          {meldung}
        </p>
      ) : null}
    </form>
  )
}
