# GOV.UK Content API identity profile audit 1 — Handoff

Date: 4 October 2026. Issue #816 / Draft PR #817 / Generation 1.
Writer: **Jetnity GOV.UK Content API identity profile audit 1**.
Branch: `docs/govuk-content-api-identity-profile-audit-1`.
Baseline: `601379f2f2138a49fbf85fa8b44856fb71079d45`.
Dispatch: `9b44292be537408a61e05a994651a497fc98b8fa`.
Codex session: `01a106e5-1f2a-7c11-beb4-022000dbf140`.
Exact model: `gpt-6-astra`, reasoning `xhigh` — **GPT-6 Astra / Sehr hoch**.

Classification: **GOVUK_CONTENT_API_IDENTITY_PROFILE_PROVEN**.
Author verdict only. **REMAIN DRAFT / STOP FOR INDEPENDENT EXACT-HEAD REVIEW**.

The published exact final commit is supplied in the final completion delivery and PR #817 metadata; fetch and match that value before review. This tracked file cannot embed its own containing commit's hash. Do not substitute baseline/dispatch for the final head. No independent Technical-Lead verdict on this delivery is claimed by this handoff.

## Read and reconstruct

1. Fresh-read main/machine mode, #751, #748 comments after `5978621253`, open writers and PR #817. At the author's reread, main matched baseline, mode was NORMAL, this was the only current writer, and the only later #748 entry was prior-slice TL receipt `5978881653`.
2. Read the unchanged [task](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_TASK_2026-10-04.md), the full [audit](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_2026-10-04.md), [report](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_REPORT_2026-10-04.md), and [self-review](OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_PROFILE_AUDIT_1_SELF_REVIEW_2026-10-04.md).
3. Independently compare the exact head to baseline: exactly these five documentation files, with seed blob `b794990f4afdbfceb4672b13a78c1cc6143c0d3f` and SHA-256 `f85fb502425651d78f99bb71296d598250fab5dc855e57b1ebb0eaaa8ca87703` unchanged.
4. Verify exact-head whitespace/mode/scope/readback results and any CI that exists on that head. No local runtime/build/DB pass is asserted; this task is research/docs only.

## Decisions requiring independent review

- Root National List id `2b25b3d4-4eaa-4859-a34e-c7869c114c15`, path, English locale and exact transport binding all participate. The real Appendix id `2620750b-5453-44f1-98af-414037c833be` is a sibling rejection case.
- Both expected publisher/authority arrays are the exact singleton Home Office UUID `06056197-bc69-4147-aa28-070bca132178`. The two root relations are separately required and exactly matched. The authority role is explicitly justified for this family by official responsibilities, not inferred from any department link or the technical `publishing_app` name.
- The official schema's non-Whitehall availability sentence is inconsistent with current live responses. Official manuals-publisher source at `151ae8dbc04b83129e15305492e7c14224c367ff` explicitly emits both organisation relations. The audit records, resolves and limits that discrepancy.
- External item id is language-independent content_id. Exact locale remains mandatory representation metadata; a full resource verification therefore still checks content_id + locale. Do not create support duplicates for translations or HTML/API renderings.
- First scope is this exact English Home Office Immigration Rules National List JSON item; no generic manual_section profile and no sibling admission. HTML is excluded from first registration and would need its own reviewed profile for the same ContentItemRef.
- Mandatory bounded whole-string duplicate-key detection precedes identity reads. Reject decoded escaped-key collisions at any depth, malformed input and all bounds. Existing retrieval does not already provide a JSON response depth guard. The algorithm is specified, not implemented/tested.
- Dates, title, description, body and full response hash can change without a new item. Identity success never waives downstream new-observation/hash/freshness/accepted-Evidence binding.
- Exact singleton request/final URL set makes every attempted redirect fail via target or loop checks. The profile does not receive HTTP status or redirectCount and does not invent those inputs. Existing 2xx status policy remains; observed responses were 200.

The three National List fetches were 7,788 bytes and byte-identical, SHA-256 `59a7fd6e7416f989ace351bc5ab4f562c52b3c5cab64fcbe861ea4a57ced1854`. Appendix was 22,965 bytes, SHA-256 `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037`. Full UTC intervals, header values and all 20 unique official URLs / 22 GETs are in the audit's retrieval ledger. These public research reads are not server-owned Jetnity attestations.

## What is finished and what is not

Finished: official identity research, complete field matrix, exact future mapping/algorithm, real sibling comparison, analytical adversarial cases, four delivery docs. No runtime implementation is claimed. The immutable seed is preserved. No global current-state document is edited.

Not checked in this task: live Development/Production database/catalog contents, deployed runtime behavior, legal eligibility, legal-source completeness, implementation parser behavior, future fixture tests, or Production deployment health. Supplied/TL state says Development S1 is applied/data-empty and Production Official Truth is unapplied; this writer did not contact either database. Existing empty registries are unchanged by the docs diff. There is no independent reviewer substitute or agent-generated FINAL PASS.

Open risk: the narrow profile deliberately rejects future structural/publisher/locale/schema drift. Its availability is not guaranteed. A fresh response may require review before a future implementation/registration task. The parser's feasibility verdict must be followed by executable adversarial proof in that implementation slice.

## First unfinished next step

**Independent Technical Lead exact-head review of PR #817.** If changes are required, return the bounded correction to this same writer/session. If accepted, only the TL may select the next slice: implement the narrow code-owned profile and duplicate-aware parser with synthetic/captured-fixture tests, production registry still empty. Do not bundle real registration or another audit into this writer's scope.

No Ready/merge by this writer. No registration, DB/Supabase mutation, extractor, composition policy, region pin, Rule fact, F8, CH import, #626 or launch/indexing. No new recurring costs. STOP.
