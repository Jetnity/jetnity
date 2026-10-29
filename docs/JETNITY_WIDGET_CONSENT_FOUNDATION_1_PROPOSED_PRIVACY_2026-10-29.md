# Jetnity – Shared Widget Consent Foundation 1 — PROPOSED privacy notice

**Status:** proposed factual note for a later legal owner. **Not published.** Not a Jetnity privacy policy, not legal advice, and not a claim that a widget is live.

`app/(public)/privacy/page.tsx`, PrivacyBee, and the GetYourGuide disclosure were not edited. Swiss PrivacyBee remains the intended website privacy layer and is not a consent-management proof for DiscoverCars or 12Go. The deleted global CookieConsent banner was not restored.

## What this slice does not do

DiscoverCars and 12Go widgets are **not live in Jetnity** through this foundation. No vendor script, frame, pixel, or cookie is loaded. An informative Ablehnen/Zustimmen choice does not grant execution. Optional analytics and advertising separation is **not verified**. Exact optional tracking inside a future widget load is **unknown**.

A visitor cannot reach this UI on a production route. The synthetic harness is a local test page.

## DiscoverCars — observed, not re-executed here

Earlier isolated observation, recorded in the immutable task and the linked #1084 / #1083 notes, saw after a deliberate test decision:

- `www.discovercars.com` `widget.js?v1` (835 bytes in that observation)
- `widget.discovercars.com` frame
- `www.googletagmanager.com`
- `fonts.gstatic.com`
- provider `postMessage`

Opaque/CSP sandbox did not finish. No vendor switch was proved that turns optional analytics or advertising off. This slice did not run that widget again and did not inventory cookies.

Public privacy URL used only as a link, not adopted as Jetnity text: `https://www.discovercars.com/privacy`. Observed as a public Privacy Policy page on 29 October 2026. The vendor cookie policy names additional advertising partners. That page is **not** proof of which of those run inside the widget. This foundation does not turn them on or off.

## 12Go — observed, not re-executed here

Earlier isolated observation, recorded in the immutable task and the linked #1085 / #1086 notes, saw an official general fragment load:

- `cdn0.trainbusferry.com`
- `ajax.googleapis.com` (jQuery 1.11 in that observation)
- `agent.12go.asia` counter GIF

The official standalone form ran in the host origin in that test. An opaque sandbox clipped. No full safe iframe path was proved. This slice did not run that fragment again.

Privacy URL from the in-repo 12Go audit of 29 August 2026 (`docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_EVIDENCE_2026-08-29.md`, E-PRI-02, HTTP 200): `https://12go.asia/en/privacy-policy`. This slice did not re-fetch the policy body and does not adopt its wording. `https://12go.asia/en/privacy` was a 404 in that same audit and is not used.

## Choice versus execution

| Layer | Meaning in this foundation |
| --- | --- |
| Informative choice | `not_decided` (default), `refused`, or `granted` in memory only |
| Purpose rows | Functional load, non-essential analytics, advertising/marketing. Not separately enforceable |
| Effective vendor execution | Always denied while the repository kill switch stays false |
| Storage | None. Refresh drops the choice. No user, trip, IP, or user-agent record |

## Later publication

A legal owner can use this note as input. Publishing it on `/privacy`, or mounting the choice UI in the Trip Workspace, is a separate review. Loading either vendor remains blocked until purpose separation and a safe embed are proved in source and separately approved. APPROVE B does not authorise GTM, marketing tags, or this text as live legal copy.
