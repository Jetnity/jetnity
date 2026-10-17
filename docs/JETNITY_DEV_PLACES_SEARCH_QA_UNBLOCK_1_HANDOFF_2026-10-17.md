# Development Places Search QA Unblock 1 — HANDOFF

**Stand:** 17. Oktober 2026 · **Status:** STOP für unabhängigen ChatGPT Technical Lead R48. Draft bleibt Draft.

## Lage in einem Satz

`/planen` zeigt für `Japan` und `Zürich` keine Option, weil die anonyme Development-Lesesicht auf `public.places` für diese Begriffe null Zeilen liefert; Client, Route und Suchcode sind korrekt.

## Was ein neuer Agent lesen muss

1. `docs/JETNITY_DEV_PLACES_SEARCH_QA_UNBLOCK_1_TASK_2026-10-17.md` (unveränderlich)
2. `docs/JETNITY_DEV_PLACES_SEARCH_QA_UNBLOCK_1_REPORT_2026-10-17.md` — Matrix §2, Entscheidungspaket §3, Gates §5
3. `docs/JETNITY_DEV_PLACES_SEARCH_QA_UNBLOCK_1_SELF_REVIEW_2026-10-17.md`
4. `docs/evidence/jetnity-dev-places-search-qa-unblock-1/d0-bounded-get.json`
5. Live: `main`, diesen Branch-Head, CI/Auth/Preview am Head, PR-Kommentare auf [#961](https://github.com/Jetnity/jetnity/pull/961)

## Nächster Schritt

Entscheidung des Technical Lead bzw. Product Owner zu REPORT §3: zuerst einen begrenzten Development-Readback freigeben (DEV-PREP-1), dann je nach Ergebnis einen kontrollierten Development-Import oder einen eigenen RLS-Slice. Dieser Autor startet nichts davon selbst.

## Was nicht fortgesetzt werden darf

- Kein Code-Fix in diesem Slice ohne neuen, bewiesenen Source-Defekt.
- Keine erfundenen Place-IDs, keine statischen Treffer, keine Umgehung von `reiseorteBestaetigen`.
- #955 und seine Codex-Session bleiben unberührt.
- Kein Ready, kein Merge, kein Folge-Slice durch Cursor.

**Live-Evidence gewinnt.**
