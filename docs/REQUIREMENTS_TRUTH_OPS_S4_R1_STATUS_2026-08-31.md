# Requirements Truth-Ops S4-R1 – Status

Stand: 31. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity requirements truth ops 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-49df8304-48ed-4820-bdf4-57f53aa1aaee`  
Issue: [#292](https://github.com/Jetnity/jetnity/issues/292)  
Branch: `feat/requirements-truth-ops-s4-r1-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/293

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` wurde nicht verändert.

---

## 1. Arbeitsblock / Ziel

Provider-neutrale Truth-/Ops-Sicherheitsnaht zwischen der bestehenden Requirements/Official-Truth-Engine und einem späteren echten Provider:

1. Pflicht-`AbortSignal` am Provider-Port
2. Domain-Hard-Timeout 4.000 ms mit Cancellation
3. intern unterscheidbare technische Failure-Arten
4. Readiness-Kill-Switch `JETNITY_READINESS_AKTIV`
5. globaler 60-Minuten-`checkedAt`-Ceiling
6. Tests und dauerhafte Evidence

Kein Vendor. Keine Providerwahl. Keine Secrets. Keine paid/echten Calls. Factory bleibt `null`.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Start-Head | `454cfc33926b8e9438ef1a870ae83104f47c8e5a` |
| Task-Baseline | `main@67f54135957cf09e39585a8cff662ecc3645b39a` |
| Finaler Branch-Tip | **nicht** im Tree self-embedded; live nach Push im PR |
| Draft-PR | #293 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |

## 3. Bereits umgesetzt

- `RequirementsProvider.evaluate(anfrage, signal: AbortSignal)`
- `lib/readiness/abruf.ts`: kombinierter Timeout-`AbortController` + optionales Aussensignal; bereits abgebrochenes Signal startet keinen Call
- Engine mappt Timeout/Abort/transient → `source_temporarily_unavailable`; grundsätzliches `unavailable` → `provider_unavailable`
- `lib/readiness/zustand.ts` auf `providerOpsZustand`; Production hart aus
- Route: `req.signal` + `requirementsProviderNachZustand(requirementsProviderAus())`; `maxDuration = 10` unverändert
- Provider-Ops-Board Readiness-Zeile nutzt `readinessZustand()` statt dauerhaft `zugangVorhanden: false`
- `officialFrische()`: 60-Minuten-Ceiling; `checkedAt` ≠ Vendor-`lastUpdatedAt`; Exact-Grenze fail closed (`>=`)
- `requirementsProviderAus()` bleibt `null`
- Traveller-/Multi-Citizenship-/Multi-Document-Invariants unverändert
- Gezielte Tests in `lib/readiness/s4-r1-truth-ops.test.ts` und `lib/readiness/zustand.test.ts`

## 4. Nicht umgesetzt / bewusst nicht angefasst

- echter Timatic-/Sherpa-/anderer Vendor-Adapter
- Factory-Flip, Workspace-Live-Wiring, Commercial Writer, `live_api`, `persisted_snapshot`
- Supabase / Migration / RLS / Auth / MFA / AAL
- Secrets, Verträge, paid calls, Legal Copy, neue Kosten
- Safety-/Seasonal-Kill-Switch (ausserhalb S4-R1)
- `docs/ACTIVE_WORK_STATUS.md`, ROADMAP, ARCHITECTURE, globale Current-State-Dateien

## 5. Tests / CI / Preview

Lokale Evidence dieses Agenten; Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/readiness/s4-r1-truth-ops.test.ts` | **14/14 pass** |
| `lib/readiness/zustand.test.ts` | **5/5 pass** |
| `lib/readiness/engine.test.ts` | **45/45 pass** (Engine + P2-TA-06) |
| `npm test` | **2834/2834 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine neuen Errors) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub Actions / Vercel Preview | gelten nicht für einen älteren Head; live am finalen Tip prüfen |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Slice) |

## 6. Risiken / Residuals

- Factory `null` bleibt die wirksame Preview/Production-Bremse. Der Kill-Switch ist die zweite Naht für einen späteren Factory-Flip.
- Ein Adapter, der `AbortSignal` ignoriert, wird trotzdem nach ≤ 4 s fail closed; der hängende Promise wird nicht als Hard Truth verwendet.
- `checkedAt`-Ceiling ist global 60 min. Provider-spezifisch strenger ist ein späterer Slice.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #293. Nicht Ready. Nicht mergen. Kein Folgeslice.
