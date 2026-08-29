# Jetnity – PrivacyBee Vendor Gate 0 Handoff

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/171  
Branch: `audit/privacybee-vendor-gate0-2026-08-29`  
Issue: [#169](https://github.com/Jetnity/jetnity/issues/169)

Dieser Handoff übergibt Gate 0. Er startet keine Integration. Agent-Self-Review ist kein PASS. Jeder neue Head invalidiert Prior-Gates.

---

## 1. Ergebnis

PrivacyBee ist auf aktueller First-Party-Evidence **kein geeigneter Consent-/Cookie-/DSAR-Processor** für Jetnity.

Der öffentlich belegte Business-Kern ist Employee External-Data-Privacy und Consumer Data-Broker-Removal (Privacy Bee, LLC, Atlanta/Alpharetta, GA, USA). Die für Jetnity naheliegenden Apps **Consent Core** und **Vendor & Cookie Consent** sind als „100% Free“ vermarktete Zusatzflächen. Ihr belegter Integrationsweg ist ein Site-Tag plus PrivacyBee-Consumer-Login, Exposure-Scan und Commission. Subprocessors liegen in den USA. Eine öffentliche DPA ist 404. Eine öffentliche API/Webhook-Spec fehlt. Business-Preise sind quote-required/unknown.

Jetnity-Ist bleibt: `/privacy` und `/terms` Production-404; Register-Zustimmung ohne Persistenz; CookieConsent-Orphan; kein Consumer-Export/Delete; Traveller datensparsam ohne Nummer/Scan/MRZ/Biometrie. AP-6a Legal-Content, AP-6b Consent/Export/Delete und ein externer Vendor bleiben getrennt. Jetnity bleibt Account/Trip/Traveller/Ownership/Identity-SoT.

**Bounded Empfehlung:** PrivacyBee nicht aktivieren. Native AP-6a (nach PO/Legal-Content) und danach AP-6b weiterverfolgen. Employee-EDP/VRM höchstens als späterer, getrennter PO-Entscheid. Keine Integration und keinen Folgeslice aus diesem Agenten starten.

---

## 2. Risiken / Residuals

| ID | Residual | Severity |
| --- | --- | --- |
| PB-R1 | Produktkategorie-Mismatch: EDP/Removal statt Jetnity-Privacy-Runtime | **high** |
| PB-R2 | Cookie-Consent erzeugt PrivacyBee-Login und scannt Besucher | **high** |
| PB-R3 | Zweite Identity-/Consent-SoT, wenn Consent Core genutzt würde | **high** |
| PB-R4 | US-Subprocessors ohne öffentliche DPA/SCC | **high** |
| PB-R5 | Commission/Trust-Badge/Upsell vs. Jetnity Trust- und No-Ads-Charakter | **high** |
| PB-R6 | Passport/Scan/MRZ/Biometrie könnten in einem naiven DSAR-Dump landen | **high** (heute nicht gespeichert, trotzdem default-verboten) |
| PB-R7 | Keine öffentliche API; einzige belegte Integration = Browser-Tag | **medium** |
| PB-R8 | Auto-Renew, kein Downgrade, 5-Jahre-Consent-Retention beim Client | **medium** |
| PB-R9 | Öffentliche App-Releases 2022/2023; Live-Reife unknown | **medium** |
| PB-R10 | SOC2/ISO27001 nur vendor-published; Report nicht unabhängig gesehen | **medium** |
| PB-R11 | Georgia-Recht / JAMS vs. unklarer Jetnity-Rechtsraum | **medium** |
| PB-R12 | AP-6a-404 und unbelegte „DSGVO & CH-DSG konform“-Zeile bleiben | **high** (bestehender Trust-P1, nicht durch diesen Vendor heilbar) |
| PB-R13 | `main` Branch Protection `protected=false` | **medium** (Governance, unverändert) |
| PB-R14 | Agent-Self-Review ist kein PASS; neuer Push invalidiert Prior-Gates | **process** |
| PB-R15 | Vendor-Site-Widerspruch Cookie-Leiste „measure ads“ vs. zero-ad-tech-Copy | **low** (Vendor-Residual) |

---

## 3. Kostenwirkung

- **Dieser Audit: `keine`.** Kein Signup, kein Order, kein Abo, kein Secret, kein paid call.
- **Zukünftige Business-Nutzung: `quote-required / unknown`.** Terms koppeln Preis an Participant-Lizenzen und Order; Business-`/pricing` ist 404; custom proposal vorgesehen.
- Marketing „100% Free“ ist **kein** Kostenvertrag (Commission/Leadgen, plus Fees in den Terms).
- Consumer Essentials/Pro/Signature (USD 8 / 16 / 67 pro Monat approx. annual) sind **nicht** der Business-Integrationspreis.

---

## 4. Offene Entscheidungen / Gates

1. Product Owner: Wird überhaupt ein externer Privacy-Vendor gebraucht, oder bleibt der Stack native AP-6a → AP-6b?
2. Legal: Controller-Identität, Rechtsraum, DPA/SCC, CH-DSG/GDPR-Relevanz – unabhängig von PrivacyBee, zuerst AP-6a-Input-Matrix.
3. Security + Legal: Jede spätere US-Processor-Auswahl braucht Transferinstrument + TOMs + Exit. Heute nicht belegt.
4. Product Owner: CookieConsent Orphan belassen / löschen / erst nach ehrlichem Text – bleibt AP-6a-Input, nicht Vendor-Default.
5. Product Owner: Employee-EDP für das Jetnity-Team ist ein **anderer** Entscheid und nicht implizit mit diesem Slice eröffnet.
6. Technical Lead: Ready/Merge nur nach unabhängigem Exact-Head-Review. Cursor setzt beides nicht.

Keine dieser Entscheidungen ist durch diesen Agenten getroffen.

---

## 5. Empfohlene nächste Schritte

Bounded, nicht gestartet:

1. Unabhängiger ChatGPT Technical-Lead Exact-Head-Review von Draft-PR #171.
2. Nach PASS/Merge dieses Docs-Slices: AP-6a-Content-Gate beim Product Owner/Legal weiterführen (`docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`). Das ist der echte Trust-P1.
3. AP-6b erst nach AP-6a und eigenem Task. Native Export/Delete, kein PrivacyBee.
4. PrivacyBee-Integration **nicht** anstoßen. Keinen zweiten CMP-Vendor-Audit automatisch starten.
5. Falls jemand später trotzdem PrivacyBee will: zuerst schriftliche DPA/SCC und schriftliche Bestätigung, dass Cookie-Tag, Visitor-Login, Scan und Commission aus sind. Bis dahin gilt der Integrationsvertrag als Verbotsliste.

---

## 6. Exact evidence

### 6.1 Repository / PR / Agent

| Fakt | Wert |
| --- | --- |
| Baseline `origin/main` | `6083ee63a5da62870ab7ac4f5f91f69230718e44` |
| Merge-Base | dieselbe SHA |
| Task-Head (invalidiert durch Authoring) | `f4e0707e385661477e6e6484002ffc1764c5f421` |
| Authoring-Head | der Commit dieses Stamps; live an PR #171 prüfen |
| Draft-PR | #171 OPEN Draft – https://github.com/Jetnity/jetnity/pull/171 |
| Issue | #169 OPEN |
| Parallel PR #168 | OPEN Draft; **nicht mutiert** |
| `main` protected | `false` |
| Logical Agent | `Privacy provider integration audit 1` |
| Observed title | `PrivacyBee vendor audit` |
| Cloud-Run | https://cursor.com/agents/bc-294ba965-a57a-4590-a98c-e11f079bc7ae |
| Supabase | nicht abgefragt, nicht mutiert |

### 6.2 First-Party PrivacyBee (HTTP 2026-08-29T09:28Z)

| URL | HTTP | Beobachtetes Datum / Residual |
| --- | --- | --- |
| https://business.privacybee.com/ | 200 | schema `dateModified` 2023-07-05; EDP-Positionierung |
| https://business.privacybee.com/terms-of-service/ | 200 | Last Modified **5 Jan 2024**; schema `dateModified` 2025-08-20 |
| https://business.privacybee.com/apps/consent-core/ | 200 | Price „100% Free“; Version 2.6.0; Latest Release 11/7/22; schema 2023-06-28 |
| https://business.privacybee.com/apps/vendor-cookie-consent/ | 200 | Visitor-Login + Scan + Commission; Version 2.4.0; Release 2/14/23; schema 2023-07-05 |
| https://business.privacybee.com/apps/vendor-risk-management/ | 200 | Employee-EDP-VRM; „100% Free“; Release 1/16/23 |
| https://business.privacybee.com/platform/ | 200 | Employee-Privacy-Plattform |
| https://business.privacybee.com/pricing/ | **404** | kein öffentlicher Business-Preis |
| https://business.privacybee.com/dpa/ | **404** | |
| https://privacybee.com/subprocessors/ | 200 | Last updated **August 2026**; alle Locations United States |
| https://privacybee.com/privacy-policy/ | 200 | Last Updated **10 June 2026** |
| https://privacybee.com/cookie-policy/ | 200 | Last Updated **14 August 2026** |
| https://privacybee.com/terms-of-service/ | 200 | Last Updated **21 August 2026** |
| https://privacybee.com/pricing/ | 200 | Consumer USD 8 / 16 / 67; **nicht** Business-Preis |
| https://privacybee.com/trust/ | 200 | Reviewed **July 2026**; SOC 2 Type II + ISO 27001 vendor-published |
| https://privacybee.com/dpa/ | **404** | |
| https://privacybee.com/security/ | **404** | |
| https://privacybee.com/developers/ | **404** | |
| https://api.privacybee.com/ | 302 → Auth | keine öffentliche Spec |

### 6.3 Jetnity Production (dieser Run)

| Fakt | Wert |
| --- | --- |
| Alias | `https://jetnity-app.vercel.app` |
| `/` | 200; `data-dpl-id=dpl_GntXsgcdUN8cQKqHPqnpB6jUEfZz` |
| `/privacy` `/terms` | **404** |
| `/register` | 200 |
| `CookieConsent` Import | nur Inventory-Test; Orphan unverändert |

### 6.4 Lokale Checks / CI / Vercel / Threads

Task-Head `f4e0707e` vor Authoring (gelten **nicht** für den neuen Head):

- Vercel Preview Comments SUCCESS; Vercel StatusContext SUCCESS auf Deployment `GCCuNzhurfhkLrp8XK85pLt9d6xK` (PR-Comment 2026-08-29).
- CI auf Task-Head: Auth-Check SUCCESS; Typecheck/Lint/Build war IN_PROGRESS zum Rekonstruktionszeitpunkt.

Authoring-Head: lokale Checks und Exact-Head-CI/Vercel werden nach Push in diesem Dokument nachgestempelt. Review-Threads: Auftragskommentar `5461543989`; keine Technical-Lead-Review-Threads bei Authoring.

Preview-HTML bleibt SSO-geschützt und wird nicht als Inhaltsbeweis verwendet.

---

## 7. Naming

| Feld | Wert |
| --- | --- |
| Logischer Name | `Privacy provider integration audit 1` |
| Beobachteter Titel | `PrivacyBee vendor audit` |
| Generation | **1.** Keine Generation 2. |
| UI umbenannt? | **nein** |

---

## 8. Nicht tun

- Ready setzen oder mergen.
- PrivacyBee anmelden, buchen, DPA akzeptieren, Tag mounten.
- AP-6a-Runtime, AP-6b, AP-7 oder Search #168 aus diesem Agenten starten.
- Rechtstexte oder Konformität erfinden.
- Passport-/Scan-/MRZ-/Biometrie-Daten als vendor-freigegeben behandeln.
- Consumer-Preise als Business-Kosten einsetzen.

---

## 9. Exakter nächster Schritt

Unabhängiger ChatGPT Technical-Lead Exact-Head-Review von Draft-PR #171.  
Derselbe Agent behebt nur unmittelbare Review-Funde dieses Slices.
