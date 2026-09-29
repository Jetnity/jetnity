# Jetnity V1 Release Readiness Preflight 3 — REPORT

Stand: 30. September 2026
Status: **R1 CORRECTION AFTER CHANGES REQUIRED `5359714624` / NOT A PUBLIC-LAUNCH VERDICT / DRAFT / NOT READY / NOT MERGED**

Issue: #631
Draft PR: #632
Branch: `audit/v1-release-readiness-preflight-3`
Dispatch baseline and live `main` at the read window: `60148274765f2143722b2742607ee3cf03730bcb`
Task seed on this branch: `75909f49b90e2635b6c316e97c87198ac6b1a62c`
Binding task: `docs/V1_RELEASE_READINESS_PREFLIGHT_3_TASK_2026-09-30.md`
Accepted prior map: `docs/V1_RELEASE_READINESS_PREFLIGHT_2_REPORT_2026-09-29.md`
Accepted prior closure: `docs/V1_RELEASE_READINESS_PREFLIGHT_2_CLOSURE_2026-09-29.md`
Binding build order: `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
Binding gate: `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`

Logical agent: **Jetnity V1 release readiness preflight 3**, Generation 1
Required and actual model: **Grok 4.7 High Fast** (`originalModelName=grok-4.7-high-fast`)
Session: `bc-bc5cfa85-7a5c-4208-9aee-ba9c0256d2e2`
Session URL: https://cursor.com/agents/bc-bc5cfa85-7a5c-4208-9aee-ba9c0256d2e2

Live-evidence window: 2026-09-29T23:08Z–23:13Z, plus the mandatory pre-handoff `main` re-fetch recorded in the handoff. Public HTTP was read in this session. No separate evidence-directory file was created; the task allowlist does not include one.

Reviewed head `e21a876b4f3b6a0b7f1a1a76a3e2be06efbeee51` received CHANGES REQUIRED in review `5359714624`. This correction is the same writer and the same session. It is the R1 head only after the delivery commit. That reviewed head is not the re-review head.

This preflight implements nothing. It does not authorize public launch, indexing, provider activation, a Next.js upgrade, Production mutation, #626 closure, or a final gate PASS. No section has current evidence sufficient to treat it as preflight-closed.

State rule, same as Preflight 2:

- `PARTIAL` — substantial closed substance exists, and a named residual still prevents section closure.
- `BLOCKED` — the dominant unfinished requirement is an external response, a reserved Product-Owner gate, or a missing V1 truth path.

Supersession labels, now measured against accepted Preflight 2:

- `UNCHANGED_SINCE_PREFLIGHT_2` — the class and the blocking fact are the same.
- `CHANGED_DETAIL_STILL_OPEN_GATED` — a later merge or decision changed the detail, and the row stays gated.
- `STILL_OPEN_GATED` — still open, and engineering must not start it without an external reply review or a Product-Owner special gate.
- `RELEASE_PROOF_MISSING` — the missing piece is final release evidence rather than a new feature.
- `DELIBERATELY_LATER` — explicitly deferred or outside the current V1 launch path.
- `NOT_APPLICABLE_NOW` — not a current launch row.
- `INSUFFICIENT_CURRENT_EVIDENCE` — this session could not re-prove a mutable hosted fact.

---

## 1. Kurzüberblick

`main` ist weiterhin ein echtes Prelaunch-Produkt auf `https://jetnity.com`. Preflight 2 bleibt die akzeptierte Release-Grenze, bis der Technical Lead diese Neubewertung unabhängig annimmt. Diese Runde ist keine Launch-Freigabe.

Seit Preflight 2 ist Material passiert, und keines davon öffnet einen sofort ausführbaren V1-Implementierungsschnitt:

- #628 ist gemergt. Der genehmigte Development-Producer für Security-Events ist nach den zuletzt aufgezeichneten nicht-personenbezogenen Receipts installiert und aktiv. Finding 5.2 und Release Gate G bleiben offen. Production-Ingestion ist nicht aktiviert.
- #626 ist **OPEN** und wurde nach dem Merge von #630 ausdrücklich wieder geöffnet. D1 und das begrenzte D2-MFA sind nur in ihren aufgezeichneten Grenzen akzeptiert. Die temporäre Operator-Berechtigung ist **nicht** hergestellt. Drei echte Producer-Events sind **NOT STARTED**. Authentifiziertes populated Erasure ist **NOT RUN**. Die blockierte privilegierte Rollen-/Fixture-Operation darf nicht wiederholt, umformuliert, delegiert oder umgangen werden.
- #630 / #629 sind geschlossen. Akzeptierter Head `895ac7575bb1c130f0f78c7eaaebd97283faf80f`. Technical-Lead FINAL PASS Review `5359458734`. Merge `60148274765f2143722b2742607ee3cf03730bcb`. Post-Merge-CI `36642027878` **SUCCESS**, inklusive Auth 55/55. Vercel-Production-Status auf diesem SHA ist success, Inspector `dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm`.
- Sherpa hat geantwortet. Der Product Owner hat ausgehende Provider-Fragen pausiert. KAYAK und IATA stehen auf den letzten gesendeten Repository-Kommentaren. Kein Provider ist gewählt.
- R1 prüft die Next.js-Linie. `next` und `eslint-config-next` stehen auf `16.3.3`. npm `latest` ist `16.3.7`. Der offizielle September-Sicherheitshinweis sagt in der aktuellen Fassung, dass `16.3.7` ein Bugfix ist und die neun Schwachstellen nicht enthält. Erwartet wird `16.3.8` / `15.5.27`. `next@16.3.8` ist nicht im Registry.

**Immediate ungated V1 implementation candidates: NONE.** Der September-Sicherheitspatch ist nicht installierbar, solange `16.3.8` nicht veröffentlicht ist. `16.3.7` ist dafür das falsche Ziel. Begründung in §8.

---

## 2. Live facts independently re-read

| Fact | Fresh result |
| --- | --- |
| Mode | `NORMAL` in `.jetnity/operating-mode.json`. The embedded `activeMetaScope` still names historical Continuity Refresh 1. It is not the current writer. This slice does not edit that file. |
| `main` | `60148274765f2143722b2742607ee3cf03730bcb` — `Merge #630: reconcile Development acceptance continuity`, commit time 2026-09-30 00:51:42 +0200. This session fetched `origin/main` and matched the dispatch baseline. |
| This branch at the read | `75909f49b90e2635b6c316e97c87198ac6b1a62c`, merge-base `60148274765f2143722b2742607ee3cf03730bcb`, 1 ahead / 0 behind before this delivery commit. |
| Active Cursor writer | this docs preflight only. Draft #632. |
| Open PRs | Draft #632 (this preflight). Historical drafts #52, #50, #40, #39, #28, last updated 21–25 August 2026. Not active writers. |
| Open issues | #631 this task; #626 open and reopened; #585 PrivacyBee deferred; #440 standing authorization; #395 KAYAK; #294 Sherpa/IATA; #236 strategy register; #20 collaboration. |
| #628 | **MERGED** 2026-09-29T12:09:24Z at `94f2747137e2a788c7120f27dc1f23cde12cbcf1`. Do not restart that writer. |
| #630 | **MERGED**. Review `5359458734` is GitHub state `COMMENTED` on `895ac7575bb1c130f0f78c7eaaebd97283faf80f`; the review body is the Technical-Lead FINAL PASS. An earlier review `5359223515` on the same SHA is also `COMMENTED`. |
| Post-merge CI | Run `36642027878` **SUCCESS** on the merge SHA. Jobs `Auth-Konfiguration gegen config.toml` and `Typecheck, Lint & Build` both success. Auth log: 55 values, 243 keys, all 55 expected values match. |
| Post-merge Vercel | Commit status context `Vercel` **success**, “Deployment has completed”, updated 2026-09-29T22:52:19Z. Inspector path `dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm`. GitHub Deployment `6747268585`, environment **Production**, state **success**, same SHA. This session did not open the Vercel dashboard and did not prove that the public alias bytes are that SHA. |
| #626 | **OPEN**, `state_reason=reopened`, updated 2026-09-29T22:52:55Z. Latest comment `5900593201` reopens it after GitHub closed it on the #630 merge. No new acceptance evidence in that comment. |
| Development producer | This session’s Management API call returned **401**. No hosted SQL was run. The latest recorded non-personal health remains the Technical-Lead readback inside review `5359458734` (2026-09-29T22:51:37Z) and the earlier receipt `5898958642`. Those receipts are not a fresh query by this session. |
| KAYAK #395 | Latest comment `5869751056` at 2026-09-28T12:22:55Z: `A-KAYAK-INQUIRY-1` sent. No later comment. |
| Sherpa / IATA #294 | Latest comments are the Sherpa intake `5888189192` (2026-09-29T10:16:15Z), the Product-Owner pause `5888940598` (2026-09-29T11:03:26Z), and the read-only alternatives note `5889155160` (2026-09-29T11:17:03Z). IATA remains the sent-form comment `5875963553` at 2026-09-28T18:21:25Z. |
| #585 | Latest comment `5874769319` at 2026-09-28T17:03:16Z. Deferral unchanged. Issue `updated_at` matches that comment. |
| Public site | `http://jetnity.com/` returns **308** to `https://jetnity.com/`. HTTPS `/`, `/privacy`, `/terms`, `/impressum` are **200**. HSTS is present. No `Content-Security-Policy` header was present on `GET /`. `access-control-allow-origin: *` was present on `/` and `/terms`, and absent on `/privacy` and `/impressum`. |
| Indexing | Live pages send `noindex, nofollow`. `robots.txt` is `Disallow: /`. `sitemap.xml` is an empty `urlset`. |
| `www` | `www.jetnity.com` does not resolve. Apex resolves. |
| Manifest | Live, `display=standalone`, `scope=/`, `start_url=/`. Three PNG icons return **200**. `/sw.js` is **404**. |
| Public deployment binding | This R1 session re-read `https://jetnity.com/` HTML and found `data-dpl-id=dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm`, the #630 Production deployment. The same binding is in TL comment `5900885296`. Root HTML also contains `noindex`. |
| Production advisor / erasure / producer | Attributed to TL comment `5900885296` and review `5359714624`. This session did not run those hosted queries. The earlier Management API **401** is an agent-access limit and does not override those receipts. |
| Next.js pin | `package.json` pins `next` and `eslint-config-next` at `16.3.3`. React `19.2.8`, eslint `9.39.5`, TypeScript `5.9.3`. Repository search: **0** `next/og`, **0** `ImageResponse`. |

---

## 3. Fact, inference, gap, recommendation

Facts above are the live reads. The inference is that the readiness classification did not gain an ungated implementation. The gap is that this session could not repeat the hosted Development/Production catalog query. The recommendation is to stop for independent Technical-Lead review and not to dispatch a product writer from this map.

---

## 4. What changed since Preflight 2

| Item | Class now | What changed |
| --- | --- | --- |
| A real commercial journey | `STILL_OPEN_GATED` | KAYAK is still the sent inquiry. Outgoing questions are paused, so this preflight does not chase it. Production search remains hard-off in source. |
| A Official Truth | `CHANGED_DETAIL_STILL_OPEN_GATED` | Sherpa is **RESPONSE RECEIVED / PO CONSIDERATION / OUTGOING FOLLOW-UP PAUSED**. That is no longer “waiting for the first reply”. It is also not a selected source, contract, credential, or adapter. IATA remains sent/waiting on GitHub. The alternatives note selects nothing. |
| B finding 5.2 persistent ingestion | `CHANGED_DETAIL_STILL_OPEN_GATED` | #628 installed the approved Development producer. Review `5359714624` records post-#630 Development health: active/healthy, seven-day retention, hourly job, cap 1000 / used 0, five triggers, zero origin rows, no trigger/catalog fault. Production metadata in that review has none of those objects and zero matching triggers. Production ingestion and Release Gate G are not closed. #626’s populated proof is blocked. |
| B fresh advisor replay | Current attributed read, residual WARN | TL comment `5900885296` is a fresh Production Security Advisor result: WARN, not ERROR. RLS, ownership, capability and AAL2 controls were re-read with it. This is not a closure of every warning and not a personal query by this session. The Preflight 1 closure is no longer the latest advisor receipt. |
| Framework security line | `CHANGED_DETAIL` / not an executable slice yet | Pin remains `16.3.3`. Published `16.3.7` is a bugfix. The nine-vulnerability release is expected as unpublished `16.3.8`. See §8. |
| C legal pages | Already closed; reconfirmed | Live `/privacy`, `/terms`, `/impressum` are HTTP 200. |
| C retention and consent | `UNCHANGED_SINCE_PREFLIGHT_2` / `STILL_OPEN_GATED` | `keineConsentPersistenz` remains `true`. |
| C #585 | `DELIBERATELY_LATER` | Deferral comment unchanged. |
| C provider DPAs | `STILL_OPEN_GATED` | No provider contract exists. The Sherpa reply is not an acceptance. |
| D KAYAK | `STILL_OPEN_GATED` | No newer GitHub comment. Pause says not to start a new enquiry. |
| E Sherpa and IATA | `CHANGED_DETAIL_STILL_OPEN_GATED` | See row A Official Truth. |
| F SMTP / Auth URL / callback | Already closed; #630 reconciled the repository Development redirect expectation | #630 does not apply Auth config and does not reopen the closed Production Auth/SMTP gates. This session did not send mail and did not read Auth users. |
| F Production erasure function | Current attributed read | TL comment `5900885296` lists Production `account-delete-v1` ACTIVE v1 with `verify_jwt=true`. This session did not call the Supabase API. |
| F public alias binding | Reconfirmed by this session | Root HTML `data-dpl-id` is `dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm`. |
| F indexing off | Reconfirmed, correct hold | Not a defect. |
| F missing CSP and `ACAO: *` | `DELIBERATELY_LATER` | Re-observed. `/` and `/terms` sent `ACAO: *`. `/privacy` and `/impressum` did not. |
| F `www` does not resolve | `DELIBERATELY_LATER` | Reconfirmed. Apex HTTPS works. |
| G alerting vendor | `STILL_OPEN_GATED` | Incident runbook still names no selected Sentry/Datadog/Axiom/Logtail/PagerDuty provider. The Development producer is not that vendor. |
| G Development producer | `CHANGED_DETAIL_STILL_OPEN_GATED` | Post-#630 non-personal health is the TL statement in review `5359714624`. Production has none of those producer objects in that same statement. Not Production detection. |
| H backup/restore proof | `RELEASE_PROOF_MISSING` | Not re-run. Supabase backup settings were not readable. |
| I real revenue / account counts | `STILL_OPEN_GATED` | No live provider. Production account-count exposure stays separately gated. |
| J fresh CWV / accessibility proof | `RELEASE_PROOF_MISSING` | No UI was retested. |
| K whole-journey device proof | `RELEASE_PROOF_MISSING` | Manifest reconfirmed by HTTP. No device journey. |
| L real provider/official E2E | `STILL_OPEN_GATED` | Still impossible. #626 populated erasure is a different, also blocked, proof. |
| M ticket vendor | `DELIBERATELY_LATER` | Mailbox process remains the prelaunch bar. |
| N public launch / indexing | `STILL_OPEN_GATED` | Indexing is off. No Alpha, beta or public-launch approval was found. |
| O final blocker rule | `STILL_OPEN_GATED` | A, D, E, G and the unread parts of F and H still meet the block conditions. The Sherpa reply does not remove them. |
| Admin F / AP-8 / AP-9 / AP-11 / AP-12 | `NOT_APPLICABLE_NOW` | Unchanged. Do not rebuild Admin F. |
| Continuity pointers | Process hygiene inside this allowlist | `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still described Draft #630 as the open writer. This delivery corrects that pointer. It is not a product candidate. |

---

## 5. Sections A–O

### A. Product Definition of Done — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Changed since Preflight 2:** `STILL_OPEN_GATED`. The commercial and official truth paths did not become real. Sherpa’s reply is under Product-Owner consideration and does not select a source.
3. **Evidence:** V1 still requires a real traveller path for flights, accommodation and activities unless a launch exception exists, and Official Evidence for entry requirements. `lib/flights/zustand.ts` returns `{ aktiv: false, grund: 'production' }` in Production. `lib/hotels/zustand.ts` and `lib/activities/zustand.ts` use the same Production kill switch in `lib/provider-ops/zustand.ts`. No provider is selected. Binding build order §§1–2 still require an explicit Product-Owner gate before a live flight path. Phase-2/3 work is not treated as a launch prerequisite.
4. **Missing action:** do not start a provider, hotel, activity or Official Truth implementation. A later Product-Owner release of the question pause still requires Technical-Lead review of the full reply and linked terms before any send, signup or adapter.
5. **Gate owner:** Product Owner for the pause, any selection, contract, secret, spend or launch exception. External party for KAYAK and IATA. Technical Lead for the review.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** V1 launch-critical. Not an open product-code defect.
8. **Uncertainty:** a KAYAK or IATA reply may already exist in a mailbox that was not opened. GitHub has no newer comment. The Sherpa commercial amounts were deliberately not copied into the repository.

### B. Security — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** `CHANGED_DETAIL_STILL_OPEN_GATED` for finding 5.2. The Production advisor residual is a fresh attributed WARN read, not an insufficient-evidence gap. The Next.js security line is assessed in §8 and is not an executable bump in this PR.
3. **Evidence:** Auth/RLS/MFA/AAL work remains merged. Production provider calls stay hard-off in source. Ruleset `21875372` remains the documented live baseline; this session did not mutate it and did not re-call the ruleset API. Admin security routes read `security_events`. Account deletion deletes linked events. No application INSERT was found in `app/api/admin/security/**` or `supabase/functions/account-delete-v1/index.ts`. The Development producer SQL lives under `scripts/db/security-events-dev-1/` and is not a `supabase/migrations` Production apply. Review `5359714624` records post-#630 non-personal Development health: producer active/healthy, seven-day retention, hourly job active, cap 1000 / used 0, five producer triggers, zero origin rows, no trigger/catalog fault. The same review says Production metadata has none of those Development producer objects and zero matching triggers. Comment `5898958642` and review `5359458734` are the earlier receipts of the same shape. This session’s Management API **401** is an access limit. It does not replace and does not contradict the Technical-Lead receipts. This session did not personally run the hosted SQL. TL comment `5900885296` records a fresh Production Security Advisor result at WARN, not ERROR: GraphQL visibility warnings for `airports` / `places` to anon and 22 public tables to authenticated, plus 9 authenticated-callable `SECURITY DEFINER` functions. The same comment records RLS enabled on the reviewed sensitive/account/trip tables, `auth.uid() = user_id` ownership on account/traveller/trip tables, operational capability predicates on `blocked_ips`, `payments`, `refunds`, `security_events`, `stripe_webhooks`, and `model_usage`, AAL2 inside `darf_betrieb_lesen()`, `darf_betrieb_eingreifen()`, and `darf_konten_verwalten()`, uid-constrained visit writers, `darf_betrieb_lesen()` inside admin aggregate functions, and a bounded `search_path` on the inspected SECURITY DEFINER functions. Those warnings stay open as visibility/definer notices. They are not evidence of a proven cross-account defect, and this preflight does not propose an ACL or RLS rewrite. #626 comment `5900593201` keeps temporary operator permission **NOT established**, three genuine events **NOT STARTED**, and authenticated populated erasure **NOT RUN**. The blocked role operation in comment `5898480236` was not retried.
4. **Missing action:** do not continue #626, do not generate events, do not rewrite Production RLS from the WARN list, and do not start a Production ingestion writer. A later persistent-ingestion activation remains a reserved security/migration gate. The framework maintenance decision is §8, not a second security writer inside this draft.
5. **Gate owner:** Product Owner for persistent Production ingestion and any Production security change. Technical Lead for the attributed advisor classification. No current actor is authorized to route around the #626 tool-safety block.
6. **Engineering without a special gate:** no for ingestion, RLS, or #626. The unpublished Next.js security release is also not executable yet; see §8.
7. **V1 versus later:** V1 launch-critical as gate G. The Development stage is a bounded partial step. It is not Gate G and it is not a new P0 incident. Advisor WARNs with the recorded controls are a residual, not a new P0.
8. **Uncertainty:** empty producer quota must not be read as “no incidents”. This session did not re-measure the hourly cleanup age; the post-#630 receipt is the Technical-Lead statement in review `5359714624`. Dependabot and code scanning were not queried. The advisor paragraph is attributed evidence, not a query this session executed.

### C. Privacy / Legal / Compliance — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** legal pages reconfirmed. Retention and consent `STILL_OPEN_GATED`. #585 `DELIBERATELY_LATER`. Provider DPAs `STILL_OPEN_GATED`.
3. **Evidence:** Live `/privacy`, `/terms` and `/impressum` are HTTP 200 and `noindex, nofollow`. Terms contain version `CH-DE 1.0` and Stand `28. September 2026`. #587 and #592 remain closed on GitHub. `lib/legal/ap6a-gate0-vertrag.ts` still has `keineConsentPersistenz: true`. #585 comment `5874769319` still defers the PrivacyBee inquiry and accepts the current generated wording for Switzerland-first prelaunch. Privacy and imprint HTML contain the PrivacyBee marker. This preflight did not hand-edit vendor text and does not issue a legal-basis opinion.
4. **Missing action:** leave #585 deferred. Do not persist consent and do not invent a retention number.
5. **Gate owner:** Product Owner for retention, consent persistence, and any future provider DPA. Later legal sign-off re-reads #585.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** retention and consent records are V1 launch-critical once real processing is in market. #585 is not a current engineering blocker. The old “legal pages 404” P0 stays closed.
8. **Uncertainty:** this session did not archive the full privacy HTML. Production `account-delete-v1` ACTIVE v1 / `verify_jwt=true` is the attributed listing in TL comment `5900885296`, not a function invocation by this session.

### D. Provider / Commercial / Licensing — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Changed since Preflight 2:** `STILL_OPEN_GATED`. The new fact is the Product-Owner pause on further outgoing questions, not a KAYAK reply.
3. **Evidence:** #395 latest comment remains `5869751056`. No signup, Terms acceptance, credential, API call, spend or adapter was performed. Flight, hotel and activity Production search stay hard-off. HBX remains the offline fixture mapper from #548. No hotel or activity provider is selected either. Comment `5888940598` says existing sent inquiries are not withdrawn and no additional outgoing questions are to be initiated now.
4. **Missing action:** do not chase KAYAK. When a reply exists, the Technical Lead reviews the full reply and any linked terms before any next action.
5. **Gate owner:** KAYAK, then Technical Lead, then Product Owner for selection, contract, secret, spend or Production activation.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** V1 launch-critical for a real commercial journey. Provider breadth beyond the first path is later. Binding build order §1 does not authorize an S4–S8 slice merely because the external reply is pending.
8. **Uncertainty:** “no reply” means no newer GitHub comment. The inbox was not opened.

### E. Entry Requirements / Official Truth — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Changed since Preflight 2:** `CHANGED_DETAIL_STILL_OPEN_GATED`. Sherpa is no longer only “sent / waiting”.
3. **Evidence:** Comment `5888189192` records a first Sherpa reply: commercial options under review, no access or integration approval, no credentials, and no public quotation amounts. Comment `5888940598` pauses outgoing follow-up; the prepared reply is unsent. Comment `5889155160` records public alternatives and selects none. IATA remains comment `5875963553`, sent, with no later reply comment. Repository rules still keep `unknown` distinct from `not_required`. No visa, transit or health rule was invented here. Another status model is not justified.
4. **Missing action:** do not send the paused Sherpa follow-up and do not integrate an alternative source. A reduced launch scope would be a separate Product-Owner decision, not this preflight.
5. **Gate owner:** Product Owner for the pause and any contract. Technical Lead for a later review of the complete reply and linked terms. IATA remains an external wait.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** an untested Official Truth path is V1 launch-critical. Fail-closed `unknown` is the correct current behaviour.
8. **Uncertainty:** multi-citizenship, multi-document, transit and credential-change behaviour cannot be proven against a real source until one is contracted. The IATA inbox was not opened. Sherpa sender headers were not verified by this session; the intake comment already records that limit.

### F. Production Configuration — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** indexing and public legal pages reconfirmed. #630 changed the repository Development redirect expectation only. The public alias is now bound to the #630 Production deployment by `data-dpl-id`. Header and `www` notes stay `DELIBERATELY_LATER`. Backup settings remain unread.
3. **Evidence:** This R1 session re-read `https://jetnity.com/` and found `data-dpl-id=dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm` together with `noindex`. TL comment `5900885296` records the same deployment id, robots `Disallow: /`, an empty sitemap, HSTS, no CSP on the root response, and root `access-control-allow-origin: *`. This writer’s earlier public read also saw `ACAO: *` on `/` and `/terms`, and no `ACAO` on `/privacy` and `/impressum`. HTTP 308 redirects to HTTPS. `www` does not resolve. Apex address resolves. Manifest is live. GitHub records Production deployment success for `60148274765f2143722b2742607ee3cf03730bcb`. TL comment `5900885296` lists Production `account-delete-v1` ACTIVE v1, `verify_jwt=true`.
4. **Missing action:** do not mutate Supabase, DNS, headers or indexing. Header hardening stays a later residual unless a concrete exploit on that path is proven.
5. **Gate owner:** Product Owner for indexing, DNS cutover, or any Production config change.
6. **Engineering without a special gate:** no for the residuals that matter. Header hardening is not authorized from this preflight.
7. **V1 versus later:** indexing-off is the correct V1 prelaunch state. The bound deployment is still a prelaunch deploy.
8. **Uncertainty:** DNSSEC was not re-checked. Auth Site URL and SMTP were not re-read in Supabase; their GitHub closures stay the record. #630’s repository expectation is not a new hosted Auth mutation. The hosted advisor and function listing are attributed to the Technical Lead, not re-executed here.

### G. Monitoring / Logging / Alerting — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** `CHANGED_DETAIL_STILL_OPEN_GATED`. Development blocklist logging exists on the recorded Development branch. An alerting vendor does not.
3. **Evidence:** Finding 5.2 remains open as B describes. Admin honesty copy remains on `main`. `docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md` still says no Sentry, Datadog, Axiom, Logtail or PagerDuty provider is selected. None was contacted. The Development producer does not page anyone and does not cover login, MFA or platform logs. Its post-#630 health and Production isolation are the Technical-Lead statement in review `5359714624`.
4. **Missing action:** keep the honest not-configured disclosure. Do not install an observability vendor from this map.
5. **Gate owner:** Product Owner. A new processor and possible cost are reserved gates. Persistent Production ingestion is the same reserved security gate as B.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** gate O treats missing operational detection as a launch block. The Development producer is not a substitute.
8. **Uncertainty:** provider-health alerts are also untestable while providers are hard-off. This session did not personally re-measure the hourly cleanup age.

### H. Backup / Recovery / Incident — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** `RELEASE_PROOF_MISSING`. Supabase backup presence remains unread, so that sub-fact is `INSUFFICIENT_CURRENT_EVIDENCE`.
3. **Evidence:** The incident runbook and the admin MFA-loss procedure are on `main`. The runbook states that it does not prove a backup/restore rehearsal. Provider kill switches are implemented as Production hard-off. A successful Vercel Production deployment shows a deploy exists. It does not show a rehearsed rollback. #626’s local rollback package is not a Production restore rehearsal.
4. **Missing action:** do not run a restore against Production. A later read-only backup inventory belongs to the final gate.
5. **Gate owner:** Product Owner if a restore, PITR purchase or destructive Production data change is proposed. Technical Lead for a read-only inventory.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** launch-critical as proof that basic recovery protection exists. Absence of a named backup vendor is not claimed.
8. **Uncertainty:** this session cannot say whether Supabase’s current backup window matches any older plan note.

### I. Analytics / Conversion / Revenue — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** `STILL_OPEN_GATED` for real attribution and for Production account-count exposure. A growth plane is `DELIBERATELY_LATER`.
3. **Evidence:** There is still no provider-backed commercial path, so there is no real revenue to display. Local account-count proof stays closed and still forbids Production exposure. Indexing is off. Consent is not persisted. No booking or affiliate handoff can be measured.
4. **Missing action:** do not activate Production account counts and do not create conversion charts.
5. **Gate owner:** Product Owner for Production account-count exposure. External provider reply, then Product-Owner release of the pause, before any real attribution work.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** P2 until a provider exists. It joins the P0 commercial cluster only when a real handoff is being switched on.
8. **Uncertainty:** `unknown` attribution must stay unknown.

### J. Performance / Accessibility — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** `RELEASE_PROOF_MISSING`.
3. **Evidence:** Mobile Accessibility 1 and the later accepted visual repairs remain historical closures on `main`. This preflight did not rerun them and did not measure Core Web Vitals. Provider timeout/retry against a live vendor is impossible while search is hard-off.
4. **Missing action:** leave closed slices closed. Measure the real journey only after real provider and Official Truth paths exist.
5. **Gate owner:** final release proof, not a new product slice.
6. **Engineering without a special gate:** no useful measurement of the missing commercial/official journey exists yet.
7. **V1 versus later:** P2 release proof. No new P0/P1 accessibility defect was observed because the UI was not retested. That absence is not a regression finding.
8. **Uncertainty:** a real device could still show a defect this preflight did not look for.

### K. Mobile / Browser / PWA — `PARTIAL` — P2

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** `RELEASE_PROOF_MISSING`.
3. **Evidence:** Live manifest is standalone, scoped to `/`, and its three PNG icons return HTTP 200. `/sw.js` is 404, which matches the closed decision that offline and push are not V1. No iPhone, Android or desktop browser journey was executed.
4. **Missing action:** do not add a service worker. Do not open a device-lab slice for a journey whose commercial and official steps are still fail-closed.
5. **Gate owner:** final release proof.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** the complete core journey on real devices is release proof. It is not a reason to rebuild mobile chrome.
8. **Uncertainty:** installability of the manifest was checked by HTTP, not by installing on a phone.

### L. End-to-End / Failure / Concurrency — `PARTIAL` — P1

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** `STILL_OPEN_GATED` until D and E can be executed for real. #626’s remaining populated erasure is a separate blocked acceptance, not this journey.
3. **Evidence:** Guest, account, traveller and route foundations remain merged. Production account-erasure E2E stays the historical #592/#599 record. This session did not repeat it and did not delete an account. Real flight, hotel, activity and Official Truth failure cases cannot be executed. Production search flags fail closed before a provider call.
4. **Missing action:** do not write speculative E2E against invented provider payloads. Do not run the blocked #626 erasure.
5. **Gate owner:** external replies and the Product-Owner pause first. Product Owner before any new Production mutation. #626 stays blocked on the recorded tool-safety boundary.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** launch-critical for the real path. Existing fail-closed behaviour is the correct prelaunch control.
8. **Uncertainty:** historical test suites were not rerun in this docs session. Main CI on `60148274765f2143722b2742607ee3cf03730bcb` succeeded, which is not a journey E2E.

### M. Support / Operations — `PARTIAL` — P3

1. **State:** `PARTIAL`.
2. **Changed since Preflight 2:** helpdesk `DELIBERATELY_LATER`. The mailbox process remains in place.
3. **Evidence:** `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md` still defines the support mailbox, minimised data handling, and escalation into the incident runbook. It does not grant direct Production database access. SMTP for Auth mail is a separate closed gate and is not a ticket system.
4. **Missing action:** keep the existing mailbox process. Do not buy a helpdesk.
5. **Gate owner:** none for continued prelaunch use of the existing mailbox. A vendor queue would be a later Product-Owner cost/processor decision.
6. **Engineering without a special gate:** no new support product is justified.
7. **V1 versus later:** P3. The defined channel meets the current process bar. A vendor queue is later.
8. **Uncertainty:** this session did not send a support message.

### N. Release / Launch Control — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Changed since Preflight 2:** `STILL_OPEN_GATED`.
3. **Evidence:** Indexing is off in live HTML, robots and source (`darfIndexieren` requires an explicit indexing flag plus the canonical production origin). No Private Alpha, Closed Beta or Swiss Public Launch approval was found in the open issue set. Successful Vercel Production deploys are prelaunch deploys. The binding sequence remains Alpha, then Swiss beta, then Swiss public launch.
4. **Missing action:** do not change robots, sitemap, metadata or the indexing flag. Do not declare a launch stage.
5. **Gate owner:** Product Owner.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** a public launch attempt would be P0. The current hold is the correct state.
8. **Uncertainty:** the public root HTML is bound to deployment `dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm` by `data-dpl-id`. That is the #630 Production deployment recorded for merge SHA `60148274765f2143722b2742607ee3cf03730bcb`. This session did not hash the full document against the Git tree.

### O. Final blocker rules — `BLOCKED` — P0

1. **State:** `BLOCKED`.
2. **Changed since Preflight 2:** `STILL_OPEN_GATED`.
3. **Evidence:** The binding rule still blocks public launch while an open P0 remains, while P1 residuals remain in the core journey, security, privacy, truth, provider or reliability path, while a provider contract or DPA is unresolved, while real-path E2E is untested, while backup/recovery proof is missing, or while fixture data would be used as hard truth. Those conditions are still true for A, D, E, G, backup/restore in H, and the header/`www` residuals in F. The public deployment binding and the attributed Production advisor read do not remove them. The unpublished Next.js security release does not remove them either. The Sherpa reply and the Development producer do not remove them. Fixture hotel data is not wired as Production hotel truth. Indexing is not on.
4. **Missing action:** stop for independent exact-head review. Do not convert this document into the launch gate.
5. **Gate owner:** Technical Lead for this review. Product Owner for launch approval. Neither is granted here.
6. **Engineering without a special gate:** no.
7. **V1 versus later:** P0 for any public-launch attempt. Not a code emergency.
8. **Uncertainty:** one green sub-fact, including successful CI, a live legal page, or an active Development producer, does not close the section.

---

## 6. Provider and Official Truth boundary

Sherpa is response received, under Product-Owner consideration, with outgoing follow-up paused. KAYAK and IATA remain at their last recorded sent/waiting repository comments. No provider or Official Truth source is selected.

Not done: contact, chase, forms, Terms or DPA acceptance, accounts, credentials, API calls, spend, provider selection, adapters, or publication of private quotation amounts.

Their absence is a launch blocker and it is `GATED`. The public-alternatives note is not a substitute and not a dispatch. Fixtures are not a substitute.

---

## 7. Security, privacy and production boundary

Not done: Production mutation, Supabase schema/RLS/policy/migration/function/job change, Auth-user/profile/factor/private identity read, role or MFA operation, fixture creation, producer-event generation, erasure, retention change, observability install, payment, secret use, or a Next.js/npm upgrade.

The Management API token in this environment returned 401. That stopped this session’s own hosted catalog read. It was not retried through another credential, dashboard, SQL reformulation, or anon-key query. Review `5359714624` and comment `5900885296` are the current Technical-Lead receipts for producer health, Production isolation, the advisor WARN list, and `account-delete-v1`. This report cites them. It does not claim this session executed them.

This session did re-read public `https://jetnity.com/` and found `data-dpl-id=dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm`. Local source reads and public HTTPS GETs are not a launch PASS. PrivacyBee HTML is not a legal-completeness verdict. #626 remains open. The advisor WARN list is not a Production ACL rewrite.

---

## 8. Candidates

**Immediate ungated V1 implementation candidates: NONE.**

R1 required a real framework assessment, not a copied NONE. The assessment is below. The nine-vulnerability patch is not executable now. `next@16.3.7` is the wrong package for that patch.

### Framework security assessment

1. **Confirmed version exposure.** `package.json` pins `next` and `eslint-config-next` at `16.3.3`. That pin is below the published ImageResponse patch line `16.3.6` (2026-09-22T16:19:00Z) and below npm `latest` `16.3.7` (2026-09-29T09:04:19Z). React `19.2.8` sits inside the `next@16.3.7` peer range `^19.0.0`. eslint `9.39.5` and TypeScript `5.9.3` satisfy `eslint-config-next@16.3.7` peers (`eslint >=9`, `typescript >=3.3.1`). `eslint-config-next@16.3.7` is published. Compatibility of `16.3.8` cannot be checked. That version is not in the registry.
2. **ImageResponse applicability.** GHSA-vcvr-r3jv-pc5j affects `next` `>=16.2.0 <16.3.6` and is patched in `16.3.6`. The vulnerable behavior is the Node.js `ImageResponse` path in `next/og` when attacker-controlled values are passed into SVG content, attributes, or styles. This repository has **0** matches for `next/og` and **0** matches for `ImageResponse`. The advisory’s own condition for a reachable RCE is absent. This report does not claim that RCE is exploitable in Jetnity. The version range still contains the pin.
3. **September advisories.** Comment `5900828960` and review `5359714624` correctly required this check and correctly quoted the 23 September plan, which named `16.3.7` for nine vulnerabilities (1 critical, 2 high, 5 medium, 1 low). The same official post, `https://nextjs.org/blog/upcoming-nextjs-security-release-september-2026`, re-read in this R1 session, now says: `16.3.7` was published as a bugfix and does not include the security fixes planned for 30 September 2026. Those fixes are now expected in `16.3.8` and `15.5.27`, together with the full advisories. The GitHub release `v16.3.7` describes a turbo-tasks bugfix backport. `npm view next@16.3.8` returns **404**. Affected-version conditions for the nine vulnerabilities are not public.
4. **Resulting decision.** A bump to `16.3.7` would install a bugfix, leave the nine-vulnerability release unapplied, and clear only an ImageResponse line whose call site is absent. That is not the security patch R1 asked this preflight to judge. The security patch is not executable because the package is not published.

The other launch items stay `GATED`. None of them is a dispatch.

| # | Title | Class | Why it is not dispatch |
| --- | --- | --- | --- |
| 1 | September Next.js security bump | Not executable yet | Expected package `next@16.3.8` is not published. `16.3.7` is a bugfix and is the wrong target. ImageResponse has no Jetnity call site. |
| 2 | KAYAK reply, then flight commercial truth | `GATED` | #395 has no newer comment. Outgoing questions are paused. A reply still requires Technical-Lead review and a Product-Owner gate before signup, terms, credentials, spend or an adapter. |
| 3 | Sherpa follow-up or Official Entry truth | `GATED` | A reply exists and the Product Owner paused outgoing questions. The alternatives note selects nothing. Do not invent visa or transit rules. |
| 4 | Finish #626 populated producer acceptance | `GATED` | Temporary operator permission is not established. The privileged role/fixture operation is blocked and must not be retried or routed around. Three events and authenticated populated erasure are not started. This is not a new feature slice. |
| 5 | Production persistent ingestion / alerting / Gate G | `GATED` | Development activation did not close finding 5.2 or Gate G. Production activation and an alerting vendor remain reserved gates. The fresh WARN advisor list is not an RLS rewrite. |

Also gated, and not promoted: retention and consent persistence, backup/restore proof, Production account-count exposure, public launch/indexing, header/`www` hardening, and TW-8. TW-9 remains release proof after those dependencies. #585 stays deferred. Binding build order S4–S8 is not an idle-Cursor slice while no provider is selected.

Explicitly not candidates, and not part of any later framework slice:

- A dependency edit inside PR #632.
- A bump to `16.3.7` or to canary in place of the unpublished security release.
- A claim that the ImageResponse RCE is reachable.
- An ACL/RLS rewrite driven only by the WARN list in comment `5900885296`.
- Another flight, hotel or activity engine.
- Another Official Truth model or a GOV.UK/Timatic/Visamundi adapter from the alternatives note.
- Legal-page copy or a PrivacyBee hand edit.
- A consent migration or a retention job without a Product-Owner period.
- An observability SaaS.
- Redispatch of #628, #630, Admin F, or the closed Admin slices #606–#620.
- A CSP/`ACAO` hardening slice.
- Historical drafts #52, #50, #40, #39 and #28.
- A workaround, delegation, or owner-run replacement for the blocked #626 role operation.

### Smallest later slice, only after the package exists

When npm publishes the September security release, currently expected as `next@16.3.8`, and the accompanying advisories name the affected versions, the smallest bounded slice is:

- bump `next` and `eslint-config-next` together to that published security version;
- refresh the lockfile only as far as that bump requires;
- pass the existing typecheck, lint, test, build, and Auth CI gates.

Non-scope for that later slice: application features, #626, provider work, Production Supabase, RLS/ACL edits, CSP/`ACAO`, indexing, launch, a new vendor, and any claim that the unused ImageResponse path was exploitable. If the published advisories show every affected condition is absent from Jetnity, the Technical Lead re-decides before implementation. This PR does not start that slice.

### Exact first next step when a gate or evidence changes

The first framework step becomes executable when `next@16.3.8`, or the version the published advisories actually name, is on npm. Until that publish, there is no framework maintenance slice to dispatch.

The provider and #626 gates are unchanged:

1. If the Product Owner releases the outgoing-question pause, the first provider step is a Technical-Lead review of the already-received Sherpa reply and every linked term. That review does not itself authorize sending, signup, credentials, spend, or an adapter.
2. If a genuinely new authorized route for the remaining #626 temporary operator preparation is later established, and that route is not a retry, reformulation, delegation, dashboard path, or replacement SQL for comment `5898480236`, the first step is the already-defined remainder: three genuine producer events, then authenticated populated erasure. No such route exists now.

Do not manufacture a V1 implementation because Cursor is available.

---

## 9. Current risk matrix

| Severity | Item | Class | Why this severity now |
| --- | --- | --- | --- |
| P0 | No live flight, hotel or activity truth | External, then Product Owner | Core commercial journey cannot be real. KAYAK is still sent. Questions are paused. |
| P0 | No contracted Official Truth | Product Owner pause, then external IATA | Sherpa replied and is not selected. Hard truth must stay unknown. |
| P0 | Public launch / indexing not approved | Product Owner | Production deploy is not launch |
| P1 | Next.js pin `16.3.3` is below the published `16.3.6` line and the unpublished September line | Vendor publish | `16.3.7` is a bugfix. `16.3.8` is not on npm. ImageResponse has no call site. Not an executable slice until the security version is published. |
| P1 | Finding 5.2 / Gate G still open | Product Owner | Development producer is active on the attributed post-#630 receipt and is not Production ingestion. |
| P1 | #626 populated erasure not run | Tool-safety block | Not a code defect and not a permitted retry |
| P1 | No alerting vendor | Product Owner | Detection half of incidents unmet |
| P1 | Retention undecided; consent not persisted | Product Owner | Legal pages exist; lifecycle record does not |
| P1 | Backup/restore still unproven | Final proof | Advisor WARNs, RLS/AAL2 controls, `account-delete-v1` ACTIVE v1, and Development/Production producer isolation are current through TL comment `5900885296` and review `5359714624`. Backup settings were not in those receipts. |
| P1 | Real provider/official E2E impossible | External / pause | Fail-closed is correct |
| P2 | CSP absent and `ACAO: *` on public `GET /` and `GET /terms` | Later hardening | Re-observed. `/privacy` and `/impressum` did not send `ACAO` |
| P2 | `www` does not resolve | Later DNS decision | Apex HTTPS works |
| P2 | No fresh CWV or whole-journey device proof | Final proof | Closed slices stay closed |
| P2 | Production account counts not exposed | Product Owner | Local proof remains the bound |
| P3 | #585 wording deferred | Later legal re-review | Not current engineering |
| P3 | Ticket vendor, Admin F, collaboration, native apps | Later | Not this preflight |
| Closed, do not elevate | Legal pages 404, no SMTP, no Auth redirects, no Terms, no erasure, #628 unmerged, #630 unmerged | — | Those closures predate or are this baseline. Do not rebuild them. |

---

## 10. Limits

- No hosted Supabase SQL by this session. Management API returned 401. That 401 does not override review `5359714624` or comment `5900885296`, and it is not evidence that the producer stopped.
- No Auth-user, profile, factor, MFA, role, fixture, event-generation or erasure operation.
- No provider mailbox was opened. No Sherpa quotation amount was copied.
- No browser journey, no CWV, no device lab, no test rerun beyond reading the existing main CI and Auth log result.
- No claim that GitHub has zero security advisories.
- No percentage-complete claim.
- Public root HTML carries `data-dpl-id=dpl_DEqXrqyw6QxJKiZkk6WqhJq6TBRm`. The full HTML was not hashed against the Git tree.
- `next@16.3.7` was inspected as a published bugfix. It was not installed. `next@16.3.8` returned npm 404 during this R1 read.
- `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-29.md` still describes Draft #630 as the open writer. It is outside this task allowlist and was not rewritten. The pointer correction in `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` is the current writer map.
- `next-env.d.ts` local drift is not part of this delivery.
- This report does not preclaim CI, Vercel, Technical-Lead PASS, Ready or Merge for the new branch head.

---

## 11. Traveller context

Relevant to A, E and L. This preflight does not collect citizenships or documents. Closed registry behaviour stays: multiple citizenships and credentials are peer options; residence and issuer country are not citizenship; destination official is not transit official. The Sherpa and IATA inquiries ask for multi-document and transit semantics. Until a source is contracted, eligibility remains `unknown`. The paused Sherpa reply does not create a per-credential answer.

---

## 12. Stop

**STOP FOR INDEPENDENT MAIN-CHAT TECHNICAL-LEAD REVIEW.**

Self-review is not PASS. Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not contact KAYAK, Sherpa, IATA or PrivacyBee. Do not continue #626.
