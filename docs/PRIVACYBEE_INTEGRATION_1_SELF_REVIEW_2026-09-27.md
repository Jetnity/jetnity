# PrivacyBee integration 1 — Self-review

Date: 2026-09-27
Writer: **Jetnity PrivacyBee integration 1**, Generation **1**
Session: `bc-a147647d-4bb1-4136-a0a2-045e201f5c6a`
Model: `grok-4.7-high-fast`
This note is the author's check. It is not an independent Technical-Lead PASS.

## Scope check

| Requirement | Author finding |
| --- | --- |
| Official snippets only on exact host `jetnity.com` | Request host and browser host both required. Unit tests cover localhost, Preview, `www`, suffixes and the kill switch. Playwright on `127.0.0.1` saw no vendor request. |
| Reviewed activation, missing env stays on | `PRIVACYBEE_GEPRUEFTE_AKTIVIERUNG === true`. Only trimmed `aus` disables. |
| No copied policy, no banner, no `/terms` page | Source scan allows `app.privacybee.io` only in `lib/legal/privacybee-vertrag.ts`. The embed component is imported only by the two pages. `/terms` 404 confirmed locally. |
| Readiness is not `onload` | Signals taken from the official `widget.js` and `imprint-widget.js` light DOM. Timeout 12s. |
| No duplicate custom-element registration | `skriptEinfuegen` refuses a second insert when the tag is defined or the script node exists. |
| Footer links, existing focus/touch classes | Inventory test updated only for these two links. Navbar still has none. |
| #578 files untouched | Those files are not on this branch. They were read at `7cf597d`. The newer task replaces the default-off publication flag. ADR-0213 records that. |
| No DB, auth, secrets, DNS, indexing, billing | No such diffs. |

## What I would still question

1. The privacy widget writes two CSS variables onto `documentElement`. Cleanup on leave is in our effect. A hard navigation does not need it; client navigation back to the homepage does. I did not visually confirm the homepage colors after a client return beyond the local fallback pages, because the vendor script never loaded on localhost.
2. Dynamic script insertion sets `defer` on the privacy script to mirror the official tag, and `async = false` because a script inserted from JavaScript ignores `defer`. The duplicate-define guard is the real remount protection.
3. Classifying a 240-character body without a heading as ready is a fallback for a vendor build that omits `h1`. It is not a copy of the policy. If that heuristic is too wide, the Technical Lead can tighten it without a product change.
4. `npm run lint` passed locally. CI lint is still the independent gate.

## Traveller context

Not applicable. The pages do not read citizenship, documents, residence or trip payloads, and they do not send them to PrivacyBee.

## Stop

No Ready. No merge. No follow-up slice.
