# CTA region-pin source audit 1 — Adversarial self-review

Date: 4 October 2026 (Europe/Zurich)
Issue: #804 / Draft PR: #805
Branch: `docs/official-truth-cta-region-pin-source-audit-1`
Baseline: `main@ec798ab3b7738b3adc76d85ac8b5223e07e970d9`
Immutable task-seed / dispatch head: `db1f5bfac8689aae314e016a7e6c2beaedde0eab`
Logical writer: **Jetnity Official Truth CTA region-pin source audit 1**, Generation **1**
Execution: Codex Desktop, **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`)
Status: **DOCS-ONLY / AUTHOR DELIVERY / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**

This is the writer's review of its own docs and research. It is **not** independent Technical-Lead PASS.

Classification retained: **CTA_REGION_PIN_SOURCE_PROVEN**. The proof is limited to one official response supporting the membership pin's content. No runtime source or pin was registered.

## Required attacks

| # | Attack actively checked | Evidence / result |
| --- | --- | --- |
| 1 | UK, Ireland and unnamed dependencies were filled from memory | Inspected selected JSON `details.body` and asserted all five source names occur once in its first paragraph. The paragraph itself supplies both Bailiwick names and Isle of Man. Mapping uses existing parser/catalogue/display; membership uses only that official paragraph. |
| 2 | Channel Islands was silently split into Jersey and Guernsey | Selected membership paragraph contains no Channel Islands token and explicitly names each Bailiwick. Replacing those two names with the shorthand changes the proposed body digest and would stop review. The staff page's definition is not used to complete the selected source. |
| 3 | UK was decomposed into constituent nations | Candidate set contains only GB for the source's UK. Executed subdivision controls GB-ENG/GB-SCT/GB-WLS/GB-NIR return null from the canonical parser and are absent from catalogue. UK itself passes the lexical parser but is not the catalogue entry; GB displays as United Kingdom/short UK. |
| 4 | Two content items were represented as one support | Compared three different `content_id` values. Only `f841223e-d1ae-4a25-9783-bfa7b727ee11` and its exact API response are selected. Removing the other responses from the argument loses no member. Developer documentation is API-mechanics evidence, not membership. No linked memorandum was fetched or joined. |
| 5 | API JSON was falsely described as structured membership | Inspected JSON type and `details.body`: it is an HTML string. No member/code array exists. Audit explicitly distinguishes envelope schema from a legal membership record. |
| 6 | Search/browser/model text replaced official bytes | All seven unique URLs were direct HTTPS fetches, eight total responses. Source statements were checked against the locally saved entity bytes. Search only located official API documentation, which was then fetched directly. No search excerpt supplies a member or hash. |
| 7 | Oversized response was selected | Measured every Content-Length and body. Three HTML responses and staff-json exceed 65,536 and were excluded. Selected cta-json is 21,474. Research's larger download limit is disclosed and is not production eligibility. |
| 8 | Redirect or effective URL was unpinned | All eight responses were 200 on the requested URL, redirectCount 0. Saved chains were rechecked. Proposed selected-version rule rejects any redirect or changed effective path, including an official redirect. |
| 9 | Hash followed normalization rather than exact bytes | Node crypto hashed received Buffers; Python hashlib independently rehashed saved bytes. Selected raw SHA is `b0fcb783c5183d527dfe2615a8a3a13cd8b96f4fa6225b5051508ceffde4f1a8`. Pretty JSON differs. The separate live fingerprint function was actually executed and equals raw hash only for these no-CR/no-BOM responses. Fragment hashes are labelled separately. |
| 10 | Tracking parameters remained in source identity | URL parsing asserted HTTPS, no query or fragment, no alternate port; requested equals final for every fetch. API base_path and HTTP API URL are not conflated. |
| 11 | A candidate code fails current canonical parsing | Actual `landescodeLesen` returned each of GB/GG/IE/IM/JE unchanged; catalogue returned true. Additional controls exposed the lexical-parser limitation: UK/XX syntactically pass, and CI is Côte d’Ivoire. No invented collective code is accepted as membership. |
| 12 | Audit grew into ETA/policy/extractor/F8 | Changed-path checks allow only seed plus the four named docs. No runtime/test/config/catalogue/database diff. No Rule acceptance/store function was executed, no real sourceId or pin inserted, and no new extractor or policy implemented. The existing applicability tests are synthetic in-process tests, not source registration. |

## Additional one-source and drift attacks

The selected complete body was read, including the distinction between geographical membership and personal rights. Those later conditions are not turned into a general traveller entitlement. The source's publication timestamps are not treated as travel-date thresholds. The response calls the territory UK; the audit does not claim the literal United Kingdom wording occurs in its membership paragraph.

The first paragraph, including tags, is 309 UTF-8 bytes with SHA-256 `b7c7ed572bf3c978da912cf002b80ec33fec1041e4cbb0b81f5a25f72e72f74f`. It is present exactly in the human HTML rendering. The proposed operative fragment is the whole `details.body` string, 14,567 bytes, digest `6a9369620db00b670e035baf60b8023f399ef5a2720f25bc3694638bb37544fb`. This additional body guard catches an appended contradiction even when the first paragraph is unchanged. Neither fragment digest substitutes for the full-response source hash.

Offline mutation sensitivity checks performed, all producing a different body digest:

1. Remove one member.
2. Add a sixth member.
3. Replace the two Bailiwicks by collective shorthand.
4. Move membership to a separate linked document.
5. Repeat a member token.
6. Duplicate the membership paragraph.
7. Append a contradictory membership addition outside the introduction.
8. Change the first paragraph's structure.

These checks prove sensitivity of the proposed exact-fragment guard. They do not prove a future implementation exists. Exact-URL/content-id/base-path/schema/publisher conditions were verified on this snapshot and specified as future requirements; a second content item's wording must never be fetched as an implicit fallback. JSON duplicate-key rejection was applied to all saved JSON responses. None had a duplicate key.

The body-level pin is intentionally conservative and may need a new review for changes unrelated to membership. It avoids requiring equality of the whole HTTP envelope for semantic validation. A new full response still has a new provenance hash and must be explicitly rebound through the trusted path. No current background drift monitor is asserted. The current evaluator merely uses its code-owned list and is still unpinned.

## Authority and provenance limits checked

- Official HTTPS origin plus observed publisher metadata supports government provenance for research; raw SHA alone is not proof of origin.
- Direct Node research did not call the server-held catalogue or bind the production DNS lookup to its socket. No research response is called accepted Evidence or server-owned Jetnity authority.
- The selected response itself resolves membership; no multi-source contract extension is proposed.
- Country labels establish representation in Jetnity and do not confer CTA membership. A future mapping is code-owned and exact, not a dynamic localized lookup.
- The candidate source-id text is only a naming pattern. It cannot pass as a real source registration. The next slice's source-authority prerequisite remains explicit.
- Raw bodies are local research scratch, not repository attachments or a new database/raw-page retention feature.

## Executed validation and remaining limits

21 existing focused tests passed, 0 failed, 0 skipped. The actual code-parser/catalogue/display assertions and actual runtime fingerprint comparisons passed separately. All eight saved body hashes and metadata were independently recomputed. Selected repeated source bytes matched. Operating-mode guard passed.

Closing live re-fetch, #751/#748/writer check, exact five-path diff, immutable seed comparison and `git diff --check` are recorded in the report's closing-verification section. They must pass before commit/push. No full-suite, typecheck, lint, Production build, UI verification or final-head CI/Vercel success is claimed. The work changes docs only.

The immutable seed remains blob `a70d368c33f96fb1ce7e1091ea2d2db5402931c3`, SHA-256 `b55ae9f10a7a06ca2f01caef29e5a258409d279815924071ab217a73e95d36bc`, against dispatch `db1f5bfac8689aae314e016a7e6c2beaedde0eab`. No other model or subagent performed material work.

## STOP

Draft remains Draft. No Ready or merge. No follow-up slice. Independent Technical-Lead exact-head review is required.
