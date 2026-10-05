// lib/reiseaenderung/aktionen.ts
//
// Die beiden Vorgänge, die der Browser auslösen darf.
//
//   · `aenderungErzeugen()` – kostet Geld, speichert nichts.
//   · `aenderungUebernehmen()` – speichert, kostet nichts.
//
// Für Gäste erzeugt nur der erste Vorgang serverseitig; das Speichern liegt
// im Browser. Für Konten lädt Erzeugen die Reise aus der Datenbank – der
// Client schickt keine Reise als Wahrheit mit.

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { modellAufrufen } from '@/lib/modell/aufruf'
import { modellZustand } from '@/lib/modell/konfiguration'
import { kontingentBeanspruchen, nutzungAbschliessen } from '@/lib/modell/kontingent'
import { operationenAnwenden, type KennungFn } from '@/lib/reiseaenderung/anwenden'
import { reiseaenderungErzeugen, type Aenderungsergebnis } from '@/lib/reiseaenderung/erzeugen'
import { aenderungAlsNutzlast } from '@/lib/reiseaenderung/nutzlast'
import { modellFuerReiseaenderung } from '@/lib/reiseaenderung/routing'
import { reiseaenderungSchema } from '@/lib/reiseaenderung/schema'
import { reiseMitKanonischenOrten, type KanonischeOrte } from '@/lib/places/kanon'
import { reiseOrteKanonisieren } from '@/lib/places/lesen'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import { reiseLaden } from '@/lib/trips/daten'
import { ersteMeldung, reiseSchema } from '@/lib/trips/schema'
import { tageEtappenZuordnen } from '@/lib/trips/zuordnung'
import type { Reisegraph } from '@/types/trips'

function heute(): string {
  return new Date().toISOString().slice(0, 10)
}

function kontoKennung(_prefix: string): string {
  return crypto.randomUUID()
}

function gastKennung(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

const erzeugenKontoSchema = z.object({
  tripId: z.string().uuid(),
  text: z.string(),
})

const erzeugenGastSchema = z.object({
  reise: z.unknown(),
  text: z.string(),
})

const uebernahmeSchema = z.object({
  tripId: z.string().uuid(),
  mutationId: z.string().min(1).max(64),
  basisRevision: z.number().int().min(1),
  aenderung: reiseaenderungSchema,
})

async function mitModell(
  text: string,
  reise: Reisegraph,
  kennung: KennungFn,
): Promise<Aenderungsergebnis> {
  const zustand = modellZustand()
  const modell = zustand.aktiv
    ? modellFuerReiseaenderung(text, reise, process.env.JETNITY_MODELL_NAME)
    : null

  return reiseaenderungErzeugen(text, reise, {
    zustand: zustand.aktiv && modell ? { ...zustand, modell } : zustand,
    beanspruchen: (gewaehlt) =>
      zustand.aktiv
        ? kontingentBeanspruchen('reiseaenderung', gewaehlt)
        : Promise.resolve({
            ok: false as const,
            meldung: 'Die intelligente Planung ist abgeschaltet.',
          }),
    abschliessen: nutzungAbschliessen,
    aufrufen: modellAufrufen,
    heute: heute(),
    kennung,
    mutationId: crypto.randomUUID(),
  })
}

/**
 * Erzeugt einen Änderungsvorschlag für eine Reise im Konto.
 *
 * Die Reise kommt aus der Datenbank, nicht aus dem Browser.
 */
export async function aenderungErzeugen(eingabe: unknown): Promise<Aenderungsergebnis> {
  const geprueft = erzeugenKontoSchema.safeParse(eingabe)
  if (!geprueft.success) {
    return { ok: false, klasse: 'eingabe', meldung: 'Diese Reise ist unbekannt.' }
  }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, klasse: 'eingabe', meldung: NICHT_ANGEMELDET }
  void supabase

  const geladen = await reiseLaden(geprueft.data.tripId)
  if (geladen.problem) {
    return {
      ok: false,
      klasse: 'gesperrt',
      meldung:
        geladen.problem.status === 503
          ? 'Die Reise konnte gerade nicht geladen werden. Bitte versuche es in einem Moment erneut.'
          : 'Die Reise konnte nicht geladen werden.',
    }
  }

  const graph = geladen.zeilen[0]
  if (!graph) return { ok: false, klasse: 'eingabe', meldung: 'Diese Reise ist unbekannt.' }

  return mitModell(geprueft.data.text, tageEtappenZuordnen(graph), kontoKennung)
}

/**
 * Erzeugt einen Änderungsvorschlag für eine Gastreise.
 *
 * Die Reise liegt nur im Browser. Sie wird hier vollständig geprüft, bevor sie
 * das Modell zu sehen bekommt.
 */
export async function aenderungErzeugenGast(eingabe: unknown): Promise<Aenderungsergebnis> {
  const geprueft = erzeugenGastSchema.safeParse(eingabe)
  if (!geprueft.success) {
    return { ok: false, klasse: 'eingabe', meldung: 'Diese Reise ist unbekannt.' }
  }

  const reise = reiseSchema.safeParse(geprueft.data.reise)
  if (!reise.success) {
    return { ok: false, klasse: 'eingabe', meldung: 'Diese Reise ist auf diesem Gerät nicht mehr gültig.' }
  }

  const graph: Reisegraph = tageEtappenZuordnen(reise.data)
  return mitModell(geprueft.data.text, graph, gastKennung)
}

/** Löst Modellorte einer geänderten Reise. Konto und Gast teilen dieselbe Regel. */
export async function aenderungOrteAufloesen(eingabe: unknown) {
  const reise = reiseSchema.safeParse(eingabe)
  if (!reise.success) {
    const leer: KanonischeOrte = { origin: null, stages: [] }
    return leer
  }
  return reiseOrteKanonisieren(tageEtappenZuordnen(reise.data))
}

/**
 * Übernimmt eine bestätigte Änderung in das Konto.
 *
 * Operationen werden serverseitig erneut auf die aktuelle Reise angewendet.
 * Eine veraltete Fassung oder ein Retry derselben Mutation endet in der
 * Datenbank, nicht in einer stillen Doppelanwendung.
 */
export async function aenderungUebernehmen(eingabe: unknown): Promise<Aktionsergebnis<{ revision: number }>> {
  const geprueft = uebernahmeSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: ersteMeldung(geprueft.error) }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const geladen = await reiseLaden(geprueft.data.tripId)
  if (geladen.problem) {
    return {
      ok: false,
      meldung:
        geladen.problem.status === 503
          ? 'Die Reise konnte gerade nicht gespeichert werden. Die Vorschau bleibt stehen.'
          : 'Die Änderung konnte nicht gespeichert werden. Die Vorschau bleibt stehen.',
    }
  }

  const aktuell = geladen.zeilen[0]
  if (!aktuell) return { ok: false, meldung: 'Diese Reise ist unbekannt.' }

  if (aktuell.lastMutationId === geprueft.data.mutationId) {
    return { ok: true, wert: { revision: aktuell.revision } }
  }

  if (aktuell.revision !== geprueft.data.basisRevision) {
    return {
      ok: false,
      meldung:
        'Diese Reise hat sich inzwischen geändert. Bitte verwirf die Vorschau und formuliere den Wunsch erneut.',
    }
  }

  const angewandt = operationenAnwenden(
    tageEtappenZuordnen(aktuell),
    geprueft.data.aenderung.operationen,
    kontoKennung,
  )
  if (!angewandt.ok) return { ok: false, meldung: angewandt.fehler.meldung }

  const orte = await reiseOrteKanonisieren(angewandt.reise)
  const kanonisch = reiseMitKanonischenOrten(angewandt.reise, orte)

  const { data, error, status } = await supabase.rpc('reise_aendern', {
    _aenderung: aenderungAlsNutzlast(
      kanonisch,
      geprueft.data.mutationId,
      geprueft.data.basisRevision,
    ),
  })

  if (error) {
    const meldung =
      error.code === 'P0001' || error.code === '22023' || error.code === '23505'
        ? error.message
        : meldungAus(error, status)
    return { ok: false, meldung }
  }

  const revision =
    data && typeof data === 'object' && 'revision' in data && typeof data.revision === 'number'
      ? data.revision
      : angewandt.reise.revision + 1

  revalidatePath(`/reisen/${geprueft.data.tripId}`)
  revalidatePath('/reisen')
  return { ok: true, wert: { revision } }
}
