# Preparation Premium Experience 5 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #664
Draft PR: #665
Branch: `feat/preparation-premium-experience-5`
Original baseline: `main@2530020dbc6797b17d64c064ca5474cf90804272`
Integrated main: `85d730993148b058a2dd3acd19947c025bdcf7f7` (#663 Reiseplan, which already contains #669 `/planen`). This branch is 0 behind that main.
Runtime commit: `fda7a6685a0bf8cb150ee490079a7cdad7658de3`
R1 review head that this corrects: `db42f6db571574896551b75905904d4ec07f709a`
Agent: **Jetnity Preparation premium experience 5**, Generation 1
Session: https://cursor.com/agents/bc-37a6cdc4-88dd-4132-8c15-08cda875f94a
`originalModelName`: `grok-4.7-high-fast`

Required model Grok 4.7 High Fast was the session model. No Auto substitution.

This file is the delivery record. It is not a Technical-Lead PASS, Ready, or merge.

## 1. What changed

Presentation only. Readiness, traveller and official truth stay in the existing helpers. No provider, schema, Auth or package change.

- Vorbereitung opens into four native sections: Reisende & Dokumente, Offizielle Anforderungen, Tickets & Buchungsbestätigungen, Eigene Vorbereitung. A jump list reaches them. Each section starts open and can be collapsed.
- The closed summary keeps the counts, the fail-closed status, the disclaimer “Ein Häkchen ist keine offizielle Visa- oder Einreisebestätigung.”, and the several-traveller / unknown-country warnings.
- Each trip traveller shows every citizenship, residence and document, including the document↔citizenship binding, before “Angaben bearbeiten”. The editor stays the existing save/remove form. No primary citizenship or passport is inferred.
- Saved-traveller import cards list residence, every citizenship and every document. “In diese Reise übernehmen” still asks for an explicit copy and can be cancelled.
- Identical pure placeholders share one visible status line. Each official row stays in the list. Current rows keep result, timing, authority, freshness and the action link.
- Tickets/bookings and personal preparation keep Offen / Erledigt / Nicht relevant, Entfernen, and “Punkt hinzufügen”.
- At 200% text the preparation section fills the workspace shell. Jump links, traveller summaries, official rows, status controls and form fields are full-width blocks. Labels wrap on spaces. Horizontal padding and status icons stay pixel-sized so 200% text does not squeeze the column. `overflow-wrap: anywhere` is not used. The shared country control is unchanged.
- Technical-Lead R1-F2: every #665 edit to `docs/ACTIVE_WORK_STATUS.md` is reverted. That file matches `main`. This slice keeps only its report, handoff, self-review and evidence.

`TripWorkspace.tsx`, `TripWorkspacePlan.tsx`, `TripWorkspaceDetail.tsx`, `TripWorkspaceDomainNavigation.tsx` and domain search components were not edited.

## 2. What was measured

Production-like Chrome, `next start` on `http://127.0.0.1:3456`, `JETNITY_UI_AUDIT=1`. Provider, assistant and readiness routes intercepted. Synthetic trip only.

Evidence: `docs/evidence/preparation-premium-experience-5/audit.json`
Run `2026-09-30T23:23:24.064Z`. JSON `sha` is `fda7a6685a0bf8cb150ee490079a7cdad7658de3`. Result **PASS**, `fehler` empty. The section width matches its parent shell at every step, including desktop widths capped by `max-w-7xl`.

| Step | Overflow | Notes |
| --- | --- | --- |
| open 320×568, 360×800, 375×812, 390×844, 412×915, 430×932, landscape 844×390, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900, 1728×1117, 1920×1080 | false | Four sections open. Both Schweiz and Serbien in the summary. Two compact placeholder rows plus one current visa row “Nicht erforderlich”. Registry card present. Controls at least 44px. Network 0 |
| interaction 390, reduced motion | n/a | Edit disclosure, binding options Schweiz and Serbien, status, personal add, import confirm then cancel, close, focus ring, reload, Back, Forward. Network 0 |
| 200% at 360×800 | false | Root font 32px. Section fills the shell. Owned document controls at least 32px. Network 0 |
| zoom 125% and 150% at 1440×900 | false | Section fills the shell. Network 0 |

Screens: `docs/evidence/preparation-premium-experience-5/screens/`.

## 3. Gates on the audited tree

- `npm test`: 4105 pass, 0 fail
- `npx eslint .`: exit 0, 0 errors, 149 existing warnings
- `npx next build`: pass, Next.js 16.3.8, TypeScript inside the build, 25 static pages
- `check:dead` 0 orphans, `check:exports` 0, `check:deps` 0, `check:api-schutz` pass, `check:operating-mode` PASS
- `check:schema-bezug` exit 0, existing note: local/unapplied `admin_account_counts_v1`
- `check:setup:ci` warning only: no `.env`

## 3b. Main integration

`a289f36a` merges exact main `85d730993148b058a2dd3acd19947c025bdcf7f7`. The merge was clean. No Vorbereitung file overlapped #663. The R1 layout remains. The merged #669 `/planen` files and the merged #663 Reiseplan files are present as they are on main. `docs/ACTIVE_WORK_STATUS.md` still matches `main`. After this merge, `npm test` was 4118 pass / 0 fail. Exact-head observation for `935719b8969e51da38c63999d14432751b48eb85`: Actions `36795378505` SUCCESS (Auth-Konfiguration gegen config.toml, and Typecheck, Lint & Build). Vercel SUCCESS, deployment completed, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/FpLEzgYTh6xDTdDWq2Y5bEhVgNpr`. That observation does not approve a later commit and is not a Technical-Lead PASS.

## 4. Boundaries

No database migration. No new API. No new cost. No secret. No production config. No navbar, footer, favicon or homepage edit. No follow-up slice.

Earlier exact-head observation for `4e46b318b1d42d98df74007bd88fa17d90dad76d`: Actions `36790909835` SUCCESS (Auth and Typecheck, Lint & Build), Vercel SUCCESS at `https://vercel.com/jetnity-e1b93c82/jetnity-app/A9ssh22GqeAJkvELRn6srNuA7MqE`. That observation does not approve the main-integration head. This report is not a Technical-Lead PASS.
