# 12Go Mobility Affiliate Linkout V1 — REPORT

**Status** — teilweise fertig. Code and local proof are on the draft branch. Native CI/Auth, exact Preview, and Work’s external click are still open. No Ready and no merge.

**Umgesetzt** — Adjacent stage pairs in Organisieren → Verbindungen now offer one tracked 12Go search each. The link is generic until a reviewed Jetnity place-ID pair exists. A substantiated transfer date is labelled in Jetnity and omitted from the URL. No currency, headcount, or trip identity is forwarded. Native provider search stays off.

**Tests** — 21/21 in `lib/providers/twelve-go/affiliate/*.test.ts`. Local Chrome script exit 0 for 320, 390, 768, 1440, and root 32px, plus a dated-transfer page. No `12go.asia` request before click. Full `npm test` not run locally.

**Build** — `npm run typecheck` pass. `npm run build` pass. Setup check warned that no local `.env` is present; compile, TypeScript, and static generation succeeded.

**Security** — Public partner id `17323861` only. HTTPS allowlist `12go.asia`. `rel="noopener noreferrer sponsored"`. No secret, no API, no iframe or script, no RLS/SQL/Auth change.

**Datenbank** — none.

**Dokumentation** — task-owned PLAN, STATUS, HANDOFF, SELF_REVIEW, REPORT. `ACTIVE_WORK_STATUS.md`, DECISIONS, ARCHITECTURE, and ROADMAP were not edited.

**Kosten** — no new runtime cost. The affiliate link is a user click. Budget cap unchanged. Attribution is unknown.

**Offene Risiken** — A visitor can leave for 12Go and book there. Jetnity does not know whether the generic page preserves a date, CHF, or party size. The example Bangkok → Koh Chang slug is not a live deep link. Preview readiness is not a landing-page pass.

**Nächster Schritt** — Root reviews the exact pushed head after native CI/Auth and Preview. Work opens the generic link in an isolated browser, checks the visible 12Go form, and does not purchase. Same Cursor session for any review fix.
