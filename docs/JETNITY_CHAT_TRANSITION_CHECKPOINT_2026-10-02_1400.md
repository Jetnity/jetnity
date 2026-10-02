# Jetnity — Chat Transition Checkpoint — 2 October 2026, 14:00 Europe/Zurich

Status: **CANONICAL RESUME POINT / NO ACTIVE CURRENT WRITER / FRESH LIVE RECONSTRUCTION REQUIRED**

This checkpoint exists only to make the next Technical-Lead chat transition lossless. Live evidence always wins over this document.

## 1. Exact live baseline at checkpoint

- Repository: `Jetnity/jetnity`
- Current `main`: `b6574611ac1bf1935b90d4acf07076dfee93b000`
- Relation of that SHA to `main`: identical at checkpoint creation.
- Merge: **#731 — Official Truth Rule acceptance trust boundary architecture 1**
- #731 accepted head: `89a006a4fce937816ba1fa2056ef9ca4782d3f0b`
- #731 merge: `b6574611ac1bf1935b90d4acf07076dfee93b000`
- #731 Technical-Lead FINAL PASS review: `5391527830`
- Vercel Production exact merge deployment: `dpl_BS4WWKT2hAXBFzMdmbmrwribmRdx`
- Deployment state: **READY**
- Target: **production**
- Alias list includes `jetnity.com`
- `aliasError=null`
- Vercel commit status: **success**

This checkpoint does not authorize public launch or indexing. Existing prelaunch/noindex/robots fail-closed policy remains binding unless later live evidence and an explicit Product-Owner launch gate supersede it.

## 2. Latest merged Official Truth work

### #730 — non-authoritative review suggestion contract

- Accepted head: `65b1d2bf8739402d123b1c41774529ada7d510c1`
- Merge: `906fb4a5714f8c1836d1894acc6332084f7f6280`
- FINAL PASS review: `5391463966`
- Privacy R1 is closed.
- **No free-form `reviewNote` remains.**
- Public suggestion contract is fully machine-readable:
  - bounded assessment enum;
  - packet-bound support ids;
  - bounded reason-code allowlist.
- Suggestion remains advisory only.
- It cannot create `trustedRuleFact`, an accepted Rule Claim, or Official Truth.
- No model call, provider call, DB/store write, Supabase change or Production activation was added.

### #731 — Rule acceptance trust boundary architecture

Merged at current `main`.

Binding accepted architecture:
- **Permanent invariant:** model/plugin output alone may never directly become `trustedRuleFact` or Official Truth.
- **Current V1 policy:** trusted Rule fact entry is allowed only through a server-verified human/operator review boundary.
- A future separately versioned **deterministic non-model** acceptance policy for narrowly provable cases remains architecturally possible, but is not designed or authorized here.
- Every future review decision must bind to a re-proven #726 `reviewPacketKey`.
- Reviewer identity/role/capability/AAL come from server-verified auth context, never request-body assertions.
- AAL2 remains required by the current admin security model.
- Break-glass does not open fact entry.
- Candidate proposal is never silently copied into `trustedRuleFact`.
- `research_gap`, `stale_primary_evidence`, and `unresolved_conflict` cannot become accepted truth.
- `regelKandidatAkzeptieren` remains the only canonical Rule acceptance function.
- No Official-Truth acceptance capability was selected or remapped.
- Adding/remapping a capability, changing major Auth/AAL/RLS, persistent reviewer audit/retention, Production activation, or live model/API calls with secrets/cost remain separate gates.

## 3. Official Truth chain already merged

Do not rebuild these slices. Re-read live code if a later slice depends on them.

- #702 demand-driven research request
- #703 Candidate Evidence batch validator
- #705 official-authority source routing
- #708 pre-fetch domain allowlist
- #709 retrieved material receipt
- #712 discovered URL candidate validator
- #713 retrieved material → Candidate Evidence
- #716 Candidate Evidence → accepted Evidence
- #717 accepted Evidence → Rule Candidate
- #721 safe accepted-Evidence refresh diff
- #723 Rule Review Packet
- #726 deterministic Rule Review Packet fingerprint
- #730 non-authoritative review suggestion
- #731 Rule acceptance trust-boundary architecture

Historical unsafe/superseded:
- #719 is **closed / superseded / unmerged**. Published head `41f24c265d04cd8d56e5a5ff7f1955f4b2969242` must never be merged. #721 is the safe replacement.

## 4. Tooling continuity

The official **OpenAI Developers** ChatGPT plugin is installed and enabled.

It may be used for current OpenAI API / Agents SDK documentation, best practices and troubleshooting.

It does **not** authorize:
- creating/rotating/exposing API keys;
- storing secrets;
- paid/live OpenAI calls;
- provider selection/activation;
- material recurring cost.

Jetnity Official Truth contracts remain canonical. Plugin/model output cannot mint Official Truth.

## 5. Product / provider / security gates that remain

At checkpoint creation:

- `requirementsProviderAus()` remains `null` unless later live code disproves it.
- No real Flight provider is selected or activated.
- Issue #395 remains open; KAYAK is still a Product-Owner/provider-access gate.
- Issue #294 remains open; latest accepted posture before this checkpoint: Timatic not selected now, Sherpa not selected now / outgoing follow-up paused, first-party Official Truth remains the approved strategy.
- Issue #626 remains open/reopened and **blocked**. Do not route around its privileged-role/operator requirements.
- Issue #585 remains deferred; do not hand-edit PrivacyBee vendor text.
- Issue #440 remains open and records standing authorization plus historical hold/governance context. Re-read live before interpreting it.
- Production/destructive DB/Auth/RLS/identity/security changes remain special gates.
- Provider secrets/terms/paid/live calls remain special gates.
- Payments and public launch/indexing remain special gates.
- Sensitive passport number/MRZ/scans/biometric/health persistence remains separately gated.
- Budget ceiling remains max USD 100/month; warn before material cost.

## 6. Exact next step for the next chat

**Do not start from memory. Reconstruct live first.**

Required startup:
1. `JETNITY_START_HERE.md`
2. `JETNITY_HANDOFF.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. this checkpoint
6. live `main`, open PRs/issues, CI/Vercel and active agents.

After live reconstruction, run a fresh Binding Slice Precheck.

If no newer live work supersedes this checkpoint, the smallest known ungated continuation from #731 architecture is the **pure Rule Review Decision Intent contract**:
- re-prove #723/#726 packet + key;
- allow only `needs_more_evidence`, `reject_candidate`, `proceed_to_trusted_fact_entry`;
- no trusted fact;
- no acceptance call;
- no endpoint/Auth/RLS/DB;
- no persistence;
- no model/network/provider call;
- no capability selection/remap;
- no follow-up implementation beyond that one bounded slice.

A future authenticated review endpoint or capability choice must not be auto-started if it would cross the reserved Auth/AAL/role/RLS authority gate.

## 7. Transition rule

The Product Owner already has the generic handoff prompt. Do not ask them to reconstruct or repeat history.

The next chat should:
- use live repository/tool evidence;
- treat this checkpoint as a resume aid, not immutable truth;
- continue autonomously on ordinary bounded work;
- ask the Product Owner only at a genuine reserved gate.

**STOP — transition checkpoint complete.**
