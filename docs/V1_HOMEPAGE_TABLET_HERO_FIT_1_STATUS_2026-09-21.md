# V1 Homepage Tablet Hero Fit 1 — Status

Stand: 21. September 2026  
Status: **FROZEN FOR INDEPENDENT TL REVIEW / DRAFT / NOT READY / NOT MERGED / NOT TL FINAL**

## Arbeitsblock / Ziel

Generation 1 of **Jetnity V1 homepage tablet hero fit 1**. New isolated session. Implemented only accepted #506 **VUX-8** (TL FINAL review `5269760171`, closure `5764730610`): P3 decorative breakpoint polish. Not a restart of the #506 audit. Not issue 110. Not rejected VUX-6 peek.

## Agent / session / model (actual)

| Item | Value |
| --- | --- |
| Logical agent | **Jetnity V1 homepage tablet hero fit 1**, Generation 1 |
| Session | `bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da` |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |
| Auto / substitute | none |
| URL | https://cursor.com/agents/bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da |
| Isolated from | #531 / #532 review-fix sessions (not reused) |

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-homepage-tablet-hero-fit-1` |
| Issue | #533 |
| Draft PR | #534 |
| Seed | `195f6bc566854f07044064a3690f7d1df68602da` |
| Assigned baseline main | `e818c13ed009932bc06be1382a89467866699995` |
| Product/runtime source | `da8db64223af73ab47c29b2915006a34b4945b8f` |
| Live `origin/main` at freeze write | `65db24b6dda2ab0830b88fa749838ee298e243a0` (#531 merged) |
| Merge-base with live main | `e818c13ed009932bc06be1382a89467866699995` |
| Ahead / behind live main | **3 ahead / 9 behind** — reported, **not** autonomously rebased |
| Operating mode | `NORMAL` |

Exact freeze SHA after this docs commit belongs in the PR STOP receipt.

## Ownership kept

Runtime write: `app/(public)/page.tsx` first-hero grid + decorative-card display only (two classes).

Own docs/evidence only. `#531` / `#532` files and contracts untouched. No shared runtime write, no new dependency, no special PO gate.

## Traveller-context check

Not relevant. Presentation-only first-hero breakpoint. No traveller credentials collected or evaluated.

## Implementation

Coordinated existing Tailwind `xl` (1280px):

- `lg:grid-cols-[minmax(0,650px)_minmax(0,1fr)]` → `xl:grid-cols-[minmax(0,650px)_minmax(0,1fr)]`
- `hidden … lg:flex` → `hidden … xl:flex`

Hiding the card while leaving an empty second column was rejected. Content max-widths (`h1` `max-w-3xl`, form `max-w-2xl`) keep a readable single column below `xl`.

## Compiled-CSS proof (Chromium/148.0.7778.96, `http://localhost:3000/`, guest, no draft)

| Scene | Card | Columns | Card width | overflowX |
| --- | --- | --- | --- | --- |
| **before 1024×768** | squeezed | 2 | **195.35**; tags client 36 / scroll 84–138 | 0 |
| after 1024 / 1023 / 1279 | absent | 1 | 0; no empty second column | 0 |
| after 1280 / 1440 / 1920 | visible | 2 | **400.76**; tags not truncated | 0 |
| after 360 / 390 / 768 | absent | 1 | primary headline/form/CTA remain | 0 |
| after 1024 @ `html 32px` | absent | 1 | required copy/form present | **148 pre-existing** |
| after 1440 @ `html 32px` | visible | 2 | 398.87; some decorative tags ellipsize | 0 |

1024/200% overflow is **not new**. Temporary restore of the baseline `lg` homepage produced the same `overflowX=148` from navbar + later Pro glow / inspiration cards. First hero `right=1024`. See `docs/evidence/v1-homepage-tablet-hero-fit-1/overflow-text-200-attribution.json`.

Interaction at after 1024: focus `#travel-idea` → Tab → `Reise planen` → client validation `Bitte wähle ein Reiseziel aus der Liste.` Unexpected mutation attempts/completed **0**. That is no-mutation evidence, not an observed POST intercept. `/api/` abort remains armed.

## Local gates (author-run, not TL PASS)

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| eslint owned `page.tsx` + capture script | PASS |
| `npm test` | PASS **3661 / 3661** |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` / `operating-mode` | PASS |
| `npm run build` | PASS (warning only: no `.env/.local` in this environment) |

Exact-head CI / Auth / direct Preview belong in the PR STOP receipt after the freeze push.

## Live sibling drift (do not autonomously integrate)

- **#531 MERGED** onto live main `65db24b6`. This writer did not merge it.
- **#532** remains open Draft and is behind. This writer did not touch it.
- Documented TL order was 531 → 532 → 534. Latest explicit TL boundary still forbids this writer from rebasing/merging main or siblings.

## Risks / non-claims

- Local Chromium compiled CSS only. Not authenticated Preview, hardware, Safari or WCAG.
- `html { font-size: 32px }` is text simulation, not OS zoom.
- `getClientRects` reported `titleWraps=false` on the squeezed 1024 before-card; the viewport PNG shows the narrow wrap. Image + tag geometry govern.
- 1440/200% decorative tags can still ellipsize (`truncate` is pre-existing). Required headline/form remain readable.
- 390 after image can show the next section below the hero; that is existing short-viewport composition, not a new VUX-6 peek target.

## Next step

Independent Technical-Lead code / visual / interaction review of the exact freeze head. Cursor does not Ready, merge, rebase, or start a follow-up.
