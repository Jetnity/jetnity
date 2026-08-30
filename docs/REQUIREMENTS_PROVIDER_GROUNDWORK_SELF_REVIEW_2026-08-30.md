# Requirements Provider Groundwork Gate 0 – Self-Review

Stand: 30. August 2026  
Cursor-Agent: **`Jetnity requirements provider groundwork 1`**  
Session: `bc-77badb21-f262-4ee2-86ce-f71a5aa1f051`  
Status: **SELF-REVIEW ≠ TECHNICAL-LEAD PASS / REVIEW-FIX OF #5471442167**

Vorheriger Head `9caa1a0f` war mechanisch grün und Content-Gate **NOT PASS**. Dieser Self-Review gilt dem Review-Fix, nicht dem ersten Handoff.

---

## 1. Was ich prüfen konnte

- Aktuellen Readiness-Port, Engine, Official-Trust, API, Schema, Party/Kontext, Vergleich
- `officialFrische()` Zeilen 237–258: **kein** `checkedAt`-Max-Age; Trust-Skew 5 min ist Zukunft, nicht Alter
- Workspace-Caller: keine `officialEvaluations` aus Konto-/Gast-Arbeitsbereich
- `provider-ops` und `lib/server/providers/core` Abgrenzung
- Historical S4 gegen aktuellen Code
- Öffentliche Vendor-Seiten am 30. August 2026, inkl. CR-URLs erneut
- `origin/main` = Task-Baseline `60e12dd5`, 0 behind vor diesem Review-Fix

## 2. Gegenargumente gegen meine eigenen Schlüsse

### 2.1 „S4-R1 zuerst“ könnte zu früh sein

Gegenargument: Der Post-Cleanup-Checkpoint will zurück zum Produktkern. Ein Timeout ohne Adapter ändert keine Nutzer-Official-Aussage. Ein docs-only Vendor-Memo könnte der PO-Entscheidung näher sein.

Antwort: Ein späterer Adapter ohne Abort/Kill-Switch **und** ohne TTL ist das teurere Loch. S4-R1 ist klein, vendor-frei und in der historischen Reihenfolge bereits vorgesehen. Der Vendor-Memo ersetzt Timeout und TTL nicht. Beides darf der TL anders priorisieren.

### 2.2 Sherpa wirkt „zu bereit“

Gegenargument: Öffentliche Trips-API + Sandbox + Government-`sources[]` + jetzt Quota-Zahlen könnte als Quasi-Wahl gelesen werden.

Antwort: ISO-3-Nationalität ≠ Credential-Option; Transit-Definition weicht ab; eVisa-`PRODUCT` ist Commercial; Origin-Nationality-Fallback ist **verboten**; kontrahierte Quota/Kosten/DPA `unknown`; Journey-Copy nennt AI. Ich habe Sherpa **nicht** gewählt. Quota-Zahlen sind als `public_api_docs` geführt, nicht als Vertrag.

### 2.3 Timatic bleibt „zu bevorzugt“ / Widget überzeichnet AutoCheck

Gegenargument: E-IATA-3 (Widget, dieselbe DB, Residence-Query) könnte gelesen werden, als wäre ein Planungs-REST-Port belegt.

Antwort: Widget ist eine **Oberfläche**. Dieselbe Datenbank ≠ belegter `evaluate()`-Vertrag, ≠ Multi-Citizenship, ≠ Minimal-PII. AutoCheck bleibt öffentlich unbelegt. Keine Auswahl.

### 2.4 8 KB als P2 statt P1

Gegenargument: 20×12 Documents kann den Cap sprengen; das wäre ein heutiger API-Defekt.

Antwort: Ohne gemessene Real-Payloads nicht hochstufen. Der Parser fail-closed mit 413. Das ist unbequem, keine Fake-Truth. Deshalb P2.

### 2.5 Account-Registry-Drift

Gegenargument: AP-7 Persistenz und Materialisierung liegen im Tree; der Aug-29-Traveller-Audit sagte „missing“. Ich könnte den Evaluate-Input falsch beschrieben haben.

Antwort: Evaluate liest die Registry nicht. Snapshot-Kopie ist opt-in. Das habe ich gegen `reisende-aktionen.ts` / `KontoArbeitsbereich.tsx` geprüft. Der Aug-29-Audit ist für Persistenz **historisch**.

### 2.6 Safety-Party in einem Requirements-Audit

Gegenargument: S4 nannte Safety-Party. Scope-Creep.

Antwort: Klassifiziert, nicht vorgeschlagen als Teil von S4-R1. Bleibt fremder Slice.

### 2.7 CR-1: Ist „kein TTL“ wirklich material, solange Factory `null` ist?

Gegenargument: Ohne Provider gibt es kein `checkedAt`. Das Loch ist hypothetisch. P1 vor Adapter könnte überzogen sein.

Antwort: Sobald die erste trusted Zeile mit `validUntil == null` und stabilem Fingerprint existiert, bleibt sie `current`. Das ist genau der Activation-Pfad. Deshalb **P1 / PROVIDER-ACTIVATION-GATE**, nicht P0 (heute keine Hard Truth) und nicht nur ein generisches „stale“-Risiko. Die 5-min-Skew-Prüfung täuscht eine Frischeprüfung vor, die sie nicht ist.

### 2.8 CR-1: Gehört TTL in S4-R1 oder erst in den Adapter?

Gegenargument: Ohne Vendor-Vertrag ist jede Zahl erfunden. TTL im Jetnity-seitigen Slice könnte eine Fake-Policy sein.

Antwort: S4-R1 muss die **Policy-Naht und das Fail-Closed** etablieren, nicht eine vertragliche Stunden-Zahl erfinden. Konservativer Default + „unbegründete Frische → non-current“ ist erlaubt; Vendor-`lastUpdatedAt` als `checkedAt` ist es nicht. Die numerische TTL bleibt bis Vertrag `unknown`.

### 2.9 CR-2: Ist ein Tutorial-Satz ein Activation-Gate wert?

Gegenargument: „We recommend assuming the nationality of the origin“ ist Integrationsrat, kein API-Zwang. Ein Adapter könnte `passports` einfach weglassen.

Antwort: Der Satz ist die öffentlich dokumentierte Sherpa-Empfehlung für fehlenden Pass. Genau das widerspricht Jetnitys Invariante. Wenn der Adapter dem Tutorial folgt, entsteht Fake-Nationalität und damit Fake-Visa-Truth. Deshalb explizites **verbotenes** Fallback und `G-MAP-ORIGIN-NAT`, nicht nur eine Fussnote.

### 2.10 CR-3: Mache ich öffentliche Quota zur Vertragswahrheit?

Gegenargument: 1000/h, 100 rps, `max-age=3600` stehen in Docs; ein Leser könnte sie als Jetnity-Limit planen.

Antwort: Die Matrix trennt **öffentliche technische Guidance** (`partial` / bekannt) von **kontrahierter Production-Quota/Kosten/Lizenz** (`unknown` / PO-GATE). Die Schichten sind bewusst nicht zu einer Zahl kollabiert. FAQ 100 rps und Overview 1000/h Testing können gleichzeitig, nacheinander oder planabhängig gelten — das bleibt unsicher.

### 2.11 CR-4: Verzerrt das Widget jetzt gegen Sherpa?

Gegenargument: Eine Planungs-Oberfläche + „dieselbe DB“ könnte Timatic als den offensichtlich richtigen Planungs-Kandidaten festschreiben.

Antwort: Widget beweist eine UI und eine gemeinsame DB, nicht Jetnitys Port. Sherpa bleibt der klarste **öffentliche REST-Shape**-Kandidat. Beide bleiben ungewählt.

### 2.12 CR-5: Ist 3 vs 12 ein überzeichnetes Gap?

Gegenargument: Die meisten Reisen haben 0–2 Stops. Drei Transit-Nodes könnten praktisch reichen. Ein Adapter könnte die ersten drei senden.

Antwort: Jetnitys öffentlicher Vertrag akzeptiert 12 Länder, und die Engine materialisiert **jedes** angefragte Transitland. Die vierten und weiteren Länder still wegzulassen wäre unvollständige Transit-Hard-Truth, nicht eine Optimierung. Deshalb `G-MAP-TRANSIT-CAP` als Pflicht: fail-closed Split/Aggregation **oder** `unknown` / `insufficient_context` für nicht unterstützte Shapes. Jetnitys Route-Cap bleibt 12. Nicht implementiert.

## 3. Unsicherheiten (`unknown` / `insufficient evidence`)

| Thema | Warum unsicher |
| --- | --- |
| Ob IATA einen dokumentnummernfreien maschinenlesbaren Planungs-Evaluate verkauft | Widget + AutoCheck-Marketing; kein OpenAPI |
| Ob Sherpa hinter Auth option-scharfe Document-Felder hat | nicht im öffentlichen Sample; kein Call |
| Ob ein Sherpa-Vertrag >3 Transit-Nodes erlaubt | öffentlich nur „up to 3 transit nodes“ (E-SHERPA-7) |
| Wie Testing-1000/h, FAQ-100-rps und Production-by-plan zusammenhängen | öffentliche Schichten, kein Vertrag |
| Aktuelle TimaticWeb-/API-Preise | nur Third-Party-Blog |
| EU/CH-DPA aller Kandidaten | nicht öffentlich als Vertrag |
| Numerische Jetnity-`checkedAt`-TTL | bewusst offen bis Vertrag; Policy-Naht nicht |
| Production-Katalog AP-7/S5-B | Repository-Acceptance, dieser Run hat Supabase nicht gelesen |
| Branch Protection live | in dieser Umgebung nicht frisch verifiziert |
| Ob 8 KB reale Multi-Traveller-Bodies trifft | nicht gemessen |
| Vercel/CI auf Review-Fix-Head | erst nach Push; alte Gates auf `9caa1a0f` |

## 4. Scope-Treue

Eingehalten:

- nur die sechs erlaubten Deliverables geändert
- Task und `docs/ACTIVE_WORK_STATUS.md` nicht angefasst
- keine Runtime
- kein Ready/Merge/Folgeslice
- kein Default-Pass / `documents[0]` / Origin-Nationality
- keine Legal-Copy
- keine Vendor-Kommunikation
- keine Implementierung der TTL-Policy
- keine Verkleinerung von `transitCountryCodes.max(12)` / Route Truth
- keine Transit-Split-Implementierung

`next-env.d.ts` war im ersten Lauf unstaged dirty und restored. In diesem Review-Fix clean.

## 5. Traveller-Context

Geprüft und relevant. CR-2 verschärft: fehlende Nationalität bleibt `unknown` / `insufficient_context`; Origin/Residence dürfen sie nicht füllen. Empfehlungen erweitern das 1:n-Modell nicht nach unten.

## 6. Was ein Reviewer zuerst angreifen sollte

1. Ist `G-S4-TTL` korrekt gegen `officialFrische()` (kein Hidden-TTL an anderer Stelle)?
2. Ist die `checkedAt` vs `lastUpdatedAt`-Trennung in S4-R1 klein genug, oder habe ich Adapter-Semantik in den Jetnity-Ops-Slice gezogen?
3. Ist E-SHERPA-4 fair als Activation-Gate (Tutorial vs API-Zwang)?
4. Sind Quota-Zahlen klar als Non-Contract markiert?
5. Überzeichnet E-IATA-3 Timatic als Planungs-REST?
6. Ist G-MAP-TRANSIT-CAP korrekt gegen Schema `.max(12)` und Tutorial „up to 3 transit nodes“, ohne Route Truth zu kürzen?
7. Habe ich Sherpa oder Timatic trotz Disclaimern als implizite Wahl lesbar gemacht?

## 7. Verdict des Agenten

Der Review-Fix adressiert CR-1–CR-5 dokumentarisch. Er ist **nicht** PASS, nicht Ready, nicht Merge, nicht Provider-Auswahl, nicht S4-R1-Start.
