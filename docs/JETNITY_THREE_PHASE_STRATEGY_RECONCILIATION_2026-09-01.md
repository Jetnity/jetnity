# Jetnity – Three-Phase Strategy Reconciliation

Stand: 1. September 2026  
Status: **KANONISCHE RECONCILIATION / PRODUCT-OWNER DECISION / NO RUNTIME CHANGE**  
Baseline: `main@6891cab6b204e6e6093a7002d7cad9b4afc692cc`

## Zweck

Diese Datei reconciled die neue bindende 3-Phasen-Strategie gegen bestehende kanonische und historische Produkt-/Architekturplanung. Sie verhindert zwei Fehler:

1. korrekt gebaute Architektur wegen neuer Phasennamen neu zu bauen;
2. langfristige Programme fälschlich vollständig als V1-Launchblocker zu behandeln.

## Evidence-Prinzip

Live-Evidence gewinnt. Historische Dokumente bleiben Evidence für damalige Entscheidungen, aber neuere Reconciliation/ADR kann ihre **heutige Planungsinterpretation** superseden.

## 1. `JETNITY_PRODUCT_MANDATE.md`

**Bewertung:** fachlich kompatibel.

Beibehalten:

- Nummer-1-Ambition ohne Feature-Bloat;
- komplette Reise als ein System;
- Trust/Truth/Security/Privacy/Quality;
- Monetarisierung ohne Ranking-Korruption;
- Mobile-first und Production-Qualität.

Neue Ergänzung:

- langfristiges Ziel wird in Core / Platform / Ecosystem zeitlich gestaffelt;
- Marktführerschaft rechtfertigt nicht, Phase-2/3-Breite vor V1 zu bauen.

Keine Architekturänderung nötig.

## 2. `JETNITY_VISION.md`

**Bewertung:** Phase-1-Kern ist stark kompatibel; langfristige Negativabgrenzungen brauchen Kontext.

Weiter verbindlich:

- Jetnity ist kein Bündel isolierter Suchmaschinen;
- Trip Builder/Workspace ist Kern;
- wenige gute Entscheidungen statt Option Overload;
- Reiseänderungen werden gesamthaft verstanden;
- Guest-Modus;
- Schweiz zuerst;
- Providerprovision manipuliert Empfehlung nicht.

Reconciliation der Aussagen „kein soziales Netzwerk / keine Creator-Plattform“:

- **Phase 1 und Phase 2:** Jetnitys Produktidentität bleibt ausdrücklich **kein Social Network und keine Creator-Plattform**.
- **Phase 3:** optionale Traveller-/Creator-Ecosystem-Funktionen dürfen als Erweiterung entstehen, solange der Travel Operating System Core dominant bleibt und Social/Creator keine zweite Produktwahrheit erzeugt.

Damit wird die ursprüngliche Anti-Bloat-Absicht erhalten, ohne die neue Phase-3-PO-Entscheidung zu negieren.

## 3. `ROADMAP.md`

**Bewertung:** wertvolle Current/Historical Evidence, aber kein ausreichender heutiger V1-Scope-Vertrag.

Beibehalten:

- integrierte Foundations/Slices als Evidence;
- offene technische Programme;
- historische Reihenfolge und PR-Kontext.

Superseded für **V1-Launchscope und kritischen Pfad** durch:

- ADR-0204;
- `JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`;
- `JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`;
- `JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`.

Die große Roadmap wird nicht breit umgeschrieben, weil sie umfangreiche historische Evidence enthält und ein Whole-File-Rewrite unnötiges Drift-Risiko erzeugen würde.

## 4. `docs/JETNITY_BINDING_BUILD_ORDER.md`

**Bewertung:** technische Programmreihenfolge bleibt nützlich, aber die neue PO-Entscheidung ändert ausdrücklich die Launch-Priorisierung.

Weiter bindend:

- reale technische Dependencies;
- Shared-Contract-/Gate-Disziplin;
- Provider Readiness S4–S8 vor realer Providerphase;
- kein automatisches Follow-up;
- Product-Owner-Gates.

Superseded, falls anders interpretiert:

- nicht alle AP5–AP12-Features müssen pauschal vor V1 fertig sein;
- nicht das vollständige Admin D–K/Growth OS muss vor V1 fertig sein;
- nicht die gesamte Discoverability/Growth-Breite muss vor V1 fertig sein;
- Native ist Phase 3 und kein V1-Blocker.

Für V1 gilt die neue V1 Binding Build Order.

## 5. `ARCHITECTURE.md`

**Bewertung:** bestehende Architektur trägt die neue Strategie; kein Redesign erforderlich.

Wiederverwenden:

- Next.js/Vercel/Supabase;
- SSR/RLS/Auth-Grenzen;
- provider-neutrale Ports;
- Commercial Provenance;
- Admin AAL2;
- server-only sensible Logik;
- Shared Travel Graph.

Die Datei beschreibt bewusst Realzustand und enthält zeitgebundene Header-/Zwischenstände. Neue Produktphasen werden darübergelegt, nicht in technische Module hineinumbenannt.

## 6. `DECISIONS.md` / ältere technische Phasen

**Bewertung:** historische ADRs bleiben unverändert.

ADR-0204 ist die neue Product-/Release-Entscheidung. Alte „Phase 1.x / 2.x / 3.x“-Begriffe bleiben historische technische Slice-Namen und dürfen nicht mit Core/Platform/Ecosystem verwechselt werden.

## 7. Account / Traveller Planung

Quellen u. a.:

- `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`;
- AP7 Reconciliation;
- Foundation E;
- TA-DL1;
- Traveller Gap Audits.

Phase-1-Zuordnung:

- Guest→Account: V1;
- Account Home/Trip Ownership/Security: V1;
- Account Traveller Registry + Trip Snapshot: V1 und weitgehend integriert;
- Multi-Citizenship/Multi-Document: V1;
- nur V1-relevante Privacy/Consent/Data-Lifecycle-Lücken: vor V1;
- breite Profile/Preferences/Notifications/Entitlements: nur soweit V1 nötig, sonst Phase 2;
- Social Traveller Network: Phase 3.

Kein Default-/Primary-Credential wird durch die neue Planung eingeführt.

## 8. Provider Planung

Phase 1:

- mindestens ein realer Flight-Pfad;
- mindestens ein realer Accommodation-Pfad;
- ein Activities-Pfad, soweit professionell/vertraglich möglich oder explizite PO Launch Exception;
- echte Official Entry Requirements Evidence;
- Provider Readiness/Cost/Observability/License-Gates vor Live.

Phase 2:

- mehrere Provider pro Kernkategorie;
- Cars/Rail/Bus/Ferry/Transfers/Cruises/Insurance und weitere Breite;
- tiefere Vergleichs-/Revalidation-Logik.

Phase 3:

- Partner Marketplace und strategische Partnernetzwerke.

Providerverträge/Secrets/paid calls/Live bleiben PO-Gates.

## 9. Admin Planung

Phase 1 braucht **Operations Foundation**, nicht Full Enterprise Control Plane.

V1-relevant:

- System Health;
- Security;
- Provider Ops/Costs;
- notwendige User-/Trip-Administration;
- Incident/Error Visibility;
- Analytics-/Revenue-/Attribution-Grundlagen;
- Auditability.

Phase 2:

- Admin D–K Vollausbau;
- Support/Finance/Compliance/Content/Partner Ops;
- Bexio;
- Jetnity Copilot Pro;
- Marketing/Growth Control Plane;
- Paid Media/CRM/Experiment/Forecasting.

Phase 3 kann Marketplace-/Ecosystem-Partner-Ops ergänzen.

## 10. Mobile / Native Planung

Phase 1:

- mobile-first Web und PWA;
- reale Device-Parity;
- klare Offline/Stale-Grenzen soweit V1-PWA definiert.

Phase 3:

- native iOS/Android;
- Offline-native UX, Push, Wallet/Device integrations nach eigenen Security-/Privacy-Gates.

`JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md` bleibt kompatibel: one product, one truth, multiple clients.

## 11. Growth / Discoverability

Phase 1 vor Swiss Launch:

- ehrliche Homepage/Kernpositionierung;
- technische Index-/Canonical-/Structured-Data-Basis soweit launchrelevant;
- consent-kompatible Activation/Conversion/Revenue Measurement;
- grundlegende organische Distribution und Launch Measurement.

Phase 2:

- CRM, Referral, Experiments, Creator-/UGC-Loops, broader SEO/Content, Subscription Growth, Paid Acquisition auf echter Revenue-Evidence.

Phase 3:

- Creator/Partner Distribution, ASO/native scale, internationale Authority und Netzwerkdistribution.

Keine Fake-Reviews, erfundene Claims oder Paid Scale ohne Economics.

## 12. V1 Scope Guard gegen Roadmap-Bloat

Eine neue Funktion darf V1 nur blockieren, wenn mindestens eine Bedingung erfüllt ist:

1. ohne sie ist die Phase-1-Kern-User-Journey unvollständig;
2. ohne sie ist Truth/Security/Privacy/Data Integrity nicht production-safe;
3. ohne sie fehlt ein rechtlicher/vertraglicher Launch-Blocker;
4. ohne sie kann Jetnity reale V1-Provider/Revenue nicht sicher betreiben;
5. ohne sie scheitert der V1 Release Readiness Gate.

Andernfalls wird die Idee Phase 2 oder 3 zugeordnet.

## 13. Current effective hierarchy

Für Produktphasen/V1-Launchscope künftig zuerst lesen:

1. ADR-0204;
2. `JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md`;
3. `JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`;
4. `JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`;
5. `JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`;
6. `JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md`;
7. diese Reconciliation;
8. danach bestehende Vision/Mandate/Roadmap/Architecture/Decisions und Fachpläne für Detail-/Historical Evidence.

Bei Realzustand gewinnt weiterhin Live-Evidence.
