# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34** https://github.com/Jetnity/jetnity/pull/34
- Implementierungs-Head: `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f`
- zuletzt vollständig verifizierter Code-/CI-/Preview-Head: `be94305b22e8455ad3721f3bb1c5f72fe3d2635e`
- danach Docs-/Governance-/Review-Commits; aktuellen Branch-/PR-Head vor jeder weiteren Arbeit erneut über GitHub verifizieren
- Status: **Human-/Architecture-Review hat einen verbindlichen Correctness-Blocker gefunden; Fix offen**
- Merge: **nicht freigegeben**, PR bleibt Draft

## 2. Ziel

Eine Route, eine strukturierte Wahrheit. Länder nur aus belastbaren Airport-/Itinerary-Referenzen. Kein Raten aus Ortsnamen.

## 3. Bereits umgesetzt

- `lib/route/` als provider-neutrale Route-Facts-Domäne
- Persistenz in vorhandenem `trip_items.metadata`, bislang ohne neue Production-Migration
- `routeFactsAusReise()` liefert `flight_itinerary` bei gültiger Itinerary
- Readiness wird bei Transitänderung stale
- Flug-UI progressiv, Übersicht dezent
- Reiseänderung nennt Transitwechsel
- UI-Audit-Fixtures für Direktflug / 1 Transit / 2 Transits
- Fachdokumente, ADR-0108-Nachzug, ADR-0112

Route Facts sind traveller-neutral. Sie setzen keine einzelne Staatsbürgerschaft voraus und können später dieselbe Route gegen mehrere Traveller-/Credential-Profile auswerten.

## 4. Human-/Architecture-Review – BLOCKER

Verbindlicher Review-Nachtrag:

- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`

Der ursprüngliche Foundation-D-Task verlangt ausdrücklich:

> Route-/Transit-Information darf bei Guest → Account nicht verloren gehen oder doppelt entstehen.

Der aktuelle Nachlauf `flugRoutenInReiseSchreiben()` kann Select-/Update-Fehler still schlucken. Dadurch kann eine Account-Reise erfolgreich angelegt erscheinen, obwohl eine im Guest-Entwurf vorhandene `routeItinerary` nicht persistiert wurde.

Das ist **kein späteres Nice-to-have**, sondern ein Correctness-/Truth-Blocker innerhalb des bestehenden Foundation-D-Scopes.

Bevorzugte Lösung: Route-Itinerary atomar im bestehenden `reise_anlegen`-Transaktionspfad persistieren. Falls dafür die RPC/SQL-Funktion geändert werden muss: saubere Migration im Repository, nur Development anwenden, Production nicht migrieren. Eine Alternative ist nur zulässig, wenn sie keinen stillen Erfolg bei verlorenem Route-State erlaubt und Retry/Recovery idempotent löst.

## 5. Noch offen

- Review-Blocker aus `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md` umsetzen
- Pflicht-Regressionen für Guest → Account / Persistenzfehler / Retry ergänzen
- danach vollständigen DoD-Lauf erneut ausführen
- Human-/Architecture-/UX-/Security-Re-Review gegen den neuen Head
- Product Owner erhält danach erneut Ergebnis/Nutzerwirkung und kann weitere Änderungen verlangen
- ausdrückliche Product-Owner-Merge-Freigabe bleibt erforderlich
- kein Timatic, kein echter Provider, keine Production-Migration
- **separater zukünftiger Readiness-/Traveller-Context-Schritt vor echter Requirements-Provider-Aktivierung:** Mehrfachstaatsbürgerschaften und mehrere Reisedokumente als 1:n-Modell; nicht still in Foundation D hineinmigrieren

## 6. Letzte relevanten Änderungen / Entscheidungen

### Globale Traveller Context Intelligence Policy

Der Product Owner hat verbindlich entschieden:

> **Traveller Context Intelligence muss bei jeder relevanten Jetnity-Funktion berücksichtigt werden.**

Global verbindlich auf `main`:

- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `.cursor/rules/jetnity-traveller-context.mdc`

Foundation-D-spezifisch:

- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md`

Konsequenz: Keine relevante Funktion darf still nur eine Staatsbürgerschaft / einen Pass / ein Credential als universelle Dauerannahme verwenden, wenn mehrere rechtlich nutzbare Optionen das Ergebnis verändern können. Wo Traveller-Kontext nicht relevant ist, sollen keine unnötigen Daten erhoben werden.

### Merge-Gate

Technisch fertig = review-bereit. **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**

### Progress Persistence

Jeder relevante Fortschritt, Blocker, Review-Fund, Test-/CI-/Preview-Stand und nächste Schritt muss versioniert werden.

### Expert Proactivity

Global verbindlich: `docs/EXPERT_PROACTIVITY_POLICY.md`. Foundation-D-Nachtrag: `docs/CURSOR_ROUTE_TRANSIT_EXPERT_PROACTIVITY_AMENDMENT.md`. Senior Expert Pass siehe `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`.

### Human Review

ChatGPT stuft Senior-Expert-Fund 1 höher ein als der Cursor-Abschlussbericht: Weil Guest-/Account-Parität ausdrücklich Teil des ursprünglichen Tasks ist, muss der stille Route-Verlust **vor Merge** behoben werden, nicht erst irgendwann vor Production.

Senior-Expert-Fund 2 (Gesamt-Destination bei späterem Open-Jaw/Multi-City) und Fund 3 (zeitabhängiger Connection-Risk-Fingerprint) bleiben bewusst spätere Fachblöcke und sind kein PR-#34-Blocker.

## 7. Tests / CI / Preview

Letzter vollständig dokumentierter Foundation-D-Nachweis vor dem Human-Review-Fix:

- `npm test`: 1271 pass / 0 fail
- Typecheck, Lint, Hygiene: grün
- Production Build: grün
- `auth:pruefen`: 55/55
- Trip Workspace Audit: 726 Kombinationen, 0 Fehler, WebKit + Chromium
- Vercel Preview READY für `be94305b`: https://jetnity-pzrwyzdix-jetnity-e1b93c82.vercel.app
- GitHub Actions CI **success** auf `be94305b`: https://github.com/Jetnity/jetnity/actions/runs/32573631017
- Draft-PR #34 war auf diesem Head mergeable / CLEAN; das ist keine Merge-Freigabe

**Diese Nachweise reichen nach dem verlangten Persistenz-Fix nicht mehr als finaler DoD-Nachweis.** Nach Code-/RPC-/Migration-Änderungen müssen relevante Tests, CI und Preview gegen den neuen Head erneut grün sein.

## 8. Datenbank / RLS / Production

Aktuell vor Review-Fix:

- keine neue Foundation-D-Production-Migration
- Production-Schema unverändert
- Traveller-Schema in Foundation D nicht angefasst
- RLS bleibt Eigentümergrenze von `trip_items`

Für den Review-Fix gilt:

- wenn `reise_anlegen` / RPC geändert wird, Migration sauber versionieren;
- nur Development anwenden und dort verifizieren;
- relevante Rechte/RLS/Security-/Function-Grenzen erneut prüfen;
- **Production nicht migrieren** ohne separate Freigabe.

Aktuelles Foundation-C-`trip_travellers`-Schema hat weiterhin nur ein singuläres `nationality_country_code` + ein Dokumentprofil; das ist ein Übergangsmodell und kein langfristiges Architekturmandat. Multi-Citizenship / Multi-Document braucht später einen separat reviewten 1:n-Ansatz.

## 9. Kosten / Provider / Secrets

- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert

## 10. Bekannte Risiken / spätere Expert-Funde

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- Official Transit bleibt ohne Provider `unknown`
- echter Requirements-Provider darf nicht produktiv aktiviert werden, bevor Multi-Citizenship / mehrere Credential-Profile fachlich und providerseitig geklärt sind
- Gesamt-Destination-Regel vor First-Class-Multi-City/Open-Jaw explizit am Graphende definieren
- zeitabhängiges Connection-Risk später in eigene Logik/Fingerprint aufnehmen, nicht die Readiness-Route-Wahrheit damit vermischen

## 11. Offene Nutzerentscheidungen / Freigaben

- **Merge von PR #34 nicht freigegeben**
- Production-/Provider-/Kostenfreigaben getrennt und nicht erteilt
- Multi-Citizenship-/Multi-Document-Unterstützung ist verbindlich beschlossen
- globale Traveller-Context-Relevanzprüfung gilt für jede relevante neue/geänderte Funktion
- Review-Fix selbst liegt innerhalb des bereits freigegebenen Foundation-D-Scopes; eine mögliche Production-Anwendung einer RPC-Migration ist **nicht** freigegeben

## 12. Exakter nächster Schritt

Cursor-Agent:

1. aktuellen Branch/PR synchronisieren
2. `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md` vollständig lesen
3. Guest→Account-Route-Persistenz fail-safe/atomar korrigieren
4. notwendige Tests ergänzen
5. falls RPC/Migration berührt: nur Development anwenden und DB/RLS/Security verifizieren
6. vollständigen DoD-Lauf erneut durchführen
7. `docs/ACTIVE_WORK_STATUS.md`, Acceptance und relevante ADR/Architektur aktualisieren
8. PR Draft lassen, nicht Mark Ready, nicht mergen, Production nicht migrieren
9. Abschlussbericht mit Review-Fix-Nachweisen liefern

Danach führt ChatGPT den erneuten unabhängigen Human-/Architecture-/UX-/Security-Review durch.

## 13. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- `docs/CURSOR_ROUTE_TRANSIT_MERGE_APPROVAL_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_PROGRESS_PERSISTENCE_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/CURSOR_ROUTE_TRANSIT_EXPERT_PROACTIVITY_AMENDMENT.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` ADR-0108/0112
