# DiscoverCars V2 widget opt-in 1 — status

**29 October 2026. Source status: VENDOR_EXPORT_MISSING. Housing: fail-closed, not a live widget.**

## Identity

- Writer: Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1
- Model: `grok-4.7-high-fast`
- Session: `bc-1885a130-36a8-4dcf-86bc-48aa6121c24e`
- URL: https://cursor.com/agents/bc-1885a130-36a8-4dcf-86bc-48aa6121c24e
- Branch: `feat/discovercars-v2-official-widget-optin-1`
- Implementation commit: `de8165a3d5c58995c882f24039223563f2e0b9b2`
- Task blob: `f4b0996471eb67b811382c1102f88285944335e5` (unchanged)
- Mode: NORMAL
- Base at dispatch: `origin/main` `e462cf7c5910ce75fa6350928326c04e33d94eee`
- The docs commit that follows this file is the branch tip. The PR comment records that exact head, tree, and ahead/behind. This file does not invent that later SHA.

## Done in the allowlist

- Inert housing mounted from `MietwagenBereich` without the test seam.
- V1 affiliate call left byte-for-byte `<DiscoverCarsAffiliateLinks reiseId={reise.id} stationen={reise.stages.length} />`.
- Manual rental form still rendered.
- Gate refuses missing source, unknown or duplicate attributes, non-allowlisted hosts (including `www.discovercars.com`), private trip fields, and a click treated as consent.
- Local seam, keyboard, trip-switch, and error paths covered by unit tests and Playwright. No DiscoverCars or PrivacyBee request in that run.

## Not done, and not claimed

- No official snippet, hash, or allowed origin.
- No hosted widget, no Preview click-through to DiscoverCars, no portal attribution.
- No consent decision and no PrivacyBee edit.
- Native App/Auth CI and Vercel Preview for the delivery head are not claimed here; they start on push and are reported from that head.
- Draft stays draft. This writer does not Ready, merge, or open a follow-up.

## Next step

Independent Technical Lead review of the exact pushed head. Activation needs a separate export-plus-consent gate. Optional V1 label wrap at 320px / root 200% is a scope decision because it touches `DiscoverCarsAffiliateLinks.tsx`.
