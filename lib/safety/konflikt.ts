// lib/safety/konflikt.ts
//
// Semantisch identische Duplikate werden deterministisch zusammengeführt.
// Widersprüchliche decision-relevante Semantik bleibt konfliktbehaftet.
// Evidence-URL allein ist kein Konflikt. Input-Reihenfolge ändert nichts.

import { entscheidungsSignatur, type SafetyFact } from '@/lib/safety/normalisieren'

export type SafetyFactMenge = {
  facts: SafetyFact[]
  konflikte: Set<string>
}

function vergleichen(a: SafetyFact, b: SafetyFact): number {
  return a.factKey.localeCompare(b.factKey) || entscheidungsSignatur(a).localeCompare(entscheidungsSignatur(b))
}

function safetyFactsOrdnen(facts: readonly SafetyFact[]): SafetyFact[] {
  return [...facts].sort(vergleichen)
}

export function safetyFactsDeduplizieren(facts: readonly SafetyFact[]): SafetyFactMenge {
  const sortiert = safetyFactsOrdnen(facts)
  const gesehen = new Map<string, SafetyFact>()
  const konflikte = new Set<string>()

  for (const fact of sortiert) {
    if (konflikte.has(fact.factKey)) continue
    const vorher = gesehen.get(fact.factKey)
    if (!vorher) {
      gesehen.set(fact.factKey, fact)
      continue
    }
    if (entscheidungsSignatur(vorher) !== entscheidungsSignatur(fact)) {
      konflikte.add(fact.factKey)
      continue
    }
  }

  return {
    facts: [...gesehen.values()].filter((fact) => !konflikte.has(fact.factKey)),
    konflikte,
  }
}
