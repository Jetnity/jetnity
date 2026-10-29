# Jetnity – Shared Widget Consent Foundation 1 — REPORT

**Stand:** 29 October 2026. Evidence for independent Technical Lead review. Not a PASS.

## Classification

| Item | Classification |
| --- | --- |
| Choice model | First-party, in memory, fail closed |
| UI | Synthetic controlled component, not mounted in production |
| Vendor scripts | Hard off. Not proved separable |
| Legal text | Proposed note only. Not published |
| Tracker | None added. No live tracker |
| Persistence | None |
| Cost | None |
| Database | None |

## Behaviour that was exercised

- Unknown provider ids and empty scope keys are rejected.
- Refuse, informative grant, withdraw, close, and reopen change only the in-memory informative state and panel. Execution stays `false`.
- A late grant with the previous generation is ignored.
- The same scope key does not reset. A different scope key and a reorder both return to `not_decided` and bump generation.
- A second `createWidgetConsentState` does not inherit a prior grant (no storage across "unmount").
- `individuelleZweckwahl` returns `purpose_separation_unverified` for both providers.
- Rendered markup has no checkbox, iframe, or script. The only `https` URL in the open card is that provider's privacy href, with `noopener noreferrer` and `no-referrer`.
- Ablehnen and Zustimmen share one class string.
- Browser: equal button width and height at least 44px at 320, 390, 768, 1440, 320 with root 32px, and 390 with CSS zoom 2. Initial focus is Ablehnen. After keyboard grant, the card reads that the choice does not start a script and execution remains aus. Kill-switch text stays "aus" while the host passes `{ enabled: true }`.
- Request log: 0 foreign hosts before and after the synthetic choice. The only script is the local harness bundle.

Screenshots from the harness, not a production route:

- `/opt/cursor/artifacts/widget-consent-foundation-1/390.png`
- `/opt/cursor/artifacts/widget-consent-foundation-1/1440.png`
- `/opt/cursor/artifacts/widget-consent-foundation-1/320-root-32.png`
- `/opt/cursor/artifacts/widget-consent-foundation-1/390-nach-zustimmung.png`
- `/opt/cursor/artifacts/widget-consent-foundation-1/390-zoom-2.png`
- `/opt/cursor/artifacts/widget-consent-foundation-1/bericht.json`

## Risk matrix

| Risk | Why it matters | Mitigation in this slice | Left open |
| --- | --- | --- | --- |
| Informative `granted` is read as permission to load a widget | Would start GTM or a counter before a legal gate | Execution function ignores the choice and caller `enabled` | Later provider slices must call this function and must not add a second grant path |
| Purpose rows look like separate consents | Analytics could be described as refused while a bundle script still loads | No checkboxes. Copy says separation is not proved | Do not render checkboxes until a source proof flips the repository constant |
| Scope key becomes a private trip id | Memory inspection or logs could retain it | Foundation does not write storage or logs. Harness uses `scope-alpha` / `scope-beta` | Hosts must pass an opaque token, not a user, trip, document, IP, or user-agent id |
| Privacy link click contacts the vendor | A real navigation is a third-party request | Component is unmounted. Harness does not activate the link. No prefetch | Mounting later is its own gate. A click is still a navigation, not a widget script |
| Global banner returns | Would claim a CMP Jetnity does not have | CookieConsent not restored. PrivacyBee not edited. No cookie | Legal publication stays with the owner |
| Head moves after this evidence | Prior tests stop being exact-head proof | SHA recorded in STATUS | Technical Lead re-gates the pushed head. CI/Preview were not seen here |

## What was not claimed

No working search widget, no price or availability, no affiliate attribution, no legal clearance, no production launch, no verified optional-tracking opt-out.
