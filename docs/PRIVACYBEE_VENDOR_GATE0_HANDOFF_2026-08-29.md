# Jetnity – PrivacyBee Schweiz Vendor Gate 0 Handoff

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/171  
Branch: `audit/privacybee-vendor-gate0-2026-08-29`  
Issue: [#169](https://github.com/Jetnity/jetnity/issues/169)

Dieser Handoff übergibt Gate 0. Er startet keine Integration und keinen Trial. Agent-Self-Review ist kein PASS.

---

## 1. Ergebnis

Swiss PrivacyBee (`privacybee.io`, **PrivacyBee AG**) ist ein Website-Legal-Autopilot für Datenschutzerklärung, Cookie-Banner und Impressum. Das trifft die **AP-6a-Website-Schicht** teilweise, nicht die Account-/Traveller-/AP-6b-Schicht.

Live first-party: Scan der öffentlichen Domain, Rescan alle 8 Wochen, Widget/iFrame/externer Link oder Head-Script von `app.privacybee.io`, Sprachen DE/FR/IT/EN, Varianten DSG oder DSGVO, Endkundenpreis **CHF 54,90 pro Jahr und Domain zzgl. MWST**. Öffentliches **Verarbeitungsverzeichnis** (2026-08-29T09:49Z) nennt u. a. Heroku (alle AVV-§2-Daten), OpenAI (USA, kein DPF) und Vendor-Marketing-Tracker auf privacybee.io. Identität dieses Registers mit AVV Anlage 2 v1.1 (22. Mai 2026) ist **nicht** bewiesen. Die de-CH-AVV-Seite enthält eine Patent-Ochsner-/Mundart-Anomalie; öffentliche AVV-/TIA-Aussagen sind daher **`source-integrity/vendor-confirmation-required`**, kein unqualifiziertes Legal Basis. ALB: nur Durchschnittswebsites ohne unübliche Bearbeitungen; keine Gewähr der Vollständigkeit; server-seitige Lücken kein Garantiefall; Exit-Verbot 5 Jahre.

Jetnity-Ist: `/privacy` `/terms` Production-404; Register-Zustimmung ohne Persistenz; CookieConsent-Orphan; keine Tracker; kein Consumer-Export/Delete; Traveller ohne Nummer/Scan/MRZ; Controller-Identität fehlend.

Der Product Owner hat bereits ein Konto bei PrivacyBee Schweiz. Das senkt die Signup-Reibung, **nicht** das Vendor-/Security-/Legal-Gate. Konkreter Account-Stand (Domain, Tarif, AVV, Snippets) ist **`account-evidence-required`**. Dieser Agent hat das Konto nicht geöffnet.

**Empfehlung:** Jetzt **nicht** aktivieren und **nicht** einloggen. Native AP-6a (PO/Legal-Texte, inkl. `/terms`) und später AP-6b bleiben der Kernweg. PrivacyBee höchstens später über das bestehende Konto als Website-Widget **plus** schriftlichem Jetnity-Nachtrag für server-seitige Verarbeitungen; Cookie-Banner erst, wenn echte Tracker existieren.

---

## 2. Risiken / Residuals

| ID | Residual | Severity |
| --- | --- | --- |
| PB-R1 | Scanner sieht keine Auth/Trip/Traveller/Guest/`model_usage` | **high** |
| PB-R2 | Unvollständige DSE würde Trust-P1 durch Schein-Vollständigkeit ersetzen | **high** |
| PB-R3 | Trial/Signup = automatischer AVV | **high** (Prozess) |
| PB-R4 | OpenAI-US für Impressum (VVZ belegt); TIA-Residual „mittel“ nur im AVV-Text → `source-integrity/vendor-confirmation-required` | **medium–high** |
| PB-R5 | Banner ohne Tracker erzeugt neuen Besucher-PII-Fluss (IP/UA) | **medium** |
| PB-R6 | Dritt-Scripts down ⇒ leere Legal-Seite | **high** falls je gemountet |
| PB-R7 | 5-Jahre-Exit-Verbot auf generierte Texte | **medium** |
| PB-R8 | `/terms` bleibt ungedeckt | **high** (bestehende Lücke) |
| PB-R9 | Controller/Adresse fehlen; generiertes Impressum kann sie nicht erfinden | **high** |
| PB-R10 | Öffentliches VVZ inventarisiert; Identität mit Anlage 2 v1.1 unbewiesen; TOM/TIA-PDFs weiter nicht öffentlich | **medium** |
| PB-R11 | ALB 8.6 (keine Hack-Meldepflicht) vs. beobachteter AVV-§9-48h-Text | **medium** |
| PB-R17 | de-CH-AVV-Seite: Patent-Ochsner-/Mundart-Duplikat; kanonisches AVV nicht bewiesen | **high** (evidence/trust) |
| PB-R18 | Heroku hostet laut VVZ alle AVV-§2-Daten inkl. Consent/IP | **high** falls je angebunden |
| PB-R12 | Vendor-Konformitätsmarketing vs. ALB „Kunde bleibt verantwortlich“ | **medium** |
| PB-R13 | Passport/Scan/MRZ/Biometrie dürfen nie „für DSE-Vollständigkeit“ geliefert werden | **high** (default-verboten) |
| PB-R14 | AP-6a-404 und unbelegte UI-Konformitätszeile bleiben | **high** |
| PB-R15 | `main` `protected=false` | **medium** |
| PB-R16 | Agent-Self-Review ist kein PASS | **process** |

---

## 3. Kostenwirkung

- **Dieser Audit: `keine`.** Kein Trial, kein Order, kein paid call.
- **Öffentlicher Zukunftspreis (belegt 2026-08-29):** CHF **54,90 / Jahr / Domain zzgl. MWST**.
- Bestehendes PO-Konto: **keine** neuen Signup-Kosten in diesem Audit. Ob eine Jetnity-Domain schon bezahlt/zugeordnet ist: **`account-evidence-required`**.
- Partner-Kickback bis 25 % ist **nicht** der Jetnity-Preis.
- Nicht im Listenpreis genannte Posten: **`unknown / vendor-confirmation-required`**.
- Keine Recurring-Aktivierung in diesem Slice.

---

## 4. Offene Entscheidungen / Gates

1. PO + Legal: AP-6a-Input-Matrix zuerst (Controller, Adresse, Texte, `/impressum` ja/nein, Konformitätszeile, CookieConsent-Schicksal).
2. PO + Legal + Security: überhaupt Swiss PrivacyBee später, oder native Texte? Bestehendes Konto ≠ Ja.
3. PO liefert fehlende Account-Fakten A1–A9 aus Status (`account-evidence-required`) **ohne** Passwörter/Keys an Agenten.
4. Legal: saubere Account-Kopie AVV/Anlage 2/TOM/TIA lesen und mit öffentlichem VVZ abgleichen; öffentliche de-CH-AVV-Seite nicht als kanonisch behandeln.
5. PO: Cookie-Banner erst bei echten nicht-essenziellen Scripts.
6. Technical Lead: Ready/Merge nur nach unabhängigem Exact-Head-Review.

Keine dieser Entscheidungen ist getroffen.

---

## 5. Empfohlene nächste Schritte

1. Unabhängiger ChatGPT Technical-Lead Exact-Head-Review von Draft-PR #171.
2. Danach: AP-6a-Content-Gate (`docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`). Das bleibt der Trust-P1.
3. AP-6b native, nicht PrivacyBee.
4. Kein Trial, kein Script-Mount, keinen Folgeslice, keinen zweiten Vendor-Audit automatisch starten.
5. Falls später trotzdem PrivacyBee: Integrationsvertrag einhalten (Nachtrag server-seitiger Verarbeitungen, kein Banner ohne Tracker, `/terms` Jetnity, Kill-Switch, kein Traveller-Dump).

---

## 6. Exact evidence

### 6.1 Repository / PR / Agent

| Fakt | Wert |
| --- | --- |
| Baseline `origin/main` | `6083ee63a5da62870ab7ac4f5f91f69230718e44` |
| Merge-Base | dieselbe SHA |
| Task + Vendor-Korrektur | `61014e39` Correct PrivacyBee Gate 0 to Swiss privacybee.io target |
| Authoring-Head (TL-Fix `5057555199`) | `fa39323280bffcd1147860178f695f567fa23f9e` |
| Draft-PR | #171 OPEN Draft |
| Issue | #169 OPEN |
| PR #168 | OPEN Draft, nicht mutiert |
| `main` protected | `false` |
| Agent | `Privacy provider integration audit 1` / observed `PrivacyBee vendor audit` |
| Cloud-Run | https://cursor.com/agents/bc-294ba965-a57a-4590-a98c-e11f079bc7ae |

### 6.2 First-Party Swiss PrivacyBee (HTTP 2026-08-29T09:32Z)

| URL | HTTP | Beobachtetes Datum / Residual |
| --- | --- | --- |
| https://www.privacybee.io/de-ch/ | 200 | Produkt DSE+Banner+Impressum; 8-Wochen-Scan; 14-Tage-Test |
| https://www.privacybee.io/de-ch/preis/ | 200 | **CHF 54,90 / Jahr / Domain zzgl. MWST** |
| https://www.privacybee.io/de-ch/integration/ | 200 | JS-Snippet; CMS; Banner Autopilot |
| https://www.privacybee.io/de-ch/auftragverarbeitervertrag/ | 200 (09:49Z) | Formaler AVV 2.0 / 10. Juni 2026 **plus** Patent-Ochsner-/Mundart-Duplikat; schema `dateModified` 2026-06-22T11:29:58Z. **`source-integrity/vendor-confirmation-required`** |
| https://www.privacybee.io/auftragverarbeitervertrag/ | 200 (09:49Z) | Formaler DE-AVV ohne Patent-Ochsner-Marker; nicht als bewiesenes kanonisches CH-Dokument verwendet |
| https://www.privacybee.io/de-ch/verarbeitungsverzeichnis/ | 200 (09:49Z) | Öffentliches Subunternehmer-Register; schema `dateModified` 2026-06-10T12:38:27Z |
| https://www.privacybee.io/verarbeitungsverzeichnis/ | 200 (09:49Z) | de-DE-Locale, gleicher Kern; Identität mit Anlage 2 v1.1 **nicht** bewiesen |
| https://www.privacybee.io/de-ch/lizenzbedingungen/ | 200 | Zuletzt aktualisiert **10. Juni 2026** |
| https://www.privacybee.io/de-ch/haeufig-gestellte-fragen/ | 200 | Kanzlei Domenig & Partner + Digital Innovation Lab AG |
| https://support.privacybee.io/support/solutions/articles/103000392568-wie-kann-ich-privacybee-auf-meiner-website-einbinden- | 200 | geändert 2. Juni; `app.privacybee.io` Scripts |
| https://support.privacybee.io/support/solutions/articles/103000403413-javascript-events-und-api-des-privacybee-cookie-banners | 200 | geändert 27. Mai; `window.PrivacyBee` |
| https://support.privacybee.io/support/solutions/articles/103000348693-welche-content-management-systeme-und-website-typen-werden-unterstützt- | 200 | geändert 7. Januar; plattformunabhängig |

### 6.3 Jetnity Production (dieser Run)

| Fakt | Wert |
| --- | --- |
| Alias | `https://jetnity-app.vercel.app` |
| `/` | 200; `dpl_GntXsgcdUN8cQKqHPqnpB6jUEfZz` |
| `/privacy` `/terms` | **404** |

### 6.4 Lokale Checks / CI / Vercel / Threads

Evidence-Head `fa39323280bffcd1147860178f695f567fa23f9e` (TL-Fix `5057555199`: VVZ-Inventar + AVV-Source-Integrity):

- Lokal: `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` **9/9 pass**.
- GitHub Actions Run `33246529227` **SUCCESS** auf exakt `fa393232` (Typecheck/Lint/Build + Auth-Check).
- Vercel StatusContext **SUCCESS**; Deployment `29fzPGLcsAFdnS6X136YFcENqesL`; GitHub Preview deployment `6154529113`.
- Review `5057555199` CHANGES REQUIRED galt für `f97cb97a` und ist damit invalidiert. Neuer unabhängiger TL-Review ausstehend. Kein TL-PASS.

Dieser Stamp erzeugt einen neueren Head. Die genannten Gates gelten für `fa393232`, nicht automatisch für den Stamp-Commit. Live an PR #171 prüfen.

Preview-HTML bleibt SSO-geschützt und ist kein Inhaltsbeweis.

---

## 7. Vendor identity disambiguation

Das Ziel dieses Slices ist **ausschliesslich** die Schweizer Website-Datenschutz-Lösung **PrivacyBee AG** auf **`privacybee.io`**.

Das US-Unternehmen **Privacy Bee, LLC** auf **`privacybee.com` / `business.privacybee.com`** (Consumer Data-Broker-Removal / Employee External Data Privacy) ist **nicht** der evaluierte Vendor. Frühe Evidence gegen diese US-Marke ist ungültig und darf nicht als Swiss-PrivacyBee-Wahrheit weiterverwendet werden.

---

## 8. Naming

| Feld | Wert |
| --- | --- |
| Logischer Name | `Privacy provider integration audit 1` |
| Beobachteter Titel | `PrivacyBee vendor audit` |
| Generation | **1.** Vendor-Korrektur in derselben Session. |
| UI umbenannt? | **nein** |

---

## 9. Nicht tun

- Ready setzen oder mergen.
- Trial, Signup, Zahlung, AVV-Accept, Script-Mount.
- AP-6a-Runtime, AP-6b, AP-7, Search #168 starten.
- Rechtstexte oder Konformität erfinden.
- Passport-/Scan-/MRZ-/Biometrie-Daten an den Vendor geben.
- US-`privacybee.com` erneut als Ziel auditieren.

---

## 10. Exakter nächster Schritt

Unabhängiger ChatGPT Technical-Lead Exact-Head-Review von Draft-PR #171.  
Derselbe Agent behebt nur unmittelbare Review-Funde dieses Slices.
