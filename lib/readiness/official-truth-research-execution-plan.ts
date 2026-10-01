// lib/readiness/official-truth-research-execution-plan.ts
//
// Reiner Allowlist-Plan vor jedem Abruf.
// Die Forschungsanfrage bleibt die Anfrage. Die Zulässigkeit bleibt die
// bestehende Routenbrücke. Diese Datei liest danach nur die Registry:
// amtliche Kennung und bereits registrierte Hostnamen.
// Keine Adresse, kein Pfad, keine Suche, kein Speicher, keine Einreisewirkung.

import type { OfficialTruthRechercheGrund } from '@/lib/readiness/official-truth-research-request'
import {
  officialTruthRechercheQuellenRouten,
  type OfficialTruthRechercheRoutenEntscheidung,
  type OfficialTruthRechercheRoutenSperrgrund,
} from '@/lib/readiness/official-truth-research-source-routing'
import type { RegelFaktArt } from '@/lib/readiness/rule-claims'
import { domaeneNormalisieren } from '@/lib/readiness/source-registry'

const AMTLICH = 'official_authority' as const

export type OfficialTruthRechercheAusfuehrungsplanSperrgrund = OfficialTruthRechercheRoutenSperrgrund

/**
 * Eine bereits registrierte Behörde und die Hostnamen, die ihre Registry-Zeile
 * schon nennt. Die Liste ist stabil sortiert. Sie ist keine Adresse und keine Rangfolge.
 */
export type OfficialTruthRechercheQuellenplan = {
  sourceId: string
  domains: readonly string[]
}

type BereiteRoute = Extract<OfficialTruthRechercheRoutenEntscheidung, { status: 'eligible_official_sources' | 'no_eligible_official_source' }>

/**
 * Der Plan für genau eine bereits gebaute Forschungsanfrage.
 * `ready` nennt nur amtliche Kennungen mit registrierten Hostnamen.
 * Keine passende Behörde bleibt ohne Quelle. Ein ungültiger Plan wird verworfen.
 */
export type OfficialTruthRechercheAusfuehrungsplan =
  | {
      status: 'ready'
      requestKey: string
      ruleScopeKey: string
      factKind: RegelFaktArt
      researchReason: OfficialTruthRechercheGrund
      sources: readonly OfficialTruthRechercheQuellenplan[]
    }
  | {
      status: 'no_eligible_official_source'
      requestKey: string
      ruleScopeKey: string
      factKind: RegelFaktArt
      researchReason: OfficialTruthRechercheGrund
    }
  | {
      status: 'blocked_invalid'
      reason: OfficialTruthRechercheAusfuehrungsplanSperrgrund
    }

type Quellenzeile = {
  sourceId: string
  sourceClass: string
  domains: readonly unknown[]
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function vergleich(links: string, rechts: string): number {
  return links < rechts ? -1 : links > rechts ? 1 : 0
}

function sperre(reason: OfficialTruthRechercheAusfuehrungsplanSperrgrund): OfficialTruthRechercheAusfuehrungsplan {
  return Object.freeze({ status: 'blocked_invalid', reason })
}

function grundKopieren(grund: OfficialTruthRechercheGrund): OfficialTruthRechercheGrund {
  if (grund.status === 'recheck_needed') return Object.freeze({ status: 'recheck_needed', reason: grund.reason })
  return Object.freeze({ status: 'missing' })
}

function identitaet(entscheidung: BereiteRoute) {
  return {
    requestKey: entscheidung.requestKey,
    ruleScopeKey: entscheidung.ruleScopeKey,
    factKind: entscheidung.factKind,
    researchReason: grundKopieren(entscheidung.researchReason),
  }
}

/**
 * Dieselbe Host-Beziehung wie die Registry: ein gesperrter Name deckt sich
 * selbst und seine Unterlabels. Hier wird daraus keine Adresse gebaut.
 */
function hostGehoertZu(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/**
 * Die Registry wird erneut gelesen, nicht aus dem Deskriptor übernommen.
 * Ein gesperrter Name muss schon normalisiert sein, sonst ist die Liste nicht belegbar.
 */
function registryLesen(registry: unknown): { quellen: readonly Quellenzeile[]; gesperrt: readonly string[] } | null {
  const satz = datensatz(registry)
  if (!satz || !Array.isArray(satz.sources) || !Array.isArray(satz.blockedDomains)) return null

  const quellen: Quellenzeile[] = []
  for (const eintrag of satz.sources) {
    const quelle = datensatz(eintrag)
    if (!quelle || typeof quelle.sourceId !== 'string' || typeof quelle.sourceClass !== 'string' || !Array.isArray(quelle.domains)) {
      return null
    }
    quellen.push({ sourceId: quelle.sourceId, sourceClass: quelle.sourceClass, domains: quelle.domains })
  }

  const gesperrt: string[] = []
  for (const eintrag of satz.blockedDomains) {
    if (typeof eintrag !== 'string' || domaeneNormalisieren(eintrag) !== eintrag) return null
    gesperrt.push(eintrag)
  }
  return { quellen, gesperrt: Object.freeze(gesperrt) }
}

/**
 * Hostnamen bleiben die Registry-Zeichenketten, wenn sie bereits normalisiert,
 * eindeutig und nicht gesperrt sind. Sonst gibt es keinen Teilplan.
 */
function domainsLesen(domains: readonly unknown[], gesperrt: readonly string[]): readonly string[] | null {
  const gesehen = new Set<string>()
  for (const eintrag of domains) {
    if (typeof eintrag !== 'string' || domaeneNormalisieren(eintrag) !== eintrag) return null
    if (gesehen.has(eintrag)) return null
    if (gesperrt.some((domain) => hostGehoertZu(eintrag, domain))) return null
    gesehen.add(eintrag)
  }
  if (gesehen.size === 0) return null
  const liste = [...gesehen]
  liste.sort(vergleich)
  return Object.freeze(liste)
}

function planFuer(quellen: readonly Quellenzeile[], sourceId: string, gesperrt: readonly string[]): OfficialTruthRechercheQuellenplan | null {
  const treffer = quellen.filter((quelle) => quelle.sourceId === sourceId)
  if (treffer.length !== 1) return null
  const quelle = treffer[0]
  if (quelle.sourceClass !== AMTLICH) return null
  const domains = domainsLesen(quelle.domains, gesperrt)
  if (!domains) return null
  return Object.freeze({ sourceId: quelle.sourceId, domains })
}

function plaeneBauen(
  quellen: readonly Quellenzeile[],
  sourceIds: readonly string[],
  gesperrt: readonly string[],
): readonly OfficialTruthRechercheQuellenplan[] | null {
  if (sourceIds.length === 0) return null
  const plaene: OfficialTruthRechercheQuellenplan[] = []
  const gesehen = new Set<string>()
  for (const sourceId of sourceIds) {
    if (gesehen.has(sourceId)) return null
    gesehen.add(sourceId)
    const plan = planFuer(quellen, sourceId, gesperrt)
    if (!plan) return null
    plaene.push(plan)
  }
  plaene.sort((links, rechts) => vergleich(links.sourceId, rechts.sourceId))
  return Object.freeze(plaene)
}

/**
 * Welche bereits registrierten Behörden-Hostnamen diese eine Forschungsanfrage
 * vor einem Abruf nennen darf.
 * Die Brücke wird mit Anfrage, Registry und Deskriptoren neu ausgeführt.
 * Eine mitgelieferte Routenentscheidung gibt es hier nicht.
 * Lizenzen fallen in der Brücke weg. Gesperrte oder verfälschte Hostnamen
 * verwerfen den ganzen Plan, statt eine gekürzte Liste zu ergeben.
 */
export function officialTruthRechercheAusfuehrungsplan(
  anfrage: unknown,
  registry: unknown,
  deskriptoren: unknown,
): OfficialTruthRechercheAusfuehrungsplan {
  const entscheidung = officialTruthRechercheQuellenRouten(anfrage, registry, deskriptoren)
  if (entscheidung.status === 'blocked_invalid') return sperre(entscheidung.reason)

  const gelesen = registryLesen(registry)
  if (!gelesen) return sperre('invalid_source_plan')

  if (entscheidung.status === 'no_eligible_official_source') {
    if (entscheidung.sourceIds.length !== 0) return sperre('invalid_source_plan')
    return Object.freeze({
      status: 'no_eligible_official_source',
      ...identitaet(entscheidung),
    })
  }

  const sources = plaeneBauen(gelesen.quellen, entscheidung.sourceIds, gelesen.gesperrt)
  if (!sources) return sperre('invalid_source_plan')
  return Object.freeze({
    status: 'ready',
    ...identitaet(entscheidung),
    sources,
  })
}
