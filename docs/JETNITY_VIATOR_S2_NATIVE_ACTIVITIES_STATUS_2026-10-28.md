# Viator S2 native activities — STATUS

28 October 2026. Draft #1079. Not Ready. Not merged.

## State

The Aktivitäten area can search through the Viator provider only when the sandbox guard is open. Without `VIATOR_SANDBOX_API_KEY` and `VIATOR_SANDBOX_CALLS=true`, or in Production, the provider is absent and the existing search says the activity search is unavailable. No example offers are substituted.

A selected Viator card can open detail, a schedule hint, an age-band check, and the original product link. Changing the day context drops that selection. An unknown place is not mapped to a city. The runtime destination binding list is empty, so a future key still fails closed until a real `/destinations` binding is supplied outside this session.

Live Sandbox HTTP remains BLOCKED. No secret was read. No Vercel login was requested. DiscoverCars and Trip Workspace were not edited.

## Checks

Focused S2 unit tests passed. Browser harness passed at 320, 390, 768, and 1440. Text enlargement set the document root font to 32px; that is not browser zoom. External image requests were aborted. Exact-head CI for this commit starts after push and is not yet a result.
