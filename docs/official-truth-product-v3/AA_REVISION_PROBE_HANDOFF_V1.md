# CH-DE-AA-REVISION-PROBE-1 — author handoff V1 / A5

## Current A5 state

**UNARMED / policy.runNumber: 0 / immediate same-session source fix / independent review and new-head gates pending.**

Authority is [Root TASK V1/A5](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6821817364). The corrected persisted comment, dated 12 November 2026 without the removed clock time, is appended verbatim to the Task with its URL.

Same actual author: **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**.
Same original actual session: **/root/aa_revision_probe_writer_g1**.
No successor or resumed Cursor UI session is claimed.

This immutable candidate is not published by its author. Existing PR #1192 remains Draft/CHANGES REQUIRED on published head `b16bf9933e234e8ab1ee89c9d76f3c66e7a2ba68` until Root independently reviews and performs the expected-old-head update. That exact head is the candidate's sole parent; the intended update is a normal fast-forward. Current integration base/main is `dfd692440762b50183fdebbfd6bf8dabde4662d0`.

The preceding A4 candidate was actually published and its unarmed CI ran. Its old source-only/not-published statements below are historical, superseded for current status by the following actual failure evidence. Policy stays Run0. Historical positive selection #4120 remains consumed; A5 selects no positive run, retry or external source request.

## Actual A4 CI and finding AA-A5-SCHEMA-01

[CI 43168250658 / #4121 / attempt 1](https://github.com/Jetnity/jetnity/actions/runs/43168250658), verify job **131015096539**, completed FAILURE on exact head b16bf9933e234e8ab1ee89c9d76f3c66e7a2ba68.

The author independently read actual job step metadata: Typecheck, Lint, Tests and Admin API protection SUCCESS; schema usage FAILURE; the following unreachable-code, uncalled-export and unused-package checks SKIPPED; Production build SKIPPED. All five companion lanes and the Auth metadata lane succeeded, while the required aggregator failed. No Auth log was read.

Root's full original verify-log review, recorded in A5, covers **4,277,093 UTF-8 bytes**, SHA256 `158836d3d2dc86a31dbb716629455f50770597c4c2280570e48b144b4712a5f5`. Root records 8,730 core tests, 8,728 passed, zero failed and two existing skips, including a passed AA synthetic preflight entry. Those detailed counts and the original-log observation are attributed to Root's review; this author did not claim to read that complete log.

The actual diagnostics at 06:39:18 UTC identify table names x and changed at AA test lines 136 and 726. The author read both exact source sites and the complete unchanged checker `scripts/db/verwendung.mjs`, Gitblob `192a2f9002515cccc2d67db4782bfedbff6748b1`. Its literal .from recognition does not type the receiver. Both reported sites construct synthetic Buffer bytes: one extends a file during the growth-fault case; the other mutates source-inventory bytes. They are not database calls or missing migrations.

**The policy in that run was Run0 / UNARMED. There is no real AA observation or MATCH.** Successful synthetic tests do not make this failed CI a complete gate PASS. The exact-old-head Preview `dpl_ADR4uaV21xL57PYV64pjzpLgYfCX` is READY according to Root A5 evidence, but neither replaces CI nor covers the forthcoming head.

This is an ordinary source/checker compatibility failure, not a platform/security denial. #917 and #1131 boundaries remain unchanged.

## Exact two-site fix and inverse proof

Only these two AA-test source constructions change:

| Existing construction | A5 construction | Identical byte values |
|---|---|---|
| `Buffer.from('x')` | `Buffer.from([120])` | 120 |
| `Buffer.from('changed')` | `Buffer.from([99, 104, 97, 110, 103, 101, 100])` | 99, 104, 97, 110, 103, 101, 100 |

Each old construction occurs exactly once at the parent, and each replacement occurs exactly once in the candidate. All other test text is exact, including both negative cases, their assertions, fixture behavior, preflight sequencing and the real-entry call site. There is no suppression, skip, deletion, receiver-checker change or relaxed assertion.

The source-only inverse operation replaces those two complete numeric constructions with their original string constructions. It recovers the entire parent test source byte-for-byte:

- Parent/inverse bytes: **45422**.
- Parent/inverse SHA256: `c29587c5314b7c4f3a7dea5d66e3fb7c9e612b3822076a4f8b99fb508793b4a5`.
- Parent Gitblob: `6da4fe65f0c40c56c4cf49bcdff2ea4d6d975fe6`.
- Candidate bytes: **45448**.
- Candidate SHA256: `ca95ba6e164952a0046a4979e9d576e2473cc4b0e1780a9a68cb87c52209ba72`.
- Candidate Gitblob: `a3f35c4f1d400b8acaca38c82484f0b7093dee07`.

These are source/metadata comparisons and independent byte hashing, not execution of the test, fixture, checker or project code.

## Policy, Reader and history preservation

Policy changes only the AA-test inventory row's byte count and SHA256, from 45422 / c29587c5314b7c4f3a7dea5d66e3fb7c9e612b3822076a4f8b99fb508793b4a5 to 45448 / ca95ba6e164952a0046a4979e9d576e2473cc4b0e1780a9a68cb87c52209ba72. Reversing that single row restores the complete parent policy source exactly. All twelve other inventory rows are exact.

Run number 0, base SHA, URL, binding, expected V2 pin, budget, claim, selection/caller restrictions and finite-output behavior remain unchanged. Run0 refuses before event/filesystem/claim/DNS/HTTPS effects. No future positive run is selected here.

Reader `2b14953968da35ca47b272fd67a1a912613b8e6d` and BP1 test `7b027b49af72a3f16b230acfeff7434f9a71b64e` stay byte-identical. A3's full original Reader reconstruction, exact two-addition/current-Reader pins and negative preservation witnesses remain unchanged.

The full **32623-byte prior Task** is an exact prefix followed by the complete corrected A5 comment and its URL. The full **41267-byte prior A4 Handoff** is retained verbatim in the historical section below, including all earlier amendments, limitations and failed-selection history.

## Current source manifest

The five non-Handoff blobs are fixed before this document is written. This Handoff's own hash and the final candidate commit/tree are supplied externally to avoid self-reference.

| Path | UTF-8 bytes | Git blob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `2b14953968da35ca47b272fd67a1a912613b8e6d` | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 3874 | `1630bdc14e40893fe9a1e398d8f5922c64aee849` | `6bcb96a7091349d0e7cac7d6cac67bd18a49cbdad9dc89b1f1c04be8e8c6e667` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45448 | `a3f35c4f1d400b8acaca38c82484f0b7093dee07` | `ca95ba6e164952a0046a4979e9d576e2473cc4b0e1780a9a68cb87c52209ba72` |
| lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts | 25526 | `7b027b49af72a3f16b230acfeff7434f9a71b64e` | `3804730801ec6713d75ee62d71a7e9c2e02a779469e59270d09a1e168b90884b` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 36733 | `b636b0eb4a4632cfaee313de16b5f6c247218345` | `5c0fa6a04ea011a5502c376c6bdc170d4511ac4d65c5fb9a085b72e992e5d200` |

Exactly AA test, policy, Task and Handoff may differ from the sole parent. Exactly the existing six paths differ from integration main, with all 9474 other main leaves preserved in object, mode and type. No schema, generated type, checker, workflow, package, SQL, public route or additional consumer changes are part of A5.

## Honest self-review and remaining gates

Verification by this author is limited to complete source/metadata comparisons, byte hashing, inverse proof, Git-object readback and full-tree preservation. **No project, parser/compiler, test, lint, build, install, native/SQL or external-source execution was performed.** No ref/PR was published or updated, no CI was rerun, no positive run was armed and no Ready/merge action occurred.

Author self-review is not independent Technical Lead PASS. Root and an independent reviewer must review the exact new candidate before Root alone may update the branch with expected old head b16bf9933e234e8ab1ee89c9d76f3c66e7a2ba68. A subsequent ordinary unarmed CI verifies a new head; it does not retry the consumed selection #4120 or convert failed #4121 to success.

Required new-head evidence remains full actual CI, including synthetic preflight, preserved BP1 tests and every later hygiene/build gate, all required companion lanes, exact new-head Preview, current main/base equality, and review-thread/review disposition. Earlier passed stages or READY Preview do not cover a changed head.

Only after actual complete unarmed gates may Root make a separate explicit decision about a later positive one-shot selection, with fresh main/workflow inventory and independently reviewed exact-head source. A5 does not authorize that follow-on. A real platform/security denial remains a stop and is never retried or routed around.

A1's exact passive private Native-Harness boundary and R1's bounded AST-analysis statement remain unchanged. Arbitrary runtime-computed paths/names are not universally resolved by the source guard; full exact-tree/diff/source review and unchanged legacy pins remain separately necessary. No new consumer is permitted.

No hosted installation, D1 activation, custody/legal admission, pilot-window extension or public CH-DE activation is claimed. **Public CH-DE remains NOT LIVE.** All existing product/authority/install/public gates and #917/#1131 STOPs remain intact.

**Author stops after immutable candidate delivery. Same actual session remains reachable for an explicit immediate review fix; there is no automatic follow-on.**

## Historical A4 handoff — preserved verbatim

The following complete document is the prior published b16bf9933e234e8ab1ee89c9d76f3c66e7a2ba68 Handoff. Its pending/not-published statements predate actual failed CI #4121 and this A5 correction. It is retained as history and cannot override the current evidence or Run0 disposition above.

---

# CH-DE-AA-REVISION-PROBE-1 — author handoff V1 / A4

## Current A4 state

**UNARMED / policy.runNumber: 0 / same-session source fix / independent review and new-head CI pending.**

This immutable candidate has not been pushed by its author. Existing PR #1192 remains Draft/CHANGES REQUIRED on published head `38fd761205d33fd32ff14bc680fa4699e32f15f4` until Root performs its independently reviewed expected-old-head update. The new candidate's sole parent is that published head, making the intended update a fast-forward. Integration base/current main remains `dfd692440762b50183fdebbfd6bf8dabde4662d0`.

Same actual author: **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**.
Same original actual session: **/root/aa_revision_probe_writer_g1**.
No successor and no resumed Cursor UI session are claimed.

Authority is [Root TASK V1/A4](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6816241910). A4 explicitly disarms the previous positive selection. **4120 is consumed and is not retried, silently renumbered or rearmed.** The historical positive-selection statements preserved below are superseded for current status by this Run0 state.

## Actual failed selection and absence of source observation

Selected CI **43165807743 / #4120 / attempt1 / pull_request**, verify job **131007285525**, belongs to published head 38fd761205d33fd32ff14bc680fa4699e32f15f4. It completed FAILURE.

Root read the complete original verify log: **197714 UTF-8 bytes**, SHA256 `145ef09582cfa31dfd9e197b7e287ad87ec04cd25b6a0b7d6832db2f1261e648`. A4 records the exact error at **2026-11-12T06:08:28.8870261Z**:
`lib/readiness/official-truth-aa-revision-probe-1.test.ts:260:3`,
`@next/next/no-assign-module-variable`, assigning the local variable `module`.
Summary: one error and 195 existing warnings; exit 1 at 06:08:29.2122215Z.

This author independently read the actual job step metadata: Typecheck SUCCESS, Lint FAILURE, Tests SKIPPED, all five later hygiene steps SKIPPED, Production build SKIPPED. The prior Typecheck result covers only its old exact head; it is not a gate for this changed candidate.

The real AA entry is inside the skipped Tests flow. Root's full original contains no `AA_REVISION_PROBE_V1` record. No AA observation, MATCH or current source revision was obtained by that selected verify job. Other old-head workflow jobs do not turn this failed selection into a candidate PASS.

This is an ordinary lint failure, not a platform/security denial. It does not clear or alter #917/#1131 boundaries.

## Exact minimal fix

The AA test changes only two occurrences of one local identifier:

- `const module = loadFixtureModule<{` becomes `const readerFixture = loadFixtureModule<{`.
- The matching returned entry reference uses `readerFixture.probeOfficialTruthAaReviewedRevisionV1`.

The existing `FixtureFs.module()` method and `files.module()` call remain unchanged. Reversing these two replacements restores the complete prior test source byte-for-byte. No preflight, negative case, transport behavior, assertion, lint rule, skip or workflow is changed.

Policy changes only:

1. `runNumber: 4120 as number` becomes `runNumber: 0 as number`.
2. The AA-test inventory row changes from 45408 bytes / SHA256 `487789d625d885d5567438f8ee1a2c5ad1870e6a208154f18949bcacae3228cf` to 45422 bytes / SHA256 `c29587c5314b7c4f3a7dea5d66e3fb7c9e612b3822076a4f8b99fb508793b4a5`.

The other twelve inventory entries are exact. The selected base, URL, budget, expected V2 pin, binding, claim, caller restrictions and finite output remain unchanged. Run0 closes the actual entry before filesystem/DNS/HTTPS selection effects; this new candidate selects no external AA request.

Reader blob `2b14953968da35ca47b272fd67a1a912613b8e6d` and BP1 test blob `7b027b49af72a3f16b230acfeff7434f9a71b64e` stay byte-identical. A3's complete original Reader reconstruction, exact two-addition pins, current Reader pin, twelve in-memory negative-case sources and all other BP1 protections remain intact.

The complete prior Task is an exact prefix, followed by the full A4 comment verbatim and its persisted URL. The complete prior A3 Handoff is retained verbatim in the historical section below.

## Current six-file inventory

The five non-Handoff blobs are fixed before this Handoff is written. This file's own hash and the final candidate commit/tree are delivered externally, avoiding self-reference.

| Path | UTF-8 bytes | Git blob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `2b14953968da35ca47b272fd67a1a912613b8e6d` | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 3874 | `4ccf8276dbc24fd989ce0d1d7f0fb0a9e3b84c9c` | `24a41f9a9dd3909d27a2b939337c074cacfd1416c43f036a17e5140bc1ca9f14` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45422 | `6da4fe65f0c40c56c4cf49bcdff2ea4d6d975fe6` | `c29587c5314b7c4f3a7dea5d66e3fb7c9e612b3822076a4f8b99fb508793b4a5` |
| lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts | 25526 | `7b027b49af72a3f16b230acfeff7434f9a71b64e` | `3804730801ec6713d75ee62d71a7e9c2e02a779469e59270d09a1e168b90884b` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 32623 | `78226548a1f6038bddc12fe7eed563ef694f2af4` | `4fb8cc7d11c9884fb0c12475284e4df0c83865db67cb9576472fe44540755efb` |

Exactly the same six paths differ from the integration base. Relative to published A3 head 38fd7612, only AA test, policy, Task and Handoff change. Every other leaf, including Reader and BP1 test, must remain object/type/mode-identical.

## Honest verification limits and remaining gates

The rename and pin changes were verified by complete source/metadata comparison and immutable Git-object readback. **The author has not run project code, a parser/compiler, tests, lint, build, native/SQL work or an AA/network request.** There is no new-head runtime PASS yet. No ref/PR update, Ready or merge was performed by the author.

Root and an independent reviewer must review the exact new source/tree/diff. Root alone may update the existing branch with expected old head 38fd761205d33fd32ff14bc680fa4699e32f15f4. The resulting ordinary unarmed PR CI is verification of a new head, not a rerun of 4120.

Required evidence remains: complete actual unarmed CI, including synthetic preflight and preserved BP1 checks; all required companion gates; exact new-head Preview; current main/base equality; and review-thread/review disposition. Prior Preview `dpl_FYqy1Eoc9eJyD2qffpyaZxg4GY7o` is tied to old 38fd head and cannot cover this candidate. Ready, merge and any later actual-main/Production acceptance remain Root decisions with their own exact-head evidence.

Only after full actual unarmed CI and synthetic preflight PASS may Root consider a separately persisted and independently reviewed future positive one-shot selection, with a fresh main/workflow inventory. That is not automatic and is not selected by A4 or this author. A consumed selection or a genuine security/platform refusal is never bypassed by rerun, another transport or silent rearming.

A1's passive private Native-Harness transport and R1's bounded AST-analysis statement remain unchanged. Arbitrary runtime-computed paths/names are not universally resolved by the guard; complete exact-tree/diff/source review and unchanged legacy pins remain separately necessary. No new consumer is permitted.

No hosted installation, D1 operational binding, custody/legal admission, pilot-window extension or public CH→DE activation is claimed. All existing product/authority/install/public gates and #917/#1131 STOPs remain intact.

## Historical A3 handoff — preserved verbatim

The following complete document belongs to published candidate `38fd761205d33fd32ff14bc680fa4699e32f15f4`, before the actual lint failure and this A4 disarming. Its earlier selected 4120/source-only/not-published statements are historical; they do not override the current failed-selection evidence or Run0 state.

---

# CH-DE-AA-REVISION-PROBE-1 — author handoff V1 / A3

## Current A3 disposition

**CHANGES REQUIRED A3-BP-PIN-01 → corrected source candidate / independent review pending / NOT PUBLISHED / NOT EXECUTED.**

Root's [TASK V1/A3](https://github.com/Jetnity/jetnity/issues/1162#issuecomment-6815846159) identified a deterministic source incompatibility in the previous A2 candidate `adfa7e43cc723b6f852b0182b7c5ca7c211a99a6`: the existing BP1 protection test required the entire modified Reader to remain Gitblob 5998fdea. The prepared Reader is Gitblob 2b149539. That defect was found before publication or execution. Earlier source-preservation and inventory observations remain valid; they were not a candidate/runtime PASS.

This is the immediate review fix by the same actual author **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**, actual session **/root/aa_revision_probe_writer_g1**. No successor and no resumed Cursor UI session are claimed.

Sole parent remains `dfd692440762b50183fdebbfd6bf8dabde4662d0`, accepted base tree `cbc79e627161d4ace132b84cf057c18adc86586c`. The independent main metadata read during this preparation still identified that commit. The existing A2 selection remains **CI 4120 / attempt1 / pull_request / verify**. A positive source constant is not an executed request or a runtime result.

## Exact bounded correction

A3 explicitly permits one additional changed path:
`lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts`.

Its old complete source was blob `39c668f0f95424c25f22e7db8448072f44052e87`, 20875 UTF-8 bytes, SHA256 `347c31338dd79cff7b4fc5b14dca418888ce422e28ecc8f3e1ecced9c71219bd`. Only the Reader preservation check and directly necessary private test support change:

- The existing protected-file map still contains the original authoritative Reader pin `5998fdea54d3337fb68cd7111460b59e43a3cef7`.
- For the Reader only, the existing Gitblob assertion now receives the full original bytes returned by a new private preservation predicate. The existing assertion and expected original pin remain in place.
- The predicate uses fixed UTF-8 byte bounds, checks the complete length and both independently pinned additions, reconstructs every original byte, verifies the original Gitblob and SHA256, and requires the exact complete current Reader Gitblob and SHA256.
- No marker search, regex stripping, blind repin, permissive alternative Reader, broad allowlist, public export or production consumer was introduced.
- The other four protected-file hashes and their existing Gitblob assertion remain unchanged. All application, quarantine, reachability, native-mock and CLI checks remain unchanged.

Removing the new private support and negative-case test, then reversing the single Reader-specific loop substitution, restores the entire old BP1 file byte-for-byte. Its remaining source is not refactored.

Reader `2b14953968da35ca47b272fd67a1a912613b8e6d`, AA test `49b78c83b1cb5adf4f3fc0c46d8ff6a840e9be30`, and A2 policy `bf46b14a4ff2c0ea3adfac000b9811629f3e1dbf` remain exact. All thirteen inventory rows, base/run, URL, budgets, V2 pin, transport gates, claim and output contract remain unchanged.

## Exact reconstruction evidence

Offsets below are zero-based UTF-8 byte offsets; end bounds are exclusive. They are not UTF-16 character indexes.

| Material | Exact byte bounds / length | Independent SHA256 |
|---|---|---|
| Current Reader | [0,65490), 65490 bytes | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| Authorized import span | [960,1650), 690 bytes | `ee791811f307ed420b4c41c5d8fa812a0655d7b960ec1d0c0996ae73463be95f` |
| Authorized appendix | [46761,65490), 18729 bytes | `b5ebcb13fbeb6ec1bb3538233f2a26e81bea575b1fc7bfa088e3530a48b5ea32` |
| Complete restored original | [0,960) followed by [1650,46761), 46071 bytes | `b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994` |

The exact full current Gitblob is `2b14953968da35ca47b272fd67a1a912613b8e6d`; the restored original Gitblob is `5998fdea54d3337fb68cd7111460b59e43a3cef7`. Original source was independently reread at the accepted main. Pure source/metadata comparison confirms that removal of exactly the two authorized additions restores all 46071 original UTF-8 bytes. No Reader function or primitive was executed to obtain this comparison.

## Meaningful in-memory negative-case source

The new BP1 test constructs twelve variants and applies the same private preservation predicate used by the actual protection check. Failure assertions emit booleans and fixed case names, not source buffers.

| Source witnesses | Expected refusal boundary |
|---|---|
| Altered original prefix; altered final original byte | Full reconstructed original Gitblob/SHA256 |
| Altered import addition; altered appendix addition | Independent exact span SHA256 |
| Missing import; missing appendix; duplicated import; duplicated appendix | Exact full length and span bounds |
| Import moved one byte later; appendix moved one byte earlier | Same-length changes fail the fixed-position span pins |
| Extra trailing byte | Exact full current length |
| Unextended original alone | It is not the selected complete current Reader |

These are authored assertions and static source rationale, **not executed test results**. No project/parser/compiler/test/build/install/native/SQL/network run, AA DNS/GET, source observation, MATCH or window decision occurred during this fix. The complete BP1 suite and the other CI gates still require authorized execution after independent Root review.

## Current six-file manifest

Exactly six task paths differ from the accepted main: the modified Reader, the modified BP1 test, and the four new task files. Every other base-tree leaf must retain its exact object/type/mode. Relative to A2, only BP1 test, Task and Handoff change.

The five non-Handoff blobs below are fixed before this Handoff is written. Its own blob/hash and the final candidate commit/tree are supplied in the delivery manifest to avoid self-reference.

| Path | UTF-8 bytes | Git blob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `2b14953968da35ca47b272fd67a1a912613b8e6d` | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 3877 | `bf46b14a4ff2c0ea3adfac000b9811629f3e1dbf` | `5baafd07aeb16b10d9b7e4dad9012ca33d7632bb65f6f56670649d27742b3a80` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45408 | `49b78c83b1cb5adf4f3fc0c46d8ff6a840e9be30` | `487789d625d885d5567438f8ee1a2c5ad1870e6a208154f18949bcacae3228cf` |
| lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts | 25526 | `7b027b49af72a3f16b230acfeff7434f9a71b64e` | `3804730801ec6713d75ee62d71a7e9c2e02a779469e59270d09a1e168b90884b` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 28287 | `5b3b724fdd14038f359c3fcbfe1e16f7f1d4ac08` | `ed1836e9f6a4f695cb5735b391466b5d98ce5c4e39bf20dadbeaed694c8fd8ac` |

The complete prior Task remains an exact prefix, followed by the complete A3 amendment verbatim and its persisted URL. The entire prior A2 Handoff, including earlier R1 evidence and limitations, is retained verbatim below as history. Its five-path statements are historical; only A3 expands the current scope to six paths.

## Review boundaries and author stop

Root and an independent reviewer must reread the exact new candidate and full tree. This author's self-review does not set TL-PASS, Ready or release status. The same session remains reachable for a specifically assigned immediate review fix; no follow-on slice is started.

No ref, branch, PR, CI run, Ready or merge was created by this author. Delivery stops after the immutable candidate and full source readback. Root alone may publish after complete re-gating and a fresh current-main/workflow-number check.

4120 remains selected. If an intervening run consumes it or a gate refuses, report the lost selection or negative outcome; do not change constants, reset the claim, rerun, rearm or switch transport. Any genuine platform/security denial remains a STOP.

A1's passive private Native-Harness export transport and R1's bounded static-analysis limitation are unchanged. Arbitrary runtime-computed paths/names are not universally resolved by the AST guard; complete Root exact-tree/diff/source review and unchanged legacy pins remain separately necessary. No new consumer path is permitted.

#917's original denied action and #1131 remain untouched. R41's independently accepted actual-main/Production prerequisite remains complete; this source correction performs no hosted install, D1 activation, source qualification, pilot-window extension or public CH→DE activation.

## Historical A2 handoff — preserved verbatim

The following complete document belongs to candidate `adfa7e43cc723b6f852b0182b7c5ca7c211a99a6`. Its source-only observations remain attributable to that candidate; its five-file scope and pre-A3 candidate state do not supersede the current six-path review fix.

---

# CH-DE-AA-REVISION-PROBE-1 — author handoff V1 / A2

## Current A2 delivery state — supersedes the historical Run0 state below

**SOURCE PREPARATION / SELECTED CI 4120 / ATTEMPT 1 / NOT PUBLISHED / NOT EXECUTED.**

Root selected the positive policy constant `runNumber: 4120` in [TASK V1/A2](https://github.com/Jetnity/jetnity/issues/1162#issuecomment-6815566959). The selected constant is an armed source configuration, not an executed GET, synthetic runtime PASS, current AA observation, source custody, Accepted Evidence/Rule or public CH→DE launch.

Same actual author: **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**.
Same actual session: **/root/aa_revision_probe_writer_g1**.
No successor session or author was introduced.

Current candidate's sole parent is `dfd692440762b50183fdebbfd6bf8dabde4662d0`, with accepted base tree `cbc79e627161d4ace132b84cf057c18adc86586c`. The live main branch was independently read at 05:34 UTC and still identified this commit. Root's final pre-publication main check remains mandatory.

The complete prior R1 handoff is retained verbatim in the explicitly historical section below. Its Run0, old-base, pending-prerequisite and outstanding-arming statements describe that earlier delivery, not the current A2 selection. All its technical limitations remain applicable unless A2 expressly supersedes a dated state.

## Authorization and prerequisite evidence

Root's [actual-main/Production receipt for R41 #1191](https://github.com/Jetnity/jetnity/pull/1191#issuecomment-6815551751) records the independent acceptance of this current main, own push CI 43159688543 / #4119 / attempt1, all eight jobs, and Production `dpl_JAYJkYUHWZMDKPdFEUfUSvFa97DT` with both public aliases. These are Root's accepted prerequisite findings; this author did not rerun those proofs or read Auth logs. The earlier #4117 failure is preserved as historical failure and was repaired by R41.

The previously reviewed unarmed candidate was `59c794fbcbf7a16bb0d4e8d1e89e3d29b7bd88b9`; Root's [source-only acceptance](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6813964889) followed the same-session R1 wording correction. That acceptance is not transferred to the changed A2 head. Root and an independent reviewer must inspect this exact candidate before publication.

A2 records Root's fresh workflow inventory at **05:30:17 UTC**, latest existing CI workflow 335237996 / .github/workflows/ci.yml run 4119, and explicitly selects **4120 / attempt1 / pull_request / verify**. This author has not selected another number or claimed a later workflow-inventory read. Root must recheck the actual workflow inventory immediately before publication; a number consumed by an intervening run stays lost under this candidate.

## Exact A2 delta and preservation

Only these source-preparation changes follow A2:

1. The candidate is based on the newly accepted main above, retaining its full R41 tree.
2. Policy changes exactly `runNumber: 0 as number` to `runNumber: 4120 as number` and the base SHA from 4313049c2a8c276f2a63101dda8df996327230e0 to dfd692440762b50183fdebbfd6bf8dabde4662d0. Reversing those two literal substitutions restores the prior complete policy byte-for-byte.
3. The full existing Task file remains an exact prefix, followed by the complete A2 comment verbatim and its persisted URL.
4. This Handoff adds current A2 state, exact identities and honest review limits, while preserving the prior R1 text as history.

Reader blob `2b14953968da35ca47b272fd67a1a912613b8e6d` and Test blob `49b78c83b1cb5adf4f3fc0c46d8ff6a840e9be30` are unchanged. No transport primitive, test assertion, runtime selection rule, claim operation, output schema, binding, expected V2 pin, URL, budget or source-inventory entry changed.

All thirteen policy inventory entries were independently verified using complete source bytes: the unchanged prepared Reader/Test and all eleven unchanged base files read at the new main. Every length and SHA256 matches the previously reviewed policy. The full actual base tree agrees with each base-file blob. The unchanged Original Reader and ReviewedSource were additionally reread and hashed at the new main.

Original Reader recovery remains exact after removal of the same two additive blocks: blob `5998fdea54d3337fb68cd7111460b59e43a3cef7`, 46071 UTF-8 bytes, SHA256 `b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994`. Existing private native transport and Bern behavior remain intact. ReviewedSource remains blob `e00f71f993fe558d657ca409436ee62410869b25`, 2142 bytes, SHA256 `478c86cc3efb6bca24f9eeb9aedb19d21c051d5a68e42308e0b73ca5979108f5`.

The candidate still has exactly the original five allowed paths: one modified Reader and four added files. All other base-tree leaves must retain their exact blob/type/mode. No workflow, package/lock, old guard, legacy consumer, C1/window, old mapping, registry/profile/extractor, SQL/Auth/MA1/DB, secret, public route or schedule is changed.

## Current immutable file inventory

The four non-Handoff blobs are fixed before this Handoff is created. This file's own blob, complete SHA256 and the final candidate tree/commit are supplied in the delivery manifest; no self-hash loop is introduced.

| Path | UTF-8 bytes | Git blob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `2b14953968da35ca47b272fd67a1a912613b8e6d` | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 3877 | `bf46b14a4ff2c0ea3adfac000b9811629f3e1dbf` | `5baafd07aeb16b10d9b7e4dad9012ca33d7632bb65f6f56670649d27742b3a80` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45408 | `49b78c83b1cb5adf4f3fc0c46d8ff6a840e9be30` | `487789d625d885d5567438f8ee1a2c5ad1870e6a208154f18949bcacae3228cf` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 23353 | `169ff2a8ef0c6aa4a3facbb7bcda3e0dc2b4b94c` | `0b1bd252a00497c9c9fd80f5c246fc276efa8ed84d81e9a7601586aee2ac28fa` |

The thirteen source-inventory rows in the preserved historical table remain exactly current; only the policy's own selected base/run changed. Its own blob remains an external Root exact-head gate.

## Current limitations and remaining gates

The A1 passive Native-Harness transport remains openly disclosed. The R1 limitation also remains: the AST guard recognizes selected constant/static forms, not arbitrary variable-backed or runtime-computed module paths/names. Complete Root exact-tree/diff/source review plus unchanged legacy-byte pins remain separately necessary; this does not permit a new consumer or escape path.

No project/parser/test/build/install/native/SQL execution or source-network request was performed by this author. Metadata hashing and Git object preparation/readback are not runtime evidence. The positive constant alone does not establish that the future selected CI passes its synthetic preflight or reaches any request.

Root alone may publish the designated branch and its Draft PR after independent exact-head review. The real PR number must come from GitHub, with event head and synthetic checkout identities kept distinct. Only CI 4120 / attempt1 / pull_request / verify, same repository, exact selected base/source bytes, completed synthetic preflight and exclusive persistent claim may reach one fixed AA GET.

If another run consumes 4120 or any condition fails, do not change the constant, reset a claim, rerun/rearm or use another transport. Report the exact non-execution/negative result. A real platform/security denial remains a STOP. This author has created no ref, branch, PR, Ready state, merge or execution.

The maximum 131072 bytes, 10000ms budget, exact 200, no redirect/retry/alternative source, finite metadata and no raw-body/new-observed-hash output remain unchanged. Even MATCH plus recognized S1 is research-only and requires a separately selected, reviewed product-window step; it does not grant legal admission, DB/registry activation, D1 operational state or a public entry answer.

#1131 remains NOT_REQUIRED and untouched. The original denied #917 readback was not repeated or delegated. Separate actual-target Dev/#1139/#1142, D1 binding, custody/history/countercheck and public cache/pending/update requirements are not completed by this source candidate.

## Historical V1/A1/R1 handoff — preserved verbatim

The following complete prior handoff belongs to candidate 59c794fbcbf7a16bb0d4e8d1e89e3d29b7bd88b9. Its dated source-only/Run0 state and earlier pending-gate list are superseded only as specified in A2 and the current sections above. Its evidence and limitations are retained.

---

# CH-DE-AA-REVISION-PROBE-1 — author handoff V1

## Disposition

SOURCE_ONLY / UNARMED / runNumber: 0. This is an unpublished immutable source candidate, not a TL-PASS, CI result, current AA observation, accepted import or launch approval.

Actual implementer: **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**.
Actual session: **/root/aa_revision_probe_writer_g1**.
Root task: https://github.com/Jetnity/jetnity/issues/917#issuecomment-6813230211
Root source-isolation amendment A1: https://github.com/Jetnity/jetnity/issues/917#issuecomment-6813757462
Session startup evidence: https://github.com/Jetnity/jetnity/issues/751#issuecomment-6813263476

This is a new bounded task and actual new Codex session. It is not a resumed historical Cursor, V31 or D1 session. The author remains available in this same session for immediate review fixes; only Root controls publication, arming, Ready, TL review and merge.

## Source base and preservation

Initial preparation source: `32cd11f79eecb766d4a28d6db928d25bf1748bea`, tree `2e86fddcf0aa9d502c382ef6f122ef09b2e7c605`.
Final unarmed delivery parent, explicitly permitted by Root after A1: `4313049c2a8c276f2a63101dda8df996327230e0`.
Final delivery base tree: `5a331f1a8846e8dc07a3e0a6de033fcf8da7400f`.

The full recursive original and new-main trees were read as Git metadata. Their eight differences are exactly the M04 documentation closure: seven Markdown files and the new M04 JSON evidence manifest; no code leaf differs. This delivery retains all eight closure changes and changes only its five task paths.
The five-file candidate must be read at its delivered immutable commit; no branch has been created or updated.

The Reader change consists solely of a delimited static-import block after the existing node:net import and a delimited research appendix. Removing those exact two additions restores every UTF-8 byte of Reader blob `5998fdea54d3337fb68cd7111460b59e43a3cef7`. This includes serverDns, serverHttp, checked lookup, hopLesen, textAus, all live retrieval paths and the Bern hard stop.

The other four paths are new. Every other base-tree leaf must remain identical in type, mode and object ID. Existing C1 context/window, ReviewedSource, mapping, registry, profiles, extractor, workflow, package/lock, SQL/Auth/DB/MA1, public route and schedule remain at the base identities.

PR #1190 has merged at the delivery parent. At A1, its own main CI run43150141948/#4117 and Production acceptance remained pending. This preparation does not claim that actual-main acceptance or transfer any old gate. Before arming, Root must finish that closure, select the resulting current main, verify relevant source equality and append its explicit base/run amendment to the task. Rebase changes require fresh exact-head review.

## Implemented boundary

The new public server-only entry accepts no arguments. It returns a separate frozen research union with finite reasons, verified CI identifiers where available, and explicit no-custody/no-legal-admission/no-production-authority/zero-Evidence/zero-Rule/zero-DB fields. There is no raw transport API, injectable production dependency, generic source registration, policy setter or caller/environment override for URL/pin/budget.

Selection refuses Run 0 before filesystem/DNS/HTTPS. The armed shape requires the selected workflow number, attempt 1, pull_request/verify, same repository ID/name at all event levels, exact branch/base SHA and workflow/ref identity. It distinguishes event head SHA from synthetic checkout SHA. Canonical safe integers and exact SHA forms are checked; bounded fatal-UTF8 JSON rejects duplicate decoded keys and nonregular/symlink/overlimit input.

Before claiming, thirteen exact ordered actual-byte source pins are checked through bounded descriptor reads with no-follow, inode/device/size/time stability and complete-EOF checks. The policy excludes its own hash to avoid a self-hash loop; its immutable blob and complete tree remain Root's external exact-head gate.

An exclusive no-follow task/run claim is created with mode 0600, fully written, fsynced and closed in trusted runner temp. Existing claims, partial/uncertain writes or close/fsync failure remain consumed; there is no deletion, overwrite, reset or retry. The claim survives a fresh module instance.

The physical wrapper uses the existing private native DNS/HTTPS/lookup/hop/text functions. It selects one fixed AA HTTPS GET, identity/no-cache headers, verified TLS/default443 and exact status200. Every redirect and other status refuses without follow-up. The 131072-byte and10000-ms limits cover the complete read. Monotonic deadline checks immediately after headers, after the body await, after fingerprint and after S1 prevent late success even if the timer callback has not run. Cancellation/timer cleanup occurs on every terminal path.

Only completed strict UTF-8 text/html with exact native framingComplete true and actual-byte protocol2 reaches the unchanged complete V2 fingerprint helper. The copied immutable nine-field research binding is independently compared with the actual original ReviewedSource by synthetic preflight. MATCH permits only the unchanged structural S1 decoder; recognized/refused is finite research metadata. MISMATCH emits no observed hash and calls no S1.

A1's observed legacy limitation is explicit: the unchanged Native-Harness namespace spread passively carries the new export as a property of its private sourcePort. It does not select or invoke it. Claiming that no passive forwarding exists would be false. The full native-loader, actual producer and R2 test are now part of the bounded thirteen-file selection inventory; their exact bytes and independent A1 hashes are checked again in the new preflight.

The new AST guard does not skip the legacy file. It verifies its one existing retrieval namespace, private sourcePort declaration/internal return, private load function, and exact thirteen returned product-module paths. The actual producer must remain a single named consumer of the old loader. The R2 dynamic import must remain its exact immediate single named-await destructuring, without alias/rest/default or retained namespace. All sixteen existing source directories plus root JS/TS files are scanned. For the module-path and name expressions it statically recognizes, the guard rejects unapproved namespace/default/star/import-equals/dynamic-import forwarding and probe-reference forms, including its recognized constant string, concatenation and template expressions. Modified pinned legacy bytes also refuse.

This AST guard does not resolve arbitrary runtime-computed paths or names, including a path held in a variable and passed to import(variable); staticString(Identifier) returns null. It is not a universal proof of dynamic reachability. Root's complete exact full-tree/diff/source review, together with the unchanged legacy-byte pins, remains separate necessary evidence for the current closed call graph. This evidence limitation permits no new consumer, selection, invocation or forwarding path and removes no TASK V1/A1 boundary.

Only the new test intentionally selects and contains the actual no-argument entry invocation. The single awaited flow finishes synthetic assertions before that call. Controlled mismatch/transport refusal produces bounded metadata without failing merely to encourage a retry. Ordinary nonselected runs have no actual source effect and make no live-source PASS claim.

## Synthetic source coverage and honest limits

The new test source covers Run0/wrong type/run/attempt/job/repository/fork/head/base/workflow/ref, malformed/duplicate/BOM/invalidUTF8/oversize events, nonregular/symlink/hardlink/growing source files, altered/malformed inventory, atomic claim uncertainty and duplicate calls across fresh modules.

It specifies a complete synthetic native-shaped response; fixed request identity; full-body MATCH/MISMATCH including footnote and Swiss-row changes; complete binding; exact CRLF/CR equivalence; S1 recognized/refused; all redirect classes and other statuses; strict MIME/charset/encoding; malformed length, overlimit/empty/BOM/invalidUTF8/protocol1; throwing stream, missing/false/throwing framing; DNS denial/error/empty; abort; delayed monotonic deadlines after headers/body/hash/S1, including zero body consumption for late headers; cleanup; and finite result/output checks against adversarial synthetic body/header/cookie/error sentinels.

The source-only helper session `/root/aa_revision_probe_writer_g1/reader_namespace_review` independently inspected the old namespace transport and the earlier emitted source text as author support, with no implementation or execution. Its two concrete observations (root/widget source coverage and a post-header deadline check) were incorporated. Its assistance is not Root TL-PASS and did not verify the final immutable bytes.

These are authored test cases, **not executed test evidence**. No local TypeScript/parser/project/native/build/test/install/SQL was run. No AA DNS/GET was made. No Auth log, DB target, secret or held action was accessed. Only approved Git source/metadata reads, independent in-memory metadata hashing and immutable object preparation are part of this delivery.

The observation is deliberately not byte-identity evidence: existing V2 normalizes CRLF/CR to LF. MATCH does not establish legal applicability, full product scope, accepted Evidence/Rule, current custody or a pilot-window extension. A mismatching page may differ in boilerplate; this task neither publishes a new hash nor repins it.

The local claim is a one-attempt bound in the reviewed trusted CI context; it is not cryptographic protection against an administrator rewriting code or runner environment. Any lost selected run stays lost; rearming/retry needs a separate explicit Root decision, never automatic continuation.

## Outstanding gates

1. Root and independent reviewers inspect the complete exact five-file candidate; author self-review grants no TL-PASS.
2. Root completes #1190 actual-main and Production acceptance, verifies the actual current main and immutable source equality, and checks that this unarmed delivery base is still appropriate.
3. Root explicitly selects a fresh CI workflow number and amendment; this same writer applies exact base/run pins to a new immutable candidate.
4. Every changed head receives independent full re-gating. Only Root creates/updates branch and Draft PR.
5. Existing CI alone may run the single selected source request after its synthetic preflight. A race, wrong context, attempt2, failure or duplicate claim has zero new GET.
6. Root reads the full actual finite metadata and all exact CI/Preview/Production evidence. No current MATCH, S1 observation or window extension is claimed here.
7. Separate actual-target Dev/#1139/#1142 authority and installation, D1 binding, history/countercheck/custody and public cache/pending/update gates remain unresolved by this research task.

#1131 is not required by the selected private native transport: its framing witness already exists at this base. No blocked branch/action, #985/#937/#1135 patch or stopped #917 platform readback was reused.

## Author risk review

- P0: no known new active production path or authority escalation; source-only review has not executed the candidate.
- P1: arming/publication before closure acceptance, exact source review or selected-run binding would violate the task. Run0 currently prevents effect.
- P2: the one allowed attempt can be lost to a workflow-number race, transient transport error, page drift or finite budget; the required response is a truthful nonpositive record, not retry/repin.
- P3: source syntax, type/lint, full import isolation and runtime test behavior remain unexecuted until the authorized existing CI gate. The author supplies no fabricated pass.

## Immutable file inventory

The following four blobs are referenced before this handoff is written. The handoff's own blob/SHA256 and the containing candidate tree/commit are supplied in the accompanying delivery manifest; putting those identities inside this file would create a self-reference loop.

| Path | Bytes | Git blob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `2b14953968da35ca47b272fd67a1a912613b8e6d` | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 3874 | `bcf5dc06e08e11815f8d74cb66c3b53d4b005c26` | `75b9dac704ba31425b1acd89febc253479320273570bb3f5dac245131aea8d43` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45408 | `49b78c83b1cb5adf4f3fc0c46d8ff6a840e9be30` | `487789d625d885d5567438f8ee1a2c5ad1870e6a208154f18949bcacae3228cf` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 18392 | `bee220369c487970e05f9aea98f8aa6cc8dd6db9` | `c20dc1af3ce96c24a59f5f9565d93669f07b8e157271aabdef209540c72965f0` |

Original Reader: 46071 UTF-8 bytes, SHA256 `b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994`. The delimited removal check restores that complete original source.

### Bounded actual-source selection pins

| Path | Bytes | SHA256 |
|---|---:|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45408 | `487789d625d885d5567438f8ee1a2c5ad1870e6a208154f18949bcacae3228cf` |
| lib/readiness/official-truth-bounded-response-body.ts | 1278 | `186ad6dd5ebcf03cd25586775fefe17d652863cb04a2ba72a7be64c7ee4ca0a2` |
| lib/readiness/official-truth-source-fingerprint-v2.ts | 5156 | `d8c0ddd287b0cffc4e9f0a88528ecce5c02052afdc0ab59fbb67449276388eac` |
| lib/readiness/digest.ts | 3013 | `e63201d45a39f68624b1e1f9e7568b696f8a65d1ada07f16e64a2be69dcec190` |
| lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.ts | 6702 | `059cd29e8695bf29c5296a1bfeb122fd491caff14c701c81ef2dc0bbdd6bf00e` |
| .github/workflows/ci.yml | 12325 | `3889e092f9cf4ce4b917a786a3267bf9bb510b727d5c76db7cabf6b08f9e6d18` |
| package.json | 6467 | `5ce795c22de79e205f6528e8ae3329d4a7863e11178e0b3fe32a1425e54af4df` |
| package-lock.json | 320689 | `71f4f32185dc9acd56b5dcfaec8162f317f7e370f32bdefe9264adbb7fd05b1e` |
| scripts/server-only-test-register.mjs | 508 | `d565c9029d993a8a778cd530acebae5707034223bcb18f55dc9a306941b10d32` |
| scripts/db/official-truth-accepted-store-trip-integration-1/native-loader.ts | 6501 | `49ab7d7c68afcc30d80251db85e47041e2962f0c83cecf7f63964ce64aa4b298` |
| lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts | 9176 | `74a83b4b62711da43f4f6efdf94e4dd162bfcad5c06af253af3300dd59a27572` |
| lib/readiness/official-truth-content-identity-r2.test.ts | 41838 | `be7a0b62e55c557faf05963befd5b717b7ea245bc71d2a85eb4fd0d3f5225c16` |

Original reviewed metadata remains blob `e00f71f993fe558d657ca409436ee62410869b25`, 2142 bytes, SHA256 `478c86cc3efb6bca24f9eeb9aedb19d21c051d5a68e42308e0b73ca5979108f5`. Its exact original source is checked by the new test before the real entry. No production import of the dormant reviewed candidate was added; only its immutable nine-field research binding and already-reviewed public pin are copied into the new policy.
