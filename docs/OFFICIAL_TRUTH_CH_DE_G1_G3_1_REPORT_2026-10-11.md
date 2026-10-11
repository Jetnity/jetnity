# G1/G3 preflight 1 — author report

Author: **Jetnity Official Truth CH-DE G1 G3 Preflight 1 — Codex Generation 1**.
Issue #930 / Draft #931, parent #917 OPEN. This is an author assessment for
independent TL review, not a TL PASS or permission for Ready/Merge.

## Delivered behavior and limits

G1 extends the existing dormant CH→DE read-request boundary with a strict,
nullable local `proposedContext` contract. An explicit traveller/credential
selection is resolved by the existing `credentialOptionsAus` against the supplied
canonical Trip snapshot. The proposal must match the Trip id/revision, the selected
document and that document's actual CH citizenship link. Duplicate identities or
citizenship entries are refused; multiple different citizenships/documents remain
separate options, with no first-item default.

Passport class is explicit (`ordinary`, distinct non-ordinary classes, `unknown`
or null). Only an explicit ordinary declaration and tourism purpose satisfy this
local pilot. Generic legacy `passport` establishes no subclass. Travel dates must
be real complete calendar dates and exactly match the loaded Trip interval.
A user-attested route must explicitly name complete/direct CH→DE and zero transit;
an empty transit list alone is insufficient. Known stage-date contradictions and
incompatible canonical route data refuse the proposal. When transport is already
represented in the graph, this first local contract supports exactly one direct,
same-day CH→DE flight derived by the existing route module; additional legs,
return journeys, unknown flights or other transport remain unsupported here.
No shared route engine or persistence behavior changes.

Successful validation means **proposed_context_only**, with
`officialQualification=false` and `persistedContext=false`. It does not certify
truthfulness of user statements, account persistence, passport validity, legally
supported stay duration or source applicability. Even a missing/expired document
expiry cannot be mistaken for a validity proof. No 90/180 rule or legal duration
threshold is invented. Dates represent the declaration only.

The boundary still returns `provider=null`, `acceptedEvidence=null`,
`acceptedRule=null`, unavailable. The real server Workspace helper and existing
Requirements engine/OfficialEvaluation/checklist remain unknown for every cell.
No alternate engine, accepted reader, endpoint, badge or public visa surface was
added. The proposed context is never attached to the persisted Trip or transported
as accepted provenance.

G3 is **CAPTURE_BLOCKED**, zero actual origin attempts. The approved compiled Bern
profile is absent; neither the real catalog nor the conditional 128KiB entitlement
can be used for it. The full explanation and minimal separate TL decision are in
[G3 decision packet](OFFICIAL_TRUTH_CH_DE_G1_G3_1_G3_DECISION_PACKET_2026-10-11.md).
No source body, hash, source time, response size or legal conclusion is fabricated.

## Acceptance matrix

| Criterion | Author disposition / evidence |
| --- | --- |
| G1-01 | Seed/blob/main/mode/live issues and open-writer inventory reconstructed; canonical registry/snapshot, credential, route, persistence and Workspace paths inspected. |
| G1-02 | Closed nullable proposal schema; legacy/missing/non-ordinary/purpose/route cases refuse; provenance label only user_attestation. |
| G1-03 | Existing Trip/document link/credentialOptionsAus reused. Local proposal deliberately separate from account facts; no shared type or persistence edit. |
| G1-04 | Explicit single option and citizenship link checked; duplicate/foreign/cross-trip refs refuse; multi-option permutation tests. |
| G1-05 | Dates, origin/destination, topology/completeness and attestation explicit; contradictions refuse. Legal duration eligibility remains unknown. |
| G1-06 | Existing read-request/adapter only; provider remains null and canonical server Workspace stays unknown. |
| G1-07 | Strict finite fields; sensitive/authority field injections rejected; no personal fixtures, passport numbers, document images or source bodies. |
| G1-08 | New adversarial context tests and unchanged canonical regression/native suites; serialization tests explicitly show no silent guest/account subclass persistence. |
| G1-09 | No protected shared-path edit or schema change; no scope amendment needed for this local existing-boundary implementation. |
| G3-01..03 | Fixed target and protective contracts inspected; actual default registry refuses Bern with profile_unavailable. Guard PASS, capture BLOCKED. |
| G3-04..07 | Actual capture NOT_RUN; whole-source identity/privacy/legal/header/body observations unknown. No runner/retry/retention/side-channel introduced. |
| G3-08 | Offline missing-profile/budget refusal added, existing synthetic safe transport/body/identity tests run. No claim to test a real Bern parser or a new one-call runner; none is authorized/implemented. |
| G3-09 | CAPTURE_BLOCKED and finite research-only seam packet; STOP G3, no profile forged or registered. |
| QA-01..05 | Exact diff, immutable Task, local checks and sanitized versioned deliverables; remote exact-head gates recorded in publication handoff. Independent TL review remains required. |

## Data, security, costs and documentation

No Hosted Development/Production read/write/migration was used by this author;
local SQL tests create only disposable synthetic PostgreSQL clusters. Auth/RLS,
Supabase schema/types, source registry/profile/retrieval, provider, CI, package
files, public UI and PR #913 are unchanged. Read-only Auth CI is an existing
GitHub job and is reported separately from local checks. No secret was added.
Incremental recurring spend USD 0; the USD100/month infrastructure ceiling remains.

No new architectural component or public product behavior is introduced. This
local boundary decision and remaining roadmap gates are documented here and in
task-owned PLAN/STATUS/SELF_REVIEW/HANDOFF instead of editing global documents
outside the assigned slice. The parent product objective remains incomplete.

## Verification corrections and residual risk

The first full local run found an unauthorized import of the bounded provenance
scanner into the traveller request module. That import was removed; the existing
importer guard stayed byte-identical. A request-only bounded descriptor snapshot
now rejects getters/prototypes/cycles/deep/oversized values before schema parsing;
it does not hash, canonicalize provenance or grant any authority. Two new unused
fixture-variable warnings were removed; the 144 pre-existing lint warnings remain.

The first macOS run also exposed four legacy tests with hard-coded Linux PG16
paths. Subsequent complete execution uses the already versioned host-only path
adapter from #928, copied outside the repository, plus a short temporary path.
It maps only four executable paths to native PostgreSQL16.15 and preserves all
SQL, arguments, errors, assertions and test selection. No test or security deadline
was relaxed. Exact run outcomes/counts are in the verification manifest.

Initial sandbox setup execution could not create tsx's local IPC pipe; the same
check passed with local execution permission. npm ci completed without changing
the lockfile. Fresh read-only full and production npm audits returned exit 1 for
the existing 19 advisories (17 high, 2 moderate), including exactly three high
production packages: sharp, source-map-js and ws. G7 is not remediated or
claimed reachability-safe. P2 native M1–M4 shared-runner timing variance remains;
one green run does not remove that risk.

Protected gates remaining: durable canonical regulatory context/persistence;
actual full-source identity, legal/privacy/licensing/currentness; source-specific
retention and #865 unsigned global D01–D12; hosted migration reconciliation and
separate apply approval; protected real acceptance; accepted-reader/lifecycle/
refresh integration; provider/F8/Workspace activation; G7. No gate is inferred
from this local representational G1 result or the Owner's ephemeral grant.

## Final local verification

- Full `npm test`: **6415/6415 PASS**, 819 suites,
  0 failures/cancelled/skipped/TODO; 402.269 seconds. Native PostgreSQL16.15;
  unchanged M1–M4 73.260s under the existing 240s limit,
  all 12 lifecycle checks PASS. R3 completed 1,008 codec comparisons.
- Focused G1/G3 plus existing safe retrieval/body/identity: **182/182 PASS**,
  8 suites, 0 failures/cancelled/skipped/TODO. This adds 89 tests to the
  baseline full total of 6,326 (86 local context cases and 3 Bern preflight cases).
- Typecheck, lint (0 errors / 144 existing warnings), setup, NORMAL mode, schema,
  API protection, dead code, exports, dependencies, production build and diff
  whitespace checks PASS. No package, lockfile, workflow or security guard edit.
- Initial full run: 6,348 pass / 5 fail of 6,353, 819 suites, no skip/cancel/TODO.
  One forbidden-import finding and four host executable-path failures are
  documented above; it is not final evidence. Successful native setup declares
  additional existing subtests, explaining the differing total.
- Fresh dependency audits report the unchanged G7 findings, with exit 1. This
  is an open security result, not a clean audit.

All five final code/test files are SHA256-pinned in the sanitized verification
manifest. Full machine-local logs are not published. Final remote CI/Auth/Preview
evidence is bound to the published containing commit in the #931 author receipt.
