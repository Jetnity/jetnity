# Trip Maps JavaScript V1 — bounded implementation

Owner request: 4 November 2026, Europe/Zurich. Sole writer: Codex in the
approved local execution environment. No Cursor dispatch or paid fallback.
Baseline main: `d2f38f785f037f814ee311b3a6bf8075177a8b28`, mode NORMAL.
Branch: `feat/trip-maps-js-v1-20261104`. Draft only; no Ready, merge or release.

## Goal and acceptance

Add an optional Google Maps JavaScript map to the existing Trip Workspace route.
Read stored stage coordinates only. Show all located stops, group nearby markers,
preserve repeated stage identities, and connect selection to the existing route/day
selection. Unlocated stops remain visible as unlocated; never geocode names or
infer an origin coordinate. Provide mobile/keyboard access and explicit empty,
offline, loading, failure and consent states. Preserve Google attribution.
Do not draw a road route without a real route source; route drawing is deferred.

## Boundaries and approach

- Small presentation projection over the existing Trip; no DB/schema/Auth/RLS,
  Official Truth, trip persistence or My World change.
- Separate removable map browsing context so refusal/withdrawal removes provider
  execution. No Google request before explicit consent and verified environment
  configuration. Do not change the shared PrivacyBee release or any held provider.
- Only Maps JavaScript / Dynamic Maps. No Places, Routes, hotels, prices,
  geocoding, Street View or other provider/SKU activation.
- Exact-host configuration and restricted browser key via secure Vercel variables;
  no key in repository, logs or screenshots. Preview is separate from Production.
- No hard stop at 10,000. No claim that loads equal customers. USD100/month is
  the total provider ceiling, not a fresh Maps allowance. Alerts are not caps.
  Keep hosted loading OFF if enforceable safe testing/billing/consent is unresolved.

## Checks and evidence

Focused projection, consent/lifecycle and message-boundary tests; TypeScript,
lint, build and repository hygiene checks; native PR CI. Isolated local desktop
and mobile UI inspection without Production DB or provider traffic where possible.
Real Google rendering requires verified Console/referrer/cost/consent controls;
otherwise mark that gate BLOCKED. No protection bypass, fabricated provider paint
or synthetic offers. Record verified versus reported Google configuration.

## STOP and handoff

Preserve #1086 / #1084 / PrivacyBee / Viator STOPs and all current #751 holds.
Keep the completed bounded change in a Draft PR for independent exact-head review.
No automatic follow-up slice. Report implementation, checks, preview, unresolved
release decisions and costs honestly. No Google upgrade/subscription or key rotation.
