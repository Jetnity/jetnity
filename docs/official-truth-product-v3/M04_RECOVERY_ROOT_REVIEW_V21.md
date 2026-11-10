# M04 R30 — independent Root source review V21

**2026-11-10 19:00:35 UTC. SOURCE REVIEW COMPLETE; current-base publication and new-head execution pending.** Exact source baseline db954248dc3181786b5a00e8f9e714ab7336e8b1 is byte-identical for all authorized paths on current e7aae86c18238033c2186722e24c84dc7a5f69b9. This permits publication for full acceptance gates, not TL-PASS, Ready, merge or hosted installation.

## Latest integration baseline — V21 amendment v3

Before publication Root detected the independent merge of travel-plan PR#1181 at2026-11-10T18:49:29Z. Current main is **e7aae86c18238033c2186722e24c84dc7a5f69b9**, tree **8918d48841c19ddaf16c128973a0f03eed481f43**, orderedparentsdb954248dc3181786b5a00e8f9e714ab7336e8b1 and7ca9b96c93b2f59b1ac7d5ca5304c80d9fd090ff. [Binding V21 v3 integration amendment](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6776400921).

Full tree comparison confirms36 intervening leaves (27modified/9added/0removed), with zerooverlap across all18M04 sources and all11R30paths. All source baseline blobs are identical; source content,author delivery and review pins are unchanged. All838 directory hashes of the new10241-entry/9404-leaf tree independently reconstruct. Root constructs the R30 tree from this current base and preserves every parallel change. Expected result:9407leaves/9396priorleaves unchanged/3newrecords.

Historical failure20 remains42869514552 ondb954; current e7 push CI42879088258 is inprogress at this snapshot and is not reclassified. It is a parallel-product merge run, not execution of the new R30 SQL digest. Current Productiondpl_2QAy8s3qEWtinWYUwBeQTeFjtUwf is READY/exacte7 through bothaliases; olddb954Production is superseded.13openPRs/allDraft/48issues. No new Owner or Guardian clearance.

### Later completed-job observation before R30 publication

Root independently observed Lifecycle130050220698 terminalFAILURE on current e7 main run42879088258 at2026-11-10 18:59:20UTC before reading its completed non-Auth log. The job passed3/4 tests; the actual mounted browser test failed with spawnSync /usr/bin/google-chrome ETIMEDOUT at browser.ts:55:23 during version discovery, with no actual mounted receipt. Full log161524UTF8bytes/SHA256b054c48129003cb7b9182d8cb26c67c0b2cb0c1828dc58c042b51354c82150c5. At that read, Repository and Atomic and therefore the overall run were still inprogress; no final whole-run or current M04 result is invented. This is additional parallel-main evidence, not R30 execution and not a runner-cause diagnosis. All R30 lifecycle/CI gates remain mandatory; no retry, timeout change or new browser implementation is authorized here.

## Concrete problem and authorized correction

Actual-main CI42869514552 failed at M04's unchanged240s effect limit after24/31 groups. R29 PR CI42866958332 had genuinely passed on the identical tree. Both facts remain preserved; elapsed client-test times do not establish a runner cause or server profile. Full actual-main acceptance is still missing.

[Task V21 v2](https://github.com/Jetnity/jetnity/pull/1182#issuecomment-6775939100) selects exactly two SQL helper bodies and additive fixed N02 oracles. The same actual G3 author delivered exact text; independent reviewer /root/m04_recovery_source_review_g3 and Root separately reconstructed and hashed it. No local project/parser/SQL/native/build execution occurred. Author self-review did not grant acceptance.

## Exact whole-file and scope verification

| File | UTF-8 bytes | SHA256 | Git blob |
|---|---:|---|---|
| jobs-candidate.sql | 140539 | a61011a2bfd0d11c451302e8e434c25fec37f47415f34f3f25da785d1aea7174 | 36ce89a5bf9a3b4eae096701c3e33af3d85ad029 |
| native.ts | 191098 | f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0 | 0b3f7d9906687ec42171de5af60fed009d07b39f |

Exactly two full-function replacements invert to the complete original SQL139439bytes/SHA25625edf46e7ab52d316fa1c30ea7dde33f43b439df115ff19f84099b8b6d7330ce. All29 declaration/attribute pairs, including3 SQL BEGIN ATOMIC bridges, and every byte outside the two bodies remain identical. Thus roles,ACLs,RLS policies,triggers,catalog,authority,all other27 bodies and caller/history/error order are unchanged.

The one contiguous12120byte native insertion has SHA2569e84c778c03b3c94b59dc0836bf1ff51b22ee689eb817145eb98897ed6f9b5d8. Removing it once at its unique N02 anchor recovers every original native byte:178978/SHA2563f5c018cff240de0769d3b100c42aa5e56d36a2762c48e8a1ab5286559d42744. The original36-row R24 block remains6615bytes/SHA256d7fd7bfd80b5ca958bfb7a6de3cc400f811839d275de02282c585eb49b35f706. All31 proof call lines/order and every pre-existing assertion,wait,quota,budget and cleanup remain intact.

Root freshly read/rehashed all18 baseline sources. Only the SQL/native rows change; the other16, including rollback, remain exact. The new aggregate is **a2a6901ed24d75fd3e6a2495628f8a32390bfb158be672254e4010afe847d04e**, using the historical defined format: SHA256 SPACE decimalBytes SPACE repositoryPath LF, sorted by repositoryPath. The old aggregate d2753193415468a06ea93f23e21b40e3e2b822a5dd6d3736d28db6eafd24f761 is retained as historical evidence.

## Exact-key proof and bounded countercost

The original outer NULL/object guards remain. Nested CASE first checks expected cardinality0..32, then actual safe-object key count equality, and only then executes deletion. This does not depend on AND evaluation order. A safe object prevents scalar-deletion/key-enumeration errors; arrays with more than one dimension are flattened, preserving original unnest semantics and avoiding PostgreSQL's multidimensional-deletion error.

Because JSONB keys are unique, equal counts plus removal of every actual key establishes a byte-bijection: no duplicate,NULL,missing or unknown expected entry can pass. Positive proof returns unforced expected=expected, retaining text equality and input-collation initialization/errors; empty arrays retain no element comparison. Unsuccessful proof executes the unchanged two ordered-array comparison, retaining any collation-sensitive equality that byte removal cannot establish.

Deletion performs at most1024 candidate-key iterations;32 distinct successful keys require528. The failed proof can construct undeleted nested values and then execute the old sorts. That is an explicit countercost; the32-key cap is not a byte-copy bound. Above32, the old comparison is used directly. No cross-call cache, trusted marker, history omission or new rejection is introduced.

## Civil-date proof and caller context

The original NULL/ASCII-regex/yearzero guard is verbatim. Only positively valid Gregorian years1..9999/months1..12/day-within-month bypass the exception block. The same make_date and same to_char(date,'YYYY-MM-DD')=t still execute. Calendar-invalid values retain the original guarded construction/roundtrip and the original two caught conditions.

Pinned PostgreSQL16 source confirms: regex range0–9 is the ASCII codepoint interval; fixed-width integer parsing is safe; make_date uses Gregorian validity; date-to-timestamptz and numeric formatting remain far inside date/timestamp bounds for these years, even with the signed-int-second timezone offset bound. The fixed format cannot raise22007/22008 for the positive branch; unrelated locale/encoding errors still propagate from the same formatting call. An exception subtransaction/child evaluation context is avoided for valid dates, with bounded integer arithmetic added.

No UTC or collation is forced. The existing context-sensitive behavior is deliberately preserved:2011-12-30 is accepted in UTC but its Pacific/Apia date roundtrip formats the skipped day as2011-12-31 and returnsfalse. Adjacent dates returntrue. This follows from IANA's transition and PostgreSQL's preceding-offset selection for skipped local times. It is an oracle expectation for existing behavior, not a new date policy.

Primary implementation pins and URLs are in [complete V21 evidence](M04_RECOVERY_R30_EVIDENCE_V21.json); they refer to PostgreSQL commit c372fbbd8e911f2412b80a8c39d7079366565d67 and [IANA tzdb2025b](https://data.iana.org/time-zones/tzdb-2025b/australasia). CI must establish the behavior of the existing native binary; source reasoning alone is insufficient.

## Additive fixed oracle review

Eight new key rows exercise multidimensional lower bounds with exact,NULL and duplicate values; scalar/SQL-NULL JSONB;32-element NULL/duplicate lists; and32keys with33expected entries. Every wanted result is literal and is checked against default/C candidate results and the historical expression. The old36 cases and32/33boundaries remain unchanged.

The same existing fixture runs36 literal calendar rows across UTC/Pacific-Apia and ISO,MDY/SQL,DMY:144 actual checks with independent historical protected-expression comparisons. Eight timestamp rows per context add32 acceptance/refusal checks with exactP7601/message and fixed expected UTC text. Loop-variable arguments prevent a constant immutable call from being reused across contexts. Counters require4/144/32 observations. All set_config changes are statement-local; both in-DO and external before/after assertions verify TimeZone/DateStyle restoration. No new fixture,SQL function,collation,conditional pass or skip is added.

## Limits of the result and next gate

The static first254-command history model yields64516 row validations,906266 exact-key calls and194055 civil-date calls. It covers both pre/post history and excludes other request work,later ledger and cycles. This is not server profiling or a speed guarantee. Full history remains quadratic.

Root authorizes only exact publication of2source+9continuity paths on the linked Draft branch from currente7 under V21v3. The complete current10241-entry/9404-leaf integration tree reconstructs all838 directory hashes, with all36 intervening leaves preserved. Publication requires full readback,exact diff/merge-base/ahead/behind,all unchanged leaf/binary identities and source pins. Then all8 current-head CI jobs,31nativegroups,R9/fullquotas/inherited/finalrollback/cleanup,lifecycle,Core/fivehygiene/Build,exactPreview and fresh live/Owner/rules/review gates must pass before Root may consider Ready and expected-head merge.

Actual resulting-main fullCI/native/Production through both aliases remains separate. Only after that genuine PASS may the authorized8-path finite docs closure proceed through its own PR and actual-main gates. Final receipts on existing PR/#751 without another self-attestation commit; STOP. All reserved access/Owner gates and budgets in the [handoff](M04_HANDOFF_V1.md) remain. SQLUNAPPLIED,MethodNOT_APPROVED,#1139NOT_RELEASE_READY/17gaps,#917UNKNOWN/Stage2NOT_ATTEMPTED/no substitute. No automatic next slice.
