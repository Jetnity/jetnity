# V1 Homepage Tablet Hero Fit 1 — Binding Task
Agent: **Jetnity V1 homepage tablet hero fit 1**, Generation 1
Branch: `fix/v1-homepage-tablet-hero-fit-1`
Tracking: #533
Baseline main: **e818c13ed009932bc06be1382a89467866699995**.
Live main CI35655738463/Auth106518836056/TLB106518836237 previously independently verified; direct Production dpl_Eb4CESWbsphdcTtm3ZQPiUvu3YVU READY exact main/aliasError null re-read at dispatch. NORMAL, strict active Ruleset21875372/no bypass. PR512 foreground handoff5768150816. #531 AG-R1 and #532 GP-R1/R2 are active review-fix loops, not accepted merges.

## Goal and accepted evidence
Implement only accepted #506 **VUX-8**, TL FINAL review5269760171 and closure5764730610: P3 decorative breakpoint polish. The decorative itinerary card is squeezed at1024×768; 'Bali · 14 Tage' wraps narrowly and descriptive tags truncate. TL independently reopened original home_initial_1024.png and current homepage source during planning. The hero currently introduces a650px-first-column two-column grid and decorative card at lg, leaving too little room for the card.
This is a bounded responsive fix, not issue110's multi-destination intent or a homepage redesign. VUX-6 mandatory next-section peek was rejected and must not be implemented.

## Scope / exclusive ownership
Runtime: **app/(public)/page.tsx only**, the first hero's responsive grid, content-width treatment and decorative itinerary wrapper. Use existing Tailwind tokens/breakpoints. Prefer a small coordinated breakpoint/visibility adjustment; simply hiding the card while retaining a wasted second column is not enough. Maintain an appropriate readable width for primary copy/form when the decorative card is absent.
Own docs/V1_HOMEPAGE_TABLET_HERO_FIT_1_{TASK,STATUS,HANDOFF,SELF_REVIEW,DECISION}_2026-09-21.md and docs/evidence/v1-homepage-tablet-hero-fit-1/**; optional own capture script under that evidence directory.
All other homepage sections, copy/claims, images/branding, metadata/structured data, StartzielForm, GastCreateLink, navbar, shared layout/styles/tokens, guest storage/create/account/admin/provider/DB/Auth and package/workflows are read-only. Do not change TripPlanner/Reiseidee/PlanenCreateGate or sibling-owned files. If required ownership expansion emerges, report the exact cause and smallest change before editing.

## Acceptance
1. Reproduce the existing1024px squeeze on exact baseline with compiled product CSS and measured hero/card/title/tag geometry. Reuse #506 for historical context, not as current before proof. No general visual audit.
2. At1024×768 and intermediate widths (including just below/above the chosen display breakpoint), the decorative card is either absent with no empty grid column, or sufficiently sized to keep its intended content readable. No content offscreen, overflow-hidden masking, font-size reduction to defeat200% text, or replacing actual content with shorter fake labels.
3. At1440/1920 normal text, retain the existing useful branded two-column composition and decorative card. At360/390/768 retain current primary headline/destination/CTA usefulness; no new mandatory hero-height/next-section-peek target.
4. Existing destination input and planning CTA keep exact routing/prefill/guest semantics. Keyboard focus and touch targets stay usable. No provider/model call or real data write.
5. At representative1024/1440 with html font-size32px, inspect actual output and record viewport/document/hero/card bounds. Keep required content readable; decorative visibility may adapt if justified. Clearly label text simulation, not OS zoom/device certification.
6. Before/after exact images at1024 plus selected after widths; viewport-sized and full-page/hero evidence, not only a locator crop that silently exceeds the viewport. Include assertions for the changed hero's geometry and no newly introduced document overflow; separate any untouched pre-existing lower-page issue.
7. No implementation-mirroring class-string tests. Existing relevant semantic tests plus real browser geometry/interaction evidence are sufficient for this presentation-only edit. Run required typecheck/lint/tests/hygiene/build and fresh exact-head CI/Auth/direct Preview.

## Evidence / safety
Capture provenance: exact source SHA/tree, dirty paths, UTC time, browser/version, viewport, route, state/actions, geometry, actual image inspection. Use synthetic disposable guest state only. Abort unexpected mutations INCLUDING same-route server actions before interactions; block model/provider/API calls; distinguish attempted/aborted/completed. A zero count does not prove an observed POST interception. No actual account/provider/model writes. Capture local synthetic browser proof honestly; not authenticated Preview/hardware/Safari/WCAG proof.
Own STATUS/HANDOFF/SELF_REVIEW/DECISION, changed-path manifest, before/after comparison, limitations and next owner required. Keep old evidence immutable, place new bounded proof in own directory. Freeze substantive source/docs once; final head/main/ahead-behind/CI/Auth/direct Preview/threads and session in PR STOP receipt rather than endless bookkeeping commits.

## Multi-Agent Suitability
Mode NORMAL; no special PO-gate crossing. **MULTI_AGENT across disjoint PRs; SINGLE_AGENT within this small presentation slice.**
Existing account #531 owns account read-boundary files; guest #532 owns storage/create components and tests. This task owns only the homepage hero and its own evidence. No shared runtime write file, new shared contract or dependency on unmerged sibling code. Admin remains separate, first read-only analyst #518 already complete. No duplicated audit or agent.
Integration remains central TL: account531 first, guest532 next, this presentation task after required reviewed main integrations. If another current handoff changes order, latest explicit TL boundary wins. Do not autonomously merge/rebase main/siblings; report drift. Extra writers within one tiny homepage edit add collision risk.

## Binding workflow and gates
Read live main START_HERE, AGENTS, operating mode, TL/Cursor standard, Multi-Agent standards, vision/design/product/continuity, build order, latest PR512 handoffs and accepted506 TL dispositions. Live evidence wins. Small concrete plan in own STATUS before implementation. Use **Cursor Grok4.6HighFast / originalModelName cursor-grok-4.6-high-fast**, no Auto/substitute; record actual model/session, exact logical name, Generation1. UI rename only if supported and actually performed. Existing531/532 review-fix sessions must not be reused for this different new slice.
No global continuity edit, dependency/lockfile/workflow change, public launch/SEO activation, DB/migration/SQL/Auth/RLS/secret, real provider/model/payment call or new cost. Guardian is separate PO app; no Guardian via Cursor. TL reassesses Guardian only on material risk, not required for this bounded presentation scope.
**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE / VISUAL / INTERACTION REVIEW. Do not mark Ready. Do not merge. Do not start a follow-up slice.** Only TL can integrate after independent exact-head gates and must verify main CI/Auth/direct Production. Immediate fixes reuse this exact new session.
