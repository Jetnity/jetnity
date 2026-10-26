# Account Home and Export Completion 1 — Plan

**Lane K · 26 October 2026 · Cursor Generation 1**

Source-confirmed against seed `8a9e5479337090079839629715f9a3f1a03116f9`, parent/merge-base `6ae344f4453b16514f9048083bb8b07396135fa2`, mode `NORMAL`. TASK V1 is not edited.

## What is wrong

- `reisenLaden()` in `lib/trips/daten.ts` returns at most `REISEN_LISTE_GRENZE` (200) trips, newest `updated_at` first. Home and world both use that reader. The overview still says “Deine nächste Reise.” and the map footer says every planned place is complete on Deine Welt. At exactly 200 rows that is neither a proven full account nor a proven truncation. An earlier upcoming trip outside the window cannot be seen.
- `AccountUebersichtLive` stores the device calendar day only in a mount effect. It does not move at local midnight, focus, pageshow, or offset change.
- Trip and visit reads are already separate. A failed read must stay a failure. Recovery must reload the page and must not treat `router.refresh` as confirmation.
- Settings export is `<a href="/api/account/export">`. Failures leave Account as raw JSON. The secondary anchor in `KontoLoeschen.tsx` stays untouched.
- `tabelleSeite` calls `.range()` without `.order()`. Current Supabase JS docs (`using-modifiers-range`, read 26 October 2026) say range respects order and can behave unexpectedly without it. Changelog scan showed no newer JS range/order contract. Each frozen table already exposes `id` in `KONTO_DATENEXPORT_SPALTEN`.

## Shape

- Pure window classification in `lib/account/account-home-export-1/`: fewer than 200 rows is the whole reader result; exactly the cap explains the loaded window and links to `/reisen` (existing keyset collection). No global earliest-next or all-places claim from the cap alone. Zero and archived-only stay distinct for a complete window versus the cap.
- Device calendar hook: local offset via `getTimezoneOffset`, recompute on local midnight, focus, pageshow, visibility, and a device-clock check. No network, no persisted derived date, no UTC or trip-zone assumption.
- Explicit export action: one in-flight GET, no auto-retry, stay on the settings page for 401/500/503/non-JSON/malformed/timeout/cancel. Validate schema version, scope and the 13 table arrays before `download`. Revoke object URLs. Ignore late responses after cancel, unmount or a newer generation. No localStorage, logging or analytics. Success means handed to the browser.
- Export reads: `.eq('user_id', …).order('id', { ascending: true }).range(von, bis)` on the same 13 tables, columns, schema version, session client, no-store and 20,000 cap. Fail the whole export on page errors, oversize pages, invalid ids, duplicates or a repeated page signature. Say in code and in the settings copy that table-by-table order is not one atomic cross-table snapshot.
- `AccountWeltKarte` only gains coverage wording and props. Atlas reachability text is passed into the existing explorer heading. Geography and marker behaviour stay. `WorldExplorer` gains an optional heading string because that heading is the world-page total claim; default text stays for mounts that do not pass it.
- No hosted SQL, migration, Auth/RLS change, export route change, package or workflow change, or sibling edit.

## Proof

Node tests for window copy, calendar arithmetic, export validation and pagination fixtures (0/1000/1001/20000/20001, order arguments, duplicate, nonprogress, invalid id, page error). Mounted Playwright harness with project CSS, synthetic fixtures, external network aborted: midnight and offset, focus after a multi-day jump, cleanup, 320/390/768/1440, 200% root font size, keyboard, export outcomes.

## Integration, 26 October 2026

Root accepted U at main `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84`. This lane merged that commit once, history preserved, and did not edit S, T, A or U files, the lock, or TASK V1. The proof on top of the merge re-runs the mounted R1 cases and adds a blank id, a within-table duplicate id, and a downloaded file with one row in all 13 tables. Details are in the status and handoff.
