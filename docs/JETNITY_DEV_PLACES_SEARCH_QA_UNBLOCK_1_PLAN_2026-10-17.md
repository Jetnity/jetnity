# Development Places Search QA Unblock 1 — PLAN

**Datum:** 17. Oktober 2026 · **Issue:** [#960](https://github.com/Jetnity/jetnity/issues/960) · **Draft:** [#961](https://github.com/Jetnity/jetnity/pull/961)  
**Bindender TASK:** `docs/JETNITY_DEV_PLACES_SEARCH_QA_UNBLOCK_1_TASK_2026-10-17.md`, Blob `b214661d5c44484d2b4726a518951a5428e3dfc7` (unverändert)  
**Autor:** `Jetnity Development Places Search QA Unblock 1 — Cursor Generation 1` · Session `bc-284c2472-d0a5-4d4c-adb6-167661010453` · Modell `claude-opus-5-5-high`

## Ziel

Root Cause bestimmen, warum die Pflicht-`OrtSuche` auf `/planen` für `Japan` und `Zürich` auf Development keine Option anbietet. Nur bei bewiesenem Source-Defekt in den erlaubten Place-Dateien ein minimaler Code-Fix; sonst STOP mit Entscheidungspaket.

## D0-Schritte (nur lesend)

1. Kette lesen: `OrtSuche` → `Suchliste`/`sucheLage` → `/api/search/places` → `placesSuchen` → `ortNamensfilter`/`ortLandAliasExaktfilter`/`ortSchluesselfilter` → `ortAusZeile` → `orteOrdnen`; Migration `20260820120000_places_referenz.sql` und `docs/ORTE.md` nur lesen.
2. Bestehende Places-/Such-/Airport-Tests offline laufen lassen.
3. Neue rein synthetische Diagnose unter `lib/places/qa-unblock-1/`: echter `postgrest-js`-Encoder, lokale ILIKE/IMATCH-Auswertung, synthetischer Katalog (Japan, Zürich, ZRH, Störzeilen). Prüft T01–T04, T08.
4. Frisch isolierter `next dev` auf `127.0.0.1` am exakten Head, Prozess-Environment nur mit den zwei öffentlichen Supabase-Variablen; genau ein GET je Fall `q=Japan&rolle=ziel` und `q=Z%C3%BCrich&rolle=abreise`; nur Status, Typ, Länge, Array-Prüfung, Optionsanzahl, Fehler-Flag.
5. Befunde trennen: HTTP-Fehler, legitimes `200 []`, Client-Zustand, Fixture-Fehler, nicht untersucht.

## Grenzen

Kein SQL, keine Management-API, kein Service Role, keine Auth-Admin-Abfrage, kein Import, kein Seed, keine Migration, keine RLS-Änderung, kein externer Geocoder, kein Provider/LLM, keine Production-Berührung, keine Änderung an #955 oder an fremden Dateien. Schreiben nur in den TASK-eigenen Pfaden aus §4.

## Gates bei Commit

Typecheck, Lint, voller Testlauf, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`, `git diff --check`, Production-Build; danach Original-CI/Auth und Vercel Preview des neuen Heads.
