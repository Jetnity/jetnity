# V1 Homepage Tablet Hero Fit 1 — Status

Stand: 22. September 2026  
Status: **AUTHORIZED MAIN INTEGRATED / DRAFT / NOT READY / NOT MERGED / NOT TL FINAL**

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
| Product/runtime source | `da8db64223af73ab47c29b2915006a34b4945b8f` (hero two-class fix; page blob `bc272ae9`) |
| Authorized exact main | `d89ed0b01070e47f93918fa64126ff0aeb18a17b` (#532 TL-merged and postmerge verified) |
| Integration merge | `b7634c1e5daa8ea587f14d8295a1eaf43f1bd358` — **merge once, not rebase** |
| Live `origin/main` at integration write | `d89ed0b01070e47f93918fa64126ff0aeb18a17b` — MATCH, no later-main drift |
| Merge-base with live main | `d89ed0b01070e47f93918fa64126ff0aeb18a17b` |
| Ahead / behind live main after merge | **6 ahead / 0 behind** before the evidence commit |
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
| `npm test` | PASS **3716 / 3716** (includes #532 tests from authorized main) |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` / `operating-mode` | PASS |
| `npm run build` | PASS (warning only: no `.env/.local` in this environment) |

Exact-head CI / Auth / direct Preview belong in the PR STOP receipt after the freeze push.

## Live sibling drift

- **#531** and **#532** are on authorized exact main `d89ed0b0`. Guest/account files came solely from that merge. This writer did not edit them.
- `components/layout/PublicNavbar.tsx` is exclusive to the later NavbarTextReflow1 writer. This slice did not edit it. Integration order remains **#534 first, navbar afterward**.
- Authorized main still matches `origin/main` at this write. A later main/sibling would be reported, not absorbed.

## Risks / non-claims

- Local Chromium compiled CSS only. Not authenticated Preview, hardware, Safari or WCAG.
- `html { font-size: 32px }` is text simulation, not OS zoom.
- `getClientRects` reported `titleWraps=false` on the squeezed 1024 before-card; the viewport PNG shows the narrow wrap. Image + tag geometry govern.
- 1440/200% decorative tags can still ellipsize (`truncate` is pre-existing). Required headline/form remain readable.
- 390 after image can show the next section below the hero; that is existing short-viewport composition, not a new VUX-6 peek target.

## HT-E1 / HT-E2 evidence-only correction (same session)

TL review of exact `858a3b84`. Runtime two-class fix accepted; no `page.tsx` / navbar / shared-component edit. Old `screens/` and `audit-*.json` stay immutable. New proof goes under `docs/evidence/v1-homepage-tablet-hero-fit-1/ht-e1-e2/`.

Delivered (evidence only; `page.tsx` blob still `bc272ae9`):

1. Reproducible `ht-e1-e2/capture.mjs` swapped homepage blob `1bd46c82` for matched baseline 1024/200%, then restored `bc272ae9`.
2. Full-hero + scrolled form/CTA images at baseline 1024/200%, after 1024/200%, after 1440/200%. Form bottoms 905.5 / 1059.16 match the TL review numbers. First-paint viewport images still omit the form; that is why the scroll/full-hero images exist.
3. `ht-e1-e2/overflow-attribution.json`: raw selectors/bounds, `painted`, `firstHeroDescendant`. Document overflowX **148 = 148**. Painted first-hero overflow is **non-empty on baseline** (squeezed card) and **empty after**. Hidden-card ghost boxes are `painted=false`.
4. `ht-e1-e2/assert.mjs` **PASS** (fails on wrong measurements). No class-string tests.
5. Closed by TL review `5272704979` on exact `cdb7cfe1`. Not a new audit.

Destination placeholder can clip at 200% inside unchanged `StartzielForm`. CTA remains complete. Not a navbar/form rewrite.

## Authorized exact-main integration (same session)

TL authorized one merge of exact main `d89ed0b0` into this existing PR. Session remains `bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da`. No new session.

Delivered:

1. `origin/main` verified equal to `d89ed0b0` before merge. No drift.
2. `git merge --no-ff d89ed0b0` → `b7634c1e`. Not a rebase. Hero page blob still `bc272ae9`.
3. Representative refresh only under `docs/evidence/v1-homepage-tablet-hero-fit-1/integrated-d89ed0b0/`. Old first-round and HT-E1/HT-E2 evidence left immutable.
4. Integrated compiled-CSS: 1024 single column / card absent / overflowX 0; 1440 two columns / card visible / overflowX 0; 1024/200% form bottom 905.5, overflowX 148 pre-existing; 1440/200% form bottom 1059.16, card retained. Focus / empty-submit / completed unexpected mutations 0.
5. `integrated-d89ed0b0/assert.mjs` **PASS**. No class-string tests. No navbar edit.
