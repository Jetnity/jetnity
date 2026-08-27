# ChatGPT / Technical-Lead New-Chat Checkpoint — 27. August 2026

Status: **PR #94 Visitor Search UX ist nach unabhängigem Technical-Lead-PASS integriert. Dieser Checkpoint ist jünger als Statuszeilen in älteren Handoffs/Task-Dateien und gewinnt zusammen mit Live-Evidence.**

> Live-Evidence gewinnt immer. Kein SHA, PR-, CI-, Vercel-, Supabase- oder Production-Zustand aus diesem Dokument darf in einem neuen Chat ungeprüft als weiterhin aktuell angenommen werden.

## 1. Letzter verifizierter `main`

Nach Merge von PR #94:

- `main`: `819715b1567417893d894b7b110eff1a2ab6cded`
- Merge-Commit: `819715b1567417893d894b7b110eff1a2ab6cded`
- PR #94 finaler Exact Head: `8da869fd2756f3c1514de6d33678c8c7abfad1c4`
- PR #94 Base / Merge-Base vor Merge: `b76148e533fb0758c0197d0e0252624bb869cdb5`
- Ahead / Behind vor Merge: `4 / 0`
- PR #94 war mergeable und hatte keine offenen Review-Threads.

Exact-Head Evidence vor Merge:

- GitHub Actions `pull_request` Run `33066516282`: **SUCCESS**
- Vercel Exact-Head Deployment `CBuVobvymHT9m7A4uUKmb2exU4PU`: **SUCCESS**
- lokal laut Agent: 2296 Tests PASS; Typecheck/Lint/Hygiene/Production-Build PASS

Unabhängiger Technical-Lead-Finalreview:

- vorheriger Review `5040068359`: CHANGES REQUIRED
- Findings: P1 nested interactive control in `role="option"`; P2 stale/aborted request could Loading/Result/Error der aktuellen Suche überschreiben
- finaler TL-Review `5040199350`: **PASS** auf `8da869fd...`
- GitHub ließ kein formales `APPROVE` durch denselben Repository-Account zu (`Can not approve your own pull request`); deshalb ist der TL-PASS als COMMENT-Review dokumentiert. Das ist kein fachlicher Blocker.

Post-Merge Evidence auf `main` `819715b...`:

- GitHub Actions push Run `33067498607`: **SUCCESS**
- Vercel Production/Main Deployment `GrD4MaYqtnR9UL619gVnKx9HSUmH`: **SUCCESS**

`main` Branch Protection war beim Post-Merge-Check weiterhin **nicht aktiviert** (`protected=false`). Das bleibt ein Governance-Risiko.

## 2. Was PR #94 fachlich integriert hat

Visitor Search UX ist jetzt auf `main`:

- Reiseziel / Abreise verwenden natürliche Ortsnamen und wenige relevante Vorschläge statt langer schwacher Listen.
- Ranking ist allgemein, nicht Peru-/Zürich-hardcodiert: Exact > starker Prefix > qualifizierte/weitere Treffer; Rolle `ziel` / `abreise` wird berücksichtigt.
- echte gleichnamige Orte bleiben mit Region/Land unterscheidbar.
- kanonische Wahrheit bleibt Place-ID; Freitext wird nicht still zu einer Place-ID.
- Workspace Flight `Von` / `Nach` verwenden natürliche Flughafen-/Stadtnamen und IATA als Combobox.
- ausgewählt/persistiert bzw. an die Flugsuche übergeben wird nur listenbestätigte IATA-Wahrheit.
- Freitext wie `ZRH` oder ein unbekannter Drei-Buchstaben-String wird ohne Listenauswahl nicht still als bestätigte IATA behandelt.
- Trip-Origin/-Destination werden nur aus `airport:XXX` als Flughafen vorausgefüllt; eine bloß bewiesene Stadt erzeugt keinen geratenen Flughafen.
- Listbox-Semantik: `role="option"` ist selbst die Interaktion, kein nested `<button>`.
- Rapid-Typing-/Abort-Races sind mit einer Current-Request-Generation abgesichert.
- keine Migration, kein Production-Write, kein neuer Search-Provider, keine neuen laufenden Kosten, Commercial Truth unverändert.

## 3. Verbindliche Product-Owner-UX-Entscheidungen aus diesem Chat

Diese Entscheidungen sind für Folgearbeit wichtig:

1. **Tempo / Interessen sind beim Reise-Create keine verpflichtende Nutzerwahl.** Jetnity darf einen internen Kompatibilitätsdefault wie `balanced` nicht als vom Nutzer gewähltes `Ausgewogen` oder als Karte `Tempo & Interessen` darstellen. Ein tatsächlicher Freitext-Reisewunsch darf als `Reisewunsch` erscheinen; persistierte echte Interessen dürfen ohne erfundene Tempo-Behauptung gezeigt werden.

2. **Visitor Search muss für normale Reisende gebaut sein.** Keine Erwartung, dass Nutzer Flughafen-IATA-Codes oder interne IDs kennen. Vorschläge müssen kompakt, relevant und verständlich sein.

3. **Homepage-Hero-Design und Farben gefallen dem Product Owner und sollen grundsätzlich bleiben.** Die Funktion im bestehenden Hero-Kästchen soll später intelligenter werden: bereits auf der Startseite natürliche Reiseabsicht verstehen, inklusive mehreren Reisezielen/Route, ohne die Oberfläche zu überladen. Die Intelligenz soll am Entry Point beginnen; Design-Neubau ist dafür nicht gewünscht.

4. Die Homepage-Mehrziel-/Intent-Funktion wurde **noch nicht** als neuer Runtime-Slice implementiert. Sie muss in der Build-Reihenfolge sauber geschnitten und gegen Trip-Create-/Route-/Guest-Contracts geprüft werden; kein spontaner Mega-Umbau.

## 4. Trip Workspace Stand

Bereits integriert:

- TW-0 Audit / Zielarchitektur
- TW-1 Shell & Geräteparität
- TW-2 Reiseübersicht
- TW-3 Timeline / Etappe / Tag
- TW-4 Aufmerksamkeit / Jetzt wichtig
- TW-5 Item- und Gap-Details
- TW6-A Create Entry / Guest-One-Trip
- TW6-B Gate 0 / Provenance
- TW6-B Gate 0B / Zero-Stage Production Rollout Provenance
- PR #87 TW6-B Runtime + progressive weitere Ziele / Day→Stage Mode Contract + Workspace-Tempo-Wahrheit
- PR #94 Visitor Search UX

Production Gate A ist laut bisheriger Live-Evidence PASS.
Production Gate B wurde am 27. August 2026 mit Product-Owner-Freigabe ausschließlich über das geprüfte transaktionale Write-Gate-Playbook angewendet und anschließend vom Technical Lead als operativ PASS verifiziert. Vier-Datei-Vertrag:

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

Diese vergangene Freigabe war **keine** Freigabe für AAL2, Direction A, TW-7/8/9 oder beliebige andere Production-Migrationen.

## 5. Was im Workspace noch offen ist

Der Workspace ist weit fortgeschritten, aber nicht vollständig abgeschlossen.

Wesentliche verbleibende Blöcke laut Architektur/Build-Plan, jeweils vor Start live neu zu prüfen:

- **TW-7 Hub-/Account-Anschluss** — nur wenn Account-/Hub-Grenzen klar sind; AP-Verträge nicht überschreiben.
- **TW-8 Commercial Surfaces** — nur hinter Provider-S5- und realer Commercial-Provenance-Reife; keine Fake-Preise, keine erfundene Verfügbarkeit, keine Provider-Live-Aktivierung ohne Gate.
- **TW-9 Polish / Accessibility / Performance / Robustheit / Evidence Closure**.
- danach zwingend der **vollständige Function-by-Function-/Intelligence-Audit**; TW-0 bis TW-9 ersetzen diesen Abschlussaudit nicht.

Nicht automatisch einfach mit TW-7 oder TW-8 starten. Zuerst `docs/JETNITY_BINDING_BUILD_ORDER.md`, `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`, Dependency-Matrix und aktuellen Account-/Provider-Stand live gegen `main` prüfen.

## 6. Weitere offene / relevante Risiken

Vor neuer Priorisierung live verifizieren:

- `main` Branch Protection weiterhin möglicherweise `protected=false`.
- D0-P1-03 Legal-404 (`/privacy`, `/terms`) historisch offen.
- P2-TA-06 `documents[0]` / First-document-Semantik historisch offen.
- P2-TA-03 Account-Implementation-Plan / Account-Registry-Arbeit historisch offen.
- Admin-AAL2 Production-Datenebene weiterhin nicht ohne eigenes Product-Owner-Gate anwenden.
- S5-B / Provider-live weiterhin gated.
- Project Sanitation Audit PR #88 bleibt non-destructive Evidence; nichts daraus automatisch löschen/decommissionen.
- Homepage intelligent multi-destination / natural-intent entry ist Product-Owner-Wunsch, aber noch nicht als sauber gegateter Folge-Slice implementiert.

## 7. Offene PRs direkt nach PR #94 Merge

Live-Suche direkt nach Merge zeigte keine weitere operative Runtime-PR. Offen waren insbesondere:

- PR #88 — Project Sanitation Audit, non-destructive Evidence; kein Cleanup automatisch
- PR #52 — historischer/superseded ChatGPT-Handoff
- PR #50 — historischer Provider-Docs-Draft
- PR #40 — historischer Admin-Audit-Draft
- PR #39 — historischer Account-Audit-Draft
- PR #28 — historischer/superseded Collaboration-Draft; nicht wieder aufnehmen

Ein neuer Chat muss trotzdem die offenen PRs erneut live abfragen.

## 8. Cursor-Agent-Namen bleiben exakt

- `Trip workspace audit architecture`
- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`
- `Admin platform audit`
- `Jetnity growth discoverability`
- `Jetnity quality security audit`
- `Jetnity native app architecture` — reserviert für spätere Native-Phase

Kein Cursor-Agent startet selbstständig einen Folgeslice nach Abschluss seines Auftrags. Technical Lead prüft und steuert den nächsten Schritt.

## 9. Governance / Product-Owner-Gates

Weiterhin verbindlich:

> **Autonom mergen ist erlaubt. Blind mergen ist verboten.**

Normal scope-treue PRs darf der Technical Lead nach vollständigem independent Review, Diff-/Semantikprüfung, Exact-Head GitHub Actions und Vercel selbst Ready setzen und mit Expected Head SHA mergen.

Product-Owner-Freigabe bleibt zwingend insbesondere für:

- Production-Migrationen / destructive oder schwer reversible Production-Datenänderungen
- fundamentale RLS/Ownership/Identity-/Auth-/Session-/MFA-/AAL-Änderungen
- sensitive Passport/MRZ/Biometric-/Dokumentspeicherung
- sensitive externe Datenweitergabe
- echte Providerverträge, Production-Secrets, paid provider calls
- reale Payments / Money Movement
- neue laufende Kosten über USD 100/Monat
- fundamentale Produkt-/Business-/Build-Order-Änderungen
- Public Launch / Domain-Cutover / Provider-live / Store-/Production-Major-Aktivierung

## 10. Startanweisung für den neuen Chat

Der neue Chat übernimmt wieder vollständig die Rolle des übergeordneten Jetnity Technical Lead.

Vor neuer Arbeit:

1. `JETNITY_START_HERE.md` lesen.
2. diesen Checkpoint vollständig lesen: `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`.
3. die verbindlichen Governance-/Engineering-/Product-/Build-Order-Dokumente laut `JETNITY_START_HERE.md` lesen.
4. **Live rekonstruieren:** aktuelles `main`, offene PRs, Branches, CI, Vercel, relevante Supabase-/Production-Grenzen, Branch Protection.
5. Ältere Statuszeilen wie `Visitor Search UX ist offener Draft` oder `PR #94 nicht gemergt` als historische Evidence behandeln, falls Live-Evidence diesen Checkpoint bestätigt.
6. Danach **nicht automatisch einen neuen Workspace-Slice starten**. Zuerst den nächsten Build-Order-Schritt und die Abhängigkeiten entscheiden.
7. Besonders prüfen, wie der Product-Owner-Wunsch `intelligenter Homepage-Hero mit natürlicher Mehrziel-/Route-Eingabe bei unverändertem Design` sauber in die bestehende Create-/Trip-/Route-Architektur eingeordnet wird, ohne Scope-Creep oder zweite Wahrheit.

## 11. Empfohlener nächster Entscheidungs-Checkpoint

Nach Live-Rekonstruktion soll der Technical Lead eine kurze Priorisierungsentscheidung treffen:

- Was ist gemäß verbindlicher Build Order jetzt wirklich als Nächstes dran?
- Muss vor TW-7 zuerst Account-Arbeit geöffnet werden?
- Muss vor TW-8 Provider-/Commercial-Provenance weiter reifen?
- Kann ein kleiner Entry-Intelligence-/Homepage-Funktionsslice konfliktarm vorgezogen werden oder würde das Shared Contracts berühren?
- Welche P0/P1-Risiken müssen vorher geschlossen werden?

Erst danach Cursor-Agent auswählen und einen präzisen, begrenzten Auftrag erteilen.
