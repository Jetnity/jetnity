# Official Truth Source Identity Granularity Reconciliation 1 — Task

Date: 4 October 2026
Issue: #806
Baseline: `main@dd001c7b1267792056f1d3cbd743aead716777fb`
Branch: `docs/official-truth-source-identity-granularity-reconciliation-1`
Logical writer: **Jetnity Official Truth source identity granularity reconciliation 1**
Generation: **1**
Execution environment: **Codex Desktop**
Preferred model: **GPT-6 Astra — Sehr hoch**
Status: **DOCS-ONLY ARCHITECTURE / NO SOURCE REGISTRATION / NO MIGRATION / NO F8**

## Purpose

Resolve one concrete live architecture conflict before any real GOV.UK source registration.

Current source authority/catalog semantics make one hostname belong to exactly one `sourceId`.
Current composition semantics require two different official content items from the same publisher to be representable as two distinct composition supports.

GOV.UK ETA is the adversarial real shape:
- National List = one content item;
- Appendix ETA = another content item;
- both under GOV.UK / `www.gov.uk`;
- HTML + Content API of one base path are two representations of one content item, not two composition supports.

This task must choose one canonical identity model that preserves the existing SSRF/domain trust boundary while making those semantics executable.

Live code/evidence overrides this task if the repository changes after the baseline.

## Binding startup gate

Before material work:

1. fetch live `origin/main`;
2. require exact baseline `dd001c7b1267792056f1d3cbd743aead716777fb`, otherwise STOP and report;
3. read `.jetnity/operating-mode.json`, require `NORMAL`;
4. read #751;
5. read only #748 MATERIAL newer than marker `5971622750`;
6. inspect open PRs/writers;
7. confirm #806 / this branch is the only overlapping Official Truth writer;
8. verify Development source catalog is still empty and Production Official Truth source tables still absent by using existing repository evidence / read-only live state if available;
9. no mutation.

Read at minimum:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/OFFICIAL_TRUTH_SOURCE_EVIDENCE_ARCHITECTURE_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_CTA_REGION_PIN_SOURCE_AUDIT_1_REPORT_2026-10-04.md`
- `lib/readiness/source-registry.ts`
- `lib/readiness/official-truth-source-catalog-server.ts`
- `lib/readiness/official-truth-server-owned-retrieval.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/official-truth-same-request-proof-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `supabase/migrations/20261001121258_official_truth_private_evidence_store_schema_1.sql`
- `supabase/migrations/20261001193748_official_truth_source_catalog_gateway_1.sql`

## Live conflict to re-prove

Do not merely repeat this task. Re-prove all of it:

### Current source trust model

- `private.official_source_domains.domain` is the primary key.
- One hostname belongs to one source.
- `quellenRegistryErstellen` rejects equal/parent-child overlap across different source ids.
- `quellenUrlAufloesen` resolves a URL primarily by domain.
- `official_truth_source_catalog_v1` stores/registers source + domains under the same semantics.
- Development catalog currently has zero rows.
- Production Official Truth source tables are not applied.

### Current composition model

- same publisher is not automatically the same composition support;
- two different official content items can be needed jointly;
- two representations of one content item are not a composition;
- the current composition architecture describes two GOV.UK content items as two distinct source ids;
- the current composed extractor/policy machinery uses source-id sets and requires distinct source ids for composed quality.

If any item above is no longer true, make that the starting point of the decision.

## Required conceptual separation

The selected architecture must define these identities precisely:

1. **Authority identity**
   - government/competent authority or publisher trust;
   - domain ownership/allowlist boundary.

2. **Content-item identity**
   - one official publication/document/item;
   - survives multiple renderings/representations where safe;
   - cannot be caller/model invented.

3. **Representation identity**
   - HTML/API/PDF/etc. rendering of one content item;
   - exact URL/content type/retrieval bytes.

4. **Evidence-version identity**
   - exact accepted evidence version bound to content and scope.

5. **Composition-support identity**
   - identity used to decide whether two supports are genuinely distinct legal/content items rather than two renderings of the same one.

6. **Runtime provenance identity**
   - what later provenance records must retain so an accepted result can be explained and rechecked.

## Required canonical decision

Choose exactly one architecture. Do not leave alternatives unresolved.

At minimum compare:

### Option A — authority-level `sourceId` + separate content-item identity

Potential shape:
- existing `sourceId` continues to identify the registered authority/domain trust boundary;
- a new server-owned immutable content-item identity identifies a publication/document under that authority;
- Evidence and composition get both identities;
- composed distinctness is based on content-item identity, not authority sourceId.

### Option B — content-item-level `sourceId`

Potential shape:
- redefine sourceId as content item;
- permit multiple source ids on one hostname;
- source resolution must become source-aware / exact-path-or-item-aware before retrieval;
- domain trust must move to a separate authority/domain layer.

### Option C — another design

Allowed only if demonstrably smaller, safer and compatible with all invariants.

The selected design must explain why the rejected options are inferior for Jetnity.

## Binding safety invariants

The architecture must preserve all:

- caller/model/plugin cannot mint authority identity;
- caller/model/plugin cannot mint content-item identity;
- domain trust is code/server-held, never request-supplied;
- a URL on an allowed government domain does not automatically become an approved content item;
- two renderings of one content item cannot satisfy composed distinct-support requirements;
- two genuinely distinct content items from one authority/domain can satisfy composed distinct-support requirements;
- no first-match behavior when many items share a host;
- no path prefix can accidentally authorize a sibling publication unless explicitly designed;
- redirect cannot silently change content-item identity;
- final URL and content-item identity must remain bound after redirect;
- content-id metadata from the response is not trusted merely because the model/request named it;
- source/content identity must be server-reproved before extraction;
- accepted Evidence remains deterministic and fail-closed;
- no existing `unknown != not_required` / stale/conflict rules are weakened;
- F8 remains separate.

## Exact ownership mapping

For the selected design, specify the exact meaning and future changes for:

### Source registry/catalog

- `QuellenEingabe`
- `RegistrierteQuelle`
- `QuellenRegistry`
- domain table
- source catalog RPC
- registration semantics
- overlapping domains
- blocked domains
- source URL resolution

### Evidence

- `EvidenceVersion.sourceId`
- whether a new content item id is required;
- lookup-key semantics;
- version id semantics;
- accepted Evidence reader;
- refresh comparison;
- canonical URL;
- content hash;
- previous-version chain.

### Same-request proof/retrieval

- proof support shape;
- frozen registry snapshot;
- source/content identity;
- retrieval input;
- redirect rules;
- fresh hash binding;
- replay transport;
- source identity refresh.

### Extractor registry

- `sourceIds` selector semantics;
- source-family semantics;
- exact URL/content-item pin;
- multiple renderings;
- duplicate match behavior.

### Composition policy

- pre-HTTP match key;
- `sourceIds` / support-set semantics;
- `same_source_composition`;
- `ambiguous_structure`;
- policy assignments;
- provenance rows.

### Rule Claims

- distinct official-primary support requirement;
- whether distinctness remains authority-source-based or moves to content-item identity;
- `supportVersionIds`;
- `evidenceQuality`;
- canonical acceptance remains `regelKandidatAkzeptieren`.

### CTA region pin

State exactly what `RegulierungsRegionPin.sourceId` should mean under the new design.
If another identity field is required for specific content provenance, define it.
Do not implement it.

### Database

Specify schema implications for:
- `private.official_sources`
- `private.official_source_domains`
- `private.official_evidence_versions`
- source-catalog RPC
- accepted-Evidence store
- any new table/key if selected.

Development currently has no source/Evidence rows, so the design must explicitly analyze whether a clean schema evolution is possible without data backfill.
Production remains a separate Product-Owner gate.

## Adversarial scenarios

The final architecture and self-review must test all:

1. National List and Appendix ETA: same GOV.UK host, genuinely different content items.
2. HTML and Content API for National List: same content item, different renderings.
3. CTA guidance HTML and Content API: same item.
4. One authority publishes hundreds of unrelated documents on one host.
5. One item moves path but retains official content identity.
6. One path starts serving a replacement/different content item.
7. One item is mirrored under a second official domain.
8. One authority uses a subdomain and parent domain.
9. Caller supplies valid GOV.UK URL but invented content item id.
10. Model extracts a real-looking GOV.UK content_id from unrelated bytes.
11. Response content id disagrees with server-held expected item.
12. Redirect crosses to a different content item on the same host.
13. Redirect crosses to another approved official host.
14. Two representations of one item try to satisfy composed quality.
15. Two different items from same authority try to compose.
16. Two different authorities happen to publish identical bytes.
17. Content item changes publisher/authority metadata.
18. Evidence was accepted under old identity semantics.
19. CTA pin needs one exact content item while domain trust remains authority-level.
20. source catalog is empty at rollout, then first real source/item is registered.
21. Production remains unapplied while Development evolves.

## Backward compatibility / rollout

Because current Development source and Evidence tables are empty, determine whether the cleanest migration is:
- additive identity layer;
- schema replacement before first real row;
- or another bounded transition.

Do not use “no rows” as permission to weaken constraints. Use it only to avoid unnecessary legacy-data migration complexity.

The selected rollout must define:
- first runtime slice;
- first schema/migration slice if needed;
- order of Development apply vs runtime code;
- exact Product-Owner gate for Production;
- how CI/test fixtures remain deterministic;
- when the first real GOV.UK authority/content item may be registered.

## Required classification

The primary document ends with exactly one:

`SOURCE_IDENTITY_RECONCILIATION_READY_FOR_RUNTIME_SLICE`

or

`SOURCE_IDENTITY_RECONCILIATION_BLOCKED`

If READY:
- give exact chosen model;
- exact next runtime/schema slice;
- exact file ownership;
- exact migration/data implications;
- explicit stop before real source registration.

If BLOCKED:
- name the unresolved question and smallest evidence/audit needed.

## Required outputs

Create only:

- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_REPORT_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_HANDOFF_2026-10-04.md`
- `docs/OFFICIAL_TRUTH_SOURCE_IDENTITY_GRANULARITY_RECONCILIATION_1_SELF_REVIEW_2026-10-04.md`

Task seed is the fifth changed file and must remain byte-identical after dispatch.

## Hard boundaries

Docs-only.

Do not edit:
- `lib/**`
- `app/**`
- `components/**`
- `types/**`
- `hooks/**`
- `supabase/**`
- package/config/runtime files
- global current-state files.

Do not:
- register any source;
- mutate Development;
- mutate Production;
- create/apply SQL or migration;
- add a GOV.UK sourceId/content item;
- add a CTA pin;
- add an extractor;
- add a composition policy;
- modify acceptance/store/F8;
- import CH evidence;
- work on #626;
- change launch/indexing.

## Validation before STOP

- re-fetch live main/mode/#751/#748;
- verify no writer collision;
- `git diff --check`;
- exactly five changed docs files;
- task seed byte-identical;
- no runtime/test/config/schema file changes;
- every live-contract statement rechecked from code/schema;
- Development/Production state claims from read-only evidence only;
- exact final head.

Remain Draft.
Do not Ready.
Do not merge.
Do not start follow-up.

STOP for independent Technical-Lead exact-head review.
