# Jetnity – Technical-Lead Merge Autonomy Supersession

Stand: 26. August 2026; Nachtrag 28. August 2026  
Status: **26.-August-Merge-Autonomie bleibt gültig. Workflow, exklusive Ready-/Merge-Ausführung und Cursor-Grenze sind seit 28. August 2026 durch `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` präzisiert / teilweise superseded. Historischen 26.-August-Text nicht kosmetisch umschreiben.**

Nachtrag, 28. August 2026 – Product-Owner-Entscheidung:

- **Nur ChatGPT / Technical Lead** darf Ready setzen oder mergen.
- **Cursor-Agenten dürfen niemals Ready setzen oder mergen.**
- Ein normaler scope-treuer PR darf vom Technical Lead nur nach unabhängigem Exact-Head-Review und nur dann autonom gemergt werden, wenn der Technical Lead absolut überzeugt ist, dass dies die beste verantwortbare Entscheidung ist.
- Besondere Product-Owner-Gates bleiben unverändert.
- Verbindlicher Workflow: versionierter Task → Draft-PR → `@cursor` → unabhängiger Technical-Lead-Review → head-gebundene CHANGES REQUIRED → neuer Head + Re-Gating → PASS → Technical-Lead-only Ready/Merge → Post-Merge-Verifikation.

## 1. Aktuelle verbindliche Entscheidung

Der Product Owner hat am 26. August 2026 ausdrücklich entschieden:

> **ChatGPT / Technical Lead darf bei normalen, scope-treuen Jetnity-PRs selbst entscheiden, ob ein PR Ready gesetzt und gemergt wird.**

Diese Autonomie gilt **nicht blind** und nicht allein aufgrund grüner Automatisierung. Vor Ready/Merge muss der Technical Lead den tatsächlichen Stand unabhängig, skeptisch und vollständig prüfen. Wenn etwas nicht gut, unklar, unvollständig oder widersprüchlich ist, wird **nicht** gemergt. Der Technical Lead behebt es selbst oder gibt einen gezielten Korrekturauftrag an den zuständigen Cursor-Agenten; danach werden die relevanten Gates erneut auf dem neuen Exact Head ausgeführt und der Change erneut unabhängig geprüft.

Diese Entscheidung erweitert die Technical-Lead-Autonomie gegenüber der Merge-Governance vom 25. August 2026. Eine separate aktuelle Product-Owner-Freigabe pro normalem PR ist nicht mehr zwingend, solange kein besonderes Product-Owner-Gate betroffen ist und der Product Owner im konkreten Fall keinen Hold oder Änderungswunsch ausgesprochen hat.

## 2. Pflichtprüfung vor jedem Ready/Merge

Vor jedem eigenständigen Ready/Merge muss ChatGPT / Technical Lead mindestens:

1. vom kanonischen Startpunkt aus den aktuellen Produkt-, Architektur-, Governance- und Slice-Kontext lesen;
2. `main`, PR-Head, Merge-Base, Ahead/Behind und parallele PRs live verifizieren;
3. den **tatsächlichen Diff und die betroffenen Dateien** gegen Auftrag, Scope und Non-Scope prüfen;
4. nicht nur Testergebnisse, sondern auch die **Tests selbst** gegen den fachlichen Vertrag hinterfragen;
5. relevante Truth-, Privacy-, Security-, Auth-, RLS-, Traveller-, Route-, Provider-, Payment-, Attribution- und Shared-Contract-Grenzen prüfen;
6. Exact-Head CI / GitHub Actions prüfen;
7. Exact-Head Vercel Preview/Deployment prüfen;
8. relevante Supabase-/Migrationsstände prüfen, wenn der Slice Datenbank- oder Production-Bezug haben könnte;
9. offene Review-Threads, Blocker, P0/P1 sowie neue P2/P3-Findings prüfen und klassifizieren;
10. bei parallelen Workstreams Kollisionen, gemeinsame Dateien und Shared Contracts prüfen;
11. bei einem gefundenen Problem zuerst korrigieren lassen oder selbst korrigieren und anschließend **neu gaten / neu reviewen**;
12. erst danach eine dokumentierte Technical-Lead-Entscheidung `PASS`, `CHANGES REQUIRED`, `BLOCKED` oder `NO-GO` treffen.

Ein grüner Build, grüne Tests, `mergeable=true`, Vercel READY oder eine Agent-Aussage „fertig“ reichen **niemals allein**.

## 3. Wann der Technical Lead selbst mergen darf

Ein normaler PR darf eigenständig Ready gesetzt und gemergt werden, wenn:

- der Scope durch Produktplan / Build Order gedeckt ist;
- kein besonderes Product-Owner-Gate ausgelöst wird;
- keine ungeklärten P0/P1 oder sonstigen Merge-Blocker verbleiben;
- alle relevanten Exact-Head-Gates erfolgreich sind;
- Diff, Tests und fachliches Verhalten unabhängig geprüft wurden;
- keine stillen Shared-Contract- oder Scope-Erweiterungen vorliegen;
- Parallelität / Merge-Base / Integrationsstand sauber sind;
- der Technical Lead den Change fachlich und technisch verantwortet.

Der Technical Lead darf trotz grüner Gates bewusst **nicht mergen**, wenn weitere Prüfung, eine Korrektur, ein Product-Owner-Produktentscheid oder ein unabhängiger Quality/Security-Checkpoint sinnvoll ist.

## 4. Besondere Product-Owner-Gates bleiben unverändert

Weiterhin ist vor der betreffenden Aktion eine ausdrückliche Product-Owner-Entscheidung erforderlich bei insbesondere:

- Production-Migrationen oder destruktiven / schwer rücknehmbaren Production-Datenänderungen;
- großen produktiven RLS-/Ownership-/Identity-Vertragsänderungen;
- fundamentalen Auth-/Session-/MFA-/AAL-Änderungen;
- neuer Speicherung besonders sensitiver Pass-/MRZ-/Biometrie-/Dokumentdaten;
- neuer sensibler externer Datenweitergabe;
- realen Providerverträgen, Production-Secrets oder paid calls;
- realen Payments / Geldbewegungen;
- neuen laufenden Kosten über dem vereinbarten Grenzwert von USD 100 pro Monat;
- fundamentalen Produkt-, Geschäftsmodell- oder Build-Order-Änderungen;
- Public Launch, realer Provider-Live-Schaltung, Store-/Production-Großaktivierung oder vergleichbaren extern bindenden Schritten.

Merge-Autonomie hebt diese besonderen Gates nicht auf.

## 5. Product-Owner-Hold und Änderungswünsche

Der Product Owner kann jederzeit für einen konkreten PR oder Workstream einen Hold setzen oder Änderungen verlangen. Dann wird nicht gemergt, bis die Änderung umgesetzt und erneut sauber geprüft ist.

Wenn der Product Owner ausdrücklich sagt, dass ein bestimmter PR vor Merge nochmals gezeigt werden soll, gilt diese konkrete Anweisung für diesen PR.

## 6. Parallel-Agenten-Regel

Der Technical Lead darf mehrere Cursor-Agenten parallel aktivieren, wenn ihre Arbeit konfliktarm getrennt ist.

Pflicht dabei:

- eigener Branch / eigener Draft-PR / eigener Task und Status je Workstream;
- keine gemeinsame Änderung an `docs/ACTIVE_WORK_STATUS.md` durch mehrere Agenten gleichzeitig; zentrale Continuity wird durch ChatGPT / Technical Lead integriert;
- keine stillen Shared-Contract-Änderungen;
- Runtime- und Audit-only-Slices klar trennen;
- jeder Agent endet mit `STOPP` und startet keinen Folgeslice selbstständig;
- Technical Lead prüft jeden Agenten-Change unabhängig vom kanonischen Startpunkt aus.

## 7. Vorrang / Supersession

Für Ready/Merge gilt ab dem 28. August 2026 folgende Priorität:

1. die **aktuellste ausdrückliche Product-Owner-/Nutzerentscheidung**;
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`;
3. dieses Dokument, soweit nicht durch das Operating Standard präzisiert/superseded;
4. besondere Production-/Kosten-/Provider-/Payment-/Sensitive-Data-/Auth-/Launch-Gates;
5. übrige Governance-/Autonomie-/Workflow-Dokumente.

Diese Datei superseded für normale PRs die frühere per-PR-Merge-Pflicht aus:

- `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`;
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`;
- `docs/CHATGPT_CURSOR_WORKFLOW.md`;
- widersprechenden Ready-/Merge-Passagen in Handoffs, Statusdateien, Tasks, ADRs und älteren Autonomie-Dokumenten.

Die früheren Dokumente bleiben historische Evidence ihrer damaligen Product-Owner-Entscheidung. Ihre per-PR-Merge-Pflicht ist durch diese spätere Entscheidung nicht mehr die aktuelle Regel.

## 8. Nach dem Merge

Nach jedem Merge:

- neuen `main` live verifizieren;
- Production-/Preview-Deployment prüfen;
- relevante Continuity / Checkpoints nachziehen;
- offene Risiken und nächsten kontrollierten Slice aktualisieren;
- keinen neuen Runtime-Slice aus veralteten Handoffs starten.

## 9. Merksatz

> **Autonom mergen ist erlaubt – blind mergen ist verboten. Erst unabhängig hinterfragen, korrigieren, neu gaten und verantworten; dann entscheidet der Technical Lead.**
