# Source identity granularity reconciliation 1 — adversarial self-review

Date: 4 October 2026 (Europe/Zurich)
Issue #806 / Draft PR #807 / Generation 1
Writer: **Jetnity Official Truth source identity granularity reconciliation 1**
Branch: `docs/official-truth-source-identity-granularity-reconciliation-1`
Baseline: `dd001c7b1267792056f1d3cbd743aead716777fb`
Dispatch: `21eccd3b54f8b6f2eda86312271e909e269422dc`
Execution: Codex Desktop, `gpt-6-astra` / `xhigh`
Status: **AUTHOR SELF-REVIEW ONLY / NOT TECHNICAL-LEAD PASS**

## Review method

I checked the selected architecture against the actual baseline symbols, migration keys, live table-inspector output, fresh GOV.UK identity observations and existing tests. Proposed behavior is not described as already implemented. The 21 traces below are adversarial tests of the specified contract. The 87 executed tests and eight direct registry assertions validate the current implementation only; they do not prove a future v2 implementation.

The [primary document](OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md) selects A, rejects B/C and ends with one readiness classification. Its readiness means the pure R1 foundation has a defined task boundary. Real identity-profile implementation/registration, schema apply, legal composition, persistence and F8 remain unimplemented/gated.

## Required adversarial cases

| # | Attack / counterexample | Design result and why |
| --- | --- | --- |
| 1 | National List and Appendix need separate support despite one GOV.UK host | Same authority id, different registered item pairs. Exact content-item sets select policy; observations and version maps keep both. Current source-id collision is removed at support level without changing domain ownership. |
| 2 | National List HTML and API have different URLs/hashes, so count twice | Rejected: one item pair. Two representation streams cannot raise distinctness. Version ids differ without becoming two supports. |
| 3 | CTA HTML and API appear to corroborate membership | One item only. Pin binds one approved representation; the audit's oversized HTML is not exempt from the retrieval ceiling. |
| 4 | Register host once and admit hundreds of arbitrary paths | Rejected. Authority resolution alone never yields content permission; an exact active URL binding must exist and be unique. Unregistered siblings stay ineligible. |
| 5 | Move same official item to a new path and auto-update Evidence | Ordinary refresh blocks. Only a reviewed descriptor transition plus fresh identity reproof can create a new version in the same representation stream. Old evidence URL is immutable. |
| 6 | Reuse an old path for replacement content and retain old item id | Response-own-id mismatch blocks before extraction. New item registration requires explicit historical-URL retire/rebind review, not silent path identity inheritance. |
| 7 | Mirror same publication on another official domain to gain a support | A reviewed mirror under the same source/item stays one pair; each representation has its own pin. Cross-authority publication is separately reviewed and cannot be silently treated as the old pair or as independent corroboration. |
| 8 | Parent/child authority domains create first-match ambiguity | Cross-source overlap remains rejected in registry and RPC. Same-source parent/child has identical authority; exact content binding remains unique. Denied child overrides parent allow. |
| 9 | Caller sends valid GOV.UK URL with invented contentItemId | Caller identity fields fail the public guard. URL-only hint must map to exactly one server-held descriptor; no registration or default item is created. |
| 10 | Model invents a plausible id or copies a linked page's real content_id | Model assertions are rejected. The pinned verifier reads the fetched response's designated own-root identity and expected metadata, not text search or linked-item ids. |
| 11 | Response metadata differs from expected id while bytes look official | Exact identity failure before matcher/extractor; neither domain approval nor supplied hash authorizes the mismatch. |
| 12 | Redirect to different content on the same host | Next target not in exact same-item representation chain; fail before next socket. Retaining sourceId is insufficient. |
| 13 | Redirect to another already-approved official host | Default deny. Only same authority/item/representation with a preapproved exact chain may proceed, with full SSRF recheck. Different authority fails regardless of official status. |
| 14 | Compose two renderings, or hide duplicate among three supports | Less than two item pairs is `same_content_item_composition`; duplicate item inside larger set is `ambiguous_structure`. Reject rather than deduplicate, pick newest or choose first. |
| 15 | Compose two real publications by same authority | Identity prerequisite can pass; each item maps to one accepted version and its own observation rows/citations. Complete fact/policy and existing acceptance gates still apply. |
| 16 | Different authorities publish identical bytes | Keep different authority/item/version identities. No hash deduplication and no automatic policy approval; byte equality does not establish legal independence or completeness. |
| 17 | Publisher changes silently beneath a stable item id | Expected publisher/authority metadata drift blocks. Same-platform metadata changes require new reviewed descriptor; a sourceId change creates a new pair and cannot join the old previous-version chain. |
| 18 | Historical ev1 Evidence has no item, so infer item from URL | Forbidden. V2 boundary rejects missing identity and v1 formats. Later nonempty migration precondition aborts; a separate audit/reproof can create new versions, never retrofit guessed ids. |
| 19 | CTA sourceId broadens to GOV.UK and pin loses exact item | Required item/representation/profile/version/URL/type/hash fields preserve exact provenance. No traveller-scoped Evidence row or second membership source is invented. |
| 20 | Empty Development schema evolves; first authority registration activates all content | Empty valid catalog is no eligible item/unknown. Authority-only registration still provides no item permission. First real item needs a separately reviewed identity profile and fresh server proof. |
| 21 | Development v2 works, Production schema absent | Missing RPC/schema is unavailable, not empty success; no v1 fallback or automatic Production apply. PO gate remains explicit. |

## Additional failure modes addressed during self-review

| Failure mode | Resolution in the specification |
| --- | --- |
| Two local ids for one external publisher item | Unique authority/namespace/external-id binding and reviewed equivalence registration prevent artificial support multiplication. |
| Two current representation definitions claim one URL | Reject the complete catalog at load and atomically prevent conflicting registration. No `.find` over publication candidates. |
| Distinct items collapse in policy observations | Replace source-only sets, assignment keys, observation attribution and version maps together with ContentItemRef. Merely changing the top-level distinctness check is insufficient. |
| Content type is used to resolve competing extractors after HTTP | One current extractor per factKind/item-set; preflight pins it before HTTP. A supported rendering branch is selected by proven representation, type verifies the frozen choice. |
| Root JSON contains duplicate ids/keys or an unrelated embedded id | Profile rejects ambiguous metadata and reads only own-root identity. HTML without a provable own-item profile remains ineligible. |
| Old review/freshness object still authorizes changed identity | Reproof and canonical review format change explicitly; old artifacts fail. Public F7 witness remains narrow and non-bearer. |
| Deny set disappears in v1 replay | V2 full snapshot must preserve it exactly; otherwise keep `blocked_domain_not_replayable`. No stripping. |
| Plain JSON reconstruction of graph or seal | Public entries reject caller graph/authority; live server flow is required and the composed seal remains non-JSON. Pure test seams are not authority. |
| Accepted reader appears to prove server origin | Explicitly identified as structural today and in v2. Server-owned fresh retrieval/profile verification is separate and required before extraction/store. |
| Metadata changes while content hash is stable | Descriptor identity and source metadata compare before hash short-circuit. No unchanged-hash bypass. |
| Old content hash is inaccurately called raw-byte hash | Retain the line-ending-normalized complete-text definition. Raw byte limit and UTF-8 checks remain separate. No parsed JSON/subfragment fingerprint substitution. |
| Validity change reuses Evidence id | ev2 canonical material includes validFrom/validUntil as well as complete identity and scope, unlike current ev1. |
| Multiple Evidence versions of one item are laundered through pure acceptance | Future constructor adopts one-version-per-item even in a larger support set. Remains one canonical constructor, not another acceptance engine. |
| Schema update changes only Evidence and breaks Rule-support FKs/grammars | S1 owns dependent Rule-support constraints; R2 includes existing research/coverage/applicability/version readers and fingerprint bridges. |
| No-row observation becomes a destructive shortcut | Later exact locked emptiness check; any rows cause abort. Additive tables/forward migration, no reset/backfill/cascade deletion. |
| Profile registry doubles as legal extractor | Identity-only verdict, no effects/predicates; single existing legal extraction pipeline preserved. Both require separate reviewed definitions. |
| R1 is too broad to review safely | New pure module/test/docs only, no non-test importer. Schema and coordinated existing-runtime wiring are later distinct tasks. |
| A successful composition seal unlocks F8 | Explicitly false. Branched composed acceptance, schema-1 persistence, autonomous composer/provenance retention and F8 remain separate. |

## Current-state qualifications

The source table's domain PK enforces equality uniqueness; parent/child non-overlap is enforced by registry and catalog RPC, not by that PK itself. Current URL resolution contains `.find`, but validated cross-source non-overlap makes authority selection unique; no publication-level lookup exists yet. The source-catalog RPC does not encode blockedDomains today. Current Rule acceptance checks at least two authority ids but is less strict than the extractor about repeated sources in a larger set. Current explicit-primary flat acceptance can accept multiple supports, unlike the extractor. The selected future item contract resolves both discrepancies explicitly rather than claiming the existing implementations are identical.

The #751 top/current assignment is consistent with live branch/main/PR evidence; its lower #801 references are historical residuals. No competing work was inferred from those stale paragraphs. The Supabase inspector's reported zeros agree with task/#751 evidence, but this author did not run exact count SQL or inspect live function grants. No schema application is justified by those observations alone.

Fresh public GOV.UK research proved identities/representation relationships and sizes only. It did not run Jetnity's DNS-bound live entry, verify a production catalog, accept Evidence or prove a complete ETA fact. The Appendix HTML full body is not byte-identical to its API body fragment, and this architecture does not require cross-format byte equality. Each eligible rendering needs its own verified profile.

## Validation / residual risk / conclusion

Executed: 87 existing tests passed without repository edits; eight registry assertions passed; operating-mode guard passed. The report records the corrected initial partial-test invocation and exact runtime mechanism. Adversarial v2 cases are reasoned contract checks, not fabricated implementation test results. Full CI/typecheck/lint/Production build were not run for this docs task. Exact final diff, task-byte and live-state checks are recorded in the report before STOP.

Residual implementation risk is concentrated in registry/profile binding, serializer version cutover and complete consumer propagation; the future tasks have explicit ownership and gates. Fresh real-source metadata/profile review is required before registration, and unexpected data aborts the no-backfill transition. None is an unresolved A/B architecture choice. No new ongoing cost, personal data, DB mutation, source registration, extractor, policy, pin or F8 work occurred.

Author conclusion: the docs are ready for **independent exact-head review**, with one selected architecture and all required adversarial cases specified. This is not an independent PASS. Remain Draft; no Ready, merge or follow-up slice.
