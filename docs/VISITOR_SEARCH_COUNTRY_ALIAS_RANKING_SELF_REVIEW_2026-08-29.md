# Jetnity – Visitor Search Country Alias Ranking – Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Visitor search correctness 1`**  
Cursor-Session/Run-ID: `bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #109 / Country-Alias-Ranking only.

Geprüft: generisches Ranking/Retrieval; keine hartcodierten Peru/China/Schweiz-Fälle; `ziel` vs `abreise`; Place-ID-Truth; fail-closed Free Text; IATA; kompakte Relevanz; kein Geocoder; keine Migration/RLS/Auth; kein Issue #110.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Gibt es eine Länder-Ausnahmetabelle? | Nein. Nur `typ === 'country'` + exaktes Keyword/Name. |
| Wird ein Keyword-Präfix wie ein Alias behandelt? | Nein. `Swiss` / `Swiss Confederation` bleibt ungeboostet. |
| Werden Gleichnamen gelöscht? | Nein. Peru-/China-Städte bleiben unter dem Land. |
| Läuft Länder-Vorrang in `abreise`? | Nein. Nachzug nur für `ziel`; Länder fallen über `ortPasstZurRolle` raus. |
| Wird Free Text kanonisch? | Nein. `Test` bleibt leer; Persistenz unverändert Place-ID. |
| Wird IATA/ZRH geschwächt? | Nein. `ZRH` bleibt erster Abreise-Treffer. |
| Wird die Liste mit Township-Rauschen gefüllt? | Nein. `MIN_RANG_BEI_STARK` bleibt. |
| Zweiter Suchpfad / Geocoder / Paid API? | Nein. Dieselbe `public.places`-Tabelle. |
| Migration / Service Role / Auth? | Nein. |

## 3. Risiken, die bleiben

- Kein Real-Device-/Mobile-Safari-Beweis in dieser Umgebung.
- Länder-Nachzug limit 12 bei extrem generischen Queries.
- Import schreibt offizielle Langnamen weiter; das ist Absicht, nicht ein Restfehler des Rankings.
- `main` `protected=false`.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice.

**Unabhängiger Technical-Lead-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
