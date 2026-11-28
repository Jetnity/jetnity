'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'

import { datumDeutsch, ILLUSTRATIONSHINWEIS, type Bildnachweis } from '@/lib/trips/organisieren/bildnachweise'

function hostname(adresse: string): string {
  try {
    return new URL(adresse).hostname
  } catch {
    return adresse
  }
}

function ExternerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (öffnet in neuem Tab)</span>
    </a>
  )
}

/**
 * Kleines ⓘ am Foto. Öffnet Urheber, Original, Lizenz und Bearbeitung des gezeigten Bildes.
 * Per Tipp, Klick und Tastatur erreichbar; Escape schliesst und gibt den Fokus zurück.
 */
export function BildnachweisKnopf({ nachweis }: { nachweis: Bildnachweis }) {
  const [offen, setOffen] = useState(false)
  const feldId = useId()
  const huelleRef = useRef<HTMLSpanElement>(null)
  const knopfRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!offen) return
    const aussen = (ereignis: PointerEvent) => {
      if (ereignis.target instanceof Node && !huelleRef.current?.contains(ereignis.target)) setOffen(false)
    }
    document.addEventListener('pointerdown', aussen)
    return () => document.removeEventListener('pointerdown', aussen)
  }, [offen])

  return (
    <span
      ref={huelleRef}
      data-bildnachweis
      className="bildnachweis"
      onKeyDown={(ereignis) => {
        if (ereignis.key !== 'Escape' || !offen) return
        ereignis.stopPropagation()
        setOffen(false)
        knopfRef.current?.focus()
      }}
      onBlur={(ereignis) => {
        const ziel = ereignis.relatedTarget
        if (offen && ziel instanceof Node && !ereignis.currentTarget.contains(ziel)) setOffen(false)
      }}
    >
      <button
        ref={knopfRef}
        type="button"
        className="bildnachweis-knopf"
        aria-label={nachweis.medium === 'ki-illustration' ? 'Bildnachweis zur Illustration' : 'Bildnachweis zum Foto'}
        aria-expanded={offen}
        aria-controls={feldId}
        onClick={() => setOffen((bisher) => !bisher)}
      >
        <Info aria-hidden="true" />
      </button>
      <div id={feldId} role="group" aria-label="Bildnachweis" hidden={!offen} className="bildnachweis-feld">
        {nachweis.medium === 'ki-illustration' ? (
          <dl>
            <div><dt>Illustration</dt><dd>{ILLUSTRATIONSHINWEIS}, kein Foto: {nachweis.bildtitel}</dd></div>
            <div><dt>Herkunft</dt><dd>{nachweis.urheber}</dd></div>
            <div><dt>Bedingungen</dt><dd><ExternerLink href={nachweis.herkunft.bedingungen.aktuell}>OpenAI-Bedingungen</ExternerLink></dd></div>
            <div><dt>Ersteintrag</dt><dd>{datumDeutsch(nachweis.herkunft.ersteintrag.datum)} im Repository</dd></div>
          </dl>
        ) : (
          <dl>
            <div><dt>Foto</dt><dd>«{nachweis.bildtitel}»</dd></div>
            <div><dt>Urheber</dt><dd>{nachweis.urheber ?? 'Nicht angegeben'}</dd></div>
            <div><dt>Quelle</dt><dd><ExternerLink href={nachweis.quelleUrl}>{hostname(nachweis.quelleUrl)}</ExternerLink></dd></div>
            <div>
              <dt>Lizenz</dt>
              <dd>{nachweis.lizenzUrl ? <ExternerLink href={nachweis.lizenzUrl}>{nachweis.lizenz}</ExternerLink> : nachweis.lizenz}</dd>
            </div>
            <div><dt>Bearbeitung</dt><dd>{nachweis.bearbeitung}</dd></div>
          </dl>
        )}
      </div>
    </span>
  )
}
