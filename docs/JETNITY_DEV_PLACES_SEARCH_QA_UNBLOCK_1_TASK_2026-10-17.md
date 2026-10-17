# JETNITY — Development Places Search QA Unblock 1 / unveränderlicher Cursor-TASK

**Erstellt:** 17. Oktober 2026 (Europe/Zurich)  
**Issue:** [#960](https://github.com/Jetnity/jetnity/issues/960)  
**Abhängiger, NICHT zu verändernder Trip-Audit-PR:** [#955](https://github.com/Jetnity/jetnity/pull/955) / Issue #954  
**Technical-Lead-R47:** [#955 / 6232361938](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6232361938)  
**Original-Work-QA:** [R46 / 6227280310](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6227280310)  
**Gegenwärtige Ausgangsbasis (bei Seed):** `main@40566bbfaac6adace8e0f19fd4fcc7ee251d7eb5`; vor Umsetzung LIVE neu prüfen.  
**Branch:** `fix/development-places-search-qa-unblock-1`. **Nur ein DRAFT PR**, kein zweiter.  
**Einziger logischer Cursor-Autor:** `Jetnity Development Places Search QA Unblock 1 — Cursor Generation 1`. Echte Session-ID ist bis zum Cursor-Start UNKNOWN.  
**Modellpräferenz des Product Owners für genau diesen neuen Auftrag:** **Claude Opus 5.5 / High Thinking**, explizit auswählen; **NICHT Auto**. Wenn Cursor diese genaue Auswahl nicht anbietet, **STOP und Technical Lead informieren**, keine stille Modellsubstitution.  
**Status bei Task-Erstellung:** TASK-ONLY, kein Implementierungscode, kein gestarteter Cursor-Agent, kein verifizierter Backend-Root-Cause.

## 0. Ziel und Abnahmekontext

Jetnity QA-B für Trip Audit V1 kann noch keine echten synthetischen Account-Reisen erstellen, weil die normale verpflichtende `OrtSuche` auf der manuell bedienten `/planen`-Seite mit EXISTIERENDEM Development-Testkonto A bei den öffentlichen Suchbegriffen `Japan` und `Zürich` jeweils ohne auswählbares Ziel endet. Vor dem ersten Reisespeichern STOP. Keine A-/B-Reise und kein gegenseitiger Ownership/RLS-Test wurde durchgeführt.

**Beobachtung ist kein Root-Cause:** R46 sah die UI-Meldung „Kein passendes Reiseziel gefunden. Bitte wähle einen Eintrag aus der Liste.“. HTTP-Status/JSON, Umfang/Existenz der aktuellen Development-`public.places`-Zeilen, SQL-/RLS-Zugriff und der Grund der Leere sind **NICHT VERIFIZIERT**. Es ist **NICHT** bewiesen, dass #955 den Fehler verursacht; der Place-Code liegt ausserhalb seines 12-Dateien-Diffs.

**Pflichtarchitektur:** `docs/ORTE.md` und `docs/REISEN.md`: `OrtSuche` fragt NUR Jetnitys eigene `/api/search/places` und deren `public.places`-Katalog ab; `TripPlanner` benötigt eine serververifizierte gültige `place_id`; nicht verifizierter Freitext darf NICHT gespeichert werden. Der historische August-Import 124811 Orte in damaligem Development beweist KEINEN aktuellen Bestand im späteren nicht-default Dev-Branch `yfvbxvijcorffwxbxahl`. Keine Live-Abfrage an GeoNames/Google/Nominatim/Provider, kein Fake/Inline-Place-Seed.

**Erfolg dieses Slices ist einer von zwei ehrlichen Ausgängen:**
- (A) Ein **konkret reproduzierter Codefehler innerhalb exakt erlaubter Place-Flächen** ist sicher und minimal code-only korrigiert, durch adversariale Tests und genaue Code-Head-Gates belegt; oder
- (B) Ein **nicht code-only lösbarer Blocker** (fehlende/falsche Places-Daten, Berechtigungen, Migration/Import/Hosted Readback, Ungewissheit) ist eindeutig als solches dokumentiert; Autor STOPPT **ohne** Datenbank-, Rechte-, Sicherheits- oder Code-Umgehung und übergibt enges Product-Owner-/TL-Entscheidungspaket. Ein ehrliches B ist zulässig, aber **kein QA-B PASS**.

## 1. Zwingendes Live-Precheck, vor Arbeit

Reihenfolge: `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, dort benanntes Handoff, `docs/ACTIVE_WORK_STATUS.md`, `.jetnity/operating-mode.json`, neuester #751 und neue #748-MATERIAL, #960, dieser unveränderliche TASK, R47 #955/6232361938, R46 QA/6227280310. Danach live main und diesen Branch, Exact HEAD, Merge-Base/Ahead/Behind, Original-CI/Auth, Vercel Preview/Production, offene PRs/Threads und relevante protected gates prüfen. **`NORMAL` muss live bestätigt sein.** Kein Agent darf nur aus diesem Task annehmen, dass SHAs oder Incident-Status noch aktuell sind.

Vor dem ersten Commit/Push Scope und Diff prüfen. Bereits offener separater #955 bleibt DRAFT, unverändert, Original-Autor `Jetnity Trip Audit V1 — Codex Generation 1`, Session `01a141ad-1220-7462-bced-c75469dab1d3`, STOPPED. Keine Cherry-Picks/Rebases/Änderungen an #955, keine zweite Auth-/Trip-Implementierung.

## 2. D0 — FIRST diagnose READ-ONLY (Pflicht, vor jedem Codefix)

Die komplette bestehende Kette fachlich lesen, einschliesslich Tests:
- `components/places/OrtSuche.tsx` und `components/suche/Suchliste.tsx` (Debounce, Rolle, Lade-/Fehler-/Leerzustand, API-Response).
- `app/api/search/places/route.ts`, `lib/places/suche-lauf.ts`, `lib/places/suche.ts`, `lib/places/abbildung.ts`, `lib/places/domain.ts`, `lib/api/datenbank-lesen.ts`, deren Tests.
- `components/trips/TripPlanner.tsx`, `lib/places/aktionen.ts`, `lib/trips/aktionen.ts`, `lib/trips/schema.ts`, `docs/ORTE.md`.
- `supabase/migrations/20260820120000_places_referenz.sql`, existing `scripts/places/importieren.ts` **NUR LESEN**; Migration, RLS und Import sind nicht dieser Implementierungs-Scope.

Deterministisch unabhängig prüfen:
1. Lokale OFFLINE synthetische Fixture für die bestehenden erwarteten Typ-/Keyword-/Platz-ID-Contracts (`country Japan`, `city Zürich`, optional `airport ZRH`) und Suchrollen `ziel`/`abreise`: nachweisen, ob `placesSuchen`/Ranking/Mapping/Filter gültige Datensätze fälschlich zu `[]` machen oder `OrtSuche` eine korrekte Antwort verliert. Keine fake Production-Truth: Fixtures ausdrücklich synthetic.
2. Mit einem frisch isolierten LOCALHOST Server auf dem exakten Branch bei nachgewiesener ausschliesslicher Browser-UND-SSR-Bindung zu existierendem Supabase DEVELOPMENT `yfvbxvijcorffwxbxahl`, **NUR falls Gate sicher**, die reguläre im Produkt bestehende öffentliche Lesestrecke `GET /api/search/places?q=Japan&rolle=ziel` und `q=Z%C3%BCrich&rolle=abreise` einmal je Fall testweise verwenden. Nur HTTP-Status, Antworttyp, anonymisierten `option-count`, Content-Length/Limits und generisches Fehler-Flag protokollieren. Keine Roh-Personendaten, keine Tokens/Headers, keine ungeschützten Logs, kein Vollkatalog-Scan, keine Supabase-Admin-Auth und kein alternativer Datenbankzugriff. Bei verdächtiger Wirkung oder unklarer DEV-PREP-1-Zulässigkeit vor request STOP.
3. Erkenntnisse strikt trennen: HTTP Fehler vs legitimes `200 []` vs Client-Zustandsproblem vs lokaler Fixture-Fehler vs nicht untersuchter Zustand. **Zwei leere Suchergebnisse beweisen NICHT, dass gesamte Tabelle leer ist.** Der historische Dev-Import und `with_data=false` dürfen nur als mögliche Hypothesen, nicht als aktuelle Live-Wahrheit gelten.
4. Falls Datensatz/Index/Grant/RLS/Dev-Migration fehlt oder die Ursache ohne gesperrte Hosted-DB-Reads nicht belegbar ist: **SOFORT STOP mit präzisem Decision Packet.** Weder SQL noch Import `--schreiben`, Migration, RPC, Service-Role, nicht genehmigte Readbacks, andere Supabase-Schnittstelle oder `with_data`-Branch-Neuanlage. Keine Daten-/Schemaänderung auf Development oder Production.

## 3. D1 — NUR bei belegtem Source-Defekt: minimaler CODE-ONLY-Fix

Nur einen bewiesenen Bug beheben, nicht neue globale Suche bauen:
- UI muss `unavailable/error/empty` ehrlich unterscheiden, auch bei Race/Abort/Response-Shape; passende gültige Optionslisten dürfen nicht verschwinden.
- Vorhandenen `public.places`-Namen/Keywords/IATA/Typ-Kanon unverändert bewahren. Zielland `Japan` und Abreisestadt `Zürich` müssen dann angeboten werden, **wenn** valide kanonische Zeilen existieren; leere reale Quelle bleibt ehrlicherweise leer.
- `server-confirmed place ID` und `reiseorteBestaetigen` niemals umgehen, keine freien Zielnamen als gespeicherte IDs, keine Katalogeinträge hardcodieren, keine improvisierte statische Shortlist. Bestehende Sortierung/Länder-Alias/Rollen-Semantik und Accessibility nicht regressieren.
- Keine HTTP-Retry-/Fallback-Schleife, keine externen Provider/LLM-Calls, keine neue Datenpersistenz oder zusätzlichen Datenabrufe. Ein Fix, der nur eine Fehlermeldung verschönert, gilt NICHT als QA-B-Unblock.

**Wenn keine sichere Source-Korrektur bewiesen wird, muss dieser PR TASK-ONLY bleiben oder lediglich erlaubte und wahrheitsgetreue rein synthetische Diagnostiktests/Docs erhalten. Nie Codefix erfinden, um einen Commit zu erzeugen.**

## 4. Exakte WRITE-Ownership

VOR jeder Mutation/Commit stehen folgende Grenzen fest.

Erlaubte **bestehende** Produktdateien nur bei eindeutig bewiesenem Source-Defekt:
- `components/places/OrtSuche.tsx`
- `app/api/search/places/route.ts`
- `lib/places/suche-lauf.ts`
- `lib/places/suche.ts`
- `lib/places/abbildung.ts` **nur**, wenn konkrete Mapping-Ursache und Testbeweis dokumentiert.

Erlaubte **neue** sichere Tests/Diagnose-Helfer:
- `lib/places/qa-unblock-1/**` mit synthetischen Fixtures und adversarialen Tests;
- `scripts/places/qa-unblock-1/**` optional für strikt lokal/synthetisch, keine Remote-DB-/Import-Abfrage;
- `docs/JETNITY_DEV_PLACES_SEARCH_QA_UNBLOCK_1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-17.md`;
- optional neue sanitisierte Text/JSON EVIDENCE unter `docs/evidence/jetnity-dev-places-search-qa-unblock-1/**`.

**IMMUTABLE:** diese ursprüngliche TASK-Datei `docs/JETNITY_DEV_PLACES_SEARCH_QA_UNBLOCK_1_TASK_2026-10-17.md`.

**NICHT ÄNDERN:** alle `components/trips/**` und `lib/trips/**`, insbesondere sämtliche Dateien in #955; `components/suche/Suchliste.tsx`, `lib/api/**`, `lib/places/aktionen.ts`, `lib/places/domain.ts`, `lib/places/lesen.ts`, `scripts/places/importieren.ts`, `supabase/**`, RLS/Auth/Provider/Official-Truth, shared Types, `app/**` ausser erlaubter exakt benannter Places-Route, `package*.json`, Node/Next/Sharp, `AGENTS.md`, `.jetnity/**`, Global CSS, Workflows, Server/Hosting-Konfiguration oder andere Aufgaben-/Continuity-Dateien.

Wenn die belegte notwendige Korrektur ausserhalb dieser Ownership liegt: **STOP für Technical-Lead-Scope-Amendment**, nicht selbst erweitern.

## 5. T01–T10 / unabhängige Qualität

T01: Lokal synthetisches Land Japan wird als `ziel` gelistet, **nicht** als `abreise`; exaktes Land-Alias vor gleichnamiger Stadt.  
T02: Zürich City / ZRH Airport gültig für `abreise`; Ranking/Dezimal/Diakritik-Faltung stabil, keine falsche Datensatzannahme.  
T03: `200 []` bleibt leer; HTTP 503/error bleibt klar `unavailable/error`, kein Fake-Treffer.  
T04: Supabase-Read-Error wird durch bestehende Fehlerverträge nicht still zu leer; 404/500 nicht als `200 []` maskieren.  
T05: `OrtSuche` Debounce/Race/Abort, gleichzeitiger Suchbegriffwechsel, Leer- und Wiederholungseingabe; keine stale Treffer.  
T06: Ungültige/freie Ortsnamen bleiben unbestätigt, kein Submit mit erfundener ID.  
T07: Original-Filter/Länder-Alias, Rollen-Gates und bestehende Relevanz-/Max-Treffer-Tests unverändert.  
T08: Kein externes Geocoding, Provider/LLM/paid Request, Service-Role, Import-Write, DB-Migration oder Auth-Änderung.  
T09: Falls Produkt-Code geändert: synthetisch/host-local reproduzierter vormals failing case wird grün, normaler UI-Weg ist mit vorhandenem Katalog erfolgreich; wenn Hosted Dev weiterhin leer, **NOT VERIFIED** und STOP trotz grüner offline Tests.  
T10: Genaues Audit von geänderten Pfaden, Sanitization, Source-Integrität, Owner-Gates und Dokumentation aller offenen Unsicherheiten, keine PII/Secrets im öffentlichen GitHub.

Falls ein erlaubter Code-Fix implementiert wurde: originale Projektprüfroutine (Mode, Typecheck, Lint, volle Tests inklusive originaler native PG Gates, API-/Schema-/Dead-/Exports-/Deps-Hygiene, `git diff --check`, Production Build), Original-GitHub Actions Verify/Auth und exact HEAD Vercel Preview nach normalem branch-only Push. Keine Test- oder Guard-Abschwächung. Unterschied zwischen Seed-CI und tatsächlichem Implementation-HEAD-CI explizit machen. Bei Tooling-Blockade STOP und präzise Evidenz, kein erfundener PASS. **Kein Testkonto-/Live-DB-Write zum "Beweisen" des Fixes.**

## 6. Sicherheits-/Owner-Gates, Kosten und Parallelität

**Multi-Agent-Suitability: SINGLE_AGENT** für eng gekoppeltes Ortsuche-Runtime/UI/API-Diagnose-Contract. Parallelität mit #955 ist auf disjunkte Dateimengen beschränkt; kein zweiter Writer, kein Eingriff in #955 oder dessen ursprüngliche Codex-Session. Eine zweite parallele Korrektur desselben Places-Contracts würde Race/Merge-Risiken erzeugen.

Rechtliche/Privacy-/Truth-Grenzen: `unknown` bleibt `unknown`; `public.places` bleibt einzige kanonische Quelle. Keine echten personenbezogenen Reiserouten, echten Buchungen, anderen Accountdaten, Pass-/Biometriedaten, Roh-HAR oder fremden Chrome-Tabs. Kein Supabase `execute_sql`, `list_tables`, `apply_migration` oder Import-Schreibvorgang zur Umgehung des **DEV-PREP-1 bereits blockierten Hosted-DB-Readbacks**. Keine Auth-/RLS-/Grant-/Policy-, SMTP-/Redirect-, Secrets-/Provider-/Payment-/Production-/Release-/Noindex-Änderung. Geschütztes #626-Konto (und Plus-Adressen) wird nie gesucht oder benutzt. Separate #917 SOURCE_NOT_QUALIFIED, #944 kein BP1 real GET, #934/#937 Bern stop, #911/#913 Privacy P2, 18 npm advisories etc. bleiben unverändert. Keine neuen laufenden Kosten, Tools oder Pakete.

Agent startet **mit regulärer Berechtigung**. Frühere Full-Access-Freigaben anderer Work/Codex-Sessions gelten nicht diesem Agenten. Bei echtem Host-Zugriffsproblem STOP für scope- und session-spezifische PO-Entscheidung; nie still Permissions erweitern.

## 7. Deliverables / Publikation / STOP

1. Vor Eingriff einen kurzen neuen task-eigenen PLAN; für D0 eine präzise Root-Cause-Matrix mit **nachgewiesen vs. nicht nachgewiesen**, anonymisierten Resultaten der ausschliesslich erlaubten öffentlichen GETs und synthetischen Basistests. `REPORT` belegt auch einen STOP wegen Daten-Gate.
2. Falls D1 erlaubt und relevant, nur task-owned Code/Tests ändern, sämtliche lokalen Gates, dann gewöhnlicher Commit und **kein Force-Push** auf **bestehenden** Branch/Draft PR. Nicht auf `main` arbeiten; kein neuer PR oder Issue.
3. Vollständige task-eigene `REPORT`, `SELF_REVIEW`, `HANDOFF` und sanitisiertes Evidenzregister mit echten SHAs, Git Tree, allen Original-Gates/Blockern, Session-Identität, tatsächlichem Modell und geprüften Nicht-Funktionen. Bei reiner D0 Blockade: denselben PR via Berichtskommentar verwenden, kein überflüssiger Code-Commit.
4. **STOP für unabhängigen ChatGPT Technical Lead R48.** Original #955 weiter DRAFT und QA-B blockiert bis separat freigegebenes echtes Account Testing. Agent-Self-Review ist niemals TL PASS. **DO NOT MARK READY. DO NOT MERGE. DO NOT START FOLLOW-UP SLICE.**

**LIVE-EVIDENCE GEWINNT IMMER.**
