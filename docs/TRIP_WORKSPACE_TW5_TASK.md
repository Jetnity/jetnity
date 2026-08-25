# Jetnity – Trip Workspace TW-5 Task

Stand: 25. August 2026  
Status: **verbindlicher Runtime-Auftrag; Implementierung noch nicht gestartet**  
Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw5-item-gap-details`  
Baseline nach Continuity-Closure: `bee9f653d7d83dfbafbf9b9c1da6385433071a4a`  
ADR: `docs/ADR_0167_TRIP_WORKSPACE_TW5_ITEM_GAP_DETAILS.md`

## 1. Auftrag

Implementiere **TW-5 – Item- und Gap-Details** im Trip Workspace.

Ziel:

> Flüge, Unterkunft, Aktivitäten und Mobilität werden aus einer konkreten Reise-/Coverage-/Attention-/Item-Situation als kontextuelles Detail oder Werkzeug geöffnet. Sie bleiben interne Reisesysteme und sind nicht länger die primäre gleichrangige Hauptnavigation des Workspace.

Vor jeder Codeänderung musst du den aktuellen Branch/PR/main live verifizieren und die tatsächliche Runtime gegen ADR-0167, `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`, `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md` und den aktuellen Implementierungsplan prüfen.

Keine stillen Annahmen aus diesem Task übernehmen, wenn der aktuelle Code inzwischen anders ist. Abweichung dokumentieren und bei Shared-Contract-/Scope-Auswirkung STOPP.

## 2. Verbindlicher Ist-Befund auf der Baseline

Auf `bee9f653...` gilt:

- `TripWorkspace.tsx` besitzt noch workspace-lokalen `bereich`-State mit `Übersicht / Flüge / Unterkunft / Aktivitäten / Mobilität`.
- `TripWorkspaceNavigation.tsx` rendert diese fünf Bereiche als sticky gleichrangige Navigation.
- `TripWorkspaceUebersicht.tsx` öffnet Coverage-Zeilen nur über `onBereich(...)`.
- `TripWorkspaceJetztWichtig.tsx` öffnet Attention-Aktionen ebenfalls nur über einen Domain-Bereich.
- `TripWorkspacePlan.tsx` besitzt Timeline/Etappen/Tage, aber `Planpunkt` ist noch kein Item-Detail-Entry.
- `FlugBestand` und `UnterkunftBestand` sind vorhandene Bestandsflächen.
- Flug-/Hotel-/Aktivitäten-/Mobilitätssuche kommen bereits als externe React-Flächen in `TripWorkspace` und werden nach bestehender TW-1-Semantik lazy gemountet.
- `arbeitsbereich.ts` enthält Coverage-/Bereichsableitung und die bisherige Mount-/Visibility-Logik.

Das ist der Ausgangspunkt, keine Einladung zu einem Komplettumbau.

## 3. Scope

### 3.1 Workspace-lokales Detailmodell

Führe die kleinstmögliche testbare Presentation-Struktur ein, mit der der Workspace mindestens unterscheiden kann:

- Reiseoberfläche / kein Detail;
- Gap-Detail;
- Item-Detail;
- optional explizit geöffnete Suche als Werkzeug innerhalb dieses Details.

Der State darf nur Referenzen/Intent tragen. Keine kopierte Fachwahrheit.

Wenn du einen Typ/Helper einführst, halte ihn klein, deterministisch und workspace-lokal. Verwende bestehende IDs aus `Trip`, `TripDay`, `TripStage` und `TripItem`.

### 3.2 Primärnavigation auf Reisesprache umstellen

Entferne die Domain-Leiste als primäre Nutzernavigation des Workspace oder reduziere sie so, dass sie nicht mehr die Haupt-IA bildet.

Der Nutzer muss weiterhin jederzeit zuverlässig zur Reiseoberfläche zurückkehren können.

Keine neue globale App-Navigation bauen.

### 3.3 Coverage-/Gap-Einstiege

Die bestehenden Coverage-Flächen auf der Übersicht müssen ein kontextuelles Gap-Detail öffnen können.

Mindestens:

- Flight Coverage;
- Unterkunft Coverage;
- Mobility Coverage.

Bei Activities gilt: `0 Aktivitäten` ist **nicht automatisch ein fachlicher Pflicht-Gap**. Die UI darf eine optionale Planung/Suche anbieten, muss aber nicht vortäuschen, dass eine Reise unvollständig ist.

Nutze die bestehenden maschinenlesbaren Coverage-Ableitungen. Keine Textanalyse und kein Parsen lokalisierter UI-Strings.

### 3.4 Attention-Einstiege

Wenn ein bestehender Attention-Punkt eine fachlich passende Aktion besitzt, öffnet diese das passende kontextuelle Detail bzw. den bereits vorhandenen Vorbereitungsbereich.

Wichtig:

- Official/Traveller/Readiness-Aktionen dürfen nicht pauschal in Flight/Hotel umgeleitet werden.
- Safety/Seasonal dürfen nicht künstlich Commercial-Details öffnen.
- Coverage-Flight/Stay dürfen in ihre Gap-Details führen.
- wenn keine sinnvolle bestehende Aktion vorhanden ist, darf der Punkt ohne erfundene Aktion bleiben.

Falls dafür der TW-4-`AttentionAktion`-Presentation-Vertrag minimal erweitert werden muss, ist nur eine **workspace-lokale Presentation-Referenz** erlaubt. Keine neue Official/Safety/Traveller Truth. Wenn der Change cross-domain wird: STOPP.

### 3.5 Timeline-Item-Einstieg

Vorhandene Planpunkte werden als Items öffnungsfähig, ohne die bisherige Lösch-/Planfunktion zu verschlechtern.

Mindestens:

- `flight`
- `stay`
- `activity`
- `transfer`
- `rental_car`
- `note`

Item-Detail zeigt ausschließlich vorhandene Item-/Graph-Fakten. Bei Preis nur bestehenden zulässigen Evidence-Zustand zeigen. `note` bleibt reine Notiz ohne Provider-/Booking-Erfindung.

Ein ungeplantes Item muss ebenfalls öffnungsfähig sein.

### 3.6 Vorhandene Bestands-/Suchflächen integrieren

Wiederverwenden statt neu bauen:

- `FlugBestand`
- `UnterkunftBestand`
- vorhandene `flugsuche`
- vorhandene `hotelsuche`
- vorhandene `aktivitaetensuche`
- vorhandene `mobilitaetssuche`

Bestandsflächen dürfen innerhalb eines Detailkontexts angezeigt werden, wenn dies fachlich passt. Sie müssen nicht dupliziert werden.

Commercial-Suche bleibt **explizit on-demand**. Initiale Reiseansicht darf sie nicht mounten.

### 3.7 Kontext und Auswahl erhalten

Beim Öffnen/Schließen eines Details:

- `gewaehlterTagId`/aktiver Tag bleibt erhalten, solange gültig;
- kein ungewollter Timeline-Reset;
- Graph-Mutationen invalidieren tote Item-/Day-/Stage-Refs deterministisch;
- Rückkehr ist auf Mobile/Desktop vorhersehbar;
- Fokus wird barrierefrei geführt.

## 4. Non-Scope

Nicht implementieren:

- neue DB-Tabellen/Spalten/Migrationen;
- RLS/Auth/MFA/AAL/Identity/Ownership;
- Traveller-/Citizenship-/Document-Kernmodell;
- Route-/Transit-Neumodellierung;
- Citizenship-only Credential Option;
- neue Readiness-/Official-/Safety-/Seasonal-Truth;
- Live-Provider;
- Provider-Secrets oder paid calls;
- neue Provider-Health;
- echte Commercial-Provenance aus S5;
- neue persistierte Cost Guards;
- neue `trips.status`-Logik;
- TW-6 Create Entry;
- TW-7 Hub/Archiv;
- TW-8 Commercial Integration;
- TW-9 finaler Polish-/Closure-Audit;
- Guardian / What-if / Value Optimizer;
- Homepage / Marketing / Growth / SEO;
- Native App;
- Production-Aktivierung.

## 5. Harte Truth-Anforderungen

1. Kein Fake-Preis.
2. Keine Fake-Verfügbarkeit.
3. Keine Fake-Provider-Health.
4. Kein manuelles Item als verifiziertes Providerangebot ausgeben.
5. Keine Einreise-/Visa-/Safety-/Seasonal-Wahrheit erfinden.
6. `unknown`, `stale`, `error`, `unavailable`, `insufficient_context`, `ungeprueft` nicht kollabieren.
7. Offene Coverage ist nicht gleich Provider-Unavailability.
8. Kein impliziter erster/default Pass.
9. Kein stilles Herkunfts-/Airport-Default wie `ZRH`.
10. Kein LLM als Quelle von Hard Truth.

## 6. UX- und Accessibility-Anforderungen

- Eine Reise bleibt auf allen Geräten die Hauptorientierung.
- Kein Mobile/Desktop-Produkt-Split.
- Interaktive Targets mindestens bestehender 44px-/`min-h-11`-Standard.
- Keyboard vollständig bedienbar.
- Fokus beim Detailöffnen sinnvoll setzen; beim Schließen auf sinnvollen Auslöser zurückführen, soweit technisch stabil.
- Verborgenes Detail/Suche darf nicht fokussierbar bleiben (`hidden`/`inert` korrekt).
- Keine horizontale Überlauf-Regressions bei 280/320/360/390/430 px.
- Lange Etappen-/Itemnamen bleiben umbrechbar.
- Reduced motion respektieren, falls Animationen hinzukommen.
- Semantische Labels/Heading-Hierarchie/`aria-expanded`/`aria-controls` dort einsetzen, wo relevant.

## 7. Performance-Anforderungen

- Keine neue Commercial-Suche beim Initial-Render.
- Kein unnötiges Remounten bereits explizit geöffneter Suchflächen, wenn dadurch Calls erneut ausgelöst würden.
- Keine neue globale State-Library.
- Keine große Client-Datenkopie; Detail-State nur IDs/Intent.
- keine zweite komplette DOM-Welt für Desktop.

## 8. Acceptance Criteria

### AC-1 – Haupt-IA

Die Workspace-Hauptansicht spricht Reise/Attention/Timeline. Domain-Flächen sind nicht mehr gleichrangige primäre Hauptnavigation.

### AC-2 – Flight Gap

Ein offener/teilweiser/unbestimmter Flight-Coverage-Zustand öffnet ein passendes Detail. `unknown` bleibt sichtbar als unknown. Suche nur nach expliziter Nutzeraktion.

### AC-3 – Stay Gap

Analog für Unterkunft. Fehlende Nächte werden nur aus bestehender Nacht-Coverage beschrieben.

### AC-4 – Activities

`0 Aktivitäten` erzeugt keine falsche Pflicht-/Blocker-Truth. Vorhandene Activity-Items sind als Items öffnungsfähig; Aktivitätensuche on-demand.

### AC-5 – Mobility

Open/partial/unknown Mobility bleibt fachlich getrennt. Covered-by-flight wird nicht als offene Bodenmobilitätslücke dargestellt. Kein Live-Mobility-/Rental-Adapter vortäuschen.

### AC-6 – Item Details

Alle sechs `TripItemKind`-Arten öffnen ein vorhandene Wahrheit widerspiegelndes Detail; `note` ohne Commercial-Fiktion.

### AC-7 – Unplanned

`ohneTag`-Item öffnet ein Detail ohne erfundenen Tag/Stage.

### AC-8 – Auswahlstabilität

Detail öffnen/schließen verändert den gewählten Tag nicht. Entfernt/verschoben wird ein ausgewähltes Item → kein toter Detailzustand.

### AC-9 – Guest/Account

Gleiche Presentation-Logik. Guest-Fähigkeitsgrenzen und Account-Fähigkeiten bleiben ehrlich, ohne zweite State Machine.

### AC-10 – Lazy Mount

Initialreise mountet keine Flight-/Hotel-/Activity-/Mobility-Suche. Explizites Öffnen mountet nur die angeforderte Suchfläche. Wechsel zurück und wieder hin führt nicht unnötig zu neuem Mount/Call.

### AC-11 – Device Parity

Mobile/Tablet/Desktop nutzen dieselben Detail- und Truth-Ableitungen. Desktop darf Master/Detail zeigen, aber keine zweite IA.

### AC-12 – Accessibility

Keyboard/Fokus/Hidden/Inert/ARIA und Touch-Target-Anforderungen sind automatisiert oder gezielt nachvollziehbar geprüft.

### AC-13 – Truth Regression

TW-2/TW-3/TW-4-Tests und bestehende Coverage-/Attention-/Timeline-Semantik bleiben grün.

### AC-14 – No Shared Contract Drift

Diff enthält keinen ungefreigegebenen Auth/RLS/Traveller/Route/Provider/Billing/Privacy/Attribution/Guardian-Contract-Umbau.

## 9. Erwartete Tests

Mindestens gezielte Tests für:

- Detail-Resolver / invalidierte Refs;
- Flight Gap `offen`, `teilweise`, `unbestimmt`;
- Stay Gap `offen`, `teilweise`, `unbestimmt`;
- Activities ohne Pflicht-Gap;
- Mobility offen/unknown/covered-by-flight;
- jedes Item-Kind;
- `ohneTag` Item;
- Tag-Auswahl bleibt erhalten;
- Item entfernt nach Auswahl;
- Guest vs Account;
- Mobile/Desktop gleiche Ableitung;
- Lazy-Mount vor/nach explizitem Detail-/Search-Open;
- hidden/inert/focus regression;
- lange Namen / 280px overflow;
- bestehende TW-3 Timeline- und TW-4 Attention-Regressionen.

Erweitere `npm run audit:trip-workspace`, wenn dadurch genau die veränderten UI-Pfade reproduzierbar geprüft werden. Browser-Audit ist Zusatz-Evidence, kein Ersatz für Domain-Tests.

## 10. Vollständige Gates vor STOPP

Auf dem **exakten finalen Head** ausführen und dokumentieren:

1. gezielte TW-5-Tests;
2. `npm test` vollständig;
3. Typecheck;
4. Lint;
5. `check:setup:ci`;
6. Admin-API-/Schema-/Dead-Code-/Export-/Dependency-Hygiene laut aktuellem Repo-Script;
7. Production Build;
8. `npm run audit:trip-workspace`;
9. GitHub Actions auf Exact Head SUCCESS;
10. Vercel Preview auf Exact Head READY, falls erzeugt;
11. adversarial Self-Review gegen Scope/Non-Scope/Truth/Accessibility/Performance;
12. Diff/Ahead-Behind gegen aktuelles `main`.

Wenn `main` während TW-5 fortschreitet: synchronisieren und **alle relevanten Exact-Head-Gates erneut** ausführen.

## 11. STOPP

Nach Implementation, Self-Review und vollständiger Evidence:

- Draft-PR bleibt Draft;
- kein Ready;
- kein Merge;
- kein TW-6;
- Statusdatei mit Exact Head, Tests, CI/Vercel, Risiken und offenen Punkten aktualisieren;
- ChatGPT/Technical Lead übernimmt den unabhängigen Re-Review.

## 12. Proaktive Pflicht

Wenn du im Scope einen schwerwiegenden Architektur-, Truth-, Security-, Privacy-, UX-, Accessibility- oder Performance-Defekt entdeckst, dokumentiere ihn proaktiv.

- Im eigenen TW-5-Scope: beheben, wenn sauber möglich.
- Cross-Agent-/Shared-Contract-Defekt: nicht still übernehmen; Evidence + Severity + STOPP/Lead-Entscheid.
- Kein Scope-Creep nur weil eine Verbesserung attraktiv wäre.