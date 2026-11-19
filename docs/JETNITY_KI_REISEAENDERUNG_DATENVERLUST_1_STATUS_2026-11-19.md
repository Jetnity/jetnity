# KI-Reiseänderung Datenverlustschutz 1 — Status

**Agent:** Jetnity KI Datenverlustschutz 1 · Generation 1
**Session:** https://cursor.com/agents/bc-8bcd33df-ceae-48b0-b81e-ee1de890e6f5
**Modell:** grok-4.7-high-fast
**Branch:** `fix/ki-reiseaenderung-datenverlust-1-20261119`
**Issue:** #1247 · **Draft-PR:** #1252
**Ausgang:** `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5`
**Ergebnis:** `REVIEW_REQUIRED`
**Exact head:** der Commit, der diese Datei enthält. Die CI-URL steht im PR-Kommentar zu genau diesem Commit und wird nicht durch einen weiteren Dokument-Commit verschoben.

## RED

Auf dem alten `tageEntfernenAb` verlor eine synthetische 7-Tage-Reise (Bangkok 3 Tage, Krabi 4 Tage) bei `etappe_dauer` Bangkok −1 und Krabi +1 die Punkt-IDs von Tag 3. `reiseDiff` schrieb `Entfernt:` für Freier Vormittag, Entspannter Abend, Aufenthalt in Bangkok, Transfer zum Pier und Nacht in Bangkok. Die Vorschau zeigte trotzdem „Änderung übernehmen“. 11 von 13 neuen Tests rot, 2 grün (nur Titel, einzelnes `punkt_entfernen`).

## GREEN

Dieselbe synthetische Reise behält jede ursprüngliche Punkt-ID. Punkte von Tag 3 liegen in `ohneTag` mit `dayId` und `stageId` null und sonst unverändertem Inhalt. Es entsteht kein neuer Stay. Der bestätigte Strandhaus-Punkt bleibt auf seinem Tag, mit Anbieter, Preis und Buchungszeit. Zwei Reisende mit je zwei Staatsbürgerschaften bleiben unverändert. Offene Zeitfelder bleiben null.

`punkt_entfernen` zusammen mit einer Tages- oder Etappenoperation wird abgelehnt, bevor etwas angewendet wird. Ein alleiniges `punkt_entfernen` eines nichtkommerziellen Punkts bleibt möglich. Die Vorschau nennt dann „Löschung übernehmen“.

## Was sich geändert hat

- Entfällt ein Tag, bleiben alle Planpunkte ungeplant. Das gilt für KI-Apply und für den manuellen Editor, weil beide `operationenAnwenden` nutzen.
- Konto (`aenderungUebernehmen`) und Gast (`gastreiseAendern`) rufen diese Funktion unverändert auf. `gastspeicher.ts` ist nicht geändert.
- Die Vorschau liest den Graphen: Reisetage vorher/nachher je Etappe, ungeplante Punkte, echte Löschungen getrennt. Sie nennt keine Nachtzahl.

## Lokal

Typecheck, Export-Check und der zweite Production-Build sind grün. Der erste Build-Stop war der Next.js-Sicherheitshinweis zu 16.4.1, kein fachlicher Fehler. Kein Paket-Upgrade in diesem Slice.

## Nicht gelaufen

Kein OpenAI-Call, kein Provider, keine Production-Datenbank, kein gehosteter Dev-Browser mit einem echten Konto. Die 320-/390-px-Bilder sind die serverseitig gerenderte Vorschau in einem lokalen Fenster, nicht der eingeloggte Workspace.
