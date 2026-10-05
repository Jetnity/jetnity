# Integration delta — exact main `c0e32dc` into #536

Date: 2026-09-22  
Agent: **Jetnity V1 public navbar text reflow 1**, Generation 1  
Session: `bc-27f8ce53-e09e-43d6-9778-7a131c6cdec4`

| Item | SHA / blob |
| --- | --- |
| Authorized / live main at merge | `c0e32dc34b4e762f5396782c341624e7dee9c4fe` |
| Previous navbar freeze | `05037863815068eaf8b35c02550c67ee54fd1645` |
| Merge commit (once, no rebase) | `757522f96930811628b0f776609898b1b906026f` |
| PublicNavbar blob before = after | `6779bcea6e8612610600fcbcb4ecc61e1afbfdea` |
| `app/(public)/page.tsx` from main only | `bc272ae9f82f591ea4c4b7540796e7652f6c2e19` |
| Main drift after merge | none — re-fetched `origin/main` still `c0e32dc` |

No homepage hero file was edited on this branch. Navbar runtime is identical to the frozen `05037863` source. Representative coexistence proof: `audit-integrated.json` + `screens/integrated_*`.

## Coexistence assertions (`AUDIT_PHASE=integrated` PASS)

- Navbar H/V offenders 0 on 360/390/1024/1440 at 100% and 200%, including 1024/1440 gast/konto/unbekannt.
- Hero text „Deine ganze Reise. Einfach an einem Ort.“ is painted below the header on every representative scene.
- 1024/100% keeps a single-row 73px navbar over the #534 single-column hero.
- 1024/200% wraps the navbar (header 217) without clipping the hero.
- Menu open + Escape-focus + abort at 360×800 and 390×600, 100% and 200%: attempts 1 / aborted 1 / completed unexpected 0. Logout not clicked.

Local gates after the merge, before this freeze commit: typecheck PASS; lint 0 errors / 139 pre-existing warnings; `npm test` 3716/3716; dead/exports/deps/api-schutz/schema-bezug/operating-mode PASS; production build PASS.

Do not merge a later main. If `origin/main` leaves `c0e32dc`, stop and report drift.
