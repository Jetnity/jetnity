# Official Truth content identity R2 wiring 1 — Report

Date: 4 October 2026 (Europe/Zurich). Issue #814 / Draft PR #815 / Generation 1.
Logical writer: **Jetnity Official Truth coordinated content identity wiring R2**.
Branch: `feat/official-truth-content-identity-r2-wiring-1`.
Baseline: `30aa083dc752bf499dfc5a09448d06bd36d3ba64`.
Immutable dispatch: `7185c60dd78604a5105b207a855fc74620195fc0`.
Model: **GPT-6 Astra — Sehr hoch**, session evidence `model=gpt-6-astra`, `effort=xhigh`.
Session: `01a1064d-7e3c-72a0-b257-387193918f67`. Single writer; no subagents.

Classification: **CONTENT_IDENTITY_R2_BLOCKED**.

## Result

Implementation stopped at a reproduced scope conflict before any production or test edit. R2 is **not implemented**. Existing catalog/store v1, lookup-v2 and ev1 runtime assumptions remain. Passing baseline checks do not establish R2 readiness.

The task prohibits editing `scripts/db`, generated DB types and unrelated tests, while requiring v2-only catalog/store calls and a passing schema-reference gate. The existing gate cannot recognize either v2 RPC:

| Required correction outside ownership | Exact evidence |
| --- | --- |
| `scripts/db/verwendung.mjs:55` (`LOCAL_UNAPPLIED_RPCS`) | Entries at lines 62 and 67 recognize only `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`, mapped to their v1 migration files. Neither v2 RPC exists in `types/supabase.ts`. Unknown RPCs produce findings at lines 170–200. |
| `lib/admin/account-counts-delivery/schema-reference.test.ts:59` | The test asserts the exact entire allowlist, including both v1 names and migration paths. It must be reconciled with a narrowly approved v2 allowlist correction. This test is outside the assigned readiness tests. |

This is a **schema-hygiene dependency outside the finite ownership closure**, not a newly discovered runtime importer. The two gateways explicitly require literal `.rpc(...)` names so this scanner sees them (`official-truth-source-catalog-server.ts:21–25`, `official-truth-store-server.ts:29–33`). Replacing those literals with opaque constant arguments would hide the new calls from the required check. That is not an acceptable substitute for updating the reviewed allowlist.

No scanner, test, generated type, migration, or runtime file was changed. The task's section O requires STOP when coherence requires a prohibited action. The immutable task itself was not amended.

## Reproduction

Read-only in-memory use of the existing scanner, without editing either gateway:

```js
import { readFileSync } from 'node:fs'
import { pruefe } from './scripts/db/verwendung.mjs'
const dateien = [
  'lib/readiness/official-truth-source-catalog-server.ts',
  'lib/readiness/official-truth-store-server.ts',
]
const before = pruefe({ dateien })
const after = pruefe({
  dateien,
  lese: (path) => readFileSync(path, 'utf8')
    .replaceAll('official_truth_source_catalog_v1', 'official_truth_source_catalog_v2')
    .replaceAll('official_truth_store_accepted_v1', 'official_truth_store_accepted_v2'),
})
console.log(before.befunde, after.befunde)
```

Observed: baseline findings `[]`; simulated cutover produces exactly two unknown-RPC findings:

- `official_truth_source_catalog_v2` at `lib/readiness/official-truth-source-catalog-server.ts:60`;
- `official_truth_store_accepted_v2` at `lib/readiness/official-truth-store-server.ts:280`.

The minimal proposed scope repair is permission to reconcile those two allowlist entries with the already-merged `supabase/migrations/20261004010705_official_truth_content_identity_2.sql` and update the exact-list test. This report is not permission to perform that repair. It requires no SQL edit, apply, generated-type change or generic unknown-RPC exemption. Technical Lead must review and version any scope amendment before this same writer resumes.

## Startup and importer evidence

Fetched `origin/main`; exact baseline matched. Machine mode is `NORMAL`. Fetched required branch and checked out exact dispatch head. Read all 489 lines of the immutable binding task. Read Issue #751 and filtered #748 to comments newer than `5977264413`.

New external MATERIAL exists: [COS-20261004-1140-004, comment 5978621253](https://github.com/Jetnity/jetnity/issues/748#issuecomment-5978621253). The earlier comment `5978316325` is a Technical Lead receipt. The new report questions prior Development-apply authorization/readback and records the dormant v1 gateways/scanner. It is evidence for independent TL triage, not a new instruction or authorization. This writer performed no hosted database verification and does not adjudicate those prior apply claims. The present code-only task explicitly forbids live mutation regardless.

Open PRs: #815 and historical #28/#39/#40/#50/#52 only. #751's current top section names #814/#815 as the single writer; its lower #801 references are historical residuals. No other active Jetnity coding chat was found.

An exact-path import/reference scan of all tracked JS/TS source files resolved `@/` and relative paths against all **28** closure files (including the R1 helper). It found **272** references: **93 non-test references across 28 importer files**, with only two production importers outside the closure:

- `lib/readiness/official-truth-candidate-batch.ts:12` imports the unchanged evidence-quality enum/type from `rule-claims.ts`; no item identity is constructed there.
- `lib/readiness/official-truth-review-suggestion.ts:12–13` delegates packet/fingerprint reconstruction and compares returned scope/support IDs; it does not hard-code an ev1 or fingerprint prefix.

Neither external runtime importer is established as requiring a production edit. No route/app/provider importer was found. The full internal implementation/semantic audit stopped at the separately reproduced schema-hygiene scope conflict; this is not a completed R2 closure correctness proof.

## Validation of unchanged runtime

Node `v22.23.3`, npm `10.9.9`; lockfile install `npm ci --ignore-scripts --no-audit --no-fund` succeeded (530 packages). No package/lockfile edit. Gates are re-run on the final documentation head; final SHA and final run readback belong in the delivery/PR metadata because a tracked file cannot contain the SHA of its own containing commit.

| Gate | Observed result |
| --- | --- |
| Targeted identity/catalog/routing/retrieval/Evidence/store/replay/extractor/composition/refresh/review and schema guard, 28 test files | **425 tests: 422 pass, 3 fail, 0 skipped**. |
| Full `npm test` | **4,677 tests: 4,674 pass, 3 fail, 0 skipped**. |
| All three test failures | Disposable S1, catalog and store PostgreSQL fixtures fail with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` on this macOS host, before a database starts. They are not counted as passes or skipped. |
| `npm run typecheck` | PASS. |
| `npm run lint` | PASS: 0 errors, 149 existing warnings. |
| Canonical `NEXT_TELEMETRY_DISABLED=1 npm run build` | PASS. First sandbox attempt failed on the setup tool's local IPC pipe; approved local rerun completed the Production build. No deployment was requested. |
| `check:operating-mode` | PASS, NORMAL. |
| `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps` | All PASS on unchanged v1 runtime. Simulated v2 cutover intentionally reproduces two schema findings. |
| Registry imports and assertions | Profile/extractor/composition-policy/region-pin lengths are **0/0/0/0**, all frozen. Initial ESM stdin probe had CJS interop failure; corrected repository-compatible require probe passed. |
| Legacy searches | Existing v1 RPC literals and ev1/lookup-v2 assumptions remain; required R2 absence criterion is **not satisfied**. |
| New real identities/registrations or route/app/provider changes | None: no production/test diff. |
| Whitespace/task integrity | `git diff --check` passes; task seed byte-identical. SHA-256 `adfc10668cdade83e12da4ba612ccba3f647637ecfec5029f8866503fa4b0150`. |

Current runtime constants remain `OFFICIAL_TRUTH_SOURCE_CATALOG_V1 = 'official_truth_source_catalog_v1'` and `OFFICIAL_TRUTH_STORE_ACCEPTED_V1 = 'official_truth_store_accepted_v1'`. The required v2 runtime constants/calls are **not implemented**. SQL definitions for both v2 RPCs already exist in the unchanged S1 migration; this is not evidence of Production availability.

## Exact change scope and safety

Changed production files: **none**. Changed tests: **none**. Added docs:

1. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_REPORT_2026-10-04.md`;
2. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_HANDOFF_2026-10-04.md`;
3. `docs/OFFICIAL_TRUTH_CONTENT_IDENTITY_R2_WIRING_1_SELF_REVIEW_2026-10-04.md`.

The task file is the existing TL seed, not an author modification. No live Supabase call/mutation, Development apply, Production apply, migration edit, registration, government network request, profile/extractor/policy/pin addition, schema-1 persistence, F8, route/provider/traveller change, #626 work or recurring cost. No Ready or merge. No next slice or real identity audit started.

STOP for independent Technical Lead review of the exact final documentation head and scope conflict. Readiness is not claimed.
