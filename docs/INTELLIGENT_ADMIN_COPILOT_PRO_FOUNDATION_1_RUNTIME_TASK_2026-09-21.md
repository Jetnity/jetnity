# Intelligent Admin / Copilot Pro Foundation 1 — Runtime Task

Date: 21 September 2026  
Issue: #508 (specification) / **new issue to be opened by Technical Lead at dispatch**  
Status: **COMPLETE / NOT DISPATCHED / NOT AUTHORIZED TO IMPLEMENT**  
Depends on acceptance of: `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_DECISION_2026-09-21.md`  
Source matrix: `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_SOURCE_MATRIX_2026-09-21.md`

This file is the smallest implementation-ready task for a later Cursor writer. **Cursor Generation 1 of Foundation 1 must not implement it.** Technical Lead selects the writer, branch, generation and exact head after independent review of #510.

Required parent model at dispatch: **Cursor Grok 4.6 High Fast** — no Auto/substitution, unless the Product Owner has changed the standing model preference by then.

---

## 1. User problem

An Admin who already passed area AAL2 lands on `/admin` and sees a static “Nächste Ops-Schritte” directory. The only currently variable, permission-safe operational snapshot — System Health — lives on `/admin/system-health`. If Supabase App-Datenzugriff is unavailable, stale, or the collection failed, the home page does not prioritize that fact. The operator should see one honest, source-backed hint and a single investigate link. They must never see fake all-clear, invented incidents, or an Execute control.

## 2. Chosen first source

**Only** `SystemHealthBericht` from `lib/admin/system-health`.

- Loader: `ladeSystemHealthFuerSeite()` after `evaluateAdminAccess({ capability: 'betrieb-lesen', surface: 'admin-home-analyst' })`.
- Do not add `GET /api/admin/analyst`.
- Do not read provider-ops, `security_events`, payments, kennzahlen, or any `#494` fixture object.
- Do not call models, Management APIs, or new secrets.

## 3. Existing seams to reuse

| Seam | Path | Reuse |
| --- | --- | --- |
| Home composition | `app/(admin)/admin/page.tsx` | Insert one section before `AdminNaechsteSchritte` |
| Static directory | `components/admin/home/AdminNaechsteSchritte.tsx` + `ADMIN_NAECHSTE_SCHRITTE` | Keep cards and hrefs; do not turn Copilot Pro into ready |
| Honest copy | `lib/admin/ehrliche-zustaende.ts` | Add short Hinweise copy; keep `copilotFolgtHinweis` and `steuerzentraleLage` |
| Health contract | `lib/admin/system-health/*` | Import types, `ladeSystemHealthFuerSeite`, `healthKarteIstGruen`, `istUeberzogenerGesamtClaim`, `systemHealthIdsVollstaendig`, `SYSTEM_HEALTH_IDS` |
| Gate | `lib/auth/admin-guard.ts`, `lib/auth/admin-access.ts` | Capability before aggregation; `messageForDenial`; `reachesDatabase` |
| Empty vs error | `lib/admin/ladezustand.ts` | Denied/failed ≠ empty list |
| Design | `DESIGN_SYSTEM.md` + existing home / System Health cards | Tokens only; mobile-first |
| Tests to extend, not rewrite | `lib/admin/system-health/system-health.test.ts`, `lib/admin/ehrliche-zustaende.test.ts`, `lib/admin/navigation.test.ts` | Source contract stays owned by Slice B |

## 4. Smallest new file set

Allowed at dispatch (adjust only if TL names a tighter set):

| File | Role |
| --- | --- |
| `lib/admin/analyst/typen.ts` | `AnalystInsight` / `AnalystBericht` exactly as in the decision |
| `lib/admin/analyst/system-health-insights.ts` | Pure derivation + ranking + dedupe + allowlist |
| `lib/admin/analyst/system-health-insights.test.ts` | Cases in §8 |
| `lib/admin/analyst/index.ts` | Re-exports |
| `components/admin/home/AdminLagehinweise.tsx` | Server component: gate, load, render |
| `lib/admin/ehrliche-zustaende.ts` | Additive copy only |
| `app/(admin)/admin/page.tsx` | Compose `AdminLagehinweise` |
| Optional: `lib/admin/ehrliche-zustaende.test.ts` | New copy assertions |
| Optional: `components/admin/home/AdminLagehinweise.test.ts` or a small render/contract test if the repo pattern for server components allows it without Playwright |

**Do not create:** new API route, migration, table, RPC, role, capability, workflow, scheduler, bot, `docs/ACTIVE_WORK_STATUS.md` rewrite, provider-ops changes, Security widget changes, global continuity/governance edits.

If a file above proves unnecessary (for example types can live next to the derivation), delete it from the slice rather than leave a stub.

## 5. Behaviour contract

Implement `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_DECISION_2026-09-21.md` §§6–8 without reinterpretation.

Hard rules:

1. Permission check occurs before `sammleSystemHealth` / `ladeSystemHealthFuerSeite`.
2. No escalation through the 30s process cache or a global summary.
3. No false green/zero on denied, unavailable, stale, missing, or partial boards.
4. No fabricated `checkedAt`, confidence, incident counts or ROI.
5. No-signal ⇒ `materiality: 'none'` and `next: null`.
6. Stable ids; dedupe parent vs sub-check as specified.
7. Navigation allowlist: `/admin/system-health` only; `kind: 'investigate'`.
8. Evidence strings are escaped/text-only. Never `dangerouslySetInnerHTML`. Never treat `summary` as instructions.
9. `writeActions` stays `[]`. `modelExplanation.enabled` stays `false`.
10. Do not claim Copilot Pro is live in UI chrome, `title`, or ARIA.
11. Expected `not_configured` platforms are coverage, not “please add a Vercel token”.
12. Reject / never emit a green parent `app` or `supabase` claim (`istUeberzogenerGesamtClaim`).
13. Admin remains `noindex`.
14. Break-glass: do not present RLS-empty as zero; process-local health may show with the existing Notzugang banner.

### 5.1 Copy (additive)

Suggested keys (German, honest, no marketing):

- Section title: `Aktuelle Hinweise`
- Section hint: `Regelbasierte Lage aus dem vorhandenen System-Health-Stand. Kein Copilot-Execute, keine Live-Überwachung, keine Modellantwort.`
- No-signal: `Aus den belegten System-Health-Quellen ergibt sich gerade keine priorisierte Untersuchung. Belegt sind nur Prozess-Erreichbarkeit und — wenn frisch — der App-Datenzugriff. Plattform-Health bleibt unbelegt.`
- Denied: reuse `messageForDenial` plus `Ohne betrieb-lesen wird System Health nicht gelesen.`
- Stale suffix: `Stand ist veraltet.`

Do not remove or soften `copilotFolgtHinweis`.

### 5.2 UI

- Server-rendered list, 0–N insights, coverage line always visible when `access === 'allowed'`.
- Each attention insight: title, observed label, freshness label, explanation, proves, doesNotProve, one text link “System Health öffnen”.
- Coverage/none insights: no urgent styling, no investigate link unless the decision table allows it (expected-not_configured: no token-setup CTA).
- Responsive: single column on small viewports, existing `gap` / `rounded-xl border border-border` language.
- Keyboard: links in tab order; no pointer-only expand for the primary explanation (keep it visible). If a details/summary is used, it must be a native `<details>` or button with `aria-expanded`.
- Focus: visible focus ring from existing tokens; do not steal focus on load.
- Colour: reuse System Health chip rules; lime/citrus only if already used for a single accent — do not introduce an “AI” palette.

## 6. Exclusions

Not in this runtime slice:

- Provider-ops / `model-usage` (named next source, separate task)
- Security event feed, #494 ledger, ingestion, §G
- Payments, refunds, IP block writes
- New roles, AAL changes, RLS, migrations
- Model/provider/paid calls, kill-switch writes, cost-guard persistence
- Ads, Bexio, CRM, finance, growth, Infomaniak tokens
- External Grok bot or routine
- Second Admin audit
- Duplicate System Health board on home
- Dead Execute / Auto / Apply buttons
- Persistent insight history
- Public launch / Production logging activation
- Sibling #506 / #509 files

## 7. Prerequisites that need a Product-Owner decision

None for this bounded read-only derivation.

Do **not** ask PO for a model, secret, or D–K module in order to start. If review later wants a live Vercel/GitHub token so parent cards can leave `not_configured`, that is a **different**, gated slice — not a blocker for this one.

## 8. Acceptance tests

All of the following are required. Prefer node:test next to the derivation, plus existing health-contract tests still green.

### 8.1 Source derivation (pure)

Use fixtures. Do not hit a network. Label fixtures synthetic.

| ID | Input | Must assert |
| --- | --- | --- |
| T-healthy-fresh | `supabase-app-datenzugriff` healthy+fresh; others expected unknown/not_configured; ids complete | exactly one `none` insight; `next === null`; coverage lists vercel/github/infomaniak/management as notConfigured; no parent green |
| T-unavailable | synthetic airports failure (`SYSTEM_HEALTH_AUDIT_BERICHT`-style unavailable zugriff) | one `attention` insight; observed `unavailable`; next href `/admin/system-health`; proves/doesNotProve copied, not rewritten into “Supabase is down” |
| T-degraded | a check status `degraded` (construct fixture; production path may not emit it today) | attention; ranked above coverage |
| T-unknown-attempt | zugriff `unknown` (no ping) | coverage or attention per decision rank 5; not healthy |
| T-missing-item | bericht without `github` | `systemHealthIdsVollstaendig === false` ⇒ `partial_failed` attention; do not invent github healthy |
| T-stale | unavailable or healthy check with `ageMs > ttlMs` | freshness `stale`; stale healthy is not treated as current healthy; no fabricated newer `checkedAt` |
| T-denied | derivation entry for denied access (or wrapper) | `access: 'denied'`; no items consulted; no `/admin/system-health` hop |
| T-lookup-failed | access `lookup-failed` | unavailable copy; not empty-zero; not “logged out” |
| T-dedupe | parent supabase `not_configured` + zugriff `unavailable` | one insight (sub-check), not two |
| T-expected-nc | only expected not_configured parents | at most one coverage insight for the set; no “create token” recommendation |
| T-overclaim | fixture parent `app` or `supabase` `healthy` | no emitted insight with green parent claim; test fails the input or strips it |
| T-order | unavailable + stale coverage + expected nc | deterministic order; stable ids; second call equal |
| T-allowlist | next.href | only `/admin/system-health` or null |
| T-kind | every insight | `kind === 'deterministic-source'`; `modelExplanation.enabled === false`; `writeActions` [] |
| T-text-untrusted | summary containing `<script>` or markdown heading | rendered/exported as plain text in the insight fields (no HTML) |

### 8.2 Gate / PII / truth

| ID | Must assert |
| --- | --- |
| T-gate-before-load | source of `AdminLagehinweise` calls evaluate/require with `betrieb-lesen` before loader; a unit or source-read test is acceptable |
| T-no-security-fields | analyst module does not import `security_events`, list route, or `#494` SQL |
| T-no-new-capability | no new `Capability` key |
| T-cache | comments or test: cache reuse only after allowed gate |
| T-home-directory | `ADMIN_NAECHSTE_SCHRITTE` ready hrefs unchanged |

### 8.3 Responsive / keyboard / focus (evidence expectations)

Not a substitute for a later real-device pass if TL requires one.

| ID | Evidence |
| --- | --- |
| T-a11y-structure | section heading, list, links have accessible names including status + freshness |
| T-keyboard | investigate link is reachable without a mouse (component contract / RTL if present) |
| T-no-focus-steal | no `autoFocus` on load |
| T-viewport | layout uses existing grid/stack; no fixed width that clips at 320px (assert class contract or a small render test) |

If the repo has no RTL harness for this server component, encode the contract as tests on the rendered data + a short STATUS note that browser evidence is for the dispatched slice’s CI/Preview, not this specification PR.

### 8.4 Regression

Keep green:

- `lib/admin/system-health/system-health.test.ts`
- `lib/admin/ehrliche-zustaende.test.ts`
- relevant `lib/auth/admin-*.test.ts` if the gate wrapper is touched (prefer not to touch)

Do not “fix” Slice B parent-unknown rules to make the analyst look smarter.

## 9. Implementation sequence (for the later writer)

1. Read this task, the decision, the matrix, ADR-0159, and current `lib/admin/system-health`.
2. Confirm operating mode is still NORMAL and #510 has been accepted/merged or TL has rebased the dispatch head.
3. Add `lib/admin/analyst/*` with tests first (derivation).
4. Add `AdminLagehinweise` and compose on home.
5. Additive honest copy only.
6. Run the tests in §8 plus `npx tsc --noEmit` and the repo’s required hygiene if those files are in scope.
7. Preview: Admin home + System Health, desktop and 320–390px, keyboard only once.
8. Persist STATUS/HANDOFF/SELF_REVIEW on the **runtime** branch. Do not edit Foundation 1 specification files unless TL orders a contract change.
9. STOP FOR TECHNICAL-LEAD REVIEW. No Ready. No merge. No follow-up.

## 10. Suggested later (not this task)

If this runtime is accepted and still useful:

1. Add **only** Provider-ops `model-usage` as a second snapshot (`unavailable` ≠ 0 USD).
2. Do not add security row feeds until ingestion exists and a PII minimization contract is written.
3. Optional disabled-by-default model explanation of an already computed `AnalystInsight`, with cost controls — separate PO/TL gate.

## 11. Dispatch packet (TL fills)

| Field | Value |
| --- | --- |
| Agent display name | *(TL assigns, e.g. Jetnity intelligent admin analyst runtime 1)* |
| Generation | 1 of the **runtime** writer (not this specification generation) |
| Branch | *(TL)* |
| Baseline | live `main` at dispatch, or #510 merge commit |
| Issue / PR | *(new)* |
| This task | `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_RUNTIME_TASK_2026-09-21.md` |
| Authorized | No, until TL pastes a binding `@cursor` dispatch |

**STOP.** Specification writer does not start this work.
