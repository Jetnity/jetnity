# Jetnity – Visitor Search Country Alias Production Recovery – Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-RE-REVIEW / KEIN READY / KEIN MERGE / KEIN ISSUE #110**  
Workstream: Visitor Search correctness  
Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Session/Run-ID: `bc-020d3296-0cd7-4e36-8373-47578af701ce`  
Issue: [#109](https://github.com/Jetnity/jetnity/issues/109)  
Draft-PR: https://github.com/Jetnity/jetnity/pull/173

> Live-Evidence gewinnt. Authoring-Evidence, kein TL-PASS. Aktueller Fund: `5057811180`.

## Root Cause dieses Stamps

Der Universum-Scan (`typ = country`, leer gefiltert, Limit 500) bei jeder `ziel`-Query überträgt in Production ~240 Länderzeilen (~207 KB Keywords) auch für `Paris`. Exact-Vollständigkeit war damit erkauft, der Hot Path nicht.

## Was jetzt gilt

1. Ordinale Exact-Alias-Erstplatzierung, Alias-Label, Shared-Alias-Disambiguierung, Typ/ARIA unverändert.
2. Länder-Nachzug für `ziel` bleibt an, damit geteilte Aliase vollständig sind.
3. Der Read ist selektiv: Exact-Name oder Exact-Komma-Token. Kein Substring-`ilike %token%`, kein leerer Universum-Scan.
4. `ORT_LAND_UNIVERSUM = 500` ist Sicherheitskappe. Truncation nur, wenn >500 Länder dasselbe Exact-Token teilen.
5. Tests: 2-Zeichen + >12 Substring-Lärm bleibt grün; normale Stadt-Query überträgt 0 Universum-Zeilen.

## Tests / Evidence

Siehe Local-Evidence-Datei. Lokal **2588/2588**, Typecheck, Lint 0/135, Hygiene, Production-Build. Dieser Stamp erzeugt einen neuen Head.

## Kosten

Keine laufenden Kosten. Extra-Read: eine gefilterte Länder-Selektion, typischerweise 0–wenige Zeilen, nicht 240.

## Residuals

- Preview-GET kann SSO bleiben. Mobile Safari nicht gelaufen.
- Keyword-Abstand muss zum Import (`token, token`) passen; beide Komma-Varianten sind abgedeckt.
- `main` `protected=false`. Self-Review ist kein PASS.

## Nächster Schritt

Unabhängiger TL Exact-Head-Re-Review. Kein Ready. Kein Merge. Kein #110.
