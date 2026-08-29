# Jetnity – PrivacyBee Vendor Gate 0 Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Privacy provider integration audit 1`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS  
Cloud-Run: https://cursor.com/agents/bc-294ba965-a57a-4590-a98c-e11f079bc7ae

## 1. Auftrag gegen Diff

Auftrag: Gate 0 nach `docs/PRIVACYBEE_VENDOR_GATE0_TASK_2026-08-29.md` und Issue #169 auf Draft-PR #171. Baseline `6083ee63`.

Geprüft gegen den tatsächlichen Dateisatz: Task plus Status, Fit/Gap-Matrix, Integrationsvertrag, dieses Self-Review, Handoff.

Erwartete Diff-Klasse: nur versionierte Vendor-/Privacy-Audit-Docs. Keine Runtime, keine Shared Continuity, kein Search #168.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde ein PrivacyBee-Account, Order, Abo oder paid call erzeugt? | Nein. Nur öffentliche HTTP-GETs. |
| Wurden Terms/DPA/SCC akzeptiert? | Nein. DPA-URLs sind 404; Terms nur gelesen. |
| Wurde ein API-Key oder Secret angelegt? | Nein. |
| Wurden User-Daten übertragen? | Nein. |
| Wurde Runtime, Cookie-Banner oder Legal-Copy geändert/erzeugt? | Nein. |
| Wurden Search #168 / Homepage / AP-7 / DB / RLS / Auth angefasst? | Nein. |
| Wurden Shared Continuity-Dateien mutiert? | Nein. |
| Wurden unbelegte API-/Preis-/DPA-/SLA-Fakten als wahr behauptet? | Nein. Als `unknown / vendor-confirmation-required` oder `quote-required / unknown` markiert. |
| Wurden Consumer-Preise als Business-Integrationspreis verwendet? | Nein. Explizit getrennt. |
| Wurden Passport/Scan/MRZ/Biometrie als für PrivacyBee freigegeben dargestellt? | Nein. Default-verboten. |
| Wurde Jetnity-SoT an den Vendor abgegeben? | Nein. Vertrag verbietet das. |
| Wurde Rechtskonformität (DSG/GDPR) behauptet? | Nein. |
| Wurde Integration oder ein Folgeslice gestartet? | Nein. |
| Wurde Ready/Merge empfohlen? | Nein. STOPP für unabhängigen TL-Review. |
| Wurde Generation 2 wegen UI-Titel erfunden? | Nein. Sichtbarer Titel `PrivacyBee vendor audit`, non-blocking. |
| Wurde „100% Free“ als Kostenvertrag übernommen? | Nein. Marketing vs. Terms-Fees getrennt. |

## 3. Proaktive Funde, die nicht still geschlossen wurden

1. **Produktkategorie-Mismatch.** PrivacyBee-Business-Kern ist Employee External-Data-Privacy / Data-Broker-Removal. Consent Core und Cookie Consent sind Zusatz-Apps mit Leadgen-/Commission-Modell.
2. **Visitor-Login + Exposure-Scan** ist first-party belegt. Das ist der härteste Fit-Breaker, nicht ein fehlendes Feature.
3. **Alle gelisteten Subprocessors USA**, öffentliche DPA 404. Für ein schweiz-erstes Consumer-Produkt ist das ein Transfer-Gate, kein Detail.
4. Öffentliche App-Releases **2022/2023** bei 2026-Abruf. Live-Produktreife bleibt unknown.
5. PrivacyBees eigene Cookie-Leiste sagt „We use cookies to measure ads“, während Policy/Trust „zero ad-tech“ behauptet. Das ist ein Vendor-Site-Residual, keine Jetnity-Runtime-Änderung.
6. AP-6a-404 und die unbelegte Konformitätszeile bleiben; dieser Vendor heilt sie nicht.

## 4. Was der Autor bewusst nicht getan hat

- Kein zweiter CMP-Vendor-Audit (OneTrust, Cookiebot, …). Für die Architekturaussage reicht: native AP-6a/6b ist die kleinere, wahrheitsfeste Option.
- Kein Signup, um hinter Login APIs zu sehen. Das wäre Vendor-Aktivierung.
- Keine Zertifikats-PDFs von SOC2/ISO angefordert.
- Kein Production-Write, kein Preview-HTML-Inhalt als Legal-Beweis (Preview ist SSO-geschützt).

## 5. Risiken, die bleiben

- Authoring-Push erzeugt einen neuen Head und invalidiert Task-only-Gates auf `f4e0707e`.
- `main` `protected=false`.
- Agent-Self-Review ist kein PASS.
- Vendor-Marketing kann sich nach dem Abrufdatum ändern; Live-Evidence dieses Runs ist 2026-08-29T09:28Z.

## 6. Urteil des Autors

Gate-0-Acceptance aus dem Task ist aus Autorensicht erfüllt: Jetnity-Ist rekonstruiert, First-Party-Fakten datiert, Fit/Gap über 13 Achsen, kleinster sicherer Zukunftsvertrag, sensible Daten nicht freigegeben, Kosten `keine` / Zukunft `quote-required / unknown`, keine verbotene Grenze verletzt.

**Unabhängiger Technical-Lead Exact-Head-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
