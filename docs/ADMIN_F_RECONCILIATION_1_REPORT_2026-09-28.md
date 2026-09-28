# Admin F Reconciliation 1 — Report

Date: 2026-09-28
Issue: #605
Draft PR: #606
Branch: `docs/admin-f-reconciliation-1`
Baseline: `main@6d5299f73e8da1b8eec7604686e5d272b70fd256`
Task: `docs/ADMIN_F_RECONCILIATION_1_TASK_2026-09-28.md` v1.1 at `a5fc6b05f235a7d9c422b87edcbd890671c3b0c4`
Cursor-Agent: **Jetnity admin F reconciliation 1**, Generation 1
Status: **DELIVERED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

## 1. Verdict

Admin F’s bounded authorized-area palette is already on main. PR #545 merged it. Accepted head `43720a65ca5296e2009158ccd0bce6b30796ca95`. Merge `8fcccd6475f41703bd2a31deecb3067391f330b4`. The implementation files named in the task are byte-identical to that accepted head. This slice does not rebuild the palette.

The stale claim is documentary. The 22 September remaining-build map, the 26 August D–K audit and the 22 September roadmap intro still describe a disabled `Befehlssuche folgt` placeholder or an unverified #545 dispatch. Those statements are now explicitly superseded for Admin F only. Older sentences stay in place as historical snapshots.

No reproducible runtime defect was found in the re-read or in the fresh checks below. No runtime edit was made.

## 2. Trace that exists today

1. `app/(admin)/layout.tsx` calls `requireAdminPage({ surface: 'admin-bereich' })` and passes `role` and `grant` into `AdminSessionProvider`.
2. `app/(admin)/admin/layout.tsx` wraps the shell in `AdminNavigationSearchProvider` and renders `AdminNavigationSearchTrigger` with `surface="mobile"`.
3. `components/layout/AdminTopbar.tsx` renders `AdminNavigationSearchTrigger` with `surface="desktop"`. The separate dashed control is `Copilot Pro folgt`, not search.
4. The provider reads `useAdminSession()`, then `filterAdminNavSearch(ADMIN_NAV_ITEMS, session, query)`.
5. `readyAdminNavItems` keeps `filterAdminNav(...)` results whose `kind === 'ready'`. `later` items never match.
6. Selection uses `resolveAdminNavSearchHref` against that ready allowlist. The query cannot become a URL.
7. Page gates read on this pass, unchanged: users and users actions require `konten-verwalten`; system-health and provider-ops require `betrieb-lesen`; payments page calls `requireAdminPage({ surface: 'payments' })`. UX filtering does not grant or enforce any of these.

`ADMIN_EHRLICHE_TEXTE.sucheFolgt` is absent. Current copy is `sucheBereiche`: local navigation, no record search, no command, no execute.

## 3. Actual UX

- Desktop trigger in the top bar, label `Bereiche suchen`, visible shortcut `Strg+K`. Mobile trigger in the small-screen strip, label `Bereiche`.
- Cmd/Ctrl+K opens the dialog, or focuses the input if it is already open. Shift, Alt and IME composition do not count. The handler accepts Meta and Ctrl; the visible kbd text is always `Strg+K`. That is existing accepted copy, not a new defect and not a reason to edit runtime.
- Empty query lists the session’s ready areas only. Operator: Steuerzentrale, Nutzer, Zahlungen, Security, System Health, Provider & Kosten. Creator: Steuerzentrale only. Break-glass: ready areas except Nutzer.
- Matching is literal substring on label, path and static aliases. `Kosten` resolves to Provider & Kosten. `kosten!` and `???` do not match. Analytics, Content, Marketing, Einstellungen and Lokalisierung stay out of results.
- Arrow keys move the retained href. Enter on the input activates the allowlisted option. Escape and backdrop click close. Focus returns to the invoker when it is still visible, otherwise the visible desktop or mobile trigger, otherwise `#admin-content`.
- Opening search closes the mobile drawer. A foreign `aria-modal="true"` blocks open. The mobile drawer is excluded from that foreign-modal check.
- The dialog is fixed to `visualViewport` when available. The panel uses `max-height: calc(100% - 24px)`. The list scrolls. The active row is scrolled into the list window.
- Every result `Link` sets `prefetch={false}`.

## 4. Evidence classes

| Class | What | Result |
| --- | --- | --- |
| Runtime-built | Palette on main since #545 | Source unchanged versus `43720a65` |
| Historically verified | #545 TL PASS review `5281481739`; post-merge comment `5781083393`; historical harness notes in `docs/evidence/admin-navigation-search-1/NOTES.md` | Not re-labeled as today’s proof |
| Newly rechecked | 24 unit tests; 12 Chromium harness cases | 24 pass, 0 fail, 0 skipped; 12 pass. Logs in `docs/evidence/admin-f-reconciliation-1/` |
| Still unverified | Signed-in Admin, Vercel Preview as a real session, physical device, production prefetch execution | Not claimed |

Seed-head CI on `ef866098` is not this delivery’s gate. Exact-head CI, Auth and Vercel for the delivery commit are reported only after that commit exists.

## 5. Continuity corrections

Dated supersession, not a silent rewrite:

- `docs/JETNITY_REMAINING_BUILD_MAP_1_REPORT_2026-09-22.md` §0. The F sentences in §1, §3.1c and §4 remain visible and are marked historical.
- `docs/ADMIN_D_K_GROWTH_CONTROL_AUDIT_EVIDENCE.md` notes on the 26 August Befehlssuche row and on the old “smallest next step” item. Copilot Pro stays a placeholder. Other audit rows are untouched.
- Current pointers in `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-28.md` and `ROADMAP.md`.

`docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md` is still absent. It was not created.

## 6. Direction while external replies are pending

KAYAK #395, Sherpa #294 and IATA Timatic #294 remain responses pending. No provider is selected. #585 stays deferred. Finding 5.2 and the existing release and security gates stay open. Public indexing stays disabled.

New direction, persisted here and in the current pointers: safe provider-independent useful residuals may be considered while those replies are pending, and only after a fresh binding-slice precheck. This does not authorize a second Admin F, a Phase-2 bulk rollout, a new API, data or permission contract, or any special Product-Owner gate.

## 7. Next-candidate assessment

This is an assessment from the current source. It dispatches nothing.

Do not start:

- Another Admin F palette or a second command framework.
- Record search, command execution, or query history.
- Admin E support RPC or a minimised admin trip card. No such RPC was found. A new privilege would remain a privacy/RLS gate. The existing support runbook is not that surface.
- AP-8 account-wide preferences. Trip-scoped workspace preferences exist in `lib/trips/workspace-praeferenzen.ts`. An account-wide preference store isolated from traveller identity was not found. The identity/`profiles` boundary stays.
- AP-9 favorites. No favorites table or account UI was found. A Product-Owner usefulness question would still come first.
- AP-11 notification matrix or consent persistence. The accepted preflight still treats consent persistence as a Production-migration gate.
- AP-12 entitlements or live money. `app/api/admin/payments/refund/route.ts` still inserts into `refunds`, reads `payments`, then optionally updates status as separate steps. That is the Billing-P1 residual. It is real and it is not a safe ungated next slice.
- Phase-2 nav modules that are still `kind: 'later'`: Analytics, Content, Marketing, Einstellungen, Lokalisierung. They stay honest placeholders and stay out of search.
- Copilot Pro. The top bar still says `Copilot Pro folgt` with no execute path.
- A new Admin J-lite SEO page. System Health already renders `IndexingStatus` from `ladeSeoStatusFuerSeite`. Duplicating that card is not useful. Public indexing remains off.

No residual in this read is both clearly useful and clear of those boundaries. If the Technical Lead wants a provider-independent residual after this review, the next step is a fresh precheck and a new versioned task. This agent will not open it.

## 8. Boundaries held

No runtime, Auth, role, RLS, migration, database, Production, provider, payment, indexing, API, dependency, cost, governance or CI edit. No `@cursor` trigger. No Ready. No merge.

## 9. Stop

Independent Technical-Lead review of the exact delivery head is the next unfinished step. A new head invalidates this gate.
