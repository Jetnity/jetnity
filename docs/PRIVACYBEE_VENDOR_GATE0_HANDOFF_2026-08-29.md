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

Live first-party: Scan der öffentlichen Domain, Rescan alle 8 Wochen, Widget/iFrame/externer Link oder Head-Script von `app.privacybee.io`, Sprachen DE/FR/IT/EN, Varianten DSG oder DSGVO, Endkundenpreis **CHF 54,90 pro Jahr und Domain zzgl. MWST**. AVV 2.0 (10. Juni 2026) macht PrivacyBee zum Auftragsverarbeiter; Trial schliesst den AVV automatisch. OpenAI wird für Impressum genutzt (TIA, Residual mittel, USA). Anlage 2 / TOMs nicht vollständig öffentlich. ALB: nur Durchschnittswebsites ohne unübliche Bearbeitungen; keine Gewähr der Vollständigkeit; server-seitige Lücken kein Garantiefall; Exit-Verbot 5 Jahre.

Jetnity-Ist: `/privacy` `/terms` Production-404; Register-Zustimmung ohne Persistenz; CookieConsent-Orphan; keine Tracker; kein Consumer-Export/Delete; Traveller ohne Nummer/Scan/MRZ; Controller-Identität fehlend.

**Empfehlung:** Jetzt **nicht** aktivieren. Native AP-6a (PO/Legal-Texte, inkl. `/terms`) und später AP-6b bleiben der Kernweg. PrivacyBee höchstens später als Website-Widget **plus** schriftlichem Jetnity-Nachtrag für server-seitige Verarbeitungen; Cookie-Banner erst, wenn echte Tracker existieren.

---

## 2. Risiken / Residuals

| ID | Residual | Severity |
| --- | --- | --- |
| PB-R1 | Scanner sieht keine Auth/Trip/Traveller/Guest/`model_usage` | **high** |
| PB-R2 | Unvollständige DSE würde Trust-P1 durch Schein-Vollständigkeit ersetzen | **high** |
| PB-R3 | Trial/Signup = automatischer AVV | **high** (Prozess) |
| PB-R4 | OpenAI-US für Impressum; TIA-Residual mittel; Löschrecht gegenüber US-Sub nicht garantiert | **medium–high** |
| PB-R5 | Banner ohne Tracker erzeugt neuen Besucher-PII-Fluss (IP/UA) | **medium** |
| PB-R6 | Dritt-Scripts down ⇒ leere Legal-Seite | **high** falls je gemountet |
| PB-R7 | 5-Jahre-Exit-Verbot auf generierte Texte | **medium** |
| PB-R8 | `/terms` bleibt ungedeckt | **high** (bestehende Lücke) |
| PB-R9 | Controller/Adresse fehlen; generiertes Impressum kann sie nicht erfinden | **high** |
| PB-R10 | Anlage 2 / TOMs / TIA-PDF nicht unabhängig gelesen | **medium** |
| PB-R11 | ALB 8.6 (keine Hack-Meldepflicht) vs. AVV §9 (48 h) | **medium** |
| PB-R12 | Vendor-Konformitätsmarketing vs. ALB „Kunde bleibt verantwortlich“ | **medium** |
| PB-R13 | Passport/Scan/MRZ/Biometrie dürfen nie „für DSE-Vollständigkeit“ geliefert werden | **high** (default-verboten) |
| PB-R14 | AP-6a-404 und unbelegte UI-Konformitätszeile bleiben | **high** |
| PB-R15 | `main` `protected=false` | **medium** |
| PB-R16 | Agent-Self-Review ist kein PASS | **process** |

---

## 3. Kostenwirkung

- **Dieser Audit: `keine`.** Kein Trial, kein Order, kein paid call.
- **Öffentlicher Zukunftspreis (belegt 2026-08-29):** CHF **54,90 / Jahr / Domain zzgl. MWST**.
- Partner-Kickback bis 25 % ist **nicht** der Jetnity-Preis.
- Nicht im Listenpreis genannte Posten: **`unknown / vendor-confirmation-required`**.
- Keine Recurring-Aktivierung in diesem Slice.

---

## 4. Offene Entscheidungen / Gates

1. PO + Legal: AP-6a-Input-Matrix zuerst (Controller, Adresse, Texte, `/impressum` ja/nein, Konformitätszeile, CookieConsent-Schicksal).
2. PO + Legal + Security: überhaupt Swiss PrivacyBee später, oder native Texte?
3. Legal: AVV/Anlage 2/OpenAI-TIA/ALB-8.6 lesen, bevor irgendwer einen Trial startet.
4. PO: Cookie-Banner erst bei echten nicht-essenziellen Scripts.
5. Technical Lead: Ready/Merge nur nach unabhängigem Exact-Head-Review.

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
| Authoring-Head | der Commit dieses Stamps; live an PR #171 prüfen |
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
| https://www.privacybee.io/de-ch/auftragverarbeitervertrag/ | 200 | AVV 2.0 Stand **10. Juni 2026**; schema `dateModified` 2026-06-22 |
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

Vor diesem Stamp: Task-Head-Gates gelten nicht für den neuen Head. Vercel auf frühere Heads (u. a. `GCCuNzhurfhkLrp8XK85pLt9d6xK`) ist invalidiert.

Authoring-Head: lokale Checks und Exact-Head-CI/Vercel nach Push nachstempeln. Review-Auftrag: PR-Kommentar `5461543989`. Kein TL-PASS-Thread.

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
