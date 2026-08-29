# Jetnity – Visitor Search Country Alias – Post-Merge Production Smoke

Stand: 29. August 2026  
Issue: #109  
Canonical PR #173; transport PR #177  
Exact reviewed head: `d44d9a7f4c993be30834fb2e67c8487bd69f46ea`  
Merge on `main`: `ade03511341433d8d0b6f09b8d8342890381d3d5`  
Production deploy: GitHub deployment `6155203525` SUCCESS; Vercel `EC8WeJj3Mry1N1zSyZtz4qYpVjAL` completed  
Cursor-Session: `bc-020d3296-0cd7-4e36-8373-47578af701ce`  
Logical Agent: `Visitor search correctness 1`

> Live-Evidence. Kein TL-PASS-Ersatz. Author-Smoke nach Technical-Lead-Merge.

## Ergebnis

**Live Production API erfüllt die Issue-#109-Invariante** auf `https://jetnity-app.vercel.app/api/search/places` (HTTP 200, `x-vercel-cache: MISS`, `cache-control: no-store`).

Vor dem Merge, dieselbe URL, `q=Peru&rolle=ziel`:

1. Peru IL city `geonames:4905770`
2. Peru IN city `geonames:4924733`
3. Republic of Peru country `geonames:3932488`

Nach dem Merge:

1. Peru country `geonames:3932488` · `Land` · `landAliasMatch=true`
2. Peru IL city bleibt auswählbar
3. Peru IN city bleibt auswählbar

Issue #109 wurde vom Technical Lead um 11:28 UTC als **COMPLETED** geschlossen. Residual P2: Mobile-Safari-Real-Device-QA ist in den nächsten Search-/Homepage-UX-Slice verschoben und öffnet den Country-Alias-Defekt nicht erneut.

## Queries

Alle Requests: `GET https://jetnity-app.vercel.app/api/search/places?q=…&rolle=…` am 29. August 2026, 11:26 UTC.

| Query | Rolle | First | IDs / Notes |
| --- | --- | --- | --- |
| Peru | ziel | country `geonames:3932488` label `Peru` · Land | Cities IL/IN remain #2/#3 |
| China | ziel | country `geonames:1814991` label `China` · Land | Japan/Mexico cities remain below |
| Schweiz | ziel | country `geonames:2658434` label `Schweiz` · Land | Unique alias stays natural |
| Congo | ziel | CD `geonames:203312` then CG `geonames:2260494` | Both label `Congo`; context `Land · Democratic Republic of the Congo · CD` / `Land · Republic of the Congo · CG` |
| LI | ziel | Liechtenstein + Lithuania countries first | Shared short alias disambiguated |
| AS | ziel | American Samoa, Australia, United States first | Shared short alias; cities after |
| SI | ziel | Sri Lanka, Cyprus, Slovenia first | Shared short alias; no city truncation |
| Kokos | ziel | country `geonames:1547376` label `Kokos` · Land | Trailing-whitespace end-token class |
| Illes | ziel | country `geonames:661882` label `Illes` · Land | Same class |
| Feroeer | ziel | country `geonames:2622320` label `Feroeer` · Land | Same class |
| Paris | ziel | region/city Paris, **no country row** | Hot-path: no country-universe leak into results |
| Zurich / Zürich | abreise | city `geonames:2657896` then `airport:ZRH` | No country rows |

## Residuals (nicht blocking für die API-Invariante)

- Preview-HTTP bleibt Vercel-SSO; Preview-Content nicht erneut bewiesen.
- Real-Device Mobile Safari nicht erneut gelaufen.
- UI wurde in diesem Smoke nur über API-Felder (`label`, `description`, `ariaLabel`, `landAliasMatch`) geprüft, nicht als Browser-Klick.
- Production-`keywords` enthalten weiterhin trailing Whitespace an mindestens 11 Country-Zeilen. Retrieval behandelt sie jetzt korrekt; ein späteres Import-Trim wäre Datenhygiene, kein Search-Runtime-Slice.
- `Paris` als Ziel bleibt region-first (`geonames:2968815`) vor der Stadt. Das ist bestehendes Places-Verhalten, nicht Issue #109.

## Kosten / Grenzen

Keine neuen laufenden Kosten. Keine Migration, kein Import-Rewrite, kein Provider, kein Issue #110.

## Nächster Schritt

Kein automatischer Folgeslice. Kein #110. Mobile-Safari-Real-Device bleibt Residual P2 für den nächsten Search-/Homepage-UX-Slice. Draft-PR #178 dokumentiert denselben Smoke plus New-Chat-Checkpoint und ist **nicht** die integrierte Runtime.
