# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 25. August 2026  
Status: **kanonischer erster Einstieg. Operative Wahrheit immer aus Repository + Live-Systemen rekonstruieren; historische Handoffs und PR-Bodies sind nur Evidence ihres Zeitpunkts.**

## 1. Pflichtlektüre vor jeder Aktion

Jeder neue Chat, Technical Lead oder Coding Agent liest mindestens in dieser Reihenfolge:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
3. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
4. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
5. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
6. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
7. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
8. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
9. `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
12. `JETNITY_HANDOFF.md`
13. `docs/ACTIVE_WORK_STATUS.md`
14. den aktuell aktiven Slice-Task/Status/Handoff sowie relevante ADRs.

Danach zwingend live verifizieren:

- `main` und Merge-Stand;
- offene PRs/Draft-PRs und Branches;
- GitHub Actions;
- Vercel;
- Supabase/Migrationen, wenn für den Slice relevant;
- offene Review-Threads/Blocker;
- Ahead/Behind/Merge-Base;
- ob alte PRs nur historische Artefakte sind.

Bei Widerspruch gilt: **Live-Evidence bestimmen, Abweichung dokumentieren und kanonische Continuity korrigieren.**

## 2. Verbindliche Qualitäts- und Produktprinzipien

Jetnity muss hervorragend gebaut werden. Verbindlich sind insbesondere:

- produktionsreifer, wartbarer und testbarer Code;
- keine Demo-/Placeholder-Wahrheit als Endzustand;
- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context` und bestätigte Zustände fachlich getrennt;
- keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, erfundene Visa-/Einreise-/Safety-/Live-Truth;
- LLM/Assistant erklärt, strukturiert und priorisiert Hard Truth, erzeugt sie aber nicht;
- starke Security, Privacy, Ownership/RLS und Least Privilege;
- professionelle Mobile/Tablet/Desktop-Kohärenz, Accessibility und Performance;
- adversarial Self-Review plus unabhängiger Technical-Lead-Review;
- vollständige Exact-Head-Gates, CI und Vercel-Evidence;
- keine stillen Shared-Contract- oder Scope-Erweiterungen.

Produktleitsatz:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

Jetnity soll nicht über möglichst viele sichtbare Funktionen gewinnen, sondern dadurch, dass Nutzer möglichst wenig selbst zusammensuchen, vergleichen, koordinieren, prüfen und nachdenken müssen.

## 3. Traveller-Wahrheit

Verbindliches Modell:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine relevante Funktion darf still genau eine Staatsbürgerschaft oder einen ersten/default Pass annehmen. Wenn ein vorhandenes zulässiges Dokument einen besseren Einreise-/Transitweg ermöglicht, muss die Architektur diese Option berücksichtigen können.

Foundation E ist bereits produktiv vorhanden und wird nicht neu gebaut. Neue Speicherung von Passscans, MRZ, Biometrie oder ähnlich sensitiven Daten ist ein besonderes Product-Owner-Gate.

## 4. Guardian, What-if und Value

Verbindlich spätere Kernprogramme:

- **Jetnity Guardian / Reise-Autopilot:** reale Änderungen/Probleme cross-domain gegen die gesamte Reise bewerten, ohne still reale Reise-/Booking-/Payment-/Provider-Writes auszuführen.
- **What-if-Reise-Simulator:** hypothetische Änderungen in isoliertem Scenario-/Sandbox-State; Baseline bleibt unverändert; reale Übernahme nur über den kontrollierten kanonischen Write-/Command-Pfad.
- **Value Optimizer:** Preis gegen Zeit, Umstiege, Komfort und Gesamtnutzen bewerten, auf gemeinsamer Evidence-/Impact-Architektur soweit fachlich identisch.

Keine dieser Funktionen darf eine zweite Reise- oder Hard-Truth-Welt erzeugen.

## 5. Marketing, Growth und Discoverability

Die kanonischen Standards sind verbindlich. Dazu gehören u. a. Attribution, versionierte Events, Funnel, Activation/Retention, CAC/LTV/Payback/Contribution Margin, CRM, Referral, Creator/UGC, Reviews, Paid Media mit Caps/Kill Switch, SEO, internationale SEO, Schema.org, AI-/Answer-Engine-Discoverability, ASO, Claims-Truth und Data Quality.

Nicht erlaubt sind Fake Reviews, Fake Nutzerzahlen/Awards, Dark Patterns, Keyword-Spam, Linkfarmen, unbelegte öffentliche Claims oder sensitive Pass-/MRZ-/Identity-Daten als Marketingtargeting.

Öffentliche Growth-/Discovery-Flächen gehören später primär zu `Jetnity growth discoverability`; das interne Marketing-/Growth-Control-Center bleibt bei `Admin platform audit`.

## 6. Agentenmodell

Aktuelle bzw. reservierte exakte Anzeigenamen:

1. `Trip workspace audit architecture`
2. `Account plattform audit vorbereitung`
3. `Jetnity provider readiness audit`
4. `Admin platform audit`
5. `Jetnity growth discoverability`
6. `Jetnity quality security audit`
7. `Jetnity native app architecture` – **für die spätere Native-Phase reserviert; jetzt nicht starten.**

Bis zur Native-Phase arbeiten sechs spezialisierte Workstreams plus ChatGPT/Technical Lead als übergreifende Instanz. Bei Konflikt mit dem älteren Schlussabschnitt von `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md` gilt die neuere ausdrückliche Product-Owner-Entscheidung in `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`: der siebte Native-Agent ist verbindlich reserviert.

`Jetnity quality security audit` ist unabhängige QA/Security/Release-Prüfinstanz und kein allgemeiner Feature-Entwickler.

## 7. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere:

- Auth, Identity, Sessions, MFA/AAL;
- RLS, Ownership, Guest→Account;
- Traveller-Kernmodell, Multi-Citizenship, Multi-Document;
- Route/Transit;
- Privacy/Consent;
- Billing/Payment;
- Admin Audit/Capabilities;
- Provider Activation;
- Attribution/Revenue/Claims Truth;
- Guardian-/Simulator-/Value-Impact-Verträge;
- andere Cross-Domain-Verträge.

Ein Fachagent dokumentiert einen nötigen Shared-Contract-Change und stoppt. Der Technical Lead entscheidet Architektur, Owner und separaten kontrollierten Slice.

## 8. Aktuelle operative Wahrheit nach TW-3 / TW-5-Draft

Letzter verifizierter `main` beim TW-5-Evidence-Stand:

`d039e7bf7f7fa9db261b4623c72cc35944aa82c4`

Das ist der Merge von PR #67 (QS-1 docs-only) über die post-TW-3-Continuity `bee9f653`.

Stand:

- TW-1 / PR #56: ✅ integriert
- TW-2 / PR #58: ✅ integriert
- Marketing & Growth Standards / PR #59: ✅ integriert
- TW-4 / PR #60: ✅ integriert
- TW-3 / PR #64: ✅ integriert
- post-TW-3 Continuity / PR #65: ✅ integriert (`bee9f653`)
- QS-1 docs-only / PR #67: ✅ integriert (`d039e7bf`)
- TW-5 / Draft-PR #66: Runtime implementiert, P1-QS1-01 behoben, Evidence auf `8183782f`; **kein Ready, kein Merge**

Historischer Draft-PR #52 bleibt Continuity-Evidence, ist aber kein Runtime-Träger.

## 9. Nächster Workspace-Slice

Nächster primärer Slice gemäß `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`:

**TW-5 – Item- und Gap-Details**

Primärer Agent:

`Trip workspace audit architecture`

Vorbereiteter Branch:

`feat/trip-workspace-tw5-item-gap-details`

Draft-PR #66 trägt die TW-5-Runtime. Evidence-Head `8183782f` ist mit `main` `d039e7bf` synchron. P1-QS1-01 ist auf Presentation-Ebene behoben. Nächster Schritt ist der erneute unabhängige Technical-Lead-Review. **Kein Ready, kein Merge, kein TW-6.**

TW-5 hängt vorhandene Flight-/Hotel-/Activities-/Mobility-Flächen als Details einer Reise-/Coverage-/Attention-Lücke ein, erhält Lazy-Search-Mounts und darf keine Live-Provider, Fake-Angebote, stillen Herkunftsdefaults oder Shared-Contract-Erweiterungen einschleusen.

## 10. Aktuelle Workstream-Lage

- `Trip workspace audit architecture`: primärer Workstream; TW-5 Runtime auf Draft-PR #66, P1-QS1-01 behoben, STOPP für erneuten Technical-Lead-Review.
- `Account plattform audit vorbereitung`: wartet; AP-1 bis AP-3 sind integriert.
- `Jetnity provider readiness audit`: wartet; S1 bis S3 sind integriert.
- `Admin platform audit`: wartet; A bis C sind integriert.
- `Jetnity growth discoverability`: reserviert, noch nicht starten.
- `Jetnity quality security audit`: reserviert; kann an einem stabilen Integrations-/Multi-Agent-Checkpoint gezielt aktiviert werden.
- `Jetnity native app architecture`: reserviert für spätere Native-Phase.

Breitere Parallelisierung ist nach dem erreichten TW-4/TW-3-Checkpoint grundsätzlich möglich, aber nur konfliktarm und nach Technical-Lead-Abhängigkeitsprüfung.

## 11. Supabase-/Production-Grenze

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Diese beiden Development-Migrationen sind **nicht Production-approved** und dürfen ohne besonderes Product-Owner-Gate nicht auf Production angewendet werden.

## 12. Technical-Lead-Autonomie und besondere Gates

Normale scope-treue Engineering-Arbeit darf gemäß `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md` selbstständig bis Ready/Merge gesteuert werden, nachdem Self-Review, vollständige Exact-Head-Gates, CI/Vercel und unabhängiger Technical-Lead-Review erfolgreich sind.

Product-Owner-Freigabe bleibt insbesondere zwingend für:

- Production-Migrationen/destructive Production-Datenänderungen;
- große Production-RLS-/Identity-/Ownership-Risiken;
- echte Providerverträge, Production-Secrets und paid calls;
- neue laufende Infrastruktur-/Providerkosten über USD 100/Monat;
- echte Payment-Aktivierung/Geldbewegung;
- fundamentale Produkt-/Business-Model- oder Build-Order-Abweichungen;
- besonders sensitive Pass-/MRZ-/Biometrie-Speicherung;
- fundamentale Auth/MFA/AAL/Session-Änderungen;
- neue sensible externe Datenweitergabe;
- Public Launch / große Production-Aktivierung / reale Provider live.

Ältere Dokumente, die pauschal für **jeden** normalen Merge eine aktuelle Product-Owner-Freigabe verlangen, sind durch die neuere Autonomy Policy ersetzt.

## 13. Offene Governance-Risiken

- `main` Branch Protection ist live weiterhin nicht aktiviert.
- Ein möglicher späterer Citizenship-only-Credential-Contract ist dokumentierter Shared-Contract-Bedarf, aber kein aktueller TW-5-Blocker.
- Historische offene PRs dürfen nicht als aktive Runtime-Slices reaktiviert werden, ohne den aktuellen Build-Plan neu zu prüfen.

## 14. Native

`Jetnity native app architecture` wird erst gemäß `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md` aktiviert. Vor großer Native-Runtime-Implementierung kommt ein Audit-/Target-Architecture-Slice. Native folgt:

> **Ein Produkt, eine Wahrheit, mehrere Clients.**

## 15. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Nach wichtigen Reviews, Merges, Integrationsentscheidungen und Statusänderungen werden Tasks, ADRs, Active Work und Handoffs im Repository nachgezogen.

Ein neuer Chat behauptet niemals aus Erinnerung, Screenshot oder altem Handoff, ein PR sei aktuell, grün oder gemergt. **Immer live verifizieren.**
