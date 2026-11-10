# M04 Recovery Task V12 — R21 validated JSONB string reuse

**2026-11-10 10:20:27 UTC. R21 / Recovery Task V12; bounded source reviewed, full new-head acceptance pending.** This snapshot precedes its own publication. Later head-bound PR receipts and live evidence supersede it. No runtime/TL-PASS, Ready or merge.

## Binding dispatch and scope

[R21 finding](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6761461251) and [finite implementation authorization](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6761489935) define this same task, not a new or broadened slice. Preserve [Task V1](M04_TASK_V1.md) and [Phase-A freeze](M04_PHASE_A_FREEZE_V1.md).

Baseline d51 / tree dd75 / main890, OPEN/Draft. Actual R20 CI failed after 23 groups at unchanged 240 s deadline; see [Root Review V12](M04_RECOVERY_ROOT_REVIEW_V12.md) and [complete evidence](M04_RECOVERY_R21_EVIDENCE_V12.json).

## Authorized finite correction

Only three output expressions inside **canonical_v1(jsonb,integer)** change: two child string assignments reuse **e::text**, and the scalar-root return reuses **v::text**, instead of rebuilding the same JSONB string from decoded text through to_jsonb(s). Each unchanged branch first establishes string type, extracts decoded text and enforces the original printable-ASCII guard. The retained JSONB scalar is identical to the reconstructed scalar, and the same JSONB text serialization supplies quoting/escaping. All extractions, guards, object-key encoding, depth/order, numeric/boolean/null paths and every other SQL byte stay identical.

The single **1555-byte N02 insertion** adds **nine direct SQL queries**: seven fixed scalars each observed through root/object/array outputs, plus two fixed mixed nested vectors, totaling 23 fixed output oracles. It covers empty string, alternate ASCII Unicode escapes, escaped slash, quote, backslash, literal backslash-u and string-null. Expected canonical literals are fixed. The existing canonicalAt helper is in scope; raw empty JSON string is nonempty text and does not become SQL NULL. Existing R19 rejection/depth/key matrix and all R20 cases remain byte-identical.

Every native byte outside that insertion is unchanged. The other 16 sources, all 29 SQL declarations/attributes, object/role/ACL inventory, rollback, S0/I1/S1/MA1, generic coordinator, native wire/lifetime, actual quotas, all 31 groups/order/R9/final N15, diagnostics, clocks, authority/fence/audit checks and cleanup remain. No cache across calls, trust flag, omitted history row, seed, new signature, workflow/package modification or increased limit.

The proposed broader history/command refactor remains outside authorization: command P7601 → journal P7603 → transition P7601 error precedence must remain; parsing an envelope first or moving transition first changes mixed-invalid input behavior. R21 does not attempt that refactor.

Source-derived work model only: a representative Discovery dedup row reconstructs 106 string scalars through existing command, envelope, job and audit traversals. The complete modeled 254-enqueue flow contains 253² = 64009 dedup-row validations, removing 6784954 explicit to_jsonb(s) evaluations for string values. This is not an observed execution count of the failed R20 run. All scalar/history validation remains. No backend profile, measured speedup, guaranteed timing margin or Production/full-cap Rule SLO is claimed. Full history work remains quadratic across the sequence.

## Delivery and pins

Only jobs-candidate.sql, native.ts and four existing Phase-B author documents are author write scope. Root owns task/review/evidence/excerpt/current pointers. Eleven failures remain historical; new current claims remain unexecuted/false.

- scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql: **138224 bytes / SHA256 063180813b9a4fac6df1493202c3e45c1b6d711de92cf9edcb2c7910b44e2080 / Git blob eef54d2e51a16987f9b77049fdf6efc8a3229df5**.
- scripts/db/official-truth-v3-durable-jobs-1/native.ts: **161318 bytes / SHA256 c4001fd857386f2b789852f346086cb0167ffd627959802d65baf6d11bd86104 / Git blob abbbd77b0896876877e8aa1dd0dd786d6d39c03f**.

All-18 source aggregate **11183e770f0c39dc51878e38b0a92a76a7b05a974f681bea13b87857daae60c6**. Rollback remains **9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66**.

## Ownership and acceptance

Sole author remains **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual session **/root/m04_durable_jobs_writer_g2**. Independent reviewer **/root/m04_r9_review_g2**, live auditor **/root/m04_live_audit_g2**. All three real sessions resumed after the interruption; functions stores were lost. The author confirmed four R21 documents were still unfinished, then completed only that pending delivery. No session generation or Cursor title is invented. G1 and original checkout remain unavailable. Author STOP after finite delivery; immediate corrections return to the same author/session. Root alone publishes/PASS/Ready/merges.

Root reconstructed the exact candidate bytes and all 18 pins from fresh GitHub reads after reset. The independent reviewer retained its own pre-reset reconstruction/hash results in its same-session history and rechecked the full native oracle text after reset. Root's fresh independent hashes agree. The four author documents retain all ten prior historical objects and exact Markdown tails, add the eleventh actual failure, keep 18 source pins / 22 current-unexecuted rows / 31 unchanged groups, and mark all current execution/PASS/Ready/merge fields false. Author self-review is not TL PASS.

Original checkout /workspace/scratch/01cbe1264212/jetnity-v3-durable-jobs is absent and was not recreated. Only permitted GitHub reads and in-session text/data/hashing were used. No local project/parser/SQL/native/build execution, installation or replacement environment. The initial interrupted chat did save checkpoint d9d62c69; the implementation and acceptance were unfinished.

At this pre-publication snapshot the first unfinished step is Root expected-head/no-force GitData publication against d51, followed by complete changed-blob/tree/ancestry readback. Then the existing unchanged CI must pass on the new exact head: all 31 native groups, both actual R9 witnesses, real 254/255/256 and 64/65 boundaries, inherited-boundary evidence, full cleanup, Core/Hygiene/Build and all companion jobs. Refresh exact Preview, main/merge-base/diff, reviews/threads, mode/Guardian/rules and special gates before a decision. Every changed head invalidates prior exact-head gates. Concrete failure returns to the same author; no unchanged-known-bad rerun.

Budgets remain **240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.** No shortened proof, raised budget or inferred pass. If eligible, only Root may give exact-head TL PASS, Ready and expected-head merge. Verify actual-main CI/Production after merge and persist one finite docs-only closure with its own gates; its final actual-main receipt can live in the existing PR/#751 to avoid a self-referential commit loop. No automatic next product slice.

## Hard boundaries

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.
