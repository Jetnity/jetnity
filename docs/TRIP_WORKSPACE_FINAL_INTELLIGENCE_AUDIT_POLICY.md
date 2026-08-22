# Jetnity – Finaler Trip-Workspace Intelligence Audit

Stand: 22. August 2026  
Status: **verbindliches Produkt-/Qualitäts-Gate**

## 1. Zweck

Der Trip Workspace / das Reise-Dashboard ist die zentrale Produktoberfläche von Jetnity. Nach dem geplanten strukturellen und funktionalen Umbau des Workspaces darf die Seite nicht allein aufgrund grüner Einzeltests oder eines guten visuellen Eindrucks als fertig gelten.

Vor einer endgültigen Product-Owner-Abnahme muss ein vollständiger **Senior Product / Architecture / UX / Logic / Security / Intelligence Audit** durchgeführt werden.

Ziel ist zu prüfen, ob Jetnity als **ein zusammenhängendes intelligentes Reisesystem** funktioniert und nicht nur als Sammlung technisch funktionierender Einzelmodule.

Leitsatz:

> **Nicht nur jede Funktion muss richtig sein. Die gesamte Reise muss richtig zusammenspielen.**

## 2. Zeitpunkt

Der Audit erfolgt erst, wenn die für den betreffenden Workspace-Umbau vorgesehenen Grundlagen vorhanden sind.

Aktuelle verbindliche Reihenfolge:

1. Foundation D – Route & Transit Intelligence abschließen.
2. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document auf belastbarer Architektur umsetzen.
3. Den zentralen Trip Workspace auf Grundlage von Route Truth + Traveller Truth + bestehendem Reisegraphen umfassend optimieren.
4. Danach diesen finalen Intelligence Audit durchführen.
5. Erst nach behobenen Audit-Funden und erneuter Verifikation darf die zentrale Workspace-Version als produktreif gelten.

## 3. Audit-Bereiche

### 3.1 Gesamte Informationsarchitektur

Prüfen:

- Wo muss welche Information liegen?
- Was muss der Nutzer zuerst sehen?
- Was ist sekundär und gehört in Progressive Disclosure?
- Gibt es doppelte, widersprüchliche oder unnötige Informationen?
- Ist der nächste sinnvolle Schritt in jedem Zustand klar?
- Wirkt die Seite wie ein zusammenhängender Reisebegleiter statt wie ein Verwaltungs-Dashboard?
- Sind Navigation, Rückwege und Bereichswechsel logisch?

Der Audit darf die bestehende Anordnung vollständig hinterfragen. Bestehender Code und heutige Karten-/Tab-Struktur sind keine unveränderliche Produktspezifikation.

### 3.2 Intelligenz und Entscheidungsqualität

Jetnity muss prüfen können:

- Was fehlt für diese konkrete Reise wirklich?
- Welche Information kennt Jetnity bereits und darf nicht erneut abgefragt werden?
- Welche offene Entscheidung hat aktuell den größten Nutzen?
- Welche Vorschläge kann Jetnity selbst proaktiv machen?
- Welche Optionen sind objektiv besser und warum?
- Wann ist eine gezielte Rückfrage sinnvoll und wann wäre sie nur Reibung?
- Werden weiche Wünsche als Kontext statt als unnötig starre Filter behandelt?
- Werden Unsicherheit und fehlende Evidence korrekt als `unknown` / `insufficient context` behandelt?

Keine pseudo-intelligenten Hinweise ohne echten Entscheidungsnutzen.

### 3.3 Cross-Domain-Intelligence

Alle bestehenden Kernbereiche werden gemeinsam geprüft:

- Reiseziele / Etappen
- Route / Transit
- Flüge
- Unterkunft
- Aktivitäten
- Mobilität / Transfers
- Mietwagen
- Budget / Kosten
- Reisende / Traveller Context
- Multi-Citizenship / Multi-Document
- Einreise & Reisevorbereitung / Readiness
- Wünsche & Prioritäten
- Reiseänderungen / Revisionslogik
- Buchungs-/Planungsstatus
- Guest / Account / Persistenz

Prüffrage:

> Wenn sich ein wichtiger Fakt in einem Bereich ändert, erkennt Jetnity alle wirklich relevanten Auswirkungen in den anderen Bereichen?

Beispiele:

- Flugänderung → Transit, Readiness, Transfers, Unterkunftszeiten, Tagesplan.
- Zielreihenfolge → Flüge, Mobilität, Unterkunft, Aufenthaltsdauer, Readiness.
- Traveller-/Passänderung → Einreise-/Transitoptionen und relevante travellerabhängige Funktionen.
- Hotelwechsel → Transfers, Aktivitäten, Tagesplanung.
- Budgetänderung → Empfehlungen in mehreren Bereichen, ohne harte Fakten zu verfälschen.

Keine Änderung darf isoliert behandelt werden, wenn sie nachweislich die Gesamtreise beeinflusst.

### 3.4 Frühere Foundations erneut überprüfen

Der Audit prüft nicht nur neu gebauten Code. Alle bereits vorhandenen Foundation-Funktionen, die im Workspace sichtbar oder logisch beteiligt sind, werden erneut gegen den aktuellen Gesamtzustand geprüft.

Insbesondere:

- Ist die ursprüngliche Lösung noch richtig, nachdem spätere Foundations hinzugekommen sind?
- Existieren alte Annahmen, die durch Multi-Destination, Route Truth oder Traveller Context inzwischen falsch geworden sind?
- Gibt es Legacy-Felder oder Defaults, die unbemerkt intelligente Entscheidungen verfälschen?
- Gibt es doppelte Sources of Truth?
- Gibt es Übergänge, an denen Daten verloren gehen oder semantisch falsch weitergegeben werden?

"Damals grün getestet" bedeutet nicht automatisch "heute im Gesamtsystem noch richtig".

### 3.5 Truth / Evidence / Security

Prüfen:

- Harte Reise-Fakten stammen aus belastbarer Source of Truth.
- Browser-/Clientdaten können keine offizielle oder kanonische Wahrheit fälschen.
- Nutzerwünsche, Empfehlungen, Provider-Fakten und regulatorische Fakten sind klar getrennt.
- Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Zeiten oder erfundenen Einreise-/Transitregeln.
- `unknown` bleibt `unknown`.
- RLS/Ownership bleibt korrekt.
- Guest→Account verliert keine relevanten Reiseinformationen.
- Keine neuen sensiblen Traveller-Daten ohne fachliche Notwendigkeit.

### 3.6 Änderungs- und Freigabelogik

Verbindliches Muster:

> Änderung erkennen → Auswirkungen bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen.

Auditfragen:

- Wird eine Änderung zu früh automatisch übernommen?
- Werden Folgeeffekte transparent erklärt?
- Kann der Nutzer eine Empfehlung ablehnen?
- Bleiben nicht betroffene Bereiche stabil?
- Werden stale/recheck-Zustände korrekt gesetzt?

### 3.7 Psychologie / UX / Klarheit

Der Nutzer muss innerhalb weniger Sekunden verstehen:

1. Wo bin ich?
2. Was ist der aktuelle Zustand meiner Reise?
3. Was ist gerade am wichtigsten?
4. Was sollte ich als Nächstes tun?
5. Was passiert, wenn ich etwas ändere?

Prüfen:

- kognitive Last
- Informationshierarchie
- Primär-/Sekundäraktionen
- Progressive Disclosure
- Microcopy
- Empty / Loading / Error / Unknown / Provider unavailable
- lange Reisen / viele Etappen
- viele Reisende
- mehrere Staatsbürgerschaften / Dokumente
- bereits weit geplante Reisen vs. fast leere Reisen

### 3.8 Geräte- und Viewport-Parität

Verbindlich gilt `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`.

Audit auf geeigneter Matrix, mindestens:

- schmales Smartphone
- größeres Smartphone
- Tablet
- Laptop/Desktop
- relevante Hoch-/Querformate und Browser
- reale Hardware bei Risiken, die automatisierte Viewport-Tests nicht zuverlässig erkennen

Nicht nur Layout prüfen, sondern auch:

- Orientierung
- Informationspriorität
- Navigation und Rückwege
- Scroll-/Sticky-Verhalten
- Tastatur/Safe Areas/Browser-Chrome auf Mobile
- Touch- vs. Maus-/Tastaturbedienung
- gleiche fachliche Aussage und Nutzerkontrolle

Leitsatz:

> **Gleiche Reise. Gleiche Wahrheit. Gleiche Nutzerkontrolle. Gleich verständlich auf jedem Gerät.**

### 3.9 Szenario- und Edge-Case-Audit

Der Audit muss realistische End-to-End-Szenarien abdecken, nicht nur Komponenten.

Mindestens Varianten wie:

- eine einfache Einzielreise
- Mehrziel-/Rundreise
- gleicher Ort mehrfach als Etappe
- Direktflug
- ein Transit
- mehrere Transits
- Route-/Transitänderung
- mehrere Reisende
- Traveller mit mehreren Staatsbürgerschaften/Dokumenten
- unterschiedliche Anforderungen zwischen Reisenden
- Gastreise
- Account-Reise
- Guest→Account
- leere / teilweise geplante / weitgehend gebuchte Reise
- fehlende Providerdaten
- unbekannte Fakten
- Änderung von Datum, Ziel, Route, Traveller oder Wunschkontext

## 4. Proaktiver Experten-Pass

ChatGPT/Hauptentwickler und Coding Agent müssen im Audit ausdrücklich nach Dingen suchen, die der Product Owner nicht selbst genannt hat.

Jeder Fund wird bewertet nach:

- Problem
- Nutzer-/Produktwirkung
- Architektur-/Security-Wirkung
- Empfehlung
- Aufwand
- Priorität
- Blocker oder Follow-up

Wichtige Lücken dürfen nicht deshalb offen bleiben, weil sie nicht Teil des ursprünglichen Implementierungsauftrags waren.

## 5. Technische Verifikation

Zusätzlich zur Human-Abnahme:

- vollständige Unit-/Integration-/Domain-Tests
- Typecheck
- Lint / Hygiene
- Production Build
- Auth-/RLS-/DB-Security-Prüfungen, soweit betroffen
- erweiterte Trip-Workspace UI-Audits
- relevante Browser-/Viewport-Matrix
- CI
- Preview
- Production-Grenzen und Migrationen separat prüfen

Automatisierte Tests ersetzen nicht den Human Product-/UX-/Logic-Audit.

## 6. Ergebnisformat

Der finale Audit muss einen versionierten Bericht erzeugen mit mindestens:

- Gesamturteil
- geprüfte Bereiche
- geprüfte Szenarien
- bestätigte Stärken
- Blocker
- wichtige Verbesserungen
- spätere Follow-ups
- offene externe Abhängigkeiten
- Security-/Truth-Funde
- UX-/Psychologie-Funde
- Cross-Domain-Funde
- Geräte-/Viewport-Ergebnis
- vollständiger Test-/CI-/Preview-Nachweis
- Product-Owner-Gate

## 7. Abschlusskriterium

Der Trip Workspace gilt erst dann als in dieser Ausbaustufe produktreif, wenn:

- keine bekannten hochwirksamen Logic-/Truth-/Security-/UX-Blocker offen sind,
- die Kernbereiche nachvollziehbar zusammenspielen,
- relevante Auswirkungen bereichsübergreifend erkannt werden,
- die Seite psychologisch klar und logisch durchschaubar ist,
- die Intelligenz echte Arbeit und Entscheidungsstress reduziert,
- alle unterstützten Geräteklassen dieselbe Produktqualität und Nutzerkontrolle bieten,
- technische Nachweise grün sind,
- und der Product Owner anschließend ausdrücklich freigibt.

Kein technischer Agent darf dieses Gate durch `Mark Ready`, Merge oder Production-Rollout ersetzen.
