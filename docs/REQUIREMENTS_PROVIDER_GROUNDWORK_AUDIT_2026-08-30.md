# Requirements Provider Groundwork – Current Contract Audit

Stand: 30. August 2026  
Typ: **AUDIT-ONLY / PROVIDER-NEUTRAL / NO LIVE ACTIVATION / DOCS-EVIDENCE**  
Status: **CHANGES REQUIRED REVIEW-FIX / NOT PASS / STOP FOR RE-REVIEW**  
Cursor-Agent: **`Jetnity requirements provider groundwork 1`**  
Session: `bc-77badb21-f262-4ee2-86ce-f71a5aa1f051` (gleiche Generation; kein neuer Slice)  
Issue: #288  
Draft-PR: https://github.com/Jetnity/jetnity/pull/289  
Branch: `audit/requirements-provider-groundwork-g0-2026-08-30`  
Task: `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_GATE0_TASK_2026-08-30.md`  
Task-Baseline: `main@60e12dd5cf0916708e0bc87219b233861b387e7d`  
Review-Fix: Technical-Lead comments **#5471442167** (CR-1–CR-4) und CR-5 (Transit-Kapazität) gegen Head `9caa1a0ff45eeea27bc042d75e736dcb17bd589d`; CR-1–CR-4 bereits auf `df2925e5` / `71d531dd`

> Agent-Self-Review ist kein Technical-Lead PASS. Kein Ready. Kein Merge. Kein Folgeslice.  
> Kein Provider ist gewählt. Marketing-/Docs-Aussagen sind weder Vertrag noch Commercial-/License-Truth.  
> `unknown` bleibt `unknown`.

`docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` und andere globale Current-State-Dateien wurden **absichtlich nicht** geändert. Continuity dieses Blocks lebt in den sechs task-spezifischen Dateien.

---

## 0. Methode

Rekonstruiert gegen **aktuellen Code** auf der Task-Baseline, nicht gegen Chat-Erinnerung und nicht gegen historische S4-Docs als Current Truth.

Evidence-Klassen in diesem Paket:

| Klasse | Bedeutung |
| --- | --- |
| `repository_code` | aktueller Code auf dieser Baseline |
| `repository_docs` | Repository-Dokument; Historical Evidence, wenn der Code widerspricht |
| `live_github` | GitHub-API in diesem Lauf |
| `public_docs` | öffentliche Vendor-Produktseite |
| `public_api_docs` | öffentliche Vendor-API-Dokumentation |
| `public_marketing` | Marketing-/Uptime-/Accuracy-Claims |
| `third_party_commentary` | Blog, Scraper, inoffizielle Wrapper |
| `unknown` | nicht belegt |

Keine echten oder paid Provider-Calls. Keine Vendor-Kommunikation. Keine Secrets.

---

## 1. Live-Precheck

Verifiziert in diesem Authoring-Lauf, 30. August 2026.

| Prüfung | Live-Stand | Klasse |
| --- | --- | --- |
| Task-Baseline | `60e12dd5cf0916708e0bc87219b233861b387e7d` — `Docs: post-cleanup Technical Lead checkpoint (#285)` | `live_github` |
| `origin/main` nach Fetch | **identisch** `60e12dd5` | `live_github` |
| Merge-Base `HEAD` ↔ `origin/main` | `60e12dd5` | `live_github` |
| Ahead / Behind bei erstem Authoring | **1 / 0** (nur Task-Commit `daa91927`) | `live_github` |
| Review-Fix-Start-Head | `9caa1a0ff45eeea27bc042d75e736dcb17bd589d` | `live_github` |
| Ahead / Behind vor diesem Review-Fix | **5 / 0** vs `origin/main@60e12dd5` | `live_github` |
| Draft-PR | [#289](https://github.com/Jetnity/jetnity/pull/289) OPEN / Draft | `live_github` |
| Issue | [#288](https://github.com/Jetnity/jetnity/issues/288) OPEN | `live_github` |
| Überlappender Requirements-/Readiness-Provider-Workstream | **keiner** ausser diesem Draft | `live_github` |
| Andere offene PRs | #52, #50, #40, #39, #28 — ältere Drafts, anderer Scope | `live_github` |
| Supabase in diesem Run | **nicht** abgefragt, **nicht** mutiert | `unknown` (absichtlich) |
| Provider / Secrets / paid calls | nicht angelegt, nicht aufgerufen | `repository_code` |
| Session-Rename | keine programmierbare Rename-Fähigkeit exponiert; UI-Name nicht als geändert behauptet | — |

`main` ist seit Task-Baseline **nicht** weitergelaufen. Review-Fix ändert nur die sechs Agent-Deliverables. Kein Ready. Kein Merge.

Docs-vs-Live-Widersprüche, die diesen Slice betreffen, aber **nicht** in globale Dateien korrigiert werden:

| Quelle | Behauptung | Current Truth auf dieser Baseline |
| --- | --- | --- |
| `docs/JETNITY_BINDING_BUILD_ORDER.md` §4 | S5-B Persistenz in Draft-PR #182, nicht Production | S5-B Persistenz ist integriert und Production-apply-verifiziert; Runtime-Writer bleibt geschlossen (`docs/PROVIDER_S5B_PERSISTENCE_STATUS_2026-08-29.md`) |
| `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` | S3 noch auf Feature-Branch; S4 startet nicht ohne S3-Review | S1–S3 und S5-A/S5-B Persistenz liegen auf `main`. S4 Runtime bleibt **ungebaut** |
| `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` | AP-7 Persistenz fehlt; S1 self-expiring auf Draft-PR #145 | Account-Registry-Tabellen und `registryTravellerInReiseUebernehmen` existieren im Tree. Readiness liest die Registry **nicht** als Evaluate-Input |
| `docs/TRAVEL_READINESS.md` §Noch offen | Foundation E noch Draft; Production unverändert | Foundation E ist auf `main` / Production-Acceptance. Der Absatz ist historische Evidence |
| `docs/ACTIVE_WORK_STATUS.md` | kein aktiver Cursor-Agent | Dieser Slice ist der aktive Audit-Block; globale Datei bleibt Technical-Lead-owned |

---

## 2. Current Contract – Requirements / Readiness

### 2.1 Port

Quelle: `lib/readiness/provider.ts`. Klasse: `repository_code`.

```ts
RequirementsProvider = {
  name: string
  evaluate(anfrage: RequirementsAnfrage): Promise<RequirementsProviderZeile[]>
}
```

`requirementsProviderAus()` gibt **immer** `null` zurück. Es gibt kein `AbortSignal`, kein Timeout-Argument, kein Domain-Flag.

`RequirementsAnfrage`:

| Feld | Typ | Semantik |
| --- | --- | --- |
| `originCountryCode` | ISO-2 oder `null` | nur aus Foundation-D-Itinerary, nie aus Ortsnamen |
| `destinationCountryCodes` | ISO-2[] | Stages + Route-Destinations |
| `transitCountryCodes` | ISO-2[] | nur belegte Flight-Itinerary-Transits. Öffentliches Request-Schema (`lib/readiness/schema.ts`) erlaubt **max. 12**. Engine bewertet **jedes** angefragte Transitland separat. Das ist Jetnity-Route-Truth, kein Vendor-Cap |
| `startDate` / `endDate` | `YYYY-MM-DD` oder `null` | Trip-Daten |
| `travellers[]` | siehe unten | 1:n Citizenships, 1:n Documents, 1:n Credential-Optionen |

`RequirementsTravellerInput`:

| Feld | Semantik |
| --- | --- |
| `clientRef` | stabile Traveller-Ref, typisch `traveller:N` |
| `residenceCountryCode` | Wohnsitz; **nicht** Citizenship |
| `citizenshipCountryCodes` | volles Peer-Set, keine Primary |
| `documents[]` | Typ `passport \| national_id \| unknown`, Issuer, Ablauf, optionale Citizenship-Relation |
| `credentialOptions[]` | eine Option je Dokument, sonst `${clientRef}:none` |

`RequirementsCredentialInput` trägt `relatedCitizenshipCountryCode` **nur** aus der gespeicherten Document↔Citizenship-Relation. Issuer Country ist kein Citizenship-Ersatz.

`RequirementsProviderZeile` (Outbound-Zeile → Engine):

| Feld | Pflicht für Hard Truth |
| --- | --- |
| `travellerClientRef` | ja, muss matchen |
| `credentialOptionRef` | ja, sobald mehr als eine Option existiert; fehlt es, gilt die Zeile nur bei genau einer Option |
| `destinationCountryCode` | ja für Ziel-Typen |
| `transitCountryCode` | ja für `requirementType === 'transit'` |
| `requirementType` | eines von `OFFICIAL_REQUIREMENT_TYPES` |
| `result` | `required \| not_required \| conditional \| unknown \| insufficient_context` |
| `officialClass` | Health-Typen dürfen `requirement \| recommendation \| advisory \| unknown`; sonst nur `requirement` oder `unknown` |
| `optionEligibility` | `allowed \| not_allowed \| unknown`; nur hinter Trust+Freshness=`current` |
| `optionMandate` | `mandatory \| not_mandatory \| unknown`; nur hinter derselben Grenze |
| `authority` / `ruleReference` | mindestens eines für Trust |
| `sourceUrl` | optional für Resultat; HTTPS; Pflicht für Official Action |
| `checkedAt` | ISO-UTC; Pflicht für Trust; max. 5 min Zukunft-Skew |
| `validFrom` / `validUntil` | Datum oder ISO-UTC; ungültig → fail-closed `never_checked` |
| `availability` | `ok \| temporarily_unavailable` |
| `missingFacts` | Allowlist; Engine filtert Fakten, die bereits vorliegen |

Nicht im Port und **bewusst nicht** übertragbar: Passnummer, MRZ, Scan, Bild, Biometrie, DOB, Health-Akte, gesetzlicher Name, Visa-Nummer.

### 2.2 Requirement-Granularität

Die Engine materialisiert:

> **Traveller × Credential-Option × Destination × Requirement-Type × (Transitland, nur bei `transit`)**

Typen (`types/trips.ts` `OFFICIAL_REQUIREMENT_TYPES`):

`visa`, `electronic_travel_authorization`, `passport`, `identity_document`, `passport_validity`, `transit`, `health`, `vaccination`, `health_document`, `entry_form`, `insurance`, `onward_or_return_ticket`, `booking_or_travel_document`, `other_entry_requirement`.

Ohne Provider-Zeile entsteht eine leere Evaluation (`result: unknown`, `freshness: provider_unavailable` bzw. `insufficient_context` bei Missing Facts). Teilweise fehlende Transit-Zeilen erzeugen **pro angefragtem Transitland** eine eigene Evaluation; unangefragte Transitländer aus Provider-Antworten werden ignoriert.

Konflikt gleicher Schlüssel (`traveller|option|destination|type|transit`) mit unterschiedlicher Entscheidung → beide werden zu `freshness: recheck_needed`, `result: unknown`. Das ist keine First-Row-Wahrheit.

### 2.3 Inputs: woher sie wirklich kommen

| Input | Trip-Snapshot-Pfad (`requirementsAnfrageAusReise`) | Untrusted API-Pfad (`POST /api/readiness/requirements`) | Account Registry |
| --- | --- | --- | --- |
| Origin / Transit | `routeFactsAusGraph` / `readinessReisekontext` — nur Flight-Itinerary | Client-Body, Zod-landescode; **kein** serverseitiger Trip-Load | nicht gelesen |
| Destinations | Stages + Route-Destinations | Client `destinationCountryCode(s)` | nicht gelesen |
| Daten | `trip.startDate` / `endDate` | Client-Daten | nicht gelesen |
| Party | `travellerSlots(reise)` → nur `applicable` Slots `traveller:1..N` | Client-`party` via `travellerAnfrageStriktLesen`; malformed → 400, Evaluate nicht erreicht | nicht gelesen |
| Citizenships / Documents / Options | `credentialOptionsAus` + `documentCitizenshipCode` | dieselben Funktionen nach striktem Parse | nur nach **expliziter** Snapshot-Kopie (`registryTravellerInReiseUebernehmen`) |

Current Truth einer konkreten Reise bleibt der **Trip Snapshot**. Die Account Registry ist Wiederverwendungsquelle, nicht Evaluate-Authority. `KontoArbeitsbereich` / `GastArbeitsbereich` übergeben **keine** `officialEvaluations` an `TripWorkspace`. Production-Workspace fällt lokal auf `requirementsLokalFuerReise` zurück (Factory `null` → alle Officials `unknown`).

### 2.4 Was bewusst nicht persistiert oder übertragen wird

| Fläche | Current Truth |
| --- | --- |
| Official Evaluations | compute-on-read; keine Official-Tabelle |
| `trip_readiness_items` | nur User-Evidence `evidence: 'user'` |
| Legacy-`official` | immer `result: 'unknown'`; keine `evaluations[0]`-Wahrheit (ADR-0167) |
| Sensible Identität | Parser weist Keys wie `passportNumber`, `mrz`, `scan`, `biometric`, `date of birth` ab |
| Commercial Provenance | anderer Vertrag; kein Official-Mint |
| LLM-/Browser-Felder `officialResult` / `llmResult` / `result` | werden voided, setzen keine Truth |

### 2.5 Missing Facts, Status, Freshness

Engine-Kernfakten (`fehlendeFakten`): `nationality`, `destination_country`, `travel_dates`, und für Transit `transit_itinerary`.

Residence, Document-Typ, Issuer und Ablauf werden **nicht** automatisch als fehlend markiert. Der Provider darf sie in `missingFacts` setzen; die Engine übernimmt sie nur, wenn der Fakt im Request tatsächlich fehlt.

`OfficialStatus`: `unavailable` | `insufficient_context` | `unknown` | `current`.  
`OfficialFreshness`: `never_checked` | `current` | `recheck_needed` | `stale` | `provider_unavailable` | `source_temporarily_unavailable`.

Trust-Grenze (`officialEvidenceVertrauenswuerdig`): Provider-Name + plausibles `checkedAt` + (Authority **oder** Rule Reference). `checkedAt` muss existieren und darf höchstens **5 Minuten** in der Zukunft liegen (`CHECKED_AT_SKEW_MS`). Das ist **nur** eine Clock-Skew-Prüfung, **keine** Höchstalter-/TTL-Prüfung.

Untrusted Evidence darf Freshness nicht `current` lassen (ADR-0111). Hard Truth (`required` / `not_required` / `conditional`) nur bei Trust **und** `freshness === 'current'`.

`optionEligibility` / `optionMandate` folgen derselben Grenze. Unbekannte Werte → `unknown`. Vergleich (`credentialOptionenVergleichen`) entscheidet nur bei `status=current` und `freshness=current`. `result=required` bedeutet nicht, dass genau dieses Credential zwingend ist.

#### 2.5.1 Current-Code Freshness (`officialFrische`) — CR-1

Quelle: `lib/readiness/official.ts` `officialFrische()`. Klasse: `repository_code`. Geprüft 30. August 2026 gegen `main@60e12dd5`.

Aktuelle Reihenfolge, vollständig:

1. kein Provider → `provider_unavailable`
2. `sourceAvailable === false` → `source_temporarily_unavailable`
3. kein `checkedAt` → `never_checked`
4. gespeicherter Fingerprint ≠ aktueller Fingerprint → `stale`
5. `validFrom` in der Zukunft → `never_checked`
6. `validUntil` in der Vergangenheit → `recheck_needed`
7. **sonst `current`**

Es gibt **keine** maximale Alter-/TTL-Prüfung für `checkedAt`. Bei unverändertem Fingerprint und `validUntil == null` kann sehr alte Provider-Evidence dauerhaft `freshness: current` bleiben. Trust verlangt weiterhin ein plausibles `checkedAt` (nicht jenseits 5 min in der Zukunft), aber ein Monate altes `checkedAt` bleibt trusted und `current`, solange Authority/RuleRef und Fingerprint halten.

Das ist material Official-Truth-Verhalten, nicht nur ein generisches Activation-Risiko. Gap: `G-S4-TTL` (**P1** / **PROVIDER-ACTIVATION-GATE**). Der vorgeschlagene spätere Slice S4-R1 muss eine begrenzte Freshness-/TTL-Policy festlegen (provider-/vertragssensitiv wo nötig) und fail-closed nach `recheck_needed` / non-current gehen, wenn Freshness nicht begründet werden kann. **Nicht in diesem Audit implementiert.**

#### 2.5.2 Semantik: Jetnity `checkedAt` ≠ Vendor `lastUpdatedAt`

Ungelöste semantische Frage; ein späterer Adapter darf die beiden Zeiten **nicht still vermischen**:

| Zeitstempel | Bedeutung |
| --- | --- |
| Jetnity `checkedAt` | Zeitpunkt der **Auswertung / des Abrufs** durch Jetnitys Adapter (evaluation/retrieval time) |
| Vendor `lastUpdatedAt` / source-update | Zeitpunkt, zu dem der Vendor die **Regelquelle** zuletzt geändert oder publiziert haben will |

Ein Vendor-`lastUpdatedAt` darf nicht still als Jetnity-`checkedAt` gemintet werden. Ein frisches Retrieval einer alten Vendor-Regel und ein altes Retrieval einer „aktuell“ markierten Regel sind verschiedene Aussagen. Die bounded TTL-Policy muss diese Unterscheidung erhalten. Die genaue numerische TTL bleibt bis Vertrag `unknown`; „kein TTL“ ist nach S4-R1 kein akzeptabler Default.

### 2.6 Hard-Truth-Authority

Nur eine injizierte `RequirementsProvider`-Implementierung plus Trust Gate darf Official Hard Truth erzeugen.

Nicht Authority:

- Browser / Guest Local Storage
- User-Häkchen in `trip_readiness_items`
- LLM / Assistant
- Account Registry
- Commercial Provenance / Offer-Preise
- Route Facts (liefern nur Länderkontext)
- `documents[0]` / `evaluations[0]` / Default-Citizenship
- Safety- oder Seasonal-Facts

### 2.7 API- und Ops-Hülle

`POST /api/readiness/requirements`:

- `application/json`
- Body-Cap **8192** Bytes (Content-Length + Stream)
- In-Memory Cost Guard über `provider-ops`: 20 / 10 min, 80 / Tag
- `Cache-Control: private, no-store`
- `maxDuration = 10` (Edge), **kein** Provider-`AbortSignal`
- HTTP 200 + Body-Status für orchestrierte Evaluate-Zustände; 429 + `Retry-After`; 413/415 für Härtung
- Antwort: `{ status, evaluations, official, message }` — kanonisch ist `evaluations[]`

S1 `lib/provider-ops` ist an der Readiness-Hülle verdrahtet (Request-Härtung, Rate-Limit-Form). Die Route schreibt **kein** `providerOpsEvent`. Es gibt kein `JETNITY_READINESS_AKTIV`.

---

## 3. Multi-Citizenship / Multi-Document

Verbindliche Invariante, gegen aktuellen Code geprüft:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

| Prüfung | Ergebnis | Evidence |
| --- | --- | --- |
| Kein Default-Pass | **hält** | `credentialOptionsAus` eine Option je Dokument; leer → `:none`; P2-TA-06 / ADR-0178 |
| Keine Default-Citizenship | **hält** | Peer-Array; keine `primary*`/`default*` im Domain-Typ |
| Issuer ≠ Citizenship | **hält** | Relation nur `citizenshipClientRef`; Legacy-Dokument `null` |
| Kein `documents[0]` als Truth | **hält** im kanonischen Pfad | `travellerNormalisieren` expandiert alle Documents, kollabiert nicht |
| Kein `evaluations[0]` als Hard Truth | **hält** | `officialAusEvaluations` immer `result: unknown`; nur uniformer Scope darf Authority/URL zeigen |
| Residence ≠ Citizenship | **hält** | getrennte Felder; Citizenship-Policy verbietet Ableitung |
| Keine Nationalität aus Origin/Residence | **hält** im Jetnity-Code | fehlende Nationalität bleibt `unknown` / `insufficient_context`; Sherpa-Tutorial empfiehlt das Gegenteil — **verbotener** Adapter-Fallback (`G-MAP-ORIGIN-NAT`) |
| Optionen separat evaluierbar | **hält** | Engine-Schleife + `optionPasst` |
| Transit pro Land | **hält** | eigene Evaluation je angefragtem Transitland |
| Fehlende Facts fail-closed | **hält** | `insufficient_context` / `unknown` |
| Jede Option trägt das **volle** Citizenship-Set | **partial** | `credentialOptionsAus`; option-scharf ist nur `relatedCitizenshipCountryCode` |
| `officialFuerItem` nicht option-scharf | **partial / fail-closed** | filtert Traveller+Land; mehrere Optionen → Legacy-`official` `insufficient_context` |
| Production-Workspace ohne serverseitige Evaluations | **partial** | lokaler Fallback, Factory `null` |

Kein Befund in diesem Slice rechtfertigt, Default-Pass, Default-Citizenship oder `documents[0]` einzuführen.

---

## 4. Historical S4 Reconciliation

Historische Quelle: `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` PR-S4 und `docs/PROVIDER_S4_S8_PROVENANCE_AUDIT.md`. Das ist **kein** Startauftrag.

| S4-Punkt | Klassifikation | Current Truth 30. August 2026 |
| --- | --- | --- |
| `RequirementsProvider.evaluate(..., signal?)` + explizites Timeout | **CURRENT / STILL NEEDED** | Port hat kein Signal. Safety/Seasonal haben 4 s + `AbortSignal`. Route `maxDuration=10` ist keine Provider-Grenze. Throw → catch → `unknown` / `source_temporarily_unavailable` |
| `JETNITY_READINESS_AKTIV` / Safety / Seasonal Flags | **CURRENT / STILL NEEDED** (erst wenn Factory ≠ `null`) | S1-Form `providerOpsZustand` existiert. Readiness benutzt sie nicht. Heute reicht Factory `null` als einzige Bremse |
| Serverseitiger Party-Load | **ALREADY INTEGRATED** für Trip-Graph; **STILL NEEDED** nur für Safety-API; **NEEDS PRODUCT DECISION** für die öffentliche Readiness-API | `requirementsAnfrageAusReise` lädt Party aus dem Trip. Die öffentliche Requirements-API akzeptiert Client-`party` (Guest-Evaluate). Safety-API setzt weiter `party: []` |
| Body-Cap / Multi-Traveller 8 KB vs 24 KB | **CURRENT / STILL NEEDED** | Cap 8192 unverändert. 20 Traveller × 8 Citizenships × 12 Documents kann den Cap reissen, bevor die Engine bewertet. Nicht gemessen mit Live-Payloads in diesem Audit |
| Error-/Outcome-Semantik | **PARTIAL / STILL NEEDED** | Fachzustände sind reif. Technisches Timeout ist nicht vom generischen Throw unterscheidbar. S1-Outcomes existieren, Readiness-Route mappt sie nicht |
| Observability | **CURRENT / STILL NEEDED** | `providerOpsEvent` existiert. Readiness schreibt ihn nicht |
| Cache / Licensing Defaults | **CURRENT / STILL NEEDED** | `no-store` vorhanden. Keine `cacheClass` / Attribution / Redisplay-Hooks. Default bleibt `forbidden`, bis ein Vertrag geprüft ist. Öffentliche Sherpa-Cache-Guidance (1 h) ist **kein** Jetnity-Lizenzvertrag |
| Bounded `checkedAt` Freshness / TTL | **CURRENT / STILL NEEDED** | `officialFrische()` prüft Fingerprint/`validFrom`/`validUntil`, **kein** Höchstalter für `checkedAt`. Unveränderter Fingerprint + `validUntil == null` → dauerhaft `current` |
| Adapter-Core-Abgrenzung | **ALREADY INTEGRATED** | `lib/server/providers/core` (ADR-0199) ist Outbound-Transport. Readiness benutzt ihn nicht, weil kein Adapter existiert. Kein UniversalProvider |
| S1 Shared Ops als Abhängigkeit | **ALREADY INTEGRATED** | Readiness-`anfrage.ts` und `rate-limit.ts` nutzen `provider-ops` |
| Timatic-Adapter in S4 | **SUPERSEDED** | S4 war ausdrücklich kein Adapter. Bleibt Non-Scope |
| Safety-Party aus Browser-Citizenship | **CURRENT / STILL NEEDED** für Safety, **ausserhalb** dieses Requirements-Slices | `lib/safety/auswerten.ts` `party: []` |

Nicht automatisch den alten S4-Gesamtauftrag wiederholen. Der kleinste spätere Jetnity-seitige Slice ist in der Gap-Map und im Handoff benannt, **nicht gestartet**.

---

## 5. Architecture Boundaries

| Grenze | Status |
| --- | --- |
| `lib/readiness/*` = fachliche Requirements-Domain | **bestätigt** |
| `lib/server/providers/core/*` = Outbound-HTTP-Transport, keine Fachwahrheit | **bestätigt** |
| `lib/provider-ops/*` = Inbound-Ops (Härtung, Cost-Guard-Interface, Outcome-Typ) | **bestätigt** |
| Commercial Provenance ≠ Official Requirements Truth | **bestätigt**; S5-B Writer geschlossen; kein `live_api` / `persisted_snapshot` |
| Kein UniversalProvider | **bestätigt** |
| Keine zweite Traveller-/Route-/Commercial-Wahrheit | **bestätigt** |
| LLM/Assistant ist niemals Hard-Truth-Authority | **bestätigt** |

---

## 6. Privacy / Sensitive-Data Boundary

Aktuelles Kernmodell speichert keine Passnummern, MRZ, Scans, Biometrie, DOB oder Health-Akte. Der untrusted Parser weist entsprechende Keys und Label-Muster ab.

Wenn ein späterer Vendor für AutoCheck/APIS/Scan-Produkte solche Daten verlangt, ist das ein **besonderes Product-Owner-Gate**, kein stilles Feld im Port. Dieser Audit schlägt keine neuen sensitiven Felder vor.

Health-/Vaccination-**Requirement-Typen** existieren bereits als Official-Kategorien. Das ist keine persönliche Gesundheitsakte.

---

## 7. Provider-Selection Groundwork – Kurzstand

Ausführliche Matrix: `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`.

Keine Auswahl ist beschlossen. Historische Bevorzugung „IATA Timatic / Timatic AutoCheck“ in `docs/TRAVEL_READINESS.md` bleibt **Kandidat**, nicht Vertrag.

Öffentlich belegte Familien:

1. **Aviation-grade Compliance (IATA Timatic / AutoCheck / Widget, TravelDoc)** — hohe behauptete Regulatory-Abdeckung. Öffentlich sichtbar sind **mehrere Oberflächen derselben Datenbank**: DCS/Scan (AutoCheck, Sabre DCCI), Consumer-Widget (one-way / round-trip / multi-city; Nationalität + Residence + Itinerary als Query-Beispiele) und Timatic Web. Das Widget ist eine **Planungs-Oberfläche**, kein belegter AutoCheck-REST-Vertrag, kein Multi-Citizenship-/Option-Mapping, keine License/Preis/Minimal-PII-Aussage für Jetnity. Commercial/License/API-Shape für Jetnitys `evaluate()`-Port bleibt `unknown`.
2. **Travel-platform Requirements APIs (Sherpa)** — öffentlich dokumentiertes REST-/JSON:API-Trips-Modell, Sandbox-Hostname, Nationalität+Route+Datum; Credential-Option/Issuer/Residence nicht 1:1; öffentliches Tutorial empfiehlt Nationalität aus Origin, wenn der Pass unbekannt ist — **verbotener** Jetnity-Fallback; öffentlich **max. 3 Transit-Nodes** vs Jetnity **12** `transitCountryCodes` — kein 1:1, **kein** silent drop (`G-MAP-TRANSIT-CAP`); Ancillary-eVisa ist Commercial, nicht Official Truth. Öffentliche technische Quota-/Cache-Guidance existiert (Testing 1000/h; FAQ 100 rps / 10 MB; `/trips` `max-age=3600`); **Jetnitys** kontrahierte Production-Quota/Kosten/Lizenz/Redisplay bleiben `unknown` / PO-GATE.
3. **Passport-Index / Ranking-Matrizen (Henley u. a.)** — bewusst Ranking/Mobility, nicht Official Truth; Disclaimer verlangt Verifikation bei Embassy; inoffizielle Endpunkte sind **kein** erlaubter Jetnity-Pfad.
4. **Consumer-Visa-Matrizen / Fulfilment (Visafy, Visamundi, CIBT/Entriva, …)** — strukturierte JSON-Lookups oder Fulfilment-Links; Authority/Freshness/Transit/Multi-Credential öffentlich schwach oder `unknown`; nicht als Hard-Truth-Quelle geeignet ohne Vertrag.

Kein Kandidat darf per Scraping, LLM-Extraktion oder undokumentiertem Website-API angebunden werden.

---

## 8. Pflicht-Risiken

Kein künstliches Hochstufen. Es gibt **keinen aktuellen P0-Incident**: Factory `null`, keine paid calls, keine Official Hard Truth in Production.

| ID | Klasse | Thema |
| --- | --- | --- |
| RPG0-P0-NONE | — | Kein akuter Production-Incident in diesem Scope |
| RPG0-ACT-01 | **PROVIDER-ACTIVATION-GATE** | Falsche Official-/Visa-/Transit-Aussage bei späterem Adapter ohne Trust-Mapping |
| RPG0-ACT-02 | **PROVIDER-ACTIVATION-GATE** | Unvollständiges Multi-Credential-Ergebnis als clean |
| RPG0-ACT-03 | **PROVIDER-ACTIVATION-GATE** | Sehr alte Provider-Evidence als `current`, weil `officialFrische()` **kein** `checkedAt`-TTL hat (unveränderter Fingerprint + `validUntil == null`) |
| RPG0-ACT-04 | **PROVIDER-ACTIVATION-GATE** | Authority/Source fehlend, trotzdem Hard Truth — heute durch Trust Gate verhindert |
| RPG0-ACT-09 | **PROVIDER-ACTIVATION-GATE** | Vendor empfiehlt Nationalität aus Origin/Residence; Jetnity muss das ignorieren/ablehnen (`G-MAP-ORIGIN-NAT`) |
| RPG0-ACT-10 | **PROVIDER-ACTIVATION-GATE** | Vendor-Transit-Kapazität < Jetnity-Request (Sherpa öffentlich 3 Nodes vs 12 Länder); stilles Weglassen erzeugt unvollständige Transit-Truth (`G-MAP-TRANSIT-CAP`) |
| RPG0-ACT-05 | **PO-GATE** | Sensitive-data overcollection (Nummer/MRZ/Scan/DOB/Health) |
| RPG0-ACT-06 | **PO-GATE** | Secret-/Credential-Leak |
| RPG0-ACT-07 | **PO-GATE / S6** | Uncontrolled paid calls; nur In-Memory-Guard |
| RPG0-ACT-08 | **PO-GATE / S8** | Unklare Licensing/Cache/Display-Rechte |
| RPG0-P1-01 | **P1 vor Adapter** | Readiness ohne `AbortSignal`/Timeout — hängender späterer Regulatory-Call |
| RPG0-P1-02 | **P1 vor Adapter** | Kein Domain-Kill-Switch, sobald Factory ≠ `null` |
| RPG0-P1-03 | **P1 vor Adapter / PROVIDER-ACTIVATION-GATE** | Keine bounded Freshness-/TTL-Policy; `checkedAt` darf nicht mit Vendor-`lastUpdatedAt` vermischt werden |
| RPG0-P2-01 | **P2** | 8 KB Body-Cap vs Multi-Traveller |
| RPG0-P2-02 | **P2** | Workspace übergibt keine serverseitigen Evaluations |
| RPG0-P2-03 | **P2** | Keine Readiness-Observability-Events |
| RPG0-P3-01 | **P3 jetzt / P2 bei Live-Provider** | `officialFuerItem` nicht `credentialOptionRef`-scharf |
| RPG0-P3-02 | **P3** | Summary-Metadatum `destinationCountries[0]` |
| RPG0-P3-03 | **P3** | Binding-Build-Order-/Account-Plan-Drift zu S5-B / AP-7 |

Development-/Production-Vertragsdrift: Factory ist in allen Umgebungen `null`. Production-hart-aus für Readiness ist heute die fehlende Factory, nicht ein Flag. Sobald ein Adapter existiert, wäre das ein Drift-Risiko (RPG0-P1-02).

---

## 9. Traveller-Context-Relevanz

Requirements sind **traveller-spezifisch**. Mehrere Citizenships, Documents, Issuer, Residence, Route und Transit können das Ergebnis ändern. Der aktuelle Port modelliert das. Ein späterer Adapter muss option-scharf antworten. Residence, Route und Citizenship bleiben getrennte Wahrheiten.

---

## 10. Was dieser Audit ausdrücklich nicht behauptet

- Kein Anbieter ist gewählt, verworfen oder kontaktiert.
- Kein Vertrag, Secret, Preis oder DPA ist verifiziert.
- S4 ist nicht implementiert und nicht gestartet.
- TW-8 / TW-9 bleiben geschlossen.
- Commercial-Provenance-Writer bleibt geschlossen.
- Dieser Review-Fix ist kein Technical-Lead-PASS. Head `9caa1a0f` blieb Content-Gate **NOT PASS**. CR-5 ist Mapping-/Activation-Gate, kein Auftrag, Route Truth zu kürzen.

---

## 11. Deliverable-Index

| Datei | Inhalt |
| --- | --- |
| diese Datei | Current Contract, S4-Reconciliation, Boundaries, Risiken |
| `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md` | Kandidaten × Vertrag, Evidence-Klassen |
| `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md` | P0–P3 Gaps + kleinster späterer Slice |
| `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_STATUS_2026-08-30.md` | Arbeitsstand dieses Blocks |
| `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_SELF_REVIEW_2026-08-30.md` | Gegenargumente / Unsicherheiten |
| `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_HANDOFF_2026-08-30.md` | Exact Head, Diff, STOPP |
