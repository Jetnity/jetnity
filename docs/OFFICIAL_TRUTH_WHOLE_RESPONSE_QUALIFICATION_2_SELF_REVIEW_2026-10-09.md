# Whole-Response Qualification 2 — Author self-review

This is author evidence, not independent Technical-Lead PASS. Review covers only Issue #912 / Draft #914 and the owned diff.

## Findings corrected

1. **Research constructed before source qualification.** With a valid selection, the previous evaluator could return a canonical pending research-gap candidate even when live privacy or retrieval failed. It contained no accepted fact, but violated the stronger B09 upstream boundary. Research construction now follows whole qualification and exact locator success. A regression with live privacy failure and transport timeout failed before repair and passes afterwards.
2. **Report allowed inconsistent candidate state.** A structurally valid report could carry research while upstream remained BLOCKED. Serialization now independently requires synthetic mode, successful synthetic qualification, observation, source status and research stage. A separate RED/GREEN test proves refusal.
3. **New direct scanner importer violated frozen ownership.** Initial full regression caught the new helper importing the canonical GOV.UK profile directly. Fixed by calling the existing permitted adapter, which runs the same full duplicate-aware scanner before identity/JSON interpretation. No shared profile, guard, allowlist or adapter was changed. The existing 333-test profile suite plus 286 owned tests then passed together (619 total).

## Adversarial and boundary review

- Full synthetic structure enumerates every accepted object and field family. Each independent unknown-key and wrong-type mutation refuses. Required-root omissions, unused metadata, attachments, nested logo/image/status/history fields, changed identity/sibling/publisher and URL mutations fail closed.
- Canonical scanner precedes JSON parsing. Duplicate decoded keys, prototype names, malformed/surrogate/truncated/prefix/trailing input and 65,537-byte input are rejected. 65,536 complete bytes remain allowed. Existing fatal UTF-8/network/timeout/redirect tests remain unchanged.
- The finite fragment parser consumes the whole string; structure checks retain no locator. Exact offsets are created only in the qualified synthetic observation path. No HTML is executed or rendered. Field-type checks do not certify display text as privacy-safe.
- Calendar checks reject rollover, absent zone, leap-second and unknown-offset claims. Publication/update/retrieval ordering and nested time conflicts refuse. Linked edition times need not equal root edition time. None becomes legal validity.
- Opaque string, empty string and null metadata are distinct structural cases, but none admits live research. Invalid types also refuse. No stripping, zeroing, opaque hashing/publication or response replacement occurs.
- The only positive complete qualification is still the exact old explicitly synthetic fixture; full structural coverage fixtures cannot qualify. Replay/caller-supplied DTOs cannot become live admission or same-request custody. This local structural checker is not an authenticity capability.
- Report schema is strict and versioned. Live output cannot contain observation/research, source body, raw hash or free-form error/diagnostic. Only finite reasons and fixed descriptors escape. Zod errors and untrusted keys are not serialized.
- No accepted Evidence/Rule, production profile/registry/provider activation, F8, custody origin, API/UI/Traveller change, package change, SQL/migration or hosted access. #911's independent hygiene scope is untouched. Original source evidence and TASK remain immutable.

## Limits deliberately retained

The proposal proves closed syntax/types and source consistency for the observed family. It does **not** establish non-personal semantics, lawful retention/republication, regulatory completeness or government legal validity. Request-tracing documentation leaves correlation/provenance uncertainty; free-text/analytics/linked fields also lack a complete approved admission contract. Even a future null publishing identifier is insufficient. Current live status remains `BLOCKED / opaque_publishing_metadata`; privacy/Official-source admission needs separate review, not an implementation shortcut.

Future legal dependencies are specified in CONTRACTS without dispatching a new task. Physical-device/provider/authenticated-user journeys are outside this source-only change; none is claimed. Local logs remain private work material; published manifests contain finite summaries only. The final validation results, including unsuccessful attempts, are in REPORT and `validation.json`.

No uncorrected author finding justifies widening this scope. Independent TL review may still identify issues and is the next required step. Draft remains Draft; no Ready, merge or follow-up.
