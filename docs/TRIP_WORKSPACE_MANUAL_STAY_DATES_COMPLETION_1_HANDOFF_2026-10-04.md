# Trip Workspace manual stay dates completion 1 — Handoff

Issue #832 / **Draft PR #833**, Generation 1. Implementation complete; independent exact-head review pending.

## Identity

- Branch `fix/trip-workspace-manual-stay-dates-1`.
- Baseline/main/merge-base `85a53346a87b6175f9e0ffad9901ff6bd45a2654`.
- Immutable seed `982b791e3fbd09676a19bf7ae5293a7879dbe221`.
- Final head is the one implementation commit after the seed, recorded in the PR delivery body; expected main-relative ahead/behind is 2/0.
- Task SHA-256 `029a3a43f51807d707aacf14874ae0b2ff19f15bea834477cc5e9b6792f9dd9c`, unchanged.
- Actual Codex Desktop session metadata: `gpt-6-astra` / `xhigh`; session `01a108ff-d172-79b1-8b92-0450dcb96132`. No delegated writer or Cursor agent.

## What to review

The existing Unterkunft surface now edits only the two calendar dates of manual stay items. Shared eligibility requires stay + absent provider/ref/booking URL. User booking status remains independent. One shared date schema supplies strict calendar-day validation to UI/account/guest. Existing coverage recomputes from the new canonical graph.

Account: validate untrusted input -> `konto()` -> exact item+trip pre-read -> shared eligibility -> two-field UPDATE with repeated atomic identity guards -> returned-row check -> success-only revalidation -> router refresh. RLS remains ownership authority. Guest: exact-one id across days/ohneTag -> same validation/eligibility -> spread-preserve target -> existing revision/schema/persistence -> exact returned graph in state.

Attack the complete UPDATE payload, forged input properties, cross-trip/missing ids, provider/ref/URL and concurrent identity changes, invalid/reversed/equal/partial dates, duplicate guest ids, sibling/non-date preservation, storage failure and coverage outside the trip. Booking must never supply absent nights. Review labels/focus/error retention/pending/double-submit behavior and small viewports.

## Evidence

- [REPORT](TRIP_WORKSPACE_MANUAL_STAY_DATES_COMPLETION_1_REPORT_2026-10-04.md): all 14 writer-owned files, behavior, validation and access inventory.
- [SELF_REVIEW](TRIP_WORKSPACE_MANUAL_STAY_DATES_COMPLETION_1_SELF_REVIEW_2026-10-04.md): adversarial review and remaining proof limits.
- Focused suite 166 PASS; complete disposable Linux/PostgreSQL suite 5260 PASS with zero skipped; typecheck, lint, build and all required hygiene gates PASS. Lint retains 149 pre-existing warnings.
- Native macOS full-suite first run had 3 PostgreSQL binary-path failures; this was not labeled PASS. Linux with PostgreSQL 16 exercised all SQL fixture cases.
- Local actual-component Chrome proof covers validation, success/failure, real guest persistence and coverage, keyboard/focus, ten viewport sizes and 320px/200% text. Account transport is mocked in tests; no hosted authenticated transaction or physical-device proof is claimed.
- CI jobs and Vercel Preview must be checked against the delivered SHA, using the PR receipt; seed deployment success is not delivery proof.

## Live continuity

Live #751 keeps Writer A on #833 and separately dispatches file-disjoint Writer B #834/#835. Relevant #748 receipts `5984167839` and `5985154235` were read; the new Official Truth hardening requirement does not change this Workspace slice. All Official Truth, hosted apply, Production and follow-up gates remain intact. No #751/#748/governance document was edited.

Before accepting, independently re-read main/mode/#751/#748, PR head/base/diff, task bytes, review threads, CI/Preview and model evidence. Re-review if the head moves. The account path depends on existing RLS and server refresh; the guest path preserves existing full-graph local persistence semantics. These are explicit limits of the proof, not new authorization.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** The writer leaves #833 Draft. Self-review is not TL PASS. Do not Ready/merge/start B03b, U02/U03, B01 or another slice from this handoff.
