# R4-CORRECTION-1 result — author verification

Input HEAD 5f3869bf284bf63c991db26b2e296373644cbbaf. Implemented only [R4-F1](https://github.com/Jetnity/jetnity/pull/935#pullrequestreview-5502418180) within its express protected-file permission. This is not an independent security PASS.

## Exact code scope

`bernResearchIndicators` replaces one raw URL-prefix regex with 12 lines of private classification: quoted/unquoted src/href references, fixed Bern document URL as base, parsed `URL.host` comparison (normalized case/default port, non-default port distinct), and conservative handling of invalid/ambiguous/unsupported values. All four R4 counterexamples now set the external-resource indicator. Relative/same-host controls remain negative. Other indicator predicates are unchanged.

No new helper/export/dependency. Functional source diff: 12 insertions, 1 deletion, entirely within that function. Test diff: 45 appended lines, 29 named synthetic cases. Remaining added paths are this result, PLAN and HANDOFF. The complete shared source before bernResearchIndicators and from bernResearchBlocked onward is byte-identical to the input commit. No other code, package/lockfile, workflow, authentication or transport changes.

## New local gates

| Check | Result |
| --- | --- |
| Red regression run before correction | 30 pass / 14 expected failures, including all four TL counterexamples; no test assertions weakened |
| Entire task test directory after correction | **192/192 PASS**, 10.233s, no fail/cancel/skip/todo |
| Full npm test | **6647/6647 PASS**, 819 suites, 359.158s, no fail/cancel/skip/todo |
| Native PostgreSQL16 M1–M4 | **78.967448536s / unchanged 240s**, PostgreSQL16.15 |
| npm run typecheck | PASS |
| npm run lint | PASS, 0 errors / 145 pre-existing warnings |
| npm run check:setup:ci | PASS, existing missing-local-env warning; no credential creation |
| npm run check:operating-mode | PASS, NORMAL |
| npm run check:schema-bezug | PASS, 22 tables/views and 25 functions; existing LOCAL/UNAPPLIED distinctions retained |
| npm run check:api-schutz | PASS, 12 protected routes |
| npm run check:dead / check:exports / check:deps | PASS |
| npm run build | PASS |
| git diff --check | PASS |
| Original/R3 immutable task blobs | fc4a2db0fd9a3ee552ce6da212d696ee38ef8135 / 08a1e1a230e0a60f109e38a17dc600ed93bab25b, unchanged |

Targeted command: `node --import ./scripts/server-only-test-register.mjs --import tsx --test 'lib/readiness/official-truth-bern-g3-rq-fetch-1/*.test.ts'`. Each new case passes synthetic bytes through the existing research seam, checks the expected boolean, exactly one mock request to the fixed Bern URL and no raw fixture URL/HTML in the outcome. The inherited all-100-redirect, framing/131072-byte/timeout/abort, authorization, cross-process claim simulation and hard-live-refusal tests passed again.

Full suite: existing `jetnity-r2-validation:local` image with `--network none`, read-only repository mount, disposable /tmp/r4-repo copy, existing lock-matched node_modules, `env -u PG_MAJOR -u PG_VERSION -u PGDATA npm test`. Node22.23.3 and native PG16.15. No hosted database. Lock SHA256 remains 8dead8237adef171588abd088e25f9be2472a7458121e4198cacd8ece224a7da. Existing installed dependencies were reused locally; the new CI run performs its own npm ci.

## Publication and limits

The publishing commit is a single descendant of the exact input on the existing task branch. Its exact SHA/tree/diff, ahead/behind, fresh original GitHub Verify/Auth logs and matching Preview are in the final publication receipt, avoiding a self-referential commit hash. No former-head gate is used as proof for this correction.

This remains an over-approximating finite observation, not general HTML parsing or an absence/privacy/rights certification. Ambiguous entities, controls, broken quotes, backslashes and unsupported schemes can set a positive hint even without a proven external HTTP resource. Negative hints do not establish absence of external resources, tracking or personal data. No source has been fetched or qualified.

LIVE B HARD-BLOCKED; all original trust/auth/TLS/DNS/SSRF/bounds/redirect safeguards unchanged. No real tag, ruleset/secret/Supabase/Production change, source GET, new agent, follow-up, Ready or merge. Six review threads remain for independent review. G7 19 advisories and P2 PG runtime variability remain open; zero new recurring cost. STOP for independent TL re-review.

## Local log integrity

SHA256 below identifies test/build logs only, never government-source content.

| Log | SHA256 |
| --- | --- |
| r4-red-regressions.log | `88d0b6578aef0cd1df295ccafd912c7e3dcf2b379074435eb4e4fea72ad39336` |
| r4-targeted.log | `4e3bacc28acfb886e1b093dae6ad6fc0a4679f2d9efa3d09c32760827ee6dfc3` |
| r4-full-tests.log | `8c6196eb1a62983af57e765985c1b93a785381875e3c11adc151d1dd0b5c3aa7` |
| r4-check-0.log | `dd3664593253fd7f51f6967257a09ef001e381f7c8968d6b82c9d5cd462ed848` |
| r4-check-1.log | `1e468397195614e3002d19e01e60f6c79e3390818ccf9766dd4d5cb086365514` |
| r4-check-2.log | `9199f6fa2bc2ab0fc473030eb3569748cc3dcbab9b8cc051939fed05c3369d8c` |
| r4-check-3.log | `cdfdceb4bbbe57777c6c19a46a0ec2ab2f61b36dcf79a19710e38a0206774a5d` |
| r4-check-4.log | `b0045c5119b0db679d23c0bde2efa30e4987390d9f38107eb7b2c446542bba7d` |
| r4-check-5.log | `68521a53655070c33953244451145b33fc6bda961bc3dd65b93c5e4ed72b9f79` |
| r4-check-6.log | `0a2dca793641f33b1b99bbbb6d46f296d52176f8c467f1d043837f30a09cd1f1` |
| r4-check-7.log | `e93933dd64bf35c8d02baf9e17ca3d48e081910f352150061e72c7bfb88e3f7f` |
| r4-setup.log | `50fb68f691e14953bf4bb2c369056edb522f693f1e333ad7289240a79e6723a5` |
| r4-build.log | `4a74791f7f06ec60e94f80ae677c749548f920259a8c7faa7db1366dea32c28b` |
