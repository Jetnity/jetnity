import * as React from 'react'
import { createRoot } from 'react-dom/client'

import FlughafenSuche from '@/components/airports/FlughafenSuche'
import type { FlughafenAuswahl } from '@/lib/airports/auswahl'
import OrtSuche from '@/components/places/OrtSuche'
import type { OrtAuswahl } from '@/lib/places/auswahl'
import type { OrtRolle } from '@/lib/places/domain'

type Feld = 'ort' | 'flughafen'
type Ereignis = {
  feld: Feld
  wert: OrtAuswahl | FlughafenAuswahl | null
  text: string
}

declare global {
  interface Window {
    __steuerung: {
      neu: (feld: Feld) => void
      rolle: (rolle: OrtRolle) => void
      ortSetzen: (wert: OrtAuswahl | null, text?: string) => void
      samenFest: (text: string) => void
      ohneSamen: () => void
      samen: () => string | null
      flugSetzen: (wert: FlughafenAuswahl | null) => void
      ereignisse: () => Ereignis[]
    }
  }
}

function Harness() {
  const [feld, setFeld] = React.useState<Feld>('ort')
  const [generation, setGeneration] = React.useState(0)
  const [rolle, setRolle] = React.useState<OrtRolle>('ziel')
  const [ort, setOrt] = React.useState<OrtAuswahl | null>(null)
  const [ortText, setOrtText] = React.useState('')
  const [samenSichtbar, setSamenSichtbar] = React.useState(true)
  const [flug, setFlug] = React.useState<FlughafenAuswahl | null>(null)
  const ereignisse = React.useRef<Ereignis[]>([])
  const echo = React.useRef(true)
  const samenRef = React.useRef('')
  const samenSichtbarRef = React.useRef(true)

  React.useEffect(() => {
    const samenSetzen = (text: string) => {
      samenRef.current = text
      setOrtText(text)
    }
    window.__steuerung = {
      neu: (naechstes) => {
        ereignisse.current = []
        echo.current = true
        samenSichtbarRef.current = true
        setSamenSichtbar(true)
        setFeld(naechstes)
        setRolle('ziel')
        setOrt(null)
        samenSetzen('')
        setFlug(null)
        setGeneration((bisher) => bisher + 1)
      },
      rolle: (naechstes) => setRolle(naechstes),
      ortSetzen: (wert, text) => {
        setOrt(wert)
        if (typeof text === 'string') samenSetzen(text)
      },
      samenFest: (text) => {
        echo.current = false
        samenSichtbarRef.current = true
        setSamenSichtbar(true)
        setOrt(null)
        samenSetzen(text)
      },
      ohneSamen: () => {
        echo.current = false
        samenSichtbarRef.current = false
        setSamenSichtbar(false)
        setOrt(null)
        setGeneration((bisher) => bisher + 1)
      },
      samen: () => (samenSichtbarRef.current ? samenRef.current : null),
      flugSetzen: (wert) => setFlug(wert),
      ereignisse: () => ereignisse.current.map((eintrag) => ({ ...eintrag, wert: eintrag.wert ? { ...eintrag.wert } : null })),
    }
  }, [])

  if (feld === 'flughafen') {
    return (
      <FlughafenSuche
        key={generation}
        value={flug}
        onChange={(wert, text) => {
          ereignisse.current.push({ feld: 'flughafen', wert, text })
          setFlug(wert)
        }}
        placeholder="Stadt oder Flughafen"
        inputId="flughafen-suche"
        inputClassName="h-11 w-full border border-line-200 px-3"
      />
    )
  }

  return (
    <OrtSuche
      key={generation}
      rolle={rolle}
      variante="field"
      value={ort}
      initialText={samenSichtbar ? ortText : undefined}
      onChange={(wert, text) => {
        ereignisse.current.push({ feld: 'ort', wert, text })
        setOrt(wert)
        if (echo.current) {
          samenRef.current = text
          setOrtText(text)
        }
      }}
      placeholder="Ort"
      inputId="ort-suche"
      inputClassName="h-11 w-full border border-line-200 px-3"
    />
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
