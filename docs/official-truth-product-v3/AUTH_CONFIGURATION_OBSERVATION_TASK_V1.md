# Auth Configuration Observation 1 — Task V1

Persisted Technical-Lead task: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822302560

The complete task below is preserved verbatim.

## Technical Lead — Auth Configuration Observation 1 / TASK V1

**12 November 2026.** Bounded release-gate diagnosis for the authorized CH→DE path. Author **Jetnity CH-DE Auth Configuration Observation 1 — Codex Generation1**, new session recorded on dispatch. Baseline/sole parent `dfd692440762b50183fdebbfd6bf8dabde4662d0`, tree `cbc79e627161d4ace132b84cf057c18adc86586c`, NORMAL.

### Evidence and decision

PG1 #1193 run43206051112/#4122 Auth job131141360881 actually failed on one unclassified Management API key: `external_email_magic_link_disabled`. All55 existing expected values matched; all244 keys were examined; no unexpected provider/hook was enabled. Full original log21,280 UTF8 bytes / SHA256 e15a71b71a45543cf0db3c77832a63a33f67b120de2c17037efa3ff2ec7ed589. AA #1192/#4123 Auth metadata also failed; its log has not yet been assumed identical.

Root independently read existing `scripts/auth/pruefen.ts`, `lib/supabase/auth-erwartung.ts` and Dev's signed-in Email settings UI. UI exposes no separate value for this field. Neither current API value/type nor exact Management-name inversion is proved by the engine's separate MagicLinkEnabled/default-true setting. Existing Jetnity Admin uses email Magic Link; no disablement or policy loosening is selected.

Select the smallest safe next readback: add a finite diagnostic of **this one literal noncredential switch** from the object already returned by the existing authenticated configuration GET. Preserve the actual existing gate and its unknown-key failure. This is source preparation; actual execution may occur only when Root publishes a reviewed Draft to the existing GitHub CI.

### Exact four-path scope

Modify only `scripts/auth/pruefen.ts`.
Add:
- docs/official-truth-product-v3/AUTH_CONFIGURATION_OBSERVATION_TASK_V1.md
- docs/official-truth-product-v3/AUTH_CONFIGURATION_OBSERVATION_HANDOFF_V1.md
- docs/official-truth-product-v3/AUTH_CONFIGURATION_OBSERVATION_MANIFEST_V1.json

The script's sole behavior addition, immediately after the existing authKonfiguration result, is one stderr diagnostic with fixed schema `jetnity.auth.single-switch-observation.v1` and literal field name `external_email_magic_link_disabled`. Record only own-property presence, a finite type category (missing/null/boolean/string/number/object/array/other), and the value **only when it is actually boolean**, otherwise null. Never print, hash, interpolate or serialize a nonboolean value, the whole response, other unknown keys/values, credentials, headers, project target secrets or Auth rows. Missing must stay distinct from null and false; no default/coercion/inversion.

Use own-property checking, then inspect this exact own member. The existing object is parsed JSON; no extra network request or target/credential discovery. Do not change `ziel`, `authKonfiguration`, their URL/request configuration, the existing report, expectation tables, unknown-key logic, exit status, error handling or CI workflow. Keep JSON-mode stdout exactly its original single JSON report; use stderr for this diagnostic in all modes. No diagnostic failure may silently turn a failed check green.

The diagnostic is deliberately **not** classification or acceptance. Do not add the key to NICHT_GEPRUEFT, add a wildcard, make it optional, assert false as an observed value, or change a hosted Auth setting. The existing unknown-key FAILURE must continue until Root separately reviews the actual typed readback and selects a versioned correction.

### Delivery and execution boundary

Read the complete current script and its existing Auth result/target contracts. Preserve all original script text except the minimal insertion. No new package, export, test runner or project execution; this reversible low-impact diagnostic does not need an implementation-mirroring new unit test. Existing full CI remains required on any final integration.

Preserve this task verbatim with URL. Handoff must name the failure, exact diagnostic, unchanged failure policy and NOT_RUN status. Deliver immutable sole-parent commit/tree, four-path manifest with byte/SHA256/Git blob pins, minimal inverse-text proof and full unchanged-base-tree comparison. No branch/ref/PR publication by author. Root independently reviews, publishes only a Draft and reads the original actual Auth job output; no Ready/Merge is possible while its gate still fails.

**Source-only immutable Git objects. No parser/compiler/project/native/test/build execution, Auth/API/SQL call, browser operation, credential access, external source request or hosted configuration change. No Ready, merge or follow-on. #917/#1131 denied actions are unrelated and remain untouched. STOP after delivery.**
