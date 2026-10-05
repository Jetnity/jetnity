# Official Truth Content Registration Gateway 1 — Self-review

Date: 4 October 2026. Issue #822 / Draft PR #823. Same writer/session/Generation 1 as REPORT and HANDOFF. Actual model evidence: `gpt-6-astra`, `xhigh`.

**WRITER SELF-REVIEW ONLY — NEVER TECHNICAL-LEAD PASS.** Implementation is complete within scope; three existing local PostgreSQL tests are environment-blocked. The final publication head is in the chat delivery receipt and must receive independent review.

## Adversarial review

| Attack / failure | Implementation and evidence |
| --- | --- |
| Follow superseded two-key task or alter SQL | Amended `eb61bac8...` task read before edits. Payload is exactly operation/item/representations; canonical serialization test compares the entire object. Task, SQL and schema stay unchanged. |
| Bypass source/R1 authority with raw JSON | Input type derives from R1 descriptors. Exact helper-envelope checks reject extras/inherited tuple injection. Existing catalog parser and `createContentIdentityGraph` perform source/descriptor/URL/profile validation. No private parser copy or alternate source model. |
| Write before read or after invalid input/catalog | New helper always reads first; graph validation precedes the sole literal write call. Shared negative-test assertion compares the entire transport call list to exactly one `read_registry`. Read failure/exception has the same no-write trace. |
| Blindly append an exact replay | Existing tuple takes its own branch; compare canonical complete arrays and only then dispatch the normal RPC. Exact reordered pins/URLs/representation sets pass; no duplicate graph node is appended. |
| Hide changed pins, external identity, locale/schema/media/profile or URL | Full canonical descriptor equality includes these fields. Tests vary each field or trigger earlier canonical validation. Wrong/retired profile versions cannot bypass complete catalog reconstruction. |
| Replay a subset or silently add/merge representations | Both representation arrays must be equal, including all stream identities/versions/current values. Missing/additional streams and historical item-version drift reject before write. |
| Reuse historical external id or reserved URL | New-state union validates every catalog descriptor, including noncurrent ones. Dedicated current/historical identity and URL conflict tests reject before write. |
| Change input while transport awaits | After R1 validation, only copied/frozen descriptors are serialized and retained for response tuple checks. A transport that mutates the original caller input during write cannot change the payload or success identity. |
| Accept missing/extra/malformed success data | Existing strict `row` utility requires plain exact own enumerable data fields; all six keys and values checked. Tests remove each key, change values, add ordinary/symbol/hidden keys, getters and prototypes. Failures remain `catalog_failed`. |
| Leak database exceptions or configuration secrets | Read/write exceptions and failures are caught and sanitized. Missing config returns `catalog_not_configured`; malformed client config returns `catalog_failed`. Sentinel strings never appear in results. |
| Activate profiles or execute identity verifier | Default registry stays frozen empty and unchanged. Injected test profile permits deterministic validation only; a verifier that throws is never invoked. Default fresh registration and existing-content reads fail closed. |
| Import-time network or database call | Separate fresh Node process traps fetch, HTTP(S), socket and DNS calls before importing the module with synthetic service configuration; observed call count zero. Existing one-client/one-literal-RPC static guarantees remain. |
| Regress source registration/R1/R2 | Existing production source/read/parser/transport/snapshot bodies unchanged. Three source unit tests and all executable focused R1/R2/profile/source-authority regressions pass. SQL proof limits are explicitly separate. |

## Corrections made during development

The first test run exposed incorrect expected failure categories for canonical private-IP/blocked-domain rejection and a CommonJS/ESM import namespace assumption in the fresh-process test. Expectations now match the existing canonical `url_not_authorized` category; the import test uses the actual default-or-namespace export without relaxing its zero-network assertion. These were test corrections; source/URL policy was not duplicated or weakened.

The initial single-branch checkout lacked `origin/main`, preventing the operating-mode guard's diff. Fetching that existing verified reference fixed the environment. The initial sandbox build blocked tsx local IPC (`EPERM`); the identical build passed with local IPC permissions. No source/configuration bypass was introduced for either.

## Evidence and limits

- New suite: 94 tests; with unchanged source suite, 97/97 pass.
- Focused six-file suites: 509 pass / 2 fail / 0 skip; full suite: 5,123 pass / 3 fail / 0 skip. Every failure is the missing hard-coded PostgreSQL 16 `initdb` executable on this Mac, before a DB can start. Exact-head Linux CI must establish these remaining SQL/race proofs; no local PASS claim is made.
- Typecheck, lint, six operating/hygiene/security checks, diff whitespace and build pass. Lint retains 149 existing warnings; no changed-file warnings. Build setup reports absent `.env/.local`.
- Success traces prove the injected contract, not actual hosted writes. No hosted project or GOV.UK endpoint was contacted. No profile, source, content item, extractor, policy, region pin, Evidence or Rule fact was registered.
- Catalog read and registration are separate calls. SQL remains final race/uniqueness authority. Error after write dispatch can be ambiguous; the helper returns failure, performs no retry and does not assert rollback.
- A current identity profile's presence is not HTTP-origin or publication-semantic proof. The verifier is deliberately not run without server-owned response bytes. Future activation/registration reviews must retain this distinction.
- Independent review, exact-head CI and Preview remain external evidence. No Ready/Merge/F8 or next-slice authority is inferred from this document. Costs and dependencies unchanged.

**STOP for independent Technical-Lead exact-head review.**
