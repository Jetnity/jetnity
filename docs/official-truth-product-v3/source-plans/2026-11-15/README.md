# Nächste Quellenpläne: CH→AT, CH→FR, CH→IT

**RESEARCH_ONLY — Recherche vom 15.11.2026, ca. 10:55 UTC.**
Diese drei Pläne wurden mit dem bestehenden `source-plan.ts template` erzeugt.
Jeder enthält alle 26 Kundenthemen und ausdrücklich keine akzeptierte Aussage,
keine kanonischen Proposals und keine Publikationsautorität. Die 206 bestehenden
recherchierten Ziele bleiben unverändert. Die amtlichen Kandidaten unten sind
noch nicht als Code-eigene SourcePrograms, Registry oder Methodik gebunden;
deshalb bleiben `primary: null` und `counterSources: []` in den JSON-Plänen.

## Reihenfolge und genaue Bindungsgrenzen

| Priorität | Amtliche Kandidaten | Enger erster Umfang | Offene Bindung |
| --- | --- | --- | --- |
| 1. Österreich | [BMI, Abschnitt zu EU-, EWR- und Schweizer Staatsangehörigen](https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html); [Österreichische Botschaft Bern](https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/) | Schweizer Staatsangehörige mit gültigen gewöhnlichen Dokumenten; Visumausnahme und Pass **oder** Identitätskarte. | Explizite Absatzextraktion und Quellenidentität. Den benachbarten Abschnitt über ausländische Inhaber schweizerischer Aufenthaltstitel getrennt halten. Aus Visumfreiheit keine ETA-, Formular-, Gebühren- oder Gesundheitsregeln ableiten. |
| 2. Frankreich | [France-Visas, Suisse](https://france-visas.gouv.fr/suisse); [Service-Public, Aufenthalt unter drei Monaten](https://www.service-public.gouv.fr/particuliers/vosdroits/F13512); [CESEDA L200-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042777428) | Schweizer Staatsangehörige, kurze Reisen ins französische Mutterland; Visumausnahme und gültige gewöhnliche Reisedokumente. | Die ausdrückliche Schweizer Einbeziehung in die Dokumentregel mitführen. Überseegebiete sind nicht pauschal abgedeckt; der Kontext muss den Gebietsbezug ausdrücken, bevor ein Proposal entstehen darf. |
| 3. Italien | [MAECI, anerkannte Reisedokumente](https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/passaporti_documenti/); Kandidat [Polizia di Stato](https://poliziadistato.it/articolo/24725) | Noch kein abgeschlossener Schweizer Umfang. | Die aktuelle ausdrückliche Schweizer Zuordnung zum auf MAECI genannten europäischen Passabkommen fehlt in der gebundenen Quellenkette. Die Polizeiseite war bei der unabhängigen Recherche zugriffsgesperrt. Allgemeine Visumantragsvoraussetzungen nicht auf Schweizer Staatsangehörige übertragen. |

Die AT-Primärquelle nennt Schweizer ausdrücklich und trennt deren Regeln von
der Drittstaatenregel 90/180. France-Visas nennt Schweizer ausdrücklich und
beschreibt gesonderte Überseeausnahmen. MAECI nennt Vertragsstaaten eines
Abkommens, ohne im ausgewählten Absatz die Schweizer Zuordnung selbst zu
belegen. Deshalb haben die drei ersten Themen in AT/FR den Planstatus
`method_not_qualified`, in IT `source_unclear`. Alle weiteren Themen bleiben
`not_researched`; der Besuchertext dafür bleibt „Derzeit nicht verfügbar“.

## Wiederholbarer nächster Umsetzungsschritt

1. AT zuerst: Zielbehörde, Quellenidentität, aktuelle Originalbytes und genau
   passende Abschnitte binden; Pass und ID als Alternativen modellieren.
2. Den Code-eigenen SourceProgram-/Registry-/Extractor-Eintrag und die exakten
   Methodik-, HRS- und SQL-Bindungen ergänzen. Ein Plan allein erfüllt diese
   Prüfungen nicht. Der heutige CLI-Checker kennt nur `aa-bern-ch-de`.
3. Geprüfte Proposals über den normalen S1→M04→I1→HRS-Weg verarbeiten; regulären
   BG1, unveränderte Zeitbudgets, Besucheranzeige und automatische Erneuerung
   nachweisen. Alle übrigen Themen bleiben sichtbar und unbestätigt.
4. Dasselbe Verfahren für FR mit explizitem Gebietsbezug wiederholen. IT erst
   nach Schließen der konkreten Quellenlücke fachlich binden.

Keine Quelle wurde in diesem Schritt installiert, automatisch importiert oder
als akzeptierte Kundenregel veröffentlicht. Die erste Live-Abnahme bleibt CH→DE.
