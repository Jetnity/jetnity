# Jetnity – Provider S4–S8 Dependency / Provenance Gap Audit

Stand: 26. August 2026  
Agent: `Jetnity provider readiness audit`  
Typ: **AUDIT / EVIDENCE / READINESS PREPARATION ONLY**  
Branch: `audit/provider-s4-s8-provenance`  
Draft-PR: `#77`  
Baseline (Audit-Start): `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Aktueller `main` (Severity-Korrektur): `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`  
Auftrag: `docs/PROVIDER_S4_S8_PROVENANCE_AUDIT_TASK.md`  
Technical-Lead-Review: **CHANGES REQUIRED an Severity-Taxonomie** – dieser Stand korrigiert nur die Klassifikation. Keine Runtime.

Keine Runtime. Keine Provideraktivierung. Keine Secrets. Keine Verträge. Keine paid calls. Keine echten Preise/Verfügbarkeiten. Keine DB/Migration/RLS. Kein Auth/Traveller/Route/Payment. Kein TW-8 Runtime. Kein Marketing-/Tracking. Keine neuen Kosten. `docs/ACTIVE_WORK_STATUS.md` nicht geändert.

Zielarchitektur, ältere Matrix-Zellen und Slice-Pläne sind **nicht** der aktuelle Ist-Zustand. Wo Dokumentation hinter `main` zurückliegt, gewinnt der verifizierte Code.

---

## 0. Verdict

S1–S3 sind auf aktuellem `main` **integriert**. S4–S8 sind **nicht implementiert**.

Jetnity hat heute:

- provider-neutrale Ports und fail-closed Factories;
- einen S1-Operationsvertrag (`lib/provider-ops/*`) inkl. In-Memory-Cost-Guard und Observability-**Typ**;
- serverseitige Nachweisverträge für Flug, Hotel, Aktivität, Mobility und Rental;
- Truth-Freshness für Official / Safety / Seasonal;
- **keine** Commercial-Offer-Provenance (`retrievedAt`, `freshUntil`, Währungsabgleich, Stale-Preis, Affiliate-Attribution).

Deshalb – als **Gates**, nicht als heutige P0-Incidents:

- **TW-8-START-GATE / BLOCKER:** TW-8 darf nicht starten. S5 / belastbare Commercial Provenance fehlt.
- **PROVIDER-ACTIVATION-GATE:** Kein bezahlter oder Production-Provider. In-Memory-Cost-Guard reicht dafür nicht. Heute ist kein solcher Provider aktiv.
- **S5 Shared Contract:** Bedarf dokumentiert, **STOPP**. Kein Universal-Offer, keine Feld-Implementierung.

Es gibt in diesem Audit **keine aktuellen P0-Production-Incidents**. Eine fehlende spätere Fähigkeit ist kein heutiger Incident.

Audit-PASS bedeutet nur: S4–S8 gegen aktuellen Code belegt, Severity nach Technical-Lead-Korrektur getrennt, S5-Gap-Map präzise, Shared-Contract-STOPP ausgesprochen. Es bedeutet **nicht** Ready, nicht Merge, nicht Folgeslice.

---

## 1. Live-Evidence

### 1.1 Git / PR

| Fakt | Wert |
| --- | --- |
| `origin/main` | `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f` |
| Vorherige Baseline | `ba86279e5ee2505bfd13801ae5e05ef50ba87c22` |
| Merge-Base nach Sync | `8ab4e666` = `origin/main` |
| Severity-Korrektur Exact Head | `ebd41f6eddea1796a839a28ef07fa5ef28d5d208` |
| Audit-Inhalt (vor Severity-Korrektur) | `52162a7b3cb341581f02970f2f95ba3a3c8cad26` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/77 |
| PR-State | OPEN, **Draft**, `MERGEABLE` |
| Review-Threads | keine (nur Vercel-Bot-Kommentar) |

### 1.2 Actions / Vercel

| Head | Gate | Ergebnis |
| --- | --- | --- |
| Audit `52162a7b` | GitHub Actions | SUCCESS `32911158128` |
| Audit `52162a7b` | Typecheck, Lint & Build | SUCCESS |
| Audit `52162a7b` | Auth-Konfiguration | SUCCESS |
| Audit `52162a7b` | Vercel | SUCCESS / READY `3r4Z9dw7nzDoJ17N7ftJH5s44Vuj` |
| Init `6b7e12da` | GitHub Actions | SUCCESS `32910187319` |
| Init `6b7e12da` | Vercel | READY `DYXXbFoQDhftEsEGvD2Kvj4JNmnN` |

Historische Heads bleiben Evidence. Der Exact Head dieser Severity-Korrektur muss eigene SUCCESS/READY-Evidence haben; Cursor-Aggregat-Views sind keine GitHub-PR-Diff-Evidence.

### 1.3 Historische Provider-PRs – nur Evidence

| PR | Titel | Live-Stand | Lesart |
| --- | --- | --- | --- |
| #45 | Provider Readiness Audit | MERGED | historischer Audit; Matrix/Policy können hinter S2/S3 zurückliegen |
| #47 | S1 Shared Ops | MERGED | Vertrag existiert auf `main` |
| #51 | S2 FlugNachweis | MERGED | Kontoübernahme nur IDs + Nachweis |
| #54 | S3 Mobility/Rental Nachweis | MERGED `b7f027ec` | ADR-0161 auf `main` |
| #50 | S1 merged-status docs | OPEN Draft | historisch; nicht als offene S1-Runtime lesen |
| #77 | dieser Audit | OPEN Draft | docs-only |

Parallele Audit-Drafts, nicht dieser Workstream: #75 TW-6, #76 Traveller/Account, #78 Admin D–K, #79 QS-2.

### 1.4 Dokumentationsdrift, die dieser Audit **nicht** still korrigiert

| Quelle | Behauptung | Verifizierter Stand auf `ba86279e` |
| --- | --- | --- |
| `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` | S3 nur auf Feature-Branch, kein Merge | S3 ist auf `main` (ADR-0161, PR #54) |
| `docs/PROVIDER_READINESS_MATRIX.md` | Flights Evidence `missing`; Mobility/Rental Nachweis Stub | S2/S3 haben async Nachweisverträge; Offer-Freshness fehlt weiter |
| `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md` §5 | Mobility/Rental Nachweis nur Stub | Stub-Form ist durch S3 ersetzt; Umgebung bleibt `null` |
| `docs/PROVIDER_OPS_S1_STATUS.md` | S1 Draft, kein Merge | Historischer Slice-Status; S1 liegt auf `main` |
| `docs/ACTIVE_WORK_STATUS.md` | `main` @ `5f9dc4b0` | Live-`main` ist `ba86279e`. Diese Datei wird hier **nicht** geändert. |

---

## 2. Was S1–S3 wirklich geschlossen haben

### S1 – Shared Ops (auf `main`)

Ist:

- `lib/provider-ops/*`: Outcomes, Request-Härtung, Kill-Switch-Form, async Cost-Guard-Port, In-Memory-Implementierung, Observability-Allowlist.
- Flights-Search nutzt die Hülle (`lib/flights/anfrage.ts`, `app/api/flights/search/route.ts`).
- Domain-Rate-Limits rufen `providerOpsInMemoryCostGuard` auf.
- Admin Slice C liest Kill-Switch / Cost-Guard-**Zustand**, nicht Live-Search-Health.

Nicht:

- keine Event-Persistenz, kein Schreiben von `providerOpsEvent` in Suchpfaden;
- kein persistenter globaler Zähler;
- Mobility/Rental-Timeout bleibt HTTP 504 (`lib/mobility/suche.ts`, `lib/rental-cars/suche.ts`; in `providerOpsHttpStatusFuerOutcome` bewusst ausgenommen);
- keine Readiness-/Safety-/Seasonal-Aktiv-Flags.

### S2 – FlugNachweis (auf `main`)

Ist: `FlugNachweis.nachweisen({ optionId, kontext })`. Browser sendet nur `tripId` / `dayId` / `optionId`. `booking_url` bleibt `null`. Guest persistiert keine Provider-Flugoption.

Nicht: Live-Duffel-Production, Offer-Freshness, Währung an Duffel, persistierter Snapshot-Zeitpunkt.

### S3 – Mobility/Rental Nachweis (auf `main`, ADR-0161)

Ist: async Nachweis analog Hotel/S2, domain-spezifischer Kontext, Umgebung `null`, Workspace-Suche nur über «Verbindungen prüfen».

Nicht: echter Adapter, Rental-Such-UI, S2-artige DB-Guards für `transfer` / `rental_car`. Residual: `reise_anlegen` / direkte `trip_items`-Writes können Handelsfelder als **User-Intake** setzen.

---

## 3. S4–S8 Current-State / Gap-Matrix

Legende: `ready` = Vertrag existiert und ist fail-closed getestet; `partial` = vorhanden, aber für den Slice unzureichend; `missing` = Slice-Soll fehlt im Code; `blocked` = extern / Product-Owner-Gate.

| Slice | Soll | Ist auf `ba86279e` | Fehlende Contracts | Abhängigkeiten | PO-Gates | Tests/Observability vor Runtime | Risiko |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **S4 Truth-Ops** | Readiness-Timeout/`AbortSignal`; Kill-Switch-Form für Readiness/Safety/Seasonal; Safety-Party nur aus serverseitigem Trip-Load; Readiness-Body-Cap prüfen | Safety/Seasonal: Timeout + `AbortSignal` ready. Readiness: `evaluate(anfrage)` ohne Signal, Throw → unknown. Kein `JETNITY_READINESS_AKTIV` / `SAFETY` / `SEASONAL`. Safety-API setzt `party: []`. Body-Cap Readiness 8 192 Bytes existiert | `RequirementsProvider.evaluate(..., signal?)`; Domain-Flags nach S1-Form; Safety-Party-Quelle | S1 Form vorhanden. Traveller-Truth bleibt Foundation E. Party-Load darf Trip nur **lesen** | Kein Adapter, keine Citizenship-Pflicht | Contract-Tests Timeout/Abort; Party nicht aus Browser-Citizenship | Hängender Regulatory-Call; travellerabhängige Safety über öffentliche API nie auflösbar |
| **S5 Commercial Provenance** | Offer-Felder `retrievedAt` / `freshUntil` / Währungsabgleich; persistierte Snapshots nie als Live-Preis; keine stillen Graph-Preis-Updates | Option-Typen haben `provider` + `externalRef` + Betrag/Währung. **Kein** `retrievedAt`, `freshUntil`, `quotedCurrency`, `requestedCurrency`. `trip_items` hat keine Provenance-Spalten. Duffel sendet `currency` nicht | **Neuer Shared Commercial-Provenance-Contract** – siehe §5 und §10. STOPP | S2/S3 Nachweisform vorhanden, reicht nicht für Freshness | Jede Persistenz neuer Felder = DB/RLS-Gate. Kein Live-Reprice | Fixture-Tests: mismatch/stale/partial/error getrennt | TW-8 würde Preis/Zeit/Komfort ohne Zeitpunkt vergleichen |
| **S6 Persistenter Cost Guard** | Globale Fenster-/Tageslimits, Vorbild `lib/modell/kontingent.ts` | Nur In-Memory je Prozess. Interface async, S6-fähig. Preview-Muster zulässig bis bezahlter Schlüssel | Persistenzschema, RLS, keine Reiseinhalte im Zähler | S1 Interface ready | **DB + Kostenmodell + Production** | Fail-closed bei Speicherfehler; Dedup optional | Erster bezahlter Adapter ohne globales Limit |
| **S7 Observability / Health** | S1-Events schreiben; `unavailable`/`empty`/`partial`/`timeout`/`internal` ableiten; kein Fake-Grün | Event-Typ existiert. Suchpfade schreiben ihn nicht. Admin Provider-Ops-Board: Kill-Switch/Cost-Guard/Model-Usage, nicht Search-Outcome. Tests verbieten `live`/`healthy` ohne Evidence | Schreib-Naht ohne Payload-Leak; read-only Ableitung | S1 Typ ready; Admin C Board existiert als **Leser von Zustand**, nicht von Search-Events | Kein Monitoring-SaaS, kein Provider-Ping | Fixture: empty ≠ unavailable; kein pauschales Grün | Admin oder Workspace zeigen Schein-Health |
| **S8 Cache / Lizenz-Hooks** | `cacheClass` / `persistClass` / `attributionRequired`; Default `forbidden` / `no-store` | Search-Responses `no-store`. Keine Hook-Felder an Optionen. Keine ToS-/Attribution-Wahrheit | Optionale Hook-Felder, **keine** erfundenen Lizenztexte | S1; kann parallel zu S4 geplant werden | Echter Vertrag bleibt Activation-Gate | Defaults fail-closed in Contract-Tests | Cache/Persistenz vor Lizenzprüfung |

---

## 4. Severity-Taxonomie (Technical-Lead-Korrektur)

Regel: **P0 ist ein akuter Production-Incident**. Ein fehlender späterer Slice, ein Start-Gate oder ein Activation-Gate ist kein P0, solange TW-8 und bezahlte Production-Provider nicht aktiv sind.

Eine zukünftige fehlende Fähigkeit ist nicht automatisch ein heutiger P1-Incident.

| Klasse | Bedeutung |
| --- | --- |
| **P0** | Akuter Production-Incident: live Fake-Truth, live Datenverlust, live bezahlter Missbrauch **jetzt** |
| **TW8-START-GATE / BLOCKER** | Muss geschlossen sein, bevor TW-8 Runtime starten darf |
| **PROVIDER-ACTIVATION-GATE** | Muss geschlossen sein, bevor ein bezahlter oder Production-Provider aktiviert wird |
| **P1-before-TW8 / Commercial-Truth-Gap** | Heutige Commercial-Lücke, die TW-8 sonst zu erfundener Vergleichswahrheit machen würde |
| **Aktueller Produktdefekt** | Heute belegtes, user-sichtbares oder shipped-API-Verhalten; kein Zukunfts-Adapter |
| **P2 / P3** | Residual, Continuity, bewusste Nicht-Arbeit |

### 4.0 Keine aktuellen P0-Incidents

Heute ist kein bezahlter Production-Provider aktiv und TW-8 ist nicht gestartet. Dieser Audit führt **keine offenen P0-Production-Incidents**.

Historische IDs `S4S8-P0-01` / `S4S8-P0-02` / `S4S8-P0-03` bleiben als Alias nachvollziehbar, gelten aber **nicht** mehr als P0.

PR-P0-01 (Browser-`FlugOption` persistieren) bleibt durch S2 **geschlossen**.

### 4.1 Gates (keine Incidents)

| ID | Alias | Klasse | Finding | Evidence | Folge |
| --- | --- | --- | --- | --- | --- |
| **S4S8-TW8-GATE-01** | früher S4S8-P0-01 | **TW8-START-GATE / BLOCKER** | TW-8 hat keinen erfüllten S5-Start-Gate | `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`; Binding Build Order; kein Offer-`retrievedAt` | TW-8 Runtime **nicht starten** |
| **S4S8-ACT-GATE-01** | früher S4S8-P0-02; historisch PR-P0-02 | **PROVIDER-ACTIVATION-GATE** | Persistenter Cost Guard fehlt | Domain-`rate-limit.ts` + `providerOpsInMemoryCostGuard` | Keine bezahlte / Production-Aktivierung. Heute kein solcher Provider aktiv, daher kein Incident |
| **S4S8-P1-TW8-01** | früher S4S8-P0-03 | **Commercial-Truth-Gap / P1-before-TW8** | Persistierter Betrag ohne observed/retrieved timestamp | `types/trips.ts` / `lib/trips/schema.ts`: `priceAmount` ohne `retrievedAt` | Vor TW-8-Vergleich trennen; kein heutiger P0 |

### 4.2 Aktuelle belegte Produktdefekte

Nur shipped Verhalten, das Nutzer oder eine vorhandene API **heute** treffen können. Keine fehlenden Zukunfts-Adapter.

| ID | Klasse | Finding | Evidence |
| --- | --- | --- | --- |
| **S4S8-P1-06** | aktueller Commercial-Honesty-Defekt; auch Pre-TW8 | Persistierter Hotel-/Aktivitätspreis ohne Snapshot-Label; Flug hat „zum Auswahlzeitpunkt“ | `TripWorkspacePlan.tsx`, `TripWorkspaceDetail.tsx` nur `kind === 'flight'` |
| **S4S8-P1-TW8-01** | Commercial-Truth-Gap / P1-before-TW8 | Persistierter Betrag ohne `retrievedAt`; Zahl kann ohne Zeitpunkt stehen | `priceAmount` am Item; Suchkarten-Copy ohne gespeicherten Timestamp |
| **S4S8-P2-06** | aktueller Residual, kein Incident | Safety-API setzt `party: []`; ehrlich unvollständig, keine Fake-Entwarnung. Factory `null` | früher S4S8-P1-04; `lib/safety/auswerten.ts` |
| **S4S8-P2-07** | aktueller Residual, kein Provider-Lie | `reise_anlegen` / direkte Writes können transfer/rental Handelsfelder als User-Intake setzen | früher S4S8-P1-11; ADR-0161 |
| **S4S8-P2-08** | aktueller Residual, ohne Adapter unerreicht | Mobility/Rental Timeout HTTP 504 weicht von S1-200 ab | früher S4S8-P1-10; Factories `null` |

### 4.3 Pre-TW8 Gates

Müssen stehen, bevor TW-8 Preise/Zeit/Komfort als vergleichbare Wahrheit zeigt. **Kein heutiger Incident.**

| ID | Finding | Evidence |
| --- | --- | --- |
| **S4S8-TW8-GATE-01** | TW-8-Start gesperrt bis S5-Contract | Plan + fehlende Offer-Provenance |
| **S4S8-P1-TW8-01** | observed/retrieved timestamp | Item- und Option-Typen |
| **S4S8-P1-01** | Offer-Provenance/Freshness fehlt (`retrievedAt`, `freshUntil`, Commercial-Stale) | Domain-Optionen Flug/Hotel/Aktivität/Mobility/Rental |
| **S4S8-P1-02** | Request- vs Quote-Währung ungeprüft; Duffel sendet `currency` nicht | `lib/flights/duffel/adapter.ts` |
| **S4S8-P1-07** | kein Multi-Provider-Konfliktvertrag | ein Port je Domäne |
| **S4S8-P1-08** | Deep-Link/Affiliate-Provenance fehlt; Search-`bookingUrl` ehrlich `null` | Übernahme-Module; Search ≠ Booking |
| **S4S8-P1-06** | Hotel/Aktivität ohne Snapshot-Label | Plan/Detail-UI |

S5-Gap bleibt fachlich: `retrievedAt`, `freshUntil`, requested vs quoted currency, commercial stale, affiliate provenance, multi-provider conflict. Shared Contract nur dokumentieren, nicht implementieren.

### 4.4 Pre-Provider-Activation Gates

Müssen stehen, bevor ein bezahlter oder Production-Provider an ist. **Kein heutiger Incident**, weil Factories `null` bzw. Duffel nur Test-Token und Production hart aus sind.

| ID | Finding | Evidence |
| --- | --- | --- |
| **S4S8-ACT-GATE-01** | persistenter Cost Guard | In-Memory je Prozess |
| **S4S8-P1-03** | Readiness ohne Timeout/`AbortSignal` | `lib/readiness/provider.ts` – erst relevant mit Adapter |
| **S4S8-P1-05** | Observability-Events werden nicht geschrieben | `providerOpsEvent` nur Typ + Test |
| **S4S8-P1-09** | öffentliche Search-/Evaluate-Routen + In-Memory-Limit | Guest-bewusst; Missbrauch erst mit paid key |
| **S4S8-P2-01** | Cache-/Lizenz-Hooks fehlen | `no-store` da, Vertrag fehlt |
| **S4S8-P2-02** | Readiness/Safety/Seasonal ohne `JETNITY_*_AKTIV` | Factory `null` ist heute die Bremse |
| **S4S8-P2-06** | Safety-Party nur aus serverseitigem Trip-Load | vor travellerabhängigem Live-Safety |

### 4.5 P2 / P3 (unverändert Residual)

| ID | Finding |
| --- | --- |
| **S4S8-P2-01** | Cache-/Lizenz-Hooks fehlen (S8). Default-Verhalten `no-store` ist da, Vertrag fehlt |
| **S4S8-P2-02** | Readiness/Safety/Seasonal ohne `JETNITY_*_AKTIV`, solange Factory `null` ist |
| **S4S8-P2-03** | Historische Provider-Docs widersprechen S2/S3-Ist. Continuity-Risiko, keine Runtime |
| **S4S8-P2-04** | Readiness 8 KB-Cap vs. Multi-Traveller: vorhanden, vor Adapter gegen reale Nutzlast prüfen |
| **S4S8-P2-05** | Admin Provider-Ops-Board ist Foundation/Kill-Switch, nicht Search-Health |
| **S4S8-P3-01** | Rental-Such-UI fehlt bewusst bis Anbieterwahl |
| **S4S8-P3-02** | Konkrete Mapping-Module Hotel/Activity/Mobility/Rental ohne API-Vertrag nicht bauen |
| **S4S8-P3-03** | Draft #50 und alte Slice-Statusdateien können Agenten täuschen |

---

## 5. S5 Commercial-Provenance Contract Gap Map

Soll aus Slice-Plan und Shared-Contract-Vorschlag **als Ziel**, nicht als Ist:

`providerId`, `externalRef`, `retrievedAt`, `freshUntil?`, `quotedCurrency`, `requestedCurrency`, sichtbares Stale, getrennte Affiliate-Attribution.

### 5.1 Feld-für-Feld

| Bedarf | Flug | Hotel | Aktivität | Mobility | Rental | Persistenz `trip_items` | UI heute |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Provider / Source | `provider` string | `provider` | `provider` | `provider` | `provider` | `provider` nullable | Trust „Herkunftsfelder“, kein Live-Nachweis |
| Angebots-/Produkt-ID | `id` + `externalRef` | gleich | gleich | gleich | gleich | `externalRef` | keine Offer-ID-Anzeige als Truth |
| Suchkontext | Nachweis-Kontext Legs/Pax/Kabine/Währung | Ziel/Daten/Belegung/Währung | Ziel/Tag/Teilnehmer/Timeslot | Orte/Datum/Modus | Stationen/Zeitraum/Klasse | **nicht** am Item gespeichert | Suche sendet Graph/Client-Kontext |
| observed / fetched | **fehlt** | **fehlt** | **fehlt** | **fehlt** | **fehlt** | **fehlt** | Suche: Copy „Preis zum Auswahlzeitpunkt“ ohne Timestamp |
| freshness / expiry | Nachweis kennt `abgelaufen`, Option hat kein `freshUntil` | gleich | gleich | gleich | gleich | kein Expiry | kein Stale-Badge für Preise |
| amount provenance | `priceAmount` Pflicht | `preisGesamt`/`preisProNacht` | `preis` nullable | `preis` nullable | `preis` + `preisIstGesamt` | `priceAmount` | Zahl wird gerendert |
| currency provenance | `priceCurrency`; Request-`currency` nicht an Duffel | `preisWaehrung` = Request | Preis/Währung gekoppelt | gekoppelt | gekoppelt | `priceCurrency` | kein Mismatch-Label |
| availability states | Search: ok/partial/empty/unavailable/timeout/error | analog | analog | analog + 504 | analog + 504 | Item hat kein Availability | Persistenz ≠ Search-Status |
| partial / missing / error / stale | Search-Status ja; Option-stale **nein** | Nachweis-Arten ja | ja | ja | ja | fehlender Preis = null, nicht error | Official/Safety/Seasonal-stale existiert; **Preis-stale nicht** |
| Deep-Link / Affiliate | `bookingUrl` bei Übernahme `null` | `null` | `null` | `null` | `null` | Schema erlaubt HTTPS-`bookingUrl` | Workspace rendert `bookingUrl` nicht (QS-1) |
| mehrere Provider | ein Development-Adapter (Duffel-Test) | Factory `null` | `null` | `null` | `null` | ein `provider`-String | kein Konflikt-UI |
| Marketing vs Produktprovider | getrennt in Policy | getrennt | getrennt | getrennt | getrennt | `bookingSource` nur `user` wenn gebucht | kein Marketing-Provider im Graph |

### 5.2 Was bereits Contract ist – und was nur Zielbild ist

**Contract (Ist):**

- Nachweisform `nachweisen({ optionId, kontext })` mit `unavailable | unbekannt | abgelaufen | geaendert | invalid | error`.
- Search-Outcomes in S1-Taxonomie.
- Search ≠ Booking; `booking_url` wird in Provider-Übernahme nicht erzeugt.
- Truth-Freshness (`checkedAt`, `freshUntil`, `stale`, `recheck_needed`) gilt für Official/Safety/Seasonal – **nicht** für Offers.
- UI-Copy „Preis zum Auswahlzeitpunkt“ auf Suchkarten Flug/Hotel/Aktivität ist eine **Präsentationsbehauptung ohne gespeicherten Zeitpunkt**.

**Zielbild, nicht Ist:**

- optionale Provenance-Felder am Offer;
- `requestedCurrency` vs `quotedCurrency`;
- persistierter Snapshot-Zeitpunkt;
- sichtbares Commercial-Stale;
- Affiliate-Click-/Partner-Provenance getrennt von `provider`;
- Konfliktregel, wenn zwei Quellen widersprechen;
- TW-8 Preis/Zeit/Komfort-Vergleich auf belegter Freshness.

### 5.3 Anforderungen an späteres TW-8

TW-8 darf erst starten, wenn mindestens gilt:

1. Jeder angezeigte kommerzielle Betrag trägt eine belegte Quelle **und** einen beobachteten Zeitpunkt **oder** wird als `unknown` / User-Intake geführt.
2. `stale` / `unavailable` / `error` / `partial` / fehlender Preis bleiben getrennt. Kein Kollabieren in „Preis geprüft“.
3. Währungsmismatch darf nicht als gleiche Wahrheit gerankt oder verglichen werden.
4. Persistierte Items ohne `retrievedAt` dürfen nicht in einen Live-Vergleich.
5. `bookingUrl` / Affiliate darf nicht still als Produktprovider oder Verfügbarkeit gelten.
6. Mehrere Provider: Konflikt bleibt `unknown` oder getrennte Angebote, nie gemittelter Preis.
7. Keine Secrets, keine paid calls, keine erfundenen `booking_url` in TW-8 selbst.
8. Marketing-Attribution bleibt außerhalb der Produktwahrheit.

Heute ist **keine** dieser Bedingungen vertraglich erfüllt. TW-5 darf vorhandene Beträge zeigen; das ist kein TW-8-Vergleich.

---

## 6. TW-8 Readiness Checklist

| # | Voraussetzung | Stand |
| --- | --- | --- |
| 1 | S5-Offer-Provenance-Contract Technical-Lead-akzeptiert | **nein** – Bedarf dokumentiert, STOPP |
| 2 | `retrievedAt` (oder gleichwertig) an Search-Option | **fehlt** |
| 3 | Persistierter Snapshot-Zeitpunkt oder ehrliches „ohne Zeitpunkt“ für alle Kinds | **fehlt** (Flug-Copy nur UI; Hotel/Aktivität persistiert ohne Label) |
| 4 | Währungsabgleich Request vs Quote | **fehlt**; Duffel sendet Request-Währung nicht |
| 5 | Commercial-Stale ≠ Official/Safety/Seasonal-Stale | Stale existiert nur in Truth-Domänen |
| 6 | Affiliate/Deep-Link getrennt und null-sicher | Search-Übernahme null; kein Attributionsvertrag |
| 7 | Konflikt mehrerer Provider definiert | **fehlt** |
| 8 | S6 nicht nötig für TW-8-**UI auf bestehenden Snapshots**, wohl nötig vor Live-Suche in TW-8 | Live-Suche **verboten** bis Activation + S6 |
| 9 | Keine Factory von `null` auf Live | Factories `null`; Duffel nur Test-Token, Production aus |
| 10 | Expresser Product-Owner-Auftrag für TW-8 Runtime | **nicht erteilt** |

**Checklist-Ergebnis: TW-8 nicht bereit. Kein Ready. Kein Folgeslice.**

---

## 7. Provider Activation Gate Matrix

| Schritt | Offline / Test ohne Credentials | Development + synthetische Fixtures | Braucht Vertrag | Secrets / API-Keys | Paid calls / laufende Kosten | Datenschutz / Lizenz / Terms | PO-Freigabe vor Production |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S4 Truth-Ops | ja | ja (Doubles) | nein | nein | nein | Party nur serverseitig lesen | nein für Slice; ja für Regulatory-Adapter |
| S5 Provenance-Felder (nach Contract-Freigabe) | ja | ja | nein für Felder | nein | nein | Snapshot darf keine Rohangebote leaken | DB-Felder = gesondertes Gate |
| S6 persistenter Guard | Design ja | Preview In-Memory darf bleiben | nein | nein | Kostenmodell-Entscheidung | Zähler ohne Reiseinhalt/PII | **ja** (Migration + Limits) |
| S7 Event-Write / Health-Ableitung | ja | ja | nein | nein | nein, solange kein Ping | kein Payload-Leak | Monitoring-SaaS = ja |
| S8 Hook-Defaults `forbidden` | ja | ja | **nicht erfinden** | nein | nein | echte ToS später | ja bei erstem Cache-Policy aus Vertrag |
| Duffel Live Search | nein | Test-Token heute möglich, Production hart aus | ja | ja | ja | Duffel ToS / Offer-Cache | **ja** |
| Hotel / Activity / Mobility / Rental Live | nein | Factory `null` | ja | ja | ja | Anbieter-ToS, Attribution | **ja** |
| Timatic / Safety / Seasonal Live | nein | Factory `null` | ja | oft ja | oft ja | Gov/Advisory-Lizenz | **ja** |
| Affiliate / Deep-Link / Commission | nein | `booking_url` null | ja | oft ja | ja | Attribution ≠ Produktprovider | **ja** |
| TW-8 Vergleichs-UI | nur auf S5-Contract | Fixtures | nein | nein | nein, wenn keine Live-Suche | keine Fake-Preise | Runtime-Auftrag + S5 |

Keine Zeile dieser Matrix ist durch diesen Audit aktiviert.

---

## 8. Security / Privacy / Cost / Licensing

| Klasse | Risiko | Jetzt | Vor Aktivierung |
| --- | --- | --- | --- |
| Security | Öffentliche Search-Routen + In-Memory-Limit | Guest-bewusst, Production-Flags aus | S6 + Auth-Modell (Produktfrage) |
| Security | Safety-Party aus Browser wäre Trust-Bruch | API erzwingt `party: []` – ehrlich unvollständig, nicht getürkt | Serverseitiger Trip-Load (S4), kein Client-Citizenship |
| Privacy | Observability darf Tokens, Namen, Routen, Preise nicht loggen | Event-Typ Allowlist existiert, wird nicht geschrieben | S7 muss Allowlist behalten |
| Privacy | Provenance-Persistenz darf kein Provider-Rohangebot speichern | Item speichert Betrag/Provider/Ref | S5-Felder minimieren |
| Cost | Erster Live-Key ohne globales Limit | In-Memory | S6 + PO |
| Cost | Mobility Auto-Search | geschlossen (S3) | Adapter erst nach Activation-Gate |
| Licensing | Cache/Persistenz ohne ToS | `no-store`; keine Hook-Wahrheit | S8 Defaults `forbidden` bis geprüfter Vertrag |
| Licensing | Affiliate als Produktwahrheit | nicht verdrahtet | getrennt halten |
| Truth | Zielarchitektur als Ist | dieser Audit trennt bewusst | Folgeslices dürfen Matrix 24.08. nicht als Current kopieren |

---

## 9. Empfohlene konfliktarme Reihenfolge

Nur Empfehlung. **Dieser Agent startet keinen Slice.**

```text
Dieser Audit (#77)  →  Severity-Korrektur  →  STOPP Technical-Lead-Re-Review
        │
        ▼
S4 Truth-Ops          │  S8 Hook-Defaults (nach S1, parallel zu S4)
        │             │  kein Vertragstext erfinden
        ▼             │
S5 erst nach          │
Shared-Contract-      │
Freigabe durch        │
Technical Lead        │
        │             │
        └──────┬──────┘
               ▼
        S6 persistenter Guard   ← seriell, DB-/Kosten-Gate
               ▼
        S7 Event-Write + ehrliche Ableitung
               ▼
        TW-8 nur mit S5-Contract + eigenem Auftrag
               ▼
        echte Providerphase     ← eigene PO-Gates
```

Nicht parallel zu S5: stilles Erweitern von S1 zu einem Offer-Modell.  
Nicht parallel zu S6: andere Auth/RLS-Arbeit ohne Technical Lead.  
Nicht in TW-5/TW-6/TW-7: Commercial-Vergleich.

S4 darf Account-/Trip-Zeilen nur lesen. S5 darf keine Route-/Traveller-Truth anfassen.

---

## 10. Shared-Contract-Bedarf – dokumentieren und STOPP

S1 hat den **Operationsvertrag** geliefert. S5 braucht darüber hinaus einen **minimalen Commercial-Provenance-Vertrag**.

Vorschlag (nicht implementiert, nicht angenommen):

```text
Gemeinsame optionale Felder an domain-spezifischen Optionen, kein UniversalOffer:

- providerId / provider
- externalRef
- retrievedAt          (ISO, Serverzeit der Beobachtung)
- freshUntil           (optional, nur wenn Quelle sie liefert)
- requestedCurrency
- quotedCurrency
- freshness            (current | stale | unknown | unavailable)
- amountStatus         (quoted | missing | error)  – Namen nur Arbeitsbegriff

Nicht mischen:
- Official/Safety/Seasonal-Evidence
- Marketing-Attribution / Affiliate-Click-ID
- Route Facts
- User-Intake-Preise ohne Nachweis
```

Warum STOPP:

1. Fünf Domänen dürfen diese Felder nicht je Slice anders erfinden.
2. Persistenz in `trip_items` wäre Schema/RLS – eigenes Product-Owner-Gate.
3. Ein gemeinsames Offer-Schema wäre AGENTS.md Regel 19 und der Shared-Contract-Vorschlag §5.
4. Dieser Audit hat keinen Auftrag, den Vertrag zu schreiben oder zu mergen.

**Nächster erlaubter Schritt nach Review:** Technical Lead entscheidet, ob S5 einen eigenen Contract-Slice vor der Feld-Implementierung braucht. Cursor startet das nicht.

S4-AbortSignal und S4-Flags nutzen die **bestehende** S1-Form; das ist kein neuer Shared Offer-Contract. S6-DB bleibt ein separates Gate, kein stiller S1-Ausbau.

---

## 11. Adversarial Self-Review

| Angriff | Prüfung | Ergebnis |
| --- | --- | --- |
| „S1–S3 integriert, also S5 fast fertig“ | Option-Typen und `trip_items` gelesen | Nachweis ≠ Provenance. S5 fehlt. |
| „Preis zum Auswahlzeitpunkt beweist retrievedAt“ | Suchkarten vs. persistierte Felder | Copy ohne Timestamp. Hotel/Aktivität persistiert ohne Label. |
| „Truth-Freshness deckt Preise ab“ | TW-4 Attention | Nur Official/Safety/Seasonal/Readiness. |
| „Admin Provider-Ops-Board ist S7“ | `sammeln.ts` | Kill-Switch/Cost-Guard/Usage, keine Search-Events. |
| „Matrix 24.08. ist Current“ | S2/S3 auf `main` | Historisch. Flights-Evidence-`missing` und Mobility-Stub sind veraltet. |
| „Duffel-Test ist Live-Commercial-Truth“ | Factory + Production-Flag | Test-Token, Production aus, keine Währung outbound. |
| „booking_url null heißt Affiliate gelöst“ | Policy + Übernahme | Getrennt und ehrlich null; Attributionsvertrag fehlt weiter. |
| „S5-Felder hier kurz in die Schemas schreiben“ | Auftrag | Verboten. Shared Contract → STOPP. |
| „TW-8 nur Anzeige, also startbar“ | Vergleichs-Ziel im Plan | Ohne Zeitpunkt/Mismatch/Stale wäre Vergleich erfunden. |
| „ACTIVE_WORK_STATUS auf ba86279e ziehen“ | Auftrag | Explizit verboten. Drift nur benannt. |
| „504-Residual in S4 still mitfixen“ | Scope | Dokumentiert, nicht gebaut. |
| „Drei S4S8-P0 sind akute Production-Incidents“ | Technical-Lead-Review + Excellence: P0 = jetzt live | **Nein.** Umklassifiziert: TW8-START-GATE, PROVIDER-ACTIVATION-GATE, P1-before-TW8. Keine offenen P0. |
| „Fehlender S7-Event-Write ist heutiger P1-Incident“ | Factory `null`, kein paid Provider | Pre-Activation-Gate, kein Incident. |
| „Cursor-Changes inkl. ACTIVE_WORK_STATUS sind der PR-Diff“ | `git diff origin/main...HEAD` | Nur Audit-Docs + Merge der fremden Audit-Dateien von `main`. `ACTIVE_WORK_STATUS.md` unverändert. |
| Jede Commercial-Aussage belegt oder offen? | §5 Tabelle | Ja. Keine Zielzelle als Ist markiert. |

---

## 12. Nicht gebaut / nicht entschieden

- keine Runtime, keine Schemaänderung, keine Flags gedreht;
- kein S4/S5/S6/S7/S8-Auftrag gestartet;
- kein Ready, kein Merge;
- keine Anbieterwahl, keine Lizenztexte als Fakt;
- kein neues ADR.

---

## 13. Nächster Schritt

1. Unabhängiger Technical-Lead-**Re-Review** der Severity-Korrektur auf PR #77.
2. Shared Commercial-Provenance-Contract annehmen oder ablehnen – nicht in diesem Audit implementieren.
3. Erst danach versionierter S4-Auftrag **oder** Contract-Slice für S5 – durch Technical Lead, nicht durch diesen Agenten.

**STOPP.** Kein Ready. Kein Merge. Kein Folgeslice.
