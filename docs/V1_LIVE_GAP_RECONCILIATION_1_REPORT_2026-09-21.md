# Jetnity – V1 Live Gap Reconciliation 1 – Current Audit Truth

Stand: 21. September 2026  
Status: **RECONCILIATION COMPLETE / DOCS-EVIDENCE ONLY / DRAFT / NOT READY / NOT MERGED / NO FINDING IMPLEMENTED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #495  
Draft PR: #497  
Branch: `audit/v1-live-gap-reconciliation-1`  
Canonical / live `origin/main`: `4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9`  
Binding task: `docs/V1_LIVE_GAP_RECONCILIATION_1_TASK_2026-09-21.md`  
Source audit: #438 / merged PR #449 / `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`

Cursor-Agent: **Jetnity V1 live gap reconciliation 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast** — confirmed on this run (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-5fec9964-6dc7-4da9-ba84-8027f48e4550`

This report is current-state classification against live `main`. It does **not** implement any finding. It does **not** rewrite the 17 September 2026 G2 matrix. Historical audit text remains historical. Live repository evidence wins.

---

## 0. How to read this report

Each required historical finding is classified as exactly one of:

- `CLOSED` — the audited gap no longer exists in the form that would justify repeating that remediation slice
- `STILL_OPEN` — live evidence still matches the historical gap
- `PARTIAL` — a real, bounded half is closed; a named residual remains
- `PO_GATED` — still open **and** blocked on a reserved Product-Owner decision / special gate, not on missing engineering capacity
- `SUPERSEDED` — the historical framing is no longer the right work item
- `NOT_APPLICABLE` — the historical obligation is not currently triggered

For mixed rows the **primary** classification is the one a later agent must not misread. Residuals are named explicitly.

Evidence rules:

1. Live `origin/main@4169c5b4` outranks the G2 matrix, G2 STATUS/HANDOFF, and stale continuity prose.
2. A docs file describing a capability is not evidence that the capability exists, except where the original gap **was** the missing document (runbooks).
3. UI copy is not compliance.
4. No Production write, secret, provider or paid action was performed by this slice.
5. Line numbers are as at `main@4169c5b4`. Symbol and file names are the durable anchors.

Parallel ownership (do not cross):

| PR | Owns | Must not be treated as this slice |
| --- | --- | --- |
| #494 | local disposable security-event producer-contract harness / `scripts/db` / its package script | open, not merged, not evidence that 5.2 ingestion is closed |
| #497 | only these reconciliation docs | this report |
| #498 | only its regression-audit docs | independent QA; not a second writer of this matrix |

---

## 1. Live reconstruction that this report used

Re-fetched `origin/main` during this slice.

| Item | Value |
| --- | --- |
| Live `origin/main` | `4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9` — `Close V1 Security Event Ingestion Architecture 1 (#487)` |
| Merge-base `HEAD`…`origin/main` at start | `4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9` |
| Behind | **0** |
| Operating-mode file on this main | `.jetnity/operating-mode.json` `mode: NORMAL` |
| Draft PR #497 | open, draft, not Ready, not merged |
| Draft PR #494 | open, draft; exclusive owner of the local producer-contract harness |
| Draft PR #498 | open, draft; exclusive owner of the regression-audit docs |
| PR #487 | **MERGED** 21 September 2026 at `4169c5b4` — architecture only; finding 5.2 ingestion remains OPEN |
| Review threads on #497 at write time | **0** |

### 1.1 Stale continuity that must not be treated as current work

`JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` on this same main still describe live `main` as `AI_OS_BUILD_HOLD` and PR #487 as parked at `12d070a7`. Live GitHub/Git evidence contradicts both statements: #492 is already merged into the ancestor `4a223d34`, `operating-mode.json` is `NORMAL`, and #487 is the current main tip.

This slice **does not** edit those global continuity files. The contradiction is recorded so a later Technical-Lead continuity refresh can correct them. Until then: **live GitHub/Git wins**. Do not reconstruct #487 as parked. Do not reconstruct HOLD as the live main mode.

### 1.2 Closure PRs inspected (read-only)

| Finding cluster | PR | Merge on main | Accepted exact head recorded in continuity |
| --- | --- | --- | --- |
| G2 audit persist | #449 | `cfcb6b5ba12bef2383782e5d27e968b23d446b04` | historical audit, not current truth |
| 1.4 legal claim hygiene | #457 | `e534e0f55cb4da5ebdc5222351e4e29e608b1007` | `f132ac092ff1bd78e22dde0055a45fe74dab7d24` |
| 3.4 operational runbook | #460 | `6f79b45a70374518aef0b6f1a9ab4479f0798827` | `f0f6c892dc22cfc1cf2cf00093f8740b36155c03` |
| 5.5 process half | #464 | `3fcebbb128a1fd3c157073ed903518b6ad3f6566` | `eeff277e319b6ea5d4fb4a202b900652030c7506` |
| 4.1 process half | #470 | `9a3fe265dc47864897ab9f7da1c0ae7e9765a778` | `992148303700c2abcb181875edb994eb865e8554` |
| 4.2 account error boundary | #471 | `d0a940c28b46f6435f9215a4fe428fa09fd4cf2d` | `93ae93d727560c0154fb0dba6d3c8a032a73b71b` |
| 6.3 admin revenue truth | #472 | `b051b2c2c08572b8948d24deb013d930d77ec503` | `cb5ec6601e10ad9ec421a6a960dcead957b4afef` |
| 2.1 scoped data export | #476 | `57efdb2b796e5d99e0bf0010c5d1ef5af3842af7` | `f58a3902382c2bbf458bf0be0d977eaa2aadaef0` |
| 1.2(a) cookie artefact | #477 | `ac3539d9ceff4e96308a48c51d2d317927245b54` | `f4bdd74626a0c079f8395bcdabe06c1765ea5565` |
| 3.3 / 3.6 / 3.7 auth verification | #480 | `581e8ad1f0d3f80e2631b967568fec51e67555af` | `b7a9764331ec813361f850c52129f624c42c45ca` |
| 4.3 error-reference usability | #483 | `b934afab293ba73ad05ca7e14847db477c44fff0` | recorded in #483 STATUS as `fcbecf0a7c77e11aebbfe5f4184d02f07e4baa86` before merge |
| 5.2 presentation hygiene | #485 | `0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2` | coverage-truth STATUS `11e66944` integration; merge is `0c83af42` |
| 5.2 architecture decision | #487 | `4169c5b4a2d6e2f663bfaace385a2d482a4cc2d9` | PR head `39ad5b0d526e978311d0da12d59b82ee342e9961` |

---

## 2. Required findings

### 1.1 Public legal pages (`/privacy`, `/terms`, Impressum)

| | |
| --- | --- |
| Historical finding | No reachable privacy notice, terms or imprint; signup links to 404s |
| Old state | `MISSING` / P0 / PO-gated on legal content |
| **Current classification** | **`PO_GATED`** |
| Current state | Still no legal route directories. The gap is unchanged as a product/legal obligation. |
| Exact current evidence | Direct `find app` for `privacy` / `terms` / `impressum` / `datenschutz` / `legal` directories: **zero**. `lib/legal/ap6a-gate0-vertrag.ts` still declares `AP6A_LEGAL_ROUTEN = ['/privacy', '/terms']` and `AP6A_VERWANDTE_FEHLENDE_ROUTEN = ['/impressum', '/datenschutz']`. `AP6A_RUNTIME_VERTRAG.keineErfundenenRechtstexte = true`. `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` still asserts the pages do not exist. `components/auth/RegisterForm.tsx` still links to `/terms` and `/privacy`. |
| Closure PR/head | None. Not closed by #457 (claim hygiene only). |
| Remaining gate | Product-Owner / legal content. Agents must not invent legal text. PrivacyBee remains unactivated per the existing vendor decision. |
| New engineering slice needed? | **No, not yet.** A route shell without PO-supplied content would violate the AP-6a contract. Do not start a legal-page slice from this report. |

### 1.2 Cookie consent / orphan banner

Split because the historical row contained two different gaps.

#### 1.2(a) Stale orphan `CookieConsent` artefact

| | |
| --- | --- |
| Historical finding | Orphan component with a false Views/Likes processing claim and a dead `/privacy` link |
| Old state | `MISSING` / P2 while unmounted |
| **Current classification** | **`CLOSED`** |
| Current state | The artefact is gone. Tests now lock the absence. |
| Exact current evidence | `components/layout/CookieConsent.tsx` is **ABSENT**. `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` asserts the file does not exist and that no importer remains. `lib/project-sanitation/closure-invariants.test.ts` asserts the same. |
| Closure PR/head | #477 / issue #475. Merge `ac3539d9ceff4e96308a48c51d2d317927245b54`. Accepted head `f4bdd74626a0c079f8395bcdabe06c1765ea5565`. |
| Remaining gate | None for the orphan artefact. |
| New engineering slice needed? | **No.** Do not reconstruct “delete CookieConsent” as open work. |

#### 1.2(b) Consent-record model

| | |
| --- | --- |
| Historical finding | No consent table/column, so a future tracker would have no lawful-basis mechanism |
| Old state | Conditional P0 if a non-essential tracker is added |
| **Current classification** | **`NOT_APPLICABLE`** |
| Current state | Still no non-essential tracker, so a banner/consent record is still not currently required. |
| Exact current evidence | `package.json` has no `sentry`, `@vercel/analytics`, `posthog`, `plausible` or `datadog`. `AP6A_RUNTIME_VERTRAG.keineConsentPersistenz = true`. No `consent` table in migrations (inventory test still asserts this). |
| Closure PR/head | Not applicable. #477 explicitly did not add a replacement banner or tracker. |
| Remaining gate | Any future tracker / analytics vendor is Product-Owner-gated and would re-activate this row as P0. |
| New engineering slice needed? | **No**, unless a tracker is later approved. |

### 1.4 Compliance claim hygiene

| | |
| --- | --- |
| Historical finding | Login/Register asserted “DSGVO & CH-DSG konform” without supporting capabilities |
| Old state | `MISSING` (substance) / P0 / ungated copy fix |
| **Current classification** | **`CLOSED`** |
| Current state | The prohibited assertion is absent from both forms. Inventory tests lock the absence. |
| Exact current evidence | Repository-wide search of `*.ts` / `*.tsx` for `DSGVO & CH-DSG konform` hits only the inventory **absence** test. `components/auth/LoginForm.tsx` has no DSGVO/Datenschutz claim. `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` forbids `DSGVO`, `DSGVO & CH-DSG konform` and the JSX entity form. |
| Closure PR/head | #457 / issue #456. Merge `e534e0f55cb4da5ebdc5222351e4e29e608b1007`. Accepted head `f132ac092ff1bd78e22dde0055a45fe74dab7d24`. |
| Remaining gate | None for this copy defect. Closing 1.4 does **not** close 1.1, 2.1-legal-DSAR or 2.2. |
| New engineering slice needed? | **No.** |

### 1.5 Terms acceptance capture

| | |
| --- | --- |
| Historical finding | Client checkbox only; no persisted version/timestamp; OAuth bypass; no server enforcement |
| Old state | `PARTIAL` / P1 / depends on 1.1; persistence is a Production-migration gate |
| **Current classification** | **`PARTIAL`** |
| Current state | The UI gate still exists and is still not a record. The historical residual is unchanged. |
| Exact current evidence | `components/auth/RegisterForm.tsx`: `accept` state, validation, checkbox, `disabled={loading \|\| !accept}`. `signUp` still sends only `email`, `password` and `options.data.name`. `handleOAuth` still calls `signInWithOAuth` without reading `accept`. No `terms_version` / `accepted_at` column in migrations. |
| Closure PR/head | None. #457 preserved the checkbox/links/gating and did not add persistence. |
| Remaining gate | Depends on 1.1 (there must be a versioned document to accept). Persistence needs a migration → Production-migration / Product-Owner gate. |
| New engineering slice needed? | **No, not yet.** Capturing acceptance of documents that still do not exist would be meaningless. |

### 2.1 Data export / DSAR

| | |
| --- | --- |
| Historical finding | No export route, no export page, no documented manual DSAR path |
| Old state | `MISSING` / P0 for public launch |
| **Current classification** | **`CLOSED`** for the scoped V1 product export that #476 shipped |
| Current state | An authenticated, RLS-bound JSON download exists. The UI honestly says it is not a complete legal extract and not deletion. |
| Exact current evidence | `app/api/account/export/route.ts` + `lib/account/datenexport.ts` + `lib/account/datenexport.test.ts`. `app/account/settings/page.tsx` exposes the download and states: “kein vollständiger rechtlicher Datenauszug und keine Kontolöschung.” Settings still has no `/account/delete` link (test-locked). |
| Closure PR/head | #476 / issue #474. Merge `57efdb2b796e5d99e0bf0010c5d1ef5af3842af7`. Accepted head `f58a3902382c2bbf458bf0be0d977eaa2aadaef0`. |
| Remaining gate | A later *legal-complete* DSAR, durable cross-instance throttle, or snapshot guarantee would be a new, separately scoped decision. `ap6a-gate0-vertrag.ts` still lists `datenexport` under historical AP-6b deferral — that contract wording is now stale versus runtime and must not be read as “export is missing”. |
| New engineering slice needed? | **No** for the scoped V1 product export. Do not rebuild export. |

### 2.2 Account deletion / erasure

| | |
| --- | --- |
| Historical finding | No `deleteUser` path; no account-erasure entry point |
| Old state | `MISSING` / P0 for public launch / **PO-gated** (destructive identity deletion) |
| **Current classification** | **`PO_GATED`** |
| Current state | Still no identity-erasure path. Sub-object deletes (trip/traveller) remain, and must not be mistaken for account deletion. |
| Exact current evidence | `deleteUser` appears **nowhere** outside docs. No `app/account/delete/**`. `lib/account/datenexport.test.ts` asserts settings does not link to `/account/delete`. `AP6A_NON_SCOPE` still includes `kontoloeschung`. |
| Closure PR/head | None. #476 explicitly excluded deletion. |
| Remaining gate | Product-Owner decision on immediate vs grace-period delete, retained legal/accounting rows, and a service-role/admin identity-deletion path. Destructive / reversal-hard. |
| New engineering slice needed? | **No, not yet.** Do not start deletion from this report. |

### 2.4 Retention enforcement

| | |
| --- | --- |
| Historical finding | No automated retention; `model_usage` 90-day delete is a manual comment; `security_events` / `blocked_ips` have no TTL |
| Old state | `MISSING` as enforced lifecycle / P1 / PO decision + Production migration |
| **Current classification** | **`PO_GATED`** |
| Current state | Unchanged as an enforcement gap. #487 architecture names retention as a **separate** future control and does not invent period N. |
| Exact current evidence | `supabase/migrations/20260818040000_modellnutzung.sql` still documents a **manual** 90-day delete. No `cron.schedule` in `supabase/` or `scripts/`. `vercel.json` is `{ "version": 2 }` only. #487 decision: payload/volume/admission/retention are separate; persistent activation remains closed. |
| Closure PR/head | None. |
| Remaining gate | Retention *decision* per data class is Product-Owner / legal. Enforcement in Production is a Production-migration gate. Do not treat #494’s synthetic cleanup age as a legal retention period. |
| New engineering slice needed? | **No, not yet.** Persist a decision first. Do not build a generic retention framework. |

### 3.4 MFA recovery / loss of factor

Split because the historical row mixed an ungated runbook with a gated second-factor product.

#### 3.4(a) Admin MFA-loss operational runbook

| | |
| --- | --- |
| Historical finding | No documented break-glass recovery for admin TOTP loss |
| Old state | Operational P0; runbook ungated |
| **Current classification** | **`CLOSED`** |
| Current state | The runbook exists, preserves app-user vs platform-MFA separation, and does not execute a live factor deletion. |
| Exact current evidence | `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_2026-09-18.md` is present and still states that no backup codes / phone MFA / WebAuthn / in-product lockout recovery exist. |
| Closure PR/head | #460 / issue #459. Merge `6f79b45a70374518aef0b6f1a9ab4479f0798827`. Accepted head `f0f6c892dc22cfc1cf2cf00093f8740b36155c03`. |
| Remaining gate | Any **live** Production factor deletion remains a later Product-Owner Auth gate. The runbook is not that authorization. |
| New engineering slice needed? | **No.** Do not rewrite the runbook. |

#### 3.4(b) In-product backup codes / second factor

| | |
| --- | --- |
| Historical finding | No backup codes, phone MFA or WebAuthn |
| Old state | P1 consumer / PO-gated MFA-contract change |
| **Current classification** | **`PO_GATED`** |
| Current state | Still absent. The runbook documents this residual honestly. |
| Exact current evidence | Runbook §1.1 item 5. `supabase/config.toml` still has phone MFA and WebAuthn disabled (historical evidence; this slice did not re-open Auth config as a write). No `backup code` / `recovery code` / `Wiederherstellungscode` module was added by later closed slices. |
| Closure PR/head | None. |
| Remaining gate | Fundamental Auth / Session / MFA / AAL change → reserved Product-Owner gate. |
| New engineering slice needed? | **No** from this report. |

### 3.8 Production email / own SMTP

| | |
| --- | --- |
| Historical finding | No own SMTP; project-wide 2 emails/hour on the built-in sender |
| Old state | `MISSING` / P0 / PO (provider + secret) |
| **Current classification** | **`PO_GATED`** |
| Current state | Unchanged. #480 verified the Production rate-limit number and explicitly did **not** create a sender. |
| Exact current evidence | `supabase/config.toml`: `[auth.email.smtp]` still commented out; `email_sent = 2`. `docs/AUTH.md` still records no own SMTP and “Für den Launch reicht das nicht”. #480 HANDOFF observed Production `rate_limit_email_sent = 2`. |
| Closure PR/head | None for remediation. #480 closed the *information* gap only. |
| Remaining gate | Email-sending provider + secret. Production SMTP write is a reserved gate. Auth tooling still targets Development only. |
| New engineering slice needed? | **No.** This is configuration and a Product-Owner provider decision, not an application slice. |

### 4.1 Support process

| | |
| --- | --- |
| Historical finding | Only `mailto:info@jetnity.ch`; no process, ownership, triage or escalation |
| Old state | `PARTIAL` / P1; process half ungated |
| **Current classification** | **`CLOSED`** for the process half that #470 shipped |
| Current state | A support-operations runbook exists. There is still no ticket vendor, SLA or help page — and #470 said those were out of scope. |
| Exact current evidence | `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md`. Account error boundary now surfaces the same mailto plus Fehler-ID (`app/account/error.tsx`). |
| Closure PR/head | #470 / issue #467. Merge `9a3fe265dc47864897ab9f7da1c0ae7e9765a778`. Accepted head `992148303700c2abcb181875edb994eb865e8554`. Related usability: #483 merge `b934afab293ba73ad05ca7e14847db477c44fff0`. |
| Remaining gate | A helpdesk vendor would be a new recurring cost → Product-Owner. Mailbox/SMTP monitoring is coupled to 3.8. |
| New engineering slice needed? | **No.** Do not rebuild the support process. |

### 4.2 Account error boundary

| | |
| --- | --- |
| Historical finding | No `app/account/error.tsx`; authenticated area fell through to the Next.js default |
| Old state | `MISSING` / P1 / ungated |
| **Current classification** | **`CLOSED`** |
| Current state | Account-scoped recovery exists, with retry, escape to `/reisen`, Fehler-ID and mailto. Production does not log the raw Error object. |
| Exact current evidence | `app/account/error.tsx` is present. `console.error` is development-only. `oeffentlicheFehlerId` is used. #483 extended the same Production-logging contract across the public boundary. |
| Closure PR/head | #471 / issue #468. Merge `d0a940c28b46f6435f9215a4fe428fa09fd4cf2d`. Accepted head `93ae93d727560c0154fb0dba6d3c8a032a73b71b`. Follow-on #483 merge `b934afab`. |
| Remaining gate | Operator-side correlation of Fehler-ID still depends on 5.5 tooling, which remains open. That is 4.3/5.5, not a reason to reopen 4.2. |
| New engineering slice needed? | **No.** |

### 5.2 Security events

This is the row most likely to be misread. Classify the **ingestion gap** as still open, and name the closed halves so they are not rebuilt.

| | |
| --- | --- |
| Historical finding | Admin Security reads `security_events`; nothing in the application writes it |
| Old state | Ingestion `MISSING` / P1; later 18 Sep presentation mitigation only |
| **Current classification** | **`PARTIAL`** |
| Current state | Presentation is honest. Architecture is decided and **merged**. Runtime ingestion is **still absent**. Release-gate §G is **not** satisfied. |
| Exact current evidence | Application readers only: `app/api/admin/security/{list,events,summary}/route.ts`. `lib/admin/ehrliche-zustaende.ts` `securityHinweis` / `securityAbdeckungHinweis` state that zero recorded rows ≠ zero real events. `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md` rejects actor-JWT INSERT, prefers mutation-derived local blocklist events, and states finding 5.2 remains OPEN. No application INSERT exists. The only repository INSERT remains the privileged test fixture in `scripts/db/sicherheit.mjs`. |
| Closure PR/head | Presentation: #485 merge `0c83af42`. Architecture: #487 merge `4169c5b4` (this is current main). Ingestion: **not closed**. |
| Remaining gate | Persistent producer activation, migration, retention N, Auth-log ingest and network blocklist enforcement remain closed. PR **#494** exclusively owns the next *local disposable* producer-contract proof. This reconciliation must not edit #494 files and must not treat #494 as closed. |
| New engineering slice needed? | **Not from this PR.** Do not start a second architecture slice. Do not start a runtime writer. Do not merge or continue #494 from here. |

### 5.4 System health

| | |
| --- | --- |
| Historical finding | One real probe (Supabase); four static `not_configured` declarations |
| Old state | `PARTIAL` / P1 jointly with 5.5 |
| **Current classification** | **`PARTIAL`** |
| Current state | Unchanged and still honest. No false-green expansion landed. |
| Exact current evidence | `lib/admin/system-health/sammeln.ts` still assembles `bewerteApp`, `vercelNichtKonfiguriert`, `githubNichtKonfiguriert`, `infomaniakNichtKonfiguriert`, and one Supabase ping. `writeActions: []`. Admin copy still says unknown / not_configured when a source is missing. |
| Closure PR/head | None. |
| Remaining gate | Real Vercel/GitHub probes need credentials and possibly a scheduler. Paid tiers are `AGENTS.md` §18 / Product-Owner. The G2 recommendation still holds: do not expand the board before 5.5 tooling. |
| New engineering slice needed? | **No, not now.** |

### 5.5 Alerting / incident process

#### 5.5(a) Incident process (process half)

| | |
| --- | --- |
| Historical finding | No documented incident process |
| Old state | Process half ungated; tooling half PO-gated |
| **Current classification** | **`CLOSED`** |
| Current state | The incident runbook exists and explicitly does not select a monitoring vendor. |
| Exact current evidence | `docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md`. |
| Closure PR/head | #464 / issue #463. Merge `3fcebbb128a1fd3c157073ed903518b6ad3f6566`. Accepted head `eeff277e319b6ea5d4fb4a202b900652030c7506`. |
| Remaining gate | None for the process document. |
| New engineering slice needed? | **No.** |

#### 5.5(b) Error tracking / alerting / log aggregation (tooling half)

| | |
| --- | --- |
| Historical finding | No error-reporting SDK, no structured logger, no alerting |
| Old state | `MISSING` / P0 for public launch / PO (new provider + data-processor) |
| **Current classification** | **`PO_GATED`** |
| Current state | Unchanged. `package.json` still has no Sentry/Datadog/Axiom/Logtail. Client errors still only reach a development console. |
| Exact current evidence | `package.json` has no `sentry` / `datadog` / `axiom` / `logtail`. `app/account/error.tsx` and the public boundary log only when `NODE_ENV !== 'production'`. |
| Closure PR/head | None for tooling. |
| Remaining gate | New observability vendor = Product-Owner (cost, processor, privacy-notice impact on 1.1). |
| New engineering slice needed? | **No** until that decision exists. |

### 6.3 Admin revenue truth

| | |
| --- | --- |
| Historical finding | Overview showed CHF Umsatz / orders / refunds / payouts / conversion from unpopulated legacy tables |
| Old state | `PARTIAL` / P2 / ungated copy or suppression |
| **Current classification** | **`CLOSED`** |
| Current state | Overview shows only trip/account operational aggregates. Monetary tiles and conversion ratio are gone. The honest “no provider-backed commercial path” caveat is present. |
| Exact current evidence | `components/admin/home/AdminStatsStrip.tsx` documents the removed revenue tiles, renders only `Reisen (30T)` and `Konten mit Reise (30T)` from `admin_reisen_kennzahlen()`, and prints `ADMIN_EHRLICHE_TEXTE.umsatzConversionHinweis`. Denied capability still renders `–`, not `0`. |
| Closure PR/head | #472 / issue #469. Merge `b051b2c2c08572b8948d24deb013d930d77ec503`. Accepted head `cb5ec6601e10ad9ec421a6a960dcead957b4afef`. |
| Remaining gate | None. Live payments remain a separate reserved gate and are not implied by this closure. |
| New engineering slice needed? | **No.** |

---

## 3. Related rows inspected so they are not reopened by accident

These were not in the minimum list, but live main has moved them and a later agent could confuse them with the required set.

| ID | Live classification | Why it matters |
| --- | --- | --- |
| 3.3 Admin AAL2 Production contradiction | `CLOSED` via #480 | Do not re-run the credentialed AAL2 information slice. Do not re-apply the alignment migration. |
| 3.6 Production `site_url` / redirect allow-list | `PO_GATED` / P2 launch blocker | Verified by #480 as `site_url=http://localhost:3000`, empty `uri_allow_list`. Fix is a Production Auth **write**. |
| 3.7 HIBP + requested rate limits | `CLOSED` as information | Verified by #480. The `email_sent=2` ceiling stays inside 3.8. |
| 4.3 Error-ID without a route to use it | `PARTIAL` | #483 closed the user-facing “what to do with this ID” half (mailto + no Production raw-error log). Operator correlation still waits on 5.5(b). |
| 1.3 Third-party tracking | still deliberate absence | Supports 1.2(b) `NOT_APPLICABLE`. |
| 5.3 Unenforced IP blocklist | unchanged honest `PARTIAL` | #487 / #494 must not be read as edge enforcement. Event means “local `blocked_ips` row changed”, not “network request was blocked”. |

---

## 4. What must not be reconstructed as open remediation

Do **not** open a new slice to:

1. remove the DSGVO/CH-DSG conformity claim (#457 closed);
2. delete `CookieConsent.tsx` (#477 closed);
3. add the scoped V1 account JSON export (#476 closed);
4. write the support process runbook (#470 closed);
5. add `app/account/error.tsx` (#471 closed);
6. suppress invented admin revenue tiles (#472 closed);
7. write the incident process runbook (#464 closed);
8. write the admin MFA-loss runbook (#460 closed);
9. re-verify Production AAL2 / HIBP / requested rate limits (#480 closed);
10. rewrite Admin Security coverage copy (#485 closed);
11. redesign the 5.2 producer architecture (#487 merged; actor-JWT INSERT remains withdrawn);
12. implement #494’s local harness from this branch;
13. invent `/privacy` or `/terms` legal text;
14. implement account deletion, SMTP, observability vendor, backup codes, retention cron, or a persistent `security_events` writer.

---

## 5. What is actually still open after this reconciliation

Only these remain real current work — and **none of them is started by this slice**:

| ID | Class | Why it is still real | Who may start it |
| --- | --- | --- | --- |
| 1.1 | `PO_GATED` | No legal pages | After PO/legal content |
| 1.5 | `PARTIAL` | Acceptance still unrecorded | After 1.1 + migration gate |
| 2.2 | `PO_GATED` | No account erasure | After PO deletion decision |
| 2.4 | `PO_GATED` | No enforced retention | After PO retention decision |
| 3.4(b) | `PO_GATED` | No backup codes / 2nd factor | After MFA-contract gate |
| 3.6 | `PO_GATED` | Production redirect values | Production Auth write gate |
| 3.8 | `PO_GATED` | No production SMTP | PO provider + secret |
| 5.2 ingestion | `PARTIAL` residual | No runtime writer | #494 owns the local proof only; persistent apply stays closed |
| 5.4 | `PARTIAL` | One real health signal | Not before 5.5 tooling / credentials |
| 5.5(b) | `PO_GATED` | No alerting vendor | After PO observability decision |

This list is **not** a Cursor follow-up authorization.

---

## 6. Traveller-context check

Not relevant. This slice classifies Account / Privacy / Operations audit findings. It does not collect, infer or present citizenship, document, residence or route facts. No traveller credential was introduced.

---

## 7. What this slice did not do

- No runtime, `app/`, `components/`, `lib/`, `hooks/`, `types/`, `public/` edit.
- No `scripts/db` or `package.json` edit (those belong to #494 if they change).
- No migration, RLS, Auth, Supabase or Production mutation.
- No provider, secret, paid or cost action.
- No global continuity edit (`JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `JETNITY_HANDOFF.md` untouched).
- No implementation of any finding.
- No Ready, merge or follow-up slice.

---

## 8. Stop

Freeze the head after STATUS / HANDOFF / SELF_REVIEW. Report exact-head evidence in a PR comment.

**STOP FOR TECHNICAL-LEAD REVIEW.**
