# Trip Workspace TW-4 – Implementierungsauftrag

Stand: 25. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw4-attention`  
ADR: `docs/ADR_0165_TRIP_WORKSPACE_TW4_ATTENTION.md`  
Status: **Runtime umgesetzt in Draft-PR #60; STOPP für unabhängigen Technical-Lead-Re-Review**

## Ziel

Baue den begrenzten Attention-Layer **„Jetzt wichtig“** als ehrliche Priorisierung bereits vorhandener Reise-/Coverage-/Readiness-/Safety-/Seasonal-Signale. Der Nutzer soll auf Mobile und Desktop schnell erkennen, was tatsächlich Aufmerksamkeit braucht, was noch nicht geprüft wurde, was noch nicht prüfbar ist und was technisch nicht verfügbar ist.

TW-4 ist **keine neue Truth-Domäne**. Es ist eine deterministische Presentation-/Aggregationsebene über vorhandene maschinenlesbare Fachableitungen.

Zusätzlich muss TW-4 die heutige Safety-/Seasonal-Produktpfad-Stille dort schließen, wo Jetnity bereits eine **provider-neutrale, side-effect-freie, vorhandene Evaluation/Orchestrierung** mit dem vorhandenen kanonischen Kontext sicher ausführen kann. Es darf aber keine fehlende Datenquelle, keinen Provider und keine Hard Truth erfinden.

## Vor Beginn verpflichtend lesen

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_BINDING_BUILD_ORDER.md`
3. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
4. `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
5. `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md` – besonders §5
6. `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
7. `docs/ADR_0163_TRIP_WORKSPACE_TARGET_IA.md`
8. `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`
9. `docs/ADR_0165_TRIP_WORKSPACE_TW4_ATTENTION.md`
10. `docs/TRIP_WORKSPACE_TW2_STATUS.md`
11. relevante Readiness-/Safety-/Seasonal-/Traveller-/Citizenship-Policies, Foundations und Tests

Danach den tatsächlichen aktuellen Code auf diesem Branch selbst verifizieren. Dokumentation nicht blind vertrauen.

## Pflichtarbeit

### 1. Ist-Code auditieren

Vor jeder Änderung konkret feststellen:

- wo TW-2 Reiseübersicht und bestehende Coverage-Presentation liegen;
- welche Graph-Gaps heute maschinenlesbar vorhanden sind;
- welche Readiness-Zustände wirklich existieren;
- wie Safety/Seasonal derzeit in den Workspace gelangen oder eben nicht gelangen;
- welche **bestehenden provider-neutralen Safety-/Seasonal-Evaluator-/Orchestrierungsfunktionen** vorhanden sind, welche Inputs sie verlangen, ob sie side-effect-frei sind und ob sie ohne neue Provider/Secrets/Kosten/Shared Writes im Workspace wiederverwendet werden können;
- welche `unknown`/`stale`/`error`/`unavailable`-/Freshness-Verträge bereits bestehen;
- welche Traveller-/Citizenship-/Official-Abhängigkeiten nur gelesen, aber nicht verändert werden dürfen.

Die Auditentscheidung zur Safety-/Seasonal-Orchestrierung muss im TW-4-Status dokumentiert werden: **angebunden**, **nicht sicher anbindbar** oder **nicht prüfbar wegen fehlendem Kontext**, jeweils mit technischem Grund. Kein stilles Weglassen.

### 2. Attention-Contract implementieren

Eine kleine, testbare Ableitung schaffen bzw. vorhandene Ableitungen sauber komponieren. Jeder Attention-Punkt muss mindestens nachvollziehbar enthalten:

- stabile ID für die Ansicht;
- Ebene (`reise | etappe | tag | item | person`), soweit fachlich vorhanden;
- maschinenlesbares Ursprungssignal / Provenance zur vorhandenen Ableitung;
- Schwere (`blockierend | bald | hinweis`) nur wenn aus dokumentierter Regel ableitbar;
- Lage (`known_gap | unknown | stale | unavailable | warning` oder bestehende kanonische Entsprechung);
- optional genau einen vorhandenen nächsten Schritt;
- **keine eigenen neuen Hard-Fact-Felder**.

Keine Logik darf lokalisierten UI-Text parsen, um Status oder Priorität zu bestimmen.

### 3. Vier Attention-Leerstände vollständig abbilden

Zwingend getrennt und testbar:

- `nichts_dringend_geprueft`
- `noch_nicht_geprueft`
- `noch_nicht_pruefbar`
- `pruefung_nicht_verfuegbar`

Fehlende Safety-/Seasonal-Evaluation/Prop bei grundsätzlich prüfbarem Kontext = `noch_nicht_geprueft` **sofern keine sichere bestehende Evaluation im Produktpfad ausgeführt werden kann**.

Fehlender notwendiger Traveller-/Graph-Kontext = `noch_nicht_pruefbar`.

Nur belegte Source-/Provider-/Engine-Unavailability = `pruefung_nicht_verfuegbar`.

`nichts_dringend_geprueft` nur wenn die für diese Aussage relevanten Prüfungen tatsächlich erfolgreich gelaufen sind und nichts Vorrangiges liefern. Eine fehlende Prop/ein leeres Array/ein `undefined` reicht nicht.

### 4. Safety-/Seasonal-Produktpfad ehrlich schließen, wo möglich

Nach Ist-Audit gilt folgende Entscheidungskaskade:

1. **Bestehende sichere Evaluation vorhanden + alle kanonischen Inputs vorhanden:** vorhandenen provider-neutralen, side-effect-freien Evaluator/Orchestrator wiederverwenden und Ergebnis mit seiner bestehenden Evidence/Freshness/Lage in Attention einspeisen.
2. **Evaluator vorhanden, aber notwendiger kanonischer Kontext fehlt:** nicht simulieren; `noch_nicht_pruefbar` bzw. bestehendes `insufficient_context`.
3. **Kontext wäre vorhanden, aber Evaluation wird im aktuellen Produktpfad noch nicht ausgeführt und eine Anbindung innerhalb der TW-4-Grenzen ist nicht sicher möglich:** `noch_nicht_geprueft`, technische Lücke im Status dokumentieren.
4. **Engine/Quelle ist belegt unavailable:** `pruefung_nicht_verfuegbar` / vorhandene Unavailability beibehalten.
5. **Evaluation schlägt fehl:** `error` bleibt `error`; niemals zu clean oder unavailable umdeuten.

Verboten:

- neue externe Datenquelle/Provider anzuschließen;
- Hard Truth aus LLM, UI-Text oder Heuristik zu erzeugen;
- Route/Traveller-/Official-Contracts umzubauen;
- Safety-/Seasonal-Resultate ohne deren Evidence/Freshness zu „verbessern“.

### 5. Reale Signale priorisieren

Mindestens prüfen/integrieren, soweit im aktuellen Code belastbar vorhanden:

- offene/unbestimmte Flight-Coverage;
- fehlende Unterkunftsnächte / Coverage-Gaps;
- Readiness stale / offene vorhandene Checks;
- Safety `critical_warning` / `important_notice` nur bei realer Evaluation und Betroffenheit;
- Seasonal `timing_check` nur bei realer Evaluation und erheblicher Wirkung;
- Official/Traveller insufficient context nur wenn diese Prüfung im aktuellen Pfad tatsächlich relevant ist.

Nicht jede leere Domain ist automatisch ein Problem. „0 Aktivitäten“ darf nicht blind als Pflicht-Gap erscheinen.

### 6. Priorisierung

Die Priorisierung muss maschinenlesbar, deterministisch und testbar sein.

- belegte blockierende/zeitkritische Signale vor allgemeinen Hinweisen;
- keine Severity aus lokalisiertem Text;
- bei gleicher fachlicher Priorität stabile Tie-Break-Regel;
- keine künstliche Dringlichkeit;
- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context` und „noch nicht geprüft“ dürfen nicht in ein gemeinsames generisches Warnsignal kollabieren;
- maximal sichtbare Punkte als Presentation-Limit, nicht als Informationsverlust; Rest progressiv erreichbar.

### 7. UI

- „Jetzt wichtig“ direkt unter/nahe der Reiseübersicht gemäß Ziel-IA;
- Mobile und Desktop dieselbe Produktlogik;
- begrenzte Anzahl sofort sichtbarer Punkte, Rest progressiv;
- klare, ruhige Sprache; keine Dashboard-Wand;
- `unknown`/`noch nicht geprüft` sichtbar ehrlich, aber nicht alarmistisch;
- keine künstliche Dringlichkeit;
- Accessibility, Keyboard/Focus und kleine Viewports berücksichtigen.

### 8. Multi-Citizenship

Keine Default-Citizenship. Kein `[0]`-Shortcut. Keine Auswahl eines „besten Passes“ ohne vorhandene Evidence/Official-Logik.

Für mehrere Citizenships/Documents muss TW-4 entweder die bestehende kontextabhängige Official-Ableitung korrekt lesen oder fehlenden notwendigen Kontext ehrlich als nicht prüfbar darstellen. Keine neue Traveller-/Document-Truth in TW-4.

Safety-/Seasonal-Auswertung darf vorhandenen traveller-neutralen Route-/Ortskontext verwenden, aber keine Citizenship-/Document-Entscheidung übernehmen, die der Official-/Traveller-Logik gehört.

## Harte Nicht-Scope-Grenzen

- keine DB/Migration/RLS/Auth/MFA/AAL;
- keine neue Persistenz oder Attention-Tabelle;
- kein `trips.status`;
- kein zweiter Lifecycle;
- kein LLM-Score / keine generative Hard Truth;
- kein TW-3, TW-5, TW-6, TW-7, TW-8, TW-9;
- kein Guardian-/Simulator-Runtime-Scope;
- keine neue Traveller Registry / Citizenship-/Document-Neumodellierung;
- keine Route-Contract-Änderung;
- keine neuen Safety-/Seasonal-/Official-Provider oder externe Datenquellen;
- keine Provideraktivierung, Secrets, Verträge, paid calls;
- keine Production-Migration;
- keine Ads-/CRM-/Marketing-Runtime;
- keine öffentliche/produktive Aktivierung.

Wenn die saubere Lösung eine dieser Grenzen erfordern würde: **STOPP und Technical Lead informieren.**

## Tests – Mindestumfang

Gezielte Tests müssen mindestens beweisen:

1. jeder der vier Attention-Leerstände ist separat erreichbar;
2. fehlende Safety-/Seasonal-Evaluation ≠ clean und ≠ unavailable;
3. eine vorhandene sichere Safety-/Seasonal-Evaluation wird im Produktpfad tatsächlich verwendet, **falls** der Ist-Audit sie innerhalb des Scopes als anbindbar bestätigt;
4. erfolgreiche relevante Evaluation ohne priorisierbares Signal darf erst dann `nichts_dringend_geprueft` ermöglichen;
5. echte belegte Unavailability wird nicht als „noch nicht geprüft“ verschluckt;
6. `stale`, `unknown` und `error` bleiben unterscheidbar;
7. teilweise Flight-/Hotel-Coverage erzeugt keine falsche Vollständigkeit;
8. Multi-Citizenship erzeugt keinen einzelnen Default-Pass-/Citizenship-Punkt;
9. Guest und Account zeigen bei identischem Reisegraphen dieselbe fachliche Attention-Aussage;
10. Reihenfolge/Priorisierung ist deterministisch;
11. maximal sichtbare Punkte + progressive Restanzeige funktionieren;
12. keine Statusableitung aus lokalisiertem Text;
13. Safety-/Seasonal-Fehler/fehlender Kontext/Unavailability/ungeprüft bleiben getrennte Pfade;
14. keine neuen Writes/Side Effects werden durch Attention oder Evaluation ausgelöst.

Zusätzlich vollständige relevante Repo-Gates und `npm run audit:trip-workspace`.

## Self-Review vor Übergabe

Vor STOPP adversarial prüfen:

- Kann fehlende Evaluation versehentlich als grün erscheinen?
- Bleibt eine vorhandene sichere Evaluation unnötig dauerhaft „ungeprüft“, obwohl sie innerhalb TW-4 anbindbar wäre?
- Kann ein Provider-/Enginefehler wie „noch nicht geprüft“ aussehen?
- Kann ein `unknown` durch Fallback zu `false`/0 werden?
- Wird eine einzelne Citizenship implizit bevorzugt?
- Ist ein Punkt nur deshalb „dringend“, weil UI-Text so klingt?
- Wurde TW-3/TW-5-Scope eingeschleppt?
- Gibt es irgendeinen neuen Write/Side Effect?
- Sind Mobile/Desktop fachlich identisch?
- Ist `nichts_dringend_geprueft` wirklich durch ausgeführte relevante Checks belegt?

## Übergabe

Nach Implementierung:

- `docs/TRIP_WORKSPACE_TW4_STATUS.md` auf den tatsächlichen Exact Head aktualisieren;
- Safety-/Seasonal-Orchestrierungsentscheidung mit Codepfad und Begründung dokumentieren;
- vollständige Self-Review- und Gate-Evidence dokumentieren;
- GitHub Actions + Vercel auf exakt demselben finalen Head verifizieren;
- keine TW-3-/TW-5-Arbeit starten;
- danach **STOPP für unabhängigen ChatGPT/Technical-Lead-Review**.

Nach PASS übernimmt der Technical Lead gemäß Autonomie-Policy Ready/Merge und den nächsten Build-Order-Schritt.