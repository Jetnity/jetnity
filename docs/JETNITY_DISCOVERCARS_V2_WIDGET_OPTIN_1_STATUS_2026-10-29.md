# DiscoverCars V2 widget opt-in 1 — status

**29 October 2026. Source status: VENDOR_EXPORT_MISSING. Housing: fail-closed general search, not a Bangkok widget and not a live widget.**

## Owner correction

Same session, 29 October 2026. The Product Owner asked why Bangkok appeared to be the widget. Answer in this slice: the V2 housing sets no pickup. BKK remains only the explicit V1 radio and the old Work sample. A general account export with visitor-chosen pickup is **not verified**. An empty-pickup attribute is **not claimed**. The BKK `data-location` path is refused. The immutable task file was not rewritten.

## Identity

- Writer: Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1
- Model: `grok-4.7-high-fast`
- Session: `bc-1885a130-36a8-4dcf-86bc-48aa6121c24e`
- URL: https://cursor.com/agents/bc-1885a130-36a8-4dcf-86bc-48aa6121c24e
- Branch: `feat/discovercars-v2-official-widget-optin-1`
- Implementation commit: `de8165a3d5c58995c882f24039223563f2e0b9b2`
- Docs commit: `8a9bf98df39137264d6069a3aafe8a96f276492f`
- Task blob: `f4b0996471eb67b811382c1102f88285944335e5` (unchanged)
- Mode: NORMAL
- Base at dispatch: `origin/main` `e462cf7c5910ce75fa6350928326c04e33d94eee`
- This recording commit is the branch tip only until the PR comment on #1084 names a later exact head. Read `git rev-parse HEAD` after fetch.

## Done in the allowlist

- Inert housing mounted from `MietwagenBereich` without the test seam.
- V1 affiliate call left byte-for-byte `<DiscoverCarsAffiliateLinks reiseId={reise.id} stationen={reise.stages.length} />`.
- Manual rental form still rendered.
- Gate refuses missing source, unknown or duplicate attributes, non-allowlisted hosts (including `www.discovercars.com`), private trip fields, and a click treated as consent.
- Local seam, keyboard, trip-switch, and error paths covered by unit tests and Playwright. No DiscoverCars or PrivacyBee request in that run.

## Not done, and not claimed

- No general widget snippet, no BKK sample file, no hash, and no allowed origin.
- No proof that the generator can emit an unselected pickup. That option is not implemented.
- No hosted widget, no Preview click-through to DiscoverCars, no portal attribution.
- No consent decision and no PrivacyBee edit.
- Native App/Auth CI and Vercel Preview for the delivery head are not claimed here; they start on push and are reported from that head.
- Draft stays draft. This writer does not Ready, merge, or open a follow-up.

## Next step

Independent Technical Lead review of the exact pushed head. Activation needs a separate export-plus-consent gate. Optional V1 label wrap at 320px / root 200% is a scope decision because it touches `DiscoverCarsAffiliateLinks.tsx`.
