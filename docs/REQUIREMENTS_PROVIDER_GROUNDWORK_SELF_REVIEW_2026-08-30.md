# Requirements Provider Groundwork Gate 0 – Self-Review

Stand: 30. August 2026  
Cursor-Agent: **`Jetnity requirements provider groundwork 1`**  
Status: **SELF-REVIEW ≠ TECHNICAL-LEAD PASS**

---

## 1. Was ich prüfen konnte

- Aktuellen Readiness-Port, Engine, Official-Trust, API, Schema, Party/Kontext, Vergleich
- Workspace-Caller: keine `officialEvaluations` aus Konto-/Gast-Arbeitsbereich
- `provider-ops` und `lib/server/providers/core` Abgrenzung
- Historical S4 gegen aktuellen Code, nicht gegen die Slices-Datei als Wahrheit
- Öffentliche Vendor-Seiten am 30. August 2026
- `origin/main` = Task-Baseline, 0 behind

## 2. Gegenargumente gegen meine eigenen Schlüsse

### 2.1 „S4-R1 zuerst“ könnte zu früh sein

Gegenargument: Der Post-Cleanup-Checkpoint will zurück zum Produktkern. Ein Timeout ohne Adapter ändert keine Nutzer-Official-Aussage. Ein docs-only Vendor-Memo könnte der PO-Entscheidung näher sein.

Antwort: Ein späterer Adapter ohne Abort/Kill-Switch ist das teurere Loch. S4-R1 ist klein, vendor-frei und in der historischen Reihenfolge bereits vorgesehen. Der Vendor-Memo ersetzt das Timeout nicht. Beides darf der TL anders priorisieren.

### 2.2 Sherpa wirkt „zu bereit“

Gegenargument: Öffentliche Trips-API + Sandbox + Government-`sources[]` könnte als Quasi-Wahl gelesen werden.

Antwort: ISO-3-Nationalität ≠ Credential-Option; Transit-Definition weicht ab; eVisa-`PRODUCT` ist Commercial; Vertrag/Kosten/DPA `unknown`; Journey-Copy nennt AI. Ich habe Sherpa **nicht** gewählt.

### 2.3 Timatic bleibt „zu bevorzugt“

Gegenargument: Historical Docs nennen Timatic als bevorzugten Kandidaten. Das könnte ich als Entscheidung übernommen haben.

Antwort: Ich behandle Timatic als Regulatory-Familie mit unbelegtem Planungs-Port. AutoCheck/DCS/Scan ist ein anderes Produkt. Keine Auswahl.

### 2.4 8 KB als P2 statt P1

Gegenargument: 20×12 Documents kann den Cap sprengen; das wäre ein heutiger API-Defekt.

Antwort: Ohne gemessene Real-Payloads nicht hochstufen. Der Parser fail-closed mit 413. Das ist unbequem, keine Fake-Truth. Deshalb P2.

### 2.5 Account-Registry-Drift

Gegenargument: AP-7 Persistenz und Materialisierung liegen im Tree; der Aug-29-Traveller-Audit sagte „missing“. Ich könnte den Evaluate-Input falsch beschrieben haben.

Antwort: Evaluate liest die Registry nicht. Snapshot-Kopie ist opt-in. Das habe ich gegen `reisende-aktionen.ts` / `KontoArbeitsbereich.tsx` geprüft. Der Aug-29-Audit ist für Persistenz **historisch**.

### 2.6 Safety-Party in einem Requirements-Audit

Gegenargument: S4 nannte Safety-Party. Scope-Creep.

Antwort: Klassifiziert, nicht vorgeschlagen als Teil von S4-R1. Bleibt fremder Slice.

## 3. Unsicherheiten (`unknown` / `insufficient evidence`)

| Thema | Warum unsicher |
| --- | --- |
| Ob IATA einen dokumentnummernfreien Planungs-Evaluate verkauft | nur Marketing/DCS-Docs |
| Ob Sherpa hinter Auth option-scharfe Document-Felder hat | nicht im öffentlichen Sample; kein Call |
| Aktuelle TimaticWeb-/API-Preise | nur Third-Party-Blog |
| EU/CH-DPA aller Kandidaten | nicht öffentlich als Vertrag |
| Production-Katalog AP-7/S5-B | Repository-Acceptance, dieser Run hat Supabase nicht gelesen |
| Branch Protection live | in dieser Umgebung nicht frisch verifiziert |
| Ob 8 KB reale Multi-Traveller-Bodies trifft | nicht gemessen |
| Vercel/CI auf Deliverable-Head | erst nach Push |

## 4. Scope-Treue

Eingehalten:

- nur die sechs erlaubten neuen Dateien plus unveränderter Task
- keine Runtime
- keine globale Current-State-Datei
- kein Ready/Merge/Folgeslice
- kein Default-Pass / `documents[0]`
- keine Legal-Copy
- keine Vendor-Kommunikation

`next-env.d.ts` war unstaged dirty (Next-Dev-Types) und wurde **restored**, nicht committed.

Während des Authorings hat der Technical Lead `docs/ACTIVE_WORK_STATUS.md` auf denselben Branch gepusht (`8d3330c1`). Der Agent hat **rebase** statt force-push gemacht und die Datei nicht editiert. Der Diff gegen `main` enthält diese TL-Datei zusätzlich zu Task + sechs Deliverables. Das ist Continuity-Kollisionsschutz, kein Scope-Bruch durch den Agenten.

## 5. Traveller-Context

Geprüft und relevant. Empfehlungen erweitern das 1:n-Modell nicht nach unten.

## 6. Was ein Reviewer zuerst angreifen sollte

1. Habe ich S4-R1 zu selbstverständlich als „nächsten Slice“ verkauft?
2. Habe ich Sherpa oder Timatic trotz Disclaimern als implizite Wahl lesbar gemacht?
3. Ist die Behauptung „Workspace übergibt keine Evaluations“ vollständig (nur Konto/Gast geprüft; Audit-Clients dürfen Testdaten übergeben)?
4. Ist die AP-7-Aussage (Registry existiert, Evaluate liest sie nicht) exakt gegen `main@60e12dd5`?
5. Evidence-Klassen: habe ich Marketing als Docs verkleidet?

## 7. Verdict des Agenten

Der Slice ist **review-bereit als Audit**. Er ist **nicht** PASS, nicht Ready, nicht Merge, nicht Provider-Groundwork-Abschluss im Sinne einer Auswahl.
