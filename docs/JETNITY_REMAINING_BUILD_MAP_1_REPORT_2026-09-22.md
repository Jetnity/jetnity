# Jetnity Remaining Build Map 1 — Current remaining-work map

Stand: 22. September 2026  
Status: **R1–R3 CORRECTION AFTER TL CHANGES REQUIRED `5776971757` / DRAFT / NOT READY / NOT MERGED / NO IMPLEMENTATION / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

Corrects reviewed head `962b2209a7ab59262dc8ef1a18d360d443742dcb`. That head’s gates are invalid.

Pinned product baseline: `main@35148a4ba065be1315dddf21174d7f272518d34c`  
Task seed: `492a35f9861a283d365cc37a3521d1c4a7559ced`  
Draft PR: #544 · Branch: `docs/remaining-build-map-1`  
Binding task: `docs/JETNITY_REMAINING_BUILD_MAP_1_TASK_2026-09-22.md`

Cursor-Agent: **Jetnity remaining build map 1**, Generation 1  
Required/actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-2f765cf3-6e43-493b-96d6-ab1ae9289258`  
Session URL: https://cursor.com/agents/bc-2f765cf3-6e43-493b-96d6-ab1ae9289258  
Session display name observed as `Jetnity remaining build map overview`. No UI rename was performed.

This report answers: what is still to be built across the canonical three phases? It is a bounded evidence reconciliation. It does not implement product work, change the build order, dispatch a follow-up, or authorize providers.

Live-evidence rule: later accepted closures outrank the 1–2 September 2026 Phase-1 matrix. A foundation is not launch-ready. A stale `MISSING` row is not automatically still missing.

---

## 1. Product-Owner overview (German, ≤350 words)

Jetnity bleibt ein zusammenhängendes Reisesystem: eine Idee wird zur strukturierten, bearbeitbaren Reise um denselben Reisegraphen. Flug, Unterkunft, Aktivitäten, Route, Reisende und Vorbereitung sollen dieselbe Wahrheit teilen — nicht isolierte Suchmaschinen.

Wir sind in Phase 1, Jetnity Core. Die schwierige Kernarchitektur steht auf `main@35148a4b`. Gebaut und integriert sind Trip Workspace, Gast→Konto, Traveller-Registry mit Mehrfachstaatsbürgerschaft, Route/Transit, Destination Essentials, World Map für geplante Orte plus ausdrücklich bestätigte Besuche, PWA-Installierbarkeit ohne Offline/Push, Assistenten-Truth- und Runtime-Grundlage, Flight Multi-Leg und provider-neutrale 0..N-Orchestrierung, Hotel-/Activity-Ports, Provider-S4–S8-Foundations, Account-Export, MFA-TOTP inklusive bestehendem Faktor, Consent-Klick-Reparatur, scoped Admin-Health/Usage und die UX-/Honesty-Schliessungen seit dem 21. September. Die Homepage übergibt heute nur ein bestätigtes Ziel. Die parallele Routenübergabe (#543) ist in Arbeit und nicht auf `main`.

Was für echte Reisende noch fehlt, ist vor allem keine neue Feature-Liste. Es fehlen echte Wahrheitsquellen und Launch-Gates: kein live Provider für Flug, Hotel oder Activities; keine Official-Entry-Evidence; keine Production-SMTP; keine genehmigten Rechtstexte (`/privacy` und `/terms` bleiben 404); keine Kontolöschung; keine erzwungene Retention; keine Observability; keine persistente Security-Ingestion. Commercial-Workspace (TW-8) braucht echte Angebote. Akzeptierte UX-Reparaturen sind nicht das volle TW-9-Closure. Feature Complete ist nicht Production Ready.

Account: AP-7 Registry und AP-10-S1 Buchungsordner sind integriert; AP-8 Präferenzen, AP-9 Favoriten, AP-11 Notifications und AP-12 Entitlements bleiben benannte Restarbeit. Admin A–C plus read-only Analyst/Usage sind gebaut; der lokale Refund-Pfad ist nicht atomar; Admin F existiert als deaktivierte Befehlssuche. Guardian/Reise-Autopilot und What-if bleiben benannte Langfristziele und dürfen nicht in „Advanced Companion“ verschwinden.

Phase 2 und 3 bleiben bewusst später. Provider kommen erst, wenn eine konkrete Abhängigkeit das erzwingt. Der einzige bereits vergebene Runtime-Slice ist die Homepage-Routenübergabe. Zusätzliche **V1-kritische** ungated Implementierung ist hier nicht nachgewiesen. Spätere scoped Optionen wie Admin F bleiben benannt und werden nicht dispatcht.

---

## 2. How to read the matrix

Each area has exactly one primary class:

| Class | Meaning |
| --- | --- |
| `RUNTIME_BUILT` | Integrated on pinned main; do not rebuild the foundation |
| `IN_PROGRESS_NOT_MAIN` | Active exclusive writer exists; not integrated |
| `LIVE_ACTIVATION_MISSING` | Code/foundation exists; live provider, secret, Production apply or model activation is still closed |
| `REMAINING_IMPLEMENTATION` | Actual missing V1 product code that is not merely activation |
| `RELEASE_PROOF_MISSING` | Formal release-gate evidence still required |
| `PO_GATED` | Next responsible action is a reserved Product-Owner decision |
| `DELIBERATELY_LATER` | Canonical Phase 2 or 3; not a V1-critical dispatch item |
| `BINDING_LONG_TERM` | Named binding target; ADR-0204 does not assign an exclusive V1-blocking phase |
| `UNVERIFIED` | Could not be reconstructed from the allowed evidence |

`RUNTIME_BUILT` is not public-launch PASS. `PO_GATED` is still open as a launch risk.

---

## 3. Complete remaining-work matrix

Sources used for later closures: #512 comments [5776334794](https://github.com/Jetnity/jetnity/pull/512#issuecomment-5776334794), [5776541884](https://github.com/Jetnity/jetnity/pull/512#issuecomment-5776541884), [5776595910](https://github.com/Jetnity/jetnity/pull/512#issuecomment-5776595910); provider deferral [#395 comment 5776595577](https://github.com/Jetnity/jetnity/issues/395#issuecomment-5776595577); `docs/V1_LIVE_GAP_RECONCILIATION_1_REPORT_2026-09-21.md`; later merged PRs listed per row. Production/CI/Vercel numbers below are **TL-observed 22 September 2026**, not a new measurement by this slice.

### 3.1 Phase 1 — Jetnity Core

| Area | Primary class | Built / reused on pinned main | Actual remaining work | Sources / closures | V1 vs later | Dependency / gate | Next meaningful action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Trip Workspace TW-1–TW7 + accepted honesty/UX | `RUNTIME_BUILT` | Reisegraph, Stages/Days/Items, TW6 unassigned, mobility #502, usability #516, status language #526, destination-hint #522, date-mismatch attention #520 | No generic rebuild. TW-8/TW-9 programme remainder in §3.1a | #502 `d99c7781`; #516 `039e62ff`; #520 `e713d682`; #522 `4278cd04`; #526 `926c9d1f` | TW-1–TW7 built | Commercial/official truth for TW-8 | Do not reopen #509 NEXT_SLICES |
| TW-8 / commercial workspace closure | `LIVE_ACTIVATION_MISSING` | Commercial provenance contracts, protected-item freeze, attention for date mismatch | Selected-state / freshness / booking interoperability against **real** offers | `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md` TW-8; V1 build order §3; #520 is honesty only | V1 after commercial truth | Provider + S5 writer + PO live activation | None until a provider is actually necessary and authorized |
| TW-9 programme closure | `RELEASE_PROOF_MISSING` | Accepted UX repairs #516/#522/#524/#526/#534/#536 are **closed separately** | Full TW-9 polish/evidence/closure and the mandated function-by-function / intelligence audits remain after dependencies. VUX-6 was not accepted | Plan TW-9 + `TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md` + `TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`. Repairs: #506 `19a91a25` and later fix PRs | Accepted UX ≠ TW-9 done | After required runtime dependencies / TW-8 | Do not rerun closed audits; do not call TW-9 built |
| Guest → Account | `RUNTIME_BUILT` | Guest trip, adopt, invalid-draft honesty, fail-closed preservation before create | No remaining adopt-path rebuild | #517 `66af1539`; #532 `d89ed0b0`; `lib/trips/uebernahme.ts` (`art: 'ungueltig'` now distinct from `nichts`) | V1 guest honesty closed | None | Do not rebuild GastreiseBruecke |
| Account home / trips / security | `RUNTIME_BUILT` | Account surfaces, scoped export, error boundary, MFA existing-factor step-up | Launch leftovers are legal/lifecycle, not account chrome | #476, #471, #542 `35148a4b` / reviewed `5b0764c4` | V1 | See legal / deletion rows | Do not restart #542 |
| Traveller registry / multi-citizenship | `RUNTIME_BUILT` | AP7 S1–S4, Foundation E children, no default passport, graph-read completeness #531 | Degraded-path honesty closed; official eligibility still needs Official Truth | #531 `65db24b6`; `lib/trips/foundation-e-select.ts` | V1 foundation done | Official provider for real eligibility | Do not invent Official Truth |
| Route / transit / multi-destination | `RUNTIME_BUILT` + `IN_PROGRESS_NOT_MAIN` | Foundation D, stages, planner multi-destination; **homepage still one confirmed place** | Bounded confirmed-route homepage handoff is assigned, not on main. Full natural-language #110 remainder stays later | `components/places/StartzielForm.tsx` + `app/(public)/page.tsx` on pinned main; #543 exclusive writer; issue #110 | V1 bounded route entry now; full NL later | #543 must finish/integrate before any further #110 cut | Treat #543 as `IN_PROGRESS`, never as integrated |
| Flights | `LIVE_ACTIVATION_MISSING` | Domain, multi-leg, 0..N orchestration, fail-closed Production without live provider | First real provider, server snapshot, TW-8 path | Flight multi-leg / 0..N closures; #395 still DEFERRED | V1 | PO provider/contract/secret/live-call gates | Provider-independent work continues; do **not** request KAYAK approval now |
| Hotels / accommodation | `LIVE_ACTIVATION_MISSING` | Provider-neutral hotel domain, ranking, workspace seam | First real hotel/affiliate path | Phase-1 strategy §5–6; build order §4 | V1 | Separate PO provider gate | Reuse ports; no new abstraction |
| Activities / experiences | `LIVE_ACTIVATION_MISSING` | Provider-neutral activity domain | First real path **or** explicit PO launch exception | Strategy §7; build order §5 | V1 | PO provider or launch exception | Do not silently drop Activities |
| Entry requirements / official truth | `LIVE_ACTIVATION_MISSING` | Foundation C/E, fail-closed unknown/stale, Destination Essentials presentation | Hard Official Evidence / provider | #294 target remains do-not-auto-start; Destination Essentials 1 closed | V1 hard truth gated | Official source + PO | Do not invent visa/health rules |
| Temporal readiness / in-app companion | `LIVE_ACTIVATION_MISSING` | E4/E5 projection, readiness workspace, no guessed deadlines | In-app Now/Soon/Info on **real** event/official input. Named Guardian / What-if stay in §3.1d and are not this row | V1 build order §7 | V1 in-app; push/email later | Official + flight event activation | Do not start Guardian/What-if from this map |
| Assistant | `RUNTIME_BUILT` + `LIVE_ACTIVATION_MISSING` | Truth context #427; Runtime 1 #435 Preview/Development | Production model activation, cost/migration gates remain distinct | #435 `fdbd3735`; Assistant Runtime HANDOFF: Preview/Development only | V1 runtime built; live model gated | PO model activation / cost | Do not treat foundation as live Production assistant |
| Destination Essentials | `RUNTIME_BUILT` | Stage-ordered presentation from existing official/safety/seasonal truth; density #522 | Real official provider evidence is a separate gate | Destination Essentials 1 closed; #522 | V1 core closed | Official provider for richer truth | Do not reopen the surface |
| World Map | `RUNTIME_BUILT` | Planned account-trip map + explicit visit history (`account_visits` / `besuche-*`) + polish | Confirm Production table/functions if a later launch proof needs it. No inferred visits | World Map 1 #423 `6b5cf463`; polish 2; Explicit Visit History 1 `supabase/migrations/20260917120000_account_visits.sql`, `lib/account/besuche-daten.ts`. TL catalogue 22 Sep noted migration `20260917120000` present; table was not named in that note | V1 map built | Production-apply residual `UNVERIFIED` at table granularity | Do not rebuild map; do not infer visited from dates |
| Mobile web / accessibility | `RUNTIME_BUILT` | Mobile Accessibility 1 closed; later tablet hero #534, navbar #536, planner reflow #528 | Release still needs whole-journey real-device proof, not another chrome slice | #430 closed; #534 `c0e32dc3`; #536 `fb4c9ece`; #528 `e818c13e` | V1 surface built; release proof separate | Release gate device/browser | Do not rerun #506 |
| PWA | `RUNTIME_BUILT` | Installability/manifest/icons via #391. `/sw.js` intentionally 404 | No service worker / offline / push | `docs/CHATGPT_TECHNICAL_LEAD_PWA_1_CLOSED_2026-09-01.md` | V1 installability closed; offline/push Phase 2 | None | Do not add a service worker from this map |
| Public homepage / positioning | `IN_PROGRESS_NOT_MAIN` for route entry; claims remain launch-gated | Hero, inspiration, single confirmed destination, tablet fit #534, manual planning entry #524 | Confirmed multi-destination handoff: #543 only. Honest public claims still need real capabilities | `app/(public)/page.tsx`; #524 `f0093365`; #543 | V1 | #543 exclusive; legal/provider claims later | Do not start a second homepage writer |
| Admin A–C + read-only foundation | `RUNTIME_BUILT` | Steuerzentrale, System Health, Provider/Cost, honest revenue #472, analyst #518, model-usage #538, KPI taxonomy #504 | Per-unit D–K remainder in §3.1c. Do not flatten to “all Admin later” | #472, #504, #510, #518 `1103407b`, #538 `5fee5f66` | V1 minimum built | See §3.1c | Do not start Admin Pro or Finance-Live |
| Monetization | `LIVE_ACTIVATION_MISSING` | Affiliate-oriented contracts, honest “no provider-backed commercial path” | Real referral/booking + attribution after a live provider | #472; build order §10 | V1 after commercial path | Provider + conversion measurement | No invented revenue |
| Legal pages `/privacy` `/terms` / Impressum | `PO_GATED` | Claim hygiene closed; no invented legal text | Approved operator/legal content, then routes | #457; #497 finding 1.1; TL 22 Sep: Production 404 | V1 launch | PO/legal content. PrivacyBee already selected; activation gated | Do not write legal text |
| Consent record / terms persistence | `PO_GATED` / `PARTIAL` | Orphan banner removed #477; click interaction #540; still no persisted version | Persist acceptance **after** versioned documents exist | #477, #540 `a3eb83b8`; `AP6A_RUNTIME_VERTRAG.keineConsentPersistenz` | V1 after 1.1 | 1.1 + Production migration | Do not persist acceptance of missing documents |
| Account export | `RUNTIME_BUILT` | Authenticated RLS-bound JSON export | Legal-complete DSAR is a later separate decision | #476 | V1 scoped export closed | None for the scoped export | Do not rebuild export |
| Account deletion / erasure | `PO_GATED` | Sub-object deletes only | Identity erasure path | #497 2.2 | V1 launch | Destructive identity PO gate | Do not start deletion |
| Retention enforcement | `PO_GATED` | Manual comments only | Periods + Production enforcement | #497 2.4; #487 names retention as separate | V1 launch | PO legal + Production migration | Do not invent period N |
| Production email / SMTP | `PO_GATED` | Auth verification recorded the 2/hour built-in limit | Own sender | #480 information only; #497 3.8 | V1 launch | Provider + secret | Configuration, not an app slice |
| Production Auth redirects | `PO_GATED` | #480 historically recorded localhost `site_url` | Production Auth write | #497 3.6; not freshly re-read here | V1 launch P2 | Production Auth write | Do not treat historical values as today’s settings |
| MFA backup codes / passkeys | `PO_GATED` / `DELIBERATELY_LATER` | TOTP + existing-factor repair works. Passkeys `enabled=false`; PO said later | Backup codes = MFA-contract gate. Passkeys later | #542; #512 5776334794 §5 | Backup codes V1-gated; passkeys later | Fundamental Auth gate | Do not activate passkeys |
| Security-event ingestion (finding 5.2 / gate G) | `LIVE_ACTIVATION_MISSING` | Honest presentation #485; architecture #487; local disposable proof #494 | Persistent producer, retention N, Auth-log ingest, network enforcement | #487 `4169c5b4`; #494 `c7fb9f0f`; no application INSERT found | V1 release gate G | Persistent activation remains closed | Do not start a second architecture or runtime writer |
| Observability / alerting | `PO_GATED` | Incident **process** #464 exists | Vendor + alerting | #497 5.5(b) | V1 launch | New processor/cost | Do not add Sentry from this map |
| Support | `RUNTIME_BUILT` for process | Runbook + mailto + Fehler-ID | Ticket vendor later / cost-gated | #470, #483 | V1 process closed | Mailbox coupled to SMTP | Do not rebuild the runbook |
| Provider S4–S8 foundations | `RUNTIME_BUILT` | S4 residuals, S6A cost guard, S7 observability hooks, S8 usage-policy seam | Live S6/HMAC/budget apply and real provider binding remain gated | S4/S6A/S7/S8 closed 1 Sep 2026 | V1 foundations closed | PO live provider | Do not build another generic provider framework |
| Strategy register / future requirements | `DELIBERATELY_LATER` | Register #236; Entry target #294; collaboration #20 | Not automatic backlog | Issues remain open as trackers | Phase 2/3 or later gated V1 official path | Do-not-auto-start | Do not dispatch from the register |

### 3.1a Trip Workspace programme (canonical plan)

Plan source: `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`. Later closures do not rewrite that plan’s TW-9 close-out mandate.

| Unit | Built | Remaining | Class | Sources / closures | Gate / next |
| --- | --- | --- | --- | --- | --- |
| TW-1–TW7-A | Reisegraph, Hub, items, visitor search, destination essentials | No rebuild | `RUNTIME_BUILT` | Plan §4–5; TW7-A PR #106; later #502/#516/#520/#522/#526 | Reuse |
| Accepted UX / honesty repairs | Workspace usability, status language, empty essentials, date-mismatch, tablet/navbar/planner | VUX-6 not accepted | `RUNTIME_BUILT` (repairs only) | #516/#520/#522/#524/#526/#534/#536 | Do not rerun #506/#509 |
| TW-8 Commercial Surfaces | Contracts + protected freeze + mismatch signal | Real offer/freshness/adoption path | `LIVE_ACTIVATION_MISSING` | Plan TW-8; V1 build order §3 | Provider + S5-B / PO live |
| TW-9 Polish, Evidence, Closure | Partial mobile/a11y/UX repairs only | Full evidence/closure after dependencies; function-by-function + intelligence audits | `RELEASE_PROOF_MISSING` | Plan TW-9; `TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`; `TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md` | After required dependencies; not a current polish slice |

### 3.1b Account programme AP-5–AP-12

Canonical plan: `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`. Live-evidence wins over stale “fehlt” sentences in that file.

| Unit | Built | Remaining | Class | Sources / closures | V1 vs later | Gate / next |
| --- | --- | --- | --- | --- | --- | --- |
| AP-5 Security deepen | S1–S5 + later existing-factor MFA #542 | P1–P5 extras; backup codes; passkeys later | `RUNTIME_BUILT` + `PO_GATED` residuals | Plan AP-5; #542 `5b0764c4` | Core built | No Auth-contract change from this map |
| AP-6a Legal pages | Claim hygiene #457; cookie artefact gone #477; consent click #540 | Approved `/privacy` `/terms` content + routes | `PO_GATED` | Plan AP-6a; #497 1.1 | V1 launch | PO/legal text. No invented copy |
| AP-6b Privacy persistence | Scoped export #476 | Consent version; account erasure; retention | `PO_GATED` / `PARTIAL` | Plan AP-6b; #497 1.5/2.1/2.2/2.4 | V1 launch leftovers | After 1.1 + PO deletion/retention |
| AP-7 Registry | Gate 0 + S1–S4 Dual-Authority persist/UI/materialize | No S1–S4 rebuild. Official eligibility still needs Official Truth | `RUNTIME_BUILT` | `docs/AP7_S4_ACCOUNT_PLAN_RECONCILIATION_2026-08-30.md` (plan “no table/UI” is **stale**) | V1 registry built | Do not replan AP-7-S1–S4 |
| AP-8 Preferences | Trip-scoped workspace prefs only; `profiles` is identity | Account-wide explicit prefs, isolated from Traveller | `REMAINING_IMPLEMENTATION` | Plan AP-8 | Not V1-critical | Profile/Identity ADR + Production migration if `profiles` grows |
| AP-9 Favorites | Nav “kommt später”; no table/UI | Isolated favorites after a Nutzenfrage | `REMAINING_IMPLEMENTATION` | Plan AP-9 | Not V1-critical | PO Nutzenfrage first; not automatic |
| AP-10 Booking folder | Read-only `/account/bookings` for user-confirmed `booked` items | No new booking model; no invented prices | `RUNTIME_BUILT` | `app/account/bookings/page.tsx`; `docs/CHATGPT_TL_AP10_S1_POST_MERGE_CHECKPOINT_2026-08-30.md` (plan “no account-wide overview” is **stale**) | V1 S1 built | Do not rebuild; S5-B/TW-8 remain separate |
| AP-11 Notifications | Safety/Seasonal foundations only | Account topic matrix, quiet hours, suppression | `REMAINING_IMPLEMENTATION` + consent gate | Plan AP-11 | Later / after privacy seam | Not V1-critical; Production migration |
| AP-12 Entitlements | Admin `payments` must not be reused | Consumer entitlement port; no Stripe-live | `REMAINING_IMPLEMENTATION` + `PO_GATED` for money | Plan AP-12 | Later | Payment/money-movement gate for live |

### 3.1c Admin A–K and Billing-P1

Target register: `docs/ADMIN_D_K_GROWTH_CONTROL_AUDIT_EVIDENCE.md`. Old AAL2-absent / analyst-placeholder / `main protected=false` findings are **superseded**. Do not group every letter as “later”.

| Unit | Built | Remaining | Class | Sources / closures | Gate / next |
| --- | --- | --- | --- | --- | --- |
| A Steuerzentrale | Honest IA on main | — | `RUNTIME_BUILT` | Evidence §3 A | Reuse |
| B System Health | Read-only probes + #518 analyst | Still one real probe; no vendor expansion now | `RUNTIME_BUILT` + `PARTIAL` residual | #518 `1103407b`; #497 5.4 | Credentials/vendor later |
| C Provider / cost | S1 + `model_usage` + #538 attention | No zero-spend claim; no live provider | `RUNTIME_BUILT` | #538 `5fee5f66` | No paid activation |
| D Security hardening | Honest coverage #485; architecture #487; local proof #494; KPI #504; Admin AAL2 alignment #480 | Persistent ingestion / gate G; `admin_audit_events`; write confirm | Mixed: presentation/architecture `RUNTIME_BUILT`; ingestion `LIVE_ACTIVATION_MISSING` | #480/#485/#487/#494/#504 | Persistent apply closed; do not rebuild architecture |
| E Support user+trip RO | Process runbook #470; account error + Fehler-ID | Support RPC / minimised trip card still absent | Process `RUNTIME_BUILT`; RPC `REMAINING_IMPLEMENTATION` | #470/#483; Evidence E | Privacy/RLS if new privilege |
| F Command palette | Disabled `Befehlssuche folgt` control exists | Real authorized-list search | `REMAINING_IMPLEMENTATION` (later ungated scoped option) | `components/layout/AdminTopbar.tsx` L137–146; `ADMIN_EHRLICHE_TEXTE.sucheFolgt`; Evidence F | No DB/secret if lists-only. **Not V1-critical. Named in §4. Deferred, not dispatched.** |
| G Finance-readiness | Fake revenue tiles removed #472 | Honest local ledger view; no Bexio | `REMAINING_IMPLEMENTATION` after Billing-P1 | #472; Evidence G | **Billing-P1 first**; no live Bexio/Stripe |
| H Infomaniak RO | Absent | Domain/mail metadata | `PO_GATED` | Evidence H | Secret/OAuth/cost |
| I Copilot analyst | First read-only foundation #510/#518/#538 | Copilot Pro / execute later | Read-only `RUNTIME_BUILT`; Pro `DELIBERATELY_LATER` | #510/#518/#538 (old “I placeholder” superseded for the first foundation) | Cost/model gates for expansion |
| J Analytics / SEO | Placeholder | SEO-health RO after D0; no demo charts | `DELIBERATELY_LATER` / indexing-gated | Evidence J | After D0-2; launch/indexing gate |
| K Ads / Bexio / payment ingest | Absent | Live connectors | `PO_GATED` | Evidence K | Secrets, paid calls, money, contracts |
| Billing-P1 local refund integrity | Route exists; no live money | INSERT refund → read payment → optional status update; **no transaction / idempotency** | `REMAINING_IMPLEMENTATION` before Finance/Payment-Live | `app/api/admin/payments/refund/route.ts`; `docs/ADMIN_BILLING_LOCAL_REFUND_INTEGRITY_TASK.md` | Own Billing contract. Migration if schema. **Do not implement from this map.** Money-movement remains a reserved gate. |
| M0–M6 Growth OS | Absent | Full growth control plane | `DELIBERATELY_LATER` | Evidence §4 | Consent + commercial truth |
| Branch protection | Ruleset `21875372` live-verified | Not an Admin product slice | `RUNTIME_BUILT` (enforcement) | #512 / OS-2 HOLD-closure evidence | Cursor must not mutate Rulesets |

### 3.1d Guardian / Reise-Autopilot and What-if Simulator

These are **named binding long-term targets**. They must not be folded into generic “Advanced Companion”.

| Named target | Built | Remaining | Class | Sources | Phase mapping (no invented number) |
| --- | --- | --- | --- | --- | --- |
| Guardian / Reise-Autopilot | Cross-domain attention/readiness hooks exist; no silent-write Guardian product | Full impact/apply intelligence over the canonical trip | `BINDING_LONG_TERM` | `docs/JETNITY_BINDING_BUILD_ORDER.md` §10; `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md` | ADR-0204 Phase 2 lists change-detection / advanced companion as **platform** capabilities. ADR-0204 also says the older Binding Build Order must **not** be read as “entire long-term programme before V1”. The 1 Sep three-phase reconciliation assigns **no exclusive V1-blocking phase number**. V1 build order §7 keeps in-app companion after Official/Event truth; push/email later. Historical technical phase names stay historical. |
| What-if Reise-Simulator | None as an isolated scenario product | Sandbox delta vs baseline; apply only via explicit controlled write | `BINDING_LONG_TERM` | Same two docs; strategy register #236 item 6 is do-not-auto-start | Same mapping. Related to Phase-2 decision support, **not** the same object as in-app V1 companion. |

Hooks may appear earlier only if a current slice already needs them. Full programme + Binding Build Order §11 final Guardian/Simulator audit are **not** a current dispatch and do not change the V1 build order.

### 3.2 Phase 2 — Complete Travel Platform (explicit later)

| Area | Class | Remaining work | Why later |
| --- | --- | --- | --- |
| Multi-provider per category | `DELIBERATELY_LATER` | Second+ flight/hotel/activity providers | V1 is one professional path per category |
| Mobility breadth (rail/bus/ferry/car/cruise/insurance) | `DELIBERATELY_LATER` | Full category products | Canonical Phase 2; current mobility is stage-order truth only |
| Advanced Companion (push/email/tasks) | `DELIBERATELY_LATER` | Tasks, completion, push/email | Distinct from named Guardian/What-if in §3.1d |
| Destination intelligence / personalization | `DELIBERATELY_LATER` | Seasons, weather, POIs, consent-based personalization | Beyond Destination Essentials |
| Admin Copilot Pro / Bexio / Ads / Finance-Live / Growth M0–M6 | `DELIBERATELY_LATER` / `PO_GATED` | Live ops/growth plane | Per-unit remainder is §3.1c; I-foundation already built |
| Entitlements / premium matrix | `DELIBERATELY_LATER` | Broader paid packaging | AP-12; slim V1 premium only if later decided |
| Offline / push / service worker | `DELIBERATELY_LATER` | PWA-2 | Explicitly out of PWA-1 |

### 3.3 Phase 3 — Travel Ecosystem (explicit later)

| Area | Class | Remaining work | Why later |
| --- | --- | --- | --- |
| Native iOS/Android | `DELIBERATELY_LATER` | Same central truth, native clients | Not V1-blocking |
| Traveller network / matching / group social | `DELIBERATELY_LATER` | Privacy/safety/moderation first | Canonical Phase 3 |
| Collaboration on one trip (#20 / historical #28) | `DELIBERATELY_LATER` | Membership, roles, RLS, invites | See collision matrix. Not a V1 candidate |
| Creator / partner / marketplace ecosystem | `DELIBERATELY_LATER` | Published trips, DMO/partners | Anti-bloat; Phase 3 |
| Own intelligence / data assets | `DELIBERATELY_LATER` | Graphs, readiness engine, quality intelligence | After real usage |
| Multilingual international expansion | `DELIBERATELY_LATER` | CH → DACH → EU → prioritized markets | Launch sequence after Swiss V1 |

---

## 4. Prioritized ungated candidates

### Already assigned — not new work

| ID | Slice | Why it is real | Ownership | Acceptance (summary) | Why not duplicate |
| --- | --- | --- | --- | --- | --- |
| C0 | Jetnity homepage confirmed route entry 1 | Homepage on pinned main confirms **one** place (`StartzielForm` → `zielHref`) while planner already supports ordered destinations | Exclusive: PR **#543**, branch `feat/homepage-confirmed-route-entry-1`. Observed live draft head at this correction: `676d64b44db3080744b5ccda1354a7f3dd0590f5` (4 commits, 28 files, still **draft**, base still `35148a4b`). First capture `21878674` was task-only; later commits added runtime + own evidence. This map does **not** audit that implementation | Progressive confirmed places, review/correct, lossless handoff into existing Guest/Account create; intentional duplicates/order preserved; no provider/model; does **not** close full #110 NL | Sole homepage-route writer. This PR must not touch those files |

### Additional V1-critical ungated implementation slices

**None proven by this review.**

That sentence is bounded. It means: this reconciliation did not find another **V1-critical**, provider-independent implementation slice that should be dispatched now. It does **not** mean all non-provider implementation is complete, and it does not erase later ungated scoped options.

Named later / scoped options assessed and **deferred** (no automatic dispatch; build order unchanged):

| Option | Why it is real | Value | Phase / priority | Why deferred now |
| --- | --- | --- | --- | --- |
| Admin F command palette | Disabled search control already exists (`AdminTopbar` + `sucheFolgt`) | Faster authorized Admin navigation | Admin programme; **not** V1 traveller-critical | Does not unblock legal/SMTP/official/commercial launch cluster or #543. Evidence lists it as smallest Admin step, not a Core-journey blocker. Keep named; do not dispatch from this map |
| Admin J-lite SEO-health RO | Evidence names it after D0-2 | Honest robots/sitemap read | Indexing/launch-adjacent | Depends on D0-2; public indexing remains a reserved gate |
| Admin IA-M0-Nav | Optional docs+nav `folgt` labels | IA honesty only | Admin IA | No new truth; TL may separate from F later |
| Billing-P1 refund integrity | Route still INSERT → read → update without transaction/idempotency | Prevents local ledger lie before Finance-Live | Before Admin G/K | Real residual. Requires a Billing contract; schema/money gates possible. **Not implemented here.** Not a substitute for PO payment-live |
| AP-8 preferences | Plan unit still missing account-wide prefs | Traveller convenience | After profile ADR | Identity/`profiles` gate; not V1-critical |
| AP-9 favorites | No table/UI | Retrieval convenience | After Nutzenfrage | PO Nutzenfrage first |
| AP-11 notifications | No account topic matrix | Later companion/ops | After privacy/consent seam | Not V1-critical; push remains later |
| AP-12 entitlements | No consumer port | Monetization packaging | After entitlement cut | Money-movement reserved |
| TW-9 full closure | Plan-mandated audits after dependencies | Release proof | After TW-8 / required runtime | Not another UX polish slice; do not rerun closed audits |
| Guardian / What-if | Binding named targets | Cross-domain change intelligence | `BINDING_LONG_TERM`; no invented phase | Hooks only if a current slice needs them. Not current dispatch |
| RH-5.1 / RH-6.1 official helpers | Latent unused aggregates | Harden before official provider | Before official activation | Not first while provider-later holds |
| VUX-6 360 hero | Visual finding | Brand vs peek | Not accepted | Do not reopen |
| Full #110 NL | Remainder after confirmed places | Natural route intent | After #543 | Parallel writer forbidden |

The useful ungated Trip/Account honesty repairs (TA-R1/R2/R3 + guest preservation) and accepted visual repairs are already merged. Legal shells without PO content would violate AP-6a. Provider-later stands.

---

## 5. Collision / dependency matrix

| Work | Head / merge-base vs pinned main | Files / class | Collision with #543 or this map | Action from this writer |
| --- | --- | --- | --- | --- |
| #544 this map | Seed `492a35f9`; previous invalid head `962b2209`; merge-base `35148a4b`; **3 ahead / 0 behind** before this persist | Only `docs/JETNITY_REMAINING_BUILD_MAP_1_*` + `docs/evidence/remaining-build-map-1/` | Disjoint from #543 runtime | Correct R1–R3 and STOP |
| #543 homepage route | GitHub: base `35148a4b`, live draft head `676d64b4` (was `21878674` task-only). Still draft, not on main. This map does not audit the 28-file implementation | Homepage/planner route runtime — exclusive | **IN_PROGRESS_NOT_MAIN**. Either merge order is technically valid; TL serializes | Do not write, review-implement, or treat as main |
| #52 24-Aug TL handoff | `f1e13db3`; merge-base `52e665ac`; **67 ahead / 1958 behind**; docs-only checkpoints | Stale global continuity docs | No runtime overlap. Content superseded by later checkpoints/#512/#542 | Historical Draft. Do not resume/close/merge |
| #50 Provider Ops S1 status | `f5a25c94`; merge-base `f92e0c9e`; **3 / 1961**; status docs | S1 already long closed on main | None as a writer | Historical Draft |
| #40 Admin platform audit | `a3160157`; merge-base `cd220beb`; **15 / 1967**; Aug-24 admin docs including Copilot Pro notes | Superseded by later Admin A–C, #510/#518/#538 | Do not treat as current Admin scope | Historical Draft |
| #39 Account platform audit | `65b08f47`; merge-base `cd220beb`; **11 / 1967**; Aug-24 account docs | Superseded by later Account/Traveller/export/MFA closures | None as a writer | Historical Draft |
| #28 Trip Collaboration Foundation / #20 | `e0132cb5`; merge-base `70c9c899`; **1 / 2033**; single file `docs/CURSOR_TRIP_COLLABORATION_FOUNDATION.md` **absent on main** | Docs classification only. Body uses obsolete “Phase 3.1 Flight Foundation, therefore start collaboration now”. Canonical ADR-0204 Phase 3 is ecosystem/collaboration. Issue #20 remains a future tracker | No file overlap with #543 or this map. Not a collaboration restart | **Read-only classification. Do not resume, close, or merge** |

Open issues that are trackers, not writers: #440 standing authorization; #395 provider decision **deferred**; #294 / #236 / #110 / #20 do-not-auto-start except the already-cut #543 slice of #110.

---

## 6. Dependency order, risks, reserved gates

### 6.1 Current development order (provider-later preserved)

1. Finish exclusive #543 homepage confirmed-route entry; independent exact-head review; TL integrates.  
2. No additional **V1-critical** Cursor implementation from this map. Named later options in §4 stay visible and undispatched.  
3. When a **concrete** user outcome cannot be completed with provider-neutral contracts, return to #395 with the exact dependency — not a generic “build order §2” reminder.  
4. PO-gated launch cluster (legal content, SMTP, deletion, retention, observability, Production redirects, persistent 5.2) stays decision-first.  
5. Billing-P1 stays a documented residual before Finance/Payment-Live; not started here.  
6. Formal V1 Release Readiness Gate (`docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`) only after the above truths exist. TW-9 close-out audits belong there, not as a polish slice now.  
7. Launch sequence remains Private Alpha → Closed Beta CH → Swiss Public Launch.  
8. Phase 2/3 and named Guardian/What-if only after the applicable dependencies; no forced Phase-2 start.

### 6.2 Risks vs current development risks

| Class | Items | Notes |
| --- | --- | --- |
| P0 launch | Missing legal pages (TL-observed Production 404 22 Sep); SMTP; no live commercial/official truth for a real traveller journey | Not current product-code defects on main |
| P1 launch | Account erasure; retention; consent persistence after 1.1; persistent security ingestion / gate G; consumer MFA recovery codes; **Billing-P1 local refund integrity** before Finance-Live | Architecture/local proof must not be reread as closed ingestion. Refund route is not live money |
| P2 launch | Production redirect write (historical #480 values, **not** freshly read); formal release-gate run; whole-journey real-device proof | Startup prose can still reopen closed UX if #512 later comments are ignored |
| P3 / accepted | Admin usage ≠ total infra cost; Grok native-scheduled/material-archive proofs remain false; #28 stale phase claim | Do not “fix” accepted limitations here |
| Current development | Parallel homepage writer vs this docs map | Disjoint. Risk is only if someone treats #543 as main or starts a second route writer |

### 6.3 Reserved Product-Owner gates — no approval requested now

- Provider contact / signup / terms / secrets / paid or live calls / Production S6 / commercial writer / TW-8 activation  
- Legal page content and PrivacyBee activation  
- Account deletion semantics  
- Retention periods  
- Observability vendor  
- Production Auth/SMTP/redirect writes  
- Persistent security ingestion  
- Model Production activation / new spend  
- Public launch / indexing / domain cutover  
- Passkeys / second MFA factor  
- Payments / money movement  

#395 draft [5776519385](https://github.com/Jetnity/jetnity/issues/395#issuecomment-5776519385) remains INTERNAL / UNSENT / DEFERRED.

---

## 7. Stale-status contradictions resolved (not re-audited)

| Stale claim | Current source | Resolution |
| --- | --- | --- |
| Phase-1 matrix: World Map `MISSING` | World Map 1 + polish 2 + `account_visits` / `besuche-*` on pinned main | `RUNTIME_BUILT`. Visited is **user-confirmed**, never inferred |
| Phase-1 matrix: PWA incomplete | PWA-1 #391 closed | Installability built; offline/push deliberately later |
| Phase-1 matrix: Assistant only partial idea | #427 + #435 on main | Runtime built; Production model still gated |
| START_HERE / some STATUS files still talk as if #512 or HOLD were current | #512 **merged** `d3d42047`; mode `NORMAL`; #512 comments 22 Sep are current continuity | Live GitHub/Git wins. This slice does **not** edit global startup docs |
| #509 NEXT_SLICES still look open | #517/#520/#531/#532 merged | Do not re-dispatch TA-R1–R3 |
| #506 findings still look open | Accepted repairs merged; VUX-6 not accepted | Do not rerun the audit |
| #487 parked | Merged architecture-only `4169c5b4` | Ingestion residual remains; writer is not parked architecture |
| #494 still “owns next local proof” in older reconciliation text | #494 merged `c7fb9f0f` | Local proof done; persistent ingestion still open |
| Collaboration “now”, per #28 | ADR-0204 Phase 3; issue #20 do-not-auto-start; draft 2033 behind | Historical classification only |
| Old whole-product gap = remaining V1 | This map | Foundations ≠ live activation ≠ release proof |
| Account plan “AP-7 has no table/UI”; “AP-10 has no account overview” | `AP7_S4_ACCOUNT_PLAN_RECONCILIATION`; `app/account/bookings/page.tsx`; AP-10-S1 checkpoint | Those plan sentences are **stale**. Registry + booking folder are built |
| Admin D–K evidence “AAL2 absent / I placeholder / main unprotected” | #480 AAL2 alignment; #518/#538 analyst/usage; Ruleset `21875372` | Superseded findings. D–K units still exist and are classified per letter |
| TW-9 = accepted UX repairs | Plan TW-9 + mandated audits | Repairs closed; programme closure still `RELEASE_PROOF_MISSING` |
| Guardian/What-if = Advanced Companion | Binding Build Order §10 + Guardian/What-if standard vs ADR-0204 | Named separately; no invented exact phase |
| #543 still task-only `21878674` | GitHub PR #543 head `676d64b4`, draft, 4 commits / 28 files, base still pinned main | Still `IN_PROGRESS_NOT_MAIN`. Not audited here |

---

## 8. Limits and UNVERIFIED items

- No credentialed Supabase/Vercel/Auth re-read. CI `35724784300` SUCCESS and Production `dpl_4KBe74AJFDvJnSok1dvubUbjaHZh` READY are **TL-observed 22 Sep 2026** on this SHA.  
- Production `account_visits` table/functions: migration version `20260917120000` was listed in the TL catalogue note; the table itself was not named. **UNVERIFIED** at table granularity.  
- Production SMTP / `site_url` / redirect allow-list: **not** freshly read; historical #480 + later reconciliation only.  
- #543 implementation was not audited. Observed head moved from task-only `21878674` to `676d64b4` during this correction window and may move again after this freeze. Still draft / not main.  
- No Cursor-wide UI inventory. Session display name was not renamed.  
- No repo-wide test/build matrix (docs-only; task forbids unnecessary reruns).  
- No percentage-complete claim.  
- Historical Draft file lists are vs each draft’s own merge-base, not a claim those docs are current.  
- Billing-P1: route source on pinned main was re-read. Production refund schema/FK from the 24 Aug task was **not** freshly re-read (`UNVERIFIED` as live schema).  
- TW function-by-function / intelligence audit files were confirmed present; they were not executed.

---

## 9. Traveller-context check

Relevant for Entry, Traveller, World Map and commercial eligibility rows. This map does not collect credentials. It preserves: no default passport; planned ≠ visited; Official/Provider truth stay fail-closed `unknown` until real evidence exists.

---

## 10. Stop

Exact content head is the commit that adds this report plus STATUS / HANDOFF / SELF_REVIEW / evidence. That SHA is reported after push.

**STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW.**  
Self-review is not PASS. Do not mark Ready. Do not merge. Do not start a follow-up slice. All gates on `962b2209` are invalid.
