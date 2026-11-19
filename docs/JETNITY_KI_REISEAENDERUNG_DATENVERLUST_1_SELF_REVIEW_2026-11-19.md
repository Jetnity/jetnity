# KI-Reiseänderung Datenverlustschutz 1 — Self-Review

**Agent:** Jetnity KI Datenverlustschutz 1 · Generation 1
**Session:** https://cursor.com/agents/bc-8bcd33df-ceae-48b0-b81e-ee1de890e6f5
**Modell:** grok-4.7-high-fast
**Urteil des Autors:** nicht freigeben. `REVIEW_REQUIRED`.

## Was die Änderung wirklich tut

`tageEntfernenAb` kopiert jeden Planpunkt des entfallenen Tages nach `ohneTag` und setzt nur `dayId` und `stageId` auf null. Kommerzielle Punkte laufen danach weiter durch `kommerziellErhalten`. Ein Batch mit `punkt_entfernen` und zugleich `dauer_aendern`, `etappe_dauer`, `etappe_entfernen`, `etappe_hinzufuegen`, `tag_entfernen` oder `tag_hinzufuegen` kommt mit `ungueltig` zurück und lässt das Original stehen.

## Bewusst nicht blockiert

Ein Batch, der nur `punkt_entfernen` enthält, löscht einen nichtkommerziellen Punkt weiter. Das ist der bestehende Vertrag in `anwenden.test.ts`. Die Vorschau zeigt die Löschung als Alert und beschriftet den Button mit „Löschung übernehmen“. Ein allgemeiner Nächtewunsch kann diese Löschung nicht mehr mit einer Kürzung kombinieren. Er kann sie noch als einzigen Operationssatz schicken. Das ist die verbleibende Lücke.

## Seiteneffekt am manuellen Editor

Der manuelle Editor schickt kein `punkt_entfernen`, nutzt aber `etappe_entfernen` und `etappe_dauer`. Eine Etappenentfernung löscht normale Planpunkte nicht mehr. Sie werden ungeplant. Zwei Tests in `direct-trip-editing-1.test.ts` sperren das: null entfernte normale Punkte, geschützte Buchung unverändert, eine verknüpfte Vorbereitung zeigt weiter auf dieselbe Punkt-ID. `gastPlanpunktEntfernen` ist unberührt.

## Was ich nicht als bewiesen behandle

- Kein Apply gegen `public.reise_aendern` und kein Gast-`localStorage`-Lauf mit genau diesem Bangkok-Graphen. Der Gast-Kürzungstest für den kommerziellen Punkt ist weiter grün. `bedeutung()` enthält die behaltenen IDs.
- `reindex` schiebt bei einer Lücke in der Mitte weiter die Kalenderdaten der späteren Tage. Das ist das bisherige Verhalten und keine neue Hotelnacht. Die eigenen `startsOn`/`endsOn` der Punkte bleiben.
- Die Oberfläche ist bei 320 und 390 px als gerenderte Vorschau lesbar. Der eingeloggte Workspace und die Tastaturbedienung darin sind nicht auf einem Gerät geprüft. Die Buttons sind echte Buttons mit `focus-visible`.

## Grenzen

Keine Migration, kein RLS, kein Auth, keine Modellpreise, keine CI-Workflows, kein Ready, kein Merge, kein Folgeslice.
