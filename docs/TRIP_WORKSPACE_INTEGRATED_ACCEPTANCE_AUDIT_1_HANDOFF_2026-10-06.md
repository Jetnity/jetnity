# Integrated Trip Workspace acceptance audit 1 — Handoff

6 October 2026 · #869 / Draft #871

**Review the exact pushed delivery head. This writer does not grant PASS, Ready or merge.**

## Identity

| Field | Value |
| --- | --- |
| Branch | `docs/trip-workspace-integrated-acceptance-audit-1` |
| Audited remote main | `9adfc04ffe90693dedc059f07a396751a0625157` |
| Merge-base | Same main |
| Task seed | `640cb7c112343a0ac749c4e820779a34347ce91a` |
| TASK blob | `258c058187bec13f48d7fd6814dbadca219bb04b` (unchanged) |
| Final Exact Head | Resolve current branch tip and compare with final STOP receipt; the final delivery commit contains this handoff. |
| Expected one-commit delivery delta | Final branch 2 ahead / 0 behind main if main remains unchanged |
| Model/session | `gpt-6-astra` / `xhigh`; `01a10e91-5fda-7002-959d-b93029705c33` |
| Scope | Four permitted audit documents + new evidence in the unique audit directory; no existing evidence edited |

## Review order

1. [Audit and findings](./TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_2026-10-06.md): **overall FAIL**, F-01 P1.
2. [Report](./TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_REPORT_2026-10-06.md): actual checks and limitations.
3. [Wrong-route screenshot](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-false-outbound-selected.png), [booked state](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-false-outbound-booked.png), [pure propagation](evidence/trip-workspace-integrated-acceptance-audit-1/coverage-impact.json).
4. [Source blobs](evidence/trip-workspace-integrated-acceptance-audit-1/provenance.json), [file manifest](evidence/trip-workspace-integrated-acceptance-audit-1/changed-files.txt), [scope check](evidence/trip-workspace-integrated-acceptance-audit-1/scope-check.txt), [self-review](./TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_SELF_REVIEW_2026-10-06.md).

## Core technical finding

`lib/trips/flug-abdeckung.ts:192–197` binds a unique same-date flight to a required section without checking route proof. The real Guest UI shows NRT→LAX under Zürich→Florenz; the same pure function also accepts explicit JP/US endpoint facts as that Swiss/Italian section. Two unrelated dated flights make aggregate coverage `belegt` and remove flight Attention. This is not an auth-dependent finding.

The narrower fixes in #833/#837 correctly preserve manual facts, and B01 correctly protects official evaluation authority. Their integration does not make this older coverage projection truthful.

## One recommended slice

**TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1**.

Use only already trusted trip/route facts to prove required-section association; otherwise retain unknown/unassigned. Do not build a new lookup, assignment flow or provider. Likely runtime owner is `lib/trips/flug-abdeckung.ts`; regression owners are flight coverage, workspace status and Attention tests. The full positive/negative acceptance list and gates are in the main audit.

This slice is independent of F8/provider activation. Selection/dispatch still belongs to the Technical Lead. No follow-up has started. F-02/F-03/F-04/F-05 and V-01 are not silently bundled into it.

## Reproduction

Install dependencies from the lockfile. Start the existing local dev server with:

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-audit-placeholder \
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3487 \
JETNITY_UI_AUDIT=1 NEXT_TELEMETRY_DISABLED=1 \
npm run dev -- --hostname 127.0.0.1 --port 3487
```

Use a fresh isolated browser; no real cookies, credentials or environment files. The placeholder is intentionally incapable of reaching a database. The harnesses block external/API/non-GET requests.

```sh
node --import tsx docs/evidence/trip-workspace-integrated-acceptance-audit-1/coverage-repro.mjs
node --import tsx docs/evidence/trip-workspace-integrated-acceptance-audit-1/targeted-findings.mjs
```

These scripts reproduce evidence, not fix the product. They write output into this audit directory; reviewers should use a separate checkout/output copy to preserve committed evidence. Do not rerun the broad DB-fixture invocation; its failure is retained only for honesty.

The primary integrated script's PASS fields cover its named assertions. Read the later visual and adversarial findings; those fields do not override the overall FAIL.

## Required independent gates / gaps

- Fresh main/#751/TASK/head/diff re-read, no inherited acceptance if any head changes.
- Confirm branch remains Draft and no forbidden paths changed.
- No real authenticated Account E2E was possible; keep **NOT_VERIFIED** until separately authorized credentials/test-data/transport exist.
- Physical hardware, Safari/iOS native controls, screen-reader speech, actual browser/OS zoom and full production build were not verified.
- Existing premium audit has one stale-label failure. Four accidental local PostgreSQL fixture tests failed before startup. Neither is hidden nor reported as a pass.
- No DB/provider/Official Truth/F8/Production activation follows from this audit.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
