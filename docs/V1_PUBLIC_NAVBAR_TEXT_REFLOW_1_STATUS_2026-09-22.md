# V1 Public Navbar Text Reflow 1 — Status

Stand: 22. September 2026  
Status: **IN IMPLEMENTATION / DRAFT / NOT READY / NOT MERGED**

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
| Operating mode | NORMAL |
| Parallel | #534 / session `bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da` owns homepage first hero only |
| Integration order | **#534 first, this PR second** — no autonomous main/sibling merge/rebase |

Immediate review fixes must reuse this exact session.

## Short plan

1. Read binding task at seed, standards, PR #512 handoff, current PublicNavbar.
2. Reproduce exact-baseline 1024/200 and 1440/200 navbar overflow with compiled CSS and raw bounds.
3. Apply the smallest presentation/layout change in `components/layout/PublicNavbar.tsx` only.
4. Prove after geometry, menu/focus/short-viewport/touch and controlled synthetic session variants.
5. Run existing navigation/session/guest CTA tests plus typecheck/lint/fulltests/hygiene/build.
6. Freeze once; STOP for independent Technical-Lead review. Do not mark Ready. Do not merge. Do not start a follow-up slice.

## Ownership manifest

| Path | Role |
| --- | --- |
| `components/layout/PublicNavbar.tsx` | exclusive runtime write — presentation/layout/responsive/menu-height only |
| `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_TASK_2026-09-22.md` | binding task (seed) |
| `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_STATUS_2026-09-22.md` | this file |
| `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_HANDOFF_2026-09-22.md` | handoff |
| `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_SELF_REVIEW_2026-09-22.md` | self-review |
| `docs/V1_PUBLIC_NAVBAR_TEXT_REFLOW_1_DECISION_2026-09-22.md` | slice decision |
| `docs/evidence/v1-public-navbar-text-reflow-1/**` | own screens, geometry, assert, audit |

Read-only: `app/(public)/page.tsx`, StartzielForm, GastCreateLink, shared/global styles/tokens, Auth/session/sign-out actions and navigation helpers, GlobalesAbmeldenForm, guest/account/admin/provider runtime, DB/schema/secrets/workflows/packages, #534 evidence (context only).

## Limits

- Simulated oversized text (`html { font-size: 32px }`), not OS zoom, real-device or WCAG certification.
- Controlled local session mocks for unknown/konto; guest uses the real empty-cookie `getSession` path when the client exists.
- No real sign-in/sign-out/account writes. Mutation abort is armed before interaction. Logout is not clicked.
- Navbar-only painted overflow is scored separately from unchanged lower-page overflow.
- Cursor never Ready/merges.
