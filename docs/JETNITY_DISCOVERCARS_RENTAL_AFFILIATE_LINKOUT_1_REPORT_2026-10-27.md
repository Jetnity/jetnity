# DiscoverCars rental affiliate linkout 1 — REPORT

## Continuation — 28 October 2026

**Status** — teilweise fertig. Main is integrated. The approved link behavior still holds. Hosted QA and commission remain open.

**Umgesetzt** — Non-force merge of `origin/main` `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`. No change to the affiliate decision or the Mietwagen insertion. The local browser script now also checks the manual form, the honest search sentence, and the absence of DiscoverCars resources before a click.

**Tests** — Affiliate 16/16 and the existing rental recovery tests passed after the merge. Chromium UI-audit: 320, 390, 768, 1440, root 16px and root 32px, keyboard focus on the link, targets at least 44px, no section or page overflow, no DiscoverCars request. The external link was not opened.

**Build** — `npm run typecheck` pass. `npm run build` pass. `check:setup` still warns that no local `.env` is present.

**Security** — No new route, secret, database or Preview configuration change. `no-referrer` stays.

**Datenbank** — None in this continuation.

**Dokumentation** — These task-owned notes amended. TASK V1 and the completion amendment were not rewritten. Shared status, roadmap and decisions were not edited.

**Kosten** — No new running cost.

**Offene Risiken** — Hosted normal-path QA is still blocked. The earlier Preview failure was missing public Supabase configuration, not a demonstrated rental defect. Commission and document/KYC/domain confirmation are not established by the recorded clicks. A new head invalidates CI `40577685214` and Preview `dpl_EdkZASxnmkV2gtihSh2Nob44Qemd`.

**Nächster Schritt** — Stop for independent Technical Lead review of the pushed head. No Ready, no merge, no follow-up.

**27 October 2026.** Code-only V1 on Draft PR #1059. Not Production. Not a merge request.

**Status** — teilweise fertig. The linkout is implemented and locally checked. Independent review, exact-head CI/Preview, attribution and account acceptance are open.

**Umgesetzt** — Opt-in DiscoverCars affiliate link in the existing Mietwagen section. Generic search by default. Audited Suvarnabhumi (BKK) URL only after an explicit station choice that matches the closed identity. No prices, offers, widget, API or trip-data query.

**Tests** — Focused affiliate tests 16/16 pass. Rental booking and manual-entry recovery tests pass. `npm test`: 7384 tests, 7368 pass, 11 fail, 5 skipped. The 11 failures are local PostgreSQL 16 proofs (`/usr/lib/postgresql/16/bin/initdb` ENOENT or `local_proof_connection_override_forbidden`). Chromium UI-audit script `scripts/discovercars-affiliate-linkout-1/browser.ts` passed: 320, 390, 768, 1440, 200% root font, keyboard focus, 44px targets, guest and account, explicit BKK and trip reload, zero DiscoverCars requests. The external link was not opened.

**Build** — `npm run typecheck` pass. `npm run build` pass. `check:setup` warned that no local `.env` file is present. Lint on touched files pass. `check:exports`, `check:dead`, `check:api-schutz`, `check:deps`, `check:schema-bezug` and `check:operating-mode` pass.

**Security** — The URL is not built from user input. `a_aid=jetnity` appears once. No PII, trip id, date, age, headcount or extra tracking parameter is added. The anchor is a new tab with `noopener noreferrer sponsored` and `no-referrer`. Nothing from DiscoverCars loads before the click. No new API route, secret, RLS change or service role.

**Datenbank** — No migration, no RLS change, no generated types.

**Dokumentation** — Task-owned PLAN, STATUS, HANDOFF, SELF_REVIEW and this REPORT. TASK V1 unchanged. Shared `ACTIVE_WORK_STATUS.md`, `ROADMAP.md` and `DECISIONS.md` were left unchanged on purpose.

**Kosten** — No new running cost. No paid call. The USD 100/month cap is unchanged. An affiliate commission is not claimed and is not verified.

**Offene Risiken** — Attribution and account/link approval are unknown. A visible affiliate link should stay draft until those gates and an independent landing check pass. Official conditions still prohibit PPC, display and paid social as commissionable traffic. Local full-suite PostgreSQL proofs did not run. Exact-head CI and Preview are not yet evidence.

**Nächster Schritt** — Technical Lead reviews the pushed exact head. Cursor stops. No Ready, no merge, no follow-up slice.
