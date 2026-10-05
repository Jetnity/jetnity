// lib/reisebegleiter/aktionen.ts
//
// Der eine Vorgang, den der Browser auslösen darf: eine Frage stellen.
//
// Es gibt keinen zweiten. Der Reisebegleiter übernimmt nichts, speichert nichts
// und legt nichts an – deshalb fehlt hier das Gegenstück zu
// `aenderungUebernehmen()` aus `lib/reiseaenderung/aktionen.ts`, und es fehlt
// absichtlich. Ein Weg, den es nicht gibt, muss nicht abgesichert werden.
//
// ---------------------------------------------------------------------------
// Die Reise kommt aus der Datenbank
// ---------------------------------------------------------------------------
//
// Der Client schickt eine Reisekennung, keine Reise. Alles, was das Modell
// sieht, wird hier serverseitig aus der RLS-geschützten Reise abgeleitet.
// Das ist der Grund, warum dieser Slice nur Konto-Reisen begleitet: Bei einer
// Gastreise liegt der Reisegraph im Browser, und eine Gastreise trägt
// Reisenden-, Staatsangehörigkeits- und Dokumentkontext. Diesen Kontext vom
// Client als Wahrheit anzunehmen, um ihn an ein Modell zu geben, wäre der
// falsche erste Schritt. Gastreisen bleiben unverändert planbar und änderbar;
// sie bekommen in dieser Ausbaustufe nur keinen Reisebegleiter.
//
// ---------------------------------------------------------------------------
// Keine Provider-Aufrufe
// ---------------------------------------------------------------------------
//
// Official-, Safety- und Seasonal-Lagen entstehen hier über die lokalen,
// provider-freien Auswertungen – dieselben, die die Oberfläche benutzt, wenn
// keine Provider-Lage vorliegt. Sie liefern `unknown` und
// `provider_unavailable` statt einer erfundenen Entwarnung. Eine Frage an den
// Reisebegleiter löst damit keinen Provider-Abruf, keine Suche und keine
// kommerzielle Anfrage aus.

'use server'

import { z } from 'zod'

import { modellAufrufen } from '@/lib/modell/aufruf'
import { modellZustand } from '@/lib/modell/konfiguration'
import { kontingentBeanspruchen, nutzungAbschliessen } from '@/lib/modell/kontingent'
import { requirementsLokalFuerReise } from '@/lib/readiness/engine'
import { begleiterauskunftErzeugen, type Begleiterergebnis } from '@/lib/reisebegleiter/erzeugen'
import { assistantTruthContextProjizieren } from '@/lib/reisebegleiter/kontext'
import { routeFactsAusGraph } from '@/lib/route/ableitung'
import { safetyLokalFuerReise } from '@/lib/safety/engine'
import { seasonalLokalFuerReise } from '@/lib/seasonal/engine'
import { NICHT_ANGEMELDET, konto } from '@/lib/trips/anlegen'
import { reiseLaden } from '@/lib/trips/daten'
import { tageEtappenZuordnen } from '@/lib/trips/zuordnung'

const frageSchema = z.object({
  tripId: z.string().uuid(),
  frage: z.string(),
})

function heute(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Beantwortet eine Frage zu einer Reise im Konto.
 *
 * Kostet Geld, ändert nichts. Der Rückgabewert lebt im Browser.
 */
export async function begleiterFragen(eingabe: unknown): Promise<Begleiterergebnis> {
  const geprueft = frageSchema.safeParse(eingabe)
  if (!geprueft.success) {
    return { ok: false, klasse: 'eingabe', meldung: 'Diese Reise ist unbekannt.' }
  }

  const { benutzerId } = await konto()
  if (!benutzerId) return { ok: false, klasse: 'eingabe', meldung: NICHT_ANGEMELDET }

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

  const reise = tageEtappenZuordnen(graph)
  const route = routeFactsAusGraph(reise)

  const kontext = assistantTruthContextProjizieren({
    reise,
    officialEvaluations: requirementsLokalFuerReise(reise),
    safetyEvaluations: safetyLokalFuerReise(reise),
    seasonalEvaluations: seasonalLokalFuerReise(reise),
    routeFacts: {
      quelle: route.quelle,
      destinationCountryCodes: route.destinationCountryCodes,
      transitCountryCodes: route.transitCountryCodes,
    },
  })

  const zustand = modellZustand()

  return begleiterauskunftErzeugen(geprueft.data.frage, kontext, {
    zustand,
    beanspruchen: (gewaehlt) =>
      zustand.aktiv
        ? kontingentBeanspruchen('reisebegleiter', gewaehlt)
        : Promise.resolve({
            ok: false as const,
            meldung: 'Der Reisebegleiter ist abgeschaltet.',
          }),
    abschliessen: nutzungAbschliessen,
    aufrufen: modellAufrufen,
    heute: heute(),
  })
}
