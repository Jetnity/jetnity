# Jetnity – TW6-B Runtime – Progressive Ziele / bestehende Trip-Stages – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-rest-progressive-stages`  
PR: **#87** (Draft gegen `main`)  
Auftrag: `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_TASK.md`  
Status: **BLOCKED / CHANGES REQUIRED**

Die Runtime auf diesem Branch ist **kein fertiges Produkt** und **nicht mergefähig**.  
Kein Ready. Kein Merge. Kein TW-7/TW-8/TW-9. Kein Folgeslice.

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Live-Baseline

Live geprüft, nicht aus dem Prompt übernommen.

| Fakt | Wert |
| --- | --- |
| Live `origin/main` | `9e1868ea2b78b714e1c2f3ea1e1e2fd8ed5b6ae6` — Merge PR #85 |
| Merge-Base | `9e1868ea2b78b714e1c2f3ea1e1e2fd8ed5b6ae6` |
| Vom Technical Lead geprüfter Head | `7ca2e24818853106a745085b3561266f6d3d3707` |
| Ahead / Behind vs `origin/main` vor dieser Korrektur | **4 / 0** |
| TW6-A | integriert über PR #82 |
| Offene parallele Draft-PRs | #52, #50, #40, #39, #28 |

`main` ist seit dem Task-Commit nicht weitergelaufen.

## 2. Technical-Lead-Finding – bestätigt

**Verdict des Agents:** das Finding ist **bestätigt**. Die frühere Einstufung als akzeptierte P2-Reste (`TW6-B-P2-01`, `TW6-B-P2-02`) war falsch.

`createZieleGraph` erzeugt bei mehreren Zielen korrekt leere Stage-Daten und `dayStagePosition = null`. Das reicht nicht. Der bestehende Persistenz- und Read-Vertrag macht daraus danach eine sichtbare Day→Stage-Wahrheit.

### 2.1 Create bleibt leer – Evidence

`createZieleGraph([Paris, Rom, Paris], 2026-09-12…2026-09-17)`:

- `einzelziel = false`
- `dayStagePosition = null`
- alle drei Stages: `arrivalDate = null`, `departureDate = null`
- persistierte Tage: `stageId = null`

Account-Create schreibt genau das nach `public.reise_anlegen()` (`lib/trips/aktionen.ts`: `arrival_date`/`departure_date` aus dem Graph, `stage_position: graph.dayStagePosition`).  
Guest-Create schreibt dieselben leeren Stage-Daten und `days.stageId = null` (`lib/trips/gastspeicher.ts`).

### 2.2 Persistenz und Laden erfinden die Zuordnung

`public.reise_anlegen()` (`supabase/migrations/20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis.sql`):

1. Insert der Tage mit `stage_id` nur bei gesetzter `stage_position` oder genau einer Stage.
2. Datumsüberlappung nur, wenn Stages Daten haben – hier nicht.
3. Danach **immer** der proportionale CTE für `trip_days.stage_id is null`.

Read-Pfad:

- `reiseLaden()` ruft `tageEtappenZuordnen()` auf (`lib/trips/daten.ts`).
- `gastspeicherLaden()` / `mitZuordnung()` ruft `tageEtappenZuordnen()` auf (`lib/trips/gastspeicher.ts`).
- `etappeFuerTag()` bei mehreren Stages ohne Etappendaten: `ceil(dayIndex * stageCount / dayCount)`.

Bestehender Test zementiert genau diese Rechnung als Load-Verhalten, nicht als Nutzerwahl (`lib/trips/zuordnung.test.ts`, „ohne Datum werden Tage proportional aufgeteilt“).

### 2.3 Timeline zeigt die Erfindung als Etappenwahrheit

`timelineAbleiten()` gruppiert Tage nach `stageId` und markiert die Etappe `istNutzerziel: true` (`lib/trips/timeline.ts`).  
`TripWorkspacePlan` rendert genau diese Ableitung.

Runtime-Evidence Paris → Rom → Paris, 12.–17. September, nach `tageEtappenZuordnen` + `timelineAbleiten`:

| Tag | persistiert | nach Load | Timeline |
| --- | --- | --- | --- |
| 2026-09-12 | `stageId = null` | Paris (stage-1) | Paris |
| 2026-09-13 | `stageId = null` | Paris (stage-1) | Paris |
| 2026-09-14 | `stageId = null` | Rom (stage-2) | Rom |
| 2026-09-15 | `stageId = null` | Rom (stage-2) | Rom |
| 2026-09-16 | `stageId = null` | Paris (stage-3) | Paris |
| 2026-09-17 | `stageId = null` | Paris (stage-3) | Paris |

Der Nutzer hat diese Aufteilung nicht gewählt.

Die Copy „Aufenthalte werden hier nicht festgelegt.“ widerspricht der anschliessend sichtbaren Timeline.

Das verletzt Task-Regeln 5–7 ausdrücklich: keine erfundenen Aufenthalte/Tageszuordnungen; Fallback nicht als Nutzerwahrheit; bei fachlich falscher sichtbarer Zuordnung **STOPP**.

### 2.4 Folge für PR #87

Die aktuelle Runtime-Version **darf nicht gemergt** werden. Sie ermöglicht den falschen sichtbaren Zustand.

Diese Korrektur baut **keine** neue Lösung. Keine neue Produktannahme, keine Migration, keine globale Änderung von `tageEtappenZuordnen` / `reise_anlegen` / Timeline-Truth.

Die Runtime-Dateien bleiben auf dem Branch nur als **blockierte Evidence**, nicht als fertige Lösung.

## 3. Changed Files

Gegen `origin/main` unverändert zum blockierten Runtime-Diff, plus diese Statuskorrektur:

- `components/trips/TripPlanner.tsx`
- `lib/formular/feldfehler.ts`, `lib/formular/feldfehler.test.ts`
- `lib/places/aktionen.ts`, `lib/places/reiseziele.ts`, `lib/places/reiseziele.test.ts`
- `lib/trips/aktionen.ts`, `lib/trips/create-stages.ts`, `lib/trips/create-stages.test.ts`
- `lib/trips/gastspeicher.ts`, `lib/trips/gastspeicher.test.ts`
- `lib/trips/schema.ts`, `lib/trips/schema.test.ts`, `lib/trips/create-entry.test.ts`
- `types/trips.ts`
- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_TASK.md`
- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_STATUS.md`

Nicht geändert in dieser Korrektur: `zuordnung.ts`, `uebernahme.ts`, `anlegen.ts`, SQL, Timeline, D0, `ACTIVE_WORK_STATUS.md`.

## 4. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| — | P0 | keine | — |
| TW6-B-P1-01 | **P1 / Merge-Blocker** | Multi-Ziel-Create persistiert leere Stage-Daten; SQL + `tageEtappenZuordnen` + Timeline machen daraus eine sichtbare, nicht gewählte Day→Stage-Wahrheit. Copy und Workspace widersprechen sich. | **BLOCKED.** Früher fälschlich P2. |
| TW6-B-P2-02 | P2 | Guest-Load schreibt die erfundene Zuordnung in eine spätere Guest→Account-Nutzlast | Folge von P1, nicht eigenständig lösbar |
| TW6-B-P3-01 | P3 | Kein Reorder | unverändert out of scope |
| TW6-B-P3-02 | P3 | `Reiseidee` erzeugt ein Ziel | unverändert out of scope |

Die IDs `TW6-B-P2-01` / akzeptierte P2-Reste gelten **nicht mehr**.

## 5. Mögliche Lösungsrichtungen – nicht umgesetzt

Höchstens drei, nur soweit der vorhandene Code sie trägt. **Keine davon ist in diesem Slice implementiert.**

### Option A – Nutzer bestimmt Stage-Aufenthalte / Day→Stage explizit

| Frage | Befund |
| --- | --- |
| Produktentscheid | Ja. Create oder Workspace muss Aufenthalte oder Tageszuordnung als Nutzerfakt erheben. Ohne diese Eingabe darf Multi-Ziel nicht persistiert oder nicht als zugeordnet dargestellt werden. |
| Shared-Contract | Bestehende Felder `trip_stages.arrival_date`/`departure_date` und/oder `trip_days.stage_id` via `stage_position` als **Nutzerwahrheit** schreiben. Kein stilles Proportional. |
| DB/Migration | Wahrscheinlich keine neue Tabelle. Bestehende Spalten reichen. Keine Änderung des proportionalen SQL nötig, wenn echte Stage-Daten gesetzt sind (Datums-UPDATE vor dem Fallback). |
| Guest | Derselbe Graph: bestätigte Ziele plus explizite Zuordnung persistieren. |
| Account | `reise_anlegen` kann gesetzte Daten/Positionen schon heute übernehmen. |
| Timeline | Zeigt dann eine gewählte Zugehörigkeit. `istNutzerziel: true` wäre fachlich haltbar. |
| Backward-Compatibility | Ein-Ziel-Create bleibt wahr. Bestehende Reisen mit gespeicherter `stage_id` bleiben. |
| Risiko | Scope-Erweiterung, UX, Validierung unvollständiger Zuordnung. Nicht TW6-B-REST ohne PO-Freigabe. |
| Empfehlung | **Fachlich sauberste Richtung**, wenn Multi-Ziel jetzt Produkt sein soll. Braucht Product-Owner-Entscheid. |

### Option B – Tage bleiben wirklich unassigned

| Frage | Befund |
| --- | --- |
| Produktentscheid | Ja. Mehrere Ziele ohne Aufenthalt heissen: Stages existieren, Tage gehören keiner Etappe. Die Timeline darf das nicht als Paris/Rom-Aufenthalt zeigen. |
| Shared-Contract | Unterscheidbarer Persistenz-/Read-Vertrag. Heute füllt SQL jeden `stage_id is null`. `reiseLaden` und `gastspeicherLaden` rufen immer `tageEtappenZuordnen` auf. Beides müsste für diesen Fall aussetzen. |
| DB/Migration | **Ja.** `public.reise_anlegen()` müsste den proportionalen CTE unterlassen, wenn keine Nutzerzuordnung vorliegt. Das ist eine versionierte SQL-Änderung. |
| Guest | `mitZuordnung` dürfte in diesem Fall nicht erfinden. Ein globaler Stopp von `tageEtappenZuordnen` wäre falsch: Altbestand ohne `stageId` verlässt sich auf den Fallback. |
| Account | Ohne SQL-Änderung speichert die Datenbank die Erfindung dauerhaft. |
| Timeline | `ohneEtappe` existiert bereits für `stageId = null`. Sie wird nur nie erreicht, weil Load vorher zuordnet. |
| Backward-Compatibility | Globaler Read-Stopp bricht Phase-2.2-Altbestand. Es braucht eine unterscheidbare Markierung oder einen engen, genehmigten Vertrag – das wäre eine neue Shared-Contract-Entscheidung, keine stille Provenance. |
| Risiko | Migration, Guest/Account/Timeline-Regression, Legacy-Fälle. |
| Empfehlung | Nur wenn Product Owner Multi-Ziel **ohne** Aufenthaltsfrage will. Nicht in diesem Slice. Nicht ohne TL/PO-Gate. |

### Option C – vorhandener Code ohne neue Truth

| Frage | Befund |
| --- | --- |
| Produktentscheid | Keine neue, weil keine vorhandene saubere Bahn. |
| Shared-Contract | Es gibt keinen Create-Pfad, der mehrere Stages ohne Daten durch Persistenz **und** Load **und** Timeline unassigned lässt. |
| DB/Migration | Ohne Vertragsänderung nicht möglich. |
| Guest / Account / Timeline | Load erfindet immer; Timeline glaubt `stageId`. |
| Backward-Compatibility | Nicht anwendbar. |
| Risiko | Eine behauptete Option C wäre selbst eine Produktannahme. |
| Empfehlung | **Existiert nicht.** Nicht als Lösung vorlegen. |

## 6. Notwendiges Gate

Vor jeder weiteren Runtime-Arbeit an TW6-REST-01:

1. Technical Lead wählt, welche Richtung dem Product Owner vorgelegt wird.
2. Product Owner entscheidet A, B oder „Multi-Ziel-Create zurückstellen“.
3. Erst danach ein neuer, explizit geschnittener Auftrag.

Dieses Dokument ist keine Freigabe und keine Implementierung.

## 7. Tests / Gates dieser Korrektur

Docs-/Evidence-Korrektur. Bestehende Tests wurden **nicht** so geändert, dass proportional = Nutzerwahrheit gilt.

Die bisherige Create-Suite prüft leere Stage-Daten und Reihenfolge. Sie behauptet nicht, die Timeline-Aufteilung sei gewählt. Der proportionaler-Fallback-Test in `zuordnung.test.ts` bleibt der Test des **bestehenden technischen** Vertrags.

Lokale Checks nach dieser Statuskorrektur: siehe nachgelagerter Commit / Exact Head.

## 8. GitHub Actions / Vercel

Der zuletzt vom Technical Lead geprüfte Head `7ca2e248` war Actions- und Vercel-grün. Das ändert den Truth-Blocker nicht.

Der Head dieser BLOCKED-Korrektur muss erneut Exact-Head gegatet werden. Grünes CI macht den Slice nicht mergefähig.

## 9. Offene Restpunkte

- Product-Owner-Entscheid über Option A, B oder Zurückstellen.
- Shared-Contract-/Migrations-Gate, sobald eine Richtung gewählt ist.
- Runtime von PR #87 nicht als Lösung mergen oder Ready setzen.
- Zentrale Continuity erst nach TL-Entscheidung.

## 10. STOP

**BLOCKED / CHANGES REQUIRED.**

Kein Ready. Kein Merge. Kein Folgeslice. Keine eigenmächtige Lösung.
