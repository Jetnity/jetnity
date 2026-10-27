# Jetnity GetYourGuide Manual Widget Integration 1 — TASK V2 ADDENDUM

Date: 26 October 2026. Root Technical Lead decision for tracking #1040 / Draft PR #1041.
This is an additive task revision; TASK V1 and its negative evidence remain unchanged.

## 1. Existing authority and bounded decision

The latest explicit Owner instruction is:
> wir versenden nichts wenn es nicht nötig ist. wir intergrirren es so wie es dort steht und fertig

Persisted direction: https://github.com/Jetnity/jetnity/issues/1023#issuecomment-6428171400

The Owner has already requested the documented standard manual widget. Root uses that authorization for a bounded integration of its actual, unmodified provider behavior. This is Root's implementation/scope decision, not a claim that the Owner separately approved a newly described exception.

The broader #1023 V5 goal remains open, including selected-product detail navigation and Viator. The sentence “Provider-required behavior still applies” does not turn a search list into a product detail page. Neither this task nor its eventual completion closes V5 or certifies its full widget acceptance.

## 2. Concrete discovery and preserved failed criterion

Root used the original Work-generated markup and original Analyzer in public/synthetic isolated documents. Original provider TLS verification stayed enabled. Each control had one widget load and one actual pictured-offer click:
- q=San Blas Panama: real images/cards; the selected offer opened a San Blas search list with62 results.
- location-id42: real Lisbon cards; the selected offer opened a Lisbon search list with500+ results and the offer highlighted first.
- tour-ids492343: the configured San Blas product card opened a Panama City search list with437 results and the product highlighted first. Captured provider WidgetClickAction identified tour_id492343.
- Each actual destination retained partner_id=2MQHT6Z. No checkout, booking or commission attribution was tested.

Full Root evidence and its limitations:
https://github.com/Jetnity/jetnity/pull/1041#issuecomment-6428876285
https://github.com/Jetnity/jetnity/pull/1041#issuecomment-6429023011

The original provider card uses its upstream activity.href. No supported direct-product HTML switch has been established. This is observed provider behavior in these controls, not a universal promise about every future widget response. The distinct supplied product/location controls remain test evidence, never a production destination/product registry.

**TASK V1 section9.3 is NOT satisfied by these observations.** Search-page navigation must not be renamed product PASS, and V1 must not be rewritten to claim success.

## 3. Narrow replacement acceptance for this standard-widget slice

For #1040 only, this V2 addendum replaces V1's mandatory selected-product-detail destination with the following observable, limited behavior:
1. Genuine official provider images and concrete offers render in the existing Activities area for confirmed generic public destination/country search.
2. A real offer-card action opens the provider's own destination unmodified, preserving partner2MQHT6Z. Record the actual final URL/page type and selected-card relationship; never substitute a branding/footer click.
3. If the provider opens a search list, report that truthfully. This is successful standard-widget navigation, not selected-product-detail fulfillment. Classify the actual rendered destination, not its pathname alone: a real selected-product detail or provider-owned detail overlay can be assessed separately if actually observed and identified, even at a search-shaped URL. Preserve contradictory or outage observations.
4. Jetnity's visible copy must not promise a direct product page or booking. Add a short plain explanation, for example: “Ein Angebotsklick kann zunächst eine Ergebnisliste bei GetYourGuide öffnen. Dort wählst du dein Angebot aus.” Keep provider branding and rendered content intact.
5. Handoff, status, self-review and the final Root verdict distinguish this bounded V2 result from the still-open V1 section9.3 / V5 product-detail goal. No automatic follow-up, provider inquiry or API workaround.

This is the smallest authorized official-widget integration, not a return to link-only discovery, an own product feed, a common ranking or a permanent replacement of V5.

## 4. Every other boundary and gate remains

All other TASK V1 requirements remain: canonical generic search without sample lists, conservative geographic truth, explicit loading/removal, no pre-action provider network, fresh owned documents, context/retry/unmount cleanup, native-activity preservation, exact-ID confirmation, malformed-input handling, narrow paths, no private parent data, no contracts/API/secrets/payments/DB/Auth/RLS/Places/global infrastructure changes, noindex and all unrelated holds.

The original Analyzer remains installed once in the neutral child document. Root observed repeated opaque-origin sessionStorage exceptions while cards and navigation continued. This addendum does not assert fully functional Analyzer collection or waive its independent compatibility review. Record the actual failures and operational/data-flow impact. Do not suppress them through a hostname/preview exclusion, monkey-patch storage, omit the Analyzer or weaken isolation.

Actual candidate route/Fetch Metadata, private-canary network checks, mobile/keyboard/ancestor clipping and rendering stability must still be proved. Prototype success is not candidate PASS. No extraction or replacement of provider links or product content.

All normal Node22 typecheck/lint/full test/hygiene/build checks, exact-head GitHub Actions, Vercel Preview, open-thread review and independent Root review remain required. Every changed head invalidates earlier exact-head gates. Actual-main CI/Production/domain acceptance remains separate after any normal Root merge.

## 5. Writer, adoption and delivery

Same sole writer and genuine session:
**Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1**
Session bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50.
Observed model receipt6428660126: grok-4.7-high-fast from author-observed Cursor Cloud run-info.originalModelName. No competing writer or new session.

Root adds this task-only revision to the existing branch. Adopt that one Root task commit before pushing the implementation; a task-branch fast-forward/rebase to include this Root document is authorized, with local work preserved. Do not force-overwrite or discard it. This does not authorize merging unrelated main changes.

Finish a coherent implementation and honest evidence against V1 as narrowly amended here. Preserve all actual remaining findings. Root alone decides whether the bounded V2 result is responsible to integrate. No self-PASS.

**do not mark Ready**
**do not merge**
**do not start a follow-up slice**
