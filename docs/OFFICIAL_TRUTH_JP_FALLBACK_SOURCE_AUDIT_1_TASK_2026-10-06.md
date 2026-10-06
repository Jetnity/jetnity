# Official Truth JP alternate official source retrieval fallback audit 1 — Task

Date: 6 October 2026
Issue: #868
Repository: Jetnity/jetnity
Baseline: `main@9adfc04ffe90693dedc059f07a396751a0625157`
Branch: `docs/official-truth-jp-fallback-source-audit-1`
Execution lane: Codex Desktop
Parallel-safe with #863/#866/#867/#869 when this scope is respected.

## 1. Objective

Perform one narrowly bounded, docs-only, current-primary-source audit to determine whether Japan has an **alternate official state source or official representation** that Jetnity can retrieve server-side without credentials and that can support the minimum deterministic Swiss ordinary-passport short-stay pilot semantics that #848/#852 could not safely close through MOFA R01/R04.

This is a source/retrieval qualification audit, not Rule creation.

## 2. Binding live/repository inputs

Before research, re-read:
1. live `origin/main`
2. `.jetnity/operating-mode.json`
3. Issue #751
4. Issue #741
5. Issue #868
6. merged #848/#849 first JP pilot audit
7. merged #852/#853 JP content-identity/retrieval qualification
8. current server-owned retrieval implementation and limits
9. current content-identity/profile/catalog contracts
10. current trusted extractor/source-family constraints relevant to a future JP pilot

Live evidence wins.

## 3. Research source rules

For regulatory/travel-requirement truth use **only official Japanese state primary sources**, for example:
- Ministry of Foreign Affairs of Japan (MOFA);
- Immigration Services Agency of Japan (ISA);
- Ministry of Justice or other competent Japanese government authority;
- official Japanese government portals;
- official Japanese embassy/consulate pages only where they are clearly state-operated and actually carry the relevant rule.

Do not use blogs, travel sites, visa brokers, commercial providers, forums, Wikipedia or search-engine snippets as Official Evidence.

Third-party material may not be used to fill a semantic gap.

## 4. Exact pilot question

Scope:
- citizenship: CH
- document: ordinary passport
- destination: Japan
- minimum pilot concern: positive short-stay entry/visa-exemption semantics needed for a deterministic Jetnity rule path

Do not silently generalize to every Japanese immigration rule.

The audit must distinguish at least:
- nationality/document eligibility;
- permitted short-stay purpose/category if the source conditions it;
- permitted duration if explicitly stated;
- passport/document conditions if stated;
- arrival/landing conditions versus visa-exemption conditions;
- transit semantics if relevant to the candidate source;
- any effective-date/currentness qualifiers.

Unknown remains unknown.

## 5. Candidate-source discovery and qualification

Search for alternate official sources/representations that could avoid the known MOFA R01/R04 retrieval blocker.

For every serious candidate record:
- exact canonical URL;
- authority/publisher;
- page/API/document identity;
- whether it is official primary authority;
- current observed HTTP/retrieval behavior from a Jetnity-like credentialless server request where safely testable;
- redirect chain/final URL;
- content type;
- approximate/observed body size where relevant;
- whether the content is stable machine-readable HTML/JSON/PDF/other;
- whether authentication, cookies, JS execution, browser challenge, geolocation or session state is required;
- whether current Jetnity source/content identity can represent it losslessly;
- whether current BODY_MAX and other retrieval bounds can admit it;
- whether an existing identity profile could qualify it or a new profile would be required;
- exact semantic clauses it supports;
- exact semantic clauses it does not support.

Do not weaken SSRF, redirect, host, size, identity or authority controls merely to make a source pass.

## 6. Required decision

Classify the result as exactly one of:

- `JP_FALLBACK_SOURCE_READY_FOR_PROFILE_DESIGN`
  A concrete official source/representation is retrievable and semantically sufficient for the bounded pilot, but any necessary identity-profile/extractor work remains separate.

- `JP_FALLBACK_SOURCE_READY_WITH_EXISTING_IDENTITY_CONTRACT`
  A concrete official source/representation is retrievable, semantically sufficient, and representable under an already merged identity contract. This still does not register/activate it.

- `JP_FALLBACK_SOURCE_NOT_READY`
  No currently proven official fallback satisfies both retrieval and semantic requirements.

If several candidates exist, identify one preferred candidate only when the evidence supports it. Do not call it “unique” or “best in the world.”

## 7. Required gap matrix

Explicitly show:
- source authority;
- retrieval;
- content identity;
- semantic completeness;
- applicability representation;
- extractor feasibility;
- provenance/freshness;
- unresolved conflict/gap;
- exact next smallest slice if READY;
- why F8 remains closed.

## 8. Hard non-scope

Do not:
- modify runtime code;
- create or change a source/profile/extractor/policy registry;
- register any source or content item;
- generate/import Candidate Evidence into DB;
- accept Evidence;
- accept a Rule;
- implement F8;
- create SQL/migrations;
- mutate Supabase Development or Production;
- alter provider selection;
- use paid/licensed travel providers;
- start CH-11;
- modify global continuity files;
- start a follow-up slice.

## 9. Allowed files

TASK is immutable:
- `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_TASK_2026-10-06.md`

Create only:
- `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-06.md`

## 10. Delivery

Before STOP:
- re-read remote main;
- report exact head;
- merge-base / ahead / behind;
- exact changed files;
- TASK blob unchanged;
- exact official-source URLs consulted;
- exact retrieval checks actually performed;
- mechanical checks;
- P0/P1/P2/P3 findings;
- Codex session/model evidence;
- final classification from section 6.

Commit and push the authorized branch.
Stay Draft.
Do not Ready.
Do not merge.
Do not start follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
