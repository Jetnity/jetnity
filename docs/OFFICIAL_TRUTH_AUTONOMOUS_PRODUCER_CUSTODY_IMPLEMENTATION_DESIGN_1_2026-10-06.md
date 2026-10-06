# Official Truth autonomous producer and metadata-custody implementation design 1

Date: 6 October 2026 · Issue [#862](https://github.com/Jetnity/jetnity/issues/862) · Draft PR [#863](https://github.com/Jetnity/jetnity/pull/863)
Live baseline: `main@9adfc04ffe90693dedc059f07a396751a0625157`
Logical writer: **Jetnity Official Truth autonomous producer custody implementation design 1**, Generation **1**.
Status: **DESIGN PROPOSAL / NOT IMPLEMENTED / PRE-F8**.

## 1. Decision, scope and binding contracts

Use one private server invocation to select an independently admitted global cell, resolve its original accepted-Evidence custody, select the complete support set, construct proposal-null review material, execute fresh proof/extraction and project the unchanged receipt together with its separate custody binding. No caller DTO, historical reader result or identifier can enter halfway through that invocation. A missing prerequisite yields no receipt.

This is a trust-enabler for the Travel Operating System: **Entscheiden**, **Reisebereit sein** and Multi-Citizenship / Entry Decision require exact official-source provenance. Traveller-specific evaluation remains compute-on-read in the existing Requirements engine. This design creates no competing law model, traveller context, UI, public endpoint or provider flow. It implements neither autonomous approval nor the future #741 decision policy.

Binding inputs, read from the live baseline:

- [Immutable TASK](OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_1_TASK_2026-10-06.md), blob `34b70bfcaebecd53bebe480df2d30b2317cf4a57`.
- [#855 receipt architecture](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md): exact `AutonomousProvenanceReceiptV1`, partial privacy admission, `C`, `H`, all preimages and live fact/seal identity.
- [#861 custody architecture](OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_2026-10-06.md): exact logical artifacts, independent origin, support selection and separate `CustodyDependencyBindingV1`.
- [#859 persistence architecture](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md): byte-preserving handoff, immutable dependency closure, bounds and historical-only verification.
- [Merged #857 report](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_REPORT_2026-10-06.md) and [handoff](OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_HANDOFF_2026-10-06.md), plus actual runtime. The TASK's illustrative `APPLICABILITY_SCHEMA_2_DORMANT_RUNTIME_FOUNDATION` filename does not exist; these are the actual merged documents.
- `JETNITY_START_HERE.md`, operating standard, `.jetnity/operating-mode.json` (`NORMAL`), live [#751](https://github.com/Jetnity/jetnity/issues/751), [#741](https://github.com/Jetnity/jetnity/issues/741), #862 and #863. The 6 October Codex-lane directive supersedes the historical Cursor model gate. The former Cursor run produced no design.

All new function/type names below are candidate contracts, not exports that exist today. No runtime, tests, SQL, migration, RPC, RLS, database call, retention decision, Evidence/Rule acceptance, F8, activation, secret, paid/provider/model call or Production change is made here. #866 and #867 own separate storage-design and lifecycle-packet paths; this design depends only on merged contracts.

## 2. Live reconstruction and exact seams

The following paths are under `lib/readiness/`. Function names identify the inspected baseline implementation; stale file comments are not the contract.

| Existing path / symbol | Observed behavior | Required later seam |
| --- | --- | --- |
| `official-truth-fact-entry-authority-server.ts`: `loadOfficialTruthFactEntryAuthority` | Loads current Admin capability with role grant and user-scoped database check. The existing bootstrap is owner/current AAL2; break-glass is insufficient. | Keep the live authority entry; no caller authority or new service identity. A background/autonomous identity needs its own authorization design. |
| `official-truth-source-catalog-server.ts`: `quellenKatalogLesen`, `quellenKatalogSnapshotAntwort` | One catalog read; complete v2 replay retains blocked domains, descriptors and request ordering. Graph profile availability omits executable verifiers. | Pin the actual complete graph and separately bind the actual executable profile release before replay. No second external catalog read. |
| `evidence.ts`: `akzeptierteEvidenceLesen`; `official-truth-accepted-evidence.ts`: `officialTruthAkzeptierteEvidenceAusAbruf` | First reads structurally accepted Evidence; second reconstructs and semantically accepts a candidate from submitted retrieval/extraction material. Neither supplies historical origin custody. | Resolve the independently issued custody closure first, then apply the existing semantic checks. Never call acceptance to backfill custody. |
| `official-truth-server-held-source-registry.ts`: `officialTruthServerHeldSameRequestMaterial` | Rebuilds submitted supports with a server catalog/clock; rebuilds review and fingerprint; freezes their projection. | A separate internal safe-material input from resolved custody; do not manufacture old envelopes or snapshots for this function. |
| `official-truth-rule-review-packet.ts`: `regelReviewBauen`; `official-truth-rule-review-fingerprint.ts`: `identitaet`, `kanonisieren`, `provenienzVergleich` | Public fingerprint entry rebuilds a packet requiring original material. Actual identity is `review-packet:v3:` and includes proposal. | Share the exact existing identity core through a narrow internal value seam; keep the external rebuilding wrapper. No second v3 algorithm. |
| `official-truth-same-request-proof-server.ts`: `decideOfficialTruthSameRequestProof`, `evidencePasst`, `kandidatPasst` | Captures one reference time, reads one catalog, checks freshness and freezes candidate/Evidence. Current input remains submitted research. | Share proof invariants after a safe server material constructor. Add canonical scope-value equality to key equality in the autonomous lane. Test injection is not live authority. |
| `official-truth-same-request-extraction-server.ts`: `regulatorischenScopeBinden`, retrieval loop | Rebinds scope keys; selects actual `requestUrl` immediately before `retrieve`; `Gebunden` and outer retrieval projection discard that URL. | Capture the actual selected URL and invocation-owned qualification before HTTP; retain it beside the actual result. Never reconstruct via `requestUrls[0]` later. |
| `official-truth-server-owned-retrieval.ts`: `decideOfficialTruthServerOwnedRetrieval` | Selects executable profile; verifies final URL/MIME/full body; hashes then captures `retrievedAt`. It proves content identity, not the stronger global/non-personal qualification. | Internal qualification before admitting a body hash; retain exact profile/transport contract and completion observation. Preserve URL/DNS/redirect/size/UTF-8 checks. |
| Extractor registry: `ausfuehren`, `definitionAusfuehren`, `herkunftFuer` | Primary selects after observed MIME. Success omits actual definition reference, source-family and semantic pins. Primary provenance is top-level field paths. | Retain selected executable reference/pins at execution; derive complete legal-slot citations under the pinned existing fact/locator contracts. Top-level paths alone cannot certify branch/atom coverage. |
| Composition registry: `officialTruthCompositionPhaseA`, `officialTruthCompositionPhaseB` | Phase A selects unique pair before HTTP; phase B returns seal and checked provenance. Outer extraction returns only `{status, seal}`. | Retain phase-A inputs, complete registries, frozen pair, phase-B result/provenance and seal together before outer projection. No reselection. |
| Extraction `material` | `structuredClone` copies the primary fact with the material object. | Private producer receives the actual successful `extrakt.fact` reference before this clone. Keep any legacy outward projection separate. Composition uses exactly `officialTruthCompositionSealView(seal).fact`. |
| `rule-claims.ts`: `regelFaktKanonischLesen` | Four-argument call remains legacy/v1; explicit fifth `{schema:2,jurisdictionCountryCode}` selects separate `RegelFaktV2`. Current extractor/policy callers retain old contract. | First producer supports existing legacy/v1 only. Reject schema-2 pins/carriers rather than cast `RegelFaktV2` to `RegelFakt`. Future integration requires explicit version review. |
| `official-truth-store-server.ts`: `akzeptierteRegelClaimSpeichern` | Schema 2 returns `schema2_not_persistable` before acceptance/dependencies; schema 1 remains `applicability_not_persistable`. | No call/import from producer. These guards and composed-branch acceptance restrictions survive unchanged. |

Two live corrections matter. #861's wording “eight `RegelScope` fields” conflicts with `regelScopeAusEvidenceScope`: the source-neutral value has **seven** exact fields: `destinationCountryCode`, `transitCountryCode`, `citizenship`, `credentialOption`, `residence`, `requirementType`, `validity`. `sourceId` makes the source-bearing Evidence scope eight. Admission `dimensionBasis` follows those seven actual source-neutral keys, with no invented eighth field. Also, #855/#859/#861 prose predates the merge of #857: schema-2 pure readers now exist, but this does not change their receipt or executable contracts.

## 3. Ownership, live handles and closed ingress

Separate three things: immutable **historical data**, an independently authorized **selection operation**, and ephemeral **custody of this invocation**. A value can serve the first purpose without granting either of the other two.

The candidate live root is an internal `runOfficialTruthGlobalProduction()` in `official-truth-autonomous-provenance-record-server.ts`. It accepts no request DTO, cell pin, callback, dependency injection or receipt. Its dependencies are statically wired server components. An already authorized server operation selects a bounded work item from an independently reviewed global work definition. No scheduler, queue or public entry is introduced by this design. A caller locator can at most be a discarded research/scheduling hint outside this root; the root independently selects an eligible cell and exact work definition, or refuses.

Each live invocation owns a private context and stage ledger. Implement runtime membership with closure-private object references/WeakMaps and non-exported issuance functions; TypeScript brands and `server-only` are additional guardrails, not proof. A public parser returns historical values only. No exported `issueTrusted(raw)`, `fromJSON`, `loadByIdAndTrust`, mutable issuer registry or caller-injected resolver is allowed. The identity object used to associate stages is memory-only; it is never a generated string, request/session identifier, logged value, artifact field or hash input.

Candidate handle types: `AdmittedGlobalCell`, `ResolvedAcceptedCustodySet`, `SelectedGlobalSupports`, `SafeAutonomousReviewMaterial`, `CapturedGlobalExecution`, `ProducedProvenanceBundle`. Each contains only private access to its owned values. Membership checks bind issuer, exact predecessor reference, expected stage and active invocation. Cross-invocation objects, clones, serialized/reloaded handles, callback re-entry and use after close fail. Objects are deeply immutable; a terminal failure closes the context, exposes only a closed reason and never returns partial success. Successful emission closes execution against reuse; its historical projection can later be passed by the same authorized server owner to a separately authorized storage operation. It cannot start extraction or acceptance again.

The threat boundary is untrusted callers, model material, stored/corrupt historical values and accidental server misuse, not arbitrary malicious code already controlling the server. Restricted imports and tests must demonstrate that live code cannot import test factories or install issuer/clock/catalog overrides. A runtime brand without controlled original issuance is insufficient.

### Candidate module contracts

All paths below use the existing #861/#855/#859 candidates under `lib/readiness/`; no duplicate custody or provenance framework is proposed. `Fxx` identifies the closed matrix in section 10. Network/DB entries describe a **later separately authorized implementation**, never actions of this slice.

| Candidate seam | Trusted inputs; hint handling | Result and permitted consumer | Effects and authority class | Failures |
| --- | --- | --- | --- | --- |
| `official-truth-global-cell-admission-server.ts`: `selectAdmittedGlobalCell` | Invocation after real authority read; reviewed corpus/work definition, eligibility snapshot and exact release contracts. No supplied scope/ID chooses authority. | `AdmittedGlobalCell`, definition/admission pins and exact canonical scope; only support selector/review owner. | Bounded read of trusted global release/eligibility; no HTTP, write, admission or scope upsert. Historical artifacts plus invocation-local selection custody. | F01–F04, F13–F15, F20–F21 |
| `official-truth-evidence-metadata-custody-server.ts`: `resolveSelectedEvidenceCustody` | Independently selected definition and eligible-version snapshot; private exact resolution request generated by selector. No public ID lookup. | Exact semantic Evidence set and complete historical origin closure wrapped in `ResolvedAcceptedCustodySet`; selector only. | Bounded read-only origin/dependency access; no retrieval/acceptance/write. Historical data becomes eligible for this invocation only after independent selection and all checks. | F05–F08, F13–F16, F20–F21 |
| `official-truth-support-selection-server.ts`: `selectRequiredSupports` | Admitted cell, reviewed `SupportSelectionDefinitionV1`, complete eligible-version snapshot, frozen catalog and registry release. Caller list not an input. | `SelectedGlobalSupports` and exact `SelectedSupportManifestV1`; review/proof/execution owner only. | Pure selection after bounded reads; no HTTP/DB mutation. Historical manifest plus live membership. | F04–F10, F13–F15 |
| `official-truth-global-representation-qualification.ts`: internal request/response checks | Exact binding, qualified item/representation/profile and qualification contract; actual ephemeral transport/response from retrieval owner. No boolean assertion from caller. | Invocation-bound qualified observation or fixed failure; original issuer or fresh execution owner. | Pure bounded checks, no network/DB. Historical qualification definition; actual qualified response stays invocation-local. | F11, F13–F17, F20 |
| `official-truth-autonomous-review-material-server.ts`: `constructSafeAutonomousReviewMaterial` | Admitted cell and selected custodied versions, frozen catalog, reference time. No envelope, metadata object or prebuilt candidate/key input. | Pending candidate `K`, compact supports and `AutonomousReviewConstructionV1`; internal proof builder. | Pure, no acceptance or I/O. Historical review identity plus invocation membership. | F04–F10, F12–F16, F20 |
| Existing proof server: internal `proveCustodiedGlobalMaterial` | Real authority result retained by root, one server reference, safe material and exact catalog. Current public research entry stays separate. | Frozen same-request proof owned by invocation; extraction only. | Authority/catalog reads happen once upstream; internal proof is pure. No additional grant is issued. | F01, F04–F16 |
| Existing extraction/retrieval/registry servers: internal execution capture | Proof, manifest, original closure, actual frozen executable releases and qualification; statically wired transport/clock. No arbitrary callback or definition injection. | `CapturedGlobalExecution` containing actual `F`, proof `K/E/R`, fresh observations and selected definitions; receipt producer only. | Existing bounded official HTTPS in later gated integration; replay catalog is in-memory. No DB write. Live custody cannot be serialized. | F04, F10–F21 |
| `official-truth-autonomous-provenance-record.ts` + `official-truth-autonomous-provenance-artifact.ts` | Strict historical values/bytes; source provenance is never inferred here. | Exact #855 C/H and typed codecs/integrity checks; private issuer and later historical reader. | Pure. Historical identity only; cannot mint handles. | F13–F15, F20–F23 |
| `official-truth-autonomous-provenance-record-server.ts`: private `projectProducedBundle` | Completed invocation with actual fact/seal, all origin/pin/citation dependencies. No externally callable DTO constructor. | `ProducedProvenanceBundle`: unchanged receipt plus binding plus exact closure; authorized server owner. | Pure atomic in-memory publication; no network, DB, acceptance or activation. Historical output, no bearer power. | F01, F04–F23 |
| Future `official-truth-autonomous-provenance-store-server.ts` | Separately authorized private write plus produced bundle custody; no browser receipt upload. | #859 insert/idempotency result; no accepted Rule, live proof or extraction handle. | Future persistence only after its own design/lifecycle/apply gates. Physical transport and SQL belong to #866. | Separate #859 storage outcomes; never producer success by repair |

## 4. Original issuance and later exact resolution

### 4.1 Roots exist before this invocation

`GlobalCellDefinitionV1` is exactly `{id,version,scope}`. Admission supplies a public regulatory-category basis for each of the seven dimensions, a scope-contract pin and an independent corpus-admission-contract pin. `evaluationDatePlan` is non-null exactly when `validity.mode` is `travel_date`. The date is a predeclared global regulatory evaluation date, never a trip date or server-reference-time substitution. Admission and code-owned support requirements exist independently of any traveller request.

Full citizenship set, single credential option and explicit citizenship link/null, issuer, residence, destination/transit and date semantics survive every equality comparison. No first passport/citizenship, issuer-as-citizenship, residence-as-citizenship, rounded date, aggregated traveller cell or `not_applicable` redaction. Unrepresentable legal qualifiers make a cell ineligible. Corpus eligibility is a separately frozen historical snapshot; retirements do not edit definition bytes. Detected invalidation of the selected release aborts, with no in-flight replacement.

The original metadata path is separate from receipt execution. Its hooks are **prerequisites for later separately commissioned integration**, not permission to accept Evidence here:

1. Original retrieval owner, after independent source/global-cell selection, captures actual initial URL, final identity/MIME, complete qualified response hash and server completion time. Qualification covers the actual entire response and transport. It issues an immutable observation only from this path.
2. A qualified deterministic validity-derivation implementation consumes that original observation/body and exact public cell. Each bound is either an exact supported regulatory value with a contract-defined structured locator or explicit `no_bound_asserted`. Unknown/failed parsing is failure, never null. `lastUpdatedAt`, retrieval time and legal validity are different values.
3. The separately authorized Evidence-acceptance boundary issues an accepted-origin record only after its actual successful result on these exact inputs. This is neither this producer nor `akzeptierteEvidenceLesen`. It attests that exact accepted version/result, not a database write. Acceptance criteria and activation are outside this design.
4. The custody issuer binds these records, exact source-bearing scope, full `ContentEvidenceIdentity` plus `versionId`, cell/admission and identity/hash contracts into #861's unchanged `AcceptedEvidenceCustodyV1`.

Minimum issuer record contracts, carried by exact pins from #861, must be closed and versioned before production. The following specifies consumer-required values, not a new storage schema or acceptance policy:

| Record | Required equality-bearing values and issuance check |
| --- | --- |
| Original observation | `binding`, actual initial/final URL, observed MIME, full hash, original completion time; exact catalog, profile, hash, retrieval and representation-qualification pins. Result denotes successful execution of that qualification, not a settable `global:true` flag. Its issuer owns the response before any external projection. |
| Validity origin | Observation pin, exact `validFrom`/`validUntil`, derivation-contract pin; one tagged basis per bound, either qualified locator/value or `no_bound_asserted`. No arbitrary string/map, page snippet or model rationale. |
| Accepted origin | Exact observation/validity pins, admitted cell/scope, full Evidence identity preimage and version; exact acceptance-contract pin. Issuer consumes its real successful result through an internal post-success hook; no `accepted:true` argument or external replay hook. |

Their separately reviewed issuance codecs must define exact fields, finite bounds, byte contracts and qualified dependencies. Unknown codec, absent implementation or inability to bind a recorded value means F05/F13/F15; the first dormant foundation installs no synthetic production issuer. Production observations/accepted origins are not created merely because this design defines their consumer.

Historical artifact names are registered non-personal semantic identifiers with positive immutable versions, as #855/#859 require. The trusted issuer/release process assigns them; callers and the resolver cannot allocate an alias/version to repair a collision. A snapshot is a complete immutable manifest, not an execution/session ID. If an exact authoritative identity/byte contract is unavailable, no pin is invented from a Git SHA, function stringification or a winner label.

### 4.2 Selection precedes lookup

The support selector loads the reviewed selection definition for the independently selected cell. It loads its trusted eligible-version snapshot, validates completeness and selects exactly one eligible accepted version per required `(sourceId,contentItemId)`. Zero or multiple eligible versions block; no latest timestamp, caller preference or whichever-fetch-succeeds tie-break. Preserve the complete relevant eligibility snapshot, including entries needed to prove why the selection was unique.

Only then can the custody resolver follow the selected exact pins. A private resolution request binds expected cell/admission, selection definition, eligible snapshot, version ID and custody pin to this invocation. The resolver checks both membership in that selection and historical issuance provenance. Its historical loader is statically bound to the qualified issuer's immutable records and exact release/codec allowlist; a general artifact store with byte-consistent user imports cannot serve as an origin issuer. Missing historical provenance cannot be repaired from today's accepted-looking row. The separately gated persistence layer can retain issued records, but byte validation alone cannot mint that issuer provenance.

Resolve the complete observation/validity/accepted-origin/qualification closure. Compare full preimages and canonical values, not just `ev2_` (a truncated digest), scope key or pin hash. Recompute `evidenceSuchschluessel(scope, representationRef)` / `evidence-key:v3:` and `contentEvidenceVersionV2`; compare exact identity bytes, final URL/MIME/hash/times and source-bearing scope. Apply `akzeptierteEvidenceLesen` against the one frozen eligible catalog and the existing freshness/validity checks at the reference time. Accepted state AND origin AND eligibility AND semantic validity are required independently.

Exact historical loader outcomes distinguish not found, corrupt/identity drift, unknown contract and operational read failure. None can substitute current/main/latest data, perform a fresh fetch to recreate original metadata, call acceptance, or return a success-shaped partial set. Fresh retrieval can prove present equality; it cannot prove original custody.

### 4.3 Exact selected manifest

Emit precisely #861's `SelectedSupportManifestV1`: selection definition/cell/global admission, kind/type/quality, eligible-version snapshot, catalog snapshot, extractor-registry snapshot, primary-null or composed policy-registry snapshot, and sorted `{versionId,custody}` supports. Reject duplicate IDs, custody entries and item pairs **before** sorting; required item set equals selected item set. Primary has exactly one support; composition has 2–8 distinct item pairs. Two representations of one item are not two supports; two items from one source can be.

From selection onward require the same ordered IDs AND full custody/identity values at every edge. No support substitution, subset fallback, best-effort citation, implicit primary downgrade or semantic widening. Any external attempted support list is rejected at ingress; if a future comparison-only boundary compares a claimed set, inequality is F10 and equality still grants no authority.

## 5. Safe review v3 without historical-envelope fabrication

The autonomous constructor derives metadata `{factKind,evidenceQuality,proposal:null}` from the selected definition and creates candidate `K` through existing `officialTruthRegelKandidatAusEvidence` using only custodied accepted versions and the frozen registry. It requires lifecycle `candidate`, validation `pending`, exact scope/key/kind/quality/support equality. It neither accepts Evidence nor calls `regelKandidatAkzeptieren`.

Refactor the existing fingerprint module's private identity computation into one shared internal core over a validated candidate and **compact provenance**, with its exact canonicalization/comparator unchanged. The existing public `officialTruthRegelReviewPacketFingerprint(unknown)` continues to rebuild via `officialTruthRegelReviewPacket`; it does not become a trusted-object parser. The safe server module can call the shared pure core, but only that server module can issue `SafeAutonomousReviewMaterial`. The pure core's output remains a checksum even if another caller can compute it.

Preserve this exact existing v3 preimage:

```text
{ v: 3,
  candidate: { scope, key, factKind, evidenceQuality,
               supportVersionIds, proposal: null },
  supports: [compact provenance, ...] }
```

Each compact support contains the seven content-binding fields plus `identitySchema:2`, `contentType`, `versionId`, `canonicalUrl`, `retrievedAt`, `sourceContentHash`, `validFrom`, `validUntil` (one `sourceId`, no duplicate field). Times/validity are exact original accepted values; date-only versus instant and explicit null remain. No snapshot, note, new custody pin or reference time is added.

IDs sort using the current `<`/`>` comparator. Support provenance uses the existing ordered comparator fields `versionId, sourceId, canonicalUrl, retrievedAt, sourceContentHash, validFrom, validUntil`, with null ordering as implemented. The existing recursive `kanonisieren` sorts object keys with `.sort()`, preserves array order, then uses `JSON.stringify`; fingerprint is `review-packet:v3:` plus `sha256Hex` of that string. **Do not replace it with #855's C/H domain serializer**, add an LF prefix, add fields or invent review v4. Future differential/golden tests must prove byte/key identity with existing v3 on equivalent safe fixtures.

Construct `AutonomousReviewConstructionV1` with exact cell/manifest/construction-contract pins, this safe preimage and recomputed key. Reject non-null proposal and indirect model-derived preimages before hashing. No API accepts an old packet and clears/rekeys its proposal. A new independent chain may happen to select equal historical public values, but consumes no authority, key or linkage from that old packet. No fake original snapshot, backdated retrieval, current time substituted for original time or old `uhr` callback is created to satisfy the current envelope API.

The internal proof seam uses this newly constructed material, the root's actual live authority, single reference time and catalog. It reuses current proof predicates and F7 narrow projection without expanding witness fields. Authoritative scope equality is canonical parsed **value and key** equality across cell → each source-neutral Evidence scope → K → decoded extraction scope. No parsed legal field may be dropped. Full origin checks occur before any fresh source HTTP.

## 6. One-invocation sequence and capture ledger

```mermaid
sequenceDiagram
    participant Root as Private server root
    participant Select as Admission and support owner
    participant Custody as Exact historical custody resolver
    participant Review as Safe review and proof
    participant Exec as Existing retrieval and extraction
    participant Emit as Receipt projection
    Root->>Root: Live authority and one reference clock
    Root->>Select: Trusted work definition and one catalog/release snapshot
    Select->>Select: Independently select eligible admitted cell and required items
    Select->>Custody: Exact selected versions/pins, private membership
    Custody-->>Select: Full original origin closure and validated Evidence
    Select-->>Review: Frozen manifest, cell, Evidence, catalog
    Review->>Review: Proposal null from inception; exact v3; freshness at reference
    Review->>Exec: Invocation-owned proof and immutable releases
    Exec->>Exec: Composed phase A before HTTP; primary waits for MIME
    Exec->>Exec: Capture actual initial URL; qualified fresh retrieval for every support
    Exec->>Exec: Exact equality; deterministic extraction; actual fact/seal and provenance
    Exec-->>Emit: Private complete capture, no DTO rehydration
    Emit->>Emit: Cross-check receipt and custody closure; atomic in-memory publication
    Emit-->>Root: Unchanged receipt plus separate binding and artifacts
    Note over Root,Emit: Any failed gate ends with no bundle; no persistence or acceptance call
```

| Captured value | Exact capture site and lifetime | Failure if unavailable |
| --- | --- | --- |
| Reference time and real authority outcome | Root before catalog/retrieval, using existing authority/clock boundary; authorization identity is never projected. | F01/F16; no caller clock. |
| Complete catalog and profiles | At the sole external `quellenKatalogLesen` result plus code-owned executable profile release; frozen before replay. Keep definitions and availability distinct. | F13/F14; no second external catalog call. |
| Cell/custody/eligible versions and manifest | At authorized selection/resolution; frozen exact values and byte closure before fresh work. | F02–F10; no current-row repair. |
| Schema/output/proof/freshness/definition pins | Code-owned release manifest associated with actual executable references and all semantic dependencies. Pin current eligibility snapshots separately from definitions. | F13–F15; no introspection of function text or guessed schema. |
| Composed phase-A context | Immediately after actual `officialTruthCompositionPhaseA`: retain input tuples/URLs/kind/type, full extractor/policy registries, selected `freeze` and assignments. | F18; no MIME/output-based tie-break. |
| Actual initial request URL | In the existing same-request loop, immediately after choosing `requestUrl` and before `retrieve`. Bind it to the exact support and representation and verify the retrieval used it. | F19; do not infer from final URL or later catalog. |
| Transport and full-response qualification | At request construction and inside retrieval, with real redirects/response before hash admission. Full decoded body is ephemeral; transport observations stay private. | F11/F17/F20. No credentials/cookie fallback. |
| Final identity/MIME/hash and completion | After actual identity AND global qualification, whole body and server completion clock; exact support binding. | F14/F16/F17; no overwrite of accepted values. |
| Primary actual definition and fact | Inside registry `ausfuehren` after unique post-MIME selection and successful `definitionAusfuehren`. Preserve its exact definition and `fact` reference for private capture. | F13/F19/F22; outward `material` cloning cannot supply lost identity. |
| Composed phase-B fact/seal/provenance | After actual phase-B checks, before outer `{status,seal}` return loses provenance; preserve seal and exact seal-view fact. Raw source observations discarded after checks. | F18/F19/F22. No seal recreation. |
| Legal target/assignment/citation mapping | With actual verified output under pinned slot/locator rules. Composed checked rows and frozen assignments; primary complete fact structure with sole support. | F18/F22. No new parser or array-index locators. |

The safe internal execution path shares the existing retrieval/extraction algorithms. It must not call exported `decide*` test seams with supplied successful proof/HTTP functions to manufacture trust. Widen only internal orchestration and capture. Existing public return shapes and the nine-field F7 witness need not expose the new context. Capture references before projection, then pass a private handle to the producer; do not spread all private fields into legacy return objects.

The retrieved body's full hash is existing `evidenceQuellenFingerprint`: complete bounded decoded UTF-8 text with CRLF/CR normalized to LF. No excerpt, DOM, compressed-wire, ETag or redacted hash. Qualification must prove public global regulatory content, non-personal exact requests, context-free server transport and non-personal **complete** response. Existing GOV.UK identity verification is not claimed to provide these four properties. Unknown/personal nested fields, named case pages, tokens, personalized interstitials and unqualified response classes block the whole representation. Generic PII regex/model judgement or one successful sample cannot supply positive qualification.

### Clocks and schema compatibility

Require authentic original `retrievedAt <= serverReferenceTime`, original validity and freshness current at that reference, and every fresh completion at or after the reference and its actual request start. Existing bounded transport timeout remains; no new TTL. Completion time is captured after all required response verification. Clock reversal/missing time or lost invocation custody blocks. A validity boundary crossed during execution is not relabelled current-at-completion: #855 records current-at-reference only. A future acceptance-time gate is separate.

Content identity **schema 2**, review **v3**, applicability **schema 1/2**, receipt **v1** and artifact codec versions are independent namespaces. The first producer admits legacy `RegelFakt` with `applicabilitySchema:null`, or supported schema-1 facts with the exact non-null schema-1 pin. All schema-2 carriers/definition requests fail F15 in this bounded design. #857's explicit fifth-argument parser, activity/stay context and jurisdiction binding are not silently connected. No cast, latest-parser fallback or pin inferred from output. Future schema-2 producer integration must reconcile receipt types/target vocabularies and version if needed; no claim that v1 already represents every v2 output.

## 7. Complete fact, citation and receipt projection

Primary executes exactly one eligible null-policy definition after observed MIME, with exact representation/URL checks and current canonical parser. Preserve the selected source/schema family, definition/registry/output/fact/applicability pins and actual `F`. `policy` in the receipt is literal null. Build primary citation rows from the pinned existing legal-slot traversal, each to the sole selected support; validate embedded branch/atom/otherwise citations against that support. Reuse/extract existing traversal/locator helpers from the composition contract rather than introduce a different traversal or pretend a composition policy ran. If the existing slot vocabulary cannot completely represent a fact, F15/F22 blocks it; top-level `herkunftFuer` rows alone are insufficient.

Composition requires the unique actual phase-A pair before HTTP and phase B using that same frozen pair. Copy policy assignments, complete provenance and exact seal-bound F. `equal_values` needs source-attributed observations from every assigned item, with equal canonical values; citation-only JSON cannot prove this. Cover all required fields, branches, outcomes, atoms, visa-option targets and explicit otherwise targets. Reject foreign/duplicate targets or supports, missing assignments, inconsistent union/subset relationships and ambiguous inherited atomic citations. Preserve existing support-free structural locators and tie-group bijection; no new locator is injected into F.

Project exactly #855 sections 4–10 and 11. `receipt.payload.candidate.fact` is a detached immutable value copy of F, while the private capture retains `trustedRuleFact === F`; composition additionally requires strict equality with `officialTruthCompositionSealView(seal).fact`. Never substitute the receipt's copy as live F. Pins and scalar pairs come from the definitions that actually executed. Registry snapshots include every entry required to audit uniqueness, not just the winner.

Compute existing Evidence/scope/review keys using their existing algorithms. For new #855 digests use exactly `C = ot-provenance-json-v1` and `H(domain,value) = domain + ':' + hex(SHA256(UTF8(domain + LF) || C(value)))`, with one LF byte. Validate exact closed shape, safe integers, canonical array ordering and required nulls before computing. `factHash`, `candidateBinding`, `proofIdentity`, primary selection key, composed selection/result keys and `recordFingerprint` have the unchanged #855 preimages. `recordFingerprint` is outside `payload`. No custody fields, lifecycle flags, Git SHA, actor ID, operational receipt timestamp or model/session data are added.

## 8. Separate custody binding and atomic in-memory publication

Create the unchanged #861 logical value:

```text
CustodyDependencyBindingV1.value = {
  receiptFingerprint,
  globalAdmission: Pin,
  selectedSupportManifest: Pin,
  autonomousReviewConstruction: Pin
}
```

This is a separate immutable artifact issued alongside the receipt. It neither changes #855's payload/fingerprint nor adds a twelfth root slot to the receipt. Its fingerprint is the full pin digest of #861's exact `C({kind:'CustodyDependencyBindingV1',schemaVersion:1,value})`. `receiptFingerprint` is a scalar cross-binding, not a graph edge back into the receipt; no cycle is created.

Before publishing the pair, require every cross-check:

| Receipt / execution side | Custody side and exact check |
| --- | --- |
| `recordFingerprint` | Binding `receiptFingerprint` equals recomputation over exact receipt bytes. |
| `globalCell.definition`, canonical scope/key | Admission cell, selection cell, review cell and every custody cell equal the exact definition pin and all seven canonical scope values; sources agree before projection. |
| Support IDs and full compact accepted preimages | Manifest sorted versions/custody resolve one-to-one; recomputed lookup/version and all identity/MIME/final URL/hash/original time/validity fields equal. No new accepted result manufactured. |
| Candidate kind/type/quality, support set | Selection definition, manifest, safe pending K, proof and actual executed definition/output all agree. |
| `proof.reviewPacketKey` | Safe construction exact v3 preimage/key equals both retained proof and recomputation; proposal null from inception. |
| Catalog/extractor/policy registry snapshots | Same complete frozen manifests as selection/execution; primary policy registry null in selection, receipt policy null; composed frozen pair and assignments exact. |
| Fresh support values and initial URLs | Actual captured observations, qualification and immutable representation request permissions agree; original and fresh observations are separate. |
| Fact/schema/output/proof/freshness pins and derived digests | Exact executed contracts and F, actual same-request membership, current-at-reference only; composition seal/provenance/result binding retained. |
| Entire transitive closure | Exact known byte codecs, no unresolved pins, conflicting identity/bytes, unqualified preimages, cycle, dropped role edge or over-limit graph. |

Atomic **in-memory** means stage privately, compute and verify all values/bytes/artifacts, then return one deeply immutable bundle only after every check. No receipt-only callback, intermediate public success, partially populated binding, persisted failure object or later caller attachment. A failure after successful extraction still yields no bundle. No network/DB/acceptance is performed inside publication. Raw responses/observations and auth context never become bundle members.

### Byte-contract reconciliation with #859

Preserve three codec classes explicitly. The global definition hashes exactly `{id,version,scope}`. #861 custody artifacts hash exactly their `{kind,schemaVersion:1,value}` form. Other #859 artifacts use their exact accepted generic manifest codecs. **Do not wrap a #861 object in #859's generic manifest and reuse its old pin**. #859 section 5 explicitly requires checking already accepted artifact byte contracts and forbids a silent envelope migration; its generic store must dispatch the separately versioned custody codecs. External storage type/id/version/edge projections do not change hashed bytes. Edge sets for custody codecs are derived from their typed pin fields, not added to their preimages.

The transfer is the union of the original 8–11 receipt roots and the separate custody binding's exact dependency closure. Share identical complete pins while preserving all role edges. It contains original observation/validity/accepted-origin, admission/scope/date-plan contracts, selection definition/eligible-version snapshot/manifest, qualification and safe review construction, plus #855 catalog/executable/schema/proof/freshness artifacts. The custody decoder can recompute the **additional** retained safe v3 preimage's checksum; this does not change what the receipt-only reader can claim or prove original body authenticity.

No SQL layout, RPC parameter list, RLS policy or physical link mechanism is chosen here. The storage designer must preserve these existing byte contracts and complete paired publication. If its future codec cannot represent this union without changing either accepted pin bytes or receipt semantics, it must refuse/return to independent design review; the producer never repins silently. No v1 semantic extension is necessary for the bounded legacy/v1 producer described here.

## 9. Future persistence interface, minimization and historical limits

The semantic handoff is one `ProducedProvenanceBundle` containing receipt, canonical receipt bytes, separate binding bytes/pin and the exact immutable artifact/role-edge closure. It is **not** a wire/RPC DTO with authority. A future adapter separately authorizes a write, validates the producer's in-process custody and all byte/closure invariants, then follows #859's atomic insert/idempotency contract. An imported byte-identical receipt cannot mint a production handle. Crash/retry transport, storage privilege and lifecycle recovery belong to the storage slice; this design offers no replay-to-live-execution API.

Retain #859 limits unchanged: receipt 262,144 UTF-8 bytes; 8–11 receipt root references (maximum 11); 256 unique artifacts, 1,024 edges, 1,048,576 bytes per artifact, 8,388,608 total artifact bytes and longest dependency depth 8; structural JSON nesting 32, with stricter existing domain limits. For this producer's optional future handoff, conservatively charge **the union** including binding and custody artifacts/edges against those artifact totals, and count binding as a separate depth-1 root for depth accounting. This does not redefine #859 receipt root slots. Over-limit union is refused rather than split, truncated or relabelled. No increase is requested; physical enforcement remains storage design ownership.

Before hashing or retaining anything, admit only G (independent public global regulatory categories), C (qualified non-personal code/definition identity), O (minimal qualified global observation). Check transitive preimages, structured locators, artifact IDs/versions, code bundles and URL query semantics. Explicitly reject traveller/user/trip IDs, passport/document numbers, MRZ, birth date, personal residence history, request/session identifiers, IP/cookies, prompts/model conversations, secrets/tokens, personal free text, raw personal preimages and **hashes of personal/model material**. Raw government bodies and screenshots remain excluded from retained closure even when public. Do not sanitize a rejected object and keep its former hash.

No durable failure log, rejected-body digest, arbitrary error text or user correlation key. Internal errors expose only section 10's fixed codes; no offending URL/value/body. Work-session/model evidence in REPORT is authorship evidence for documentation, never regulatory provenance.

Historical resolution uses exact complete pins and known codecs against retained bytes. No current catalog/registry/main/latest fallback and no remote source fetch. Valid historical bytes do not prove present freshness, original authorized issuance by themselves, live seal identity, acceptance or production write authority. Missing custody behind an otherwise perfect persisted receipt means the autonomous custody claim is unavailable; no fresh execution can resume from it. Idempotent persistence of identical complete bytes is not a second execution; a missing/corrupt dependency is not idempotent success or repair permission. A newly authorized production repeats selection and fresh reproof and emits its own result, even if some historical pins remain identical.

Persistence success grants no Evidence/Rule/F8 authority. `regelKandidatAkzeptieren` stays the sole canonical Rule constructor and is never called here. No retention period, deletion, tombstone, archival, backup or reference-count cleanup decision is made. Real persistence implementation/operation remains gated by #859 and Product Owner + Security + Privacy lifecycle decisions.

## 10. Closed deterministic failure matrix

The proposed producer returns only success-with-complete-bundle or `{status:'blocked',reason:<closed code>}`. Codes below are **proposed**; they do not rename existing exported runtime failures. A fixed exhaustive adapter maps each existing reason into the listed stage/category; unknown reason/exception maps to `execution_context_unavailable`, with no echoed string. Existing refusal never becomes success. Use gate order: ingress/authority → admission → historical custody → support/pins → safe review/freshness → composed A → each fresh retrieval → output/B → projection → binding. Within a gate use table order and sorted item/version/pin traversal. Stop at the first failed check; never perform extra HTTP for diagnosis.

| ID / proposed reason | Deterministic condition and action |
| --- | --- |
| F01 `authority_required` | Real live authorization denied/unavailable, forged/cross-invocation/closed handle or unauthorized operation; no catalog/source work after refusal. |
| F02 `global_cell_missing` | No independently selected exact cell/admission; no mint-on-hint. |
| F03 `global_cell_ineligible` | Retired, ambiguous, request-derived, unsupported public basis/date plan or detected invalidation; no replacement cell. |
| F04 `scope_mismatch` | Any canonical parsed value/key/source namespace disagreement; no dropping a qualifier. |
| F05 `custody_missing` | Original observation, validity derivation, qualified issuer or historical closure absent; accepted-looking current row cannot fill it. |
| F06 `accepted_origin_mismatch` | No actual accepted-version origin or mismatch to observation/validity/scope/full identity; do not invoke acceptance. |
| F07 `evidence_identity_drift` | Version/lookup/preimage or custody binding differs, including same `ev2_` with different full bytes. |
| F08 `evidence_not_eligible` | Semantic accepted/official-source checks fail, lifecycle/validation wrong, or version not in authorized eligible snapshot. |
| F09 `support_selection_invalid` | Missing/duplicate/extra item/version/custody, ambiguous eligible version or incomplete required family; no newest/subset fallback. |
| F10 `support_set_mismatch` | Claimed set, proof, retrieval, fact or citation set differs from frozen manifest; foreign citation blocks. |
| F11 `representation_not_global` | Any of four full-response/transport qualification properties absent, or personal/case/session/unknown response class. |
| F12 `proposal_not_null` | Non-null proposal or attempt to repurpose model-dependent review material; never clear/rekey. |
| F13 `pin_missing` | Required catalog/profile/registry/definition/output/schema/proof/freshness/issuer pin or exact bytes unavailable. |
| F14 `pin_inconsistent` | Pair/version/digest/type/bytes/dependency meaning differs from actual selected release; same hash in different source context fails. |
| F15 `schema_incompatible` | Unknown artifact/canonicalization/schema version, schema-1/schema-2 drift, missing jurisdiction integration or unrepresentable fact/target; no latest reader. |
| F16 `freshness_gap` | Stale/expired/future Evidence, invalid/missing/reversed clocks, or required time assertion not established. |
| F17 `fresh_reproof_failed` | HTTP/identity/MIME/final URL/full hash/qualification failure or source change; no fallback body, support or Evidence update. |
| F18 `composition_context_incomplete` | Phase A/B missing, changed pair, incomplete assignments/equal-values observations/provenance, forged seal or missing seal-bound fact. |
| F19 `execution_context_unavailable` | Initial URL, actual definition/reference/fact custody or needed execution value discarded; unexpected internal/read failure; no rerun solely to reconstruct a prior result. |
| F20 `privacy_rejected` | Forbidden field/preimage or unqualified non-personal dependency, even only as hash; no value in diagnostic. |
| F21 `artifact_closure_invalid` | Cycle, wrong/extra/missing role edge, identity collision, structural/byte/node/depth limit violation; no trimming. |
| F22 `receipt_projection_mismatch` | V3 drift, wrong fact/selection/proof/result digest, missing canonical citation coverage or any receipt/execution mismatch; no partial receipt. |
| F23 `custody_dependency_mismatch` | Binding fingerprint or referenced admission/manifest/review/custody closure inconsistent with receipt; publish neither object. |

Retries have no permissive transition. A transient operational failure can motivate a separately authorized **new** invocation; it cannot reuse a live handle, old receipt or review key as permission. A storage retry of retained historical bytes, when separately authorized, is storage-only and does not produce a trusted fact.

## 11. Adversarial and conformance obligations

These are tests for a later runtime slice, **not tests created or run here**. Every negative case asserts no bundle, no acceptance/store/activation calls and fixed non-sensitive failure output. Pre-HTTP gates also assert zero HTTP calls. Positive fixtures remain synthetic and never register real production definitions.

| Case | Required assertion |
| --- | --- |
| C01 Forged correct-looking DTO, brand cast, copied WeakMap token or JSON/structured clone | F01/F19; cannot enter later stage or issue a handle. |
| C02 Valid ID/pin supplied by untrusted or even role-authorized caller | Independent selection required; no caller-controlled exact resolver invocation. |
| C03 Current row equals missing historical object byte-for-byte | F05/F13; no current-row/latest fallback or retroactive issuer. |
| C04 Same hash under another source/item/representation/profile | F07/F14/F17; full context/identity equality required. |
| C05 Stale/expired/future Evidence or reversed completion clock | F16; preserve reference versus completion semantics; no substituted times. |
| C06 Content or final URL changes between original and fresh retrieval | F17; selected accepted version unchanged; no repair/upsert. |
| C07 Non-null model proposal; cleared proposal with old key; recomputed key over reused external envelope | F12/F22 or ingress rejection; no sanitize-and-promote. |
| C08 Duplicate support, same item in two representations, missing item, two eligible versions, caller subset | F09/F10; deterministic selection failure before HTTP. |
| C09 Foreign citation, missing otherwise/atom, duplicate locator or incomplete equal-values observations | F10/F18/F22; exact legal-slot coverage and source attribution. |
| C10 Final-only URL and multiple approved request URLs | Success captures actual chosen initial URL; removed/mismatched capture is F19, never guessed later. |
| C11 Missing phase-A inputs or B provenance; late MIME/pin tie-break; seal clone | F18; no second selection or reconstructed result identity. |
| C12 Unknown schema/artifact version; applicability-1 label with v2 fact, country or pin | F15; no fifth-argument reader use in first producer; store guards untouched. |
| C13 Perfect persisted receipt with missing custody binding/original origin | Historical audit incomplete; no live handle; F05/F23 at producer boundary. |
| C14 Old receipt/review key retry, cross-request proof or post-close handle | F01/F19; fresh independently authorized invocation only. |
| C15 Dual-citizenship/traveller-derived scope, itinerary date, aggregated anonymous combinations | F03/F20; public cell equality cannot launder personal origin. |
| C16 Issuer/citizenship substitution, removed second citizenship, default document/residence/date | F04; exact seven-field canonical value and key equality. |
| C17 Public HTTP 200 identity-valid body with personal unused extension, token URL or cookie-dependent content | F11/F20; full response qualification, no redacted hash or cookie fallback. |
| C18 Correct tuple but missing actual executable profile/definition or winner-only registry snapshot | F13/F14/F21; availability/name/digest alone cannot supply execution closure. |
| C19 Mutate primary F after extraction; pass equal clone or a different fact to projection | Deep freeze and exact reference binding; F22 for substituted input. |
| C20 Missing primary branch/atom citations despite valid top-level provenance | F22; legal-slot traversal must prove complete coverage, no policy fiction. |
| C21 Different custody binding attached to equal receipt bytes | F23; all cross-checks enforced; no caller after-the-fact attachment. |
| C22 Duplicate JSON members, unknown keys, accessor, symbol, cycle, negative zero, malformed Unicode | Strict input rejection before getters/normalization/hash; F15/F20/F21/F22 as applicable. |
| C23 Boundary +1 byte/node/edge/depth; deeper shared DAG path | F21; longest-path accounting and all role edges, no dedup-induced bypass. |
| C24 Catalog/profile changes after capture, phase-A registry mutation, detected eligibility revocation | Frozen actual references remain stable; detected incompatible invalidation aborts; no second current read presented as original snapshot. |
| C25 Safe primary and composed synthetic complete flows | Exactly one authority read/reference/catalog; HTTP per selected support; correct actual F/seal; no writes; both immutable outputs and complete closure. |
| C26 Existing v3 differential and golden vectors | Safe historical fixture through old wrapper and new core yields byte-identical preimage/key; proposal/validity changes still change v3; notes do not. |
| C27 #855/#861 byte conformance | Exact existing C/H preimages, required nulls and separate custody bytes; no receipt widening or wrapper repinning. |
| C28 Persistence denied/fails after production | No Evidence/Rule/F8 success inferred; immutable production result unchanged; no durable failure receipt. |
| C29 Missing trusted original issuer in dormant production wiring | F05 before HTTP; pure fixtures cannot become live issuers or real source registration. |

## 12. Smallest safe later slice sequence and reserved gates

1. **Pure producer/custody runtime foundation.** Separately dispatch the seven candidate custody/review/provenance codec/issuer modules only as needed, exact parsers, pin/equality checks, selection logic, private stage membership, shared v3 core and synthetic adversarial fixtures. Default production roots/resolvers fail closed; no real global admission, source registration, origin issuance, retrieval, acceptance or storage. First review must prove import/issuer encapsulation and v3 compatibility. Ordinary bounded dormant work needs a new TL dispatch, not a new Product-Owner product decision.
2. **Safe same-request integration and context capture.** Separately dispatch minimal internal proof/extraction/retrieval/registry seams, actual initial URL, executable pins, qualification and phase-A/B context, fact reference preservation and full citations. Preserve existing public/test boundaries, owner/AAL2 bootstrap and empty production extractor/policy registries. Synthetic/offline proof first. Real original-observation/validity/accepted-origin integrations need their own reviewed exact contracts and authorized Evidence lifecycle; this producer does not issue accepted-origin. Source/profile/corpus qualification and activation and any live provider/secret action are separate gates. No background identity is inferred from #741; changing Auth/AAL/capabilities requires its own review and applicable PO gate.
3. **Receipt plus custody-binding emission.** Only after 1–2, separately wire the private projector to actual trusted success, exact byte codecs and complete closure; publish atomically in memory. Validate C01–C29 on primary/composed legacy/v1 and all failure paths. No persistence, acceptance, F8 or schema-2 integration. Missing prerequisites keep live emission blocked rather than generate a partial receipt.
4. **Persistence implementation.** Only after independently reviewed #859-based storage/SQL design and explicit Product Owner + Security + Privacy lifecycle decisions where required before real implementation/operation. Integrate abstract bundle/codec obligations without adopting unpublished #866 internals. Development apply/verification and Production apply each retain their separate exact-scope approvals. No retention default or migration is authorized here.
5. **F8 / Rule acceptance.** Separate versioned policy, identity/authority and time-of-acceptance design and independent review. The sole canonical constructor, current store/schema/composed-branch restrictions and source truth remain; successful production/persistence does not satisfy this gate. No F8 predicates, approval route or activation is designed here.

No step is started by this document. The immediate next responsible actor is the independent ChatGPT / Technical Lead reviewing the exact delivered #863 head. Agent classification means design coverage within this bounded, fail-closed domain, not runnable production, Technical-Lead PASS, GitHub Ready or authority to merge.

**AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_READY**

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
