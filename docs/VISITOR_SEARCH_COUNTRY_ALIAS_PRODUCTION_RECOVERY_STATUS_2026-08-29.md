# Jetnity – Visitor Search Country Alias Production Recovery – Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-RE-REVIEW / KEIN READY / KEIN MERGE / KEIN ISSUE #110**  
Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Session: `bc-020d3296-0cd7-4e36-8373-47578af701ce`  
Draft-PR: #173  
TL-Fund: `5057889604`

> Authoring-Evidence, kein TL-PASS.

## Root Cause dieses Stamps

Selektive Exact-Filter (`%, Token` / `%,Token`) trafen kein End-Token mit trailing Whitespace. Ranking trimmt dieselben Tokens und behandelt sie als Exact-Alias.

## Was jetzt gilt

1. Retrieval folgt der Trim-Semantik: `imatch` auf Komma-Token mit optionalem Whitespace plus explizite End-Muster mit Leerzeichen.
2. Kein Universum-Transfer. Stadt-Query-Regression bleibt.
3. 2-Zeichen- und Shared-Alias-Tests bleiben.
4. Neue Retrieval-Regression: letzter Alias-Token mit trailing Whitespace.

## Tests / Evidence

Lokal **2589/2589**, Typecheck, Lint 0/135, Hygiene, Production-Build. Dieser Stamp erzeugt einen neuen Head.

## Kosten

Keine laufenden. Extra-Read bleibt selektiv.

## Nächster Schritt

Unabhängiger TL Exact-Head-Re-Review. Kein Ready. Kein Merge. Kein #110.
