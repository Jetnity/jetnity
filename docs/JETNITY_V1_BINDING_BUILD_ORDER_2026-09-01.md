# Jetnity V1 – Binding Critical Build Order

Stand: 1. September 2026  
Status: **PRODUCT-OWNER BINDING FOR PHASE-1 / NO AUTOMATIC SLICE START**

## Zweck

Diese Datei definiert den **V1-kritischen Pfad** nach ADR-0204. Sie ersetzt nicht historische technische Evidence. Bei Konflikt darüber, was zwingend **vor V1** fertig sein muss, hat diese Datei Vorrang vor älteren breit angelegten Build-Order-Interpretationen.

Live-Evidence gewinnt immer. Jeder konkrete Slice beginnt mit frischem Binding Slice Precheck.

## 0. Phase Strategy Integration

**Jetztiger Planning-Slice.**

- 3-Phasen-Strategie persistieren;
- V1 Gap Analysis, DoD, Release Gate und Reconciliation festlegen;
- keine Runtime;
- danach STOP und Live-Rekonstruktion.

## 1. Provider Readiness auf V1-Livefähigkeit bringen

Bestehende Provider Foundations wiederverwenden.

Noch vor realen Providern:

1. verbliebene **S4**-Readiness-Lücken live rekonstruieren und schließen;
2. **S6 Persistent Cost Guard**;
3. **S7 Observability**;
4. **S8 Cache/License/operational hooks**;
5. vollständiger Provider-Readiness-Recheck.

Die interne Reihenfolge einzelner bounded Slices wird jeweils aus Live-Evidence bestätigt. Dieser Vertrag autorisiert keinen Slice automatisch.

**Harte Grenze:** echte Provider-Livepfade erst nach S4–S8, solange keine neue PO-Entscheidung etwas anderes bestimmt.

## 2. Erster realer Flight-Provider + Commercial Truth

Nach explizitem Product-Owner-Gate für Provider, Vertrag/DPA, Secrets, Kosten und Live-Aktivierung:

- genau einen geeigneten V1-Flight-Provider festlegen;
- serverseitigen realen Search-/Quote-Pfad aktivieren;
- Provenance/Freshness/Revalidation beweisen;
- Production Runtime Write Authority bewusst allokieren, falls erforderlich;
- echten Commercial Snapshot persistieren bzw. lizenzkonform verarbeiten;
- Workspace-Read-/Adoption-Pfad herstellen;
- Failure/Timeout/Rate-Limit/Cost/Observability E2E testen;
- keine Multi-Provider-Breite vor erfolgreichem ersten Pfad.

## 3. TW-8 / Commercial Workspace Closure

Mit echter Commercial Truth:

- Flight-Auswahl und Trip Snapshot korrekt verbinden;
- stale/recheck/freshness sichtbar;
- keine client-trusted Preise/Verfügbarkeit;
- Coverage/Booking-/Selected-State korrekt;
- Tripänderungen und Commercial Items interoperabel;
- danach TW-9/V1-Workspace-Polish soweit dependency-frei.

## 4. Realer Hotel-/Accommodation-Pfad

Bestehende Hotel-Domain, Quartierlogik, Ranking, Workspace und Nachweisnähte wiederverwenden.

Nach eigenem PO-Provider-Gate:

- genau einen V1-Hotel-/Accommodation-Pfad;
- echte Such-/Preis-/Availability-/Deeplink-Evidence;
- Commercial Provenance/Freshness;
- sichere Trip-Übernahme;
- Failure/Cost/License/Attribution;
- V1-E2E im Workspace.

Keine Multi-Hotelprovider-Architektur auf Vorrat.

## 5. Activities / Experiences V1-Pfad

Bestehende Activity-Domain/Tagesintegration wiederverwenden.

- geeigneten Provider/Partnerweg nach PO-Gate wählen;
- reale schedule/availability/commercial Evidence entsprechend Vertrag;
- sichere Tages-/Timeslot-Integration;
- Provenance/Freshness/Weiterleitung;
- E2E Failure Semantics.

Falls kein professioneller Providerzugang rechtzeitig verantwortbar verfügbar ist, darf Activities **nicht still verschwinden**. Vor V1 ist dann eine ausdrückliche Product-Owner-Launch-Exception erforderlich.

## 6. Entry Requirements – echte Official Truth

Die umfangreichen E1–E5/Foundation-C/D/E-Verträge werden nicht neu gebaut.

V1 braucht:

- echte Official-Truth-Quelle(n) / Provider nach PO-Gate;
- strukturierte aktuelle Evidence;
- vollständigen Route/Transit-/Traveller-/Credential-Kontext;
- fail-closed stale/unavailable/unknown;
- sichere Official Actions;
- E2E gegen reale Länder-/Transitfälle.

Commercial Provider dürfen keine Official Truth setzen.

## 7. Temporal Readiness / Travel Companion schließen

Auf echter Official-/Event-Truth:

- Flight/Event Provenance in Production kontrolliert aktivieren, wenn dafür erforderliche PO-/DB-Gates freigegeben sind;
- konkrete Event Resolver;
- `available_from` / `due_at` aus belastbarer Timezone-/Event-Evidence;
- Now/Soon/Info;
- completion/recheck/state für V1-In-App-Companion;
- Re-Evaluation bei Flight/Route/Traveller/Credential/Evidence-Änderung;
- keine Notification-Breite auf Vorrat.

Push/E-Mail Advanced Companion ist grundsätzlich Phase 2, sofern nicht ein enger V1-Kanal später ausdrücklich benötigt wird.

## 8. V1 Product Surface Gaps

Bounded, nachdem zentrale Truth-Abhängigkeiten stabil sind:

- **Destination Essentials** aus vorhandenen Safety/Seasonal/Entry Foundations plus source-aware öffentlicher/praktischer Information;
- **World Map** minimal: geplante + besuchte Orte/Länder, Account-Truth;
- **PWA Audit + bounded V1 implementation**: Installability/manifest/offline/stale semantics nur soweit V1 nötig;
- vollständige Mobile-/Desktop-IA-/Accessibility-Polish;
- Assistant als truth-aware In-Trip-Helfer production-ready machen, ohne Official-/Provider Truth zu ersetzen.

## 9. Phase-1 Account / Privacy / Operations Minimum

Frischer Audit gegen Live-Stand; nur V1-blockierende Lücken schließen.

Mindestens beurteilen:

- Privacy/Terms/Consent;
- Account data lifecycle/export/delete soweit erforderlich;
- Session-/MFA-/AAL-/Recovery-V1-Flows;
- Support-Minimum;
- Admin Incident/Error/Provider/Cost Visibility;
- Revenue/Conversion/Attribution Foundation;
- keine Full Admin D–K/Growth-OS-Pflicht vor V1.

## 10. Phase-1 Monetarisierung und öffentliche V1-Flächen

- reale Affiliate-/Booking-/Referral-Weiterleitungen;
- Revenue Attribution;
- Conversion Measurement;
- schlanke Premium-/Pro-Grenze nur soweit Produkt-/Geschäftsentscheidung sie verlangt;
- finale Homepage/öffentliche Kernpositionierung nur mit realen Claims;
- D1/G1 nur soweit für Schweizer Launch erforderlich;
- kein Paid-Scale vor belastbarer Conversion-/Revenue-Evidence.

## 11. V1 Definition of Done Closure

Function-by-function und cross-domain:

- komplette Kernreise;
- reale Truth-Quellen;
- Interoperabilität;
- keine offenen V1-P0/P1;
- releasekritische P2 bewertet;
- keine Feature-Bloat-Nachzügler.

## 12. V1 Release Readiness Gate

Vollständiger eigener Gate-Lauf gemäß:

`docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`.

Kein Public Launch ohne PASS und ausdrückliche Product-Owner-Freigabe.

## 13. Launch Sequence

1. Private Alpha;
2. Closed Beta Schweiz;
3. Swiss Public Launch;
4. Stabilisierung / Product Learning;
5. DACH;
6. weitere Märkte nach eigener Market Readiness.

## Was ausdrücklich nicht auf dem V1-kritischen Pfad liegt

Sofern kein späterer echter V1-Blocker bewiesen wird:

- Native Apps;
- Traveller Social Network;
- Creator Ecosystem;
- Partner Marketplace;
- mehrere Provider pro Kategorie;
- volle Mobility-/Cruise-/Insurance-Breite;
- Full Admin D–K / Growth Control Plane;
- Bexio/Ads/CRM-Pro-Ausbau;
- internationale Vollskalierung;
- umfangreiche Personalisierung;
- breite Push-/E-Mail-Automation;
- große Subscription-Tarifmatrix.

Diese Punkte bleiben Phase 2 oder 3 und werden nicht gelöscht.
