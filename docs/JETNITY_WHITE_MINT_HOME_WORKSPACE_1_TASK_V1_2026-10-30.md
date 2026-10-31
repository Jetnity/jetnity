# Jetnity White Mint Home and Workspace 1 — immutable TASK V1

30 October 2026, Europe/Zurich. Tracking #1094. One bounded presentation implementation, not a product-flow redesign or release authorization.

## Owner decision and outcome

The Owner explicitly approved the preceding white/mint proposal: **“du kannst es sofort umsetzen. auch die startseite”**. Implement now; do not ask for another mockup or duplicate approval. Replace the warm grey/beige impression on the LIGHT Workspace and the complete homepage with a coherent predominantly white palette. Preserve the optional dark GREEN Workspace, existing functionality, texts, destination photography and brand identity.

Approved visual reference, not a license for untested blanket replacements:
- Page canvas `#F7FCF9` (almost white with a barely perceptible mint nuance).
- Content cards and forms `#FFFFFF`.
- Sidebar/navigation surface `#EFF7F2`.
- Main text/primary actions deep green `#143E33` (existing brand-green variants may remain for accessible state pairs).
- Light-mode selected surfaces `#E1F1E8`, dark text and an additional visible state marker.
- Fine decorative edges `#DCE9E1`; interactive controls and focus require stronger contrast where needed.
- Existing citrus is an accent only, not a large background. No image behind the itinerary, heavy grain, broad decorative gradients, strong shadows on every panel, neon redesign or new glass-heavy effect.

## Verified baseline and parallelism

TL read START_HERE, the binding TL/Cursor standard, current linked R109 handoff, ACTIVE_WORK_STATUS, latest #751 receipts, live mode and main, actual homepage/root layout/global tokens/workspace surfaces and current open PRs. Baseline main is `ac2199dba64e458a20a155b5d1bb826ea99949d3`, mode NORMAL. This branch starts from that exact commit. The task seed is documentation only.

Separate U1-C PR #1082 is OPEN/DRAFT, latest observed R7 head `5ab20d9d8e796ae5e21d741a02f1ac4aa5ed412e`, original session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`. R6 fixes green editor readability; R7 addresses the low-height floating BackToTop click interception. Neither is a release PASS merely because delivered. Do not overwrite, reimplement or merge those fixes here. In particular `components/workspace/workspace.css`, `workspace-surfaces.css`, WorkspaceShell, BackToTop, PlanpunktEditor and U1-C tests are READ-ONLY to this writer. Provider/CMP/Official-Truth lanes remain separate.

Before code, re-read exact main/head, competing writers, source palette constraints/ADR and this task. If main drifts, report it; no automatic main sync or foreign-branch cherry-pick. Propose a minimal disjoint implementation. New color layer must be testable with released main and later with the reviewed #1082 integration, without changing its behavior. TL owns that integration gate.

## One genuine author

Exact assigned logical/stored name: **Jetnity White Mint Home and Workspace 1 — Cursor Generation 1**.

Use a genuine fresh Cursor Cloud session; actual `grok-4.7-high-fast`, not Auto or an unreported fallback. Before material edits, attest session ID, run-info originalModelName and stored/logical name, then post a concise PRE-CODE PLAN on the Draft PR. Rename the session when the actual product supports it; never claim an unavailable rename or model proof. If identity/model cannot be verified, report the precise limitation before coding.

## Exclusive implementation scope

Prefer ONE new clearly scoped stylesheet `styles/white-mint.css` using semantic color variables, imported once. Avoid changing root global token values, recoloring all descendants indiscriminately, or duplicating different palettes across components.

Allowed:
1. New `styles/white-mint.css`: target actual LIGHT workspace containers and explicitly identified homepage surfaces. Cover the page canvas, white cards/forms, navigation, active/hover/focus states and understated decorative edges/shadows. Any document backdrop/overscroll/grain adjustment must apply only while the targeted page/theme is present. No layout dimensions, z-index, navigation visibility or scroll behavior changes.
2. `app/layout.tsx`: only stylesheet import, an explanatory presentation comment and, if needed, the presentational light `themeColor`. Runtime, language, metadata/SEO/robots, providers and structure stay unchanged.
3. `app/(public)/page.tsx` and existing `components/home/**`: only additive scope markers and strictly presentational classes/styles needed for the complete homepage. Preserve section order, all copy/headings, existing images/alt text, links, CTA behavior, data requests, JSON-LD and metadata. Homepage header, hero, normal content sections, destination cards and footer should belong to one visual system; intentional dark image overlays/contrast panels must retain readable paired colors.
4. `components/workspace/PublicChrome.tsx`: only an additive styling marker if indispensable to scope the homepage chrome; do not alter its route classification, rendering logic, mounts or navigation. Other shared layout/component files are read-only unless TL extends scope.
5. New `lib/ui/white-mint-home-workspace-1/**` and/or `scripts/white-mint-home-workspace-1/**`: owned tests/harness/evidence tooling. Use real existing components/CSS rather than a visually similar fake page. Existing U1-C/browser suites remain unchanged.
6. New task-owned PLAN/STATUS/REPORT/SELF_REVIEW/HANDOFF documents prefixed `JETNITY_WHITE_MINT_HOME_WORKSPACE_1_`. Do not rewrite TASK V1 or unrelated continuity. Report writer state on the PR; TL publishes central #751 updates to avoid competing ACTIVE_WORK_STATUS writers.

Before touching an existing file verify no conflicting current writer. If the above scopes cannot achieve the approved outcome, state the exact additional file and reason before expanding. Do not silently trade scope safety for brittle `!important` overrides or global color filters. No new dependencies, fonts, image downloads or component framework.

## Acceptance

A01. Actual homepage and actual light workspace show the approved almost-white canvas and clean white panels, without the former beige/grey residue or obvious visual jumps. Sidebar and selected areas use measured restrained mint. Check rendered computed colors, not only CSS strings.
A02. Read every rendered heading/label/helper/input/button pair in relevant create/edit/account/navigation states. Normal-sized text target >=4.5:1, required state/focus/component cues >=3:1 where applicable. Pale decorative edges alone must not be the sole form-control boundary. Error/warning/disabled states remain understandable; no color-only selection.
A03. Green theme including editor create/edit, alerts and selected days is not recolored or regressed. Do not remove its R6 markers or neutralize the R7 hiding rule. Light/green switching keeps state and stored preference unchanged.
A04. Homepage at 320/390/768/1440 CSS px and normal desktop: real header/hero/sections/CTAs/footer remain legible, no new horizontal overflow or clipped controls. Preserve photography, overlays, link/CTA targets and all content; no fictitious offers/prices/testimonials.
A05. Real synthetic guest workspace at the same widths: route/detail, menu/bottom nav, forms and account entry retain their behavior. Include light-to-green-to-light, note edit/save/reload and focus states using existing local synthetic data. No new Owner screenshot loop for cases already tested; automated/local evidence first. Record limits of fixture vs hosted/account tests honestly.
A06. Enlarged text and keyboard checks; distinguish root font enlargement from real browser zoom. Check admin dark-mode and provider frames as negative controls for accidental styling leakage; no live provider request required or permitted.
A07. Before/after screenshots of the actual homepage and actual workspace, sanitised, and a concise computed-color/contrast report at the exact head. Failure/counterexample must detect an old beige surface or unreadable text rather than merely asserting a classname exists.
A08. Exact-head focused tests, typecheck/lint/build and native CI; new Git-created Preview evidence. Automatic Git preview is allowed, but READY does not equal UI/account acceptance. Never bind a guessed hostname to a deployment. No manual deployment/environment/protection change.
A09. On delivery provide complete changed paths, exact HEAD/tree/main/merge-base/ahead/behind, test commands/results, CI/Preview identifiers, screenshot locations and explicit remaining limits. Finish a finite handoff and STOP.

## Preserved contracts and safety

No changes to trip records, CRUD, storage keys, auth/session/MFA, RLS/Supabase/SQL/schema, APIs/provider calls, payment/booking, CMP/PrivacyBee, terms, secrets, ENV/DNS or protected browser access. No real user data or personal browser/profile. Use local synthetic data and block non-loopback third-party requests in browser fixtures. Never publish storage/auth state, credentials, personal screenshots/browser chrome or private identifiers. The public contact remains `info@jetnity.ch`.

No new indexing/public launch, no new costs, no provider enablement. Keep noindex and the USD100 monthly ceiling. Existing #968/#917/#748 and all other applicable special gates persist. This palette approval does not authorize new Preview Supabase bindings or waive authenticated acceptance. No direct main writes, force push or automatic merge from another branch.

## Review and STOP

Cursor **do not mark Ready**, **do not merge**, **do not start a follow-up slice**. Only ChatGPT/TL can accept and integrate after independent exact-head review. Self-review or green CI is never TL PASS. Any changed head invalidates earlier exact-head gates. Immediate corrections stay in this same genuine session. The outcome is working source plus verifiable evidence, not merely a design plan, and not a claim that Production has already changed.
