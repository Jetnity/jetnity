# Jetnity 12Go Official Search Widget V2 — SELF REVIEW

Date: 29 October 2026 Europe/Zurich
Implementation: `e53ac39ce51f85e0a13c51b182f2397ad606ca34`

This is the author's self-review. It is not an independent Technical Lead PASS. Ready and merge stay with the Technical Lead.

## What holds

- Both HTML exports match the supplied length and SHA-256, with no added newline.
- The reference route cannot pass the inserter. The visitor markup contains no Bangkok prefill, no widget sub id, and no loader host.
- V1 links, empty audited route list, and the affiliate module were not rewritten.
- The production component has no load button. Tests cover deny, grant, withdraw, reopen, trip change, stage order, error, and a stale generation.
- The production JS bundles from `npm run build` did not contain `trainbusferry` or `jetnity-mobility-search`.
- Writable paths were respected. `docs/ACTIVE_WORK_STATUS.md` was left unchanged because this task marks it read-only. That conflicts with the general progress policy; the conflict is recorded in the handoff instead of being edited through.

## What a reviewer should press on

1. **CONSENT_BLOCKED is the product result.** The official form did render in the audit harness. It is intentionally absent from the app. Shipping a button that loads jQuery 1.11 into the Jetnity origin, or a button that does nothing, would miss the task.
2. **Cookie evidence is incomplete.** No `Set-Cookie` was observed before search. The counter GIF and the privacy policy still mean a later search can be tracking. Do not read the empty cookie jar as a waiver.
3. **The vendor date is real.** The harness showed November 3 without a Jetnity date. Any future embed must tell people to check that date. Currency remains unverified.
4. **Sandbox evidence is partial.** `allow-scripts` without `allow-same-origin` still requested the three origins. The frame showed a clipped header and one field. That is not an accepted isolation design, and the embed route was correctly left unbuilt.
5. **The test view is dead to the app graph** only because nothing in `app/` imports it. A later import would still be fail-closed unless it also flipped the inserter on and mounted real bytes. The inserter is not in the visitor import graph.
6. **Surface proof is synthetic.** Viewports, 200% root font, keyboard, and phone emulation ran on SSR markup. Chrome zoom, physical devices, and a logged-in workspace session were not run.
7. **CI and Preview** are unverified until this exact head finishes GitHub and Vercel. Preview READY would not be acceptance.

## Recommendation

Keep the PR Draft. Do not enable the loader in a follow-up from this session. The next decision is a Technical Lead one: whether the proposed notice and an isolation technique are acceptable. Until both are accepted, the inert notice and the V1 links are the right visitor surface.

## R5 addition

The surface harness no longer carries its own utility CSS. A source test checks that the stylesheet list matches `app/layout.tsx` and `WorkspaceShell`. The closed paragraph is still not a working form. Iframe sizing is a dated explanation, not the current blocker. I did not wire a CMP callback or a host adapter.

## R4 addition

The previous browser script measured a handwritten iframe. It now measures the markup of `TwelveGoWidgetRahmen`. The static attribute test remains. A counterexample test rejects a missing frame and a 150px height. I did not add an src prop or an execution switch. The stub still does not load 12Go.

## R3 addition

The embed route cannot be opened with a query or cookie. The frame component has no source address, and the trip page does not render it. The new browser check uses a local stub, so it does not prove the official form again and it does not prove search. A reviewer should not treat height 800 on that stub as a new vendor acceptance. The R2 measurement is still the vendor-form evidence. Native CI and Preview must be read on the R3 head, not on `daf082b3`.
