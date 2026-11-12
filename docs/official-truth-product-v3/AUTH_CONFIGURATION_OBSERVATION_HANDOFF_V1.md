# Auth Configuration Observation 1 — current R1 handoff

## Current status

**R1 SOURCE_PREPARED / FINAL-HEAD GATES NOT_RUN / HOSTED_UNCHANGED.**
Date: 12 November 2026. Same original author:
**Jetnity CH-DE Auth Configuration Observation 1 — Codex Generation1**,
session `/root/auth_configuration_observation_writer_g1`.

Explicit Root amendment:
https://github.com/Jetnity/jetnity/pull/1194#issuecomment-6822593796

Sole parent: `2b866c77b09fa2f2efd91d9b9a21bbc904754d20`.
Parent tree: `4557407761dd979bc69fe6ec4c959290eaf206a9`.
Integration baseline remains `dfd692440762b50183fdebbfd6bf8dabde4662d0`,
tree `cbc79e627161d4ace132b84cf057c18adc86586c`.
The immutable containing commit/tree and manifest self-identity are delivered
externally, without a circular self-hash. This author is stopped for Root review.

## Actual observation, separately attributed to Root

Root independently read original Auth job
[131154770471](https://github.com/Jetnity/jetnity/actions/runs/43209969369/job/131154770471),
run 43209969369 / #4125 / attempt 1, on the exact diagnostic parent.
Full decoded log: 21,295 UTF-8 bytes / SHA256
`7b0d115ecdbc3d92d98c30b6d7be3d3d239672d337e9c4ede52501646dca0f4d`.

At 11:33:17.1912005Z the actual one-field record was:

```json
{"schema":"jetnity.auth.single-switch-observation.v1","field":"external_email_magic_link_disabled","present":true,"type":"boolean","value":false}
```

The same job reported 55 existing expected values matching, 244 keys,
no unexpected enabled provider/hook and a matching password policy. This one
field remained unknown and the job correctly exited 1. That expected failure
is historical observation evidence, not a release PASS.

This author read Root's persisted receipt, not the credentialed job itself;
no hosted Auth request or CI execution was performed by this author. The observation concerns the
existing CI-selected branch only. It is not a Production read, a universal
default, a null contract or proof of a Management-to-engine inversion.

## Selected policy and exact change

Root selected the literal boolean `false` as a mandatory repository expectation
for `external_email_magic_link_disabled`, preserving the observed branch state
and existing Admin email Magic-Link path. This is an explicit preservation
policy, not an automatic approval of whatever the API happens to return.
No TOML mapping or hosted enable/disable operation is selected.

| Path | Current source identity |
| --- | --- |
| lib/supabase/auth-erwartung.ts | Blob 25ef939f111ba0db5475cdf1e4d1c55364193512; 19,854 bytes; SHA256 46ead850c64d6cd0c152f7750c0cdf0f0934eea734e75274f2b19d30d89aa58e |
| lib/supabase/auth-bericht.test.ts | Blob 1406705421fe3b2c3d312bbc067556d695eb76a7; 8,497 bytes; SHA256 e9413d4246959a3f0b012f91522571b7ba26c21a0ea5a669a2a4ef7909eaa25d |
| scripts/auth/pruefen.ts | Exact restored blob c8fd418105c211a8827361300c92e13c8535bb8b; 1,578 bytes; SHA256 10894ba9ecb529c67ee897aa171f60dee028b26f48fe8088e81813d0b33175c9 |

The expectation edit is one 397-byte insertion into OHNE_TOML_SCHLUESSEL;
removing it restores the complete original expectation file.
All existing entries, patterns, functions, optionality and comparison rules
remain exact. NICHT_GEPRUEFT and generic matchers are unchanged.

The report-test edit appends one group, preserving the complete original
file as an exact prefix. Eight focused behavior cases are authored:
explicit false accepted/classified; true, null, string "false", zero and an
object rejected for this exact key; missing field rejected; a different
unknown disabled-key still rejected without its raw secret fixture value.
These use the existing actual CONFIG and report helpers.
**They have not been executed by this author.**

The diagnostic script is exactly restored to its pre-diagnostic/main blob.
No diagnostic remains, and its original target/request, stdout/report,
error and exit behavior is retained. There is no added network request.

## Scope and verification still required

Compared with main dfd6924, the final scope is only two modified existing
files and the three PR-added documents. Compared with the immediate parent,
six existing leaves change: those two files, exact script restoration and
the three documents. There are no other additions/removals or dependency
integrations. The complete original Task is preserved and full R1 appended
verbatim. The full prior Handoff is retained below as dated history.

Pure in-memory metadata comparisons and immutable Git readbacks are source
checks only. All new-head typecheck, lint, focused/full tests, hygiene, build,
Auth, companions, Preview and independent TL review remain NOT_RUN/PENDING.
No current-head success transfers from the diagnostic parent.

- **P1:** Actual final-head Auth and all required release gates are pending.
- **P2:** Management default/inversion/null semantics remain unclaimed; this
  repository policy follows the finite Root decision and actual typed receipt.
- **P3:** Dated V1 statements below describe the old diagnostic candidate and
  are superseded by this current section where explicitly updated.

No database/schema/RLS/migration, Auth setting, credential, browser, public
answer, pilot window, source revision or D1 change occurred. No new recurring
cost is introduced. No branch/ref/PR update, Ready or merge occurred.

**STOP. First unfinished step: independent Root review of the exact R1
candidate, Root-controlled ref update and complete fresh exact-head gates.**
No automatic follow-on is selected.

---

## Dated history — complete V1 handoff, before Root's observed CI result

The following original handoff is preserved verbatim. Its UNKNOWN/NOT_RUN
statements are historical V1 assertions, not the current observation status.

# Auth Configuration Observation 1 — Handoff V1

## Status and ownership

**SOURCE_PREPARED / NOT_RUN / NOT_CLASSIFIED.** Date: 12 November 2026.
Author: **Jetnity CH-DE Auth Configuration Observation 1 — Codex Generation1**.
New actual session: `/root/auth_configuration_observation_writer_g1`.
Task: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6822302560

Sole parent is `dfd692440762b50183fdebbfd6bf8dabde4662d0`; parent tree
`cbc79e627161d4ace132b84cf057c18adc86586c`. The containing immutable
commit/tree and manifest self-identity are supplied in the author delivery,
avoiding a circular self-hash. Author delivery is not Technical-Lead PASS.

## Why this bounded change exists

Root's original-log review of #1193 run `43206051112` / #4122, Auth job
`131141360881`, found all 55 expected values matching but one unclassified
key among 244: `external_email_magic_link_disabled`.
Root recorded 21,280 log bytes / SHA256
`e15a71b71a45543cf0db3c77832a63a33f67b120de2c17037efa3ff2ec7ed589`.
This author did not fetch that credentialed job or query Supabase. #1192/#4123
also has failed Auth metadata; its failure is not assumed identical.

Current own-property presence, type and value of this field remain **UNKNOWN**.
No Management-to-engine mapping, inverse/default/null meaning or future
acceptance is established by this source change.

## Exact implementation

Only `scripts/auth/pruefen.ts` changes: an 18-line, 951-byte insertion directly
after the existing `authKonfiguration(z)` result. Original script blob
`c8fd418105c211a8827361300c92e13c8535bb8b` is 1,578 bytes / SHA256
`10894ba9ecb529c67ee897aa171f60dee028b26f48fe8088e81813d0b33175c9`.
New script blob `9d035c3da0ecd0e4343d0d63cb909c9680e5942a` is 2,529 bytes /
SHA256 `07729518d4a9a50fb71b664e162fb6a762b2a77691199cb4c26ea0b3fa254bcc`.

The diagnostic is one JSON line on stderr with schema
`jetnity.auth.single-switch-observation.v1`, the literal field name,
own-property presence, finite type and boolean-only value:

| State of the exact own field | Type category | Value output |
| --- | --- | --- |
| Missing | missing | null |
| null | null | null |
| Boolean | boolean | Actual true or false |
| String, number, array or object | Respective finite category | null |
| Any other type | other | null |

These are design semantics read from source, **not executed test results**.
No nonboolean value is printed, hashed, interpolated or serialized.
No response, other member, secret, credential, header, target identifier or
Auth row is emitted by this insertion. The source API returns parsed JSON;
no application object or accessor seam is introduced.

The existing target validation and configuration request stay exact.
There is no extra request. The existing result, report, expectation tables,
unknown-key refusal, error handling and exit status stay exact. JSON mode
still writes only its original report to stdout; diagnostic output uses stderr.
The key remains unclassified and its existing failure is not suppressed.

## Source checks and boundaries

The complete current script, target, result and expectation contracts were
read. The single insertion is byte-for-byte removable to recover the entire
original script. Task V1 is preserved verbatim with its URL. The only three
additions are Task, this Handoff and Manifest; no other base leaf may change.
The final delivery includes complete recursive-tree comparison, not a partial
diff list.

No implementation-mirroring test was added, as specified by Task V1.
No project/parser/compiler/native/test/build execution or actual Auth
observation occurred. No hosted settings, credentials, source request,
branch/ref, PR, Ready or merge operation occurred. #917 and #1131 STOPs are
unrelated and untouched.

## Remaining gates and risks

- **P1:** Required Auth check still fails on the unknown key; no Ready or merge.
- **P1:** Actual typed readback has not run. Root must independently review the
  exact immutable candidate, publish only a Draft if accepted, and inspect
  the original actual Auth job output.
- **P2:** Even a future boolean readback would not prove the Management-to-engine
  mapping; classification is a separate versioned Root decision.
- **P3:** Consumers of stderr gain this finite diagnostic line; JSON stdout's
  existing contract is unchanged.

No public CH→DE answer, pilot extension, source revision, Dev installation,
signed Owner grant or D1 completion is claimed.

**STOP. First unfinished step: independent exact-candidate TL review.**
No automatic follow-on is selected for the author.
