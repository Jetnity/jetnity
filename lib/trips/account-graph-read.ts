// lib/trips/account-graph-read.ts
//
// Orchestrierung des Konto-Reisegraph-Reads. Vollständige kanonische Zeilen
// bleiben erfolgreiche Graphen. Strukturell unvollständige Reisenden-Loads
// werden vor der Abbildung als Lesung.problem gemeldet und nicht als Trip
// ausgegeben. Der Legacy-Select bleibt der schmale Expand/Contract-Pfad;
// gelieferte Legacy-Zeilen dürfen nicht als handlungsfähiger Graph entkommen.

import {
  lese,
  type Leseantwort,
  type Lesung,
  type Problem,
} from '@/lib/api/datenbank-lesen'
import {
  accountGraphKinderVollstaendig,
  foundationERelationFehlt,
  type AccountGraphZeileKind,
} from '@/lib/trips/foundation-e-select'

export const ACCOUNT_GRAPH_UNVOLLSTAENDIG_MELDUNG =
  'Die Reisenden der Reise sind unvollständig geladen.'

export function accountGraphUnvollstaendigProblem(): Problem {
  return { status: 500, message: ACCOUNT_GRAPH_UNVOLLSTAENDIG_MELDUNG }
}

function nachricht(fehler: unknown): string {
  if (fehler instanceof Error) return fehler.message
  return String(fehler)
}

export type AccountGraphLesenEingabe<Zeile extends AccountGraphZeileKind, Graph> = {
  kanonisch: () => PromiseLike<Leseantwort<Zeile>>
  fallback: () => PromiseLike<Leseantwort<Zeile>>
  mapper: (zeile: Zeile) => Graph
}

export type AccountGraphVerbrauch<T> =
  | { art: 'problem'; problem: Problem }
  | { art: 'fehlend' }
  | { art: 'graph'; graph: T }

/**
 * Gemeinsame Grenze aller reiseLaden-Verbraucher: Problem zuerst, dann Leere,
 * erst danach ein handlungsfähiger Graph.
 */
export function accountGraphVerbrauch<T>(lesung: Lesung<T>): AccountGraphVerbrauch<T> {
  if (lesung.problem) return { art: 'problem', problem: lesung.problem }
  const graph = lesung.zeilen[0]
  if (!graph) return { art: 'fehlend' }
  return { art: 'graph', graph }
}

export async function accountGraphLesen<Zeile extends AccountGraphZeileKind, Graph>(
  eingabe: AccountGraphLesenEingabe<Zeile, Graph>,
): Promise<Lesung<Graph>> {
  let kanonisch: Leseantwort<Zeile>
  try {
    kanonisch = await eingabe.kanonisch()
  } catch (fehler) {
    return { zeilen: null, problem: { status: 500, message: nachricht(fehler) } }
  }

  if (kanonisch.error && foundationERelationFehlt(kanonisch.error)) {
    const fallback = await lese(eingabe.fallback)
    if (fallback.problem) return fallback
    if (fallback.zeilen.length === 0) {
      return { problem: null, zeilen: [] }
    }
    return { zeilen: null, problem: accountGraphUnvollstaendigProblem() }
  }

  const gelesen = await lese(() => Promise.resolve(kanonisch))
  if (gelesen.problem) return gelesen
  if (!gelesen.zeilen.every(accountGraphKinderVollstaendig)) {
    return { zeilen: null, problem: accountGraphUnvollstaendigProblem() }
  }

  return {
    problem: null,
    zeilen: gelesen.zeilen.map(eingabe.mapper),
  }
}
