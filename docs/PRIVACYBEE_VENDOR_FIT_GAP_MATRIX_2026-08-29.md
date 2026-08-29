# PrivacyBee Vendor Gate 0 – Fit/Gap-Matrix

Stand: 29. August 2026  
Status: **AUDIT EVIDENCE ONLY / KEINE KONFORMITÄTSBEHAUPTUNG / KEIN VENDOR-ACCEPT**  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**  
First-Party-Abruf: 2026-08-29T09:28Z

Klassen: `fit` · `partial` · `gap` · `unknown / vendor-confirmation-required` · `nicht relevant`

`fit` heißt nur: öffentlich belegte Fähigkeit überlappt mit einem Jetnity-Bedarf. Es heißt **nicht** „rechtlich ausreichend“ oder „freigegeben“.

---

## 0. Bedarf, den Jetnity tatsächlich hat

Aus AP-6a Gate 0 + Account-Plan, nicht aus Vendor-Marketing:

1. Ehrliche, PO/Legal-gelieferte `/privacy` und `/terms` (AP-6a).
2. Später versionierter Consent, Export, Kontolöschung unter Jetnity-Ownership (AP-6b).
3. Kein gemounteter Cookie-Banner, solange keine ehrliche Cookie-Wahrheit und keine Tracker existieren.
4. Jetnity bleibt Account/Trip/Traveller/Identity-SoT.
5. Keine Passport-/Scan-/MRZ-/Biometrie-Weitergabe.
6. Keine zweite Marketing-/Commission-Consent-Wahrheit.

PrivacyBee muss gegen **diesen** Bedarf gemessen werden, nicht gegen Employee-EDP.

---

## 1. Consent / Cookie-Management

| | |
| --- | --- |
| Jetnity-Ist | `CookieConsent` Orphan; V1-Text Views/Likes ist stale; keine Analytics-SDKs gefunden; Gast-Cookie `jetnity_gast` ist Quota, nicht Messung. |
| Vendor-Ist | Vendor & Cookie Consent: Tag pasten; Vendor-Trust merken; **Visitor erzeugt PrivacyBee-Login**; Scan auf Exposures; Commission. Terms §2.6/2.7. |
| Bewertung | **gap** |
| Warum | Jetnity braucht derzeit keinen CMP-Banner. Der belegte Banner erzeugt eine zweite Consumer-Identity und einen US-Datenfluss. Das verletzt Datenminimierung und Identity-Grenze. |
| Residual | Ob ein Banner **ohne** Login/Scan/Commission konfigurierbar ist: **unknown / vendor-confirmation-required**. Öffentlich nicht belegt. |

## 2. DSAR / Access / Deletion / Portability

| | |
| --- | --- |
| Jetnity-Ist | Kein Consumer-Export, keine Kontolöschung, kein DSAR-Workflow. AP-6b serial nach AP-6a. Admin sieht PII, exportiert/löscht Konten nicht. |
| Vendor-Ist | Consent Core behauptet DSAR-Intake, Tracking, Preference-Historie, Unsubscribe-Syndication. Marketing, Release 11/7/22. Keine öffentliche API, keine Ownership-Semantik für Jetnity-Auth/RLS. |
| Bewertung | **partial** als Ticket-Inbox-Marketing; **gap** als ausführende Delete-/Export-Authority |
| Warum | Jetnity muss Account, Trips, Guest-Storage, Auth-User und Ownership selbst löschen/exportieren. Ein US-Vendor darf das nicht still ersetzen. Intake ohne Ausführung erzeugt eine zweite, unvollständige Betroffenen-Wahrheit. |
| Residual | Welche Daten Consent Core speichert, wie lange, wie Export aussieht: **unknown / vendor-confirmation-required**. |

## 3. Controller / Processor / Agent-Rollen

| | |
| --- | --- |
| Jetnity-Ist | Controller-Identität **fehlend** (AP-6a Input #1–#3). Jetnity bleibt trotzdem technische SoT. |
| Vendor-Ist | Terms: PrivacyBee erbringt Services **direkt an Participants**; Client muss affirmative Consent **vor** jeder Participant-PII holen; 5-Jahre-Aufbewahrung der Consents. Consumer-Terms: PrivacyBee handelt als authorized agent für Data-Broker-Opt-outs. Cookie-Banner erzeugt PrivacyBee-Accounts für Besucher. |
| Bewertung | **gap** für Jetnity-Consumer-Stack |
| Warum | Öffentlich sieht das nach **Controller- oder Agent-Rolle von PrivacyBee gegenüber Endnutzern** aus, nicht nach einem reinen Processor hinter Jetnity. Rollen ohne DPA sind nicht entscheidungsreif. |
| Residual | Schriftliche Processor-only-Option: **unknown / vendor-confirmation-required**. |

## 4. DPA / SCC / internationale Transfers

| | |
| --- | --- |
| Jetnity-Ist | Transferinstrumente **fehlend / PO-Legal-approval-required**. Vision „Schweiz zuerst“, keine Rechtsfeststellung. |
| Vendor-Ist | Public DPA-URLs **404**. Privacy Policy §7.3: Verarbeitung in den USA; „appropriate transfer mechanisms“ ohne benannte SCC/CH-Äquivalente. Subprocessors alle USA. |
| Bewertung | **gap** + **unknown / vendor-confirmation-required** |
| Warum | Ein CH/EU-relevanter Processor ohne öffentliche DPA/SCC ist nicht integrationsfähig. Dieser Audit akzeptiert keinen Vertrag. |
| Residual | Ob ein Business-DPA on request existiert: unbelegt. |

## 5. Data Locations / Subprocessors

| | |
| --- | --- |
| Vendor-Ist | August-2026-Liste: AWS, SendGrid, Twilio, Monday.com, Cloudflare, SparkVault, Aircall, HubSpot, Zoom – Data Location jeweils **United States**. |
| Bewertung | **gap** relativ zu einem schweiz-ersten Consumer-Produkt, solange kein Transferinstrument belegt ist |
| Bemerkung | Liste ist first-party und aktuell. Das ist positiv als Transparenz, negativ als Standort. SparkVault wird auf der Trust-Seite als Vault für sensible Files genannt. |

## 6. Security / Incident / Breach

| | |
| --- | --- |
| Vendor-Ist | Terms §6.1–6.2: Schutz von Client Data/PII; Emergency Management Plan; Notice „promptly, without unreasonable delay“; US-state-notice-Felder. Trust (reviewed July 2026): SOC 2 Type II, ISO 27001, TLS≥1.2, AES-256, passwordless, Atlanta SOC, SparkVault. Public `/security` **404**. |
| Bewertung | **partial** (Vertragstext + Marketing-Trust) / Zertifikate **unknown ohne Report** |
| Warum | First-Party-Claims sind nicht dasselbe wie geprüfter Report, DPA-Stunden-SLA oder CH-DSG-Meldepflicht-Mapping. |
| Residual | Report-Einsicht, Pen-Test, Unterauftrags-Änderungspflicht: **vendor-confirmation-required**. |

## 7. Retention / Deletion / Export / Exit

| | |
| --- | --- |
| Vendor-Ist | Consumer Privacy Policy §9: Retention Services + bis 1 Jahr nach Ende, plus Law/Dispute; Löschung „as quickly as possible, while staying legally compliant“. Client muss Participant-Consents **5 Jahre nach Vertragsende** halten. Auto-Renew 1 Jahr, 60-Tage-Kündigungsfrist, kein Downgrade, Prepaid in der Regel nicht rückerstattbar. Kein öffentlicher Exit-/Datenexport-Vertrag für Business-Clients. |
| Bewertung | **gap** |
| Warum | Jetnity-AP-6b braucht idempotente, ownership-gebundene Löschung. Vendor-Retention plus 5-Jahre-Client-Pflicht plus Auto-Renew ist ein Lock-in-/Residual-Risiko. |
| Residual | Business-Exit, Löschzertifikat, Subprocessor-Purge: **unknown / vendor-confirmation-required**. |

## 8. API / Webhook / Integrationsfläche

| | |
| --- | --- |
| Vendor-Ist | Öffentlich: „paste our tag“ / Marketplace-Install. `/developers` 404. `api.privacybee.com` → Auth-Login. Keine öffentliche Webhook-Spec. |
| Bewertung | **unknown / vendor-confirmation-required** (öffentliche Fläche = **gap** für eine kontrollierte Jetnity-Integration) |
| Warum | Ohne belegten serverseitigen Contract kann Jetnity nur ein Browser-Tag mounten. Das ist genau die verbotene Runtime. |

## 9. Branding / UX

| | |
| --- | --- |
| Jetnity-Ist | V2: ruhig, mobile-first, keine Ads, keine Social-Messung, keine zweite Marke im Consent. |
| Vendor-Ist | Banner/Consent-UI ist PrivacyBee-Ökosystem; Visitor-Login; Upsell auf Consumer-Pro; Trust Badge behauptet „+27% conversions“; Terms erlauben Logo-Nutzung. |
| Bewertung | **gap** |
| Warum | Eine Consent-Fläche, die Jetnity-Nutzer in ein US-Consumer-Produkt und Commission-Funnel zieht, ist ein Produkt-/Trust-Bruch, kein UX-Gewinn. |

## 10. Vendor Lock-in / Failure Modes

| Modus | Severity | Evidenz |
| --- | --- | --- |
| Consent-SoT wandert in PrivacyBee | **high** | Consent Core „last privacy platform you ever need“ |
| Visitor-Accounts gehören PrivacyBee | **high** | Cookie-Consent-Copy |
| JS-Tag aus, Banner/Consent tot | **medium** | einzige belegte Integration = Tag |
| Auto-Renew / kein Downgrade | **medium** | Terms §2.1 / §8 |
| Commission-Abhängigkeit als „free“ | **medium** | App-Seiten + Terms §2.7 |
| US-Subprocessor-Änderung ohne Jetnity-Gate | **medium** | Liste änderbar; Subscribe via E-Mail |
| PrivacyBee wird Identity- oder DSAR-Authority | **high** | direkte Participant-Services |
| Stale App-Releases (2022/2023) bei 2026-Gesetzeslage | **medium** | öffentliche Versionsdaten; Live-Qualität **unknown** |

## 11. Swiss DSG + GDPR (ohne Compliance-Claim)

| | |
| --- | --- |
| Bewertung | **gap / unknown** – **keine** Konformitätsfeststellung |
| Belegt | Vendor nennt GDPR/CCPA/CPRA/LGPD/ePrivacy in Marketing. Privacy Policy hat EEA/UK/CH-Abschnitte und US-State-Rechte. Transfers in die USA. Georgia-Recht. |
| Nicht belegt | Anwendbarkeit auf Jetnity; CH-Vertreter; EU-Vertreter; SCC; CH-Standardvertrag; Art.-9-Verarbeitung; DSAR-Fristen-Mapping; ePrivacy-Banner-Notwendigkeit für Jetnity (aktuell keine Tracker). |
| Jetnity-Residual | Unbelegte UI-Zeile „DSGVO & CH-DSG konform“ bleibt AP-6a-Trust-Defekt und darf durch diesen Vendor **nicht** „geheilt“ werden. |

## 12. Datenminimierung / Zweckbindung

| | |
| --- | --- |
| Bewertung | **gap** |
| Warum | Belegter Cookie-Consent-Zweck erweitert sich von „Vendor-Präferenz merken“ auf **Account-Erzeugung, Exposure-Scan, Upsell**. Consent Core bietet Privacy-Management „across thousands of other companies“. Das ist ein anderer Zweck als Jetnity-Reiseplanung. Terms erlauben De-identified-Analyse über Kunden hinweg. Client-Data-Lizenz weltweit, royalty-free, für Serviceerbringung. |
| Jetnity-Regel | Traveller-Kontext nur wenn funktionsrelevant; keine Dokumentnummern/Scans; keine unnötige Citizenship-Propagation. |

## 13. Kosten-Evidence

| Preisobjekt | Public Evidence | Für Jetnity-Integration |
| --- | --- | --- |
| Business Apps „100% Free“ | Consent Core, Cookie Consent, VRM, EDPA-Seiten | **kein** belastbarer Preis; Gegenleistung = Login/Commission/Leadgen |
| Business Participant-Lizenzen | Terms §2.1: Preis = Lizenzzahl + gewählte Services; custom proposal; Prepaid USD; Auto-Renew | **quote-required / unknown** |
| Business-Preisseite | `/pricing` auf business. **404** | **unknown** |
| Consumer Essentials/Pro/Signature | USD 8 / 16 / 67 pro Monat approx. annual | **nicht verwenden** |
| Dieser Audit | kein paid call | **keine** |

## 14. Native Alternative (kein zweiter Vendor-Start)

Für den aktuellen Jetnity-Bedarf ist die native Folge **kleiner und ehrlicher**:

1. AP-6a: PO/Legal schließt die Input-Matrix; Runtime baut nur gelieferte `/privacy` `/terms`.
2. CookieConsent bleibt Orphan oder wird gelöscht, bis ehrlicher Text existiert. Heute gibt es nichts zu „managen“, das einen CMP rechtfertigt.
3. AP-6b: versionierter Consent, Export, Delete in Jetnity mit RLS/Ownership.
4. Erst wenn Tracker, CRM oder ein echter DSAR-Volumen-Schmerz da sind, erneut Vendor prüfen – und dann gegen einen Processor-first-CMP/DSAR, nicht gegen Employee-EDP.

Employee-EDP/VRM von PrivacyBee kann ein **separater** späterer PO-Entscheid für interne Mitarbeitenden-Privacy sein. Das löst D0-P1-03 und AP-6b nicht.

## 15. Gesamt

| Frage | Antwort |
| --- | --- |
| Ist PrivacyBee ein passender Consent/DSAR-Processor für Jetnity? | **Nein, auf aktueller First-Party-Evidence.** |
| Gibt es eine sichere Teilmenge ohne Extra-Gates? | **Nein.** |
| Kleinste spätere Teilmenge, falls trotzdem gewählt? | Siehe Integrationsvertrag: kein Banner, kein Visitor-Login, kein Traveller-Dump, Jetnity bleibt SoT, DPA/SCC zuerst. **Nicht starten.** |
