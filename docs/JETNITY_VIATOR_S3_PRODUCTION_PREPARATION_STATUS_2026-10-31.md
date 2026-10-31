# Viator S3 production preparation — STATUS

31 October 2026, Europe/Zurich. Draft #1079. Not Ready. Not merged.

## State

Source preparation for a separate Viator Production binding is on this branch. The process resolver returns `source_closed` and does not build transport. Sandbox Preview flags stay off. Public Production stays off. No provider call was made.

Search cards can show an unambiguous Angebotsziel from the destinations catalog and the provider's original product URL. The link is labelled as a sponsored referral without a commission claim. Trip adoption does not receive the URL. A canonical country still does not become a city. Two different `primary: true` destination ids stay unlabeled and partial. The same id repeated stays one primary.

A mutable injected environment still stops the next attempt when a flag changes inside the first response. The process binding is separate: with no injected environment, every attempt reads the current process values again, so the same flag change also stops products/search and the later availability calls. After the awaited guard returns, the provider checks activation once more before its own HTTP call. A guard that clears activation and then allows the attempt does not send HTTP. A throwing activation callback becomes a redacted failure.

## Runtime still closed

Root queried catalog metadata for the existing Production project and the existing Dev project. In both, `jetnity_internal` exists and the three S6-A cost-guard tables, the reservation function, the capability role, and migration `20260901020000` are absent. That is a current fact. The persistent adapter remains a separate Product-Owner gate. This change does not apply SQL, grant `service_role`, or allocate a principal. Project identifiers are omitted here because the commit scanner treats them as secrets.

`VIATOR_PRODUCTION_API_KEY` is the unread Production credential name. It is not the Sandbox key.

## Checks

`s3.test.ts` passed: closed resolver, production origin, guard denial with zero HTTP, warm-client shutdown, direct detail/schedule/check routes, and referral binding. `s2.test.ts`, `sandbox.test.ts`, client-answer tests, and the browser harness passed, including the referral card at 320, 390, 768, and 1440. `npx tsc -p tsconfig.json --noEmit` and `npx eslint . --quiet` passed. Export check reported 0 unused exports.

R5 CI 41219129998 and OFF `dpl_GSd1MPqje2P2jTL1QXHdysWGEFBJ` cover `4d9da481` only.
