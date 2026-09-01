# S4 Residual – Multi-Document Parser Order Independence Handoff

Stand: 1. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN S6**  
Logical agent: **`Jetnity S4 multi-document parser order independence 1`**  
Generation: **1**  
Cursor session: `bc-aae0f830-3be2-49d7-897e-ffc7407dcf01`  
Parent issue: [#370](https://github.com/Jetnity/jetnity/issues/370)  
Parent S4 closure: [#365](https://github.com/Jetnity/jetnity/issues/365)  
Draft-PR: https://github.com/Jetnity/jetnity/pull/371

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

---

## Zuerst lesen

1. `docs/S4_TRAVELLER_MULTIDOCUMENT_ORDER_INDEPENDENCE_TASK_2026-09-01.md`
2. `docs/S4_TRAVELLER_MULTIDOCUMENT_ORDER_INDEPENDENCE_STATUS_2026-09-01.md`
3. `docs/S4_TRAVELLER_MULTIDOCUMENT_ORDER_INDEPENDENCE_SELF_REVIEW_2026-09-01.md`
4. Issue #370
5. Parent S4 closure #365 / Agent-B audit classification of this defect

Do **not** treat `docs/ACTIVE_WORK_STATUS.md` as this slice’s live handoff. Do not edit Active Work or Start Here.

---

## What a new chat must know

This is **SINGLE_AGENT** Generation 1. One central Traveller parser truth boundary.

Defect: `travellerAnfrageStriktLesen` validated documents, called `travellerLegacyLesen` (which sorts), then compared `gelesen.documents[index].citizenshipClientRef` with `documentStrikt(documentsRoh[index])`. A valid mixed `passport` + `national_id` set with correct citizenship links could return `null` only because sort order ≠ input order.

Fix: keep the existing strict child validation. After normalization, look up the already-validated source by `clientRef` and compare that document’s `citizenshipClientRef`. Unmatched / duplicate identity fails closed. No second normalizer. No inferred citizenship. No primary/preferred credential.

Local evidence on implementation commit `382c31ea`, plus exact-head gates on docs tip `2d8a884e`:

- targeted parser tests 23/23
- `npm test` 3067/3067
- typecheck, lint (0 errors), production build, CI hygiene scripts all passed locally
- GitHub CI **SUCCESS** on `2d8a884e`: [run 33458244777](https://github.com/Jetnity/jetnity/actions/runs/33458244777)
- Vercel Preview **SUCCESS** on `2d8a884e`: [9qZQSn7mndoYMgf7qSfcP876CqxT](https://vercel.com/jetnity-e1b93c82/jetnity-app/9qZQSn7mndoYMgf7qSfcP876CqxT)

This evidence follow-up commit cannot carry its own SHA. Technical Lead reviews the live tip and re-checks its gates.

---

## Files

| File | Role |
| --- | --- |
| `lib/readiness/traveller-anfrage.ts` | runtime owner: identity-based citizenship-link check |
| `lib/readiness/traveller-anfrage.test.ts` | direct acceptance tests |
| `docs/S4_TRAVELLER_MULTIDOCUMENT_ORDER_INDEPENDENCE_TASK_2026-09-01.md` | binding task (pre-agent) |
| `docs/S4_TRAVELLER_MULTIDOCUMENT_ORDER_INDEPENDENCE_STATUS_2026-09-01.md` | this-slice status |
| `docs/S4_TRAVELLER_MULTIDOCUMENT_ORDER_INDEPENDENCE_SELF_REVIEW_2026-09-01.md` | this agent, not TL-PASS |
| this handoff | continuity |

Unique commits vs current main should be the task doc + this runtime/test/docs set only.

---

## Transport at handoff write

| Item | Value |
| --- | --- |
| Task baseline | `6dc5a153d1dd7b934f2f23db5a19fbd89a3a1663` |
| Exact pre-agent head | `ace5fb47559d4d2ef6e55dbf5ab36a73950ea1b4` |
| Implementation | `382c31eabeea1e88d0daab371e5ba09da46df4e3` |
| Evidence tip with CI/Preview | `2d8a884e355b4a12ec941ed5dc3dd01c05771984` |
| Final head | **read live on PR #371** |
| Behind main | **0** at reconstruct; re-check live |
| Draft | stays Draft |

---

## Residuals left for Technical Lead

- Exact-head review of Draft-PR #371 (code, tests, CI, Vercel, review threads)
- Cursor must not Ready or merge
- After merge/post-merge verification: fresh S4 final closure/recheck on #365
- S6 remains blocked until S4 is canonically closed
- Out of scope residual: Guest `travellerLegacyLesen` still nulls unknown citizenship refs; strict API already rejects them

---

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #371.

Nicht Ready. Nicht mergen. Kein S6. Kein Folgeslice aus dieser Session.
