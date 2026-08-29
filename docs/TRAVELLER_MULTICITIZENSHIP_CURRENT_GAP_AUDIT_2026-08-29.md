# Traveller / Multi-Citizenship Current Gap Audit

Stand: 29. August 2026  
Typ: **CURRENT-STATE AUDIT / DOCS-EVIDENCE ONLY / NO RUNTIME MUTATION**  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity traveller multicitizenship audit 1`**  
Branch: `audit/traveller-multicitizenship-current-gap-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/198  
Task: `docs/TRAVELLER_MULTICITIZENSHIP_CURRENT_GAP_AUDIT_TASK_2026-08-29.md`  
Task-Baseline: `main @ 085c95b22130232c5b5819ef8a4bcc302cc0f52b`

> Agent-Self-Review ist kein Technical-Lead PASS. Kein Ready. Kein Merge. Kein Folgeslice.

`docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `DECISIONS.md` und andere globale Current-State-Dateien wurden **absichtlich nicht** geändert. Der versionierte Task verlangt das, um Konflikte mit parallelen Provider-Reviews zu vermeiden. Continuity dieses Blocks lebt in den vier audit-spezifischen Dateien.

---

## 0. Auftrag und Methode

Ziel: die **aktuelle Repository-Wahrheit** der Traveller-Architektur gegen das verbindliche Modell rekonstruieren und produktweite Restlücken benennen.

Verbindliches Modell (nicht neu erfunden; Checkpoint V2 bestätigt es als etabliert):

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängig bewertete zulässige Optionen.  
> Kein Default-Pass. Keine Default-Staatsbürgerschaft. Ausstellerland ≡ nicht Staatsbürgerschaft.

Methode:

- Live-`origin/main` und Branch-Drift gelesen, nicht aus Chat-Erinnerung.
- Aktueller Code, aktuelle Migrationen, aktuelle Tests und aktuelle ADRs/Statusdateien inspiziert.
- `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md` (26. August 2026) nur als **historische Evidence** behandelt. Befunde wurden nicht übernommen, sondern gegen den aktuellen Head neu hergeleitet.
- Production-Schema wurde in diesem Run **nicht** bei Supabase abgefragt. Production-Aussagen sind Repository-Acceptance-Evidence, nicht frische Live-Katalog-Evidence.

---

## 1. Live-Rekonstruktion

Verifiziert in diesem Authoring-Lauf, 29. August 2026.

| Prüfung | Live-Stand |
| --- | --- |
| Task-Baseline | `085c95b22130232c5b5819ef8a4bcc302cc0f52b` – `Persist provider core post-merge checkpoint` |
| `origin/main` Re-Fetch vor Handoff | `897f8e0b1975eddf96f88e6f2746a11e93eb8fe4` – `Integrate HBX Hotels contract audit` |
| Drift vs Task-Baseline | live `main` ist **9 Commits voraus**; alle 9 sind HBX-Hotels-Audit-Docs. **Keine** Traveller-/Readiness-/Trip-/Safety-/Schema-/UI-Datei geändert |
| Audit-Branch | `audit/traveller-multicitizenship-current-gap-2026-08-29` |
| Merge-Base gegen Task-Baseline | exakt `085c95b2` |
| Ahead / Behind gegen live `origin/main` | **2 / 9** vor dem Test-Evidence-Stamp; dieser Stamp erzeugt einen neueren Head. **Kein Rebase** — Traveller-Flächen identisch zur Baseline |
| Draft-PR | [#198](https://github.com/Jetnity/jetnity/pull/198) OPEN / Draft / MERGEABLE |
| Prior Task-Head Gates | Actions Run `33268269030` SUCCESS; Vercel Preview `3PNsiWMEYDjmSnUDQeYQogkj2P69` SUCCESS — gelten **nicht** für den Stamp-Head |
| `main` Branch Protection | diese Session: API `403` / nicht frisch lesbar; letzte dokumentierte Live-Evidence `protected=false` |
| Supabase in diesem Run | **nicht** abgefragt, **nicht** mutiert |
| Browser / Real-Device | **nein** – Docs-only |
| Mutating Runtime | **keine** |

Parallele Workstreams (nicht verändert):

- Provider-Adapter-Core und Provider-Audits bleiben fremde Drafts.
- Dieser Audit ändert keine Provider-, Runtime-, Migrations- oder globalen Current-State-Dateien.

Authoritative current-state außerhalb dieses Blocks bleibt Checkpoint V2 plus Binding Slice Precheck. Dieser Audit supersediert **nicht** diese Dateien; er liefert nur audit-spezifische Traveller-Gap-Evidence.

---

## 2. Binding model — Current Truth, nicht Redesign

Checkpoint V2 (`docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-29_V2.md` §4) und Binding Build Order §2 behandeln den kanonischen Vertrag als **bereits etabliert**. Dieser Audit inventarisiert Restlücken gegen diesen Vertrag. Er erfindet keinen zweiten Traveller-Vertrag.

Harte Regeln, gegen die geprüft wurde:

1. Mehrere Staatsbürgerschaften sind Peer-Fakten; keine stille Primary-Rangfolge.
2. Mehrere Dokumente sind Peer-Credentials; Eignung ist kontextabhängig.
3. Ausstellerland ist nicht automatisch Staatsbürgerschaft.
4. Pass↔Citizenship nur über gespeicherte/evidenzierte Relation.
5. Fehlende Fakten bleiben `unknown` / `insufficient_context`.
6. Kein Schatten-Traveller aus Provider-/Search-Daten.
7. Kommerzielle Search-Wahrheit bestimmt keine Einreise-/Eligibility-Wahrheit.
8. Account-Registry und Trip-Snapshot folgen dem genehmigten Dual-Authority-Vertrag; keine erfundenen Merge-Regeln.

---

## 3. Was sich seit dem 26-August-Audit geändert hat

`docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md` bleibt zeitgebundene Evidence vom 26. August 2026. Die folgende Delta-Tabelle ist **neu hergeleitet**, nicht kopiert.

| 26-Aug-Befund | Current Truth 29. August 2026 | Evidence |
| --- | --- | --- |
| `documents[0]` in `travellerNormalisieren` als latentes P2-TA-06 | **geschlossen.** Eine Option je Dokument; leeres `credentialOptions` kollabiert nicht auf das erste Dokument | PR #113 / ADR-0178; `lib/readiness/engine.ts` `travellerNormalisieren`; `engine.test.ts` „zwei Dokumente … nicht documents[0]“ |
| Official-Zusammenfassung nimmt `evaluations[0]` als Wahrheit (P1-TA-02) | **geschlossen.** Legacy-`official` ist permutationsstabil und fail-closed; Hard Truth bleibt `evaluations[]`; `result` immer `unknown` ohne Provider | PR #84 / ADR-0167; `officialAusEvaluations` / `officialFuerItem`; `official-option-scope.test.ts` |
| Account-Plan fehlt auf `main` | **geschlossen.** Kanonischer Plan liegt auf `main` | PR #117; `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` |
| AP-7 „kein gebauter Contract“ | **teilweise überholt.** Gate 0 + Dual-Authority-Freigabe + S1 Domain-Contract sind integriert. Persistenz/UI fehlen weiter | PR #144 / #145; `lib/traveller/account-registry.ts`; PO-Approval |
| Account-Plan-Datei nur auf PR #39 | **historisch.** PR #39 ist nicht Current Truth | P2-TA-03 / PR #117 |
| Foundation E Production unsicher / ADR-Development-Text | **Repository-Acceptance: auf Production.** Dieser Agent hat Supabase nicht selbst abgefragt | `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`; Checkpoint V2 §4; C1 Production `20260828015304` |

Offen geblieben und **aktuell bestätigt**:

- keine account-scoped Traveller-Tabellen;
- keine Registry-CRUD/UI;
- keine Runtime-Materialisierung Registry→Trip;
- Requirements-Provider bleibt `null`;
- Legacy-Singularspalten existieren weiter als Compatibility.

---

## 4. Current architecture

### 4.1 Trip-scoped Foundation E — implemented

| Ebene | Current Truth | Evidence |
| --- | --- | --- |
| Parent | `public.trip_travellers` | `supabase/migrations/20260822020000_trip_travellers.sql`; `types/supabase.ts` |
| Citizenships | `public.trip_traveller_citizenships`, 1:n, unique Land, max 8 | `20260822160000_traveller_context_intelligence.sql`; C1-Trigger auch auf UPDATE |
| Documents | `public.trip_traveller_documents`, 1:n, Typ `passport\|national_id\|unknown`, max 12 | dieselbe Migration; optionales `citizenship_id` |
| Domain | `TripTraveller.citizenships[]` + `documents[]`; keine accountweiten Profile | `types/trips.ts` L186–200, L410–414 |
| Relation | `citizenshipClientRef` / `citizenship_id`; nicht über Issuer | `documentCitizenshipCode`; Migration `20260822180000` neutralisiert Issuer=Nationalität-Backfill |
| Write | `party_schreiben` / `party_loeschen`; keine direkten Child-DML in der App | `lib/readiness/reisende-aktionen.ts`; P2-TA-04 Inventory-Test |
| Legacy-Spalten | `nationality_country_code`, `document_*` auf Parent, **DEPRECATED compatibility-only** | Migration-Kommentare; `reisende.ts` unterdrückt sie, wenn Children geladen sind |
| Kopfzahl | `trips.travellers` ist 1–20, keine Identität | `types/trips.ts`; `party.ts` |

Account-Writes gehen über `party_schreiben`. Die Funktion löscht Children je Traveller und schreibt sie neu. Legacy-Singularspalten werden dabei **nicht** geschrieben.

### 4.2 AP-7 Dual-Authority — contract only

| Deliverable | Present on current `main`? |
| --- | --- |
| Gate-0 Architecture + ADR-0186 | ja |
| Product-Owner Dual-Authority approval | ja |
| S1 Domain-Contract `AccountRegistryTraveller` + fail-closed Reader/Projection | ja, `lib/traveller/account-registry.ts` |
| Account-Registry-Tabellen / RLS / Migration | **nein** |
| App-/API-Wiring | **nein** — `accountRegistry*` nur in `lib/traveller/*` |
| Runtime-Merge Registry ↔ Trip | **nein** — nur explizite Einweg-Projektion mit trip-eigenen UUIDs |

Das ist genau der genehmigte Dual-Authority-Stand: Registry-Fakten dürfen existieren, sobald Persistenz kommt; die Current Truth einer konkreten Reise bleibt der Trip-Snapshot. S1 erzeugt keinen Default-Pass und lehnt `primary*` / `default*` / `preferred*` Schlüssel ab.

### 4.3 Readiness / Official

- `credentialOptionsAus` erzeugt eine Option je Dokument, sonst `${clientRef}:none`.
- Die Engine bewertet `traveller × option × destination × type` getrennt.
- `relatedCitizenshipCountryCode` kommt nur aus der gespeicherten Document↔Citizenship-Relation.
- `requirementsProviderAus()` ist in Production/Preview **immer `null`**.
- Legacy-`official` bleibt Compatibility mit `result: 'unknown'`. Kanonische Hard Truth ist `evaluations[]`.

### 4.4 Guest → Account

Gast speichert dieselbe `Trip.party`-Form. Die Übernahme mappt Citizenships, Documents und `citizenshipClientRef` explizit (`GastreiseBruecke` → `partyUebernehmen` → `party_schreiben`). Das ist trip-scoped Copy, kein Registry-Import.

---

## 5. Analysis matrix

Legende: `correct` / `partial` / `missing` / `conflicting` / `insufficient evidence`.

| Fläche | Bewertung | Kurzbegründung |
| --- | --- | --- |
| DB Parent/Child 1:n + Limits 8/12 | **correct** | Child-Tabellen, Unique Land, C1 UPDATE-Limits |
| Domain `TripTraveller` | **correct** | Arrays; keine Primary-Felder; keine Nummer/Scan/MRZ |
| Issuer ≠ Citizenship | **correct** | Relation nur über gespeicherte Ref; Legacy-Dokument hat `citizenshipClientRef: null` |
| `credentialOptionsAus` | **partial** | 1 Option je Dokument ist correct; jede Option trägt zusätzlich das **volle** Citizenship-Set |
| Kanonischer App-Pfad `anfrageAus` / `travellerAusSlot` | **correct** | setzt Options immer über `credentialOptionsAus`; `relatedCitizenshipCountryCode` option-scharf |
| `travellerNormalisieren` nach P2-TA-06 | **correct** | 1:n aus Documents; Legacy nur bei echter Singularform; kein `documents[0]` |
| Engine-Schleife / `optionPasst` | **correct** | option-scoped; Providerzeile ohne `credentialOptionRef` nur bei genau einer Option |
| Official Hard Truth `evaluations[]` | **correct** | API gibt das Array zurück; `result` ohne Provider `unknown` |
| Legacy-`official` / `officialAusEvaluations` | **correct** | nur uniforme Scope+Presentation; sonst fail-closed |
| `officialFuerItem` | **partial** | filtert Traveller+Land, nicht `credentialOptionRef`; bei mehreren Optionen fail-closed |
| `readinessAnsicht` Summary | **partial** | reicht `destinationCountries[0]` nur als Anfrage-Metadatum; `result` bleibt `unknown` |
| Vergleich | **correct** | fail-closed; UI zeigt bei `documents.length > 1` `VERGLEICH_NICHT_VERFUEGBAR` ohne Provider |
| Fingerprint / Stale | **correct** | alle Citizenships + alle Document-Fingerprints inkl. Relation |
| Safety | **partial** | Citizenship-**Set**, nicht option-scharf |
| Route / Transit Facts | **correct** | traveller-neutral |
| Reisevorbereitung UI | **partial** | 8/12, Issuer getrennt, Citizenship-Picker; keine progressive per-Option Official-Darstellung |
| Guest-Persistenz | **correct** | dieselbe Array-Form; Legacy-Uplift nur wenn Arrays strukturell fehlen |
| Guest→Account | **correct** | Relations bleiben; kein Registry-Import |
| Account AP-7 S1 Domain-Contract | **correct** (latent) | fail-closed; keine Defaults; keine Runtime-Caller |
| Account-Registry Persistenz / RLS | **missing** | keine Tabellen, kein S2 |
| Account-Registry CRUD / UX / Lifecycle | **missing** | nicht gebaut |
| Registry→Trip Materialisierung zur Laufzeit | **missing** | Projektionsfunktion existiert, kein Caller |
| Provider Flights/Hotels/Activities/Mobility/Rental Search | **correct** für aktuelle Suche / **missing** für spätere Booking-/APIS-Wahl | nur Kopfzahl; kein Shadow-Traveller |
| Requirements-Provider | **correct** (nicht aktiv) | Factory `null`; Vertrag trägt `credentialOptions[]` |
| Legacy-Singularspalten | **partial** | Expand/Contract; Children gewinnen, wenn geladen |
| `party_schreiben` Duplicate-Country | **partial** | `ON CONFLICT (traveller_id, country_code) DO NOTHING` |
| `travellerSlots` Extra-Refs | **partial** | nur `traveller:1..N` applicable |
| Account-Plan Current-State-Zeilen zu AP-7-S1 | **conflicting** | Datei auf `main` nennt S1 noch „Draft-PR #145 / self-expiring“, Code ist integriert |
| Production-Katalog dieses Runs | **insufficient evidence** | Acceptance-Docs ja; dieser Agent hat Supabase nicht live gelesen |

---

## 6. Non-correct findings

Für jedes nicht-`correct` Ergebnis: Fläche, Call-Pfad, Impact, Severity, Blocker, kleinster späterer Slice (**Proposal only**).

### F1 — Account-Registry Persistenz / Identity / RLS fehlt

**Bewertung:** `missing`  
**Fläche:** keine `account_traveller*`-Migration; `lib/traveller/account-registry.ts` ist reiner Domain-Contract.  
**Call-Pfad:** **latent / unreachable.** Kein `app/`- oder API-Import.  
**Impact:** Reisende können Citizenships/Documents nicht accountweit wiederverwenden. Jede Reise bleibt isolierter Snapshot. Das verletzt nicht die Trip-Wahrheit, blockiert aber die Traveller-Vervollständigung aus Binding Build Order §2.  
**Severity:** **P2** — Programm-Lücke, kein Runtime-Defekt, kein Default-Pass, kein Data-Loss. Nicht P1, weil der trip-scoped Vertrag vollständig und fail-closed ist. Nicht P0.  
**Blockt:** **Traveller-Completion-Stage** und **Account AP-7+**. Nicht den aktuellen Official-Pfad. Nicht einen Provider-Search-Slice.  
**Kleinster späterer Slice:** separat versioniertes, Product-Owner-gegates **AP-7-S2 Persistence / Identity / RLS**. Kein UI, kein Guest→Registry-Import, keine Production-Migration ohne eigenes Gate.

### F2 — Account Document-/Traveller-Lifecycle / CRUD fehlt

**Bewertung:** `missing`  
**Fläche:** keine accountweite Edit/Archive/Detach-UI; keine Registry-Schreib-API.  
**Call-Pfad:** nicht vorhanden.  
**Impact:** Nutzer können wiederverwendbare Fakten nicht pflegen. Trip-UI (`Reisevorbereitung.tsx`) bleibt der einzige Editor und ist reisespezifisch.  
**Severity:** **P2** nach S2; heute kein Runtime-Schaden.  
**Blockt:** späteren Account-UX-Slice, nicht Official-Truth, nicht Provider-Search.  
**Kleinster späterer Slice:** AP-7 CRUD/UX **nach** S2-Persistenz. Sensible Nummern/Scans/MRZ bleiben extra PO-gated und sind hier nicht vorzuschlagen.

### F3 — Registry→Trip-Materialisierung hat keinen Runtime-Caller

**Bewertung:** `missing`  
**Fläche:** `accountRegistryTravellerAlsTripSnapshot` / `accountRegistryTravellerProjektieren`.  
**Call-Pfad:** nur Tests. Kein Merge, kein Overwrite bestehender Snapshots.  
**Impact:** positiv für Truth (kein stilles Überschreiben). Negativ für Wiederverwendung.  
**Severity:** **P2** als fehlende Fähigkeit; **correct** als Nicht-Merge.  
**Blockt:** AP-7 Materialisierungs-/Conflict-Slice nach Persistenz.  
**Kleinster späterer Slice:** explizite opt-in Materialisierung mit trip-eigenen IDs, ohne Live-FK, ohne stilles Rewrite. Bereits im Dual-Authority-Approval vorgezeichnet.

### F4 — `officialFuerItem` ist nicht `credentialOptionRef`-scharf

**Bewertung:** `partial`  
**Fläche:** `lib/readiness/anforderungen.ts` → `officialFuerItem` / `evaluationsFuerItemScope` (ca. L234–275).  
**Call-Pfad:** erreichbar. `readinessAnsicht` setzt Item-`official` über `officialFuerItem` (`lib/readiness/status.ts` L99–139). Workspace `Reisevorbereitung` liest die View.  
**Aktuelles Verhalten:** Filter nach Destination + Traveller. Mehrere Optionen desselben Travellers haben verschiedene `credentialOptionRef` → `officialAusEvaluations` sieht uneinheitlichen Scope → Authority/URL null, Reason `insufficient_context`, `result` bleibt `unknown`. Das ist **fail-closed**, kein First-Eval-Kollaps mehr.  
**Impact:** sobald ein Requirements-Provider echte option-spezifische Evidence liefert, kann die Item-Badge nicht option-scharf Authority/URL zeigen. Heute bleibt alles `unknown`.  
**Severity:** **P3 jetzt**, **P2 sobald ein Requirements-Provider live** wäre. Kein aktuelles Official-P1.  
**Blockt:** späteren Official-Presentation-Slice, nicht Traveller-Completion, nicht AP-7-S2.  
**Kleinster späterer Slice:** Item-Scope um `credentialOptionRef` erweitern, **nur** nach oder mit Provider-Evidence. Kein `evaluations[0]`-Shortcut.

### F5 — Readiness-Summary reicht `destinationCountries[0]` als Metadatum

**Bewertung:** `partial`  
**Fläche:** `lib/readiness/status.ts` → `readinessAnsicht` L161–164.  
**Call-Pfad:** erreichbar, Summary-Text.  
**Aktuelles Verhalten:** `officialAusEvaluations` bestimmt Destination über `einziges(destinations)` der Evaluations, nicht über den übergebenen `[0]`-Wert, sobald Evaluations existieren. `result` bleibt `unknown`. `[0]` ist Anfrage-Metadatum / Leerfall.  
**Impact:** kein erfundenes Visa-Resultat. Bei leerer Evaluation-Menge kann die Summary-Destination die erste Destination der Reise sein.  
**Severity:** **P3**.  
**Blockt:** nur späteren Multi-Destination-Summary-Feinschliff.  
**Kleinster späterer Slice:** Summary ohne Destination-Default oder explizit „mehrere Ziele, keine Einzelsummary“.

### F6 — Safety bewertet das Citizenship-Set, nicht die Credential-Option

**Bewertung:** `partial`  
**Fläche:** `lib/safety/engine.ts` → `travellerRelevant` L64–76.  
**Call-Pfad:** erreichbar über lokale Safety-Auswertung / Attention.  
**Aktuelles Verhalten:** `citizenshipCodesAus(slot.traveller)` — Match, wenn **irgendeine** Citizenship des Travellers in `fact.travellerCitizenshipCodes` liegt.  
**Impact:** CH-Pass vs RS-Pass kann Safety nicht unterscheiden. Zulässig, solange Safety-Facts nur staatsbürgerschaftsabhängig sind. Keine erfundene Einreise-Pflicht.  
**Severity:** **P3** auf dem aktuellen Fact-Modell. Wird P2, wenn ein Safety-Provider option-abhängige Facts liefert.  
**Blockt:** nicht Traveller-Completion. Späterer Safety-Slice, nur bei evidenter Option-Abhängigkeit.  
**Kleinster späterer Slice:** option-scharf nur dann, wenn Provider-Facts das wirklich tragen. Keine erfundene Safety-Matrix.

### F7 — `credentialOptionsAus` legt das volle Citizenship-Set auf jede Option

**Bewertung:** `partial`  
**Fläche:** `lib/readiness/traveller-kontext.ts` → `credentialOptionsAus` L246–275.  
**Call-Pfad:** kanonischer App-Pfad (`anfrageAus`, `travellerAusSlot`).  
**Aktuelles Verhalten:** `citizenshipCountryCodes` = alle Codes des Travellers; `document.citizenshipCountryCode` / `relatedCitizenshipCountryCode` = nur die gespeicherte Relation.  
**Impact:** kein Default-Pass. Ein künftiger Provider, der fälschlich das Array statt `relatedCitizenshipCountryCode` verwendet, könnte Optionen vermischen. Der aktuelle Engine-Pfad nutzt die option-scharfe Relation.  
**Severity:** **P3** Vertragsnuance.  
**Blockt:** nicht Traveller-Completion.  
**Kleinster späterer Slice:** Contract-Klarstellung / Provider-Onboarding, kein Schemawechsel.

### F8 — Legacy-Singularspalten und Legacy-Uplift bleiben

**Bewertung:** `partial`  
**Fläche:** Parent-Spalten; `travellerLegacyLesen` L171–214; `reisende.ts` L97–100; `engine.ts` `legacyOption`; `officialFingerprint` Singular-Fallback.  
**Call-Pfad:** erreichbar für Guest-Altbestand, API-Legacy-Bodies und DB-Fallback, wenn Child-Relations **nicht** geladen sind. Kanonischer Write-Pfad schreibt Legacy-Spalten nicht. Explizites `citizenships: []` / `documents: []` bleibt leer.  
**Impact:** alte 1:1-Formen werden zu höchstens einer Citizenship und einem unlinked Dokument angehoben. Das erfindet keine Multi-Citizenship und setzt Issuer nicht als Citizenship.  
**Severity:** **P3** Compatibility.  
**Blockt:** nicht Traveller-Completion.  
**Kleinster späterer Slice:** Legacy-Quarantäne erst nach Nachweis, dass Production den Legacy-Select nicht mehr braucht.

### F9 — `party_schreiben` schluckt doppelte Country-Codes still

**Bewertung:** `partial`  
**Fläche:** `supabase/migrations/20260822160000_traveller_context_intelligence.sql` L366–371  
`on conflict (traveller_id, country_code) do nothing`.  
**Call-Pfad:** erreichbar über Account-Writes. Children werden zuvor gelöscht; Konflikt entsteht nur **innerhalb derselben Payload**, wenn dasselbe Land zweimal kommt. Domain/UI deduplizieren Länder bereits.  
**Impact:** stiller Verlust eines zweiten `clientRef` für dasselbe Land, nicht einer zweiten Staatsbürgerschaft. Kein Default-Pass.  
**Severity:** **P3**.  
**Blockt:** nicht Traveller-Completion.  
**Kleinster späterer Slice:** Write-Contract-Hygiene (fail-closed statt `DO NOTHING`) in einem eigenen, kleinen DB-Slice. PO-Gate, weil Production-Funktion.

### F10 — `travellerSlots` macht Nicht-`traveller:N`-Refs nicht applicable

**Bewertung:** `partial`  
**Fläche:** `lib/readiness/party.ts` → `travellerSlots` L49–58.  
**Call-Pfad:** erreichbar. Extra Party-Mitglieder bekommen `applicable: false` und fehlen in Official-Slots / Ableitung.  
**Impact:** die aktuelle UI erzeugt `traveller:1..N`. Extra-Refs sind latent. Kein First-Traveller wird zum Default-Pass eines anderen.  
**Severity:** **P3** latent.  
**Blockt:** nicht Traveller-Completion.  
**Kleinster späterer Slice:** nur wenn ein Produktpfad Nicht-Standard-Refs speichert.

### F11 — Provider-Suche projiziert nur die Kopfzahl

**Bewertung:** `correct` für aktuelle Suche; `missing` für spätere Booking-/APIS-/Dokumentwahl  
**Fläche:** `lib/flights/nachweis.ts` `flugPassagiereAusReise` L81–87; Hotels/Activities analog über `reise.travellers`; Rental/Mobility ohne Citizenship/Document. Requirements-Vertrag ist die einzige provider-seitige 1:n-Fläche und bleibt `null`.  
**Call-Pfad:** erreichbar für Suche; **kein** Shadow-Traveller, keine erfundene Nationalität.  
**Impact:** Suche bleibt traveller-neutral. Booking-grade Dokumentwahl existiert nicht. Das ist kein aktueller Default-Pass.  
**Severity:** **P3** / späterer Provider-Slice.  
**Blockt:** nicht Traveller-Completion, nicht AP-7-S2. **Kein** Provider-Edit aus diesem Audit.  
**Kleinster späterer Slice:** erst wenn ein echter Provider dokument-/APIS-pflichtige Requests verlangt; dann explizite kontextbezogene Wahl, kein `documents[0]`.

### F12 — Keine progressive per-Option Official-UX

**Bewertung:** `missing` (erwartet)  
**Fläche:** `components/trips/Reisevorbereitung.tsx` L185–208. Pro Traveller aggregierter Text; bei mehreren Dokumenten zusätzlich `VERGLEICH_NICHT_VERFUEGBAR`. Kein „Alternativen anzeigen“ mit belegten Optionen.  
**Call-Pfad:** erreichbar. Ohne Provider gibt es keine vergleichbaren Official-Ergebnisse.  
**Impact:** entspricht `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md` UX-Zielbild, ist aber ohne Evidence korrekt leer.  
**Severity:** **P3**. Würde P2, sobald Provider-Evidence existiert und die UI weiter nur aggregiert.  
**Blockt:** späteren UX-Slice nach Requirements-Provider. Nicht Traveller-Completion.  
**Kleinster späterer Slice:** Presentation only, fail-closed, keine Score-Logik.

### F13 — Globale Current-State-Dateien driftig zu AP-7-S1 / aktivem Block

**Bewertung:** `conflicting` (Dokumentation, nicht Runtime)  
**Fläche:** `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` §AP-7 nennt S1 noch „self-expiring auf Draft-PR #145“. `docs/ACTIVE_WORK_STATUS.md` führt weiter PR #187 als aktuellen Authoring-Block.  
**Call-Pfad:** n/a.  
**Impact:** ein neuer Agent, der nur diese globalen Dateien liest, kann S1 als Draft oder diesen Audit als nicht-existent missverstehen. Live-Code und Checkpoint V2 gewinnen. Dieser Task **verbietet** die Korrektur dieser Dateien.  
**Severity:** **P3** Continuity-Drift.  
**Blockt:** nicht Runtime.  
**Kleinster späterer Slice:** docs-only Continuity **nach** Merge dieses Audits oder durch Technical-Lead-Checkpoint; nicht durch diesen Autor.

### F14 — Production-Katalog in diesem Run nicht unabhängig gelesen

**Bewertung:** `insufficient evidence` für frischen Live-Katalog  
**Fläche:** Supabase Production.  
**Call-Pfad:** n/a.  
**Impact:** Foundation-E- und C1-Production-Apply sind durch Repository-Acceptance und Checkpoint V2 belegt. Dieser Agent wiederholt die Live-Katalogprüfung nicht.  
**Severity:** keine Runtime-Lücke; Evidenzgrenze.  
**Blockt:** keine Implementierung.  
**Kleinster späterer Slice:** keiner. Technical Lead kann Production read-only gegenprüfen, wenn er das für PASS braucht.

---

## 7. Correct surfaces — Current Evidence

Nicht erschöpfend; belegt, dass die historischen P1/P2-Runtime-Funde **nicht** mehr current sind.

| Regel | Current Evidence |
| --- | --- |
| 1:n Domain | `types/trips.ts` `TripTraveller`; UI `Reisevorbereitung.tsx` Mehrfachzeilen + Citizenship-Picker |
| Kein Default-Pass im kanonischen Pfad | `credentialOptionsAus`; `anfrageAus`; `travellerAusSlot`; Production-`lib/` enthält kein produktives `documents[0]` |
| P2-TA-06 geschlossen | `travellerNormalisieren` baut `optionsAusDokumenten` für alle Documents; Tests L1904–1943 |
| P1-TA-02 geschlossen | `officialAusEvaluations` nur bei einheitlichem Scope; `officialFuerItem` ohne Cross-Traveller-Fallback; Tests `official-option-scope.test.ts` |
| Issuer ≠ Citizenship | `documentCitizenshipCode`; `documentAusLegacy` setzt Relation `null`; Registry lehnt Issuer-Inferenz ab; `20260822180000` |
| Keine Primary-Felder | Registry `VERBOTENE_WAHL_SCHLUESSEL`; Snapshot bekommt keine `preferred*`/`default*` |
| Guest→Account | `GastreiseBruecke.tsx` L52–66 kopiert Arrays inkl. `citizenshipClientRef` |
| Dual-Authority Nicht-Merge | keine Runtime-Caller; Projektion verlangt explizite trip-eigene IDs, disjunkt zum Registry-Universum |
| Vergleich fail-closed | `vergleich.ts`; UI-Hinweis bei >1 Dokument |
| Fingerprint | `travellerFingerprintFelderFuer` / `travellerCredentialFingerprint` über alle Citizenships und Documents |
| Search erzeugt keinen Shadow-Traveller | Flights/Hotels/Activities/Rental nutzen Kopfzahl, nicht Party-Identität |
| `unknown` bleibt `unknown` | Requirements-Provider `null`; Official `result: 'unknown'` |

---

## 8. Production / Schema honesty

Repository-Evidence, **nicht** in diesem Run live gegen den Production-Katalog geprüft:

- Foundation E Apply: `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md` — Child-Tabellen, RLS, `party_schreiben`, Backfill-Nachprüfung.
- C1 Write-Contract: Production-Version `20260828015304_traveller_write_contract_integrity.sql`; Status/Checkpoint belegen Apply + Verifikation.
- Checkpoint V2 §4: Foundation E auf Production; P1-TA-02 / P2-TA-06 / P2-TA-04 C1 / AP-7 Gate 0 / Dual-Authority / AP-7-S1 integriert.

Dieser Audit behauptet **nicht**, den Production-Katalog am 29. August 2026 selbst gesehen zu haben.

---

## 9. Traveller-Context-Intelligence Check

| Frage | Antwort |
| --- | --- |
| Ist die betrachtete Fläche traveller-spezifisch? | Ja, das ist der Gegenstand. |
| Können mehrere Citizenships/Documents das Ergebnis ändern? | Ja für Official/Readiness/künftige Eligibility; nein für aktuelle Flight/Hotel/Activity-Suche. |
| Wird pro Traveller und Option ausgewertet? | Ja in der Requirements-Engine und im Contract. Safety und Item-`official` sind set- bzw. traveller+land-scharf. |
| Welche Facts sind nötig? | ISO-2 Citizenships, Document-Typ/Issuer/Ablauf, optionale Document↔Citizenship-Ref, Residence nur wo nötig. |
| Was darf nicht gespeichert werden? | Nummern, Scans, MRZ, Biometrie, Health — unverändert nicht im Kernmodell. |
| Freshness? | Fingerprint enthält Citizenship-Set + alle Document-Fingerprints inkl. Relation. |
| UX? | Multi-Felder vorhanden; progressive Official-Alternativen fehlen bewusst ohne Provider. |

---

## 10. Proposed future slices

Siehe `docs/TRAVELLER_MULTICITIZENSHIP_FUTURE_SLICE_PROPOSAL_2026-08-29.md`.

**PROPOSAL ONLY / NOT AUTHORIZED.** Dieser Audit startet keinen der Slices.

---

## 11. Non-scope confirmation

Eingehalten:

- keine Runtime-/UI-/Provider-Codeänderung;
- keine Migration / kein Supabase / kein RLS/Grant;
- keine globale Current-State-Datei;
- keine Production-/Vercel-/Config-Mutation;
- keine Secrets, keine externen Legal-/Provider-Calls;
- kein Ready, kein Merge, kein Implementierungs-Folgeslice.

Bewusste Ausnahme zur Progress-Persistence-Policy: `docs/ACTIVE_WORK_STATUS.md` wurde **nicht** aktualisiert, weil der versionierte Task das ausdrücklich verbietet.

---

## 12. Exact next step

Unabhängiger ChatGPT / Technical-Lead Exact-Head-Review von Draft-PR #198 auf dem Head **dieses** Stamps.

Kein Ready. Kein Merge. Kein AP-7-S2. Kein Provider-Folgeslice. Kein UI-Fix.
