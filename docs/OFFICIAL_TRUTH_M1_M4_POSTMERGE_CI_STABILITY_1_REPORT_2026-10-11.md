# Official Truth M1–M4 stability 1 — author report

Author: **Jetnity Official Truth CH-DE Source-to-Workspace V2 1 — Codex Generation 1**, same session, single writer. Draft [#929](https://github.com/Jetnity/jetnity/pull/929), branch `fix/official-truth-m1-m4-postmerge-ci-stability-1`. Main/merge-base `bc5d7a98f78e4560785127d9a20d6ee99a78e438`; seed `3fca59c237e2c61f5deba90a28716747755c7d74`. Mode NORMAL. Task blob `e9c7b43fe2d99d743d19c7d9e31d029f449df983` unchanged.

Executable correction commit **`e78732eb29420d5a17db9cf0be0c85727e025409`**, tree `f69b8e767f3d5cd3f7afec1419c3951f2e0d381b`, test blob `fea99201117ffb41564c381eea39f0adb7f62ace`. Final documentation-only descendant is identified in the post-push `STABILITY_1_AUTHOR_RECEIPT.json` / `STABILITY_1_AUTHOR_HANDOFF.md` delivery artifacts. A tracked report cannot embed its own containing commit hash. Final remote gates must be read on that exact descendant; no historical or pre-push result is promoted to final-head PASS.

## Diagnosis

Independently fetched full original main-push run [38142134697](https://github.com/Jetnity/jetnity/actions/runs/38142134697): Verify 114477982326, 6,317/6,326 pass, 7 fail, 2 cancelled; first substantive failure at baseline test line 177, `persistCandidate(..., verify_existing)` → `bindCandidate`, SQLSTATE 55000. Parent reaches 240002.246612 ms; later failures/cancellations are cascades. Auth 114477982172 actually executed and passed 55 values / 243 keys. Schema/API/hygiene/Build were skipped, not green. Last R4 review on merged #928 remains historical engineering evidence; it does not approve failed actual-main CI.

The test checkpoint was renewed once per subtest, while the acknowledgement subtest performed publication, deferred COMMIT validation, fresh SQL+TS readback, another full read, and then idempotent re-publication. That reuses an ageing witness across several logical operations. Native baseline passes in 105555.665125 ms on this host; this does not disprove a load-dependent failure. Its generated primary/composed graphs contain 63/72 artifacts, 5,390,676/5,412,159 artifact bytes; 30 implementation capsules contribute 5,215,996 bytes to each. The full graph is repeatedly parsed and re-proved, including compiler/dependency source captures unrelated to the small original-response payloads.

Controlled native reproduction waited **before BEGIN** of that same second writer until the checkpoint exceeded 61 seconds. At bind entry the independently observed witness still matched, age was **65,130 ms**, and PostgreSQL reported **cursor_unavailable / 55000** in **3 ms**, at the original failing phase. TAP intentionally failed (11 pass, child + parent fail); no failure was swallowed/retried into success. Function profiling on the unchanged SQL recorded 2,649,584 canonical calls, 17,950 ms canonical self-time and 30,786 ms graph-validation self-time. These are measurements of this diagnostic run, not a GitHub runner profile. The original CI transport retained only SQLSTATE; its exact backend message cannot be recovered from that log. The controlled reproduction and unchanged-state elimination isolate the expiry path convincingly; they are not a claim to have read missing server data.

Alternative causes: no competing writer changes head/history in the acknowledgement subtest; successful initial read proves the same bytes/review/support state. The fixture is calendar-relative, valid for 30 days, not near expiry. Isolation remains READ COMMITTED; stale REPEATABLE READ is separately refused with 25000. A first diagnostic pause after BEGIN hit the separate unchanged 20-second idle-transaction protection (`connection_state`), so it was explicitly excluded as heartbeat evidence. Waiting before BEGIN avoids that confound. Genuine lock/revocation ordering remains tested. CPU/runner contention amplifies repeated validation cost; no machine-global concurrency setting was changed.

### Independent reproduction method

Use native PostgreSQL16 and the exact test file from seed `3fca59c237e2c61f5deba90a28716747755c7d74` (identical to main for this test), with its unchanged imports, SQL, fixtures and deadlines. In a disposable copy, observe `LocalPgConnection.query` through a test-only wrapper. At the acknowledgement subtest's **second writer connection**, before dispatching `BEGIN`, read `extract(epoch FROM (clock_timestamp()-checked_at))*1000` from the local private head on an independent owner connection. Wait `max(0, 61000-ageMs)` outside a transaction. Then dispatch the original BEGIN/publish/bind unchanged. At bind entry record only numeric age and boolean equality of the supplied sequence/hash with the head; record the original SQLSTATE and allowlisted PostgreSQL server error label `cursor_unavailable`. Rethrow unchanged so TAP must fail. No checkpoint is renewed in this baseline reproduction. Waiting after BEGIN is a different idle-transaction test and must not be substituted. Optional `track_functions=all` may be set by the disposable database owner for diagnostic profiling only; no test-principal grants are needed. Never print parameters or the raw server log.

For the repair, remove that scratch observer/baseline copy and run the exact focused/full commands in the JSON evidence. The committed age-only rollback assertions reproduce expiry without a wall-clock sleep on every normal CI run. All custom observations use fixed labels/scalars; the intentionally failing framework stack stays local and is not copied into repository evidence.

## Repair and coverage

Only `lib/readiness/official-truth-original-custody.test.ts` changes executable behavior. The already historical, calendar-rewritten fixture uses small, explicitly synthetic implementation capsules and rehashes every ancestor with the existing codec. All 63/72 artifact identities/types and all required dependency/custody/review/support semantics remain validated. Artifact bytes are now 190,420/211,903; original response bytes are still exactly 167 and 133/140. This fixture is **not an execution attestation**. The separate unchanged integrated-pilot native proof in the full suite still exercises the complete captured source/execution bytes, large byte boundaries, canonical codecs and concurrent publication. No producer, reader, SQL verifier or admission rule is relaxed.

Independent test lifecycle checkpoints now occur between logical producer attempts, using only the externally held exact witness. They never refresh within the producer/reader, bootstrap from a restored database, catch a rejection and retry, or change 60 seconds. Checkpoint age-only negatives explicitly prove unchanged head/hash with expired age, check_head rejection, bind rejection and read rejection, with transaction rollback and table-count equality. Existing stale/mismatched/restore/revocation, ACL, corruption, quota, lost-ACK, crypto, immutability and expiry negatives remain. The 240-second parent and all database/transport deadlines are untouched.

Five fixed phase labels produce bounded numeric timing aggregates and SQLSTATE sets per subtest. No SQL/parameters, bodies, cryptographic material, identity hashes, DSNs or personal paths are added to diagnostic output. Raw multi-megabyte logs stay outside Git; sanitized evidence is `docs/evidence/official-truth-m1-m4-postmerge-ci-stability-1/author-verification.json`.

## Verification

| Gate | Author result |
|---|---|
| Native PG16.15 focused, three final-code repetitions | 13/13 each; 53439.029208 ms, 54056.218584 ms, 53447.57225 ms; zero fail/cancel/skip/TODO |
| Full unchanged `npm test`, default concurrency | 6326/6326, 819 suites; 411401.133791 ms; M1–M4 parent 79713.785667 ms; zero fail/cancel/skip/TODO |
| Clean npm ci; Typecheck; Lint; Build | PASS; Lint 0 errors / 144 existing warnings |
| Setup, operating mode, API, schema, dead-code, exports, dependency-use | PASS |
| Dependency advisory audits | FAIL EXISTING: 19 total (17 high, 2 moderate); 3 production high: sharp, source-map-js, ws; unchanged lockfile; reachability not assessed |
| Scope/whitespace/security boundary | One test implementation file; all 12 original subtests and assertions retained; assertions 67 → 72; protected hashes unchanged |
| Final-head GitHub Verify + actual Auth + Preview | Post-push exact-head receipt required; no pre-push PASS claim |
| Eventual actual-main push after TL merge | NOT RUN / TL-owned; #927 remains OPEN |

Host-only executable path mapping is unchanged and does not alter the test runner, SQL or results. The exact full command is the existing `npm test`; no serial override. The full gate/build process overlapped it; the first focused run also overlapped diagnostic/typecheck work. Each database was independently created and destroyed on native PostgreSQL16.15. GitHub's default runner load is a separate final exact-head gate. Three local passes do not guarantee immunity to unlimited resource starvation.

## Risks and retained gates

No hosted Supabase migration/data write, Production operation, real government original retention/source approval, real Evidence/Rule promotion, Requirements Provider activation, Auth/RLS/permission change, #913 modification, new branch/PR, paid call or recurring spend. Both existing SQL artifacts remain hosted UNAPPLIED. `SOURCE_NOT_QUALIFIED`, provider NULL and existing Workspace unknown behavior remain. Real source/legal/privacy/retention, genuine AAL2 review, managed key/independent restore witness, accepted-store activation and G7 audit reachability gates remain open. No Owner authority is needed for this test-only repair; those protected activities remain unauthorized.

The large-capsule proof remains the responsibility of the unchanged integrated end-to-end test; TL should verify that coverage separation and the new final CI timings. Future real authority heartbeat operations and infrastructure capacity are not solved by a synthetic test lifecycle correction. Any future SQL semantics, timeout or shared concurrency change still requires arbitration. CI retries are not used as a fix. Eventual post-merge actual-main CI is mandatory before #927 closure.

**Author delivery only — not TL PASS. Keep DRAFT; DO NOT Ready, merge or launch follow-up. STOP for independent Technical Lead review.**
