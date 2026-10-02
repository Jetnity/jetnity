# Official Truth Acceptance Preconditions Adversarial Audit 1 — Report

Date: 2 October 2026
Issue: #746
Draft PR: #749
Branch: `docs/official-truth-acceptance-preconditions-audit-1`
Baseline: `main@3775955f6c4e958b26259d98cb9a0bc35dc2075f`
Logical agent: **Jetnity Official Truth acceptance preconditions adversarial audit 1**
Generation: **1**
Session: https://cursor.com/agents/bc-eeec9607-5592-4bb3-b1ab-c3816351fd5b
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge. No remediation was started.

## Method

`git fetch origin main` resolved `origin/main` to `3775955f6c4e958b26259d98cb9a0bc35dc2075f`. This branch was 0 behind that baseline. The only parent commit on the branch is the task seed `9df757c2`. Runtime files on this head are that baseline.

Issue #746, its comments, and PR #749 do not contain a verbatim Guardian/Chief-of-Staff memo. The memo is also absent from the repository. This audit does not invent missing sentences. It classifies the nine claim areas the binding task names, by reading current `main` and by executing the pure functions.

The reproduction ran once, outside the repository, with:

`node --import ./scripts/server-only-test-register.mjs --import tsx /tmp/ot-audit-repro.ts`

It was not committed. It did not call a provider, a model, or Supabase. Synthetic hosts were `*.example`.

Observed result:

```json
{
  "callerHostAccepted": "https://www.not-a-government.example/rules",
  "snapshotCarried": true,
  "validityWindowUnbound": true,
  "contradictorySuggestion": "review_suggestion",
  "emptyCitations": true,
  "proceedKeys": ["decision", "factKind", "reviewPacketKey", "ruleScopeKey", "status"],
  "differentUrlSameHash": "unchanged_source_content"
}
```

The expired-window case used `validFrom: 2020-01-01`, `validUntil: 2020-01-02`, retrieval `2026-10-01T11:00:00.000Z`, and clock `2026-10-01T12:00:00.000Z`. `proceed_to_trusted_fact_entry` still returned `rule_review_decision_intent`. The same content hash at `https://other.not-a-government.example/other-page` returned `unchanged_source_content`.

Classifications:

- **CONFIRMED** — the claimed behavior is present on this baseline.
- **PARTIAL** — the dangerous half is present and the other half is already enforced.
- **NOT_REPRODUCED** — current code or current machine metadata contradicts the claim.
- **HISTORICAL/SUPERSEDED** — the claim matches an older statement that a later accepted decision replaced.
- **DESIGN_GAP** — the pure contract behaves as specified, and that specification is not sufficient for autonomous promotion.

## Findings

### F1 — Caller registry and host are the authenticity boundary

Classification: **CONFIRMED**. Severity: **P1**. Blocks #741: **yes**.

`officialTruthAbgerufenMaterialPruefen` takes the registry from the caller envelope. `planLesen` checks that `sources` and `blockedDomains` are arrays and then casts the object. It does not call `official_truth_source_catalog_v1`.

Evidence:

- `lib/readiness/official-truth-retrieved-material.ts` `officialTruthAbgerufenMaterialPruefen`, lines 251–277.
- `lib/readiness/official-truth-research-source-routing.ts` `planLesen`, lines 133–162, and `officialTruthRechercheQuellenRouten`, lines 235–255.
- `lib/readiness/source-registry.ts` `quellenUrlAufloesen`, lines 205–229. Host trust is membership in that registry, including a subdomain via `hostGehoertZu`.
- `lib/readiness/official-truth-source-catalog-server.ts` is a dormant gateway. `scripts/db/verwendung.mjs` lists `official_truth_source_catalog_v1` in `LOCAL_UNAPPLIED_RPCS`.
- Reproduction: a registry created in the probe, with `sourceClass: 'official_authority'` and domain `not-a-government.example`, was accepted. The returned canonical URL was `https://www.not-a-government.example/rules`.

#713, #716 and #717 inherit this boundary. #713 calls the retrieval proof and then `evidenceKandidatAusModell` with `satz.registry`. #716 calls #713 and then `evidenceKandidatAkzeptieren` with the same envelope registry. #717 reads whatever registry the caller passes to `officialTruthRegelKandidatAusEvidence`.

Smallest remediation: one pure slice that accepts Official Truth input only when the registry object is supplied by the server catalog adapter, and that rejects a caller-swapped `sourceClass` or domain set. Do not apply the catalog to Development or Production in that slice.

Dependency: before any #741 gate. The catalog migration remains `LOCAL/UNAPPLIED`. Applying it is a separate Product-Owner database gate. This audit does not request that apply.

Product-Owner input: not required to forbid a caller-labeled host. Required later, and only separately, for a Development or Production catalog apply.

### F2 — Hash override is rejected; the baseline is still caller content

Classification: **PARTIAL**. Severity: **P1** for autonomous use of a hand-built candidate. Blocks #741: **yes** if a hash or a hand-built accepted object can enter the store. **No** for the narrower claim that the bridge accepts a caller hash field.

The bridge rejects caller hash fields. `FINGERPRINT_OVERRIDE` contains `content`, `contentHash` and `sourceContentHash`. The hash is `evidenceQuellenFingerprint(material.sourceSnapshot)`.

Evidence:

- `lib/readiness/official-truth-retrieved-material.ts`, lines 68–70 and 286–288.
- `lib/readiness/official-truth-retrieved-material.test.ts`, lines 386–393. Those tests expect `source_fingerprint_override_forbidden`.
- `evidenceKandidatAkzeptieren` checks hash shape with `hashLesen` and does not recompute the hash from snapshot bytes. `lib/readiness/evidence.ts`, lines 679–716. The evidence object has no snapshot field.
- `akzeptierteEvidenceSpeichern` accepts a `EvidenceVersion` candidate plus a caller registry and does not require an envelope. `lib/readiness/official-truth-store-server.ts`, lines 260–266.

A caller hash field on the #709/#713/#716 path is **NOT_REPRODUCED** as a bypass. A caller-chosen snapshot, which determines the hash, is **CONFIRMED**. A hand-built candidate passed straight to the dormant store is a second path that never saw the snapshot.

Smallest remediation: keep the override rejection. Before the store can be called from an acceptance route, require the candidate to be the return value of `officialTruthAkzeptierteEvidenceAusAbruf` for a server-held envelope, not a free `EvidenceVersion`.

Dependency: after F1, before any store call from #741. No new migration in that slice.

Product-Owner input: not required for the pure binding. Required if the store is applied.

### F3 — Refresh binds source id and scope, not the page URL

Classification: **CONFIRMED**. Severity: **P1**. Blocks #741: **yes**, if `unchanged_source_content` is treated as “the same official page”.

`officialTruthAkzeptierteEvidenceAuffrischungVergleichen` re-proves the baseline through #716 and re-proves the new envelope through #709. It then requires the same `sourceId` and the same `ruleScopeKey`. It compares only `sourceContentHash`. It does not compare `canonicalUrl`, host, or registry JSON.

Evidence:

- `lib/readiness/official-truth-refresh-diff.ts`, lines 53–59 and 75–103.
- Reproduction: baseline `https://www.not-a-government.example/rules` and refresh `https://other.not-a-government.example/other-page`, same snapshot, returned `unchanged_source_content`.
- A different `sourceId` is already blocked. `lib/readiness/official-truth-refresh-diff.test.ts`, lines 514–522, expects `different_official_source` for `interior.example`.

Host binding inside one envelope is real: `quellenUrlAufloesen` must accept that envelope's own registry. The two envelopes do not have to carry the same registry or the same URL.

Smallest remediation: one pure slice on the refresh function that also requires equal canonical URL and equal registry identity, and that returns a distinct blocked reason for a different page. Keep `ruleChange: 'not_asserted'`.

Dependency: after F1, or in the same slice if the registry identity is defined there. Before a refresh result can satisfy an autonomous predicate.

Product-Owner input: not required.

### F4 — Review packet carries the raw snapshot and URL

Classification: **CONFIRMED**. Severity: **P2** while the packet is only a return value. **P1** if a later slice persists it. Blocks #741: **yes** for storing the packet or the snapshot. **No** for a gate that discards both before any write.

`stuetzEintrag` copies `sourceSnapshot` and `canonicalUrl` onto `OfficialTruthRegelReviewSupport`. The personal-data scan walks object keys. A string snapshot is not inspected. The suggestion, fingerprint and decision outputs omit the snapshot. The fingerprint digest uses `sourceContentHash`, not the raw text.

Evidence:

- `lib/readiness/official-truth-rule-review-packet.ts`, lines 83–90 and 156–165.
- `lib/readiness/official-truth-rule-review-packet.test.ts`, lines 68 and 318–319. The test expects the snapshot on the support.
- Key lists in `official-truth-retrieved-material.ts`, lines 24–66, and the packet file, lines 35–72. They do not read snapshot characters.
- Reproduction: the packet support `sourceSnapshot` equalled the input page text, and the canonical URL was the caller URL.
- `officialTruthRegelReviewPacketFingerprint` canonical form, lines 129–140, contains provenance and the proposal. It does not contain `sourceSnapshot`.

This is a **DESIGN_GAP** for any human-review transport. It is not a current database write. Persisting page text, a URL that might embed identifiers, or an extraction note is sensitive storage and stays a Product-Owner gate.

Smallest remediation: no change to #723 in this audit. The #741 gate must not persist `sourceSnapshot`, `canonicalUrl`, or `extractionNote`. A review screen that needs the page is a separate slice with an explicit retention decision.

Dependency: state the non-persistence rule in the first #741 design slice, before any writer. Independent of F1.

Product-Owner input: required before any snapshot, raw URL or note is stored. Not required to keep refusing that storage.

### F5 — Fingerprint coverage and caller-computable key

Classification: **PARTIAL**. Severity: **P1** if the key is treated as authorization. **P2** for the unbound validity window. Blocks #741: **yes** for using a caller-supplied key as proof. **No** for the claim that #726 trusts a caller-supplied hash instead of recomputing.

What the digest binds, from `identitaet` in `lib/readiness/official-truth-rule-review-fingerprint.ts`, lines 107–151:

- candidate scope, rule-scope key, fact kind, evidence quality, sorted support version ids, and proposal;
- per support: `versionId`, `sourceId`, `canonicalUrl`, `retrievedAt`, `sourceContentHash`.

What it does not bind:

- snapshot bytes, except through the existing content hash;
- `validFrom`, `validUntil`, and `extractionNote`;
- registry publisher, authority, domain set, or catalog version;
- reviewer, role, AAL, capability, or grant;
- suggestion, decision, clock, or a server witness.

`versionIdFuer` itself is only `sourceId`, canonical URL, content hash and `retrievedAt` (`lib/readiness/evidence.ts`, lines 604–605). Reproduction: adding `validFrom` / `validUntil` left `reviewPacketKey` unchanged.

Caller-computability: the key is `review-packet:v1:` plus SHA-256 of canonical JSON. Any caller who can run the function, or reimplement it, can mint the key for a bundle that passes the structural gates. #734 compares the caller key with the key recomputed in that same call (`official-truth-rule-review-decision-intent.ts`, lines 210–212). A mismatched key fails. A key that matches a caller-built bundle succeeds. The function comment on lines 1–8 already says the result is not proof that a server stored or approved the intent.

So caller-computability is not a checksum defect. It is a **DESIGN_GAP** if #741 treats `reviewPacketKey` as a capability.

Smallest remediation: the autonomous gate recomputes #723 and #726 from server-held envelopes. It never accepts a model-supplied key as evidence. A separate pure slice can add the validity window to the canonical form, or can document that the window is outside the key and must be checked beside it. Changing the key changes every later comparison, so that slice has to be explicit.

Dependency: key-as-capability rule is part of the first #741 gate and depends on F1. Validity-window binding can be a small #726 amendment before that gate, because the gate must know which bytes it re-proves.

Product-Owner input: not required.

### F6 — Contradictory suggestions are valid

Classification: **CONFIRMED**. Severity: **P2**. Blocks #741: **no**, while the suggestion stays non-authoritative. **Yes** if `assessment` or `reasonCodes` become an acceptance input.

`officialTruthRegelReviewVorschlag` checks that the assessment and the reason codes are members of their lists, that citations are unique and belong to the recomputed packet, and that personal-data keys are absent. It does not relate an assessment to its reasons. It allows an empty citation list and an empty reason list.

Evidence:

- `lib/readiness/official-truth-review-suggestion.ts`, lines 64–79 and 218–246. No consistency matrix.
- `lib/readiness/official-truth-review-suggestion.test.ts`, lines 315–350. The test accepts empty citations, empty reasons, and `supports_candidate` together with `support_scope_ambiguous` and `support_stale_or_time_unclear`.
- Reproduction: `supports_candidate`, zero citations, and reasons `support_text_conflicts_candidate` plus `support_sources_conflict` returned `review_suggestion`.
- #734 does not import the suggestion module. `official-truth-rule-review-decision-intent.test.ts`, line 665, locks that absence.

Smallest remediation: one pure slice that rejects contradictory assessment/reason pairs and requires at least one citation for `supports_candidate` and `contradicts_candidate`. Keep the result advisory. Do not connect it to `regelKandidatAkzeptieren`.

Dependency: before any consumer reads a suggestion. Parallel with F1. Not on the critical path if the #741 gate is forbidden to read it. That prohibition should be an explicit #741 invariant rather than an assumption.

Product-Owner input: not required.

### F7 — Proceed intent has no reviewer, freshness, registry or replay witness

Classification: **CONFIRMED** and **DESIGN_GAP**. Severity: **P1**. Blocks #741: **yes**. The intent must not be stored as Official Truth and must not authorize `regelKandidatAkzeptieren`.

`officialTruthRegelReviewEntscheidungsabsicht` re-proves #723 and #726, requires the caller key to equal the recomputed key, and allows only `needs_more_evidence`, `reject_candidate` and `proceed_to_trusted_fact_entry`. Proceed additionally requires acceptable evidence quality and, for composed quality, two supports from two `sourceId` values.

It does not read a reviewer, `grant`, AAL, capability, registry version, suggestion, or `officialFrische`. The success object has exactly `status`, `reviewPacketKey`, `ruleScopeKey`, `factKind` and `decision`. The same input produces the same intent. Nothing records that a server saw it.

`gueltigkeitsfenster` checks date shape and order only (`lib/readiness/evidence.ts`, lines 593–601). Reproduction: a window that ended on `2020-01-02` still produced `proceed_to_trusted_fact_entry` on the 2026 clock. `officialFrische` in `lib/readiness/official.ts`, lines 390–417, is a different helper and is not on this path.

The same-source composed packet is not a current #734 hole. #717 returns `same_source_composition` and #723 therefore has no packet. The older architecture sentence that such a packet could exist as review material is **HISTORICAL/SUPERSEDED** by `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`, lines 18 and 149–155. The #734 source-count check remains defense in depth and is unreachable for that input.

Smallest remediation: do not widen #734 into acceptance. The later gate consumes server-held envelopes, recomputes the packet, and records a separate authorized decision. That record has to include the verified grant and has to fail closed when `officialFrische` is not `current` for the covered policy. This audit does not choose a retention duration.

Dependency: after F1, F2, F3 and F5. Before `regelKandidatAkzeptieren` is called from an autonomous path.

Product-Owner input: already given for owner-only bootstrap and for near-term autonomous design in #741. A new retention duration is a separate gate. This audit does not ask for one.

### F8 — `regelKandidatAkzeptieren` is necessary and not sufficient

Classification: **CONFIRMED**. Severity: **P1** as a #741 precondition. Blocks #741: **yes**, until the missing preconditions run before this function. The function itself should stay the only Rule acceptance function.

Current prerequisites inside `regelKandidatAkzeptieren` (`lib/readiness/rule-claims.ts`, lines 829–888):

- exact keys `kandidat`, `trustedRuleFact`, `evidenceVersions`, `registry`;
- the candidate is rebuilt with `regelKandidatErstellen`; the proposal is not copied into the accepted fact;
- quality is only `explicit_primary_statement` or `composed_from_multiple_primary_sources`;
- every support passes `akzeptierteEvidenceLesen` against the supplied registry;
- support ids match, scopes match, every support is `official_authority`;
- composed quality needs two supports and two `sourceId` values;
- `trustedRuleFact` is parsed for the candidate fact kind.

`research_gap`, `stale_primary_evidence` and `unresolved_conflict` fail `quality_not_acceptable`. There is no auth, packet-key, freshness-date, catalog, or `grant` check. The registry argument is the same caller-shaped object as F1.

`akzeptierteRegelClaimSpeichern` calls this function and then the dormant RPC (`lib/readiness/official-truth-store-server.ts`, lines 286–302). `LOCAL_UNAPPLIED_RPCS` includes `official_truth_store_accepted_v1`. No file under `app/` calls `regelKandidatAkzeptieren` or the store writer. `requirementsProviderAus()` returns `null`.

Smallest remediation: no second acceptance function. The #741 gate may call `regelKandidatAkzeptieren` only after F1–F5 and F7, with a `trustedRuleFact` that a verified human or a deterministic predicate entered, never with the model proposal copied across.

Dependency: last pure step before a dormant writer is connected. Connecting the writer is not this audit and is not authorized here.

Product-Owner input: not required to keep this function canonical. Required before a Production apply of the writer.

### F9 — Live fact entry must require `grant === 'role'`

Classification: **CONFIRMED**. Severity: **P1**. Blocks #741: **yes**.

`reachesDatabase` is `decision.allowed && decision.grant === 'role'` (`lib/auth/admin-access.ts`, lines 154–155). Tests lock that break-glass for `official-truth-freigeben` does not reach the database (`lib/auth/admin-access.test.ts`, lines 245–275). The database function `darf_official_truth_freigeben` is owner plus current AAL2, with no caller-supplied role argument.

`requireAdminPage` still returns a successful context when `grant` is `break-glass` (`lib/auth/admin-guard.ts`, lines 240–277). Break-glass opens the admin surface. Nothing in `app/` calls `official-truth-freigeben`, `reachesDatabase` for that capability, or `regelKandidatAkzeptieren`. A later route that treats `requireAdminPage({ capability: 'official-truth-freigeben' }).allowed` as enough would admit a break-glass session that the database function would reject only if the route also called that function.

Smallest remediation: the first fact-entry or acceptance route must fail closed unless `grant === 'role'`, `reachesDatabase(decision)` is true, and `darf_official_truth_freigeben()` is true for that verified user. Generic break-glass stays surface-only. Do not add that route in a follow-up from this audit.

Dependency: before F8 is reachable from a request. Independent of the suggestion matrix.

Product-Owner input: already decided in #742 / #743 and the reviewer packet. No new role decision.

### F10 — Stale operating assumptions

| Claim | Classification | Evidence |
| --- | --- | --- |
| Machine mode is still `AI_OS_BUILD_HOLD` | **NOT_REPRODUCED** | `.jetnity/operating-mode.json` `mode` is `NORMAL`, `updatedAt` `2026-09-21`, `liveMainRemainsHoldUntilMerge` is false. |
| Production already serves the Official Truth store or catalog | **NOT_REPRODUCED** from repository evidence | Both RPCs are in `LOCAL_UNAPPLIED_RPCS`. No app route calls them. This audit did not query Production. Absence of a query is not a Production certificate. |
| #743 owner capability is still unmerged | **NOT_REPRODUCED** | `origin/main` is `3775955f`, message `Merge #743: add owner-only Official Truth reviewer capability`. |
| A caller `sourceContentHash` field is accepted on the retrieval envelope | **NOT_REPRODUCED** | F2. The field is `source_fingerprint_override_forbidden`. |
| A same-source composed input is a review packet that #734 can pause | **HISTORICAL/SUPERSEDED** | Architecture lines 149–155. Live #717/#723 reject it before a packet exists. |

None of these stale claims block #741 by themselves. The NORMAL mode does not authorize #741.

## What is already enforced

These claims were checked so a later gate does not “fix” behavior that already fails closed:

- licensed and unknown source classes do not become `official_authority` inside one registry;
- a different `sourceId` on refresh is `different_official_source`;
- a second credential option is a different rule-scope key;
- suggestion and decision functions reject a pre-built packet or fingerprint as the packet input;
- #734 refuses proceed for `research_gap`, `stale_primary_evidence` and `unresolved_conflict` when those are the candidate quality;
- `regelKandidatAkzeptieren` does not copy `proposal` into the accepted fact;
- break-glass does not satisfy `reachesDatabase`;
- `requirementsProviderAus()` is null;
- #626 is not on this path.

## Remediation order

Not started. Recommended order, each as its own later Draft:

1. Server-held registry identity for #709/#713/#716/#717 (F1). No database apply.
2. Refresh URL and registry equality (F3).
3. Fingerprint coverage decision for the validity window (F5), plus an explicit rule that the key is not a capability.
4. Fact-entry guard: `grant === 'role'` and `darf_official_truth_freigeben()` (F9), still without calling acceptance.
5. Deterministic #741 gate design that recomputes #723/#726, ignores suggestions (F6), discards snapshots (F4), checks freshness (F7), and only then calls `regelKandidatAkzeptieren` (F8).
6. Suggestion consistency matrix (F6) before any consumer. It can land beside step 1 if it stays advisory.

## Traveller context

One packet remains one regulatory cell. A second citizenship relation or a second travel document remains another key. This audit does not collect a credential and does not invent a visa, transit, health, carrier, eligibility or document rule. F1 matters per cell: a caller-labeled host would otherwise become official for one credential option and not for another without a server catalog.

## #626

#626 stays **OPEN / BLOCKED**. This audit does not read or write that producer and does not route around it.

## Validation

| Check | Result |
| --- | --- |
| `git fetch origin main` | `3775955f6c4e958b26259d98cb9a0bc35dc2075f` |
| behind `origin/main` | 0 |
| reproduction script | exit 0, JSON above |
| `git diff --check` | recorded in the self-review for the docs commit |
| operating-mode guard | recorded in the self-review for the docs commit |
| runtime, tests, migrations | not edited |
| `npm test`, typecheck, lint, production build | not run. This slice does not change runtime. They are not certified |

## Stop

Draft only. No Ready, no merge, no remediation slice.
