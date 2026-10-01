# Preparation Premium Experience 5 — TASK

Stand: 1 Oct 2026
Issue: #664
Branch: feat/preparation-premium-experience-5
Baseline: main@2530020dbc6797b17d64c064ca5474cf90804272

## Goal
Refine preparation/readiness presentation only. Preserve all traveller, readiness and official-truth semantics.

## Primary runtime ownership
- components/trips/Reisevorbereitung.tsx
- optional pure presentation helper under lib/readiness/preparation-premium-experience-5*
- focused tests
- audit/evidence/docs for this slice

Do not edit TripWorkspace.tsx, TripWorkspacePlan.tsx, TripWorkspaceDetail.tsx, TripWorkspaceDomainNavigation.tsx, or domain search components while parallel slices are active.

## Product requirements

### Overview
- keep “Einreise & Reisevorbereitung” and current truthful counts;
- make the summary easier to scan;
- reduce duplicated unavailable/unknown copy without removing fail-closed warnings;
- retain the disclaimer that a checkmark is not an official visa/entry confirmation;
- keep individual-claims and unknown-country warnings truthful.

### Structured open workspace
Replace the feeling of one endless form with clear existing sections:
1. Reisende & Dokumente
2. Offizielle Anforderungen
3. Tickets & Buchungsbestätigungen
4. Eigene Vorbereitung

Use native/predictable progressive disclosure. No hidden blocking information.

### Saved traveller import
- compact traveller summary cards;
- preserve residence/citizenship/document truth;
- keep “In diese Reise übernehmen” semantics;
- no merge/inference of travellers.

### Trip traveller editing
- compact traveller header/summary first;
- explicit disclosure or edit action for citizenship, residence and documents;
- multiple citizenships/documents remain fully supported;
- do not infer primary/default citizenship/document;
- preserve document↔citizenship bindings;
- no passport numbers, birth dates, health or other sensitive fields;
- preserve validation, save and delete contracts.

### Official requirements
- preserve every exact OfficialEvaluation and fail-closed status;
- compact duplicate placeholder presentation only where existing presentation contracts already allow it;
- current/stale/recheck/evidence-bearing entries remain individually visible;
- no “officially checked” claim without current trusted evidence;
- preserve timing, authority, freshness and external action links.

### Tickets / personal preparation
- make sections easier to scan and reach;
- preserve status controls (open/done/skipped), remove semantics, and personal-preparation add flow.

## Mobile-first
Test 360x800 and 390x844 first.
Then 768x1024, 1024x768, 1440x900, 1920x1080.
200% text at 360.
No horizontal page overflow.
>=44px controls.
Compact device form controls >=16px.
Focus visible and logical.
Reduced motion respected.

## Functional regression
Verify:
- opening/closing preparation;
- saved traveller import trigger unchanged;
- traveller save/remove unchanged;
- adding/removing citizenship/document UI contracts unchanged;
- official requirements remain lossless/fail-closed;
- status controls and personal preparation add/remove unchanged;
- no provider/model call on first paint;
- no new network behavior caused by presentation;
- Back/Forward/reload of Vorbereitung mode remains governed by existing workspace shell.

## Tests/gates
Run focused traveller/readiness UI tests, existing official checklist tests, full npm test, typecheck, lint, build, setup/dead/exports/deps/api/schema/operating-mode checks, production-like browser audit, exact-head GitHub CI/Auth, exact-head Vercel Preview.

If main moves, integrate current main into this same branch/session, confirm 0 behind, rerun gates.

## Hard boundaries
No readiness/provider engine changes.
No schema/data model.
No Auth/Supabase/RLS.
No payment/provider activation.
No package changes.
No #626.
No legal/privacy text rewrite.
No tracking.
No indexing/robots/launch.
No Production config.
No navbar/footer/favicon/homepage.

Required model: Grok 4.7 High Fast, not Auto.
Stay Draft. No Ready. No merge. No follow-up slice.
STOP for independent TL code + visual + mobile + truth review.
