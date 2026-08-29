# AP-UX-NAV1 – Mobile Account Navigation Rail + `/reisen` consistency

Stand: 30. August 2026  
Status: **AUTHORIZED / BOUNDED / DRAFT ONLY**  
Baseline: `main @ 0ac7296fbd9e348b05a30b4c43cd5fe1815e24d9`  
Issue: #228  
Cursor generation: `Account plattform audit vorbereitung 20`

## 1. Goal

Fix the current Account sub-navigation UX without changing account truth or route URLs.

Current live behavior:
- `components/account/AccountNavigation.tsx` renders a 2-column mobile grid;
- `lib/account/navigation.ts` includes `/reisen` as an Account destination;
- `app/account/layout.tsx` renders `AccountNavigation` for `/account*` routes;
- `app/(public)/reisen/page.tsx` is session-aware but outside that layout, so authenticated users lose the Account navigation on `/reisen`.

Required outcome:
1. Mobile uses a **single-row horizontally scrollable/native swipeable tab rail**.
2. Do **not** implement custom swipe-to-navigate gestures. Native horizontal scrolling only; links remain links.
3. No wrapping into 2×N rows on narrow screens.
4. Active item is clearly indicated with existing `aria-current="page"` semantics.
5. When the active tab could be outside the viewport, keep/bring it into view without causing unwanted vertical page jumps.
6. Touch targets remain at least the current `min-h-11` standard.
7. Keyboard/focus behavior remains normal and visible.
8. Prefer navigation order: **Übersicht → Reisen → Reisende → Einstellungen**.
9. Authenticated `/reisen` displays the same Account navigation above its Account content.
10. Guest `/reisen` remains guest/public and must not display Account navigation.
11. Desktop/tablet remain clean; the component must scale if more Account destinations are added later.

## 2. Architecture boundaries

Do not move `/reisen` to a new URL and do not duplicate account truth.

The shared source remains:
- `lib/account/navigation.ts`
- `components/account/AccountNavigation.tsx`

`/reisen` already calls server-side `auth.getUser()`. Reuse that existing authenticated state to conditionally render the shared `AccountNavigation`; do not introduce a second auth decision or client-session check.

Do not redesign the public header/footer or Trip Workspace.

## 3. Parallel safety

TA-DL1 / PR #227 is active in parallel.

**Forbidden overlap with Agent 19:**
- `components/account/AccountReisendeKarte.tsx`
- `components/trips/Reisevorbereitung.tsx`
- `lib/traveller/dokument-lebenszyklus*`
- TA-DL1 tests/docs/status/self-review/handoff
- `docs/ACTIVE_WORK_STATUS.md`
- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`

Expected AP-UX-NAV1 runtime files are limited primarily to:
- `components/account/AccountNavigation.tsx`
- `lib/account/navigation.ts`
- `lib/account/navigation.test.ts`
- `app/(public)/reisen/page.tsx`
- focused new tests if justified
- AP-UX-NAV1 slice-local status/self-review/handoff docs.

If implementation would require touching Agent-19 files or shared Auth/RLS contracts: **BLOCKED + STOP**.

## 4. Hard non-scope

No:
- migration/schema/RLS/grant/ownership/Supabase mutation;
- Auth/Session/MFA/AAL changes;
- Service Role;
- route migration or redirect architecture;
- new Account destinations/features;
- Favorites/Booking/Notifications/Subscription runtime;
- traveller/document lifecycle edits;
- country-picker/ISO-country UX work;
- Homepage/Provider/Payments/Collaboration/TW-8;
- global continuity-file edits by Cursor.

## 5. UX acceptance

### Mobile
- one horizontal row;
- native finger swipe/scroll works;
- no 2×2 grid;
- no clipped active label;
- no accidental whole-page horizontal overflow;
- active item easy to recognize;
- first/last item reachable;
- future fifth/sixth item does not break layout.

### `/reisen`
- authenticated: Account nav visible and `Reisen` active;
- guest: no Account nav;
- existing guest/account data behavior unchanged;
- `auth.getUser()` remains the server authority.

### Accessibility
- `<nav aria-label="Konto">` retained;
- `aria-current="page"` retained;
- links remain semantic links;
- no touch-only control;
- keyboard focus visible;
- no JS swipe recognizer.

## 6. Tests / evidence

Minimum focused coverage:
1. `ACCOUNT_NAVIGATION` expected order and destinations.
2. `/reisen` still matches active `Reisen`.
3. `/account/security` still maps to Einstellungen.
4. Navigation markup/style contract proves single horizontal row and no `grid-cols-2` mobile layout.
5. Authenticated `/reisen` includes shared Account navigation.
6. Guest `/reisen` does not expose Account navigation.
7. Existing account navigation tests remain green.
8. Typecheck, lint, targeted tests, full tests, hygiene and Production build.
9. Exact-head GitHub CI and Vercel Preview evidence only after final push.

Do not claim real-device evidence unless it actually ran. User screenshots are Product-Owner evidence of the current defect, not post-fix acceptance evidence.

## 7. Deliverables

- bounded runtime implementation;
- focused tests;
- `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_STATUS_2026-08-30.md`;
- `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_SELF_REVIEW_2026-08-30.md`;
- `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_HANDOFF_2026-08-30.md`;
- exact final head, changed-file list, tests, CI/Vercel evidence, residual risks.

## 8. STOP

PR remains **Draft**.

Cursor must NOT:
- mark Ready;
- merge;
- mutate Production/Supabase;
- start another slice;
- edit global continuity files.

After implementation + adversarial self-review + final push, STOP for independent ChatGPT / Technical-Lead exact-head review.
