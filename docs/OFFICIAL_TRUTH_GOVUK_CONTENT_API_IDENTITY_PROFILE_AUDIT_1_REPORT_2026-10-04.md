# GOV.UK Content API identity profile audit 1 — Report

Date: 4 October 2026. Issue #816 / Draft PR #817 / Generation 1.
Logical writer: **Jetnity GOV.UK Content API identity profile audit 1**.
Branch: `docs/govuk-content-api-identity-profile-audit-1`.
Baseline main: `601379f2f2138a49fbf85fa8b44856fb71079d45`.
Immutable dispatch: `9b44292be537408a61e05a994651a497fc98b8fa`.
Execution: **GPT-6 Astra — Sehr hoch**, `gpt-6-astra` / `xhigh`, Codex Desktop.
Session: `01a106e5-1f2a-7c11-beb4-022000dbf140`. One writer; no subagents or replacement session.

Classification: **GOVUK_CONTENT_API_IDENTITY_PROFILE_PROVEN**.
Status: **AUTHOR DELIVERY / DOCS AND RESEARCH ONLY / REMAIN DRAFT / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**.

The exact final published head is reported in the completion delivery and PR #817 metadata. A document cannot embed the SHA of its own containing Git commit. Resolve that delivered checkout with `git rev-parse HEAD` and verify the same SHA against the live PR; the baseline and dispatch above are not the final review head. Publication is followed by scope, seed, mode and remote-head readback, with no subsequent repository edit unless a new head is explicitly delivered.

## Result

The [audit](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_2026-10-04.md) specifies a deterministic bounded profile for the exact English National List Content API representation. It contains the complete official URL/retrieval ledger, stable-versus-mutable field matrix, descriptor mapping, parsing algorithm, transport limits, and adversarial contract traces. This task produces no runtime verifier and no executable test; its PROVEN verdict is feasibility under R1/R2, not a tested implementation or registration permission.

The scope plan was four assigned documentation files: collect read-only official evidence, resolve metadata semantics against the merged R1/R2 code, specify the smallest fail-closed verifier, and document review/continuity. No API/database/trip-graph surface changes; no recurring service cost or traveller-data input. Main risks are sibling confusion, publisher-display-name substitution, duplicate JSON keys, generic-schema overreach and conflating byte freshness with item identity.

The decisions are:

| Question | Decision |
| --- | --- |
| External item identity | Namespace meaning `govuk-content-id`, value `2b25b3d4-4eaa-4859-a34e-c7869c114c15`; publication id spans translations/revisions in official documentation. `locale=en` is mandatory on the representation, so the actual resource check still includes id + locale. |
| Publisher machine id | `expectedPublisherIds=["06056197-bc69-4147-aa28-070bca132178"]`, checked in the exact singleton primary-publishing-organisation relation. |
| Authority machine id | The same exact singleton for `expectedAuthorityIds`, checked independently in organisations, with reviewed Home Office responsibility evidence. This is a narrow explicit authority mapping, not a generic inference from any organisation relation. |
| Technical publishing app | `manuals-publisher` is a compatibility pin only, never the legal publisher. |
| Documentation inconsistency | The schema's non-Whitehall-empty qualifier is contradicted by live bytes and resolved by official manuals-publisher code at `151ae8dbc04b83129e15305492e7c14224c367ff`, which assigns both relations from the manual's owning organisation. |
| Profile breadth | Restrict the first profile to the reviewed National List item, English JSON, Immigration Rules parent, Home Office link shape, exact request/final URL, schema/type and technical app pins. No generic manual_section admission. |
| Duplicate JSON keys | Mandatory whole-response grammar/decoded-key scan before identity access; bounded depth/member/value/key limits and fail-closed rejection at any object depth. Standard JSON.parse alone is insufficient. |
| HTML/API | Same future ContentItemRef; distinct representation handling. Exclude HTML from first registration. Never count HTML plus API as two supports. |
| Mutable content | Valid changed timestamps/title/description/body can preserve identity. Full response hash is an observation pin, not an eternal identity pin; downstream old-Evidence/hash binding still blocks reuse of changed bytes. |

## Evidence actually collected

22 successful direct read-only GETs covering 20 unique official URLs. The audit ledger lists every requested/final URL and all hashes/times, including exploratory official-source reads. No search snippet or third-party article supplies identity evidence.

National List API returned 7,788 bytes at three independent reads, all HTTP 200, zero redirects, final URL equal to requested URL, media type `application/json; charset=utf-8`, Content-Length 7,788, and fatal UTF-8 success:

- `2026-10-04T12:34:38.180Z` → `12:34:38.270Z`;
- `2026-10-04T12:34:38.351Z` → `12:34:38.395Z`;
- `2026-10-04T12:41:12.807Z` → `12:41:12.970Z`.

Each complete-response SHA-256 is `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854`.

Appendix API: `2026-10-04T12:34:38.271Z` → `12:34:38.350Z`; HTTP 200 / zero redirects / same requested-final URL / JSON UTF-8 / Content-Length and actual bytes 22,965; SHA-256 `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037`. Root id `2620750b-5453-44f1-98af-414037c833be` and base_path differ despite identical broad publisher/family pins.

National List HTML: `2026-10-04T12:34:38.395Z` → `12:34:38.572Z`; HTTP 200 / zero redirects / exact human final URL / HTML UTF-8 / Content-Length and actual bytes 62,422; SHA-256 `1a03525fbf63794a0d8e950002e09a4e15f7deeda95dce2b9058d09784fd60e0`. Its content-id metadata and language agree with the API and the API body fragment occurs verbatim in it. This establishes the representation relationship for research, not HTML profile readiness.

Object-pair inspection found no duplicate keys in the captured API responses. All three National List bodies are byte-equal; the proposed runtime detector is still mandatory. R2's response byte cap and fatal UTF-8 are existing defenses; proposed JSON depth/count limits are explicitly new future profile requirements. Adversarial rows are analytical traces, not fabricated runtime test passes.

## Startup and live coordination

Fetched origin/main and verified the exact baseline and machine mode NORMAL before research. Read Issue #751, all #748 entries after marker `5978621253`, Issue #816, PR #817, and the complete 350-line immutable task. Remote branch initially matched the dispatch exactly. Open PRs were #817 and the five historical drafts #28/#39/#40/#50/#52; prior local Jetnity writers were idle/not loaded. An isolated clone avoided edits to another chat's checkout.

The only newer #748 entry was Technical Lead receipt `5978881653`, processing the previous R2/Development S1 report. No newer external MATERIAL or overlapping writer appeared in the pre-publication reread. Lower historical #801 text in #751 is superseded by its live top section and the actual open-PR list; it is not another current writer. The Cursor-specific Opus directive does not override #816's explicit Codex/Astra assignment. The current session's own turn_context reports `model=gpt-6-astra`, `effort=xhigh`, matching collaboration settings.

Re-read the merged R1/R2 reports and actual identity/retrieval/source-registry code, prior source-identity reconciliation and ETA audit, startup/governance documents and relevant project standards. The current runtime wins over older source-v1/global-document snapshots. No global continuity or shared-contract document is edited in this five-file slice.

## Files and immutable seed

Exactly five paths differ from the required baseline; only four are writer-authored:

1. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_TASK_2026-10-04.md` — immutable Technical Lead seed.
2. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_2026-10-04.md` — evidence and exact profile specification.
3. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_REPORT_2026-10-04.md` — this delivery report.
4. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_HANDOFF_2026-10-04.md` — review handoff.
5. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_SELF_REVIEW_2026-10-04.md` — adversarial self-review.

Seed Git blob: `b794990f4afdbfceb4672b13a78c1cc6143c0d3f`.
Seed SHA-256: `f85fb502425651d78f99bb71296d598250fab5dc855e57b1ebb0eaaa8ca87703`.
Research response/header/metadata captures remain outside the repository, under the chat's work directory. They are not additional PR paths, production fixtures or retention-schema changes.

## Validation and exclusions

Required delivery checks: exact five-path comparison to baseline; exact four authored additions after dispatch; byte-identical seed; no code/test/migration/config/global-continuity diff; `git diff --check`; operating-mode guard; exact remote head/base/draft readback; fresh main/mode/#751/#748/writer recheck; and secret-value inspection. The final completion delivery records their actual result on the published head. A successful baseline CI or earlier-slice test count is not relabeled as this head's validation.

No local runtime tests, typecheck, lint, dependency installation or Production build is run for this docs-only task. The specifically required operating-mode guard is run. Remote workflow status, if available, is reported separately on the exact head; there is no claim of a new runtime regression suite. No database query or mutation is performed. Development applied/empty and Production absent remain Technical-Lead-supplied state, not independently re-audited database facts in this task.

Security: deterministic identity, ambiguous JSON and transport boundaries are specified only. No new runtime attack surface, secret, personal/traveller data or paid provider call. No new recurring infrastructure cost.

No sourceId/contentItemId/representationId/profile id allocation in code or database; no source/content/representation/profile registration; no Development/Production mutation; no Supabase apply/migration; no extractor; no composition policy; no region pin; no Rule fact; no F8; no CH import; no #626; no launch/indexing. No Ready, merge or automatic follow-up.

## Next responsible actor

Independent Technical Lead: review the exact final head, especially the publisher-documentation discrepancy resolution, the UUID/locale split, duplicate parser specification, strict envelope availability costs, and raw-byte versus normalized-text hash distinction. If accepted, the smallest next slice is the narrow code-owned profile plus duplicate-aware parser and synthetic/captured-fixture tests only, with production registry still empty. That slice and later registration are not started here.

STOP for independent Technical-Lead exact-head review.
