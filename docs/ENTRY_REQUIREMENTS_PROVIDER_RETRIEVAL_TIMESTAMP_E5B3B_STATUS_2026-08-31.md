# Entry Requirements E5-B3B – Server-observed Provider Retrieval Timestamp – Status

Stand: 31. August 2026  
Status: **IMPLEMENTATION DELIVERED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B3C**  
Cursor-Agent: **`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1  
Session: `bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`  
Issue: [#343](https://github.com/Jetnity/jetnity/issues/343)  
Parent: [#294](https://github.com/Jetnity/jetnity/issues/294)  
Branch: `feat/entry-requirements-provider-retrieval-time-e5b3b-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/344

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster sicherer Brückenbaustein nach geschlossenem E5-B3A:

1. `FlugProviderTreffer` trägt einen **required** server-only Retrieval-Timestamp `retrievedAt: string`
2. Semantik: Jetnity-Serverzeit des erfolgreich gelesenen Provider-Snapshots, kanonisches UTC-ISO mit `Z`
3. Der aktive Duffel-Adapter mintet den Wert erst nach erfolgreicher HTTP-Antwort **und** erfolgreichem JSON-Lesen
4. Der Wert kommt nicht aus Duffel-/Browser-Payload, auch wenn dort ähnlich benannte Felder stehen
5. `fluegeSuchen()` reicht `retrievedAt` weder an Ranking noch an die Browser-Antwort
6. `FlugOption` / `FlugSegment` / Client-/Route-/Trip-Verträge bleiben unverändert
7. Kein Persistenz-Mint, kein DB-Writer, kein `flugNachweis`, keine Provider-Aktivierung

Bindende Regel:

> **Persisted does not mean provider-proven.**  
> Server-observed ≠ provider-supplied. `retrievedAt` ist Observation-Zeit, keine Freshness-/Availability-Garantie.

Traveller-Context-Intelligence: **nicht relevant**. Der Slice liest keine Citizenships, Dokumente oder Residence.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Baseline | `main@ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8` |
| `origin/main` vor Docs-Handoff | `ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8` (0 behind) |
| Merge-Base | `ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8` |
| Pre-agent PR head | `d3baa9c7efb5f9ef8ba658b953d752cf6adc130c` |
| Runtime-Commit | `09d5c0e0b46e6cdbb8e08459fe953cbb54f0c433` |
| Ahead vor Docs-Commit | 4 Commits gegenüber `origin/main` (3 TL-Docs + 1 Runtime) |
| Draft-PR | #344 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR. Der Docs-Commit nach diesem Status verschiebt den Tip; jede frühere Exact-Head-Evidence gilt dann nur noch historisch.

## 3. Bereits umgesetzt

- `lib/flights/provider.ts`: Pflichtfeld `retrievedAt: string` am `FlugProviderTreffer`. Kein `retrievedAt?:` / `string | null`.
- `lib/flights/duffel/adapter.ts`: injizierbarer Clock-Port `DuffelAdapterUhr` als dritter optionaler Parameter; Default `() => new Date()`. Mint erst nach erfolgreichem `json()`. Canonicalisierung über `Date.toISOString()` plus Muster `YYYY-MM-DDTHH:mm:ss.sssZ`.
- `lib/flights/suche.ts`: bestehender Discard-Pfad bleibt bindend; Kommentar um E5-B3B ergänzt. Ranking bekommt weiter nur `treffer.options`.
- Fake/Test-Provider in `lib/flights/suche.test.ts` erfüllen den required Vertrag explizit mit `2026-08-31T12:00:00.000Z`.
- Pflichtregressionen für Clock-Determinismus, Payload-No-Trust, HTTP 500/401/403/Timeout, unlesbares JSON, invalid Mapping ohne Treffer, leere Evidence, Angebots-Cap, E5-B1R/E5-B2A Evidence, Ranking-only-options, serialisierte Browser-No-Leak.

Nicht angefasst: `lib/flights/domain.ts`, `lib/flights/schema.ts` (nur Test), `lib/flights/client-sicht.ts`, `lib/flights/duffel/factory.ts`, `lib/flights/airport-event-instant.ts`, `lib/route/*`, `lib/trips/*`, `lib/readiness/*`, `app/api/*`, `supabase/*`, `scripts/db/*`, `types/supabase.ts`, `lib/providers/*`, `lib/commercial-provenance/*`, `package.json`.

`flugNachweisAusUmgebung()` bleibt `null`.  
`requirementsProviderAus()` bleibt `null`.

## 4. Nicht umgesetzt / bewusst nicht angefasst

- E5-B3A Production-Apply / RLS / Grant / Role / Function / Runtime-Principal
- TypeScript-Mint `jetnity.flight_event_persistence.v1` / `e5b2a_validated_snapshot`
- realer Writer / Backfill
- `flugNachweis` / Account-Adoption
- Retrieval-/Observation-Felder in `FlugOption` / `FlugSegment` / Browser / Route / Trip-Metadata
- E5-A Auto-Bindung / Deadlines / Tasks / Reminder
- Requirements-Provider / Credential-Ranking
- zweiter Provider unter `lib/providers/*`
- neue npm-Dependency / Secret / paid / live activation
- ADR/ARCHITECTURE-Nachzug (keine neue Produktentscheidung über den Task hinaus)
- `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md`
- Folgeslice

## 5. Tests / CI / Preview

Lokale Evidence dieser Session auf Runtime-Head `09d5c0e0...` plus nachfolgendem Docs-Commit. Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/flights/duffel/adapter.test.ts` | **16/16 pass** inkl. Clock, Payload-No-Trust, 403, unlesbares JSON, Cap, leere Evidence |
| `lib/flights/suche.test.ts` | **8/8 pass** inkl. serialisierte No-Leak für `retrievedAt` / `retrieved_at` / `observedAt` / `observed_at` |
| `lib/flights/schema.test.ts` | Extra-Retrieval-/Observation-Felder werden von `flugOptionLesen` gestrippt |
| `lib/flight-event-provenance/e5b3a-persistenz-vertrag.test.ts` | **16/16 pass** (Repo-Vertrag unverändert) |
| `npm test` | **3015/3015 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine in den geänderten Dateien) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub CI auf Runtime-Head `09d5c0e0` | zum Docs-Zeitpunkt noch nicht terminal; Exact-Head-Gates am finalen Tip |
| Vercel Preview | nicht als READY behauptet |
| GitHub Review-Threads | 0 zum Docs-Zeitpunkt |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Scope) |

## 6. Risiken / Residuals

- `retrievedAt` hat in E5-B3B keinen Persistenz-Konsumenten. Das ist der Slice-Zweck, nicht ein Defekt.
- Die Observation-Zeit hängt an der Host-Uhr. Es gibt keinen NTP-Check und keine zweite Time-Quelle.
- `Date.toISOString()` liefert Millisekunden. E5-B3A akzeptiert `timestamptz`; ein späterer Mint darf daraus keinen zweiten Zeitpunkt erfinden.
- Evidence-Objekte bleiben mutierbar. Es gibt kein Deep-Freeze; das war nicht verlangt.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #344 auf dem **finalen** Head. Nicht Ready. Nicht mergen. Kein Persistence-Mint / kein Folgeslice.
