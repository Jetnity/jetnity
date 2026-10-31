# Jetnity – PrivacyBee CMP and widget consent S2 — disclosure contract

**Status:** factual contract for later provider writers. Not legal text. Not published on `/privacy`. Not an allowlist and not a compliance claim.

## What a later provider surface must say

- Provider identity and the provider's own privacy link.
- What the widget does, in product language, without inventing prices or availability.
- Observed external origins below, kept separate from unknowns.
- Whether the bundle can be separated. Today `purposeSeparationVerified` is false for DiscoverCars and 12Go.
- The categories a reviewed policy requires. This S2 production policy is unreviewed, so it does not name a live required set.
- When loading would begin: only after a later package turns the CMP release on, the host is exactly `jetnity.com`, the visitor has a current provider intent, and the production execution gate is separately true. None of that is true in this slice.
- Withdrawal stops a future Jetnity embed and blocks new initialization. It does not promise to erase third-party cookies or close a tab the visitor opened.
- The existing V1 link-out remains usable when the embed is absent.
- Jetnity does not automatically transfer private trip or account data for this CMP adapter.

## Observed hosts, not an approved allowlist

DiscoverCars, from the earlier isolated observation, not re-run here:

- `www.discovercars.com`
- `widget.discovercars.com`
- `www.googletagmanager.com`
- `fonts.gstatic.com`

12Go, from the earlier isolated observation, not re-run here:

- `12go.asia`
- `cdn0.trainbusferry.com`
- `ajax.googleapis.com`
- `agent.12go.asia`

Unknown optional tracking stays unknown. Vendor-generated privacy text is not claimed to cover these providers.

## CMP categories

The adapter understands only `SECURITY_STORAGE`, `FUNCTIONALITY_STORAGE`, `ANALYTICS_STORAGE`, `AD_STORAGE`, `AD_USER_DATA`, `AD_PERSONALIZATION`, and `PERSONALIZATION_STORAGE`. The two necessary categories cannot authorize a widget. An informative Zustimmen does not grant any purpose and does not execute a provider.

## Production seam, not a published widget

`lib/privacy/privacybee-cmp/produktion.ts` exposes `requestProductionExecution(providerId, scopeKey)`, `checkProductionExecution(capability)`, `consumeProductionGrant(capability)`, and `releaseProductionExecution(capability)`. Those four calls read the bootstrap's baked release and kill booleans and fail closed when the gate is missing or denied. The module does not export a factory that accepts a caller policy, API, host, or kill value. The shipped table in `produktionspolitik.ts` has null rows for DiscoverCars and 12Go. `CMP_RELEASE_AUTHORIZED` is false. A future record has to match its provider and the fixed origin, path, artifact, policy id, commit, revisions, and sandbox tokens. Those pins are not filled in. Parent origin, child origin, embed paths, and the two artifact hashes are known literals only. They are not a reviewed policy.
