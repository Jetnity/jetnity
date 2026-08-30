# Requirements Truth-Ops S4-R1 – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity requirements truth ops 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-49df8304-48ed-4820-bdf4-57f53aa1aaee`  
Issue: [#292](https://github.com/Jetnity/jetnity/issues/292)  
Branch: `feat/requirements-truth-ops-s4-r1-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/293

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/REQUIREMENTS_TRUTH_OPS_S4_R1_TASK_2026-08-31.md`
2. `docs/REQUIREMENTS_TRUTH_OPS_S4_R1_STATUS_2026-08-31.md`
3. `docs/REQUIREMENTS_TRUTH_OPS_S4_R1_SELF_REVIEW_2026-08-31.md`
4. ADR-0200 in `DECISIONS.md`
5. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md` (G-S4-TIMEOUT / KILLSWITCH / OUTCOME / TTL)

## Was ein neuer Chat wissen muss

S4-R1 aktiviert **keinen** Provider. Es schliesst die Jetnity-seitige Ops-Naht, bevor irgendjemand einen Regulatory-HTTP-Call verdrahten darf.

Harte Wahrheiten:

1. `evaluate(anfrage, signal)` ist Pflicht. Späterer Adapter muss `signal` in den bestehenden Provider Transport Core legen. Kein zweiter Fetch-Stack.
2. Domain-Timeout ist 4.000 ms, gekappt, nicht aus Client-Input unbounded. Timeout abortet den Provider, statt nur `Promise.race` ohne Cancellation.
3. Bereits abgebrochenes `req.signal` startet keinen Provider-Call.
4. Intern: `timeout` | `aborted` | `temporarily_unavailable` | `unavailable`. Öffentlich: Timeout/Abort/transient → `source_temporarily_unavailable`; unavailable / kein Provider / Kill-Switch → `provider_unavailable`.
5. Keine Hard Truth aus Fehlern. Keine Raw-Vendor-/Secret-Werte in Evidence oder HTTP-Antwort.
6. `JETNITY_READINESS_AKTIV` über `providerOpsZustand`. Production hart aus. Zugang nur bei vorhandenem Provider-Objekt. Factory bleibt `null`.
7. `checkedAt` = Jetnity Retrieval-/Evaluation-Zeit. Nicht Vendor-`lastUpdatedAt`. Alter ≥ 60 min → `recheck_needed`.
8. Traveller-Invariants unverändert: kein Default-Pass, keine Default-Citizenship, Issuer ≠ Citizenship, kein `documents[0]` / `evaluations[0]`.
9. Generation 1 arbeitet nur diesen Slice/PR. Review-Fixes bleiben dieselbe Session.

## Dateien ausserhalb der Task-Liste – Begründung

| Datei | Warum |
| --- | --- |
| `lib/readiness/abruf.ts` | kleine Abort-/Timeout-Naht; verhindert, dass `engine.ts` HTTP-Cancellation und Official-Mapping vermischt; kein zweiter HTTP-Stack |
| `lib/readiness/zustand.test.ts` | geforderte Kill-Switch-Acceptance |
| `lib/readiness/s4-r1-truth-ops.test.ts` | geforderte Timeout/Abort/TTL/Failure-Acceptance |
| `DECISIONS.md` ADR-0200 | AGENTS.md verlangt dokumentierte Architekturentscheidung |
| `.env.example` | Flag-Entdeckbarkeit analog anderer Domain-Flags; Default bleibt aus, kein Secret |

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, ROADMAP, ARCHITECTURE, Vision, Continuity, Migrationen, Auth.

## Residuals

- Lokale Gates dieses Agenten: `npm test` 2834/2834, Typecheck, Lint 0/137, Production-Build, Hygiene. CI/Vercel müssen am Exact Head live gelesen werden.
- Kein Browser-/Real-Device-Beweis; Slice ist server-/domainseitig.
- Safety/Seasonal haben weiter optionales Signal und kein Domain-Flag; das ist nicht S4-R1.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review. Nicht Ready. Nicht mergen. Kein S4-R2/Adapter-Start.
