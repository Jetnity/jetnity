// lib/seasonal/konflikt.ts
//
// Semantisch identische Duplikate werden deterministisch zusammengeführt.
// Widersprüchliche decision-relevante Semantik bleibt konfliktbehaftet.
// Evidence-URL allein ist kein Konflikt. Input-Reihenfolge ändert nichts.

import { entscheidungsSignatur, evidenceBevorzugen, type SeasonalFact } from '@/lib/seasonal/normalisieren'

export type SeasonalFactMenge = {
  facts: SeasonalFact[]
  konflikte: Set<string>
}

function vergleichen(a: SeasonalFact, b: SeasonalFact): number {
  return a.factKey.localeCompare(b.factKey) || entscheidungsSignatur(a).localeCompare(entscheidungsSignatur(b))
}

export function seasonalFactsDeduplizieren(facts: readonly SeasonalFact[]): SeasonalFactMenge {
  const sortiert = [...facts].sort(vergleichen)
  const gesehen = new Map<string, SeasonalFact>()
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
    gesehen.set(fact.factKey, evidenceBevorzugen(vorher, fact))
  }

  return {
    facts: [...gesehen.values()].filter((fact) => !konflikte.has(fact.factKey)),
    konflikte,
  }
}
