# V1 Homepage Tablet Hero Fit 1 — Status

Stand: 21. September 2026  
Status: **IMPLEMENTATION PLAN LOCKED / BEFORE-CAPTURE NEXT / DRAFT / NOT READY / NOT MERGED / NOT TL FINAL**

## Arbeitsblock / Ziel

Generation 1 of **Jetnity V1 homepage tablet hero fit 1**. New isolated session. Implement only accepted #506 **VUX-8** (TL FINAL review `5269760171`, closure `5764730610`): P3 decorative breakpoint polish. Not a restart of the #506 audit. Not issue 110 multi-destination intent. Not rejected VUX-6 mandatory next-section peek.

## Agent / session / model (actual)

| Item | Value |
| --- | --- |
| Logical agent | **Jetnity V1 homepage tablet hero fit 1**, Generation 1 |
| Session | `bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da` |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |
| Auto / substitute | none |
| URL | https://cursor.com/agents/bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da |
| Isolated from | #531 account-read and #532 guest-storage review-fix sessions (not reused) |

## Branch / PR / heads at plan lock

| Item | Value |
| --- | --- |
| Branch | `fix/v1-homepage-tablet-hero-fit-1` |
| Issue | #533 |
| Draft PR | #534 |
| Seed | `195f6bc566854f07044064a3690f7d1df68602da` |
| Baseline main | `e818c13ed009932bc06be1382a89467866699995` |
| Local HEAD at plan | `195f6bc566854f07044064a3690f7d1df68602da` |
| Operating mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Integration order | #531 → #532 → this presentation slice unless a later explicit TL boundary updates it |
| Autonomous main / sibling merge / rebase | **forbidden** |

## Ownership

Runtime write: **`app/(public)/page.tsx` only**, first hero responsive grid / content-width / decorative itinerary wrapper.

Own docs: `docs/V1_HOMEPAGE_TABLET_HERO_FIT_1_{TASK,STATUS,HANDOFF,SELF_REVIEW,DECISION}_2026-09-21.md` and `docs/evidence/v1-homepage-tablet-hero-fit-1/**`.

Read-only: all other homepage sections, copy/claims, images/branding, metadata, `StartzielForm`, `GastCreateLink`, navbar, shared tokens, #531/#532 files and contracts, guest storage/create, account/admin/provider/DB/Auth, package/workflows.

No new shared contract, dependency, or Product-Owner special gate.

## Traveller-context check

Not relevant. This slice only changes first-hero presentation breakpoints. No citizenship, document, visa, transit, health, carrier or eligibility evaluation. No traveller credentials collected or propagated.

## Observed defect (source + historical context)

Current first-hero grid and card both activate at Tailwind `lg` (1024px):

- grid: `lg:grid-cols-[minmax(0,650px)_minmax(0,1fr)]`
- card wrapper: `hidden … lg:flex`
- card: `w-full max-w-[390px]`

At 1024 CSS px the first column can consume 650px plus `gap-10`, leaving roughly 200px for a 390px decorative card. Historical #506 `home_initial_1024` is context only, not current before-proof. This slice must reproduce the squeeze on the exact current compiled product CSS.

## Concrete plan (locked before implementation)

1. **Before proof** against compiled Next CSS on seed `195f6bc5` homepage source (no `page.tsx` edit yet): measure 1024×768 hero/grid/card/title/tag geometry; take viewport + hero images; record overflow. Also record neighbors so the later breakpoint choice is evidenced.
2. **Coordinated breakpoint:** move **both** the two-column grid and the decorative-card display from `lg` (1024) to existing Tailwind `xl` (1280). Do not hide the card while leaving an empty second column. Do not invent a new breakpoint or token.
3. **Preserve:** 1440/1920 two-column branded composition; 360/390/768 primary headline / destination / CTA usefulness; existing `StartzielForm` routing/prefill/guest semantics; brand, copy, images, other sections; no VUX-6 peek / no issue-110 intent.
4. **200% text:** inspect 1024 and 1440 with `html { font-size: 32px }`. Label as text simulation, not OS zoom / device / WCAG certification. Required content stays readable; decorative card may remain hidden at 1024 and stay visible at 1440 if geometry still supports it.
5. **Interaction:** keyboard focus and CTA/touch targets on the unchanged form. Abort unexpected mutations including same-route server actions. Block `/api/`, provider and model URLs. A zero mutation count is not claimed as an observed POST intercept.
6. **After proof** at 360/390/768/1024, just below/above `xl`, 1440/1920, plus 1024/1440 @32px. Assertions: chosen display rule is coordinated; no empty second column when the card is absent; card readable when present; no newly introduced document overflow. Separate any pre-existing lower-page issue.
7. **Gates:** typecheck, lint, relevant tests, hygiene, production build, then fresh exact-head CI/Auth/direct Preview. Freeze source/docs once. STOP for independent Technical Lead. Do not Ready, merge, or start a follow-up.

## Risks / non-claims

- Sibling #531 / #532 remain active review-fix loops; their files stay read-only.
- Live main may move; this writer will report ahead/behind and will not autonomously rebase.
- Local Chromium evidence is not authenticated Preview, Safari, hardware or WCAG proof.
- `next-env.d.ts` may be dirtied by `next dev`; it is not owned and will not be committed.

## Next step in this session

Capture genuine before geometry/images on the current compiled homepage, then apply the two coordinated `xl` class changes.
