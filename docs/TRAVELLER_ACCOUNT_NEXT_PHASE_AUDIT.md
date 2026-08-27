# Jetnity – Traveller / Account Next-Phase Dependency Audit

Stand: 26. August 2026  
Agent: `Account plattform audit vorbereitung`  
Typ: **AUDIT / EVIDENCE ONLY**  
Status: **HISTORICAL EVIDENCE / 26. August 2026**

**Nachtrag, 28. August 2026 – P2-TA-03.** Finding P2-TA-03 („Plan fehlt auf `main`“) wird durch Draft-PR #117 / `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` geschlossen, sobald der unabhängige Technical Lead reviewed und merget. P2-TA-06 ist durch PR #113 integriert; der damalige „latent“-Satz ist historische Evidence. AP-4 ist durch PR #108 integriert. Dieser Audit bleibt zeitgebundene Evidence und keine Current Truth.  
Branch: `audit/traveller-account-next-phase`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/76  
Ursprüngliche Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Aktueller `main` nach kontrolliertem Sync: `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`  
Auftrag: `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT_TASK.md`

Keine Runtime. Kein Shared-Contract-Change. Kein AP-4. Kein AP-7. Kein Ready. Kein Merge.

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

---

## 1. Live-Rekonstruktion

Verifiziert in diesem Korrektur-Lauf, nicht aus Erinnerung.

| Prüfung | Live-Stand |
| --- | --- |
| `origin/main` | `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f` – *Merge PR #79: QS-2 audit evidence* |
| Audit-Branch | `audit/traveller-account-next-phase` |
| Merge-Base gegen `origin/main` | genau `8ab4e666` |
| Sync | Merge `origin/main` in den Audit-Branch; keine Konflikte; `ACTIVE_WORK_STATUS.md` unberührt |
| PR #76 | Draft, OPEN |
| Review | unabhängiger TL: **CHANGES REQUIRED** nur Evidence/Severity; dieser Bericht ist die Korrektur |
| Line-Review-Threads | 0 |
| Issue-Kommentare | Vercel-Bot |
| Vorheriger Audit-Head | `7e0a3c18473e314945d378363b52fe951321b64c` – Actions `32911243384` SUCCESS; Vercel `4kqKYkFUeaKWzPR4fp4AYCmkF4vb` success |
| Dieses Run: Supabase selbst abgefragt? | **nein** – Production-Stand aus **TL-Live-Evidence** (unten) |
| Dieses Run: lokale volle Testsuite / Production-Build? | **nein** – Docs-only |

Parallele offene Draft-PRs auf `main` (nicht verändert):

| PR | Branch | Typ | Traveller-/Account-Kollision |
| --- | --- | --- | --- |
| #74 | `feat/d0-2-canonical-origin-consistency` | D0-2 Runtime, eng | keine Traveller-Truth |
| #75 | `audit/tw6-guest-one-trip-dependency` | TW-6 Audit | Guest-One-Trip; kein Traveller-Modell |
| #77 | `audit/provider-s4-s8-provenance` | Provider-Audit | keine Traveller-Registry |
| #39 | `audit/account-platform` | älterer Account-Audit | enthält `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`; **nicht** auf `main` |
| #40 / #50 / #52 / #28 | ältere Drafts | fremd | nicht angefasst |

PR #78 (Admin D–K) und PR #79 (QS-2) liegen auf diesem `main` (`13457187`, `8ab4e666`).

Ältere Account-Statusdateien (AP-1 `#43`, AP-2 `#48`, AP-3 `#53`) beschreiben historische Draft-Heads. **Aktuelle Wahrheit:** AP-1–AP-3 sind auf `main` gemergt (`ROADMAP.md` 6a–6f).

---

## 2. Kanonisches Modell und Current Truth

Verbindlich:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass. Ausstellerland ist nicht automatisch Staatsbürgerschaft. Fehlende Evidence bleibt `unknown` / `insufficient_context`.

Dieser Audit **erfindet keinen Account-Registry-Contract**. AP-7 bleibt ungebaut und gated.

### 2.1 Account-scoped vs trip-scoped

**Aktuelle Wahrheit ist ausschließlich trip-scoped.**

Es gibt keine accountweiten Traveller-, Citizenship- oder Document-Tabellen. `types/trips.ts` sagt das ausdrücklich: `party` ist individueller Reisendenkontext der Reise; **keine accountweiten Profile**. `trips.travellers` ist eine **Kopfzahl** (1–20), keine Identität.

| Ebene | Existiert heute | Scope |
| --- | --- | --- |
| `public.trip_travellers` | ja | Reise + Owner (`user_id`) |
| `public.trip_traveller_citizenships` | ja, 1:n, unique Land, max 8 | Reise + Traveller + Owner |
| `public.trip_traveller_documents` | ja, 1:n, Typ `passport\|national_id\|unknown`, max 12 | Reise + Traveller + Owner |
| optionale Document↔Citizenship-Relation | ja, über `citizenship_id` / `citizenshipClientRef` | nicht über Issuer |
| Legacy-Singularspalten auf `trip_travellers` | ja, **DEPRECATED compatibility-only** | Expand/Contract |
| Account-Traveller-Registry | **fehlt** | in älteren Plänen als AP-7 genannt; **kein neuer Contract** |
| Default-Pass / primäre Staatsbürgerschaft | **nicht modelliert** | verboten |

Gast trägt dieselbe `Trip.party`-Form in `jetnity:reise:v3`. Guest→Account kopiert Citizenship- und Document-Arrays vollständig (`GastreiseBruecke` → `partyUebernehmen` → `party_schreiben`).

ADR-0117 hat ein globales Nutzerprofil **bewusst abgelehnt**. Ein späterer AP-7-Schnitt bräuchte einen ADR-Nachfolger. Dieser Audit definiert ihn nicht.

`docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` liegt **nicht** auf `main` / diesem Branch. Es existiert auf `audit/account-platform` (PR #39). `docs/JETNITY_BINDING_BUILD_ORDER.md` zitiert die Datei als Folgeplan. Das ist eine Dokumentationslücke, kein Runtime-Defekt und **kein** stillschweigend übernommener Registry-Vertrag.

### 2.2 Issuer ≠ Citizenship

Belegt:

- ADR-0120 Nachtrag: Ausstellerland ist keine Staatsbürgerschaft; `relatedCitizenshipCountryCode` bleibt `null` ohne gespeicherte Relation.
- `lib/readiness/dokument-formular.ts` hält `issuingCountryCode` und `citizenshipClientRef` getrennt; Relation nur, wenn die Citizenship-Ref in der erlaubten Menge liegt.
- Migration `20260822180000_traveller_context_rereview.sql` neutralisiert den alten Backfill, der `citizenship_id` setzte, wenn Issuer = Nationalität.

### 2.3 Production / Schema

Technical-Lead-Live-Evidence, 26. August 2026:

- Supabase Production `qscbgcdmivbbnzrcyegn` ist **ACTIVE_HEALTHY**.
- Production enthält die Foundation-E-Child-Tabellen-Migrationen:
  - `20260822160000_traveller_context_intelligence`
  - `20260822170000_traveller_context_fk_delete`
  - `20260822180000_traveller_context_rereview`

Damit sind die Production-Child-Tabellen **nicht** mehr `insufficient evidence`. Foundation E wird nicht neu gebaut.

`JETNITY_START_HERE.md` listet als letzten Production-Schnitt weiterhin `20260824120000` / `20260824140000` (Flug-Surface). Die drei Foundation-E-Migrationen liegen zeitlich davor und sind durch den TL zusätzlich namentlich bestätigt.

ADR-0117–0126 tragen historisch noch „Production nicht anwenden“ / „Development“. Das ist ADR-Text vom 22.–23. August. **Live-Evidence des TL gewinnt.**

Dieser Agent hat Supabase in diesem Run nicht selbst abgefragt.

---

## 3. Feature-by-Feature-Matrix

Legende: `correct` / `partial` / `missing` / `conflicting` / `insufficient evidence`.

| Fläche | Bewertung | Begründung |
| --- | --- | --- |
| DB Parent/Child 1:n | **correct** | `trip_travellers` + Citizenships + Documents; Limits 8/12; Composite-FK; **auf Production** (TL-Evidence) |
| Domain `TripTraveller` | **correct** | Arrays; keine accountweiten Profile; keine Nummer/Scan/MRZ |
| `credentialOptionsAus` | **correct** | eine Option je Dokument; ohne Dokument `:none`; Issuer nicht als Citizenship |
| Kanonischer App-Pfad | **correct** | `anforderungen.ts::anfrageAus` setzt `credentialOptions` immer über `credentialOptionsAus` |
| `requirementsFuerReise` / `travellerAusSlot` | **correct** | ebenfalls `credentialOptionsAus`; kein `documents[0]`-Default |
| Attention / TW-4 | **correct** | verbietet `cit:*`; Test auf kanonische `:none`-Refs |
| Vergleich | **correct** | fail-closed; `< 2` Optionen → `VERGLEICH_NICHT_VERFUEGBAR` |
| Route / Transit | **correct** | traveller-neutral |
| Seasonal Produktpfad | **correct** | traveller-neutral; Fixture-Bias nur in Tests |
| Safety | **partial** | citizenship-**set**, nicht option-scharf; zulässig solange Facts nur citizenship-abhängig sind |
| Reisevorbereitung UI | **partial** | 8 Citizenships / 12 Dokumente; Issuer getrennt; keine progressive per-Option Official-Darstellung |
| Guest-Persistenz / Guest→Account | **correct** | Arrays inkl. `citizenshipClientRef` |
| Account AP-1 / AP-3 | **correct** (nicht relevant) | Personenzahl / Datumsgruppen; keine Registry |
| Account-Traveller-Registry | **missing** | kein gebauter Contract; AP-7 bleibt gated |
| Account Dokument-Lifecycle | **missing** | kein accountweites Edit/Archive/Detach |
| Engine `travellerNormalisieren` | **partial** (latent) | `documents[0]`-Fallback nur wenn `credentialOptions` fehlt/leer; **kein** aktueller App-Pfad |
| Official-Legacy-Objekt | **partial** | `officialAusEvaluations` nimmt `evaluations[0]`; **`result` immer `unknown`** |
| Official-Badge-Zuordnung | **partial** | `officialFuer` filtert Land+Traveller, sonst alle Evaluations, dann `[0]` |
| Legacy-Singularfelder | **partial** | Expand/Contract; geladene leere Children autoritativ (ADR-0123) |
| Planner `/planen` | **nicht relevant für diesen Slice** | legt Kopfzahl; Runtime hier verboten |
| Commercial / Provider-Handoff | **correct** (nicht relevant) | Requirements-Factory `null` |
| Account-Plan auf `main` | **missing** | Datei nur auf PR #39 |

---

## 4. Single-Citizenship- / Single-Document-Fundstellen

### 4.1 Latent – `documents[0]` in `travellerNormalisieren` (kein aktueller Runtime-P1)

**Datei:** `lib/readiness/engine.ts` → `travellerNormalisieren`

Wenn `credentialOptions` fehlt oder `length === 0`, wird **eine** Option aus `documents[0]` oder Legacy-Singularfeldern gebaut.

**Kanonischer aktueller App-Pfad trifft das nicht.**

`lib/readiness/anforderungen.ts::anfrageAus` baut `credentialOptions` explizit über `credentialOptionsAus`. `requirementsEvaluationsPruefen` und `officialRequirementsPruefen` laufen über `anfrageAus`. `requirementsFuerReise` nutzt `travellerAusSlot` → ebenfalls `credentialOptionsAus`.

Unter `app/` gibt es **keinen** direkten Aufruf von `requirementsAuswerten`. Einziger App-Konsument der Engine ist `app/api/readiness/requirements/route.ts` über `requirementsEvaluationsPruefen` / `officialRequirementsPruefen` / `officialAusEvaluations` – also über `anfrageAus`.

`credentialOptionsAus` liefert bei fehlenden Dokumenten `:none`, nie ein leeres Array. Damit bleibt der Fallback latent.

**Gefährlich würde er**, wenn ein künftiger Caller `requirementsAuswerten` mit mehreren `documents` und ohne bzw. mit leerem `credentialOptions` aufruft. Dann wäre `documents[0]` ein Default-Pass auf dem Legacy-/Contract-Pfad.

**Klassifikation:** **P2-TA-06** – latentes Contract-Hardening / Legacy-Fallback-Risiko. **Kein aktueller Runtime-P1.**

### 4.2 Partial – Official-Zusammenfassung ist first-evaluation (separater Gap)

**Datei:** `lib/readiness/anforderungen.ts` → `officialAusEvaluations`  
`result` ist **immer** `'unknown'`. `destinationCountryCode`, `status` (außer `current` → `unknown`), `authority`, `sourceUrl`, `checkedAt`, `validityUntil` und `reason` stammen aus `evaluations[0]`.

**Datei:** `lib/readiness/status.ts` → `officialFuer`  
Filter nach Land + `travellerClientRef`. Kein Treffer → alle Evaluations. Danach wieder `officialAusEvaluations` → `[0]`. Nicht `credentialOptionRef`-scharf. Die Summary ruft `officialAusEvaluations(evaluations)` ohne Option-Filter auf.

**Live-Pfad:** `readinessAnsicht` und `app/api/readiness/requirements/route.ts` (`official: officialAusEvaluations(evaluations, anfrage)`).

**Was das nicht ist:** eine erfundene regulatorische Entscheidung. Ohne Provider bleibt `result: unknown`. Vergleich bleibt fail-closed. Es wird kein `required` / `not_required` aus der ersten Evaluation.

**Was es ist:** ein realer Presentation-/Option-Scope-Gap. Mehrere passende Evaluations können auf die erste Presentation-Evaluation kollabieren (Authority/URL/Reason/Status-Metadaten).

**Schwere: P1-TA-02**, begründet:

- der Kollaps liegt auf dem **aktuellen** App-/API-Pfad, nicht nur auf einem Legacy-Fallback;
- er verletzt Option-Scope, sobald mehr als eine passende Evaluation existiert;
- er erfindet **keine** Visa-/Einreise-Pflicht.

Nicht P0: kein Data-Loss, keine Security-Bypass, keine erfundene Pflicht. Nicht P2: die Presentation hängt am produktiven Readiness-Pfad.

### 4.3 Correct – bewusst kein Default

| Stelle | Evidence |
| --- | --- |
| `credentialOptionsAus` | eine Option je Dokument oder `:none` |
| `anfrageAus` | setzt Options immer aus `credentialOptionsAus` |
| `lib/trips/attention.test.ts` | `cit:*` darf Official-Vollständigkeit nicht erfüllen |
| `lib/readiness/vergleich.ts` | `< 2` Optionen → nicht vergleichbar |
| `Reisevorbereitung.tsx` | bei `documents.length > 1` Vergleich-Hinweis; Limits 8 / 12 |
| ADR-0120 / 0124 / 0125 | kein erster Pass als Wahrheit |

### 4.4 Test-Fixture-Bias (kein Produktpfad)

| Datei | Annahme |
| --- | --- |
| viele `lib/readiness/*.test.ts` | eine CH-Citizenship, Zugriff über `documents[0]` |
| `lib/seasonal/provider-anfrage.test.ts` | Issuer und `citizenshipClientRef` = `codes[0]` |
| Safety-/Seasonal-Engine-Tests | Citizenship-Refs `…:cit:${code}` als Testdaten |

**P2 Test-Hygiene.**

### 4.5 Nicht Single-Document, trotz Singularname

`individualClaimsForbidden` und Missing-Fact `nationality` meinen „mindestens eine Staatsbürgerschaft fehlt“, nicht „genau eine ist erlaubt“.

---

## 5. Konsumenten

### 5.1 Trip Create / Planner

`reise_anlegen()` / `reise_aendern()` schreiben keine Traveller-Zeilen, nur `trips.travellers` (Kopfzahl). Kein Default-Pass im Create.

### 5.2 Readiness / Einreise

Kanonisch: Optionen über `credentialOptionsAus`, kein echter Requirements-Provider, Vergleich fail-closed. Presentation-Lücke: Abschnitt 4.2. Latenter Engine-Fallback: Abschnitt 4.1.

### 5.3 Route / Transit

Keine Party-/Citizenship-Nutzung in `lib/route`. **correct.**

### 5.4 Safety

`travellerRelevant` matcht gegen die Citizenship-**Menge**. Kein `documents[0]`. **partial, zulässig**, solange Facts nur citizenship-abhängig sind.

### 5.5 Account / Reiseprofil

AP-1/AP-3: Personenzahl und Reisedaten. Keine Registry, kein Default-Pass. `archived` in Datumsgruppen ist Trip-Status (AP-4-Thema), keine Identität.

### 5.6 Guest→Account

`GastreiseBruecke.tsx` kopiert Arrays inkl. `citizenshipClientRef`. Dieser Audit ändert den Vertrag nicht.

### 5.7 Commercial / Provider

Requirements-Factory bleibt `null`. Marketing darf Identity-/Document-Daten nicht targeten.

---

## 6. Privacy / RLS / Ownership / Lifecycle

### 6.1 RLS (lesend geprüft)

Owner-Policies `user_id = (select auth.uid())`. `REVOKE` von `public`/`anon`. `GRANT` CRUD an `authenticated`. App-Writes sollen über `party_schreiben` (SECURITY INVOKER) laufen; direkte Child-Writes bleiben möglich. **P2 Ownership-Härte.**

### 6.2 Delete / Archive / Detach

Trip-Delete CASCADE. Traveller-Delete CASCADE Documents + traveller-Readiness. Citizenship-Delete SET NULL auf der Document-Relation. Kein Traveller-Detach/Archive. Kein Account-Profil.

### 6.3 Data Minimization

ISO-2, optional Residence, Document-Typ, optionales Ausstellerland, optionales Ablaufdatum, optionale Citizenship-Relation, neutrales Label. **Keine** Nummer, kein Scan, keine MRZ, keine Biometrie. Bleibt besonderes PO-Gate.

### 6.4 Growth / Marketing

Keine heutige Targeting-Nutzung gefunden. Risiko entsteht erst bei einer späteren account-scoped Identität – die dieser Audit nicht definiert.

### 6.5 Risiken

1. Eine künftige Registry ohne ADR-Nachfolger zu ADR-0117 würde PII über Reisen vervielfachen. **Kein Contract hier erfunden.**
2. AP-4 Archiv-UX darf keine Schatten-Identität werden.
3. Legacy-Singularspalten bleiben bis zum eigenen Cleanup.
4. Direkte `authenticated`-Writes auf Children umgehen `party_schreiben`.
5. Gast-`localStorage` trägt dieselben Traveller-Fakten; trip-scoped, akzeptiert.

---

## 7. Findings

### P0

**Keines.** P0 bleibt für akute kritische Runtime-/Security-/Data-Loss-Incidents reserviert.

Es gibt **kein** „P0-STOP Governance“.

### SHARED-CONTRACT-GATE / STOPP

Vor jeder **account-scoped Traveller-Identität / AP-7** und vor Änderung von `party_schreiben`, Guest→Account, RLS oder Traveller-Tabellen:

Dokumentieren. **STOPP.** Kein Folgeslice durch diesen Agenten. Kein neuer Registry-Contract in diesem Audit.

### P1

| ID | Finding |
| --- | --- |
| P1-TA-02 | Official-Presentation kollabiert mehrere passende Evaluations auf `evaluations[0]` (`officialAusEvaluations`, `officialFuer`, API-`official`). **`result` bleibt fail-closed `unknown`.** Keine erfundene regulatorische Entscheidung. Option-Scope/Presentation-Truth auf dem aktuellen App-Pfad. |

### P2

| ID | Finding |
| --- | --- |
| P2-TA-01 | UI zeigt Official nicht progressiv pro Credential-Option. |
| P2-TA-02 | Test-Fixtures implizieren oft eine CH-Citizenship und `documents[0]`; Seasonal-Fixture setzt Issuer = `codes[0]`. |
| P2-TA-03 | `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` fehlt auf `main`; Build Order zitiert ihn. Kein stillschweigend übernommener AP-7-Vertrag. |
| P2-TA-04 | `authenticated` darf Child-Tabellen direkt schreiben. |
| P2-TA-05 | Safety ist nur citizenship-set-scharf; dokumentabhängige Facts wären unmodelliert. |
| P2-TA-06 | `travellerNormalisieren` synthetisiert `documents[0]`, wenn `credentialOptions` fehlt/leer. Latentes Contract-Hardening; aktueller App-Pfad setzt Options über `credentialOptionsAus`. |

### P3

| ID | Finding |
| --- | --- |
| P3-TA-01 | Legacy-Singularspalten + Expand/Contract bleiben bis zum eigenen Cleanup-Block. |
| P3-TA-02 | AP-3 zeigt gespeichertes `archived` in Datumsgruppen; AP-4-Trip-Status, kein Traveller-Gap. |
| P3-TA-03 | HANDOFF / `ACTIVE_WORK_STATUS` können hinter live `main` `8ab4e666` liegen. Nicht in diesem PR ändern. |
| P3-TA-04 | ADR-0117–0126 Production-Formulierungen sind historisch; Foundation-E-Stand folgt der TL-Live-Evidence. |

---

## 8. Shared-Contract-Fragen – dokumentieren und STOPP

Offen für TL/PO, **ohne** hier einen Contract zu erfinden:

1. Bleibt Current Truth trip-scoped (ADR-0117)?
2. Falls später Wiederverwendung: Kopie in `party[]` vs. Live-Referenz – erst nach ADR-Nachfolger.
3. Keine Primär-Citizenship / kein Default-Pass.
4. Issuer bleibt ungleich Citizenship.
5. Delete/Detach/Archive für eine spätere Identität.
6. Guest-Opt-in in ein Account-Profil.
7. Soll das Legacy-Objekt `officialAusEvaluations` option-scharf werden, bevor UI das zeigt?
8. Soll der latente `documents[0]`-Fallback (P2-TA-06) als Requirements-API-Härte geschlossen werden, sobald ein Caller ohne `credentialOptions` existiert?
9. Passscan / MRZ / Biometrie / Nummern bleiben besonderes PO-Gate.

**Dieser Audit ändert keinen dieser Verträge.**

---

## 9. Kleinster fachlich korrekter nächster Traveller-/Account-Slice

**Nicht jetzt ausführen.**

### Nicht der nächste Slice

| Kandidat | Warum nicht |
| --- | --- |
| AP-4 Archiv-UX | Trip-`status`; keine Traveller-Lücke |
| AP-5 / AP-6 | Auth bzw. Privacy; eigener Gate |
| AP-7 Registry | **SHARED-CONTRACT-GATE**; Current Truth würde sich verschieben |
| AP-8 Reiseprofil | keine Shadow-Identität vor ADR |
| `/planen`-Runtime | verboten |
| Pass-/MRZ-Speicherung | besonderes PO-Gate |
| Echter Requirements-Provider | Provider-Gate |

### Empfehlung nach Re-Review

Weiter **trip-scoped leftover closure**, kein AP-4, kein AP-7:

1. Official-Präsentation option-scharf machen, ohne `result` zu erfinden (P1-TA-02).
2. Latenten `documents[0]`-Fallback härten, bevor ein neuer Caller ihn trifft (P2-TA-06).
3. UI progressiv; kein „besserer Pass“.
4. Fixture-Hygiene.

Nur wenn TL/PO ausdrücklich accountweite Wiederverwendung wollen: zuerst ADR-Nachfolger, dann ein minimaler AP-7-Schnitt. **Nicht aus diesem Audit starten. Kein Contract hier vorgezeichnet.**

### AP-4

Darf später nur `trips.status` schreiben. Archiv ≠ Traveller-Identität.

---

## 10. Auswirkungen AP-4–AP-12 ohne Vorziehen

| Slice | Abhängigkeit | Vorziehen? |
| --- | --- | --- |
| AP-4 Archiv | nur Trip-Status | nur als Status-Write |
| AP-5 Sicherheit | keine | eigener Auth-Gate |
| AP-6a Legal | D0-P1-03 | eigener Legal/PO-Slice |
| AP-6b Export/Löschung | keine Registry heute | nach Privacy-Contract |
| AP-7 Registry | **SHARED-CONTRACT-GATE** | **nein** |
| AP-8 Reiseprofil | kein Shadow-Traveller | **nein** vor Gate |
| AP-9 Favoriten | isolierbar | nach Nutzenfrage |
| AP-10 Buchungsübersicht | lesend | ohne Traveller-PII |
| AP-11 Notifications | keine Identity-Payloads | nach Provider/Safety-Gates |
| AP-12 Abo | Entitlement | eigener Billing-Gate |

---

## 11. Parallel-PR-Abhängigkeitsmatrix

| Arbeit | Shared? | Regel |
| --- | --- | --- |
| D0-2 #74 | nein | nicht `ACTIVE_WORK_STATUS` |
| TW-6 #75 | Guest-One-Trip | Takeover-Arrays nicht ändern |
| Provider #77 | Port bleibt `null` | kein Adapter |
| Admin #78 / QS-2 #79 | auf `main` | nicht zurückdrehen |
| Account-Audit #39 | historischer Plan | kein `main`-Registry-Vertrag |

---

## 12. Was dieser Audit nicht behauptet

- Keine selbst durchgeführte Supabase-Query; Production-Foundation-E folgt TL-Live-Evidence.
- Kein Browser-/Real-Device-Beweis.
- Kein lokaler `npm test` / Production-Build in diesem Korrektur-Lauf.
- Keine Freigabe für AP-4 oder AP-7.
- Kein erfundener Account-Registry-Contract.
- Kein Default-Pass im aktuellen App-Pfad.
- Keine Änderung an Auth, RLS, Guest→Account, `/planen`, Route, Provider, Payment, Growth.

---

## 13. STOPP

Korrektur von Evidence und Severity umgesetzt. **STOPP.**

Kein Ready. Kein Merge. Kein Folgeslice. Unabhängiges Technical-Lead-Re-Review von Draft-PR #76.
