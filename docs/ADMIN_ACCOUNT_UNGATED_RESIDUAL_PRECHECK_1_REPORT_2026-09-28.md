# Admin + Account Ungated Residual Precheck 1 — Report

Stand: 28 September 2026
Status: **PRECHECK COMPLETE / DOCS ONLY / NOT A PASS / NOT MERGED / NO IMPLEMENTATION**
Task: `docs/ADMIN_ACCOUNT_UNGATED_RESIDUAL_PRECHECK_1_TASK_2026-09-28.md`
Issue: #609
Draft PR: #610
Branch: `audit/admin-account-ungated-residual-precheck-1`
Subject: `main@bee041911003a3b871dacddc0fcdd12f4b8714a1`

Writer: **Jetnity admin account ungated residual precheck 1**, Generation 1.
Session: https://cursor.com/agents/bc-fe383c81-adf7-4f97-a1a2-6a276902a46a
`originalModelName=grok-4.7-high-fast` from cursor-cloud `run-info`. Not Auto. Not a substitute.

This precheck implements nothing. Cursor does not Ready and does not merge.

## 1. Live reconstruction

Fetched `origin/main` during this session. Live evidence wins over the stale local ref that still pointed at #606 when the workspace first opened.

| Fact | Live read |
| --- | --- |
| Operating mode | `NORMAL` in `.jetnity/operating-mode.json`. Special Product-Owner gates remain. |
| `main` | `bee041911003a3b871dacddc0fcdd12f4b8714a1` — Merge pull request #608, 2026-09-28 23:20:56 +0200. |
| Branch vs main | This branch contains that main commit. The only commit not on main at reconstruction was the task seed. |
| CI on that SHA | GitHub Actions `36485494832` **success**. |
| Vercel on that SHA | Commit status `Vercel` **success**, deployment `GcT2JGuNZVjdHaTfd27VqQnfQhg4`. GitHub deployment `6720863167` environment Production **success** at 2026-09-28T21:21:35Z. This session did not re-request `https://jetnity.com`. |
| Open PRs | #610 (this Draft) and historical Drafts #52, #50, #40, #39, #28. No other open product writer. |
| Open issues | #609 (this task), #585 legal/vendor wording, #395 flight-provider gate, #440 standing authorization, #294 entry-requirements target, #236 strategy register, #20 future collaboration. |
| Running cloud agent | This session only (`RUNNING`). The #608 and #606 sessions are `IDLE`. They are not writers. |

#606 and #608 are merged. Do not redispatch them.

## 2. Supersession

Current source on this main, not the 21 September audit rows.

| Historical item | Current state | Proof |
| --- | --- | --- |
| Admin F palette | Closed by #545. #606 only reconciled docs. | `docs/ADMIN_F_RECONCILIATION_1_REPORT_2026-09-28.md`. Do not rebuild. |
| Admin Users search/navigation | Closed by #608. | `components/admin/UsersTable.tsx` no longer replaces the URL on mount. Page changes keep `urlQ`. `lib/admin/users-search-navigation.ts` exists. |
| RH-1.1 Auth lookup-failure | Closed by #500. | `proxy.ts` `authLookupFehlerIstSitzungFehlend` then `denyUnavailable(..., 'lookup-failed')`. |
| RH-3.1 mobility order | Closed by #502. | `lib/mobility/kanten.ts` sorts by `position`. |
| RH-10.1 / RH-10.2 | Closed by #504. | `SecurityWidget.tsx` and `lib/admin/kennzahlen.ts` import `lib/admin/security-event-taxonomy.ts`. |
| TA-R1 invalid guest draft | Closed by #517 and #532. | `lib/trips/uebernahme.ts` returns `{ art: 'ungueltig' }`. `GastreiseBruecke` shows a dedicated alert and does not treat that art as silence. |
| TA-R2 protected-item dates | Closed by #520. | `lib/trips/attention.ts` documents `item.date_mismatch` for a protected `startsOn` that did not move. |
| TA-R3 Foundation-E degraded read | Closed by #531. | `lib/trips/account-graph-read.ts` checks `accountGraphKinderVollstaendig` after `foundationERelationFehlt`. |
| VUX-1 / VUX-2 / VUX-4 | Closed by #516. | Workspace usability task owns those three. |
| VUX-3 | Closed by #526. | Status-language task. |
| VUX-5 | Closed by #522. | Destination-essentials density. |
| VUX-7 | Closed as the manual-planning entry, #524. | Not an idea-first reorder. |
| VUX-8 | Closed by #534. | Tablet hero fit. |
| VUX-6 | Not accepted. | Do not implement a 360 hero peek. |
| Legal / Terms / Privacy / SMTP / Auth redirect / account erasure | Closed 27–28 September except #585. | Checkpoint: #600/#601 Terms, #579/#580 PrivacyBee surfaces, #586 SMTP/Auth URL, #583 callback, #590/#597/#599 erasure. #585 stays an open legal/vendor-text issue. Do not hand-edit PrivacyBee copy. |

## 3. Gates that stay gates

These are not ungated candidates.

| Item | Class |
| --- | --- |
| Admin E support User + Trip read | GATED. No minimised support trip RPC. A new cross-account trip read is a privacy/RLS contract. |
| AP-8 account-wide preferences | GATED. Settings are security, export, and erasure. Trip-scoped preferences already exist. An account-wide store still needs the profile/identity boundary. |
| AP-9 favorites | GATED until a Product-Owner usefulness decision. Tests still forbid a bookings-style nav invention; favorites are absent on purpose. |
| AP-11 notification matrix / consent persistence | GATED. Production migration / consent. |
| AP-12 entitlements and payment-live | GATED. Money movement. |
| Billing-P1 refund integrity | GATED. `app/api/admin/payments/refund/route.ts` still inserts, rereads, then optionally updates. Not this precheck's candidate. |
| Finding 5.2 persistent ingestion, observability vendor, retention | GATED. UI honesty is not an ingest writer. |
| Production account-count exposure | GATED. Local proof is not live counts. |
| KAYAK / Sherpa / IATA / Official Truth | GATED. Responses pending. No contact, terms, credential, API, or spend. |
| Public indexing / launch | GATED. Indexing stays off. |
| Phase-2 Admin nav (`kind: 'later'`), Copilot Pro | Deliberately later. Placeholders stay honest. |
| `/account/bookings` absent from account nav | Accepted contract. `lib/account/navigation.test.ts` asserts it is not a tab. |

## 4. Fresh search

Inspected current Admin home, navigation search, users, security, system health, provider-cost, payments read surface, account home, trips, settings, security, export, travellers, world, bookings, and the guest bridge.

Closed surfaces above were not reopened. Empty-versus-error on account trips, bookings, export, admin users errors, security load failure, and payments load failure is already separated. Bookings already names its 200-row cap.

Three source defects remain. Details: `docs/evidence/admin-account-ungated-residual-precheck-1/NOTES.md`.

No browser session was run. This slice is docs-only.

## 5. Candidates

### C1 — Admin transaction status filter applies the previous status

- **Classification:** `UNGATED`
- **Severity:** P2
- **Cursor may implement without a new Product-Owner approval:** yes, only inside the boundary below. This is not Billing-P1 and not payment-live.
- **Paths:** `components/admin/payments/PaymentsCenter.tsx` (`TransactionsCard` only); `app/api/admin/payments/list/route.ts` is the existing reader and should stay unchanged unless a test proves the query shape is wrong.
- **Evidence:** select `onChange` calls `setStatus` and `filtern()` together. `load` reads `status` from that render. The list route applies `status` only when the query sends it. Trace in the evidence note.
- **Why it is still open:** #608 fixed Admin users search. It did not read this payments control. No later merge changes `TransactionsCard`.
- **Operator impact:** the control shows the newly chosen status while the request still uses the previous one. `all` → `paid` loads every status. `paid` → `failed` loads paid rows under a failed control.
- **Smallest boundary:** pass the chosen status into the load that the change starts. Keep search text, cursor reset, empty-versus-error, and the existing status values. Do not edit `RefundCard`, the refund route, payment schema, Stripe, or any write.
- **Acceptance:** change `all` to `paid` sends `status=paid` on that gesture; change `paid` to `failed` sends `failed`; `Filtern` still applies the visible status and `q`; a failed read stays an error, not an empty table; refund copy and the refund request body stay byte-stable.
- **Collision:** same file contains `RefundCard`. A writer that opens the refund route has left this candidate and entered Billing-P1. Historical Drafts #40 and #39 are not owners of this file.
- **Recommend now:** yes, if one slice is dispatched.

### C2 — Admin security filter miss speaks as an empty period, and the 200-row cap is silent

- **Classification:** `UNGATED`
- **Severity:** P3
- **Cursor may implement without a new Product-Owner approval:** yes. This does not ingest events and does not close finding 5.2.
- **Paths:** `components/admin/security/SecurityWidget.tsx`; `lib/admin/ehrliche-zustaende.ts` copy; `app/api/admin/security/list/route.ts` only if the cap must be named from a count. Existing coverage test `lib/admin/security-event-coverage-truth.test.ts`.
- **Evidence:** filtered `events.length === 0` renders `securityTabelleLeer` (`Keine aufgezeichneten Events in diesem Zeitraum.`). The route caps at 200 with no truncation field. Bookings already disclose the same kind of cap.
- **Why it is still open:** #504 aligned KPI words. It did not split filter-empty from period-empty, and it did not disclose `MAX_ZEILEN`.
- **Operator impact:** a search with no hit says the 7-day window recorded nothing. A full 200-row page can be read as the whole window, and the 24h counts are taken from that capped array.
- **Smallest boundary:** when `data.events` is non-empty and the filter matches nothing, say the filter matched nothing. Keep the period sentence for a truly empty payload. Name the 200-row read cap without claiming a longer window was counted. Do not add a writer, retention period, or Auth-log ingest.
- **Acceptance:** empty payload keeps the period sentence; unmatched filter does not; a 200-row payload is visibly capped; 24h labels stay “Aufgezeichnete”; zero rows still do not mean “nothing dangerous happened”; IP block remains described as not enforced.
- **Collision:** finding 5.2. A slice that inserts `security_events` is out of bounds.
- **Recommend now:** only if C1 is refused because it sits in the payments file. Otherwise it waits.

### C3 — Null profile `created_at` is rendered as the current time

- **Classification:** `UNGATED`
- **Severity:** P3
- **Cursor may implement without a new Product-Owner approval:** yes. No schema change.
- **Paths:** `app/(admin)/admin/users/page.tsx` mapper only. `components/admin/UsersTable.tsx` already renders an em dash for a null `last_seen_at`.
- **Evidence:** `created_at: r?.created_at ?? new Date().toISOString()`. Column is nullable with a default (`20260815060111_baseline.sql`). Types say `string | null`.
- **Why it is still open:** #608 left the server page untouched on purpose.
- **Operator impact:** a profile with a null `created_at` looks newly created at the moment the page rendered.
- **Smallest boundary:** pass null through and render an em dash. Do not change search, pagination, role, or status actions. Do not add `NOT NULL`.
- **Acceptance:** null stays null and displays as an em dash; a real timestamp still formats `de-CH`; the #608 search tests still pass.
- **Collision:** none with #608 if the search effect is not edited. No Production row was read, so this path may have no live example.
- **Recommend now:** no. Too small, and unproven against a live row.

## 6. If none of these is wanted

There is no larger ungated Admin/Account feature that should start while KAYAK, Sherpa, and IATA are waiting. Missing AP-8/9/11/12, Admin E, Billing-P1, and ingestion are gates, not spare work.

**Immediate follow-up:** C1 only.
**If C1 is judged payment-gated because of the shared file:** do not “carefully” edit the refund card. Dispatch C2, or say **NONE**.

## 7. Boundaries held

No runtime, Auth, RLS, migration, package, workflow, operating-mode, provider, payment, indexing, or global continuity edit. `docs/ACTIVE_WORK_STATUS.md` was not updated; this task forbids that write.

## 8. Stop

Stop for independent ChatGPT Technical-Lead exact-head review of the commit that contains this report. Do not start C1, C2, or C3 from this session.
