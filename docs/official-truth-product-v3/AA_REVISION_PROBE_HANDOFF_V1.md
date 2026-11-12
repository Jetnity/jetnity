# CH-DE-AA-REVISION-PROBE-1 — author handoff V1 / A9 + A9-A1

## Current A9 source state — 12 November 2026

**SOURCE-ONLY / Run 0 UNARMED / NOT_RUN / unpublished immutable integration candidate / executable publication HOLD / independent A9 Technical Lead review and fresh exact-head gates pending.**

The actual author is the same original **Jetnity Official Truth CH-DE AA Revision Probe1 — Codex Generation1**, session **/root/aa_revision_probe_writer_g1**. No new session, resumed Cursor UI session or delegated author is claimed. No subagent was used.

Root independently accepted the preceding A8-B source candidate in [receipt 6826532002](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6826532002). That is an exact A8-B SOURCE PASS only. It does not become A9 PASS or evidence that an earlier runtime failure is cured.

This integration follows the complete [A9 task](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6826548986) and its explicit [A9-A1 correction](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6826586679). The malformed 43-character selector-test Gitblob in the original task was reported before substitution. Root reread the actual selected tree and corrected it to **bbc10fc9621e31c5af74421891608d3cdf27238d**. The originally stated 7,360-byte length and SHA256 were already correct. Both the full original task and the full explicit correction are preserved verbatim; the erroneous Gitblob string is void.

## Exact ordered parents and independent source reconstruction

The final immutable integration has these ordered parents:

1. A8-B **d041feb553519aab574ce2c50aa8e5cdd9e694c1**, tree **1fb28e84e7d8a41b6e1bf07284ecda6ddf8eb617**.
2. Selected actual main **b5f33f66faab89454a874e641dbd0dfa66b09d2d**, tree **77666e58d26538fb704389366b77e3a4a1903ac2**.

Both complete commit objects and untruncated recursive trees were independently read. The main ref was read as exactly b5f33f66faab89454a874e641dbd0dfa66b09d2d. This main has ordered parents [fa8bd1d02ea67cf69ba3df9fea5a3d39a35a7474, fd1e27fd4893a837d6bd3fe1180a94589ffa1fae].

The selected prior source base ee6801e99e86144e60dbe86d72576f9ad7c3e9bb / tree c2fad9aff45aa07addb541fea8e6a38fb9f2a19e was also read. Relative to it, A8-B has 11 different leaves and main has 23 different leaves, with **no overlapping changed paths**. All 23 complete inherited-main files were read and hashed; their exact original blobs are adopted. The accepted Auth state is already shared by both selected parent trees and remains exact.

The tree is composed from actual main plus the accepted AA delta and only the seven selected authored paths. The complete expected comparison is:

| Comparison | Existing modified leaves | Added leaves | Removed leaves | Unchanged leaves |
|---|---:|---:|---:|---:|
| Against A8-B first parent, 9,486 leaves | 12 | 18 | 0 | 9,474 |
| Against actual-main second parent, 9,497 leaves | 4 | 7 | 0 | 9,493 |

The resulting tree has 9,504 leaves. Its 30 first-parent differences partition into **23 exact inherited-main paths and seven authored AA paths**. Its 11 differences from main are precisely the accepted AA delta after the finite A9 amendments. Every unaffected SHA, mode and type is preserved. Final commit/tree identities and completed full readback comparison are external delivery bindings so that this document does not contain self-referential hashes.

## Actual-main inheritance without reauthoring

Current PG1/Auth/HMA1 source, protected-source amendments, CI contract, complete six-family workflow and package commands are retained exactly. No broad legacy Core command is restored. No inherited test or source is weakened.

| Inherited actual-main path | UTF-8 bytes | Gitblob | SHA256 |
|---|---:|---|---|
| .github/workflows/ci.yml | 23906 | `a422a67d3a0407f4c1301d3bcff75f736d7ea9b4` | `371e8467441727d1fc72f1f524f4b0f7bafd2338eb3b706f0c9f32f8a662b7ba` |
| lib/readiness/official-truth-atomic-version-refresh-1.test.ts | 24194 | `c3797969869961bda770b8836267ba3d817dbdd8` | `2923b9e11bd784b471e3f69111cb846db36a042cc103dac1308b597d2d25aeab` |
| package.json | 6460 | `2a8d677d575b5762a5dd7091d161ea0da6edcea9` | `46c317656c81030397681d1d0c67e54a5c7d65b0aa66d15d2051c76503584da0` |
| scripts/official-truth-v3-test-selection.mjs | 5970 | `51a2a59e03104f83f3d392f0ffb79639274c1ae9` | `647e5b113666f0e77253ce8a823942e480b853d0c95ac545e67d4074ea5b7e61` |
| scripts/official-truth-v3-test-selection.test.mjs | 7360 | `bbc10fc9621e31c5af74421891608d3cdf27238d` | `edbbcb838a8d8642d21afe7b1608f137ff60d53e1214c4a9cc8f012d16ff6730` |

The manifest includes all 23 inherited changes, with source/target Gitblobs, complete byte counts, SHA256, modes and types. Inheritance is explicitly distinguished from authorship. The selector continues to discover all original test families, puts only the selected HMA wrapper into its PG17 family, and adds its mandatory contract to Core. AA remains in the existing discovered lib test family; no selector source or test was changed here.

At A9 selection Root records #1195 merged at **14:33:46 UTC**, with actual-main push **#4135 / 43238479829 RUNNING**. Those are attributed Root observations at selection, not this author's current hosted readback. This author performed no CI/Production/Preview/hosted read or mutation. Executable publication remains reserved to Root after actual-main #4135 and Production acceptance, followed by independent candidate review and new exact-head gates.

## Only four finite source amendments

**Probe:** Add exactly the two selector paths to the required source inventory list. The addition is **105 UTF-8 bytes**. Removing precisely those bytes restores the entire accepted Probe blob 8db7b78650fcd783a75f8b45753e196b8c0fd0f0. No transport, claim, output, S1, fingerprint, deadline, argument, event, retry or fixture behavior changes.

**AA test:** Change only `assert.equal(policy.sourceInventory.length, 15)` to `assert.equal(policy.sourceInventory.length, 17)`. All other 56,184-byte-file content remains exact, including every prior synthetic case, import guard, legacy private-port exception, fixture and awaited preflight-before-real-entry order. Reversing the selected count restores c5acfc4e7320cf4794c547b915bbdb35efec4b22.

**BP1:** Update only the fixed complete Probe byte count, Gitblob and SHA256 in the existing three-source preservation predicate. Reader/Physical pins, all 29 inverse spans, the original Reader pin, four other protected files, all 22 whole-source mutants, all seven inverse-span mutants and all unrelated BP1 code remain byte-exact. Reversing that single pin replacement restores 7f95fd1225f9f1042251bd0ffbedfb13a9ede0a9.

**Policy:** Keep runNumber **0**, set only baseSha to **b5f33f66faab89454a874e641dbd0dfa66b09d2d**, update the actual CI/package/Probe/AA-test pins and append the two selector pins. The other eleven previous inventory entries remain exact; the inventory now has exactly **17 paths**. All fixed AA URL, official reviewed V2 pin, source binding, limits, branch/event/attempt/job and one-shot semantics remain unchanged. Reversing the six finite text replacements restores 37bdeeb201d799bd918a62400e518c4052ad9bd2.

The manifest provides before/after literal changes, exact UTF-8 byte spans, hashes and the complete preserved intervals for all four source files. No parser/compiler/test was executed to make these inert source comparisons.

## Five accepted implementation files unchanged

| Path | UTF-8 bytes | Retained A8-B Gitblob |
|---|---:|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 29611 | `933591ff7074c599dc5032f135103bd65f738314` |
| lib/readiness/official-truth-retrieval-physical-internal.ts | 17726 | `bd995580bee6adb6b1a213b17a6001caa8f0aeff` |
| scripts/db/official-truth-integrated-pilot-1/r2-proof.ts | 11305 | `9aec7a10a01bfe0717c6abc9bb6395ea9d937533` |
| scripts/db/official-truth-integrated-pilot-1/storage.ts | 18102 | `109e8ac57029a03afa55219c8132e8bf004b2dee` |
| lib/readiness/official-truth-server-owned-retrieval.test.ts | 68545 | `1db87d5a80e913479157340803ddcdf2ac528d4d` |

The full existing Reader inverse was independently recomputed from the unchanged actual Reader/Physical byte spans. It still reconstructs **46,071 bytes**, original Gitblob **5998fdea54d3337fb68cd7111460b59e43a3cef7**, SHA256 **b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994**.

The current Probe's actual import/appendix spans also reconstruct the original complete A7 Reader **2b14953968da35ca47b272fd67a1a912613b8e6d**, 65,490 bytes, SHA256 a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143. Relative to that historical appendix, precisely four owned/selector inventory paths, now 234 bytes, are excluded. The new A9 change accounts for only 105 of those bytes; the first 129 belong to accepted A8-B. The manifest records the updated target offsets without changing any original source span.

No result-contract, SQL, wire, timeout, storage, cleanup or R2 diagnosis behavior is reauthored. R2 without a fresh successor readback remains UNKNOWN. The earlier 20-second COMMIT and independent Chrome failures remain historical failures and are not relabeled as cured.

## Complete documentation and scoped self-review

The prior Task remains a complete **64,700-byte prefix**. The appended material contains the complete Root A8-B SOURCE-PASS receipt, the complete A9 task, and the complete A9-A1 correction, each reread unchanged before embedding. The entire prior **98,405-byte Handoff** is preserved verbatim below, including all older history. The complete prior **53,306-byte Manifest** is preserved as a recoverable exact UTF-8 string inside the new manifest; current lineage/pins/inverse metadata are separate current fields.

All 17 selected actual runtime source contents were read and byte/Gitblob/SHA256 checked. Eleven previous entries remain exact; only CI/package/AA-test/Probe pins change and two selector entries are added. A bounded read-only check of the 23 inherited main changes found no additional changed Reader/Physical/AA/BP1 protected-source predicate. HMA historical test-universe lists do not replace its actual dynamic selector contract.

The four new source blobs were created as immutable objects and reread in full before this handoff. That is source preparation and author self-review only. It is not independent A9 Technical Lead PASS.

| Authored source/document | UTF-8 bytes | Gitblob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-aa-revision-probe-1-server.ts | 20156 | `df24e34575ef7d0ca211471b6a6a019f600871ec` | `a2f16bceb4917e3fc6f654fc1bc4fc03b405a3f02b294e9d5a2ddbfa9434190f` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 56184 | `df87618a6e9a22e752b972d5fc2b072f90b5a121` | `13fe0530ef3c4007fc44ccf30dda1f58673a5341177e88c6be9665a4f9f39876` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 4574 | `64052a43b7319988b862a48523b2d09d6402f264` | `4619156e12dda8120a899626a038dfa9250c53b0e38e67b401d1d8affa43b51b` |
| lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts | 35509 | `256dc4f180815fd0994568c55e0805f44cc88515` | `7a14cfa974556438f1d4f2976fc35826db17b9f31f1d9e52564035670d4e9a0d` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 75249 | `5410b2119427da2782bfa4bb195d64e21a5b9fde` | `3d120f2b3b1761aabe764bc0653fff3ade0b58835728821fdac5e1c05ad29593` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_MANIFEST_V1.json | 123750 | `e740313710fbb3eb61dafbb0ca44bd14ff68d71e` | `a76d2bca1ccf156357c77a3e9df065ebc47539dab38bb7482b90149f6c7a41fb` |

The Handoff's own pin and final exact tree/commit pins are supplied externally at immutable delivery.

## Authority boundary and required next step

No project/parser/compiler/AST/native/SQL/APT/test/build execution, CI dispatch/rerun, official-source GET, hosted read/mutation, ref/PR publication, Ready or merge occurred. No positive policy arm or consumed invocation was reused. No official current revision, pilot-window extension or public activation is established by this source work. #917/#1131 remain untouched.

The unchanged finite AST guard recognizes its reviewed static/constant forms; arbitrary runtime-computed paths/names remain unresolved. Root's complete independent exact-tree/diff/source review and legacy pins remain necessary. This limitation authorizes no new consumer.

The author stops after immutable delivery and remains available in the same original session. Root independently reviews A9; publication may be selected only after actual-main #4135/Production acceptance. Fresh exact-head CI/Preview and any later one-shot source verification or pilot-window extension remain separate explicit Root steps.

## Preserved complete A8-B handoff history

The exact prior Handoff follows: 98,405 bytes, Gitblob 8fd1b771fbe39f927bb743ebf343ea861750433d, SHA256 08fecedd9b659e9d37207445041b4af766608af2bda7b12ab955a1fd85cd592e. Its internal “current” headings refer to their historical revisions and do not supersede the A9 state above.

<!-- BEGIN VERBATIM A8-B HANDOFF 8fd1b771fbe39f927bb743ebf343ea861750433d -->
# CH-DE-AA-REVISION-PROBE-1 — author handoff V1 / A8-B + A1 + A2

## Current source state — 12 November 2026

**SOURCE-ONLY / Run 0 UNARMED / NOT_RUN / unpublished immutable candidate / independent Technical Lead review and all fresh exact-head execution gates pending.**

Same actual implementation author: **Jetnity Official Truth CH-DE AA Revision Probe1 — Codex Generation1**. Same original reachable session: **/root/aa_revision_probe_writer_g1**. No successor, restored Cursor UI session or delegated implementation is claimed. No subagent was used for A8-B.

The selected source correction is [A8-B](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6825483434), with the expressly selected [BP1 preservation A1](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6825534691) and [Reader source-safety A2](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6825553869). [A8-A](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6824718530) selected read-only diagnosis only. All four complete receipts were reread and compared before their verbatim append to the existing Task document.

This handoff describes only this source candidate. Earlier author self-reviews below are preserved history, not a transferred Technical Lead PASS. The author has not executed the project, TypeScript/parser/compiler, synthetic tests, native proofs, SQL, APT, build or CI. No AA source request, positive policy selection, rerun, branch/PR publication, Ready state or merge was performed.

## Exact parent and integration boundary

The sole parent is A7 **6ffbb8f1cf415e7e608634e236a47cf9872efebd**, tree **24c2709bb150d20f069ac6bfc40840048f5b83fa**. Its commit and complete untruncated recursive tree were independently reread. A7's ordered parents remain [7aa2f2fda1ad06fe2c85584f86f049c575d919da, ee6801e99e86144e60dbe86d72576f9ad7c3e9bb].

At A8-B selection Root records accepted main **fa8bd1d02ea67cf69ba3df9fea5a3d39a35a7474** and passing actual-main PG1 run #4132. That is attributed Root evidence, not a new live-main or deployment check by this source-only author. This candidate does not integrate that main or adopt its HMA workflow changes. Policy baseSha remains **ee6801e99e86144e60dbe86d72576f9ad7c3e9bb**, and runNumber remains **0**. Root must separately select integration and new exact-head gates; no consumed positive invocation can be reused.

The exact authored allowlist contains 12 paths: nine existing leaves and three new files. The parent has 9,483 non-tree entries; construction preserves every other leaf's path, SHA, mode and type, adds exactly three 100644 blobs, and removes none. The completed commit/tree and full readback comparison are externally bound by the immutable delivery receipt so that this file and the manifest do not contain self-referential hashes.

## Selected implementation and exact byte preservation

The shared Reader now imports the existing physical implementation from the new server-only internal module. The AA probe, its policy/FS/CI claim logic, S1/parse5 dependency and probe fingerprint logic moved to their own server-only module. The Reader does not import or reexport the AA entry, policy or S1. Physical imports neither Reader nor probe and has no parser, catalog, Engine or application authority dependency. Its existing URL-error and IncomingMessage dependencies are type-only.

The full original Reader remains authoritative: **5998fdea54d3337fb68cd7111460b59e43a3cef7**, **46,071 UTF-8 bytes**, SHA256 **b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994**. The manifest records 29 ordered source/target byte spans. Selecting the actual new Reader and actual Physical spans, plus exactly the original 25-byte URL-error import-wiring line, reconstructs every original byte and the original Gitblob/SHA256. There is no normalized AST baseline, ignored source region, duplicate implementation substitute or replacement authoritative pin.

The only target bytes outside that original reconstruction are explicitly listed in the manifest: the Reader's 894-byte named import/legacy reexport wiring; Physical's server-only header and necessary Node/bounded-body/type imports; and nine seven-byte `export ` prefixes. All existing function bodies, DNS checks, public address checks, HTTP request options, fixed headers, TLS, redirects, framing proof, stream/length/MIME/UTF8 checks, cancellation and time semantics remain the actual original bytes.

The physical module exports exactly 11 existing functions and six existing type names. Reader statically imports its exact 11-function/three-type selection; probe imports its exact seven-function/three-type selection. No namespace or dynamic selection is introduced. Reader reexports only its old address/lookup APIs and original associated types, including the merged lookup type/value name. No new public Reader raw-transport export is introduced.

Bern's existing function bodies remain in Reader byte-exact. Its continuing calls to `medientyp`, `inhaltLaenge` and `abbruch` are explicitly imported from Physical. Its original bounded-response-body import remains in Reader; Physical also imports that same unchanged implementation. The live Bern hard stop, original budgets and all Bern behavior are unchanged.

The old AA import addition remains exactly 690 bytes / SHA256 ee791811f307ed420b4c41c5d8fa812a0655d7b960ec1d0c0996ae73463be95f. The old AA appendix is exactly 18,729 bytes / SHA256 b5ebcb13fbeb6ec1bb3538233f2a26e81bea575b1fc7bfa088e3530a48b5ea32 after removing only the selected two new static inventory paths (129 bytes) from the moved appendix. The manifest records those actual Probe spans. Reinserting these actual moved additions into the restored original reconstructs the entire A7 Reader **2b14953968da35ca47b272fd67a1a912613b8e6d**, 65,490 bytes, SHA256 a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143. All old claim, deadline, noarg entry, finite result and fresh S1-after-MATCH logic remains exact.

## Storage contract and proof-local diagnostics

Storage is restored byte for byte to **109e8ac57029a03afa55219c8132e8bf004b2dee**, 18,102 bytes, SHA256 a7a8bd6e65701e6482c8f7028ed1936df3cf02044adfb85e981f010b4d19f82f. Removing only the 53-byte A6 addition `operationDiagnostics:connection.operationDiagnostics,` from A7 storage produces that exact original. This repairs the author-introduced enumerable-result regression; the unchanged R3 and integrated exact-result assertions are not widened.

R2 retains its bounded existing failure record by observing the actual `ot_provenance_writer` connection inside the independent-write proof call. Its temporary `LocalPgConnection.connect` hook is restored in `finally`. Only the diagnostic field's source changes to that actual captured connection. No result shape, success/failure interpretation, assertion, query, budget, cleanup or wire behavior changes; no new readback is added. A successor failure without a subsequent fresh readback remains **UNKNOWN**.

## Test and fixture scope

The AA test now uses the probe's exact named static entry/result-type import. The existing fixture helper transpiles only one requested module and does not propagate dependency overrides recursively. Therefore each synthetic fixture first loads the actual Physical source under the same existing DNS/HTTPS/net fakes, then injects that private fixture object at the relative Physical dependency of the transpiled Probe. The object is not exposed from the fixture and no actual ESM Physical import is added to the test. This precise synthetic source-loading behavior is disclosed; it is not concealed as an absent dependency.

Every existing synthetic case and assertion intent is preserved. The full `syntheticPreflight` function and final awaited preflight-before-real-entry sequence remain byte-exact except the selected inventory count 13 -> 15. Existing native-loader, producer and R2 test pins and the complete private-port evidence remain unchanged. The historical native namespace spread is still checked as a real private Reader port; the new Reader API no longer carries the AA entry into that port.

The complete source import inventory continues across all 16 original directories and root JavaScript/TypeScript files without file skips. It checks the finite exact new Physical/Probe import and export selections, aliases, namespaces, recognized dynamic/require/import-equals forms, reexports and unapproved consumer paths. Added negative witnesses cover both new boundaries and the Reader's prohibition on AA/S1 dependencies. Existing negative witnesses and legacy selection checks remain.

**AST limitation remains explicit:** staticString(Identifier) returns null. Constant strings, static templates/concatenations, recognized paths and static syntax are checked; arbitrary runtime-computed paths/names and indirect forwarding are not resolved universally. Independent Root exact-tree/diff/source review and the unchanged full legacy byte pins remain separately necessary. This limitation grants no permission for another consumer.

A1 changes only BP1's AA Reader preservation metadata/predicate, its call wiring and its associated mutation proof. The new predicate binds all three complete files before reconstructing the original. Tests retain refusals for changed original/moved/probe bytes, missing/duplicated/misplaced spans, changed import/export wiring, trailing bytes and wrong complete files. Additional inverse-map mutations prove missing, duplicated, misplaced, shifted and wrong-source spans fail. Failures expose booleans only; the four other protected pins and unrelated BP1 observations are unchanged. The old A3 layout pins remain documented as historical evidence, not a second accepted current layout.

A2 changes only the existing Reader test's source-inspection block. It reads the actual Reader and actual Physical file, checks server-only/forbidden authority and storage/provider/app patterns on both, and checks the real HTTPS request/bound lookup/fixed headers in Physical. Public entry arity and app/provider scans remain and also reject direct Physical imports. Every other Reader test byte and every dynamic case remains unchanged.

The manifest records complete old/new source hashes, exact edited spans and all untouched intervals for AA test (10 selected edits), BP1 (3 selected edits), Reader source test (1 selected block) and R2 (2 selected edits). Reversing precisely those text edits recovers each full parent Gitblob. No test/parser/compiler was executed to make these source-preservation comparisons.

## Closed runtime inventory and finite layout-gate review

All 11 unchanged existing runtime inventory entries were independently read at the exact A7 parent and checked against byte count, SHA256 and Gitblob/tree metadata. The new policy updates only the actual Reader/test pins and appends the two new modules, yielding exactly 15 paths. Every other policy field remains unchanged, including Run0, baseSha, repository/workflow/job selection, fixed AA URL, reviewed V2 pin and binding, 131,072-byte limit and 10,000-ms deadline.

The finite source-layout review covered BP1, Reader test, Bern research-only test, integrated official-source test, same-request extraction test, fingerprint-V2 test, S1 research test and bounded-response-body test. Only the two concrete layout predicates selected in A1/A2 required changes. Other inspected source gates introduce no additional selected blocker; this is a bounded read-only finding, not a passed CI suite or universal proof.

## A8-A diagnosis preserved without overstating causation

A7 #4131 / 43222610412 attempt 1 remains FAILED and was not rerun. Root's complete Core log pin is 4,241,384 bytes / SHA256 e3c59acd68a4e23802d5331bbe4996136265a98e6b2083b0b3a5b99eb4697afa; Lifecycle is 165,169 bytes / SHA256 edd3657eea245745fbf058ffc10ec4119809347b628951f81564e4c7b0093b6e.

R2's independent successor recorded query 6,406 ms / COMMIT 20,045 ms / 57P01 / no ACK / protectionFailure null. It did not obtain a fresh readback after that failure, so its outcome remains UNKNOWN; prior absence before the successor is not that successor's readback. R3 recorded query 5,021 ms / COMMIT 20,038 ms / 57P01 / no ACK and a fresh receipt_absent.

The fixed 20-second wire guard may terminate the same backend/transaction and discards its normal termination boolean. Null protectionFailure therefore does not establish that it did not fire normally. The precise actor/timing contribution remains unproved. Chrome's independent unchanged 5-second --version preflight ETIMEDOUT is preserved as separate evidence; no runner-load cause is assumed.

Reader -> S1 -> parse5 introduced unnecessary source-graph work even under Run0. Main/PG1 had 63 primary / 72 composed artifacts and 30 code capsules; A7 had 68 / 77 and 35. The five additional code-artifact identities are pilot-code-30 through pilot-code-34. Per-capsule full digests and file placement were not logged; existing capsule content/digests can shift as well. This establishes graph growth, not its exact timing cost. This source separation is an architecture correction; it is not evidence that the 20-second failure or the separate Chrome failure is cured.

## Exact source and documentation pins

All paths below are immutable candidate contents; the final commit/tree and this handoff's own pin are supplied in the external delivery. Manifest/Task hashes bind their complete content, including the appended full task receipts. Policy remains separately bound by Root exact-head review.

| Path | UTF-8 bytes | Gitblob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 29611 | `933591ff7074c599dc5032f135103bd65f738314` | `ef2fd19af4bf897bcab1a2898f447a9b2a47b759f5a4dfe4b286badae5082bd2` |
| lib/readiness/official-truth-retrieval-physical-internal.ts | 17726 | `bd995580bee6adb6b1a213b17a6001caa8f0aeff` | `aa37e8a42581f4ee67cfd52e677cb7d09a804ac77043e2d20b85dc24cd467e3f` |
| lib/readiness/official-truth-aa-revision-probe-1-server.ts | 20051 | `8db7b78650fcd783a75f8b45753e196b8c0fd0f0` | `69a3520a9c8a31dc37bb45ce190668c41927f6f287f6fd1dc11d5d7acdc9b617` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 4237 | `37bdeeb201d799bd918a62400e518c4052ad9bd2` | `64948e0a2f05ad2c5dd2c76ee4b9ee1ec32afd5d6627f4239e856d9e7b330d79` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 56184 | `c5acfc4e7320cf4794c547b915bbdb35efec4b22` | `89aca333a71996c489b172e1512470ad7870e982c398d0a47fb303c5eed06521` |
| scripts/db/official-truth-integrated-pilot-1/storage.ts | 18102 | `109e8ac57029a03afa55219c8132e8bf004b2dee` | `a7a8bd6e65701e6482c8f7028ed1936df3cf02044adfb85e981f010b4d19f82f` |
| scripts/db/official-truth-integrated-pilot-1/r2-proof.ts | 11305 | `9aec7a10a01bfe0717c6abc9bb6395ea9d937533` | `5f330819ea6c503bb4e65fbae6aacfe959951a8080fa5837874ff0d9418ad732` |
| lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts | 35509 | `7f95fd1225f9f1042251bd0ffbedfb13a9ede0a9` | `62621a5eb1d6496f923a3ee31f925be96504dc83659545bd1430d72c1d052e54` |
| lib/readiness/official-truth-server-owned-retrieval.test.ts | 68545 | `1db87d5a80e913479157340803ddcdf2ac528d4d` | `a296f5212aadb14479657a9487e32fa6252d7fd41a16e18b37341a3eb2da1bc1` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 64700 | `d59505930c80eefd064021ba5fd37c2fea1a1233` | `d851e02399e30a770b2a6dd49c278d4b8a6ca252de1c11752e8d2350cc98ec78` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_MANIFEST_V1.json | 53306 | `3c6f8e874aa86b433648cf9e53d44d24c741a696` | `e244a77d9ff56c279c916498ddd2b17abc89dc02b5272e6d21f84e278ab223fc` |

## Author self-review and required next step

Source-only comparisons establish the complete original Reader inverse, original storage equality, unchanged 11-entry legacy inventory, unchanged original synthetic scenarios, finite selected test/proof deltas and complete old task/handoff preservation. Nine source/proof blobs were written as immutable objects and reread in full before this handoff was prepared. This is an author self-review, never independent Technical Lead PASS.

No native/database/runtime, CI, Vercel, current official revision, pilot-window or public-product truth has been established by this candidate. No query, wire timer, SQL, capture/Engine filter, Chrome preflight, S1 parser, package/lock or accepted Auth source is changed. #917/#1131 platform and safety boundaries remain untouched.

Root and the independent reviewer must inspect the exact immutable candidate and its full tree. Root separately owns current-main/HMA integration, execution selection, fresh full exact-head gating, any later one-shot arm, Ready and merge. The author stops after immutable delivery and remains available in the same session for immediate review fixes.

## Preserved complete prior handoff history

The following is the entire prior A7 handoff verbatim: 80917 bytes, Gitblob d285e32eac66330360058d7c1404317bfadc24d2, SHA256 6da35bd767ed81add8656d73dc1bde7bc6a9027310b4675b8b0af885727dd4a5. Its internal current-state headings refer to their historical revisions. The existing Task prefix is also unchanged: 46809 bytes, Gitblob 004cf197bf2c404e51a040856dc35105f57d71a7, followed only by the four complete later Root receipts.

<!-- BEGIN VERBATIM PRIOR HANDOFF d285e32eac66330360058d7c1404317bfadc24d2 -->
# CH-DE-AA-REVISION-PROBE-1 — author handoff V1 / A7

## Current A7 state — 12 November 2026

**SOURCE PREPARATION / Run 0 UNARMED / executable publication HOLD / independent review and fresh final-head gates pending.**

Authority is [Root TASK V1/A7](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6823551510), reread unchanged before verbatim embedding in Task. A7 explicitly permits source preparation while Auth-main's own post-merge acceptance is pending. It does not grant executable publication, a positive probe selection or a retry of the actual failed A5 run.

Same actual author: **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**.
Same original actual session: **/root/aa_revision_probe_writer_g1**.
No successor or resumed Cursor UI session is claimed. This A7 task uses no subagent.

## Exact ordered parents and integration provenance

The immutable integration commit has these ordered parents:

1. A6 source candidate **7aa2f2fda1ad06fe2c85584f86f049c575d919da**, tree **a4f5a83a0d92b7e6daf8c6479c6e3d1155b63171**.
2. Actual Auth-main **ee6801e99e86144e60dbe86d72576f9ad7c3e9bb**, tree **c2fad9aff45aa07addb541fea8e6a38fb9f2a19e**.

The author independently read both complete untruncated recursive trees and both commit objects. A6's sole parent is the still-published A5 head bb3b22d7ce6f60b2226e7d069287f99960de093f. Auth-main has ordered parents [dfd692440762b50183fdebbfd6bf8dabde4662d0, 72ec65f55e2e69e737b774b83b20201fed1e1892]. The actual main ref was independently read as ee6801e99e86144e60dbe86d72576f9ad7c3e9bb. The PR metadata response still displayed its earlier base dfd692; that display was not used to substitute another main identity.

Root's [A6 bounded SOURCE_PASS](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6823074837) is confined to the earlier source candidate and retains publication HOLD. Root's [Auth exact-head TL-PASS](https://github.com/Jetnity/jetnity/pull/1194#issuecomment-6823268643) covers the accepted Auth correction before its merge. Both receipts were read; neither is transferred as a runtime/Ready verdict for A7.

At A7 selection Root recorded Auth #1194 merged at 12:12:26Z, actual-main Production/jetnity.com READY on ee6801, and own main CI **#4129 / 43215792152 still running**. Those deployment/run observations are attributed to Root A7, not to a new hosted or log read by this author. Full actual-main post-merge acceptance is not asserted here. Root must accept that evidence and independently review A7 before executable publication.

This is an immutable two-parent Git-object composition only. No branch/PR ref, Ready state or repository merge action was performed by the author.

## Five exact Auth-main paths adopted without authorship changes

Complete actual source bytes were read at ee6801 and independently hashed. The full old-base-to-Auth-main comparison contains exactly these five disjoint paths: two existing source modifications and three added documents. Their Gitblobs, byte counts, SHA256, 100644 modes and blob types are adopted unchanged.

| Path | UTF-8 bytes | Exact Auth-main Gitblob | SHA256 |
|---|---:|---|---|
| lib/supabase/auth-bericht.test.ts | 8497 | `1406705421fe3b2c3d312bbc067556d695eb76a7` | `e9413d4246959a3f0b012f91522571b7ba26c21a0ea5a669a2a4ef7909eaa25d` |
| lib/supabase/auth-erwartung.ts | 19854 | `25ef939f111ba0db5475cdf1e4d1c55364193512` | `46ead850c64d6cd0c152f7750c0cdf0f0934eea734e75274f2b19d30d89aa58e` |
| docs/official-truth-product-v3/AUTH_CONFIGURATION_OBSERVATION_HANDOFF_V1.md | 10327 | `7c3100827240d05c75ab1049a115fe66f1105086` | `822a5a1789e9cdb40b34a1ef87866a6ac4cfc5f0c42a27491f4b0eb4000bd641` |
| docs/official-truth-product-v3/AUTH_CONFIGURATION_OBSERVATION_MANIFEST_V1.json | 12247 | `ff7dd2f520c191a7c9c55d5c542b09c1ad4838e0` | `383eb44c5149206ac226a85063b7e11b5bb3c28693dee7b3de2a2d811b77147a` |
| docs/official-truth-product-v3/AUTH_CONFIGURATION_OBSERVATION_TASK_V1.md | 10169 | `bec28fc005b3d1191354948ae7026d30bdfe1cde` | `09bacca39ccf833c220b8cdd7a343b958fbb8107e70bf910ea640a3c812ebe66` |

No Auth source, expectation, fixture, diagnostic or document is reauthored by A7. No hosted Auth configuration or actual Auth response/log is read or changed. The existing accepted source correction and its provenance remain byte-exact.

## Only authored policy change

After all thirteen actual source pins had been checked, the policy changed only this selected base identity:

```diff
-  baseSha: 'dfd692440762b50183fdebbfd6bf8dabde4662d0',
+  baseSha: 'ee6801e99e86144e60dbe86d72576f9ad7c3e9bb',
```

The full inverse of that single line replacement restores the complete A6 policy:
**3874 UTF-8 bytes**, Gitblob `1630bdc14e40893fe9a1e398d8f5922c64aee849`, SHA256 `6bcb96a7091349d0e7cac7d6cac67bd18a49cbdad9dc89b1f1c04be8e8c6e667`.

The new policy is **3874 bytes**, Gitblob `8c53a47e1df0e5084fe5587af489d015563bb1cd`, SHA256 `ba82538f4a8b065fc4a29689046ecbd6ca634a41bf6520dfe113ad6aad57ea4c`.

Run number stays **0 / UNARMED**. Every other policy byte remains exact, including all thirteen inventory rows, selected branch/job/repository, workflow identity, fixed source URL, V2 fingerprint, binding, byte/time limits and authority/output boundaries. The base update does not select a positive run or reset a consumed claim.

## Actual thirteen-entry byte inventory

The complete Reader and AA-test bytes were read from A6; the other eleven files were read directly at actual Auth-main ee6801. Each byte count and independent SHA256 matches the unchanged policy row. For every one of those eleven main files, the Gitblob also equals the A6 parent tree's blob. The integrated final tree retains the exact resulting thirteen objects.

| Path | Actual UTF-8 bytes | Actual Gitblob | Actual SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `2b14953968da35ca47b272fd67a1a912613b8e6d` | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45448 | `a3f35c4f1d400b8acaca38c82484f0b7093dee07` | `ca95ba6e164952a0046a4979e9d576e2473cc4b0e1780a9a68cb87c52209ba72` |
| lib/readiness/official-truth-bounded-response-body.ts | 1278 | `783d802fff48a2969b86945515b159a513df76e9` | `186ad6dd5ebcf03cd25586775fefe17d652863cb04a2ba72a7be64c7ee4ca0a2` |
| lib/readiness/official-truth-source-fingerprint-v2.ts | 5156 | `72d324d019625c5028be8f47763fdd0f6ffe38e5` | `d8c0ddd287b0cffc4e9f0a88528ecce5c02052afdc0ab59fbb67449276388eac` |
| lib/readiness/digest.ts | 3013 | `bbb6ee9d8e1e1433cbb5753b15b86b7b215d8c54` | `e63201d45a39f68624b1e1f9e7568b696f8a65d1ada07f16e64a2be69dcec190` |
| lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.ts | 6702 | `888435e2867ff373b85b0299833c3f1fe34c0af3` | `059cd29e8695bf29c5296a1bfeb122fd491caff14c701c81ef2dc0bbdd6bf00e` |
| .github/workflows/ci.yml | 12325 | `22f6e50aaff600749814bf7e77e24c728b1cd5d5` | `3889e092f9cf4ce4b917a786a3267bf9bb510b727d5c76db7cabf6b08f9e6d18` |
| package.json | 6467 | `3e8a2b7a40007af29320919401369f17ee53672a` | `5ce795c22de79e205f6528e8ae3329d4a7863e11178e0b3fe32a1425e54af4df` |
| package-lock.json | 320689 | `7b5394006458d34c833cdb5438b06f9f6af28353` | `71f4f32185dc9acd56b5dcfaec8162f317f7e370f32bdefe9264adbb7fd05b1e` |
| scripts/server-only-test-register.mjs | 508 | `97e3f68e1669235c63d2763f611d1a6d0e18ff1b` | `d565c9029d993a8a778cd530acebae5707034223bcb18f55dc9a306941b10d32` |
| scripts/db/official-truth-accepted-store-trip-integration-1/native-loader.ts | 6501 | `7f79dba1cbdc4a6807f094a4873ba3ad635b7b46` | `49ab7d7c68afcc30d80251db85e47041e2962f0c83cecf7f63964ce64aa4b298` |
| lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts | 9176 | `b77667a2b345ff272a5379aaa9a08d409e25d208` | `74a83b4b62711da43f4f6efdf94e4dd162bfcad5c06af253af3300dd59a27572` |
| lib/readiness/official-truth-content-identity-r2.test.ts | 41838 | `01c032582fb37fd0881c828610a83db483c6d688` | `be7a0b62e55c557faf05963befd5b717b7ea245bc71d2a85eb4fd0d3f5225c16` |

The actual workflow is exactly Auth-main's `.github/workflows/ci.yml`: Gitblob `22f6e50aaff600749814bf7e77e24c728b1cd5d5`, 12325 bytes, SHA256 `3889e092f9cf4ce4b917a786a3267bf9bb510b727d5c76db7cabf6b08f9e6d18`. Package and lockfile identities also remain exact. No HMA1 PG17 CI insertion, package integration, inventory rebinding or alternate workflow is present.

A later main/workflow/pinned-source change requires a new explicit Root integration/policy decision. This candidate does not silently follow another base.

## Five preserved A6 implementation blobs

The following implementation files are byte-identical to A6:

- Reader `2b14953968da35ca47b272fd67a1a912613b8e6d`.
- AA test `a3f35c4f1d400b8acaca38c82484f0b7093dee07`.
- BP1 test `7b027b49af72a3f16b230acfeff7434f9a71b64e`.
- Storage diagnostic `3079ee3149dc4ac0f505e1d683cb1099baa2b5ca`.
- R2 diagnostic `e473bdf01ce26ec9f2f92d71cf0f25f4bda270c6`.

The existing Reader primitives, original-byte preservation, BP1 assertions, A6 failure-only record and storage snapshot, R2/R3 assertions, SQL/queries, native guards, cleanup and deadlines are not changed by A7. There is no new Reader consumer, export, callback, runtime adapter or source request.

## Current eight-path AA manifest

Seven non-Handoff blobs are fixed before writing this document. This Handoff's own hash and the final integration commit/tree are supplied externally to avoid a self-reference loop.

| Path | UTF-8 bytes | Gitblob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `2b14953968da35ca47b272fd67a1a912613b8e6d` | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 3874 | `8c53a47e1df0e5084fe5587af489d015563bb1cd` | `ba82538f4a8b065fc4a29689046ecbd6ca634a41bf6520dfe113ad6aad57ea4c` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45448 | `a3f35c4f1d400b8acaca38c82484f0b7093dee07` | `ca95ba6e164952a0046a4979e9d576e2473cc4b0e1780a9a68cb87c52209ba72` |
| lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts | 25526 | `7b027b49af72a3f16b230acfeff7434f9a71b64e` | `3804730801ec6713d75ee62d71a7e9c2e02a779469e59270d09a1e168b90884b` |
| scripts/db/official-truth-integrated-pilot-1/storage.ts | 18155 | `3079ee3149dc4ac0f505e1d683cb1099baa2b5ca` | `5234193604d89a9cf0955aa847fb495d862ea6e779fb50597aeeda920757e920` |
| scripts/db/official-truth-integrated-pilot-1/r2-proof.ts | 10693 | `e473bdf01ce26ec9f2f92d71cf0f25f4bda270c6` | `d2cc6c9d91574945d226607fb60eba95b80c49b2217b0a0521726fd71f5d674a` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 46809 | `004cf197bf2c404e51a040856dc35105f57d71a7` | `9c3bd6a5f8d155ef27da489334f3e16dff784b56bf2d6fac6a63d6c54817a371` |

The complete final scope versus selected actual main ee6801 is exactly the existing eight A6 paths: four source modifications and four additions. All **9475 other actual-main leaves** are preserved in object, mode and type. Final total is **9483 leaves**, with no deleted paths.

First-parent differences are exactly the five adopted Auth-main paths plus three A7-authored paths: policy, Task and Handoff. That is eight paths, five modified and three added; all **9475 other A6-parent leaves** remain exact. The full recursive comparison is required and supplied, independent of GitHub's abbreviated PR file list.

## Preserved task and dated history

The complete existing Task and Handoff history were read before this integration. The full **42267-byte A6 Task** remains an exact prefix, followed by the complete A7 comment verbatim and its persisted URL. Its prior Gitblob is `cfbf5f02a0c4fd28de1241ecfb052f8e28bb996c`, SHA256 `d37a492cabb993edabd1f0bb5545abb1dcb596e29eba8c1d76b3167eb5463801`.

The full **64959-byte A6 Handoff**, Gitblob `e2aa87003914726c45025faa43062add055cfe78`, SHA256 `7eecf99b4a1f8e2b840ba980cf9747d5d63e1b85be8f48ace165e1a45b280fa7`, is retained verbatim below as dated history. It contains the complete earlier source reviews, A1 passive transport and R1 static-analysis limitation, A2 selection, A3 preservation correction, A4/A5 failures and A6 diagnostic rationale/inverses. None of that evidence is deleted or relabeled.

Earlier dfd692 base identities and earlier sole-parent/source-preparation statuses are historical. Only this A7 section and its explicit task supersede the current integration/base provenance; Run0 and every unresolved runtime limitation remain authoritative.

## Actual runtime failures remain unresolved

Actual A5 run **#4123 / 43206762401 / attempt1** remains FAILURE. Root's original verify log was 4,237,330 UTF-8 bytes, SHA256 `449fed066f4769e75545dfbe8eb20b1185c127cbdd26a1164c1be83cf866204d`: 8,730 tests, 8,726 passed, two failed and two existing skips. The AA synthetic preflight passed without an actual AA observation.

R3 selected_escaping_and_500 reached a 20,039 ms COMMIT failure with57P01, no ACK and independent receipt_absent. R2's independent persistence result was false. A6 adds finite diagnostic evidence only and preserves those failed assertions. Its bounded diagnostic has not been executed by this author or treated as a repair.

The controlled runtime's capture of loaded source means zero AA influence is not established. A4-to-A5 Reader equality does not prove a runner problem, a timeout cause or a flake. A7's Auth adoption does not resolve those questions. No earlier Auth, A4, A5, M04, Preview or source-review result is transferred as A7 runtime acceptance.

Historical positive selection #4120 remains consumed. This integration does not invent a new run number, rerun that selection, reset a claim or positively arm the probe.

## Execution HOLD, honest self-review and author stop

Author verification is limited to complete Git source/metadata reads, pure in-memory byte hashing/composition, exact policy inverse, immutable source-object readback, the thirteen actual byte pins and complete tree/path comparisons. No project/parser/compiler/native/SQL/test/build/CI/source-GET/hosted execution occurred. The Supabase skill was read for the exact Auth-file adoption; its general runtime-query workflow was not performed under this source-only task.

**HOLD executable publication** until Root accepts actual Auth-main post-merge evidence and independently reviews this exact successor. The author has no authority to lift that HOLD. Only Root may then select fresh existing CI for this integrated head, with the unchanged actual R2/R3 assertions and A6 bounded diagnostic; no blind rerun is selected here.

The eventual final head requires complete independent source review, current-main/workflow equality, actual full CI/native evidence and permitted original logs, exact Preview and review-thread disposition. Every changed head invalidates earlier exact-head gates. Ready, merge and actual-main/Production acceptance remain Root-only decisions; author self-review is not TL-PASS.

Exact official-source/revision observation, custody, extended pilot window, Dev installation/D1 operation and public CH-DE readiness remain unfinished. Original #917/#1131 STOPs, actual Owner/AAL2 and source/custody/window gates are unchanged. No raw source, secret, Auth response or new observation hash is emitted or adopted.

**STOP after immutable delivery.** No ref/PR update, Ready, merge, source request, retry/rearm or unrelated follow-on. The original session remains reachable for an explicitly selected task. **Public CH-DE is not made live by A7.**

## Historical A6 handoff — 12 November 2026 — preserved verbatim

The following complete A6 document belongs to first parent 7aa2f2fda1ad06fe2c85584f86f049c575d919da. It includes all prior history. Its old-base and sole-parent statements are retained as dated provenance; the current ordered-parent/base identities and executable HOLD are stated above.

---

# CH-DE-AA-REVISION-PROBE-1 — author handoff V1 / A6

## Current A6 state — 12 November 2026

**Run 0 / UNARMED, byte-exact policy. Diagnostic source amendment only. A5 runtime failures remain unresolved. Independent review and fresh final-head gates are pending.**

Authority is [Root TASK V1/A6](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6822711007), reread unchanged before verbatim embedding in Task. The sole parent is published Draft #1192 head `bb3b22d7ce6f60b2226e7d069287f99960de093f`, tree `e0da1e50dc5723f385a4e9b667932658bf261270`. The selected integration base is `dfd692440762b50183fdebbfd6bf8dabde4662d0`; the actual PR metadata read for this amendment still reports that base and the specified parent head.

Same actual author: **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**.
Same original actual session: **/root/aa_revision_probe_writer_g1**.
This A6 amendment uses the same author/session, claims no resumed Cursor UI session and uses no subagent.

This immutable candidate is not published by its author. It contains no Auth correction, base/dependency integration, positive selection or runtime acceptance. Root separately owns independent source review and any later integration/publication decision. Existing PR remains Draft/CHANGES REQUIRED; the new source is not Ready or merged.

## Actual A5 failure evidence

[Root A5 failure receipt](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6822445249) binds run **43206762401 / #4123 / attempt 1**, Repository verification job **131143772437**, to the parent A5 head.

Root and independent read-only reviewer /root/ch_de_ci_reconstruction read the original log: **4,237,330 UTF-8 bytes**, SHA256 `449fed066f4769e75545dfbe8eb20b1185c127cbdd26a1164c1be83cf866204d`. Root records 8,730 core tests, 8,726 passed, two failed and two existing skips. The AA synthetic preflight passed, but no actual AA observation record occurred. The detailed original-log findings below are attributed to Root's receipt/A6 and independent reviewer; this author has not claimed to read that full log.

The author independently read actual job metadata: Typecheck and Lint SUCCESS; Tests FAILURE; Admin protection, schema usage, unreachable-code, uncalled-export, unused-package and Production build SKIPPED. The five companion lanes succeeded; the separate Auth metadata lane and aggregator failed. No Auth log or Auth response was read or acted on.

The author independently read synthetic checkout commit `f23134d47b6525f658a9f58a5b1f4bfb32bfa6f9`: parents are exactly [dfd692440762b50183fdebbfd6bf8dabde4662d0, bb3b22d7ce6f60b2226e7d069287f99960de093f], and its tree is exactly e0da1e50dc5723f385a4e9b667932658bf261270. The actual failed test source therefore matches the A5 candidate tree.

### Unresolved native results

R3 selected_escaping_and_500: Publish took **5,282 ms** and succeeded; COMMIT took **20,039 ms**, failed with **57P01**, had no acknowledged commit, and independent readback was **receipt_absent**. The existing unchanged 20-second backend guard explains the cutoff path, not why this workload reached it. Root's A4 comparison was Publish 2,369 ms / COMMIT 10,392 ms / verified_exact. No runner defect, flake classification, timing repair or safe retry is established.

R2 stopped at the existing `assert.ok(independent.ok)` after an independent persistence attempt. The returned false result could originate from strict bundle preflight or the existing unacknowledged-COMMIT branch. Errors after an acknowledged COMMIT still throw. The old assertion did not retain the scenario, returned reason, protection failure or writer-operation diagnostics. A6 preserves those finite diagnostics without accepting the failed result.

The controlled runtime captures complete loaded source files. The larger AA Reader can affect native bundle input even while the positive entry is not called. Main-to-AA source differs; A4-to-A5 Reader bytes are exact. Neither zero influence nor a proven timeout cause follows from that evidence. A6 does not edit fixtures, proof-input construction or supplied arguments; it does not resolve the influence/cause question.

## Complete bounded source change

### storage.ts

Only the existing `committing && !committed` false-result branch gains the existing same-connection diagnostics snapshot:

```diff
-      return {ok:false as const,reason:'commit_outcome_unknown' as const,...(protectionFailure?{commitProtectionFailure:protectionFailure}:{})}
+      return {ok:false as const,reason:'commit_outcome_unknown' as const,operationDiagnostics:connection.operationDiagnostics,...(protectionFailure?{commitProtectionFailure:protectionFailure}:{})}
```

The existing getter returns an array snapshot via slice; the private recorder retains at most 32 frozen records. Those records contain phase, elapsedMs, outcome, finite code and optional ACK/dispatch/protection flags. The author read the full unchanged Wire source, Gitblob `c8bae7b92950a318e6555aaad930002c6726ca3e`, including its finite-code filter and retention limit. There is no SQL, parameter data, identity, socket path, raw database error or stack in this snapshot.

The existing ok:false, reason, optional commitProtectionFailure, success/preflight returns, post-ACK throwing behavior, rollback, finally close and all query/connection/guard logic remain textually exact. The extra getter read is synchronous inside the already-existing failure branch; it starts no observer, callback, timer, connection or query and does not change a budget or cutoff.

### r2-proof.ts

Immediately after the existing independent persistence attempt, and before both unchanged success assertions, these seven lines are added:

```ts
      if (!independent.ok) console.error(JSON.stringify({
        schema: 'jetnity.native.r2-independent-failure.v1',
        scenario,
        reason: independent.reason === 'commit_outcome_unknown' ? 'commit_outcome_unknown' : 'bundle_verification_rejected',
        commitProtectionFailure: independent.reason === 'commit_outcome_unknown' ? independent.commitProtectionFailure ?? null : null,
        operationDiagnostics: independent.reason === 'commit_outcome_unknown' ? independent.operationDiagnostics : [],
      }))
```

The unchanged surrounding statements remain:

```ts
      const independent = await persistVerifiedIntegratedBundleLocally(cluster, oids, primary)
      // The added failure-only block sits here.
      assert.ok(independent.ok); assert.equal(independent.outcome, 'inserted')
```

The scenario is the existing literal union statement / lock_and_idle_transaction / commit. The reason is restricted to commit_outcome_unknown or bundle_verification_rejected. The existing finite protection flag is retained or null; a strict preflight refusal has an empty operations array. An unacknowledged-COMMIT result uses only its already-retained array, bounded by the unchanged Wire recorder to 32 records.

The record uses one stderr JSON write only when independent.ok is false. The immediately following original assertion still fails, so this cannot fabricate success or continue to a later scenario after that failure. There is no success logging, raw exception, new publication/readback, retry, catch/ignore, monkeypatch, fixture or proof-input-construction change.

## Exact inverse and preservation evidence

Removing the single storage field addition restores the entire original storage source byte-for-byte. Removing the single seven-line R2 block restores the entire original R2 source byte-for-byte.

| Original file | UTF-8 bytes restored | Original Gitblob | Original SHA256 |
|---|---:|---|---|
| storage.ts | 18102 | `109e8ac57029a03afa55219c8132e8bf004b2dee` | `a7a8bd6e65701e6482c8f7028ed1936df3cf02044adfb85e981f010b4d19f82f` |
| r2-proof.ts | 10168 | `7f9f196d2a429debe11a48c41a859560ad2c2423` | `e55d76207674cb80e6430f8398e165655cd2c0438d22c684b2b2cf4f411562e1` |

These inverse operations are source-string comparisons and independent metadata hashing. They are not execution of project code, its parser/compiler, tests or native proof.

The existing AA Reader, policy, AA test and BP1 test remain byte-identical to the parent. Policy is exactly Gitblob `1630bdc14e40893fe9a1e398d8f5922c64aee849`, Run0, including all 13 unchanged inventory entries, base SHA, source URL/limits and selection/security boundaries. No new Reader consumer or export is added.

R3, shared Wire/guards, deadlines, SQL functions/triggers, workflows, fixtures and all other parent files are unchanged. The source amendment preserves every existing assertion and every pre-existing failure/result decision apart from the explicitly additive diagnostic field and stderr record.

The full **36,733-byte prior Task** is an exact prefix, followed by the full A6 comment verbatim and its URL. The full **51,363-byte prior Handoff** is preserved verbatim below as dated A5 history. Its previously pending/not-published statements are historical and do not override actual failed #4123.

## Current eight-path manifest

Seven non-Handoff blobs are fixed before writing this document. The Handoff's own hash and final commit/tree are supplied externally to avoid self-reference.

| Path | UTF-8 bytes | Gitblob | SHA256 |
|---|---:|---|---|
| lib/readiness/official-truth-server-owned-retrieval.ts | 65490 | `2b14953968da35ca47b272fd67a1a912613b8e6d` | `a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143` |
| lib/readiness/official-truth-aa-revision-probe-1-policy.ts | 3874 | `1630bdc14e40893fe9a1e398d8f5922c64aee849` | `6bcb96a7091349d0e7cac7d6cac67bd18a49cbdad9dc89b1f1c04be8e8c6e667` |
| lib/readiness/official-truth-aa-revision-probe-1.test.ts | 45448 | `a3f35c4f1d400b8acaca38c82484f0b7093dee07` | `ca95ba6e164952a0046a4979e9d576e2473cc4b0e1780a9a68cb87c52209ba72` |
| lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts | 25526 | `7b027b49af72a3f16b230acfeff7434f9a71b64e` | `3804730801ec6713d75ee62d71a7e9c2e02a779469e59270d09a1e168b90884b` |
| scripts/db/official-truth-integrated-pilot-1/storage.ts | 18155 | `3079ee3149dc4ac0f505e1d683cb1099baa2b5ca` | `5234193604d89a9cf0955aa847fb495d862ea6e779fb50597aeeda920757e920` |
| scripts/db/official-truth-integrated-pilot-1/r2-proof.ts | 10693 | `e473bdf01ce26ec9f2f92d71cf0f25f4bda270c6` | `d2cc6c9d91574945d226607fb60eba95b80c49b2217b0a0521726fd71f5d674a` |
| docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md | 42267 | `cfbf5f02a0c4fd28de1241ecfb052f8e28bb996c` | `d37a492cabb993edabd1f0bb5545abb1dcb596e29eba8c1d76b3167eb5463801` |

Exactly four first-parent paths change: storage.ts, r2-proof.ts, Task and Handoff. Against the selected dfd692 integration base, scope is exactly the existing six AA paths plus storage.ts/r2-proof.ts: eight paths total, four modified and four added. All 9,472 other base leaves remain identical in object, mode and type; all 9,476 other parent leaves remain identical.

## Honest self-review, remaining gates and stop

Author verification consists of complete relevant source reads, fixed-diff/inverse comparison, metadata byte hashing, immutable Git-object readback and full-tree preservation. The bounded field/record selection is supported by the existing Wire implementation and strict result union; no project/runtime assertion is claimed to have been run here.

This is **diagnostic source only**, not a functional repair, reproduced runtime PASS, timeout diagnosis or acceptance of either native failure. The actual A5 result stays FAILURE. The A5 schema gate remained skipped despite its source-reviewed two-constructor fix. Earlier A4 passes and old exact-head Preview do not transfer to this changed candidate.

Root must independently review this exact source/tree and separately decide when to integrate the accepted Auth correction and publish. No Auth/base integration is implicit in A6. The eventual final integration head requires fresh complete CI, native evidence/full permitted logs, exact Preview, current main/base and review-thread disposition. Ready, merge and actual-main/Production acceptance remain Root-only decisions.

Run0 remains byte-exact. Historical selected #4120 is consumed. A6 authorizes neither another selected AA run nor a rerun/retry of A5; a later source request requires its separately persisted explicit Root selection and review. The original #917/#1131 platform boundaries, actual Owner/AAL2 and source/custody/window gates remain unchanged. No hosted installation, D1 activation, current revision, legal admission, pilot extension or public CH-DE release is claimed.

A1's passive private Native-Harness boundary and R1's bounded AST-analysis limitation remain unchanged: arbitrary runtime-computed paths/names are not universally resolved by the source guard, and full exact-tree/diff/source review plus unchanged legacy pins remain separately necessary.

**Author stops after immutable delivery.** No project/parser/compiler/test/native/SQL/CI/build or source-GET execution; no ref/PR publication, Ready, merge, positive rearm, subagents or automatic follow-on. Same actual session remains reachable only for an explicit further task. **Public CH-DE remains NOT LIVE.**

## Historical A5 handoff — 12 November 2026 — preserved verbatim

The following complete document belongs to published parent bb3b22d7ce6f60b2226e7d069287f99960de093f before actual failed CI #4123. It includes all earlier history. Current A6 failure evidence, diagnostic-only status and unchanged Run0 disposition above take precedence over its historical pending statements.

---

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
<!-- END VERBATIM PRIOR HANDOFF d285e32eac66330360058d7c1404317bfadc24d2 -->
<!-- END VERBATIM A8-B HANDOFF 8fd1b771fbe39f927bb743ebf343ea861750433d -->
