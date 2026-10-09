# Contextual Editing UX 1 — implementation plan

Issue #907 / Draft #909; Generation 1. Immutable TASK blob `e3c0c4b4c37663f4269fae282bfea24f12e1ad01` verified against local Git and GitHub. Fresh fetch: main `2ee48bcd40ba9c056898474a2eab87d0ce0d91ca`, branch seed `c3004bc159bc86a7eb25b741cc0aab49344c63c8`, one ahead / zero behind, mode NORMAL. #751 live index supersedes historical dated startup blocks. #748 last material receipt remains 6036558748. Open relevant drafts #909 and #910 have disjoint ownership; historical #52/#50/#40/#39/#28 are not active dependencies. Production deployment `dpl_F6QKcedweYZcSBxt845bvT2zqzd2` re-read READY on exact main, alias jetnity.com, aliasError null. Seed CI is historical preparation evidence only.

## Design and component map

`GastArbeitsbereich` / `KontoArbeitsbereich` supply `ReiseAenderung` to `TripWorkspace`. The Workspace owns the entry trigger, four modes, hidden/inert wrapper and Escape. `ReiseAenderung` owns direct/free-text selection. `ReiseAenderungManuell` owns ephemeral draft, generation, authoritative preview/save/readback and uncertainty. `ReiseAenderungAuswirkungen` presents the existing complete impact projection, 20 rows per page. These domain/save functions and source wrappers remain frozen.

The baseline was measured on the real local production Guest route, synthetic graph only, at 360/390/768/1024/1440 and 100/200% text. The seed independent focus effects used document scrollIntoView and displaced the edit entry below sticky bands. The seed form was one continuous block above the selected Workspace content.

Selected solution: one native modal dialog, focused full-width surface on phones and contextual two-column presentation on desktop. A stored trip summary and the current Workspace location remain explicit; the underlying four-mode selection is preserved. Three progressive editing groups retain one draft. Actions remain in normal flow, with no additional sticky navigation or fixed footer. Native modal inertness isolates background actions and keyboard focus; cancel and successful return restore the initiating trigger and document scroll. A task-local context exposes the return action without altering source callbacks or persistence.

Alternatives: keeping a long inline accordion would still move the saved workspace and mix editing with unrelated navigation; a new route would complicate browser history, session ownership and refresh contracts. A custom focus-trap sheet would duplicate native dialog semantics. The native surface provides a single scroll owner and reliable modality with no dependency.

## Execution

1. Baseline browser screenshots/geometry and reproduction; retain explicit failures and limits.
2. Implement surface, stored context, progressive groups, draft indicators, reachable controls, validation focus and complete paginated preview.
3. Browser proofs: all viewports/text sizes, keyboard, cancel/Back, focus, safe-area CSS, reduced motion, pending/uncertain isolation and 1000 items.
4. Replay #905 Guest and actual local GoTrue/PostgREST/RLS/RPC proof with only UI-navigation adaptations. Replay #903 and existing timeline/navigation audits. Preserve all graph, identity, booking, Preparation, stale and retry assertions.
5. Full Linux PostgreSQL/Node suite, Typecheck/Lint/Build/hygiene; sanitized fingerprints and all A01–A27 results, self-review and handoff. Commit/push only assigned branch, exact-head CI/Auth/Preview. Stop for independent TL review.

## Ownership, risks and gates

SINGLE_AGENT: the UI state/focus changes are tightly coupled; independent TL remains separate. No additional writer or branch. Parallel #908 owns Official Truth and is not a dependency. Only allowed TripWorkspace/ReiseAenderung UI, presentation helpers, targeted UI tests and task-owned scripts/docs/evidence change. No package/lock, globals, data schema, serialization, migrations, Auth/RLS, API/provider or storage changes. No hosted data write, new costs or service. Risk focus/history and stale refresh is tested through actual production components. No physical-device or screen-reader execution is inferred from emulation. No user screenshot pixels were supplied in this session; the TASK records their description, and reproducible baseline screenshots are captured independently.

Differentiation: make existing connected change impact usable at phone widths while preserving the one-trip authoritative graph and explicit user control. No new trip capability or truth class.
