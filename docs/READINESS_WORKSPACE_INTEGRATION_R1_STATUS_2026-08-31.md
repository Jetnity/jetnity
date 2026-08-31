# Readiness Workspace Integration R1 – Status

Stand: 31. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity readiness workspace integration 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-5bb53c9a-e6bf-4189-bd4f-bb2dc1f6eda3`  
Issue: [#319](https://github.com/Jetnity/jetnity/issues/319)  
Branch: `feat/readiness-workspace-integration-r1-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/320

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster Presentation-Slice nach E4-Closure und Duplicate-/Integration-Precheck:

1. keine parallelen groben `entry_check` / `visa_check` / `travel_document_check` / `insurance_check` Karten neben Official Requirements
2. Ticket-/Booking-/Custom-Preparation sichtbar und bedienbar lassen
3. sichtbare persönliche Counts nur aus sichtbar gerenderten persönlichen Tasks
4. reine fail-closed Placeholder pro Traveller × Credential-Option × Destination/Transit kompakt
5. konkrete/current/stale/recheck/evidence-bearing Official Rows lossless einzeln

Kein neuer Readiness-Lifecycle. Kein Provider. Keine Secrets/paid calls. Keine Supabase/Auth/RLS. Keine Deadline-/Reminder-Runtime. Factory bleibt `null`.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Start-Head | `42b4aa6c6422bc4b6a0e10a7ea79e80dac90d082` |
| Task-Baseline | `main@32332d850784b586cc4173463a1e77e1ba27baf0` |
| Finaler Branch-Tip | **nicht** im Tree self-embedded; live nach Push im PR |
| Draft-PR | #320 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

## 3. Bereits umgesetzt

- `officialChecklist()` kollabiert nur reine leere Placeholder; konkrete Rows bleiben 1:1
- kompakter Titel `Einreiseanforderungen noch nicht prüfbar` inkl. Missing-Facts-/Provider-Unavailable-Copy
- Workspace-Filter in `lib/readiness/workspace-presentation.ts`; UI nutzt ihn nur in `Reisevorbereitung`
- `readinessAnsicht()`, `ableitung.ts` und TW-4 Attention unverändert
- ADR-0205, Architektur- und Travel-Readiness-Presentation nachgezogen
- gezielte Tests in `lib/readiness/workspace-integration-r1.test.ts` (13 Pflichtregressionen + 2 Zusatzinvarianten)

## 4. Hard Non-Scope – eingehalten

- keine Migration / Supabase / RLS / Ownership / Auth / AAL
- kein Official-Requirement Task-Persistenzmodell
- kein Provider / Vertrag / Secrets / paid calls
- `requirementsProviderAus()` bleibt `null`
- keine Deadline-Timestamp-Projektion, keine Reminder-Runtime
- kein Credential-Ranking
- `docs/ACTIVE_WORK_STATUS.md` nicht geändert
- kein Ready, kein Merge, kein Folgeslice

## 5. Lokale Gates (dieser Agent, nach Delivery)

| Gate | Ergebnis |
| --- | --- |
| gezielte R1 + E3 + E4 Tests | grün |
| `npm test` | **2928/2928** |
| `npm run typecheck` | grün |
| `npm run lint` | **0 errors / 137 warnings** (Baseline unverändert) |
| `npm run build` | Production-Build grün |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | grün |

CI/Vercel müssen live am Exact Head geprüft werden. Kein Browser-/Real-Device-Abnahmebeweis.

## 6. Residuals

- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.
- Attention zählt weiter die Domain-Summary, nicht die workspace-sichtbaren Counts.
