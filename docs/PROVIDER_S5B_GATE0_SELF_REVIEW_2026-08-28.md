# Provider S5-B Gate 0 – Agent Self-Review

Stand: 28. August 2026  
Status: **SELF-REVIEW ONLY / REVIEW-FIX FÜR 5453748651 / KEINE FREIGABE / KEIN PASS**  
Agent: `Cursor-Agent: Jetnity provider readiness audit 2`  
PR: https://github.com/Jetnity/jetnity/pull/141  
Gegen: Technical-Lead-Kommentar `5453748651` auf Head `623983835b32c233fa6349e8be0c6e5c40f5e6de`

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Re-Review. Gates auf `62398383` gelten nicht für den neuen Head.

---

## 1. Scope-Treue

Nur die vier Gate-0-Docs. Keine Runtime, keine Migration, keine Supabase-Mutation, kein Ready/Merge, kein Folgeslice. `ACTIVE_WORK_STATUS.md` und ADR-0168 unverändert. Task-Datei unverändert.

---

## 2. Die drei Precision-Findings

| # | Forderung | Wo korrigiert | Residual |
| --- | --- | --- | --- |
| 1 | `note` ist kein S5-A-Domain | Status §3.3, §5.6, TW-8, P2-01; Options C/D; Handoff | Inventar sagt weiter zutreffend, dass `note` **heute** Legacy-Spalten annehmen kann. Das erweitert die Enum nicht. |
| 2 | Guard-Matrix explizit, besonders Option D | Status §5.6 Tabelle; Options D Idee-Tabelle | Kein Trigger/RPC entworfen. Stay/Activity-Preis ist in der Matrix untrusted, nicht nur Provider/Ref/URL. |
| 3 | Evidence vs `CommercialBewertung` | Status §3.3, §3.6, §6; Options C persist/query | `persistenz` und `availabilityStatus` bleiben Evidence-Eingaben. Status-Flags sind Ableitung. |

Die vier Korrekturen aus `5453667424` (keine globale Unique, Actor≠Kanal, Quote→Snapshot, Residual über Stay/Activity hinaus) bleiben stehen.

---

## 3. Adversarial Prüfung

### 3.1 Habe ich `note` doch zur Domain gemacht?

Nein. Die Enum-Liste ist explizit fünf Domains. `note` wird als nicht-kommerzielles Kind mit zu leerenden Legacy-Feldern beschrieben.

### 3.2 Könnte Option D noch als „nur URL-Felder triggern“ gelesen werden?

Die alte Formulierung ist ersetzt. Stay/Activity schliesst `price_amount`/`price_currency` ein. Transfer/Rental trennt User-Intake-Preis von Provider/Ref/URL.

### 3.3 Habe ich Bewertungsspalten als fehlende SoT-Felder gelistet?

§3.3 trennt Evidence (später persistierbar) von `CommercialBewertung` (nicht autoritativ persistieren). §6 sagt: neu berechnen mit `nowMs`.

### 3.4 Task-Datei

Unangetastet. Authority bleibt der versionierte Auftrag plus die Review-Kommentare.

---

## 4. Nicht geprüft

- Exact-Head CI/Vercel dieses Precision-Commits — müssen neu gaten
- Live-Supabase
- Runtime (unverändert)

---

## 5. Verdict

Die drei Precision-Findings sind in den Gate-0-Docs konsistent korrigiert. Scope bleibt Docs-only. TW-8 bleibt geschlossen.

**Kein PASS. Kein Ready. Kein Merge.**

Unabhängiger Technical-Lead-Re-Review auf dem neuen Exact Head ist erforderlich.
