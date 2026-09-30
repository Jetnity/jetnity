# Planning Entry Premium Experience 7 — Report

Stand: 1 October 2026
Status: **R1-F1 APPLIED — ACTIVE_WORK_STATUS RESTORED — NEW EXACT-HEAD GATES PENDING — NOT A PASS — DRAFT — NOT MERGED**

## 1. Identity

- Logical agent: **Jetnity Planning Entry premium experience 7**, Generation 1.
- Session: https://cursor.com/agents/bc-02875182-8c02-42e9-8ec9-2eb2b9d3a621
- `originalModelName=grok-4.7-high-fast`. Not Auto.
- Issue #668. Draft PR #669. Branch `feat/planning-entry-premium-experience-7`.
- Baseline `main@2530020dbc6797b17d64c064ca5474cf90804272`. Re-fetched in this session; `origin/main` was still that SHA. No integration was required.
- Runtime audit head: `be627ffaea252f07f00ded033c8a9796f38da183`. External CI, Auth, and Vercel were read on the evidence head `fa3c9be531bab70ff5fdef1aeab342e09ce5bb84`, which adds evidence and docs only.

## 2. What changed

`/planen` is one creation journey with two visible paths.

- The free-description path stays first. Its card is marked “Intelligente Planung”. Examples are labeled as field shortcuts. “Entwurf erstellen” is still the only model submit. The preview-before-save sentence is unchanged.
- The manual path stays complete. A second card, “Schritt für Schritt planen”, only scrolls and focuses `#manuell-planen`. A compact return link focuses `#reise-beschreiben`. Neither link submits, stores, or calls a model. Hash updates use `replaceState`, so Back/Forward length stays stable.
- Manual fields are grouped as Route & Ziele, Zeitraum, Reisende & Budget, and Wünsche. Field ids, validation, reorder, remove, and the “Reise erstellen” submit are unchanged. Additional destinations still do not invent stay or route truth.
- Below 1280px the dark guide is hidden. A compact sentence in the manual form says the form works without intelligent planning and both paths create the same trip. From 1280px that sentence also sits in a supporting side panel with bounded sticky behavior under the public header.

No Trip Workspace, preparation, organize, navbar, footer, favicon, homepage, package, schema, Auth, or provider file was edited.

## 3. Local gates

Recorded on the runtime head before the evidence commit:

| Check | Result |
| --- | --- |
| `npm test` | 4108 pass, 0 fail |
| `npx eslint .` | 0 errors, 149 pre-existing warnings |
| `check:dead` | 0 orphan |
| `check:exports` | 0 unused export |
| `check:deps` | 0 unused package |
| `check:api-schutz` | 12 admin routes pass |
| `check:schema-bezug` | pass, with the existing LOCAL/UNAPPLIED note for `admin_account_counts_v1` |
| `check:operating-mode` | PASS |
| `npm run typecheck` | pass |
| `npm run build` | pass. `check:setup` warned that no `.env` file is present. That warning is environmental. |

## 4. Browser audit

`node scripts/planning-entry-premium-experience-7-audit.mjs` against `next start` on port 3017. `JETNITY_MODELL_AKTIV=false`. Place search was fulfilled in the browser with two local fixtures. Result: **bestanden true**, zero findings.

Viewports with page overflow 0, no element overflow, no target under 44px, and input font at least 16px:

320x568, 360x800, 375x812, 390x844, 412x915, 430x932, 768x1024, 820x1180, 1024x768, 1280x800, 1440x900, 1728x1117, 1920x1080, landscape 844x390, landscape 812x375, 360x800 at 32px root font, 1440x900 at CSS zoom 1.25 and 1.5.

The guide is `display:none` below 1280 and `display:block` from 1280, including both zoom scenes.

Interaction on 390x844:

- Thailand example filled the textarea and caused 0 writes. “Reise übernehmen” count was 0.
- Manual link set hash `#manuell-planen`, focused `manuell-planen`, and left `history.length` at 2.
- Return link set hash `#reise-beschreiben` and focused `reise-beschreiben`. Navigation writes stayed 0.
- Empty “Reise erstellen” focused `#feld-ziel` with “Bitte wähle ein Reiseziel aus der Liste.” and caused 0 writes.
- Japan then Rom were selected from the local place fixture. Moving the extra destination up swapped the fields to Rom / Japan. Remove left 0 extra fields. Reorder writes stayed 0.
- “Entwurf erstellen” caused exactly 1 write. The returned message was that intelligent planning is not approved in this environment. Preview count stayed 0. No external model host was called.

Other proofs:

- Canonical on `/planen`, the prefill URL, and the conflicting `zielIds`+`zielId` URL is `https://jetnity.com/planen`.
- Prefill put “Sieben Tage Lissabon” in the description and “Lissabon” in the destination field. Robots on that URL are `noindex, nofollow`.
- The conflicting handoff shows “Diese Route konnte nicht übernommen werden.” and the existing mixed-route message. The create forms are not shown.
- A synthetic guest draft shows “Du hast bereits eine Reise.” and “Reise fortsetzen”. “Entwurf erstellen” count is 0.
- This production server has no indexing environment, so the base page is also `noindex, nofollow` through the existing `htmlRobots()` path. That is environment fail-closed behavior, not a robots edit.

Signed-in browser proof was not available. The account and guest storage sentences remain in source.

Evidence: `docs/evidence/planning-entry-premium-experience-7/`.

## 5. Boundaries

No schema, Auth, Supabase, payment, package, tracking, legal rewrite, indexing change, or new model call. #626 was not touched. Cursor does not Ready or merge and does not start a follow-up slice.

## 5b. Exact-head CI, Auth, and Vercel

Read after the evidence push, on `fa3c9be531bab70ff5fdef1aeab342e09ce5bb84`. Combined commit status **success**. PR #669 was still Draft.

| Gate | Result |
| --- | --- |
| Actions run `36787355819` | success |
| Auth-Konfiguration gegen config.toml, job `110131852466` | success, completed `2026-09-30T22:45:39Z` |
| Typecheck, Lint & Build, job `110131852662` | success, completed `2026-09-30T22:47:35Z` |
| Vercel commit status | success, “Deployment has completed”, updated `2026-09-30T22:45:33Z` |
| Vercel inspector | `https://vercel.com/jetnity-e1b93c82/jetnity-app/8AgZPAcv9eEFXmJuiHkLBPf4T42R` |
| Vercel preview alias | `https://jetnity-app-git-feat-planning-entry-pre-dd05c8-jetnity-e1b93c82.vercel.app` |
| Vercel Preview Comments check `110131970435` | success |

The Vercel bot comment on that SHA says Ready and `DEPLOYED`. This session did not open the preview in a browser after that comment. A docs-only receipt after `fa3c9be5` is not a new runtime gate.

## 5c. R1-F1 — global continuity collision

Technical-Lead review on `fa3c9be531bab70ff5fdef1aeab342e09ce5bb84` required every #669 change in `docs/ACTIVE_WORK_STATUS.md` to be reverted. The file now matches `main@2530020dbc6797b17d64c064ca5474cf90804272`. Fetched `origin/main` is that SHA, and this branch is 0 behind. Slice task, report, handoff, self-review, status and evidence stay. Runtime files are unchanged. The `fa3c9be5` CI, Auth and Vercel results above are historical and do not gate the correction head.

## 6. Residuals for the Technical Lead

- New GitHub CI, Auth and exact-head Vercel Preview READY on the R1 correction head are still to be recorded. Re-read them on that head.
- The side panel still contains the pre-existing line “Später begleiten dich Live-Hinweise und wichtige Erinnerungen.” This slice did not rewrite that future-tense sentence. If live hints are not yet a user promise, a later copy pass should soften it.
- `html` scroll-padding and the section `scroll-mt` both offset the focused manual region, so it lands lower than a single header height. The heading stays below the sticky header. Tightening that landing is separate from this contract.
- The audit is headless Chromium, not a physical phone.
