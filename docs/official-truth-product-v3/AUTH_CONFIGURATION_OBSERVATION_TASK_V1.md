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

---

## Task V1 amendment R1

Persisted Technical-Lead amendment: https://github.com/Jetnity/jetnity/pull/1194#issuecomment-6822593796

The complete R1 below is preserved verbatim.

## Technical Lead — Auth Observation actual result / R1 strict classification task

**12 November 2026, 11:42 UTC.** Same original author/session: **Jetnity CH-DE Auth Configuration Observation 1 — Codex Generation1**, `/root/auth_configuration_observation_writer_g1`. This is an explicit bounded successor to TASK V1, not an author-selected follow-on.

### Actual independent readback

Root read original Auth job [131154770471](https://github.com/Jetnity/jetnity/actions/runs/43209969369/job/131154770471), run **43209969369 / #4125 / attempt 1**, exact Draft #1194 head `2b866c77b09fa2f2efd91d9b9a21bbc904754d20`. Full decoded log: **21,295 UTF-8 bytes**, SHA256 `7b0d115ecdbc3d92d98c30b6d7be3d3d239672d337e9c4ede52501646dca0f4d`.

At **11:33:17.1912005Z** the actual finite record was:
```json
{"schema":"jetnity.auth.single-switch-observation.v1","field":"external_email_magic_link_disabled","present":true,"type":"boolean","value":false}
```

The same actual job reported all **55** existing expected values matching, **244** keys, no unexpected enabled provider/hook, the password policy matching, and exactly this one unknown key. It correctly exited **1**. This is typed observation of the existing CI-selected branch only, not a Production read, full API-schema proof or hosted setting change.

Root's earlier independent source review established existing Admin Magic-Link usage in `app/(public)/admin/login/actions.ts` and its page. Upstream engine MagicLinkEnabled/default-true is separate from the exact Management API field. **Do not claim a proved inversion, universal default or null semantics.**

### Root decision

Select **one explicit repository expectation: external_email_magic_link_disabled must be the actual boolean false**. This is a reviewed preservation policy for the observed branch and existing email Magic-Link product path, not an inferred CLI transform or a rule that observed values are automatically approved. No authentication method is enabled/disabled here; no hosted settings change. Missing, null, true, string "false", zero and other nonbooleans must fail the unchanged strict comparator. Other unknown keys still fail.

### Bounded source amendment R1

Sole parent must be the current exact published diagnostic head `2b866c77b09fa2f2efd91d9b9a21bbc904754d20`; retain history. No integration of PG1, HMA1 or AA.

1. In `lib/supabase/auth-erwartung.ts` add exactly one entry to **OHNE_TOML_SCHLUESSEL**, with literal boolean false, explicit source and an honest reason: preserve the existing Admin email Magic-Link path and the independently observed boolean false; no TOML mapping is selected. Do not claim unverified Management default/inversion. Preserve every existing entry, matcher, function and classification rule. No NICHT_GEPRUEFT entry, wildcard, optional expectation, coercion or fallback.
2. In `lib/supabase/auth-bericht.test.ts` add focused behavior coverage using the existing real CONFIG and helpers: explicit boolean false is accepted and classified; true, null, "false", 0, an object and a missing field fail with this exact key; another unknown key still fails. Keep existing tests/assertions intact. These tests address the actual admission boundary, not merely an implementation-shaped snapshot. No network or new test runner.
3. Restore `scripts/auth/pruefen.ts` exactly to pre-diagnostic blob **c8fd418105c211a8827361300c92e13c8535bb8b** (1,578 bytes, SHA256 `10894ba9ecb529c67ee897aa171f60dee028b26f48fe8088e81813d0b33175c9`). The bounded one-time observation is now independently persisted; no further diagnostic is needed. Do not change request/target/auth/report/exit behavior.
4. Update only the three existing AUTH_CONFIGURATION_OBSERVATION Task/Handoff/Manifest documents. Preserve original Task verbatim and append this full R1 with its URL. Preserve original Handoff as dated history, record actual observation separately from author execution, exact current policy and all still-pending final-head gates. Manifest must bind all changes, original diagnostic history, parent, byte/SHA256/blob identities and exact restoration.
5. Overall final scope against main dfd692440762b50183fdebbfd6bf8dabde4662d0 is **two modified existing files** (expectation and report test) plus the **three existing PR-added documents**. The restored script must equal main exactly. First-parent scope also includes that exact restoration. No other tree leaf changes.
6. Deliver immutable commit/tree, complete nontruncated tree comparison and full pins. Author performs **source-only immutable Git object preparation**: no project/parser/compiler/test/native/build/CI/Auth/API/SQL execution, no secrets, browser, hosted change, branch publication, Ready or merge. Stop after delivery; Root independently reviews, publishes and requires complete fresh gates. The old diagnostic run's expected failure is historical evidence, never a release pass.

Original #917/#1131 denied actions remain untouched. This does not change AAL2/Owner authority or authorize any production/public-answer action. Root alone accepts the final head.
