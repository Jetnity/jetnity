# Shared Responsive Layout P2 1 — Author report

## R2 publication checkpoint — supersedes the initial publication STOP

The user dispatched the binding [Technical Lead R2 decision](https://github.com/Jetnity/jetnity/pull/959#issuecomment-6216960689) in this same session. R2 authorizes exactly **one ordinary implementation commit and one non-force push** of the preserved candidate to existing Draft #959, so original GitHub CI can supply the missing native PostgreSQL/full-suite evidence on that new HEAD. This changes the publication sequence only. No PostgreSQL/system installation, test/script/workflow edits, waiver or alternate runner is authorized.

Fresh readback still matches main `bd613dd479b67353966f7a2c0e609e22793ab2d6`, old local/remote seed `e9d92afd3200387ebd5a985f767fbb0a1b8d1140`, seed tree `90149309e39503a449fde2ccd8324c33fcff1915`, immutable TASK `e9ff2986a7e1b7a300f456ef63f791e3ce081bd9`, NORMAL, active ruleset 21875372, clean staging index and unchanged Draft #955. Ordinary existing GitHub authentication works. Product and new browser-test bytes still exactly match the preserved candidate manifest. Only this REPORT and HANDOFF are updated under R2; PLAN, SELF_REVIEW and the manifest remain records of the initial pre-publication checkpoint.

Repeated local checks on these unchanged product/test bytes: setup, operating-mode, typecheck, lint, API/schema/dead/exports/dependencies, **92 focused tests**, production build, and **all 14 actual browser width/zoom states PASS**. Browser rerun: installed Chrome155.0.8059.82/Playwright1.55.0, local built runtime and synthetic Guest only; root320/320 at CSSzoom2, no clipped content, intact links/artwork, 44CSSpx touch targets, keyboard/menu/focus and long-text assertions. No product CSS override or new software installation. Saved pre/post evidence remains unchanged.

The original local full-suite status is **6,831 PASS / 10 FAIL / 2 SKIP, 6,843 total**, still FAIL due to missing native PostgreSQL16. It has not been rerun, suppressed or relabelled. Its ten failures must be resolved by actual original CI execution on the new published HEAD, not by the previous seed CI. Original Auth must run its comparison rather than skip; the automatic Vercel deployment must match the same new commit.

**At this pre-commit snapshot: publication authorized; exact new remote CI/Auth/Preview PENDING / NOT YET VERIFIED.** Any commit/push error or original CI/Auth failure requires STOP with the local commit preserved. No Ready/Merge/Production/follow-on. Independent TL review is required even if CI succeeds.

The post-publication receipt will record the resulting exact HEAD/tree/parent, immutable TASK, full inventory, original job/step and native-PG outcomes, Auth and Vercel evidence in a sanitized PR #959 comment and local deliverable. This preserves the one-commit/one-push limit; a commit cannot embed its own resulting hash or later CI result. Earlier headings below describe the **historical initial STOP**, not the current publication permission.

---

## Historical initial STOP checkpoint

16 October 2026, Europe/Zurich. Issue #958 / Draft #959.
Author: **Jetnity Shared Responsive Layout P2 1 — Codex Generation 1**.
Session: `01a144d8-26ca-7513-b070-12bd534bf2db`.

**LOCAL CANDIDATE / BLOCKED BEFORE COMMIT AND PUSH / NOT READY.**
The three permitted components are corrected locally. The original full test suite cannot pass on this host because native PostgreSQL 16 is absent. The user's publication condition requires regular prerequisites to be fulfilled; their section 8 requires STOP for a blocked test environment. No installation, test waiver, alternate runner, commit or push is inferred from the session-specific Full Access authorization. Independent TL acceptance and exact implementation-HEAD CI/Auth/Preview remain outstanding.

## Identity and authority

| Item | Verified value |
| --- | --- |
| Existing branch | `fix/shared-responsive-layout-p2-1` |
| Local and GitHub HEAD, still TASK seed only | `e9d92afd3200387ebd5a985f767fbb0a1b8d1140` |
| HEAD tree, NOT the uncommitted candidate | `90149309e39503a449fde2ccd8324c33fcff1915` |
| Immutable TASK blob | `e9ff2986a7e1b7a300f456ef63f791e3ce081bd9` |
| main / merge-base | `bd613dd479b67353966f7a2c0e609e22793ab2d6` |
| main tree | `fd75f3d3dc8fa051d2316b3a7966c626e1de760f` |
| Ahead / behind main | 1 / 0, seed commit only |
| Operating mode / protection | NORMAL; ruleset 21875372 active at precheck |
| PR #959 | OPEN / DRAFT |
| Parallel #955 | OPEN / DRAFT, unchanged `312bcadc31a2fa0d07ce3b81b0fe30df1f9035cf` |

The user explicitly resumed this same session with “ich erlaube den Vollzugriff. mach weiter”; [resume receipt](https://github.com/Jetnity/jetnity/pull/959#issuecomment-6216381106). This supersedes the initial permission STOP only. No protected scope or publication/test gate was waived. The Owner must restore ordinary permissions after STOP; no UI reset is claimed.

## Reproduction and minimal implementation

Historical [R18](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6214745915), [R19](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6215245944) and [R17](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6214174938) are reference evidence. The historical main / #955 A/B was not rerun. This author's own untouched current seed independently reproduced the same 30px root overflow with one synthetic Guest fixture, then reused that fixture after the change.

| 320x800, CSS zoom 2 | Before | After |
| --- | ---: | ---: |
| Document scrollWidth / clientWidth | 350 / 320 | 320 / 320 |
| Navbar logo-link right edge | 344 | 264 |
| Navbar image right edge | 328 | 248 |
| Footer logo-link right edge | 349.859 | 264 |
| Footer image right edge | 325.859 | 240 |
| Footer grid scrollWidth / clientWidth | 155 / 120 | 120 / 120 |
| Mail link right edge | 326.078 | 264 |
| Privacy link right edge | 324.875 | 280 |
| Attention card scrollWidth / clientWidth | 134 / 134 | 134 / 134 |
| Attention list scrollWidth / clientWidth | 169 / 110 | 110 / 110 |
| Attention row/button right edge | 387.953 | 270 |

Bounding rectangles above use viewport coordinates; scroll/client widths are the browser's layout measurements. The Attention clipping is independent of the page overflow: its card remains 134/134 before and after. Its actual clipped text was inspected in the baseline screenshot **before** editing, satisfying D3's conditional ownership gate.

- `components/layout/PublicNavbar.tsx`: bound the brand link and image to available width; allow intrinsic shrink while preserving the existing row wrap. Contain the complete logo artwork within its height box. Add local mobile link wrapping/minimum-width handling. Existing menu state, Escape, focus return, ARIA, safe-area and Auth/logout logic are unchanged.
- `components/layout/Footer.tsx`: explicit zero-minimum grid tracks/items, bounded brand/contact/legal links and inherited word wrapping; a shrinkable span around the unchanged mail address. GeoNames keeps its URL/text and gains the required touch height and visible focus ring. No links or legal text removed.
- `components/trips/TripWorkspaceJetztWichtig.tsx`: zero-minimum list/row sizing and intrinsic flex wrapping; text gets an 8rem preferred basis so a narrow row stacks before text is crushed between icons. Existing clip/rounded corners remain, but measured text and buttons now fit inside them. The action focus ring is inset so it remains visible. Order, data, copy, grouping and action callbacks are unchanged.

No new hidden/clip rule. No image asset change or distorted artwork: `object-contain` scales the complete bitmap inside the original height box, leaving space when necessary. Normal desktop sizes remain 144x48 (navbar md: 96x32). At 1024/CSS2 the old footer image box was already squeezed to 277.359x96; the corrected zero-minimum grid restores 288x96. Navbar and other 768/1024/1280 image sizes match the baseline.

## Verification

Host: macOS arm64, Node 22.23.3, Playwright 1.55.0, installed Google Chrome 155.0.8059.82 with sandbox enabled. No browser/system installation. This is **CSS zoom**, not native browser zoom, a physical device or real account qualification.

The unchanged `/ui-audit/trip-workspace` renders a synthetic Guest trip from sessionStorage. Fresh contexts use 320/360/375/390/768/1024/1280 x 800, each at zoom 1 and 2, DPR 1 and coarse pointer. Only loopback GETs are allowed; API/external requests and mutations fail the test. No cookies or real account/provider/database access. The stored fixture is asserted unchanged.

The final browser test checks real element and text-fragment bounds, clipped ancestors, decoded logo artwork, complete footer href inventory, 44 CSSpx targets, keyboard Tab/Enter/Space/Escape, aria-expanded, focus return/rings, target hit testing and long legal/mail text. Fourteen states pass with no root overflow, hidden text or recorded request/console/page errors. Baseline/final structured measurements and synthetic screenshots are in `docs/evidence/jetnity-shared-responsive-layout-p2-1/`.

| Check | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS, lock/package unchanged |
| Setup CI and operating-mode | PASS |
| Typecheck and lint | PASS |
| Existing focused layout, Attention and audit-guard tests | 92 PASS, 0 fail, 0 skip |
| Full unchanged `npm test` | **FAIL**: 6,843 tests, 6,831 pass, 10 fail, 2 skip |
| API protection / schema references / dead code / exports / dependencies | PASS |
| `npm run build` | PASS, including normal prebuild setup |
| Opt-in real browser suite, separately executed | PASS, 14 width/zoom states; not credited from its full-suite skip |
| Production audit guard, local `next start` with `VERCEL_ENV=production` and audit flag 1 | HTTP 404; existing guard tests also PASS |
| Diff whitespace, allowed paths, immutable TASK and logo | PASS |

All ten full-suite failures originate in missing native PostgreSQL: `initdb` at `/usr/lib/postgresql/16/bin`, `local_postgresql_not_available`, or explicit required-native-binary assertions. Affected proofs: catalog hardening, CH-DE accepted-read refusal, content identity schema, integrated pilot R3/storage/R5, original custody, source catalog and trusted-store gateways. No assertion was disabled or mocked. The two skips are the existing native declaration-revision test and the new opt-in browser test without its explicit loopback URL. Neither is represented as a full-suite PASS.

Baseline browser execution first required fixing a tsx callback serialization helper (`__name`); this was harness setup, not a product defect. Subsequent QA strengthened hit testing and screenshot handling: sticky headers require centering targets before hit testing, native smooth scroll must settle, and host Chrome's `captureBeyondViewport` resets coarse-pointer media. An isolated comparison reproduced this for mobile and desktop contexts; actual viewport capture preserves the media state. The final harness captures seven actual viewport screenshots, verifies that input emulation stays unchanged, and never changes product CSS. Earlier partial/failed diagnostic runs are not called final PASS.

The baseline ran on `next dev`; final interaction evidence ran against the local production build using the existing development-only audit flag. Baseline element screenshots contain development overlays and establish horizontal clipping; they are not unobstructed whole-page acceptance images. Final synthetic viewport screenshots were visually inspected. Regular device safe-area insets were zero; nonzero notch/device behavior was not exercised, while existing safe-area rules remain unchanged.

## Publication and remaining gates

No implementation commit exists. Candidate product/test file blobs are recorded separately in the evidence manifest; do not confuse them with the unchanged HEAD tree. All local checks refer to the working-tree candidate, not a new GitHub HEAD.

The only GitHub CI is [seed run 38900697242](https://github.com/Jetnity/jetnity/actions/runs/38900697242), successful for Typecheck/Lint/Build and Auth-Konfiguration on the TASK-only seed. The seed Vercel status is SUCCESS, inspector `2YW6Q3gVsjDHaSx84jNgL546Lr6s`; no independent Preview browser qualification is claimed. **Implementation CI, native full suite, Auth job and Vercel Preview: NOT VERIFIED.**

An exploratory whole-page screenshot (whose capture resets input media to fine pointer) also shows tight/overlapping Workspace mode labels at 320/CSS2. Those unchanged Workspace navigation files are outside this slice; this report makes no whole-Workspace usability PASS. Real account/session variants, physical devices, native browser zoom and integration with #955 remain separate qualifications. No code was changed to address them.

No Auth/DB/SQL/RLS/provider/official-truth/AI/payment/Production or special-gate changes; no new secrets, accounts or running service cost. #917/#944/DEV-PREP-1/#911/#913/#934/#937/#626 gates remain closed as before. No Ready/Merge/follow-on. **STOP for independent Technical Lead and explicit resolution of the native PostgreSQL prerequisite/publication gate.**
