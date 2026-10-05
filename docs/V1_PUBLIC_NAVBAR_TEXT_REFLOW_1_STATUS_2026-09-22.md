# V1 Public Navbar Text Reflow 1 — Status

Stand: 22. September 2026  
Status: **FROZEN AFTER AUTHORIZED MAIN INTEGRATION / DRAFT / NOT READY / NOT MERGED**

## Authorized main integration — same session

#534 is TL-merged. This writer merged exact main **once** (not rebase). No later main/sibling.

| Item | Value |
| --- | --- |
| Authorized / live main | `c0e32dc34b4e762f5396782c341624e7dee9c4fe` |
| Previous freeze | `05037863815068eaf8b35c02550c67ee54fd1645` |
| Merge commit | `757522f96930811628b0f776609898b1b906026f` |
| PublicNavbar blob | `6779bcea` — identical to `05037863` |
| `page.tsx` | `bc272ae9` — from main only, not edited here |
| Main drift | none at merge and at evidence capture |
| Coexistence proof | `docs/evidence/v1-public-navbar-text-reflow-1/audit-integrated.json` — assert integrated PASS |

Integrated 360/390 menu+focus 100%/200% and 1024/1440 gast/konto/unbekannt: navbar H/V offenders 0, hero painted below header, completed unexpected mutations 0. Exact new STOP SHA/CI/Preview belong in the PR receipt.

## Integrated coexistence (compiled CSS, Chromium 140.0.7339.16, after exact `c0e32dc`)

Source: `audit-integrated.json` captured on merge `757522f9`. `assert.mjs` `AUDIT_PHASE=integrated` PASS.

| Scene | headerH | doc overflowX | navbar H/V | Hero below header |
| --- | ---: | ---: | ---: | --- |
| 360/100 gast | 73 | 0 | 0 / 0 | yes — „Deine ganze Reise…“ |
| 360/200 gast | 225 | 0 | 0 / 0 | yes |
| 390/100 gast | 73 | 0 | 0 / 0 | yes |
| 390/200 gast | 121 | 0 | 0 / 0 | yes |
| 1024/100 gast | 73 | 0 | 0 / 0 | yes — single-row navbar + #534 single-column hero |
| 1024/200 gast / konto / unbekannt | 217 | 0 | 0 / 0 | yes — wrapped navbar |
| 1440/100 gast | 73 | 0 | 0 / 0 | yes |
| 1440/200 gast / konto | 217 | 0 | 0 / 0 | yes |
| 1440/200 unbekannt | 121 | 0 | 0 / 0 | yes — fewer session controls, still no overflow |

Menu/Escape/abort at 360×800 and 390×600, 100% and 200%: open `aria-expanded=true`, Escape returns focus, abort probe attempts 1 / aborted 1 / completed unexpected 0. Logout was not clicked.

## Acknowledgement

New bounded task and session, not a reuse of completed #532 or ongoing #534.

| Item | Value |
| --- | --- |
| Agent | **Jetnity V1 public navbar text reflow 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) — no Auto/substitute |
| Session | `bc-27f8ce53-e09e-43d6-9778-7a131c6cdec4` |
| Issue / Draft PR | #535 / #536 |
| Branch | `fix/v1-public-navbar-text-reflow-1` |
| Seed | `76ae4abd1a2adcf15c21757252de1afbcf8a3680` |
| Assigned baseline | `d89ed0b01070e47f93918fa64126ff0aeb18a17b` |
| Product/runtime source | `components/layout/PublicNavbar.tsx` only |
| Operating mode | NORMAL |
| Parallel | #534 / `bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da` owns homepage first hero |
| Integration order | **#534 first, this PR second** — no autonomous main/sibling merge/rebase |

Immediate review fixes must reuse this exact session. Exact final SHA, ahead/behind, CI, Auth, direct Preview and threads are in the PR STOP receipt so a later bookkeeping commit is not required.

## Ownership manifest

| Path | Role |
| --- | --- |
| `components/layout/PublicNavbar.tsx` | exclusive runtime write — presentation/layout/responsive/menu-height only |
| `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_{TASK,STATUS,HANDOFF,SELF_REVIEW,DECISION}_2026-09-22.md` | own docs |
| `docs/evidence/v1-public-navbar-text-reflow-1/**` | own screens, geometry, assert, audit |

Read-only: homepage first hero, StartzielForm, GastCreateLink, shared/global CSS/tokens, Auth/session/sign-out helpers and actions, GlobalesAbmeldenForm, guest/account/admin/provider runtime, DB/schema/secrets/workflows/packages.

## What changed

Natural `min-h-[72px]` wrapping row, `min-w-0` / `whitespace-normal` on desktop clusters, header `max-h-dvh flex-col`, mobile menu `min-h-0 flex-1 overflow-y-auto`. `md` breakpoint, routes, labels, session classification, `GastCreateLink`, sign-out form, Escape/inert/focus, sticky and safe areas unchanged.

## Before (compiled CSS, Chromium 140.0.7339.16, `html { font-size: 32px }`)

Source: unmodified PublicNavbar on seed `76ae4abd` / baseline `d89ed0b0`.

| Scene | Navbar painted overflow | Raw bound |
| --- | --- | --- |
| 1024×768 / 200% gast | horizontal **1** + vertical **4** | `Reise planen` right **1171.88** / overflowX **147.88**; row height **72**; CTA height **120** |
| 1440×900 / 200% gast | horizontal **0** + vertical **4** | CTA bottom **96** vs header **73**; logo height **88** |
| Document overflowX at 1024/200% | **148** | equals the navbar CTA, not a later-hero-only number |

Konto mock on the first before pass was overwritten by `getSession` and is labelled as such in `audit-before.json`. After evidence uses a held mock.

## After (same simulation, assert.mjs PASS)

| Scene | headerH | document overflowX | navbar H/V offenders | Visible |
| --- | --- | --- | --- | --- |
| 1024/200% gast | 217 | **0** | **0 / 0** | Entdecken, Meine Reisen, Jetnity Pro, Anmelden, Reise planen |
| 1440/200% gast | 217 | 0 | 0 / 0 | same |
| 1024/200% konto | 217 | 0 | 0 / 0 | Konto, Abmelden, Reise planen |
| 1440/200% konto | 217 | 0 | 0 / 0 | Konto, Abmelden, Reise planen |
| 1024/200% unbekannt | 217 | 0 | 0 / 0 | no Anmelden/Konto/Abmelden |
| 360/390/767 100% | 73 | 0 | 0 / 0 | hamburger |
| 768/769/1024/1440/1920 100% | 73 | 0 | 0 / 0 | desktop bar + CTA |
| 360/200% | 225 | 0 | 0 / 0 | logo + hamburger stacked, both fully on-screen |
| 390/200% | 121 | 0 | 0 / 0 | logo + hamburger one row |

360/200% stacking is accepted simulated-text composition, not clipping.

## Interactions

390×600 100% and 200%, plus 390×844/200% konto:

- open: `aria-expanded=true`, menu not hidden, not inert
- Escape returns focus to `Menü öffnen`
- `/#entdecken` closes the menu
- controlled `POST /` probe: attempts **1**, aborted **1**, completed unexpected **0**
- Logout was not clicked

Guest uses the real empty-cookie `getSession` path. unknown/konto are controlled local React-state mocks of the real PublicNavbar, labelled in the audit JSON. No credentials or account writes.

## Local gates

- typecheck PASS
- lint 0 errors (pre-existing warnings only)
- `npm test` **3716 / 3716**
- existing navbar/session/guest CTA tests PASS
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` / `check:operating-mode` PASS
- production build PASS
- `assert.mjs` before PASS / after PASS / integrated PASS
- Post-`c0e32dc` merge re-run: typecheck PASS; lint 0 errors / 139 pre-existing warnings; `npm test` **3716 / 3716**; hygiene + operating-mode PASS; production build PASS

## Limits

- Simulated 32px root, not OS zoom / Safari / hardware / WCAG certification.
- Later decorative homepage overflow is unowned. After this fix, 1024/200% document overflowX is 0 because the previous 148px was the navbar CTA.
- Authorized exact-main merge is done. Do not merge/rebase a later main or sibling. Report drift if live main leaves `c0e32dc`.
- Cursor does not mark Ready, merge, or start a follow-up slice.
