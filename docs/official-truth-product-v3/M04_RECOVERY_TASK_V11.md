# M04 Recovery Task V11 — R20 numeric and identical-time reuse

**Version V11 / 2026-11-10 06:49:34 UTC.** Authoritative finite dispatch: [R20 diagnosis](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760723089) and [Root authorization, including C collation](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6760854161). This file records that same approved task; it does not broaden the Phase-A freeze or Task V1.

## Baseline and actual blocker

Baseline **72868a287280a6c1d96222268a1413110ec95039**, tree **06ac3e6d4eedbb3e42795bff942b19364a45a848**, main/merge-base **890dfe9323b4b6d3644c372d81cb8893b6548d11**. PR #1178 stays Draft. Actual CI 42767273189 failed at final group 31 after 30 passed; both quota groups and R9 passed, but the fixed 240 s budget was reached. Cleanup completed. Full facts and exact historical receipt are in [Root Review V11](M04_RECOVERY_ROOT_REVIEW_V11.md) and [evidence](M04_RECOVERY_R20_EVIDENCE_V11.json). No Native-/TL-PASS or unchanged rerun.

## Authorized finite source correction

Only **canonical_v1(jsonb,integer)** and **job_v1(jsonb)** bodies change. The three existing numeric branches replace the existing text assignment with one unconstrained numeric assignment and use that local at four existing conversion sites. Both trunc calls, condition structure, safe integer bounds, original errors, output, all other scalar/container processing and depth checks remain.

job_v1 retains the mandatory created timestamp parse first. Only the following updated assignment reuses that successfully validated value when the original extracted texts compare equal under explicit **C collation**. NULL, malformed or different updated input follows the original timestamp parser. Different textual representations of the same instant never qualify. Every later lifecycle, lease, backoff and time predicate remains byte-identical.

The single **2417-byte N02 insertion** adds **24 direct SQL queries**: ten timestamp cases for each of Rule and Discovery plus four fixed raw-numeric cases. Prospective queued jobs come from the unchanged real coordinator helper without journal writes. Valid equal/later times return the exact job; equal-invalid creation, malformed/NULL/wrong-type update, earlier updated time and noncanonical same-instant text refuse. Time keys remain present so closed-key rejection cannot mask the changed path. Raw numeric literals preserve exact fractional/endpoint precision and test mixed reassignment/recursion, signed zero and rejection after a valid number. The private JSONB signed-zero oracle does not weaken the unchanged raw-wire negative-zero refusal.

Every byte outside those two SQL bodies and that native insertion is unchanged. All 29 signatures/attributes, object inventory, role/ACL contracts, nodes_v1, history/command/transition/subject/catalog/authority/audit/fence checks, transaction/API flow and rollback remain. So do the 31 proof names/order, R9, final N15, quota fixtures, diagnostics, timers, ownership and cleanup. No cross-call cache, trust flag, history seed, skipped row, new object/signature or loosened guard.

Source model only: 254 successful ledger fills perform 254² = **64516** historical row validations. Their unchanged queued jobs have identical createdAt/updatedAt text; each transition job validation can avoid one repeated timestamp_v1 and its civil_date_v1 invocation. The representative Discovery dedup row has 39 numeric canonical leaf visits, removing 117 written repeated conversions. These counts are not a server profile, measured speedup or guarantee. Complete history work remains quadratic; full-cap Rule latency and Production capacity/SLO remain unproved.

## Delivery and ownership

Only jobs-candidate.sql, native.ts and the four existing Phase-B author evidence documents may be changed by the author. Root independently reconstructs final contents and pins. All other 16 source files are unchanged. Root owns this task, review, evidence/excerpt and current pointers. Ten historical failed-head records remain, all 18 source pins agree, 22 current matrix rows stay unexecuted/false and all 31 required groups stay identical. Author stops after delivery; no publish, Ready or merge.

SQL **138254 bytes / SHA256 18c5d6c7f724e9c90c2f6e2aa96b429afb397d405db355057071d195b1c5417e / Git blob 779f45640fa80d1f64282191d94ed365e7fdb31a**.

Native **159763 bytes / SHA256 7c1770792308989ee09dd460d97cc7df0c1193f45326612c842147abd3020810 / Git blob 810ed62e7c19e7f3d88d2ce9e88e767dcacaa39d**.

All-18 source aggregate **cd76347b518c7c8cecd5661e73886712a8597164c8f98b3c8acebc84be9ae87e**. Only these two source files change from R19; the other 16 source pins and rollback **9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66** remain. All four author files retain ten historical failures, 18 source pins, 22 current-unexecuted matrix rows, the unchanged 31-group inventory and exact previous Markdown tails. Current R20 execution/native/runtime/TL-PASS fields remain false.

## Acceptance and first unfinished step

At this explicitly pre-publication snapshot, finish Root expected-head publication of the independently reviewed finite R20 files, then read back every changed blob and the complete tree/ancestry. The automatic unchanged CI on the resulting exact head must complete all 31 native groups, both actual R9 witnesses, real 254/255/256 and 64/65 boundaries, inherited-boundary evidence, complete cleanup, Core/Hygiene/Build and all companion jobs. Refresh main/merge-base/diff, exact Preview/Production, reviews, mode/Guardian/rules and Owner gates before deciding Ready/merge. Any changed head invalidates older exact-head acceptance. A concrete failure returns to the same author; no unchanged-known-bad rerun. Later PR publication/CI receipts and live evidence supersede this snapshot.

Frozen budgets: 240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.

After eligible normal integration, Root must independently verify actual-main CI and Production. Source acceptance alone never closes runtime acceptance. The normal dormant scoped merge can be autonomous only after all applicable exact-head gates; no public/hosted activation is included. No automatic next product slice.

## Hard boundaries

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.
