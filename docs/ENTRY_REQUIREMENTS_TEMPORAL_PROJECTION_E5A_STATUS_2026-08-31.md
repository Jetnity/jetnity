# Entry Requirements Temporal Projection E5-A – Status

Stand: 31. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B**  
Cursor-Agent: **`Jetnity entry requirements temporal projection 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-01a057e1-e45f-79d8-a828-97be0e060415`  
Issue: [#323](https://github.com/Jetnity/jetnity/issues/323)  
Branch: `feat/entry-requirements-temporal-projection-e5a-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/324

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster provider-neutraler Folgeschritt nach E4 / R1:

1. Reiner Next-freier Projektions-Core auf bestehenden E4-Typen
2. nur explizit gebundene absolute `Z`- oder Offset-Instants
3. `before` / `at` / `after` exakt in Minuten
4. Partial fail-closed: `missing_anchor`, `invalid_instant`, `invalid_projected_window`
5. Cross-Anchor-Fenster erst nach beiden projizierten Instants; unmöglich → kein Action Window
6. `eventRef` bleibt Provenance; keine Occurrence-/Country-Auswahl

Kein echter Provider. Keine Secrets/paid calls. Keine Supabase/Auth/RLS. Keine Deadline-UI, keine Task-/Reminder-Runtime. Factory bleibt `null`.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Start-Head | `4e1af2fcd8ecc0ac147fd7b8eb6f19326f40ffc7` |
| Task-Baseline | `main@1600767be5ec87961e1d5b5e10c4bcc2f6eb51aa` |
| Implementierungs-Commit | `631f992e9a18584476bb1c19f9ce2b57781da267` |
| Finaler Branch-Tip | **nicht** im Tree self-embedded; live nach Push im PR |
| Draft-PR | #324 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

## 3. Bereits umgesetzt

- `lib/readiness/temporal-projection.ts`: Instant-Parser nur für `Z` / `±HH:MM`, UTC-Normalisierung, Anchor-genaue Bindings, Partial Issues, Action Window
- E4-Typen (`OfficialTemporalRule`, Anchors, Punkte, `dueBy`-Semantik) werden importiert, nicht kopiert
- Safety-/Flight-/Route-Domain bleiben ungekoppelt; zonenlose `YYYY-MM-DDTHH:mm` wird nicht als UTC gelesen
- Gezielte Tests in `lib/readiness/e5a-temporal-projection.test.ts` (16 Fälle inkl. Pflicht- und Adversarial-Fälle)
- ADR-0206 und knapper `ARCHITECTURE.md`-Nachzug
- `requirementsProviderAus()` bleibt `null`

## 4. Nicht umgesetzt / bewusst nicht angefasst

- Trip/Route→Event-Resolver, Country→Occurrence, Stage-/Segment-Auswahl
- IANA-Zone / Airport-/Place-Heuristik / neue Timezone-Datenbank
- `Z` an lokale Flug-/Stage-Zeiten
- Requirements-Provider-Contract oder `OfficialEvaluation`-Scope
- Workspace-Deadline-UI, `too early / upcoming / actionable / overdue`
- Task-/Completion-Persistenz, Reminder/Push/E-Mail/Notification
- Supabase / Migration / RLS / Auth / MFA / AAL
- Providerwahl, Vendorvertrag, DPA, Secrets, API Keys, paid calls
- Factory-Flip
- Credential-Ranking / „bester Pass“
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`
- E5-B / Folgeslice

## 5. Tests / CI / Preview

Lokale Evidence dieses Agenten; Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/readiness/e5a-temporal-projection.test.ts` | **16/16 pass** |
| `lib/readiness/e4-temporal-rules.test.ts` | **17/17 pass** |
| `npm test` | **2944/2944 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine neuen Errors) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub Actions / Vercel Preview | gelten nicht für einen älteren Head; live am finalen Tip prüfen |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-/Real-Device-Abnahmescope) |

## 6. Risiken / Residuals

- Ohne späteren Resolver gibt es keine automatische Trip→Event-Bindung. Das ist der Slice-Zweck, nicht ein Defekt.
- `actionWindow` ist die einzige Fenster-Wahrheit. Bei `invalid_projected_window` bleiben die einzeln gerechneten Punkte zur Provenance sichtbar, das Fenster selbst ist `null`.
- Safety-`isoZeitLesen` wurde bewusst nicht wiederverwendet: nur `Z`, Safety-Domäne, Task verbietet die Kopplung.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #324. Nicht Ready. Nicht mergen. Kein E5-B.
