# Entry Requirements E5-B2A – Ephemeral Airport Event Instant – Status

Stand: 31. August 2026  
Status: **IMPLEMENTATION DELIVERED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B2B**  
Cursor-Agent: **`Jetnity entry requirements airport event instant 1`**, Generation 1  
Session: `bc-2f16caec-271e-4911-ac36-5abc36ab0806`  
Issue: [#334](https://github.com/Jetnity/jetnity/issues/334)  
Parent: [#294](https://github.com/Jetnity/jetnity/issues/294)  
Branch: `feat/entry-requirements-airport-event-instant-e5b2a-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/335

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster sicherer Brückenbaustein nach geschlossenem E5-B1R:

1. Lokale Segment-Wanduhr + exakte E5-B1R-`FlugAirportTimezoneEvidence` → genau ein kanonischer UTC-Instant oder explizites fail-closed Problem
2. Ergebnis bleibt flüchtige Companion-Evidence am aktiven `FlugProviderTreffer`
3. Identity wird vor Resolution gegen Option + Leg + Segment + `departure|arrival` + IATA revalidiert
4. DST-Lücke und DST-Overlap erzeugen keinen Instant und wählen niemals earlier/later/compatible
5. `fluegeSuchen()` reicht weder Timezone- noch Event-Instant-Evidence an Ranking oder Browser
6. `FlugOption` / `FlugSegment` / Client-Contract bleiben timezone- und instant-frei
7. Keine neue npm-Dependency

Bindende Regel:

> **Persisted does not mean provider-proven.**

Traveller-Context-Intelligence: **nicht relevant**. Der Slice liest keine Citizenships, Dokumente oder Residence.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Baseline | `main@f7ccdc5b98ce933b06c216135be7c4f4b08f8222` |
| `origin/main` vor Docs-Handoff | `f7ccdc5b98ce933b06c216135be7c4f4b08f8222` (0 behind) |
| Merge-Base | `f7ccdc5b98ce933b06c216135be7c4f4b08f8222` |
| Ahead vor Docs-Commit | 4 Commits gegenüber `origin/main` (3 TL-Docs + 1 Runtime) |
| Runtime-Commit | `3d6450413ac604f02b9a0e3c2a445ff0e6cc9fd7` |
| Draft-PR | #335 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR. Der Docs-Commit nach diesem Status verschiebt den Tip; jede frühere Exact-Head-Evidence gilt dann nur noch historisch.

## 3. Bereits umgesetzt

- `lib/flights/provider.ts`: `FlugAirportEventInstantEvidence`, Issue-Arten, Pflichtfelder `airportEventInstantEvidence` / `airportEventInstantIssues` am `FlugProviderTreffer`
- `lib/flights/airport-event-instant.ts`: bounded `Intl`-Resolver ohne Date.parse, ohne `Z`-Anhängen, ohne Server-TZ, ohne IATA-Inferenz
- `lib/flights/duffel/adapter.ts`: Resolution nur für behaltene Optionen nach dem Angebots-Cap
- `lib/flights/suche.ts`: beide Evidence-Arten bleiben bewusst ungenutzt vor Ranking/`sucheFuerClient()`
- Test-Fakes erfüllen den erweiterten Contract mit frischen leeren Arrays
- Pflichtregressionen für Winter/Sommer, Kathmandu/Chatham, Zurich- und Lord-Howe-DST, ungültiges Datum/Zeit, Server-TZ, Identity-Mismatches, Departure/Arrival-Trennung, Multi-Segment, Reordering/Ranking, Offer-Cap, Option-Erhalt, Browser-No-Leak

Nicht angefasst: `lib/flights/domain.ts`, `lib/flights/schema.ts` (nur Test), `lib/flights/client-sicht.ts`, `lib/flights/zeit.ts`, `lib/readiness/temporal-projection.ts`, `lib/route/*`, `lib/trips/*`, `supabase/*`, `scripts/db/*`, `lib/providers/*`, `package.json`.

`requirementsProviderAus()` bleibt `null`.

## 4. Nicht umgesetzt / bewusst nicht angefasst

- Timezone/Instant in `FlugSegment` / `FlugOption` / Client-/Browser-Antwort
- Persistenz, Supabase, RLS, Trigger, Grants
- Trip/Route→OfficialTemporalAnchor Resolver
- E5-A Auto-Bindung / `temporalRuleProjizieren()`
- `flugNachweis` / Account-Adoption
- Deadline / Tasks / Reminder / Notifications
- neuer Provider / Secret / paid call / Live-Aktivierung
- Credential Ranking
- E5-B2B oder anderer Folgeslice
- ADR/ARCHITECTURE-Nachzug (keine neue Produktentscheidung über den Task hinaus)
- `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md`

## 5. Tests / CI / Preview

Lokale Evidence dieser Session auf Runtime-Head `3d645041...` plus nachfolgendem Docs-Commit. Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/flights/airport-event-instant.test.ts` | **22/22 pass** |
| `lib/flights/airport-timezone.test.ts` | **4/4 pass** |
| `lib/flights/duffel/mapping.test.ts` | **20/20 pass** |
| `lib/flights/duffel/adapter.test.ts` | **8/8 pass** inkl. Offer-Cap und unauflösbarer Instant |
| `lib/flights/suche.test.ts` | **6/6 pass** inkl. Browser-No-Leak für Timezone und Instant |
| `lib/flights/schema.test.ts` | Extra-Timezone-/Instant-Felder werden gestrippt |
| `npm test` | **2989/2989 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine in den geänderten Dateien) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub CI auf Runtime-Head `3d645041` | Run `33417520356`: Typecheck/Lint/Build SUCCESS, Auth SUCCESS |
| Vercel Preview auf Runtime-Head `3d645041` | READY / SUCCESS `8vX8UxDkJ1T6kVcXvV1tXnnXyjRf` |
| GitHub Review-Threads | 0 |
| Vercel unresolved Feedback | 0 |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Scope) |

## 6. Risiken / Residuals

- Event-Instant-Evidence wird in E5-B2A nirgends an E5-A gebunden. Das ist der Slice-Zweck, nicht ein Defekt.
- Eine reale lokale Zeit in einer DST-Overlap-Stunde bleibt bewusst ohne Instant. Duffel-Offsets in `departing_at`/`arriving_at` werden weiterhin nur als lokale Zeichenkette gelesen und nicht als zweite Truth-Quelle benutzt.
- Identifier- und Offset-Beobachtung hängen an der Plattform-`Intl`-tzdb. Keine eigene Timezone-Datenbank und keine neue Library.
- Evidence-Objekte sind mutierbar. Es gibt kein Shared-Empty-Singleton; die leeren Helper erzeugen pro Aufruf neue Arrays.
- Persistente server-owned Timezone/Event-Provenance bleibt ein späterer eigener DB-/Security-/PO-gegateter Slice.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #335 auf dem **finalen** Head. Nicht Ready. Nicht mergen. Kein E5-B2B/Folgeslice.
