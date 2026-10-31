# Jetnity – PrivacyBee CMP and widget consent S2 — PLAN

**Stand:** 31 October 2026. Accepted implementation plan from the #1096 pre-code comment. Not a release PASS.

**Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Session:** bc-dc782027-b7e1-4592-a7ae-b4f709161135. **Model:** grok-4.7-high-fast.
**Branch:** feat/privacybee-cmp-widget-consent-s2. **PR:** #1096. **Seed:** c648f7352cd8efa8d9ef2a2c863bb057d607266f.
**Base:** b7ebc399b92303eacda9afdaa1786f245492051f. **Mode:** NORMAL.

## Shape

1. A source-owned CMP release constant stays false. The root inline bootstrap registers deny and listeners first. It requests `cookie-banner.js` only when that constant is true, the kill switch is not `aus`, and `location.hostname` is exactly `jetnity.com`. Production passes the false constant, so the live tree makes no banner request.
2. The website id is the existing public `PRIVACYBEE_WEBSITE_ID`, set as the documented `website-id` attribute. Legal page widgets are not changed.
3. The adapter reads only the seven documented categories as real booleans and re-reads `window.PrivacyBee` after `privacybee:ready` and `privacybee:consent-changed`. It does not call `acceptAll` or `setAllConsents`. No second cookie or storage ledger.
4. `grant_informative` stays a display label. Production provider start stays denied. A frozen synthetic policy object can prove a positive pure decision only by reference from tests and the local harness. Lookalikes, empty sets, and necessary-only sets deny.
5. A local fake frame is removed on withdrawal, category loss, scope change, reorder, and unmount. Stale generations do not recreate it.
6. The licensed-host harness may intercept exactly one official banner URL and fulfill it locally. Every other vendor host fails. Unlicensed hosts make zero banner requests.

No provider script, host edit, DNS, env write, database, or legal-page publication.
