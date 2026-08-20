'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, MapPin } from 'lucide-react'

import OrtSuche from '@/components/places/OrtSuche'
import { auswahlFehlt, zielHref, type OrtAuswahl } from '@/lib/places/auswahl'

export default function StartzielForm() {
  const router = useRouter()
  const [auswahl, setAuswahl] = React.useState<OrtAuswahl | null>(null)
  const [text, setText] = React.useState('')
  const [meldung, setMeldung] = React.useState('')

  const absenden = (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    const fehlt = auswahlFehlt(text, auswahl, 'ziel')
    if (fehlt) {
      setMeldung(fehlt)
      return
    }
    const href = zielHref(auswahl)
    if (!href) {
      setMeldung(fehlt ?? 'Bitte wähle ein Reiseziel aus der Liste.')
      return
    }
    router.push(href)
  }

  return (
    <form
      onSubmit={absenden}
      className="mt-8 max-w-2xl rounded-[24px] border border-white/15 bg-white p-2 shadow-[0_22px_60px_rgba(0,0,0,0.22)]"
    >
      <label htmlFor="travel-idea" className="sr-only">
        Wohin möchtest du reisen?
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
          <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
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
            inputId="travel-idea"
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
      {meldung && (
        <p role="alert" className="px-4 pb-2 pt-1 text-sm text-red-700">
          {meldung}
        </p>
      )}
    </form>
  )
}
