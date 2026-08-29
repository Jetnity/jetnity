# Jetnity – Visitor Search Country Alias Production Recovery – Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Visitor search correctness 1`**  
Cursor-Session/Run-ID: `bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Immediate Post-Merge-P1-Recovery desselben Issue-#109-Slices. Live Production gewinnt.

Geprüft: echte Runtime/Test-Lücke statt Datenbeschuldigung; generischer Fix; keine hartcodierten Peru/China/Schweiz-Fälle; Route-level/Production-Zeilenform; `ziel` vs `abreise`; Place-ID-Truth; fail-closed Free Text; IATA; kompakte Relevanz; kein Geocoder; keine Migration/RLS/Auth; kein Issue #110.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Waren die Production-Alias-Tokens wirklich vorhanden? | Ja. Der Fehler war Score-Ordinalität, nicht fehlende Daten. |
| Warum wirkte Schweiz? | Keine Stadt heisst exakt `Schweiz`; Prefix verliert gegen Alias-5000. |
| Warum wirkten die alten Tests? | Städte ohne Import-Keywords; kein `ortAusZeile`-/Route-Lauf. |
| Gibt es eine Länder-Ausnahmetabelle? | Nein. Runtime enthält die Beispielnamen nicht. Nur `typ === 'country'` + exaktes Keyword/Name. |
| Ist die Zeile ohne Typ-Rätsel lesbar? | Ja. Kontextzeile plus Pille; Screenreader bekommt `aria-label`. |
| Wird der Langname bei Alias-Suche erzwungen? | Nein. Das getroffene Keyword wird Anzeige, Place-ID bleibt. |
| Wird ein Keyword-Präfix wie ein Alias behandelt? | Nein. `Swiss` / `Swiss Confederation` bleibt ungeboostet. |
| Werden Gleichnamen gelöscht? | Nein. Peru-/China-Städte bleiben unter dem Land. |
| Läuft Länder-Vorrang in `abreise`? | Nein. Nachzug und Alias-Sort nur für `ziel`. |
| Wird Free Text kanonisch? | Nein. `Test` bleibt leer. |
| Wird IATA/ZRH geschwächt? | Nein. Ein Double-Count-Skip wurde verworfen, weil er ZRH über Zürich geschoben hätte. |
| Zweiter Suchpfad / Geocoder / Paid API? | Nein. |
| Migration / Service Role / Auth? | Nein. |

## 3. Risiken, die bleiben

- Kein Real-Device-/Mobile-Safari-Beweis in dieser Umgebung.
- Preview-GET kann SSO-geschützt sein; das ist kein erfundener Production-Beweis.
- Länder-Nachzug limit 12 bei extrem generischen Queries.
- `main` `protected=false`.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice.

**Unabhängiger Technical-Lead-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
