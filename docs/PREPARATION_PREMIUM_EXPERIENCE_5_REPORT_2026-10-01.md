# Preparation Premium Experience 5 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #664
Draft PR: #665
Branch: `feat/preparation-premium-experience-5`
Baseline: `main@2530020dbc6797b17d64c064ca5474cf90804272`
Fetched `origin/main`: same SHA, this branch 0 behind
Runtime commit: `4df9e289857a4b7fa1a5ccdcd656aa561c624fef`
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
- At 200% text the preparation detail uses one shrinkable column, except the two-column jump list. Buttons and legends wrap instead of widening the page. The shared country control is unchanged.

`TripWorkspace.tsx`, `TripWorkspacePlan.tsx`, `TripWorkspaceDetail.tsx`, `TripWorkspaceDomainNavigation.tsx` and domain search components were not edited.

## 2. What was measured

Production-like Chrome, `next start` on `http://127.0.0.1:3456`, `JETNITY_UI_AUDIT=1`. Provider, assistant and readiness routes intercepted. Synthetic trip only.

Evidence: `docs/evidence/preparation-premium-experience-5/audit.json`
Run `2026-09-30T22:46:30.852Z`. JSON `sha` is `4df9e289857a4b7fa1a5ccdcd656aa561c624fef`. Result **PASS**, `fehler` empty.

| Step | Overflow | Notes |
| --- | --- | --- |
| open 360×800, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 | false | Four sections open. Both Schweiz and Serbien in the summary. Two compact placeholder rows plus one current visa row “Nicht erforderlich”. Registry card present. Controls at least 44px. Network 0 |
| interaction 390, reduced motion | n/a | Edit disclosure, binding options Schweiz and Serbien, status, personal add, import confirm then cancel, close, focus ring, reload, Back, Forward. Network 0 |
| 200% at 360×800 | false | Root font 32px. Owned document controls at least 32px. Network 0 |

Screens: `docs/evidence/preparation-premium-experience-5/screens/`.

## 3. Gates on the audited tree

- `npm test`: 4105 pass, 0 fail
- `npx eslint .`: exit 0, 0 errors, 149 existing warnings
- `npx next build`: pass, Next.js 16.3.8, TypeScript inside the build, 25 static pages
- `check:dead` 0 orphans, `check:exports` 0, `check:deps` 0, `check:api-schutz` pass, `check:operating-mode` PASS
- `check:schema-bezug` exit 0, existing note: local/unapplied `admin_account_counts_v1`
- `check:setup:ci` warning only: no `.env`

## 4. Boundaries

No database migration. No new API. No new cost. No secret. No production config. No navbar, footer, favicon or homepage edit. No follow-up slice.

Exact-head GitHub CI, Auth and Vercel are read after the push. They are not inferred from this local PASS.
