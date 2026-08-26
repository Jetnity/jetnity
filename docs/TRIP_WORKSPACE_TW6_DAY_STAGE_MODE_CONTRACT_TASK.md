# Jetnity – TW6-B Day→Stage Mode Contract – Product-Owner-approved correction

Stand: 26. August 2026  
Cursor-Agent: **`Trip workspace audit architecture`**  
Branch: `feat/tw6-rest-progressive-stages`  
PR: **#87** (bleibt Draft bis unabhängiger Technical-Lead-Finalreview)  
Typ: **RUNTIME + SHARED CONTRACT + DEVELOPMENT MIGRATION ARTIFACT**

## 1. Verbindlicher Product-Owner-Entscheid

Der Product Owner hat am 26. August 2026 die Technical-Lead-Empfehlung ausdrücklich freigegeben:

1. Der dauerhafte Day→Stage-Vertrag wird fachlich als **Assignment Mode** modelliert, nicht als Herkunfts-/Provenance-Feld.
2. Der bisherige Name `day_stage_assignment_source` wird in einen sauberen Mode-Contract überführt, bevorzugt `day_stage_assignment_mode`.
3. Verbindliche Mode-Semantik:
   - `legacy_fallback` – ausschließlich historischer, bereits persistierter DB-Bestand aus dem alten Vertrag; nur Migration/Backfill darf diesen Zustand erzeugen. Neue Client-/Create-Requests dürfen `legacy_fallback` niemals minten.
   - `unassigned` – mehrere bestätigte Ziele existieren, aber kein Reisetag ist einem Ziel zugeordnet; kein proportionaler Fallback.
   - `single_destination` – genau eine Stage; Tage dürfen deterministisch dieser Stage gehören.
   - `explicit` – konkrete Day→Stage-Positionen wurden als Bestandteil der bestätigten Nutzlast übernommen und werden exakt als solche gespeichert; nicht gesetzte Tage bleiben unassigned; kein proportionaler Fallback.
4. `explicit` bedeutet **nicht** „manuell vom Nutzer editiert“. Es beschreibt nur den Assignment-Mode: konkrete Zuordnungen wurden bestätigt/übernommen. Herkunft/Provenance ist davon getrennt.
5. Ein akzeptierter Reisevorschlag mit konkreten Stage-/Day-Zuordnungen verwendet `explicit`.
6. Ein alter Guest-/localStorage-Trip darf `legacy_fallback` nicht aus dem Browser behaupten. Hat die zu übernehmende Nutzlast konkrete gültige Positionen, wird sie als `explicit` behandelt; ohne konkrete Positionen als `unassigned` (bzw. `single_destination` bei genau einer Stage).
7. Nur bereits persistierte historische DB-Reisen werden backward-compatible als `legacy_fallback` erhalten.
8. Falls Jetnity später zusätzlich unterscheiden muss, ob `explicit` aus manueller Nutzerbearbeitung, akzeptiertem Jetnity-Vorschlag, Import o. ä. stammt, erhält das einen **separaten Provenance-Contract**. Diese Herkunft wird nicht in den Mode hineingemischt.
9. Direction A bleibt ein späterer eigener Slice: Nutzer kann Aufenthalte/Tage explizit festlegen. Dieser Auftrag baut noch nicht die vollständige Aufenthalts-UX.
10. Production Supabase bleibt vollständig unangetastet.

Dieser Entscheid löst die Product-Gates TW6-B-P1-05 und TW6-B-P1-06 nur dann, wenn Runtime, SQL, Guest/Account/Guest→Account, Legacy-Kompatibilität und Tests den Contract tatsächlich korrekt umsetzen und der Technical Lead unabhängig PASS erteilt.

## 2. Kernprinzip

**Mode != Provenance.**

Der Mode beantwortet ausschließlich:

> Wie darf Jetnity Day→Stage-Zuordnungen für diese Reise behandeln?

Er beantwortet nicht:

> Wer oder welches System hat diese Zuordnung ursprünglich erzeugt?

Damit darf `explicit` von einem neuen authentifizierten RPC-Client nicht als „historische“ oder „manuell bestätigte“ Herkunft interpretiert werden. Der Server validiert lediglich die gelieferten konkreten Positionen und speichert genau diese ohne zusätzlichen Fallback.

## 3. Verbindliche Server-Ableitung für neue Create-/Transfer-Requests

Für neue Requests darf der Client den finalen Mode nicht frei als Server-Wahrheit setzen. `public.reise_anlegen()` muss aus der validierten Nutzlast ableiten.

Mindestens folgende Semantik gilt:

### 3.1 Genau eine Stage

- Ergebnis: `single_destination`.
- Alle Reisetage dürfen deterministisch der einzigen Stage zugeordnet werden.

### 3.2 Mehrere Stages, keine gültigen Day-Positionen

- Ergebnis: `unassigned`.
- Alle Tage bleiben ohne Stage-Zuordnung.
- Kein Datums-/proportionaler CTE darf eine Zuordnung erfinden.

### 3.3 Mehrere Stages, mindestens eine konkrete gültige Day-Position

- Ergebnis: `explicit`.
- Nur die konkret gelieferten und serverseitig validierten Positionen werden übernommen.
- Nicht positionierte Tage bleiben unassigned.
- Kein proportionaler Fallback füllt Lücken.

### 3.4 Client behauptet `legacy_fallback`

- Für neue Create-/Transfer-Requests ignorieren bzw. fail-closed behandeln.
- Der Request darf dadurch niemals `legacy_fallback` persistieren.
- Das Verhalten muss gegen direkte `authenticated` RPC-Aufrufe abgesichert sein; die TypeScript-Action ist keine Trust-Grenze.

### 3.5 Unbekannte/alte Mode-/Source-Claims

- Keine historische Provenance minten.
- Fail-closed auf serverseitig abgeleiteten Mode.
- Ungültige Stage-Positionen (außerhalb vorhandener Stage-Indizes, falscher Typ etc.) dürfen nicht zu `explicit`-Hard-Truth werden.

## 4. Historischer DB-Bestand

Bereits persistierte Alt-Reisen dürfen nicht beschädigt werden.

- Existing DB rows aus der Vor-Mode-Ära bleiben/werden `legacy_fallback`.
- Nur für `legacy_fallback` darf der bisherige proportionale Fallback weiterhin laufen.
- Neue Requests dürfen diesen Mode nicht erzeugen.
- Migration/Backfill ist die einzige legitime Erzeugungsquelle von `legacy_fallback`.

Wichtig: Es geht um **bereits persistierten DB-Bestand**, nicht um beliebiges altes Browser-JSON.

## 5. Accepted Reisevorschlag

`lib/reisevorschlag/aktionen.ts` / `vorschlagAlsNutzlast()` muss im neuen Contract korrekt bleiben:

- konkrete validierte `stage_position`-Werte → `explicit`;
- Zuordnungen exakt übernehmen;
- keine Kennzeichnung als `legacy_fallback`;
- keine Behauptung, der Nutzer habe jede Position manuell editiert;
- keine zusätzliche automatische Verteilung für Tage ohne konkrete Position.

Falls der Vorschlag nur Teilzuordnungen enthält, bleiben die übrigen Tage unassigned. Kein Fallback darf die Lücken schließen.

## 6. Guest / Account / Guest→Account

Neue Guest- und Account-Reisen teilen exakt dieselbe fachliche Semantik.

Guest→Account:

- eine Stage → `single_destination`;
- mehrere Stages + keine konkrete gültige Position → `unassigned`;
- mehrere Stages + konkrete gültige Positionen → `explicit`;
- Browser-/localStorage-Claim `legacy_fallback` darf nicht als historische Server-Wahrheit übernommen werden;
- Teilzuordnungen bleiben Teilzuordnungen; Lücken bleiben leer.

Damit ist kein Secret/HMAC/Service-Role nötig, weil Browser-Altbestand nicht mehr als historische Provenance behandelt wird.

## 7. Persistenz-/Migration-Strategie

Die bisherigen Development-Migrationen `20260826220000_*` und `20260826230000_*` wurden bereits auf Development angewendet. Sie dürfen nicht still rückwirkend umgeschrieben werden, wenn dadurch der Development-Migrationsverlauf unehrlich würde.

Bevorzugt:

- neue additive/transformierende Migration **nach** `20260826230000`;
- Spalte/Constraint sauber von Source zu Mode überführen (Rename oder gleichwertige minimal sichere Strategie nach Live-Inspektion);
- `user`-Rows, falls in Development vorhanden, dürfen nicht blind als `explicit` umgedeutet werden; zuerst tatsächliche Daten/Evidence prüfen;
- bestehende historische Rows backward-compatible `legacy_fallback`;
- RPC-Funktion in derselben/folgenden Migration auf die neue Mode-Ableitung aktualisieren;
- generated Supabase types aktualisieren;
- kein neues Schattenmodell / keine zweite Stage-Tabelle.

**Production:** keine Migration anwenden. Kein `--produktion`. Keine Production-RLS-/Ownership-Änderung.

## 8. Read-/Timeline-Vertrag

- `legacy_fallback` → bisheriger proportionaler Fallback darf greifen.
- `unassigned` → niemals proportional zuordnen.
- `single_destination` → deterministisch eine Stage.
- `explicit` → gespeicherte konkrete Zuordnungen verwenden; keine Lücken automatisch füllen.
- Timeline darf bei `explicit` nur wirklich zugeordnete Tage unter Stages anzeigen; unassigned Resttage bleiben ehrlich „noch keinem Ziel zugeordnet“.

## 9. Adversarial Pflichtfälle

Mindestens gegen echte Development-RPC/DB, nicht nur nachgebauten TypeScript-Code:

1. Paris → Rom → Paris, 12.–17. September, keine Positionen → `unassigned`, 3 Stages, 6 unassigned Tage, keine 2/2/2-Erfindung.
2. Mehrere Stages + valide vollständige Positionen → `explicit`, exakt diese Positionen, kein CTE.
3. Mehrere Stages + valide Teilpositionen → `explicit`; gesetzte Tage exakt, Rest unassigned.
4. Direkter authenticated RPC-Client sendet `legacy_fallback` + Positionen → persistierter Mode darf **nicht** `legacy_fallback` sein; serverseitig aus validierten Positionen `explicit` ableiten.
5. Direkter Client sendet `legacy_fallback` ohne Positionen → `unassigned` (bei >1 Stage).
6. Direkter Client sendet alten `user`-Claim + Positionen → nicht als Provenance vertrauen; aus validierten Positionen `explicit` ableiten.
7. Direkter Client sendet unbekannten Claim + keine Positionen → fail-closed `unassigned` oder harter Validierungsfehler; niemals `legacy_fallback`.
8. Ungültige/out-of-range `stage_position` → nicht als `explicit` Hard Truth akzeptieren; fail-closed gemäß bestehendem Validierungsvertrag.
9. Single-Destination → `single_destination`, regressionsfrei.
10. Bereits persistierte historische DB-Fixture → `legacy_fallback`, bisheriges Verhalten erhalten.
11. Alter Guest/localStorage-Trip mit Positionen → Guest→Account `explicit`, nicht `legacy_fallback`.
12. Alter Guest/localStorage-Trip ohne Positionen → Guest→Account `unassigned`.
13. Accepted Reisevorschlag mit Positionen → `explicit`, keine falsche Legacy-Provenance.
14. Accepted Reisevorschlag mit Teilpositionen → `explicit`, Lücken bleiben unassigned.
15. Reload Guest/Account/Guest→Account verändert Mode oder Zuordnungen nicht.
16. ClientRef/Guest-One-Trip/Places-Evidence/RLS/Ownership bleiben regressionsfrei.

Danach vollständige Repository-Gates einschließlich Typecheck, Lint, Tests, Production Build, Hygiene/API/Schema/Auth sowie DB-Rechte/RLS/Sicherheit gemäß aktuellem Workflow.

## 10. Dokumentation / ADR

Aktualisieren:

- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_STATUS.md`
- `DECISIONS.md` / ADR-0172 (oder sauberer Nachtrag, ohne historische Evidenz zu löschen)
- `ARCHITECTURE.md`, falls dort der alte Source-Vertrag steht
- PR #87 Body
- generated/type contracts soweit nötig

Dokumentation muss ausdrücklich festhalten:

- Mode != Provenance;
- `legacy_fallback` nur für historischen DB-Bestand;
- neue Client-Requests können `legacy_fallback` nicht minten;
- accepted Reisevorschlag = `explicit` bei konkreten Positionen;
- alte Guest-Daten mit Positionen = `explicit`, nicht historische DB-Provenance;
- Production nicht migriert.

## 11. Non-Scope

Nicht bauen/ändern:

- vollständige Direction-A-Aufenthalts-UX;
- Drag-and-drop/Reorder;
- separate Assignment-Provenance;
- neue fünfte Mode-Semantik;
- Auth/MFA/AAL/Session;
- Production-RLS/Ownership;
- Traveller/Citizenship/Documents;
- Route/Transit Shared Contract;
- Provider/Commercial/Payments;
- D0/D1/G0/G1;
- DNS/Domain/Public Indexing;
- TW-7/TW-8/TW-9;
- Production Supabase;
- Secrets/HMAC/Service-Role-Workarounds.

## 12. Review-/Merge-Governance

Der Agent:

- hält PR #87 Draft;
- setzt nicht Ready;
- mergt nicht;
- startet keinen Folgeslice;
- stuft P1-05/P1-06 erst dann als technisch geschlossen ein, wenn echte Runtime-/DB-Evidence sie schließt;
- führt adversarial Self-Review durch.

Nach Implementierung, neuer Exact-Head-GitHub-Actions-CI und Exact-Head-Vercel:

**STOPP.**

ChatGPT / Technical Lead übernimmt den vollständigen unabhängigen Finalreview.