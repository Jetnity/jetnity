# DiscoverCars V2 widget opt-in 1 — report

**Current, 31 October 2026.** Preparation remains fail-closed after merging accepted main. The general export is verified. The script is not loaded. Shared consent and host foundations do not grant execution. This report does not claim a usable embedded form. Dated sections below describe earlier heads.

**Status at first delivery:** preparation complete and fail-closed. **Not** a live widget integration.

**Source:** `LIVE_SOURCE_VERIFIED`. SHA-256 `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa`. **Runtime:** `CONSENT_BLOCKED`. Execution origins: none. `data-location=""` is in the bound export. The BKK sample is not the default.

## Umgesetzt

Mietwagen now shows an inert DiscoverCars search housing between the honest unavailable-offers card and the existing affiliate links. The housing tells the visitor that Jetnity does not load the search and does not show vehicles, pictures, prices, or availability. The manual form and the V1 generic/BKK links stay in place.

The housing tells the visitor that Jetnity sets no pickup. A Bangkok city trip does not turn the widget into Suvarnabhumi. The load action “Mietwagensuche bei DiscoverCars laden” is absent in normal runtime. A test-only seam can reveal a labelled local fixture, then close it. Trip changes drop an in-flight seam result. Failure keeps the V1 links as the fallback and does not invent offers.

## Dateien

- `components/trips/MietwagenBereich.tsx` — mount plus `break-words` on the existing “Mietwagenangebote” heading
- `components/trips/DiscoverCarsWidgetOptin.tsx` — new
- `lib/providers/discovercars/widget/vertrag.ts` — new gate and state machine
- `lib/providers/discovercars/widget/vertrag.test.ts`
- `lib/providers/discovercars/widget/oberflaeche.test.ts`
- `scripts/discovercars-v2-widget-optin-1/browser.ts`
- `scripts/discovercars-v2-widget-optin-1/harness.tsx`
- `scripts/discovercars-v2-widget-optin-1/synthetische-pruefseite.html`
- this PLAN, STATUS, HANDOFF, SELF_REVIEW, and REPORT

Implementation commit: `de8165a3d5c58995c882f24039223563f2e0b9b2`. Task file untouched, blob `f4b0996471eb67b811382c1102f88285944335e5`. No embed route. No V1 affiliate module edit.

## Tests

Author run, 29 October 2026:

- Focused node tests: 22 pass, 0 fail, including the bound export hash and 26 attributes.
- ESLint on the owned files: pass.
- `npx tsc -p tsconfig.json --noEmit`: pass after `next typegen`.
- `npm run build`: pass. Setup check warned that no `.env` / `.env.local` is present in this workspace. That warning is pre-existing and the build exited 0.
- Playwright harness: pass. Normal housing `VENDOR_EXPORT_MISSING`, load button count 0, affiliate section 1, manual save button 1, at 320/390/768/1440. Seam Tab landed on the load button, Enter focused “Prüfseite schließen”, Escape restored the load button, Space reopened the fixture, trip change dropped the late fixture, error copy stayed, DiscoverCars/PrivacyBee request lists empty.
- Widget overflow 0, including root font 32px at 320px. Page overflow at that size is 18px from the V1 label “Flughafen Suvarnabhumi (BKK)” only.

GitHub App/Auth CI and Vercel Preview are not author-local results. They are reported for the pushed head when observed, or left pending.

## Security

No new endpoint, secret, cookie, or service-role path. The housing does not put `reiseId` in the DOM. The gate refuses private field names and any string that contains the supplied trip id. Referrer policy for the existing V1 link is unchanged. Nothing from DiscoverCars is loaded by this slice.

PrivacyBee was not edited. It is still the legal-page loader, not a consent signal for a rental widget. A click is recorded as `einwilligung` refusal, not as permission.

## Datenbank

None. No migration, RLS, or type change.

## Kosten

No new service and no paid call. The USD 100/month cap is unchanged.

## Offene Risiken

- The source file is verified. A working embedded widget is not. The script stays unloaded.
- Consent for the vendor’s cookies and measurement is undecided. Activation before that decision would be the wrong next step.
- At 320px and 200% root text, the V1 BKK radio label overflows the viewport by 18px. Fixing it means editing `DiscoverCarsAffiliateLinks.tsx`. That file stays read-only until the Technical Lead widens scope. Suggested change, not applied: let the label text shrink and wrap (`min-w-0` on the text span). The new housing does not overflow.
- Chromium CSS zoom at 2 was exercised and overflowed. It is not the browser zoom control, not a phone, and not VoiceOver.
- The test seam must not be passed from product code.

## Empfehlung

Technical Lead reviews this exact head. Do not Ready or merge from this session. Do not start a follow-up slice from here. The useful next product input is a sanitized official export (full HTML, SHA-256, hosts, attributes) plus an explicit privacy decision. Native offer cards remain a separate, unproven API-rights question.

Traveller context: this housing does not read citizenship, residence, or documents, and it does not turn a Bangkok city stage into BKK. The V1 BKK link still requires the existing explicit station choice. The Product Owner correction of 29 October 2026 is recorded in PLAN, STATUS, and HANDOFF: the V2 search is general, and BKK is not its default.
