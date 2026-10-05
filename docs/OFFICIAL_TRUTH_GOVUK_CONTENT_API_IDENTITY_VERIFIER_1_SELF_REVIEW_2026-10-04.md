# GOV.UK Content API identity verifier 1 — Self-review

Date: 4 October 2026. Issue #818 / Draft PR #819 / Generation 1.
Writer: **Jetnity GOV.UK Content API identity verifier 1**.
Model: **GPT-6 Astra — Sehr hoch**, `gpt-6-astra` / `xhigh`.
Session: `01a1071c-786d-79c0-8ff7-b17597e477c1`.
Baseline: `f0430bb62b12d5f7e523db88cb5d2dcc92754bd3`.
Dispatch: `2c5cce9a596e85cdb72965a92127312cd421263f`.

Classification: **GOVUK_CONTENT_API_IDENTITY_VERIFIER_READY_FOR_REGISTRATION_AUDIT**.
Author self-review only. Exact final head is in the completion delivery and PR readback, not replaced by the baseline or dispatch. This tracked document cannot contain its own commit hash.

## Resolved delivery finding

The previous R1 importer-list blocker was correctly reported at `ee48c674d7f531e6ed25706bc0a0d9887daa6728`. Technical Lead independently reproduced it and committed Scope Amendment 1 at `96346b7bf2c0eb1f887bdad1f4750ce5276de2b0`. Both binding documents were read completely before this same-session correction.

The correction adds exactly one sorted expected path in `official-truth-content-identity.test.ts`: the new verifier module. Byte comparison against main proves this is the only change in the existing test. The repository scan, type-only import treatment, exact list assertion and all other R1 expectations remain intact. No existing production file changed. The verifier and new focused test are byte-identical to the blocked head. There is no further author-known blocker; independent exact-head review remains outstanding.

## Adversarial review

| Challenge | Implementation and proof |
| --- | --- |
| Last-key-wins JSON permits identity substitution. | Entire-string scan precedes JSON.parse and every response identity read. Per-object decoded Sets reject literal/equal/escaped duplicates, including nested unrelated metadata. Tests cover both replacement orders and duplicates in organisation/body/history fields. |
| Key-looking body text produces false duplicates. | String scanner tracks token boundaries and escapes; body remains opaque. Positive fixtures contain braces, quotes, backslashes and duplicated key-looking text. |
| Two legitimate link objects repeat content_id. | Each object has its own Set. Canonical four-link envelope and separate-object parser tests pass. |
| Surrogate decoding differs from JSON.parse. | Decoded UTF-16 stream is validated for paired surrogates; escaped, raw and mixed pairs agree with JSON.parse. Raw/escaped lone high/low surrogates and invalid continuations fail. Key limits count UTF-16 units. |
| Regex-only parsing overlooks syntax. | Bounded recursive-descent scanner consumes objects/arrays/strings/literals/numbers and exact JSON whitespace. Regex is used only for four hex digits, later timestamps and test repository scans. No regex key detector, eval or reviver exists. |
| Grammar permits non-JSON or partial input. | Comment, trailing comma/token, invalid escape, control char, leading-zero, invalid exponent/fraction, NaN/Infinity, truncation and non-object root tests reject. Full end-of-input check is mandatory. |
| Resource limits have off-by-one errors. | Every bound has a positive exact-limit and negative overflow test: 65,536 bytes, depth 16, 2,048 members, 256 per object, 1,024 per array, 4,096 values including containers, key 128 units, number 64 units. Multibyte strings and escaped/astral keys are covered. |
| Counting still allocates unbounded objects. | Cheap text-length check precedes bounded UTF-8 allocation; key/value/container counters precede Set growth/descent. Value strings are scanned without a decoded copy. No object construction occurs until the whole scan succeeds. Number tokens are length-checked before substring conversion. |
| Dangerous decoded properties reach objects. | __proto__, prototype and constructor reject at any depth, including escaped spellings. No prototype merge occurs. |
| Same publisher/schema admits Appendix ETA. | Exact National List root id/path, self link and descriptor scope reject the real audited sibling id/path, including a coherent Appendix descriptor/response pair. |
| Publisher relation silently substitutes for authority. | Both singleton arrays are mandatory and independently validated through machine UUID/path/locale/schema/type/URLs/status. Tests mutate each relation independently. Display title/branding cannot rescue a mismatch. |
| Root identity is found recursively in body or links. | Only exact own root fields satisfy root pins. Details/manual and each link are checked by explicit paths, never recursive id selection. |
| Unknown linked structure or extra organisation is tolerated. | Closed root/details/link shapes, singleton arrays, exact base_path-only details.manual, empty nested links and reviewed organisation display containers. Unknown additions fail. Opaque non-identity arrays remain observations under task-defined type checks. |
| Mutable title/body/date is treated as item identity. | Values may change. Types/calendar syntax remain checked. Success never includes an observation/hash/legal interpretation. Valid mutability cases preserve the exact trusted binding. |
| Timestamps smuggle freshness authority. | No clock or equality pin; real calendar and offset bounds only. Leap-second claims/year zero conservatively reject and are documented as availability limits. |
| A new local id is minted from the upstream UUID. | Local source/item/representation ids and versions are copied exclusively from the trusted coherent tuple. Tests vary synthetic local ids/versions and verify exact seven-field output and freezing. No real Jetnity ids are allocated. |
| Profile reimplements trusted retrieval. | Rechecks exact supplied finalUrl and normalized mediaType only. No HTTP/DNS/status/redirect acquisition; existing server retrieval owns those boundaries. HTML never passes. |
| A pure function is treated as a live attestation. | Inputs are the existing trusted-descriptor seam, not an untrusted registration API. R1 owns generic descriptor validity; R2 owns origin and final tuple rebind. The parser helper alone proves syntax only. |
| Importing the new module activates production. | Only tests import it. Registry remains byte-unchanged Object.freeze([]), length zero and frozen at runtime after module import. New repository scan asserts zero non-test importers. |
| The scope correction weakens the importer guard or hides another failure. | Exact one-line diff under the TL amendment. The scan still includes type-only imports and asserts all 22 exact paths. 331/331 focused, 45/45 R1, 125/125 affected and 5,083/5,083 full tests pass, with no skips/cancellations. |
| Validation contacted live databases or government. | Full suite/build used --network none containers. Existing tests create disposable synthetic PostgreSQL over local sockets. No hosted DB client, credential or GOV.UK call used. Prior saved capture was shape-inspected, not stored as a fixture. |

## Scope and evidence review

Exactly eight authorized paths differ from baseline: immutable task, unchanged TL amendment, two new code/test files, the one-line existing R1 test correction, and three assigned delivery docs. No other existing runtime/test/configuration/schema/migration/dependency file changes. Amendment SHA-256 `0fc1f09e909bfe8e522d807412247a92c0b3fcdd33542f4e1a3ea01a67a92222` matches its TL commit. Seed Git blob `d0cadaf7be709cca8d2ec1cd55191be3b3547121`, SHA-256 `07b97fe02ae5a51061f33294f48f8b61a2338121b44f46b48bcae54b2b14460d`.

Startup and final pre-delivery reads match the expected main and NORMAL mode. #751 names this sole active slice; open PR/local-writer reads show no collision; only earlier TL receipt `5978881653` follows the inbox marker. No misleading reuse of earlier CI results. The completion receipt pins final-head checks. The first snapshot's two missing-Git failures and the build's IPC/symlink environment failures were corrected without repository edits, then the actual commands were rerun. Canonical build, typecheck, lint, operating-mode and five hygiene checks pass.

No source/content/representation/profile registration, real DB query/mutation, Development/Production mutation, migration, source/catalog/store/retrieval edit, extractor, composition policy, region pin, Rule fact, schema-1 persistence, F8, UI/provider/traveller change, dependency, full legal body fixture, #626 or launch/indexing action. No new recurring costs. Remote CI/Vercel and live database state are not claimed as independently verified by this writer.

Residual risks: strict reviewed envelope intentionally rejects future GOV.UK structural/authority/schema changes; identity success alone does not establish current legal sufficiency or accepted Evidence; future profile registration needs its own authorization and audit. First next actor is the Technical Lead, reviewing this exact head. Remain Draft; no Ready, merge, registration audit or F8. STOP.
