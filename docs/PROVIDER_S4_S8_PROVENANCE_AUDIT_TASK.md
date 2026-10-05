# Jetnity – Provider S4–S8 Dependency / Provenance Gap Audit – Task

Stand: 26. August 2026  
Agent: **`Jetnity provider readiness audit`**  
Branch: `audit/provider-s4-s8-provenance`  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Typ: **AUDIT / EVIDENCE / READINESS PREPARATION ONLY**

## 1. Ziel

Provider Readiness S1–S3 sind integriert. Die verbindliche Build-Reihenfolge sieht S4–S8 vor, bevor reale Provider aktiviert werden. TW-8 darf erst mit Provider S5 / belastbarer Commercial Provenance starten.

Dieser Audit soll den tatsächlichen Provider-/Commercial-Stand neu aus Code, Tests und Dokumentation rekonstruieren und präzise bestimmen:

- welche S4–S8-Fähigkeiten real fehlen;
- welches S5-Provenance-Modell TW-8 zwingend braucht;
- welche Daten als `unknown`, `stale`, `unavailable`, `error` oder bestätigt geführt werden müssen;
- welche Schritte ohne Providervertrag/Secrets/paid calls vorgezogen werden können;
- welche Schritte besondere Product-Owner-Gates auslösen.

Keine Runtime und keine Provideraktivierung in diesem Audit.

## 2. Pflichtlektüre / Live-Verifikation

Lies vollständig mindestens:

- `JETNITY_START_HERE.md`
- `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- Provider Audit / Target Architecture / Implementation Plan / S1–S3 Tasks, Status, Handoffs, ADRs;
- relevante Commercial-/Flight-/Hotel-/Activity-/Mobility-Contracts und Tests;
- TW-5/TW-8-Abhängigkeiten.

Live prüfen:

- `main`, Branch, Draft-PR, Ahead/Behind/Merge-Base;
- offene Provider-/historische Draft-PRs;
- tatsächliche Provider-Adapter, Mocks/Fallbacks, provenance/freshness/status fields;
- relevante UI-Claims und Search-/Commercial-Handoffs;
- CI/Vercel/Threads.

**Nicht `docs/ACTIVE_WORK_STATUS.md` ändern.**

## 3. Truth-Regeln

Unverändert hart:

- keine Fake-Preise;
- keine Fake-Verfügbarkeit;
- keine Fake-Provider-Health;
- keine erfundene Affiliate-/Commission-Truth;
- keine stillen Provider-Defaults;
- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context` und bestätigte Zustände getrennt;
- LLM darf Provider-/Commercial-Truth erklären, nicht erzeugen.

## 4. Audit-Matrix

Prüfe S4 bis S8 anhand der realen Implementierungspläne und aktuellen Codebasis. Für jeden Slice:

- Soll-Ziel;
- Ist-Evidence;
- fehlende technische Contracts;
- Abhängigkeiten;
- Product-Owner-Gates;
- Security/Privacy/Licensing/Cost-Risiken;
- Tests/Observability, die vor Runtime nötig sind.

### Schwerpunkt S5 – Commercial Provenance

Liefere besonders präzise:

- Quelle/Provider-ID;
- Produkt-/Angebots-ID soweit real vorhanden;
- abgefragter Suchkontext;
- observed/fetched timestamp;
- freshness/expiry semantics;
- currency and amount provenance;
- availability state;
- terms/fare/rate-plan basis soweit Quelle sie wirklich liefert;
- deep-link/affiliate attribution provenance;
- partial/missing/error/stale states;
- keine Vermischung von Marketing-Attribution und Produktprovider-Provenance;
- Verhalten, wenn mehrere Provider widersprechen;
- Anforderungen an TW-8, damit Preis/Zeit/Komfort-Vergleich keine erfundene Wahrheit erzeugt.

Prüfe, was davon heute bereits als Contract existiert und was nur Zielbild ist.

## 5. Provider-Aktivierungsgrenzen

Klassifiziere klar:

- offline/testbar ohne externe Credentials;
- Development-only mit synthetischen Fixtures;
- benötigt echten Vertrag;
- benötigt Secrets/API-Keys;
- erzeugt paid calls / laufende Kosten;
- benötigt Datenschutz-/Lizenz-/Terms-Prüfung;
- benötigt Product-Owner-Freigabe vor Production.

Keine echte Aktivierung durchführen.

## 6. Deliverables

Aktualisiere `docs/PROVIDER_S4_S8_PROVENANCE_AUDIT_STATUS.md` und optional eine separate Gap-/Evidence-Matrix.

Pflichtinhalt:

- S4–S8 Current-State/Gap-Matrix;
- P0/P1/P2/P3 Findings;
- S5 Commercial-Provenance Contract Gap Map;
- TW-8 Readiness Checklist;
- Provider Activation Gate Matrix;
- Security/Privacy/Cost/Licensing-Risiken;
- empfohlene konfliktarme Reihenfolge der nächsten Provider-Slices;
- explizite Shared-Contract-Bedarfe → STOPP statt stiller Änderung.

## 7. Harte Non-Scope-Grenzen

Keine:

- Runtime-Implementierung;
- Provideraktivierung;
- Secrets/API-Keys;
- Verträge oder externe Anmeldung;
- paid calls;
- echte Preis-/Verfügbarkeitsabfrage;
- DB/Migration/RLS;
- Auth/Traveller/Route/Payment;
- TW-8 Runtime;
- Marketing-/Ads-/Tracking-Aktivierung;
- neue Kosten.

## 8. Abschluss

Adversarial Self-Review: Jede Provider-/Commercial-Aussage muss belegt oder als offen markiert sein. Keine Zielarchitektur als Ist-Zustand darstellen.

Danach Status aktualisieren und **STOPP**. Kein Ready/Merge, kein S4/S5/S6/S7/S8-Folgeslice durch den Agenten. ChatGPT / Technical Lead re-reviewt vollständig.
