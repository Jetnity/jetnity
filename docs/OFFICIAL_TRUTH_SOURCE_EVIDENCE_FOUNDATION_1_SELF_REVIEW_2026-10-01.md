# Official Truth Source/Evidence Foundation 1 — Self-Review

Date: 1 October 2026
Issue: #672
Draft PR: #673
Branch: `feat/official-truth-source-foundation-1`
Session: https://cursor.com/agents/bc-2084780a-4e8d-4334-a56a-6bfba1a65f72
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is an author self-review. It is not an independent Technical-Lead PASS.

## Scope check

| Task rule | Author finding |
| --- | --- |
| One engine, no second evaluator | Router result is always `officialResult: 'unknown'` and `evaluation: 'not_performed'`. New files do not import `lib/readiness/engine.ts`. |
| Allowlist only | Intended files are the task allowlist. `ACTIVE_WORK_STATUS.md` was left unchanged on purpose. |
| No Supabase mutation | No SQL or Supabase client. `OfficialEvidenceStore` is a type with no implementation. |
| No OpenAI/web/fetch | No such import or call. The comment that names Supabase only says this slice has no client. |
| No real government catalog | Registry starts empty. Tests use `gov.example` and `provider.example`. |
| No Timatic/Sherpa adapter | No source entry and no adapter. Classes stay distinct. |
| `requirementsProviderAus()` stays null | Asserted in the new test. `provider.ts` is not in the diff. |
| No engine/official behavior change | `engine.ts` and `official.ts` are not in the diff. URL trust reuses `quelleUrlLesen`. |
| No UI and no sensitive traveller data | No app or component files. Personal identifier keys fail closed. |
| No provider contact, terms, credentials or spend | None. |
| No Production, indexing, launch or #626 change | None. |
| Stay Draft, no follow-up slice | No Ready, no merge, no next-slice dispatch. |

## Contract choices the reviewer should see

- Subdomain matching is dot-bounded. `www.gov.example` matches registered `gov.example`. `notgov.example` does not. This is an allowlist suffix, not a fetched certificate check.
- R1 removes the citizenship × document product. One cell is one explicit credential option and carries the full citizenship set. `relatedCitizenshipCountryCode` is present only when supplied. Explicit null stays `unlinked`. Issuing country is not copied into that relation. Sort order is stability, not a preferred passport. Lookup keys are `evidence-key:v2:`.
- Coverage modes are `independent`, `exact` and `not_applicable`. Empty exact lists are invalid descriptors. Exact citizenship matches the option relation, so a CH-only source does not cover an RS-linked passport. Destination and transit lists stay separate.
- `sourceContentHash` is SHA-256 of Jetnity-normalized `sourceSnapshot`. Different `extractionNote` text does not change it. Fields `content`, `contentHash` and `sourceContentHash` on model input are rejected. A changed snapshot stays `ruleChange: 'not_asserted'`.
- Residence is explicit even though the task's example key list does not name it. A missing residence mode fails closed. A required residence is a country code, not a person. This follows the traveller-context rule that residence can change entry evidence.
- A changed hash changes `versionId` and sets `ruleChange: 'not_asserted'`. Conflict copies the accepted version and does not overwrite it. `previousVersionId` stays null unless a later explicit supersession exists. This slice has no supersession function, so versions are not auto-linked.
- Model decision fields are rejected anywhere in the input object. The candidate never carries them.
- `health` is a forbidden object key so a health record cannot hide in the key. The requirement type value `health` is unaffected because it is a value, not a key.

## Validation honesty

Local checks for the R1 correction, run before the correction commit:

- targeted source-foundation tests: 8/8 pass
- `npm run typecheck`: pass
- `npm run lint`: pass, 0 errors; 148 pre-existing warnings, none in the changed readiness files
- `npm test`: 4133 pass, 0 fail
- hygiene checks `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: pass
- `npm run check:setup:ci`: pass, with the existing missing-`.env` warning
- `npm run build`: pass, 25 static pages
- `git diff --check` and `node scripts/operating-mode-guard.mjs`: pass

`auth:pruefen` was not run locally. This environment has no Supabase auth secrets.

Earlier remote gates stay historical. `3d1b7aed5d165a1391f3e34a0a5da0fb2b3369a1` had CI `36845062197`. Technical-Lead R1 read CI `36845583718`, Auth job `110314809182` and Vercel Preview `dpl_7xsiZ8x62WCCTnbz462chMLJYMqQ` on `59d43f4ccc2e4434401596f0b7b4b7c8162719d8` only. None of those apply to the correction head. This self-review does not claim a GitHub CI, Auth job or Vercel Preview for the correction head. A green parent or `main` gate is not a gate for it.

No browser verification applies. This slice has no UI.

## Residual risk

The contract can be bypassed by a later caller that writes an accepted-shaped object without `evidenceKandidatAkzeptieren`, if that caller also satisfies the registry and hash checks. `akzeptierteEvidenceLesen` still re-checks lifecycle, validation state, URL registration and the recomputed key. It does not prove who constructed the object. A later persistence slice must treat only server-side acceptance as writable.

The router does not know real coverage. An empty registry is unknown, not permission to travel. That is intentional.

Cursor does not Ready or merge.
