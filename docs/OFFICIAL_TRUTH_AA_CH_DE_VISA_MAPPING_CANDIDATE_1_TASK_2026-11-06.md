# Official Truth — AA CH→DE Visa Mapping Candidate 1
## TASK v1 — 2026-11-06

## 1. Purpose and authority
Tracking: #1146; parent: #917. Branch: feat/official-truth-aa-ch-de-visa-mapping-candidate-1-20261106. Intended author: Jetnity AA Visa Mapping Candidate 1 — Codex Generation 1; actual session must be confirmed in the dispatch receipt. After complete independent post-merge closure of #1145, build the missing concrete AA source-to-visa mapping as an inactive, reviewable candidate. Reuse the existing application, canonical Evidence/Review/Rule/Requirements chain, S1 decoder and V2 fingerprint function. Do not build a generic extraction framework.
Root may select this bounded next slice under operating-standard §3a after the current slice closes in NORMAL mode. The author may not start automatically. A separate root dispatch receipt must bind the issue, Draft PR, exact base/seed/task blob and actual author session.
Only root may Ready/merge. Author self-review is not TL PASS. On review findings, the same author/session makes the immediate fix, a new exact head invalidates prior gates, then complete re-gating. No follow-up.

## 2. Frozen baseline and evidence
Reviewed post-merge starting main: b42e4b33598783fc2ca385e16d399d2d8fdb2aa7 (tree ed99c9271de097e781fc09c7b35c70f6b15d4668). #1145 is POST-MERGE PASS: https://github.com/Jetnity/jetnity/pull/1145#issuecomment-6697689013 . Explicit next-slice selection: https://github.com/Jetnity/jetnity/issues/751#issuecomment-6697693724 . Root must refresh before dispatch and amend if main moved.
- #1145 root PASS: https://github.com/Jetnity/jetnity/pull/1145#issuecomment-6697433912
- Source-use/privacy review: https://github.com/Jetnity/jetnity/issues/917#issuecomment-6697201431
- Original apply/readback history: https://github.com/Jetnity/jetnity/issues/917#issuecomment-6164202501
The first hosted apply response was success; its denied independent readback remains pending. Stage 2 was not attempted. This task neither obtains that refused outcome nor retries, reroutes or delegates it.
Read JETNITY_START_HERE.md, the operating standard and referenced current handoff, ACTIVE_WORK_STATUS.md, latest #751/#917 continuity, AGENTS.md and the required product/architecture/quality documents before implementation.

## 3. Reviewed context and conditional statement
Use precisely this immutable source binding:
- sourceId: de-aa-staatenliste-visumpflicht
- contentItemId: aa-staatenliste-visumpflicht-207820; contentItemVersion: 1
- representationId: aa-staatenliste-visumpflicht-html-de; representationVersion: 1
- identityProfileId: de-aa-visa-table-html-de-candidate; identityProfileVersion: 1
- request/canonical/final URL: https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820
- MIME text/html; locale de; schema article; source-fingerprint protocol 2
- reviewed complete V2 context fingerprint: fc34bb51f8493a8776b6a300c8aed493a4a4fe08fba269148292ed7d9a334979

The already observed public research snapshot had 93,365 UTF-8 bytes, 93,085 UTF-16 units, raw SHA-256 97cece7aacf60de10a9a8fb28c1bb649382d9cf1436c18b55efbbe9b0cdd7f2a. Root and an independent reader reproduced the V2 value with the actual unchanged helper. These are research/change-control metadata, not runtime custody, transport completeness, source admission or accepted facts. Do not fetch the page or commit its body.

Only the unique unqualified Schweiz | Nein observation under the exact existing German headers may conditionally yield:
{ kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }.
Do not infer 90/180 days, work/residence rights, passport remaining validity, transit rules, blanket entry permission or legal effect dates. The Swiss row has no footnote marker; unrelated national-pass footnotes do not become Swiss conditions.
The legal statement can be broader than the narrow product subset. Do not require the words ordinary/tourism/direct to be printed in this source, or claim the source verified those trip facts. The existing application validates the selected linked traveller/document, ordinary passport, tourism, full direct CH→DE route and current trip revision.

## 4. Implementation
Add only:
- lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/reviewed-source.ts
- lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.ts
- lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.test.ts
- docs/OFFICIAL_TRUTH_AA_CH_DE_VISA_MAPPING_CANDIDATE_1_TASK_2026-11-06.md (root-owned; author must not alter)
- docs/OFFICIAL_TRUTH_AA_CH_DE_VISA_MAPPING_CANDIDATE_1_HANDOFF_2026-11-06.md.
Concise append-only updates to ARCHITECTURE.md, ROADMAP.md and DECISIONS.md are required. Any further path needs root scope amendment before editing.

The reviewed-source module contains frozen code-owned context/manifest data, including the above binding/pin and the fixed application candidate window. No runtime setter, public configuration input, environment switch or factory for caller-chosen pins.
The mapping module exports clearly named CANDIDATE values: one ApplicationContract and one OfficialTruthExtractorDefinition with current=false. Both remain unregistered. New production code must not import the identity-candidate module or the foundation content-identity module (including type-only imports); existing finite importer/identity-isolation guards remain unchanged. Existing ApplicationContract and extractor interfaces provide sufficient types.

Candidate identifiers:
- contract id: aa-ch-de-visa-v1
- applicationScope: ch-ordinary-tourism-direct-de-v1
- extractorId/version: otx_aa_ch_de_visa / 1
- sourceFamilyId: otf_aa_visa_table; schemaFamily: ots_aa_visa_table_html_de
- policyId/policyVersion: null; requiredFieldPaths: []
- travelDates: 2026-11-07 through 2026-11-13 inclusive.
This fixed window bounds a future pilot, not the law. No rolling dates, automatic extension or use of publication/retrieval time as a legal start/end date. If the actual later pilot lies outside the window, a separately reviewed contract version/digest is required.

Coverage is exactly destination DE, no transit, visa, citizenship CH, selected passport issuingCountryCode CH, residence not_applicable. The canonical guard requires requirement_effect/visa, explicit_primary_statement, the exact schema family, one support, policy null, destination DE, transit null, citizenship required with exactly [CH], credential option passport/issuer CH/related citizenship CH, residence not_applicable, and a valid travel_date within the fixed candidate window. Validate actual existing types rather than inventing fields. Other/multiple citizenship combinations and unsupported contexts remain unknown, never visa-required.

Use one private AA-specific guard from both match and extract; extract may not emit a conditional fact merely because match was called earlier. Validate complete exact support binding, exact URL/MIME, numeric protocol 2 and canonical complete-body protocol selection via officialTruthSourceFingerprintProtocol(sourceSnapshot) === 2; the V2 hash helper also accepts smaller text and is not a protocol selector. Rehash sourceSnapshot with the unchanged officialTruthSourceFingerprintV2. Computed hash, support hash and frozen reviewed pin must all agree. Reuse unchanged chDeAaS1VisaRowResearchFromHtml; it must return its unqualified Swiss observation. Return only existing recognized rejection reasons on mismatch. The reduced extractor context has no redirectCount; do not invent one. Existing retrieval/application checks own zero-redirect and custody.

The full-source pin deliberately detects changed footnotes, global qualifications, hidden table ancestors and unrelated body changes. Existing V2 normalization is only CRLF/CR→LF. No substring hashing, DOM reduction, new normalization, automatic re-pin or forgiving fallback. Even harmless page changes require a new review. The fingerprint is a change guard, never proof of origin.

ApplicationContract.validity must use the same exact complete-context recognition: recognized => {validFrom:null, validUntil:null}; otherwise null refusal. The null fields represent unknown legal bounds; travel_date in the rule scope is a separate applicability field.
Compute contract.digest with the existing SHA-256 helper over a fixed ordered, domain-separated projection of contract/mapping version, scope/window, full source binding/URL/MIME/protocol/pin, coverage, extractor version, the single conditional fact and versioned recognition/null-validity semantics. Do not hard-code/reuse an unrelated digest. A later changed pin/window/meaning must not select an old grant.

## 5. Meaningful proof
Use the existing private loadFixtureModule helper. Only synthetic test data may replace the fixed reviewed-data import. No production injection seam. The unchanged real candidate configuration must reject synthetic bytes. Candidate current=false must be immutable and excluded from real selection.
Test the actual candidate hash/decoder/match/extract/validity, not a duplicate mock algorithm. A synthetic full application test must execute the actual candidate callbacks via the existing canonical registry with a test-only current=true copy and the same private WeakMap execution witness; execute Evidence → Review → extractor → Rule → Requirements. Only external application ports are substituted. No fake trusted_fact_extracted, AcceptedRule or accepted witness.
One successful synthetic 93,365-byte candidate path must produce the single expected visa result and leave all unrelated requirement cells unknown. Failed candidate contexts must not produce a positive fallback.

Essential adversaries: modified global restriction outside the row, newly hidden table ancestor, changed footnote, Swiss Ja/marked/duplicate/hidden row, missing table, truncated/over-limit/invalid UTF text, wrong or stale support hash, recomputed hash with wrong immutable expected pin, changed identity/version/URL/MIME/protocol, multiple supports, wrong fact/scope/policy, unrelated citizenship/document or out-of-window/invalid/missing travel date. Exercise direct extract refusal and validity refusal. For pin-independent semantic negatives, inject a matching synthetic pin specifically for Swiss Ja, an attached Swiss qualifier/footnote, duplicate/conflicting Swiss rows, a hidden Swiss row and a missing/ambiguous visa table. These must still fail the unchanged S1 decoder. Global qualifications outside the row, newly hidden table ancestors and unrelated footnote changes must fail with the original immutable expected pin; do not claim that S1 independently interprets those changes or widen the decoder in this task. Test both window boundary days and application refusal for non-ordinary passports and other purposes. Confirm the existing CRLF normalization precisely rather than claiming raw-byte identity.
Independent digest checks must show the actual candidate digest changes under a test-only changed pin/window manifest and that the frozen manifest reproduces the recorded digest.
Keep full production import/registration-isolation proof: actual application contract lookup returns null, pilotEnabled=false, trusted extractor and AA profile remain unregistered; no candidate live importer outside its own exact data module. Scan complete checkout for the canonical CI guard. Do not weaken any existing guard.
Run focused candidate and relevant application/identity tests locally where possible; full real checkout gates run in GitHub Actions. A partial local tree is not a full isolation/build PASS. Root independently repeats meaningful proofs and reviews remote exact blobs before Ready.

## 6. Exclusions and stop
No hosted SQL/migration/RLS, credentials, grants, source request, source or rule admission, native transport/framing/#1131, #1135, source-store reader detour, production registration/activation, dependency or workflow/timeout changes. No source HTML in git, database or logs. Existing source-use findings are not blanket permission for raw-copy retention.
The candidate is conditionally executable mapping code, not an admitted source or live visa service. Its export/callback output carries no accepted authority without the unchanged canonical same-request chain and real gates.
Record exact author name/generation/session, touched paths/blob identities, commands/results/limitations and P0/P1/P2/P3 findings in the HANDOFF. Report existing hosted authority/source/production blockers without asking the owner again for already granted general development permission.
Return to root and STOP. Do not Ready, merge, start another task, or report the whole #917 function complete.
