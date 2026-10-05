# Jetnity – V1 Visual UX & Device Audit 1 – Report

Stand: 21. September 2026  
Status: **EVIDENCE COMPLETE / DOCS-AND-SCREENSHOTS ONLY / NO REMEDIATION / STOP FOR TECHNICAL-LEAD VISUAL/PRODUCT REVIEW**

Issue: #505  
Draft PR: #506  
Branch: `audit/v1-visual-ux-device-audit-1`  
Agent: **Jetnity V1 visual UX device audit 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-89494e60-e648-4519-bb84-0213d85bb04f`

This is a screenshot-backed visual/product/device audit of the existing visitor → search/planning → guest Trip Workspace journey. It is not a source-only regression audit, not a redesign, not WCAG certification, not real-device acceptance, and not TW-8/TW-9 closure.

No runtime, style, component, package, DB, Auth, RLS or global-continuity file was edited.

---

## 0. Binding and method

| Item | Value |
| --- | --- |
| Audited product SHA | `9f386d10816d7adcdaf2fcd6d3732e64f952fb50` (`main` at dispatch; app/components/styles unchanged vs later main) |
| Dispatch / seed head | `e83f13dcea3f22a5f779159cd6ceff30422db750` |
| Local origin | `http://localhost:3000` (existing `next dev`, reused) |
| Browser A | Google Chrome 148.0.7778.96 via Playwright, `locale=de-CH`, headless, viewports below |
| Browser B | Google Chrome desktop walk at ~1280×800 (computerUse), anonymous, no credentials |
| Device scale | 1 (CSS pixels). Resized desktop browser, **not** physical iPhone/Safari/safe-area |
| Fixtures | Synthetic guest `localStorage` `jetnity:reise:v3` only. No real user data |
| Paid calls | Provider/evaluate APIs intercepted (`SIMULATED_INTERCEPT`). Idea-to-draft model submit **not** clicked |
| Evidence | `docs/evidence/v1-visual-ux-device-audit-1/` |

Representative CSS-pixel viewports: **360×800, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080**. Deep pass at **390** and **1440**; remaining widths used for the same key screens.

Existing `scripts/mobile-accessibility-1-audit.mjs` was re-run against this local origin: **21/21 OK**, 0 overflow, keyboard/menu/workspace fixture pass. That script measures reflow/targets, not visual hierarchy.

Live `origin/main` at write time: `c7fb9f0f693ba9f020add7b26a041263aa7e3b07` (`Close … (#494)`). Diff vs product SHA is **8 files, no `app/`/`components/`/`styles/`**. Visual screens remain valid for current product UI. They are **not** a claim about #494 harness code.

#494 exact head `3de1d8e857a383dbf9bfb2e04f37374da552ac4a` is now **merged**. This audit did not touch, rebase or restart it.

---

## 1. Coverage matrix

Classification: **RENDERED_CHECKED** = actual painted screen at a listed viewport. **BLOCKED_ACCESS** = login/redirect only; the area behind login was **not** visually passed. **SOURCE_ONLY** = route exists, not painted this pass. **NOT_REVIEWED** = known but out of first-pass depth.

| Surface | Route | Class | Notes |
| --- | --- | --- | --- |
| Homepage initial + scroll | `/` | RENDERED_CHECKED | 360/390/768/1024/1440/1920; menu 360/390; keyboard, text-zoom, reduced-motion at 390 |
| Public navigation | `PublicNavbar` | RENDERED_CHECKED | Open/Escape on phone; desktop `md` bar from 768 |
| Search/planning | `/planen` | RENDERED_CHECKED | 390/768/1440; empty validation; idea path shown, **not** submitted |
| Inspiration → planen | `/planen?ziel=Bali` | RENDERED_CHECKED | 390 only |
| Guest trips empty | `/reisen` | RENDERED_CHECKED | 390/1440 |
| Guest trips with draft | `/reisen` + fixture | RENDERED_CHECKED | simple + complex |
| Guest workspace overview | `/reisen/trip-v1-visual-*` | RENDERED_CHECKED | empty-ish simple; complex multi-stage at all 6 widths |
| Workspace coverage Flüge/Unterkunft | same | RENDERED_CHECKED | 390/1440; **simulated** unavailable intercept |
| Workspace Tagesplan / day chips | same | RENDERED_CHECKED | 390/1440 |
| Workspace change sheet | same | RENDERED_CHECKED | 390/1440 |
| Workspace destination essentials / prep | same | RENDERED_CHECKED | scrolled 390/1440; party fixture present |
| Login | `/login` | RENDERED_CHECKED | Gate only |
| Register | `/register` | RENDERED_CHECKED | Gate only |
| Account home / trips / settings / security / export / travellers / welt / bookings | `/account…` | **BLOCKED_ACCESS** | Redirects to `/login?next=…`. Login is not an account visual pass |
| Admin login | `/admin/login` | RENDERED_CHECKED | Gate copy only |
| Admin home / system-health / provider-ops / security / users / … | `/admin…` | **BLOCKED_ACCESS** | Redirects to admin login |
| Unauthorized | `/unauthorized` | RENDERED_CHECKED | 390 |
| Account workspace (signed-in) | `/reisen/<uuid>` | BLOCKED_ACCESS | No authorized session |
| Local UI-audit harness pages | `/ui-audit/…` | SOURCE_ONLY | Require `JETNITY_UI_AUDIT`; not enabled on the running server; not a product path |
| Provider-live search results | flight/hotel/activity APIs | NOT_REVIEWED | Intentionally not called |
| Real iPhone/Safari/Android/safe-area/hardware keyboard | — | NOT_REVIEWED | Viewport emulation only |
| Text zoom via OS, screen reader, WCAG audit | — | NOT_REVIEWED | Simulated `html { font-size: 24px }` only |

A login screen is **not** proof that Account or Admin was visually checked.

---

## 2. Highest-value findings

Eight findings. No filler to reach ten. No P0 (nothing broken-to-the-point-of-unusable on the inspected journey).

### VUX-1 — Phone workspace first viewport is chrome, not the next action

- **Severity:** P1  
- **Class:** reasoned UX / information-order improvement  
- **Route / state / device:** `/reisen/trip-v1-visual-complex`, complex guest fixture, **390×844** (also 360)  
- **Screenshot:** `screens/workspace_complex-overview_390.png`  
- **Components:** `GastArbeitsbereich` guest banner; `TripWorkspaceKopf` kompakt card; discard control in `kopfzeile`; `TripWorkspaceUebersicht` starts below  
- **Reproduction:** inject synthetic guest trip, open `/reisen/<id>` at 390, do not scroll  
- **Observed:** first screen is public nav + “Meine Reisen” + guest-persistence banner + large dark title card (long title, route, dates, “Entwurf verwerfen”). “Übersicht / Deine Reise auf einen Blick” and coverage actions sit below the fold.  
- **Desired:** a newcomer sees *where they are* in one compact line and *the next useful action* (overview status or Flüge/Unterkunft) without scrolling. Guest/account truth can stay visible, but not as a second hero.  
- **Impact:** the actual planning surface is delayed; discard and account upsell compete with the trip.  
- **Confidence:** high (two fixtures, 360/390). At **768** the same header plus Übersicht + “Jetzt wichtig” fit (`workspace_complex-overview_768.png`) — phone-specific.  
- **Not:** a request to drop the guest-honesty banner or the brand header.

### VUX-2 — Timeline stage dates render raw ISO next to localised chips

- **Severity:** P1  
- **Class:** reproducible defect  
- **Route / state / device:** complex workspace Tagesplan, 390 and 1440  
- **Screenshot:** `screens/workspace_complex-day_390.png`  
- **Component:** `components/trips/TripWorkspacePlan.tsx` — stage line joins `arrivalDate`/`departureDate` as raw `YYYY-MM-DD`; day chips use `de-CH` `DateTimeFormat`  
- **Reproduction:** open guest workspace with dated stages; scroll to Tagesplan  
- **Observed:** “Ubud … 2026-10-12 – 2026-10-16” beside chips “12. Okt.” / “13. Okt.”  
- **Desired:** one human date language on the same surface.  
- **Impact:** looks unfinished; two date grammars in one glance.  
- **Confidence:** high (source + screen). Smallest fix is format-only.

### VUX-3 — Newcomer-facing coverage copy is internal truth vocabulary

- **Severity:** P1  
- **Class:** reasoned UX / wording (not a logic bug)  
- **Route / state / device:** workspace overview and Flüge/Unterkunft gaps, 390 and 1440  
- **Screenshots:** `workspace_complex-overview_390.png`, `workspace_complex-overview_1440.png`, `workspace_complex-flights_1440.png`  
- **Components / copy sources:** `lib/trips/uebersicht.ts`, `lib/trips/attention.ts`, `lib/trips/detail.ts`, `TripWorkspaceUebersicht`, `TripWorkspaceJetztWichtig`  
- **Observed:** “1 von 4 Bereichen belegt · 3 noch nicht vollständig bestimmbar”; “Flugabdeckung noch nicht vollständig bestimmbar”; gap eyebrow “Lücke”; “Lage: Noch nicht bestimmbar”; “Es wird kein fehlender Anbieter erfunden.” Repeated in Übersicht **and** Jetzt wichtig **and** the gap panel.  
- **Desired:** user words first (`noch offen`, `noch nicht gewählt`, `Anbieter folgt`). Keep honest non-invention; do not invent availability. Internal `bestimmbar` can stay in code/enums.  
- **Impact:** a visitor cannot tell state or next step without decoding audit language.  
- **Confidence:** high. This is presentation, not a request to weaken truth.

### VUX-4 — Opening a coverage gap on the phone loses back/context

- **Severity:** P2  
- **Class:** reasoned UX / navigation  
- **Route / state / device:** Flüge and Unterkunft on 390  
- **Screenshots:** `workspace_complex-flights-from-top_390.png`, `workspace_complex-hotel-from-top_390.png`; the earlier `workspace_complex-flights_390.png` landed on the footer  
- **Components:** `TripWorkspace` compact hide-overview; `TripWorkspaceNavigation` sticky “Zurück zur Reise”; `FlugSuche` / `HotelBereich`  
- **Reproduction:** from overview top, tap Flüge or Unterkunft  
- **Observed:** first painted frame after open is mid-panel (“Flug suchen” + Bestand, or later-stage “Noch offen” + footer). Public chrome and “Zurück zur Reise” are not in that frame. Sticky back exists in source (`min-h-11`) but did not remain in the captured first viewport.  
- **Desired:** opening a gap keeps domain title + back in view; search is the next action, not a scroll jump.  
- **Impact:** “where am I / how do I return” fails the UX IA standard on the first phone glance.  
- **Confidence:** medium-high (reproduced twice; exact scroll driver not instrumented beyond screens).

### VUX-5 — Destination essentials repeat empty official/safety/season lines

- **Severity:** P2  
- **Class:** reasoned UX / density  
- **Route / state / device:** complex overview scrolled, 390  
- **Screenshot:** `workspace_complex-plan-prep_390.png`  
- **Component:** `TripWorkspaceDestinationEssentials`  
- **Observed:** each stage repeats “Einreise / Sicherheit / Reisezeit — Noch keine verlässlichen Hinweise verfügbar.” Three empty domains × three stages.  
- **Desired:** one trip-level “noch keine offiziellen Hinweise” with stages listed, or hide empty domains until evidence exists. Do not invent hints.  
- **Impact:** long scroll, no decision. Honest, but not progressive disclosure.  
- **Confidence:** high.

### VUX-6 — 360 homepage first screen is only the hero

- **Severity:** P2  
- **Class:** reasoned UX / sizing (brand-intentional tension)  
- **Route / state / device:** `/` 360×800  
- **Screenshot:** `screens/home_initial_360.png` (390 still peeks “Nicht mehr Apps”)  
- **Component:** `app/(public)/page.tsx` hero `min-h-[520px]` + `PublicNavbar`  
- **Observed:** entire first viewport is the dark hero (3-line 34px H1, search stack, trust chips). Next section does not peek. Desktop 1440 uses width well (copy + decorative itinerary).  
- **Desired:** keep brand scale, but let the following section peek on the shortest phones so the page does not feel like a single poster. **Not** issue #110 hero redesign.  
- **Impact:** orientation is clear (search), context beyond the poster is not.  
- **Confidence:** high. Size alone is not a defect; the missing peek is the user-task issue.

### VUX-7 — `/planen` on the phone leads with the idea/model path

- **Severity:** P2  
- **Class:** reasoned UX / information order  
- **Route / state / device:** `/planen` 390  
- **Screenshots:** `planen_initial_390.png`, `planen_form_390.png`, `planen_validation_390.png`  
- **Components:** `Reiseidee` above the fold; `TripPlanner` below “Oder Schritt für Schritt”  
- **Observed:** first screen is free-text “Entwurf erstellen” (can call `vorschlagErzeugen` — **not** clicked). The provider-free form that actually works without a model is below the fold. Validation on that form is clear and field-level (strength). Desktop 1440 shows both, form still partly below.  
- **Desired:** keep idea-first if that remains product order, but make the no-model path visible in the first phone viewport (short pointer or swapped density), and keep the idea path honest when the model is off.  
- **Impact:** visitors may think planning *is* the (possibly unavailable) idea box.  
- **Confidence:** high for layout; model-off copy was not separately captured this pass.

### VUX-8 — 1024×768 hero mock card truncates

- **Severity:** P3  
- **Class:** reasoned UX / landscape-tablet leftover width  
- **Route / state / device:** `/` 1024×768  
- **Screenshot:** `screens/home_initial_1024.png`  
- **Component:** homepage decorative itinerary card (`hidden` until `lg`)  
- **Observed:** “Bali · 14 Tage” wraps; place/tag lines ellipsize (`Natu…`, `Stra…`). Card is visual, not a real trip. At 1440/1920 the same card is comfortable.  
- **Desired:** hide or simplify the mock card until there is room, rather than a squeezed second hero.  
- **Impact:** decorative clutter on landscape tablet.  
- **Confidence:** high.

---

## 3. Strengths to preserve

- Brand tokens, dark green, citrus CTA, cream surfaces. Do not rebrand.
- One clear homepage primary action: destination field + “Reise planen”. Trust chips (“Kein Konto nötig”) match guest policy.
- Desktop homepage uses width: copy + search left, itinerary preview right (`home_initial_1440.png`).
- Empty guest `/reisen` is calm and honest (`reisen_empty-guest_390.png`).
- Nav CTA becomes **Reise fortsetzen** when a guest draft exists — same action, right label.
- Long titles wrap (`hyphens-auto break-words`); **0 horizontal overflow** on this capture set and on the reused mobile-a11y audit.
- Guest persistence copy is truthful (browser-only, migrate on login).
- Planen field validation is specific and local (“Bitte wähle ein Reiseziel aus der Liste”).
- Desktop workspace two-column (overview | gap) uses width (`workspace_complex-flights_1440.png`).
- Coverage honesty: no invented flights/hotels; intercepted unavailable is labelled in evidence.
- Mobile menu targets are 44px; Escape closes and returns to the menu button (existing a11y audit still green).
- Multiple travellers / dual citizenship were loaded in the complex fixture without collapsing to one document. Prep UI was only partly in-frame; **not** claimed as a full traveller-registry visual pass.

---

## 4. Proposed ordering / sizing / density (direction only)

No implementation in this PR.

1. **Phone workspace first screen:** collapse guest banner + title + discard into one compact header so “Deine Reise auf einen Blick” and the first coverage row appear above the fold. Keep discard secondary.
2. **One date formatter** on the Tagesplan stage line (same `de-CH` as chips).
3. **User-facing coverage strings:** map `unbestimmt`/`bestimmbar` to “noch offen” / “noch nicht gewählt”; keep “kein Anbieter erfunden” as a short secondary line, not the headline.
4. **Gap open on phone:** pin “Zurück zur Reise” + domain title; do not scroll the search CTA over the chrome.
5. **Essentials:** one empty-state for missing official/safety/season, not 3×N cards.
6. **360 hero:** reduce min-height or peek the next section; do not rebuild the hero (issue #110 stays separate).
7. **Planen phone:** keep both paths; surface the no-model form in the first viewport.
8. **1024 mock card:** hide or shrink until `xl`.

---

## 5. Smallest repair scopes (1–3)

For a later Technical-Lead-authored task. This audit implements none.

### Scope A — Phone workspace first viewport (owns VUX-1, helps VUX-4)

- **Files:** `components/trips/TripWorkspaceKopf.tsx`, `components/trips/GastArbeitsbereich.tsx` (banner/discard), optionally `TripWorkspaceUebersicht.tsx`  
- **Dependencies:** none on providers, Auth, DB  
- **Acceptance:** at 390×844, a synthetic long-title guest trip shows Übersicht heading + at least one coverage action without scrolling; guest-honesty remains visible; 768/1440 unchanged in product logic  
- **PO gate:** no

### Scope B — Timeline date display (owns VUX-2)

- **Files:** `components/trips/TripWorkspacePlan.tsx` (reuse `langesDatum`/`kurzesDatum` or `lib/trips/datum-anzeige.ts`)  
- **Acceptance:** stage range is localised; unit/DOM test if one already exists beside the component  
- **PO gate:** no

### Scope C — Coverage / attention / gap user copy (owns VUX-3, helps VUX-5)

- **Files:** `lib/trips/uebersicht.ts`, `lib/trips/attention.ts`, `lib/trips/detail.ts` (and their tests that assert the current German strings)  
- **Dependencies:** do **not** change `bestimmbar` enums or invent provider status  
- **Acceptance:** newcomer strings on overview/gap; tests updated to the new copy; no new provider calls  
- **PO gate:** no, unless product wants a broader vocabulary rewrite

Do not bundle a homepage hero redesign, TW-8/TW-9, or Account/Admin visuals into these scopes.

---

## 6. Component map (deep journey)

| User thing | Component / module |
| --- | --- |
| Public bar / mobile menu | `components/layout/PublicNavbar.tsx`, `lib/auth/oeffentliche-navigation.ts` |
| Homepage hero + search | `app/(public)/page.tsx`, `components/places/StartzielForm.tsx`, `OrtSuche` |
| Planen idea | `components/trips/Reiseidee.tsx` |
| Planen form | `components/trips/TripPlanner.tsx` |
| Guest one-trip gate | `components/trips/PlanenCreateGate.tsx` |
| Guest list | `components/trips/GastReisen.tsx` |
| Guest workspace shell | `components/trips/GastArbeitsbereich.tsx` |
| Header | `components/trips/TripWorkspaceKopf.tsx` |
| Overview / coverage rows | `components/trips/TripWorkspaceUebersicht.tsx` |
| Attention | `TripWorkspaceJetztWichtig` |
| Essentials | `TripWorkspaceDestinationEssentials` |
| Tagesplan | `components/trips/TripWorkspacePlan.tsx` |
| Back when compact detail | `components/trips/TripWorkspaceNavigation.tsx` |
| Flights / hotels | `FlugSuche`, `HotelBereich` |
| Change | `ReiseAenderung` |
| Prep | `Reisevorbereitung` |
| Guest store | `lib/trips/gastspeicher.ts` key `jetnity:reise:v3` |

---

## 7. Keyboard, motion, zoom (what was actually done)

- First Tab on `/` at 390 focuses the skip link (`home_keyboard-skip_390.png`). Existing a11y audit confirms skip → `#public-content`, menu Escape restore, 44px menu/CTA.
- `prefers-reduced-motion: reduce` after scroll: `home_reduced-motion-scroll_390.png` (viewport evidence only).
- Simulated text zoom (`html` 24px): `home_text-zoom-150_390.png`. Not OS pinch-zoom.
- Native `<input type="date">` showed `mm/dd/yyyy` in this VM even with `html lang="de"` and Playwright `de-CH`. Treated as **environment/browser locale**, not a proven product defect.

---

## 8. Technical-Lead visual-review checklist

Use the screens, not this prose, as the object of review.

- [ ] Phone workspace first viewport (VUX-1) — accept / downgrade / reject  
- [ ] ISO stage dates (VUX-2) — accept as defect?  
- [ ] “bestimmbar” / “Lücke” copy (VUX-3) — wording scope vs later polish  
- [ ] Gap-open scroll on phone (VUX-4)  
- [ ] Essentials empty repetition (VUX-5)  
- [ ] 360 hero peek (VUX-6) vs leave brand  
- [ ] Planen idea-first on phone (VUX-7) vs keep documented order  
- [ ] 1024 mock card (VUX-8)  
- [ ] Confirm Account/Admin stay BLOCKED until a safe fixture session  
- [ ] Confirm no homepage redesign / no TW-8-9 / no #110  
- [ ] Choose 0–3 repair scopes; author the next task if any  

Reusable later challenge (existing Product & UX Explorer, **not** dispatched here): same evidence directory, same product SHA, same screens.

---

## 9. What this audit does not claim

- All-site visual PASS  
- Real-device / Safari / Android / hardware keyboard / safe-area PASS  
- Account or Admin interior PASS  
- Provider-live search quality  
- WCAG certification  
- Conversion or competitor superiority  
- That #494 merge changed the UI (it did not touch UI files)

**STOP FOR TECHNICAL-LEAD VISUAL/PRODUCT REVIEW.** No Ready. No merge. No follow-up slice from this writer.
