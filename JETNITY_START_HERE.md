# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 25. August 2026
Status: **kanonischer erster Einstieg; aktuelle operative Wahrheit steht in diesem Dokument und muss vor älteren/stalen Slice-Handoffs gelesen werden.**

Wenn du als neuer Chat, Technical Lead oder Coding Agent Jetnity übernimmst, lies **vor jeder Aktion** mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
3. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
4. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
5. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
6. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
7. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
8. `docs/JETNITY_BINDING_BUILD_ORDER.md`
9. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
10. `JETNITY_HANDOFF.md`
11. `docs/ACTIVE_WORK_STATUS.md`
12. den aktuellen Slice-Task/Status/Handoff

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

## Verbindliches Marketing & Growth

Jetnity muss Marketing und Wachstum als **messbares, wahrheitsgetreues, datenschutzkonformes Produktsystem** aufbauen – nicht als nachträgliche Werbeschicht. Der Standard umfasst insbesondere Attribution, versionierte Events, Activation/Retention, CAC/LTV/Payback/Contribution Margin, Lifecycle CRM, Referral/Invite-Loops, Content/Creator/UGC, Paid Acquisition mit Spend Caps/Kill Switch, ASO/Web→App, Reviews/Reputation, internationale Expansion und technische Marketing-Reliability.

Harte Regeln:

- keine Fake-Reviews, erfundenen Nutzerzahlen, erfundenen Awards oder unbelegten Claims;
- keine Dark Patterns;
- kein Pass-/MRZ-/sensitives Identity-Targeting;
- Paid Growth erst mit belastbarer Conversion-/Revenue-Evidence und kontrollierten Spend-Grenzen;
- `unknown` bleibt auch in Attribution/Marketing-Truth `unknown`;
- öffentliche Claims dürfen nur reale, belegte Produktfähigkeit darstellen.

Kanonisch: `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`.

Das Admin Control Center muss dafür ein vollständiges **Growth-&-Marketing-Betriebssystem** enthalten: Executive Growth Overview, Funnel/Kohorten, Attribution, Paid-Media-Control-Plane, Creative-/Claims-Registry, Landingpages, CRM/Journeys/Deliverability, SEO/AI-Search-Operations, Experimente, Referral/Creator/Partner, Reviews/PR, Subscription Growth, Market Expansion, Economics/Forecasting, Tracking/Data Quality, Privacy/Consent, Connector-/Incident-Center, Marketing Calendar sowie Jetnity Copilot Pro als evidence-aware Growth Analyst. Riskante produktive Marketing-Writes benötigen Capability-Gates, Audit und wo vorgesehen Vier-Augen-Freigabe.

Kanonisch: `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`.

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
- TW-2 ist auf `main` integriert; Merge-Commit: `5e27f383c7917eec168d11bceb78f9fafc198d42`.
- PR #57 – Technical-Lead-Autonomie + verbindliche Build-Reihenfolge: **merged**.
- PR #56 – **Trip Workspace TW-1 – Shell & Geräteparität: merged**.
- PR #58 – **Trip Workspace TW-2 – Reiseübersicht: merged** nach unabhängigem Technical-Lead-PASS auf Exact Head `3f2c55357a7a2425ab760aac2a29ddbe15f80fa8`; CI, Vercel und Trip-Workspace-UI-Audit 1018/1018 waren grün.
- PR #59 – Marketing & Growth Standards: **merged**.
- **Aktiver Slice: TW-4 – Aufmerksamkeit / `Jetzt wichtig`, Draft-PR #60, Branch `feat/trip-workspace-tw4-attention`.** Runtime umgesetzt. STOPP für unabhängigen Technical-Lead-Re-Review.
- `Account plattform audit vorbereitung`, `Jetnity provider readiness audit` und `Admin platform audit` bleiben für ihre späteren Build-Order-Blöcke erhalten.
- `main` Branch Protection ist technisch weiterhin nicht aktiviert; dieses Risiko nicht vergessen.

## Aktuelle große Build-Reihenfolge

1. Trip Workspace vollständig: `Trip workspace audit architecture` – **TW-1 ✅ → TW-2 ✅ → TW-4 → TW-3 → Details/Gaps → Rest gemäß Plan → finaler Workspace-Audit**.
2. Traveller-/Pass-/Multi-Citizenship produktweit vervollständigen auf Foundation E.
3. Account: `Account plattform audit vorbereitung` – AP-4 bis AP-12.
4. Provider: `Jetnity provider readiness audit` – S4 bis S8, danach echte Provider unter besonderen Gates.
5. Admin: `Admin platform audit` – D bis K **plus** die fehlenden Growth-/Marketing-Control-Slices gemäß `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`; Billing-/Refund-P1 vor Finance-/Payment-Live.
6. Homepage nach stabilem Workspace-Kern + Discoverability D1 + Marketing/Growth-G0/G1-Grundlagen, soweit konfliktarm und truth-ready.
7. AI & Search Discoverability / Authority – D0/D1/D2/D3/D4 gemäß kanonischem Standard.
8. Marketing & Growth – G0–G5 gemäß kanonischem Standard; Querschnittsgrundlagen dürfen entsprechend ihrer Abhängigkeiten früher vorbereitet werden, produktive Aktivierungen bleiben gegated.
9. Kommerzielle Produktschicht.
10. Guardian / Reise-Autopilot + What-if-Reise-Simulator vollständig integrieren.
11. Production-Härtung / Launch Readiness inklusive finalem Discoverability-, Growth-/Tracking- und Marketing-Control-Audit.

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

Unabhängiger ChatGPT/Technical-Lead-Re-Review von Draft-PR #60 (TW-4). Kein TW-3, kein TW-5, keine besonderen Product-Owner-Gates eigenmächtig öffnen. TW-4 priorisiert nur vorhandene Signale; Safety/Seasonal nutzen die lokale provider-neutrale Evaluation und bleiben ohne Provider ehrlich unavailable.
