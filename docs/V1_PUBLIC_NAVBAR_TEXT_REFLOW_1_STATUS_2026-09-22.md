# V1 Public Navbar Text Reflow 1 — Status

Stand: 22. September 2026  
Status: **FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / DRAFT / NOT READY / NOT MERGED**

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
- `assert.mjs` before PASS / after PASS

## Limits

- Simulated 32px root, not OS zoom / Safari / hardware / WCAG certification.
- Later decorative homepage overflow is unowned. After this fix, 1024/200% document overflowX is 0 because the previous 148px was the navbar CTA.
- TL must still integrate #534 first, then this PR, then refresh header/hero/menu on exact main.
- Cursor does not mark Ready, merge, or start a follow-up slice.
