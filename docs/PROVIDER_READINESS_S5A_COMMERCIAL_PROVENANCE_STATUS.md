# Provider S5-A – Commercial Provenance Domain Contract – Status

Stand: 26. August 2026  
Agent: `Jetnity provider readiness audit`  
Branch: `feat/provider-s5-commercial-provenance-contract`  
Draft-PR: `#83`  
Aktueller `main`: `2de8008ddb10e9b53fef49daccc779831669e813`  
Implementierungs-Head TL-05–08: `700065fee8ba0ff87f424dc923fd8959d5da3cc5`  
Letzter unabhängiger Technical-Lead-Review: `1f12f8f296bd9453fd6e406f8fdaa952a4294df5`  
Status: **S5A-TL-05 BIS S5A-TL-08 IM CODE BEHOBEN / NICHT READY / NICHT MERGEN / WARTE AUF ERNEUTEN TECHNICAL-LEAD-REVIEW**

Auftrag: `docs/PROVIDER_READINESS_S5A_COMMERCIAL_PROVENANCE_TASK.md`.  
ADR: `docs/ADR_0168_COMMERCIAL_PROVENANCE_DOMAIN_CONTRACT.md`.

`docs/ACTIVE_WORK_STATUS.md` wurde **nicht** geändert.

---

## 1. Technical-Lead-Findings

Review direkt in PR #83. HOLD / NICHT READY / NICHT MERGEN.

| ID | Klasse | Root Cause | Fix |
| --- | --- | --- | --- |
| `S5A-TL-01` | P1 | `commercialTruthUebernehmen` liess `user` Provider-Quellen behaupten; `commercialProvenancePruefen` defaultete auf `system` | Explizite Actor↔Source-Matrix. Kein `system`-Default. Trusted constructors `commercialProviderQuotePruefen` / `commercialNutzerangabePruefen` / `commercialPersistiertenSnapshotPruefen` |
| `S5A-TL-02` | P1 | `optionMitCommercialProvenance<T>` band beliebige Provenance an beliebiges T | Fail-closed Binding auf Domain, providerbelegte ID und `externalRef` |
| `S5A-TL-03` | P2 | `user_intake`/`manual` verlangten immer `providerId` | Source- und Provider-Identität getrennt. Nutzerangaben brauchen `observedAt`, kein `retrievedAt`, kein `freshUntil`, kein Fake-Provider |
| `S5A-TL-04` | P2 | Konflikt-Fallback nutzte `externalRef` ohne Provider-Scope | Vergleich nur über echten `vergleichsschluessel` oder Provider+Ref |
| `S5A-TL-05` | P1 | `commercialTruthUebernehmen` ignorierte `bestehend` | Minimaler Replacement-Contract: User/Manual ersetzen keine provider-belegte Truth; Assistant/LLM nie; Provider-Refresh nur identitätsgebunden |
| `S5A-TL-06` | P1/P2 | `user_intake`/`manual` konnten `providerId: 'duffel'` behalten | Nicht-providergebundene Quellen lehnen jede `providerId` fail-closed ab |
| `S5A-TL-07` | P2 | Fehlende Affiliate-Daten wurden zu `absent` | Default `unknown`; `absent` nur bei expliziter Abwesenheit ohne IDs |
| `S5A-TL-08` | P2 | `amount`/`amountStatus` wurden still umgedeutet | Widersprüchliche Kombinationen → `amount_status_widerspruch` |

## 2. Live-Stand vor der Korrektur

| Fakt | Wert |
| --- | --- |
| `origin/main` | `2de8008ddb10e9b53fef49daccc779831669e813` |
| PR-Head | `e222646dd55e150ca5ac0353c6a0994d70067c85` |
| Ahead/Behind vor Sync | 2 ahead / 4 behind |
| Merge-Base vor Sync | `71230c280b1cd2500d224095fa84f4472101d31f` |
| Mergeable vor Sync | CONFLICTING |
| Tatsächlicher GitHub-Diff vor Sync | 19 Dateien; `docs/ACTIVE_WORK_STATUS.md` **nicht** im Diff |
| Nach Sync | Merge-Base = `2de8008d`; 4 ahead / 0 behind; **MERGEABLE** |
| Diff nach Sync | 21 Dateien gegenüber `main` (19 bisher + `bindung.ts` + `trust.ts`); `docs/ACTIVE_WORK_STATUS.md` unverändert gegenüber `main` |

Main enthält inzwischen PR #81 (Guest→Account Commercial-Truth). ADR-0166 in `DECISIONS.md` auf `main` ist diese QS-2-Entscheidung; ADR-0168 bleibt S5-A. Beide bleiben erhalten.

## 3. Ist-Vertrag nach Korrektur

Actor↔Source:

- `user` → nur `user_intake` / `manual`
- `provider_adapter` → `live_api` / `provider_snapshot`
- `system` → nur `persisted_snapshot` (trusted Application-Pfad)
- `assistant` / `llm` → reject
- fehlender Akteur → `missing_actor`, keine Provider-Hard-Truth

User-Intake/Manual:

- keine `providerId`, auch nicht `duffel`
- Fake-IDs `user` / `manual` / `jetnity` werden abgewiesen
- massgebliche Zeit ist `observedAt`, nicht `retrievedAt`
- kein `freshUntil`, keine Provider-Live-Evidence, niemals current/live Provider-Truth
- fehlende Affiliate-Evidence bleibt `unknown`
- `commercialTruthUebernehmen` darf provider-belegte Truth nicht durch User-/Manual-Wahrheit ersetzen

Binding:

- Domain muss übereinstimmen
- providerbelegte Provenance nur an dieselbe Provider-ID
- `externalRef` muss übereinstimmen, wenn sie zur Identität gehört

Konflikt:

- ohne `vergleichsschluessel` nur Provider+`externalRef`
- gleiche Ref zweier Provider ohne gemeinsamen Schlüssel → `insufficient_evidence`

## 4. Domain-Grenzen

Unverändert: kein UniversalOffer, keine `trip_items`-Felder, keine UI, keine Factories, keine Migration, keine Provideraktivierung. S1 Ops und Official/Safety/Seasonal bleiben getrennt.

Traveller-Kontext ist für diesen Slice nicht relevant.

## 5. P0 / P1 / P2 / P3

Keine neuen P0-Production-Incidents.

| ID | Klasse |
| --- | --- |
| `S5A-TL-01` / `S5A-TL-02` / `S5A-TL-05` | P1, im Contract geschlossen |
| `S5A-TL-03` / `S5A-TL-04` / `S5A-TL-06` / `S5A-TL-07` / `S5A-TL-08` | P2 bzw. P1/P2, im Contract geschlossen |
| `S5A-TW8-GATE-01` | TW-8 bleibt gesperrt |
| `S5A-P1-TW8-01` | persistierte `trip_items` ohne Zeitpunkt bleiben unknown |
| `S5A-ACT-GATE-01` | keine Provideraktivierung |

## 6. Shared-Contract-Einschätzung

Der S5-A-Vertrag wurde innerhalb seines Scopes verschärft. Keine Änderung an Auth, RLS, Traveller, Route, Payment, `trip_items` oder S1.

S5-B-Persistenz bleibt dokumentiert und nicht implementiert.

## 7. Tests

`lib/commercial-provenance/commercial-provenance.test.ts` enthält 46 Contract-Tests, darunter die Adversarial-Fälle zu S5A-TL-01 bis S5A-TL-08. Domain-Komposition mutiert keine bestehenden Option- oder `trip_items`-Schemata.

GitHub Actions auf `700065fe` führt `npm test` aus und ist SUCCESS.

## 8. Exact Head / Actions / Vercel

Live verifiziert am 26. August 2026 gegen `origin/main` `2de8008ddb10e9b53fef49daccc779831669e813`.

**Implementierungs-Head TL-05–08:** `700065fee8ba0ff87f424dc923fd8959d5da3cc5`

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | SUCCESS [32965020588](https://github.com/Jetnity/jetnity/actions/runs/32965020588) |
| Vercel Preview | SUCCESS / READY `7dbZCUEtLzRjhBUzZPDkESvTyzPa` – Deployment `6103071068` |
| Preview-URL | https://jetnity-c6zvt0e3g-jetnity-e1b93c82.vercel.app |
| Merge-Base | `2de8008ddb10e9b53fef49daccc779831669e813` = aktuelles `origin/main` |
| Ahead/Behind | 6 / 0 |
| Mergeable | MERGEABLE, Draft, `mergeStateStatus=CLEAN` |
| Tatsächlicher GitHub-Diff | 21 Dateien; `docs/ACTIVE_WORK_STATUS.md` **0 Zeilen** gegenüber `main` |

Letzter unabhängiger Technical-Lead-Review bleibt auf `1f12f8f296bd9453fd6e406f8fdaa952a4294df5` (HOLD, S5A-TL-05 bis S5A-TL-08). Dieser Docs-Commit verschiebt den PR-Head; Technical-Lead-Review gaten den dann aktuellen Head. Cursor-Aggregat-Views sind keine Evidence.

## 9. STOPP

Nicht Ready. Nicht mergen. Kein S5-B. Kein S6/S7/S8. Kein TW-8. Keine Provideraktivierung.

Nächster Schritt: unabhängige Technical-Lead-Review der TL-05–08-Korrektur.
