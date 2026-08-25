# Jetnity – Handoff und nächste Schritte

Stand: 25. August 2026  
Status: **kanonischer operativer Übergabepunkt nach Integration von TW-3. TW-1, TW-2, TW-4 und TW-3 sind auf `main`; nächster primärer Workspace-Slice ist TW-5 – Item- und Gap-Details.**

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

## 4. Traveller-Kernmodell

Foundation E ist bereits integriert/produktiv und wird nicht neu gebaut.

Kanonisch:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein impliziter Standard-Pass oder Default-Citizenship. Ausstellerland ist nicht automatisch Staatsbürgerschaft. Fehlt für Official/Regulatory eine notwendige Citizenship-/Document-Evidence, bleibt das Ergebnis `insufficient_context`/`unknown` statt erfunden.

Keine neue Speicherung von Passnummern, Scans, MRZ oder Biometrie ohne besonderes Product-Owner-/Privacy-/Security-Gate.

## 5. Verbindliche spätere Intelligence-Systeme

Bereits Product-Owner-verbindlich und nicht zu vergessen:

- **Jetnity Guardian / Reise-Autopilot** – reale Änderungen/Probleme cross-domain auf die Reise auswirken, ohne stille reale Writes.
- **What-if-Reise-Simulator** – hypothetische Änderung in isolierter Sandbox; reale Baseline bleibt unverändert; Apply nur über sicheren kanonischen Write-Pfad.
- **Value Optimizer** – Preis gegen Zeit/Umstiege/Komfort/Gesamtnutzen auf belastbarer Evidence bewerten.

Wo fachlich identisch, gemeinsame Impact-/Evidence-Bausteine; keine drei widersprüchlichen Berechnungswelten.

## 6. Marketing, Growth und Discoverability

Verbindliche Programme umfassen u. a. Attribution, versionierte Events, Funnel, Activation/Retention, CAC/LTV/Payback/Contribution Margin, CRM, Referral, Creator/UGC, Reviews, Paid Media mit Spend Caps/Kill Switch, SEO, internationale SEO, Schema.org, AI-/Answer-Engine-Discoverability, ASO, Approved Claims, Tracking/Data Quality und Growth Economics.

Keine Fake Reviews/Nutzerzahlen/Awards, Dark Patterns, Keyword-Spam, Linkfarmen, unbelegten Claims oder sensitiven Pass-/Identity-Daten für Marketingtargeting.

Öffentliche Growth-/Discoverability-Surfaces gehören später zu `Jetnity growth discoverability`; internes Marketing-/Growth-Control-Center bleibt bei `Admin platform audit`.

## 7. Aktueller Runtime-Stand

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

## 8. Nächster primärer Slice: TW-5

Agent:

`Trip workspace audit architecture`

Branch:

`feat/trip-workspace-tw5-item-gap-details`

Nächster Slice:

**TW-5 – Item- und Gap-Details**

Live-Stand beim Handoff-Check:

- Branch existiert und stand auf `16a4c77...`;
- noch kein TW-5-Runtime-Commit;
- noch kein TW-5-Draft-PR;
- Cursor-Agent noch nicht für TW-5 neu angestoßen.

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

Vor Runtime: TW-5 ADR/Task/Status + Draft-PR + Acceptance/Gates. Danach Cursor-Agent starten. Agent stoppt nach Self-Review/Exact-Head-Evidence für unabhängigen Technical-Lead-Review.

## 9. Agentenstatus

- `Trip workspace audit architecture`: primärer nächster Workstream; TW-5 noch nicht gestartet.
- `Account plattform audit vorbereitung`: wartet; AP-1–AP-3 integriert.
- `Jetnity provider readiness audit`: wartet; S1–S3 integriert.
- `Admin platform audit`: wartet; A–C integriert.
- `Jetnity growth discoverability`: reserviert, noch nicht starten.
- `Jetnity quality security audit`: reserviert als unabhängige QA/Security/Release-Prüfinstanz; gezielt ab stabilem Integrations-/Multi-Agent-Checkpoint aktivierbar.
- `Jetnity native app architecture`: verbindlich für spätere Native-Phase reserviert; jetzt nicht starten.

Der ältere Schlussabschnitt von `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`, der einen siebten Agenten noch nicht als aktuelle Entscheidung bezeichnete, ist durch die neuere ausdrückliche Product-Owner-Entscheidung in `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md` superseded. Bis zur Native-Phase bleiben sechs aktive/reservierte Fachworkstreams plus Technical Lead; später kommt der exakt benannte Native-Agent hinzu.

## 10. Shared Contracts

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

## 11. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn` (`eu-central-2`) – live `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Diese Development-Migrationen sind **nicht Production-approved** und dürfen nicht eigenmächtig auf Production angewendet werden.

## 12. Große Build-Reihenfolge

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

## 13. Offene Governance-Risiken

- `main` Branch Protection ist live weiterhin nicht aktiviert.
- Historische offene PRs sind nicht automatisch aktive Runtime-Slices.
- Alte Status-/Handoff-Zeilen können pre-merge Evidence sein; `JETNITY_START_HERE.md` + `docs/ACTIVE_WORK_STATUS.md` + Live-Systeme bestimmen den aktuellen Stand.

## 14. Was der Product Owner jetzt in Cursor tun muss

Noch nichts, solange der TW-5-Auftrag nicht versioniert und der Draft-PR nicht eröffnet ist.

ChatGPT hat keinen direkten Cursor-Agent-Chat-Connector. Sobald TW-5 ADR/Task/Status/Draft-PR bereit sind, muss `Trip workspace audit architecture` einmal manuell in Cursor mit dem versionierten Auftrag angestoßen werden. Danach arbeitet der Agent bis zum definierten STOPP; ChatGPT/Technical Lead führt anschließend den unabhängigen Review.

## 15. Continuity-Satz für einen neuen Chat

> **„Wir machen mit Jetnity weiter. Lies zuerst `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, die dort definierte Pflichtlektüre und verifiziere danach `main`, PRs, CI, Vercel und relevante Supabase-Stände live. Übernimm exakt die bisherige Technical-Lead-Rolle.“**
