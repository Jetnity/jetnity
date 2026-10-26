# Account Home and Export Completion 1 — Self-review

**Lane K · 26 October 2026 · Cursor Generation 1**

This is the author's review. It is not a Technical-Lead PASS.

## Findings

**P0.** None found in this lane.

**P1.** None found that block the bounded acceptance. The export still fails closed: a bad page returns 500 and no document. A late response cannot download.

**P2.** Proof limits, all left visible in the report:

- The world harness does not mount `AccountBesuche`. The visit form bundle imports server Next code. The atlas wording is proven on `AccountWeltKarte` inside the same context the world page provides.
- 200% text is a 32px root font size, not OS zoom, and there is no real-device pass.
- Eleven `npm test` failures are missing local PostgreSQL 16 binaries in this VM. They are outside this diff. They were not replaced with hosted SQL.
- Preview and CI for the implementation head did not exist at authoring time. The existing Vercel preview on #1036 is the seed.

**P3.**

- `WorldExplorer` gained optional `reichweiteText`, `fenster` and `neuLadenHref`. The default heading is unchanged. The false account-total sentence could not be replaced from `AccountWeltKarte` alone, because the heading lives in the explorer. Geography and interactions were not changed. This is the one edit outside the narrowest reading of the owned-file list. It is disclosed here rather than hidden.
- The settings contract test no longer requires `href="/api/account/export"` on the settings page. It requires `KontoDatenexportAktion`, forbids that href on the settings page, and requires the non-atomic sentence. `KontoLoeschen.tsx` is now asserted to keep the secondary href. That is a contract move with the product change, not a deleted honesty check.
- The collection link is also shown when the reader result is complete. The sentence next to it says the view is the whole answer of this query. `/reisen` remains the collection screen. It does not claim the 200-cap was hit.
- Page integrity helpers in `datenexport.ts` are module-private. `check:exports` rejects exported names with no caller. Behaviour is still covered through `kontoDatenexportErzeugen`.

## What was checked against the task

- Schema version, 13 tables, column allowlists, `user_id`, no-store, 1,000-row pages, 20,000-row cap.
- No new sensitive field, no profile mutation, no deletion or Auth change, no route change, no migration, no package or workflow change, no global CSS change.
- No claim that per-table `id` order is one atomic snapshot.
- Booking, traveller and visit writers were not edited.
- TASK V1 was not edited.

## What was not checked

- Hosted Postgres, RLS on a live project, or a real signed-in export.
- Operating-system zoom, a physical phone, or screen reader hardware.
- The full tab sequence of Account home.
- Sibling branches' trees beyond their open draft PR titles and #751's statement that main was still `6ae344f4453b16514f9048083bb8b07396135fa2`.
- Native CI on this head.

## Recommendation

Stop for independent exact-head review. Do not Ready. Do not merge. Do not start a follow-up slice.
