# Jetnity – Travel Safety & Disruption Intelligence

Stand: 23. August 2026  
Status: **provider-neutrale Foundation auf Draft-PR #37; kein Live-Provider, keine Production-Migration**

Fachdokument zur Safety-Wahrheit. Acceptance: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ACCEPTANCE.md`.  
Policy: `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`.

---

## Ziel

Jetnity kann später belastbare Sicherheits- und Störungsereignisse auf eine **konkrete Reise** beziehen. Die Foundation macht den späteren Provider anschließbar, ohne Domäne, Entscheidungslogik oder Kern-UI neu zu bauen.

Leitsätze:

> **Warnen, wenn es die konkrete Reise betrifft – nicht pauschal alarmieren.**

> **Safety & Disruption ist eine eigene Truth-Domäne – kein Newsfeed und keine LLM-Meinung.**

---

## Getrennte Ebenen

Diese Ebenen dürfen nicht in ein Severity-Feld fallen:

1. Event-Kategorie
2. Source-/Authority-Klasse
3. source-backed Severity / Advisory
4. Freshness
5. räumliche und zeitliche Relevanz
6. Jetnity-Trip-Impact
7. UI-Priorität / Präsentationsklasse

Die Präsentationsklasse entsteht nur aus belegbaren Facts plus konkreter Relevanz. Ohne source-backed Extreme/Do-not-travel gibt es keine kritische Warnung.

---

## Architektur

| Schicht | Ort | Aufgabe |
| --- | --- | --- |
| Domain | `lib/safety/domain.ts` | Kategorien, Relevanz, Impact, Evaluation |
| Evidence | `lib/safety/evidence.ts` | Trust, Freshness, HTTPS-Quellen |
| Scope | `lib/safety/scope.ts` | räumlicher/zeitlicher Geltungsbereich |
| Port | `lib/safety/provider.ts` | `safetyProviderAus() → null` |
| Engine | `lib/safety/engine.ts` | Evaluation, fail-closed |
| Relevanz | `lib/safety/relevanz.ts` | Stage/Route/Zeit-Abgleich |
| Impact | `lib/safety/impact.ts` | Recheck-Hinweise, keine Mutation |
| API | `POST /api/safety/evaluate` | Rate-Limit, Zod, Body-Cap, `private, no-store` |
| Ansicht | `components/trips/ReiseSicherheit.tsx` | nur bei übergebenen Evaluations sichtbar |

Route Truth kommt ausschließlich aus `routeFactsAusGraph`. Traveller Context wird nur einbezogen, wenn ein Fact ausdrücklich travellerabhängig ist.

---

## Persistenz

Keine Safety-Tabelle. Official Safety-Truth bleibt compute-on-read, analog Official Readiness. Production-Schema unverändert.

---

## Was diese Foundation nicht tut

- keinen echten Safety-/Weather-/Government-Provider anschließen
- keine saisonalen Muster als akute Warnung behandeln
- keine Reise automatisch ändern
- keine permanente leere Safety-Karte ohne Evaluations
- kein LLM als Truth-Quelle
