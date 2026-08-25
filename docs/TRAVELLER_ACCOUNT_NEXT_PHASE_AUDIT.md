# Jetnity – Traveller / Account Next-Phase Dependency Audit

Stand: 26. August 2026  
Agent: `Account plattform audit vorbereitung`  
Typ: **AUDIT / EVIDENCE ONLY**  
Status: **AUSGEFÜHRT / STOPP für unabhängigen Technical-Lead-Review**  
Branch: `audit/traveller-account-next-phase`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/76  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Auftrag: `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT_TASK.md`

Keine Runtime. Kein Shared-Contract-Change. Kein AP-4. Kein Ready. Kein Merge.

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

---

## 1. Live-Rekonstruktion

Verifiziert in diesem Lauf, nicht aus Erinnerung.

| Prüfung | Live-Stand |
| --- | --- |
| `origin/main` | `ba86279e5ee2505bfd13801ae5e05ef50ba87c22` – *Merge PR #73: rigorous Technical Lead merge autonomy* |
| Audit-Branch | `audit/traveller-account-next-phase` |
| Merge-Base gegen `origin/main` | genau `ba86279e` |
| Ahead / Behind | **2 / 0** vor diesem Bericht (Task + Status-Init); dieser Bericht ist ein weiterer Docs-Commit |
| PR #76 | Draft, OPEN, `MERGEABLE`, 0 Review-Threads, 0 Human-Reviews |
| Issue-Kommentar #76 | nur Vercel-Bot |
| CI auf Init-Head `def1b637` | Actions `32910175439` **SUCCESS** (Typecheck/Lint/Build + Auth-Konfiguration) |
| Vercel auf Init-Head | **SUCCESS** `136h44sfwexeuYaoRKwJ7zFJx5UY` |
| Dieses Run: Supabase Production live abgefragt? | **nein** |
| Dieses Run: Production-Build / volle Testsuite auf dem Audit-Branch? | **nein** – Docs-only; Init-Head-CI grün |

Parallele offene Draft-PRs auf `main` (nicht verändert):

| PR | Branch | Typ | Traveller-/Account-Kollision |
| --- | --- | --- | --- |
| #74 | `feat/d0-2-canonical-origin-consistency` | D0-2 Runtime, eng | keine Traveller-Truth; Canonical/Origin |
| #75 | `audit/tw6-guest-one-trip-dependency` | TW-6 Audit | Guest-One-Trip-Vertrag; kein Traveller-Modell |
| #77 | `audit/provider-s4-s8-provenance` | Provider-Audit | keine Traveller-Registry |
| #78 | `audit/admin-d-k-growth-control` | Admin-Audit | keine Identity-Tabellen |
| #79 | `audit/qs2-quality-security-resilience` | QS-Audit | prüfend, nicht modellierend |
| #39 | `audit/account-platform` | älterer Account-Audit | enthält `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`; **nicht** auf `main` |
| #40 / #50 / #52 / #28 | ältere Drafts | fremd | nicht angefasst |

Lokaler `git fetch --depth=1` der Parallel-Branches lieferte **keine** zuverlässige Merge-Base (shallow). PR-Metadaten und Base `main` sind live bestätigt. Keine dieser Parallel-Arbeiten darf `docs/ACTIVE_WORK_STATUS.md` mitschreiben.

Ältere Account-Statusdateien (AP-1 `#43`, AP-2 `#48`, AP-3 `#53`) beschreiben historische Draft-Heads. **Aktuelle Wahrheit:** AP-1–AP-3 sind auf `main` gemergt (`ROADMAP.md` 6a–6f; Squash-Merges `084f7c87`, `2827d1cb`, `8326e72f`).

---

## 2. Kanonisches Modell und Current Truth

Verbindlich:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass. Ausstellerland ist nicht automatisch Staatsbürgerschaft. Fehlende Evidence bleibt `unknown` / `insufficient_context`.

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
| Account-Traveller-Registry | **fehlt** | geplant als AP-7, nicht gebaut |
| Default-Pass / primäre Staatsbürgerschaft | **nicht modelliert** | verboten |

Gast trägt dieselbe `Trip.party`-Form in `jetnity:reise:v3`. Guest→Account kopiert Citizenship- und Document-Arrays vollständig (`GastreiseBruecke` → `partyUebernehmen` → `party_schreiben`).

ADR-0117 hat ein globales Nutzerprofil **bewusst abgelehnt**: Residence/Dokumente würden über Reisen vermischt und mehr PII anziehen. AP-7 darf das nicht still umkehren.

`docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` liegt **nicht** auf `main` / diesem Branch. Es existiert auf `audit/account-platform` (PR #39). `docs/JETNITY_BINDING_BUILD_ORDER.md` zitiert die Datei trotzdem als Folgeplan für AP-4–AP-12. Das ist eine Dokumentationslücke, kein Runtime-Defekt.

### 2.2 Issuer ≠ Citizenship

Belegt:

- ADR-0120 Nachtrag: Ausstellerland ist keine Staatsbürgerschaft; `relatedCitizenshipCountryCode` bleibt `null` ohne gespeicherte Relation.
- `lib/readiness/dokument-formular.ts` hält `issuingCountryCode` und `citizenshipClientRef` getrennt; Relation nur, wenn die Citizenship-Ref in der erlaubten Menge liegt.
- Migration `20260822180000_traveller_context_rereview.sql` neutralisiert den alten Backfill, der `citizenship_id` setzte, wenn Issuer = Nationalität.

### 2.3 Production / Schema

`JETNITY_START_HERE.md` und `docs/JETNITY_BINDING_BUILD_ORDER.md` behandeln Foundation E als vorhanden und **nicht neu zu bauen**. Zuletzt live verifizierte Production-Migrationen in START_HERE enden bei `20260824140000` (Flug-Surface). Die Foundation-E-Migrationen `20260822160000` / `20260822170000` / `20260822180000` liegen zeitlich davor.

Dieser Audit hat Supabase Production **nicht** erneut abgefragt. ADR-0117–0126 tragen historisch noch „Production nicht anwenden“ / „Development“. Das ist ADR-Text vom 22.–23. August, kein frischer Production-Beweis dieses Laufs.

**Insufficient evidence (dieses Run):** aktueller exakter Production-Migrationsstand der Child-Tabellen. Nicht als neu verifiziert behaupten.

---

## 3. Feature-by-Feature-Matrix

Legende: `correct` / `partial` / `missing` / `conflicting` / `insufficient evidence`.

| Fläche | Bewertung | Begründung |
| --- | --- | --- |
| DB Parent/Child 1:n | **correct** | `trip_travellers` + Citizenships + Documents; Limits 8/12; Composite-FK `(id, trip_id, user_id)` |
| Domain `TripTraveller` | **correct** | Arrays; Kommentar verbietet accountweite Profile; keine Nummer/Scan/MRZ |
| `credentialOptionsAus` | **correct** | eine Option je Dokument; ohne Dokument `:none`; Issuer nicht als Citizenship |
| Engine-Hauptschleife ab Trip-Graph | **correct** | `travellerAusSlot` nutzt `credentialOptionsAus` |
| Attention / TW-4 | **correct** | verbietet `cit:*` als Official-Ref; Test `Multi-Citizenship ohne Documents nutzt kanonische :none-Refs` |
| Vergleich | **correct** | fail-closed; `< 2` Optionen oder fehlende Evidence → `VERGLEICH_NICHT_VERFUEGBAR`; kein Winner aus Teil-Evidence |
| Route / Transit | **correct** | traveller-neutral; keine Citizenship-/Document-Annahme in `lib/route` |
| Seasonal Produktpfad | **correct** | traveller-neutral; Fixture-Bias nur in Tests (siehe unten) |
| Safety | **partial** | citizenship-**set** je Traveller, nicht credential-option-scoped; zulässig, solange Facts nur citizenship-abhängig sind |
| Reisevorbereitung UI | **partial** | erfasst bis 8 Citizenships / 12 Dokumente; trennt Issuer und Citizenship-Relation; zeigt bei >1 Dokument den Vergleich-Hinweis; **keine** progressive per-Option Official-Darstellung |
| Guest-Persistenz | **correct** | dieselbe `party[]`-Form |
| Guest→Account | **correct** | kopiert Arrays inkl. `citizenshipClientRef`; kein stilles Reduzieren auf einen Pass |
| Account `/account` AP-1 | **correct** (nicht relevant) | Personenzahl aus `trips.travellers`; keine Registry, kein Default-Pass |
| Account `/reisen` AP-3 | **correct** (nicht relevant) | Datumsgruppen; `archived` bleibt sichtbar (Trip-Status, keine Identität) |
| Account-Traveller-Registry | **missing** | AP-7; Shared-Contract-Gate |
| Account Dokument-Lifecycle | **missing** | kein accountweites Edit/Archive/Detach |
| Engine-API-Normalisierung | **conflicting** | fehlt `credentialOptions` → synthetisiert **eine** Option aus `documents[0]` / Legacy-Singular |
| Official-Legacy-Objekt | **partial** | `officialAusEvaluations` nimmt `evaluations[0]`; `result` bleibt immer `unknown` (fail-closed), aber Badge/Reason/Authority sind first-evaluation |
| Official-Badge-Zuordnung | **partial** | `officialFuer` filtert Land+Traveller, fällt sonst auf **alle** Evaluations zurück, dann wieder `[0]` |
| Legacy-Singularfelder | **partial** | Expand/Contract bewusst; geladene leere Children sind autoritativ (ADR-0123) |
| Planner `/planen` | **insufficient evidence / nicht relevant für diesen Slice** | legt Kopfzahl, nicht Party-Identität; Runtime hier verboten |
| Commercial / Provider-Handoff | **correct** (nicht relevant) | kein Traveller-Credential-Handoff; Requirements-Factory bleibt `null` |
| Account-Plan auf `main` | **missing** | `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` nur auf PR #39 |

---

## 4. Single-Citizenship- / Single-Document-Fundstellen

Nur Stellen, die eine fachliche Annahme erzwingen oder implizieren. Reine Test-Fixtures ohne Produktpfad sind getrennt markiert.

### 4.1 Conflicting – stilles First-Document

**Datei:** `lib/readiness/engine.ts` → `travellerNormalisieren`  
**Aufrufer:** `requirementsAuswerten` / lokale Requirements, wenn `anfrage.travellers` ohne `credentialOptions` kommt.

Wenn `credentialOptions` fehlt oder leer ist, wird genau **eine** Option gebaut aus `documents[0]` oder Legacy-`documentType` / `documentIssuingCountryCode`. Das ist ein Default-Pass auf dem API-/Legacy-Pfad.

Der Trip-Graph-Pfad (`travellerAusSlot`) setzt `credentialOptions` immer über `credentialOptionsAus` und trifft diesen Fallback nicht.

**Tests:** `lib/readiness/engine.test.ts` und `anfrage.test.ts` füttern überwiegend `nationalityCountryCode: 'CH'` und prüfen `documents[0]`. Sie decken den Fallback nicht als Verbot.

**Schwere:** P1 Product-Truth. Kein erfundenes Visa-Result (`result` bleibt ohne Provider `unknown`), aber eine verbotene Option-Synthese.

### 4.2 Partial – Official-Zusammenfassung ist first-evaluation

**Datei:** `lib/readiness/anforderungen.ts` → `officialAusEvaluations`  
Immer `result: 'unknown'`. `status` / `authority` / `sourceUrl` / `reason` stammen aus `evaluations[0]`.

**Datei:** `lib/readiness/status.ts` → `officialFuer`  
Filter nach Land + `travellerClientRef`. Kein Treffer → alle Evaluations. Anschließend wieder `officialAusEvaluations` → `[0]`. Nicht `credentialOptionRef`-scharf.

**Schwere:** P1 Presentation-Truth für Badge/Reason; regulatorische Pflicht wird nicht erfunden.

### 4.3 Correct – bewusst kein Default

| Stelle | Evidence |
| --- | --- |
| `credentialOptionsAus` | eine Option je Dokument oder `:none` |
| `lib/trips/attention.test.ts` | `cit:*` darf Official-Vollständigkeit nicht erfüllen |
| `lib/readiness/vergleich.ts` | `< 2` Optionen → nicht vergleichbar |
| `Reisevorbereitung.tsx` | bei `documents.length > 1` Vergleich-Hinweis; Add-Limits 8 / 12 |
| ADR-0120 / 0124 / 0125 | kein erster Pass als Wahrheit; Konfliktoption bleibt sichtbar |

### 4.4 Test-Fixture-Bias (kein Produktpfad)

| Datei | Annahme |
| --- | --- |
| viele `lib/readiness/*.test.ts` | eine CH-Citizenship, Zugriff über `documents[0]` |
| `lib/seasonal/provider-anfrage.test.ts` | `issuingCountryCode` und `citizenshipClientRef` = `codes[0]` |
| `lib/safety/engine.test.ts` / `lib/seasonal/engine.test.ts` | Citizenship-Refs `…:cit:${code}` als Testdaten |

Produktpfade Seasonal/Safety erfinden daraus keinen Default-Pass. **P2 Test-Hygiene.**

### 4.5 Nicht Single-Document, trotz Singularname

`individualClaimsForbidden` und Missing-Fact `nationality` in `lib/readiness/status.ts` / `travellerFehlendeKernfakten` meinen „mindestens eine Staatsbürgerschaft fehlt“, nicht „genau eine ist erlaubt“.

---

## 5. Konsumenten

### 5.1 Trip Create / Planner

`public.reise_anlegen()` / `reise_aendern()` schreiben **keine** Traveller-Zeilen, nur `trips.travellers` (Kopfzahl). Party entsteht später über `party_schreiben` bzw. Gastspeicher. Kein Default-Pass im Create.

### 5.2 Readiness / Einreise

Kanonisch: Optionen getrennt, kein echter Requirements-Provider, Vergleich fail-closed. Lücken: Abschnitt 4.1 und 4.2. UI erfasst 1:n, zeigt Official nicht per Option.

### 5.3 Route / Transit

Keine Party-/Citizenship-Nutzung in `lib/route`. Traveller-neutral. **correct.**

### 5.4 Safety

`lib/safety/engine.ts` → `travellerRelevant`: Fact mit `travellerDependent` matcht gegen **Citizenship-Menge** des Slots (`citizenshipCodesAus`). Kein `documents[0]`. Wenn ein späterer Safety-Fact dokumentabhängig wäre, wäre das Modell zu grob. Heute: **partial, zulässig.**

### 5.5 Account / Reiseprofil

AP-1 Übersicht und AP-3 `/reisen` nutzen Personenzahl und Reisedaten. Keine Citizenship, kein Dokument, keine Registry. `lib/account/naechste-reise.ts` schließt `status === 'archived'` nur für „nächste Reise“ aus; AP-3-Gruppen filtern `archived` nicht. Das ist Trip-Status-UX, kein Identitätsmodell.

### 5.6 Guest→Account

`components/trips/GastreiseBruecke.tsx` übergibt Citizenships und Documents inkl. `citizenshipClientRef`. ADR-0124: nicht auflösbare Traveller-Ref bricht Readiness-Übernahme ab, statt trip-level zu degradieren.

### 5.7 Commercial / Provider

Requirements-Factory bleibt `null`. Kein Credential-Handoff an Flug/Hotel/Activity. Marketing darf Identity-/Document-Daten nicht targeten (`JETNITY_BINDING_BUILD_ORDER.md`).

---

## 6. Privacy / RLS / Ownership / Lifecycle

### 6.1 RLS (lesend geprüft)

`trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents`:

- RLS an
- Policies: `user_id = (select auth.uid())` für SELECT/INSERT/UPDATE/DELETE
- `REVOKE ALL` von `public`/`anon`
- `GRANT` CRUD an `authenticated`

Writes der App sollen über `public.party_schreiben(jsonb)` laufen (ADR-0119, `SECURITY INVOKER`). `authenticated` hat trotzdem direkte Child-Tabellenrechte. Das ist bewusst; Direct-Writes können Parent-Lock/Atomarität umgehen. **P2 Ownership-Härte**, kein neues Loch dieses Audits.

### 6.2 Delete / Archive / Detach

| Aktion | Heute |
| --- | --- |
| Trip löschen | CASCADE auf Traveller + Children |
| Traveller löschen | CASCADE Documents + traveller-spezifische Readiness (ADR-0121) |
| Citizenship löschen | Document-Relation `ON DELETE SET NULL (citizenship_id)` |
| Traveller archivieren / von Reise lösen | **fehlt** |
| Account-Profil löschen | **kein Profil** |
| Konto löschen | `trips.user_id` → `auth.users` `ON DELETE CASCADE`; kein separater Traveller-Delete-UX |

AP-6b (Privacy/Export/Kontolöschung) aus dem Account-Plan auf PR #39 wäre der spätere Lifecycle-Schnitt. Nicht vorziehen.

### 6.3 Data Minimization

Gespeichert: ISO-2 Citizenship, optional Residence, Document-Typ, optionales Ausstellerland, optionales Ablaufdatum, optionale Citizenship-Relation, neutrales Label. **Keine** Nummer, kein Scan, keine MRZ, keine Biometrie. Constraints verbieten Ausweisnummern auf der Parent-Zeile.

Das bleibt ein besonderes PO-Gate. Dieser Audit empfiehlt **keine** Speicherung davon.

### 6.4 Growth / Marketing

Identity-/Document-Daten dürfen kein Targeting speisen. Kein heutiger Commercial-Handoff gefunden. Risiko entsteht erst, wenn AP-7 oder Growth-CRM accountweite Traveller-PII anlegt.

### 6.5 Risiken

1. Account-Registry ohne neuen ADR würde ADR-0117 widersprechen und PII über Reisen vervielfachen.  
2. AP-4 Archiv-UX darf keine Schatten-Identität werden (Reisende „archivieren“ ≠ Reise archivieren).  
3. Legacy-Singularspalten bleiben stehen; ADR-0123 schützt vor Wiederauferstehung gelöschter Children, solange Children geladen sind.  
4. Direkte `authenticated`-Writes auf Children umgehen `party_schreiben`.  
5. Gast-`localStorage` trägt dieselben Traveller-Fakten; das ist akzeptiert, nicht account-scoped.

---

## 7. Findings P0–P3

### P0

**Kein Runtime-P0** auf dem Trip-Graph-Pfad: kein erfundener Visa-Winner, kein Default-Pass in Attention/Vergleich/UI-Erfassung, Route bleibt traveller-neutral.

**P0-STOP (Governance):** Jede account-scoped Traveller-Identität, jede Änderung an `party_schreiben` / Guest→Account / RLS / AP-7-Tabellen ist ein **Shared Contract**. Dokumentiert. **STOPP.** Kein Folgeslice durch diesen Agenten.

### P1

| ID | Finding |
| --- | --- |
| P1-TA-01 | `travellerNormalisieren` synthetisiert eine Option aus `documents[0]`, wenn `credentialOptions` fehlt. |
| P1-TA-02 | Official-Badge/Reason/Authority sind first-evaluation (`officialAusEvaluations` + `officialFuer`-Fallback), nicht option-scharf. Regulatorisches `result` bleibt `unknown`. |

### P2

| ID | Finding |
| --- | --- |
| P2-TA-01 | UI zeigt Official nicht progressiv pro Credential-Option. |
| P2-TA-02 | Test-Fixtures implizieren oft eine CH-Citizenship und `documents[0]`; Seasonal-Fixture setzt Issuer = `codes[0]`. |
| P2-TA-03 | `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` fehlt auf `main`; Build Order zitiert ihn. |
| P2-TA-04 | `authenticated` darf Child-Tabellen direkt schreiben. |
| P2-TA-05 | Safety ist nur citizenship-set-scharf; dokumentabhängige Facts wären unmodelliert. |

### P3

| ID | Finding |
| --- | --- |
| P3-TA-01 | Legacy-Singularspalten + Expand/Contract bleiben bis zum eigenen Cleanup-Block. |
| P3-TA-02 | AP-3 zeigt gespeichertes `archived` in Datumsgruppen; das ist AP-4-Trip-Status, kein Traveller-Gap. |
| P3-TA-03 | HANDOFF / `ACTIVE_WORK_STATUS` nennen ältere Governance-Baseline `5f9dc4b0`; live `main` ist `ba86279e`. Nicht in diesem PR „reparieren“. |
| P3-TA-04 | ADR-0117–0126 Production-Formulierungen sind historisch; nicht als frischen Production-Beweis lesen. |

---

## 8. Shared-Contract-Entscheidungen – dokumentieren und STOPP

Technical Lead / Product Owner müssen **vor** jedem account-scoped Traveller-Slice entscheiden:

1. **Bleibt Current Truth trip-scoped?** ADR-0117 hat accountweite Profile abgelehnt. AP-7 braucht einen **ADR-Nachfolger**, der Wiederverwendung ohne zweite Identität und ohne Default-Pass definiert.
2. **Reuse-Semantik:** Kopie in `party[]` je Reise vs. Live-Referenz auf Account-Profil. Live-Referenz ändert Readiness/Stale über Reisen hinweg.
3. **Keine Primär-Citizenship / kein Default-Pass** auf Account-Ebene. Welche Option in welcher Reise gilt, bleibt kontextabhängig.
4. **Issuer bleibt ungleich Citizenship** auch in einem späteren Registry-Schema.
5. **Delete/Detach/Archive:** Traveller von einer Reise lösen vs. accountweit löschen vs. Trip-CASCADE. Heute gibt es nur Trip-/Traveller-Delete.
6. **Guest-Opt-in:** Wann darf Gast-Party in ein Account-Profil übergehen? Heute nur trip-takeover.
7. **Official-API-Vertrag:** Ist das Legacy-Objekt `officialAusEvaluations` weiter first-evaluation+`unknown`, oder muss die öffentliche API option-scharf sein, bevor UI das zeigt?
8. **P1-TA-01:** Ist das Entfernen der First-Document-Synthese eine Contract-Klärung der Requirements-API oder ein trip-interner Leftover-Fix? Beides berührt den Traveller-Shared-Contract, sobald externe API-Konsumenten existieren.
9. **Sensitive Felder:** Passscan / MRZ / Biometrie / Nummern bleiben besonderes PO-Gate. Nicht in den nächsten Slice.

**Dieser Audit ändert keinen dieser Verträge.**

---

## 9. Kleinster fachlich korrekter nächster Traveller-/Account-Slice

**Nicht jetzt ausführen.** Empfehlung für den Technical Lead nach Review.

### Nicht der nächste Slice

| Kandidat | Warum nicht |
| --- | --- |
| AP-4 Archiv-UX | Trip-`status`-Write; schließt kein Traveller-Gap; darf keine Schatten-Identität werden |
| AP-5 Security / MFA | Auth-Contract; kein Traveller |
| AP-6 Privacy-Foundation | Legal/Consent/Delete; braucht eigenen Gate; kein Modell-Fix |
| AP-7 Registry | Shared-Contract-Blocker; würde Current Truth verschieben |
| AP-8 Reiseprofil | zweite Präferenz-/Identitätsebene; erst nach Registry-Entscheidung |
| `/planen`-Runtime | verboten; legt nur Kopfzahl |
| Pass-/MRZ-Speicherung | besonderes PO-Gate |
| Echter Requirements-Provider | Provider-Gate, nicht Account |

### Empfohlener nächster Slice nach STOPP + TL/PO

**Traveller leftover closure, weiter trip-scoped** (kein AP-4, kein AP-7):

1. First-Document-Synthese in `travellerNormalisieren` entfernen: fehlende `credentialOptions` → ehrliche `:none` / `insufficient_context`, nicht `documents[0]`.
2. Official-Präsentation: Badge/Reason nicht still aus `evaluations[0]` bzw. All-Evaluations-Fallback ableiten, wenn mehrere Optionen existieren.
3. UI: vorhandene Optionen progressiv zeigen; kein „besserer Pass“.
4. Tests: Fixtures, die Issuer = erste Citizenship setzen, als Fixture kennzeichnen oder korrigieren; Regression gegen Default-Pass.

Das vervollständigt das **bereits gebaute** Foundation-E-Modell produktweit, ohne account-scoped Identität.

Nur wenn TL/PO ausdrücklich accountweite Wiederverwendung wollen: zuerst ADR-Nachfolger zu ADR-0117/0102, dann ein **minimaler** AP-7-Schnitt. Nicht aus diesem Audit starten.

### AP-4 danach

Archiv-UX darf **parallel oder danach** kommen, **wenn** sie nur `trips.status` schreibt und Reisende nicht archiviert, merget oder als Profil behandelt. Binding Build Order hält Traveller-Vervollständigung **vor** AP-4–AP-12; AP-4 ist davon unabhängig, sobald klar ist, dass Archiv ≠ Traveller-Identität.

---

## 10. Auswirkungen AP-4–AP-12 ohne Vorziehen

| Slice | Abhängigkeit von diesem Audit | Darf vorgezogen werden? |
| --- | --- | --- |
| AP-4 Archiv | keine Traveller-Registry; nur Trip-Status | nur als reiner Status-Write; nicht als Identität |
| AP-5 Sicherheit | keine | ja, eigener Auth-Gate |
| AP-6a Legal-Seiten | `/privacy`/`/terms` 404 (D0-P1-03) | eigener Legal/PO-Slice |
| AP-6b Export/Löschung | CASCADE heute über Trips; keine Registry | nach Privacy-Contract |
| AP-7 Registry | **blockiert** auf Abschnitt 8 | **nein** |
| AP-8 Reiseprofil | darf kein Shadow-Traveller werden | **nein** vor 8 |
| AP-9 Favoriten | isolierbar | ja, nach Nutzenfrage |
| AP-10 Buchungsübersicht | lesend `trip_items` | ja, ohne Traveller-PII |
| AP-11 Notifications | keine Identity-Payloads | nach Provider/Safety-Gates |
| AP-12 Abo | Entitlement; keine Traveller-Daten | eigener Billing-Gate |

Account AP-3-Rest (`archived` sichtbar in Datumsgruppen) bleibt AP-4-Trip-UX.

---

## 11. Parallel-PR-Abhängigkeitsmatrix

| Arbeit | Shared mit diesem Audit? | Regel |
| --- | --- | --- |
| D0-2 #74 | nein | Canonical/Origin; nicht `ACTIVE_WORK_STATUS` |
| TW-6 #75 | Guest-One-Trip, nicht Traveller-Modell | Takeover-Arrays nicht ändern |
| Provider #77 | Requirements-Port bleibt `null` | kein Adapter aus diesem Audit |
| Admin #78 | Growth darf keine zweite Identity | keine Traveller-PII in CRM |
| QS-2 #79 | darf diese Findings prüfen | keine Runtime hier |
| Account-Audit #39 | historischer Plan | nicht mergen, nicht als `main`-Plan behandeln |
| Collaboration #28 | fremd | nicht anfassen |

---

## 12. Was dieser Audit nicht behauptet

- Kein neuer Production-Migrationsbeweis.
- Kein Browser-/Real-Device-Beweis.
- Kein vollständiger `npm test` / Production-Build auf dem Docs-Head nach diesem Bericht.
- Keine Freigabe für AP-4 oder AP-7.
- Keine Änderung an Auth, RLS, Guest→Account, `/planen`, Route, Provider, Payment, Growth.

---

## 13. STOPP

Audit ausgeführt. Shared-Contract-Bedarf dokumentiert. **STOPP.**

Nächster Schritt liegt beim unabhängigen Technical-Lead-Review von Draft-PR #76. Dieser Agent startet keinen Folgeslice, setzt den PR nicht Ready und merged nicht.
