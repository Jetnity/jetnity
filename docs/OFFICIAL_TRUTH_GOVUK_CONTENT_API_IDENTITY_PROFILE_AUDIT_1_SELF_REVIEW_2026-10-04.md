# GOV.UK Content API identity profile audit 1 — Self-review

Date: 4 October 2026. Issue #816 / Draft PR #817 / Generation 1.
Writer: **Jetnity GOV.UK Content API identity profile audit 1**.
Model: **GPT-6 Astra — Sehr hoch**, `gpt-6-astra` / `xhigh`.
Session: `01a106e5-1f2a-7c11-beb4-022000dbf140`.
Baseline: `601379f2f2138a49fbf85fa8b44856fb71079d45`.
Dispatch: `9b44292be537408a61e05a994651a497fc98b8fa`.

Classification: **GOVUK_CONTENT_API_IDENTITY_PROFILE_PROVEN**.
This is the author's adversarial self-review, not independent review or a runtime test result. The exact final head is in the completion delivery and PR readback; the document does not claim to contain its own commit hash.

## Challenges and disposition

| Challenge | Evidence, decision and limit |
| --- | --- |
| An official hostname alone could admit a sibling. | Actual Appendix JSON shares host/department/schema/locale/phase but differs in root content_id and base_path. Both exact pins reject; descriptor scope also rejects an Appendix descriptor supplied to this profile. |
| A Home Office display name could disguise another publisher. | Use live UUID `06056197-bc69-4147-aa28-070bca132178`, not name, branding or analytics id. Require exact singleton relations and organisation identity/locale/path/type/URLs. |
| Publishing software could be mistaken for legal authority. | `publishing_app=manuals-publisher` is a technical compatibility pin only. Official Home Office resource and responsibilities support the separate reviewed authority mapping. |
| Generic organisation links need not mean legal competence. | Acknowledged. This audit does not establish a generic mapping; it binds this owning publisher's UUID, both relations, this parent manual and explicit Home Office immigration remit. No arbitrary linked department can satisfy the expectation. |
| Schema documentation says primary publisher is empty outside Whitehall. | Found and recorded, not hidden. The official manual publisher's section/manual link-writing methods set both relations from the same owning organisation.content_id. That concrete source and current responses resolve this family's availability. Current source is not claimed to be exact deployed code. |
| content_id alone contradicts API's id-plus-locale uniqueness. | Full resource checks include both. Official Model states the id spans translations/iterations; R1 already has a stable representation locale. Keep publication external id as UUID and require en on the representation, avoiding support inflation. |
| Two equal observations prove stable identity forever. | Rejected. Three reads establish current sameness only; documented semantics determine which fields are stable, and any future structural drift fails closed. |
| Phase live proves current published law. | Rejected. It is service-design phase; withdrawal checked separately. Neither phase nor timestamps decide legal eligibility or freshness. |
| Hash equality proves origin, or hash change proves a new item. | Both rejected. Exact trusted transport plus metadata proves the reviewed identity; digest records the observation. Changed bytes still fail old accepted-Evidence/hash binding before extraction. |
| Raw SHA equals Jetnity fingerprint by definition. | False in general: Jetnity normalizes line endings. No BOM/CR in observed API bytes makes them equal here only. Both meanings are stated. |
| An id hidden in a linked object can select the root item. | Rejected by own-root exact fields; no recursive id lookup, first-match search or title/body inference. |
| Duplicate keys can override an expected id. | Whole-response grammar/decoded-key scan is required before JSON.parse identity access; rejects any duplicate, including equal values, escaped names and nested unrelated keys. Object-pair research inspection is not an implemented runtime detector. |
| A regex can find duplicates safely. | Rejected. Tokenization must distinguish string contents, escapes, objects and arrays; per-object Sets compare decoded names, with explicit caps and fail-closed syntax rules. |
| Existing TIEFE_MAX already protects fetched JSON. | Rejected after reading code: it protects request input. Future response parser needs its own depth/member/value caps, specified explicitly. |
| Parser resource bounds are vague. | Fixed input bytes 65,536; depth 16; total members 2,048; members/object 256; elements/array 1,024; total values 4,096; decoded key length 128; numeric token length 64. Counts precede allocation; every successful scan step advances. Implementation proof remains the next slice. |
| Overly broad schema acceptance could admit another manual. | First profile pins this exact item/manual/locale/publisher and currently observed root/link envelope. Generic manual_section reuse is excluded. |
| Strict envelope makes legitimate updates unavailable. | Yes, structural additions can require review. This is a deliberate fail-closed availability tradeoff. Valid mutable field values still pass; future broadening is separately reviewed. |
| Missing status/redirect fields make the proposal impossible under R1. | It uses existing R2 preconditions. The singleton exact request/final URL set blocks redirects through allowed-target/loop checks; the profile never pretends to receive redirectCount or HTTP status. Existing 2xx policy is distinguished from observed 200. |
| HTML/API could inflate two-source composition. | Same content-id/lang and rendering relationship establish one item. HTML stays excluded initially; later HTML profile is separate representation verification, not a second support. |
| A PROVEN classification claims implementation or F8 readiness. | Explicitly scoped to ability to specify a bounded identity verifier under current contracts, exactly as the task permits. No executable profile/test/registration, legal fact or F8 conclusion is supplied. |

The audit's section 8 gives the full case-by-case matrix, including all 20 task cases and additional escape/bounds/withdrawal/descriptor attacks. Its expected outcomes are analytical contract traces. No runtime fixture result is manufactured and no synthetic test code was added to “prove” an implementation the task forbids.

## Scope and delivery checks

- Baseline and seed matched the task; mode NORMAL; #751 identifies this Codex writer, #748 newer material has no new external report, and open PR/local-writer reads show no overlap.
- The full immutable task was read before research. Exactly four assigned documents are authored; with the unchanged seed there must be exactly five changed paths on the final PR head.
- Seed blob `b794990f4afdbfceb4672b13a78c1cc6143c0d3f`; SHA-256 `f85fb502425651d78f99bb71296d598250fab5dc855e57b1ebb0eaaa8ca87703`.
- The final head is checked with `git diff --check`, the operating-mode guard, the exact path allowlist, seed-byte equality and fresh branch/main/mode/writer readback. Actual published-head results are reported in the completion delivery.
- Direct government calls were GETs only, with bounded timeouts/redirect count, identity encoding and no-cache headers. No credentials, personal data, government writes or Jetnity DB calls were used. Scratch response files are outside the repository.
- No runtime/test/config/migration change; no source/profile/extractor/policy/pin addition; no registration; no real ids allocated. No Development/Production/Supabase action, legal eligibility decision, CH import, #626, F8, launch/indexing or recurring cost.
- Runtime tests/typecheck/lint/build are not executed for this docs-only task. No earlier CI result is claimed as this head's result. Independent TL must review the actual final head and applicable live checks.

## Residuals and STOP

No unresolved identity-evidence blocker remains for the narrowly specified profile. Implementation correctness remains unproven until the separately authorized parser/profile fixture slice runs. Future upstream drift can close eligibility. The official documentation discrepancy remains upstream, explicitly reconciled only for this family. Broader GOV.UK profiles, translated representations, HTML machine identity, legal extraction, legal completeness and persistence are outside this verdict.

Recommended next slice only: the narrow code-owned verifier and bounded duplicate-aware parser plus synthetic/captured-fixture tests, keeping production registry empty. The current writer starts none of it. Remain Draft. STOP for independent Technical-Lead exact-head review.
