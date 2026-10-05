# Jetnity – Traveller Context Intelligence Policy

Stand: 22. August 2026  
Status: **dauerhaft verbindlich für alle relevanten Jetnity-Funktionen, ChatGPT, Cursor und andere Coding Agents**

## 1. Harte Produktregel

Jetnity darf einen Reisenden fachlich nicht auf eine einzige pauschale Identität reduzieren, wenn eine Funktion von mehreren rechtlich oder praktisch relevanten Traveller-Fakten abhängen kann.

Ein Reisender kann mehrere relevante Kontexte besitzen, z. B.:

- mehrere Staatsbürgerschaften
- mehrere Reisepässe / Identitätsdokumente
- unterschiedliche ausstellende Länder
- Wohnsitz / Aufenthaltsstatus
- unterschiedliche Dokument-Gültigkeiten
- je nach Funktion weitere notwendige, datensparsame Traveller-Fakten

Für **jede neue oder geänderte Funktion** muss deshalb geprüft werden:

> Kann das Ergebnis für denselben Reisenden je nach vorhandener Staatsbürgerschaft, Dokumentoption, Wohnsitz, Route oder anderem zulässigen Traveller-Kontext relevant anders ausfallen?

Wenn **ja**, muss die Funktion den relevanten Kontext korrekt modellieren, mehrere zulässige Optionen berücksichtigen und darf nicht still nur den ersten / primären Wert verwenden.

Wenn **nein**, soll die Funktion diesen Kontext nicht unnötig abfragen oder speichern.

## 2. Leitsatz

> **Ein Reisender kann mehrere rechtlich nutzbare Optionen haben. Jetnity prüft den für die konkrete Funktion relevanten Kontext, statt pauschal einen einzigen Pass oder eine einzige Staatsbürgerschaft anzunehmen.**

Das ergänzt den allgemeinen Jetnity-Grundsatz:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

## 3. Relevanzprüfung als Pflicht vor Implementierung

Jeder größere Feature-/Cursor-Task und jedes Human-/Architecture-Review muss für die betroffene Funktion mindestens beantworten:

1. Ist die Funktion traveller-spezifisch?
2. Können mehrere Staatsbürgerschaften / Dokumente / Wohnsitz- oder andere zulässige Traveller-Kontexte das Ergebnis verändern?
3. Falls ja: wird pro Traveller und pro notwendiger Option korrekt ausgewertet?
4. Welche Facts sind wirklich notwendig?
5. Welche Facts dürfen aus Datenschutzgründen gerade **nicht** gespeichert werden?
6. Welche Änderung dieser Facts muss eine Neuberechnung / stale / recheck auslösen?
7. Wie wird das Ergebnis für den Nutzer einfach und ohne Informationsüberlastung erklärt?

`nicht relevant` ist eine zulässige Antwort, muss aber bewusst entschieden sein. Eine Funktion darf Mehrfachkontext nicht nur deshalb ignorieren, weil das erste Datenmodell singulär war.

## 4. Bereiche, in denen diese Regel typischerweise relevant ist

Die folgende Liste ist nicht abschließend.

### Einreise / Readiness

Besonders relevant für:

- Visa / visumfrei
- eVisa / ETA / eTA / ESTA
- Transitvisa / Transitdokumente
- zulässige Reisepässe / Identitätsdokumente
- Passgültigkeit
- Aufenthaltsdauer
- Entry Forms
- regulatorische Health-/Vaccination-Anforderungen, **soweit** deren Regel tatsächlich von Traveller-/Route-Kontext abhängt
- Rück-/Weiterreise-Nachweise

Mehrere rechtlich nutzbare Credential-Profile müssen getrennt gegen dieselbe Route geprüft werden können.

### Flug / Airline / Reiseübernahme

Relevant, wenn echte Provider-/Carrier-Evidence z. B. Dokument-, APIS-, Transit- oder Eligibility-Anforderungen liefert.

Die Route selbst bleibt traveller-neutral; die Zulässigkeit / Dokumentwahl kann traveller-spezifisch sein.

Keine Airline-/APIS-Regel erfinden.

### Reiseänderungen

Wenn Route, Transit, Datum, Traveller, Staatsbürgerschaft oder Dokumentoption geändert werden, müssen alle **davon abhängigen** Ergebnisse gezielt neu bewertet werden.

Keine alte Bewertung darf still `current` bleiben, wenn ihr Kontext nicht mehr derselbe ist.

### Gruppenreisen

Jeder Reisende wird individuell ausgewertet.

Ein Gruppenstatus darf nie implizieren, dass alle dieselben Visa-, Transit-, Dokument- oder Health-Regeln haben.

Jetnity darf die Gruppe zusammenfassen, muss Unterschiede aber sichtbar machen, wenn sie eine Entscheidung beeinflussen.

### Mietwagen / Mobilität / andere Traveller-abhängige Produkte

Nur wenn fachlich relevant, z. B. bei später belastbar verfügbaren Regeln zu:

- Führerausweis-Ausstellungsland / Anerkennung
- Mindestalter / Fahrerprofil
- Aufenthalts-/Wohnsitzabhängigkeiten
- andere providerbelegte Eligibility-Regeln

Nicht jeder Bereich braucht Pass-/Nationalitätslogik. Kontext wird nur dort eingebracht, wo er das Ergebnis wirklich verändert.

### Versicherung / weitere Partnerprodukte

Wenn Providerbedingungen nach Wohnsitz, Alter, Destination, Staatsangehörigkeit oder anderem Traveller-Kontext unterscheiden, muss Jetnity diese Unterschiede evidenzbasiert behandeln.

Keine Eligibility aus Modellwissen erfinden.

## 5. Auswahl der besten bzw. zwingenden Option

Jetnity darf mehrere rechtlich nutzbare Optionen vergleichen, aber nur nach klarer Reihenfolge:

1. **Gesetzliche / regulatorische Pflicht**
2. **Zulässigkeit für die komplette konkrete Route inkl. Transit**
3. **Provider-/Carrier-Pflichten, soweit belastbar belegt**
4. **geringere belegte regulatorische Reibung**, z. B. visumfrei statt Visum
5. **weitere belegte Vorteile**, z. B. Frist, Aufenthaltsdauer oder Kosten, falls zuverlässig vorhanden

Eine gesetzliche Pflicht darf niemals durch einen Convenience-Score überschrieben werden.

Jetnity darf kein unkontrolliertes Wechseln zwischen Pässen / Identitäten an verschiedenen Grenzen empfehlen. Wenn die Nutzung eines bestimmten Dokuments über Einreise, Transit, Ausreise oder Carrier-Prozess konsistent sein muss, hat diese Regel Vorrang, sobald sie belastbar belegt ist.

## 6. Truth / Evidence

- LLMs sind keine regulatorische oder providerseitige Truth-Quelle.
- `unknown` bleibt `unknown`.
- Keine Visa-, Transit-, Dokument-, Health-, Eligibility- oder Carrier-Aussage ohne belastbare Evidence.
- Keine Scheingenauigkeit bei fehlenden oder widersprüchlichen Facts.
- Wenn Optionen nicht zuverlässig vergleichbar sind, zeigt Jetnity dies ausdrücklich.

Beispiel:

> **Noch nicht zuverlässig vergleichbar.**

## 7. Datenmodell-Prinzip

Langfristige Richtung:

- stabiler Traveller als eigene Identität im Reisegraphen
- 1:n relevante Staatsbürgerschaften
- 1:n Reisedokumente / Credentials
- klare Zuordnung zwischen Traveller, Credential und Evaluation
- kein paralleles Schattenmodell pro Produktbereich

Foundation C besitzt derzeit noch singuläre Übergangsfelder wie `nationality_country_code` und ein Dokumentprofil pro `trip_traveller`. Diese sind **kein langfristiges Architekturmandat**.

Neue Funktionen dürfen diese Singularität nicht weiter verhärten, wenn sie fachlich mehrere Optionen unterstützen müssen.

Die konkrete Schema-Erweiterung wird in einem eigenen, separat reviewten und freigegebenen Readiness-/Traveller-Context-Block umgesetzt. Keine Production-Migration allein aufgrund dieser Policy.

## 8. Datenschutz / Datensparsamkeit

Mehr Kontext bedeutet **nicht** mehr Datensammlung auf Vorrat.

Verbindlich:

- nur Facts abfragen, die für die konkrete Funktion notwendig sind
- progressive Missing Facts
- keine Pass-/Ausweisnummern nur für Vergleichslogik
- keine Scans / Biometrie / Dokumentvault ohne eigenen späteren Produkt- und Security-Entscheid
- keine Gesundheitsakte
- sensible Facts nicht unnötig in Client, Logs oder Analytics spiegeln

## 9. UX-Regel

Die technische Mehrfachauswertung darf die Oberfläche nicht kompliziert machen.

Standardmuster:

- wichtigste zulässige / zwingende Option zuerst
- kurze Begründung
- Unterschiede nur dann hervorheben, wenn sie relevant sind
- Alternativen progressiv über `Alternativen anzeigen`
- bei Pflicht nicht „Empfehlung“ sagen
- bei Unsicherheit ehrlich `nicht zuverlässig vergleichbar`

Beispiel:

**2 Staatsbürgerschaften**  
Für diese Reise am einfachsten: **Schweizer Reisepass**  
Grund: visumfreie Einreise.  
`Alternativen anzeigen`

## 10. Freshness / Re-Evaluation

Abhängige Ergebnisse müssen neu bewertet werden, wenn sich relevante Facts ändern, z. B.:

- Staatsbürgerschaft hinzugefügt / entfernt
- Dokument hinzugefügt / entfernt
- Dokumenttyp / Aussteller / Gültigkeit geändert
- Wohnsitz geändert
- Route / Transit / Destination / Datum geändert
- gewählte Credential-Option geändert
- andere für die konkrete Funktion relevante Traveller-Facts geändert

Nur tatsächlich abhängige Domänen werden neu bewertet; Jetnity soll keine unnötigen globalen Rechecks auslösen.

## 11. Definition of Done für neue Funktionen

Eine relevante Funktion ist nicht review-bereit, solange nicht geprüft wurde:

- Traveller-Context-Relevanz
- Multi-Credential-/Multi-Citizenship-Auswirkung, falls relevant
- Datenwahrheit / Evidence
- Datenschutz / Minimaldaten
- Freshness / Re-Evaluation
- Gruppenreise-Verhalten, falls relevant
- UX für Unterschiede / Alternativen
- negative / unknown / insufficient-context Fälle

Diese Prüfung gehört künftig in die jeweiligen Cursor-Tasks, Reviews und Acceptance-Dokumente.

## 12. Verhältnis zu bestehenden Policies

Diese Policy ergänzt verbindlich:

- `JETNITY_PRODUCT_MANDATE.md`
- `docs/LOGIC_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md` im aktiven Foundation-D-Branch

Bei zukünftigen Funktionen muss diese Policy als globale Leitplanke berücksichtigt werden, auch wenn der jeweilige Task das Wort „Staatsbürgerschaft“ nicht ausdrücklich nennt.

## 13. Merksatz

> **Wo Traveller-Kontext das Ergebnis ändern kann, prüft Jetnity die relevanten zulässigen Optionen individuell und evidenzbasiert – nicht pauschal, nicht erfunden und nicht unnötig kompliziert.**
