# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 25. August 2026
Status: **kanonischer erster Einstieg; aktuelle operative Wahrheit steht in diesem Dokument und muss vor älteren/stalen Slice-Handoffs gelesen werden.**

Wenn du als neuer Chat, Technical Lead oder Coding Agent Jetnity übernimmst, lies **vor jeder Aktion** mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
3. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
4. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
5. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
6. `docs/JETNITY_BINDING_BUILD_ORDER.md`
7. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
8. `JETNITY_HANDOFF.md`
9. `docs/ACTIVE_WORK_STATUS.md`
10. den aktuellen Slice-Task/Status/Handoff

Danach GitHub/CI/Vercel/Supabase live verifizieren. Historische Handoffs, alte PR-Bodies und ältere Statuszeilen sind Evidence ihres Zeitpunkts und dürfen diese aktuellere operative Wahrheit nicht überschreiben.

## Verbindlicher Qualitätsstandard

Jetnity muss hervorragend gebaut werden. Das ist eine ausdrückliche Product-Owner-Vorgabe und gilt für jeden relevanten Slice, jede Funktion und jeden Agenten.

Verbindlich sind insbesondere: produktionsreifer und wartbarer Code, ehrliche Datenwahrheit, starke Security/Privacy, professionelle UX auf Mobile/Tablet/Desktop, Accessibility, Performance, Multi-Citizenship ohne impliziten Standard-Pass, vollständige relevante Tests/Gates sowie adversarial Self-Review und unabhängiger Technical-Lead-Review. Geschwindigkeit darf diese Qualitätsgrenzen nicht unterlaufen.

Kanonisch: `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`.

## Verbindliche Produktpositionierung

Jetnity soll **nicht der Reiseplaner mit den meisten sichtbaren Funktionen** werden, sondern der Reiseplaner, bei dem Nutzer **am wenigsten selbst zusammensuchen, vergleichen, koordinieren und nachdenken müssen**.

Leitsatz: **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.** Die Fachdomänen und späteren Provider-/Truth-Systeme werden im Hintergrund sauber getrennt, erscheinen für den Nutzer aber als ein zusammenhängendes Reiseprodukt. Mehr Funktionen sind nur dann ein Vorteil, wenn sie echte Nutzerarbeit, Unsicherheit oder Recherche reduzieren.

Kanonisch: `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`.

## Neue verbindliche Kernfunktionen

Durch ausdrückliche Product-Owner-Entscheidung müssen zwei zusätzliche Kernfunktionen vollständig gebaut werden:

1. **Jetnity Guardian / Reise-Autopilot** – reale Änderungen/Probleme cross-domain gegen die gesamte Reise bewerten, Auswirkungen verständlich zusammenführen und belastbare Optionen/Nächste Schritte anbieten.
2. **Jetnity What-if-Reise-Simulator** – hypothetische Änderungen in einem isolierten Scenario-/Sandbox-State gegen die unveränderte reale Reise simulieren und als Delta vergleichen.

Harte Regeln:

- kein zweiter Reisegraph / keine Schatten-Wahrheit;
- Guardian darf keine Reise, Buchung, Zahlung oder Provideraktion still verändern;
- Simulator darf während der Simulation keinerlei kanonische Reisedaten verändern;
- reales `Übernehmen` nur über den kontrollierten normalen Write-/Command-Pfad mit Ownership/Version/Conflict-Prüfung;
- Guardian, Simulator und Value Optimizer teilen gemeinsame kanonische Impact-/Evidence-/Value-Bausteine, wo fachlich identisch;
- Multi-Traveller, Multi-Citizenship und Multi-Document sind Pflicht;
- `unknown`, `stale`, `error`, `unavailable` und `insufficient_context` dürfen nicht als „alles gut“ oder Null interpretiert werden;
- LLM erklärt und priorisiert, erzeugt aber keine Hard Truth;
- keine Fake-Preise, Fake-Verfügbarkeit, erfundene Alternativflüge oder erfundene Live-Ereignisse.

Vollständige Spezifikation und Acceptance: `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`.

## Verbindliche AI-/Search-Discoverability

Jetnity muss so gebaut und öffentlich dokumentiert werden, dass Suchmaschinen und moderne Answer Engines Jetnity **finden, eindeutig als Marke verstehen, korrekt einordnen und bei fachlich passenden Reiseplaner-Fragen als zitierwürdige Option berücksichtigen können**.

Das Ziel umfasst ausdrücklich Fragen wie „Welche ist die beste Reiseplan-App?“, „Welche App plant eine Reise an einem Ort?“ oder „Welche Alternative gibt es zu Lambus/Wanderlog/TripIt?“. Es gibt keine Garantie für eine konkrete Nennung oder Platzierung; gebaut wird die bestmögliche technische, inhaltliche und externe Discoverability-/Authority-/Citation-Basis.

Pflichtprinzipien:

- saubere Crawlability/Indexability, Canonicals, Sitemaps und kontrolliertes `robots.txt`;
- mehrsprachige Locale-/`hreflang`-Architektur;
- wahrheitsgetreue strukturierte Daten/Schema.org;
- konsistente Jetnity-Entity über Website, Apps und offizielle Profile;
- indexierbare, verständliche Seiten für reale Kernfunktionen und Use Cases;
- semantisches HTML, stabile URLs, klare Definitionen sowie Evidence/Freshness bei zeitkritischen Aussagen;
- sachliche und belegte Vergleichsseiten statt manipulativer Konkurrenz-Abwertung;
- hochwertige Reiseinhalte und echte externe Autorität über Reviews, Medien, Creator/Partner und organische Community-Signale;
- keine Fake-Reviews, erfundenen Nutzerzahlen/Awards, Linkfarmen, Keyword-Spam oder nicht belegte Produktversprechen;
- private Reisen, Accountdaten, Pass-/Dokumentdaten, Admin-/Support-/Provider-Secrets dürfen niemals zu öffentlichen Discovery-Flächen werden;
- Discoverability wird vor Launch technisch und inhaltlich auditiert und nach Launch kontinuierlich gemessen und verbessert.

Kanonisch und vollständig: `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`.

## Aktuelle operative Wahrheit

- TW-1 ist auf `main` integriert; Merge-Commit: `02b166e652f046d41f6e5b8d292e980369ca255e`.
- PR #57 – Technical-Lead-Autonomie + verbindliche Build-Reihenfolge: **merged**.
- PR #56 – **Trip Workspace TW-1 – Shell & Geräteparität: merged**.
- TW-1 wurde auf synchronisiertem Exact Head `3a49f78bd4d991ccc1271c93164182feed7f8a32` unabhängig geprüft; GitHub Actions und Vercel waren SUCCESS.
- TW-1 ändert keine DB/RLS/Auth/Traveller/Route/Provider/Secrets/Kosten und keine Production-Migration.
- **Aktiver nächster Slice: TW-2 – Reiseübersicht, Draft-PR #58, Branch `feat/trip-workspace-tw2-overview`.** Runtime-Implementierung erfolgt durch `Trip workspace audit architecture`.
- TW-2 muss separat bleiben; kein TW-4/TW-3- oder Guardian/Simulator-Scope hineinziehen.
- Nach neuen docs-only-Commits auf `main` muss PR #58 vor Ready/Merge erneut gegen das aktuelle `main` synchronisiert und nach den Exact-Head-Regeln verifiziert werden; ältere grüne Evidence darf nicht blind übertragen werden.
- `Account plattform audit vorbereitung`, `Jetnity provider readiness audit` und `Admin platform audit` bleiben für ihre späteren Build-Order-Blöcke erhalten.
- `main` Branch Protection ist technisch weiterhin nicht aktiviert; dieses Risiko nicht vergessen.

## Aktuelle große Build-Reihenfolge

1. Trip Workspace vollständig: `Trip workspace audit architecture` – **TW-1 ✅ → TW-2 → TW-4 → TW-3 → Details/Gaps → Rest gemäß Plan → finaler Workspace-Audit**.
2. Traveller-/Pass-/Multi-Citizenship produktweit vervollständigen auf Foundation E.
3. Account: `Account plattform audit vorbereitung` – AP-4 bis AP-12.
4. Provider: `Jetnity provider readiness audit` – S4 bis S8, danach echte Provider unter besonderen Gates.
5. Admin: `Admin platform audit` – D bis K; Billing-/Refund-P1 vor Finance-/Payment-Live.
6. Homepage nach stabilem Workspace-Kern + Discoverability D1.
7. **AI & Search Discoverability / Authority** – D0/D1/D2/D3/D4 gemäß kanonischem Standard; D0 konfliktarm früh, D1 mit Homepage, D2 nach stabiler Produkt-/Commercial-Truth, D3 zum Public Launch, D4 fortlaufend.
8. Kommerzielle Produktschicht.
9. **Guardian / Reise-Autopilot + What-if-Reise-Simulator vollständig integrieren.**
10. Production-Härtung / Launch Readiness inklusive finalem Discoverability-Audit.

Details und Abhängigkeiten stehen in `docs/JETNITY_BINDING_BUILD_ORDER.md`.

## Technical-Lead-Autonomie

Seit 25. August 2026 darf ChatGPT/Technical Lead normale, scope-treue Entwicklungsarbeit weitgehend selbstständig steuern. Nach Self-Review, vollständigen Exact-Head-Gates, CI/Vercel-Evidence und unabhängigem Technical-Lead-Review dürfen normale PRs selbst Ready gesetzt und anschließend selbst gemergt werden.

Wenn `main` während eines Slices weiterläuft, muss der Slice vor Merge synchronisiert, erneut gegatet und erneut reviewed werden.

Product-Owner-Freigabe bleibt zwingend für besondere Gates, insbesondere Production-Migrationen/destructive Datenänderungen, echte Provider/Secrets/Verträge/paid calls, Kosten über USD 100/Monat, große Produkt-/Geschäftsmodelländerungen, besonders sensible Identitätsdaten und öffentliche/produktive Aktivierungen.

Vollständige Regel: `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.

## Unveränderte Truth-Regeln

- `unknown` bleibt `unknown`.
- Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health oder erfundene Visa-/Safety-/Regulatory-Truth.
- LLM erklärt Hard Truth, erzeugt sie nicht.
- Multi-Citizenship / mehrere Reisedokumente müssen in allen relevanten Funktionen berücksichtigt werden.
- Kein impliziter erster/Standard-Pass.
- Shared Auth/RLS/Identity/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation bleiben Technical-Lead-gesteuert.

## Nächster kontrollierter Schritt

`Trip workspace audit architecture` implementiert/reviewt TW-2 ausschließlich gemäß `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`, `docs/TRIP_WORKSPACE_TW2_TASK.md` und `docs/TRIP_WORKSPACE_TW2_STATUS.md`. TW-2 darf vorhandene Reise-/Coverage-Daten **nur ableiten und verdichten**; insbesondere darf es **keinen zweiten `trips.status` oder Schatten-Lifecycle** neben Account/AP-3 erzeugen. Safety/Seasonal ohne Evaluation bleibt ungeprüft/unknown und niemals „alles gut“. Guardian/Simulator und der neue Discoverability-Programmblock sind verbindlich, werden aber nicht in TW-2 hineingezogen.
