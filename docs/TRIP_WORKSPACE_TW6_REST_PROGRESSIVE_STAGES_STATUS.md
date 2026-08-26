# Jetnity – TW6-B Runtime – Progressive Ziele + Day→Stage Truth Contract – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-rest-progressive-stages`  
PR: **#87** (Draft gegen `main`)  
Auftrag: Technical-Lead-Verdict CHANGES REQUIRED nach Head `3681fcbc`  
Status: **KORRIGIERT / AWAITING TECHNICAL-LEAD FINALREVIEW**

Kein Ready. Kein Merge. Kein TW-7/TW-8/TW-9. Kein Folgeslice.  
`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Live-Baseline

Live geprüft, nicht aus dem Prompt übernommen.

| Fakt | Wert |
| --- | --- |
| Live `origin/main` | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Merge-Base nach Sync | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Vorheriger TL-Head | `3681fcbc7370259aad3c7ba92b6ece2ff11662ee` |
| Sync-Commit | `82ef405b40f14437467841ee57331dde7e093ce4` (`merge origin/main`) |
| Offene parallele Draft-PRs | #52, #50, #40, #39, #28 |
| Shared-Contract-Kollision | keine offenen PRs treffen `zuordnung`, `reise_anlegen`, Timeline oder Assignment-Source |

`main` brachte nur die zwei Governance-Docs (Agent-Rotation, Technical-Lead-Autonomy). Keine Runtime-Kollision. Ahead/Behind und Exact Head stehen nach dem Korrektur-Push in Abschnitt 8.

## 2. Finale identische TS-/SQL-Ableitung

Kanonische Tabelle in `lib/trips/day-stage-assignment.ts` (`dayStageAssignmentSourceAbleiten`) und `public.reise_anlegen()` (`20260826230000`).

| stages | claimed | positions | result |
| --- | --- | --- | --- |
| <= 1 | * | * | `single_destination` |
| > 1 | `user` | * | `unassigned` |
| > 1 | `unassigned` | * | `unassigned` |
| > 1 | `single_destination` | * | `unassigned` |
| > 1 | unbekannt | * | TS: `unassigned` / SQL: `22023` |
| > 1 | `legacy_fallback` oder fehlend | ja | `legacy_fallback` |
| > 1 | `legacy_fallback` oder fehlend | nein | `unassigned` |

`unassigned` übernimmt keine Client-`stage_position` und überspringt Datums-UPDATE plus proportionalen CTE.

Der vorherige SQL-Bug (Client-`user` → null → bei Positionen `legacy_fallback`) ist geschlossen. TypeScript und SQL liefern für `user + positions` und `single_destination + multi-stage + positions` dieselbe fail-closed Semantik: `unassigned`.

## 3. Direkte RPC-Trust-Evidence

`public.reise_anlegen(jsonb)` bleibt `SECURITY INVOKER` mit `EXECUTE` für `authenticated`. Ein angemeldeter Client kann die RPC direkt aufrufen. Die TypeScript-Server-Action ist **keine** Trust-Grenze. Die Korrektur sitzt in der SQL-Funktion selbst.

## 4. Caller-Audit `reise_anlegen()`

Nur ein RPC-Aufruf: `lib/trips/anlegen.ts` → `supabase.rpc('reise_anlegen')`.

| Pfad | Einstieg | Nutzlast | Semantik vor #87 | Semantik nach #87 / nach Korrektur | Bewertung |
| --- | --- | --- | --- | --- | --- |
| A. `/planen` Account Create | `lib/trips/aktionen.ts` | `createZieleGraph` setzt `unassigned` / `single_destination`; Multi-Ziel ohne `stage_position` | proportionale 2/2/2-Erfindung | `unassigned`, keine Erfindung | korrekt |
| B. Guest Create | `gastspeicher.ts` | dieselbe Graph-Ableitung | Load-Fallback erfand Zuordnung | `unassigned` bleibt unassigned | korrekt |
| C. Guest→Account neuer Multi-Ziel-Trip | `alsNutzlast` → `gastreiseUebernehmen` | Source `unassigned`, Positionen null | Erfindung konnte mitwandern | bleibt unassigned | korrekt |
| D. Guest→Account Altbestand | `alsNutzlast` | fehlendes Feld oder `legacy_fallback` plus vorhandene `stageId` | Positionen + proportionaler SQL-CTE | `legacy_fallback`, Positionen bleiben | Altbestand erhalten; siehe Gate |
| E. Accepted Reisevorschlag | `lib/reisevorschlag/aktionen.ts` → `vorschlagAlsNutzlast` | **keine** Source, **mit** `stage_position` je Tag, Stage-Daten inkl. An/Abreise | Positionen wurden geschrieben, CTE füllte Rest | SQL leitet `legacy_fallback` ab | **falsche Provenance** – Product-Gate |

## 5. Accepted Reisevorschlag – Analyse

**Vor PR #87:** `vorschlagAlsNutzlast()` schrieb Stage-Daten und `stage_position` je Tag. `reise_anlegen()` persistierte diese Positionen und verteilte Resttage proportional. Es gab keine Provenance-Spalte. Die Zuordnung war faktisch Hard Truth nach „Übernehmen“, ohne als Nutzer-Aufenthalt gekennzeichnet zu sein.

**Durch PR #87:** Dieselbe Nutzlast ohne Source plus vorhandene Positionen wird als `legacy_fallback` klassifiziert. Funktional bleiben die Tageszuordnungen. Die Provenance ist falsch: ein übernommener Vorschlag ist kein historischer Legacy-Bestand.

**Korrekte Provenance:** näher an späterem `user` (explizite Bestätigung) als an `legacy_fallback` oder `unassigned`. `unassigned` würde die bestehenden Tageszuordnungen zerstören. `single_destination` gilt nicht bei mehreren Etappen.

**Genügen die vier genehmigten Werte?** Nein, nicht ohne eine neue Produktentscheidung:

- `user` allgemein zu aktivieren ist in diesem Slice verboten;
- ein fünfter Wert / Proposal-Provenance wäre eine neue Semantik;
- Secret/HMAC/Service-Role als Unterscheidung ist verboten.

**Gate:** Product Owner / Technical Lead müssen entscheiden, ob akzeptierte Vorschläge später `user` werden dürfen oder eine eigene, genehmigte Semantik brauchen. Dieser Slice ändert den Vorschlagspfad nicht still.

## 6. Legacy-Provenance-Evidence

Unterscheidung:

| Fall | Verhalten jetzt |
| --- | --- |
| A. bereits persistierte historische DB-Reise | Default/`legacy_fallback` bleibt. Fixture-Reise in `db:sicherheit` bestätigt das. |
| B. alte Guest/localStorage-Reise | Lesen ohne Feld → `legacy_fallback`; Load darf proportional zuordnen; Transfer sendet Claim plus Positionen. |
| C. neuer direkter RPC-Client | Kann `legacy_fallback` + `stage_position` senden **oder** das Feld weglassen und Positionen senden und `legacy_fallback` minten. |
| D. neuer `/planen` Create | sendet abgeleitete Source; Multi-Ziel ohne Positionen bleibt `unassigned`. |
| E. accepted Reisevorschlag | mintet `legacy_fallback` über fehlende Source + Positionen. |

Die frühere P3-Aussage „localStorage-Tampering ist harmlos; Server lehnt Claim ab“ ist **falsch** für den direkten RPC-Weg. Ohne Secret sind B und C nicht unterscheidbar. Keine HMAC-/Service-Role-Improvisation.

## 7. Migration / Production

Neue additive Function-Replace: `supabase/migrations/20260826230000_trip_day_stage_assignment_source_fail_closed.sql`

**Production-Migration wird NICHT angewendet.** Die Spalte existiert dort weiterhin nicht. Kein `--produktion`. Keine Production-RLS-/Ownership-Änderung.

Development: gezieltes Anwenden nur dieser Datei, falls `20260826090000` AAL2 weiter offen ist.

## 8. Tests / Gates / CI / Vercel

Nach dem Korrektur-Push auszufüllen. Pflichtfälle:

- A `user` + Positionen → nicht `legacy_fallback` (TS + Development-RPC)
- B `single_destination` + Multi-Stage + Positionen → `unassigned` in TS und SQL
- C `unassigned` + manipulierte Positionen → unassigned, keine Übernahme, kein CTE
- D direkter Client `legacy_fallback` + Positionen → **mintet noch** `legacy_fallback` (dokumentiert, nicht geschlossen)
- E historische Fixture bleibt `legacy_fallback`
- F Paris → Rom → Paris 12.–17. September: 3 Stages, 6 Tage, unassigned, keine 2/2/2
- G Single-Destination regressionsfrei
- H Guest→Account unassigned bleibt truth-safe
- I accepted Vorschlag → weiterhin `legacy_fallback`-Provenance (Product-Gate, nicht still „repariert“)

## 9. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| TW6-B-P1-01 | P1 | Automatische 2/2/2-Erfindung im neuen Multi-Ziel-Create | Runtime geschlossen |
| TW6-B-P1-04 | P1 | SQL hat `user`+Positionen als `legacy_fallback` persistiert | **geschlossen** (identische Ableitung) |
| TW6-B-P1-05 | P1 | Direkter Client kann `legacy_fallback` plus Positionen minten | **offen – Product-Gate** |
| TW6-B-P1-06 | P1 | Accepted Reisevorschlag bekommt falsche `legacy_fallback`-Provenance | **offen – Product-Gate** |
| TW6-B-P2-02 | P2 | Guest-Load schrieb Erfindung in Guest→Account | geschlossen für neue unassigned Reisen |
| — | P0 | keine | — |
| TW6-B-P3-01 / P3-02 | P3 | Reorder / Reiseidee ein Ziel | out of scope |
| TW6-B-P3-03 | P3 | localStorage-Tamper | **hochgestuft nach P1-05**; direkter RPC ist die ehrliche Grenze |

## 10. Offene Restpunkte / Product-Gate

Technical Lead / Product Owner müssen entscheiden:

1. Darf ein akzeptierter Reisevorschlag später `user` als Source tragen, oder braucht er eine neu genehmigte Semantik?
2. Wie soll ein untrusted direkter RPC-Client an `legacy_fallback` gehindert werden, ohne Guest→Account-Altbestand zu zerstören – ohne Secret/HMAC?

Bis dahin: **STOPP** für diese zwei Fragen. Kein fünfter Wert. Keine Direction-A-UX. Keine Production-Migration.

## 11. STOP

**NICHT READY / NICHT MERGEFÄHIG.**

Kein Ready. Kein Merge. Kein Folgeslice. Keine Production-Migration. Keine Aufenthalts-UX.
