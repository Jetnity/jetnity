# Admin Mission Control Polish 1

Date: 2026-10-03. Owner: Codex, user-authorized UI-only implementation.
Baseline: `a7ad77743327c01821cf2532ca253a3220c857e8` (`main`).
Branch: `ui/admin-mission-control-polish` in an isolated clone.

## Scope and acceptance

- Compact executive zone on `/admin`; existing trip counts and RLS catalogue near the top.
- Discrete daily trip bars; no smoothing, inferred observations or new source.
- Native keyboard-accessible “Datenqualität & Nachweis” disclosures for verbose provenance.
- Keep unknown, failed, denied, stale, incomplete and process-only attribution visible.
- A scoped “Keine Maßnahmen erforderlich” only for the existing fresh, healthy no-signal insight; never a global all-clear.
- Compact, actionable existing navigation with precise availability labels.
- Calm Copilot planning label, consistent off-white/green tokens and responsive shell.
- No new packages, backend/API/query/schema/auth/RLS/Official Truth changes or provider/model calls.

## File ownership

Only `app/(admin)/admin/page.tsx`, presentation-only shell files, `components/admin/home/`, dedicated presentation tests/audit scripts and this slice's dedicated documents/evidence.
Do not change `lib/readiness/**`, `supabase/**`, API/auth/server data loaders, shared governance/continuity files or any Official Truth document.

PR #774 inspected at `9869062622554b355d6d8e26bd89350608b3090c`: Official Truth same-request proof graph, witness, rule packet, source registry and dedicated documents.
PR #775 inspected at `8627f59e473e43a85a17e2e9e832da30166a1091`: dedicated deterministic extractor architecture documents.
Recheck both changed-file sets before handoff; require zero overlap.

## Plan and verification

1. Preserve existing data acquisition; revise presentation and composition only.
2. Review semantic states, source/freshness limitations, disclosure keyboard operation and daily values with fixtures.
3. Capture actual rendered components with production CSS at mobile/tablet/desktop widths, dark theme and narrow/landscape widths. Fixture evidence is not authenticated production evidence.
4. Run clean dependency install, typecheck, lint, relevant tests, hygiene gates and production build. Record failures/skips honestly.
5. Create Draft PR after implementation and verification. Report exact head, changed files and remaining review limits.

Risks: status overselling, loss of provenance discoverability, responsive overflow. No change to trip graph, API contracts, costs, privileges or database.

STOP: do not mark Ready; do not merge; do not start a follow-up slice. Independent Technical Lead review remains required.
