# Provider 12Go Mobility Contract Audit – Status

Stand: 29. August 2026  
Status: **REVIEW-FIX `5464098635` / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
Preferred visible title: `Jetnity provider 12go audit 1`  
Observed Cursor run title: `12Go mobility adapter audit`  
Cloud-Run: https://cursor.com/agents/bc-0266753e-bd4f-4c88-9330-5ebe1fb87b88  
Exact Run-ID: `bc-0266753e-bd4f-4c88-9330-5ebe1fb87b88`  
Rename-/Title-Fähigkeit: **keine** in den verfügbaren Cursor-Namespaces. UI nicht als umbenannt behauptet. Generation **1 bleibt 1**.  
Task: `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_TASK_2026-08-29.md`  
Branch: `audit/provider-12go-mobility-contract-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/190  
Task-Baseline: `69ef27b169780e41ba506a69acb15caafa645517`  
Aktuelles `origin/main` (gemergt): `085c95b22130232c5b5819ef8a4bcc302cc0f52b` — Provider Adapter Core ADR-0199 integriert

> Agent-Self-Review ist kein PASS. Jeder neue Push invalidiert Prior-Gates. Kein Ready. Kein Merge. Kein Folgeslice.

---

## 0. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Jetnity provider 12go audit 1` |
| Observed run title | `12Go mobility adapter audit` |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` |
| Generation | 1 |

---

## 1. Live-Rekonstruktion

Vor Handoff erneut `git fetch origin main`.

| Feld | Wert |
| --- | --- |
| Task-Baseline | `69ef27b169780e41ba506a69acb15caafa645517` |
| `origin/main` gemergt | `085c95b22130232c5b5819ef8a4bcc302cc0f52b` |
| Merge-Base nach Merge | `085c95b22130232c5b5819ef8a4bcc302cc0f52b` |
| Behind | **0** nach Merge dieses Review-Fix |
| Integrierter Shared-Core | ADR-0199 Provider Adapter Core; Checkpoint `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md` |
| Vorgeschlagener 12Go-ADR | **ADR-0200** (`docs/ADR_0200_PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT.md`). Integriertes ADR-0199 unverändert. |
| S5-B Current Truth auf dieser Baseline | Persistenzgrundlage auf Production: `20260829140000_trip_item_commercial_provenance` (PR #183 / Merge `3b684f64`, Verification auf `main`). Kein realer Snapshot. Runtime-Write-Pfad/Principal geschlossen. TW-8 geschlossen. #182 ist CLOSED; nicht erneut als offener Apply-Draft führen. |
| `main` protected | letzte kanonische Evidence `protected=false`; **in diesem Slice nicht unabhängig per API re-verifiziert** |
| Supabase / Vercel Settings | nicht mutiert, nicht als Live-Katalog abgefragt |
| 12Go Signup / API-Antrag / Keys | **keine** |
| Browser-Klick auf 12Go-Checkout | **nein** |
| Real-Device | **nein** |

Task-Head-Gates auf `1b4b2f0d` (CI `33261061154` SUCCESS, Vercel Preview READY) gelten **nicht** für den neuen Audit-Head.

Isolation `5463718113`: dieser Slice ändert **nicht** `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `ARCHITECTURE.md`, `ROADMAP.md` oder `DECISIONS.md`. S5-B-/12Go-Current-Truth steht nur in den dedizierten 12Go-Dateien.

---

## 2. Jetnity Current Truth (12Go-Audit-Sicht; nicht globaler Owner)

- Mobility-Foundation A integriert: `kind=transfer`, `mobility_mode` `rail|bus|ferry|transfer`, Production-Suche aus, Factory `null`.
- `MobilityProvider` bucht nicht und erzeugt keine Deeplinks.
- `MobilityNachweis` async, Umgebung `null`.
- Commercial Provenance: Domain `mobility` getrennt von `rental_cars` und `flights` (ADR-0168).
- S5-B Persistenzgrundlage: bereits auf Production (`20260829140000_trip_item_commercial_provenance`, verifiziert). Kein realer Provider-Snapshot. Runtime-Write-Pfad/Principal-Allocation bleibt geschlossen und separat gegatet. TW-8 bleibt geschlossen, bis reale Commercial Provenance existiert.
- Skyscanner Flights offline Foundation liegt auf `main` – Vorbild, keine 12Go-Runtime.
- Provider Adapter Core ADR-0199 integriert (`lib/server/providers/core/*`). Offline-12Go-Foundation ändert ihn nicht.
- Rental Cars: eigene Domäne, Suche aus, kein Provider.

---

## 3. 12Go First-Party Current Truth

Quellen und Zeitstempel: `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_EVIDENCE_2026-08-29.md`.

### 3.1 Identität

- Marke: **12Go**.
- Sites in Affiliate Terms: `https://12go.asia`, `https://12go.com`.
- Rechtsträger öffentlich: **12Go Asia Pte. Ltd.** (u. a. 75 High Street, Singapore; Travel Agency License TA03409 in Consumer Terms); **12Go Thailand Co., Ltd.** (Bangkok-Adresse in Affiliate Terms); **12Go Europe Ltd.** (Zypern) für bestimmte Payments.
- About nennt zusätzlich `op.12go.asia` (Operatoren) und `agent.12go.asia` (Agents/Websites). Operator-API: **UNKNOWN / nicht Gegenstand**.

### 3.2 Affiliate-Enrollment

Öffentlich (E-AFF-01, E-AFF-02):

- Beitritt **kostenlos**; Application; Freigabe per E-Mail mit Sign-in.
- Website nicht zwingend; Social möglich; Ownership-Nachweis möglich.
- Offline-Verkauf → Reseller-Programm, nicht Affiliate.
- 12Go bestimmt die Integrationsmethode. API nur mit **prior consent** und **additional confidential conditions**.
- Ein Account; mehrere Sites möglich; Sub-ID zur Trennung.
- Tracking: Partner-ID in Cookies, **30 Tage**, **last-click**.
- Commission-Marketing: 50 % Revenue Share, durchschnittlich ca. USD 3 / Booking – Marketingzahl, kein Jetnity-Forecast.
- Payout: PayPal / Wise / Bank; Schwellen u. a. 300 THB (PayPal/Wise) bzw. 33 000 THB (Bank). Affiliate-Terms-Zahlen weichen in Details vom Marketing-FAQ ab (PayPal 300 THB oder 10 USD; Bank 33 000 THB oder 1 000 USD; Thai Bank 1 000 THB). **Beide öffentlich; nicht still geglättet.**
- Keine Provision bei Operator-Website-Redirect-Inventory.
- Gebuchte/geänderte/stornierte Tickets können Provision entfallen lassen.
- Recht: Singapore; Affiliate Terms Version date **16 July 2025**.
- 12Go darf Terms jederzeit ohne Vorankündigung ändern.

**Nicht getan:** Registrierung, Dashboard-Login, API-Antrag.

### 3.3 API-Verfügbarkeit

Öffentlich nur:

- API existiert als „more complex solution“ neben Data Feeds.
- Zugang: etablierte Website, Kontakt, Projektbeschreibung, Team guided process.
- Terms: API = Suche **und** Booking von Tickets plus Tracking; genaue Methoden **confidential**.

Daraus folgt: **kein öffentliches Schema**. Auth, Base URL, Sandbox, Quotas, Rate Limits, Error-Bodies, Pflichtfelder: **UNKNOWN**. Inoffizielle Wrapper sind keine Evidence.

### 3.4 Unterstützte Modi

Affiliate/Reseller FAQ: trains, buses, ferries, flights, vans, taxis.  
About-Produktkacheln zusätzlich: Daytrips, **Car rent**.  
Consumer Terms zusätzlich: helicopters, shuttle, rail passes, add-ons.

Für Jetnity-Mobility-Adapter erlaubt nur: rail/bus/ferry/transfer-Mappings. Rest getrennt oder out-of-scope. Siehe Vertrag.

### 3.5 Suche / Orte / Zeit / Preis / Availability

Siehe Vertrag §§3.2–3.7. Kurz:

- Öffentliche Suche: Ort, Ort, Datum, Passagiere.
- Öffentliche URLs: `/{locale}/travel/{origin}/{destination}`.
- Preise volatil; Checkout gilt.
- Availability ungleichmäßig belegt; kein `available`-Boolean für S5-A.
- Zeitzonen-Encoding **UNKNOWN**.

### 3.6 Deeplink / Widgets / White Label

- Deep-links, Search Form, Timetable, Banners: No-Code, Dashboard.
- iframe **verboten**.
- Scraping/Bots **verboten** (Consumer Terms).
- White Label: `brand.12go.asia` oder CNAME auf `whitelabel.12go.asia` – 12Go-gehostet, nicht Jetnity-Graph.
- Tracking-Parameter-Namen **UNKNOWN**.

### 3.7 Booking-Grenze

- 12Go ist Intermediär; Vertrag Endkunde↔Supplier.
- Affiliate: 12Go handled Booking und Payment nach Redirect.
- Reseller: Agent bucht, Deposit THB/USD/EUR – **anderes Programm**.
- Bestätigung nicht immer instant.
- Storno: Supplier Terms; typisch ≥ 24 h; Servicefees oft non-refundable.

### 3.8 Localization / Privacy

- Viele UI-Locales und Anzeige-Währungen im Consumer-Chrome beobachtet.
- Privacy Policy: Name, E-Mail, Telefon, Travel details, Mitreisende; für Identity DOB, Passport/ID, Gender, Nationality; Payments an PSPs. Keine Special-Category-Claims (Race, Health, Biometrics) laut Policy-Text.
- Account-Owner-Alter in Privacy: mindestens 20 oder Guardian – **nicht** mit Jetnity-Account-Alter vermischen ohne Legal.

---

## 4. Architektur-Ergebnis

Dokumentiert in `docs/PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT_2026-08-29.md` und ADR-0200 (**proposed**). ADR-0199 ist der integrierte Shared-Core und nicht der 12Go-Vertrag.

Kleinste ehrliche spätere Naht:

1. Offline Fixture-Foundation nach Skyscanner-Muster, ohne Live-Constructor.
2. Live-Suche nur nach genehmigtem server-only API-Pfad.
3. Checkout per Affiliate-Redirect; Jetnity nimmt kein Ticketgeld.
4. Kein iframe, kein Scraping, kein White-Label als Workspace.
5. Kein Rental-, Flight-, Pass- oder Tour-Fold-in.

Shared-Core bleibt unverändert. 12Go-spezifisch wären später `lib/providers/twelve-go/mobility/*` mit `providerId = twelve_go`.

---

## 5. Risiken

| ID | Risiko | Severity |
| --- | --- | --- |
| 12GO-R1 | API-Schema unbekannt; Implementation vor Approval würde Felder erfinden | **high** (Truth) |
| 12GO-R2 | Scraping/inoffizielle Wrapper als „API“ | **high** (Legal/ToS) |
| 12GO-R3 | iframe-Widget trotz Verbot | **high** (Affiliate-Ban) |
| 12GO-R4 | 12Go-Flights oder Car-rent in Mobility falten | **high** (Domain) |
| 12GO-R5 | Fixture/Deeplink als `live_api` / Affiliate `present` | **high** (Provenance) |
| 12GO-R6 | Redirect als `booked` oder Instant-Confirm | **high** (Truth) |
| 12GO-R7 | Passport/Gender an 12Go ohne PO-Gate | **high** (Privacy) |
| 12GO-R8 | Reseller/Deposit/Payments-Pfad „weil API Booking sagt“ | **high** (PO-Gate) |
| 12GO-R9 | Provision/Operator-Redirect/Storno unsicher | **medium** |
| 12GO-R10 | Volatile Preise / Fees als Current-Quote ohne Freshness | **high** |
| 12GO-R11 | Anschlusszeiten aus FAQ (z. B. 5 h) als Jetnity-Regel | **medium** |
| 12GO-R12 | Confidential API nach Approval nicht in Git | **process** |
| 12GO-R13 | S5-B Runtime-Write-Pfad / TW-8-Verwechslung als offenes Production-Apply | **process** |
| 12GO-R14 | `main` `protected=false` | **medium** |
| 12GO-R15 | Agent-Self-Review ≠ PASS | **process** |
| 12GO-R16 | ADR-Kollision geschlossen: 12Go-ADR ist ADR-0200. Integriertes ADR-0199 (Provider Adapter Core) bleibt unberührt. | **process / closed** |
| 12GO-R17 | Globale Current-State-Dateien (`JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`) gehören nicht diesem Audit; Parallel-PRs #187/#188/#189 bleiben isoliert. | **process** |

---

## 6. Kosten

- Dieser Audit: **0**.
- Affiliate-Join öffentlich: **kostenlos**.
- API-Gebühren, Quotas, paid calls: **UNKNOWN**.
- Keine neuen laufenden Infrastrukturkosten.
- Commission wäre später Revenue-Share, kein Jetnity-Einkaufspreis; nicht aktiviert.

---

## 7. Tests / CI / Preview

- Keine Runtime-Änderung; keine neuen Unit Tests.
- Review-Fix-Head `1abf3ed4` lokale Exact-Head-Gates **PASS**: `npm ci`; `typecheck`; `lint`; `test` 2663/2663; Production-`build`; Hygiene. `origin/main` `085c95b2`, **0 behind**.
- Ältere Gates auf `0d252fde` / `22ffe925` sind **stale**.
- GitHub Actions / Vercel Preview dieses Heads: **nicht** als grün behauptet; live am PR prüfen.

---

## 8. DB / Production-Grenze

Keine Migration, kein RLS, kein Supabase, kein Vercel-Projektmut, kein Commercial-Provenance-Write, keine Secrets.

---

## 9. Offene Entscheidungen

1. Technical Lead: Exact-Head-**Re-Review** #190 nach CHANGES REQUIRED `5464098635`. Accept/ändern/verwerfen des vorgeschlagenen Adaptervertrags (`docs/ADR_0200_PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT.md`). Dieser Slice beansprucht weder `DECISIONS.md` noch globale Current-State-Dateien.
2. Strategisches Ziel ist gesetzt: 12Go bleibt Jetnitys erstes spezialisiertes Mobility-Ziel. Dieser Slice aktiviert das nicht.
3. Product Owner (später, nicht aus diesem Slice): Affiliate-Enrollment, API-Antrag, vertrauliche Terms, Credentials, paid calls, Production-Aktivierung. Deeplink-only vs. genehmigter API-Suchpfad bleibt ein Integrationsschnitt, keine Zielwahl.
4. Product Owner: sensible Dokumentweitergabe, falls 12Go Zug/Flug-Checkout sie verlangt.
5. Nicht entscheiden in diesem Slice: Enrollment, Secrets, Live, Runtime-Write-Pfad, TW-8. S5-B-Production-Apply ist **kein** offenes Gate mehr.

---

## 10. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-**Re-Review** von Draft-PR #190 nach `5464098635`. Prior-Gates gelten nicht für den neuen Head. GitHub CI/Vercel live am PR prüfen.

**Kein Ready. Kein Merge. Kein Folgeslice. Kein Signup. Kein API-Antrag.**

---

## 11. Zuerst lesen

1. `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_TASK_2026-08-29.md`
2. dieses Statusfile
3. `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_EVIDENCE_2026-08-29.md`
4. `docs/PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT_2026-08-29.md`
5. `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_HANDOFF_2026-08-29.md`
6. `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_SELF_REVIEW_2026-08-29.md`
7. ADR-0200 (proposed); ADR-0199 nur als integrierter Shared-Core lesen
8. `docs/PROVIDER_12GO_MOBILITY_ADAPTER_IMPLEMENTATION_TASK_PROPOSAL_2026-08-29.md` (nicht starten)
