# Viator S3 production preparation — HANDOFF

31 October 2026, Europe/Zurich. Same writer: Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1. bcId `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`. Model `grok-4.7-high-fast`.

## What is wired

`activityProviderAus` calls `viatorProductionAusUmgebung` and then the existing Sandbox provider. The Production result is `source_closed`. `createViatorProductionTestClient` is not referenced by the factory, the binder, or the routes.

Sandbox requests still use `VIATOR_SANDBOX_ORIGIN`. A field named `origin` on the input does not change the host. The injected Production client uses `VIATOR_PRODUCTION_API_ORIGIN` and the same 12-second timeout, one attempt, 2,097,152-byte destinations budget, and 1,048,576-byte budget for the other four operations. Its preflight runs before every attempt on both executors. A throw, a malformed result, or a rate-limit result makes no HTTP call.

`clientFuer` checks `activityZustand` before Sandbox access and before the destinations cache. Injected tests keep a mutable environment object. The factory and the routes pass no object, and each attempt calls `umgebungAusProzess()` again. The provider HTTP wrapper runs after the awaited guard and repeats that check for both body budgets. A thrown activation callback is replaced with a fixed failure and is not copied into the result. Detail, schedule, and check routes use that path.

Search options keep `punkt` null. `locationName` is set only for one catalog CITY, TOWN, or ISLAND matching the primary destination id. The card says Angebotsziel and states that the meeting point is not given. `viatorVerweise` carries the validated product URL. `activityOptionFuerUebernahme` omits it. `activityInReiseUebernehmen` still writes `booking_url: null` and was not edited.

## Attribution

Account reply 6468170303 records P00328015 Full Access Affiliate and that no extra certification was required. It does not establish image, content, or full-information rights. `contentLicenseReviewed` stays false. A safe `www.viator.com` host is not partner-attribution proof. No live returned link was checked in this task.

## Blocked runtime

No persistent reservation port is deployed. The handoff must not treat an injected test guard as a global quota. Production credential binding, a verified reservation principal, positive-city evidence, and a TL rollout remain outside this source change. The consumed R5 one-shot and the older Zürich packet are not execution instructions.

## Next step

Independent Technical Lead review of the S3 head. Do not Ready, merge, or call Viator from this handoff.
