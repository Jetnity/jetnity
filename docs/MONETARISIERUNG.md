# Jetnity – Monetarisierung und Free-/Pro-Grenzen

Stand: 20. August 2026
Status: verbindliches Architekturprinzip, Umsetzung später

## Grundsatz

Die konkrete Grenze zwischen kostenlosen Funktionen und **Jetnity Pro** wird bewusst **nicht jetzt endgültig festgelegt**. Sie soll später anhand von Produktnutzung, Nutzerwert, Kosten und Zahlungsbereitschaft angepasst werden können.

Verbindlich ist deshalb:

- Free-/Pro-Regeln dürfen nicht verstreut und hart in einzelnen Seiten oder Komponenten eingebaut werden.
- Bevor die erste echte Pro-Funktion live geht, erhält Jetnity eine zentrale **Entitlement-/Feature-Access-Schicht**.
- Diese zentrale Schicht muss Funktionen als `free`, `pro`, limitiert, testweise freigeschaltet oder zeitweise promotet steuern können.
- Limits wie Anzahl intelligenter Änderungen, Überwachungen oder sonstige Nutzungskontingente müssen zentral änderbar sein.
- Eine Funktion muss später zwischen Free und Pro verschoben werden können, ohne ihre eigentliche Fachlogik neu zu bauen.
- Billing/Subscription (z. B. Stripe oder ein später gewählter Anbieter) wird erst an diese zentrale Entitlement-Schicht angebunden; Produktlogik darf nicht direkt vom Zahlungsanbieter abhängen.
- Die Architektur soll spätere weitere Tarifstufen erlauben, ohne heute unnötige Komplexität zu bauen.

## Zeitpunkt der Umsetzung

Die Entitlement-Schicht wird **noch nicht in Phase 3.1 implementiert**. Sie wird spätestens vor der ersten öffentlich aktivierten kostenpflichtigen Jetnity-Pro-Funktion umgesetzt.

Bis dahin werden neue Funktionen fachlich sauber und möglichst unabhängig von Tariflogik gebaut. Wenn bei einer Funktion bereits eine spätere Free-/Pro-Abgrenzung absehbar ist, darf diese Abgrenzung dokumentiert werden, aber nicht als verstreute harte Bedingung in der UI verankert werden.

## Produktentscheidung

Welche Funktionen am Ende kostenlos oder kostenpflichtig sind, bleibt bewusst veränderbar. Beispiele, die später verschoben oder limitiert werden können:

- manuelle intelligente Reiseänderungen
- automatische Reiseüberwachung
- proaktive Hinweise bei Flug-/Reiseänderungen
- vollständige Auswirkungsanalyse und optimierte Neuplanung
- Hotel-/Quartierempfehlungen
- weitere Komfort- oder Automatisierungsfunktionen

Die endgültige Zuordnung wird erst getroffen, wenn genügend reale Produktdaten und Nutzerfeedback vorhanden sind.
