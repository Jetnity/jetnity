# Jetnity 12Go Official Search Widget V2 — PRE-CODE PLAN

Date: 29 October 2026 Europe/Zurich
Tracking: https://github.com/Jetnity/jetnity/issues/1085
PR: https://github.com/Jetnity/jetnity/pull/1086
Immutable task: `docs/JETNITY_12GO_WIDGET_V2_TASK_V1_2026-10-29.md` at `421a703b274b489004c0b07e8d392dbc1cec6ed7`

This file records the plan posted before product code. It is not a Technical Lead review and it is not merge approval.

R7, 31 October 2026: the accepted shared dependency is main `628b95ddcffc90261cb3bb3d121eafd9e3ce91ea`. The consumer shows that disclosure and `PrivacyBeeCmpPreferences appearance="surface"`. Release stays false. Lifecycle and the R6-R1 scope stay.

## Session attestation

- `originalModelName`: `grok-4.7-high-fast` from cursor-cloud `run-info` (not Auto)
- bcId: `bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c`
- Session URL: https://cursor.com/agents/bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c
- Display name: `Jetnity 12Go Official Search Widget V2 Opt-In 1 — Cursor Generation 1`
- Rename: supported in this run and applied. The previous title was `12Go V2 search widget`.
- Branch: `feat/12go-v2-official-search-widget-optin-1`
- HEAD at plan time: `421a703b274b489004c0b07e8d392dbc1cec6ed7`
- Tree at plan time: `265e76c63ce8936d9c86a3895c0b8a2745e51ed9`
- Merge-base with protected `origin/main`: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Ahead/behind vs `origin/main` at plan time: 1 ahead / 0 behind
- Operating mode: `NORMAL`

## Scope

Writable:

- `components/trips/TwelveGoAffiliateLinks.tsx`
- new `components/trips/TwelveGoWidget*.tsx`
- new `lib/providers/twelve-go/widget/**`
- new `scripts/twelve-go-widget-v2/**`
- new `docs/JETNITY_12GO_WIDGET_V2_*_2026-10-29.md`

Not writable in this task: `components/trips/MobilitaetBereich.tsx`, `lib/providers/twelve-go/affiliate/**`, `app/(public)/privacy/page.tsx`, global CSS, DiscoverCars, Viator, GetYourGuide, UX, Supabase, Auth, RLS, Vercel env, CI, `package.json`, and `docs/ACTIVE_WORK_STATUS.md`.

`app/embed/twelve-go/route.ts` is not created. The task allows that route only after an explicit Technical Lead review.

`docs/ACTIVE_WORK_STATUS.md` stays untouched even though the progress policy names it. This task's ownership rule wins. Continuity for the slice is these `JETNITY_12GO_WIDGET_V2_*` documents.

## Intended result

1. Store both official HTML exports as exact UTF-8 bytes, with the supplied lengths and SHA-256, and with no added newline.
2. Parse attributes from those bytes. Do not assume an attribute count.
3. Keep the Bangkok → Koh Chang export as reference evidence only. Never prefill it and never derive a production route from a trip.
4. Leave the merged V1 outbound links in place, including the empty audited route list.
5. Show one short honest notice in the existing 12Go section. Do not add a load button, script, frame, image, or prefetch while consent and isolation are unapproved.
6. Keep a pure consent state machine for deny, grant, withdraw, reopen, trip change, stage-order change, error, and stale async results. The production view does not import the loader or the test view.
7. Allow a synthetic inserter to return the general bytes only when the seam says executable, the phase is the single visible instance, and the SHA-256 matches the general export.
8. Audit the general loader in a fresh ephemeral HTTPS browser only after a deliberate click. Record scrubbed origin, cookie, and storage names. Try an opaque `sandbox="allow-scripts"` frame. Do not use `allow-scripts` together with `allow-same-origin`.
9. Publish a proposed privacy notice for a later shared-privacy decision. Do not edit the live privacy page.
10. If consent or safe isolation is not established, stop at `CONSENT_BLOCKED`. No live script and no visitor-facing load control.

## Gates expected to stay open

- Approved vendor consent policy: absent. PrivacyBee is the legal-page embed, not a vendor CMP.
- Technical origin list: unknown until the audit, and an observation is not an approval.
- Isolated embed route: not authorized in this task.
- Production execution, Ready, and merge: Technical Lead only, on a later exact head.
