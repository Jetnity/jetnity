# Jetnity – verbindlicher Workflow zwischen Product Owner, ChatGPT, Cursor und Repository

Stand: 22. August 2026
Status: **dauerhaft verbindlich für größere Jetnity-Arbeiten**

Dieser Workflow ergänzt `docs/CONTINUITY_STANDARD.md`. Ziel ist, dass Jetnity bei einem Wechsel von Chat, Cursor-Agent oder Sitzung ohne Wissensverlust exakt weitergeführt werden kann.

`JETNITY_PRODUCT_MANDATE.md` ist ab sofort ebenfalls verbindliche Pflichtquelle. Es hält den dauerhaften Anspruch fest, Jetnity zum führenden Produkt seiner Kategorie zu entwickeln – mit erstklassiger Web-Technologie, langfristig tragfähiger Architektur, belastbarer Datenwahrheit und außergewöhnlich einfacher UX.

## 1. Rollen

### Product Owner / Nutzer

Der Nutzer trifft die verbindlichen Produktentscheidungen: was Jetnity können soll, welche Prioritäten gelten, welche kostenpflichtigen oder Production-relevanten Schritte ausdrücklich freigegeben werden und welche Produktidee übernommen oder verworfen wird.

Der Nutzer soll bereits dokumentierte Projektstände, frühere Entscheidungen oder bekannte Blocker nicht bei jedem neuen Chat erneut erklären müssen.

### ChatGPT

ChatGPT hält die übergeordnete Produkt-, Architektur-, Logic-, Security-, Kosten- und Review-Steuerung.

ChatGPT soll insbesondere:

- vor größeren Entscheidungen den tatsächlichen Repository-/PR-/CI-/Production-Stand prüfen
- `JETNITY_PRODUCT_MANDATE.md`, `JETNITY_VISION.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `docs/LOGIC_STANDARD.md`, `docs/CONTINUITY_STANDARD.md` und relevante Fach-/ADR-Dokumente berücksichtigen
- neue Nutzerentscheidungen in eine konsistente Produkt-/Architekturentscheidung übersetzen
- größere Cursor-Aufträge vollständig und reviewbar formulieren
- verbindliche neue Produktentscheidungen dauerhaft im Repository sichern, nicht nur im Chat
- Cursor-Ergebnisse anschließend unabhängig auf Code, Logik, Security, Datenbank, Tests, CI, Preview, Kosten und Produktqualität prüfen
- vor Merge oder Production erneut den echten technischen Stand verifizieren
- den Handoff so aktuell halten, dass ein neuer Chat ohne Rätselraten übernehmen kann
- bei Architektur- und Technologieentscheidungen den verbindlichen Qualitätsanspruch aus `JETNITY_PRODUCT_MANDATE.md` anwenden: keine bloßen Trend-Technologien, sondern die für Jetnity beste langfristig tragfähige Lösung.

ChatGPT darf sich nicht allein auf Gesprächserinnerung verlassen. Wenn Erinnerung und Repository widersprechen, muss der aktuelle technische Stand geprüft werden.

### Cursor / Coding Agent

Cursor ist der ausführende Hauptentwickler für größere Implementierungsblöcke.

Cursor arbeitet nach dem jeweils im Repository hinterlegten `docs/CURSOR_..._TASK.md` und allen dort verlinkten verbindlichen Nachträgen.

Cursor soll:

- Pflichtlektüre und aktuellen Branch-/PR-/CI-Stand zuerst prüfen
- `JETNITY_PRODUCT_MANDATE.md` als verbindlichen Qualitäts- und Architekturanspruch berücksichtigen
- bestehende Architektur und Source of Truth respektieren
- keine parallelen Mini-Systeme bauen
- valide bereits begonnene Arbeit bei einem Nachtrag weiterverwenden und sauber refactoren statt unnötig neu anzufangen
- Implementierung, Tests, Security, DB/RLS, Browser-Audits, Build, CI, Preview und Dokumentation gemäß Auftrag abschließen
- keinen Merge, keine Production-Migration, keine Provider-Aktivierung oder kostenpflichtige Entscheidung ohne die jeweils geforderte Freigabe durchführen
- einen präzisen Abschlussbericht mit tatsächlichen Nachweisen liefern.

### GitHub-Repository

Das Repository ist das gemeinsame dauerhafte Gedächtnis und die technische Source of Truth.

Dort müssen Produktmandat, Produktvision, Handoff, Roadmap, Architektur, ADRs, Logic-/Quality-/Continuity-Standards, Fachmodule, aktuelle Cursor-Aufträge, verbindliche Nachträge und relevante Acceptance-/Production-Nachweise versioniert sein.

## 2. Start eines neuen größeren Arbeitsblocks

Vor Implementierung gilt:

1. ChatGPT prüft den aktuellen Repository-, Branch-, PR-, CI-, Preview- und Production-Stand.
2. ChatGPT liest bzw. berücksichtigt mindestens `JETNITY_PRODUCT_MANDATE.md`, Produktvision, Handoff, Roadmap und die relevanten Logic-/Architekturquellen.
3. ChatGPT entscheidet mit dem Nutzer den nächsten fachlichen Block.
4. Der vollständige Cursor-Auftrag wird im zuständigen Feature-Branch als `docs/CURSOR_<THEMA>_TASK.md` hinterlegt.
5. Der Draft-PR verweist auf diesen Auftrag.
6. Cursor liest zuerst die Pflichtquellen und arbeitet danach selbstständig innerhalb der dokumentierten Grenzen.

## 3. Neue Produktentscheidung während eines laufenden Cursor-Jobs

Wenn der Nutzer eine Entscheidung ändert oder erweitert:

1. Die Entscheidung wird nicht nur im Chat festgehalten.
2. ChatGPT hinterlegt sie als versionierten Nachtrag, ADR, Fach-Dokument, Produktmandat-/Vision-Präzisierung oder aktualisierten Task im aktuellen Branch.
3. Es muss klar erkennbar sein, welche neuere Quelle ältere Annahmen überschreibt.
4. Ein laufender Cursor-Agent synchronisiert den Branch, liest den Nachtrag und passt seine bestehende Arbeit an.
5. Valide bestehende Arbeit soll nicht unnötig verworfen werden.

## 4. Abschluss eines größeren Arbeitsblocks

Vor Abschluss müssen die dauerhaften Projektquellen den tatsächlichen Stand widerspiegeln.

Mindestens dokumentieren:

- was umgesetzt wurde
- was bewusst nicht umgesetzt wurde
- Branch / PR / Head
- main-Status
- Development-/Preview-/Production-Status
- Migrationen und RLS/Security
- Tests, Browser-Audits, Build und CI
- Kosten
- offene Provider/API/Key-Abhängigkeiten
- bekannte Risiken oder technische Schulden
- verbindliche Logic-/Truth-Regeln
- nächste konkrete Aufgabe
- noch erforderliche Nutzerfreigaben
- ob die Arbeit den Qualitäts- und Produktanspruch aus `JETNITY_PRODUCT_MANDATE.md` erfüllt oder welche Lücke noch offen bleibt.

Eine Aufgabe ist nicht sauber abgeschlossen, wenn der nächste Chat/Agent erst den Nutzer fragen müsste, was zuletzt passiert ist.

## 5. Wechsel in einen neuen Chat

Ein neuer Chat soll zuerst aus dem Repository rekonstruieren, wo Jetnity steht.

Mindestens lesen/prüfen:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- aktuelle Fach-Dokumente
- aktuellen offenen PR und dessen Cursor-Task/Nachträge
- aktuellen Git-/CI-/Preview-/Development-/Production-Stand.

Der neue Chat muss danach unterscheiden können:

- **was Jetnity ist und wohin es entwickelt wird**
- **was Jetnity bereits kann**
- **was tatsächlich gebaut und gemergt wurde**
- **was nur Draft/Preview/Development ist**
- **was noch fehlt, blockiert oder bewusst verschoben ist**
- **welche Produkt-, Architektur-, Logic-, Security- und Kostenregeln verbindlich sind**.

Der Nutzer soll danach mit einem kurzen Satz wie „Wir machen mit Jetnity weiter. Lies den Handoff.“ fortfahren können.

## 6. Wechsel in einen neuen Cursor-Agenten

Ein neuer Cursor-Agent soll den aktuellen Feature-Branch und den dort hinterlegten Cursor-Auftrag übernehmen.

Vor größerer Arbeit muss er den Produkt- und Qualitätsanspruch aus `JETNITY_PRODUCT_MANDATE.md` kennen. Er darf nicht aus einem alten Chatprompt raten. Maßgeblich sind die aktuellen versionierten Dateien und der reale Branch-/PR-Stand.

## 7. Source-of-Truth-Priorität

Bei Widersprüchen gilt:

1. verifizierter aktueller Repository-/PR-/CI-/Production-Stand für Aussagen darüber, **was tatsächlich existiert oder aktiv ist**
2. `JETNITY_PRODUCT_MANDATE.md` und `JETNITY_VISION.md` für den verbindlichen Produkt-/Qualitäts-Nordstern
3. neuere ausdrücklich verbindliche ADRs/Tasks/Nachträge/Handoff-Dokumentation
4. ältere Repository-Dokumentation
5. Chat-Erinnerung oder Agenten-Sitzungskontext.

Vision und Mandat dürfen Zukunftszustände beschreiben, aber nie als bereits umgesetzt ausgegeben werden.

Widersprüche sollen bereinigt und dokumentiert werden, nicht still übergangen werden.

## 8. Kosten und Production

Bestehende Jetnity-Kosten- und Production-Grenzen bleiben verbindlich. Kostenpflichtige oder riskante Production-Schritte brauchen die jeweils dokumentierte Freigabe. Ein Cursor-Auftrag oder Chat darf diese Grenze nicht still erweitern.

Der Anspruch „Top-Technologie“ ist keine Freigabe für unnötig teure Infrastruktur oder Technologie um ihrer selbst willen. Jede neue laufende Ausgabe oder wesentliche Plattformabhängigkeit muss einen konkreten Nutzen für Jetnity rechtfertigen.

## 9. Leitprinzip

> **Der Nutzer entscheidet das Produkt. ChatGPT hält Produkt, Architektur, Logik, Security und Review zusammen. Cursor implementiert größere Blöcke. Das Repository hält das gemeinsame Gedächtnis und den überprüfbaren Projektstand.**

Übergeordnet gilt ab sofort ebenfalls:

> **Jetnity soll die Nummer 1 werden, weil es Reisen einfacher, intelligenter, verlässlicher und ganzheitlicher macht – getragen von erstklassiger Web-Technologie, sauberer Architektur, belastbarer Datenwahrheit und einem außergewöhnlich einfachen Nutzererlebnis.**

Und fachlich weiterhin:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**
