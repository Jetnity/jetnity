# Requirements Provider Contract Gap Map – 2026-08-30

Stand: 30. August 2026  
Status: **GAP MAP / PROPOSAL ONLY / NO SLICE STARTED / REVIEW-FIX CR-1–CR-2**  
Cursor-Agent: **`Jetnity requirements provider groundwork 1`**  
Companion: `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`

Kein Gap in dieser Datei ist ein Implementierungsauftrag.

---

## 1. Schwere

| Klasse | Bedeutung in diesem Audit |
| --- | --- |
| **P0** | Akuter Production-Incident **jetzt** (Fake-Official, Leak, paid Missbrauch live) |
| **PROVIDER-ACTIVATION-GATE** | Muss geschlossen sein, bevor ein echter Requirements-Adapter Hard Truth liefern darf |
| **PO-GATE** | Besonderes Product-Owner-Gate (Vertrag, Secret, paid call, sensitive data, Production-Writer) |
| **P1** | Vor dem ersten Adapter-Verdrahten auf Jetnity-Seite nötig |
| **P2** | Relevant, aber nicht adapter-blockierend solange Factory `null` |
| **P3** | Residual / Presentation / Docs-Drift |

Es gibt **kein P0** in diesem Scope.

---

## 2. Gap-Register

| ID | Gap | Klasse | Current Truth | Blockt | Kleinster späterer Schnitt |
| --- | --- | --- | --- | --- | --- |
| G-S4-TIMEOUT | `evaluate` ohne `AbortSignal` / explizites Timeout | **P1** | Throw wird gefangen; hängender Call nicht abgebrochen | ersten echten Adapter | Readiness-only Truth-Ops: Signal + Timeout analog Safety/Seasonal, Tests offline |
| G-S4-TTL | `officialFrische()` hat **kein** Höchstalter/`checkedAt`-TTL | **P1** / **PROVIDER-ACTIVATION-GATE** | Fingerprint + `validFrom`/`validUntil` werden geprüft; `checkedAt` nur auf Existenz (Freshness) bzw. 5-min-Zukunft-Skew (Trust). Unveränderter Fingerprint + `validUntil == null` → dauerhaft `current` | Adapter / Hard Truth | S4-R1: bounded Freshness-/TTL-Policy (provider-/vertragssensitiv wo nötig); fail-closed `recheck_needed` / non-current, wenn Freshness nicht begründet werden kann. Jetnity-`checkedAt` (Abruf/Auswertung) **nicht** mit Vendor-`lastUpdatedAt` vermischen. **Nicht in diesem Audit implementiert** |
| G-S4-KILLSWITCH | Kein `JETNITY_READINESS_AKTIV` | **P1** (erst wenn Factory ≠ `null`) | Factory `null` ist heute die einzige Bremse | Factory-Verdrahtung | S1-`providerOpsZustand` an Readiness; Production bleibt hart aus |
| G-S4-OUTCOME | Timeout nicht von Throw/`unavailable` unterscheidbar | **P1** | `providerFehlerFreshness` kennt nur `availability` am Error-Objekt | ehrliche Failure-UX / spätere Ops | Outcome-Mapping auf S1-Taxonomie **ohne** Fachzustände zu mischen |
| G-S4-BODY | 8 KB Cap vs Multi-Traveller | **P2** | Cap existiert; Overflow nicht live gemessen | grosse Guest-Evaluate-Bodies | Messen + ggf. Cap anheben **oder** Trip-Load statt Client-Party; Produktentscheidung |
| G-S4-OBS | Keine Readiness-`providerOpsEvent`-Schreibnaht | **P2** | Event-Typ existiert | Admin-Health, Cost-Forensik | S7-artig, ohne Fake-Grün, ohne Payload-Leak |
| G-S8-LICENSE | Keine Cache/Lizenz-Hooks | **PROVIDER-ACTIVATION-GATE** / **P2** heute | `no-store`; Default gedanklich `forbidden` | Persistenz/Anzeige lizenzierter Regeln | S8 Hooks, **keine** erfundenen Timatic-/Sherpa-Texte |
| G-S6-COST | Nur In-Memory-Guard | **PO-GATE** vor paid calls | 20/80 je Prozess | bezahlten Adapter | S6 persistenter Cost Guard; eigenes DB-Gate |
| G-WS-EVAL | Workspace übergibt keine serverseitigen Evaluations | **P2** | `KontoArbeitsbereich` / `GastArbeitsbereich` ohne `officialEvaluations` | sichtbare Official-UX nach Provider | eigener Workspace-Orchestrierungs-Slice **nach** Adapter-Evidence, nicht davor |
| G-ITEM-OPT | `officialFuerItem` nicht `credentialOptionRef`-scharf | **P3** jetzt / **P2** bei Live-Provider | fail-closed `unknown` bei mehreren Optionen | option-scharfe Badge | nur mit/nach Provider-Evidence; kein `evaluations[0]` |
| G-SUM-DEST | Summary nutzt `destinationCountries[0]` als Metadatum | **P3** | `result` bleibt `unknown` | Multi-Destination-Copy | Summary ohne Default-Ziel |
| G-API-PARTY | Öffentliche API vertraut Client-Party | **NEEDS PRODUCT DECISION** | Guest-Evaluate so designed; Trip-Pfad ist server-graph | Missbrauch bei paid Adapter | Auth-vs-Guest + optional Trip-Load; nicht still ändern |
| G-SAFETY-PARTY | Safety-API `party: []` | **P1 für Safety**, ausserhalb Requirements-Slice | unverändert | travellerabhängige Safety über HTTP | eigener Safety-Slice |
| G-MAP-OPTION | Kein Vendor liefert öffentlich 1:1 Credential-Optionen | **PROVIDER-ACTIVATION-GATE** | Port ist bereit; Vendor-Shape unbelegt oder abweichend | saubere Multi-Document-Truth | Auswahl + Mapping-Spec **nach** Vertrag; sonst `unknown` |
| G-MAP-ISO | ISO-2 vs ISO-3 | **P1 bei Sherpa-artigem Adapter** | Jetnity ISO-2 | stilles Land-Mismatch | explizites Mapping; unbekannte Codes fail-closed |
| G-MAP-ORIGIN-NAT | Vendor empfiehlt Nationalität aus Origin, wenn Pass unbekannt | **P1** / **PROVIDER-ACTIVATION-GATE** | Jetnity: keine Default-Citizenship; keine Ableitung aus Origin oder Residence; fehlen → `unknown` / `insufficient_context`. Sherpa-Tutorial E-SHERPA-4 empfiehlt Origin-Nationalität | falsche Visa-/Entry-Hard-Truth | Jeder spätere Sherpa-Adapter muss diese Empfehlung **ignorieren/ablehnen** und darf Nationalität niemals aus Origin synthetisieren. Mapping-Spec + Activation-Gate müssen das festhalten |
| G-MAP-TRANSIT | Vendor-Transit ≠ Foundation-D-Transit | **PROVIDER-ACTIVATION-GATE** | Route Truth nur Flight-Itinerary | falsche Transit-Visa-Aussage | Vendor-Transit nur gegen belegte Route Facts; Rest `unknown` |
| G-ANCILLARY | eVisa/PRODUCT/landing URL | **PROVIDER-ACTIVATION-GATE** | Commercial ≠ Official | Kauf-Link als „Visa nicht nötig/nötig“ | PRODUCT niemals in `OfficialEvaluation.result` |
| G-PII | Vendor verlangt Nummer/MRZ/Scan/DOB | **PO-GATE** | Kernmodell ohne diese Felder | Privacy/Legal | nicht implementieren; Produkt ablehnen oder extra Gate |
| G-SECRET | API-Key / RSA / App-ID | **PO-GATE** | keine Secrets | Leak / Kosten | server-only Core; kein Client-Key |
| G-CONTRACT | Kein Vendor-Vertrag | **PO-GATE** | — | jede Aktivierung | PO; Agent darf nicht signup/contact |
| G-DOCS-DRIFT | Build-Order/Account-Plan vs live S5-B/AP-7 | **P3** | Code gewinnt | Continuity | Technical-Lead Current-State nach Merge dieses Audits |

---

## 3. Was **kein** Gap ist

| Thema | Warum kein Gap |
| --- | --- |
| Fehlender konkreter Adapter | verbindliche Reihenfolge; Factory `null` ist korrekt |
| Foundation C/E Port und Engine | vorhanden und fail-closed getestet |
| `documents[0]` / Default-Pass | geschlossen (P2-TA-06) |
| `evaluations[0]` als Hard Truth | geschlossen (ADR-0167) |
| Adapter Core fehlt | ADR-0199 integriert; ungenutzt, weil kein Adapter |
| S1 Ops-Hülle fehlt | an Readiness-Request verdrahtet |
| S5-B Commercial Persistenz fehlt | integriert; Writer geschlossen — andere Wahrheit |
| Account Registry fehlt vollständig | Tabellen + opt-in Snapshot-Kopie existieren; Evaluate liest sie bewusst nicht |

---

## 4. Kleinster späterer Slice — Proposal only

**Nicht starten.** Neuer versionierter Auftrag und neue Agenten-Generation erforderlich.

### Empfehlung

**Name (Vorschlag):** Requirements Truth-Ops S4-R1  
**Art:** Runtime, Jetnity-seitig, **kein** Vendor, **kein** Factory-Flip  
**Warum zuerst:** schliesst G-S4-TIMEOUT, G-S4-KILLSWITCH und G-S4-TTL, bevor irgendjemand einen Regulatory-HTTP-Call verdrahten oder alte Evidence als `current` Hard Truth belassen kann. S1-Form und Safety/Seasonal-Muster existieren bereits. Binding Build Order führt S4 nach S1–S3/S5-B.

**Scope-Skizze:**

1. `RequirementsProvider.evaluate(anfrage, signal?)`
2. Engine-Timeout + `AbortSignal` analog Safety/Seasonal (offline Tests, injizierter Clock/Provider)
3. `JETNITY_READINESS_AKTIV` über `providerOpsZustand`; Production bleibt `aktiv: false`
4. Throw vs Abort vs `temporarily_unavailable` ehrlich trennen
5. Factory bleibt `null`
6. **Bounded Freshness-/TTL-Policy** für Jetnity-`checkedAt` (provider-/vertragssensitiv wo nötig). Fail-closed nach `recheck_needed` / non-current, wenn Freshness nicht begründet werden kann. Jetnity-`checkedAt` (evaluation/retrieval time) **nicht** still mit Vendor-`lastUpdatedAt` / source-update vermischen. Numerische TTL darf bis Vertrag konservativ/default bleiben; „kein TTL“ ist kein akzeptabler Default. **Nicht in diesem Audit implementiert.**

**Nicht enthalten:**

- Vendor-Auswahl, Signup, Secret, paid call
- `requirementsProviderAus()` ≠ `null`
- Commercial Provenance, `live_api`, `persisted_snapshot`
- TW-8 / TW-9
- Workspace-Orchestrierung echter Evaluations
- `officialFuerItem`-Option-Scope
- Body-Cap-Änderung ohne Messung
- Safety-Party-Load
- Legal-Copy
- globale Current-State-Dateien, ausser der Technical Lead sie nach Review selbst zieht

### Alternativen, bewusst **nicht** als nächster Slice empfohlen

| Alternative | Warum nicht zuerst |
| --- | --- |
| Timatic-/Sherpa-Adapter | Vertrag, License, PII, Mapping `unknown`; G-MAP-ORIGIN-NAT und G-S4-TTL offen; Activation-Gates offen |
| Docs-only Vendor-Auswahl-Memo | nützlich **nach** TL-PASS dieses Audits, aber schliesst kein Timeout-Loch |
| Workspace serverseitig evaluieren | ohne Provider nur `unknown`; aufgebläht |
| S6 persistenter Cost Guard | DB/PO-Gate; erst vor paid calls |
| S8 License-Hooks | parallel möglich nach S1; wird P1 erst mit Vertrag |

### Product-Owner-Gates, die dieser Vorschlag **nicht** öffnet

Vertrag, Secret, paid call, Live-Aktivierung, sensitive Felder, Production-Writer, Public Launch, TW-8.

---

## 5. Reihenfolge, falls später bewusst geschnitten wird

```text
Dieser Gate-0-Audit
        │
        ▼
TL Exact-Head Review → ggf. CHANGES REQUIRED → PASS → TL-only Ready/Merge
        │
        ▼
S4-R1 Readiness Truth-Ops          ← kleinster Jetnity-seitiger Slice
        │
        ├─ PO: Vendor-Familie + Vertrag/License/PII/DPA   ← eigenes Gate
        ├─ S8 License-Hooks sobald Vertragstext existiert
        └─ S6 Cost Guard vor erstem paid call
                │
                ▼
Adapter-Mapping-Spec (docs) → Offline-Double → Factory bleibt null
                │
                ▼
Erst danach gegatete Preview-Aktivierung
```

Kein Schritt nach dem Audit ist durch diesen Slice autorisiert.
