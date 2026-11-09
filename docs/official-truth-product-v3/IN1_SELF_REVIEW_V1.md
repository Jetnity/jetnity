# IN1 self-review V1 — composition source, native evidence pending

9 November 2026. **Jetnity Official Truth V3 Intake Composition 1 — Codex Generation 1**, actual session `/root/v3_intake_composition_writer`. This is the implementation author's self-review, **not Technical-Lead PASS**.

## Scope and status

The bounded implementation finishes the already-required N1 File→S1 SQL→I1 test composition. It adds one native test script and its unconditional Core-test wrapper. It introduces no production runtime implementation, source connection or public entry. Native execution and exact published-head CI/build/Preview acceptance remain **PENDING**. No native database was started or retried in this session.

Inputs remain exactly S1 `bb5ce4d69f9e479867581ecf0262e549bfc20e6c` and N1 `10d3e4f44460513e6425714af2c8c0b3ab4678a6`. All 15 imported N1 files are byte-identical. The shared contract retains SHA256 `49c4c4f5c2fd0b163be4f387af47032ed8c030fd75e7bfecd875af775bf6f69b`. The only changed inherited S1 file is the specifically authorized Foundation guard: the finite five-consumer union, scanner unchanged, both branches' negative cases retained. Regulierungs and Content-Identity stay byte-identical to S1.

## Actual assertion coverage in the new native suite

| Required family | Implemented proof | Evidence status |
| --- | --- | --- |
| File→custody→I1 | Real pinned directory/file; actual N1 and S1 executor; original SQL BYTEA/digest/binding match; original exists before any reservation/completion/extraction; remove directory; fresh confirmation/reopen; submit only reopened SQL text and binding to I1; durable complete outcome/audit and replay; no Accepted/cache publication | Written and typechecked; CI native execution pending |
| Refusal before retention | Four top-level/nested/plain/escaped duplicate-member originals hide an earlier private canary under ordinary JSON parsing, but actual N1→S1 refuses them before any executor dispatch; unsafe symlink also refused; zero original/reservation/completion rows | Written and typechecked; CI native execution pending |
| Real concurrent capture | First real INSERT held before COMMIT; second independent exact PID/birth/CAPTURE observed in Lock wait with first exact PID/birth as idle-in-transaction blocker; release, two recorded results, one COMMIT/drain each, one immutable original; changed bytes/runner/delivery/revision collide | R1 correction implemented; CI native execution pending |
| Lost acknowledgment | Actual capture COMMIT acknowledged inside unchanged native executor, response withheld; one confirmation only after capture drain; optional lost confirmation response remains unconfirmed; fresh confirmation after removing directory | Written and typechecked; CI native execution pending |
| Abort and deadline | Separate external-abort and default 5000 ms logical-deadline cases after real capture INSERT; actual advisory transaction-lock wait observed by independent autocommit observer using exact PID/birth/query/known blocker; target absent before blocker release, no COMMIT/late positive/post-expiry confirm, no surviving row | Written and typechecked; CI native execution pending |
| Method separation | Stored untrusted original while synthetic method resolution is disabled; actual I1 returns and persists full method_not_approved outcome/audit; zero extraction or Accepted/cache publication | Written and typechecked; CI native execution pending |

Fresh objects/connections are not process restarts. The unchanged S1 real child-process interruption suite remains mandatory. All data/source clocks are fictional; no current entry-law statement or freshness claim is made.

## CHANGES REQUIRED R1 and same-session fix

Root's independent R1 review correctly found that the initial `Promise.all` delivery test could pass with serialized SQL. That initial code did not prove transaction contention. This same writer/session replaced it with an observed real lock conflict as specified above. A run-owned latch holds the first existing `beforeCommit` hook; success requires independent database evidence before releasing it. Cleanup always releases the latch, aborts both delivery signals, joins both pending calls and closes the observer. Child cancellation also releases the latch. No runtime, driver, workflow or budget changed.

R1 implementation SHA256 for `scripts/db/official-truth-v3-intake-composition-1/native.ts`: `7aa5fb2ee14c4cc01937f366bced637f5ffae2069f01c993a1544cd0a45a47d0`. All offline gates were rerun after this correction. Their actual commands, timestamps, source pins and log hashes are in `IN1_VERIFICATION_RECEIPT_V1.json`.

## Actual offline verification

- V3/N1 offline suite: **311 passed, 0 failed, 0 skipped**. The two mandatory native wrappers were deliberately excluded from this local command; neither is disabled in CI.
- Foundation, Regulierungs and Content-Identity guard suite: **148 passed, 0 failed, 0 skipped**.
- Whole repository TypeScript: exit 0, including the new native script through its lib wrapper.
- Scoped ESLint: exit 0.
- Five existing hygiene checks: dead modules, exports, dependencies, API protection and schema references all exit 0. Existing LOCAL/UNAPPLIED schema-reference reports remain local candidate reports, not database installation proof.
- Build, native tests and Preview were not executed by this writer; Root must inspect the actual published-head CI and deployment evidence.

## Security, scope and remaining risk

No new runtime API, driver, test skip, central workflow, dependency, provider, credential, hosted query or migration operation is present. The native setup uses the unchanged S1 candidate only inside a newly owned proof cluster when normal CI runs. Private input custody never grants method, job, registry, source, Accepted-store or Owner authority. Recovered output is explicitly not_committed and requires reproof before any future acceptance commit.

- **P0:** None identified in this bounded test/source diff; this is not a platform-wide P0-clear claim.
- **P1 / acceptance blocker:** Real native execution is unproven until exact-head normal CI passes. Source-only review and offline unit counts cannot discharge this gate. S1's native status at dispatch was pending and is not upgraded here.
- **P2:** The tests intentionally retain the existing 5000 ms N1 budget. Missing actual lock observation fails the test; no timing-only success, budget increase or alternate transport is permitted. Root must assess actual CI outcomes and return any correction to the same session.
- **P3:** Historical N1 test-command typo remains visible in the byte-identical inherited document; the newer Root erratum is recorded in the handoff and receipt.

Method **NOT_APPROVED**, Dev package **NOT_RELEASE_READY**, SQL **UNAPPLIED**. #917 readback/ledger and #1139's 17 pre-Owner gaps remain open. The specific refused #917 readback was not retried, rerouted, delegated or replaced by human instructions. #1131 Ready-STOP, #1135, #968 and all other Owner/privacy/Production gates remain. No new cost; no Ready, merge, remote write or follow-up slice.
