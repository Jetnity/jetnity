# Requirements Provider Selection Matrix – 2026-08-30

Stand: 30. August 2026  
Status: **SELECTION GROUNDWORK ONLY / NO VENDOR CHOSEN / NO CONTRACT / NO ACTIVATION / REVIEW-FIX CR-2–CR-4**  
Cursor-Agent: **`Jetnity requirements provider groundwork 1`**  
Abrufdatum aller externen URLs: **30. August 2026**  
Companion: `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`

> Öffentliche Marketing- und Dokumentationsaussagen sind **kein** Vertrag, keine Lizenzfreigabe, keine Commercial Truth und keine Production-Freigabe.  
> Commercial/contract/cost/DPA-Felder, die nicht öffentlich belegt sind, bleiben `unknown`.

---

## 0. Lesart

| Wert | Bedeutung |
| --- | --- |
| `fit` | öffentlich belegte Eigenschaft trifft Jetnitys Vertrag grob |
| `partial` | teilweise belegt oder Mapping nötig |
| `mismatch` | öffentlich belegte Eigenschaft widerspricht Jetnitys Vertrag oder Privacy-Grenze |
| `unknown` | nicht öffentlich belegt |
| `blocked` | ohne besonderen PO-Gate oder ohne Vertrag unzulässig |

Jetnitys Soll-Vertrag (kurz): server-only Adapter; Traveller × Credential-Option × Destination × Type × Transit; ISO-2; Residence ≠ Citizenship; Issuer ≠ Citizenship; keine Nummer/MRZ/Scan/DOB/Health-Akte; Trust braucht Provider + `checkedAt` + Authority/RuleRef; Jetnity-`checkedAt` (Abruf/Auswertung) darf nicht still mit Vendor-`lastUpdatedAt` vermischt werden; fehlende Nationalität bleibt `unknown` / `insufficient_context` — **keine** Ableitung aus Origin oder Residence; `unknown` bleibt `unknown`; LLM ist keine Authority; Commercial Provenance ist eine andere Wahrheit.

---

## 1. Evidence-Log

| ID | URL | Abruf | Klasse | Was belegt wurde | Was **nicht** belegt ist |
| --- | --- | --- | --- | --- | --- |
| E-IATA-1 | https://www.iata.org/en/services/compliance/timatic/autocheck/ | 2026-08-30 | `public_docs` + `public_marketing` | AutoCheck als API für Passport/Visa/Health-Checks; „all passenger types, travel documents, countries, and airports“; ~70 Updates/Tag behauptet; Quellen: Government + Airline; Kontakt/Sales | Preis, Lizenz, Redisplay, DPA, OpenAPI, Multi-Citizenship-Semantik, ob Planungs-Evaluate ohne Scan möglich ist |
| E-IATA-2 | https://www.iata.org/en/pressroom/2024-releases/2024-06-04-02/ | 2026-08-30 | `public_docs` | Star-Alliance-Adoption; DCS-Anbindung Amadeus/Hitit/Sabre; auch „travel agencies and online booking platforms“ genannt | Jetnity-Zugang, Kosten, Cache-Rechte |
| E-IATA-3 | https://www.iata.org/timatic-widget | 2026-08-30 | `public_docs` + `public_marketing` | Timatic **Widget** als einbettbare Planungs-Oberfläche: one-way / round-trip / multi-city; „only a small amount of passenger information“; Query-Beispiele nationality, country of residence, itinerary; Fokus Passport/Visa/Health; ~70 Updates/Tag; **alle Timatic-Lösungen speisen dieselbe Datenbank** | AutoCheck-REST-Vertrag, Multi-Citizenship-Semantik, option-scharfes Document-Mapping, License, Preis, Minimal-PII für Jetnity-`evaluate()` |
| E-SABRE-1 | https://developer.sabre.com/rest-api/dcci-api-timatic/26.06.07 | 2026-08-30 | `public_api_docs` | Timatic über Digital Connect Check-In: `add` / `verify` / `override`; **Voraussetzung: Reservation in DCCI-Session**; Dokument-Scan am Airport-Touchpoint beschrieben | Standalone Travel-Planner-Port; License für Non-Airline |
| E-SHERPA-1 | https://docs.joinsherpa.io/requirements-api/endpoints/trips.html | 2026-08-30 | `public_api_docs` | `POST …/v3/trips`; Sandbox-Host `requirements-api.sandbox.joinsherpa.com`; `traveller.passports[]` als ISO-3-Nationalität; `travelNodes` ORIGIN/DESTINATION/TRANSIT; `lastUpdatedAt`; `sources[]` type GOVERNMENT + URL; `enforcement`; Visa-PROCEDURE-Kategorien | Vertrag, Preis, Redisplay, ob mehrere Pässe option-scharf sind, Residence/Issuer/Expiry-Felder |
| E-SHERPA-2 | https://www.joinsherpa.com/solutions | 2026-08-30 | `public_marketing` + `public_docs` | API + Widget + White-Label; Sandbox und Production behauptet; TLS; AES-256 at rest; GCP; 99%+ Uptime behauptet; PII „only stored as required“; eVisa-Commission; „Sherpa AI“ in Journey-Copy | DPA EU/CH, genaue Retention, Kosten, ob AI Hard Truth erzeugt |
| E-SHERPA-3 | https://www.joinsherpa.com/products/travel-requirements | 2026-08-30 | `public_marketing` | 200+ countries behauptet; Passport validity, eVisa/ETA, vaccination; Nationalität + Destination + Layovers; „55 changes per hour“ dann manuelle Kuratierung | Authority-Mapping, Transit-vs-Virtual-Interlining-Lizenz |
| E-SHERPA-4 | https://docs.joinsherpa.io/requirements-api/use-cases/trips-v3-show-visas.html | 2026-08-30 | `public_api_docs` | Tutorial: wenn der Reisepass unbekannt ist, empfiehlt Sherpa, die Nationalität des **Origin** anzunehmen („assuming the nationality of the origin“; Beispiel: Canada → Canadian) | Kein Jetnity-Vertrag. Diese Empfehlung ist ein **expliziter Integrations-Mismatch** und ein **verbotener** Adapter-Fallback |
| E-SHERPA-5 | https://docs.joinsherpa.io/requirements-api/index.html | 2026-08-30 | `public_api_docs` | Öffentliche technische Quota-/Cache-Guidance: Testing **1000 requests/hour**; Production **varies by plan**; `/trips` `Cache-Control: public, max-age=3600`; Guidance: nicht länger als 1 Stunde cachen / Daten stündlich aktualisiert. Dieselbe Seite nennt den API-Key einen „public identifier designed for client-side use“ | Jetnitys **kontrahierte** Production-Quota, Kosten, License, Redisplay-Rechte. Client-Key-Modell ist **nicht** Jetnitys Server-only-Vertrag |
| E-SHERPA-6 | https://docs.joinsherpa.io/requirements-api/requirements-api-faq.html | 2026-08-30 | `public_api_docs` | Öffentliche technische Limits: generischer Endpoint-Limit **100 requests/second**; Response-Size Hard Limit **10 MB**; stündlicher QC-Push; Cache >1 h nicht empfohlen. Die öffentlichen Quota-Schichten (1000/h Testing vs 100 rps generic vs Production-by-plan) sind **nicht** zu einer Zahl kollabiert | Jetnitys kontrahierte Production-Quota/Kosten; ob 100 rps und 1000/h gleichzeitig gelten oder planabhängig überschrieben werden |
| E-HENLEY-1 | https://www.henleyglobal.com/passport-index/methodology | 2026-08-30 | `public_docs` | Index basiert auf IATA-Daten + Research; 199 Pässe / 227 Destinationen; monatlich; **nicht binding**; Embassy-Verifikation verlangt; viele Annahmen (normaler Pass, Adult, short stay, kein Transit-Fokus) | Nutzungs-/Redisplay-Lizenz für Produkt-Truth |
| E-TRAVELDOC-1 | https://ies.aero/solutions/traveldoc-compliance/ | 2026-08-30 | `public_marketing` | Airline-App, **Dokument-Scan**, DCS-Integration, APIS | Planungs-Evaluate ohne Scan; Preis |
| E-TRAVELDOC-2 | https://ies.aero/faqs/ | 2026-08-30 | `public_docs` | Quick lookup nach Nationalität+Destination und Advanced Multi-Leg behauptet; Explore „free tool for travelers“; REST API für Airline-Systeme; Preis: Contact sales | Machine-readable Official-Zeilen für Jetnity-Port |
| E-VISAFY-1 | https://visarequirementsapi.visafy.org/ | 2026-08-30 | `public_marketing` + `public_api_docs` | `passport`+`destination` ISO-2; `lastModified`; 195+ countries; **monthly** updates behauptet; 60 req/min | Transit, Multi-Credential, Authority, License |
| E-VISAMUNDI-1 | https://www.visamundi.io/ | 2026-08-30 | `public_marketing` | `/v3/requirements` nach Nationalität+Destination; Vaccines-Endpoint | Freshness, Transit, Official-Trust-Felder |
| E-CIBT-1 | https://devportal.entriva.com/visacheck-api/responses/ | 2026-08-30 | `public_api_docs` | `visarequired` true/false/vmbr; Partner-`landingurl` zum Kauf | Official Authority; Multi-Option |
| E-ALTEX-1 | https://www.altexsoft.com/blog/timatic/ | 2026-08-30 | `third_party_commentary` | Behauptet TimaticWeb €499/Jahr + Transaktionspreis | **Nicht** als aktuelle IATA-Preisliste behandeln |
| E-HENLEY-UNOFF-1 | https://jerrynsh.com/i-built-a-visa-requirement-change-tracker-for-fun/ | 2026-08-30 | `third_party_commentary` | Undokumentierte Henley-Website-Endpunkte | **Kein** erlaubter Jetnity-Pfad |

---

## 2. Kandidaten-Matrix

### 2.1 IATA Timatic / Timatic AutoCheck

Historischer Jetnity-Kandidat (`docs/TRAVEL_READINESS.md`). **Nicht gewählt.**

| Dimension | Wert | Evidence | Kommentar gegen Jetnity-Vertrag |
| --- | --- | --- | --- |
| Länder-/Destination-Coverage | `fit` (behauptet) | E-IATA-1 | „all countries and airports“ ist Marketing; nicht unabhängig verifiziert |
| Visa / Entry / Passport / Transit | `partial` | E-IATA-1 | Passport, Visa, Health, Tax/Customs/COVID genannt; Transit nicht feldscharf öffentlich spezifiziert |
| Multi-Citizenship / Document / Issuer / Residence / Transit-Inputs | `unknown` | E-IATA-3 | Widget nennt Residence + Nationalität + Itinerary als **Query-Beispiele**, nicht als option-scharfes 1:n-Credential-Modell. AutoCheck-REST-Semantik bleibt unbelegt |
| Strukturierte Machine-Readable Outputs | `unknown` / `partial` | E-SABRE-1, E-IATA-3 | Öffentlich sichtbare Pfade: DCCI Verify/Eligibilities (Airline-Session) und Widget-Embed. Keines ist Jetnitys `RequirementsProviderZeile` |
| Source / Authority / Rule Reference | `partial` | E-IATA-1, E-IATA-3 | Government + Airline-Quellen genannt; Feldmapping `unknown` |
| Freshness / validity | `partial` | E-IATA-1, E-IATA-3 | ~70 Updates/Tag behauptet; Widget und AutoCheck speisen **dieselbe** Datenbank. Jetnity-`checkedAt`/`validUntil`-Vertrag `unknown`; Vendor-Update-Zeit ≠ Jetnity-`checkedAt` |
| Test / Sandbox | `unknown` | E-SABRE-1 | Sabre Virtual Sandbox existiert für DCCI, nicht als Jetnity-Zugang |
| Rate limits / cost | `unknown` | E-ALTEX-1 | Nur Third-Party-Kommentar zu Timatic**Web**; API-Preis `unknown` |
| Lizenz / Cache / Display / Attribution | `unknown` | — | PO-Gate |
| Datenschutz / Minimierung | `mismatch` Risiko | E-SABRE-1, E-IATA-1 | Scan/Dokumentprüfung am Touchpoint; Nummern/DOB wären **future gated requirement** |
| EU/CH-Verarbeitung | `unknown` | — | |
| Commercial / contract | `unknown` | E-IATA-1 Contact sales | |
| Server-only Adapter Core | `partial` | — | HTTP-Adapter wäre möglich; DCCI-Session-Shape passt nicht |
| Ohne LLM / Scraping | `fit` (behauptet) | E-IATA-1 | Kuratierte Regulatory-DB, nicht LLM-Truth |
| Eignung für Jetnity **jetzt** | `blocked` | — | Kein Vertrag, kein Secret. Widget ist eine **Planungs-Oberfläche** derselben Timatic-DB, **kein** belegter Jetnity-`evaluate()`-REST-Vertrag. AutoCheck/DCS/Scan bleiben ein anderes Produkt-Shape |

**Unterscheidung, die historische Docs vermischen:** Timatic-**Datenbank** (eine Quelle für alle Lösungen, E-IATA-3) / Timatic **Web** / **Widget** (einbettbare Planungs-Oberfläche) vs Timatic **AutoCheck** (Go/No-Go, oft DCS; REST-Vertrag öffentlich unbelegt) vs **Sabre DCCI**-Hülle (Reservation-Session). Keines ist öffentlich als drop-in `evaluate(RequirementsAnfrage)` belegt. Widget-Evidence darf die Matrix nicht Richtung „nur Scan“ verzerren — und darf AutoCheck nicht als bereits passend für Jetnity überzeichnen.

### 2.2 Sherpa Requirements API (Visa Run Inc.)

Travel-platform-förmig. **Nicht gewählt.**

| Dimension | Wert | Evidence | Kommentar |
| --- | --- | --- | --- |
| Coverage | `partial` | E-SHERPA-3 | 200+ countries / 180+ in White-Label-Copy; nicht unabhängig gezählt |
| Visa / Passport / Transit | `partial` | E-SHERPA-1, E-SHERPA-3 | Visa, Passport, Vaccination, Restrictions; Transit-Nodes existieren; Sherpa-Transit = Single-Ticket-Disembark |
| Multi-Citizenship / Document-type / Issuer / Residence | `mismatch` / `partial` | E-SHERPA-1, E-SHERPA-4 | `passports[]` = ISO-**3** Nationalität, nicht Document-Typ+Issuer+Expiry+Relation. Mehrere Werte = mehrere Nationalitäten, nicht Jetnity-Credential-Optionen. Residence nicht im öffentlichen Trip-Sample. **E-SHERPA-4:** wenn der Pass unbekannt ist, empfiehlt Sherpa die Nationalität des Origin — **expliziter Integrations-Mismatch**; ein späterer Adapter muss diese Empfehlung **ignorieren/ablehnen** und darf Nationalität niemals aus Origin synthetisieren |
| Machine-readable | `fit` | E-SHERPA-1 | JSON:API; PROCEDURE/RESTRICTION/PRODUCT |
| Authority / Source | `partial` | E-SHERPA-1 | `sources[{type:GOVERNMENT,title,url}]` mappt grob auf Authority+SourceUrl; Rule Reference `unknown` |
| Freshness | `partial` | E-SHERPA-1, E-SHERPA-3, E-SHERPA-5, E-SHERPA-6 | Vendor `lastUpdatedAt` / `createdAt`; Procedure-Daten; öffentliche Cache-Guidance 1 h. Das ist **nicht** Jetnity-`checkedAt`. Vendor-Update-Zeit und Jetnity-Abrufzeit dürfen nicht still kollabiert werden |
| Sandbox | `fit` | E-SHERPA-1, E-SHERPA-2 | unabhängige Sandbox behauptet; Host öffentlich dokumentiert. **Nicht in diesem Slice aufgerufen** |
| Cost / rate limit | `partial` (öffentliche technische Guidance) / `unknown` (Jetnity-Vertrag) | E-SHERPA-5, E-SHERPA-6 | **Bekannte öffentliche Schichten:** Testing 1000 req/h; FAQ-generic 100 req/s; Response 10 MB; Production „varies by plan“. **Weiter `unknown` / PO-GATE:** Jetnitys kontrahierte Production-Quota, Kosten, Overages. Die Schichten nicht zu einer Zahl oder zu pauschalem `unknown` kollabieren |
| Lizenz / Cache / Display | `partial` (öffentliche Cache-Guidance) / `unknown` (Rechte) | E-SHERPA-5, E-SHERPA-6 | `/trips` `public, max-age=3600`; „nicht länger als 1 h cachen“. Das ist technische Docs-Guidance, **kein** Redisplay-/Lizenzvertrag für Jetnity. Rechte bleiben `unknown` / PO-GATE |
| Privacy | `partial` | E-SHERPA-2, E-SHERPA-5 | TLS / AES-256 / least privilege behauptet; PII-Retention „as required“. Öffentliche Docs nennen den API-Key einen client-side public identifier — Jetnity bleibt **server-only**; das Key-Modell nicht still übernehmen |
| EU/CH | `unknown` | E-SHERPA-2 | Firma Canada, Hosting GCP; DPA `unknown` |
| Commercial | `unknown` + Ancillary-Risiko | E-SHERPA-2 | eVisa-Kauf/`PRODUCT` darf **nicht** Official Truth werden |
| Server-only Core | `fit` | E-SHERPA-1 | REST + API-Key-Header; Adapter-Core wäre transportfähig |
| Ohne LLM als Authority | `partial` | E-SHERPA-2 | Journey-Copy nennt „Sherpa AI“; das darf in Jetnity keine Hard-Truth-Authority sein |
| Eignung jetzt | `blocked` | — | Kein Vertrag; Mapping-Lücken; **verbotener** Origin-Nationality-Fallback (E-SHERPA-4); Commercial-Ancillary-Trennung nötig |

### 2.3 TravelDoc (ICTS)

| Dimension | Wert | Evidence | Kommentar |
| --- | --- | --- | --- |
| Coverage / Visa / Transit | `partial` | E-TRAVELDOC-2 | Lookup + Multi-Leg behauptet |
| Multi-Credential Jetnity-Port | `unknown` | — | |
| Machine-readable Official-Zeilen | `unknown` | — | REST für Airline-Systeme behauptet |
| Privacy | `mismatch` Risiko | E-TRAVELDOC-1 | Scan / APIS / ICAO-Dokumente — PO-Gate |
| Cost / License / EU-CH | `unknown` | E-TRAVELDOC-2 Contact sales | |
| Eignung jetzt | `blocked` | — | Scan/APIS-Produkt, nicht datensparsamer Planungs-Port |

### 2.4 Henley Passport Index / Passport-Index-Matrizen

| Dimension | Wert | Evidence | Kommentar |
| --- | --- | --- | --- |
| Coverage | `partial` | E-HENLEY-1 | 199×227 Ranking, nicht per-Trip Official |
| Transit / Multi-Credential / Residence | `mismatch` | E-HENLEY-1 | Annahmen: short stay, kein Transit-Fokus, normaler Pass, Adult |
| Official Trust | `mismatch` | E-HENLEY-1 | ausdrücklich nicht binding |
| Machine API | `mismatch` | E-HENLEY-UNOFF-1 | Keine lizenzierte öffentliche Product-API; Website-Endpunkte sind **kein** Pfad |
| Freshness | `partial` | E-HENLEY-1 | monatlich — zu grob für `current` Official |
| Eignung | `blocked` | — | Ranking ≠ Official Truth; Scraping verboten |

### 2.5 Consumer-Visa-Matrizen (Visafy, Visamundi, ähnliche)

| Dimension | Wert | Evidence | Kommentar |
| --- | --- | --- | --- |
| Visa pairwise | `partial` | E-VISAFY-1, E-VISAMUNDI-1 | Passport→Destination Lookup |
| Transit / option-level / Authority | `unknown` / `mismatch` | — | keine belegte Trust-Zeile |
| Freshness | `mismatch` Risiko | E-VISAFY-1 | monthly sync ≠ Jetnity-`current` |
| License / cost | `unknown` | — | Free-tier-Marketing ≠ Vertrag |
| Eignung | `blocked` | — | nicht als Official-Authority tragfähig |

### 2.6 Visa-Fulfilment (CIBTvisas / Entriva VisaCheck)

| Dimension | Wert | Evidence | Kommentar |
| --- | --- | --- | --- |
| Output | `mismatch` | E-CIBT-1 | Boolean + Partner-Kauf-URL |
| Official Authority | `mismatch` | — | Fulfilment, nicht regulatorische Evidence |
| Eignung | `blocked` | — | Commercial Ancillary, nicht Requirements-Port |

### 2.7 Bewusst ausgeschlossene Nicht-Kandidaten

| Name | Grund |
| --- | --- |
| Duffel / Skyscanner / HBX / Viator / 12Go | Search-/Commercial-Provider; keine Official-Requirements-Authority |
| Government-Websites einzeln (travel.state.gov, IATA Travel Centre Consumer) | Authority hoch, aber kein vollständiger machine-readable Multi-Credential-Port; Scraping verboten |
| LLM-Extraktion / ungeprüfte GitHub-Visa-Dumps | keine Hard-Truth-Authority; Lizenz oft `unknown` |
| Inoffizielle Henley-/Passport-Index-Endpunkte | undocumented; ToS-/Lizenzbruch-Risiko |

---

## 3. Mapping-Druck gegen Jetnitys Port

Was ein späterer Adapter **mindestens** liefern oder ehrlich als `unknown` lassen müsste:

| Jetnity-Feld | Timatic-Familie | Sherpa v3 Trips | Index/Matrix |
| --- | --- | --- | --- |
| `credentialOptionRef` | `unknown` | nicht 1:1 (`passports[]`) | nein |
| `relatedCitizenshipCountryCode` | `unknown` | Nationalität ≠ Relation | nein |
| `issuingCountryCode` / `expiresOn` | Scan-Produkte oft ja → **PO-Gate**, wenn Nummer/DOB folgt | öffentlich nicht im Sample | nein |
| `residenceCountryCode` | `unknown` | öffentlich nicht im Sample | nein |
| ISO-2 vs ISO-3 | `unknown` | ISO-3 default | gemischt |
| `requirementType` 14 Werte | `unknown` Mapping | PROCEDURE-Kategorien ≠ 1:1 | meist nur Visa-Klasse |
| `optionEligibility` / `optionMandate` | `unknown` | `enforcement` ≠ Eligibility/Mandate | nein |
| `authority` + `ruleReference` + `sourceUrl` | `unknown` | `sources[]` partial | Disclaimer statt Authority |
| `checkedAt` / `validFrom` / `validUntil` | `unknown` | Vendor-`lastUpdatedAt` / procedure dates **≠** Jetnity-`checkedAt`; nicht still mappen | monthly |
| Nationalität bei fehlendem Pass | `unknown` | **verboten:** Origin-Nationalität annehmen (E-SHERPA-4); fehlen → `unknown` / `insufficient_context` | Index nimmt oft einen Pass an |
| Transit je Land | `unknown` | TravelNode TRANSIT, aber andere Transit-Definition | mismatch |
| `PRODUCT` / booking_url / eVisa-Kauf | n/a | **nicht** in Official Evaluation übernehmen | n/a |

Kein Mapping in dieser Tabelle ist implementiert.

---

## 4. Auswahl-Groundwork, keine Entscheidung

**Empfehlung an den Technical Lead / Product Owner (nicht ausgeführt):**

1. Keinen Vendor als gewählt behandeln.
2. Aviation-grade (Timatic-Familie) bleibt der historisch bevorzugte **Regulatory-Kandidat**. Öffentlich sichtbar ist nicht nur DCS/Scan: das Timatic Widget (E-IATA-3) ist eine Planungs-Oberfläche derselben Datenbank. Das **beweist nicht** AutoCheck-REST, Multi-Citizenship, Option-Mapping, License oder Minimal-PII. Zugang, Lizenz, Redisplay und Minimal-PII bleiben PO-Gates.
3. Sherpa ist der öffentlich am klarsten dokumentierte **Travel-Planner-API-Kandidat**, mit echten Mapping-Lücken (ISO-3-Nationalität statt Credential-Option), **verbotenem Origin-Nationality-Fallback** (E-SHERPA-4) und Ancillary-Commercial-Risiko. Öffentliche Quota-/Cache-Zahlen sind technische Evidence, kein Vertrag.
4. Index-/Consumer-/Fulfilment-APIs sind für Official Hard Truth **nicht** geeignet.
5. Nächster sinnvoller Schritt ist **kein** Adapter und **kein** Vendor-Signup, sondern der in der Gap-Map benannte kleinste Jetnity-seitige Slice plus spätere PO-Auswahl.

---

## 5. Was bewusst `unknown` bleibt

- alle Preise, Staffeln, Mindestumsätze
- Jetnitys **kontrahierte** Production-Quota, Overages und Redisplay-/Attribution-Rechte (öffentliche Sherpa-Quota-/Cache-Guidance ist davon getrennt und oben als Evidence geführt)
- EU/CH-DPA, Subprozessoren, Speicherregion-Vertrag
- ob Timatic einen dokumentnummernfreien maschinenlesbaren Planungs-`evaluate()` anbietet (Widget beweist die Oberfläche, nicht den REST-Vertrag)
- ob Sherpa option-scharfe Multi-Passport-Semantik hinter nicht-öffentlichen Feldern hat
- SLA-Zahlen (99%, 99.9%) — Marketing, nicht Vertrag
- die numerische Jetnity-`checkedAt`-TTL vor Vertrag
