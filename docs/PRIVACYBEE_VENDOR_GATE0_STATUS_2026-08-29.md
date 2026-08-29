# Jetnity – PrivacyBee Vendor Gate 0 Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / AUDIT + ARCHITECTURE + VENDOR-EVIDENCE ONLY / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Workstream: Privacy / External Vendor Evaluation  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/171  
Branch: `audit/privacybee-vendor-gate0-2026-08-29`  
Issue: [#169](https://github.com/Jetnity/jetnity/issues/169)  
Task: `docs/PRIVACYBEE_VENDOR_GATE0_TASK_2026-08-29.md`

> Live-Evidence gewinnt. Dieses Dokument ist kein PASS. Kein Ready. Kein Merge. Keine PrivacyBee-Aktivierung. Kein AP-6a-Runtime. Kein AP-6b. Kein Search-#168.

## 0. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Privacy provider integration audit 1` |
| Preferred visible title | `Privacy provider integration audit 1` |
| Observed Cursor run title | `PrivacyBee vendor audit` |
| Cloud-Run | https://cursor.com/agents/bc-294ba965-a57a-4590-a98c-e11f079bc7ae |
| Exact Run-ID | `bc-294ba965-a57a-4590-a98c-e11f079bc7ae` |
| Rename-/Title-Fähigkeit | **keine** in den verfügbaren Cursor-Namespaces |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` |
| Generation | **1 bleibt 1.** Keine Generation 2 wegen UI-Titel. |

Dieser Agent behauptet nicht, die sichtbare UI sei umbenannt.

## 1. Live-Rekonstruktion

| Feld | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Task-Baseline / live `origin/main` | `6083ee63a5da62870ab7ac4f5f91f69230718e44` – Merge PR #167 |
| Branch | `audit/privacybee-vendor-gate0-2026-08-29` |
| Merge-Base | `6083ee63a5da62870ab7ac4f5f91f69230718e44` |
| Ahead / Behind vor Authoring | **1 / 0** (Task-Commit `f4e0707e`) |
| Draft-PR | #171 OPEN / Draft |
| Parallel runtime | PR #168 OPEN Draft – **nicht berührt** |
| `main` Branch Protection | live `protected=false`; unverändert |
| Supabase | **nicht** abgefragt, **nicht** mutiert |
| Browser / Real-Device | **nein** – Docs/First-Party-Fetch/HTTP |
| Mutating Runtime | **keine** |
| PrivacyBee Signup / Order / Secret | **keine** |

### 1.1 Production-Legal auf dem Alias (dieser Run)

Production-Alias `https://jetnity-app.vercel.app`, abgerufen 2026-08-29T09:28Z:

| Pfad | HTTP | Bemerkung |
| --- | --- | --- |
| `/` | **200** | `data-dpl-id=dpl_GntXsgcdUN8cQKqHPqnpB6jUEfZz` |
| `/register` | **200** | verlangt Legal-Zustimmung zu 404-Zielen |
| `/privacy` | **404** | `x-matched-path: /404` |
| `/terms` | **404** | `x-matched-path: /404` |
| `/robots.txt` | **200** | fail-closed deny bleibt AP-6a-/Indexing-Wahrheit |

Dieser Slice behebt den 404 nicht.

## 2. Task / Scope / Non-Scope

**Scope:** Fit/Gap, Risiken, Transfer-/Security-Grenzen, Kosten-Evidence und kleinster sicherer zukünftiger Integrationsvertrag. First-Party-Vendor-Evidence plus aktuelle Repository-Wahrheit.

**Non-Scope (hart):** keine PrivacyBee-Anmeldung/Order/Abo; kein Terms/DPA/SCC-Accept; kein API-Key; keine User-Datenübertragung; keine Runtime; kein Cookie-Banner-Mount; keine Rechtstexte; kein AP-6a-/AP-6b-Runtime; keine DB/RLS/Auth/Identity; kein Search #168 / Homepage #110; kein AP-7; kein paid call.

Shared Continuity-Dateien (`JETNITY_HANDOFF.md`, `ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `DECISIONS.md`) wurden **nicht** geändert, um Kollision mit PR #168 zu vermeiden.

## 3. Jetnity Current Truth (Account / Privacy / Consent / Traveller)

Quelle: aktueller Branch-Code plus AP-6a Gate 0 auf `main` (PR #167 / Baseline `6083ee63`). Live-404 dieses Runs bestätigt die AP-6a-Rekonstruktion.

| Fläche | Klasse | Befund |
| --- | --- | --- |
| `/privacy` `/terms` Pages | **fehlend / 404** | keine `app/**/privacy` oder `app/**/terms` |
| Register-Checkbox + Links | **belegt / broken link** | Pflicht-Checkbox; Consent wird **nicht** an `signUp` geschrieben |
| Register OAuth | **Residual / disabled** | `handleOAuth` prüft `accept` nicht; Google/Apple `enabled = false` |
| Login/Register-Copy | **unbelegte Behauptung** | „DSGVO & CH-DSG konform.“ |
| Footer / Navbar Legal-Links | **fehlen** | Footer zeigt `info@jetnity.ch`, nicht als Controller |
| `CookieConsent` | **Orphan** | `jetnity:cookie-consent:v1`; V1-Text Views/Likes; nicht gemountet |
| Consent-DB / Persistenz | **fehlend** | AP-6b |
| Consumer-Export / Kontolöschung | **fehlend** | AP-6b |
| Analytics / Ads SDK | **nicht gefunden** | kein gtag/plausible/posthog/vercel-analytics in App-Quellen |
| Traveller-Dokumente | **datensparsam / trip-scoped** | Typ + Issuer + Ablauf; **keine** Nummer/Scan/MRZ/Biometrie |
| Account-Registry | **Domain-Contract only** | sensible Schlüssel fail-closed abgewiesen; Persistenz extra gegatet |
| Controller / Rechtsform / Gerichtsstand | **fehlend** | PO + Legal |

AP-6a, AP-6b und ein externer Vendor bleiben getrennt:

| Schicht | Owner | Darf PrivacyBee werden? |
| --- | --- | --- |
| AP-6a Legal-Content `/privacy` `/terms` | Jetnity + PO/Legal | **Nein.** Keine Vendor-Rechtstexte, keine Konformitätsbehauptung. |
| AP-6b Consent-/Export-/Delete-Runtime | Jetnity Account/Ownership/RLS | **Nein als Source of Truth.** Höchstens späterer optionaler Intake hinter Extra-Gates. |
| Account / Trip / Traveller / Identity | Jetnity | **Niemals.** |
| Employee External-Data-Privacy / Data-Broker-Removal | eigener Produktnutzen, nicht Consumer-Stack | Nur nach späterem PO-Entscheid; nicht dieser Slice. |

## 4. PrivacyBee First-Party Current Truth

Abgerufen 2026-08-29T09:28Z. Nur öffentlich belegte Fakten. Nicht Belegtes = `unknown / vendor-confirmation-required`.

### 4.1 Wer / wo

| Fakt | Evidence | Klasse |
| --- | --- | --- |
| Rechtsträger `Privacy Bee, LLC` | Business Terms; Schema auf privacybee.com | **belegt** |
| HQ Atlanta / Alpharetta, GA, USA | Subprocessor-Seite; Trust; Schema-Adresse `3955 Marconi Dr, Floor 2, Alpharetta, GA 30005, US` | **belegt** (Schema/Marketing) |
| Contacts `legal@` / `security@` / `support@privacybee.com` | Privacy Policy / Subprocessors | **belegt** |
| Consumer-Kernprodukt | Data-Broker / People-Search Removal; Pricing Essentials/Pro/Signature | **belegt** |
| Business-Kernprodukt | External Data Privacy für Employees (Exposure, Poach, Doxxing, Spear Phishing) | **belegt** |
| Zusätzliche Business-Apps | Consent Core; Vendor & Cookie Consent; VRM; Trust Badge; EDPA | **belegt** (Marketing-Seiten, Releases 2022–2023) |

### 4.2 Consent / Cookie / DSAR (die für Jetnity relevanten Apps)

**Vendor & Cookie Consent** (`https://business.privacybee.com/apps/vendor-cookie-consent/`, schema `dateModified` 2023-07-05; App-Version 2.4.0, Latest Release 2/14/23):

- Marketing: „100% Free“; Tag auf die Site pasten; Vendor-Trust-Präferenzen merken.
- **Härter Befund:** „Whenever a visitor saves their preferences, they create a free Privacy Bee login, which offers them upsell opportunities to a paid license.“ PrivacyBee scannt danach „personal privacy exposures“.
- Commission an den Publisher bei Upgrade/Renewal.
- Terms §2.6 verlangen JS/Cookie-Banner-Installation für diese Services.

**Consent Core** (`https://business.privacybee.com/apps/consent-core/`, schema `dateModified` 2023-06-28; App-Version 2.6.0, Latest Release 11/7/22):

- Marketing: DSAR-Intake/Tracking, E-Mail-Unsubscribes, org-wide Consent-Logging, CMP-Ersatz, „100% Free“.
- Derselbe Commission-/Consumer-Login-Pfad: Preference-UI kann PrivacyBee-Login anbieten; Unsubscribe kann auf eine „External Privacy Preferences“-Seite umleiten.

Diese öffentlichen App-Seiten sind **Marketing**, kein API-Vertrag, kein DPA, keine SLA.

### 4.3 Vertrag / Transfer / Security

| Thema | Public Evidence | Klasse |
| --- | --- | --- |
| Business Terms | Last Modified **January 5, 2024**; Schema `dateModified` 2025-08-20; HTTP 200 am 2026-08-29 | **belegt** als öffentliche AGB, **nicht akzeptiert** |
| Consumer Privacy Policy | Last Updated **June 10, 2026**; HTTP 200 | **belegt** |
| Consumer Terms | Last Updated **August 21, 2026**; HTTP 200 | **belegt** |
| Cookie Policy | Last Updated **August 14, 2026**; HTTP 200 | **belegt** (PrivacyBees eigene Site, nicht Jetnity) |
| Subprocessors | „Last updated: **August 2026**“; alle gelisteten Data Locations = **United States** | **belegt** |
| Public DPA | `https://privacybee.com/dpa/` und `https://business.privacybee.com/dpa/` = **HTTP 404** | **unknown / vendor-confirmation-required** |
| Public SCC / CH-Transferinstrument | nicht gefunden | **unknown / vendor-confirmation-required** |
| Public SLA | nicht gefunden; Terms disclaimen Downtime | **unknown / vendor-confirmation-required** |
| Public API / Webhook / Developer-Docs | `https://privacybee.com/developers/` 404; `https://docs.privacybee.com/` ohne nutzbare öffentliche Docs in diesem Run; `https://api.privacybee.com/` 302 → Auth | **unknown / vendor-confirmation-required** |
| Business-Preisliste | `https://business.privacybee.com/pricing/` **404**; Terms: Participant-Lizenzen + Order + custom proposal; Auto-Renew 1 Jahr | **quote-required / unknown** |
| Consumer-Preise | Essentials **USD 8**/Mo, Pro **16**, Signature **67** (annual approx.) | **belegt, aber nicht Business-Integrationspreis** |
| SOC 2 Type II / ISO 27001 | Trust-Seite, reviewed July 2026; Badge „AICPA SOC2 Certified“ | **vendor-published claim**; Zertifikat/Report **nicht** unabhängig abgerufen |
| Breach-Notification | Terms §6.2: „promptly, and without unreasonable delay“; US-state-notice-Felder | **belegt als Vertragstext**, keine Stunden-SLA |
| Governing Law | Georgia, Fulton County; JAMS-Arbitration | **belegt** |
| Rolle gegenüber Participants | PrivacyBee erbringt Services **direkt** an Participants; Client muss vorher affirmative Consent holen und 5 Jahre aufbewahren | **belegt** |

### 4.4 Subprocessors (August 2026, first-party)

Core: Amazon Web Services, SendGrid, Twilio, Monday.com, Cloudflare, SparkVault – alle **United States**.  
Support: Aircall, HubSpot, Zoom – alle **United States**.  
Update-Kontakt: `legal@privacybee.com`.

## 5. Fit-Entscheidung dieses Gate 0

**Empfehlung: PrivacyBee nicht als Jetnity Consent-/Cookie-/DSAR-/Privacy-Runtime-Vendor auswählen.**

Begründung in einem Satz: Der öffentlich belegte Business-Kern ist Employee External-Data-Privacy und Data-Broker-Removal; die „freien“ Consent-/Cookie-Apps erzeugen PrivacyBee-Consumer-Logins, scannen Besucher, zahlen Commission und verarbeiten Daten in den USA – das kollidiert mit Jetnity Account/Trip/Traveller-Truth, Datenminimierung, fehlender Analytics-Fläche und den noch offenen AP-6a/AP-6b-Gates.

Vergleich zur Jetnity-nativen Option (kein zweiter Vendor-Audit):

| Option | Passt zu Jetnity-Kern? | Extra-Datenfluss | Kosten-Evidence |
| --- | --- | --- | --- |
| Jetnity-nativ: AP-6a Legal-Content, danach AP-6b Consent/Export/Delete | Ja. SoT bleibt Jetnity. | Keiner neuer US-Processor für Consent/DSAR | keine Vendor-Recurring-Kosten |
| PrivacyBee Cookie-Banner + Consent Core | **Nein.** Zweite Identity, Visitor-Scan, Commission, US-Transfer | Ja, Besucher-/Nutzer-PII an PrivacyBee + US-Subprocessors | Marketing „free“ ≠ belegter Business-Preis; Commission-Konflikt |
| PrivacyBee Employee-EDP / VRM | Anderer Use-Case; nicht Consumer-Privacy-Stack | Employee-PII an US-Vendor | quote-required / unknown |

Details: `docs/PRIVACYBEE_VENDOR_FIT_GAP_MATRIX_2026-08-29.md`.  
Kleinster sicherer **zukünftiger** Vertrag, falls jemand später trotzdem auswählt: `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`. Dieser Vertrag ist **kein** Startauftrag.

## 6. Sensible-Daten-Grenze

Ohne späteren Product-Owner- + Legal- + Security-Gate darf **nichts** der folgenden Klassen an PrivacyBee gehen. Dieser Audit gibt **keine** Freigabe:

- Pass-/Ausweisnummern;
- Scans / Bilder / Fotos;
- MRZ;
- Biometrie / Gesicht / Chip;
- unnötige Staatsangehörigkeits- oder Traveller-Identitätsdetails;
- Auth-/Session-Secrets, Tokens, Recovery-Codes;
- Provider-/Payment-Secrets;
- Trip-Graph, Guest-LocalStorage, `model_usage`, Admin-PII-Exporte.

Jetnity speichert diese Dokumentklassen heute bewusst nicht. Ein Vendor darf das nicht nachträglich „für DSAR“ einsammeln.

## 7. Kosten

| Ebene | Wirkung |
| --- | --- |
| Dieser Audit | **`Kostenwirkung: keine`** – kein Signup, kein Order, kein paid call |
| Zukünftige Business-Integration | **`quote-required / unknown`** |
| „100% Free“ App-Marketing | **kein** Kostenvertrag; Terms kennen Fees, Participant-Lizenzen, Auto-Renew, Onboarding-Fees |
| Consumer Essentials/Pro/Signature | **nicht** als Jetnity-Business-Preis verwendbar |

## 8. Was dieser Slice geliefert hat

1. Live-Rekonstruktion gegen `main @ 6083ee63` inkl. Production-404.
2. First-Party-Vendor-Evidence mit Datumstempeln.
3. Fit/Gap-Matrix über die 13 Pflichtachsen.
4. Kleinster sicherer zukünftiger Integrationsvertrag (nicht starten).
5. Self-Review + Handoff mit Pflichtabschnitten.

Keine Runtime-Datei. Keine Migration. Keine Search-/Homepage-Änderung. Keine Shared-Continuity-Mutation.

## 9. Tests / Gates

Lokale Gates und Exact-Head-CI/Vercel werden nach dem Authoring-Push auf dem neuen Head gestempelt. Task-only-Gates auf `f4e0707e` gelten nicht für den Authoring-Head.

Geplant / in diesem Slice zulässig:

- bestehender AP-6a-Inventory-Test (Regression: Orphan/404-Wahrheit unverändert);
- keine neuen Runtime-Tests;
- kein `auth:pruefen` (kein Auth-Slice, kein Secret);
- kein Browser-Klick.

## 10. Risiken / Residuals

Siehe Handoff. Kern: Produktkategorie-Mismatch; Visitor-Login/Scan; US-Transfer ohne öffentliche DPA/SCC; fehlende API-Evidence; Commission-/Branding-Konflikt; Agent-Self-Review ist kein PASS; `main` `protected=false`.

## 11. Offene Entscheidungen

Nur Product Owner + Legal + Security können später entscheiden, ob überhaupt ein externer Privacy-Vendor gebraucht wird. Dieser Agent startet keine Integration und keinen Folgeslice.

## 12. Exakter nächster Schritt

Unabhängiger ChatGPT Technical-Lead Exact-Head-Review von Draft-PR #171.  
Kein Ready. Kein Merge. Keine PrivacyBee-Integration. Kein AP-6a-Runtime. Kein AP-6b.
