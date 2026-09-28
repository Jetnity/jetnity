# Admin user created timestamp honesty 1 — evidence notes

Captured: 28 September 2026

Writer: **Jetnity admin user created timestamp honesty 1**, Generation 1.
Session: https://cursor.com/agents/bc-decff300-3d45-499e-9b41-8c26cc8116ce
`originalModelName=grok-4.7-high-fast` from cursor-cloud `run-info`. Dispatch required Grok 4.7 High Fast. Not Auto. Session UI rename was not available.

This folder renders the repository `UsersTable` with synthetic rows. It is not a signed-in Admin session, not a physical device, and not Production acceptance.

## Live reconstruction

Operating mode is `NORMAL`. Special Product-Owner gates remain.

`origin/main` at implementation was `135558c485baf7de844056d81190824eed3ad84e`. This branch was 0 behind that main. The only commit already on the branch was the task seed.

Open product writers: Draft #616 (this slice) and Draft #614 (`fix/admin-security-filter-honesty-1`). #614 owns `SecurityWidget`, `lib/admin/ehrliche-zustaende.ts`, and `lib/admin/security/filter-ehrlichkeit.ts`. This slice does not edit those files. Historical Drafts #52, #50, #40, #39 and #28 stayed open and were not resumed.

PR #610 is merged. Technical-Lead FINAL PASS review `5345097798` is on exact head `25d8d8e6f004ad1cbbb2ea39e949102514e3d8e5`. This slice implements the precheck's C3 only.

`public.profiles.created_at` remains `timestamp with time zone` with a default and without `NOT NULL` (`supabase/migrations/20260815060111_baseline.sql`, originally `creator_profiles`). Generated `types/supabase.ts` types it as `string | null`. No migration was added.

## What is real

- The bundled component is the repository `UsersTable`.
- Rows use `example.test` addresses and ids `synthetic-*` only. No profile was read or written.
- Next `useRouter` / `useSearchParams`, `next/link`, and the role/status actions are boundary stubs. The stubs were not called.
- The server page is not executed. Its mapper is `profilErstellt`, covered by `lib/admin/profil-erstellt.test.ts` and by the fixed-mode source check in the verify script.
- The browser was system Chrome at `/usr/local/bin/google-chrome` because this environment had no Playwright browser cache. `TZ=Europe/Zurich`. The component still uses `de-CH` with the runtime timezone and does not pin `timeZone`.

## Baseline

`node scripts/admin-user-created-timestamp-honesty-1-verify.mjs --baseline` ran before the mapper change, while `page.tsx` still contained `created_at: r?.created_at ?? new Date().toISOString()`.

The harness passed that expression's result into the then-current table. `before.json` records:

- invented value `2026-09-28T22:31:22.492Z`;
- Erstellt cell `29.09.2026, 00:31`, equal to formatting that instant and equal to `formattedNow`;
- a real timestamp `2024-06-15T14:30:00.000Z` rendered `15.06.2024, 16:30`;
- `last_seen_at` null rendered `—`, and a real last-seen rendered `01.07.2024, 10:00`.

`new Date(null)` formats as `01.01.1970, 01:00` in this timezone. Passing null into the old cell would still have been a false creation time. The display change is required together with the mapper.

## Fixed head

`node --import tsx scripts/admin-user-created-timestamp-honesty-1-verify.mjs` on the fixed component (`after.json`):

- `profilErstellt(null)` and `profilErstellt(undefined)` are `null`;
- `profilErstellt('2024-06-15T14:30:00.000Z')` returns that string;
- the unknown row's Erstellt cell is `—`, not the epoch text and not the page clock;
- the known row's Erstellt cell is `15.06.2024, 16:30`;
- last activity stays formatted when present and `—` when null;
- search field stayed empty, page label stayed `1 / 1`, `router.replace` stayed empty, and role/status stubs stayed uncalled;
- page errors were empty.

Screenshots: `before-desktop.png`, `after-desktop.png`.

## Limitations

- No signed-in `/admin/users` request, so `requireAdminPage`, the Supabase read, and empty-versus-error on a live query were not exercised. The page diff does not touch that error branch.
- The #608 rendered search harness was not re-run. Its script launches Playwright's own Chromium, which is not installed here. `lib/admin/users-search-navigation.test.ts` passed inside the full suite. The `UsersTable` diff is the `created_at` type and the Erstellt cell only.
- An empty string stays an empty string in the mapper (`??`) and the cell treats it as unknown because the same truthiness check as `last_seen_at` is used. A non-empty unparseable string can still throw in `Intl.DateTimeFormat.format`. That was already true for any non-null garbage value.
- de-CH formatting follows the browser timezone. This run used `Europe/Zurich`.
