# Jetnity – PrivacyBee Schweiz Vendor Gate 0 Handoff

Stand: 29. August 2026  
Status: **INTEGRATED / POST-MERGE GREEN / CLOSEOUT / STOP FOR FINAL INDEPENDENT TECHNICAL-LEAD REVIEW OF THIS CLOSEOUT**  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**  
Canonical transport: https://github.com/Jetnity/jetnity/pull/175 (MERGED)  
Superseded author PR: https://github.com/Jetnity/jetnity/pull/171 (OPEN Draft)  
Branch: `audit/privacybee-vendor-gate0-2026-08-29`  
Issue: [#169](https://github.com/Jetnity/jetnity/issues/169) OPEN — closable after TL review of this closeout

Dieser Handoff schliesst Gate-0-Continuity nach Transport. Er startet keine PrivacyBee-Aktivierung und keinen Trial. Agent-Self-Review ist kein PASS.

---

## 1. Ergebnis

Swiss PrivacyBee (`privacybee.io`, **PrivacyBee AG**) ist ein Website-Legal-Autopilot für Datenschutzerklärung, Cookie-Banner und Impressum. Das trifft die **AP-6a-Website-Schicht** teilweise, nicht die Account-/Traveller-/AP-6b-Schicht.

Live first-party: Scan der öffentlichen Domain, Rescan alle 8 Wochen, Widget/iFrame/externer Link oder Head-Script von `app.privacybee.io`, Sprachen DE/FR/IT/EN, Varianten DSG oder DSGVO, Endkundenpreis **CHF 54,90 pro Jahr und Domain zzgl. MWST**. Öffentliches **Verarbeitungsverzeichnis** (2026-08-29T09:49Z) nennt u. a. Heroku (alle AVV-§2-Daten), OpenAI (USA, kein DPF) und Vendor-Marketing-Tracker auf privacybee.io. Identität dieses Registers mit AVV Anlage 2 v1.1 (22. Mai 2026) ist **nicht** bewiesen. Die de-CH-AVV-Seite enthält eine Patent-Ochsner-/Mundart-Anomalie; öffentliche AVV-/TIA-Aussagen sind daher **`source-integrity/vendor-confirmation-required`**, kein unqualifiziertes Legal Basis. ALB: nur Durchschnittswebsites ohne unübliche Bearbeitungen; keine Gewähr der Vollständigkeit; server-seitige Lücken kein Garantiefall; Exit-Verbot 5 Jahre.

Jetnity-Ist: `/privacy` `/terms` Production-404; Register-Zustimmung ohne Persistenz; CookieConsent-Orphan; keine Tracker; kein Consumer-Export/Delete; Traveller ohne Nummer/Scan/MRZ; Controller-Identität fehlend.

Der Product Owner hat bereits ein Konto bei PrivacyBee Schweiz. Das senkt die Signup-Reibung, **nicht** das Vendor-/Security-/Legal-Gate. Konkreter Account-Stand (Domain, Tarif, AVV, Snippets) ist **`account-evidence-required`**. Dieser Agent hat das Konto nicht geöffnet.

**Audit-Stand:** integrated / post-merge green. Das ist **keine** Vendor-Aktivierung.

**Empfehlung:** Jetzt **nicht** aktivieren und **nicht** einloggen. AP-6a Legal bleibt geparkt / Release-Trust-Blocker. Native AP-6a (PO/Legal-Texte, inkl. `/terms`) und später AP-6b bleiben der Kernweg. PrivacyBee höchstens später über das bestehende Konto als Website-Widget **plus** schriftlichem Jetnity-Nachtrag für server-seitige Verarbeitungen; Cookie-Banner erst, wenn echte Tracker existieren.

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
6. Technical Lead: Closeout dieses Dokuments unabhängig reviewen; #169 danach schliessbar. Agent setzt weder Ready noch Merge. Inhalt ist bereits über #175 auf `main`.

Keine dieser Entscheidungen ist getroffen.

---

## 5. Empfohlene nächste Schritte

1. Unabhängiger ChatGPT Technical-Lead Exact-Head-Review **dieses Closeouts**.
2. Danach: Issue #169 schliessen; #171 als superseded belassen oder schliessen. AP-6a-Content-Gate (`docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`) bleibt geparkt / Trust-P1.
3. AP-6b native, nicht PrivacyBee.
4. Kein Trial, kein Script-Mount, keinen Folgeslice, keinen zweiten Vendor-Audit automatisch starten.
5. Falls später trotzdem PrivacyBee: Integrationsvertrag einhalten (Nachtrag server-seitiger Verarbeitungen, kein Banner ohne Tracker, `/terms` Jetnity, Kill-Switch, kein Traveller-Dump).

---

## 6. Exact evidence

### 6.1 Repository / PR / Agent

| Fakt | Wert |
| --- | --- |
| Historical task-baseline / original merge-base | `6083ee63a5da62870ab7ac4f5f91f69230718e44` — **nicht** live `origin/main` |
| Reviewed content head | `278138ade951344be539df0767e02fa9fc4e24f8` |
| Live `origin/main` | `6c5e8c167f3a6b991bd6b6f5e05180ddbe4df7fd` |
| Transport | PR #175 MERGED 2026-08-29T10:36:21Z (`mergeCommit` = live `main`) |
| Author PR #171 | OPEN Draft; **superseded** by #175 |
| Branch stamp `b9495fa7` | nicht Teil des #175-Merge |
| Issue | #169 OPEN; closable after TL review of this closeout |
| Search | #168 CLOSED/MERGED via #172; current #109 recovery = #173 OPEN Draft; not mutated by this closeout |
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
| `/` | 200; Production `dpl_3gm9LNpyoqRRU43rrDnWNaY9jnwT` on `6c5e8c16` |
| `/privacy` `/terms` | **404** |

### 6.4 Lokale Checks / CI / Vercel / Threads

Post-merge evidence (live, this closeout):

- Reviewed content `278138ad` transported by #175; `main` = `6c5e8c16`.
- GitHub Actions push run `33248216109` **SUCCESS** on exakt `6c5e8c16`.
- Vercel Production `dpl_3gm9LNpyoqRRU43rrDnWNaY9jnwT` READY; GitHub Production deployment `6154845099`.
- Branch-stamp `b9495fa7` was **not** in the original merge.
- Closeout Exact-Head-CI/Vercel after this push. Kein TL-PASS für das Closeout behauptet.

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
- AP-6a-Runtime, AP-6b, AP-7, Search-Runtime (#168/#173) starten.
- Rechtstexte oder Konformität erfinden.
- Passport-/Scan-/MRZ-/Biometrie-Daten an den Vendor geben.
- US-`privacybee.com` erneut als Ziel auditieren.

---

## 10. Exakter nächster Schritt

Unabhängiger ChatGPT Technical-Lead Exact-Head-Review **dieses Closeouts**.  
Issue #169 kann danach geschlossen werden. Agent setzt weder Ready noch Merge.
