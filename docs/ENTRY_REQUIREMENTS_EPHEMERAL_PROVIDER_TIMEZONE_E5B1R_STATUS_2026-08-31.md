# Entry Requirements E5-B1R – Ephemeral Provider Timezone Evidence – Status

Stand: 31. August 2026  
Status: **IMPLEMENTATION DELIVERED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B2**  
Cursor-Agent: **`Jetnity entry requirements provider timezone evidence 1`**, Generation 1  
Session: `bc-cc301dee-cb64-42b9-a6e9-9968f3db8a09`  
Issue: [#330](https://github.com/Jetnity/jetnity/issues/330)  
Parent: [#294](https://github.com/Jetnity/jetnity/issues/294)  
Branch: `feat/entry-requirements-ephemeral-timezone-evidence-e5b1r-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/331

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` wurde nicht verändert. PR #328 wurde nicht cherry-picked.

---

## 1. Arbeitsblock / Ziel

Kleinster sicherer Recut nach dem verworfenen E5-B1-Ansatz #327/#328:

1. Provider-neutraler Companion-Contract am aktiven `FlugProviderTreffer`
2. Evidence nur flüchtig, immer als Array, gebunden an finale `option.id` + Leg + Segment + `departure|arrival` + IATA
3. Duffel mintet ausschließlich aus dem strukturierten Airport-Objekt und dessen explizitem `time_zone`
4. Identifier-Validierung ohne Ortszeit→UTC, ohne DST, ohne IATA-/Ort-Inferenz
5. Search verwirft Evidence vor Ranking und Browser-Antwort
6. `FlugOption` / `FlugSegment` / Client-Contract bleiben timezone-frei

Bindende Regel:

> **Persisted does not mean provider-proven.**

Dieser Slice bleibt vor jeder Persistenzgrenze.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Baseline | `main@7fdd06f983a47afbbb28313479adf4e81fb9a359` |
| `origin/main` vor Handoff | `7fdd06f983a47afbbb28313479adf4e81fb9a359` (0 behind) |
| Merge-Base | `7fdd06f983a47afbbb28313479adf4e81fb9a359` |
| Ahead | 4 Commits gegenüber `origin/main` vor dem Docs-Commit; finaler Tip live im PR |
| Runtime-Commit | `f4ac80a2bc495be677c91354fea4bc5ddf751d7d` |
| Draft-PR | #331 bleibt Draft |
| Verworfener #328-Head | `fdf05f26928dfc556cc3b3b954eb3c61981b29c4` ist **kein** Ancestor |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

## 3. Bereits umgesetzt

- `lib/flights/provider.ts`: `FlugAirportTimezoneEvidence` + Pflichtfeld `airportTimezoneEvidence: []` am `FlugProviderTreffer`
- `lib/flights/airport-timezone.ts`: bounded Identifier-Reader (`Intl.DateTimeFormat` nur als Erkennung, kein Rewrite)
- `lib/flights/duffel/antwort.ts`: optionales untrusted `time_zone` nur am strukturierten Airport-Objekt
- `lib/flights/duffel/mapping.ts`: `duffelAngebotMappen()` bleibt `FlugOption \| null`; intern richer mapping; `duffelAntwortMappen()` trägt Evidence
- `lib/flights/duffel/adapter.ts`: Evidence folgt den behaltenen Option-IDs nach dem Angebots-Cap
- `lib/flights/suche.ts`: Evidence wird bewusst nicht an Ranking/`sucheFuerClient()` gegeben
- Test-Fakes geben ein explizites leeres Evidence-Array zurück
- Pflichtregressionen für Minting, Reject, Multi-Leg/Segment, Ranking-Bindung, Shape, Schema-Strip und Browser-No-Leak

Nicht angefasst: `lib/flights/domain.ts`, `lib/flights/schema.ts` (nur Test), `lib/flights/client-sicht.ts`, `lib/route/*`, `lib/trips/*`, `supabase/*`, `scripts/db/*`, `lib/providers/*`.

`requirementsProviderAus()` bleibt `null`.

## 4. Nicht umgesetzt / bewusst nicht angefasst

- Timezone in `FlugSegment` / `FlugOption` / Client-/Browser-Antwort
- Persistenz, Supabase, RLS, Trigger, Grants
- UTC-/DST-Resolver, Event-Occurrence-Resolver, E5-A Auto-Bindung
- `flugNachweis` / Account-Adoption
- Deadline / Tasks / Reminder / Notifications
- neuer Provider / Secret / paid call / Live-Aktivierung
- Credential Ranking
- E5-B2 oder anderer Folgeslice
- ADR/ARCHITECTURE-Nachzug (keine neue Produktentscheidung über den Task hinaus)
- `docs/ACTIVE_WORK_STATUS.md`

## 5. Tests / CI / Preview

Lokale Evidence dieser Session auf Runtime-Head `f4ac80a2...` plus nachfolgendem Docs-Commit. Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/flights/airport-timezone.test.ts` | **4/4 pass** |
| `lib/flights/duffel/mapping.test.ts` | **20/20 pass** (9 Bestand + 11 Evidence) |
| `lib/flights/duffel/adapter.test.ts` | **6/6 pass** |
| `lib/flights/suche.test.ts` | **6/6 pass** inkl. Browser-No-Leak |
| `lib/flights/schema.test.ts` | Extra-Timezone-Felder werden gestrippt |
| `npm test` | **2965/2965 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine neuen Errors in geänderten Dateien) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub Actions / Vercel Preview | gelten nicht für einen älteren Head; live am finalen Tip prüfen |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Scope) |

## 6. Risiken / Residuals

- Evidence ist flüchtig und wird in E5-B1R nirgends konsumiert. Das ist der Slice-Zweck, nicht ein Defekt.
- `airportTimezoneEvidence` ist ein gewöhnliches mutierbares Array. Es gibt kein Shared-Empty-Singleton; `leereFlugAirportTimezoneEvidence()` liefert pro Aufruf ein neues Array.
- Identifier-Validierung hängt an der Plattform-`Intl`-tzdb. Keine eigene Timezone-Datenbank.
- Persistente server-owned Timezone/Event-Provenance bleibt ein späterer eigener DB-/Security-/PO-gegateter Slice.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #331 auf dem **finalen** Head. Nicht Ready. Nicht mergen. Kein E5-B2/Folgeslice.
