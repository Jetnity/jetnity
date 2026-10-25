import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'

import MyTripsCollection from '@/components/trips/MyTripsCollection'
import {
  parameterAusSuche,
  sammlungAnfrageAus,
  sammlungHref,
  ungueltigeAdresse,
  type SammlungErgebnis,
} from '@/lib/trips/reisen-sammlung-abfrage'
import type { TripSummary } from '@/types/trips'
import { aktionAnzahl, aktionZurueck, setzeAktion } from './shims/aktionen'
import { aufrufe, flags, setzeAdresse } from './shims/navigation'

function reise(id: string, title: string, status: TripSummary['status'] = 'planned'): TripSummary {
  return {
    id,
    title,
    origin: 'Zürich',
    startDate: null,
    endDate: null,
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status,
    updatedAt: '2026-10-25T12:00:00.000000Z',
    archivePreviousStatus: status === 'archived' ? 'planned' : null,
    stages: [],
    stageCount: 0,
    dayCount: 0,
    itemCount: 0,
  }
}

const anfang: SammlungErgebnis = {
  ungueltig: false,
  zeilen: [reise('00000000-0000-4000-8000-000000000001', 'Alpha')],
  problem: null,
  hatWeiter: true,
  naechsterCursor: 'naechste',
  q: '',
  archiv: 'alle',
  cursor: null,
  adresse: '/reisen',
}

function erstesErgebnis(): SammlungErgebnis {
  const suche = new URLSearchParams(window.location.search)
  const parameter = parameterAusSuche(suche)
  const anfrage = sammlungAnfrageAus(parameter)
  if (!anfrage.ok) {
    return {
      ungueltig: true,
      zeilen: [],
      problem: null,
      hatWeiter: false,
      naechsterCursor: null,
      q: '',
      archiv: 'alle',
      cursor: null,
      adresse: ungueltigeAdresse(parameter),
    }
  }
  return { ...anfang, q: anfrage.q, archiv: anfrage.archiv, cursor: anfrage.cursor, adresse: sammlungHref(anfrage) }
}

function Harness() {
  const [ergebnis, setErgebnis] = useState(erstesErgebnis)
  useEffect(() => {
    const fenster = window as Window & {
      __sammlung?: {
        setErgebnis: (wert: SammlungErgebnis) => void
        setzeAdresse: (text: string) => void
        aufrufe: typeof aufrufe
        flags: typeof flags
        setzeAktion: typeof setzeAktion
        aktionAnzahl: typeof aktionAnzahl
        aktionZurueck: typeof aktionZurueck
        anfang: SammlungErgebnis
        reise: typeof reise
      }
    }
    fenster.__sammlung = {
      setErgebnis,
      setzeAdresse,
      aufrufe,
      flags,
      setzeAktion,
      aktionAnzahl,
      aktionZurueck,
      anfang,
      reise,
    }
  }, [setErgebnis])
  return (
    <MyTripsCollection
      ergebnis={ergebnis}
      fehlerTitel="Deine Reisen konnten nicht geladen werden."
      leerTitel="Noch keine Reise in deinem Konto."
      fehlerHinweis={ergebnis.problem ? 'Die Datenbank war gerade nicht erreichbar. Bitte versuche diese Ansicht erneut.' : ''}
    />
  )
}

const wurzel = document.getElementById('root')
if (!wurzel) throw new Error('root fehlt')
createRoot(wurzel).render(<Harness />)
