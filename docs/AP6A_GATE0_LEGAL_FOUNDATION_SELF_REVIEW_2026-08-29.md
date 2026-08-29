# Jetnity – AP-6a Gate 0 Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 16`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Gate 0 nach `docs/AP6A_GATE0_LEGAL_FOUNDATION_TASK_2026-08-29.md` auf Draft-PR #166. Baseline `765fc547`.

Geprüft gegen den tatsächlichen Dateisatz: Task, Status, Handoff, Live-Evidence, Input-Vertrag, Runtime-Vertrag, ADR-0195, Continuity-Zeiger, `lib/legal/ap6a-gate0-vertrag.ts`, Inventory-Test.

Keine Änderung an produktiven Legal-Seiten. Keine Datei `app/**/privacy` oder `app/**/terms`. Keine Migration, kein RLS, kein Auth/MFA/AAL, keine Service Role, kein AP-7, kein Provider/Payments, kein Indexing/Cutover/Branch Protection.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurden AGB oder eine Datenschutzerklärung erfunden? | Nein. |
| Wurde Rechtskonformität behauptet? | Nein. Die bestehende UI-Zeile ist als **unbelegte Behauptung** inventarisiert. |
| Wurden Firmen-, Sitz-, UID- oder Gerichtsstandsfakten ergänzt? | Nein. Als `fehlend` / `PO-Legal-approval-required` klassifiziert. |
| Ist `info@jetnity.ch` als Controller ausgegeben? | Nein. Nur als belegte Footer-Anzeige. |
| Sind `/privacy` `/terms` live als 404 belegt? | Ja, Production-Alias HTTP 404, gleiche `data-dpl-id`. |
| Sind alle Call-Sites inventarisiert? | Register (Checkbox, OAuth-Lücke, Konformitätszeile), Login-Zeile, Footer, Navbar, CookieConsent-Orphan, Sitemap/robots, fehlende Pages, fehlende Consent-DB. |
| Ist AP-6b in diesen Slice gerutscht? | Nein. Export/Delete/Consent-Tabelle ausdrücklich außerhalb. |
| Wurde CookieConsent gemountet oder der V1-Text als Wahrheit übernommen? | Nein. Orphan belassen; Views/Likes als stale markiert. |
| Wurde Public Indexing oder Sitemap-Aufnahme empfohlen als stilles Default? | Nein. noindex / keine Sitemap-Aufnahme bis bestehendes Gate. |
| Wurde AP-6a-Runtime, AP-6b oder AP-7 gestartet? | Nein. |
| Wurde Ready/Merge empfohlen? | Nein. STOPP für unabhängigen TL-Review. |
| Wurde Generation 17 erfunden? | Nein. Sichtbarer Titel `Account plattform audit vorbereitung`, non-blocking. |
| Würde Continuity AP-5-S5 noch als offenen Draft behaupten? | Nein, nach diesem Slice: PR #164 integriert; aktueller Slice ist #166. |

## 3. Proaktive Funde, die nicht still geschlossen wurden

1. Die Konformitätszeile auf Login/Register ist ein eigener Trust-Defekt neben dem 404.
2. OAuth-Start ignoriert die Legal-Checkbox; Enablement ist aus, der Pfad bleibt Residual.
3. Footer hat keine Legal-Links; Runtime-Vertrag empfiehlt sie, erfindet sie nicht im Code.
4. `/impressum` und `/datenschutz` sind ebenfalls 404; Alias-Pflicht ist Legal, nicht Agent.

## 4. Risiken, die bleiben

- 404 bleibt bis Content-Gate + Runtime.
- Dieser Stamp erzeugt einen neuen Head und invalidiert Task-only-Gates auf `668c2f17`.
- `main` `protected=false`.
- Kein Browser-Klick durch die Register-Links.

## 5. Urteil des Autors

Gate-0-Acceptance aus dem Task ist aus Autorensicht erfüllt: Defekt belegt, Call-Sites inventarisiert, Runtime-Vertrag definiert, Inputs klassifiziert, keine Rechtstexte, AP-6a/6b getrennt, keine verbotene Grenze verletzt, Continuity auf Post-AP-5, Inventory-Test vorhanden.

**Unabhängiger Technical-Lead Exact-Head-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
