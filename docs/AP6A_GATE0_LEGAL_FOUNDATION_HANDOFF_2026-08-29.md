# Jetnity – AP-6a Gate 0 Legal Foundation Handoff

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Logical Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 16`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/166  
Branch: `audit/ap6a-gate0-legal-foundation-2026-08-29`

Dieser Handoff übergibt Gate 0. Er startet keinen Runtime-Slice. Agent-Self-Review ist kein PASS. Jeder neue Head invalidiert Prior-Gates.

---

## 1. Was dieser Agent getan hat

Docs/Contract/Evidence gegen Baseline `main @ 765fc547`:

1. Production `/privacy` und `/terms` als HTTP 404 auf dem Alias neu gemessen.
2. Alle Legal-/Consent-Call-Sites inventarisiert.
3. Legal-Inputs als `belegt` / `fehlend` / `unknown` / `PO-Legal-approval-required` klassifiziert. Keine Firmen-, Rechts- oder Haftungsfakten erfunden.
4. Runtime-Vertrag für beide Seiten ohne Rechtstext.
5. AP-6a von AP-6b getrennt.
6. Continuity: AP-5-S5 / PR #164 integriert; AP-6a Gate 0 ist der aktuelle Slice.
7. Inventory-Test + ADR-0195.

Keine Runtime-Legal-Seite. Keine Migration. Keine Supabase-Mutation. Kein Ready. Kein Merge.

---

## 2. Naming

| Feld | Wert |
| --- | --- |
| Logischer Name | `Cursor-Agent: Account plattform audit vorbereitung 16` |
| Beobachteter Titel | `Account plattform audit vorbereitung` |
| Evidence | https://cursor.com/agents/bc-216be067-b75a-4a2f-a186-8e38c67fb822 |
| Generation | **16.** Keine Generation 17. |

UI wurde nicht umbenannt.

---

## 3. Git / Live-Evidence

| Fakt | Wert |
| --- | --- |
| `origin/main` | `765fc547c2d2ffd8460e05fec4234906103fe73c` – **0 behind** |
| Merge-Base | `765fc547` |
| Draft-PR | #166 OPEN Draft |
| Branch Protection | unverändert `protected=false` |
| Production 404 | `/privacy` `/terms` HTTP 404; `data-dpl-id=dpl_3PWuyGopCnjcdh44twcUUpCWXzmi` |
| Actions auf Baseline | `33242227312` SUCCESS |
| Supabase | nicht live abgefragt, nicht mutiert |

Jeder neue Push invalidiert Prior-Gates inkl. der Task-only-Checks auf `668c2f17`.

---

## 4. Ist-Zustand in einem Satz

Die Registrierung verlangt Legal-Zustimmung, die Zielseiten sind 404, und fast alle rechtlich erforderlichen Betreiberfakten fehlen. Gate 0 definiert den kleinsten Runtime-Vertrag und die exakte PO-/Legal-Input-Lücke. Es shippt keine Texte.

---

## 5. Was der Technical Lead dem Product Owner vorlegen muss

Nur `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`.

Kurz:

- Wer ist der Verantwortliche, mit ladungsfähiger Adresse?
- Freigegebene `/privacy`- und `/terms`-Texte, Sprache, Datum.
- Darf die Zeile „DSGVO & CH-DSG konform“ stehen bleiben?
- Footer-Links ja/nein (Empfehlung: ja).
- `/impressum` / `/datenschutz` extra oder nicht.
- CookieConsent: Orphan / löschen / erst nach ehrlichem Text.
- Consent weiter nur Checkbox (AP-6a) oder Persistenz (AP-6b, später).

---

## 6. Risiken, die bleiben

- Trust-P1 404 bleibt bis Runtime + Content-Gate.
- Unbelegte Konformitätsbehauptung bleibt sichtbar.
- OAuth-Pfad ohne Checkbox, derzeit disabled.
- CookieConsent-V1-Text.
- Kein Browser-Klick-Beweis.
- `main` ungeschützt.

---

## 7. Nicht tun

- Ready setzen oder mergen.
- AP-6a-Runtime, AP-6b oder AP-7 aus diesem Agenten starten.
- Rechtstexte, Gerichtsstand oder Provider-Listen erfinden.
- CookieConsent still mounten.
- Public Indexing oder Domain Cutover.

---

## 8. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #166.  
Derselbe Agent behebt nur unmittelbare Review-Funde dieses Slices.
