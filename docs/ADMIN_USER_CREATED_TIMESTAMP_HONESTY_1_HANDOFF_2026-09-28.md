# Admin user created timestamp honesty 1 — handoff

Stand: 28 September 2026

## Current boundary

Draft PR #616 implements Issue #615 on `fix/admin-user-created-timestamp-honesty-1`.

Writer: **Jetnity admin user created timestamp honesty 1**, Generation 1.
Session: https://cursor.com/agents/bc-decff300-3d45-499e-9b41-8c26cc8116ce
Model field: `originalModelName=grok-4.7-high-fast`. Required model was Grok 4.7 High Fast. Not Auto.

Live `origin/main` re-read at delivery preparation: `135558c485baf7de844056d81190824eed3ad84e`.
Operating mode: `NORMAL`. Special Product-Owner gates remain.

The next step is independent ChatGPT / Technical-Lead code and render review of the exact pushed head. Cursor does not Ready and does not merge. A new head invalidates this local evidence as a gate.

## Parallel work

Draft PR #614 remains a separate writer for Admin Security filter honesty. Its files include `components/admin/security/SecurityWidget.tsx`, `lib/admin/ehrliche-zustaende.ts`, and `lib/admin/security/filter-ehrlichkeit.ts`. This slice does not touch them and does not touch Payments.

## What the reviewer should see

- Missing `created_at` stays null in `lib/admin/profil-erstellt.ts` and in the users page mapper.
- `UsersTable` shows `—` for that null and keeps de-CH formatting for a real timestamp.
- Evidence: `docs/evidence/admin-user-created-timestamp-honesty-1/`.
- Synthetic only. Not signed-in Admin. Not Production.

## Do not

- Do not add `NOT NULL`, a backfill, or a Production profile read to prove the nullable path.
- Do not reopen #608 search/navigation logic.
- Do not start a follow-up slice from this writer.
- Do not treat local tests, this handoff, or a green CI run as Technical-Lead PASS.
