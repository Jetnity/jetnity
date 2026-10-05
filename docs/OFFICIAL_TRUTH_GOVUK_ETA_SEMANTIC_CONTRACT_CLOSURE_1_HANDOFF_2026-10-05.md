# Official Truth GOV.UK ETA Semantic Contract Closure 1 — Handoff

Date: 5 October 2026 (Europe/Zurich)
Issue: #842 · Draft PR: #843
Writer: **Jetnity Official Truth GOV.UK ETA semantic contract closure 1**, Generation 1
Codex Desktop: `gpt-6-astra` / `xhigh`
Baseline: `3ba69f15907e0652cfe83478dabcf91904ca9a00`
Immutable seed: `a5cee48648e776ca417db2d9cf2c7908b7acb059`

## Decision handed over

**`GOVUK_ETA_SEMANTIC_CONTRACT_NOT_READY`**

Read the [contract](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_2026-10-05.md), [report](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_REPORT_2026-10-05.md) and [self-review](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_SELF_REVIEW_2026-10-05.md) against the unchanged [task](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_TASK_2026-10-05.md). This is a completed docs delivery with a negative readiness verdict; it is not a completed legal closure or an implementation authorization.

## What is resolved enough to retain

| Area | Contract position |
| --- | --- |
| Rule boundary | Requirement A, exact CH singleton/full-set cell, explicitly linked passport, destination GB, travel on/after 2025-04-02, direct unambiguous entry only; other cells unsupported |
| National passport | Ordinary is not national. Recommend a separate bounded credential qualification for application B; exclude B from first requirement rule and do not implement its qualifier as an A dependency |
| CTA | Existing origin/region/negation operators suffice: pinned CTA member AND origin != GB. IE is included. Bind exact inbound journey; residence, raw IATA and generic first origin cannot replace it |
| Nationality status | BOTC and BNO separately held/not-held/unknown; no ISO substitute or omission-as-false |
| UK permission | Existential OR over exact entry-clearance and permission-to-enter/stay classes; none-valid must explicitly quantify over each entire class at the same reference. An expired item or empty inventory proves nothing about another valid permission |
| Age | French <=18, German <=19; Irish 16+ is an evidence-production duty, not an exemption age floor |
| Version | New quantified/time-qualified meanings require schema 2. Keep schema-1 meaning and independent identity/scope version domains. No pin or parser edited |
| Partial safe output | A source-supported sufficient permission/status exemption may justify `not_required` after all later source/scope gates. Unresolved school/Irish positive cases and all presently unapproved residual required cases stay unknown/unsupported |

## Exact unresolved cells

1. **Irish I1–I4/I7:** actual residence versus entitlement; exact Minister-consent restriction; application-time reference without an application; whether any separate permission-to-remain concept is justified. Do not replace the source time with travel date or current time.
2. **French F2–F4:** complete traveller-school relationship, qualifying count unit and any omitted subconditions. Generic party membership/count is not proof of all source qualifications.
3. **German G2–G4/G6:** the same party/relationship questions plus exact confirming actor, act and subject. Do not invent semantics for `confirmed_german_school` or duplicate it with a generic confirmation boolean.
4. **Residual branch and target coverage:** a clause-complete exclusion inventory and honest N/A contribution map are prerequisites for `required`. Complementary statements must not be represented as multiple equal-value observations.

Contract §5 maps every relevant reproduced statement, including excluded application/use clauses, into source, target, predicate/context availability, provenance, true/false/unknown and delta/unsupported conditions. Its two keyed tables must be read together. §9 is the semantic tree; §10 identifies unresolved source target assignments rather than fabricating executable locators.

## Evidence action for the reviewer to assess

#791's Appendix table is explicitly compressed. The tracked repository does not contain the full audited response fixture. The recorded hash does not recover omitted wording.

First determine whether exact historical Appendix bytes matching SHA-256 `6859cfcacb44cc1287daa8daeedaf05a8b7f18e4ee638cfa7253e09f5d170037` can be recovered into an authorized, clause-complete audit record. If so, re-auditing that fixed snapshot could close semantics without asserting freshness. This delivery neither retrieves those bytes from external stores nor starts that audit.

Otherwise a fresh, separately scoped official-source audit is needed for Appendix ETA 1.3–1.6, 1.9 and 1.10 and necessary cross-references, plus a clause-complete exemption coverage receipt for the Swiss destination cell. This is the precise source boundary that stopped semantic closure. No broad source search is proposed. Positive source-family selection must still get its own freshness gate afterward.

## Review and coordination receipt

The report preserves model evidence, validation results, exact file names and live-gate observations. The intended delivery shape is the immutable task seed plus one four-document commit; the final user receipt supplies the exact pushed head. Verify its actual SHA/counts before review.

Review main/mode/#751/#748 again. Check #843 remains Draft, task blob `fd83d722936d6d896ef8d08cd05b80e6b4bea768` is unchanged, and its full diff is only task plus four delivery documents. Recheck #841's current files against that set. The observed #841 task-only head and its separately authorized `attention-presentation` expansion are disjoint; no Workspace file was edited here.

Local operating-mode and all five repository hygiene checks passed. Document hygiene and diff checks cover the delivery tree. No runtime suite/typecheck/lint/build result is claimed, and synthetic cases are proposed obligations only. Check CI for the exact pushed SHA independently.

## Explicit stop

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

No step-2 code slice may be dispatched from this contract. Keep #843 Draft; no Ready or merge. No runtime writer, Cursor, follow-up slice, DB/Production access, Appendix/CTA registration, extractor/policy activation, Evidence/Rule or F8 was started.

No PO approval is requested merely for this docs delivery or a future separately scoped dormant parser. New user-facing legal assertions/meaning, personal retention, hosted migration, registrations, reserved activations and Production/F8 retain their later PO boundaries. An approval to review this document is not approval to perform any of those operations.
