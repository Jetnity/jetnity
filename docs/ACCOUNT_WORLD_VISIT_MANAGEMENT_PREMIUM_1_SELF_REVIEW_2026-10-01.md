# Account / Deine Welt Visit Management Premium UX 1 — Self-Review

Stand: 1. Oktober 2026

Dies ist die Prüfung des umsetzenden Agenten. Sie ist **kein** unabhängiger Technical-Lead-PASS, kein Ready und kein Merge.

Geprüfter Code: `d9ad81ea920fe3197085343aab12e34f8394e742`
Session: https://cursor.com/agents/bc-809e6d21-da18-4e7d-992f-31eff656e0c4
`originalModelName`: `grok-4.7-high-fast`

## Was die Lane selbst gesehen hat

- „Besuch hinzufügen“ steht vor der Karte und vor der Liste. Auf 390×844 liegt der Knopf bei y=246, Höhe 44, in der ersten Ansicht.
- 40 Ereignisse starten mit 12 Karten. Die Seitenhöhe fällt bei 390×844 von 11618 auf 5052. Das offene Formular liegt 152 px unter „Bestätigte Besuche“, vorher 8176 px.
- Vier Lissabon-Ereignisse bleiben vier getrennte Zeilen, in Ruhe und nach „Alle anzeigen“.
- Die Suche „Lissabon“ zeigt nur diese Zeilen und löst keinen Request aus. Ein Nichttreffer ist ein eigener Satz, der Zähler bleibt 40.
- Widerruf zeigt zuerst die Frage, dann „Ja, widerrufen“ und „Abbrechen“.
- Leer und Fehler sind verschiedene Sätze. Im Fehler fehlt die Hinzufügen-Aktion.
- Ziele unter 44 px: keine in der Verwaltung. Schriften unter 640 px: 16 px.
- Konsole leer. 4238 Tests, Typecheck, Lint ohne neue Fehler, Hygiene inklusive 0 Exporte ohne Aufrufer, Build und 137 visuelle Messungen ohne Befund.
- Der rote CI-Lauf `36915104158` auf `ddc52b6c` betraf genau `besuchVerwaltungSuchtext`. Die Funktion ist privat und wird von der lokalen Suche aufgerufen. Das ist der ganze Fix, kein Kartenumbau.

## Was ein unabhängiges Review noch ansehen sollte

- CSS-Zoom 1,25 und 1,5 lässt das Dokument überlaufen. Ursache ist der Atlas-Ausbruch in `AccountWeltKarte`, die diese Lane nicht besitzen darf. Verwaltung und Kopf laufen nicht über. Ein verkleinerter Viewport läuft nicht über. Ob der Ausbruch bei CSS-Zoom später anders gemessen werden soll, ist eine Kartenfrage, kein Besuchsschnitt.
- Nach dem Öffnen des Formulars kann die Überschrift unter der festen Navigation liegen, weil das Formular an den Anfang der Sicht scrollt. In Ruhe bleibt die Überschrift frei. Das ist gemessen und für den Ruhezustand erzwungen.
- Die 40er-Dichte existiert nur auf der Audit-Route. Ein eingeloggtes Konto mit echten 40 Besuchen ist hier nicht gegen Production geprüft.
