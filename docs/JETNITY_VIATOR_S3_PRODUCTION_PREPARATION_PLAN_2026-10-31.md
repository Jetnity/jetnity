# Viator S3 production preparation — PLAN

31 October 2026, Europe/Zurich. Accepted pre-code plan: pull request comment 6547394628. That plan is implementation guidance, not a source or release pass.

The task seed `950b90ee710335edc7db5bf80fbc6af5d593f06c` was fast-forwarded onto Draft #1079. The task file stays immutable. Shared transport, provider-ops, TripWorkspace, commercial adoption writers, CMP #1096, and the widget host stay unread as sources of edits.

Implementation shape:

- A typed Production resolver, `viatorProductionAusUmgebung`, stays closed. `VIATOR_PRODUCTION_QUELLE_OFFEN` is false. No environment value is read, including `VIATOR_PRODUCTION_API_KEY`.
- Injected tests alone may construct `createViatorProductionTestClient`. It selects only `https://api.viator.com`, requires a separate credential and a per-attempt guard, and puts that guard on both body-budget executors through the existing preflight hook.
- Sandbox calls stay on `https://api.sandbox.viator.com`. A caller-supplied origin is ignored.
- Search, detail, schedule, and check re-check the activity gate before HTTP and before the destinations cache.
- A product destination label is the unambiguous catalog city, town, or island for the provider primary id. A country id stays unlabeled. Coordinates and meeting points stay empty.
- The original product URL is shown from the search response as a sponsored referral. Adoption receives an option object without that URL. `booking_url` remains the adoption writer's null.

The persistent cost-guard tables, reservation function, capability role, and migration `20260901020000` are absent in both the Production and Dev catalogs Root queried. This delivery does not create that runtime.
