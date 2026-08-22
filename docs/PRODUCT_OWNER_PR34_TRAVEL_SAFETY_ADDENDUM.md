# PR #34 Product-Owner Addendum – Travel Safety & Disruption Intelligence

Stand: 22. August 2026  
Status: **verbindliche Product-Owner-Entscheidung / spätere Produktfähigkeit**

## Entscheidung

Jetnity soll künftig relevante Sicherheits- und Störungsereignisse erkennen und den Nutzer warnen können, wenn diese eine konkrete geplante oder laufende Reise betreffen.

Dazu gehören insbesondere belastbar belegte Ereignisse wie:

- Krieg / bewaffneter Konflikt
- schwere politische Unruhen
- Erdbeben
- Tsunami
- Vulkanaktivität
- Hochwasser
- Waldbrände
- Wirbelstürme
- weitere erhebliche, fachlich belegte Reisebeeinträchtigungen

## Verbindliche Produktlogik

- Keine pauschale Länder-Angstwarnung, wenn nur eine konkrete Region oder Verbindung betroffen ist.
- Kein Sprachmodell darf Safety-/Gefahren-Truth erzeugen; nur belastbare aktuelle Evidence.
- `unknown` bleibt `unknown`.
- Warnungen müssen den konkret betroffenen Teil der Reise nennen und eine sinnvolle nächste Aktion anbieten.
- Jetnity darf niemals aufgrund einer Warnung still Route, Etappe, Unterkunft, Aktivität oder Buchung ändern.
- Auswirkungen auf andere Reisebereiche müssen erkannt werden, wenn fachlich relevant.
- Warnungen müssen in der zentralen Workspace-Übersicht intelligent priorisiert werden können.
- Kritische Warnung, wichtiger Reisehinweis und reine Information müssen semantisch getrennt werden, um Alarmmüdigkeit zu vermeiden.

## Architektur

Die globale bindende Fachregel liegt auf `main` in:

`docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`

Travel Safety & Disruption ist mit Readiness, Route/Transit und Traveller Context verbunden, bleibt aber eine eigene Truth-Domäne. Einreise-/Dokumentanforderungen dürfen nicht mit Sicherheits-/Ereigniswarnungen vermischt werden.

## Reihenfolge

Diese Entscheidung ändert nicht die aktuelle Reihenfolge:

1. Foundation D abschließen
2. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document
3. zentralen Trip Workspace umfassend optimieren

Safety & Disruption wird nicht kurzfristig in PR #34 implementiert. Die Fähigkeit muss später professionell in gemeinsame Reise-Wahrheit, Workspace-Priorisierung und finalen Intelligence Audit integriert werden.

## Gate

- kein Merge durch dieses Addendum
- kein Mark Ready durch dieses Addendum
- keine Provider-/Quellen-Aktivierung
- keine neuen Kosten oder Verträge ohne bestehende Freigaberegeln
- spätere Implementierung mit eigenem Architektur-/Security-/Truth-/UX-Review
