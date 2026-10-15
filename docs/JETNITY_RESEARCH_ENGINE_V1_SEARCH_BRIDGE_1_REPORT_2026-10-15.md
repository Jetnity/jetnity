# Search Bridge 1 — Author report

Author: **Jetnity Research Engine V1 Search Bridge 1 — Codex Generation 1**. Executed 16 October 2026 (Europe/Zurich). [Issue #952](https://github.com/Jetnity/jetnity/issues/952), existing [Draft #953](https://github.com/Jetnity/jetnity/pull/953). This is an offline, dormant implementation, not a live research service or Technical-Lead approval.

## Implemented contract

`discoverOfficialTruthSearchBridgeOffline` composes the existing `discoverOfficialTruthSourcesOffline` twice. The first call validates the complete empty-candidates envelope and produces canonical intents. A synchronous frozen snapshot preserves that exact validated scope, coverage, descriptors and full identity graph across awaits. The second call validates every returned pair against the same envelope. The bridge does not implement source classification, URL permission, content identity, Evidence acceptance or Rule acceptance.

| Requirement | Implementation and evidence |
| --- | --- |
| D1 / T01 | Injection-only async `SearchHitPort(intent, signal)`, implemented only in tests. Missing transport fails closed. Current, malformed and no-authority inputs never invoke it. No global configuration or application importer. |
| D2 / T03–T05 | At most six V1 intents, invoked sequentially; at most 16 raw hits across the whole operation, without truncation. Dense plain arrays of exact `{url}` data records only. URL strings at most 4096 UTF-16 code units; combined URLs at most 16,384 UTF-8 bytes. No provider sourceId, snippet, score, redirect or extra field accepted. |
| D2 / T03 | sourceId comes only from the immutable intent. Pairs sort by sourceId and raw URL. Duplicates remain present so V1 rejects canonical duplicates atomically, including aliases and repeats across queries. All exact-host, source, tracker, scope and representation checks remain in V1. Unknown/spoofed hosts fail without echo. |
| D2 / T05 | Caller AbortSignal; whole-operation deadline 1–5000 ms, default 1000. No retries or fallback. Abort/timeout/error discards all prior hits. Bridge timer/listeners are removed, child signal aborted, observer callback cleared; late ordinary native Promise success/rejection cannot publish stale data. Tests use mocked clocks, concurrent operations and caller-envelope mutation. |
| D3 / T06 | Every output is `officialResult: unknown`, `sourceQualified: false`. Empty/licensed-only registry returns `no_eligible_official_source` plus `authorityRegistration: independent_registration_required`. Empty hits return `no_candidate_hits`. No quarantine registry or speculative host admission. |
| D4 / T02 | Synthetic CH citizenship, explicitly linked CH passport, VN destination. Ordinary passport, tourism and 21 days are scenario notes only; unsupported legal dimensions are not inserted into canonical scope. A pre-registered `authority.example` fixture produces two `candidate_only` URLs through unchanged V1. Empty-registry and unknown-host cases separately fail honestly. No Vietnamese visa rule, authority, licence or retrieval is asserted. |
| T07–T08 | Cold-import/full-fake-execution traps report zero network/DB attempts. Runtime import closure reaches existing V1/identity/URL modules only, and no app/lib/script runtime entry imports the bridge. Existing identity importer guard unchanged. `requirementsProviderAus()` still returns null. Canonical regressions: 126/126. |

The injection seam is a **trusted code-owned dependency**, not a sandbox for arbitrary JavaScript. It refuses callable proxies, bound/native functions, generators, decorated callbacks and foreign thenables where safely detectable. Result accessors/proxies/cycles/functions/metadata are rejected without executing getters or serializing rejected content. Native Promise symbol fields used by Node async hooks are tolerated without inspecting their values; string decorations are rejected and safe native settlement observed through the intrinsic. An own Promise constructor is refused without reading it. A malicious executable callback can still block the event loop, perform side effects, or create a hostile/noncooperative promise; this module cannot contain such code or cancel resources it owns. A future trusted adapter must release its own resources on abort and return an ordinary undecorated native Promise. No such adapter is installed here.

## Local verification and actual failures

Node 22.23.3; official-registry `npm ci` succeeded. Next/eslint-config-next 16.4.1 and Sharp 0.35.5 preserved; no package/lock changes. Install audit reported the existing 18 advisories (16 high, 2 moderate); remediation is outside this slice.

| Check | Result |
| --- | --- |
| New bridge tests | 34 passed, 0 failed/skipped |
| Bridge + V1 discovery + content identity/import guard + URL candidate regressions | 126 passed, 0 failed/skipped |
| Typecheck, lint | PASS |
| Setup CI, operating mode, API protection, schema references, dead code, exports, dependencies | All PASS, unchanged scripts |
| Production build | PASS, Next.js 16.4.1; local compilation only |
| Full unchanged `npm test` | **NOT locally green**: 6820 tests, 6809 pass, 10 fail, 1 existing skip; exit 1 |

All ten failing local tests require unavailable native PostgreSQL 16 (`initdb` ENOENT / `local_postgresql_not_available` / explicit NOT_VERIFIED). Affected proofs: catalog hardening; accepted-store workspace refusal; content-identity schema v2; R3 canonical URL publication; R4 structural custody and composed bundles (two tests); R5 legacy consumers; M1–M4 lifecycle; source catalog gateway; trusted store gateway. The existing declaration native-PG test self-skipped. No test was changed, filtered out of the full run, or made to pass via hosted fallback. CI must supply the missing real local-PG proof; successful non-PG checks do not substitute for it.

Initial author iterations also found a test syntax error, three readonly fixture-assignment type errors, and an overstrict native Promise check that rejected Node test instrumentation. Those were corrected solely in the new namespace; the final focused run passes. The earlier checkout DNS block remains historical; normal GitHub/npm access succeeded after the new explicit [Owner authorization](https://github.com/Jetnity/jetnity/pull/953#issuecomment-6203268440). No proxy/mirror/new credentials or permission changes by the author.

Post-publication CI/Auth/Preview, exact final HEAD/tree, review threads and main drift are recorded in the final **Author Handoff comment on PR #953**. They cannot be certified by the pre-publication local checks above. The receipt will refer to this committed document; no self-referential commit hash is embedded here.

## Future activation packet — not authorization or implementation

1. Use the existing server-held boundary `official-truth-server-held-source-registry.ts` backed by `quellenKatalogLesen` in `official-truth-source-catalog-server.ts`. The future server owns the registry snapshot and approved identity profiles; a browser, model, search result or user envelope cannot supply authority. This offline injection interface must not be exposed as a public live authority endpoint. No catalog/RPC is invoked in this slice.
2. Product Owner must separately select a specific provider/endpoint, approve its terms, reuse rights, privacy and retention, permitted non-personal query fields, exact outbound hosts and cancellation behavior. Only the V1 intent fields may leave this boundary; no traveller identifier, passport number, MRZ, email or private trip context. No raw snippet/content retention or search-result database, and no search result transformed into first-party visa rules.
3. Proposed future ceiling: **USD 10 per calendar month, hard stop before a request could exceed it**, counting paid units/tokens and reserving in-flight cost; not an approved spend. Current approved/implemented live spend remains **USD 0**, live calls zero. Keep at most six requests and 16 hits per operation, no automatic retries or provider failover. A separately reviewed server-owned kill switch defaults OFF, stops admission and aborts active requests, and cannot be overridden by a user payload. Provider-side quota alone is insufficient; unknown cost/usage must fail closed. None of this live budget infrastructure is activated here.
4. Any unknown authority host requires independent primary-source ownership/authority and legal-use vetting followed by controlled registration through the existing catalog process. Search rankings, `.gov` spelling and agreement between engines/models never provide that proof. For Vietnam with no approved registered authority the result stays a gap.
5. Even after search approval, governmental GET requires its own explicit authorization and existing `official-truth-server-owned-retrieval.ts` protections. Content identity, rights, Evidence review and accepted Rule review remain separate gates. #917 SOURCE_NOT_QUALIFIED and #944 no BP1 GET/no ministry contact remain binding. Provider remains OFF until a separately authorized integration proves all applicable gates; this report starts no follow-up.

## Read-only technology options (public documentation read 16 October 2026)

| Candidate | Public facts and unresolved adoption gates |
| --- | --- |
| Brave Search API | [Pricing](https://brave.com/search/api/): USD 5/1000 search requests, USD 5 monthly credits. [Terms §3(b)](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) restrict storing/caching/results databases except transient operation. [Privacy notice](https://api-dashboard.search.brave.com/documentation/resources/privacy-notice): payment information required, search queries retained up to 90 days. Final rights/retention/DPA suitability remains unapproved. |
| Tavily | [Pricing](https://www.tavily.com/pricing): 1000 free monthly credits; pay-as-you-go USD 0.008/credit. Credits are not necessarily one search each. Exact selected operation costs, terms, reuse rights and retention remain unapproved/UNKNOWN for Jetnity. |
| OpenAI web search | [Responses tool documentation](https://developers.openai.com/api/docs/guides/tools-web-search) describes optional `web_search`; [API pricing](https://developers.openai.com/api/docs/pricing) lists USD 10/1000 web-search calls plus applicable search-content token charges. Separate API billing, not an entitlement automatically supplied by ChatGPT. No model/provider is chosen; rights, retention and all-in cost need separate review. |
| Google Custom Search JSON API | [Official overview](https://developers.google.com/custom-search/v1/overview): closed to new customers; not a newly available provider choice. |

These are decision candidates, not accepted contracts or legal clearance. Only public documentation pages were read; no real search query, account signup, payment entry, API token, SDK integration or provider request occurred.

## Preserved stops

No canonical source/identity/Rule/importer-guard change; no API/UI, Auth/RLS, Supabase/SQL, secrets, packages, workflow, security-setting or Production change. DEV-PREP-1 blocked readback/second migration, #913 privacy remediation block, #937 pause, #934 hard stop and #626 reservation remain intact. No private raw logs, archived personal evidence or local user paths are published. Self-review is not TL PASS. Draft stays Draft; no merge/deploy/follow-up. Owner restores temporary Full Access to **Für mich genehmigen** after author completion/stop and confirms it independently.
