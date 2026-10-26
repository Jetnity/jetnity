# GetYourGuide Manual Widget Integration 1 — STATUS

Date: 26 October 2026.
Writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.
This status is not a Root PASS, not Ready, and not a merge.

## State

The manual search widget is implemented on `feat/getyourguide-manual-widget-integration-1`, Draft PR #1041, tracking #1040, parent #1023 V5. The application loads the official activities widget only after an explicit visitor action. The query is the confirmed public place name plus the catalog country label, or the country label alone for a country without days. The document is `/embed/getyourguide`. Direct opens stay inactive.

The delivering review head is the branch tip that contains this file. Its exact SHA is recorded in the PR body after the last commit of this delivery. `origin/main` read on 26 October 2026 is `7d52da97efc1f40fbea5c07d978c2e81e6b76659`, tree `608321f4a8813adf1de23c3132039d39f9c27e98`. Merge-base with that main is the same commit. The branch was 1 ahead / 0 behind before these implementation commits.

## What is shown

Public Lisbon, Crete and Portugal loads showed provider images and named offers inside the isolated frame. Before the load action the proof recorded zero GetYourGuide requests. Removal, a switch to Crete, and a switch back to Lisbon did not revive the old frame. The native synthetic card stayed. A parent canary in the URL, title, DOM and storage did not appear in the embed URL, the embed HTML, or captured provider URLs. With `credentialless`, the framed embed request did not carry that cookie.

## What is not shown on the final proof run

The offer click reaches `https://www.getyourguide.com/s/?et=935537&...&partner_id=2MQHT6Z&cmp=jetnity_activities`. An earlier run in this session rendered the tour “From Lisbon: Arrábida and Sesimbra Full-Day Tour” (€95, 10 hours, Check availability) at that URL. Later loads of that URL, including the final proof, rendered GetYourGuide’s outage page (“An error occurred. We’ll be right back.”) with Ray IDs `a50cf48ddecf22ce`, `a50cf514af095a3a` and `a50cf72beadbcf74`. The final `produkt-aktion.png` is that outage, not the tour. The proof script exits 1 for that reason. No purchase was made.

## Boundaries

No database, RLS, Auth, Places, native activity search, secret, contract, payment, or new infrastructure. `ACTIVE_WORK_STATUS.md` was not edited because it is outside the task allowlist. The historical harness `scripts/getyourguide-visual-discovery-1/` still expects the closed foundation and is not this slice’s proof.
