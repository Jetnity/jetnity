# Jetnity – PR #113 Post-Merge New-Chat Checkpoint

Stand: 27. August 2026  
Status: **PR #113 MERGED / P2-TA-06 CLOSED / POST-MERGE MAIN CI + VERCEL PASS**

> Dieser Checkpoint ist operative Continuity nach dem Merge von PR #113. Live-Evidence gewinnt immer; neue Chats/Agenten müssen `main`, PRs, CI, Vercel, Supabase und Branch Protection erneut live prüfen.

## 1. Abgeschlossener Slice

Issue #112 / **P2-TA-06 – eliminate first-document fallback in readiness credential normalization** ist abgeschlossen.

Cursor-Agent der Authoring-Linie: `Account plattform audit vorbereitung 4`.

Vertrag des integrierten Runtime-Slices:

- kein Default-Pass;
- kein `documents[0]` als Product Truth;
- fehlende/leere `credentialOptions` + N Dokumente → N Credential-Optionen;
- explizit gelieferte `credentialOptions` bleiben autoritativ;
- Issuer Country ≠ Citizenship;
- Relation zum Citizenship nur aus expliziter Dokumentrelation;
- Legacy-Singular ohne Documents bleibt Kompatibilitätsoption;
- ohne Dokument/Legacy bleibt `:none`;
- Official/Evaluation bleibt fail-closed `unknown` ohne Provider.

## 2. Finalreview / Merge-Evidence

| Feld | Wert |
| --- | --- |
| PR | #113 – MERGED |
| Reviewed Exact Head | `928215a2c6c4d4ce914f12ba1bd88dbcab8f548b` |
| Independent Technical-Lead Review | PASS – Review `5046006374` |
| Exact-Head GitHub Actions | Run `33119531505` SUCCESS |
| Exact-Head Vercel | Inspector `2T1QpsbVLLasdX9E5j9P3EM1jbPh` READY |
| Merge-Commit | `286d26fec2eed87e1227ebb2cf7327f50e8f5f1a` |
| Post-Merge GitHub Actions | Run `33120743073` SUCCESS |
| Post-Merge Vercel Production | Deployment `dpl_7V8WetsqrXC8m4CQcUZoQb9hXn1e` READY auf exakt `286d26fe...` |
| Issue #112 | CLOSED / completed |

## 3. Scope-Grenzen bestätigt

PR #113 hat **nicht** geändert:

- Datenbankschema / Migrationen;
- RLS / Ownership;
- Auth / Sessions / MFA / AAL;
- Production-Daten;
- Provider / Secrets / paid calls;
- Account-wide Traveller Registry / AP-7;
- AP-5;
- Homepage / Visitor Search;
- Issue #109 / #110.

Keine neuen laufenden Kosten.

## 4. Aktuelle Traveller-Wahrheit

Kanonisch bleibt:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Dokumente/Credential-Optionen → kontextabhängig bewertete zulässige Optionen.**

Keine relevante Funktion darf still den ersten Pass oder die erste Staatsbürgerschaft als richtige Wahrheit wählen. Issuer ist nicht Citizenship. Hard Truth bleibt `unknown` / `insufficient_context`, wenn Evidence fehlt.

## 5. Bereits integrierte relevante Linie

- TW6-B Runtime / Mode Contract: PR #87 integriert;
- Visitor Search UX: PR #94 integriert;
- Admin AAL2 Data Plane Alignment: PR #102 integriert; Production `20260827170000` angewendet und verifiziert, exakt einmal;
- TW7-A Runtime: PR #106 integriert; Issue #103 CLOSED / completed;
- AP-4 Account Archive Lifecycle: PR #108 integriert; Post-Merge Continuity über PR #111 integriert;
- P2-TA-06: PR #113 integriert; Issue #112 CLOSED / completed.

Production Gate A bleibt PASS. Production Gate B bleibt operativ PASS. Kein Re-Apply.

## 6. Offene / nicht automatisch gestartete Themen

Dieser Merge gibt **keinen** automatischen Folgeslice frei.

Insbesondere nicht automatisch starten:

- AP-5;
- AP-7 / Account-wide Traveller Registry;
- TW-8 / TW-9;
- Provider S5-B / Provider-Live;
- Homepage-Multi-Destination;
- Visitor-Search-Follow-up Issue #109;
- Homepage-Wunsch Issue #110;
- Growth D1/G1;
- Direction A;
- weitere Production-Migrationen;
- zweiten AAL2-Apply.

Vor neuem Auftrag: Binding Build Order + aktuelle Live-Gates neu rekonstruieren.

## 7. Bekannte Residuals / Governance

- `main` Branch Protection war zuletzt live `protected=false`; erneut live prüfen.
- `officialFingerprint` kann außerhalb #112 bei fehlendem `documents[]` weiterhin Legacy-Singularfelder für den Fingerprint lesen; kein Default-Pass in `travellerNormalisieren`, nicht Scope von #112.
- Project-Sanitation PR #88 bleibt non-destructive Evidence; kein Cleanup automatisch.
- alte Draft-/Pre-Merge-Sätze in historischen PR-Bodies und älteren Evidence-Dokumenten bleiben historische Momentaufnahmen und werden nicht als aktuelle Wahrheit gelesen.

## 8. Pflichtlektüre für nächsten Chat / Agent

1. `JETNITY_START_HERE.md`
2. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
3. die dort genannte Governance-/Produkt-/Engineering-Pflichtlektüre
4. `JETNITY_HANDOFF.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. **diesen Checkpoint**
7. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_STATUS_2026-08-27.md`
8. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_HANDOFF_2026-08-27.md`
9. ADR-0178 in `DECISIONS.md`
10. den für den nächsten tatsächlich freigegebenen Slice relevanten Task/Status/Handoff.

## 9. Nächste Technical-Lead-Aktion

**Kein Coding-Agent automatisch starten.**

Zuerst live prüfen:

- aktuellen `main`;
- offene PRs und Issues;
- CI / Vercel;
- relevante Supabase-Grenzen;
- Binding Build Order;
- ob ein aktueller P0/P1 den Build-Order-Schritt überstimmt;
- Parallelität / Shared Contracts.

Erst danach den nächsten kleinen, klar begrenzten Slice mit frischer Task/Spec und exaktem Cursor-Anzeigenamen vergeben.
