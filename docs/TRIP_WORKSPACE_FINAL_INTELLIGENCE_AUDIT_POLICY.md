# Jetnity – Finaler Trip-Workspace Intelligence Audit

Stand: 22. August 2026  
Status: **verbindliches Produkt-/Qualitäts-Gate**

## 1. Zweck

Der Trip Workspace / das Reise-Dashboard ist die zentrale Produktoberfläche von Jetnity. Nach dem geplanten strukturellen und funktionalen Umbau des Workspaces darf die Seite nicht allein aufgrund grüner Einzeltests oder eines guten visuellen Eindrucks als fertig gelten.

Vor einer endgültigen Product-Owner-Abnahme muss ein vollständiger **Senior Product / Architecture / UX / Logic / Security / Intelligence Audit** durchgeführt werden.

Ziel ist zu prüfen, ob Jetnity als **ein zusammenhängendes intelligentes Reisesystem** funktioniert und nicht nur als Sammlung technisch funktionierender Einzelmodule.

Leitsatz:

> **Nicht nur jede Funktion muss richtig sein. Die gesamte Reise muss richtig zusammenspielen.**

Zusätzlich gilt:

> **Vergangene Implementierung ist Ausgangslage, nicht Qualitätsgrenze.**

Früher gebaute, gemergte oder erfolgreich getestete Funktionen besitzen keinen Bestandsschutz, wenn sie dem heutigen Jetnity-Standard nicht mehr entsprechen oder das Zusammenspiel des Gesamtsystems beeinträchtigen.

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

### 3.3 Cross-Domain-Intelligence und fehlerfreies Zusammenspiel

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

> Wenn sich ein wichtiger Fakt in einem Bereich ändert, erkennt Jetnity alle wirklich relevanten Auswirkungen in den anderen Bereichen und bleiben alle betroffenen Zustände fachlich konsistent?

Beispiele:

- Flugänderung → Transit, Readiness, Transfers, Unterkunftszeiten, Tagesplan.
- Zielreihenfolge → Flüge, Mobilität, Unterkunft, Aufenthaltsdauer, Readiness.
- Traveller-/Passänderung → Einreise-/Transitoptionen und relevante travellerabhängige Funktionen.
- Hotelwechsel → Transfers, Aktivitäten, Tagesplanung.
- Budgetänderung → Empfehlungen in mehreren Bereichen, ohne harte Fakten zu verfälschen.

Keine Änderung darf isoliert behandelt werden, wenn sie nachweislich die Gesamtreise beeinflusst.

Verbindliche Interoperabilitätsregel:

- Eine Funktion gilt nicht als fertig, wenn sie nur isoliert korrekt arbeitet.
- Gemeinsame Facts müssen aus derselben kanonischen Source of Truth stammen.
- Cross-Domain-Folgeeffekte müssen technisch geprüft und getestet werden.
- Veraltete Zustände müssen korrekt invalidiert, stale gesetzt oder neu bewertet werden.
- Ein grüner Unit-Test eines Moduls beweist nicht, dass seine Schnittstellen zum Gesamtsystem richtig funktionieren.

### 3.4 Frühere Foundations und bestehende Funktionen erneut überprüfen

Der Audit prüft nicht nur neu gebauten Code. Alle bereits vorhandenen Foundation-Funktionen, die im Workspace sichtbar oder logisch beteiligt sind, werden erneut gegen den **heute gültigen Jetnity-Standard** geprüft.

Insbesondere:

- Ist die ursprüngliche Lösung noch richtig, nachdem spätere Foundations hinzugekommen sind?
- Existieren alte Annahmen, die durch Multi-Destination, Route Truth oder Traveller Context inzwischen falsch geworden sind?
- Gibt es Legacy-Felder oder Defaults, die unbemerkt intelligente Entscheidungen verfälschen?
- Gibt es doppelte Sources of Truth?
- Gibt es Übergänge, an denen Daten verloren gehen oder semantisch falsch weitergegeben werden?
- Ist eine bestehende Funktion fachlich richtig, aber heute psychologisch, logisch oder architektonisch schlechter als eine mögliche aktuelle Lösung?
- Verhindert historische Kompatibilität eine sauberere gemeinsame Produktlogik?

**„Damals grün getestet“ bedeutet nicht automatisch „heute im Gesamtsystem noch richtig“.**

Der Audit darf und soll deshalb frühere Funktionen verändern, wenn dies nötig ist. Zulässige Ergebnisse sind insbesondere:

- refaktorieren
- vereinfachen
- neu strukturieren
- auf eine gemeinsame Source of Truth umstellen
- Legacy-Defaults neutralisieren
- doppelte Logik entfernen
- Datenmodell oder API-Vertrag professionell migrieren
- Funktion ersetzen
- Funktion nach Product-Owner-Freigabe entfernen, wenn sie keinen ausreichenden Produktnutzen mehr hat oder das Gesamtsystem verschlechtert

Dabei gelten harte Grenzen:

- kein stiller Datenverlust
- kein stiller Bedeutungswechsel bestehender Daten
- Migrationen und Rückwärtskompatibilität bewusst planen
- keine Entfernung oder grundlegende Produktänderung ohne notwendige Product-Owner-Freigabe

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

Zusätzlich müssen Szenarien geprüft werden, in denen mehrere Änderungen nacheinander erfolgen. Jetnity darf nicht nur den ersten Zustand korrekt behandeln und danach durch kombinierte Änderungen inkonsistent werden.

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

Der Experten-Pass soll ausdrücklich fragen:

- Welche frühere Funktion würde ein Senior-Produkt-/Architekturteam heute anders bauen?
- Welche Schnittstelle funktioniert nur zufällig statt durch klaren Vertrag?
- Welche Information wird mehrfach modelliert?
- Welche Funktion fehlt, damit zwei bestehende Bereiche wirklich zusammenarbeiten?
- Welche bestehende Funktion macht Jetnity komplizierter, ohne ausreichend Nutzen zu liefern?

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
- gezielte Cross-Domain-Integrationstests für fachlich gekoppelte Bereiche
- End-to-End-Tests für zentrale Reiseänderungen und deren Folgeeffekte
- Regressionstests für veränderte frühere Foundations/Funktionen

Automatisierte Tests ersetzen nicht den Human Product-/UX-/Logic-Audit.

## 6. Ergebnisformat

Der finale Audit muss einen versionierten Bericht erzeugen mit mindestens:

- Gesamturteil
- geprüfte Bereiche
- geprüfte Szenarien
- bestätigte Stärken
- Blocker
- wichtige Verbesserungen
- veränderte/zu verändernde frühere Funktionen
- Interoperabilitäts-/Cross-Domain-Funde
- spätere Follow-ups
- offene externe Abhängigkeiten
- Security-/Truth-Funde
- UX-/Psychologie-Funde
- Geräte-/Viewport-Ergebnis
- vollständiger Test-/CI-/Preview-Nachweis
- Product-Owner-Gate

## 7. Abschlusskriterium

Der Trip Workspace gilt erst dann als in dieser Ausbaustufe produktreif, wenn:

- keine bekannten hochwirksamen Logic-/Truth-/Security-/UX-Blocker offen sind,
- alle relevanten bestehenden und neuen Kernfunktionen den aktuellen Jetnity-Standard erfüllen,
- die Kernbereiche nachvollziehbar und fehlerfrei zusammenspielen,
- relevante Auswirkungen bereichsübergreifend erkannt und technisch korrekt weitergegeben werden,
- keine relevanten doppelten oder widersprüchlichen Sources of Truth bestehen,
- die Seite psychologisch klar und logisch durchschaubar ist,
- die Intelligenz echte Arbeit und Entscheidungsstress reduziert,
- alle unterstützten Geräteklassen dieselbe Produktqualität und Nutzerkontrolle bieten,
- technische Nachweise inklusive Cross-Domain-Regressionen grün sind,
- und der Product Owner anschließend ausdrücklich freigibt.

Kein technischer Agent darf dieses Gate durch `Mark Ready`, Merge oder Production-Rollout ersetzen.
