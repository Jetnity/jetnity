# Jetnity – TW-2 Reiseübersicht – kontrollierter Implementierungsauftrag

Stand: 25. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw2-overview`  
ADR: `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`  
Status: **vorbereitet; Runtime-Implementierung noch nicht gestartet**

## 1. Auftrag

Implementiere ausschließlich **TW-2 – Reiseübersicht** auf Basis des gemergten TW-1.

Produktziel:

> Ein Nutzer soll in den ersten Sekunden verstehen, was diese Reise ist, wann und wohin sie geht, wie viele Personen betroffen sind und welche wesentlichen Reisebereiche bereits abgedeckt bzw. noch offen sind – ohne Dashboard-Gefühl und ohne neue Wahrheit zu erfinden.

## 2. Pflichtlektüre

Vor Code mindestens lesen:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `docs/ADR_0163_TRIP_WORKSPACE_TARGET_IA.md`
- `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `docs/ACCOUNT_AP3_TASK.md`
- `docs/TRAVELLER_CONTEXT.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`

Vor dem ersten Runtime-Commit `origin/main` live prüfen. Branch-Basis bei Vorbereitung: `5eed1baf01b3dc787269bb94f9bd23358a17d983`. Falls `main` weitergelaufen ist: kontrolliert synchronisieren, dann erst implementieren.

## 3. In Scope

### 3.1 Reise-Kopf / Identität

Die Reise-Ebene soll kompakt und verständlich zeigen, soweit aus vorhandenen Daten belegbar:

- Titel / Ziele bzw. Etappen in Nutzersprache
- Zeitraum
- Anzahl/Personenkontext aus vorhandener `party[]`-Wahrheit
- Ablagekontext Gerät/Konto, falls bereits vorhanden

Keine Traveller Registry und keine Citizenship-Annahme.

### 3.2 Abgeleitete Übersicht / Coverage

Vorhandene, kanonische Ableitungen dürfen zu einer kompakten Übersicht verdichtet werden, insbesondere:

- Flight-Abdeckung aus bestehender Flug-Coverage
- Unterkunft-Abdeckung aus bestehender Nacht-Coverage
- Aktivitäten aus dem Reisegraphen
- Mobilität / Mietwagen aus bestehenden Mobility-/Rental-Ableitungen
- Tagesplan/Planpunkte aus bestehendem Graphen

Wichtig: keine zweite Berechnungslogik bauen, wenn eine bestehende Fachableitung bereits existiert.

### 3.3 Ableitender Reisezustand

Ein visueller Gesamt-/Fortschrittshinweis darf nur als **Presentation-Derivation** entstehen.

- kein neuer persistierter `trips.status`
- kein neuer Lifecycle-Enum als kanonische Wahrheit
- AP-3-Date-only-Logik nicht widersprechen
- undatierte Reise niemals automatisch vergangen/abgeschlossen nennen
- Booking-Coverage nicht mit Reise-Lifecycle verwechseln
- `unknown` nicht als erledigt zählen

Wenn eine saubere Ableitung ohne neuen Shadow-Lifecycle nicht möglich ist: STOPP und Technical Lead informieren.

### 3.4 UX-Hierarchie

- dieselbe Produktlogik auf Mobile/Desktop aus TW-1 beibehalten
- Reise-Kopf und Overview stärker auf die ersten Sekunden optimieren
- Pace/Interessen nach hinten stufen
- keine Feature-Wand
- bestehende Domain-Bereiche bleiben erreichbar
- kein `Jetzt wichtig` vorziehen

## 4. Explizit nicht in Scope

Nicht implementieren:

- TW-3 Timeline
- TW-4 `Jetzt wichtig` / Attention
- TW-5+
- Safety-/Seasonal-Orchestrierung
- globales Safety-/Seasonal-„alles gut“
- Create-Flow / `/planen` / Multi-Destination
- Account AP-4 oder Traveller Registry
- Provider S4 / Live Provider / neue Suche
- Admin Slice D
- DB/Schema/Migration/RLS/Auth/MFA/AAL/Service Role
- neue Citizenship-/Document-Modelle oder Defaults
- Route-Truth-Vertragsänderung
- neue Secrets/API-Keys/Verträge/paid calls
- Homepage/Marketing
- Production-Migration

## 5. Truth-/Security-Regeln

Unverändert verbindlich:

- `unknown` bleibt `unknown`.
- Error ≠ Empty ≠ Stale ≠ Unavailable ≠ ungeprüft ≠ clean.
- kein Browser-/LLM-Wert wird Hard Truth.
- mehrere Citizenships/Dokumente nicht auf `[0]` oder Standard-Pass reduzieren.
- Guest/Account gleiche fachliche Reise bei gleichem Graphen.
- Ownership/RLS/Auth bleiben unverändert.
- kein neuer Schattenstatus.

## 6. Akzeptanzkriterien

TW-2 ist reviewbereit, wenn:

1. Ein Nutzer erkennt auf Mobile und Desktop schnell Reiseidentität, Zeitraum/Ziele und vorhandenen Personenkontext.
2. Wesentliche Coverage ist kompakt sichtbar, ohne alle Domain-Details gleichzeitig zu zeigen.
3. Jede Coverage-Zeile nutzt bestehende kanonische Ableitungen oder klar belegbare Graphdaten.
4. Kein neuer `trips.status`, keine neue DB-Wahrheit, kein Shadow-Lifecycle.
5. AP-3-Lifecycle wird nicht widersprochen.
6. Guest und Account liefern bei gleichem Graphen dieselbe fachliche Übersicht.
7. Safety/Seasonal ohne Evaluation wird nicht als clean oder geprüft dargestellt.
8. Multi-Citizenship-/Document-Verträge bleiben unangetastet.
9. Domain-Funktionen aus TW-1 bleiben erreichbar.
10. Keine DB/RLS/Auth/Provider/Secret/Kostenänderung.
11. Pace/Interessen sind sekundär, nicht die primäre Reiseidentität.
12. Diff bleibt TW-2-spezifisch.

## 7. Pflicht-Tests / Gates

Mindestens:

- Unit-Tests für neue Overview-/Kopf-Ableitungen
- Fixtures: datierte Reise, undatierte Reise, teilweise Coverage, vollständiger als belegbar, Unknown-Fälle
- Guest-vs-Account: gleicher Graph → gleicher fachlicher Overview-Text
- keine Lifecycle-Regressions gegen AP-3-Date-only-Regeln
- keine Multi-Citizenship-Regression
- Workspace-Geräteparität auf Smartphone/Tablet/Laptop/Desktop
- Domain-Navigation weiterhin erreichbar
- Typecheck
- Lint
- vollständiges `npm test`
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:setup:ci`
- Production build
- `audit:trip-workspace` ergänzend
- GitHub Actions SUCCESS auf Exact Head
- Vercel SUCCESS/READY auf demselben Exact Head

Keine alten grünen Runs auf neue Heads übertragen.

## 8. Arbeitsweise

1. aktuellen `main` verifizieren/synchronisieren
2. Ist-Code und bestehende Ableitungen prüfen
3. kleinste saubere TW-2-Lösung implementieren
4. Tests erweitern
5. adversarial Self-Review: Truth, Lifecycle, Guest/Account, Multi-Citizenship, A11y, Device Parity, Scope
6. vollständige lokale Gates
7. Draft-PR aktualisieren
8. Exact-Head CI/Vercel abwarten
9. Status/Handoff persistieren
10. STOPP für unabhängigen ChatGPT/Technical-Lead-Review

## 9. Autonomie / besondere Gates

Dieser normale Slice ist durch die verbindliche Build-Reihenfolge autorisiert. Bei sauberem PASS darf ChatGPT/Technical Lead nach `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md` Ready/Merge selbst durchführen.

STOPP und Product Owner vorher fragen, falls wider Erwarten ein besonderes Gate nötig wird, insbesondere Production-Migration, destructive Production-Daten, Provider/Secrets/Verträge/paid calls, Kosten > USD 100/Monat, große Produktänderung, besonders sensible Identitätsdaten oder öffentliche/produktive Aktivierung.

## 10. Erwarteter Abschlussbericht von `Trip workspace audit architecture`

- Status
- Exact Head
- Base / Merge-Base / ahead-behind
- exakt geänderte Runtime-Dateien
- welche bestehenden Ableitungen wiederverwendet wurden
- Tests mit Zahlen
- Build
- GitHub Actions
- Vercel
- DB/RLS/Auth/Traveller/Provider/Secrets/Kosten ausdrücklich unverändert oder konkret benennen
- offene Risiken
- Self-Review-Ergebnis
- nächster Schritt: unabhängiger ChatGPT/Technical-Lead-Re-Review
