# Jetnity – P1-TA-02 Closure Status

Stand: 26. August 2026  
Agent: `Account plattform audit vorbereitung`  
Branch: `fix/p1-ta02-official-evaluation-option-scope`  
Baseline: `main @ 2de8008ddb10e9b53fef49daccc779831669e813`  
Status: **IMPLEMENTIERT / STOPP für unabhängigen Technical-Lead-Review**

Auftrag: `docs/P1_TA02_OFFICIAL_EVALUATION_OPTION_SCOPE_TASK.md`  
Self-Review: `docs/P1_TA02_OFFICIAL_EVALUATION_OPTION_SCOPE_SELF_REVIEW.md`  
Entscheidung: ADR-0167

`docs/ACTIVE_WORK_STATUS.md` nicht geändert.

## Reproduktion vor Fix

Gegen unveränderten `main @ 2de8008`, unveränderte `officialAusEvaluations` / `officialFuer`:

| Prüfung | Ergebnis vor Fix |
| --- | --- |
| `officialAusEvaluations([A,B]).authority` | `Authority-A` |
| `officialAusEvaluations([B,A]).authority` | `Authority-B` |
| Reihenfolgeabhängig | **ja** |
| `result` | immer `unknown` – keine erfundene Visa-Pflicht |
| Item Traveller 1 × Destination JP ohne passende Evaluation | `Authority-A` (Fallback auf alle Evaluations, dann `[0]`) |
| Summary-Reason bei gemischten Scopes | `no_provider` aus der ersten Evaluation |

Abweichung zum Audit: **keine**. Live-Code bestätigt P1-TA-02. `result` war bereits fail-closed. Der Defekt ist Presentation-/Option-Scope-Truth, nicht erfundene regulatorische Entscheidung.

P2-TA-06 (`travellerNormalisieren` `documents[0]`) war für diese Korrektur **nicht** zwingend. Nicht angefasst.

## Root Cause

1. `officialAusEvaluations` kopierte Authority, Source URL, `checkedAt`, `validityUntil`, Status und Reason aus `evaluations[0]`.
2. `readinessAnsicht` → `officialFuer` filterte Land + Traveller, fiel bei leerer Menge auf **alle** Evaluations zurück und kollabierte danach wieder auf `[0]`.
3. Weder Item- noch Summary-/API-`official` war permutationsstabil.

## Option-Scope-Vertrag

Kein neuer Traveller-Contract. Vorhandene `OfficialEvaluation`-Felder:

- `travellerClientRef`
- `credentialOptionRef`
- `destinationCountryCode`
- `transitCountryCode`

**Hard Truth:** `evaluations[]`.

**Compatibility-`official`:**

- `result` immer `unknown`.
- Presentation-Felder (Authority, URL, `checkedAt`, `validityUntil`) nur wenn **ein** Option-Scope **und** identische Presentation.
- Heterogener Scope: diese Felder `null`; Destination nur wenn in der Menge eindeutig; Status nur wenn nach `current → unknown` eindeutig, sonst `insufficient_context`.
- Mehrere Traveller: Reason `multiple_travellers_no_individual_evidence`.
- Heterogener Ein-Traveller-Scope: Reason `insufficient_context`.
- Reihenfolge A,B ≡ B,A.

**Item-Scope:** `officialFuerItem` nimmt nur exakt passende Evaluations. Kein Treffer → fail-closed `insufficient_context`, keine fremde Authority.

## API-/Presentation-Kompatibilität

`POST /api/readiness/requirements` behält Shape `{ status, evaluations, official, message }`.

- `evaluations` bleibt kanonisch.
- `official` ändert Semantik: nicht mehr first-evaluation.
- Top-level `status` kommt weiter aus `official.status`, ist aber permutationsstabil.
- Kein neues Pflichtfeld, kein Breaking Shape.

UI nutzt bereits `officialPruefungAusEvaluations(evaluations)` für den Banner und `item.official.status` nur als Status-Text. Keine einzelne Authority wird global als „gilt für alle“ gezeigt, wenn der Scope heterogen ist.

## Diff (fachlich)

- `lib/readiness/anforderungen.ts` – fail-closed Aggregation; `officialFuerItem`
- `lib/readiness/status.ts` – Item-Scope ohne Fallback auf alle Evaluations
- Tests: `lib/readiness/official-option-scope.test.ts`
- Docs: ADR-0167, Architecture, Roadmap-Zeile, dieser Status

## P0 / P1 / P2 / P3

| ID | Lage |
| --- | --- |
| P0 | keine |
| P1-TA-02 | dieser Slice; review-fähig, nicht Ready |
| P2-TA-06 | latent `documents[0]` in `travellerNormalisieren`; **nicht** gestartet |
| P3 | keine neue in diesem Slice |

## Exact Head / Ahead-Behind / Merge-Base

| Größe | Wert |
| --- | --- |
| Exact Head | `d3c326debc45169a74efcb9350acf4634fe6a196` |
| `origin/main` | `2de8008ddb10e9b53fef49daccc779831669e813` |
| Merge-Base | `2de8008ddb10e9b53fef49daccc779831669e813` |
| Ahead / Behind | **4 / 0** |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/84 |

## Gates

Lokal auf Exact Head `d3c326de`:

| Gate | Ergebnis |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS – 2058/2058 |
| `npm run build` | PASS |
| `npm run check:setup:ci` | PASS (Warning: keine `.env` lokal) |
| `npm run check:dead` | PASS |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| Readiness-/Traveller-Tests inkl. `official-option-scope.test.ts` | PASS – 20/20 adversarial |

GitHub Actions / Vercel für Exact Head `d3c326de`:

| Gate | Ergebnis |
| --- | --- |
| Auth-Konfiguration | SUCCESS |
| Typecheck, Lint & Build | IN_PROGRESS – run `32957120609` |
| Vercel Preview | SUCCESS – deployment `7ZfRtrwxLsRF1xSZ3CRnJV8tzkmQ` / id `6101640543` |

Kein Ready. Kein Merge.

## Offene Residuals

- P2-TA-06 bleibt offen.
- Account-Traveller-Registry / AP-7 bleibt gated.
- Kein Provider; ohne Provider bleibt `result: unknown`.
- UI zeigt weiterhin keine progressive per-Option Official-Karte – das war nicht Scope.

## Gates

Lokal und Exact-Head nach Push belegen. Kein Ready. Kein Merge.
