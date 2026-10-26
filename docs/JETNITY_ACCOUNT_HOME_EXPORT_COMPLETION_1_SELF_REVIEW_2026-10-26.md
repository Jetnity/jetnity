# Account Home and Export Completion 1 — Self-review

**Lane K · 26 October 2026 · Cursor Generation 1**

This is the author's review. It is not a Technical-Lead PASS.

## Findings

**P0.** None found in this lane.

**P1.** None found that block the bounded acceptance. The export still fails closed: a bad page returns 500 and no document. A late response cannot download.

**P2.** Proof limits, all left visible in the report:

- The world harness does not mount `AccountBesuche`. The visit form bundle imports server Next code. The atlas wording is proven on `AccountWeltKarte` inside the same context the world page provides.
- 200% text is a 32px root font size, not OS zoom, and there is no real-device pass.
- Eleven `npm test` failures on the integrated tree are missing local PostgreSQL 16 binaries in this VM (`ENOENT` on `initdb`, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED`). Counts: 7308 pass, 5 skipped, 11 fail, of 7324. They were not replaced with hosted SQL.
- Preview and CI for the integrated head were not read back at authoring time. They stay pending. The older Vercel preview on #1036 is not this head.

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

## R1

The first delivery edited `WorldExplorer.tsx` before asking. That was outside the original allowlist. Root reviewed that coverage change and granted only coverage, empty-state and recovery presentation there. R1.1 uses that grant. No marker, search or geography work was added.

R1.1 through R1.3 were addressed on `c020b7cb81616d469d8021cb33395afe653ef659` and are now inside merge `db09b714d4fe57459e37b672fef603853b66d0d4` of accepted main `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84`. The mounted audit was run again on that integrated source and CSS.

P2 that remain: no real device, 200% text is a 32px root font, the world harness still mounts `AccountWeltKarte` inside the frame rather than `AccountBesuche`, the 11 PostgreSQL failures are the missing local `initdb`, and CI/Preview of this head are pending. `weltMusterId` is still an unused import in `AccountWeltKarte.tsx`; it was already unused on baseline `6ae344f4453b16514f9048083bb8b07396135fa2` and was not removed here. P0 and P1: none found in this integration.

## Recommendation

Stop for independent exact-head review of the new head. Do not Ready. Do not merge. Do not start a follow-up slice.
