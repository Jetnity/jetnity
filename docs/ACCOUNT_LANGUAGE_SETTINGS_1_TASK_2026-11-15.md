# Account language and persisted settings 1 — 15 November 2026

## Authorization, sequence and baseline

Sasa authorizes necessary Development work without another permission request and asks for translations and saved settings after #1199, #1200, #1201, #1203 and #1204 have completed with green CI. This task is prepared while those final CI runs finish; product implementation starts only after the complete five-package gate. Production actions, merges, new costs and login/2FA remain with Sasa. Real-money refunds remain disabled. #1202 is HOLD until #1197 is merged. Neither #1196–#1198 nor their changed paths belongs to this task.

Own branch: `feat/account-language-settings-20261115`, stacked on #1200 at `ac10784a3bc9f0440cdf0e2a45d8391b1034b0dc`. This preserves its Content and Analytics navigation improvements. No merge of the other packages is performed. Main remains `63544e820e912bd275556588c956a09b99b1cf90`.

The live protected-path inventory is 102 / 392 / 98 files; #1197 is `70a3cb09204e74f6bcd4a5b481e942e526a6102f`. Recheck before publishing. ARCHITECTURE.md, DECISIONS.md and ROADMAP.md are in that lane, so the architecture/decision/continuity addendum for this package lives in its dedicated handoff, with a later integration note rather than competing edits.

## Product goal and bounded completion

An authenticated customer can choose German or English, explicitly save that choice in their own account, reload the page and see the saved language again. Account Settings content, including export and deletion presentation/status, is translated consistently. Admin Settings offers the same personal language preference; it does not pretend to manage global secrets or company configuration. Admin Localization shows the actual catalog and covered routes with transparent gaps.

The first catalog covers the Settings surfaces in German and English. This implements the Vision's staged internationalization approach (seven languages are the long-term target). Shared root/Account/Admin shells, security routes, travel routes, provider widgets and the entry display are not claimed as translated. Their protected source files remain untouched. The translated subtree receives its own `lang`. No DOM rewriting, alternate shell, automatic browser-language inference, or invented site-wide coverage percentage.

## Storage and authority

- Use only `jetnity_ui_locale_v1: "de" | "en"` in the current user's existing Auth user metadata, through the normal session `auth.updateUser({ data: { jetnity_ui_locale_v1: value } })` operation.
- Send this one flat key only, never replace or forward all metadata and never use an admin/service-role Auth API. A client-supplied expected user ID only rejects a stale account context; it never selects a write target.
- Verify identity via server `auth.getUser()` before writing; read back through `getUser()` after writing. Report success only when the same user and exact persisted value are verified. A network/readback uncertainty is not success and causes no automatic retry.
- Missing/invalid values safely use German as an unsaved fallback, not a fabricated persisted choice. Invalid future values are not silently overwritten. Concurrent explicit saves use Auth's ordinary last-writer-wins semantics; no compare-and-swap claim.
- User metadata is user-editable, untrusted display data. It must never influence role, authorization, AAL, nationality, official requirements, currency, commercial state or provider parameters.
- Bind deployed previews to the already-verified exact Development Supabase project. Normal product code can support the existing exact Production project only in a Production deployment authorized by Sasa; no Production call, ENV change, deployment or data write occurs in this task. Reject mismatched/foreign project configuration before constructing the client or writing. Local deterministic tests use explicit fixtures.
- No database DDL, migrations, RLS/ACL/grants, new roles, managed Auth schema changes, BG1 baseline changes, new service or new costs. The existing Auth metadata capability supplies persistence; no Local Storage is presented as account storage.

This is a UI preference, not a travel preference. ADR-0044's future first-class travel preference model remains applicable. Existing browser-local themes/sidebar preferences remain separate and are described as browser-local.

## UI and API changes

New modules under `lib/localization`, `lib/account/ui-einstellungen-1` and `components/account/ui-einstellungen-1` contain the typed DE/EN catalog, strict locale parser, read/write port and server adapter, Server Actions, and reusable settings surface. Account Settings reads the verified preference on the server. The client presents distinct loaded/default/unavailable/unauthenticated, changed/saving/saved, rejected and unconfirmed states; it prevents duplicate submits and discards results after unmount or account change.

Existing editable paths are limited to:

- `app/account/settings/page.tsx` and the two Admin Settings/Localization pages;
- presentation in `components/account/KontoLoeschen.tsx` and `components/account/account-home-export-1/KontoDatenexportAktion.tsx`;
- localized export response text, while keeping its validator unchanged;
- `lib/admin/navigation.ts` and its tests, preserving #1199/#1200's entries;
- directly affected contract tests and the existing Account Settings audit harness, with a new mounted browser suite wired through the normal Core test selection.

The exact deletion confirmation remains `KONTO LÖSCHEN` in both languages, explained in English. Existing deletion state machine, fresh password, MFA, environment/ownership checks, expiry, and destructive action are unchanged. Only presentation strings are localized. The existing export stays `jetnity.account-export.v1`, with the same thirteen tables and strict client validator. The interface states that account language and browser appearance are outside this account/travel-row export; it does not expose raw Auth metadata or advertise a full legal data export.

## Test and evidence plan

1. Validate only DE/EN; malformed values, oversized inputs, extra authority fields, missing identity and unknown project targets fail closed.
2. Port tests cover read failures vs. unset preference, rejected/throwing writes, same-account readback, foreign/stale account context, inconsistent/failed readback, exact single-key payload, preservation of unrelated metadata in a faithful merge fixture, no auto-retry and fresh reload through the reader.
3. Catalog coverage and parity tests cover normal and every error/busy/accessibility string; unknown deletion error presentation stays generic without changing deletion authority.
4. Mounted browser tests exercise the real production components: selection/save/readback, reload fixture, failure and retry, late result/unmount/account replacement, keyboard, German/English labels, 320px and 200% reflow, and existing export/deletion presentation contracts. Synthetic ports remain clearly labeled; they do not establish a live signed-in Dev persistence proof.
5. Run the complete affected test batch, collect every failure before a combined fix. TypeScript, lint, all applicable static gates, independent exact-source review, then normal complete CI/build with all nine final job logs. No changes to CI, package scripts, selector or protected entry tests.
6. Configure only the new branch's Preview public Supabase pair from the existing Dev project, verify exact deployed SHA/READY and protected public login access. Positive signed-in save/reload and Admin AAL2 acceptance use a legitimate user session and remain Sasa's login/2FA step if none is available.

## Entry, launch and follow-on constraints

Nothing here changes first-display entry obligations: visa, ETA, passport validity, vaccinations, health, forms with costs and scam warning, fees, return/onward ticket, transit, children, customs, exceptions, source/date, notice and official link; unconfirmed information says “derzeit nicht verfügbar”. UI locale must not become a source of those facts.

Next after this package: a real versioned CMS, then Marketing, with explicit Dev schema/BG1 compatibility analysis before any data or privilege change. Global CMS/Marketing records do not belong in personal Auth metadata. The 30 November launch still requires Sasa's package merges, authenticated acceptance and Production release; this package does not claim whole-system launch readiness.
