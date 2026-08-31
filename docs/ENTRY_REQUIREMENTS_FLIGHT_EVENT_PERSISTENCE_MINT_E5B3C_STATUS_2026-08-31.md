# Entry Requirements E5-B3C – Server-only Flight Event Persistence Payload Mint – Status

Stand: 31. August 2026  
Status: **IMPLEMENTATION DELIVERED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN PRODUCTION APPLY / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity entry requirements flight event persistence mint 1`**, Generation 1  
Session: `bc-8579f2af-62df-45f3-b15b-d9a1d2d4c180`  
Issue: [#347](https://github.com/Jetnity/jetnity/issues/347)  
Parent: [#294](https://github.com/Jetnity/jetnity/issues/294)  
Branch: `feat/entry-requirements-flight-event-persistence-mint-e5b3c-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/348

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster sicherer Brückenbaustein nach geschlossenem E5-B3B:

1. Reiner server-only / DB-freier TypeScript-Mint der bestehenden E5-B3A-Nutzlast `jetnity.flight_event_persistence.v1` / `e5b2a_validated_snapshot`
2. Genau eine selected `optionId` wird **innerhalb** desselben `FlugProviderTreffer` gefunden
3. Jede proven Occurrence bindet `optionId + legIndex + segmentIndex + endpoint + IATA`
4. `local_date` / `local_time` kommen nur vom normalisierten selected `FlugSegment`-Endpunkt
5. `time_zone` kommt nur aus exakter E5-B1R-Evidence
6. `event_instant` kommt nur aus exakter E5-B2A-Evidence
7. `retrieved_at === observed_at === treffer.retrievedAt` nach strikter E5-B3B-Validierung
8. Kein `Date.now()`, keine zweite Observation, `fresh_until = null`
9. Keine TypeScript-`occurrence_event_ref`; SQL besitzt diese Identität
10. Roher Client-Stil wird nicht mit dem validierten Vertrag verwechselt
11. Kein Writer-, DB-, `flugNachweis`- oder Provider-Pfad

Bindende Regel:

> **One validated server-side `FlugProviderTreffer` snapshot + one exact selected option from that same snapshot + a future server-known `tripItemId` → one deterministic E5-B3A persistence payload.**  
> **Persisted does not mean provider-proven.** Der Mint schreibt nicht.

Traveller-Context-Intelligence: **nicht relevant**. Der Slice liest keine Citizenships, Dokumente oder Residence.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Baseline | `main@8868f91319f2747ca6f3dc8cb46ab0a40cba417b` |
| `origin/main` vor Docs-Handoff | `8868f91319f2747ca6f3dc8cb46ab0a40cba417b` (0 behind) |
| Merge-Base | `8868f91319f2747ca6f3dc8cb46ab0a40cba417b` |
| Pre-agent PR head | `0175d1564527f66868a84c86b8ea2ebc017efcde` |
| Runtime-Commit | `f2499d9a` |
| Ahead vor Docs-Commit | 4 Commits gegenüber `origin/main` (3 TL-Docs + 1 Runtime) |
| Draft-PR | #348 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR. Der Docs-Commit nach diesem Status verschiebt den Tip; jede frühere Exact-Head-Evidence gilt dann nur noch historisch.

## 3. Bereits umgesetzt

- `lib/flight-event-provenance/persistenz.ts`
  - `flightEventPersistenzNutzlastMinten({ tripItemId, optionId, treffer })`
  - typed Result: `ok: true` + `nutzlast` + `unresolved` **oder** `ok: false` + `fehler`
  - Snapshot-Fehler: `invalid_trip_item_id`, `selected_option_missing`, `selected_option_ambiguous`, `invalid_provider_identity`, `invalid_external_ref`, `invalid_retrieved_at`
  - Occurrence-Konflikte fail-closed ohne Payload: duplicate timezone/instant, identity mismatch, timezone/instant disagreement, invalid local wall clock
  - fehlende Evidence bleibt `ok: true` mit explizitem `unresolved_occurrence_evidence`; leere `occurrences` sind snapshot-clear-fähig
  - `retrieved_at` / `observed_at` sind der exakte E5-B3B-String; `fresh_until` ist `null`
  - `flightEventPersistenzNutzlastIstRohclient()` folgt der SQL Deny-/Allow-List 1:1
- `lib/flight-event-provenance/persistenz.test.ts`: Pflichtregressionen 1–24 plus Source-Grenzen

Nicht angefasst: `lib/flights/domain.ts`, `lib/flights/provider.ts`, `lib/flights/airport-timezone.ts`, `lib/flights/airport-event-instant.ts`, `lib/flights/duffel/*`, `lib/flights/suche.ts`, `lib/flights/client-sicht.ts`, `lib/flights/nachweis.ts`, `lib/route/*`, `lib/trips/*`, `lib/readiness/*`, `app/api/*`, `supabase/*`, `scripts/db/*`, `types/supabase.ts`, `lib/providers/*`, `lib/commercial-provenance/*`, `package.json`, `ARCHITECTURE.md`, `DECISIONS.md`.

`flugNachweisAusUmgebung()` bleibt `null`.  
`requirementsProviderAus()` bleibt `null`.

## 4. Nicht umgesetzt / bewusst nicht angefasst

- E5-B3A Production-Apply / RLS / Grant / Role / Function / Runtime-Principal
- Aufruf von `jetnity_internal.trip_item_flight_event_provenance_schreiben`
- realer Writer / Backfill / App-/API-Integration
- `flugNachweis` / Account-Adoption
- Browser-/Client-Provenance
- Trip/Route → `OfficialTemporalAnchor` Resolver
- E5-A Auto-Bindung / Deadlines / Tasks / Reminder
- Requirements-Provider / Credential-Ranking
- neue npm-Dependency / Secret / paid / live activation
- ADR/ARCHITECTURE-Nachzug (keine neue Produktentscheidung über den Task hinaus)
- `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md`
- Folgeslice

## 5. Tests / CI / Preview

Lokale Evidence dieser Session auf Runtime-Head `f2499d9a` plus nachfolgendem Docs-Commit. Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/flight-event-provenance/persistenz.test.ts` | **29/29 pass** inkl. Direkt/Multi-Segment, Option-B-Isolation, first-match-Verbot, B1R/B2A-Mismatch, Konflikte, Observation-Gleichheit, Partial/Empty, SQL-Grenzen, Rohclient-Reject |
| `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts` | **16/16 pass** |
| `lib/flights/airport-timezone.test.ts` | **4/4 pass** |
| `lib/flights/airport-event-instant.test.ts` | **22/22 pass** |
| `lib/flights/duffel/adapter.test.ts` | **16/16 pass** |
| `lib/flights/suche.test.ts` | **8/8 pass** |
| Fokus B1R/B2A/B3A/B3B + Mint | **95/95 pass** |
| `npm test` | **3044/3044 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 139 warnings** (bestehende Warnungen; die zwei Mint-Import-Warnungen wurden vor Docs entfernt) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub CI auf Runtime-Head `f2499d9a` | zum Docs-Zeitpunkt nicht als terminal behauptet |
| Vercel Preview | nicht als READY behauptet |
| GitHub Review-Threads | nicht als 0 behauptet ohne live Recheck am finalen Tip |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Scope) |

## 6. Risiken / Residuals

- Der Mint hat keinen Runtime-Caller. Das ist der Slice-Zweck, nicht ein Defekt.
- `ok: true` mit leerer/partial `occurrences` ist bewusst snapshot-clear-fähig. Ein späterer Writer darf das nicht blind persistieren, ohne eine vollständige-vs-partial Policy.
- Occurrence-Konflikte liefern `ok: false` und keine Nutzlast. First-match ist verboten.
- `retrievedAt` wird strikt als E5-B3B-Form `YYYY-MM-DDTHH:mm:ss.sssZ` gelesen. SQL akzeptiert ein breiteres Instant-Muster; der Mint erfindet keine Normalisierung und keine Jetzt-Zeit.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #348 auf dem **finalen** Head. Nicht Ready. Nicht mergen. Kein Writer / Runtime-Principal / Production-Apply / Folgeslice.
