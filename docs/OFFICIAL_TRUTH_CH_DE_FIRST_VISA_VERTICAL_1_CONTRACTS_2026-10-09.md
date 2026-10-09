# CH→DE first visa vertical 1 — Contracts and decision packet

Issue #917 / Draft #918. This is a blocked research delivery, not an entry rule.
The immutable TASK and protected source/custody contracts remain authoritative.

## Implemented boundary

`run.ts` defaults to OFFLINE/NOT_RUN. Exactly `--live-official` permits two
sequential fixed S1/S2 reads through `retrieveOfficialTruthIsolatedPilotSource`.
Unknown arguments return exit 2 without network. No arbitrary URL, header,
catalog, environment activation flag, credential, retry or alternate fetch path
is exposed by the CLI. Source refusal is a successful diagnostic run (exit 0),
never source qualification. Unexpected execution failure returns a finite code.

The existing isolated seam is the sole network implementation: same-request
clock, canonical HTTPS URL, DNS/public address/socket checks, redirect policy,
timeout, UTF-8, allowed media and inclusive 65,536-byte cap remain unchanged.
`chDeQuarantineCatalog` supplies local proposed descriptors solely to measure
that negative seam. It is NOT the protected registry or an approved AA profile.
Its identity verifier always refuses, including a perfectly formed synthetic
table. It cannot mint official identity, provenance, support or custody.
Only body byte count is observed after a bounded complete body reaches it.
Raw text/hash never leaves that verifier. Guard rejection exposes no exact
full size, content type or redirect count; these stay null, not guessed zero.

`chDeVisaResearch` first calls the existing bounded plain-data canonical scanner
(2,048-byte limit), then a strict schema. The only permitted research declaration
is CH citizenship, one explicitly linked CH ordinary passport, CH residence and
origin, DE destination, explicit tourism, direct route/no transit and valid
ordered travel dates. No real traveller identifiers/documents are accepted.
These inputs are declarations, not verification of a traveller or legal scope.
The existing `regelScopeAusEvidenceScope`, research-request policy and
`regelKandidatErstellen` create a pending `research_gap` visa candidate, no
proposal, no support IDs and no accepted fact. An empty canonical registry
establishes no source authority. `checkedAt`, `validFrom`, `validUntil` remain
null. No new parser for legal facts or positive Rule Review is introduced.

`chDeVisaReadBoundary` is server-only and takes no authority-bearing input.
It always returns provider/evidence/rule null and
`trusted_accepted_reader_unavailable`. Caller accepted-shaped objects, including
extra JavaScript arguments, cannot open it. It is not wired into runtime.
The existing store is a guarded writer; a trusted accepted-reader closure is
not available. Implementing a DTO reader here would manufacture authority.

## Canonical path and its current limits

The authenticated account page RLS-loads the Trip and calls
`tripOfficialEvaluationsAuswerten`. This calls the canonical engine with
`requirementsProviderNachZustand(requirementsProviderAus())`. Provider remains
null and Production remains hard-off. Existing `OfficialEvaluation[]` flows
through KontoArbeitsbereich/TripWorkspace to Preparation/Destination Essentials.
No runtime/UI/auth/guest changes are included.

Tests execute the actual helper with a closed injected import map, actual engine,
official checklist and rendered existing Destination Essentials and Preparation.
They prove unknown/unavailable, isolated traveller options, retained unrelated
gaps and absent actions/visa-free claims. They do not claim a browser login,
hosted RLS test or positive CH→DE regulatory result. Existing account/Workspace
contract tests remain intact. There is no second Requirements Engine.

Canonical `passport` does not prove ordinary subtype. Canonical rule/provider
context cannot bind all of ordinary subclass, purpose, positive direct-route
proof and stay end. Changed dates yield a fresh canonical research key, but
unsupported predicates remain explicit declarations. No matching or promotion
is permitted on that basis. Missing rows never mean `not_required`.

## Proposed descriptors — NOT approved registrations

| Item | Exact representation | Local proposal |
| --- | --- | --- |
| S1 | https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820 | source `aa-research-only`; see manifest for item/profile IDs; German HTML |
| S2 | https://www.auswaertiges-amt.de/de/service/fragenkatalog-node/01-visumnoetig-606470 | same publisher; German HTML; corroboration only |

Both are proposed Auswärtiges Amt authority material. Neither response passed
the body guard. Publication date is not legal validity or Jetnity retrieval time.
No approved profile, privacy admission, legal locator, snapshot or full-response
identity exists. S2 is not an independent authority. No 90/180 limit, employment,
residence, minimum passport validity, ID eligibility, transit permission, fee,
application endpoint or trip-wide clearance may be inferred.

## Exact outstanding gates and bounded amendment request

1. **Source feasibility / legal evidence:** TL must assess a separately proposed
   sufficiently small official representation or a separately scoped transport
   design. Current S1/S2 remain blocked at 65,536; do not enlarge or pre-slice
   here. Independently prove exact page/publisher identity, unique CH row with
   header and complete applicable footnotes, ordinary document meaning,
   conflict/exception handling, travel-purpose/route coverage and legal interval.
2. **Development source and privacy registration:** only after (1), independently
   review the exact registry item/representation/profile versions, whole-body
   privacy policy, locators and age. Protected source and identity registry paths
   require a fresh TL scope decision. No registration packet is ready for approval.
3. **Canonical scope and trusted accepted read:** request a separate bounded TL
   design decision for `types/trips.ts` / canonical credential and rule-scope
   contracts / provider request as necessary, and a capability in the existing
   store/server-held custody architecture. It must revalidate accepted evidence,
   scope, current registry, freshness, temporal interval, seals and revocation;
   arbitrary accepted DTOs cannot be authority. Exact edits depend on that design;
   these protected files were not changed in this task. No duplicate store/engine.
4. **Actual acceptance:** current AAL2 Owner, or separately approved deterministic
   autonomy, must accept genuine Evidence/Rule using existing Rule Review and
   packet/custody contracts. No fabricated supports, hashes or `ev2_*` IDs.
5. **Hosted read and retention:** distinct Owner decision for access, RLS, data
   minimisation and retention. Local disposable native tests authorize no hosted
   writes. No migrations, database copies or personal travel data here.
6. **Production/runtime projection:** distinct Owner registry/runtime/F8 decision,
   only after prior gates. Provider and production-off controls remain unchanged.
   Recheck existing unknown display and withdrawal behavior before any activation.
7. **Broader coverage:** any additional country, citizenship, credential, indirect
   route, purpose or fact requires a separate task. None starts with this handoff.

This task adds no provider, dependency, recurring cost or secret. Later decisions
must identify costs within the existing $100/month cap and a tested withdrawal
procedure (revoke accepted rows and keep provider off); no blanket importer/F8
approval is requested. Rollback of this delivery is revert of its owned files
and exact test-inventory additions; there is no data migration to undo.
