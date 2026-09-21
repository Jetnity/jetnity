# V1 Workspace Usability 1 — Status

Stand: 21. September 2026  
Status: **IMPLEMENTATION IN PROGRESS / DRAFT / NOT READY / NOT MERGED / NOT TL-REVIEWED**

## Arbeitsblock / Ziel

Bounded workspace presentation/navigation repair after accepted visual audit #506 (FINAL **5269760171**, post-merge **5764730610**). Implement only VUX-1, VUX-2, and VUX-4 after instrumented reproduction.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-workspace-usability-1` |
| Issue | #513 |
| Draft PR | #516 |
| Assigned baseline | `main@19a91a2594127eb2b6104b68da69786194e13865` |
| Dispatch / seed | `efacfc9e31d23ce4429e9bf5a7c004a3b70ff591` |
| Agent | **Jetnity V1 workspace usability 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-8a1bf241-3bb4-41f9-8fa1-7f6c5c965bca` |

Exact freeze SHA + CI/Auth/Vercel/thread IDs belong in the final PR comment only.

## Live-main drift (reported, not integrated)

Local `main` / `origin/main` observation at start: `d3d42047ba247ded8d6c584e447db1573b80f19a` (continuity refresh #512). Assigned PR base remains `19a91a25`. This writer did not rebase or merge main. Integrate only at a later TL-selected boundary.

## Bereits umgesetzt

- VUX-2 display helper `etappenZeitraumAnzeigen` (UTC date-only, year on cross-year / single-day / one endpoint; no stored-date mutation)
- VUX-1 compact header/banner/discard presentation; 1024 no longer uses the `lg` two-column hero title
- VUX-4 instrumented before-capture: leftover `scrollY` after overview hide; heading above viewport; first frame can be footer. Compact open now snaps the return control into view
- Before screens under `docs/evidence/v1-workspace-usability-1/screens/before_*`

## Offen

- After screens and after-instrumentation
- Required local typecheck/lint/tests/build/hygiene
- Exact-head CI/Auth/Vercel in the freeze PR comment
- Independent Technical-Lead code + visual/interaction review

## Next step

Finish after-evidence, required local gates, persist HANDOFF/SELF_REVIEW, freeze once, PR comment, **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**. No Ready, merge, or follow-up.
