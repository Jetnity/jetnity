// lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts
//
// Öffentliche Projektion des internen gleichen-Request-Beweises.
// Der einzige Live-Einstieg ist loadOfficialTruthAutonomousPreacceptanceWitness().
// Autorität, Serveruhr, eine Kataloglesung, Frische und die #723/#726-Identität
// entstehen in loadOfficialTruthSameRequestProof(). Diese Datei behält davon
// nur die neun Zeugenfelder. Registry, EvidenceVersions, Kandidat,
// Schnappschuss und Vorschlag verlassen sie nicht.
//
// Der Erfolg ist flüchtiger Beweis. Er ist keine Annahme, kein Wahrheitsfakt,
// keine Bearer-Fähigkeit und keine Official Truth. Ein späterer Request muss
// den Live-Einstieg neu ausführen. Diese Datei speichert nichts.
//
// decideOfficialTruthAutonomousPreacceptanceWitness ist nur die Testnaht.
// Eine Route, die sie statt des Laders aufruft, öffnet diese Vorbedingung wieder.

import 'server-only'

import {
  decideOfficialTruthSameRequestProof,
  loadOfficialTruthSameRequestProof,
  type OfficialTruthSameRequestProofErgebnis,
  type OfficialTruthSameRequestProofSperrgrund,
  type OfficialTruthSameRequestProofAbhaengigkeiten,
} from '@/lib/readiness/official-truth-same-request-proof-server'
import type { RegelFaktArt } from '@/lib/readiness/rule-claims'

export type OfficialTruthAutonomousPreacceptanceWitnessSperrgrund = OfficialTruthSameRequestProofSperrgrund

/**
 * `authorized_preacceptance_witness` ist Beweis für diesen Request.
 * Der Schlüssel vergibt nichts. Die Freigabe ist nur das Echo der
 * bereits geprüften Rollenfähigkeit. Neun Felder, kein interner Graph.
 */
export type OfficialTruthAutonomousPreacceptanceWitnessErgebnis =
  | {
      readonly status: 'authorized_preacceptance_witness'
      readonly reviewPacketKey: string
      readonly ruleScopeKey: string
      readonly factKind: RegelFaktArt
      readonly supportVersionIds: readonly string[]
      readonly serverReferenceTime: string
      readonly freshness: 'current'
      readonly grant: 'role'
      readonly capability: 'official-truth-freigeben'
    }
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthAutonomousPreacceptanceWitnessSperrgrund
    }

/**
 * Deterministische Naht. `catalog` und `now` sind Testeinspritzungen.
 * Das ist nicht der Live-Einstieg. Dieselbe Naht speist den internen Graphen.
 */
export type OfficialTruthAutonomousPreacceptanceWitnessAbhaengigkeiten = OfficialTruthSameRequestProofAbhaengigkeiten

function zeugeAusBeweis(
  graph: OfficialTruthSameRequestProofErgebnis,
): OfficialTruthAutonomousPreacceptanceWitnessErgebnis {
  if (graph.status !== 'same_request_proof') return Object.freeze({ status: 'blocked', reason: graph.reason })
  return Object.freeze({
    status: 'authorized_preacceptance_witness',
    reviewPacketKey: graph.reviewPacketKey,
    ruleScopeKey: graph.ruleScopeKey,
    factKind: graph.factKind,
    supportVersionIds: Object.freeze([...graph.supportVersionIds]),
    serverReferenceTime: graph.serverReferenceTime,
    freshness: 'current',
    grant: 'role',
    capability: 'official-truth-freigeben',
  })
}

/**
 * Testnaht mit austauschbarer Autorität, Uhr und Katalogtransport.
 * Eine künftige Route darf sie nicht als Autorität aufrufen.
 */
export async function decideOfficialTruthAutonomousPreacceptanceWitness(
  eingabe: unknown,
  abhaengigkeiten: OfficialTruthAutonomousPreacceptanceWitnessAbhaengigkeiten,
): Promise<OfficialTruthAutonomousPreacceptanceWitnessErgebnis> {
  return zeugeAusBeweis(await decideOfficialTruthSameRequestProof(eingabe, abhaengigkeiten))
}

/**
 * Live-Einstieg. Keine Aufrufer-Uhr, kein Katalog-Override und keine
 * mitgelieferte Autorität. Die Fähigkeit wird zuerst im internen Graphen
 * gelesen. Erst danach darf der Katalogtransport laufen.
 */
export async function loadOfficialTruthAutonomousPreacceptanceWitness(
  eingabe: unknown,
): Promise<OfficialTruthAutonomousPreacceptanceWitnessErgebnis> {
  return zeugeAusBeweis(await loadOfficialTruthSameRequestProof(eingabe))
}
