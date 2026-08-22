# Jetnity – verbindlicher Workflow zwischen Product Owner, ChatGPT, Cursor und Repository

Stand: 22. August 2026  
Status: **dauerhaft verbindlich für größere Jetnity-Arbeiten**

Dieser Workflow ergänzt `docs/CONTINUITY_STANDARD.md` und `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`. Ziel ist, dass Jetnity bei einem Wechsel von Chat, Cursor-Agent oder Sitzung ohne Wissensverlust exakt weitergeführt wird.

Pflichtquellen sind insbesondere:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `AGENTS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- relevante Fach-/Acceptance-Dokumente und aktuelle `docs/CURSOR_..._TASK.md`.

## 1. Rollen

### Product Owner / Nutzer

Der Nutzer trifft die verbindlichen Produktentscheidungen, Prioritäten und Freigaben. Er entscheidet insbesondere, ob eine Phase produktseitig wirklich abgeschlossen werden darf und ob ein konkreter Pull Request gemergt werden darf.

Der Nutzer soll bereits dokumentierte Projektstände, frühere Entscheidungen oder bekannte Blocker nicht erneut erklären müssen.

### ChatGPT

ChatGPT hält die übergeordnete Produkt-, Architektur-, Logic-, Security-, Kosten- und Review-Steuerung.

ChatGPT muss insbesondere:

- vor größeren Entscheidungen den tatsächlichen Repository-/PR-/CI-/Preview-/Development-/Production-Stand prüfen;
- neue Nutzerentscheidungen dauerhaft im Repository sichern;
- größere Cursor-Aufträge vollständig und reviewbar formulieren;
- Cursor-Ergebnisse anschließend unabhängig auf Code, Logik, Security, DB/RLS, Tests, CI, Preview, Kosten und Produktqualität prüfen;
- dem Nutzer vor einem Merge verständlich erklären, was gebaut wurde, was der Besucher sieht, welche Grenzen noch bestehen und welche Risiken/offenen Punkte verbleiben;
- dem Nutzer ausdrücklich Gelegenheit geben, vor dem Merge Änderungen oder Ergänzungen zu verlangen;
- **niemals einen PR ohne ausdrückliche aktuelle Merge-Freigabe des Product Owners mergen**;
- Handoff/Roadmap/Fachdokumente so aktuell halten, dass ein neuer Chat ohne Rätselraten übernimmt.

ChatGPT darf sich nicht allein auf Gesprächserinnerung verlassen. Wenn Erinnerung und Repository widersprechen, muss der reale technische Stand geprüft werden.

### Cursor / Coding Agent

Cursor ist der ausführende Hauptentwickler für größere Implementierungsblöcke und arbeitet nach dem versionierten `docs/CURSOR_..._TASK.md` sowie neueren verbindlichen Nachträgen.

Cursor muss:

- Pflichtlektüre und aktuellen Branch-/PR-/CI-Stand zuerst prüfen;
- vorhandene valide Architektur wiederverwenden und keine parallelen Mini-Systeme bauen;
- Implementierung, Tests, Security, DB/RLS, Browser-Audits, Build, CI, Preview und Dokumentation gemäß Auftrag abschließen;
- Abschlussberichte mit echten Nachweisen liefern;
- **keinen Merge durchführen**;
- keine Production-Migration, Provider-Aktivierung, Secrets oder kostenpflichtige Entscheidung ohne die dafür geltende Freigabe durchführen.

Technisch fertig bedeutet für Cursor **review-bereit**, nicht „darf gemergt werden“.

### GitHub-Repository

Das Repository ist das gemeinsame dauerhafte Gedächtnis und die technische Source of Truth. Produktmandat, Vision, Handoff, Roadmap, Architektur, ADRs, Logic-/Quality-/Continuity-/UX-Standards, Merge-Policy, Fachmodule, aktive Cursor-Aufträge, Nachträge und Acceptance-/Production-Nachweise müssen dort versioniert sein.

## 2. Start eines neuen größeren Arbeitsblocks

Vor Implementierung gilt:

1. ChatGPT prüft aktuellen Repository-, Branch-, PR-, CI-, Preview- und Production-Stand.
2. ChatGPT berücksichtigt Produktmandat, Vision, Handoff, Roadmap, Merge-Policy und relevante Logic-/Architektur-/UX-Quellen.
3. Nutzer und ChatGPT legen den nächsten fachlichen Block fest.
4. Der vollständige Cursor-Auftrag wird im Feature-Branch als `docs/CURSOR_<THEMA>_TASK.md` hinterlegt.
5. Der Draft-PR verweist auf diesen Auftrag.
6. Cursor arbeitet selbstständig innerhalb der dokumentierten Grenzen.

## 3. Neue Produktentscheidung während eines laufenden Jobs

Wenn der Nutzer eine Entscheidung ändert oder erweitert:

1. Entscheidung nicht nur im Chat belassen.
2. Als versionierten Task-Nachtrag, ADR, Fach-Dokument oder Handoff-Präzisierung sichern.
3. Klar markieren, welche neuere Quelle ältere Annahmen überschreibt.
4. Cursor synchronisiert den Branch und passt valide bestehende Arbeit an, statt unnötig neu zu beginnen.
5. Danach relevante Tests/CI/Preview erneut ausführen.

## 4. Verbindliches Merge-Gate des Product Owners

Die vollständige Regel steht in `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md` und hat für Merge-Entscheidungen Vorrang vor älteren allgemeineren Arbeitsfreigaben.

Verbindlicher Ablauf:

1. Implementierung im Feature-Branch.
2. PR bleibt während Implementierung und technischer Prüfung standardmäßig Draft.
3. Cursor liefert vollständigen technischen Abschlussbericht.
4. ChatGPT führt unabhängigen Human-/Architecture-/UX-/Security-Review durch.
5. ChatGPT erklärt dem Nutzer den realen Ergebnisstand und zeigt Preview/Nutzerwirkung soweit verfügbar.
6. **Der Nutzer entscheidet, ob noch Änderungen gewünscht sind.**
7. Bei Änderungen: nicht mergen; Änderung versionieren, umsetzen, erneut testen und reviewen.
8. Erst nach einer eindeutigen aktuellen Nutzerfreigabe wie „freigegeben“, „du kannst mergen“ oder „merge jetzt“ darf der konkret besprochene PR gemergt werden.

Nicht als Merge-Freigabe gelten:

- grüne Tests oder CI;
- READY Preview;
- positives ChatGPT-Review;
- Cursor meldet „fertig“;
- `mergeable=true`;
- frühere allgemeine Selbständigkeits-/Budgetfreigaben;
- Freigabe eines anderen PRs oder einer früheren Phase.

**Technisch fertig bedeutet review-bereit. Gemergt wird erst nach ausdrücklicher Freigabe des Product Owners.**

Eine Merge-Freigabe ist außerdem keine automatische Freigabe für Production-Migration, Provider-Aktivierung, Secrets, Verträge oder neue Kosten.

## 5. Abschluss eines größeren Arbeitsblocks

Vor produktseitigem Abschluss müssen die dauerhaften Projektquellen den tatsächlichen Stand spiegeln. Mindestens dokumentieren:

- umgesetzt / bewusst nicht umgesetzt;
- Branch / PR / Head / main;
- Development-/Preview-/Production-Status;
- Migrationen und RLS/Security;
- Tests, Browser-Audits, Build und CI;
- Kosten;
- externe Provider/API/Key-Abhängigkeiten;
- bekannte Risiken / technische Schulden;
- verbindliche Logic-/Truth-Regeln;
- nächste konkrete Aufgabe;
- noch erforderliche Nutzerfreigaben.

Eine Phase kann technisch review-bereit sein, ist aber **nicht als final abgeschlossen zu behandeln, solange die erforderliche Product-Owner-Freigabe für den Merge fehlt**.

## 6. Wechsel in einen neuen Chat

Ein neuer Chat muss zuerst aus dem Repository rekonstruieren, wo Jetnity steht. Er liest mindestens Produktmandat, Vision, Handoff, Roadmap, Architektur, Entscheidungen, Design-/Quality-/UX-/Logic-/Continuity-Standards, diesen Workflow und `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md` sowie den aktuellen offenen PR/Task.

Danach muss er unterscheiden können:

- was Jetnity ist und wohin es entwickelt wird;
- was bereits gebaut und gemergt wurde;
- was Draft/Preview/Development ist;
- was noch fehlt oder blockiert ist;
- welche Produkt-, Architektur-, Logic-, Security-, Kosten- und Merge-Regeln verbindlich sind.

Der Nutzer soll mit „Wir machen mit Jetnity weiter. Lies den Handoff.“ fortfahren können, ohne den Projektverlauf erneut zu erzählen.

## 7. Wechsel in einen neuen Cursor-Agenten

Ein neuer Cursor-Agent übernimmt den aktuellen Feature-Branch und den dort hinterlegten Auftrag. Maßgeblich sind die aktuellen versionierten Dateien und der reale Branch-/PR-Stand, nicht ein alter Chatprompt.

Die Merge-Policy ist für jeden neuen Agenten verbindlich. Zusätzlich existiert eine Always-Apply-Cursor-Regel unter `.cursor/rules/jetnity-merge-approval.mdc`.

## 8. Source-of-Truth-Priorität

Bei Widersprüchen gilt:

1. verifizierter aktueller Repository-/PR-/CI-/Production-Stand für Aussagen darüber, was tatsächlich existiert oder aktiv ist;
2. aktuelle ausdrückliche Product-Owner-Entscheidungen und daraus versionierte Policies/Tasks/ADRs;
3. `JETNITY_PRODUCT_MANDATE.md` und `JETNITY_VISION.md` für Produkt-/Qualitäts-Nordstern;
4. neuere Handoff-/Fach-/Architekturdokumentation;
5. ältere Repository-Dokumentation;
6. Chat-Erinnerung oder Agenten-Sitzungskontext.

Widersprüche werden bereinigt und dokumentiert, nicht still übergangen.

## 9. Kosten und Production

Bestehende Jetnity-Kosten- und Production-Grenzen bleiben verbindlich. Der Anspruch „Top-Technologie“ ist keine Freigabe für unnötig teure Infrastruktur.

Merge, Production und Kosten sind getrennte Gates. Eine Freigabe für einen Schritt impliziert keinen anderen.

## 10. Leitprinzip

> **Der Nutzer entscheidet das Produkt und den Merge. ChatGPT hält Produkt, Architektur, Logik, Security und Review zusammen. Cursor implementiert größere Blöcke. Das Repository hält das gemeinsame Gedächtnis und den überprüfbaren Projektstand.**

> **Jetnity soll die Nummer 1 werden, weil es Reisen einfacher, intelligenter, verlässlicher und ganzheitlicher macht – getragen von erstklassiger Web-Technologie, sauberer Architektur, belastbarer Datenwahrheit und einem außergewöhnlich einfachen Nutzererlebnis.**

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**
