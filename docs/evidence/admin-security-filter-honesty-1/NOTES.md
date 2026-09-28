# Admin Security Filter Honesty 1 — evidence notes

Captured: 28 September 2026

Writer: **Jetnity admin security filter honesty 1**, Generation 1.
Session: https://cursor.com/agents/bc-b601c6b4-d65d-42f4-bfd0-d3c53c21f37f
`originalModelName=grok-4.7-high-fast` from cursor-cloud `run-info`. Dispatch required Grok 4.7 High Fast. Not Auto. Session UI rename was not available.

This folder is the actual-component harness for `components/admin/security/SecurityWidget.tsx`. It is not a signed-in Admin session, not a physical device, and not Production acceptance.

## Live reconstruction

Operating mode is `NORMAL`. Special Product-Owner gates remain.

Task baseline was `main@bed4847d7ad0d601b756e3d56011b8525f7aaa5b` (merge #610).

While this slice was open, `origin/main` advanced to `135558c485baf7de844056d81190824eed3ad84e` by merging PR #612. That merge only changes the Admin transaction read-filter paths:

- `components/admin/payments/PaymentsCenter.tsx`
- `lib/admin/payments/transaction-read-filter.ts`
- `lib/admin/payments/transaction-read-filter.test.ts`
- the #612 task, status, handoff, self-review, evidence and verify script

No shared path with this slice. This writer did not edit those files. The branch is updated onto that main so the head is not behind it. The three-dot diff against that main stays this slice.

Open product writers at reconstruction: this Draft #614 and, until the merge above, Draft #612. Historical Drafts #52, #50, #40, #39 and #28 stayed open and were not resumed.

## What is real

- The bundled component is the repository `SecurityWidget`.
- Rows use documentation addresses `203.0.113.0/24` and ids `synthetic-event-*` only. No security event was read or inserted. No block or unblock request was sent.
- `fetch` for `/api/admin/security/list` is a fixture. Auth, AAL and `requireAdminApi` are not exercised here. The widget source still calls that same list route and contains no `insert`.

## Baseline defect

`node scripts/admin-security-filter-honesty-1-verify.mjs --baseline` on the unfixed widget:

- one synthetic event was visible (`203.0.113.1`, KPI `Aufgezeichnete Events (24h)` = 1);
- filter `zz-kein-treffer` removed the row;
- the table said `Keine aufgezeichneten Events in diesem Zeitraum.`;
- the 24h KPI stayed 1;
- `before.json` records `defectReproduced: true`.

On the fixed head that probe is expected to fail, because the period sentence is no longer used for a filter miss.

## Fixed head

`node scripts/admin-security-filter-honesty-1-verify.mjs` passed these controlled cases (`after.json`):

- empty payload keeps the period sentence and does not show the 200-row sentence;
- unmatched filter says `Keine aufgezeichneten Events passen zu diesem Filter.` and clearing the field restores the row;
- a matching filter shows the row and neither empty sentence;
- 199 rows do not show the bound sentence;
- 200 rows show it, including when that payload is then filtered to no match;
- a failed read stays `Diese Ansicht konnte nicht geladen werden.` / `Nicht ermittelbar.` with KPI `—`, not an empty period;
- coverage copy and `nicht enforced` stay visible;
- KPI labels stay `Aufgezeichnete ...`;
- an unmatched filter does not change the 24h counts;
- no unexpected write URL was called.

Screenshots from that run are cloud-agent artifacts, not repository files. This folder keeps the JSON.

## Checks on this implementation

- focused filter, coverage, taxonomy and `ehrliche-zustaende` tests: pass;
- `npm test`: 4029 pass, 0 fail;
- `npm run typecheck`: pass;
- `npm run lint`: 0 errors, 145 warnings, all outside this slice's new logic (the widget's existing effect/`any`/`Date.now` warnings remain);
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: pass;
- `npm run build`: pass after `check:setup` (warning: no `.env` / `.env.local` in this workspace).

`npm ci` was not re-run. The existing install was used.

## Limitations

- A result of exactly 200 rows means the current list cap was reached. The route does not return a total, so the UI says the read can be incomplete. It does not claim a 201st row was observed.
- The blocklist uses the same route cap and still has no bound sentence. Acceptance named the events result. This slice does not add a second notice.
- The search field filters the events table only. The placeholder still says `Suche in Events/IPs…`. The blocklist is not filtered. That behaviour was already there and is not changed here.
- The events counter remains the filtered count (`0 Einträge` on a miss). The sentence next to it says why. The existing coverage source contract still requires that counter form.
- 24h tiles still count only rows inside the returned payload. At 200 rows the bound sentence says those tiles count only those rows and can be incomplete. Below 200, no truncation sentence is shown.

## Adjacent, not started

The blocklist cap and the search placeholder are the same honesty family, but they are not this acceptance set. No follow-up slice is opened from here.

## Self-review

- Empty payload, filter miss, matched filter, 199, 200, failed read and KPI/coverage/IP copy are separated in the rendered widget.
- No list-route, producer, SQL, Auth, RLS, block/unblock, package, workflow or global-continuity edit.
- No payments path edit. #612's merged files are present only because main moved.
- Cursor does not Ready, merge, or start another slice.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + INTERACTION REVIEW.**
