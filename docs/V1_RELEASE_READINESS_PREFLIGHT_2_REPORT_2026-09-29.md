# Jetnity V1 Release Readiness Preflight 2 — REPORT

Stand: 29. September 2026  
Status: **PREFLIGHT COMPLETE / NOT A PUBLIC-LAUNCH VERDICT / DRAFT / NOT READY / NOT MERGED**

Issue: #621  
Draft PR: #622  
Branch: `audit/v1-release-readiness-preflight-2`  
Dispatch and live `main` at the read window: `e213fa3a4cf08ee3364c4a8d3dc11bafb9373772`  
Task seed on this branch: `0eb052cf81b0496a3f04481df7361cb30ccd21e1`  
Binding task: `docs/V1_RELEASE_READINESS_PREFLIGHT_2_TASK_2026-09-29.md`  
Prior map: `docs/V1_RELEASE_READINESS_PREFLIGHT_1_REPORT_2026-09-28.md`  
Binding gate: `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`

Logical agent: **Jetnity V1 release readiness preflight 2**, Generation 1  
Required and actual model: **Grok 4.7 High Fast** (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-9ae13269-db7f-4a60-95dc-773310adc34e`  
Session URL: https://cursor.com/agents/bc-9ae13269-db7f-4a60-95dc-773310adc34e

Live-evidence window: 2026-09-28T23:25Z–23:32Z. Public HTTP log: `docs/evidence/v1-release-readiness-preflight-2/live-public-read-2026-09-29.txt`. Source flags: `docs/evidence/v1-release-readiness-preflight-2/SOURCE_FLAGS_2026-09-29.md`.

This preflight implements nothing. It does not authorize public launch, indexing, provider activation, Production mutation, or a final gate PASS. `PASS_CANDIDATE` is not used. No section has current evidence sufficient to treat it as preflight-closed.

State rule, same as Preflight 1:

- `PARTIAL` — substantial closed substance exists, and a named residual still prevents section closure.
- `BLOCKED` — the dominant unfinished requirement is an external response, a reserved Product-Owner gate, or a missing V1 truth path.

Supersession labels used for each Preflight 1 residual:

- `CLOSED_SINCE_PREFLIGHT_1` — Preflight 1 left it open, and a later merge or decision closed it.
- `STILL_OPEN_GATED` — still open, and engineering must not start it without an external reply review or a Product-Owner special gate.
- `STILL_OPEN_UNGATED` — still open, and a normal bounded slice could proceed without a special gate.
- `RELEASE_PROOF_MISSING` — the substance is not newly disproven, and the missing piece is final release evidence rather than a new feature.
- `DELIBERATELY_LATER` — explicitly deferred or outside the current V1 launch path.
- `NOT_APPLICABLE_NOW` — not a current launch row.
- `INSUFFICIENT_CURRENT_EVIDENCE` — this session could not re-prove a mutable Production fact.

---

## 1. Kurzüberblick

Current `main` is still a real prelaunch product on `https://jetnity.com`. Preflight 1’s legal, Auth/mail and account-erasure closures remain closed. They were already closed in that map. This rerun does not reopen them.

What changed after Preflight 1 is Admin honesty and navigation, not the launch gates. #606, #608, #610, #612, #614, #616, #618 and #620 are merged. The three ungated Admin residuals named by #610 are implemented. They are not launch blockers and they are not a reason to start another Admin slice from this report.

What still blocks a real V1 journey is unchanged: no live flight, hotel or activity truth, and no contracted Official Entry source. KAYAK (#395), Sherpa (#294) and IATA Timatic (#294) are still **SENT / WAITING FOR RESPONSE**. No newer GitHub comment records a reply.

Additional launch residuals that waiting does not remove: persistent security-event ingestion (finding 5.2), an alerting provider, retention, consent persistence, future provider DPAs, a fresh Production Supabase inventory, backup/restore proof, and formal release proof including a whole-journey device pass. #585 remains a deferred legal/vendor-text residual, not a current engineering task. Public indexing remains off.

**Immediate ungated follow-up candidates: NONE.**

The three dominant remaining launch items are all `GATED`. They are recorded in §8 so they are visible. They are not a dispatch list.

---

## 2. Live facts independently re-read

| Fact | Fresh result |
| --- | --- |
| `main` | `e213fa3a4cf08ee3364c4a8d3dc11bafb9373772`, Merge #616, 2026-09-28T23:22:14Z. This is the dispatch baseline. First fetch found the local snapshot behind; after `git fetch origin main` the branch was 0 behind and 1 ahead (the task commit only). Final boundary fetch at 2026-09-28T23:31:27Z: `main` had not advanced. No integration commit was required. Latest #395, #294 and #585 comments were unchanged. |
| Mode | `NORMAL` in `.jetnity/operating-mode.json` |
| Active Cursor writer | this docs preflight only. Cloud-agent list showed this session `RUNNING`. The Admin writers for #608–#620 were `IDLE` on already merged branches. |
| Open PRs | Draft #622 (this preflight). Historical drafts #52, #50, #40, #39, #28, last updated 21–25 August 2026. Not active writers. |
| Open issues | #621 this task; #585 PrivacyBee deferred; #440 standing authorization; #395 KAYAK; #294 Sherpa/IATA; #236 strategy register; #20 collaboration. #592, #587, #602, #607, #609, #611, #613, #615, #617, #619 are closed completed. |
| Main CI | run `36497632721` **SUCCESS**. Jobs: `Auth-Konfiguration gegen config.toml` and `Typecheck, Lint & Build`, both success. |
| Vercel for that SHA | GitHub commit status `Vercel` success. Deployment `6722807610`, environment Production, state success, created 2026-09-28T23:22:52Z. The deployment URL redirected to Vercel SSO login and was not used as product HTML. |
| Public alias | `https://jetnity.com/` HTTP 200, `noindex, nofollow`, HSTS `max-age=63072000`, no CSP header, `access-control-allow-origin: *`. `http://` followed to HTTPS. Apex `216.150.1.1`. `www.jetnity.com` has no address. |
| Terms / privacy / imprint | `/terms`, `/privacy`, `/impressum` HTTP 200 and `noindex, nofollow`. Terms body contains `CH-DE 1.0` and `28. September 2026`. Privacy and imprint bodies contain `PrivacyBee`. |
| Robots / sitemap | `User-Agent: *` / `Disallow: /`. Sitemap is an empty `urlset`. |
| PWA | Manifest HTTP 200, `display: standalone`, scope `/`. Three PNG icons HTTP 200. `/sw.js` HTTP 404. |
| KAYAK #395 | Latest comment 2026-09-28T12:22:55Z: `A-KAYAK-INQUIRY-1` sent, waiting. No later comment. |
| Sherpa / IATA #294 | Latest comments 2026-09-28T17:59:04Z (Sherpa sent) and 2026-09-28T18:21:25Z (IATA form sent). No later comment. |
| #585 | Latest comment 2026-09-28T17:03:16Z: Product Owner defers the PrivacyBee inquiry and accepts current generated wording for Switzerland-first prelaunch. |

`JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still describe #608 as the current review. That text is stale. Live evidence wins. This task forbids editing those continuity files.

---

## 3. Fact, inference, gap, recommendation

**Fact.** The SHAs, CI run, GitHub deployment record, issue states, comment timestamps, public HTTP results, and the source kill switches cited below were read in this session.

**Inference.** The public alias is serving the indexing-off prelaunch build that matches current source. This session did not prove that the HTML bytes are exactly `e213fa3a`. The GitHub Production deployment record is the SHA-linked fact. The alias read is the public-behaviour fact.

**Gap.** No Production Supabase read. No provider inbox. No signed-in Admin or Account browser journey. No physical device. No Core Web Vitals. No new Security Advisor replay. The Preflight 1 Technical-Lead closure remains the last recorded Production advisor, migration and `account-delete-v1` readback. It was not repeated against current `main`.

**Recommendation.** Stop for independent Technical-Lead review. Dispatch no candidate. Keep waiting for KAYAK, Sherpa or IATA, then review the full reply before any next gate. After this preflight is accepted, a separate continuity persist can correct the stale #608 pointers. That persist is not started here.

---

## 4. Supersession of Preflight 1 residuals

Preflight 1 already treated Terms, Privacy, Impressum, SMTP, Auth redirects, the Auth callback, and Production account erasure as closed. This rerun re-checked them. They stay closed. `CLOSED_SINCE_PREFLIGHT_1` is reserved for something Preflight 1 still classified as open.

| Preflight 1 residual | Label now | Why |
| --- | --- | --- |
| A real commercial + Official Truth journey | `STILL_OPEN_GATED` | KAYAK, Sherpa and IATA still waiting. Production search remains hard-off in source. |
| B finding 5.2 persistent ingestion | `STILL_OPEN_GATED` | Architecture #487 and local proof #494 stay merged. No application INSERT. Activation remains a reserved security/migration gate. |
| B “advisors not re-read” by the Preflight 1 agent | `INSUFFICIENT_CURRENT_EVIDENCE` for a new replay | The Preflight 1 closure, already on `main`, records a Technical-Lead Production read: WARN-only, RLS/ownership or role+AAL2 still in place, finding 5.2 not closed. This session did not repeat that read. Do not convert the closure into a fresh PASS, and do not pretend the advisors were never read. |
| C legal pages 404 | Already closed in Preflight 1; reconfirmed | Live `/privacy`, `/terms`, `/impressum` are HTTP 200. Not a new closure. |
| C retention and consent persistence | `STILL_OPEN_GATED` | `keineConsentPersistenz` remains `true`. No Product-Owner retention period N. |
| C #585 wording | `DELIBERATELY_LATER` | Product-Owner deferral unchanged since 2026-09-28T17:03:16Z. |
| C provider DPAs | `STILL_OPEN_GATED` | No provider contract exists. |
| D KAYAK / live commercial path | `STILL_OPEN_GATED` | Latest #395 comment is still the sent inquiry. |
| E Sherpa and IATA | `STILL_OPEN_GATED` | Latest #294 comments are still the sent inquiries. |
| F SMTP / Auth URL / callback | Already closed in Preflight 1; reconfirmed on GitHub | #581, #582, #583 remain closed. Not re-opened. This session did not send mail. |
| F Production erasure inventory | `INSUFFICIENT_CURRENT_EVIDENCE` for a fresh read | #592 is closed completed. The closure document records `account-delete-v1` ACTIVE v1 and migration `20260927230000_reise_graph_kaskade_tiefe`. This session did not re-read Production. |
| F indexing off | Reconfirmed, correct hold | Not a defect. |
| F missing CSP and `ACAO: *` on public `GET /` | `DELIBERATELY_LATER` | Re-observed on `https://jetnity.com/`. Not a traveller-critical slice and not dispatched. `/privacy` did not send `ACAO` in this read. |
| F `www` does not resolve | `DELIBERATELY_LATER` | Reconfirmed. Apex HTTPS works. |
| G alerting vendor and ingestion | `STILL_OPEN_GATED` | Incident runbook still names no selected Sentry/Datadog/Axiom/Logtail/PagerDuty provider. |
| H backup/restore proof | `RELEASE_PROOF_MISSING` | Runbooks exist. No restore rehearsal was run. Supabase backup settings were not readable. |
| I real revenue / Production account counts | `STILL_OPEN_GATED` | No live provider. Production account-count exposure stays separately gated. |
| J fresh CWV / full accessibility proof | `RELEASE_PROOF_MISSING` | Closed slices were not rerun. No new defect was measured because no UI was retested. |
| K whole-journey device proof | `RELEASE_PROOF_MISSING` | Manifest and icons are live. No device journey was executed. |
| L real provider/official E2E | `STILL_OPEN_GATED` | Impossible until D and E move. Fail-closed remains correct. |
| M ticket vendor | `DELIBERATELY_LATER` | Mailbox process remains the prelaunch bar. |
| N public launch / indexing approval | `STILL_OPEN_GATED` | Indexing is off. No Alpha, beta or public-launch approval was found. |
| O final blocker rule | `STILL_OPEN_GATED` | A, D, E, G and the unread parts of F and H still meet the block conditions. |
| Admin F / AP-8 / AP-9 / AP-11 / AP-12 | `NOT_APPLICABLE_NOW` as launch work | #606 reconciled the already shipped palette. No second Admin F. Billing-P1 stays gated. |
| TW-8 commercial closure | `STILL_OPEN_GATED` | Still needs a real offer path. Not started. |
| TW-9 programme closure | `RELEASE_PROOF_MISSING` | Accepted UX repairs stay closed. Full TW-9 evidence is not this preflight. |

Nothing in the Preflight 1 blocker list moved to `STILL_OPEN_UNGATED`.

### What did close after Preflight 1, and is not a launch row

| Later merge | What it closed | Launch effect |
| --- | --- | --- |
| #604 `6d5299f73e8da1b8eec7604686e5d272b70fd256` | Preflight 1 continuity persist | None. Docs only. |
| #606 `46b35d9808dc8929fae6adf96aef3572249bf2f8` | Admin F reconciliation against the #545 palette | None. Do not rebuild Admin F. |
| #608 `bee041911003a3b871dacddc0fcdd12f4b8714a1` | Admin user-search URL/navigation | Admin UX. Not a V1 launch gate. Issue #607 closed. |
| #610 `bed4847d7ad0d601b756e3d56011b8525f7aaa5b` | Named three ungated Admin residuals | Docs only. Those residuals were then implemented. |
| #612 `135558c485baf7de844056d81190824eed3ad84e` | #610 C1 transaction filter honesty | Closed. Not a launch blocker. Do not rediscover it. |
| #614 `b633e5f299389faf7e7de375470aaa309e8ef674` | #610 C2 security filter miss versus empty period | Closed. Does not close finding 5.2. |
| #618 `6b267186bd8f8261b76583cc3a20af4ddc4fbf89` | Blocklist 200-row bound disclosure | Closed honesty fix. The list still has no total beyond the cap; the sentence says the read can be incomplete. Not a new slice. |
| #620 `6f8e1507af87f69c4ce80397ebd5369eda8446cd` | Stale security refresh must not overwrite a newer read | Closed. Not finding 5.2. |
| #616 `e213fa3a4cf08ee3364c4a8d3dc11bafb9373772` | #610 C3 null `created_at` must not display as now | Closed. Current `main`. |

Each of those main pushes has a successful CI run. That is build evidence for the merged tree. It is not signed-in Admin proof and not a physical-device proof. The slice handoffs say so.

---

## 5. Sections A–O

### A. Product Definition of Done — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Supersession:** `STILL_OPEN_GATED`.
3. **Evidence:** V1 still requires a real traveller path for flights, accommodation, activities unless a launch exception exists, and Official Evidence for entry requirements. `lib/flights/zustand.ts`, `lib/hotels/zustand.ts` and `lib/activities/zustand.ts` still hard-disable Production search. No provider is selected. Foundations listed as closed in Preflight 1 §3 remain on this `main`. Phase-2/3 work is not treated as a launch prerequisite.
4. **Missing action:** wait for a material external reply, then have the Technical Lead review that reply and its terms.
5. **Gate owner:** external party, then Technical Lead review, then Product Owner for any selection, contract, secret, spend or launch exception.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** V1 launch-critical. Not an open product-code defect.
8. **Uncertainty:** a reply may already exist in a mailbox that was not opened. GitHub has no newer comment.

### B. Security — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Supersession:** finding 5.2 `STILL_OPEN_GATED`. Fresh advisor replay `INSUFFICIENT_CURRENT_EVIDENCE`.
3. **Evidence:** Auth/RLS/MFA/AAL work remains merged. Production provider calls stay hard-off in source. Ruleset `21875372` remains the documented live baseline; this session did not mutate it and did not re-call the ruleset API. Admin security routes read `security_events`. Account deletion deletes linked events. No product INSERT was found. The honest Admin copy, the 200-row disclosure and the refresh-ordering fix are on `main` and do not create the pipeline. The last Production Security Advisor read is the Preflight 1 closure: WARN-only, with RLS and ownership or role+AAL2 still described as intact. That read is not repeated here.
4. **Missing action:** do not start a second ingestion writer. A later persistent-ingestion activation remains a reserved security/migration gate. A fresh advisor replay needs a Production read path.
5. **Gate owner:** Product Owner for persistent ingestion and any Production security change. Technical Lead for a later read-only advisor replay.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** V1 launch-critical as gate G. The recent Admin honesty fixes are not a substitute and are not new P0/P1 launch defects.
8. **Uncertainty:** empty `security_events` must not be read as “no incidents”. Unread-today advisories are an evidence gap, not a discovered vulnerability. Dependabot and code scanning were not queried in this session.

### C. Privacy / Legal / Compliance — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Supersession:** legal pages already closed and reconfirmed. Retention and consent `STILL_OPEN_GATED`. #585 `DELIBERATELY_LATER`. Provider DPAs `STILL_OPEN_GATED`.
3. **Evidence:** Live `/privacy`, `/terms` and `/impressum` are HTTP 200, `noindex, nofollow`. Terms contain version `CH-DE 1.0` and Stand `28. September 2026`. #587 is closed completed. #592 is closed completed on GitHub. `keineConsentPersistenz` remains `true`. #585’s Product-Owner deferral is unchanged. Privacy and imprint HTML contain the PrivacyBee marker. This preflight did not re-litigate the Infomaniak legal-basis sentence and did not hand-edit vendor text.
4. **Missing action:** leave #585 deferred. Do not persist consent and do not invent a retention number.
5. **Gate owner:** Product Owner for retention, consent persistence, and any future provider DPA. Later legal sign-off re-reads #585.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** retention and consent records are V1 launch-critical once real processing is in market. #585 is not a current engineering blocker. The old “legal pages 404” P0 stays closed.
8. **Uncertainty:** this session did not archive the full privacy HTML and does not issue a legal-basis opinion. Production erasure liveness was not re-read.

### D. Provider / Commercial / Licensing — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Supersession:** `STILL_OPEN_GATED`.
3. **Evidence:** #395 latest comment remains the sent `A-KAYAK-INQUIRY-1` at 2026-09-28T12:22:55Z. No signup, Terms acceptance, credential, API call, spend or adapter was authorized then, and none was performed now. Flight, hotel and activity Production search stay hard-off. HBX remains an offline fixture mapper from #548. No hotel or activity provider is selected either.
4. **Missing action:** Technical Lead reviews the full KAYAK reply and any linked terms before any next action. No Cursor writer now.
5. **Gate owner:** KAYAK, then Technical Lead, then Product Owner for selection, contract, secret, spend or Production activation.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** V1 launch-critical for a real commercial journey. Provider breadth beyond the first path is later.
8. **Uncertainty:** “no reply” means no newer GitHub comment. The inbox was not opened.

### E. Entry Requirements / Official Truth — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Supersession:** `STILL_OPEN_GATED`.
3. **Evidence:** #294 still records Sherpa sent at 2026-09-28T17:59:04Z and the IATA business form sent at 2026-09-28T18:21:25Z, including that form’s website Terms acceptance. No Timatic commercial/API contract, credential, call, spend or source selection followed. Repository rules still keep `unknown` distinct from `not_required`. No visa, transit or health rule was invented here. E1–E5 remain the integrated provider-neutral foundation. Another status model is not justified.
4. **Missing action:** wait. Review each full reply before signup, credentials or an adapter.
5. **Gate owner:** Sherpa and IATA, then Technical Lead, then Product Owner for any contract.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** an untested Official Truth path is V1 launch-critical. Fail-closed `unknown` is the correct current behaviour.
8. **Uncertainty:** same inbox limit as D. Multi-citizenship, multi-document, transit and credential-change behaviour cannot be proven against a real source until one exists.

### F. Production Configuration — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Supersession:** indexing and public legal/Auth closures reconfirmed. Fresh Supabase inventory `INSUFFICIENT_CURRENT_EVIDENCE`. Header and `www` notes `DELIBERATELY_LATER`.
3. **Evidence:** Public alias serves Terms CH-DE 1.0. HTTP redirects to HTTPS. HSTS is present. `www` does not resolve. Apex address matches the earlier domain closure. Robots disallow-all, empty sitemap, and `noindex, nofollow` match the prelaunch rule. Manifest is live. GitHub records Production deployment success for `e213fa3a`. No CSP header was present on `GET /` or `GET /privacy`. `access-control-allow-origin: *` was present on `GET /` and absent on `GET /privacy` in this read.
4. **Missing action:** do not mutate Supabase, DNS, headers or indexing. A later final-gate artifact needs a fresh Production read by someone with that read path.
5. **Gate owner:** Technical Lead for the read-only inventory. Product Owner for indexing, DNS cutover, or any Production config change.
6. **Engineering without a special gate:** no for the residuals that matter. Header hardening is not authorized from this preflight.
7. **V1 versus later:** indexing-off is the correct V1 prelaunch state. Unread inventory is final-gate evidence, severity P2, not a reason to rebuild Auth or SMTP.
8. **Uncertainty:** the alias HTML is not SHA-locked to `e213fa3a` by this read. The deployment URL was SSO-gated. DNSSEC was not re-checked. Auth Site URL and SMTP were not re-read in Supabase; their GitHub closures stay the record.

### G. Monitoring / Logging / Alerting — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Supersession:** `STILL_OPEN_GATED`.
3. **Evidence:** Finding 5.2 remains open as B describes. Admin health surfaces exist and the later honesty fixes keep misses, caps and refresh order distinguishable from an empty period. `docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md` still says no Sentry, Datadog, Axiom, Logtail or PagerDuty provider is selected. None was contacted.
4. **Missing action:** keep the honest not-configured disclosure. Do not install an observability vendor from this map.
5. **Gate owner:** Product Owner. A new processor and possible cost are reserved gates. Persistent ingestion is the same reserved security gate as B.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** gate O treats missing operational detection as a launch block. It is not a reason to fake events or to rebuild #487/#494.
8. **Uncertainty:** provider-health alerts are also untestable while providers are hard-off.

### H. Backup / Recovery / Incident — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Supersession:** `RELEASE_PROOF_MISSING`. Supabase backup presence remains unread, so that sub-fact is `INSUFFICIENT_CURRENT_EVIDENCE`.
3. **Evidence:** The incident runbook and the admin MFA-loss procedure are on `main`. The runbook states that it does not prove a backup/restore rehearsal, that PITR was not activated in the prior record, and that this was not re-verified live. Provider kill switches are implemented as Production hard-off. A successful Vercel Production deployment shows a deploy exists. It does not show a rehearsed rollback.
4. **Missing action:** do not run a restore against Production. A later read-only backup inventory belongs to the final gate.
5. **Gate owner:** Product Owner if a restore, PITR purchase or destructive Production data change is proposed. Technical Lead for a read-only inventory.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** launch-critical as proof that basic recovery protection exists. Absence of a named backup vendor is not claimed.
8. **Uncertainty:** this session cannot say whether Supabase’s current backup window matches the older “Pro daily backups, 7-day window” note.

### I. Analytics / Conversion / Revenue — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Supersession:** `STILL_OPEN_GATED` for real attribution and for Production account-count exposure. A growth plane is `DELIBERATELY_LATER`.
3. **Evidence:** There is still no provider-backed commercial path, so there is no real revenue to display. Local account-count proof stays closed and still forbids Production exposure. Indexing is off. Consent is not persisted. No booking or affiliate handoff can be measured.
4. **Missing action:** do not activate Production account counts and do not create conversion charts.
5. **Gate owner:** Product Owner for Production account-count exposure. External provider reply before any real attribution work.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** P2 until a provider exists. It joins the P0 commercial cluster only when a real handoff is being switched on.
8. **Uncertainty:** `unknown` attribution must stay unknown. An empty revenue display is not proof that revenue is zero in a future live path.

### J. Performance / Accessibility — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Supersession:** `RELEASE_PROOF_MISSING`.
3. **Evidence:** Mobile Accessibility 1 and the later accepted visual repairs remain historical closures on `main`. This preflight did not rerun them and did not measure Core Web Vitals. Provider timeout/retry against a live vendor is impossible while search is hard-off.
4. **Missing action:** leave closed slices closed. Measure the real journey only after real provider and Official Truth paths exist.
5. **Gate owner:** final release proof, not a new product slice.
6. **Engineering without a special gate:** no useful measurement of the missing commercial/official journey exists yet. Do not open a performance project to fill the gap.
7. **V1 versus later:** P2 release proof. No new P0/P1 accessibility defect was observed because the UI was not retested. That absence is not a regression finding.
8. **Uncertainty:** a real device could still show a defect this preflight did not look for.

### K. Mobile / Browser / PWA — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Supersession:** `RELEASE_PROOF_MISSING`.
3. **Evidence:** Live manifest is standalone, scoped to `/`, and its three PNG icons return HTTP 200. `/sw.js` is 404, which matches the closed decision that offline and push are not V1. No iPhone, Android or desktop browser journey was executed. Later Admin browser evidence is synthetic and explicitly not signed-in and not a physical device.
4. **Missing action:** do not add a service worker. Do not open a device-lab slice for a journey whose commercial and official steps are still fail-closed.
5. **Gate owner:** final release proof.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** the complete core journey on real devices is release proof. It is not a reason to rebuild mobile chrome.
8. **Uncertainty:** installability of the manifest was checked by HTTP, not by installing on a phone.

### L. End-to-End / Failure / Concurrency — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Supersession:** `STILL_OPEN_GATED` until D and E can be executed for real.
3. **Evidence:** Guest, account, traveller and route foundations remain merged. Production account-erasure E2E is recorded as passed on a disposable Production account in the #592/#599 closure. This session did not repeat it. Real flight, hotel, activity and Official Truth failure cases cannot be executed. Production search flags fail closed before a provider call. Admin filter tests on #612–#620 are not this E2E.
4. **Missing action:** do not write speculative E2E against invented provider payloads. Do not delete another Production user.
5. **Gate owner:** external replies first. Product Owner before any new Production mutation.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** launch-critical for the real path. Existing fail-closed behaviour is the correct prelaunch control.
8. **Uncertainty:** historical test suites were not rerun in this docs session. Main CI on `e213fa3a` succeeded, which is not a journey E2E.

### M. Support / Operations — `PARTIAL` — P3

1. **State:** `PARTIAL`.
2. **Supersession:** helpdesk `DELIBERATELY_LATER`. The mailbox process remains in place.
3. **Evidence:** `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md` still defines `info@jetnity.ch`, minimised data handling, and escalation into the incident runbook. It does not grant direct Production database access. SMTP for Auth mail is a separate closed gate and is not a ticket system.
4. **Missing action:** keep the existing mailbox process. Do not buy a helpdesk.
5. **Gate owner:** none for continued prelaunch use of the existing mailbox. A vendor queue would be a later Product-Owner cost/processor decision.
6. **Engineering without a special gate:** no new support product is justified.
7. **V1 versus later:** P3. The defined channel meets the current process bar. A vendor queue is later.
8. **Uncertainty:** this session did not send a support message.

### N. Release / Launch Control — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Supersession:** `STILL_OPEN_GATED`.
3. **Evidence:** Indexing is off in live HTML, robots and source (`darfIndexieren` requires an explicit indexing flag plus the canonical production origin). No Private Alpha, Closed Beta or Swiss Public Launch approval was found in the open issue set. Successful Vercel Production deploys are prelaunch deploys. The binding sequence remains Alpha, then Swiss beta, then Swiss public launch.
4. **Missing action:** do not change robots, sitemap, metadata or the indexing flag. Do not declare a launch stage.
5. **Gate owner:** Product Owner.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** a public launch attempt would be P0. The current hold is the correct state.
8. **Uncertainty:** the public alias read and the GitHub deployment record agree that a Production deploy exists. They do not agree, by byte identity, that this session viewed the exact `e213fa3a` HTML.

### O. Final blocker rules — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Supersession:** `STILL_OPEN_GATED`.
3. **Evidence:** The binding rule still blocks public launch while an open P0 remains, while P1 residuals remain in the core journey, security, privacy, truth, provider or reliability path, while a provider contract or DPA is unresolved, while real-path E2E is untested, while backup/recovery proof is missing, or while fixture data would be used as hard truth. Those conditions are still true for A, D, E, G, and the unread parts of F and H. Fixture hotel data is not wired as Production hotel truth. Indexing is not on.
4. **Missing action:** stop for independent exact-head review. Do not convert this document into the launch gate.
5. **Gate owner:** Technical Lead for this review. Product Owner for launch approval. Neither is granted here.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** P0 for any public-launch attempt. Not a code emergency.
8. **Uncertainty:** one green sub-fact, including successful CI or a live legal page, does not close the section.

---

## 6. Provider and Official Truth boundary

KAYAK, Sherpa and IATA/Timatic remain external waiting-response tracks.

Not done: contact, forms, Terms or DPA acceptance, accounts, credentials, API calls, spend, provider selection, adapters.

Their absence is a launch blocker and it is `GATED`. Fixtures are not a substitute.

---

## 7. Security, privacy and production boundary

Not done: Production, Supabase, Auth, RLS, retention, observability, payment or secret mutation.

Local source reads and public HTTPS GETs are not a Production PASS. Synthetic Admin browser evidence from #608–#620 is not signed-in Admin/Account E2E. PrivacyBee HTML is not a legal-completeness verdict.

---

## 8. Candidates

**Immediate follow-up candidates: NONE.**

No current residual is both V1-useful and free of an external wait, a Product-Owner special gate, or a final-proof dependency that cannot be executed yet.

The three dominant launch items are listed so the review can see them. Each is `GATED`. None is recommended for Technical-Lead dispatch.

| # | Title | Class | Why it is not dispatch |
| --- | --- | --- | --- |
| 1 | KAYAK reply, then flight commercial truth | `GATED` | #395 is waiting. A reply still requires Technical-Lead review and a Product-Owner gate before signup, terms, credentials, spend or an adapter. |
| 2 | Sherpa and IATA replies, then Official Entry truth | `GATED` | #294 is waiting. Same review-then-gate rule. Do not invent visa or transit rules to fill the gap. |
| 3 | Persistent security-event ingestion, finding 5.2 | `GATED` | Architecture and local proof exist. Activation is a reserved security/migration gate. The Admin honesty merges did not close it. |

Also gated, and not promoted into the three: retention and consent persistence, an alerting vendor, backup/restore proof, Production account-count exposure, public launch/indexing, and TW-8. TW-9 remains release proof after those dependencies. #585 stays deferred.

Explicitly not candidates:

- Another flight, hotel or activity engine.
- Another Official Truth model.
- Legal-page copy or a PrivacyBee hand edit.
- A consent migration or a retention job without a Product-Owner period.
- An observability SaaS.
- Redispatch of #608, #610 C1, C2 or C3, #612, #614, #616, #618 or #620.
- Admin F, AP-8, AP-9, AP-11, AP-12, or the refund route.
- A CSP/`ACAO` hardening slice. It was re-observed and is not the traveller-critical path.
- The blocklist-versus-events-search mismatch noted as already true in the #618 handoff. That handoff opened no follow-up.
- Historical drafts #52, #50, #40, #39 and #28.

A continuity correction of `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` is real, because those files still name #608 as the active review. It is process hygiene after this preflight is accepted, on the pattern of #604 after #603. It is not started here, and it is not a product candidate while this Draft is the writer.

---

## 9. Current risk matrix

| Severity | Item | Class | Why this severity now |
| --- | --- | --- | --- |
| P0 | No live flight, hotel or activity truth | External, then Product Owner | Core commercial journey cannot be real |
| P0 | No live Official Truth | External, then Product Owner | Hard truth must stay unknown |
| P0 | Public launch / indexing not approved | Product Owner | Production deploy is not launch |
| P1 | Finding 5.2 persistent ingestion still open | Product Owner | Gate G unmet; Admin UI is more honest and still not ingestion |
| P1 | No alerting vendor | Product Owner | Detection half of incidents unmet |
| P1 | Retention undecided; consent not persisted | Product Owner | Legal pages exist; lifecycle record does not |
| P1 | Backup/restore and a fresh Supabase inventory not proven at this SHA | Final proof / insufficient | Last Production read is the Preflight 1 closure |
| P1 | Real provider/official E2E impossible | External | Fail-closed is correct until replies |
| P2 | CSP absent and `ACAO: *` on public `GET /` | Later hardening | Re-observed. `/privacy` did not send `ACAO` |
| P2 | `www` does not resolve | Later DNS decision | Apex HTTPS works |
| P2 | No fresh CWV or whole-journey device proof | Final proof | Closed slices stay closed |
| P2 | Production account counts not exposed | Product Owner | Local proof remains the bound |
| P3 | #585 wording deferred | Later legal re-review | Not current engineering |
| P3 | Ticket vendor, Admin F, collaboration, native apps | Later | Not this preflight |
| Closed, do not elevate | Legal pages 404, no SMTP, no Auth redirects, no Terms, no erasure, #543 unmerged, #610 C1–C3 | — | Legal/Auth/erasure were already closed in Preflight 1. C1–C3 closed after it |

---

## 10. Limits

- No Production Supabase readback in this session.
- No provider mailbox was opened.
- No browser journey, no CWV, no device lab, no test rerun beyond reading the existing main CI result.
- No claim that GitHub has zero security advisories.
- No percentage-complete claim.
- The Vercel deployment URL for `e213fa3a` was SSO-protected and is not product truth.
- `next-env.d.ts` local drift is not part of this delivery.
- Global continuity files were not edited, so they remain stale until a later persist.

---

## 11. Traveller context

Relevant to A, E and L. This preflight does not collect citizenships or documents. Closed registry behaviour stays: multiple citizenships and credentials are peer options; residence and issuer country are not citizenship; destination official is not transit official. The Sherpa and IATA inquiries ask for multi-document and transit semantics. Until a source replies, eligibility remains `unknown`.

---

## 12. Stop

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD RELEASE REVIEW.**

Self-review is not PASS. Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not contact KAYAK, Sherpa, IATA or PrivacyBee.
