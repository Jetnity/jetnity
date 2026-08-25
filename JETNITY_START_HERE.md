# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 25. August 2026  
Status: **kanonischer erster Einstieg. Operative Wahrheit immer aus Repository + Live-Systemen rekonstruieren. Product Owner entscheidet jeden Merge.**

## 1. Pflichtlektüre vor jeder Aktion

Jeder neue Chat, Technical Lead oder Coding Agent liest mindestens in dieser Reihenfolge:

1. `JETNITY_START_HERE.md`
2. `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`
3. `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
4. `docs/CHATGPT_CURSOR_WORKFLOW.md`
5. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
6. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
7. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
8. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
9. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
10. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
11. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
12. `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
13. `docs/JETNITY_BINDING_BUILD_ORDER.md`
14. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
15. `JETNITY_HANDOFF.md`
16. `docs/ACTIVE_WORK_STATUS.md`
17. `docs/CHATGPT_D0_1_MERGE_CHECKPOINT_2026-08-25.md`
18. den aktuell aktiven Slice-Task/Status/Handoff sowie relevante ADRs/Checkpoints.

Danach zwingend live verifizieren:

- aktuellen `main`-SHA und Merge-Stand;
- offene PRs/Draft-PRs und Branches;
- Ahead/Behind/Merge-Base;
- GitHub Actions und Vercel;
- Supabase/Migrationen, wenn für den Slice relevant;
- offene Review-Threads/Blocker;
- ob historische PRs/Dokumente nur Evidence ihres Zeitpunkts sind.

Bei Widerspruch gilt: **Live-Evidence bestimmen, aktuelle Product-Owner-Entscheidung anwenden, Abweichung dokumentieren und kanonische Continuity korrigieren.**

Für Ready/Merge gilt zusätzlich die feste Priorität aus `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`.

## 2. Verbindliche Produkt- und Engineering-Wahrheit

Jetnity muss produktionsreif, wartbar, testbar, sicher, performant und auf Mobile/Tablet/Desktop kohärent gebaut werden.

Verbindlich:

- keine Demo-/Placeholder-Wahrheit als Endzustand;
- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context`, `empty` und bestätigte Zustände getrennt halten;
- keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, erfundene Visa-/Einreise-/Safety-/Live-Truth;
- LLM/Assistant erklärt, strukturiert und priorisiert Hard Truth, erzeugt sie aber nicht;
- starke Security, Privacy, Ownership/RLS und Least Privilege;
- Accessibility und Performance sind Teil der Definition of Done;
- adversarial Self-Review plus unabhängiger Technical-Lead-Review;
- vollständige Exact-Head-Gates, CI und Vercel-Evidence;
- keine stillen Shared-Contract- oder Scope-Erweiterungen.

Produktleitsatz:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

## 3. Traveller-Wahrheit

Kanonisch:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine relevante Funktion darf still genau eine Staatsbürgerschaft oder einen Default-Pass annehmen. Ausstellerland ist nicht automatisch Staatsbürgerschaft. Wenn notwendige Evidence fehlt, bleibt Official/Regulatory `insufficient_context`/`unknown` statt erfunden.

Foundation E ist vorhanden und wird nicht neu gebaut. Neue Speicherung von Passscans, MRZ, Biometrie oder ähnlich sensitiven Daten ist ein besonderes Product-Owner-Gate.

## 4. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere:

- Auth / Identity / Sessions / MFA / AAL;
- RLS / Ownership / Guest→Account;
- Traveller / Multi-Citizenship / Multi-Document;
- Route / Transit;
- Privacy / Consent;
- Billing / Payment;
- Admin Audit / Capabilities;
- Provider Activation;
- Attribution / Revenue / Claims Truth;
- Guardian / Simulator / Value Impact.

Ein Fachagent dokumentiert einen nötigen Shared-Contract-Change und stoppt. Der Technical Lead entscheidet Architektur, Owner und separaten kontrollierten Slice. Besondere Product-Owner-Gates bleiben unabhängig vom Merge-Gate bestehen.

## 5. Agentenmodell

Exakte Cursor-Anzeigenamen:

1. `Trip workspace audit architecture`
2. `Account plattform audit vorbereitung`
3. `Jetnity provider readiness audit`
4. `Admin platform audit`
5. `Jetnity growth discoverability`
6. `Jetnity quality security audit`
7. `Jetnity native app architecture` – für die spätere Native-Phase reserviert.

`Jetnity quality security audit` ist unabhängige QA/Security/Release-Prüfinstanz, kein allgemeiner Feature-Entwickler. `Jetnity native app architecture` folgt dem Native-Standard und wird erst am dafür vorgesehenen Checkpoint aktiviert.

Kein Agent springt selbstständig zum nächsten Slice. Jeder Auftrag endet mit STOPP und wird danach unabhängig durch ChatGPT / Technical Lead geprüft.

## 6. Live-verifizierter integrierter Stand

Aktueller `main`:

`083eda22189e1dad8bd70413889d2486755d7fe6`

Dieser Stand enthält insbesondere:

- Foundation C – Readiness;
- Foundation D – Route & Transit Intelligence;
- Foundation E – Traveller Context;
- Travel Safety & Disruption Intelligence Foundation;
- Travel Timing & Seasonal Intelligence;
- Account AP-1 bis AP-3;
- Provider Readiness S1 bis S3;
- Admin Slice A bis C;
- TW-1 / PR #56 – Shell & Geräteparität;
- TW-2 / PR #58 – Reiseübersicht;
- TW-4 / PR #60 – Jetzt wichtig;
- TW-3 / PR #64 – Timeline / Etappe / Tag;
- QS-1 / PR #67 – Audit-Evidence;
- TW-5 / PR #66 – Item- und Gap-Details;
- Post-TW5 Continuity / PR #68;
- D0/G0 Foundation Audit Evidence / PR #69;
- Merge-Governance-Reparatur / PR #71;
- **D0-1 Index Boundary Contract / PR #70**.

Letzte Merge-Commits:

- PR #71 → `63e8900b5c519f0d1d8b25d011ac9bc963d241c6`;
- PR #70 → `083eda22189e1dad8bd70413889d2486755d7fe6`.

Vercel Production auf diesem `main`:

- `dpl_7Qvwxrtc7NHQCWLLzrdmNsfFKfjt`;
- Status `READY`;
- Alias `jetnity-app.vercel.app`.

`main` Branch Protection bleibt live deaktiviert und ist ein offenes Governance-/Engineering-Risiko.

## 7. D0-1 – abgeschlossen und integriert

PR #70 – `D0-1 – Index Boundary Contract` ist nach ausdrücklicher aktueller Product-Owner-Freigabe gemergt.

Finaler PR-Head:

`549f3de1a44020641d1cad2c13a6a1a08086847d`

Merge-Commit:

`083eda22189e1dad8bd70413889d2486755d7fe6`

Vor Merge bestätigt:

- GitHub Actions Run `32906411630`: SUCCESS;
- Vercel Preview `dpl_CNJ2iLyGM9e6AA5UdGX47PCta6zd`: READY;
- 0 offene Inline-Review-Threads;
- unabhängiger Technical-Lead Final Re-Review: TECHNICAL PASS;
- Product-Owner-Freigabe vorhanden.

Integriert:

- `/reisen` und `/reisen/[tripId]` → `noindex, nofollow`;
- `/reisen` aus Sitemap entfernt;
- robots-Allow-Modus für private/sensitive D0-1-Pfade gehärtet;
- `/planen` ohne akzeptierte Intent-Keys bleibt öffentliche Basis;
- bei Präsenz von `idee`, `ziel` oder `zielId` → `noindex, nofollow`, auch leer/Whitespace/key-only/Array;
- `/admin/login`, `/unauthorized` und Admin-Layout `noindex`;
- keine D0-1-DB-/RLS-/Auth-/Traveller-/Route-/Provider-/Payment-/Tracking-/Kostenänderung.

Geschlossene Findings:

- D0-P1-01;
- D0-P1-02;
- D0-P2-03;
- P2-D0-1-TL-01.

## 8. Aktiver post-D0-1 Continuity-Slice

Branch:

`docs/post-d0-1-continuity-2026-08-25`

Ziel: den tatsächlichen Live-Stand nach PR #70 in den kanonischen Handoffs/Statusdateien dauerhaft speichern.

Checkpoint:

`docs/CHATGPT_D0_1_MERGE_CHECKPOINT_2026-08-25.md`

Dieser Slice ist docs-only. Kein Runtime-/DB-/Security-/Provider-/Payment-/Tracking-/Kosten-Scope.

Kein Ready/Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für den Continuity-PR.

## 9. Offene D0/G0-Kanten

Nach D0-1 bleiben insbesondere offen:

- D0-P1-03 – `/privacy` und `/terms` 404; eigener Legal-/PO-Slice, keine Rechtstexte erfinden;
- D0-P2-01 – deny-all / Sitemap-/Host-Semantik;
- D0-P2-02 – Canonical-/Origin-Vertrag und `NEXT_PUBLIC_APP_URL` vs `NEXT_PUBLIC_SITE_URL`;
- D0-P2-04 – Locale/hreflang;
- D0-P2-05 – JSON-LD/Entity Foundation;
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02.

Gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md` dürfen konfliktarme D0-/G0-Grundlagen früh vorbereitet werden, ohne spätere Public-/Tracking-/Provider-Aktivierungen vorzuziehen.

Nach Abschluss der Continuity ist der naheliegende technische Candidate:

**D0-2 – Canonical / Origin / robots-sitemap Consistency.**

D0-2 ist noch nicht gestartet. Vor Runtime werden eigener Task/Status/Branch/Draft-PR erstellt, Scope/Shared Contracts geprüft und erst danach `Jetnity growth discoverability` eng begrenzt aktiviert.

## 10. Nächste Trip-Workspace-Kante

**TW-6 ist weiterhin nicht automatisch freigegeben.**

Gemäß `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`:

- TW-6 – Create-Entry angleichen, erst nach dokumentiertem Product-Owner-Schnitt + Guest-One-Trip-Vertrag;
- TW-7 – Hub-Anschluss, abhängig vom Account-/Hub-Vertrag;
- TW-8 – Commercial Surfaces, abhängig von Provider S5;
- TW-9 – Polish, Evidence, Closure;
- danach finaler Function-by-Function-/Intelligence-Audit.

Keine Abhängigkeit still umgehen und keine große Build-Reihenfolge eigenmächtig ändern.

## 11. Workstream-Lage

- `Trip workspace audit architecture`: TW-5 abgeschlossen; wartet.
- `Account plattform audit vorbereitung`: AP-1–AP-3 integriert; wartet.
- `Jetnity provider readiness audit`: S1–S3 integriert; wartet.
- `Admin platform audit`: A–C integriert; wartet.
- `Jetnity growth discoverability`: D0/G0 Audit + D0-1 integriert; aktuell STOPP bis Continuity abgeschlossen / D0-2 versioniert.
- `Jetnity quality security audit`: QS-1 abgeschlossen; für unabhängige Checkpoints reserviert.
- `Jetnity native app architecture`: für spätere Native-Phase reserviert.

Aktuell wird **kein neuer Cursor-Agent gestartet**.

## 12. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Zuletzt live verifiziert: `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`;
- `20260824140000_flug_route_itinerary_untrusted_surface`.

Development enthält zusätzlich die nicht Production-approved Migrationen:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- `20260824180000_trip_items_flug_handelsfelder_guard`.

PR #70, PR #71 und der Continuity-Slice ändern Production nicht.

## 13. Technical-Lead-Autonomie und Merge-Gate

ChatGPT / Technical Lead steuert normale Engineering-Arbeit innerhalb der dokumentierten Grenzen weitgehend selbstständig bis zur **technischen Review-Reife**.

Danach gilt hart:

> **Kein Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für den konkret besprochenen PR, sofern der Product Owner im konkreten Fall nichts anderes bestimmt.**

Technischer PASS, grüne Tests, CI SUCCESS, Vercel READY, `mergeable=true`, 0 Threads oder eine frühere allgemeine Autonomie sind keine Merge-Freigabe.

Nach gültiger Freigabe prüft der Technical Lead Exact Head und Integrationsstand erneut und darf dann den konkret freigegebenen PR Ready setzen / mergen.

Besondere Production-/Provider-/Kosten-/Payment-/Sensitive-Data-/Auth-/Launch-Gates bleiben zusätzlich und getrennt bestehen.

## 14. Offene Governance-/Engineering-Risiken

- `main` Branch Protection ist live weiterhin nicht aktiviert.
- historische Dokumente/alte Draft-PRs können veraltete Statusaussagen enthalten; Live-Evidence und kanonische aktuelle Dateien gewinnen.
- historische Auto-Merge-Formulierungen sind für Ready/Merge durch `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md` superseded.
- QS-1 P2/P3-Findings bleiben dokumentierte Follow-ups.
- TW-6-Abhängigkeit ist vor Runtime-Start weiterhin zu klären.
- Legal-404 ist weiterhin P1 und darf nicht durch erfundene Texte geschlossen werden.
- Public-/Custom-Domain-/Indexing-Aktivierung bleibt gesondert gegatet.

## 15. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Nach Reviews, Merges, Integrationsentscheidungen, Governance-Entscheidungen und Statusänderungen werden Active Work, Handoffs, Slice-Status und Checkpoints im Repository nachgezogen.

Ein neuer Chat behauptet niemals aus Erinnerung oder Screenshot, ein PR sei aktuell, grün oder gemergt. **Immer live verifizieren.**

Für Ready/Merge niemals aus einem historischen Task oder alten Autonomie-Text ableiten. **Product Owner entscheidet den Merge.**
