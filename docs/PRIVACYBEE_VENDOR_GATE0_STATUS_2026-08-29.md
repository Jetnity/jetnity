# Jetnity – PrivacyBee Schweiz Vendor Gate 0 Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / AUDIT + ARCHITECTURE + VENDOR-EVIDENCE ONLY / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Workstream: Privacy / External Vendor Evaluation  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/171  
Branch: `audit/privacybee-vendor-gate0-2026-08-29`  
Issue: [#169](https://github.com/Jetnity/jetnity/issues/169)  
Task: `docs/PRIVACYBEE_VENDOR_GATE0_TASK_2026-08-29.md`

> Live-Evidence gewinnt. Dieses Dokument ist kein PASS. Kein Ready. Kein Merge. Keine PrivacyBee-Aktivierung. Kein AP-6a-Runtime. Kein AP-6b. Kein Search-#168.

## 0. Vendor-Identität (bindend)

| | TARGET | NICHT TARGET |
| --- | --- | --- |
| Produkt | Schweizer Website-Datenschutz: DSE, Cookie-Banner, Impressum | US Consumer Data-Broker-Removal |
| Domain | `privacybee.io` / `app.privacybee.io` / `support.privacybee.io` | `privacybee.com` / `business.privacybee.com` |
| Rechtsträger | **PrivacyBee AG** (CH); öffentlich genanntes Betreiberverhältnis: Domenig & Partner Rechtsanwälte AG + Digital Innovation Lab AG | Privacy Bee, LLC (US) |

US-`privacybee.com`-Fakten aus einem früheren Irrläufer dieses Slices sind **ungültig** für die Zielbewertung und werden hier nicht als Swiss-Truth wiederverwendet.

## 1. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Privacy provider integration audit 1` |
| Preferred visible title | `Privacy provider integration audit 1` |
| Observed Cursor run title | `PrivacyBee vendor audit` |
| Cloud-Run | https://cursor.com/agents/bc-294ba965-a57a-4590-a98c-e11f079bc7ae |
| Exact Run-ID | `bc-294ba965-a57a-4590-a98c-e11f079bc7ae` |
| Rename-/Title-Fähigkeit | **keine** in den verfügbaren Cursor-Namespaces |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` |
| Generation | **1 bleibt 1.** Vendor-Korrektur bleibt dieselbe Session. |

Dieser Agent behauptet nicht, die sichtbare UI sei umbenannt.

## 2. Live-Rekonstruktion

| Feld | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Task-Baseline / live `origin/main` | `6083ee63a5da62870ab7ac4f5f91f69230718e44` |
| Branch | `audit/privacybee-vendor-gate0-2026-08-29` |
| Merge-Base | `6083ee63` |
| Draft-PR | #171 OPEN / Draft |
| Parallel runtime | PR #168 OPEN Draft – **nicht berührt** |
| `main` protected | live `false` |
| Supabase | nicht abgefragt, nicht mutiert |
| PrivacyBee Signup / Trial / Zahlung | **keine** |
| Browser / Real-Device | **nein** |

Production-Alias `https://jetnity-app.vercel.app` (2026-08-29): `/` 200 `data-dpl-id=dpl_GntXsgcdUN8cQKqHPqnpB6jUEfZz`; `/privacy` `/terms` **404**; `/register` 200.

## 3. Jetnity Current Truth

Unverändert gegenüber AP-6a Gate 0, live bestätigt:

| Fläche | Klasse |
| --- | --- |
| `/privacy` `/terms` Pages | **fehlend / 404** |
| Register-Checkbox | Client-only; Links auf 404; nicht in Auth persistiert |
| Login/Register-Copy | unbelegte „DSGVO & CH-DSG konform“ |
| Footer Legal-Links / `/impressum` | fehlen / 404 |
| `CookieConsent` | Orphan; V1-Text Views/Likes; nicht gemountet |
| Analytics/Ads-SDK | **nicht gefunden** |
| Consumer-Export/Delete | **fehlend** (AP-6b) |
| Traveller-Dokumente | trip-scoped, keine Nummer/Scan/MRZ/Biometrie |
| Controller / Rechtsform / Adresse | **fehlend** (PO + Legal) |

Trennung bleibt:

| Schicht | Owner | PrivacyBee-Anteil |
| --- | --- | --- |
| AP-6a Website-DSE / Impressum / Cookie-UI | Jetnity + PO/Legal | **möglicher späterer Website-Helfer**, kein Runtime jetzt |
| `/terms` Nutzungsbedingungen | Jetnity + Legal | **kein** PrivacyBee-Produkt |
| AP-6b Consent-Version, Account-Export, Kontolöschung | Jetnity | **kein** PrivacyBee-Ersatz |
| Account / Trip / Traveller / RLS / Auth | Jetnity | **niemals** |

## 4. Swiss PrivacyBee First-Party Current Truth

Abruf 2026-08-29T09:32Z; TL-Review-Nachzug VVZ + AVV 2026-08-29T09:49Z (HTTP GET, kein Login). Nicht Belegtes = `unknown / vendor-confirmation-required`. Öffentliche AVV-Aussagen sind zusätzlich `source-integrity/vendor-confirmation-required`, solange kein sauberes kanonisches Dokument bewiesen ist.

### 4.1 Produkt

PrivacyBee AG analysiert die live Zieldomain, erkennt eingebundene **Drittdienste** und generiert (a) Datenschutzerklärung, (b) Impressum, (c) Cookie-Consent-Banner. Rescan öffentlich **alle 8 Wochen**. Textbausteine juristisch gepflegt. Cookie-Banner erfasst bei jedem Besuch Drittdienste und verwaltet Einwilligungen. Inhalte liegen auf PrivacyBee-Servern; Einbindung als Dritt-Script (`app.privacybee.io`).

Lizenzbedingungen **zuletzt aktualisiert 10. Juni 2026**. ALB Ziff. 4.1: geeignet für **Durchschnittswebseitenbetreiber ohne unübliche Datenbearbeitungen**; deckt **nur Website-Pflichten** der Zieldomain; befreit nicht von übrigen organisatorischen Datenschutzpflichten.

Generierte Inhalte werden **nicht einzeln nachgeprüft** (ALB 3.1). Gewähr für Richtigkeit/Vollständigkeit **ausgeschlossen**, ausser begrenzter Abmahngarantie (ALB 5.2 / 8.7, max. CHF/EUR 5’000). Server-seitige und bot-/CDN-versteckte Verarbeitungen sind **kein** Garantiefall.

### 4.2 Integration (Next.js / Vercel)

First-party Support (Artikel geändert 2. Juni; CMS-Artikel 7. Januar): plattformunabhängig, sobald Script/HTML oder externer Link möglich ist. Offizielles Plugin nur WordPress. Empfohlene Scripts:

- `https://app.privacybee.io/cookie-banner.js` – jede Seite, zuerst im `head`
- `https://app.privacybee.io/widget.js` – nur DSE-Seite
- `https://app.privacybee.io/imprint-widget.js` – nur Impressum-Seite

Alternativen: iFrame oder Link auf extern gehostete DSE. Cookie-API: `privacybee:ready`, `privacybee:consent-changed`, `window.PrivacyBee` (Support 27. Mai). Kategorien folgen Google Consent Mode v2.

Kein öffentliches Next.js-Rezept. Kein serverseitiges Webhook-Produkt für Account-DSAR belegt.

### 4.3 Recht / Transfer / Security

| Thema | Evidence | Klasse |
| --- | --- | --- |
| AVV als kanonische Rechtsgrundlage | `/de-ch/auftragverarbeitervertrag/` HTTP 200 enthält formalen DE-Text **und** eine Patent-Ochsner-/Mundart-Duplikatsektion (siehe 4.6). `/auftragverarbeitervertrag/` (de-DE) zeigt denselben formalen DE-Text ohne diese Marker. Identität eines sauberen kanonischen Dokuments ist **nicht** bewiesen. | **`source-integrity/vendor-confirmation-required`**; **nicht akzeptiert** |
| Formaler DE-Fliesstext (beide URLs) | Version 2.0, Stand **10. Juni 2026**; schema `dateModified` 2026-06-22; Art. 28 DSGVO + Art. 9 DSG | **beobachtet als Seiteninhalt**, nicht als saubere Rechtsgrundlage |
| Rollen im formalen Text | Kunde = Verantwortlicher; PrivacyBee = Auftragsverarbeiter | **beobachtet**; Accept = nein |
| AVV-Abschluss im formalen Text | automatisch bei Trial oder Active-Lizenz | **beobachtet** – deshalb **kein Trial in diesem Slice** |
| Verarbeitungsort im formalen Text | primär CH und/oder EWR; EWR→CH via Angemessenheit | **beobachtet** |
| OpenAI als Subunternehmer | Unabhängig im öffentlichen VVZ: USA, kein EU-Hosting, kein DPF; SCC Modul 2 via OpenAI DPA v.010126 (Unterzeichnung 24.03.2026 genannt); TIA-2026-001-OpenAI „liegt vor“ | **belegt** als VVZ-Eintrag |
| OpenAI-TIA Residual „mittel“ / FISA/CLOUD | Nur im AVV-Fliesstext (Use Case B, Stand 22. Mai 2026) | **`source-integrity/vendor-confirmation-required`** |
| Öffentliches Verarbeitungsverzeichnis | https://www.privacybee.io/de-ch/verarbeitungsverzeichnis/ und `/verarbeitungsverzeichnis/` HTTP 200; schema `datePublished` 2026-05-28, `dateModified` 2026-06-10; benannte Subunternehmer inkl. Zweck/Ort/Transfer (siehe 4.5) | **belegt** als öffentliches Register |
| Identität VVZ = AVV Anlage 2 v1.1 (22. Mai 2026) | AVV nennt Anlage 2 so; VVZ-Seitentitel/Einleitung nennen „genehmigte Subunternehmer“ und AVV-Abschluss. Keine sichtbare VVZ-Versionszeile „1.1 / 22. Mai 2026“. Datumsversatz VVZ-`dateModified` 10. Juni vs. Anlage-2-Stand 22. Mai. | **nicht bewiesen** → **`vendor-confirmation-required`** |
| Anlage 1 TOMs | nur auf Anfrage | **unknown / vendor-confirmation-required** |
| Breach-Notice im formalen Text | AVV §9: unverzüglich, **spätestens 48 Stunden** | **beobachtet**; kanonisch **`source-integrity/vendor-confirmation-required`** |
| Consent-Daten | Einwilligungen + IP, Zeitstempel, User-Agent, Gerät/Browser | **belegt** |
| Retention nach Ende | ALB 7.5: 1 Jahr; auf Wunsch Löschung innert 30 Tagen | **belegt** |
| Exit-Nutzungsverbot | 5 Jahre auf generierte Inhalte | **belegt** |
| Verfügbarkeit | 99 % Jahresdurchschnitt; Wartung ausgenommen | **belegt** |
| Recht / Forum | Schweizer Recht, Gerichtsstand **Bern** | **belegt** |
| SLA Support-Reaktionszeit | nicht öffentlich | **unknown / vendor-confirmation-required** |
| Zertifizierungen (SOC2/ISO) | auf Swiss-First-Party-Seiten nicht belegt | **unknown / vendor-confirmation-required** |

### 4.4 Preis (live re-verified)

https://www.privacybee.io/de-ch/preis/ HTTP 200, 2026-08-29T09:32Z:

**CHF 54,90 pro Jahr und Domain (zzgl. MWST)** für Endkunden. 14 Tage testen, keine Kreditkarte laut Home. Partner/Agentur: bis 25 % Kickback – **andere Ökonomie**, nicht Jetnity-Preis. ALB: Preise jederzeit änderbar; Jahresabo; keine Erstattung der angebrochenen Periode; Mahngebühren; Sperre ab 30. Verzugstag.

Zusätzliche nicht im Listenpreis genannte Kosten (mehrere Domains/Previews, Custom Legal, Inspektionen): **unknown / vendor-confirmation-required**.

### 4.5 Öffentliches Verarbeitungsverzeichnis (live 2026-08-29T09:49Z)

Beide URLs HTTP 200, gleicher Subunternehmer-Kern; de-CH canonical `https://www.privacybee.io/de-ch/verarbeitungsverzeichnis/`. Einleitung (first-party): das Dokument liste alle Subunternehmer, die PrivacyBee AG als Auftragnehmer einsetzt und personenbezogene Daten im Auftrag der Partner verarbeitet; Genehmigung erfolge mit AVV-Abschluss und gelte für aktive Lizenzen und Testphasen. Kein Patent-Ochsner-Material auf diesen Seiten.

Das ist **nicht** dasselbe wie ein Beweis, die Seite **sei** AVV Anlage 2 Version 1.1 vom 22. Mai 2026.

| Anbieter | Sitz / Hosting laut VVZ | Zweck (gekürzt) | Jetnity-Relevanz falls später angebunden |
| --- | --- | --- | --- |
| Bexio AG | CH | Partner-Fakturen | intern PrivacyBee |
| Pipedrive OÜ | EU (AWS Frankfurt/Irland) | CRM Vertrieb | intern PrivacyBee |
| Microsoft Corporation | USA / M365 EU Data Boundary verfügbar | interner Workspace | intern PrivacyBee |
| Google LLC – Looker / BigQuery | USA / EU | interne BI | intern PrivacyBee |
| Stripe Inc. | USA / EU | Lizenzzahlungen | **ja**, wenn Jetnity zahlt |
| Slack Technologies LLC | USA / EU | interne Kollaboration | intern PrivacyBee |
| Heroku Inc. (Salesforce) | USA; EU-Region empfohlen | PaaS; **alle AVV-§2-Daten** inkl. Consent und technische Identifier | **hoch** (Besucher-/Partnerdaten) |
| Mailchimp (Intuit) | USA | Investor-Mails | nicht Jetnity-Nutzer |
| Customer.io Inc. | USA / EU | Partner-Lifecycle-Mail | **ja**, als Kunde |
| Notion Labs Inc. | USA | internes Wissen | intern PrivacyBee |
| Freshdesk (Freshworks) | USA / EU | Partner-Support | **ja**, als Kunde |
| Hotjar Ltd. | MT / IE | Heatmaps auf **privacybee.io** (Consent) | nur Vendor-Marketingseite |
| Amplitude Inc. | USA | A/B auf **privacybee.io** (Consent) | nur Vendor-Marketingseite |
| Google LLC – Analytics / Ads | USA | GA4/Ads auf **privacybee.io** (Consent) | nur Vendor-Marketingseite |
| Meta Platforms | US / IE | Pixel auf **privacybee.io** (Consent) | nur Vendor-Marketingseite |
| OpenAI L.L.C. | USA, kein EU-Hosting | KI-Text + Impressum-Extraktion | **hoch**, wenn Impressum-Widget |

DPF/SCC-Angaben im VVZ sind Vendor-Selbstauskunft, nicht unabhängig geprüft.

### 4.6 AVV-Source-Integrity (live 2026-08-29T09:49Z)

Dieselbe Session, `curl` HTTP/2, kein Login:

| URL | HTTP | Beobachtung |
| --- | --- | --- |
| https://www.privacybee.io/de-ch/auftragverarbeitervertrag/ | 200 | Formaler DE-AVV **plus** sichtbare Marker `Offizielle Version` / `Nach Patent Ochsner` (auch in `og:description`) **plus** vollständige Mundart-Duplikatsektion `Uftragsvearbeitigsvertrag` (Stand-Zeile dort 22. Mai 2026 vs. formal 10. Juni 2026), schliesst mit `Merci Patent Ochsner`. Schema `dateModified` 2026-06-22T11:29:58Z. |
| https://www.privacybee.io/auftragverarbeitervertrag/ | 200 | Formaler DE-AVV **ohne** diese Marker. Schema `dateModified` 2026-06-22T11:29:55Z. Footer „PrivacyBee Deutschland“. |
| https://www.privacybee.io/de/auftragverarbeitervertrag/ | 404 | kein alternatives DE-Dokument |

Ursache (Crawl/Render/Cache vs. echte Publikation) wird **nicht** geraten. Ein sauberes kanonisches AVV ist **nicht** unabhängig bewiesen. Deshalb gelten öffentliche AVV-/TIA-Aussagen **nicht** als unqualifizierte Rechtsgrundlage. Bestätigungspfad ohne Agent-Login: vom PO gelieferte Account-Kopie (offizielles AVV/TOM/TIA) = `account-evidence-required`.

## 4.7 Bestehendes PO-Konto (kein Login in diesem Slice)

Product-Owner-Hinweis an PR #171 (2026-08-29): Es existiert bereits ein Konto bei **PrivacyBee Schweiz (`privacybee.io`)**. Das ist **keine** Integrationsfreigabe, kein Ready und kein Gate-Ersatz.

Dieser Agent hat sich **nicht** angemeldet, keine Zugangsdaten angefordert und keine Domain/Subscription aktiviert.

Ohne Account-Einsicht bleiben die folgenden Punkte **`account-evidence-required`** (nicht raten):

| # | Was der PO/Legal vor einer späteren Anbindung liefern muss | Warum |
| --- | --- | --- |
| A1 | Welche Domain(s)/Website-IDs im Cockpit liegen | Jetnity.com vs. Vercel-Alias vs. andere Sites; Preis ist **pro Domain** |
| A2 | Lizenzstatus: Trial / Active / gekündigt; Periode | Trial schliesst AVV; Active heisst laufendes Abo |
| A3 | Endkunde CHF 54,90 vs. Partner-/Kickback-Tarif | Öffentlicher Listenpreis gilt nur, wenn der Account Endkunde ist |
| A4 | Ob AVV 2.0 / ALB im Account als akzeptiert gelten | Öffentlicher AVV ist **kein** sauberes kanonisches Dokument; Account-Stand unbekannt |
| A5 | Offizielle Account-Kopien: sauberes AVV (ohne Patent-Ochsner-Material), Anlage 2 v1.1, Anlage 1 TOMs, TIA-2026-001-OpenAI; Abgleich mit öffentlichem VVZ | VVZ ist öffentlich, Identität mit Anlage 2 **nicht** bewiesen; TOM/TIA-PDFs nicht öffentlich |
| A6 | Vorhandene Embed-Snippets / `website-id` | Technische Anbindung ohne neues Signup |
| A7 | Gewählte Rechtsgrundlage DSG und/oder DSGVO; Sprachen | Muss zu Jetnity-UI (`lang=de`) und Zielmärkten passen |
| A8 | Ob Cookie-Banner und/oder Impressum schon konfiguriert/generiert sind | Impressum-Pflichtfelder und OpenAI-Nutzung sind Residual |
| A9 | Welche Firmen-/Adressdaten im Impressum stehen | Jetnity-Controller-Identität ist im Repo **fehlend** |

Ein bestehendes Konto ändert **nicht**: Server-Seiten-Lücke, `/terms`-Lücke, Traveller-Grenze, AP-6b-Grenze, Verbot von Trial-durch-Agenten, Verbot von Runtime in diesem Slice.

## 5. Fit-Entscheidung

Swiss PrivacyBee **passt zur Website-Schicht** (DSE + optionales Impressum + optionaler Cookie-Banner), **nicht** zur Account-/Traveller-/AP-6b-Schicht.

**Jetzt nicht aktivieren.** Gründe:

1. Jetnity hat **unübliche und server-seitige** Verarbeitungen (Auth, Trip-Graph, Traveller, Guest-Storage, `model_usage`, Admin-PII). Der Scanner sieht die live Website, nicht die Datenbank. ALB verlangt Meldung solcher Lücken; die Abmahngarantie gilt dafür nicht.
2. Controller-Identität / ladungsfähige Adresse fehlen. Ein generiertes Impressum aus „öffentlichen Quellen“ kann das nicht wahr machen.
3. `/terms` (Nutzungsbedingungen) ist **kein** PrivacyBee-Liefergegenstand.
4. Heute gibt es **keine** Analytics-/Ad-Scripts. Ein Banner auf jeder Seite wäre ein neuer Dritt-Processor (Consent-IP) ohne bestehenden Tracker-Zweck.
5. DSE-Texte sind urheberrechtlich PrivacyBee; Copy-Paste verboten. Runtime wäre Widget/iFrame/externer Link, nicht Jetnity-eigene Rechtstexte.
6. Vendor-Marketing „100 % DSG+DSGVO-konform“ darf Jetnity nicht als eigene Behauptung übernehmen. Kunde bleibt verantwortlich (ALB 8.1, Home-FAQ).

Native Alternative bleibt gültig: AP-6a mit PO/Legal-Texten; CookieConsent Orphan bis ehrlichem Bedarf; AP-6b native.

**Spätere bedingte Eignung:** nach Content-Gate, wenn Legal Website-DSE/Impressum als Widget akzeptiert **und** Jetnity die nicht scanbaren Verarbeitungen schriftlich ergänzt. Cookie-Banner nur, wenn nicht-essenzielle Drittscripts wirklich kommen.

## 6. Sensible-Daten-Grenze

Ohne späteren PO+Legal+Security-Gate **nicht** an PrivacyBee:

Pass-/Dokumentnummern, Scans, MRZ, Biometrie, unnötige Citizenships, Auth-Secrets/Tokens, Payment-/Provider-Secrets, Trip-Graph, Guest-Storage, `model_usage`.

Ein Website-Scan darf diese Klassen nicht nachträglich einsammeln. Impressum-Generierung darf fehlende Firmenfakten nicht erfinden.

## 7. Kosten

| Ebene | Wirkung |
| --- | --- |
| Dieser Audit | **`Kostenwirkung: keine`** |
| Öffentlicher Endkundenpreis | **CHF 54,90 / Jahr / Domain zzgl. MWST** (live 2026-08-29) |
| Bestehendes PO-Konto | **keine** neuen Signup-Kosten; ob Jetnity-Domain schon lizenziert ist = **`account-evidence-required`** |
| Nicht im Listenpreis | **unknown / vendor-confirmation-required** |
| Partner-Kickback | nicht Jetnity-Integrationspreis |
| Aktivierung in diesem Slice | **keine** |

## 8. Deliverables

1. Diese Statusdatei  
2. Fit/Gap-Matrix  
3. Kleinster sicherer Zukunftsvertrag  
4. Self-Review  
5. Handoff inkl. Pflichtabschnitten und Vendor-Disambiguation  

Keine Runtime. Keine Shared Continuity. Kein Search-#168.

## 9. Tests / Gates

Evidence-Head `fa393232`: lokal 9/9; Actions `33246529227` SUCCESS; Vercel `29fzPGLcsAFdnS6X136YFcENqesL` SUCCESS; Preview `6154529113`. Dieser Stamp-Commit ist ein neuerer SHA. Review `5057555199` galt für `f97cb97a`. Neuer TL-Review ausstehend.

## 10. Exakter nächster Schritt

Unabhängiger ChatGPT Technical-Lead Exact-Head-Review von Draft-PR #171.  
Kein Ready. Kein Merge. Kein Trial. Kein AP-6a-Runtime. Kein AP-6b.
