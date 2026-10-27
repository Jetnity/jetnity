# 12Go Mobility Affiliate Linkout V1 — SELF REVIEW

Author review only. This is not a Technical-Lead PASS.

## What holds

- Partner ID and `sub_id` are public constants. No new env var, secret, or API client.
- The URL builder rejects absolute URLs, other hosts, `javascript:`, extra queries, and name-built slugs.
- Production route table is empty and frozen. Tests assert a Bangkok/Koh Chang trip with real Bangkok `geonames:1609350` still gets the generic search.
- A synthetic registry proves one direction only. Reverse, duplicate rows, country/airport kind, and a path that already contains `date=` fall back to generic.
- Markup tests: two anchors, `rel="noopener noreferrer sponsored"`, `target="_blank"`, no iframe/script/img, no trip ref in the href.
- Parent render keeps “Verbindungen prüfen” and places the new block between Bestand and Suche.
- Geometry proof used system Chrome because Playwright’s headless shell was not installed. The script is outside `npm test`, so that missing shell does not fail GitHub CI. The harness sets `box-sizing: border-box` and `min-h-11 { min-height: 2.75rem }` to mirror Tailwind. It is not the compiled production CSS bundle.
- No request to `12go.asia` was made. That also means this session did not observe the live landing, currency, or passenger form.

## Limits I am not papering over

- No production deep link, by decision. The task’s “if the Bangkok–Koh Chang link is verified” branch is implemented and tested, and not wired to the UI.
- Stage kind is unknown on `TripStage`. Even a future place-ID row would not match until kind is `city` or `island` on the endpoint. `twelveGoKantenFuerReise` only infers `airport:*`.
- Local full-suite `npm test` was not run. Native CI on this head is the suite gate.
- The 320px root-32px target grew to about 370px because the sentence wraps at a 32px root. It does not overflow horizontally. It is tall.
- Attribution, commission, and the manual 12Go date picker remain unknown, as in the task.

## Security

Outbound host is fixed. Query keys are exactly `z` and `sub_id`. Trip id, client ref, title, currency, and traveller count are not query parameters. The component does not load a third-party resource. Native mobility search was not enabled.
