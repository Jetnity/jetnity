# Jetnity – PrivacyBee CMP and widget consent S2 — SELF REVIEW

**Stand:** 31 October 2026. Author review only. Not Ready and not a Technical Lead PASS.

## Holds

- Same session `bc-dc782027-b7e1-4592-a7ae-b4f709161135`, model `grok-4.7-high-fast`, stored name Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
- Work is on `feat/privacybee-cmp-widget-consent-s2` / #1096. #1089 was not pushed.
- The task blob was not edited.
- R1 wires the kill switch into the emitted bootstrap, connects snapshot changes to frame removal, and keeps the positive policy in the harness.
- Informative grant behavior from S1 is unchanged: purposes stay `not_decided`.
- Legal runtime files were not edited. The integration test allowlist adds only `lib/privacy/privacybee-cmp/vertrag.ts` and still rejects banner URLs under `app/` and `components/legal/`.
- No `acceptAll`, `setAllConsents`, cookie write, or localStorage ledger.
- Widget host, providers, `/privacy`, package, and env were not touched.

## Would not defend

- The positive browser proof intercepts the official banner URL. It is not a vendor runtime PASS.
- Preferences are shown in the synthetic host when the prop is `ready`. Production does not mount that prop, so Preview has no dead preferences button.
- I did not run a full `npm test` of the repository. Focused CMP, legal, and widget-consent tests passed, and the production build's TypeScript pass covered the app.
