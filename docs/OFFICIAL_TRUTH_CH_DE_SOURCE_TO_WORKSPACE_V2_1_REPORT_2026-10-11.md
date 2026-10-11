# CH→DE Source-to-Workspace V2.1 — Author report

**PARTIAL / GATED — negative read/interface delivery; no working user visa result.** Author: Jetnity Official Truth CH-DE Source-to-Workspace V2 1 — Codex Generation 1. Single agent. Existing branch `feat/official-truth-ch-de-source-to-workspace-v2-1`, Draft PR #928, Issue #927 / parent #917.

Main and merge-base at preflight: `fcab99dd96e23749dd2624ad5cbe4c2749b127e1`; seed `9852be4b4ba176e614ceaf2fa349dbee91f3af75`; task blob unchanged `d590a9769915ba1cbb6bb3cab8c401f0dac70460`. Implementation commit: `123ada36c62a7e6fe63f98b3409b20ce2e537435` (tree `e2e3ee01167b2ea190a4bc562dc3d426edc9fe6e`). Final commit/tree and remote verification are recorded in the final external author receipt to avoid a self-referential commit hash. The commit containing this report is not an independent TL approval.

## Delivered behavior

The new server-only CH→DE read request accepts only an explicit traveller/credential lookup and validates representable prerequisites against the canonical Trip. It rejects cross-traveller/foreign-trip options, ambiguous references, residence/issuer nationality inference, unsupported destination/date context and caller-injected authority. Every result remains unavailable with null provider/Evidence/Rule and explicit blockers.

The developer integration uses the current Requirements engine and actual `tripOfficialEvaluationsAuswerten`, then existing Preparation/Destination Essentials projections. It proves unknown results and absent official attribution for all requirement types. No runtime page/API integration is activated, because there is no verified data to feed it.

The disposable PostgreSQL16 test applies six existing migrations and demonstrates the missing protected read primitive with actual role/SQL denials, not a mock RPC. Zero source profiles, accepted Evidence, Rules or custody receipts are promoted. A full positive synthetic accepted read would need protected source/read/scope decisions; it is **NOT_VERIFIED**. Full custody/history/current-revocation read semantics are not implemented by returning an accepted-shaped DTO.

See [CONTRACTS](OFFICIAL_TRUTH_CH_DE_SOURCE_TO_WORKSPACE_V2_1_CONTRACTS_2026-10-11.md) for exact code references and the one-path blocker graph, and [OWNER_PACKET](OFFICIAL_TRUTH_CH_DE_SOURCE_TO_WORKSPACE_V2_1_OWNER_PACKET_2026-10-11.md) for finite official-source research, unknowns and G1–G7 decisions.

## SW01–SW28 disposition

| Criterion | Disposition / evidence |
|---|---|
| SW01 | Live preflight completed; PLAN records main, mode, checkpoint/Guardian receipt, parent/closed issue and active writers. Final refresh belongs to the author receipt. |
| SW02 | Completed gap inventory and exact existing dependency path in CONTRACTS; no foundation refactor. |
| SW03 | Official primary-source research and canonical URLs recorded; full UTC tool-request timestamp distinguished from unknown trusted origin `retrievedAt`. Legal validity remains null. |
| SW04 | **RESEARCH_GAP:** whole-response privacy, exact origin headers/redirects/bytes and stable identity predicates unverified. No unauthorized full capture. |
| SW05 | Finite candidate/legal-scope/exception packet delivered; source still unqualified. |
| SW06 | Compiled registry and conditional S3 128KiB budget unchanged; S1 gets no entitlement. |
| SW07 | **PARTIAL:** bounded server-only negative read interface implemented. Positive re-proof reader blocked by accepted-read/custody/history/revocation contract. |
| SW08 | Explicit linked credential prerequisite checks implemented. Ordinary/purpose/direct-route and supported legal-date scope require G1; no shared contract silently expanded. |
| SW09 | Existing engine/server seam exercised in developer harness; production provider null and hard-off unchanged. No second engine or UI. |
| SW10 | Native isolated PG16 refusal proof delivered. Genuine positive accepted/read/provenance case **NOT_VERIFIED**; no false source identity used. |
| SW11 | Unknown projection through actual server function plus Preparation/Destination Essentials verified. Positive protected-store-derived provider/attribution case **NOT_VERIFIED**. |
| SW12 | Synthetic people only; sanitized evidence has no raw source/PII/hash/credentials. Local unsanitized runner logs are not committed. |
| SW13 | V1/V2/source-limit implementation untouched; existing regressions included in full test run. No direct SHA fallback/mock authorizer. |
| SW14 | New request DTO/getter/cycle/size/selection injection and role denial tests; existing provenance/identity/commit-ACK tests retained. Real stale/revoked/conflicted Rule-to-Workspace behavior **NOT_VERIFIED** until G2. No claim that rejecting an arbitrary DTO tests all reader states. |
| SW15 | Six merged migrations reused in disposable native16.15; no new SQL or hosted apply; explicit missing primitive gate. |
| SW16 | Actual verification results and limitations below / evidence manifest. No skips accepted as proof; independent exact-head CI/Auth/Preview reserved for TL. |
| SW17 | Existing mobile Workspace contract and visuals unchanged; no raw governmental HTML shown. |
| SW18 | Zero hosted DB writes/migrations and no production credentials used. |
| SW19 | No real profile/Rule/Evidence/F8/provider/auth-role/policy/paid/indexing activation; #913 untouched. |
| SW20 | Separate G1–G7 decisions with exact merged Dev migration, source/privacy/legal/AAL2/kill-switch/rehearsal boundaries. None executed. |
| SW21 | Explicit **PARTIAL / GATED** delivery with material refusal/interface tests and finite source report. |
| SW22 | Only owned CH→DE modules/scripts/tests and task documents/evidence changed. |
| SW23 | Immutable seed TASK plus PLAN/CONTRACTS/REPORT/STATUS/SELF_REVIEW/HANDOFF, source packet and sanitized evidence. |
| SW24 | Final author receipt provides exact HEAD/tree, diff, test counts, remote statuses and open risks. |
| SW25 | Single named author; no delegated agent or parallel author. |
| SW26 | Commit/push only existing branch; Draft preserved. No force-push/Ready/merge/new slice. |
| SW27 | Independent TL gates remain outstanding; code-only review confers no source or hosted approval. |
| SW28 | Author STOP after handoff; eventual real one-cell target remains gated. |

## Verification method and honest limits

Dependency installation completed with normal lifecycle scripts using `npm ci --offline` and the existing package cache; its offline audit summary is not used as security evidence. The separate online npm audits below are authoritative for this report. Node22.23.3, native PostgreSQL16.15 built from the official source archive after matching its published SHA256. macOS host, disposable local clusters only. Legacy tests hard-code Linux PG16 binary locations; a host-only preload outside the repository maps exactly `initdb`, `pg_ctl`, `postgres`, `psql` from `/usr/lib/postgresql/16/bin` to the native16.15 installation for child_process execFileSync/spawnSync/spawn. A short local temporary directory avoids the macOS Unix-socket path-length limit. SQL, arguments, return values, errors, assertions and test selection are unchanged. The exact preload is included as `docs/evidence/official-truth-ch-de-source-to-workspace-v2-1/native-pg16-host-path-adapter.cjs.txt` (local execution only, not a test/runtime import). This is a host path adaptation, not the Linux CI result; TL must inspect exact-head CI independently.

Initial focused tests passed, but the first full run exposed an unauthorized custody-foundation import by the request validator. The import was removed in favor of checking only the four request fields; the foundation fence was not weakened or extended. Two initial legacy tests also exposed missing spawnSync path mapping, and a third hit the long macOS temporary socket path. The first full run therefore ended with 6,248 passing / 4 failed / 6,252 tests, 819 suites and 0 skips; aborted nested test groups explain its lower test count. This run is not a PASS. The socket-path targeted rerun subsequently passed 105/105, 4 suites, 0 skips. The repaired affected set passed **160/160, 0 skips** before the final full rerun. Initial sandbox-only tsx/socket failures were retried with authorized local process access, not declared passes. Final full serial run: **6313/6313 tests, 819 suites, 0 failures/cancellations/skips**, native R2/R3 PASS. Final typecheck, lint, build and all named hygiene checks PASS; dependency audit remains FAIL. All results are in the sanitized evidence manifest and STATUS.

Production build, typecheck, lint and hygiene are separate from dependency security status. `npm audit` on the unchanged lockfile reports **19 vulnerabilities (17 high, 2 moderate)**; `--omit=dev` reports **3 high** (locked sharp 0.35.4, source-map-js 1.2.1, ws 8.18.1/8.18.3). Audit exits 1. These are existing locked dependency findings, not newly added packages; exploitability and deployed reachability have not been independently established. No `audit fix`, dependency override or suppression was applied. G7 is open.

`git diff --check` for author changes since the seed passes. The complete PR diff against main reports four inherited Markdown hard-break trailing spaces in TASK lines 3–6. They are preserved because SW23 requires the exact seed blob. This is a disclosed seed-only whitespace exception, not an unqualified whole-PR whitespace PASS.

The terminal had no authenticated HTTPS Git credentials and no SSH-agent identity. Delivery therefore uses the existing authenticated GitHub Git Data connection: all five implementation blob hashes and implementation tree `e2e3ee01167b2ea190a4bc562dc3d426edc9fe6e` match the locally tested code exactly. GitHub assigns commit metadata; the published implementation commit is `123ada36c62a7e6fe63f98b3409b20ce2e537435`. Local validation ran on commit `7fa2ad87b7cda811f10566873d50574241891567` with that identical implementation tree. The existing remote branch is updated only by non-forced fast-forward with the seed as expected prior head. No new branch/PR or credential extraction. Final receipt verifies the resulting remote SHA/tree.

## Risks and unaccomplished work

| Priority | Finding | Status / owner |
|---|---|---|
| P0 | No new P0 found in author review; no claim of independent security certification. | TL review pending. |
| P1 | Positive source→accepted-read→scoped visa path cannot safely operate without source, scope and read contracts. | Blocked closed; G1/G2/G3/G5/G6. |
| P1 | Current audit has high findings, including three production transitive packages. | Open; G7, separate dependency scope authorization. |
| P2 | Whole-response privacy/retention/identity/current legal consolidation and effective window are unproven. | RESEARCH_GAP; source remains unqualified. |
| P2 | No real database-backed authenticated positive Workspace rehearsal, positive checkedAt/source attribution, or reader stale/revoked/conflict test. | NOT_VERIFIED; do not substitute static/source tests. |
| P2 | macOS native test adaptation differs from Linux CI. | Disclosed; exact-head CI independently required. |
| P3 | 144 pre-existing lint warnings. | No new suppression; unchanged baseline count. |

No hosted migrations, real regulatory approvals, credential storage, runtime activation, Production modification or #913 work were performed. New paid/provider spend $0. Rollback of this dormant change is a normal reviewed revert of the author commits; no database rollback is required. Production remains unknown/null irrespective of secrets or readiness environment flags.
