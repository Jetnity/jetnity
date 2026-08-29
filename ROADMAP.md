# Jetnity – Roadmap

Stand: 28. August 2026  
Status: **Kanonischer Post-PR-#113/#114-Programmstand. Foundation C/D/E, Safety, Seasonal, AP-1–AP-4, Admin A–C, Provider S1–S3 + S5-A, TW-1/2/4/3/5, TW6-A, TW6-B Runtime, Visitor Search UX, TW7-A, D0-1/D0-2, P1-D0-LIVE-01, QS-1/QS-2, P1-QS2-02, P1-TA-02, Admin-AAL2 einschließlich Production-Alignment sowie P2-TA-06 sind integriert. Kein Produkt-Folgeslice ist automatisch gestartet. Live-`main` immer live prüfen.**

> **Live-Evidence gewinnt immer.** Diese Roadmap definiert Reihenfolge und Programmstatus, aber keine alte SHA oder alte Slice-Aussage darf einen neueren Live-Zustand überschreiben.

Die ausführliche vorherige Roadmap-Fassung bleibt byte-identisch als historische Evidence erhalten unter:

- `docs/history/ROADMAP_PRE_PR113_2026-08-27.md`

Für Entscheidungen zusätzlich lesen:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
- `docs/CHATGPT_PR113_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

## 1. Abgeschlossen / auf `main`

### Produkt- und Qualitätsfundament

- Jetnity V2 Produktvision / Product Mandate
- Product Quality Standard
- UX-/Informationsarchitektur-Standard
- Logic Standard
- Continuity Standard
- Independent Review Depth Standard
- Technical-Lead-/Cursor-Governance
- Product-Owner-Merge-Governance
- Mobile-first / Device-Parity-Grundsatz

### Reise-Kern

- Reiseidee / Trip Builder Foundation
- Trip-Persistenz
- Guest → Account Foundations
- Trip Workspace Foundation
- Revisionslogik
- gemeinsamer Reisegraph
- Booking Status / Coverage

### Foundation C – Automatic Travel Requirements & Readiness

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

### Foundation D – Route & Transit Intelligence

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

### Foundation E – Traveller Context / Multi-Citizenship / Multi-Document

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

Kanonisches Modell:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine stille Citizenship-Annahme aus Residence, Standort, Abflugland, Sprache, Domain oder Issuer Country.

### Travel Safety & Disruption

Provider-neutrale Foundation abgeschlossen und integriert. Keine erfundene Safety Truth.

### Travel Timing & Seasonal Intelligence

Provider-neutrale Foundation abgeschlossen und integriert. Saisonales Muster ≠ akute Safety-Warnung.

## 2. Account / Traveller

Integriert:

- AP-1 – persönliches Zuhause
- AP-2 – Auth-UX-Hygiene
- AP-3 – abgeleitete Reisegruppen
- AP-4 – Account Archive Lifecycle / PR #108
- AP-4 Continuity / PR #111
- P1-TA-02 – Official Evaluation Option Scope
- P2-TA-06 – Readiness Credential Normalization / PR #113
- Issue #112 CLOSED / completed

P2-TA-06 ist **nicht mehr Draft und nicht mehr offen**. `travellerNormalisieren()` darf mehrere Dokumente ohne explizite `credentialOptions` nicht auf `documents[0]` kollabieren.

Weiterhin gilt:

- kein Default-Pass
- kein Default-Citizenship
- Issuer Country ≠ Citizenship
- `documents[0]` / `evaluations[0]` sind keine Product Truth

P2-TA-03 ist durch PR #117 integriert. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` ist der kanonische Folgeplan für AP-5–AP-12. Historischer PR #39 bleibt Historical Evidence.

P2-TA-04 Gate 0 ist durch PR #120 integriert. C1 ist durch PR #126 integriert: Delete-RPC, DB-Party-Cap 20, Child-Limits auch bei UPDATE. Production C1 live als `20260828015304`. Kein C2. AP-5 Gate 0 ist durch PR #129 integriert. AP-5-S1 ist durch PR #133 integriert. AP-5-S2 ist durch PR #137 integriert. AP-5-S3 ist durch PR #157 integriert. AP-5-S4 ist durch PR #160 integriert. AP-5-S5 ist durch PR #164 integriert. AP-6a Gate 0 ist auf Draft-PR #166 implementiert und wartet auf unabhängigen Technical-Lead Exact-Head-Review.

Nicht automatisch starten:

- AP-6a-Runtime / AP-6b / AP-7 / AP-5-P1–P5
- AP-7 / Account-Traveller-Registry — Architektur Dual-Authority freigegeben; S1 Domain-Contract über PR #145 auf `main @ 4ec83f36` integriert, kein automatisches S2, keine Persistenz
- Node 22 Runtime Consistency — PR #147 integriert auf `main @ 56aff7ff` (`engines.node: "22.x"` + `@types/node@22.20.1`)
- Next.js Framework Security Upgrade Gate 0 — PR #148 integriert auf `main @ 2fdf8a18`; Ziel 16.x Active LTS live-resolved (Minimum `16.3.3`) bleibt Empfehlung, nicht angewendet
- Next 16 Product-Owner-Freigabe — PR #149 integriert; autorisiert das gestufte Compatibility-Programm
- Next 16 Compatibility Prep S1 — PR #150 integriert auf `main @ d7f02f77`; async Request-API-Prep; kein automatischer Folgeslice aus S1
- Next 16 S2 Framework Bump — auf der S3-Baseline über PR #152 / `main @ 3c3079de` integriert; ältere Draft-#151-Zeilen sind Pre-Merge-Evidence
- AP-5-S3 Account Security Logout Scopes — PR #157 integriert auf `main @ 5920860e`
- AP-5-S4 Account Security MFA Step-up — PR #160 integriert auf `main @ 934d43da`
- AP-5-S5 Honest Current Session / Device View — PR #164 integriert auf `main @ 765fc547`
- AP-6a Gate 0 Legal Foundation / Trust Boundary — Draft-PR #166 / Issue #165; STOP für unabhängigen Technical-Lead Exact-Head-Review; kein Ready/Merge durch den Autor; kein AP-6a-Runtime / AP-6b / AP-7

## 3. Trip Workspace / Visitor Search

Integriert:

- TW-1 Shell / Device-Parity
- TW-2 Reiseübersicht
- TW-4 Aufmerksamkeit / Jetzt wichtig
- TW-3 Timeline / Etappe / Tag
- TW-5 Item- und Gap-Details
- TW6-A Create-Entry Alignment
- TW6-B Gate 0 / Gate 0B Provenance
- TW6-B Runtime / PR #87
- `TW6-REST-01` CLOSED
- Visitor Search UX / PR #94
- TW7-A Runtime / PR #106
- Issue #103 CLOSED / completed

TW-8 bleibt hinter Provider S5-B / belastbarer realer Commercial Provenance gegated. TW-9 nicht automatisch starten.

Separate Search-/Homepage-Themen:

- Issue #109 – Country-Alias-Ranking: PR #172 plus Recovery-PR #173 auf `main @ ade03511` integriert. Live Production API smoke PASS. Technical Lead hat #109 **CLOSED / COMPLETED**. Residual P2: Mobile Safari Real-Device. PR #178 ist nur Docs/Continuity-Träger; Live-Zustand prüfen. Auf `main` ist die Pre-Merge-#178-Klausel historisch.
- Issue #169 – PrivacyBee Schweiz Gate 0: über #175/#176 auf `main` integriert, **CLOSED / COMPLETED**. Keine Vendor-Aktivierung. Keine neuen Kosten.
- Issue #110 – natürliche Homepage-Mehrziel-Eingabe: dokumentiert, **nicht gestartet**.

## 4. Provider / Commercial Provenance

Integriert:

- S1 Shared Operational Contract
- S2 Flight Evidence Foundation
- S3 Mobility/Rental Evidence
- S5-A Commercial Provenance Domain Contract

Production Gate A hat die dafür freigegebenen Production-Schritte bereits ausgeführt und verifiziert. Frühere Roadmap-Aussagen, S2-Production sei noch nicht freigegeben, sind historische Pre-Apply-Evidence.

Weiter offen/gated:

- S5-B Zielarchitektur Option C angenommen (ADR-0197 / Draft-PR #180); Runtime/Persistenz nicht gestartet
- keine realen Provider
- keine Production Secrets
- keine Verträge
- keine paid calls
- keine Provider-Live-Aktivierung

## 5. Admin / AAL2

Integriert:

- Admin Slice A
- Admin Slice B
- Admin Slice C
- zentraler Admin-AAL2 Application Guard
- P1-AAL2-PROD-01 Alignment
- Apply-Gate-Closure / PR #102

Aktuelle Production-Wahrheit:

- `20260827170000_admin_aal2_data_plane_alignment` ist **angewendet und verifiziert, exakt einmal**
- `aktuelles_admin_aal2()` ist live
- Admin-Capabilities verlangen Rolle **UND** aktuelles AAL2
- kein zweiter Apply

Frühere Roadmap-Zwischenstände wie „Production-Datenebene nicht angewendet“ oder „nächster Schritt = Production-Apply“ sind historische Pre-Apply-Evidence und nicht mehr aktuell.

## 6. Production Gates

### Gate A

**PASS.** Die freigegebenen Flight-Commercial-Guard-Schritte wurden angewendet und semantisch verifiziert.

### Gate B

**Operativ PASS.** Der Vier-Datei-Vertrag

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

ist bereits angewendet.

**Kein Re-Apply.**

Direction A bleibt separat und nicht automatisch gestartet.

## 7. D0 / Growth / Domain

Integriert:

- D0-1
- D0-2
- P1-D0-LIVE-01

Kanonische Domain:

- `https://jetnity.com`
- `*.vercel.app` niemals kanonisch
- `jetnity.ch` später Entry / Redirect

Default bleibt fail-closed / noindex bis ausdrückliches Gate.

Kein Domain Cutover, Public Indexing, D1/G1 oder Growth-Folgeslice automatisch starten.

## 8. Quality / Security / Sanitation

QS-1/QS-2 und relevante P1-Hardening-Slices sind integriert.

Project-Sanitation: Issue #134 ist der aktuelle Closure-/Retention-Slice. PR #88 bleibt historische Evidence vom 26.08.2026, nicht Current Truth (`CLOSE-SAFE` / Branch `HISTORICAL-EVIDENCE`). Aktuelle Matrizen: `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`. ADR-0184.

Kein automatisches:

- Branch Delete
- Supabase Delete
- Vercel Delete
- Cloud Decommission
- Secret-/Provider-Aktivierung

Weitere Security-/Performance-Advisories werden nach Live-Evidence separat priorisiert.

## 9. Aktuelle verbindliche Ausführungsreihenfolge

Abgeschlossen:

1. ✅ Foundation C – Readiness
2. ✅ Foundation D – Route & Transit
3. ✅ Foundation E – Traveller Context
4. ✅ Safety & Disruption Foundation
5. ✅ Timing & Seasonal Foundation
6. ✅ AP-1 / AP-2 / AP-3 / AP-4
7. ✅ Provider S1–S3
8. ✅ Trip Workspace Audit / Zielarchitektur
9. ✅ TW-1 / TW-2 / TW-4 / TW-3 / TW-5
10. ✅ P1-QS2-02
11. ✅ P1-TA-02
12. ✅ TW6-A
13. ✅ TW6-B Runtime / `TW6-REST-01`
14. ✅ Visitor Search UX / PR #94
15. ✅ Provider S5-A
16. ✅ D0 live metadata boundary
17. ✅ Admin-AAL2 Application Guard
18. ✅ Production AAL2 Alignment + Apply-Gate-Closure
19. ✅ TW7-A / Issue #103
20. ✅ AP-4 / PR #108 + Continuity #111
21. ✅ P2-TA-06 / PR #113 + Issue #112
22. ✅ Post-PR-#113 Continuity / PR #114
23. ✅ Post-PR-#114 Continuity / PR #115 auf Live-`main` `43aef643` (immer live neu prüfen)
24. ✅ P2-TA-03 Account-Plan-Reconciliation / PR #117 + Issue #116
25. ✅ P2-TA-04 Traveller Child Write-Path Gate 0 / PR #120 + Issue #119
26. ✅ P2-TA-04 C1 Traveller write-contract integrity / PR #126 + Issue #122
27. ✅ AP-5 Gate 0 Account security capability audit / PR #129 + Issue #128
28. ✅ AP-5-S1 ehrliche Security-UI Zustände / PR #133 + Issue #132; ADR-0183
29. ✅ Project Sanitation Closure / PR #135 + Issue #134; ADR-0184; kein Cleanup
30. ✅ AP-5-S2 eingeloggte Passwortänderung / PR #137 + Issue #136 CLOSED / completed; Merge `f11a1753`
31. ✅ AP-5-S2 Post-Merge Continuity / PR #138 – integriert; ältere Draft-Sätze sind Pre-Merge-Evidence
32. ✅ Provider S5-B Gate 0 / PR #141 – docs/readiness only; Zielarchitektur später ADR-0197; S5-B Runtime nicht gestartet
33. ✅ Technical Lead / Cursor Operating Standard / PR #142 – integriert; Merge `9d4778b8`
34. ✅ PR #142 Post-Merge Continuity / PR #143 – integriert; Merge `1947285c`
35. ✅ AP-7 Gate 0 Account-Traveller-Registry Architecture / PR #144 – integriert; Merge `bb38aef5`; Dual-Authority danach product-owner-freigegeben
36. ✅ AP-7-S1 Dual-Authority Domain Contract / PR #145 – integriert auf `main @ 4ec83f36`; kein automatisches S2
37. ✅ Node 22 Runtime Consistency / PR #147 – integriert auf `main @ 56aff7ff`; ADR-0188
38. ✅ Next.js Framework Security Upgrade Gate 0 / PR #148 – integriert; Ziel 16.x Active LTS live-resolved (Minimum `16.3.3`)
39. ✅ Next 16 Product-Owner-Freigabe / PR #149 – integriert; autorisiert das gestufte Compatibility-Programm
40. ✅ Next 16 Compatibility Prep S1 / PR #150 – integriert auf `main @ d7f02f77`; ADR-0190
41. ✅ Next 16 S2 Framework Bump / PR #152 – integriert auf `main @ 3c3079de`; ältere Draft-#151-Zeilen sind Pre-Merge-Evidence
42. ✅ AP-5-S3 Account Security Logout Scopes / PR #157 – integriert auf `main @ 5920860e`; explizite `local`/`others`/`global` in `/account/security`
43. ✅ AP-5-S4 Account Security MFA Step-up / PR #160 – integriert auf `main @ 934d43da`
44. ✅ AP-5-S5 Honest Current Session / Device View / PR #164 – integriert auf `main @ 765fc547`
45. 🟡 AP-6a Gate 0 Legal Foundation / Trust Boundary / Draft-PR #166 – Docs/Contract/Evidence; keine Rechtstexte; STOP für unabhängigen Technical-Lead Exact-Head-Review; kein Ready/Merge durch den Autor; kein AP-6a-Runtime / AP-6b / AP-7
46. 🟡 Provider S5-B Option C Architecture Acceptance / Draft-PR #180 – Zielarchitektur angenommen (ADR-0197); keine Runtime, keine Migration; STOP für unabhängigen Technical-Lead Exact-Head-Review; kein Ready/Merge durch den Autor; kein Persistenz-Folgeslice

Nächster Schritt:

- Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #180 (S5-B Option C Zielarchitektur). Kein Ready. Kein Merge durch den Autor. Kein S5-B-Runtime-/Persistenz-Folgeslice. Kein TW-8.
- Draft-PR #166 / AP-6a Gate 0 bleibt ein separates Legal-PO-Gate und ist Non-Scope von #180.
- AP-6a-Runtime bleibt hinter dem PO-/Legal-Content-Gate.
- AP-7-S2 bleibt separat Product-Owner-gegatet und startet nicht aus #166 oder #180.

## 10. Noch nicht automatisch gestartet / weiterhin gated

- AP-6a-Runtime / AP-6b / AP-7 / AP-5-P1–P5
- AP-6a Gate 0 bleibt Draft bis unabhängiger Technical-Lead-Review und Merge; Runtime-Legal-Seiten nicht als gebaut behaupten
- AP-7
- Provider S5-B Runtime/Persistenz (Zielarchitektur Option C angenommen, nicht implementiert)
- echte Providerphase
- TW-8
- TW-9
- Direction A
- Admin D–K
- D1 / G1
- Issue #109 CLOSED / COMPLETED — Residual P2 Mobile Safari für den nächsten Search-/Homepage-UX-Slice; kein automatischer Folgeslice
- Issue #110
- Homepage-Mehrziel-Runtime
- neue AAL2-Arbeit
- neue Production-Migrationen ohne Gate
- Public Indexing
- Domain Cutover
- Native-App-Implementierung

## 11. Merge-/Produkt-Governance

> **AUTONOM MERGEN IST ERLAUBT. BLIND MERGEN IST VERBOTEN.**

> **Nur ChatGPT / Technical Lead darf Ready setzen oder mergen. Cursor-Agenten tun das niemals.**

Current Truth: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`.

Normale scope-treue PRs darf der Technical Lead nach unabhängigem Exact-Head-Review integrieren, und nur wenn er absolut überzeugt ist, dass dies die beste verantwortbare Entscheidung ist. Product-Owner-Sondergates bleiben insbesondere für Production-Migrationen/destruktive Daten, große RLS/Identity/Auth/MFA/AAL-Änderungen, sensitive Passport-/MRZ-/Biometrie-Persistenz, reale Provider/Secrets/paid calls, Payments, Kosten > USD 100/Monat, fundamentale Produkt-/Build-Order-Änderungen und Public-/Provider-/Store-Live-Aktivierungen.

## 12. Nächster Chat / Agent

Kein neuer Agent startet allein aufgrund dieser Roadmap.

Der nächste Technical Lead muss zuerst live rekonstruieren und danach einen scope-treuen Auftrag versionieren. Historische Agenten-/PR-Bodies bleiben Evidence ihres Zeitpunkts und werden nicht als aktuelle Freigabe gelesen.
