## TASK DEV-PACKAGE-1 V3 — Owner-Korrektur: eine eindeutige amtliche Zielland-Primärquelle genügt

**8. November 2026. Verbindliche neue Owner-Steuerung nach Integration von V2 in #1160.** Diese Fassung ersetzt die Zwei-Quellen-Pflicht aus TASK V2 und sämtlichen davon abgeleiteten aktiven Plan-/Abnahmekriterien. V1/V2 bleiben historische Evidence ihrer damaligen Vorgaben und Prüfstände. #917/#1139 bleiben erster technischer Schritt.

### Exakter neuer Quellenvertrag

1. **Pflicht: eine amtliche Primärquelle des Ziellandes**, etwa zuständige Behörde, Botschaft oder Grenzpolizei.
2. **Wenn verfügbar:** Gegenprüfung mit einer unabhängigen amtlichen Quelle, etwa EDA, Auswärtiges Amt oder FCDO.
3. **Fehlt die zweite Quelle, wird trotzdem automatisch veröffentlicht**, sofern die erforderliche Zielland-Primärquelle für den relevanten Fakt und Kontext eindeutig ist.
4. **Nur echter Quellenwiderspruch oder eine unklare erforderliche Primärquelle** führt im fachlichen Quellenentscheid zu Nichtveröffentlichung und Eskalation an Sasa.

Ziel: möglichst wenige Blockaden, keine widersprüchlichen Angaben live. Eine fehlende, nicht passende oder aktuell nicht erreichbare optionale Gegenquelle darf nicht als versteckte Zwei-Quellen-Pflicht, automatisch unklare Primärquelle oder manueller Routinefall behandelt werden. Bekannte relevante tatsächliche Widersprüche dürfen dagegen nicht durch Weglassen der Gegenquelle oder pauschalen Vorrang der Primärquelle umgangen werden. Unterschiedliche Reise-/Gültigkeitskontexte sind nicht automatisch ein echter Widerspruch.

Diese Quellenregel ändert keine technischen Auth-/Integritäts-/Privacy-/Import-Grenzen und erlaubt keine Veröffentlichung bei ungesicherter Herkunft oder ungeklärter aktueller Aussage der Pflichtquelle. Die übrigen fünf Produktvorgaben bleiben unverändert verbindlich: strukturierte Fakten, automatische Pflege, ausschließlich Jetnity-eigener prüfender Import mit anbieterneutralen Research-Vorschlägen, schneller vorberechneter Cache mit Stand/Quelle und Datenschutz, automatische Recherche bei fehlender Kombination. Keine Owner-Einzelfreigabe für Routinefälle.

### Aktueller Stand / historische Abgrenzung

Main **1b96936f0159578c063992407c650a0995b60895**, Tree **b6f46ef0e4efc06e6fa772c4d364d12c3a6317e6**. #1160 ist seit 22:00:01 UTC gemergt; seine damalige V2-Abnahme war korrekt an den damaligen Auftrag gebunden und wird nicht umgeschrieben. PR-CI42526486852 SUCCESS; aktuelle main-CI42527963600 läuft noch. Production dpl_6bFparJ6HM5WT3HFDUwy4rQ3DpGc ist READY auf main1b96936 und jetnity.com dort gebunden. Kein Post-Merge-CI-PASS vorweggenommen.

Die neue Vorgabe supersediert die aktive Zwei-Quellen-Aussage sofort. Eine Dokumentkorrektur V3 wird als eigener scope-treuer Docs-PR vorbereitet; keine Produktimplementierung oder Datenbankaktion.

### Rollen und genaue Dateien

Derselbe Autor: **Jetnity Official Truth Dev Decision Package 1 — Codex Generation 1**, Session **/root/dev_package_writer**, neue Revision **V3/R0**. Dies ist eine Owner-Anforderungsänderung, kein nachträglich erfundener Fehler des damaligen V2-Auftrags.

Arbeitskopie: /workspace/scratch/e03d2839d4e5/dev-package-candidate-v3/docs/audits/official-truth-dev-package-1-2026-11-08/. Repositorypfad bleibt derselbe. Geplanter Branch: **docs/official-truth-dev-package-1-v3-20261108**, Basis aktuelles main1b96936.

Autor ändert ausschließlich DEV_PACKAGE.md, TARGET_EVIDENCE_MATRIX.json, POSTCHECK_AND_RECOVERY.md, HANDOFF.md und PRODUCT_TARGET_PLAN.md. Root besitzt SOURCE_MANIFEST.json, STAGE1_ACCEPTANCE_REPORT.md, REVIEW.md und die neue TASK_V3.md. TASK.md und TASK_V2.md bleiben byteidentische historische Auftragstexte. Final elf Dateien im Paket, davon voraussichtlich acht geänderte Dokumente plus neue TASK_V3.md; kein Produktcode/SQL/Migrations-/CI-/Governancediff.

### Verbindliche Akzeptanzkriterien V3

A. Alle aktiven Produkt- und Abnahmekriterien führen Pflichtquelle des Ziellandes plus optionale unabhängige amtliche Gegenprüfung. Keine neue versteckte Mindestzahl zwei, keine Sperre allein wegen fehlender Gegenquelle. Dies gilt schon für die erste öffentliche CH→DE-Regelantwort. CH→DE wird nicht erneut zur Grundsatzwahl gestellt.

B. Bisherige Behauptung „genau eine Stütze im Accepted Store erzwingt zwingend eine Mehrquellenmigration“ korrigieren. Der vorhandene TS-/SQL-Einquellenvertrag passt zur neuen Mindestanforderung; er beweist noch keine wirksame Installation, tatsächliche Zielland-Zuständigkeit, vollständige Eindeutigkeit oder fertige Methodenumsetzung.

C. Geplante optionale Gegenprüfung konkret an Fakten-/Methoden-/Regelversion binden: geprüfte Quelle und Zeitpunkt, normalisierter Kontext, tatsächliches Ergebnis beziehungsweise dokumentierter Nichtverfügbarkeitsgrund. Die vorhandenen genau-eins-Arrays nicht still mit zusätzlichen Stützen befüllen. Bevorzugt den einzelnen verbindlichen Primärbeleg beibehalten und eine getrennt versionierte, annahme-/rückzugsrelevante Gegenprüfungs-Evidence ergänzen; genaue Speicher-/Proof-Änderung bleibt später zu prüfen. Kein zwingender Mehrstützen-Umbau ausschließlich für den Normalfall ohne zweite Quelle.

D. Tatsächlicher Widerspruch bei gleichem Fakt/Kontext/Gültigkeitsbezug blockiert beziehungsweise zieht die betroffene öffentliche Version zurück und eskaliert. Keine Mehrheitsentscheidung, keine versteckte Abschwächung durch bloßes Weglassen bekannter Gegen-Evidence. Fehlende Gegenprüfung und unklare Pflichtquelle sind getrennte Zustände. Rechercheumfang/Verfügbarkeit muss nachvollziehbar und begrenzt geplant sein, ohne jeden möglichen globalen Gegenbeleg erschöpfend suchen zu müssen.

E. Spätere Tests enthalten mindestens: klare zulässige Primärquelle ohne zweite Quelle erfolgreich; mit übereinstimmender Gegenquelle erfolgreich; optionale Quelle fehlt/nicht erreichbar ohne automatische Sperre; echter relevanter Widerspruch blockiert; unklare Primärquelle blockiert auch mit klarer Sekundärquelle; anderer Kontext ist kein automatisch echter Widerspruch. Technische Integritäts-/Auth-/Privacy-Gates bleiben erhalten. Neue Pflichtquellenklarheit wird nicht behauptet, nur weil ein vorhandener Store genau einen Eintrag akzeptiert.

F. Genau eine spätere neue Methodenentscheidung D1 bleibt: konkrete Quellenqualifikation/Ziellandzuständigkeit, Eindeutigkeit/Widerspruchsvergleich, praktikable Gegenprüfung und belegter Betriebsrahmen. Die jetzt entschiedene Einquellenregel nicht erneut zur Freigabe vorlegen. Budget/Frische/Eskalationskanal/SLO bleiben konkrete Vorschläge beziehungsweise frühere gesonderte Gates, keine Einzelregelfreigaben.

G. 28 Dev-Zielpunkte, Run2-Teilbelege, historische Lücke, 27 echte native Kandidatenfälle, #1139-Source-Reuse, besondere Plattform-/Auth-/DB-Gates und R0–R8-Recovery bleiben sachlich unverändert. Stage1-Gesamtabnahme nicht erfinden. Neue Vorgabe löst weder fehlenden Ledger noch aktuelle Ziel-/Recoverybedingungen. Kein neuer Blocker für den engen #1139-Fix.

H. Root und beide unabhängigen Reviewer prüfen neue V3-Bytes. V2-Hashes/PASS werden nicht übertragen. Nach Freeze vollständige Inhalts-/Diffprüfung, neue Exact-Head-CI/Preview-/Thread-Gates und gegebenenfalls autonome reine Docs-Integration mit Post-Merge-Verifikation.

### STOP

Nur Repository-/vorhandene Artefakte und lokale Offline-Analyse. Keine SQL-/DB-/Auth-/Credential-/Hosted-Inventur, kein Ersatzweg für den historischen #917-Readback, keine Provider-/Schedule-/Produktaktivierung. Normale automatische Docs-PR-CI separat am tatsächlichen Head bewerten. Root allein Ready/Merge. Kein automatischer Produkt-Folgeslice.

**Writer: do not mark Ready; do not merge; do not start a follow-up slice. RETURN/STOP nach fünf eingefrorenen Autorendateien.**

