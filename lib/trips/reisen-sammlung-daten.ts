// lib/trips/reisen-sammlung-daten.ts
//
// Eine begrenzte Seite der Kontoreisen für /reisen.
// Account-Start und Welt bleiben bei reisenLaden().

import 'server-only'

import { lese, type Leseantwort } from '@/lib/api/datenbank-lesen'
import { createServerComponentClient } from '@/lib/supabase/server'
import {
  REISEN_SAMMLUNG_ABRUF,
  REISEN_SAMMLUNG_SEITENGROESSE,
  cursorCodieren,
  sammlungAnfrageAus,
  sammlungHref,
  ungueltigeAdresse,
  type GueltigeSammlung,
  type SammlungErgebnis,
  type SammlungSuchparameter,
} from '@/lib/trips/reisen-sammlung-abfrage'
import { UEBERSICHT_SPALTEN, uebersichtAusZeilen, type UebersichtZeile } from '@/lib/trips/reisen-uebersicht'

export type SammlungKette = PromiseLike<Leseantwort<UebersichtZeile>> & {
  select(spalten: string): SammlungKette
  eq(spalte: string, wert: string): SammlungKette
  neq(spalte: string, wert: string): SammlungKette
  or(filter: string): SammlungKette
  order(spalte: string, optionen: { ascending: boolean }): SammlungKette
  limit(anzahl: number): SammlungKette
}

export type SammlungClient = {
  from(tabelle: 'trips'): SammlungKette
}

function leerUngueltig(parameter: SammlungSuchparameter): SammlungErgebnis {
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

export async function reisenSammlungLaden(
  anfrage: GueltigeSammlung,
  client?: SammlungClient,
): Promise<Pick<SammlungErgebnis, 'zeilen' | 'problem' | 'hatWeiter' | 'naechsterCursor'>> {
  const supabase = (client ?? (await createServerComponentClient())) as SammlungClient
  let kette = supabase.from('trips').select(UEBERSICHT_SPALTEN)
  if (anfrage.archiv === 'offen') kette = kette.neq('status', 'archived')
  if (anfrage.archiv === 'archiv') kette = kette.eq('status', 'archived')
  if (anfrage.suchOder) kette = kette.or(anfrage.suchOder)
  if (anfrage.keysetOder) kette = kette.or(anfrage.keysetOder)
  kette = kette.order('updated_at', { ascending: false }).order('id', { ascending: false })

  const ergebnis = await lese<UebersichtZeile>(() => kette.limit(REISEN_SAMMLUNG_ABRUF))
  if (ergebnis.problem) {
    return { zeilen: [], problem: ergebnis.problem, hatWeiter: false, naechsterCursor: null }
  }

  const abgebildet = uebersichtAusZeilen(ergebnis.zeilen)
  const sichtbar = abgebildet.slice(0, REISEN_SAMMLUNG_SEITENGROESSE)
  const letzte = sichtbar[sichtbar.length - 1]
  const naechster =
    abgebildet.length > REISEN_SAMMLUNG_SEITENGROESSE && letzte
      ? cursorCodieren({ q: anfrage.q, archiv: anfrage.archiv, zeit: letzte.updatedAt, id: letzte.id })
      : null
  return {
    zeilen: sichtbar,
    problem: null,
    hatWeiter: naechster !== null,
    naechsterCursor: naechster,
  }
}

export async function reisenSammlungAusParametern(
  parameter: SammlungSuchparameter,
  client?: SammlungClient,
): Promise<SammlungErgebnis> {
  const anfrage = sammlungAnfrageAus(parameter)
  if (!anfrage.ok) return leerUngueltig(parameter)
  const lesung = await reisenSammlungLaden(anfrage, client)
  return {
    ungueltig: false,
    ...lesung,
    q: anfrage.q,
    archiv: anfrage.archiv,
    cursor: anfrage.cursor,
    adresse: sammlungHref(anfrage),
  }
}
