'use client'

import { useEffect, useRef, useState } from 'react'

import { SICHERHEIT_ZIEL_44 } from '@/lib/auth/account-security-premium-ux-1'
import {
  EXPORT_ERFOLG_TEXT,
  EXPORT_FRIST_MS,
  exportDateiName,
  exportDokumentGueltig,
  exportFehlertext,
  exportGeneratedAt,
} from '@/lib/account/account-home-export-1/export-antwort'

type Phase = 'bereit' | 'laeuft' | 'fehler' | 'abgebrochen' | 'uebergeben'

const KNOPF =
  'inline-flex items-center rounded-2xl bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:cursor-not-allowed disabled:opacity-60'

export default function KontoDatenexportAktion() {
  const [phase, setPhase] = useState<Phase>('bereit')
  const [meldung, setMeldung] = useState<string | null>(null)
  const lauf = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const adresse = useRef<string | null>(null)
  const ursache = useRef<'nutzer' | 'frist' | null>(null)
  const meldungRef = useRef<HTMLParagraphElement | null>(null)

  function widerrufen() {
    if (!adresse.current) return
    URL.revokeObjectURL(adresse.current)
    adresse.current = null
  }

  useEffect(() => {
    return () => {
      generation.current += 1
      lauf.current?.abort()
      lauf.current = null
      if (adresse.current) {
        URL.revokeObjectURL(adresse.current)
        adresse.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (phase === 'fehler' || phase === 'abgebrochen' || phase === 'uebergeben') {
      meldungRef.current?.focus()
    }
  }, [phase, meldung])

  function abbrechen() {
    const controller = lauf.current
    if (!controller) return
    lauf.current = null
    ursache.current = 'nutzer'
    generation.current += 1
    controller.abort()
    widerrufen()
    setMeldung(exportFehlertext('abbruch'))
    setPhase('abgebrochen')
  }

  async function starten() {
    if (lauf.current) return
    widerrufen()
    const controller = new AbortController()
    const meine = generation.current + 1
    generation.current = meine
    lauf.current = controller
    ursache.current = null
    setPhase('laeuft')
    setMeldung(null)
    const frist = window.setTimeout(() => {
      if (generation.current !== meine) return
      if (lauf.current === controller) lauf.current = null
      ursache.current = 'frist'
      generation.current += 1
      controller.abort()
      widerrufen()
      setMeldung(exportFehlertext('frist'))
      setPhase('abgebrochen')
    }, EXPORT_FRIST_MS)

    try {
      const antwort = await fetch('/api/account/export', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      if (generation.current !== meine) return
      if (!antwort.ok) {
        setMeldung(exportFehlertext(antwort.status))
        setPhase('fehler')
        return
      }
      const text = await antwort.text()
      if (generation.current !== meine) return
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        setMeldung(exportFehlertext('unlesbar'))
        setPhase('fehler')
        return
      }
      if (!exportDokumentGueltig(json) || generation.current !== meine) {
        if (generation.current !== meine) return
        setMeldung(exportFehlertext('unlesbar'))
        setPhase('fehler')
        return
      }
      const generatedAt = exportGeneratedAt(json)
      if (!generatedAt || generation.current !== meine) return
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      if (generation.current !== meine) {
        URL.revokeObjectURL(url)
        return
      }
      adresse.current = url
      const link = document.createElement('a')
      link.href = url
      link.download = exportDateiName(generatedAt)
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => {
        if (adresse.current === url) widerrufen()
      }, 0)
      setMeldung(EXPORT_ERFOLG_TEXT)
      setPhase('uebergeben')
    } catch {
      if (generation.current !== meine) return
      if (controller.signal.aborted) {
        setMeldung(exportFehlertext(ursache.current === 'frist' ? 'frist' : 'abbruch'))
        setPhase('abgebrochen')
        return
      }
      setMeldung(exportFehlertext('unlesbar'))
      setPhase('fehler')
    } finally {
      window.clearTimeout(frist)
      if (lauf.current === controller) lauf.current = null
    }
  }

  const fehler = phase === 'fehler' || phase === 'abgebrochen'

  return (
    <div data-export-phase={phase} className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          className={`${SICHERHEIT_ZIEL_44} ${KNOPF}`}
          onClick={() => void starten()}
          disabled={phase === 'laeuft'}
          aria-busy={phase === 'laeuft'}
        >
          Konto- und Reisedaten als JSON herunterladen
        </button>
        {phase === 'laeuft' ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-2xl border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            onClick={abbrechen}
          >
            Export abbrechen
          </button>
        ) : null}
      </div>
      {meldung ? (
        <p
          ref={meldungRef}
          tabIndex={-1}
          role={fehler ? 'alert' : 'status'}
          className={`mt-3 max-w-xl break-words text-sm leading-6 outline-none ${
            fehler ? 'text-red-800' : 'text-ink-800'
          }`}
        >
          {meldung}
        </p>
      ) : null}
    </div>
  )
}
