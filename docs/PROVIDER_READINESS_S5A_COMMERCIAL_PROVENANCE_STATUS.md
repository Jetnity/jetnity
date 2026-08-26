# Provider S5-A – Commercial Provenance Domain Contract – Status

Stand: 26. August 2026  
Agent: `Jetnity provider readiness audit`  
Branch: `feat/provider-s5-commercial-provenance-contract`  
Draft-PR: `#83`  
Aktueller `main`: `2468160ede5cf8cfcc96fb59cc1346ebd6b0fa21`  
Letzter unabhängiger Technical-Lead-Review: `805e25c340c93ba35f860e539dddedf14394dc1e`  
Status: **S5A-TL-09 UND S5A-TL-10 IM CODE BEHOBEN / NICHT READY / NICHT MERGEN / WARTE AUF ERNEUTEN TECHNICAL-LEAD-REVIEW**

Auftrag: `docs/PROVIDER_READINESS_S5A_COMMERCIAL_PROVENANCE_TASK.md`.  
ADR: `docs/ADR_0168_COMMERCIAL_PROVENANCE_DOMAIN_CONTRACT.md`.

`docs/ACTIVE_WORK_STATUS.md` wurde **nicht** geändert.

---

## 1. Technical-Lead-Findings

Review direkt in PR #83. HOLD / CHANGES REQUIRED / NICHT READY / NICHT MERGEN.

| ID | Klasse | Root Cause | Fix |
| --- | --- | --- | --- |
| `S5A-TL-01` | P1 | `commercialTruthUebernehmen` liess `user` Provider-Quellen behaupten; `commercialProvenancePruefen` defaultete auf `system` | Explizite Actor↔Source-Matrix. Kein `system`-Default. Trusted constructors |
| `S5A-TL-02` | P1 | `optionMitCommercialProvenance<T>` band beliebige Provenance an beliebiges T | Fail-closed Binding auf Domain, providerbelegte ID und belegte `externalRef` |
| `S5A-TL-03` | P2 | `user_intake`/`manual` verlangten immer `providerId` | Source- und Provider-Identität getrennt |
| `S5A-TL-04` | P2 | Konflikt-Fallback nutzte `externalRef` ohne Provider-Scope | Vergleich nur über echten `vergleichsschluessel` oder Provider+Ref |
| `S5A-TL-05` | P1 | `commercialTruthUebernehmen` ignorierte `bestehend` | Replacement-Contract: User/Manual ersetzen keine provider-belegte Truth; Assistant/LLM nie |
| `S5A-TL-06` | P1/P2 | `user_intake`/`manual` konnten `providerId: 'duffel'` behalten | Nicht-providergebundene Quellen lehnen jede `providerId` ab |
| `S5A-TL-07` | P2 | Fehlende Affiliate-Daten wurden zu `absent` | Default `unknown`; `absent` nur bei expliziter Abwesenheit ohne IDs |
| `S5A-TL-08` | P2 | `amount`/`amountStatus` wurden still umgedeutet | Widersprüchliche Kombinationen → `amount_status_widerspruch` |
| `S5A-TL-09` | P1 | `providerIdentitaetGleich` liess Refresh zu, wenn beide `externalRef` fehlen | Refresh nur bei identischer Domain, identischer `providerId` und identischer belegter `externalRef`. `providerOfferId` ist kein Refresh-Schlüssel |
| `S5A-TL-10` | P1 | Current-Quote ohne `quotedCurrency` / `currencyStatus=unknown` | Current-Quote-Display braucht belegte `quotedCurrency`. Requested darf fehlen; mismatch bleibt ohne Conversion |

## 2. Live-Stand vor dieser Korrektur

| Fakt | Wert |
| --- | --- |
| `origin/main` | `2468160ede5cf8cfcc96fb59cc1346ebd6b0fa21` nach Merge von PR #84 (P1-TA-02) |
| PR-Head | `805e25c340c93ba35f860e539dddedf14394dc1e` |
| Ahead/Behind vor Sync | 7 ahead / 7 behind |
| Merge-Base vor Sync | `2de8008ddb10e9b53fef49daccc779831669e813` |
| Mergeable vor Sync | CONFLICTING / DIRTY |
| Tatsächlicher GitHub-Diff vor Sync | 21 Dateien; `docs/ACTIVE_WORK_STATUS.md` **nicht** im Diff |
| Nach Sync | Merge-Base = `2468160e`; ADR-0167 aus `main` und ADR-0168 aus PR #83 beide erhalten |

## 3. Ist-Vertrag nach Korrektur

Actor↔Source unverändert fail-closed.

Provider-Refresh:

- Domain identisch
- `providerId` identisch und belegt
- `externalRef` identisch und auf beiden Seiten belegt
- fehlende Ref auf einer oder beiden Seiten → `refresh_identity_mismatch`
- `providerOfferId` ist Provenance-Metadatum, in S5-A kein gleichwertiger Identitätsschlüssel

Current-Quote-Display:

- braucht Provider-Beleg, `current` Freshness, quoted Amount **und** belegte `quotedCurrency`
- `requestedCurrency` darf fehlen; Darstellung dann in der Quote-Währung
- `requested != quoted` bleibt `mismatch` und kein Requested-Currency-Vergleich
- keine Conversion

Binding für providerbelegte Provenance verlangt dieselbe belegte `externalRef`.

## 4. Domain-Grenzen

Unverändert: kein UniversalOffer, keine `trip_items`-Felder, keine UI, keine Factories, keine Migration, keine Provideraktivierung. S1 Ops und Official/Safety/Seasonal bleiben getrennt.

Traveller-Kontext ist für diesen Slice nicht relevant.

## 5. P0 / P1 / P2 / P3

Keine neuen P0-Production-Incidents.

| ID | Klasse |
| --- | --- |
| `S5A-TL-01` / `S5A-TL-02` / `S5A-TL-05` / `S5A-TL-09` / `S5A-TL-10` | P1, im Contract geschlossen |
| `S5A-TL-03` / `S5A-TL-04` / `S5A-TL-06` / `S5A-TL-07` / `S5A-TL-08` | P2 bzw. P1/P2, im Contract geschlossen |
| `S5A-TW8-GATE-01` | TW-8 bleibt gesperrt |
| `S5A-P1-TW8-01` | persistierte `trip_items` ohne Zeitpunkt bleiben unknown |
| `S5A-ACT-GATE-01` | keine Provideraktivierung |

## 6. Shared-Contract-Einschätzung

Der S5-A-Vertrag wurde innerhalb seines Scopes verschärft. Keine Änderung an Auth, RLS, Traveller, Route, Payment, `trip_items` oder S1.

ADR-0167 (P1-TA-02, aus `main`) und ADR-0168 (S5-A) bleiben beide erhalten.

S5-B-Persistenz bleibt dokumentiert und nicht implementiert.

## 7. Tests

`lib/commercial-provenance/commercial-provenance.test.ts` enthält die bisherigen Truth-Trennungen plus die Pflichtfälle zu S5A-TL-09 und S5A-TL-10. Domain-Komposition mutiert keine bestehenden Option- oder `trip_items`-Schemata.

## 8. Exact Head / Actions / Vercel

Live-Baseline für diese Korrektur: `origin/main` `2468160ede5cf8cfcc96fb59cc1346ebd6b0fa21`.

Der Implementierungscommit dieser Runde ist der zu reviewende Head, sobald Actions und Vercel auf genau diesem SHA SUCCESS/READY sind. Cursor-Aggregat-Views sind keine Evidence.

`docs/ACTIVE_WORK_STATUS.md` bleibt 0 Zeilen gegenüber `main`.

## 9. STOPP

Nicht Ready. Nicht mergen. Kein S5-B. Kein S6/S7/S8. Kein TW-8. Keine Provideraktivierung.

Nächster Schritt: unabhängige Technical-Lead-Review der TL-09/TL-10-Korrektur auf dem Exact Head.
