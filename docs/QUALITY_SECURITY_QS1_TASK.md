# Jetnity – QS-1 Trip-Workspace Integrationsaudit

Stand: 25. August 2026  
Status: **verbindlicher Audit-Auftrag / noch nicht ausgeführt**

## 1. Verantwortlicher Agent

Exakter Cursor-Anzeigename:

`Jetnity quality security audit`

Branch:

`audit/quality-security-trip-workspace-checkpoint`

Audit-Baseline:

`main` @ `bee9f653d7d83dfbafbf9b9c1da6385433071a4a`

Der Audit ist bewusst unabhängig vom laufenden TW-5-Branch. PR #66 / `feat/trip-workspace-tw5-item-gap-details` ist **nicht Audit-Ziel dieses Slices**. QS-1 prüft den bereits integrierten Checkpoint TW-1/TW-2/TW-4/TW-3 auf `main`.

## 2. Ziel

Nach dem erreichten Integrationscheckpoint

**TW-4 ✅ → TW-3 ✅ → Technical-Lead-Integrationscheckpoint**

führt die unabhängige QA-/Security-Instanz einen adversariellen, evidenzbasierten Integrationsaudit des bereits gemergten Trip Workspace durch.

Ziel ist nicht Feature-Entwicklung, sondern das frühe Auffinden von Regressionen, Security-/Privacy-Risiken, Truth-Drift, Accessibility-/Performance-Problemen, Robustheitslücken und unzureichender Testabdeckung, bevor weitere Workspace-Slices den Oberflächenzustand verändern.

## 3. Pflichtlektüre vor jeder Prüfung

Vollständig lesen:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
3. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
4. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
7. `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
8. `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
9. `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`
10. `docs/ADR_0165_TRIP_WORKSPACE_TW4_ATTENTION.md`
11. `docs/ADR_0166_TRIP_WORKSPACE_TW3_TIMELINE.md`
12. die zu TW-2/TW-4/TW-3 gehörenden Task-/Statusdateien und relevanten Tests.

Bestehende PASS-Berichte sind nur Evidence ihres Zeitpunkts. **Nicht blind übernehmen.**

## 4. Live-Rekonstruktion vor Audit

Vor der eigentlichen Prüfung selbst live verifizieren:

- aktuelles `main` und dessen SHA;
- dass PR #64 gemergt ist und TW-3 auf `main` liegt;
- eigener Audit-Branch und Merge-Base;
- offene PRs, insbesondere PR #66, nur zur Kollisions-/Parallelitätskontrolle;
- GitHub Actions des Audit-Baselines;
- Vercel-Status des Audit-Baselines, soweit verfügbar;
- offene Review-Threads/Blocker, soweit für die integrierte Baseline relevant.

Wenn `main` vor Beginn des eigentlichen Audits weitergelaufen ist, **STOPP und zuerst dem Technical Lead melden**. Nicht still auf einen anderen Baseline-Zustand wechseln.

## 5. Verbindlicher Scope

### A. Funktionale Regression / Product Truth

Prüfen, ob der integrierte Workspace:

- dieselbe kanonische Reise-/Graph-Wahrheit verwendet und keine zweite Timeline-/Coverage-/Attention-Wahrheit erzeugt;
- `unknown`, leer, nicht geplant, nicht nachgewiesen und bestätigt nicht vermischt;
- keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health oder erfundene Reise-/Transit-/Safety-Truth zeigt;
- `ohneTag`, leere Tage, verwaiste Referenzen und Graph-Mutationen deterministisch behandelt;
- Transit nicht fälschlich als Nutzer-Etappe erzeugt;
- keine stillen Airport-/Origin-/Passport-Defaults einführt.

### B. Security

Statisch und durch sichere lokale Prüfungen untersuchen:

- Client-/Server-Grenzen und unbeabsichtigte Datenexposition;
- unsichere URL-/Link-/Redirect-Nutzung;
- XSS-/HTML-Injection-Risiken, insbesondere bei nutzerkontrollierten Namen/Texten;
- unsichere Serialisierung, `dangerouslySetInnerHTML`, dynamische HTML-/Markdown-Pfade;
- Secret-/Token-/Service-Role-Leaks in Client-Code, Logs oder Fehlermeldungen;
- Auth-/Session-/Ownership-Annahmen an den Workspace-Rändern;
- gefährliche Mutation-/Delete-Pfade, fehlende Bestätigung oder falsche Ownership-Annahmen;
- Security-Header/CSP nur soweit der Workspace sie tatsächlich beeinflusst.

**Keine offensiven Tests gegen Production, keine destructive Calls, keine Secrets verwenden oder verändern.**

### C. Privacy / Ownership

Prüfen:

- Guest/Account-Presentation und Datenpfade ohne Cross-User-Leakage;
- keine sensitiven Traveller-/Dokument-/Identity-Daten in UI, Logs, URLs, Analytics oder Fehlermeldungen;
- keine stillen neuen Consent-/Tracking-/Attribution-Verträge;
- keine RLS-/Ownership-Umgehung oder neue Shared-Contract-Annahme.

### D. Accessibility / UX Robustness

Prüfen:

- Tastaturbedienung und sichtbarer Fokus;
- sinnvolle Semantik/Labels/ARIA;
- Fokusverlust bei dynamischer Timeline-/Attention-Aktualisierung;
- mobile/tablet/desktop fachlich gleiche Logik;
- 280px-/schmale Viewports, sehr lange Etappen-/Orts-/Item-Namen, Umbruch/Overflow;
- Empty/Error/Loading/Unknown-Zustände ohne irreführende Aussage;
- Delete-/Action-Bedienung ohne versehentliche Aktivierung benachbarter Controls.

### E. Performance / Reliability

Prüfen:

- unnötige Re-Renders oder doppelte fachliche Ableitungen;
- unkontrollierte Effects/Loops;
- unnötiges Eager-Mounting schwerer Such-/Provider-Flächen auf der integrierten Baseline;
- stabile Keys und deterministische Auswahl/Fallbacks;
- große Trip-Graphen und viele Tage/Items auf erkennbare algorithmische Hotspots;
- Fehler-/Null-/Partial-Data-Verhalten ohne Crash oder stille Wahrheitserfindung.

### F. Test- und Evidence-Audit

Unabhängig bewerten:

- ob die bestehenden TW-2/TW-4/TW-3-Tests die dokumentierten Acceptance Criteria tatsächlich abdecken;
- welche kritischen Pfade nur indirekt oder gar nicht getestet sind;
- ob Browser-/Workspace-Audit und Unit-Tests unterschiedliche Lücken haben;
- ob relevante negative/adversariale Fälle fehlen.

## 6. Harte Non-Scope-Grenzen

QS-1 darf **nicht**:

- TW-5 implementieren oder PR #66 verändern;
- Runtime-/Feature-Code reparieren;
- Shared Contracts ändern;
- DB/Migration/RLS/Auth/Identity/Traveller/Route neu modellieren;
- Provider aktivieren, Secrets hinzufügen oder paid calls ausführen;
- Production verändern;
- Homepage/Growth/Admin/Native-Funktionen entwickeln;
- Guardian/Simulator/Value bauen;
- neue öffentliche Claims einführen;
- eigenmächtig einen gefundenen P0/P1 im Runtime-Code beheben.

Ein Befund wird dokumentiert und dem Technical Lead zur Owner-/Slice-Entscheidung übergeben.

## 7. Befundklassifikation

Jeder echte Befund erhält:

- **P0** – unmittelbarer kritischer Security-/Privacy-/Datenintegritäts-/Production-Risk;
- **P1** – Merge-/Weiterbau-Blocker oder schwerer funktionaler/Truth-/Security-/Accessibility-Defekt;
- **P2** – relevanter Defekt mit kontrollierbarem Risiko, zeitnah zu beheben;
- **P3** – Polish/Härtung/Testverbesserung ohne aktuellen Blocker.

Für jeden Befund dokumentieren:

1. Titel und Severity;
2. konkrete Datei/Funktion/Zeile oder UI-Pfad;
3. reproduzierbare Evidence;
4. erwartetes vs. tatsächliches Verhalten;
5. Risiko/Impact;
6. betroffener Contract/Surface;
7. empfohlener Owner/Workstream;
8. ob TW-5 dadurch blockiert wird.

Keine spekulativen Findings ohne Evidence.

## 8. Auszuführende Gates

Mindestens, soweit im Repository verfügbar:

- gezielte TW-2/TW-4/TW-3-Tests;
- `npm test`;
- Typecheck;
- Lint;
- Production Build;
- `npm run audit:trip-workspace`;
- aktuelle relevante Hygiene-/Security-Checks aus `package.json`/CI.

Fehlschläge nicht wegfiltern. Exakte Commands, Counts und Exit-Status dokumentieren.

## 9. Deliverables

Auf diesem Branch erstellen/aktualisieren:

- `docs/QUALITY_SECURITY_QS1_AUDIT.md` – vollständiger unabhängiger Auditbericht;
- `docs/QUALITY_SECURITY_QS1_STATUS.md` – kompakter operativer Status und Evidence;
- falls nötig ausschließlich zusätzliche **Audit-Dokumentation**, kein Runtime-Fix.

Der Auditbericht enthält auch ausdrücklich einen Abschnitt **“No finding / geprüft und unauffällig”**, damit sichtbar bleibt, welche kritischen Kategorien tatsächlich untersucht wurden.

## 10. STOPP-Punkt

Nach Audit, Self-Review und vollständiger Evidence:

**STOPP.**

- kein Ready;
- kein Merge;
- keine Runtime-Korrektur;
- kein TW-5-Eingriff;
- keinen anderen Agenten starten.

Danach führt ChatGPT / Technical Lead den unabhängigen Review des QS-1-Berichts und der Evidence durch und entscheidet, welche Findings ggf. als eigene kontrollierte Slices an welchen Owner gehen.
