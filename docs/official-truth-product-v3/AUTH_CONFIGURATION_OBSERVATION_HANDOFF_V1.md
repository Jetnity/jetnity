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
