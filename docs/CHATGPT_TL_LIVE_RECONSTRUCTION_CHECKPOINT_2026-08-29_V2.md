# Jetnity – Technical-Lead Live Reconstruction Checkpoint V2

Stand: 29. August 2026
Status: **AUTHORITATIVE CURRENT-STATE RECONCILIATION / POST-LANDING-STABLE / LIVE-EVIDENCE WINS**
Reconstruction baseline: `main @ 69ef27b169780e41ba506a69acb15caafa645517`
Integrated via recovery PR #194; merge commit: `cbf7cfc863896b00108a9677a172df40c2e53e2d`.

> `main` is moving evidence. Never treat the reconstruction baseline as the current head after this checkpoint has landed. If this file exists on `main`, current `main` is at least `cbf7cfc8`; always live-verify the actual head before any action.

## 1. Zweck

Dieser Checkpoint reconciled den tatsächlichen Live-Stand nach vollständigem Abgleich von `main`, aktueller PR-Historie, Build Order, Account-/Traveller-/Trip-/Provider-Evidence und den offenen Draft-PRs. Er superseded nur **current-state Aussagen**, nicht historische Evidence.

Verbindlich: Kein neuer großer Agenten-Workstream ohne **Duplicate/History Gate** gegen aktuellen `main`, gemergte PRs, kanonische Task/Status/Handoff-Dokumente und Build Order.

## 2. Live-Git / post-landing stable truth

- Reconstruction baseline vor dieser Reconciliation: `69ef27b169780e41ba506a69acb15caafa645517`.
- Reconciliation landete via PR #194 auf Merge `cbf7cfc863896b00108a9677a172df40c2e53e2d`.
- Der **aktuelle** `main`-SHA wird nicht als dauerhaft bewegliche Wahrheit in diesem Dokument festgeschrieben; er muss live gelesen werden.
- Letzter produktiver Schritt vor der Reconciliation: Skyscanner Flights offline adapter foundation via Recovery-PR #186.
- `main` Branch Protection zuletzt live verifiziert: `protected=false` — bekanntes Governance-Risiko, unverändert bis neue Live-Evidence vorliegt.
- PR #191 und #192: CLOSED / DUPLICATE / NON-CANONICAL / nicht gemergt.
- PR #88: CLOSED / SUPERSEDED AS CURRENT INVENTORY / nicht gemergt; Source-Branch bleibt **HISTORICAL-EVIDENCE** und wurde nicht gelöscht.
- PR #193: geschlossener Draft-Carrier wegen bekanntem Draft→Ready-Connectorfehler; identischer Exact Head wurde über PR #194 integriert.

## 3. Trip Workspace

Integriert / nicht erneut bauen:
- TW-1 Shell & Geräteparität
- TW-2 Reiseübersicht
- TW-3 Timeline / Etappe / Tag
- TW-4 `Jetzt wichtig`
- TW-5 Item-/Gap-Details
- TW6-A Create Entry
- TW6-B Runtime / Multi-Destination-Grundlage
- TW6-REST-01 progressive weitere Ziele
- TW7-A Hub-/Kartenidentität
- Visitor Search inklusive Country-Alias-Recovery

Offen:
- TW-8 Commercial Surfaces: **BLOCKED** bis reale Provider Commercial Provenance vorliegt; S5-B-Persistenz oder Fixtures allein öffnen TW-8 nicht
- TW-9 Polish / Accessibility / Performance / Evidence / Closure
- finaler Function-by-Function-/Intelligence-Audit

## 4. Traveller / Multi-Citizenship / Multi-Document

Kanonischer Vertrag ist bereits etabliert und darf nicht erneut auditiert oder neu erfunden werden:

> Ein Traveller → mehrere Citizenships → mehrere Travel Documents/Credentials → kontextabhängig bewertete zulässige Optionen.

Integriert:
- Foundation E auf Production
- Multi-Citizenship / Multi-Document-Grundmodell
- Issuer Country != Citizenship
- kein Default-Pass / kein `documents[0]` als Product Truth
- P1-TA-02 Official Option Scope
- P2-TA-06 Credential Normalization
- Guest→Account trip-scoped truth protection
- P2-TA-04 C1 Traveller write-contract integrity
- AP-7 Gate 0 Traveller Registry architecture
- Product-Owner Dual-Authority approval
- AP-7-S1 Dual-Authority domain contract

Offen:
- AP-7-S2 Registry Persistence / Identity / RLS / Ownership
- Account Traveller Registry CRUD/UX
- sichere Registry→Trip-Snapshot Materialisierung und Conflict/Update-Semantik
- Document Lifecycle/UX und spätere sensitive document storage nur unter separaten Security/Privacy Gates

## 5. Account Platform

Integriert / nicht erneut bauen:
- AP-1 bis AP-4
- AP-5 Gate 0
- AP-5-S1 Security UI truth
- AP-5-S2 Password Reauthentication
- AP-5-S3 Logout Scopes
- AP-5-S4 MFA Step-up
- AP-5-S5 Honest Current Session View
- AP-6a Gate 0 Legal Foundation / Trust Boundary
- AP-7 Gate 0 + PO Dual-Authority + AP-7-S1 Domain Contract

Offen:
- AP-6a echte Legal Runtime / Inhalte bleiben PO-/Legal-content-gated
- Consent Runtime / Cookie-/Consent truth
- Consumer data export / account deletion
- AP-7-S2 Persistence/RLS/Runtime
- AP-8 bis AP-12 gemäß kanonischem Account-Plan, soweit nicht durch spätere Evidence integriert

## 6. Security / Privacy

Breiter Security/Privacy Current-State Audit ist **nicht** erneut zu starten. PR #191 wurde als Duplicate geschlossen.

Bereits durchgeführt/integriert sind u.a. QS-/Security-Arbeiten, Admin AAL2 + Production data-plane alignment, AP-5 Auth/Session/MFA Slices, Guest→Account truth hardening, Traveller write hardening, Next.js security upgrade, Node 22 consistency, Legal Gate 0, S5-B trust/persistence boundaries.

Residuals werden nur als konkrete, evidence-basierte Slices geschnitten, z.B. AP-7 Registry RLS, sensitive document storage, Legal/Consent Runtime, Export/Delete, Provider credentials/runtime principals, Payments/Finance, final release security/abuse/privacy audits.

## 7. Provider / Commercial Truth

Integriert:
- Provider S1–S3
- S5-A Commercial Provenance domain contract
- S5-B Gate 0
- S5-B Option C architecture
- S5-B persistence implementation
- Production migration `20260829140000_trip_item_commercial_provenance` applied and verified
- runtime write path remains unallocated / closed
- no real provider snapshot yet
- Skyscanner Flights offline adapter foundation integrated

Wichtig: Real Commercial Truth ist noch **nicht** vorhanden. Keine realen Skyscanner credentials/calls/snapshots. TW-8 bleibt geschlossen.

## 8. Aktive Provider-PRs und TL-Gates

### PR #187 — Provider adapter core foundation
- Agent: `Jetnity provider adapter core 1`
- Draft / OPEN
- Reviewed Head `80129085b23f7fda4ede3e9347b98975fab3002d`: **CHANGES REQUIRED**, nicht freigegeben.
- CI #1198 / Run `33261493411`: SUCCESS auf diesem alten Review-Head; Grün ersetzt keinen TL-PASS.
- Bereits akzeptierte Verbesserungen: bounded streaming body read; observer/preflight exception isolation.
- Noch blockierende P1 auf diesem Head: terminale non-retryable Fehler können nach früherem Retry fälschlich `retry_exhausted` werden; `server-only`-Grenze ist über direkte Core-/`exports.ts`-Imports mechanisch umgehbar.
- Same-Agent-Fix wurde an `Jetnity provider adapter core 1` zurückgegeben.
- **Nächster Schritt:** neuer Head → vollständige Exact-Head-Gates → unabhängiger TL Re-Review; kein Merge vorher.

### PR #188 — HBX Hotels adapter contract audit
- Agent: `Jetnity provider hbx audit 1`
- Draft / OPEN
- Reviewed Head `68e98f7ceb799c4a5494810ad4fe0805611fade8`: **CHANGES REQUIRED**.
- Provider-Recherche grundsätzlich brauchbar; vor Akzeptanz Current-State-Fix nötig: S5-B-Persistenz ist bereits Production, nur Runtime-Write-Path/realer Snapshot bleiben gegatet; First-Party-Portfoliozahlen 173k/250k/300k als Dokumentationsdrift festhalten.
- **Nächster Schritt:** Same-Agent-Fix → Exact-Head TL Re-Review.

### PR #189 — Viator Activities adapter contract audit
- Agent: `Jetnity provider viator audit 1`
- Draft / OPEN
- Reviewed Head `51eac51824aaf2aa27d795a818b8fd00bf6f80de`: **CHANGES REQUIRED**.
- Viator bleibt bereits festgelegter erster spezialisierter Activities-Zielprovider; kein erneutes PO-Auswahlgate. S5-B Production-Apply ist nicht mehr offen; Runtime-Provider-Write/echte Commercial Truth bleiben gegatet.
- **Nächster Schritt:** Same-Agent-Fix → Exact-Head TL Re-Review.

### PR #190 — 12Go Mobility adapter contract audit
- Agent: `Jetnity provider 12go audit 1`
- Draft / OPEN
- Reviewed Head `752f69909822cb24d88e7e02aa9b609ba028c0ad`: **CHANGES REQUIRED**.
- 12Go bleibt bereits festgelegter erster Mobility-Zielprovider. API-Details hinter prior consent/confidential terms bleiben UNKNOWN. S5-B Persistenz bereits Production; echte Runtime/Provider-Write bleibt gegatet.
- **Nächster Schritt:** Same-Agent-Fix → Exact-Head TL Re-Review.

## 9. Provider Zielarchitektur

`Jetnity Product/UI → provider-neutrale Domain Contracts → shared Provider Core → dünne konkrete Provider Adapter → Provider APIs`.

Domains bleiben getrennt: Flights, Hotels, Activities, Mobility, Rental Cars. Kein Universaladapter. Später Provider Orchestrator für Fan-out, Normalisierung, Dedup/Compare/Rank unter Erhalt der provider-spezifischen Provenance.

Aktuelle Ziele:
- Flights: Skyscanner first
- Hotels: HBX als Evaluation-/technischer früher Kandidat; kommerzieller Redirect-Fit bleibt gegenüber Booking.com Demand / Expedia Rapid zu bewerten
- Activities: Viator first; GetYourGuide später
- Mobility: 12Go first
- Transfers: HBX Transfers optional supplement
- Rental Cars: separater Domain-Track

Diese groben Zielentscheidungen werden nicht erneut gefragt, außer neue Evidenz ändert die Produktempfehlung materiell. Signup, Vertrag, Credentials, paid calls und Production-Aktivierung bleiben separate Gates.

## 10. Framework / Runtime Basis

Integriert / nicht erneut planen:
- Node 22 Runtime consistency
- Next Framework Security Gate 0
- PO approval staged Next 16 program
- Next 16 compatibility S1
- Next.js 16.3.3 framework bump

## 11. Admin / Homepage / Discoverability / Growth

Admin A–C integriert; D–K + Marketing/Growth Control Plane noch nicht vollständig. Billing/Refund-P1 muss vor Finance/Payment-Live geschlossen werden.

Homepage finalization, D1+ Discoverability und G1+ Growth bleiben nach stabiler Produkt-/Commercial-Truth in der Binding Build Order. Keine öffentlichen Claims zu nicht real verfügbaren Funktionen.

## 12. Verbindliche nächste Reihenfolge

1. PR #187 Same-Agent-Fix der aktuellen P1-Funde → vollständiger TL Exact-Head Re-Review → nur bei PASS integrieren.
2. PR #188, #189, #190 Same-Agent-Fixes → jeweils unabhängig gegen offizielle Provider-Evidence reviewen → erst danach integrieren.
3. Skyscanner serverseitigen Create/Poll Transport auf dem accepted shared Core als neuen kleinen Slice bauen, weiterhin ohne Production credentials, sofern keine PO-Gates ausgelöst werden.
4. Nach akzeptierten Provider Contracts konfliktfrei konkrete provider-spezifische Adapter-Slices fan-outen; Shared Core bleibt serial/TL-controlled.
5. Separat AP-7-S2 Persistence/RLS als echten offenen Account/Traveller-Slice vorbereiten; **kein erneuter Architektur-Audit**.
6. AP-6 Legal Runtime nur nach PO-/Legal Content Gate.
7. Erst mit realer Providerantwort + echter Commercial Provenance TW-8 öffnen.
8. Danach TW-9 + finaler Workspace Audit; anschließend weitere Build-Order Programme.

## 13. Agent Launch Gate — verbindliche Korrektur

Vor jedem neuen Agenten muss der Technical Lead live prüfen:
1. aktuellen `main` SHA;
2. gemergte PRs mit identischem/überlappendem Scope;
3. relevante Task/Status/Handoff/ADR-Dateien;
4. Binding Build Order und aktuelle Programm-Abhängigkeiten;
5. offene PRs/Branches und Shared-File-/Shared-Contract-Overlap;
6. erst dann Agent starten.

Wenn der Scope bereits integriert ist: **kein Agent**. Stattdessen exakten Residual-Slice schneiden.

## 14. Continuity

Dieser Checkpoint ist die Reconciliation-Evidence nach den Duplicate-PRs #191/#192 und ist post-landing-stabil formuliert. Historische Dateien dürfen ältere Zustände enthalten. Bei Widerspruch gilt: **Live-Evidence zuerst**; danach diese Reconciliation für ihren Scope; danach spätere versionierte Evidence; historische Evidence zuletzt.

Kein relevanter Fortschritt darf nur im Chat existieren.