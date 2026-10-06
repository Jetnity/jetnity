# Official Truth JP fallback audit 1 self review

Date: 6 October 2026. Issue #868 / Draft PR #870.

**JP_FALLBACK_SOURCE_NOT_READY**

## Scope and reconstruction

- Read live main, mode, #751, #741 including priority comment, #868/#870, closed #848/#852 and merged #849/#853 review/closure evidence before substantive qualification.
- Read current retrieval, content identity/profile/catalog, source router/registry, trusted extractor/composition and applicability/store contracts and relevant tests. Historical audit conclusions were checked against merged schema 2.
- Kept exactly the TASK-authorized four delivery files plus the unchanged seeded TASK in the PR. No runtime/test/config/SQL file or global continuity document changed.
- Kept current main and immutable TASK values explicit; final head and final remote state are supplied after push, without circular self-hash claims.

## Adversarial checks

| Failure mode challenged | Result |
| --- | --- |
| A browser 200 is presented as successful credentialless server retrieval | Rejected. 32 actual direct receipts are 403; browser controls are separate and state-limited. |
| A 403 body is small, UTF-8 and on an official host, so its hash is approved | Rejected. Ledger hashes identify denials only; no content profile pin or Evidence is created. |
| An old ordinary-passport paragraph fills a current eligibility gap | Rejected. L01's contradictory legacy details and D01's 2006 date prevent current qualification. |
| All Swiss ordinary-passport trips become exempt | Rejected. Trip purpose, activity, duration, document validity and citizenship linkage are not supplied by the three audit scope fields. |
| Swiss passport wording is deemed unusable solely because it lacks a literal class token | Avoided. It is a plausible national-passport reading needing reviewed normalization; the audit does not impose a universal literal-word rule. Compatible retrieval is independently absent. |
| Six months becomes 180 days, or extension application becomes permission | Rejected. Units, initial grant, deadline and border discretion stay distinct. Broader unresolved extension semantics are not invented as an extra condition on a narrower initial visit. |
| The old ISA path can automatically move or localize | Rejected. Browser 200-to-200 navigation and query variant are separately identified; no HTTP redirect success or German representation is claimed. |
| Current schema 2 is ignored because #849 predates it | Corrected. Dormant activity/stay/national-passport expressibility is acknowledged; missing counting/context and persistence barriers remain. |
| Existing identity schema equals an existing JP verifier | Rejected. Only the GOV.UK profile is in the inspected code-owned registry. Full-content fallback is conditional architecture requiring new reviewed JP profile work. |
| Visa-application pages impose a new exempt-entry blank-page/residence condition | Rejected. Application jurisdiction and documentation stay in their source scope. |
| Missing country/transit/form content becomes a negative rule | Rejected. Unknown remains unknown; no complement branch is created. |
| A current HTTP date or a new Last-Modified is a legal effective date | Rejected. Publication, technical modification, retrieval and legal currentness remain separate. |
| A local denial proves a worldwide or permanent government block | Rejected. Intended deployed egress, root cause and global availability remain untested/unknown. |
| Unmerged parallel designs become assumed implemented contracts | Rejected. Only current main is used; fresh Changed Files show disjoint paths. |

## Mechanical validation

Completed validation: **PASS** for the exact allowed path set, unchanged TASK hash, all 21 tested URLs, all 32 receipts and recomputed body digests/lengths, copied baseline IP-guard equality, local Markdown link targets, UTF-8 and whitespace. `node scripts/operating-mode-guard.mjs` passed in NORMAL mode. The staged diff is checked before commit and the final delivery readback verifies the pushed file set. Full runtime tests/build are not claimed for this docs-only change.

Raw official bodies and scratch probes are not committed. No database client, provider, app acceptance entry point, browser credential transfer, challenge solution, private origin, relaxed TLS or larger retrieval bound was used. CI/Preview observation after push is read-only and does not mark Ready or merge.

## Findings and self-review verdict

| Severity | Count | Finding |
| --- | ---: | --- |
| P0 | 0 | No P0 found within this delivery scope; not a general platform audit |
| P1 | 2 | JP-F01: compatible fallback retrieval absent. JP-F02: current complete ordinary-passport semantic family unqualified |
| P2 | 2 | JP-F03: JP profile/path continuity unqualified. JP-F04: currentness and source-scope/period reconciliation open |
| P3 | 0 | No additional distinct finding |

Self-review conclusion: the NOT_READY result is supported by the observed failures and explicit gaps. No claim of independent review PASS or accepted Official Truth is made. The narrow audit can be delivered while pilot readiness remains blocked.

Session/model evidence: Codex Desktop `01a10e90-2e64-7be3-b409-5058846bc6ef`, local metadata `gpt-6-astra` / `xhigh`, CLI `0.160.0`, provider `openai`.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
