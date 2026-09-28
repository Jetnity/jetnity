# Admin Security Blocklist Bound Honesty 1 — evidence notes

Captured: 29 September 2026

Writer: **Jetnity admin security blocklist bound honesty 1**, Generation 1.
Session: https://cursor.com/agents/bc-a178dab6-68c6-4037-bf0a-00d22b971ec4
`originalModelName=grok-4.7-high-fast` from cursor-cloud `run-info`. Dispatch required Grok 4.7 High Fast. Not Auto. The session title is `Admin security blocklist bound honesty`. No programmable rename was used, so the UI title is not claimed to be the exact logical name.

This folder is the actual-component harness for `components/admin/security/SecurityWidget.tsx`. It is not a signed-in Admin session, not a physical device, and not Production acceptance.

## Live reconstruction

Operating mode is `NORMAL`. Special Product-Owner gates remain.

`origin/main` at reconstruction and again before STOP is `b633e5f299389faf7e7de375470aaa309e8ef674` (merge #614). This branch is based on that commit. The task commit `176d08a3` is the previous tip.

Open product writers: this Draft #618 and Draft #616 (`fix/admin-user-created-timestamp-honesty-1` at `fd73e7e631f8d07e3bc4ce60427f3879f036648b`). #616 changes Admin Users created-at files only. None of those paths are in this diff. Historical Drafts #52, #50, #40, #39 and #28 stayed open and were not resumed. PR #614 is merged and is the event-bound baseline, not an active writer.

## What is real

- The bundled component is the repository `SecurityWidget`.
- Rows use documentation addresses `203.0.113.1`–`203.0.113.200` and ids `synthetic-event-*` / reasons `synthetic-block-*` only. No security event or blocklist row was read from or written to a database.
- `fetch` for `/api/admin/security/list` is a fixture. Every other URL, including block and unblock, is recorded and rejected. The green run and the baseline run each made one GET to the list route and no POST.
- Auth, AAL and `requireAdminApi` are not exercised here. The widget source still calls the same list, block and unblock routes.

## Baseline defect

`node scripts/admin-security-blocklist-bound-honesty-1-verify.mjs --baseline` on the unfixed widget (`before.json`):

- 200 synthetic blocklist rows rendered;
- the header said `200 Einträge` and the tile `Gesperrte IPs` said `200`;
- no blocklist bound sentence and no `data-security-read-bound="blocklist"`;
- the event table had 0 rows and no event bound sentence;
- `Blockliste (nicht enforced)` stayed visible;
- one GET list call, no POST;
- `defectReproduced: true`.

On the fixed head that probe is expected to fail, because a 200-row blocklist now shows the bound sentence.

## Fixed head

`node scripts/admin-security-blocklist-bound-honesty-1-verify.mjs` passed (`after.json`):

- 0 blocklist rows keep `Keine Einträge.` and `0 Einträge`, with no bound sentence;
- 199 blocklist rows keep `199 Einträge` and show no bound sentence;
- 200 blocklist rows keep `200 Einträge` and show the blocklist sentence, including on a 390px-wide viewport;
- 200 events with an empty blocklist still show only the #614 event sentence;
- 200 events with 199 blocklist rows show only the event sentence;
- 200 events and 200 blocklist rows show both sentences, each on its own section;
- filtering events to no match still uses the filter sentence, leaves the 200-row blocklist notice in place, and does not show the event bound sentence for a one-row event payload;
- a failed read stays unavailable, with `—` and neither bound sentence;
- coverage copy, `nicht enforced`, and `In Blockliste schreiben` stay visible;
- no POST occurred.

`node scripts/admin-security-filter-honesty-1-verify.mjs` was re-run on this head and passed the existing #614 cases.

Screenshots from these runs are cloud-agent artifacts, not repository files. This folder keeps the JSON.

## Checks on this implementation

- focused `lib/admin/security/filter-ehrlichkeit.test.ts`: 5 pass;
- #614 actual-widget harness: pass;
- this actual-widget harness: pass;
- `npm test`: 4037 pass, 0 fail;
- `npm run typecheck`: pass;
- `npm run lint`: 0 errors, 144 warnings; the widget's existing effect, `any` and `Date.now` warnings remain; this slice adds none;
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: pass;
- `npm run build`: pass after `check:setup` (warning: no `.env` / `.env.local` in this workspace).

`npm ci` was not re-run. The existing install was used. `db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run: this slice does not change SQL, RLS or Auth.

## Limitations

- A result of exactly 200 rows means the current list cap was reached. The route does not return a total, so the UI says the read can be incomplete. It does not claim a 201st row was observed.
- The visible count stays the returned-row count in both the blocklist header and the `Gesperrte IPs` tile. The sentence says those two count only the rows that were read.
- The search field still filters the events table only. The placeholder still says `Suche in Events/IPs…`. The blocklist is not filtered. That behaviour was already there and is not changed here.
- Block and unblock buttons and request bodies are unchanged. The harness does not click them.
- This is not a signed-in Admin session and not a physical device.

## Adjacent, not started

The search placeholder still names IPs while the blocklist is not filtered. That is the same honesty family and is outside this acceptance set. No follow-up slice is opened from here.

## Self-review

- 0, 199 and 200 blocklist rows are separated on the rendered widget. The event bound stays keyed to events.
- No list-route, block/unblock route, producer, SQL, Auth, RLS, users, payments, package, workflow or global-continuity edit.
- `lib/admin/security/filter-ehrlichkeit.ts` is unchanged. The existing helper is called a second time with `data.blocklist.length`.
- Cursor does not Ready, merge, or start another slice.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + INTERACTION REVIEW.**
