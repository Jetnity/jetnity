# Jetnity – Handoff und nächste Schritte

Stand: 25. August 2026  
Status: **kanonischer operativer Übergabepunkt. TW-1 bis TW-4 liegen auf `main`. TW-5 Runtime auf Draft-PR #66; P1-QS1-01 behoben und auf `8183782f` gegatet; STOPP für erneuten unabhängigen Technical-Lead-Review.**

Dieses Dokument ist der zentrale operative Handoff für neue Chats und Coding Agents. Der erste Einstieg bleibt `JETNITY_START_HERE.md`.

> **Repository-Dokumentation + Live-GitHub-/CI-/Vercel-/Supabase-Evidence ergeben zusammen die Wahrheit. Nicht aus Erinnerung, Screenshots oder historischen PR-Bodies raten.**

> **Kein relevanter Fortschritt darf beim Wechsel von Chat, Agent oder Sitzung verloren gehen. Was für die Fortsetzung wichtig ist, gehört ins Repository.**

## 1. Pflichtlektüre

Vor größeren Produkt-/Architektur-/Implementierungsentscheidungen mindestens lesen:

- `JETNITY_START_HERE.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
- `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
- `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
- `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- relevante aktuelle Slice-Tasks, Statusdateien, ADRs, Handoffs und Auditpläne.

Zusätzliche dauerhaft relevante Repo-Standards und Fachmandate müssen bei berührtem Scope ebenfalls gelesen werden, insbesondere:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `DESIGN_SYSTEM.md`
- `AGENTS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`
- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`
- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`
- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`

Falls `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md` oder ältere Handoffs noch pauschal eine aktuelle Product-Owner-Freigabe für **jeden** normalen Merge verlangen, ist diese Regel durch die neuere verbindliche `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md` ersetzt. Die besonderen Product-Owner-Gates bleiben unverändert.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Actions, Vercel, relevante Supabase-Stände/Migrationen, Review-Threads und Ahead/Behind.

## 2. Rolle und Governance

ChatGPT / Technical Lead ist die übergreifende Product-, Architecture-, Logic-, Security-, Privacy-, UX-, Performance-, QA-, Release-, Kosten-, Continuity- und Integrationsinstanz für Jetnity.

Coding Agents implementieren abgegrenzte Workstreams. Grüne Tests/CI/Vercel sind Evidence, ersetzen aber keinen unabhängigen fachlichen Technical-Lead-Review.

Die aktuelle Autonomy Policy ersetzt ältere pauschale Regeln, nach denen **jeder** normale Ready-/Merge-Schritt eine separate Product-Owner-Freigabe brauchte. Normale scope-treue PRs dürfen nach vollständigen Exact-Head-Gates und unabhängigem Technical-Lead-PASS selbst Ready gesetzt und gemergt werden.

Besondere Product-Owner-Gates bleiben bestehen, insbesondere für Production-Migrationen, destructive Production-Daten, große RLS/Identity/Ownership-Risiken, echte Provider/Secrets/Verträge/paid calls, Kosten über USD 100/Monat, reale Payments, fundamentale Produkt-/Business-Model-/Build-Order-Abweichungen, besonders sensitive Pass-/MRZ-/Biometrie-Speicherung und Public-/Production-Aktivierungen.

## 3. Produktmandat

Jetnity soll zum führenden intelligenten Reiseplanungs- und Reisebegleitungsprodukt seiner Kategorie entwickelt werden. „Nummer 1“ ist Entwicklungsziel, keine heutige Marktbehauptung.

Leitsätze:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, erfundene Visa-/Safety-/Seasonal-/Live-Truth. `unknown` bleibt `unknown`. LLM/Assistant darf Hard Truth erklären, nicht erzeugen.

## 4. Technischer Kern

- Next.js App Router / TypeScript / Tailwind
- Vercel
- Supabase Postgres/Auth/Storage
- gemeinsamer kanonischer Reisegraph statt separater Schattenmodelle
- Web/PWA zuerst, professionelle Native-App-Phase später

Supabase Production: `qscbgcdmivbbnzrcyegn` (`eu-central-2`).

Echte Travel-Provider bleiben deaktiviert, solange ihre jeweiligen Readiness-/Contract-/Secret-/Cost-/Production-Gates nicht erfüllt sind.

## 5. Traveller-Kernmodell

Foundation E ist bereits integriert/produktiv und wird nicht neu gebaut.

Kanonisch:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein impliziter Standard-Pass oder Default-Citizenship. Ausstellerland ist nicht automatisch Staatsbürgerschaft. Fehlt für Official/Regulatory eine notwendige Citizenship-/Document-Evidence, bleibt das Ergebnis `insufficient_context`/`unknown` statt erfunden.

Keine neue Speicherung von Passnummern, Scans, MRZ oder Biometrie ohne besonderes Product-Owner-/Privacy-/Security-Gate.

## 6. Verbindliche spätere Intelligence-Systeme

Bereits Product-Owner-verbindlich und nicht zu vergessen:

- **Jetnity Guardian / Reise-Autopilot** – reale Änderungen/Probleme cross-domain auf die Reise auswirken, ohne stille reale Writes.
- **What-if-Reise-Simulator** – hypothetische Änderung in isolierter Sandbox; reale Baseline bleibt unverändert; Apply nur über sicheren kanonischen Write-Pfad.
- **Value Optimizer** – Preis gegen Zeit/Umstiege/Komfort/Gesamtnutzen auf belastbarer Evidence bewerten.

Wo fachlich identisch, gemeinsame Impact-/Evidence-Bausteine; keine drei widersprüchlichen Berechnungswelten.

## 7. Marketing, Growth und Discoverability

Verbindliche Programme umfassen u. a. Attribution, versionierte Events, Funnel, Activation/Retention, CAC/LTV/Payback/Contribution Margin, CRM, Referral, Creator/UGC, Reviews, Paid Media mit Spend Caps/Kill Switch, SEO, internationale SEO, Schema.org, AI-/Answer-Engine-Discoverability, ASO, Approved Claims, Tracking/Data Quality und Growth Economics.

Keine Fake Reviews/Nutzerzahlen/Awards, Dark Patterns, Keyword-Spam, Linkfarmen, unbelegten Claims oder sensitiven Pass-/Identity-Daten für Marketingtargeting.

Öffentliche Growth-/Discoverability-Surfaces gehören später zu `Jetnity growth discoverability`; internes Marketing-/Growth-Control-Center bleibt bei `Admin platform audit`.

## 8. Aktueller Runtime-Stand

Letzter verifizierter Runtime-Merge auf `main` vor diesem docs-only Continuity-Update:

`16a4c77a53cff9e8638a68f5dd8c77122bf13b48`

Abgeschlossen / integriert:

- Foundation C – Readiness
- Foundation D – Route & Transit Intelligence
- Foundation E – Traveller Context
- Travel Safety & Disruption Intelligence Foundation
- Travel Timing & Seasonal Intelligence
- Account AP-1 bis AP-3
- Provider Readiness S1 bis S3
- Admin Slice A bis C
- Trip Workspace Audit/Zielarchitektur
- TW-1 – Shell & Geräteparität / PR #56
- TW-2 – Reiseübersicht / PR #58
- Marketing & Growth Standards / PR #59
- TW-4 – Aufmerksamkeit / Jetzt wichtig / PR #60 / Merge `c935dd9f...`
- TW-3 – Timeline / Etappe / Tag / PR #64 / Merge `16a4c77...`

TW-3 finaler Exact Head:

`f55db2b0682981f293390b44e704b513476703bf`

TW-3 Independent Technical-Lead Result: **PASS / Technical Integration Closure**.

Evidence:

- gezielte TW-3-Tests 10/10
- `npm test` 1953/1953
- Production Build grün
- Workspace-Audit 1018/1018, 0 Fehler
- GitHub Actions CI `32861784215`: SUCCESS
- Vercel Exact-Head Preview: READY
- Vercel Production auf `16a4c77...`: READY
- keine offenen PR-#64-Review-Threads

Damit ist der Checkpoint **TW-4 ✅ → TW-3 ✅ → Technical-Lead-Integrationscheckpoint** erreicht.

PR #52 bleibt historischer docs-only Draft-Handoff und darf nicht als Runtime-Träger behandelt werden.

## 9. Nächster primärer Slice: TW-5

Agent:

`Trip workspace audit architecture`

Branch:

`feat/trip-workspace-tw5-item-gap-details`

Nächster Slice:

**TW-5 – Item- und Gap-Details**

Live-Stand:

- Draft-PR #66 offen, Draft, MERGEABLE;
- Evidence-Head `8183782f`;
- P1-QS1-01 auf Presentation-Ebene behoben;
- mit `main` `d039e7bf` synchron.

Ziel: vorhandene Flight-/Unterkunft-/Aktivitäten-/Mobilitätsflächen als Details einer Reise-/Coverage-/Attention-Lücke einhängen, statt eine zweite modulzentrierte Haupt-IA aufzubauen. Bestehende Lazy-Search-Mounts bleiben erhalten.

Harte Grenzen:

- keine Live-Provider;
- keine Fake-Angebote/Verfügbarkeit/Preise;
- keine manuellen Flights als nachgewiesene Providerangebote;
- kein stilles `ZRH`/Herkunftsdefault;
- keine DB/Migration/RLS/Auth/Traveller-/Route-Neumodellierung;
- kein Guardian/Simulator;
- kein TW-6+;
- keine Homepage-/Marketing-Runtime;
- keine Production-Aktivierung.

Runtime und Exact-Head-Evidence inkl. P1-QS1-01-Closure sind vorhanden. STOPP für erneuten unabhängigen Technical-Lead-Review. Kein Ready, kein Merge, kein TW-6.

## 10. Agentenstatus

- `Trip workspace audit architecture`: primärer Workstream; TW-5 Runtime auf Draft-PR #66, P1-QS1-01 behoben, STOPP für erneuten Technical-Lead-Review.
- `Account plattform audit vorbereitung`: wartet; AP-1–AP-3 integriert.
- `Jetnity provider readiness audit`: wartet; S1–S3 integriert.
- `Admin platform audit`: wartet; A–C integriert.
- `Jetnity growth discoverability`: reserviert, noch nicht starten.
- `Jetnity quality security audit`: reserviert als unabhängige QA/Security/Release-Prüfinstanz; gezielt ab stabilem Integrations-/Multi-Agent-Checkpoint aktivierbar.
- `Jetnity native app architecture`: verbindlich für spätere Native-Phase reserviert; jetzt nicht starten.

Der ältere Schlussabschnitt von `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`, der einen siebten Agenten noch nicht als aktuelle Entscheidung bezeichnete, ist durch die neuere ausdrückliche Product-Owner-Entscheidung in `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md` superseded. Bis zur Native-Phase bleiben sechs aktive/reservierte Fachworkstreams plus Technical Lead; später kommt der exakt benannte Native-Agent hinzu.

## 11. Shared Contracts

Technical-Lead-kontrolliert:

- Auth / Identity / Sessions / MFA / AAL
- RLS / Ownership / Guest→Account
- Traveller / Multi-Citizenship / Multi-Document
- Route / Transit
- Privacy / Consent
- Billing / Payment
- Admin Audit / Capabilities
- Provider Activation
- Attribution / Revenue / Claims Truth
- Guardian / Simulator / Value Impact

Ein möglicher späterer Citizenship-only-Credential-Option-Contract ist dokumentierter Shared-Contract-Bedarf aus TW-4, aber kein TW-5-Blocker.

## 12. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn` (`eu-central-2`) – live `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Diese Development-Migrationen sind **nicht Production-approved** und dürfen nicht eigenmächtig auf Production angewendet werden.

## 13. Große Build-Reihenfolge

Kanonisch weiter gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`:

1. Trip Workspace vollständig fertigbauen – jetzt TW-5, danach abhängige TW-6/7/8, TW-9 und finaler Function-by-Function-/Intelligence-Audit.
2. Traveller / Pass / Multi-Citizenship produktweit vervollständigen.
3. Account Platform AP-4 bis AP-12.
4. Provider Readiness S4 bis S8, danach echte Provider nur unter Gates.
5. Admin Control Center D–K plus Marketing/Growth Control Plane.
6. Homepage finalisieren + D1/G0/G1 soweit Abhängigkeiten erfüllt.
7. AI/Search Discoverability / Authority.
8. Marketing & Growth G0–G5 phasenabhängig.
9. kommerzielle Produktschicht mit realer Commercial Truth.
10. Guardian / What-if / Value-Impact-Integration und danach finaler Launch-Hardening-Audit.

Konfliktarme Vorbereitungs-/Audit-Arbeit darf parallelisiert werden, aber die große Reihenfolge darf ohne Product-Owner-Entscheidung nicht still verändert werden.

## 14. Offene Governance-Risiken

- `main` Branch Protection ist live weiterhin nicht aktiviert.
- Historische offene PRs sind nicht automatisch aktive Runtime-Slices.
- Alte Status-/Handoff-Zeilen können pre-merge Evidence sein; `JETNITY_START_HERE.md` + `docs/ACTIVE_WORK_STATUS.md` + Live-Systeme bestimmen den aktuellen Stand.

## 15. Was jetzt zu tun ist

TW-5 Runtime und Exact-Head-Evidence inkl. P1-QS1-01-Closure liegen auf Draft-PR #66. **Kein Ready, kein Merge, kein TW-6.**

ChatGPT / Technical Lead führt den erneuten unabhängigen Review auf Exact Head `8183782f` plus docs-only Persist.

## 16. Continuity-Satz für einen neuen Chat

> **„Wir machen mit Jetnity weiter. Lies zuerst `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, die dort definierte Pflichtlektüre und verifiziere danach `main`, PRs, CI, Vercel und relevante Supabase-Stände live. Übernimm exakt die bisherige Technical-Lead-Rolle.“**
