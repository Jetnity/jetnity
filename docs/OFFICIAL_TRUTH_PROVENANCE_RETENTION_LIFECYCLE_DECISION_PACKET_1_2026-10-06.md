# Official Truth provenance retention and lifecycle decision packet 1

Date: 6 October 2026 · Issue [#865](https://github.com/Jetnity/jetnity/issues/865) · Draft PR [#867](https://github.com/Jetnity/jetnity/pull/867)
Evidence baseline: `main@9adfc04ffe90693dedc059f07a396751a0625157`
Status: **DECISION PREPARATION ONLY / NO OPTION APPROVED / NO DURATION SELECTED / NOT IMPLEMENTED**

## 1. Decision requested and authority

The Product Owner, Security and Privacy need to choose how long Jetnity can preserve the evidence behind a deterministic global trusted-fact production, when that evidence may disappear, and what the product must stop claiming after it disappears. This packet supplies three alternatives, their consequences and an unsigned decision form. It grants no lifecycle, deletion, storage, acceptance or deployment permission.

The central trade-off is explicit: retaining a complete historical dependency closure supports later integrity checks; deleting part of it reduces retained information but can make those checks impossible for every receipt sharing that part. Neither a receipt fingerprint nor a surviving Rule relationship replaces deleted bytes. An active Rule reference can protect evidence indefinitely unless the chosen policy also defines how that reference ends.

**Author recommendation, conditional and unapproved:** consider **Option B**, reference protection plus a bounded period after reference release, and omit optional insertion metadata unless a concrete operational need is demonstrated. This assumes that explainability for active Rule versions outweighs a universal age cap and that Privacy accepts the possibility of long-lived active references. If those assumptions are rejected, choose another option explicitly. This is not a Technical-Lead PASS or Product-Owner decision.

All proposed lifecycle safeguards, health expectations and form choices below are decision candidates. The existing #855/#859/#861 integrity and privacy boundaries remain binding regardless of option. No option may weaken them silently. No numeric duration, cadence, grace period or backup window is chosen here.

## 2. Live evidence and its limits

| Evidence, read on 6 October 2026 | Binding consequence |
| --- | --- |
| `origin/main` at the baseline above; `.jetnity/operating-mode.json` = `NORMAL`; `JETNITY_START_HERE.md`; operating standard and multi-agent operating system | Normal bounded work is permitted; reserved Product-Owner gates remain. No global continuity edits in this slice. |
| [#751 live index](https://github.com/Jetnity/jetnity/issues/751), top current-state and 6 October execution directive | Codex Desktop may execute this authorized docs slice through commit/push/STOP. #862/#863 and #864/#866 own separate design contracts. Older lower index paragraphs are historical snapshots. |
| [#741](https://github.com/Jetnity/jetnity/issues/741) and comment `5956471880` | Autonomous Official Truth is a product priority, with deterministic safeguards; persistent retention and Production remain separate gates. |
| [#865](https://github.com/Jetnity/jetnity/issues/865), Draft #867 and [immutable TASK](OFFICIAL_TRUTH_PROVENANCE_RETENTION_LIFECYCLE_DECISION_PACKET_1_TASK_2026-10-06.md) | Four new deliverables only; TASK blob `88b5a3c8123f2014db2ecdea891c7274dde02554`. No final retention decision. |
| Merged [#855](https://github.com/Jetnity/jetnity/pull/855), merge `e00f5f98775b0271749d955df5b493c8ae8589c8`; [receipt contract](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md), §§3, 12, 14–16 | Success-only, non-personal receipt; transitive preimage admission; immutable identity; historical receipt is not authority. |
| Merged [#859](https://github.com/Jetnity/jetnity/pull/859), merge `9adfc04ffe90693dedc059f07a396751a0625157`; [persistence contract](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md), §§3–11, 14; TL review `5421785884` | Canonical receipt bytes, typed immutable artifacts and exact dependency links; append-only while retained; reserved lifecycle gate before real persistence implementation/operation. Its selected storage **Option 1 is not a lifecycle approval**. |
| Merged [#861](https://github.com/Jetnity/jetnity/pull/861), merge `75251131fa91020e5b5a46e484c92028ca9739ae`; [custody contract](OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_2026-10-06.md), §§3, 14; TL review `5421716549` | Separate immutable `CustodyDependencyBindingV1` and origin dependencies; do not widen #855 receipt bytes. Missing custody is not implied trust. |

Relevant existing Jetnity contracts, inspected at the baseline:

- `AGENTS.md` §§5, 14–15, 18, 25 and `DECISIONS.md` ADR-0032: reserved decisions, least privilege, cost and honest verification. No role, grant or security mechanism is specified here.
- `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DESIGN_SYSTEM.md`, `docs/PRODUCT_QUALITY_STANDARD.md`, `docs/CONTINUITY_STANDARD.md` and `README.md`: minimize data, preserve one truth, distinguish unavailable from empty, document limitations and avoid speculative infrastructure.
- [Development Security Event design](DEV_SECURITY_EVENT_LOGGING_RETENTION_1_DESIGN_2026-09-29.md) and [runbook](DEV_SECURITY_EVENT_LOGGING_RETENTION_1_RUNBOOK_2026-09-29.md), corroborated by `scripts/db/security-events-dev-1/10-install-dormant.sql`: a separate Development package has a seven-day period, hourly cleanup, a row cap, unknown/failing/stale health and scheduled-success requirements after restore. These are **patterns only**, not transferable Provenance values, authorization or evidence of current hosted configuration.
- `supabase/functions/account-delete-v1/index.ts` deletes account-linked security events and the Auth user. It provides no lifecycle contract for independently global provenance. Do not attach global receipts to accounts just to reuse that deletion route. If personal origin is discovered, use the incident decision path below, not an invented account join.
- [AP-6a legal-content input contract](AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md) distinguishes technical evidence from legal sufficiency. [PrivacyBee PO decision](PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md), §§3–6, leaves account/data lifecycle with Jetnity and requires accurate server-processing disclosures. Older missing-route/account-delete audit statements are historical; the current repository contains those later implementations. No website widget resolves this retention gate.

No hosted Supabase inventory, backup configuration, region, processor contract or deletion deadline was verified in this slice. #751's hosted-state statements are attributed continuity, not fresh database evidence. Public technical documentation supports only the general backup distinctions in §7. Applicable law, lawful basis, rights, legal preservation duties and source/code archival rights remain questions for competent advisers.

## 3. Fixed boundaries and terms

**Receipt integrity is not semantic authority.** The receipt contains canonical fact values but attests to historical trusted-fact production; it is not an accepted Rule, current legal advice, proof of storage, a bearer capability or permission for Evidence/Rule acceptance. Retention cannot upgrade it. No F8 design is included.

Use #855's classes: **G** = independently global public regulatory semantics, **C** = non-personal code/catalog/contract identity, **O** = minimal global execution observation. These are engineering admission classifications, not findings that privacy law is inapplicable. Hashes inherit every preimage's classification. Timestamps and graph relationships can enable correlation even without a direct personal identifier.

For **all six classes**, exclude personal/traveller/account/trip/request/session identifiers, IPs, cookies, passport/document numbers, MRZ, birth dates, personal itinerary/residence history, prompts, model conversations/proposals, secrets/tokens, raw government response bodies, screenshots and hashes of forbidden preimages. Public accessibility alone is not non-personal qualification. Model-derived or traveller-derived data cannot be made admissible by hashing, redacting after issuance, changing labels or attaching an existing global ID. Session/model evidence in the delivery documents is authorship evidence, not a runtime provenance field.

**Protected closure** in this packet means the exact receipt bytes, required receipt/artifact links, transitively referenced immutable artifacts, its separate #861 custody binding and all that binding's origin/admission/selection/review/qualification dependencies. This is lifecycle vocabulary, not a new stored manifest, digest, table or producer interface. Preserve the already specified bounded historical contracts and exact Pins.

**Active Rule reference** means an exact Rule-version relationship whose separately governed Rule lifecycle says it is still relied upon. This slice cannot define the Rule state machine. Absence, timeout or uncertainty in a reference inventory is not proof of no references. Archived/superseded Rule versions may still be retained for historical audit and must be considered separately from currently active versions. Rule age, Evidence freshness and reference release are different facts.

**Eligibility**, **committed live deletion**, **residual-copy expiry**, and **independently verified disposal** are different milestones. A due date, queued job, empty reader result or zero reference counter does not prove deletion. No tombstone, deletion certificate, exception ledger or new operational store is authorized here; any retained evidence of those milestones needs its own minimized, approved contract.

## 4. Data-class assessment

Each class below addresses the TASK's ten questions. §7 applies to every class and is not an instant-erasure promise; §8 supplies common candidate restore/failure safeguards.

### D1 — Canonical receipt bytes

| Question | Assessment |
| --- | --- |
| 1. Purpose and truth layer | Historical integrity evidence of success-only deterministic production, including canonical fact/cell/support bindings and historical times. It contains G values without becoming accepted Rule truth. |
| 2. Privacy / forbidden preimages | G/C/O; §3 exclusions apply transitively, including source-content/review/scope hashes, URLs and precise times. No raw source, personal scope or hidden model proposal. |
| 3. Deletion with a surviving reference | A fingerprint or Rule edge alone cannot reproduce payload bytes, candidate/support relationships or historical checks. Root absence is reported honestly; no reconstruct-from-Rule shortcut. |
| 4. Sharing | Multiple Rule versions can reference one receipt; multiple receipts can share artifacts. Removing one relationship cannot authorize deleting the receipt or its entire dependency closure. |
| 5. Copies | Database backup/WAL/PITR/export copies can contain the entire old payload; live deletion does not remove them. Logging payloads would create an unauthorized second archive. |
| 6. Legal/compliance unknowns | Whether the admitted semantics and O observations require particular notices, bases, limits, preservation or rights handling; competent Privacy/Legal review required. |
| 7. Indefinite-retention risk | A longer breach/correlation window, cumulative global execution history, cost, and exposure if an admission defect is discovered later. |
| 8. Early-deletion risk | Loss of exact historical fact/support/time binding and ability to explain the referenced production; active product claims may become unsupported. |
| 9. Restore | Recover only exact authorized bytes/fingerprint and full closure; apply original policy clocks and current expiry decisions before making them available. Restore time cannot restart retention. |
| 10. Failure / stop | Missing/corrupt roots or unresolved deletion/reference races stop claims of complete audit and affected new persistence/reliance; overdue cleanup remains visible and escalated. Never rewrite the receipt to mark it deleted/current. |

### D2 — Immutable typed artifacts, implementation/catalog/schema snapshots

| Question | Assessment |
| --- | --- |
| 1. Purpose and truth layer | Historical interpretation of the exact executed definitions, full selection/catalog snapshots and parsing/proof contracts. C/G evidence, not current registry authority. |
| 2. Privacy / forbidden preimages | C/G and qualified O in origin artifacts. §3 exclusions also cover author/user metadata, source maps, build environments, dependency bundles and secret-bearing configuration. Exact qualified bytes only. |
| 3. Deletion with a surviving reference | One missing or corrupt artifact can defeat every dependent receipt's complete historical verification. A code label, URL, current main or newer version cannot supply the old bytes. |
| 4. Sharing | Assess all direct and transitive references from retained parents, receipts, custody closures and any independently approved archive purpose. A per-receipt cascade is unsafe. One exact artifact can outlive one referring receipt while another still needs it. |
| 5. Copies | Backups/WAL/exports can retain bytes after live deletion. Any separately stored bundle would have its own copy lifecycle; no new object-storage tier is proposed. |
| 6. Legal/compliance unknowns | Archival/distribution rights for code/dependencies and catalog material, any embedded personal data, required preservation and transfer/location constraints. Public code is not automatic archival permission. |
| 7. Indefinite-retention risk | Old vulnerable code and dependency knowledge, hidden sensitive material, corpus correlation, decoder maintenance and shared storage growth. Historical reading must not execute archived bundles. |
| 8. Early-deletion risk | Loss of exact historical algorithms/eligibility snapshots and wider damage through shared dependencies, even when receipt payloads survive. |
| 9. Restore | Validate exact Pin/type/version/bytes and complete graph under supported historical codecs, then recompute protection/eligibility. Never reinstall or execute archived code to repair missing interpretation. |
| 10. Failure / stop | Unknown reference inventory or drift blocks artifact disposal and affected new references. Missing dependency remains an integrity failure; do not return idempotent success or refill from current code. |

### D3 — Receipt/artifact dependency links

| Question | Assessment |
| --- | --- |
| 1. Purpose and truth layer | Historical graph relationships checked against their immutable canonical parents; they add no authority beyond those parents. |
| 2. Privacy / forbidden preimages | C/G/O inherited from parent/target. §3 exclusions apply to endpoints and slot values; no personal correlation key or free-text reason. Graph topology itself reveals relationships. |
| 3. Deletion with a surviving reference | Missing/extra/repointed required links violate #859 even if target bytes survive. Parent manifests describe expected edges but do not authorize silent repair during reads. |
| 4. Sharing | Each retained parent needs every required role edge, including two roles pointing to one shared target. Distinct edges must not disappear merely because target bytes deduplicate. |
| 5. Copies | Old graph topology may remain in backup/WAL/export/log copies independently of current reachability. Deleting an edge is not deleting its target from those copies. |
| 6. Legal/compliance unknowns | Whether relationship-only remnants qualify as minimization, need preservation, or remain identifying in context; no anonymity assumption. |
| 7. Indefinite-retention risk | Long-lived correlation maps and orphan graph growth; retained links may reveal more than isolated artifacts. |
| 8. Early-deletion risk | False orphan decisions and transitive destruction if a removed edge is treated as proof the target is unused. |
| 9. Restore | Compare links in both directions with canonical parents and reconcile all restored roots before any garbage collection. An older graph is not a current reference census. |
| 10. Failure / stop | Reference/edge inconsistency blocks disposal of the affected graph; readers report the existing integrity failure rather than a complete history. Authorized recovery is separate from ordinary reads/retries. |

### D4 — Custody Dependency Bindings

| Question | Assessment |
| --- | --- |
| 1. Purpose and truth layer | #861's separate immutable association of receipt fingerprint with global admission, selected support manifest and autonomous review construction. Historical origin linkage; no new receipt field or acceptance permission. |
| 2. Privacy / forbidden preimages | G/C/O; all transitively linked custody, original observation/validity/accepted-origin, qualification and safe review artifacts require §3 admission. No actor/request/model identifiers. |
| 3. Deletion with a surviving reference | Receipt consistency alone cannot establish the lost connection to original custody/selection/review. Missing binding cannot be attached later from caller IDs or implied by receipt existence. |
| 4. Sharing | Binding is specific to its exact receipt; underlying admissions, definitions and custody artifacts may be shared. Do not delete them with one binding while another protected path remains. |
| 5. Copies | Backup/WAL/PITR can restore an obsolete binding or its targets separately; those remnants retain the association even after live removal. |
| 6. Legal/compliance unknowns | Necessity and permitted duration of origin/selection evidence, correlation risk from original times and any preservation duties; competent assessment required. |
| 7. Indefinite-retention risk | A richer cross-receipt origin graph and accumulation of observation history; a defect in qualification propagates across shared custody dependencies. |
| 8. Early-deletion risk | Loss of the additional historical evidence required by merged #861 despite apparently intact #855 receipt bytes. |
| 9. Restore | Require the original immutable binding, correct receipt/cell/support/preimage/review equality and exact dependency closure. Do not synthesize a missing binding during recovery. |
| 10. Failure / stop | Report incomplete custody history and block affected new reliance/persistence until reviewed resolution. No receipt-only result may be presented as complete custody verification. |

### D5 — Optional operational insertion metadata

| Question | Assessment |
| --- | --- |
| 1. Purpose and truth layer | Optional server insertion time and storage-format version only where demonstrated necessary, outside semantic payload/digests. Operational information; no freshness, production-time or acceptance authority. Required version dispatch cannot be removed by misclassifying it as optional metadata. |
| 2. Privacy / forbidden preimages | O/C; timing can correlate with private activity elsewhere. §3 excludes actor, request/session/user/network IDs, free text, retries, last-seen counters and raw errors. |
| 3. Deletion with a surviving reference | If genuinely optional and not the selected lifecycle clock anchor, removal loses insertion/operations history without invalidating semantic bytes. If chosen as a clock anchor, deleting it early makes expiry unprovable and is unsafe. |
| 4. Sharing | Receipt-local metadata is not a license to delete shared artifacts. Repeated/idempotent insertion must not reset the original time or extend life. |
| 5. Copies | Old insertion observations may survive in backup/WAL and infrastructure logs. Omission at source reduces copies; deleting the live field alone is insufficient. |
| 6. Legal/compliance unknowns | Whether an operations purpose justifies collection, precision, access and independent duration; timing correlation must be assessed. |
| 7. Indefinite-retention risk | A durable operational activity trace with no semantic benefit, growing across backups and copies. |
| 8. Early-deletion risk | Loss of troubleshooting/ingestion chronology and, if selected, retention-clock evidence. It does not remove required historical times embedded in canonical receipt bytes. |
| 9. Restore | Do not recreate insertion time as now, backfill guessed times or resurrect expired optional metadata. Revalidate retained clock evidence before restarting cleanup. |
| 10. Failure / stop | If omitted, do not invent a metadata cleanup requirement. If retained, expose overdue cleanup; if necessary clock evidence is unavailable, stop affected intake/disposal and escalate instead of guessing. |

### D6 — Future Rule-to-receipt relationships

| Question | Assessment |
| --- | --- |
| 1. Purpose and truth layer | Future exact immutable Rule-version identity → receipt fingerprint, with the already required fact/cell/support correspondence. Historical association only; Rule acceptance and lifecycle remain outside this packet. |
| 2. Privacy / forbidden preimages | Global G/C association only after independent qualification; §3 excludes traveller evaluations, account-specific Rules, request links and personal usage histories. |
| 3. Deletion with a surviving reference | Deleting the relationship while a Rule remains loses proof of which production it relied on. Keeping only the relationship after receipt deletion loses the production evidence. Neither establishes current Rule truth. |
| 4. Sharing | All exact Rule versions and retained historical relationships referencing the same receipt count. One superseded Rule does not release another active or historically protected reference. |
| 5. Copies | Old Rule edges may be restored after receipts expired, or vice versa. Backup/WAL/exports require a coherent recovery decision for both domains, without granting F8 authority. |
| 6. Legal/compliance unknowns | Product explanation/complaint needs, applicable preservation obligations and whether historical associations must survive Rule retirement. No retention duty is inferred. |
| 7. Indefinite-retention risk | Ever-growing historical Rule graph and implicit indefinite protection of receipts/dependencies without periodic purpose review. |
| 8. Early-deletion risk | An active Rule becomes historically unexplainable; downstream consumers may mistake missing provenance for a supported statement. Losing audit evidence is not proof the fact was false. |
| 9. Restore | Reconcile exact versions, reference protection and expiry before release. Never repoint an old Rule to a newer receipt or manufacture renewed acceptance. |
| 10. Failure / stop | Unknown reference state blocks disposal. If a future approved maximum age is reached, affected active reliance must stop or be separately resolved before deletion; no automatic Rule mutation is designed here. |

## 5. Three lifecycle options — all unapproved

The names **A/B/C below refer only to lifecycle alternatives**, not #859's storage options. Each assumes admissible content, private access, unchanged canonical identities and exact retained closure. No option grants storage of failed attempts, raw review packets or source bodies. Optional metadata is decided independently in §10.

| Dimension | A — Retain for the declared corpus purpose | B — Protect references, expire after release | C — Absolute maximum age with prior reference exit |
| --- | --- | --- | --- |
| Retention basis / trigger | Keep successful receipt closures throughout a specifically declared corpus/archive purpose. Eligibility follows documented purpose termination or a separately approved exception. Periodic purpose review and capacity limits required; this can be indefinite in practice. | Keep while protected; receipts never linked to a Rule expire after an approved unreferenced period from an approved immutable production-time anchor. Once referenced, eligibility follows release of the last protected reference plus an approved post-release period. | Every receipt reaches an approved maximum age from an approved immutable production-time anchor, regardless of reference longevity. An earlier unreferenced cleanup rule may also be chosen. No silent active-reference extension. |
| Active Rule protection | No normal expiry while the Rule/corpus purpose continues. Terminating the purpose requires explicit treatment of active and historical Rule relationships first. | Active Rule versions always pin their complete provenance closure. Separately protected historical Rule relationships also pin it. The PO must accept potentially unbounded active lifetimes. | Before the deadline, separately governed Rule owners must end reliance on that exact old relationship, retire the affected use or establish a separately accepted new version/receipt. A new receipt never replaces the old history. No deletion underneath an active reference. |
| Shared artifacts / references | Artifacts may outlive all receipts if the approved archive purpose independently includes them. Otherwise all referencing parents/purposes must be released before disposal. | Share by exact immutable identity; retain the union of all protected closures. No independent artifact archive by default within this option; after final release apply the explicitly approved artifact cleanup/grace rule. | An artifact stays while any not-yet-expired protected closure needs it. Reuse can keep the same artifact alive beyond one receipt's maximum age. A universal artifact-age cap would require stopping all dependent uses and is a separate explicit choice. |
| Integrity while retained | Complete immutable bytes, required links and custody closure, supported historical codecs and honest read failures; no partial archival success. | Same guarantee, including for unreferenced receipts still within their period. Retained old parents continue protecting their required links/children until the approved transition. | Same guarantee until approved expiry/withdrawal. Do not downgrade completeness gradually to make an age cap appear satisfied. |
| What deletion loses | Purpose-end deletion can remove the whole historical corpus: exact facts, supports, definitions, origin links and Rule association checks cease to be available. | History outside the approved post-release/unreferenced windows becomes unverifiable even when a surviving shared artifact remains. Artifact survival alone cannot reconstruct a deleted receipt. | An old production ceases to be verifiable after its deadline; users cannot rely on a new record as proof of the old event. Explicit loss of long-term audit history is a product choice. |
| Operational complexity / failure | Simplest recurring eligibility, hardest long-term capacity, purpose review and end-of-purpose disposal. Missed reviews can become unmanaged indefinite retention; stopping intake does not dispose of existing data. | More complex accurate reference inventory and release evidence; races, stale counts and never-released historical edges can over-retain or cause premature deletion. | Highest coordination burden: deadlines, Rule-owner action and retirement before expiry. Missing replacements or unknown references can force product unavailability and a reported overdue-retention incident. |
| Privacy / security benefit | Fewer accidental audit losses and less pressure to copy missing history into ad hoc archives. | Reduces obsolete/orphan history while maintaining evidence for protected uses; optional metadata can have a shorter independent life. | Predictable receipt exposure horizon and pressure to retire obsolete provenance; limits accumulated receipt history when enforced. |
| Privacy / security cost | Largest cumulative disclosure/correlation window, maintenance and incident-remediation scope. Needs a demonstrated enduring purpose, not “immutable means forever.” | Active references can retain data indefinitely; dormant Rule relationships may become hidden retention extensions. No global age guarantee. | Does not itself cap shared artifact life or backup residuals; rushed cleanup/renewal can produce integrity failures and operational copying. |
| Migration / rollback | Enter only with exact admissible available bytes and known purposes. Moving to a shorter policy requires an inventory and impact review, not bulk deletion. Rollback cannot restore history after all authorized copies expire. | Existing unknown first/reference-release times must remain unknown pending reviewed disposition; no fabricated backdating or reset. Moving to a longer policy cannot recreate already deleted closures. | Existing over-age objects require a reviewed transition cohort and active-use resolution before enforcement. Restoring or retrying an old object cannot restart its age. Removing the cap later cannot recover erased history. |
| Gate effect | Requires explicit PO + Security + Privacy approval, purpose-review parameters and operational readiness before actual persistence/operation. Merely deferring a decision is not Option A approval. | Same gate; exact clocks, periods, protection scope and cleanup-health expectations must be resolved before implementation depends on them. | Same gate plus an approved future Rule-lifecycle response to expiry. Without that prerequisite this option cannot safely operate with active Rule references. |

For B, a later new protected reference cancels pending eligibility; after its eventual release, the post-release period is evaluated under the approved policy. This is a deliberate way references can prolong storage and must be audited as such. An identical write retry, read, deployment or restore is never a new reference or a clock reset. A retained historical Rule relationship either remains protection-bearing or is explicitly allowed to become an unavailable historical pointer; that choice is not inferred from the word “superseded.”

For B/C, the PO must name the exact existing trustworthy time value used as the age anchor and the meaning of elapsed time. #855 has several observation/reference times, not a generic creation timestamp. Insertion time is not automatically production time. If reliable age/release evidence cannot be obtained within the approved minimal data classes, implementation remains gated; do not invent a timestamp or make optional metadata mandatory silently.

**Reference accounting is a semantic obligation, not a counter design.** Counts are usable evidence only when complete and coherent with all retained parents and concurrent reference changes. Zero is insufficient if a query failed, a custody edge was omitted, a restore is incomplete or a new reference can race deletion. Later implementation must prove that no protected reference can become dangling. This packet chooses no locking, schema, RPC, cascade or garbage-collection mechanism.

## 6. What can and cannot be proved historically

While a complete supported #859 closure is retained, its reader can check canonical bytes, full digests, exact identities, required relationships and independently checkable historical predicates. #861 adds retained evidence of origin/admission/selection/review associations. Neither byte integrity nor those associations alone authenticate origin against a forged whole graph, reproduce original private same-object execution, prove current eligibility, or accept a Rule.

The design deliberately omits raw government bodies, raw phase-B observations, private seals and full raw review packets. Their omitted preimages cannot be replayed from storage. #861's admitted safe proposal-null review-construction artifact can support the specific historical review-key binding it contains; it does not restore a raw packet, model material or execution authority. A current source fetch is a new observation, never the old body.

| What remains after a loss | Honest residual claim | Claim that is no longer supportable from retained material |
| --- | --- | --- |
| Receipt fingerprint only | A reference string exists; if a separately authenticated retained relationship exists, it records that reference. | Exact old payload, successful production, original origin or full historical integrity merely from the string. |
| Receipt bytes, incomplete artifact closure | Locally available bytes may still match their fingerprint; disclose incomplete history. | Full historical interpretation/selection/contract verification. |
| Receipt and #859 closure, missing #861 binding/origin artifacts | The narrower retained material may pass its own checks. | Complete custody history or an assertion that missing original custody was trusted. |
| Artifact bytes but missing required links | Parent bytes describe expected dependencies. | A complete stored graph or authority to repair links in a reader. |
| Shared artifacts after one receipt is deleted | Those artifacts can support other retained closures. | Reconstruction or proof of the deleted receipt/event. |
| Rule version but missing relationship/receipt | The Rule record exists under its own contract; provenance availability is separate. | Which exact production justified it, or complete historical proof of that production. |
| Optional insertion metadata deleted | Semantic integrity may remain intact if no required dispatch/expiry evidence was removed. | Original insertion chronology or operational troubleshooting using the deleted observation. |

Preserve #859's reader vocabulary: absent root = `receipt_corrupt` with `receipt_absent`; absent artifact = `dependency_missing`; required-link/byte mismatch = `dependency_corrupt` as specified; unknown version = `unsupported_version`. Operational denied/timed-out reads remain outside integrity verdicts. This packet adds no reader status. Policy-compliant deletion does not become `valid`; missing material does not by itself prove deletion, tampering, nonexistence or a false Rule.

Whether to retain minimized proof of prior existence/disposal is itself a PO + Security + Privacy question. A tombstone/fingerprint still reveals history, needs a purpose and lifetime, and cannot replace deleted content or prove erasure across backups. Omission means accepting that “never existed” and “previously deleted” may not be distinguishable from the retained material.

Deletion must not permit reusing an old artifact id/version for different bytes, resetting an expired receipt's age through reinsertion, or republishing incident-rejected content. A later implementation must show how the approved lifecycle preserves identity non-reuse and authorized re-admission across deletion and restore. If it needs retained identity/disposal evidence, its fields, purpose and lifetime require explicit approval; none is silently introduced here. If the chosen minimization policy makes that proof unavailable, affected re-admission stays blocked. Backup copies and surviving external relationships make “the live store is empty” insufficient evidence that an identity was never used.

## 7. Live deletion, copies and restore boundaries

These are technical distinctions, not legal conclusions or Jetnity configuration claims. Supabase documents restoration from database backups and replay of WAL for PITR, with recovery points bounded by the configured available window. Its database backups do not restore separately deleted Storage API objects. See [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups), checked 6 October 2026. Actual Jetnity settings, copies and provider commitments must be established before any retention promise.

PostgreSQL distinguishes logical deletion from reclaiming old tuple versions and describes recovery using a base backup plus archived WAL. Consequently, a successful live delete or vacuum is not evidence that historical copies have been securely erased. See [routine vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html) and [continuous archiving/PITR](https://www.postgresql.org/docs/18/continuous-archiving.html), checked 6 October 2026. No vacuum, WAL manipulation, restore or database command is run here.

| Copy boundary | Decision and evidence needed before operation |
| --- | --- |
| Live store and ordinary read surfaces | Define eligibility, maximum cleanup lag, coherent closure/reference handling and what a verified live absence means. Restrict access to expired/incident material while resolution is pending; restriction is not deletion. |
| Replicas, caches and projections | Inventory copies and lag; prove expiry propagates, including stale read paths. They cannot become alternate historical authorities or unauthorized retention extensions. |
| Backups, snapshots and PITR/WAL archives | Record actual coverage, locations, access, recovery horizon, residual-copy maximum and provider deletion commitments. A backup taken before deletion can restore deleted rows. Do not destroy shared recovery chains ad hoc to erase one object. |
| Exports, support copies and local restore environments | Either prohibit unnecessary copies or assign an approved purpose/owner/lifetime and disposal proof. A manual export is not covered merely by the database backup setting. |
| Application/platform/security logs | Do not log receipt/artifact bytes, unsafe inputs, personal identifiers or raw failures. Independently govern any minimal health/disposal observations; logs are not a fallback provenance archive. |
| Archived code / optional future external storage | Verify exact byte availability and independent copy lifecycle if ever approved. Database metadata restoration does not guarantee separately stored bytes exist. No new storage service is selected here. |

Backups support recovery, not a hidden longer audit tier. If the chosen policy permits residual copies until their approved expiry, those copies remain restricted and cannot be used to answer ordinary historical queries past the live retention boundary. Any exception requires an explicit purpose/authority decision; emergency restoration is not such an exception by default. Encryption is useful protection but is not an asserted erasure guarantee or a chosen key-destruction scheme.

## 8. Candidate operational safeguards and failure handling

These safeguards are proposed for the later decision and implementation review. They are not deployed controls or producer/SQL design.

**Recovery release conditions:** restore in isolation with affected intake and historical/product exposure stopped; establish a policy/deletion/exception record at least as current as the approved pre-incident decisions, outside the rollback point or through independently verified recovery evidence; reconcile current Rule-reference protection and all copies; validate exact bytes, links, custody closure and historical codec support; recalculate expiry from original approved clocks; remove or restrict objects that must not reappear; prove real cleanup health and obtain the named recovery-owner release before resuming. Restored scheduler timestamps are not new execution evidence. Historical integrity success is not current source revalidation or Rule acceptance.

If post-backup deletion decisions or current references cannot be reconstructed, **do not release the restored data or guess that old rows are allowed**. Keep affected processing stopped and escalate to the designated owners. The PO must choose whether minimized recovery/disposal evidence is retained, where its authority survives rollback, and for how long; no ledger format is designed here. A restore that cannot meet these obligations is unavailable, not successfully recovered for product use.

| Failure or condition | Candidate fail-closed response | Evidence / resumption condition |
| --- | --- | --- |
| Cleanup never ran, failed, is stale, or health cannot be read | Stop affected new persistent admission; expose unhealthy state. Do not extend retention silently or claim the kill switch deleted existing content. | Named operator verifies a real committed cleanup, current backlog/oldest overdue age and scheduler execution. A manual run may mitigate backlog but does not prove the scheduler works. |
| Cleanup succeeded but expired backlog remains | Report overdue objects and breached deadline separately from job success; bound further growth. | Backlog completion and required cadence recovered, or explicitly approved incident disposition. No green status solely because a command exited successfully. |
| Ref inventory/count disagrees, concurrent pin change, unknown Rule status | Stop disposal for the affected graph and new reliance that would deepen uncertainty; retain privately pending bounded escalation. | Complete reference reconciliation and later proof of race-safe behavior. This containment can itself over-retain and must be reported. |
| Partial deletion/crash/timeout | No success claim; no partial graph presented as complete. Quarantine affected availability, not mutable receipt flags. | Reviewed exact recovery/disposal completes; ordinary insert retries never repair missing dependencies. |
| Capacity limit reached | Stop new admissions before unbounded growth; never evict active/shared evidence opportunistically. | Approved capacity/retention resolution; no new paid storage selected automatically. |
| PII/secret/model preimage discovered after admission | Restrict access and affected intake immediately; notify authorized incident owners through the approved process. Assess every shared dependent and residual copy; rotate exposed secrets through a separately authorized response if needed. | Security + Privacy/competent Legal resolve containment, disposal versus any specific preservation need, downstream impact and re-entry conditions. No raw offending bytes in new logs or evidence docs. |
| Maximum-age deadline conflicts with an active Rule (Option C) | Alert before the deadline; require separately governed end of affected reliance. If unresolved, stop that reliance and affected new persistence, record overdue-retention incident, escalate. | Approved Rule-lifecycle/reference resolution before coherent deletion. Neither a silent extension nor a dangling active reference counts as compliance. |
| Restored expired/deleted material or policy state rolled back | Stop access/intake pending the recovery release conditions above. | Current authorized decisions reapplied and verifiable disposal/restriction; original age is preserved. |
| Missing/corrupt/unsupported historical data or storage outage | Return the existing bounded failure semantics; stop complete-history claims and affected new reliance. Preserve research only if independently permitted and unaffected. | Verified exact recovery and supported contracts; no mutable-registry fallback or source/model call to fabricate history. |

Minimum operational questions for the PO: cleanup cadence, maximum tolerated overdue age, health freshness threshold, capacity envelope, warning/escalation threshold, accountable operator, incident owner, kill/stop scope and release authority. Define them separately: an eligibility period is not a deletion SLA; a cleanup schedule is not evidence it ran; successful deletion of some objects is not full backlog health. Health evidence must remain minimal and cannot create a persistent log of failed receipt-production attempts prohibited by #855.

No blanket legal hold or emergency exception is assumed. A later exception needs a competent determination of purpose and authority, exact scope, access restriction, review/end condition and recorded release; it must not silently retain the whole shared corpus. Urgent privacy/security remediation can conflict with audit protection. Report the consequence, stop affected reliance and route the decision rather than inventing a legal priority rule.

## 9. Decision readiness, review cases and remaining gates

The packet is ready for a decision because it exposes rather than resolves the following unknowns: duration/basis per class; active and historical Rule protection; shared orphan artifacts; operational metadata; health/capacity limits; copy/backup constraints; recovery evidence; incident exceptions; disclosure and legal sufficiency. Their being unanswered blocks actual persistence implementation/operation where needed, not completion of this decision-preparation slice. Independent exact-head TL review is still required.

Before an eventual implementation can operate, reviewers should require demonstrated outcomes for these scenarios. These are **review obligations, not executed tests or instructions to start another slice**:

1. Two receipts and two Rule versions share one artifact; deleting one eligible receipt preserves every remaining protected path.
2. An old Rule is superseded but its history remains protected; “not active” does not accidentally release that protection.
3. An edge disappears, a reference read fails or a new reference races eligibility; no protected artifact is disposed of based on a false zero.
4. A receipt is replayed, restored or retried identically; no retention clock or original insertion timestamp resets.
5. A pre-deletion backup restores a receipt or Rule relationship; expiry and the current deletion decisions are reapplied before release, or recovery stays blocked.
6. Cleanup runs successfully while leaving overdue backlog; health reports both facts and bounded escalation occurs.
7. A custody binding disappears although the #855 bytes are intact; the result does not claim complete custody history.
8. A shared artifact contains forbidden material; incident disposition covers all dependents and residual copies without inventing a sanitised old identity.
9. Optional metadata expires while a semantic receipt remains; required receipt times/codec dispatch and approved expiry evidence still exist, or that design is rejected.
10. Option C reaches its deadline without a safe separately authorized Rule-reference exit; use stops, the conflict remains visible, and no silent extension or F8 action is inferred.

The Technical Lead reviews this packet, then the Product Owner + Security + Privacy decide, with competent Legal advice where needed. A signed choice still does not authorize producer implementation, SQL/migration, Development/Production apply, public/admin UI, provider/model calls, Evidence/Rule acceptance or F8. Those require their own bounded approvals. No follow-up is started here.

## 10. Minimal Product-Owner + Security + Privacy decision form — unsigned

**Decision state: UNDECIDED. Every answer and approval below is blank.** “Packet READY,” a Draft PR, a technical recommendation, CI success or a merged architecture is not a signature. Do not execute a partially completed choice.

| Required decision | Fill in explicitly; no default |
| --- | --- |
| D01. Chosen basis and scope | Option A / B / C, or return for revision: ___ . Purpose and covered corpus/environments/classes: ___ . Effective policy version/date and treatment of preexisting objects: ___ . |
| D02. Periods and clocks | D1 receipt period/trigger and exact original clock: ___ . D2 artifact purpose/final-release grace: ___ . D3 links and D4 custody closure aligned with retained parents: ___ . D6 historical Rule relationships: ___ . A purpose-review interval or B unreferenced/post-release periods or C absolute maximum: ___ . Units, boundary and maximum cleanup lag: ___ . No reset on retry/restore: acknowledge ___ . |
| D03. Active Rule references | May their provenance ever expire? ___ . If yes, mandatory prior end-of-reliance/retirement and owning future Rule contract: ___ . If no, accept potentially unbounded active retention and review obligation: ___ . Treatment of retained superseded/historical Rule relationships: ___ . Unknown reference state response: ___ . |
| D04. Shared immutable artifacts | May an artifact outlive a deleted referring receipt while others need it? ___ . May it outlive **all** referring receipts for an independent purpose? ___ . If yes, purpose/period/review: ___ . Any absolute artifact age cap and handling of all dependent uses: ___ . No per-receipt cascade: acknowledge ___ . |
| D05. Optional insertion metadata | Omit / retain a demonstrated minimal subset: ___ . Necessity, fields, precision, access, independent trigger/period: ___ . If used as lifecycle evidence, its required lifetime and non-reset rule: ___ . Required semantic receipt times remain unchanged: acknowledge ___ . |
| D06. Cleanup and stop expectations | Cadence: ___ . Max overdue age: ___ . Health freshness/warning thresholds: ___ . Capacity bound: ___ . Operator/escalation owner: ___ . Unknown/stale/failing/backlog stop scope and release evidence: ___ . Research separation and active-use treatment: ___ . |
| D07. Backup/PITR and other copies | Acknowledge live deletion is not instant erasure of backups/WAL/replicas/exports/logs: ___ . Verified inventory, access/locations, provider constraints and residual-copy maximum/expiry evidence: ___ . No backup-based ordinary audit after live expiry unless expressly approved: ___ . |
| D08. Restore and disposal evidence | Release owner: ___ . How current expiry/reference/exception decisions survive rollback and are reapplied before exposure: ___ . Minimized proof-of-existence/disposal/identity-non-reuse evidence or deliberate omission, purpose/lifetime/access: ___ . Re-admission constraints after expiry or incident disposal: ___ . If necessary evidence is unavailable, keep recovery/re-admission blocked: ___ . |
| D09. Incident and preservation conflicts | Security/Privacy incident owners: ___ . Competent adviser for any claimed preservation duty: ___ . Scoped exception authority, review/end condition, residual-copy handling and effect on dependent Rules: ___ . No blanket hold presumed: ___ . |
| D10. Storage versus visibility | Storage approval scope: ___ . Private server/admin historical access purpose and separately approved capability: ___ . Public provenance visibility: ___ (requires a separate product/privacy design; this packet creates none). Disclosure of unavailable history without claiming cause: ___ . |
| D11. Legal/privacy sufficiency | Adviser/decision reference covering applicability, purpose/basis, minimization, periods, rights, preservation, code/source rights and processor/copy commitments: ___ . Unresolved constraints: ___ . No compliance claim inferred from engineering classification: acknowledge ___ . |
| D12. Approval and remaining gates | Product Owner name/date/reference: ___ . Security name/date/reference: ___ . Privacy name/date/reference: ___ . Competent Legal input where required: ___ . TL compatibility review reference: ___ . This decision alone authorizes no implementation/apply/acceptance/UI/Production action: acknowledge ___ . |
