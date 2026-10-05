# Official Truth JP content identity and retrieval qualification 1

Date: 5 October 2026. Issue: [#852](https://github.com/Jetnity/jetnity/issues/852). Delivery: Draft [#853](https://github.com/Jetnity/jetnity/pull/853).

## 1. Decision and smallest gap

**JP_CONTENT_IDENTITY_RETRIEVAL_PROFILE_NOT_READY**

The minimum qualification target is MOFA R01 (visa exemption) plus R04 (FAQ). Fresh default-transport direct requests returned **403**, including repeats after successful browser retrieval. A normal in-app browser returned **200** for the same exact URLs; a separate clean headless browser also returned **403**. Browser success is not server-retrieval proof. No compatible successful server response was obtained.

The smallest unresolved gap is a complete successful retrieval of **both R01 and R04** using Jetnity's credentialless, public-IP-bound Node HTTPS semantics, from the intended server egress, within the existing byte/time bounds, followed by review of those exact server-received bytes. The present local direct failure does not prove every deployment egress fails; it does prevent qualifying the proposed path. No browser cookies, browser automation service, client-supplied body, alternate origin or larger PDF is an acceptable substitute.

The identity side has a bounded conditional design: the existing architecture permits a **reviewed full-content fingerprint** for publishers without a stable publication identifier. Exact URL plus title, MOFA footer and template structure alone is insufficient. Japan's observed Corporate Number identifies the publisher, not a publication. No GOV.UK-style publication UUID was found or invented. The fingerprint proposal below is research, not an implemented or registered profile. This audit makes no Rule fact, Swiss eligibility decision or claim that two pages complete a future legal-support family.

## 2. Binding context and live precedence

- Logical writer: **Jetnity Official Truth JP content identity retrieval qualification 1**, generation **1**.
- Session: `01a10d75-acc4-7173-8ca8-98608d6ce694`; execution: Codex Desktop, `gpt-6-astra` / `xhigh`, verified from this session's local turn metadata.
- Baseline and inspected `origin/main`: `2f27956cc9fd4289d30f258a5ee8eeaaa60aafec`; mode: `NORMAL`.
- Branch: `audit/official-truth-jp-content-identity-retrieval-1`.
- Immutable seed: `3a8821af6f7b26156eeb0f31cd4df0e44ebe9a40`.
- Immutable TASK blob: `1c4ad7828740d3d42ad142ea17ff63f3a079a45c`.
- Authority: [Binding TASK](OFFICIAL_TRUTH_JP_CONTENT_IDENTITY_RETRIEVAL_QUALIFICATION_1_TASK_2026-10-05.md), [dispatch 6001158042](https://github.com/Jetnity/jetnity/pull/853#issuecomment-6001158042), live [#751](https://github.com/Jetnity/jetnity/issues/751), relevant MATERIAL in [#748](https://github.com/Jetnity/jetnity/issues/748), issue #852 and Draft #853.
- #751's last processed MATERIAL marker was `5988971332`; subsequent triage `5989855107` did not widen this slice. Live #751 permits bounded autonomous commit/push and names the two disjoint writers.
- Parallel [#851](https://github.com/Jetnity/jetnity/pull/851) and its current Changed Files were read. Its entire `OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1` document family is reserved to that writer. No such path is edited here. Pre-push evidence is in the report.

### Baseline code and architecture read

| Read-only anchor | Relevant finding |
| --- | --- |
| `lib/readiness/official-truth-content-identity.ts` and its tests | Frozen source/item/representation graph; exact seven-field binding; current profile pins; code-owned registry. Only the existing GOV.UK profile is in the default registry. No JP entry. |
| `lib/readiness/official-truth-govuk-content-api-identity-profile.ts` and its tests | Stable external publication and publisher IDs are verified there. This is a comparison, not a Japanese metadata template. |
| `lib/readiness/official-truth-server-owned-retrieval.ts` and its tests, including R2/default-profile cases | Exact catalog-to-transport-to-profile binding, public-address lookup bound to socket, body/time caps, full completion, anti-injection and return-tuple rebinding. |
| `lib/readiness/official-truth-source-catalog-server.ts`, server-held registry, source registry and router | Coherent catalog-v2 snapshot; exact request URL routing; no caller-provided source/profile/body authority; no permissive catalog fallback. |
| [#849 audit](OFFICIAL_TRUTH_JP_FIRST_PILOT_SOURCE_AUDIT_1_2026-10-05.md) | Prior source-family NOT_READY; R01/R04 priorities and browser/direct discrepancy. Old receipts remain historical. |
| [Source-identity granularity reconciliation](OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md), section 3.1; GOV.UK identity-profile architecture | Without a publisher item ID, use `jetnity-reviewed-item`, a server-allocated opaque review key and an exact full-content fingerprint; no automatic moved-path continuity or second item for a reviewed same-item rendering. |

No existing tests were executed or modified in this docs-only slice. Reading them establishes the existing contract, not fresh runtime test results.

## 3. Source selection and canonical/locale observations

The source IDs R01/R04/etc. below are historical research labels from #849, **not runtime source IDs**. Every relied-upon current page capture is in section 9. All intentional fresh source checks were on the Japanese state host `www.mofa.go.jp`. Normal browser rendering can load embedded assets; those assets are neither research authorities nor part of the proposed retrieval graph.

| Label | Request URL and observed final URL | Purpose in this audit | HTML / Open Graph locale |
| --- | --- | --- | --- |
| R01 | [https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html](https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html) — final equals request in all measured captures | Minimum qualification target: visa-exemption publication | `en` / `en_US` |
| R04 | [https://www.mofa.go.jp/j_info/visit/visa/faq.html](https://www.mofa.go.jp/j_info/visit/visa/faq.html) — final equals request in all measured captures | Minimum qualification target: FAQ consequence/eligibility publication | `en` / `en_US` |
| R02 | [https://www.mofa.go.jp/mofaj/toko/visa/tanki/novisa.html](https://www.mofa.go.jp/mofaj/toko/visa/tanki/novisa.html) — final equals request in all measured captures | Japanese language-pair control for R01; excluded from initial admission proposal | `ja` / `ja_JP` |
| R03 | [https://www.mofa.go.jp/j_info/visit/visa/](https://www.mofa.go.jp/j_info/visit/visa/) — final equals request in all measured captures | MOFA VISA landing-page sibling/canonical control; excluded from initial admission proposal | `en` / `en_US` |
| R10 | [https://www.mofa.go.jp/mofaj/toko/visa/index.html](https://www.mofa.go.jp/mofaj/toko/visa/index.html) — final equals request in all measured captures | Japanese VISA landing-page language/canonical control; excluded from initial admission proposal | `ja` / `ja_JP` |

R03/R10 were checked only far enough to qualify the purpose-page identity/alias boundary. Their generic MOFA template and the slash/index difference show why family-wide structural matching is unsafe. They do not solve R01/R04 retrieval. ISA Temporary Visitor S08 is therefore unnecessary for this technical conclusion and was not freshly fetched. The historical 385,852-byte PDF was not fetched and is **inadmissible as a runtime representation**: it exceeds 65,536 bytes, and PDF is outside this HTML proposal. No resized, extracted or browser-derived substitute is admitted.

### Per-publication metadata

| Label | Observed title / main heading | `og:url` | Visible editorial date | Language relation |
| --- | --- | --- | --- | --- |
| R01 | Exemption of Visa (Short-Term Stay) | Exact R01 request URL | September 1, 2025 | Explicit Japanese link to R02; R02 links back to R01. |
| R04 | Frequently Asked Questions | Exact R04 request URL | March 31, 2023 | Explicit Japanese link to `/mofaj/toko/visa/faq.html`; that page was not fetched. No reciprocal/equivalence claim. |
| R02 | 査証免除国・地域（短期滞在） | Exact R02 request URL | 令和7年9月1日 | Reciprocal English link to R01. |
| R03 | VISA | `https://www.mofa.go.jp/j_info/visit/visa/index.html` | June 24, 2026 | Links to R10; observed final URL remains the slash URL. |
| R10 | 査証（ビザ） | Exact R10 request URL | 令和8年6月24日 | Links to English `/j_info/visit/visa/index.html`, which was not fetched. |

All five successful response bodies declare UTF-8, carry MOFA copyright and `og:site_name`, `og:type=government`, and the footer Corporate Number **9000012040001**. No `rel=canonical`, `hreflang` or stable per-publication UUID was observed in these HTML bodies. This is an observation about these representations, not proof that MOFA never publishes identifiers elsewhere. Generic DOM roots (`main#contents`, `article#contents-article`, `#contents-header`, `#maincontents`) repeat across siblings and do not establish item identity.

R01/R02 are explicitly paired language publications. This supports a later human decision to group them under one reviewed item with separate representation IDs; it does not establish machine-verifiable translation equivalence or independent corroboration. The initial proposal admits English only. R04's Japanese target remains unqualified. R03/R10's slash/index relation cannot safely be collapsed from an `og:url` or language link alone. No inferred alias, redirect, language fallback or moved-page continuity is allowed.

## 4. Conditional source/item/representation model

**PROPOSAL / NOT IMPLEMENTED / NOT REGISTERED.** These names are Jetnity names, not publisher-supplied publication identifiers. Catalog allocation remains a separate later gate and requires duplicate review.

| Field | R01 proposal | R04 proposal |
| --- | --- | --- |
| Authority-level `sourceId` | `jp-mofa` | Same `jp-mofa`; not a source per page |
| Publisher / authority | Ministry of Foreign Affairs of Japan; observed organizational JCN `9000012040001` | Same |
| `expectedPublisherIds` / `expectedAuthorityIds` | Each `["jp-jcn:9000012040001"]`; proposed code-owned namespacing of observed JCN | Same; must match exact expected arrays |
| `contentItemId` | `short-stay-visa-exemption` | `visa-faq` |
| `contentItemVersion` | Proposed initial `1` | Proposed initial `1` |
| `externalIdNamespace` | `jetnity-reviewed-item` | Same |
| `externalContentId` | Not allocated. Must be an opaque server-allocated review key; cannot be a fabricated MOFA UUID or raw URL. | A distinct, not-yet-allocated review key after duplicate review. |
| `representationId` / proposed version | `html-en` / `1` (scoped to item) | `html-en` / `1` (scoped to item) |
| `identityProfileId` / proposed version | `jp-mofa-visa-exemption-html-en` / `1` | `jp-mofa-visa-faq-html-en` / `1` |
| `expectedLocale` / `expectedSchema` | `en` / `null` | `en` / `null`; do not invent a MOFA schema |
| `expectedMediaType` | `text/html` | `text/html` |
| `requestUrls` | Singleton exact R01 URL | Singleton exact R04 URL |
| `expectedFinalUrl` | Exact R01 URL | Exact R04 URL |

For both: HTTPS, host **exactly `www.mofa.go.jp`**, port 443, no credentials or query. Registered request/final URLs contain no fragment; existing transport strips a caller fragment before routing, network and provenance. This audit does not claim that fragments are rejected by the current runtime. Path allowlist is exactly `/j_info/visit/visa/short/novisa.html` and `/j_info/visit/visa/faq.html`, each bound to its own representation. No host suffix wildcard, directory prefix, `mofa.go.jp` apex alias, MOJ/ISA host, PDF, Japanese alternative or slash/index substitution. R02/R03/R10 are diagnostics, not proposed additional allowlist entries.

The JCN can anchor the authority/publisher mapping in reviewed source descriptors; it is not a cryptographic attestation and cannot distinguish R01 from R04. The immutable review key expresses the absence of an external item ID. The existing external-ID grammar does not accept raw URLs with `/`; the proposed namespace plus opaque key respects that contract. Registration must manually reconcile duplicate translations/aliases before allocating keys, because distinct opaque keys alone cannot establish distinct publications.

### Verifier contract

Inputs remain exactly the existing frozen `item`, `representation`, `responseText`, `finalUrl`, `mediaType`. No browser state, cookies, caller-supplied proof, HTTP headers, DNS results or status are added to the profile API. Catalog and transport own the latter boundaries.

A future bounded exact-content verifier would:

1. Require its code-owned source/item/representation/profile tuple, versions, reviewed item namespace/key, publisher/authority arrays, singleton request URL, final URL, locale, schema and media pins. A tuple or descriptor mismatch fails closed.
2. Require the complete bounded UTF-8 response text delivered by the server-owned transport. It must not execute HTML, scripts, subrequests or redirects.
3. Compare the **entire** text fingerprint against a code-reviewed pin using Jetnity's existing newline normalization (CRLF and lone CR to LF, then SHA-256 over UTF-8). No trimming, selective DOM extraction, exclusion of navigation/footer/scripts, Unicode normalization or automatic replacement-hash learning.
4. Return only `{ ok: true, identity }` with the exact seven fields: `sourceId`, `contentItemId`, `contentItemVersion`, `representationId`, `representationVersion`, `identityProfileId`, `identityProfileVersion`. The retrieval layer rebinds all seven to its own resolved representation. Otherwise return `{ ok: false, reason: 'identity_mismatch' }` for mismatching material or `'invalid_response'` for invalid input/encoding as applicable. Transport failures remain transport failures.

Review of a prospective pin must first confirm the expected complete document, singleton identity metadata, correct main heading and locale, MOFA/JCN publisher association and absence of an error/interstitial or conflicting identity claim. Generic structural predicates alone never produce success. Full-hash equality subsequently binds that reviewed structure without needing a permissive HTML parser. Matching words in comments, scripts or an error page cannot replace the pin. These browser fingerprints are diagnostic candidates only; a successful server receipt and review are still required before any future pin is approved.

## 5. Stable versus mutable metadata, rejection and drift

| Signal | Role / stability | Required treatment |
| --- | --- | --- |
| MOFA publisher name, organizational JCN | Expected authority identity, not item identity; could change after organizational change | Pin reviewed mapping; changed/missing/conflicting publisher claims fail closed, require human review and appropriate descriptor/profile refresh. |
| Server-allocated review key | Jetnity's stable reviewed item identity; not MOFA metadata | Keep namespace/key invariant across versions of the same item stream. Never replace to hide drift. |
| Exact URL, `og:url`, locale, media type | Representation pins; URL is not a permanent publisher ID | Reject unexpected target, alternate locale/media or contradictory URL. No automatic path move. |
| Title, main heading, generic template roots | Descriptive structural checks at pin review, mutable and shared with siblings | Cannot establish identity alone. A change alters the exact-content pin and requires review. |
| Full normalized response fingerprint | Exact reviewed rendering identity under no-external-ID fallback | Any change blocks. Exact-content architecture intentionally couples all response drift to requalification, without asserting legal meaning. |
| Country rows, Swiss notes, stay/purpose wording | Legal-semantic content, mutable | A hash change requires review of the new rendering; separately assess legal implications. No extraction, acceptance or Rule refresh here. |
| Editorial date / Last-Modified / ETag | Mutable content/cache/storage metadata | Record, never substitute for publication ID, full-body retrieval or content hash. Visible date may differ from server Last-Modified. |
| `x-amz-version-id`, request IDs, Date, Expires | Storage/object/request observations, not durable MOFA publication IDs | Diagnostic only; not inputs to existing verifier. |
| Content-Length / Content-Encoding / Vary | Transport representation metadata | Observe exact bytes/encoding, enforce existing body cap; browser-decoded length is not Node transport proof. |
| Language links, navigation, social markup, layout | Mutable auxiliary markup | No widening through links. Full-body fingerprint still detects their changes. |

| Change / ambiguity | Fail-closed and version action |
| --- | --- |
| Error/Access Denied/login/challenge/maintenance page, even with HTTP 200 and MOFA words | Reject full-hash mismatch. HTTP 403 already fails transport. Never promote the block-page hash to a legitimate pin. |
| R04 body at R01, R03 generic sibling, R02 Japanese body, injected/conflicting/duplicate identity metadata | Reject exact fingerprint or descriptor mismatch. A repeated generic footer/title cannot rescue identity. |
| Different body at same URL, including cosmetic or editorial changes | Fail closed; human review; if retained as same item, change the relevant exact-content profile version and representation version pin. No silent mutation of v1. Legal change is assessed separately, not inferred from hash drift. |
| Verifier algorithm or accepted fingerprint set changes | New profile version and affected representation version; explicit retirement/current-pin review. No broadening to an unreviewed hash set. |
| Representation URL move | Block; require explicit same-item review. Retain item identity only if justified, update representation version/profile pins; preserve old historical URL reservation. No auto-follow continuity. |
| Locale or media changes | New representation ID (these are invariant within a representation stream); separate qualified profile/pins. Not merely a version increment. |
| Publisher/authority descriptor change | Human review; if genuinely same publication, refresh item version, dependent representation's item-version reference and profile/representation pins; if distinct publication, explicitly model a new item. |
| Already reviewed same-item rendering or translation presented under another review key | Registration rejection pending manual reconciliation; graph uniqueness plus review must prevent duplicated support. No automatic independent evidence count. |
| Unknown/retired/duplicate current profile, ambiguous current representation, foreign historical URL owner | Existing graph/catalog validation blocks before network. Do not register a workaround. |

## 6. Existing server-retrieval semantics and compatibility

The audit probe was external scratch research. It used Node 22.23.3 `node:https`, Jetnity's unchanged baseline public-IP predicate, exact fixed research URLs, DNS `lookup({all:true, verbatim:true})`, all-address validation and a lookup closure bound to the connection. It used GET, verified TLS/SNI, no credentials/cookies/Authorization, `accept-encoding: identity`, `cache-control: no-cache`, a 10,000 ms deadline and 65,536-byte cap. Node's normal Host/connection framing is implicit; no browser User-Agent was spoofed. No catalog, DB, Supabase or live application entry point was called.

For diagnostics the probe completed and hashed short 403 error bodies; the application transport would already reject their status. No redirect occurred; the probe recorded rather than followed redirects. Consequently it demonstrates the immediate compatible transport failure, not full application acceptance or an independently tested redirect engine.

| Boundary in inspected baseline | Qualification result / exact limitation |
| --- | --- |
| Caller input only `sourceId` and URL; server-owned coherent current catalog before network | No JP profile exists in the inspected code-owned registry, so no qualified JP route can pass its current profile pins. No live catalog read was made; this is not a DB inventory claim. Scratch research does not grant catalog authority. |
| HTTPS, no URL credentials, port 443, verified server name | Direct TLS was authorized, TLSv1.2. No TLS/security bypass was used. |
| Exact registered request URL and expected final URL | All measured final URLs equal request URLs. Proposed singleton paths do not permit aliases or sibling fallback. |
| Public-only DNS/IP; every resolved answer must be valid/public and family-consistent; vetted lookup used by actual socket | All direct responses resolved public addresses passing the baseline guard, including IPv6 and IPv4. This is per-request observation, not future static CDN pinning. Any unsafe/mixed answer must block. |
| Redirect statuses 301/302/303/307/308, bounded to at most 5, same source and exact representation URL set; loops rejected | No observed redirects. With proposed singleton request/final URL, any changed URL rejects and a self-redirect loops; effectively zero accepted redirects for these proposals. |
| Successful status, media, complete body | Existing transport accepts 2xx, not exclusively 200. Research success criterion remains a complete ordinary 200 representation. 403 fails; 204 has no admissible nonempty body; 206 cannot be treated as proof of a complete document merely because it is 2xx. Profile sees no status field. |
| Exact normalized media `text/html`; fatal UTF-8 decoding | All receipts report `text/html`; successful browser HTML declares UTF-8. HTML media alone also describes the rejected block pages. |
| Content-Length precheck and counted body chunks, maximum **65,536** received bytes inclusive | Browser-decoded legal pages range 26,479–43,440 bytes, but do not prove an unencoded server body under the cap. Direct received bodies are small errors. No cap increase is justified. |
| `accept-encoding: identity`; Node HTTPS does not automatically decompress | Successful browser responses are **gzip**. Existing code has no independent Content-Encoding rejection field; unsolicited compressed bytes would reach UTF-8/identity checks and cannot be silently decoded by this proposed profile. A compatible unencoded successful receipt remains missing. |
| One **10,000 ms** network deadline including DNS/redirect/body; whole stream must finish | All observed diagnostic responses completed within the bound. Catalog resolution happens before that timer; synchronous profile work is not preempted by it. Do not claim a universal 10-second bound on every surrounding operation. |
| End-of-body, nonempty valid text, final URL/media and exact identity binding before success timestamp | Browser CDP `loadingFinished` proves that browser's complete document response. It does not prove the application's transport boundary. Direct error bodies completed but cannot be accepted. |
| `sourceContentHash` via `evidenceQuellenFingerprint` | SHA-256 of full UTF-8 text after newline normalization, **not raw response-byte SHA-256**. Both hashes are distinguished in section 9. |

### Direct 403 versus browser 200

The first Node requests returned AkamaiGHost Access Denied responses. Clean isolated headless Chrome 154.0.8037.95 also returned 403 for all five. Normal in-app Chrome 154 returned HTTP/2 200, `server: AmazonS3`, gzip HTML for the same exact five URLs, with no redirect, disk-cache hit or service-worker response reported. Node repeats for R01/R04 after those successes remained 403. This reproduces and narrows #849's discrepancy; browser availability is client-context-dependent, not a universally successful browser alternative.

Observed differences include the HTTP stack/protocol, browser/default headers, compression negotiation and browser context. The direct client used no User-Agent and requested identity encoding; headless advertised HeadlessChrome; the normal browser advertised Chrome. An additional browser header observation for R02/R03/R10 showed gzip/br/zstd acceptance and no Cookie or Authorization header for those navigations. It did not establish the complete credential state of the recorded R01/R04 navigations. No cookie or credential was copied into the direct client. No CAPTCHA, interstitial or anti-bot challenge was solved or bypassed.

Akamai denial versus the successful S3 server header supports an inference that edge/request treatment differs. It does **not** establish the exact rule, a User-Agent-only cause, or an approved remedy. The common host and overlapping public CDN addresses exclude neither differing network routes nor HTTP fingerprint/context effects. No production/server-deployment egress was probed in this slice. The discrepancy is explicitly **unresolved and blocking**; no header-spoofing or browser-based workaround is proposed.

## 7. Proof required before reconsideration

A later authorized qualification would need, for each of R01 and R04, a fresh receipt using the intended server transport/egress: exact request/final URL, UTC start/finish, 200 status, singleton URL admission, no credentials, all DNS answers and bound public socket, verified HTTPS, `text/html`, complete unencoded fatal-UTF-8-compatible body, raw byte count at most 65,536, completion within 10,000 ms, redirect trace and raw SHA-256 plus normalized Jetnity fingerprint. Record relevant request/response headers without exposing secrets. Repeatability across fresh connections must be assessed; one cache-backed browser response is insufficient.

Review the successful server bytes for correct item/publisher/locale and ambiguity before assigning a pin. If the bytes differ from section 9, review the entire difference; do not auto-adopt the browser hash or treat any hash mismatch as proof of changed law. If current transport cannot obtain this response, the TL must separately decide whether another official state representation or a separately bounded transport architecture is warranted. This document does not authorize that work or loosen a boundary.

## 8. Exact future implementation/test boundary, conditional only

No implementation slice is launched or authorized by this NOT_READY result. If the missing proof is later resolved and independently approved, the smallest **proposed** dormant implementation paths are:

1. `lib/readiness/official-truth-jp-mofa-exact-content-identity-profile.ts` — two explicit source-specific profile definitions and reviewed pins; no network or catalog writes.
2. `lib/readiness/official-truth-jp-mofa-exact-content-identity-profile.test.ts` — deterministic verifier cases and bounded inline fixtures, avoiding an extra fixture path.
3. `lib/readiness/official-truth-server-owned-retrieval.test.ts` — integration through the existing test dependency seam, with explicit profile injection only in tests.

That proposal would leave the production default registry in `official-truth-content-identity.ts` unchanged. **Profile/source/item/representation catalog registration is a later separate gate**, including duplicate/support-family review; not a side effect of adding an exported dormant verifier. No migration, extractor, composition policy, Rule acceptance or F8 is implied. A TL would still need to bind the exact scope of any future task.

### Future matrix (specified, not implemented or executed)

| Case | Required result / layer |
| --- | --- |
| R01 and R04 exact reviewed complete server material, separately pinned descriptors | Success with only matching seven-field binding in verifier test; server-owned success only through qualified catalog/transport integration. |
| CRLF/lone-CR versus LF over otherwise identical full text | Same existing normalized fingerprint; raw byte hashes remain distinct. |
| Single byte/text change, including footer, script, editorial date, Swiss row or purpose wording | Full-hash identity mismatch; no legal-semantic conclusion from mismatch alone. |
| R04/R03 sibling body at R01 URL; R01 at R04 | Reject regardless of common MOFA template/JCN. |
| R02 Japanese body presented as R01 English; unknown locale or media | Reject; no translation fallback. |
| Wrong/missing/conflicting/duplicated publisher/JCN, `og:url`, locale or main-header identity | Reject modified body; ambiguity in a proposed new pin blocks review, not auto-acceptance. |
| Error/challenge/login/maintenance body with 200, copied MOFA footer or expected title in script/comment | Reject identity. Captured 403 never reaches successful verification. |
| Final URL at sibling, alias, moved path or unregistered query | Reject exact route/representation contract before any identity success. |
| URL fragment on otherwise exact R01/R04 | Existing transport strips fragment before routing, provenance and network; no new representation or extra authority. A fragment cannot change item identity. |
| HTTP/credentials/non-443/foreign host/host-suffix trick | Reject admission; no network to disallowed destination. |
| Private/loopback/link-local/reserved or malformed/family-mismatched DNS answer; public+private mixture | Reject all-answer validation; no HTTP. |
| DNS changes after vetted resolution | Actual socket uses vetted lookup; no independent uncontrolled re-resolution. |
| Redirect to foreign host, sibling, untranslated alias; self-loop; chain beyond five | Reject; no request outside exact allowed representation. Singleton proposals admit no redirect. |
| 403/404/5xx; empty 204; partial 206 | Block transport or incomplete/empty/full-hash mismatch as appropriate; never infer full content merely from 2xx. Document existing 2xx behavior. |
| Wrong/missing media; malformed UTF-8; unsolicited compressed response | Reject at relevant transport/identity boundary; no profile decompression. |
| 65,537 bytes or declared excessive Content-Length | Reject body cap. Generic boundary accepts at most 65,536 bytes, but size alone cannot make altered source material pass its fingerprint. |
| Exactly 65,536 bytes at transport seam | Exercise inclusive cap independently of source-profile matching; no invented oversized accepted MOFA fixture. |
| Slow DNS, headers or body crossing the 10s deadline | Abort/block with no accepted retrieval. |
| Truncated stream, stream error, incomplete multibyte sequence, matching prefix followed by extra data | Reject; no prefix hashing or early verifier acceptance. |
| Unknown/retired/duplicate-current profile, wrong profile version; catalog unavailable/v1/incoherent | Block before DNS/HTTP. |
| Same external review key assigned to competing item; same URL across conflicting streams; manually identified same-item duplicate with distinct keys | Graph rejection where enforceable; otherwise registration review rejection. No claimed automatic semantic deduplication. |
| Every forged binding field and extra output field; mutable descriptors/accessor/extra caller fields | Rebind/reject and preserve frozen input; caller-supplied verifier/body/proof never grants authority. |
| Reviewed changed pin, unchanged v1, old/new representation pins | Old pin remains immutable; only separately reviewed version matches; historical/retired entries cannot become current implicitly. |

## 9. Fresh source and retrieval ledger

Receipt times are UTC. Each record's source label resolves to the exact request URL in section 3; **its final URL is identical**. All 17 recorded navigations/requests had an empty redirect chain `[]`, `Content-Type: text/html`, a completed body and no reported transport failure. The Node probe's error-body completion is forensic only. Browser completion is the document response's CDP loading-finished event, not completion of all page assets. An initial exploratory normal-browser navigation established availability; only the subsequent instrumented captures below are relied upon for byte/timing/header claims.

Clients: `node-1` = first direct pass; `node-2` = direct repeat after browser success; `browser` = isolated headless Chrome; `iab` = normal Codex in-app browser with document cache disabled for the capture. Direct byte counts/hash cover complete received **unencoded** body bytes. Browser byte counts/hash cover the complete **decoded CDP response body**, not compressed wire bytes or reserialized DOM. All browser cache/SW flags were false. Raw body files and collection scripts remained outside the repository; no scraped source fixture or executable is delivered.

| Receipt | HTTP | UTC start | UTC finish | Bytes (scope above) | SHA-256 of captured response bytes |
| --- | --- | --- | --- | ---: | --- |
| node-1-R01 | 403 | 2026-10-05T19:10:33.677Z | 2026-10-05T19:10:33.743Z | 431 | `1a88ff692087ca321628fc0a27d1c267358a2e70d75a7743ac140febbf22ea57` |
| node-1-R04 | 403 | 2026-10-05T19:10:33.743Z | 2026-10-05T19:10:33.770Z | 418 | `8c2d5fa17738091e8f55ea0c7a30c6e4e0639d81a7c24ab3e3996b4259585154` |
| node-1-R02 | 403 | 2026-10-05T19:10:33.770Z | 2026-10-05T19:10:33.797Z | 425 | `73eb97ff0a8c03850d30db3659d2a78ca9d129dff544ec0585585bf2a817923a` |
| node-1-R03 | 403 | 2026-10-05T19:10:33.798Z | 2026-10-05T19:10:33.827Z | 406 | `f32e3d781131a5e0764c2414b6314268212b6d415fc67c48ecf18b5554db19fc` |
| node-1-R10 | 403 | 2026-10-05T19:10:33.827Z | 2026-10-05T19:10:33.855Z | 414 | `043f00b758d78d966d627b536d26b722d7a771afb542213fc52165843525f1da` |
| browser-R01 | 403 | 2026-10-05T19:10:51.839Z | 2026-10-05T19:10:51.875Z | 431 | `437701d1061034d9310915a111a6da3da3a4180b7994748e5294352565e525df` |
| browser-R04 | 403 | 2026-10-05T19:10:51.980Z | 2026-10-05T19:10:52.011Z | 418 | `47c60c2c56cd1a9f7c32cbd44946c32ca7b2a100ee756cbdfe684a53a4e92127` |
| browser-R02 | 403 | 2026-10-05T19:10:52.117Z | 2026-10-05T19:10:52.156Z | 425 | `b1b6197e4b3795090e0a73cd9a6a0c39c511a76140da862604735f3ad1f85336` |
| browser-R03 | 403 | 2026-10-05T19:10:52.270Z | 2026-10-05T19:10:52.305Z | 406 | `c51092d1a42d26985e06b84b0d6da5164694e71962a5fea9bc2ac1c32a043c19` |
| browser-R10 | 403 | 2026-10-05T19:10:52.404Z | 2026-10-05T19:10:52.436Z | 414 | `720ee7cdb19dd17f619f8acfe01007b56d8f5291533496eb146a8f31b6256194` |
| iab-R01 | 200 | 2026-10-05T19:12:21.818Z | 2026-10-05T19:12:21.876Z | 26479 | `3608ea8671f93f924239cb4a49b0e8a686bc751f55511187362162ed961ce462` |
| iab-R04 | 200 | 2026-10-05T19:13:03.151Z | 2026-10-05T19:13:03.859Z | 34132 | `dbfb355367f62924402fe3682c064f60d40aaf2b2480d96e1aa84b2399194dff` |
| iab-R02 | 200 | 2026-10-05T19:13:08.904Z | 2026-10-05T19:13:09.149Z | 31857 | `c82354d1b211d7e6844a724db6fb6b92523668e0a9958da12ef216912c9b07e3` |
| iab-R03 | 200 | 2026-10-05T19:13:10.227Z | 2026-10-05T19:13:10.606Z | 33823 | `c7662cabf3f0dcb3ce05700260e73a8ca4d169a00c710ae2e1f72f79ccfe6875` |
| iab-R10 | 200 | 2026-10-05T19:13:10.736Z | 2026-10-05T19:13:10.975Z | 43440 | `53e7f5dae29614fd5efb77240e6abb7fed366a6ac4a6f2cb663a421aa0b2a202` |
| node-2-R01 | 403 | 2026-10-05T19:13:44.110Z | 2026-10-05T19:13:44.202Z | 431 | `8c9806c9bda513297a0c131d1da34eebebc1b2f1459612227bf76fdda377c509` |
| node-2-R04 | 403 | 2026-10-05T19:13:44.203Z | 2026-10-05T19:13:44.235Z | 416 | `736c8bc4d8491279e8bcad9effa7ecba8c8527884a272bb76a9c1b35d968b596` |

### Relevant headers and transport observations

Every direct response: `server=AkamaiGHost`, no Content-Encoding, `connection=close`, `content-length` equals its ledger byte count, Date and Expires equal the HTTP-second of its UTC start, no ETag or Last-Modified. Shared headers: `strict-transport-security=max-age=15768000`, `x-content-type-options=nosniff`, `x-frame-options=SAMEORIGIN`, `x-xss-protection=1; mode=block`, `expect-ct=max-age=86400`, `mime-version=1.0`. The repeated R04 denial has a different length/hash because the denial reference is mutable, not because it is a different legal publication.

Every headless response: the same denial/header class, but no Connection header was recorded; its Date/Expires are respectively `19:10:51`, `19:10:52`, `19:10:52`, `19:10:52`, `19:10:52` UTC in source request order R01/R04/R02/R03/R10. Content-Length equals ledger bytes; no encoding, ETag or Last-Modified. Headless uses a clean context without stored credentials, disables document cache and blocks non-navigation research subresources. Normal browser credential-state qualification is limited as described in section 6.

All direct DNS sets were `{2a02:26f0:f3:881::3ead (IPv6), 2a02:26f0:f3:886::3ead (IPv6), 104.77.19.97 (IPv4)}` and passed the unchanged baseline public-IP guard. Actual direct socket: `2a02:26f0:f3:881::3ead`, authorized TLSv1.2. Headless socket alternated those two public IPv6 addresses. Normal-browser socket: `2a02:26f0:f3:886::3ead`, HTTP/2, TLS 1.2, certificate subject `www.mofa.go.jp`, issuer DigiCert Global G3 TLS ECC SHA384 2020 CA1. Browser observations are not a substitute for connection-bound server DNS validation.

Every successful normal-browser response: `server=AmazonS3`, `content-encoding=gzip`, `vary=Accept-Encoding`, `accept-ranges=bytes`, `x-amz-server-side-encryption=AES256`, plus the same HSTS/nosniff/frame/XSS/Expect-CT headers above. Request IDs are ephemeral diagnostics; the storage version below is explicitly not an item identifier.

| Receipt | Date (UTC, HTTP seconds) | Content-Length (encoded) | Last-Modified (GMT) | ETag | x-amz-version-id |
| --- | --- | ---: | --- | --- | --- |
| iab-R01 | Mon, 05 Oct 2026 19:12:21 GMT | 6859 | Sun, 21 Jun 2026 16:57:24 GMT | `"01c2822e4142a1022ea14a8384d1393c"` | `fXHbwAJ6L1eVC1Jxot.Nf8dZxrqtLAMz` |
| iab-R04 | Mon, 05 Oct 2026 19:13:03 GMT | 9842 | Sun, 21 Jun 2026 17:26:27 GMT | `"856b2c326fa211aa7aa07eb9275a011c"` | `PUooC8ciWPECj_04b7x144PnIM8u94ZM` |
| iab-R02 | Mon, 05 Oct 2026 19:13:09 GMT | 8027 | Tue, 30 Sep 2025 08:28:31 GMT | `"b95d7b7dad10d95b0e57c34b2445c77f"` | `QRRKWlghTtZo2ktEnCEdYMwvJkgmtXg0` |
| iab-R03 | Mon, 05 Oct 2026 19:13:10 GMT | 8959 | Wed, 24 Jun 2026 07:01:35 GMT | `"571ab35d714dae02b9a073e01d96233f"` | `OSsBYuYiYlVe9cdAyJ5nreMJcgn_Pw6d` |
| iab-R10 | Mon, 05 Oct 2026 19:13:10 GMT | 10886 | Wed, 24 Jun 2026 07:12:58 GMT | `"4a02d49910aa4dc24fd5ec34a6c8f8cb"` | `N6KWc_qel11l3ZRIiuVd1aZY8lKZpz3E` |

### Normalized full-text fingerprints (research candidates only)

These use the existing Jetnity newline-normalization rule. They cannot be treated as approved pins or server-owned retrieval receipts. The decoded byte hashes above deliberately differ where CRLF is present.

| Source | SHA-256 after CRLF/CR to LF |
| --- | --- |
| R01 | `ba91f4191fbd6e96a719cda06f6545b878afc63fb9fdde92b1ff631c4206750f` |
| R04 | `5628381b37770d05982e2e43d0ae989b637f37c54192f9900ee1c5482d4aac90` |
| R02 | `ed27e1e592edea3ba3f0cd12949085b9c717abe82b6007d39a735dd9acfc8583` |
| R03 | `42346cf811b9705e4966f70c4b5a062ac2b8662cc36c254b48b2f23ae55112bb` |
| R10 | `b2ff424782cdec5ea45c4b71ab252dc92b6e76b182c2ca4154b34ea32df4ae80` |

## 10. Delivery boundary

The four delivery documents plus immutable TASK are the entire PR file set. Research scripts/receipts are scratch material outside the checkout, and none become runtime fixtures. No runtime/test/profile/registry change, database action, migration, extractor, composition policy, accepted Evidence, Rule acceptance, F8, Production, CH import/CH-11, Trip Workspace/B01 work, Ready transition, merge or follow-up slice occurred.

Exact pushed head, remote Changed Files, merge-base/ahead/behind, fresh #851 overlap comparison and exact-head CI/Vercel are reported in the delivery readback after push. This document does not claim that a pre-push CI result verifies a future head.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
