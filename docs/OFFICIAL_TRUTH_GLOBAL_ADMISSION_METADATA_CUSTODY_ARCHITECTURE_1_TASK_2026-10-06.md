# Official Truth global admission and trusted metadata custody architecture 1 — Task

Date: 6 October 2026
Issue: #860
Status: **BINDING / DOCS-ONLY TRUST ARCHITECTURE / NO RUNTIME / NO DB / NO EVIDENCE ACCEPTANCE / NO F8**

## 1. Baseline

Repository: `Jetnity/jetnity`
Baseline: `main@7fb95414db6b7e4de12bea0df29b2c771081b9d4`
Machine mode at dispatch: `NORMAL`

Merged prerequisite:
- #855 — `AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_READY_FOR_PERSISTENCE_DESIGN`

Parallel active slices:
- #856 / Draft PR #857 — Applicability Schema 2 dormant runtime foundation
- #858 / Draft PR #859 — autonomous provenance persistence architecture

This writer is docs-only and owns only its own five files.

Zero path overlap with #857/#859 is mandatory.

## 2. Writer

Logical writer:
**Jetnity Official Truth global admission trusted metadata custody architecture 1**

Generation: **1**

Execution:
**Codex Desktop — new session**

Required model:
`gpt-6-astra` / `xhigh`.

Standing #751 autonomous execution directive applies through commit + push.

Keep Draft.
Never Ready or merge.
STOP after delivery.
No automatic follow-up slice.

## 3. Binding problem from #855

Merged #855 established that a future autonomous provenance receipt may only exist when all retained data already comes from a trusted global server-held chain.

Current live review/proof code can reconstruct semantically accepted-looking Evidence from submitted envelopes. That does **not** by itself prove server custody of:
- original `retrievedAt`;
- `validFrom` / `validUntil`;
- reviewed scope/cell;
- fact kind;
- evidence quality;
- exact accepted Evidence version set;
- source/content/profile selection;
- review/proposal preimage;
- support selection.

Fresh byte/hash equality does not retroactively authenticate caller-submitted metadata.

This slice must close the **architecture** of that trust gap. It must not implement it.

## 4. Exact goal

Design the smallest source-neutral precondition chain that a future private provenance producer must require before it may construct the #855 receipt.

The architecture must establish, independently of traveller requests:

1. a server-held immutable **global regulatory cell definition**;
2. trusted custody of the accepted Evidence versions and their original metadata;
3. trusted server selection of the exact support set;
4. exact scope equality/rebinding across cell, Evidence, candidate and proof;
5. proposal-null / model-free review identity;
6. non-personal qualification of every retained source representation/hash/URL;
7. same-request freshness remains separate from original metadata custody;
8. no caller-supplied identifier/value becomes authority merely because server code parses it.

## 5. Required live reads

Read current live code/docs at minimum:

- merged #855 semantic architecture/report/handoff/self-review
- `lib/readiness/evidence.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-server-held-source-registry.ts`
- `lib/readiness/official-truth-same-request-proof-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-content-identity.ts`
- source/content/profile registries and relevant tests
- current accepted-Evidence store/read boundaries
- current Official Truth v2 Development/Production truth recorded in #751
- #294 product truth boundary
- #741 only as future F8 context

Live code wins over historical architecture.

No Supabase writes. No DB mutation.

## 6. Global regulatory cell definition

Design the smallest server-held global-cell contract required by #855.

It must be:
- non-personal;
- independently defined before a traveller request;
- immutable/versioned;
- source-neutral;
- exact enough to bind one regulatory RuleScope cell;
- not minted from a caller's current Trip/traveller state;
- not a lossy anonymization of personal scope.

At minimum decide:

- logical `globalCellId`;
- cell version;
- exact canonical `RegelScope`;
- immutable digest/fingerprint;
- status/eligibility handling without rewriting historical definition;
- how scope equality is proven;
- how travel-date-bearing cells are admitted only when the date is a globally defined regulatory evaluation date rather than a traveller itinerary date;
- whether residence/citizenship/document-option dimensions are allowed only when they describe public legal categories;
- how repeated traveller-specific combinations are prevented from becoming a hidden global corpus.

No DB schema implementation.

## 7. Trusted accepted-Evidence custody

Design the architecture proving that Evidence metadata is already trusted server-held material before autonomous provenance production.

The chain must distinguish:

### A. Semantic Evidence validity
Existing parser/validation requirements such as lifecycle/validation state, identity binding, lookup/version ids, scope and evidence quality.

### B. Original metadata custody
Independent server custody/origin proof for:
- retrievedAt;
- validFrom / validUntil;
- scope;
- fact kind / requirement type where bound;
- evidence quality;
- exact source/content/representation/profile identity;
- exact source content hash observed for the accepted version;
- exact accepted Evidence version identity.

A submitted review envelope that reproduces these values is not origin authority.

Determine the minimum immutable server-held object/record/reference needed to prove custody.

Do not design Evidence acceptance policy itself and do not create a write path.

## 8. Exact support-set custody

The future trusted request must not accept a caller-provided support list as authority.

Design how the exact accepted support set is selected from trusted global material.

Requirements:
- support IDs/versions selected server-side;
- deterministic ordering;
- exact source/content item identity;
- no unreviewed extra support;
- no omitted required support;
- explicit-primary vs composition distinction;
- one-item explicit-primary constraints remain;
- composed set selection must be compatible with separately frozen extractor/policy selection;
- no post-hoc support substitution after fresh retrieval.

If support selection needs a code-owned manifest/definition, specify it as **PROPOSAL / NOT IMPLEMENTED**.

## 9. Scope rebinding invariants

Define exact equality/rebinding chain:

global cell definition
→ accepted Evidence scopes
→ review/proof candidate scope
→ same-request extraction scope
→ canonical candidate fact binding
→ provenance receipt global cell

Requirements:
- no default traveller/citizenship/document;
- no scope broadening or narrowing after evidence selection;
- no dropping a qualifier for privacy;
- no travel-date replacement with serverReferenceTime;
- no issuer→citizenship or residence→citizenship inference;
- multi-citizenship and credential-option semantics remain explicit;
- any mismatch fails closed before receipt production.

Specify whether existing `rule-scope:v1` key is sufficient as an equality witness or only a checksum that must be accompanied by parsed canonical equality.

## 10. Proposal-null / model-free review chain

#855 requires that model/plugin output never enter the retained review/provenance preimage.

Current review packet identity may include `proposal`.

Design the safe autonomous chain.

At minimum decide:

- whether autonomous review material must be constructed server-side with `proposal:null` from inception;
- whether an existing packet with non-null proposal can ever be sanitized/reused (expected answer must be independently reasoned);
- whether a new autonomous review identity/domain is needed or whether current `review-packet:v3` is sufficient when constructed with safe preimages;
- how model/plugin text is excluded even indirectly through hashes/ids;
- how caller-provided candidate proposals remain non-authoritative and outside the provenance chain.

No prompt/model logging design.

## 11. Non-personal source-representation admission

A public URL/body is not automatically safe global provenance.

Design a bounded qualification for a source representation whose full-body hash/final URL/request URL may enter the global receipt.

Must reject or separately gate:
- personal case-response pages;
- named traveller records;
- tokenized/signed/private URLs;
- session-bound pages;
- account-specific portals;
- query/body values containing personal data;
- cookies/auth/session-dependent representations;
- pages where non-personal nature cannot be established.

Define the minimum code-owned/source-profile fact establishing:
- representation is public/global;
- URL is non-personal;
- full response body identity is non-personal enough for retained hash;
- raw body still does not need to be stored in the receipt;
- a sanitized excerpt hash cannot masquerade as the accepted full-response hash.

Do not create a new source profile or registration.

## 12. Same-request freshness vs original custody

Keep two trust dimensions separate:

### Original accepted Evidence custody
Historical metadata and accepted version origin.

### Fresh same-request reproof
Current server-owned retrieval proving exact identity/hash/final URL/MIME against those accepted supports.

Fresh retrieval cannot fix untrusted original metadata.
Trusted original metadata does not eliminate the need for fresh reproof.

Define the required ordering and failure semantics.

At minimum identify:
- custody_missing;
- scope_mismatch;
- support_set_mismatch;
- proposal_not_null;
- representation_not_global;
- fresh_reproof_failed;
- identity_drift;
- freshness_gap.

Names are proposals unless current code already has exact reasons.

No runtime implementation.

## 13. Trust-source matrix

Produce an explicit matrix for every future provenance input:

- field/value;
- trusted source;
- whether caller input is permitted as a hint only;
- whether caller input can ever become authority;
- required immutable/versioned server artifact;
- failure mode if unavailable.

Cover at minimum:
- global cell;
- Evidence version ids;
- Evidence timestamps/validity;
- source/content/profile identities;
- source content hash;
- exact support set;
- fact kind;
- evidence quality;
- extractor/policy selection;
- reviewPacketKey;
- serverReferenceTime;
- fresh retrieval completion data;
- candidate fact.

## 14. Authority/capability boundary

This architecture must not create a bearer token or resume capability.

Possession of:
- globalCellId;
- accepted Evidence versionId;
- custody object id;
- reviewPacketKey;
- support manifest id;
- hash/fingerprint;
- proof witness

must never authorize:
- Evidence acceptance;
- extraction;
- Rule acceptance;
- F8;
- persistence;
- provider activation.

The future private producer must receive trusted objects from server custody, not deserialize arbitrary IDs from the caller and look them up as authority unless a separately authorized server selection step establishes that binding.

## 15. Privacy

No:
- user id;
- traveller id;
- trip id;
- document/passport number;
- MRZ;
- birth date;
- personal residence history;
- request/session id;
- IP/cookies;
- prompts/model conversation;
- traveller free text;
- secrets/tokens;
- hash of PII.

If an existing key's preimage could include personal/model data, it is not admissible merely because the stored value is a hash.

## 16. Interaction with parallel #857 and #859

### #857
Schema-2 runtime semantics are independent of this custody architecture.

Do not depend on unmerged #857 behavior.
Do not edit its files.
If #857 later changes applicability schema versions, this architecture should reference versioned schema artifacts generically rather than hard-coding an unmerged implementation.

### #859
Persistence architecture is independent of how trusted custody is established.

This slice may state what immutable custody artifacts a later persistence layer must be able to retain/resolve, but:
- do not design tables/SQL;
- do not edit #859;
- do not preempt its persistence choice.

If a conflict with #859's delivered design emerges later, TL will reconcile after both are independently reviewed.

## 17. Decision

End with exactly one:

### `GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_READY_FOR_PRODUCER_DESIGN`

Only if:
- global-cell admission is bounded and non-personal;
- original Evidence metadata custody is closed;
- exact support selection authority is closed;
- proposal/model contamination is excluded;
- source representation global/non-personal admission is closed;
- fresh reproof remains separate;
- caller values cannot become authority by structural replay.

OR:

### `GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_NOT_READY`

List exact unresolved gaps.

READY authorizes only later TL consideration of a separately bounded private producer/metadata-custody implementation design.

It does not authorize implementation, Evidence acceptance, DB writes, persistence, Rule acceptance, F8 or Production.

## 18. Required output

Architecture must include:

- exact logical objects/contracts proposed;
- global-cell definition;
- trusted Evidence custody object/reference;
- support selection contract;
- scope-rebind algorithm;
- proposal-null/model-free chain;
- non-personal representation qualification;
- original-custody vs fresh-reproof sequence;
- trust-source matrix;
- authority/capability matrix;
- privacy classification;
- adversarial cases;
- versioning/drift behavior;
- exact future implementation candidate paths clearly marked **PROPOSAL / NOT IMPLEMENTED**;
- exact remaining gates.

No SQL.

## 19. Parallel guard

Active writers:
- #856 / Draft PR #857
- #858 / Draft PR #859

Before work and before push:
- re-read main/mode/#751/#748/#860/PR;
- inspect #857/#859 current Changed Files;
- prove zero path overlap;
- STOP on overlap.

Do not sync/edit #857 or #859.

## 20. Hard prohibitions

Absolutely no:
- runtime/code/test changes;
- Evidence acceptance implementation;
- autonomous provenance producer implementation;
- persistence/store implementation;
- SQL/migration;
- Supabase/DB mutation;
- Development/Production apply;
- retention/lifecycle decision;
- source/content/profile registration;
- extractor/policy activation;
- Rule acceptance;
- F8;
- provider activation;
- CH import/CH-11;
- Trip Workspace/B01;
- secrets/credentials;
- Ready/Merge;
- follow-up slice.

## 21. Allowed files

Immutable TASK:
- `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_TASK_2026-10-06.md`

Delivery only:
- `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_1_SELF_REVIEW_2026-10-06.md`

No other files.

## 22. Validation / STOP

Before push:
- live re-read main/mode/#751/#748/#860/PR/#857/#859;
- immutable TASK blob;
- exact five-file diff;
- merge-base/ahead/behind;
- zero path overlap with #857 and #859;
- `git diff --check`;
- operating-mode gate;
- working tree clean;
- exact session/model/effort.

Commit + push autonomously.

Read exact-head GitHub CI and Vercel Preview. If infrastructure delays exist, report actual status without inventing PASS.

Then report:
- exact remote head;
- exact changed files;
- TASK blob;
- merge-base/ahead/behind;
- zero-overlap proof;
- final classification;
- CI/Vercel;
- session/model/effort;
- unresolved gates.

Keep Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not start producer implementation, persistence, retention or F8.
