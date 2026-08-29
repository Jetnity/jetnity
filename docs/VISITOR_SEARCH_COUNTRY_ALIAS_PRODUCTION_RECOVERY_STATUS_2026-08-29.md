# Jetnity – Visitor Search Country Alias Production Recovery – Status

Stand: 29. August 2026  
Status: **PR #173 GEMERGT / LIVE PRODUCTION API SMOKE PASS / ISSUE #109 BLEIBT OFFEN BIS TL/PO CLOSE**  
Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Session: `bc-020d3296-0cd7-4e36-8373-47578af701ce`  
Merged PR: #173  
Exact reviewed head: `d44d9a7f4c993be30834fb2e67c8487bd69f46ea`  
`main` merge: `ade03511341433d8d0b6f09b8d8342890381d3d5`

> Authoring- und Post-Merge-Evidence, kein Ersatz für die Close-Entscheidung.

## Root Cause dieses Slices (historisch, behoben)

Import-Keywords stapelten Exact-Name + Exact-Keyword auf Gleichnam-Städten. Selektive Filter ohne Trim verpassten End-Tokens mit trailing Whitespace. Kurze Aliase gingen hinter Limit-12-Substring verloren. Geteilte Aliase waren ununterscheidbar.

## Was jetzt gilt

1. PR #173 ist auf `main` gemergt. Technical-Lead PASS `5057950183` galt für Exact Head `d44d9a7f`.
2. Live Production `GET /api/search/places` erfüllt die generische Country-first-Invariante inkl. Congo-Disambiguierung, kurzer Aliase und Trim-End-Tokens (`Kokos`/`Illes`/`Feroeer`).
3. `Paris` liefert keine Country-Zeile. `abreise` bleibt stadt-/IATA-geführt.
4. Issue #109 bleibt offen, bis Technical Lead / Product Owner schliessen.

Evidence: `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_POST_MERGE_SMOKE_2026-08-29.md`

## Tests / Evidence

Lokal vor Merge: 2589/2589. Exact-head CI `33249650241` SUCCESS. Vercel Preview `Cfhp3G1omZg242kdrjaU7C7SuPne` SUCCESS. Production deploy `6155203525` / Vercel `EC8WeJj3Mry1N1zSyZtz4qYpVjAL` completed. Live API smoke 29. August 2026 11:26 UTC PASS.

## Kosten

Keine laufenden.

## Nächster Schritt

TL/PO: Issue #109 schliessen oder Residuals (Mobile Safari / Browser-UI) nachfordern. Kein #110. Kein Ready/Merge durch den Autor.
