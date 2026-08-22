# Foundation D – Expert Proactivity Amendment

Stand: 22. August 2026  
Status: **verbindlicher Nachtrag für PR #34**

## Product-Owner-Entscheidung

Der Product Owner verlangt verbindlich, dass ChatGPT und Cursor bei Jetnity nicht nur auf Anweisungen warten. Beide müssen als erfahrene Fachprofis selbst relevante und sehr wichtige Chancen, Risiken oder Verbesserungen erkennen und dem Product Owner aktiv präsentieren.

Global gilt `docs/EXPERT_PROACTIVITY_POLICY.md`.

## Für Foundation D zusätzlich verpflichtend

Vor der Empfehlung, PR #34 als review-bereit bzw. merge-fähig zu behandeln, muss ein eigener **Senior Expert Pass** erfolgen.

Dabei mindestens prüfen:

- Gibt es eine Route-/Transit-Logic-Lücke, die bisher nicht im Task stand?
- Gibt es eine falsche oder zu enge Annahme im Reisegraphen?
- Ist die Lösung auch für Mehrfachstaatsbürgerschaften / mehrere Credential-Profile sauber vorbereitbar?
- Gibt es UX-/Informationsarchitektur-Punkte, die Nutzer bei Route/Transit unnötig verwirren?
- Gibt es Security-/Privacy-/Datenwahrheitsrisiken?
- Gibt es Performance-/Mobile-/Accessibility-Probleme mit spürbarer Nutzerwirkung?
- Gibt es eine wichtige Folgefunktion oder Integration, die jetzt nicht gebaut werden soll, aber als nächster sinnvoller Schritt dokumentiert werden muss?
- Gibt es einen Punkt, der vor Merge oder vor Production zwingend gelöst werden sollte?

## Abschlussbericht

Der Cursor-Abschlussbericht muss zusätzlich einen Abschnitt **„Proaktive Experten-Funde / Empfehlungen“** enthalten.

Für jeden wesentlichen Fund:

- Problem / Beobachtung
- Relevanz
- Empfehlung
- Priorität
- innerhalb oder außerhalb Foundation-D-Scope
- nötige Product-Owner-Entscheidung

Wenn nach professioneller Prüfung **keine** zusätzliche hochwirksame Empfehlung besteht, soll ausdrücklich stehen:

`Keine zusätzlichen hochwirksamen Experten-Funde außerhalb der bereits dokumentierten Punkte.`

Keine künstlichen Ideen erfinden, nur um diesen Abschnitt zu füllen.

## Scope-Grenze

Wichtige Funde außerhalb des aktuellen Scopes werden dokumentiert und präsentiert, aber nicht eigenmächtig in Foundation D eingebaut.

Kritische Truth-/Security-/Production-Funde innerhalb des Scopes dürfen jedoch nicht ignoriert werden.

## Merge

Unverändert gilt: kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.
