# Jetnity – Active Work Status

Stand: 25. August 2026  
Status: **PR #71 Governance-Reparatur und PR #70 D0-1 sind Product-Owner-freigegeben integriert. Post-D0-1-Continuity aktiv. Kein neuer Runtime-Slice vor Continuity-Abschluss.**

## 0. Live-verifizierte Baseline

Aktueller `main`:

`083eda22189e1dad8bd70413889d2486755d7fe6`

Letzte relevante Integrationen:

- PR #71 – `docs: restore Product Owner merge governance` → Merge `63e8900b5c519f0d1d8b25d011ac9bc963d241c6`;
- PR #70 – `D0-1 – Index Boundary Contract` → Merge `083eda22189e1dad8bd70413889d2486755d7fe6`.

Vercel Production für `main @ 083eda22189e1dad8bd70413889d2486755d7fe6`:

- Deployment `dpl_7Qvwxrtc7NHQCWLLzrdmNsfFKfjt`;
- Status `READY`;
- Alias enthält `jetnity-app.vercel.app`.

`main` Branch Protection ist live weiterhin **nicht aktiviert**.

Operative Wahrheit wird immer aus Repository + Live-GitHub/CI/Vercel und bei relevanten Slices Supabase rekonstruiert. Historische PR-Bodies und alte Handoffs sind nur Evidence ihres Zeitpunkts.

## 1. Aktiver Slice – Post-D0-1 Continuity

Branch:

`docs/post-d0-1-continuity-2026-08-25`

Ziel:

- den Product-Owner-freigegebenen Merge von PR #70 dauerhaft kanonisch dokumentieren;
- `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md` und `docs/ACTIVE_WORK_STATUS.md` vom stale PR-#70/#71-Draft-Zustand auf den tatsächlichen Live-Stand bringen;
- D0-1-Abschluss, offene D0/G0-Findings und die nächste kontrollierte Kante festhalten;
- keine Runtime-, DB-, RLS-, Auth-, Traveller-, Route-, Provider-, Payment-, Tracking- oder Kostenänderung.

Checkpoint:

`docs/CHATGPT_D0_1_MERGE_CHECKPOINT_2026-08-25.md`

Dieser Continuity-Slice bleibt docs-only. Technical-Lead-PASS macht ihn nur review-bereit; Merge erst nach ausdrücklicher aktueller Product-Owner-Freigabe.

## 2. Merge-Governance – verbindlich

Seit PR #71 gilt kanonisch:

> **Technisch fertig = review-bereit. Product Owner entscheidet Ready/Merge.**

Kein formales Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für den konkret besprochenen PR, sofern der Product Owner im konkreten Fall nichts anderes bestimmt.

Technischer PASS, grüne Tests, GitHub Actions SUCCESS, Vercel READY, `mergeable=true`, 0 Review-Threads oder frühere allgemeine Autonomie sind keine Merge-Freigabe.

Nach gültiger Freigabe prüft ChatGPT / Technical Lead den Exact Head und Integrationsstand erneut und darf dann den konkret freigegebenen PR technisch Ready setzen / mergen, sofern alle übrigen Gates erfüllt sind.

Besondere Product-Owner-Gates bleiben zusätzlich bestehen für Production-Migrationen/destructive Daten, große RLS-/Identity-/Ownership-Risiken, echte Provider/Secrets/paid calls, neue laufende Kosten über USD 100/Monat, reale Payments, fundamentale Produkt-/Build-Order-Abweichungen, sensitive Pass-/MRZ-/Biometrie-Speicherung, fundamentale Auth/MFA/AAL/Session-Änderungen, sensible externe Datenweitergabe sowie Public-/Production-/Provider-Live-Aktivierungen.

## 3. D0-1 / PR #70 – integriert

Agent: `Jetnity growth discoverability`

Finaler freigegebener Head:

`549f3de1a44020641d1cad2c13a6a1a08086847d`

Merge-Commit auf `main`:

`083eda22189e1dad8bd70413889d2486755d7fe6`

Finale Evidence vor Merge:

- Compare gegen damaliges `main @ 63e8900b5c519f0d1d8b25d011ac9bc963d241c6`: 10 ahead / 0 behind;
- GitHub Actions Run `32906411630`: SUCCESS;
- Typecheck, Lint, Tests, Admin-API-Schutz, Schema-Bezug, Dead Code, Exports, Dependencies, Production Build: SUCCESS;
- Vercel Preview `dpl_CNJ2iLyGM9e6AA5UdGX47PCta6zd`: READY;
- Inline-Review-Threads: 0;
- unabhängiger Technical-Lead Final Re-Review: TECHNICAL PASS;
- Product Owner hat PR #70 ausdrücklich zum Merge freigegeben.

Integrierter Scope:

- `/reisen` und `/reisen/[tripId]` → HTML `noindex, nofollow`;
- `/reisen` aus der öffentlichen Sitemap entfernt;
- robots-Allow-Modus für Reise-/Auth-/sensitive D0-1-Pfade gehärtet;
- localhost / `*.vercel.app` / `NEXT_PUBLIC_ALLOW_INDEXING` Kill-Switches erhalten;
- `/planen` ohne akzeptierte Intent-Keys bleibt öffentliche Basis;
- bei Präsenz von `idee`, `ziel` oder `zielId` → `noindex, nofollow`, unabhängig von leer / whitespace / Wert / Array;
- `/admin/login`, `/unauthorized` und `(admin)`-Layout App-Router-kompatibel `noindex`;
- toten `app/(admin)/admin/head.tsx` entfernt;
- SEO-/robots-/sitemap-Regressionstests integriert.

Geschlossen:

- D0-P1-01;
- D0-P1-02;
- D0-P2-03;
- P2-D0-1-TL-01.

Keine D0-1-Änderung an DB/Migration/RLS/Auth/Traveller/Route/Provider/Payment/Tracking/Secrets/paid calls/Kosten.

## 4. Offene D0/G0-Findings

Weiter offen und bewusst nicht still in D0-1 gezogen:

- **D0-P1-03** – `/privacy` und `/terms` sind 404, obwohl Registrierung deren Annahme verlangt. Eigener Legal-/PO-Slice; Jetnity erfindet keine Rechtstexte.
- **D0-P2-01** – deny-all / Sitemap-/Host-Semantik widersprüchlich.
- **D0-P2-02** – Canonical-/Origin-Contract fehlt; `NEXT_PUBLIC_APP_URL` vs `NEXT_PUBLIC_SITE_URL`.
- **D0-P2-04** – Locale-/hreflang-Architektur fehlt.
- **D0-P2-05** – strukturierte Entity-Daten/JSON-LD Foundation unvollständig.
- **G0-P2-01** – kein versionierter Event-/Attribution-/UTM-/Referrer-Contract.
- **G0-P2-02** – verwaistes CookieConsent mit falscher Messungs-/Privacy-Semantik.
- **G0-P3-01** – Locale/Markt/Währung noch kein Growth-Contract.
- **G0-P3-02** – Admin Analytics/Marketing/Content weiterhin Platzhalter.

D0/G0-Restarbeit folgt den Standards und darf spätere D1/G1+- oder Public-/Tracking-Aktivierung nicht still vorziehen.

## 5. Integrierter Trip-Workspace-Stand

- TW-1 / PR #56 – Shell & Geräteparität ✅
- TW-2 / PR #58 – Reiseübersicht ✅
- TW-4 / PR #60 – Aufmerksamkeit / Jetzt wichtig ✅
- TW-3 / PR #64 – Timeline / Etappe / Tag ✅
- TW-5 / PR #66 – Item- und Gap-Details ✅

P1-QS1-01 bleibt geschlossen: genau eine ungeplante Liste geht in Coverage/Route/Status; Shared Route/Transit Contract unverändert.

## 6. Nächste Trip-Workspace-Kante

Kein automatischer TW-6-Start:

- TW-6 – Create-Entry Alignment erst nach dokumentiertem Product-Owner-Schnitt + Guest-One-Trip-Vertrag;
- TW-7 – Hub-Anschluss abhängig von Account-/Hub-Vertrag;
- TW-8 – Commercial Surfaces abhängig von Provider S5 / realer Commercial Provenance;
- TW-9 – Polish / Evidence / Closure danach;
- anschließend verpflichtender Function-by-Function-/Intelligence-Audit.

Keine Abhängigkeit still umgehen.

## 7. Große Build-Reihenfolge

Weiter gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`:

1. Trip Workspace vollständig fertigbauen – abhängige TW-6/7/8, TW-9, finaler Audit.
2. Traveller / Pass / Multi-Citizenship produktweit vervollständigen.
3. Account AP-4 bis AP-12.
4. Provider Readiness S4 bis S8; danach echte Provider unter besonderen Gates.
5. Admin D–K + Marketing/Growth Control Plane.
6. Homepage finalisieren.
7. AI/Search Discoverability / Authority phasengerecht.
8. Marketing/Growth G0–G5 phasengerecht.
9. Kommerzielle Produktschicht.
10. Guardian / What-if / Value und finaler Launch-Hardening-Audit gemäß Standards.

Konfliktarme D0-/G0-Grundlagenarbeit darf früh vorbereitet werden, wenn sie den aktiven Integrationspfad nicht aufbläht und keine gegatete Aktivierung vorzieht.

## 8. Nächster konfliktarmer Candidate nach Continuity

Nach Abschluss dieses docs-only Continuity-Slices ist der fachlich naheliegende nächste technische Candidate:

**D0-2 – Canonical / Origin / robots-sitemap Consistency**

Begründung:

- D0-1 hat die kritische private Index-Grenze geschlossen;
- D0-P2-01 und D0-P2-02 betreffen nun die verbleibende technische URL-/Host-/Canonical-Konsistenz;
- D0 darf laut Build Order konfliktarm früh vorbereitet werden;
- D0-2 benötigt keine Legal-Texte, keine Provider, keine Datenbank und keine Tracking-Aktivierung;
- D0-P1-03 Legal bleibt getrennt;
- D0-P2-04 hreflang/Locale und D0-P2-05 JSON-LD werden nicht in einen Monster-Slice gezogen.

Vor D0-2-Runtime werden eigener Task, Status, Branch und Draft-PR versioniert. Danach erhält ausschließlich `Jetnity growth discoverability` einen eng begrenzten Auftrag. Kein Agent springt selbst zum nächsten Slice.

## 9. Workstream-Status

### `Trip workspace audit architecture`
TW-5 integriert. Wartet auf dokumentierte nächste Trip-Gates.

### `Account plattform audit vorbereitung`
AP-1 bis AP-3 integriert. Wartet gemäß Build Order / Traveller-/Account-Abhängigkeiten.

### `Jetnity provider readiness audit`
S1 bis S3 integriert. S4 bis S8 später gemäß Build Order; echte Provider/Secrets/paid calls bleiben besondere Gates.

### `Admin platform audit`
A bis C integriert. D bis K / Growth-Control-Slices später gemäß Build Order.

### `Jetnity growth discoverability`
D0/G0 Audit integriert. D0-1 integriert. **Aktuell STOPP**, bis post-D0-1 Continuity abgeschlossen und D0-2 separat versioniert ist.

### `Jetnity quality security audit`
QS-1 abgeschlossen. Für unabhängige Quality/Security/Resilience-Checkpoints reserviert.

### `Jetnity native app architecture`
Für spätere Native-Phase reserviert.

Aktuell kein Cursor-Agent aktiv für neue Runtime.

## 10. Shared Contracts

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

Ein Fachagent dokumentiert einen notwendigen Shared-Contract-Change und stoppt. Kein stiller Contract-Drift.

## 11. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Zuletzt live verifiziert: `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`;
- `20260824140000_flug_route_itinerary_untrusted_surface`.

Development enthält zusätzlich, weiterhin **nicht Production-approved**:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- `20260824180000_trip_items_flug_handelsfelder_guard`.

PR #70/#71 und dieser Continuity-Slice erzeugen keine Production-Migration.

## 12. Offene globale Risiken

- `main` Branch Protection bleibt live deaktiviert.
- historische Dokumente/alte Draft-PRs enthalten veraltete Status- und teils frühere Auto-Merge-Aussagen; für Merge gilt die aktuelle Supersession, für operative Wahrheit Live-Evidence.
- QS-1 P2/P3-Findings bleiben dokumentierte Follow-ups.
- TW-6-PO-Schnitt + Guest-One-Trip-Vertrag sind vor TW-6 weiter offen.
- Legal-404 bleibt P1 und darf nicht durch erfundene Rechtstexte „geschlossen“ werden.
- Public-/Custom-Domain-/Indexing-Aktivierung bleibt gesondert gegatet.

## 13. Exakter nächster Schritt

1. Post-D0-1-Continuity docs-only fertigstellen.
2. Diff gegen `main @ 083eda22189e1dad8bd70413889d2486755d7fe6` prüfen.
3. Exact-Head GitHub Actions und Vercel prüfen.
4. Unabhängigen Technical-Lead-Review durchführen.
5. **STOPP und Product Owner Ergebnis zeigen.**
6. Kein Ready/Merge ohne ausdrückliche Product-Owner-Freigabe für den Continuity-PR.
7. Nach dessen Merge D0-2 als separaten Slice mit eigenem Task/Status/Branch/Draft-PR vorbereiten.

## 14. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Nach Reviews, Merges, Integrationsentscheidungen und Statusänderungen werden kanonische Repository-Dokumente nachgezogen.

Ein neuer Chat oder Agent behauptet nie aus Erinnerung oder Screenshots einen aktuellen Stand. **Immer live verifizieren.**
