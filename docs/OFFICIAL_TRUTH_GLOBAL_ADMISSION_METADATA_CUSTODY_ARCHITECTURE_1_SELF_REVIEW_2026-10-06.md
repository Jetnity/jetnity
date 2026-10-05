# Official Truth global admission and trusted metadata custody architecture 1 — Self-review

Date: 6 October 2026
Logical writer: **Jetnity Official Truth global admission trusted metadata custody architecture 1**, Generation **1**
Issue #860 · Draft PR #861
Session: `01a10e2d-fc54-7ad2-93d2-f0f5186402ed` · **`gpt-6-astra` / `xhigh`**

This is the author's review against the binding TASK and baseline code. It is not independent Technical-Lead PASS, an executed test suite, or a claim that the proposed custody mechanisms exist.

## Task coverage

| Requirement | Architecture location / review conclusion |
| --- | --- |
| Exact logical contracts and origin roots | Section 3; closed semantic signatures and exact pin/byte requirements, independent issuance rather than `trusted` flags. |
| Global cell ID/version/canonical scope/digest/history/current eligibility | Section 4; exact #855 definition preserved, separate admission and eligibility snapshots. |
| Non-personal, source-neutral and independent before traveller request | Sections 3–4; reject direct and aggregated traveller-derived corpus formation and request/model backlinks. |
| Regulatory date versus copied travel date; explicit legal categories | Section 4.2; exact predeclared evaluation date, explicit full citizenship/credential/residence, no unrepresentable qualifier loss. |
| Semantic validity A versus original custody B | Section 5; require both, exact original observation/validity/accepted-version provenance; current reproof/store shape alone cannot provide B. |
| Retrieval/validity/source/content/profile/hash/exact-version custody | Section 5.1; full identity preimage, source-bearing scope and immutable original dependencies. Null validity is a trusted explicit result, never unknown-by-default. |
| Fact kind/evidence-quality custody | Sections 5.2/6; candidate-level manifest ownership, no invented EvidenceVersion field. |
| Exact support selection/completeness/order/no swaps | Section 6; independent required item set, one exact eligible version per item, unique sorted IDs/full values, fail on ambiguity/extras/gaps. |
| Explicit-primary and composition selector compatibility | Sections 6.2/10; one support/null policy and post-retrieval MIME selection; composition phase A pre-HTTP and unchanged pair in phase B. |
| Scope rebind and rule-scope:v1 sufficiency | Section 7; all six edges, canonical parsed value equality plus checksum, no broadening/narrowing/defaults. |
| Proposal-null/model-free inception, reuse/domain decisions | Section 9; no sanitized old packet, safe v3 retained as checksum only, future internal seam explicitly required. |
| Public URL is not privacy proof | Section 8; exact qualified full representation, URL and transport; all mandatory rejection cases. |
| Original versus fresh observation and failure semantics | Sections 10–11; ordered all-or-nothing execution, separate original time/validity/reference/completion, eight requested reason concepts distinguished from existing enums. |
| Trust-source matrix | Section 12; every requested field, hint status, no caller authority, immutable artifact and unavailable failure. |
| Authority/capability matrix | Section 13; every named ID/key/witness is non-bearer across acceptance/extraction/F8/persistence/provider actions. |
| Privacy and transitive preimages | Sections 8–9/14; no PII/model/prompt hashes, raw body or personal correlation. |
| Historical artifacts without taking over persistence | Section 14; exact immutable dependency binding, preserve #855 v1 bytes, #859 owns storage. |
| Versioning and drift | Sections 3–6/14; unknown versions and conflicting bytes refuse, history separate from eligibility, no mutable joins. |
| Future paths, remaining gates and classification | Section 15; proposal-only paths, exact downstream gates, one bounded classification. |
| Parallel allowlist and no implementation | Report and final mechanical checks; exactly five own docs including immutable TASK, zero intersections with #857/#859. |

## Adversarial author review

**Origin laundering through a successful fresh fetch.** Traced the current registry/review functions: source registry and clock are server-owned, but envelopes/extraction metadata still supply original values. The proposed accepted-custody loader requires original observation/validity/acceptance dependencies before retrieval; fresh byte equality cannot fill them. A private stored row is not a stronger origin root merely because it is private.

**A correct caller ID becomes authority.** The design separates a public scheduling hint from the server's authorized corpus selection. Exact pins are resolution keys only after that selection established the binding; the producer receives actual trusted invocation objects. An authenticated owner still cannot supply metadata as authority. Historical receipts and authentic custody objects cannot resume execution.

**Global cell is a disguised personal record.** Admission is independently defined, with structured public-category bases and a regulatory-date plan. Removing names or aggregating many requests does not qualify a cell. Exact equality means unsafe scopes are rejected rather than anonymized. No default passport/citizenship, issuer/residence inference or qualifier stripping is allowed.

**Support completeness becomes tautological.** Required source-family items are established by a code-owned definition before submitted material. The eligible-version snapshot must independently resolve exactly one accepted custody object per item. It cannot be built from the list supplied by the caller or from the subset that happened to produce a fact. Both extra and missing supports refuse; composition assignments/citations add field/branch/atom completeness checks.

**Selection timing drifts from the baseline.** Primary's actual winner remains selected with observed MIME using the frozen registry, not forcibly pinned early by an incoming ID. Composition remains frozen before HTTP, cannot use MIME/output to break ties and cannot fall back after phase-B failure. The manifest fixes supports; it does not create a second extractor selector.

**Review-key privacy is checked only at the visible surface.** The actual v3 preimage includes proposal. The architecture forbids clean-up/reuse and traces all preimages, including Evidence IDs and the full-response hash. Safe review construction is a new controlled seam; the current envelope fingerprint API is not falsely claimed to accept custodied values without adaptation. Domain separation alone could not prove origin.

**Qualification assumes “official/public” implies non-personal.** The new contract is distinct from current identity verification and must cover the whole hashed response, including unused fields. Token/session/account/case and uncertain bodies are refused. No raw response retention or redacted excerpt hash is used to evade this gate. A source-specific qualification is a separate future task.

**The new custody artifact moves the same untrusted values one level down.** Its origin references require actual server-issued observation, deterministic validity derivation and separately authorized accepted-version result, bound to full identity preimages and exact contracts. A checksum, store write, signature label or structural lookalike cannot issue those objects. Legacy rows without this origin are not backfilled from current hash equality. Issuance implementation remains an explicit future gate, not an undocumented assumption that the runtime already supports it.

**Historical closure quietly changes the receipt or dictates persistence.** The architecture keeps #855 v1 bytes and introduces only a logical exact dependency association owned by the future producer. It specifies no table, SQL, transaction, access policy or retention. #859 must later be reconciled independently by TL; absence of a historical origin edge cannot be repaired with a current row or mutable ID join.

**Time semantics overclaim freshness.** Original retrieval, validity bounds, reference time and later completion are distinct. Normal completion after reference is allowed; reversed/lost clocks fail. The receipt asserts current-at-reference only. Later acceptance freshness and long-running time boundaries do not acquire approval through these docs.

## Refinements during review

- Added closed semantic reference forms, explicit nullability and artifact byte envelopes while preserving the existing global-definition/v3/receipt bytes.
- Made version ambiguity fail closed instead of introducing an arbitrary latest-version rule.
- Located evidence quality/fact kind in the selection manifest, consistent with the actual EvidenceVersion type.
- Named the missing internal safe-material seam rather than implying that current envelope reconstruction establishes origin.
- Separated the new full-response privacy qualification from the already registered content-identity profile's narrower guarantees.
- Added immutable logical custody dependency linkage without defining #859 storage or silently modifying #855 receipt-v1 preimages.

## Limits and result

No unresolved architecture shortcut is used within the admitted domain. Actual global admission, origin issuance/loader encapsulation, validity contracts, qualification implementations, safe review construction and producer integration remain unimplemented. Their absence today blocks actual receipt production; it does not authorize broadening this docs-only task. No source/cell/version/quality is newly accepted by the document.

Local validation is documentation/operating-mode only. No application tests/build, DB/Supabase access, runtime/test edits, acceptance policy implementation, producer/store, SQL, retention decision, activation, Evidence/Rule/F8, Production, CH or B01 work. Remote exact-head results are read after push and reported without inventing success.

**GLOBAL_ADMISSION_METADATA_CUSTODY_ARCHITECTURE_READY_FOR_PRODUCER_DESIGN**

PR stays **Draft**. **STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
