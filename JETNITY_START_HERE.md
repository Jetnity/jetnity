# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 25. August 2026  
Status: **kanonischer erster Einstieg. TW-5 ist nach unabhängigem Technical-Lead-PASS auf `main` integriert. Operative Wahrheit immer aus Repository + Live-Systemen rekonstruieren.**

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
14. `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md`
15. den aktuell aktiven Slice-Task/Status/Handoff sowie relevante ADRs.

Danach zwingend live verifizieren:

- aktuellen `main`-SHA und Merge-Stand;
- offene PRs/Draft-PRs und Branches;
- Ahead/Behind/Merge-Base;
- GitHub Actions und Vercel;
- Supabase/Migrationen, wenn für den Slice relevant;
- offene Review-Threads/Blocker;
- ob historische PRs/Dokumente nur Evidence ihres Zeitpunkts sind.

Bei Widerspruch gilt: **Live-Evidence bestimmen, Abweichung dokumentieren und kanonische Continuity korrigieren.**

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

Ein Fachagent dokumentiert einen nötigen Shared-Contract-Change und stoppt. Der Technical Lead entscheidet Architektur, Owner und separaten kontrollierten Slice.

## 5. Agentenmodell

Exakte Cursor-Anzeigenamen:

1. `Trip workspace audit architecture`
2. `Account plattform audit vorbereitung`
3. `Jetnity provider readiness audit`
4. `Admin platform audit`
5. `Jetnity growth discoverability`
6. `Jetnity quality security audit`
7. `Jetnity native app architecture` – für die spätere Native-Phase reserviert.

`Jetnity quality security audit` ist unabhängige QA/Security/Release-Prüfinstanz, kein allgemeiner Feature-Entwickler. Der Native-Agent folgt dem neueren Native-Standard; ältere Governance-Texte, die den siebten Agenten noch offen lassen, sind insoweit superseded.

## 6. Aktueller integrierter Runtime-Stand

Live-verifizierter `main` nach TW-5-Merge:

`6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`

Integriert sind unter anderem:

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
- Marketing & Growth Standards / PR #59;
- TW-4 / PR #60 – Jetzt wichtig;
- TW-3 / PR #64 – Timeline / Etappe / Tag;
- post-TW-3 Continuity / PR #65;
- QS-1 / PR #67 – Audit-Evidence;
- **TW-5 / PR #66 – Item- und Gap-Details.**

TW-5 Independent Technical-Lead Result: **PASS / Technical Integration Closure**.

TW-5 Evidence:

- Runtime-Head `8183782fc08c486949212b0e78b9f4ce938aa0dd`;
- Persist-Head `49aa04d99a5eb33a89fa624f1d096f7c5400698f`;
- Merge `6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`;
- gezielte Tests 112/112;
- `npm test` 1994/1994;
- Production Build grün;
- Workspace Audit 1018/1018, 0 Fehler;
- GitHub Actions Runtime + Persist SUCCESS;
- Vercel Runtime + Persist + Production READY;
- P1-QS1-01 unabhängig geschlossen;
- 0 offene Review-Threads beim Merge.

Details: `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md` und `docs/TRIP_WORKSPACE_TW5_STATUS.md`.

## 7. Was TW-5 fachlich abgeschlossen hat

- reisezentrierte Workspace-IA statt gleichrangiger Domain-Tabs;
- Flight-/Stay-/Activities-/Mobility-Flächen als kontextuelle Gap-/Item-Details;
- `0 Aktivitäten` ist keine erfundene Pflichtlücke;
- alle sechs `TripItemKind` inkl. ungeplanter `ohneTag`-Items;
- Commercial-Suche nur explizit lazy/on-demand;
- Guest/Account dieselbe Presentation-Logik;
- Mobile/Desktop dieselbe Zustandsmaschine;
- tote Item-Refs deterministisch bereinigt;
- kein stilles Herkunftsdefault `ZRH`;
- P1-QS1-01 ohne Route-/Transit-Shared-Contract-Umbau geschlossen.

## 8. Nächste Build-Entscheidung

**TW-6 ist noch nicht automatisch freigegeben.**

Gemäß `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md` lautet die nächste Trip-Workspace-Kante:

- TW-6 – Create-Entry angleichen, aber nur nach **dokumentiertem Product-Owner-Schnitt + Guest-One-Trip-Vertrag**;
- TW-7 – Hub-Anschluss, abhängig vom Account-/Hub-Vertrag;
- TW-8 – Commercial Surfaces, abhängig von Provider S5;
- TW-9 – Polish, Evidence, Closure;
- danach finaler Function-by-Function-/Intelligence-Audit.

Vor neuer Runtime-Arbeit muss der Technical Lead daher live prüfen, welcher abhängige Slice tatsächlich freigegeben ist. Keine Abhängigkeit still umgehen und keine große Build-Reihenfolge eigenmächtig ändern.

Der TW-5-Merge ist ein neuer Integrationscheckpoint. Konfliktarme Audit-/Vorbereitungsarbeit darf parallel geprüft werden, wenn Shared Contracts, Dateien/Surfaces und Merge-Reihenfolge sauber getrennt sind.

## 9. Aktuelle Workstream-Lage

- `Trip workspace audit architecture`: TW-5 abgeschlossen; wartet auf nächste freigegebene Trip-Workspace-Aufgabe.
- `Account plattform audit vorbereitung`: wartet; AP-1–AP-3 integriert.
- `Jetnity provider readiness audit`: wartet; S1–S3 integriert.
- `Admin platform audit`: wartet; A–C integriert.
- `Jetnity growth discoverability`: reserviert; Aktivierungsbedingungen vorher prüfen.
- `Jetnity quality security audit`: QS-1 abgeschlossen; für spätere unabhängige Checkpoints reserviert.
- `Jetnity native app architecture`: reserviert für spätere Native-Phase.

## 10. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Diese beiden Development-Migrationen sind **nicht Production-approved**. TW-5 brachte keine Migration/RLS/Auth/Traveller/Provider/Secret-Änderung.

## 11. Technical-Lead-Autonomie und besondere Gates

Normale scope-treue Engineering-PRs dürfen nach Self-Review, vollständigen Exact-Head-Gates, CI/Vercel und unabhängigem Technical-Lead-PASS selbst Ready gesetzt und gemergt werden.

Product-Owner-Freigabe bleibt zwingend insbesondere für:

- Production-Migration/destructive Production-Daten;
- große Production-RLS-/Identity-/Ownership-Risiken;
- echte Providerverträge, Production-Secrets und paid calls;
- neue laufende Kosten über USD 100/Monat;
- echte Payments/Geldbewegung;
- fundamentale Produkt-/Business-Model-/Build-Order-Abweichungen;
- besonders sensitive Pass-/MRZ-/Biometrie-Speicherung;
- fundamentale Auth/MFA/AAL/Session-Änderungen;
- neue sensible externe Datenweitergabe;
- Public Launch / große Production-Aktivierung / reale Provider live.

## 12. Offene Governance-Risiken

- `main` Branch Protection ist live weiterhin nicht aktiviert.
- QS-1 P2/P3-Findings bleiben dokumentierte Follow-ups und wurden nicht still in TW-5 gezogen.
- Historische offene PRs/Drafts sind nicht automatisch aktive Runtime-Slices.

## 13. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Nach Reviews, Merges, Integrationsentscheidungen und Statusänderungen werden Active Work, Handoffs, Slice-Status und Checkpoints im Repository nachgezogen.

Ein neuer Chat behauptet niemals aus Erinnerung oder Screenshot, ein PR sei aktuell, grün oder gemergt. **Immer live verifizieren.**