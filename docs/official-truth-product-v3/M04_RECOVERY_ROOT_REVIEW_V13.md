# M04 R22 — Root independent source/data review and continuity V13

**2026-11-10 11:38:05 UTC. R22 / Recovery Task V13, final v4 source and author documents reviewed; new execution pending.** This is a pre-publication checkpoint. Later exact-head PR receipts and live evidence govern. Origin #1178 is merged; the linked post-merge review-fix PR has not yet been created at this snapshot. M04 closure remains blocked.

[Actual-main failure / investigation v1](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6765598372) · [implementation v2](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6765830398) · [insertion/fallback v3](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6765902293) · [immediate review fixes v4](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6766052044)

## Actual chronology and current failure

R21 head **`ed41061cf144e5710bf49bacc729b60ac28543c7`** genuinely passed [CI 42798428417](https://github.com/Jetnity/jetnity/actions/runs/42798428417), all 31 native groups and all eight jobs. Root independently read the complete terminal non-Auth evidence, issued [FINAL PASS](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6765250488), marked Ready and performed the expected-head merge. Origin **#1178** merged at **2026-11-10T10:42:54Z** to actual main **`4bfa8b466ebc0af761fc5050bb4c51d7e73400c7`**. Its tree **`793026a2c26725da06ff281924aaa561d43ee32f`** is identical to the reviewed head; ordered parents are main890 and ed41. These historical events remain true.

Mandatory [actual-main CI 42801478210](https://github.com/Jetnity/jetnity/actions/runs/42801478210), push / attempt 1, then **FAILED**. Root independently confirmed terminal run/jobs at **2026-11-10 10:58:11 UTC** before reading completed non-Auth Repository verification **129779815566**. Aggregate **129786377654** failed; all six companion jobs passed. Typecheck/lint passed, Tests failed, hygiene/build were skipped. Auth metadata only.

**24/31 native groups passed**, including both real R9 witnesses and the complete ledger boundary. Group 25 / N05, the 64/65 cycle boundary, failed at the unchanged **240-second effect deadline**; groups 26–31 were not reached. First 23 groups total **90384 ms**; ledger group 24 **111659 ms**; failed group 25 **37652.09814 ms**. These are fixture/client observations, not server-function profiling or causal attribution.

Ledger reached index **253/253**, **256 acknowledged command commits**, one START/reservation. Cycles reached last started/completed index **34/33**, **103 acknowledged commands**, **34 STARTs/reservations**. The next outward command did not complete successfully; its final database outcome is **UNKNOWN**. No completed cycle boundary, inherited-boundary or final rollback proof is claimed for this failed run.

Cleanup completed: **27209/27209 settled, zero pending; 4242/4242 connections closed; one cluster stopped; zero children/cleanup errors; 240472 ms total / 34 ms cleanup**. Core: **8683 total / 8679 pass / 2 fail / 2 inherited layout skips / 0 cancelled**, **680370.273089 ms**. The two failures are group 25 and its mandatory enclosing test. There is no M04 skip.

Full terminal log: **4250541 UTF-8 bytes / 63137 split lines**, SHA256 **`a14ef9c860a87b331346edf23583161f80b43c69d562759401e76fb4275efa59`**. [Bounded original-line excerpt](M04_RECOVERY_R22_NATIVE_FAILURE_V13.txt): **8774 bytes**, SHA256 **`6d4b9d408c306e4eb638d7f436801575a5d8b41504f53665349c8c7432e6669a`**. Complete actual receipt is in [V13 evidence](M04_RECOVERY_R22_EVIDENCE_V13.json) and the persisted failure comment.

The genuine R21 PR receipt remains separate: **31/31**, **216548 ms / 170 ms cleanup**, **27552/27552 settled**, **4249/4249 connections closed**, Core **8689/8687/0/2/0**, all eight jobs successful. Its full log SHA256 is **`ae62a40c69cf31cc3e84684793eb3fa9d205698ded75dbe94b5259e7e98fdb10`**. Eleven earlier failure objects and Markdown records remain unchanged; actual main adds the twelfth failure. Historical success is not current R22 acceptance. The previously prepared documentation-completion template is held and was never published.

## Exact R22 correction and independent source review

Only **subject_v1** and **job_v1** bodies plus one local text declaration change in the SQL candidate. Discovery stores the existing first canonical_v1(v,0) result in invocation-local pair_text at the same evaluation point, then hashes those identical bytes. For two actual JSONB string country values it inserts kind in the exact C-sort position before the unique top-level **`,"method":`**, using overlay for zero replacement length and **strpos(pair_text COLLATE "C", ...)**. The actual kind still passes **canonical_v1(to_jsonb(kind),1)**. Closed actual keys, string escaping and the closed Method shape prove that the anchor is unique. Other country shapes retain the exact original second canonical expression; this selector does not add a refusal. No rare-collation fallback execution is claimed.

At exactly the two existing acquiredAt parser positions, explicit C equality of the original acquiredAt/updatedAt texts permits reuse of the already validated local updated value. Unequal or NULL text follows the unchanged parser at the same position. All created/updated ordering, both expiry calls, 900-second bounds and every other lifecycle/fence/state predicate remain. No hoisting or cross-call cache.

Native receives one **7192-byte N02 insertion**, SHA256 **`bdfb119db60b0812fd8e83c98f112fbcf403014f4df11147fdca8ca04e591f5b`**. Exactly **36 direct queries**: three fixed Discovery subject/digest vectors, six refusals, one anonymous DO with two Method-before-Pair message oracles, and thirteen lease cases per job kind. Root and the reviewer independently recomputed all three literal expected outputs and hashes. MethodId lengths 2/64 and revision limits are covered. Real unchanged queue derivation supplies prospective leased records without journal seeding or a new connection.

The unequal-acquired upper-bound oracle lasts **900.001 seconds from acquiredAt**, but **899.001 seconds from updatedAt**; refusal distinguishes correct fallback from unconditional reuse. Other cases cover equal/older-valid times, before-created/future, null/wrong-type/malformed/noncanonical time, expiry refusals and the exact/over 900-second boundary. The malformed-key-shape case is explicitly an earlier-guard refusal.

Two unpublished review findings were fixed in the same author session before publication: remove the prohibited root kind from the new claim envelope; force C collation on the new strpos. Root independently read the protected M04 command contract, unchanged helper and PostgreSQL 16 primary source (varlena.c blob **c1255b692f66a21cf055cbcc05393874b122f2be**). Earlier candidate pins c9717766…/e4f03b2c… are discarded, unpublished and unexecuted.

Root and the independent reviewer reconstructed the final bytes separately. All **29 declarations/signatures/attributes** and every SQL byte outside the two named functions remain. Every native byte outside the insertion, all **31 groups/names/order**, R9, full quotas, final N15, rollback, S0/I1/S1/MA1/generic coordinator/E1/native wire/lifetime, roles/ACLs/catalog, command → journal → transition error ordering and all bounds remain. No omitted history row, trust marker, source/provider effect, new object/signature, workflow/package change or shortened proof.

- scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql: **138753 bytes / SHA256 9a92e0b8d9b948df49e5c1557aa116af37607e6e282dd3af897be5b84bcf567f / Git blob 50fa3a48fb6af74dea120dc71940945bb9500537**.
- scripts/db/official-truth-v3-durable-jobs-1/native.ts: **168510 bytes / SHA256 e296958fec8e6d7afa113ccb4d24f4d7a2434cb1e3bc232ac120eb2a9efb2ec1 / Git blob f59f4b571cb22592cef94af3cbaff2bf12ca30de**.

All-18 aggregate **`8aa1579386054a9a991cc9dd63c0b61b96f60e716a731f956b66c4b5b210e77b`**; other **16 source pins unchanged**. Rollback remains **`9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66`**.

Source work model only: three Discovery subject calls in a representative dedup row can avoid six repeated Pair/Method container loops and eighteen associated key encodings, while actual-kind scalar validation remains. Equal-text leased validation can avoid two timestamp/civil_date calls. New selector/search/overlay work also exists. Complete history work remains quadratic; no controlled speedup, reliable CI margin, full-cap Rule latency or Production capacity/SLO is claimed.

## Author documents, sessions and current pointers

Root independently reconstructed all four author files and matched their bytes/SHA256/Git blobs. Both JSONs preserve all eleven prior failure objects exactly, append actual-main failure twelve, separately retain the complete genuine R21 success, bind all 18 current pins and keep current execution/native/runtime/TL-PASS/Ready/merge false. All 22 current matrix rows are unexecuted for R22; 31 native group names/order remain. Both previous Markdown texts are exact tails. Current fix PR number is pending; origin #1178 is correctly MERGED. Author self-review is never TL PASS.

Sole author remains **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, actual session **/root/m04_durable_jobs_writer_g2**, AUTHOR STOP after the final finite delivery. Same independent reviewer **/root/m04_r9_review_g2** and metadata auditor **/root/m04_live_audit_g2**. No invented Cursor title/session/generation. Original G1 and checkout remain unavailable. The original [chat transition](M04_CHAT_TRANSITION_2026-11-10.md) d9 checkpoint was actually saved; it did not prove completion. Lost stores were rebuilt from exact live evidence, and the same actual G2 sessions continued.

Root owns Task/Review/Evidence/Excerpt V13 and six current entry paths: M04_HANDOFF_V1 plus only existing marker blocks in START, ACTIVE, ROADMAP, JETNITY_HANDOFF and ARCHITECTURE. The latter two still held G1/R9-unimplemented pointers and are reconciled here. Every surrounding byte and all older historical records remain. No architecture/runtime scope is added.

Original checkout was not reconstructed. No local project/parser/SQL/native/test/typecheck/lint/build execution, installation/download, missing binary retrieval or replacement environment. Only permitted GitHub/Vercel reads and in-session text/data inspection/hashing; actual native proof comes from unchanged existing CI. Root alone reads terminal non-Auth Repository verification logs after independent completion metadata. No Auth logs or hosted data.

## Live baseline and risks

Root's fresh read **2026-11-10 11:38:05 UTC** confirms actual main **4bfa8b466ebc0af761fc5050bb4c51d7e73400c7**, mode **NORMAL**, **13 open PRs/all Draft**, **48 non-PR issues**, no new #748/#751 comments since 11:16 UTC. Auditor snapshot **11:14:32–11:16:28 UTC** independently confirms unchanged allowed Owner gates, zero origin GitHub/formal/inline or unresolved Vercel threads, active strict ruleset **21875372** without bypass, resolved threads required and merge-only integration. Required contexts remain Typecheck, Lint & Build; Auth-Konfiguration gegen config.toml; Vercel.

Production **dpl_99pQXe4BdoDExkYqxkL5eNdTJZrD** is READY/exact main4bfa/target production/aliasError null. Both jetnity.com and jetnity-app.vercel.app were independently resolved to it. Historical ed41 Preview **dpl_BSmMy6PXfqUbsbU5vepgEb3GmrRB** remains READY; it is not R22 evidence. A new fix Preview does not yet exist. These deployment metadata prove neither hosted installation nor schema state. SQL candidate remains UNAPPLIED.

D1 #1169 remains separately unfinished Draft on **300946991376b8969b383a087d47b49a7636f722**, targeting its separate integration branch. Atlas #1180, Booking #1179 and all 22 omitted binary IDs remain protected. No automatic next product slice.

- P0: no new verified Production incident in permitted evidence; forbidden hosted truth remains uninferred.
- P1: failed actual-main full native/CI acceptance blocks M04 closure. R22 is unexecuted and cannot close it yet.
- P2: quadratic validation work, unknown next-command outcome, unproved latency/Production SLO and operational uncertainty resolution remain explicit. The two unpublished source-review blockers were corrected; no runtime fix is claimed yet.
- P3: inherited layout skips, original checkout/G1 discontinuity and recovered stores remain explicit. Durable receipts and exact source pins support continuity.


## First unfinished step and final gates

Root must publish the verified finite R22 delivery on **`fix/official-truth-v3-m04-postmerge-r22-20261110`** from expected actual main **`4bfa8b466ebc0af761fc5050bb4c51d7e73400c7`**, without force, then independently read back every changed blob, complete tree and commit ancestry and create the linked Draft fix PR. New exact-head unchanged CI must pass all 31 native groups, both actual R9 witnesses, complete 254/255/256 and 64/65 boundaries, inherited-boundary proof, final rollback/late writer, full cleanup, Core/Hygiene/Build and all eight jobs. Refresh exact Preview, main/merge-base/diff, reviews/threads, rules, mode/Guardian and reserved gates before Root alone decides PASS/Ready/expected-head merge. Then verify actual new main CI/native receipt and Production on both aliases. A genuinely green PR run does not replace that actual-main gate. Concrete failure returns to the same author/session; no unchanged-known-bad rerun. Only after successful actual-main acceptance may a finite docs-only completion checkpoint proceed, with its own gates and a final existing-PR/#751 receipt rather than an endless self-attestation commit chain. No automatic next product slice.

Frozen limits: **240 s effects + 60 s cleanup / 300 s total; four outer lanes and four native operations per family; eight active native / 256 total with 16 terminal admissions reserved; eight callbacks / 128 total; 30 s outer / 5 s child; three clusters / two children / 40 aggregate work connections / two M04 observers / one method observer / 16 fixture connections per cluster.**

## Reserved Owner gates

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, pre-Owner gaps E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28. #917 specifically refused independent readback remains pending, ledger UNKNOWN, Stage2 NOT_ATTEMPTED: no retry, rephrasing, delegation, rerouting, transport switch, human SQL substitute or renewed old Owner evidence request. #1131 Ready STOP; both #1135 holds; #968 preview isolation and #911/#913 privacy remain.

No hosted DB/Auth/RLS/ACL/migration/credential action or Auth-log access, real source/provider/research call, scheduler, notification, new cost or public V3 activation. No local PostgreSQL/native/socket/parser/project/build execution, installation/download, missing binary retrieval, clone/reconstruction or replacement environment. Native proof only in the unchanged existing GitHub CI. No git fetch/push; any local git reads require GIT_NO_LAZY_FETCH=1 and GIT_OPTIONAL_LOCKS=0. Preserve all 22 omitted binary IDs. No automatic next product slice.
