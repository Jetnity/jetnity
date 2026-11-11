'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react'
import {
  flugRahmen,
  type FlugRahmenPhase,
} from '@/lib/providers/travelpayouts/rahmen'

export interface FlugSuchauftrag {
  url: string
  hin: string
  rueck: string | null
  zeitraum: string
  gaeste: string
  kabine: string
}

export default function Flugergebnisse({ suche }: { suche: FlugSuchauftrag }) {
  const host = useRef<HTMLDivElement>(null)
  const bereich = useRef<HTMLDialogElement>(null)
  const groesseButton = useRef<HTMLButtonElement>(null)
  const scrollPosition = useRef<{ x: number; y: number } | null>(null)
  const [phase, setPhase] = useState<FlugRahmenPhase>('laedt')
  const [versuch, setVersuch] = useState(0)
  const [gross, setGross] = useState(false)
  useEffect(() => {
    bereich.current?.show()
  }, [])
  useEffect(() => {
    if (host.current) return flugRahmen(host.current, suche.url, setPhase)
  }, [suche.url, versuch])
  useLayoutEffect(() => {
    if (!gross) {
      const position = scrollPosition.current
      if (position) {
        window.scrollTo({
          left: position.x,
          top: position.y,
          behavior: 'instant',
        })
        scrollPosition.current = null
      }
      return
    }
    const vorher = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = vorher
    }
  }, [gross])
  const vergroessern = (wert: boolean) => {
    const el = bereich.current
    if (!el) return
    if (wert) scrollPosition.current = { x: window.scrollX, y: window.scrollY }
    el.close()
    if (wert) el.showModal()
    else el.show()
    setGross(wert)
    groesseButton.current?.focus({ preventScroll: true })
  }
  return (
    <dialog
      className={'flug-results' + (gross ? ' flug-expanded' : '')}
      ref={bereich}
      role={gross ? 'dialog' : 'region'}
      aria-modal={gross || undefined}
      aria-label="Deine Flugangebote"
      onCancel={(e) => {
        e.preventDefault()
        vergroessern(false)
      }}
    >
      <header className="flug-results-head">
        <div>
          <p className="flug-eyebrow">Dein Flugvergleich</p>
          <h2>
            {suche.hin}
            {suche.rueck && (
              <>
                <span className="flug-route-divider"> / </span>
                {suche.rueck}
              </>
            )}
          </h2>
          <p>
            {suche.zeitraum} · {suche.gaeste} · {suche.kabine} · CHF
          </p>
        </div>
        <div className="flug-result-actions">
          <button
            type="button"
            aria-label="Flugangebote erneut laden"
            title="Erneut laden"
            onClick={() => setVersuch((v) => v + 1)}
          >
            <RotateCcw size={19} />
          </button>
          <button
            ref={groesseButton}
            type="button"
            aria-label={
              gross
                ? 'Vergrösserte Flugangebote schliessen'
                : 'Flugangebote vergrössern'
            }
            title={gross ? 'Verkleinern' : 'Vergrössern'}
            onClick={() => vergroessern(!gross)}
          >
            {gross ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          </button>
        </div>
      </header>
      {phase !== 'bereit' && (
        <div className="flug-status" role="status">
          {phase === 'laedt' && (
            <>
              <Loader2 className="animate-spin" size={20} /> Flugsuche wird
              geöffnet …
            </>
          )}
          {phase === 'langsam' &&
            'Das Laden dauert länger. Du kannst die Suche erneut laden.'}
          {phase === 'fehler' &&
            'Die Flugsuche konnte nicht geöffnet werden. Bitte versuche es erneut.'}
          {phase === 'datenschutz' &&
            'Die Flugsuche ist durch deine Datenschutzeinstellungen deaktiviert. Passe sie an und lade die Suche erneut.'}
        </div>
      )}
      <div ref={host} className="flug-frame-host" />
    </dialog>
  )
}
