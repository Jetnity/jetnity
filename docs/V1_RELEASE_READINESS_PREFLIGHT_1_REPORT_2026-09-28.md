# Jetnity V1 Release Readiness Preflight 1 — REPORT

Stand: 28. September 2026  
Status: **PREFLIGHT COMPLETE / NOT A PUBLIC-LAUNCH VERDICT / DRAFT / NOT READY / NOT MERGED**

Issue: #602  
Draft PR: #603  
Branch: `audit/v1-release-readiness-preflight-1`  
Dispatch and live `main`: `532e1cf2a0793bc717991ed7e3d23bf896635c42`  
Task seed on this branch: `20e5db351d52ec5e54c88de6d9ce2d51d3489567`  
Binding task: `docs/V1_RELEASE_READINESS_PREFLIGHT_1_TASK_2026-09-28.md`  
Binding gate: `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`

Logical agent: **Jetnity V1 release readiness preflight 1**, Generation 1  
Required and actual model: **Grok 4.7 High Fast** (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-d56c0f51-0d18-46bb-b614-5839a109a18a`  
Session URL: https://cursor.com/agents/bc-d56c0f51-0d18-46bb-b614-5839a109a18a

Live-evidence window: 2026-09-28T18:25Z–18:32Z. Detail log: `docs/evidence/v1-release-readiness-preflight-1/LIVE_READBACK_2026-09-28.md`.

This preflight does **not** authorize public launch, indexing, provider activation, Production mutation, or a final gate PASS. `PASS_CANDIDATE` is not used below. No section has current evidence sufficient to treat it as preflight-closed.

State rule used here:

- `PARTIAL` — substantial closed substance exists, and a named residual still prevents section closure.
- `BLOCKED` — the dominant unfinished requirement is an external response, a reserved Product-Owner gate, or a missing V1 truth path.
- `UNKNOWN` is not used as a section state. It is used inside a section where this preflight could not re-read a mutable fact.

---

## 1. Kurzüberblick

Jetnity ist auf `main@532e1cf2` ein echtes Prelaunch-Produkt unter `https://jetnity.com`, nicht ein leeres Repository. Geschlossen und nicht neu zu bauen sind unter anderem die Reisegrundlagen, die bestätigte Mehrziel-Startseite, PrivacyBee für Datenschutz und Impressum, die Nutzungsbedingungen CH-DE 1.0, Production-SMTP und Auth-Redirects, der Auth-Callback, der scoped Account-Export und die Production-Kontolöschung nach dem dokumentierten E2E. Öffentliche Indexierung bleibt aus.

Was eine echte V1-Reise noch blockiert, ist keine weitere interne Featureliste. Es fehlen live Flug-, Hotel- und Activity-Wahrheit sowie belastbare Official-Entry-Wahrheit. Dafür liegen drei externe Antworten aus: KAYAK, Sherpa und IATA Timatic. Kein Adapter, kein Signup und kein zweiter Inquiry-Writer ist gerechtfertigt.

Zusätzliche Launch-Reste, die nicht durch Warten auf diese drei Antworten verschwinden: persistente Security-Event-Ingestion (Finding 5.2 / Gate G), ein Alerting-Anbieter, Retention, Consent-Persistenz, Provider-DPAs, ein nicht erneut gelesener Supabase-Production-Bestand, Backup-/Restore-Probe, und der formale Release-Nachweis inklusive Geräte-Gesamtreise. PrivacyBee-Formulierung #585 ist vom Product Owner für den aktuellen Prelaunch zurückgestellt und kein aktueller Engineering-Auftrag.

**Kein V1-kritischer ungated Implementierungs-Slice ist begründet.**

---

## 2. Live facts independently re-read

| Fact | Fresh result |
| --- | --- |
| `main` | `532e1cf2a0793bc717991ed7e3d23bf896635c42`, 0 commits after dispatch |
| Mode | `NORMAL` |
| Active Cursor/runtime writer | none besides this docs preflight on Draft #603 |
| Terms CH-DE 1.0 | live HTTP 200; version and Stand visible; #587 closed completed |
| Account erasure #592 | GitHub closed completed 2026-09-28T14:31:31Z; Production function/migration **not** re-read (see §F) |
| PrivacyBee #585 | open; Product Owner deferred the support inquiry at 2026-09-28T17:03:16Z |
| KAYAK #395 | open; inquiry sent; waiting since 2026-09-28T12:22:55Z |
| Sherpa / IATA #294 | open tracker; both inquiries sent; waiting |
| Public indexing | `noindex, nofollow`; `robots.txt` disallow-all |
| Historical drafts #52 #50 #40 #39 #28 | still open, last updated 21–25 August 2026, not active writers |
| Main CI | run `36447407927` success |
| Vercel Production deployment for that SHA | GitHub deployment `6714440104` success |

---

## 3. Already closed — do not rebuild

| Closed substance | Evidence | Do not |
| --- | --- | --- |
| Trip workspace foundations, guest adopt, traveller registry without default passport, route/transit foundations, destination essentials, planned world map, assistant truth/runtime foundation, PWA installability | Binding build order and later merged closures already on this `main`; `/manifest.webmanifest` live; `/sw.js` 404 | reopen those slices or add a service worker |
| Homepage confirmed multi-destination entry | #543 merged `d03a0486`; #110 closed completed | start a second homepage writer |
| Flight 0..N orchestration, hard-off in Production | `lib/flights/zustand.ts` | activate a provider from this preflight |
| HBX hotel adapter | offline fixture mapper only; #548 merged `e71218b4` | treat fixtures as live hotel truth or add another hotel framework |
| Activity domain | Production hard-off in `lib/activities/zustand.ts` | silently drop Activities |
| Privacy + Impressum | #579 path; live `/privacy` and `/impressum` HTTP 200 with PrivacyBee marker | hand-edit vendor text |
| Terms CH-DE 1.0 | #600 merge `e1f72431`; #601 docs closure; #587 closed; live `/terms` | invent a second terms document or claim retroactive acceptance |
| Auth URL #581, SMTP #582, callback #583 | issues closed; later main ancestry | reopen SMTP/redirect/callback |
| Scoped account export | prior merged export; not re-tested here | rebuild export |
| Production account erasure | #590/#597/#599; #592 closed completed | redeploy or delete another Production user |
| Security-event honest UI, architecture #487, local producer proof #494 | current copy in `lib/admin/ehrliche-zustaende.ts`; no application INSERT | start a second architecture |
| Admin indexing display #547 | read-only display; public indexing still off | turn indexing on |
| Support and incident **process** runbooks | `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md`, `docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md` | invent a ticket vendor |
| Account-count local full-stack proof | closure 27 September; Production exposure still gated | activate Production counts from this preflight |
| KAYAK, Sherpa and IATA inquiries | sent by the Product Owner | resend, accept terms, or code an adapter |

The 22 September remaining-build map is historical. It still describes `/privacy` and `/terms` as Production 404, SMTP as missing, account erasure as not built, and #543 as unmerged. Those rows are superseded by the closures above. Its provider-later and finding-5.2 conclusions are not superseded.

---

## 4. Sections A–O

### A. Product Definition of Done — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Evidence:** V1 DoD requires a real traveller to search real flights, use a real accommodation path, integrate activities unless a Product-Owner launch exception exists, and understand entry requirements from Official Evidence. Current `main` still hard-disables Production flight, hotel and activity search. Official Truth has no contracted source. Foundations in §3 are on `main`. Phase-2/3 items (native apps, collaboration #20, full Admin D–K, multi-provider breadth) are not treated as launch prerequisites.
3. **Closed:** the provider-neutral product core listed in §3, including confirmed homepage route entry.
4. **Residual:** no real commercial path and no real Official Truth path, so the complete Phase-1 journey cannot be shown.
5. **Residual class:** `EXTERNAL_RESPONSE` for KAYAK, Sherpa and IATA, then `PRODUCT_OWNER_GATE` for any selection, contract, secret, spend or launch exception.
6. **Smallest next action:** wait. When a reply arrives, the Technical Lead reviews that reply and its terms before any registration or code.
7. **Severity:** P0 for public launch because the core journey is not yet a real-traveller journey. It is not an open product-code defect and it does not justify a new internal slice.

### B. Security — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Evidence:** Repository Auth/RLS/MFA/AAL work is already merged, including admin AAL2 alignment and existing-factor TOTP. Production flight/hotel/activity calls are hard-off even if a credential were present. Ruleset `21875372` is active with no bypass actors. This preflight found no application `security_events` INSERT. Account deletion deletes linked events; it does not create the ingestion pipeline. `lib/admin/ehrliche-zustaende.ts` still discloses incomplete coverage and that the IP blocklist is not enforced. Dependabot and code-scanning APIs returned 403. Supabase advisors were not readable.
3. **Closed:** do not rebuild Auth callback, SMTP delivery, MFA existing-factor step-up, honest security KPI presentation, ingestion architecture, or the local disposable producer proof.
4. **Residual:** persistent security-event ingestion (finding 5.2) is still open: no Production writer, no retention period N, no Auth-log ingest, no network enforcement. A current independent Security Advisor pass was not obtained. Formal “open critical advisory = 0” is therefore **not** established.
5. **Residual class:** `PRODUCT_OWNER_GATE` for persistent ingestion activation; `UNKNOWN` for current Supabase/GitHub advisory contents.
6. **Smallest next action:** do not start a second ingestion writer. A later Production activation remains a reserved security/migration gate. A read-only advisor replay needs a Production-capable read path; this session did not have one.
7. **Severity:** P1. Empty `security_events` must not be read as “no incidents”. The honest UI prevents a false green dashboard, which is why this is not re-opened as a P0 presentation bug. Unread advisories are an evidence gap, not a discovered vulnerability.

Homepage `GET /` also returned `access-control-allow-origin: *` and no `content-security-policy` header. That observation is limited to the public document response. It is recorded under F as P2 hardening, not as a proven data leak.

### C. Privacy / Legal / Compliance — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Evidence:** Live `/privacy`, `/terms`, `/impressum` and `/register` are HTTP 200, `noindex, nofollow`, and linked from the homepage. Terms show version `CH-DE 1.0`, Stand and Inkrafttreten `28. September 2026`. #587 is closed. #592 is closed on GitHub after the documented Production E2E. `keineConsentPersistenz` remains `true`. #585 comment 2026-09-28T17:03:16Z defers the PrivacyBee support inquiry and accepts the current generated wording for Switzerland-first prelaunch, with a later re-review. No passport/MRZ/biometric/health store was added.
3. **Closed:** legal-claim hygiene, PrivacyBee technical integration, CH-DE 1.0 publication, scoped export, Production erasure E2E as recorded by the Technical Lead. Do not hand-edit PrivacyBee text and do not claim existing accounts accepted CH-DE 1.0.
4. **Residual:** retention periods are still not decided or enforced. Consent is not persisted. Provider DPAs do not exist because no provider contract exists. #585 remains a later legal re-review, not a current code task. This preflight did not re-read the generated PrivacyBee paragraphs and does not invent a legal-basis conclusion.
5. **Residual class:** `PRODUCT_OWNER_GATE` for retention, consent persistence (Production migration), and future provider DPAs. #585 is `LATER_NOT_V1_CRITICAL` for continued prelaunch engineering and remains relevant before a broader legal sign-off.
6. **Smallest next action:** leave #585 deferred. Do not persist consent or invent a retention number in an ungated slice.
7. **Severity:** P1 for launch because retention and consent-version records are still absent after real legal pages exist. The old P0 “legal pages 404” is closed and must not be repeated.

### D. Provider / Commercial / Licensing — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Evidence:** #395 is open. Comment 2026-09-28T12:22:55Z records that the Product Owner sent `A-KAYAK-INQUIRY-1` and that signup, Terms acceptance, credentials, API calls, spend and runtime adapter work remain unauthorized. No flight, hotel or activity provider is live. HBX on `main` is an offline fixture mapper (`evidenceMode=fixture` in the foundation status; no live HTTP wiring in that slice).
3. **Closed:** provider-neutral flight orchestration, hotel/activity ports, S4–S8 foundations as previously merged, and the sent KAYAK inquiry. Do not rebuild them and do not resend the inquiry.
4. **Residual:** KAYAK has not replied. Even a positive reply does not select a provider or close hotel/activity. Activities still need a real path or an explicit Product-Owner launch exception. No DPA, licence, caching, attribution, credential rotation, live cost cap or live failure E2E exists for a V1 provider.
5. **Residual class:** `EXTERNAL_RESPONSE`, then `PRODUCT_OWNER_GATE`.
6. **Smallest next action:** Technical Lead reviews the full KAYAK reply and any linked terms before any next action. No Cursor writer now.
7. **Severity:** P0. Public launch is blocked by an untested real provider path and by an unresolved contract/licence/DPA gate. Kill switches in code are present and are not a substitute for a live provider.

### E. Entry Requirements / Official Truth — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Evidence:** #294 comment 2026-09-28T17:04:56Z records that E1–E5 and the readiness workspace are already integrated and that another provider-neutral engine is not justified. Comment 2026-09-28T17:59:04Z records the Sherpa information-only email as sent. Comment 2026-09-28T18:21:25Z records the IATA business-form submission as sent, including the form’s website Terms acceptance, and states that no Timatic commercial/API contract, credential, call, spend or provider selection followed. Both are waiting. Repository rules still keep `unknown` distinct from `not_required`. No visa or health rule was invented here.
3. **Closed:** Foundation C/E, official actions, temporal contracts, readiness presentation, destination-essentials presentation. Do not create another status model or table.
4. **Residual:** no Official Evidence source is contracted or callable. Multi-citizenship, multi-document, transit and credential-change behaviour cannot be proven end to end against a real source. Sherpa’s public mapping mismatches and IATA’s form-only Terms acceptance remain external facts, not Jetnity hard truth.
5. **Residual class:** `EXTERNAL_RESPONSE`, then `PRODUCT_OWNER_GATE` for any later contract.
6. **Smallest next action:** wait for Sherpa and IATA. Review each full reply before signup, credentials or an adapter. Evaluate every traveller and every legal credential option; do not default a passport or infer nationality from origin.
7. **Severity:** P0. An untested Official Truth path blocks public launch. The correct current behaviour is fail-closed `unknown`, which must not be redesigned into a guessed `not_required`.

### F. Production Configuration — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Evidence:** Public Production alias serves the Terms release. HTTP redirects to HTTPS. HSTS `max-age=63072000` is present on `https://jetnity.com/`. `www.jetnity.com` does not resolve. Apex DNS address `216.150.1.1` matches the earlier domain closure; DNSSEC was not re-checked. Robots disallow-all, empty sitemap, and `noindex, nofollow` match the pre-launch indexing rule. Manifest is live. GitHub records Production deployment success for `532e1cf2`. #601 is docs-only on top of the Terms runtime merge, so the public HTML does not by itself prove the alias SHA; the GitHub Production deployment record does.
3. **Closed:** indexing remains disabled. Do not enable it. Domain/PrivacyBee/SMTP/Auth URL/Terms/erasure closures stay closed as GitHub facts.
4. **Residual:** injected Supabase credentials returned HTTP 401 and pointed at a non-production ref, so this preflight did **not** re-inventory Production migrations, Edge Functions, Auth Site URL, advisors or backups. The documented erasure closure says `account-delete-v1` is active and migration `20260927230000` is applied; that remains Technical-Lead evidence, not a new readback. No CSP header was observed on `GET /`. `access-control-allow-origin: *` was observed on that same public response.
5. **Residual class:** `UNKNOWN` for unread Supabase Production inventory; `FINAL_RELEASE_PROOF` for a later exact production-config bundle in the final gate artifact. Header hardening is not an authorized change in this preflight.
6. **Smallest next action:** do not mutate Supabase or DNS. The final gate’s Supabase section needs a fresh Production read by someone with a Production read path.
7. **Severity:** P2 for the unread inventory and the header observation. Indexing-off is correct, not a defect. The historical P0/P2 “Production Auth still on localhost” and “no SMTP” findings are closed on GitHub and are not elevated.

### G. Monitoring / Logging / Alerting — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Evidence:** Finding 5.2 remains open in current source, as B describes. Admin health/usage surfaces exist and are required to stay honest when ingestion is absent. The incident runbook states that no Sentry/Datadog/Axiom/Logtail/PagerDuty provider is selected. No new alerting vendor was observable on the public site, and none was contacted.
3. **Closed:** honest admin copy, architecture, local producer proof, and the incident process half. Do not add a monitoring SaaS from this map.
4. **Residual:** technical errors, provider health, cost alerts and security events are not on an owned alerting path. Provider health is also untestable while providers are hard-off. Persistent ingestion is still not activated.
5. **Residual class:** `PRODUCT_OWNER_GATE` (new processor and possible cost; persistent ingestion activation).
6. **Smallest next action:** keep the honest unknown/not-configured disclosure. Do not install an observability vendor without a reserved gate.
7. **Severity:** P1. Gate O treats missing operational detection as a launch block. It is not a reason to fake events or to rebuild #487/#494.

### H. Backup / Recovery / Incident — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Evidence:** Incident runbook and admin MFA-loss runbook are on `main`. They explicitly do not prove a backup/restore rehearsal. Provider kill-switch behaviour is implemented in code as Production hard-off. Vercel has a successful Production deployment for current `main`, which shows a deploy exists; it does not show a rehearsed rollback. Supabase backup configuration was not readable.
3. **Closed:** the process/responsibility half of finding 5.5 and the MFA-loss procedure. Do not rewrite those runbooks as if monitoring already exists.
4. **Residual:** no fresh backup inventory and no restore rehearsal. Migration rollback strategy is documented in the incident process only as far as that runbook goes; it was not executed.
5. **Residual class:** `FINAL_RELEASE_PROOF`, with Supabase backup presence currently `UNKNOWN`.
6. **Smallest next action:** do not run a restore against Production. A later read-only backup inventory can be part of the final gate, not a new product slice.
7. **Severity:** P1 because gate O blocks launch without basic backup/recovery protection, and this preflight cannot show that protection was tested. Absence of a vendor backup product is not claimed.

### I. Analytics / Conversion / Revenue — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Evidence:** Admin revenue honesty work remains the correct posture: no provider-backed commercial path, so no real revenue. Account-count local full-stack proof is closed; its closure still forbids Production migration/RPC exposure. Public indexing and a consent-persisted analytics programme are not live. No booking/affiliate handoff can be measured because no live provider handoff exists.
3. **Closed:** removal of fake revenue tiles; local account-count proof; honest “no commercial path” disclosure. Do not invent a revenue dashboard.
4. **Residual:** real attribution waits on a real provider. Production account-count exposure remains a separate Production/privilege gate. `unknown` attribution must stay unknown.
5. **Residual class:** `EXTERNAL_RESPONSE` plus `PRODUCT_OWNER_GATE` for Production account-count exposure. A full growth/analytics plane is `LATER_NOT_V1_CRITICAL`.
6. **Smallest next action:** do not activate Production account counts and do not create conversion charts.
7. **Severity:** P2 until a provider exists. It becomes part of the P0 commercial cluster only when a real handoff is being switched on. It is not today’s implementation task.

### J. Performance / Accessibility — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Evidence:** Mobile Accessibility 1 and later accepted visual repairs (tablet hero, navbar, planner reflow) are historical closures on `main`. This preflight did not rerun them and did not measure Core Web Vitals. Provider paths are hard-off, so provider timeout/retry E2E against a live vendor was not possible. Flight search already has bounded body reads in `lib/flights/anfrage.ts`; that is code structure, not a fresh latency measurement.
3. **Closed:** those accepted accessibility/layout slices. Do not rerun them as if they were open.
4. **Residual:** no current CWV number and no claim that the whole core journey is free of V1-critical accessibility defects on real devices.
5. **Residual class:** `FINAL_RELEASE_PROOF`.
6. **Smallest next action:** leave closed slices closed. Measure the real journey only after real provider and Official Truth paths exist.
7. **Severity:** P2. No new P0/P1 accessibility defect was observed because this preflight did not re-test the UI. Lack of a fresh number is not evidence of a regression.

### K. Mobile / Browser / PWA — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Evidence:** Live manifest is standalone, scoped to `/`, and its three PNG icons return HTTP 200. `/sw.js` is 404, which matches the closed PWA-1 decision that offline/push are not V1. No iPhone, Android or desktop browser journey was executed in this session.
3. **Closed:** PWA installability and the earlier mobile accessibility closures. Do not add a service worker.
4. **Residual:** the gate requires the complete core journey on real or realistic devices. That journey cannot include real flights, hotels, activities or official rules yet.
5. **Residual class:** `FINAL_RELEASE_PROOF`.
6. **Smallest next action:** do not open a device-lab slice for a journey whose commercial and official steps are still fail-closed.
7. **Severity:** P2 as release proof. It is not a reason to rebuild mobile chrome.

### L. End-to-End / Failure / Concurrency — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Evidence:** Guest/account, traveller and route foundations are merged and have historical tests. Production account-erasure E2E is recorded as passed on a disposable Production account; this session did not repeat it. Real flight/hotel/activity and Official Truth failure cases cannot be executed. Parallel-write and rate-limit behaviour for a live provider is therefore untested. Production search flags fail closed before a provider call.
3. **Closed:** do not rebuild guest adopt, erasure, or provider-neutral failure semantics. Do not treat fixture hotel mapping as a live hotel E2E.
4. **Residual:** provider-outage, stale official evidence, commercial adoption and readiness re-evaluation against real inputs remain impossible until D and E move.
5. **Residual class:** `EXTERNAL_RESPONSE`. Cases that only exist after a contract are not current test work.
6. **Smallest next action:** do not write speculative E2E against invented provider payloads.
7. **Severity:** P1 for launch reliability of the real path. Existing fail-closed behaviour is the correct prelaunch control.

### M. Support / Operations — `PARTIAL` — P3

1. **State:** `PARTIAL`.
2. **Evidence:** The support runbook defines `info@jetnity.ch`, minimised data handling, and escalation into the incident runbook. It does not grant direct Production database access. SMTP for Auth mail was later closed separately; that does not create a ticket system. Admin support RPC / minimised trip card was still a remaining-build-map residual and was not found as a newly merged support console in this read.
3. **Closed:** the process half. Do not rebuild the runbook or buy a helpdesk.
4. **Residual:** no ticket vendor, no SLA, no in-product support form. Those are named later items.
5. **Residual class:** `LATER_NOT_V1_CRITICAL` for a helpdesk. The defined mailbox path is enough for the current prelaunch process bar.
6. **Smallest next action:** keep using the existing mailbox process. Do not add a support product.
7. **Severity:** P3. Gate M’s “channel and responsibility defined” and “no uncontrolled Production DB access” parts are met as documentation. A vendor queue is not a current V1 blocker.

### N. Release / Launch Control — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Evidence:** Indexing is off. No Private Alpha, Closed Beta or Swiss Public Launch approval was found in the live issue set. Successful Vercel Production deploys are prelaunch deploys, not launch approval. The binding sequence remains Alpha, then Swiss beta, then Swiss public launch.
3. **Closed:** the prelaunch indexing kill switch is behaving as designed.
4. **Residual:** explicit Product-Owner public-launch approval does not exist, and the earlier gates are not ready to ask for it.
5. **Residual class:** `PRODUCT_OWNER_GATE`.
6. **Smallest next action:** do not change robots, sitemap, or domain indexing. Do not declare a launch stage.
7. **Severity:** P0 if someone treated today’s Production deploy as permission to launch. As a controlled hold, it is the correct state.

### O. Final blocker rules — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Evidence:** The binding rule blocks public launch while any of the following remain: open P0, open P1 in the core journey/security/privacy/truth/provider/reliability, unresolved provider contract/DPA, missing legal/privacy approval for the real processing set, unproven production configuration, untested real provider or Official Truth path, unlimited cost path for a live provider, missing proven backup/recovery protection, or fixture data used as hard truth. Several of those conditions are true today: D, E, A, G, and the unread parts of F and H.
3. **Closed:** fixture hotel data is not wired as Production hotel truth. Indexing is not on. Terms, privacy and erasure are no longer the old open legal/deletion blockers.
4. **Residual:** the blocker rule is doing its job. This document is not section P’s final gate artifact and it contains no Technical-Lead final verdict and no Product-Owner launch approval.
5. **Residual class:** `FINAL_RELEASE_PROOF` plus the external and Product-Owner residuals named above.
6. **Smallest next action:** stop this preflight for independent exact-head review. Do not convert it into the launch gate.
7. **Severity:** P0 for any public-launch attempt. Not a code emergency.

---

## 5. Duplicate / integration audit

No new slice is named.

| Candidate someone might restart | Why it is not next |
| --- | --- |
| Another flight/hotel/activity engine | Ports and Production hard-off already exist. KAYAK is waiting. |
| Another Official Truth model | E1–E5 are integrated. Sherpa and IATA are waiting. |
| Legal page copy | Live pages exist. #585 forbids hand-editing. |
| Consent persistence | Real documents now exist, but persistence is still `false` by the Terms closure and needs a Production migration gate. Not ungated. |
| Retention job | No Product-Owner period N. |
| Security ingestion runtime | Architecture and local proof exist. Persistent activation is reserved. |
| Observability SaaS | Cost and processor gate. |
| Homepage or #110 | Merged / closed completed. |
| Account erasure | #592 closed. |
| Account-count Production exposure | Explicitly still gated after local PASS. |
| Admin F, AP-8/9/11/12, Billing-P1, Guardian, What-if | Not V1-critical, or reserved. |
| Historical drafts #52 #50 #40 #39 #28 | Stale. Do not resume. |
| This preflight’s header note | A later security-header look may be useful. It is not authorized here and is not the traveller-critical path. |

---

## 6. Current risk matrix

| Severity | Item | Class | Why this severity now |
| --- | --- | --- | --- |
| P0 | No live flight, hotel or activity truth | External, then Product Owner | Core commercial journey cannot be real |
| P0 | No live Official Truth | External, then Product Owner | Hard truth must stay unknown |
| P0 | Public launch / indexing not approved | Product Owner | Production deploy is not launch |
| P1 | Finding 5.2 persistent ingestion still open | Product Owner | Gate G unmet; UI already honest |
| P1 | No alerting vendor | Product Owner | Detection half of incidents unmet |
| P1 | Retention undecided; consent not persisted | Product Owner | Legal pages exist; lifecycle record does not |
| P1 | Backup/restore and Supabase inventory not freshly proven | Final proof / unknown | Do not invent a pass |
| P1 | Real provider/official E2E impossible | External | Fail-closed is correct until replies |
| P2 | CSP absent and `ACAO: *` on public `GET /` | Later hardening | Observed only on the public document |
| P2 | `www` does not resolve | Later DNS decision | Apex HTTPS works |
| P2 | No fresh CWV or whole-journey device proof | Final proof | Closed slices stay closed |
| P2 | Production account counts not exposed | Product Owner | Local proof is enough for now |
| P3 | #585 wording deferred | Later legal re-review | Product Owner: not current engineering |
| P3 | Ticket vendor, Admin F, collaboration, native apps | Later | Not this preflight |
| Closed, do not elevate | Legal pages 404, no SMTP, no Auth redirects, no Terms, no erasure, #543 unmerged | — | Superseded on 27–28 September |

---

## 7. Limits

- No Production Supabase readback. Management API returned 401 against a non-production ref.
- No provider mailbox was opened. Waiting state is the GitHub comment, not an inbox check.
- No browser journey, no CWV, no device lab, no test rerun.
- No claim that GitHub has zero security advisories.
- No percentage-complete claim.
- Preview deployment for #603 was not used as Production truth.
- `next-env.d.ts` local drift was discarded and is not part of this delivery.

---

## 8. Traveller context

Relevant to A, E and L. This preflight does not collect citizenships or documents. Closed registry behaviour stays: multiple citizenships and credentials are peer options; residence and issuer country are not citizenship; destination official is not transit official. The Sherpa and IATA inquiries ask for multi-document and transit semantics. Until a source replies, eligibility remains `unknown`.

---

## 9. Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Self-review is not PASS. Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not contact KAYAK, Sherpa, IATA or PrivacyBee.
