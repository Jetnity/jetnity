# PrivacyBee Schweiz – Fit/Gap-Matrix

Stand: 29. August 2026  
Status: **AUDIT EVIDENCE ONLY / KEINE KONFORMITÄTSBEHAUPTUNG / KEIN VENDOR-ACCEPT**  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**  
First-Party-Abruf: 2026-08-29T09:32Z  
TARGET: `privacybee.io` / PrivacyBee AG. Nicht `privacybee.com`.

Klassen: `fit` · `partial` · `gap` · `unknown / vendor-confirmation-required` · `nicht relevant`

---

## 0. Jetnity-Bedarf (nicht Vendor-Marketing)

1. Ehrliche `/privacy` und `/terms` nach PO/Legal-Content (AP-6a).
2. Optional `/impressum`, nur wenn Legal das extra freigibt.
3. Cookie-Banner nur bei ehrlichem Bedarf; heute Orphan, keine Tracker.
4. AP-6b: versionierter Account-Consent, Export, Kontolöschung – Jetnity-nativ.
5. Keine Passport-/Scan-/MRZ-/Biometrie-Weitergabe.
6. Jetnity bleibt Account/Trip/Traveller/Identity-SoT.

---

## 1. Privacy-Policy-Generierung und automatische Pflege

| | |
| --- | --- |
| Vendor | Scan der live Domain; DSE aus erkannten **Drittdiensten**; Rescan 8 Wochen; Textbausteine anwaltlich gepflegt; DE/FR/IT/EN; DSG- oder DSGVO-Variante. |
| Jetnity | Keine DSE-Seite; wesentliche Verarbeitungen sind **server-seitig** (Auth, Trips, Traveller, Guest, `model_usage`). |
| Bewertung | **partial** |
| Lücke | ALB 4.1/8.7: unübliche und server-seitige Bearbeitungen muss der Kunde melden; Autopilot sieht sie nicht. Ohne manuelle Ergänzung wäre die DSE **unvollständig und zu website-lastig**. Copy-Paste der DSE ist urheberrechtlich verboten. |
| Residual | Qualität der Ergänzungsmaske für Custom-Verarbeitungen: **unknown / vendor-confirmation-required**. |

## 2. Impressum-Generierung und Pflege

| | |
| --- | --- |
| Vendor | Ziehung aus öffentlichen Quellen; Pflichtfelder manuell prüfen; Land CH/DE/AT; OpenAI Use Case B (AVV). |
| Jetnity | Rechtsform, UID, Sitz, ladungsfähige Adresse **fehlend**. AP-6a macht `/impressum` nicht zum Default. |
| Bewertung | **partial** als Formularhilfe; **gap** als Wahrheitsquelle |
| Lücke | Öffentliche Quellen können eine nicht existierende oder unvollständige Betreiberidentität nicht heilen. OpenAI-US-Transfer für Impressum ist ein Extra-Residual. |
| Residual | Welche öffentlichen Quellen, welche Halluzinationsrate: **unknown / vendor-confirmation-required**. |

## 3. Cookie/Consent-Management und Script-Blocking

| | |
| --- | --- |
| Vendor | Banner jede Seite; Autopilot blockt Tracking bis Consent; Opt-in EU; optionale Seitensperre; GTM Consent Mode v2; JS-API. |
| Jetnity | Keine Tracker gefunden; `CookieConsent` Orphan mit falschem V1-Text; essenzielle Auth-/Quota-Cookies. |
| Bewertung | **partial** als zukünftiges Werkzeug; **gap** als heutiger Bedarf |
| Lücke | Banner + `app.privacybee.io` wäre selbst ein neuer Dritt-Processor und speichert Consent inkl. IP/UA (AVV §2). Ohne Tracker kein Zweck für nicht-essenzielle Kategorien. Essenzielle Supabase-Cookies darf ein Banner nicht als Marketing verkaufen. |
| Residual | Ob Auth-Cookies korrekt als necessary klassifiziert werden: **unknown / vendor-confirmation-required**. |

## 4. Integrationsmodell Next.js / Vercel

| | |
| --- | --- |
| Vendor | Plattformunabhängig via Head-Script, Widget, iFrame oder externer Link. WordPress-Plugin. Scripts zuerst im `head`. |
| Jetnity | Next 16 App Router, `proxy.ts`, fail-closed robots, noindex bis Indexing-Gate. |
| Bewertung | **partial** |
| Lücke | Kein first-party Next.js-Guide. Dritt-Scripts auf jeder Seite: CSP, Performance, Preview-SSO, `*.vercel.app` vs. kanonisches `jetnity.com`. Widget-Inhalte sind nicht Jetnity-SSR; Empty≠Error und noindex müssen Jetnity-seitig bleiben. |
| Residual | Offizielle CSP-Hashes, SRI, Subresource-Verhalten: **unknown / vendor-confirmation-required**. |

## 5. Controller / Processor

| | |
| --- | --- |
| Vendor | AVV: Kunde Verantwortlicher, PrivacyBee Auftragsverarbeiter. AVV entsteht automatisch mit Trial/Lizenz. |
| Bewertung | **fit** als Rollenmodell auf Papier |
| Lücke | Jetnity hat noch keinen benannten Controller. Trial würde den AVV **ungewollt** abschliessen – deshalb kein Trial. Generierte DSE kann Rollen gegenüber Endnutzern darstellen; das bleibt Legal-Copy, nicht Agent-Wahrheit. |

## 6. DPA / SCC / Transfers

| | |
| --- | --- |
| Vendor | Öffentlicher AVV 2.0 (10. Juni 2026). Primär CH/EWR. SCC 2021/914 für Drittland-Subunternehmer. OpenAI TIA, Residual mittel. Anlage 2 nicht im Fliesstext. |
| Bewertung | **partial** |
| Lücke | Anlage 2 / TOMs nur referenziert bzw. auf Anfrage. OpenAI-US für Impressum ist ein bewusstes Residual. AVV nicht akzeptiert. |
| Residual | Vollständige Subunternehmerliste, TIA-Einsicht: **vendor-confirmation-required**. |

## 7. Data Locations / Subprocessors

| | |
| --- | --- |
| Belegt | Verarbeitung primär CH und/oder EWR. OpenAI USA für Impressum-KI. Scripts von `app.privacybee.io`. |
| Nicht belegt | Anlage 2 Namen/Standorte ausser OpenAI. |
| Bewertung | **partial** / Rest **unknown / vendor-confirmation-required** |

## 8. Security / Incident / Breach

| | |
| --- | --- |
| Belegt | AVV §6 TOMs (Anlage 1 auf Anfrage); Breach ≤48 h; ALB 8.6 Hacker: angemessene TOMs, **keine** vertragliche Meldepflicht bei Hack (Widerspruchspotenzial zu AVV §9 – Legal muss das lesen). 99 % Verfügbarkeit. |
| Bewertung | **partial** |
| Residual | TOM-Dokument, Pen-Test, Zertifikate, Klärung ALB-8.6 vs. AVV-48h: **vendor-confirmation-required**. |

## 9. Consent-Evidence, Retention, Deletion, Exit

| | |
| --- | --- |
| Vendor | Speichert Consents + technische Identifier. Nach Vertragsende 1 Jahr; auf Wunsch 30 Tage. Löschbestätigung auf Anfrage. 5-Jahre-Nutzungsverbot der Texte. ALB: automatische Jahresverlängerung, keine Rückerstattung. |
| Bewertung | **partial** für Website-Consent-Logs; **gap** für Account-Export/Delete |
| Lücke | AP-6b bleibt Jetnity. Website-Consent-Logs sind Besucher-PII. Exit macht DSE/Impressum/Banner sofort tot und verbietet Weiterverwendung. |

## 10. API / Webhook

| | |
| --- | --- |
| Belegt | Browser-API `window.PrivacyBee` + DOM-Events. Kein öffentliches Account-DSAR-API. |
| Bewertung | **fit** für Client-Consent-Hooks; **gap** für AP-6b |
| Residual | Server-to-server Consent-Export: **unknown / vendor-confirmation-required**. |

## 11. Branding / a11y / UX / Performance

| | |
| --- | --- |
| Vendor | Farben, Light/Dark, Logo; Banner position unten L/R; extra CSS möglich. Sprachen DE/EN/FR/IT. |
| Jetnity | V2-Tokens, mobile-first, eine `h1`, Touch-Ziele, noindex. |
| Bewertung | **partial** |
| Lücke | Dritt-Widget statt semantischer Jetnity-Artikel. a11y, Fokus, Kontrast, Motion: **unknown** ohne Browserbeweis. Extra Head-Script auf jeder Route: Performance-/CSP-Kosten. Seitensperre wäre UX-hart und heute unbegründet. |

## 12. Lock-in / Failure

| Modus | Severity |
| --- | --- |
| Scripts down ⇒ leere `/privacy` oder toter Banner | **high** |
| Exit ⇒ Texte dürfen 5 Jahre nicht weiterverwendet werden | **high** |
| Unvollständige DSE, weil Server-Verarbeitungen unsichtbar | **high** |
| OpenAI-Impressum falsch/halluziniert | **medium** |
| Preisänderung zur Folgeperiode | **low–medium** |
| PrivacyBee wird still Consent-SoT auch für Account | **high** wenn falsch verdrahtet |
| Autopilot blockt essenzielle Auth-Scripts | **high** falls je gemountet ohne Test |

## 13. Swiss DSG + GDPR (ohne eigenen Compliance-Claim)

Vendor behauptet DSG+DSGVO-Kompatibilität und anwaltliche Prüfung. ALB und Home-FAQ sagen gleichzeitig: **Betreiber bleibt verantwortlich**; Inhalte nicht einzeln geprüft; keine Gewähr der Pflichterfüllung.

Jetnity darf daraus **keine** eigene Konformitätszeile ableiten. Die bestehende UI-Zeile bleibt unbelegter Trust-Defekt.

## 14. Datenminimierung / Zweckbindung

Scan der öffentlichen Website und Consent-Logs (IP/UA) haben einen Website-Zweck. Das ist enger als US-Removal-Produkte, aber immer noch neuer Personenbezug für **alle Besucher**, sobald der Banner live ist.

Zwecküberschreitung droht, wenn jemand Trip-/Traveller-Daten „für eine vollständigere DSE“ hochlädt. Default: verboten.

OpenAI für Impressum: Zweck Impressum-Text, Residual US-Transfer.

## 15. Kosten

| Objekt | Public | Für Jetnity |
| --- | --- | --- |
| Endkunde | **CHF 54,90 / Jahr / Domain zzgl. MWST** | belegt 2026-08-29 |
| Trial 14 Tage | Home: ohne Kreditkarte | **nicht starten** (AVV entsteht) |
| Partner 25 % Kickback | Preis-Seite | nicht verwenden |
| Nicht genannt | Custom-Texte, mehrere Vercel-Domains, Inspektion | **unknown / vendor-confirmation-required** |
| Dieser Audit | — | **keine** |

## 16. Was PrivacyBee ausdrücklich nicht ersetzt

Belegt durch ALB 4.1 und fehlende First-Party-DSAR-Account-Funktionen:

- Account-Export / Kontolöschung / AP-6b-Consent-Version
- Interne Retention, RLS, Ownership, Auth/MFA/AAL
- Traveller-/Dokument-Wahrheit und Registry
- Nutzungsbedingungen / Aggregator-Haftung / Affiliate-Offenlegung
- Organisatorische Datenschutzpflichten jenseits der Website
- Public-Indexing-, Domain- und Production-Gates

## 17. Gesamt

| Frage | Antwort |
| --- | --- |
| Passt das Produkt zur Website-Legal-Lücke? | **Teilweise ja** (DSE/Impressum/Banner). |
| Passt es zu Jetnity als Reise-/Account-System? | **Nein ohne grosse manuelle Ergänzung.** |
| Jetzt aktivieren? | **Nein.** |
| Native Alternative | AP-6a Legal-Texte + später AP-6b. |
| Kleinste spätere Teilmenge | Siehe Integrationsvertrag: Widgets nur auf Legal-Routen; Banner erst bei echten Trackern; Server-Verarbeitungen Jetnity-seitig beschreiben; `/terms` bleibt Jetnity. |
