# Jetnity Change Impact Foundation V1 — verbindlicher unveränderlicher TASK

**Datum:** 16. Oktober 2026, Europe/Zurich  
**Issue:** [#956](https://github.com/Jetnity/jetnity/issues/956)  
**Strategie:** OP-02 / [#236](https://github.com/Jetnity/jetnity/issues/236) — ausdrücklich Product-Owner-freigegebene **eng begrenzte frühe Foundation**, KEIN vorgezogener vollständiger Guardian/Recovery/What-if-Ausbau.  
**Einziger Code-Autor:** **Jetnity Change Impact Foundation V1 — Codex Generation 1**. NEUE getrennte Codex-Sitzung erst durch Product-Owner-Dispatch; reale Session-ID ist beim Seed noch unbekannt.  
**Branch:** `feat/change-impact-foundation-v1`  
**Draft PR:** bereits vom Technical Lead seeded; echte Nummer nach Erstellung live lesen.  
**Baseline:** `main@69a182ea4b7f9dbd934abf314266b7d8f59a5d73`, tree `6bf863f6668869ccb1611981b88fd9caa69ea029`.  
**Operating Mode:** `NORMAL`. **Startstatus:** TASK_ONLY / NO IMPLEMENTATION / AUTHOR NOT DISPATCHED.  
**Dieses Task-Dokument ist IMMUTABLE nach Seed. Den Blob beim Start live ermitteln und bei jedem Handoff bestätigen.**

## 1. Strenge Product-Owner-Entscheidung und Nutzwert

Der Product Owner hat ausdrücklich erlaubt, **nur** die isolierte, deterministische, read-only **Change Impact Foundation V1** früher vorzubereiten und anschließend separat bauen zu lassen, während der vorhandene Trip-Audit-PR #955 unabhängig abgeschlossen wird. Die übergeordnete `docs/JETNITY_BINDING_BUILD_ORDER.md` bleibt ansonsten unverändert; die vollständige Guardian-/Autopilot-/Simulator-/Commercial-Integration bleibt in ihrer späteren Phase.

**Konkrete V1-Frage aus dem Reisekontext:** „Wenn sich mein bereits gespeicherter Plan von Snapshot A zu Snapshot B verändert hat: Was hat sich nachweislich geändert, welche anderen gespeicherten Reisebestandteile hängen nachweisbar an den geänderten Tagen/Etappen oder denselben kanonischen Zeitpaaren und müssen geprüft werden, und welche Planungsbewertung hat sich wirklich verändert?“

**Beispiel (AUSSCHLIESSLICH synthetisch):** In einem gespeicherten Zürich→Panama→Costa-Rica-Trip wird ein vorhandener Flugplanpunkt in Version B auf den nächsten Tag verschoben. V1 darf seinen gespeicherten Datumsunterschied belegen, betroffene Punkte derselben kanonischen Tages-/Etappen-Zuordnung als `needs_review` einstufen und vorhandene Zeit-/Coverage-Auswertungen A vs B gegenüberstellen. V1 darf **nicht** behaupten, dass ein realer Flug verspätet ist, eine Hotelnacht verloren ging, eine Umbuchung nötig ist oder ein Anschluss definitiv scheitert, wenn diese Aussage nicht aus der jeweiligen originalen kanonischen Prüfung folgt.

**Differentiation Impact:** Cross-domain Reisegraph-Zusammenhang + transparente Begründung + ehrliches UNKNOWN ist nützlicher als ein generischer Änderungslog. **Keine Exklusivitätsbehauptung:** TripIt Pro bietet Flight-/Risk-Alerts sowie alternative Flugsuchen ([Flight alerts](https://help.tripit.com/en/support/solutions/articles/103000063296-travel-alerts), [Risk alerts](https://help.tripit.com/en/support/solutions/articles/103000280834-risk-alerts), [Alternate flights](https://help.tripit.com/en/support/solutions/articles/103000063402-alternate-flights)). Wanderlog bietet Datumsverschiebung/Route-Optimierung ([Dates](https://help.wanderlog.com/hc/en-us/articles/4625659806363-Change-dates-of-a-trip), [Route](https://help.wanderlog.com/hc/en-us/articles/13545624787867-Optimize-route)); [Mindtrip](https://mindtrip.ai/) beschreibt proaktive Change-/Reisebegleitung. Keine kostenlose, echte Live-Recovery- oder Flugdaten-Wahrheit aus Werbeclaims ableiten.

**End-to-end nur als synthetischer Domain-Test:** zwei geschützte `Trip`-Fixtures derselben Reise → bounded input/identity/revision precheck → bestehender `reiseDiff`-/Trip-Graph-Kontext und kanonische `tripZeitpruefung`, `unterkunftAbdeckung`, `flugAbdeckung`, `mobilitaetsAbdeckung` soweit nachweisbar → evidence-referenzierter, sortierter, begrenzter Change-Impact-Report → keine Persistenz/kein Netz/keine UI/kein Apply. Es wird **kein** Runtime-Caller oder öffentliches Produkt-Feature aktiviert.

## 2. Verbindlicher Kanonik-Read vor jedem Code

Lies vollständig und nutze READ-ONLY, mit vorhandenen Tests:

- `types/trips.ts`: ein kanonischer `Trip = Reisegraph`; Guest/Account teilen Fachmodell, `id`, `revision`, `days`, `stages`, `ohneTag`, `TripItem`, Commercial Booking/User-Evidence; kein Default Passport.
- `lib/reiseaenderung/diff.ts`: `reiseDiff` für vorhandene user-readable Vorher/Nachher-Diff-Sprache. **Keine parallele generische Diff-Engine**. Nutze ggf. nur bounded, datensparsame Projektion, nicht vollständige private Reise-Inhalte in Logs.
- `lib/reiseaenderung/snapshot.ts`, `lib/reiseaenderung/anwenden.ts`, `lib/reiseaenderung/geschuetzt.ts`: READ-ONLY zur Klärung von Copy/Apply, Commercial-Protection, Revision und User vs Provider. **Nicht aufrufen, um reale Schreiboperationen durchzuführen**. Keine Modelloperationen ausführen.
- `lib/trips/schema.ts`: Originalschema/Trip-Grenzen, bestehende Validierung (nicht duplizieren/abschwaechen).
- `lib/trips/arbeitsbereich.ts`: derselbe kanonische `ohneTag`-Bestand; keine doppelte Addition von ungeplanten Punkten.
- `lib/trips/trip-timeline-temporal-review-1.ts`: `tripZeitpruefung`, `Zeitpruefung`, `pairs`/`coverage`. **Wichtig:** `eventIds` und subevent indices sind teilweise snapshot-lokal; niemals blind als persistente cross-snapshot identity vergleichen; bestätigte/ mögliche/ nicht prüfbare Konflikte getrennt halten.
- `lib/trips/naechte-abdeckung.ts`, `lib/trips/flug-abdeckung.ts`, `lib/mobility/kanten.ts` mit ihren Tests. `selected` ≠ tatsächlicher Provider-Booking-PASS, `covered_by_flight` ≠ neue Ground-Transfer-Lücke; UNKNOWN bleibt UNKNOWN. Keine eigene Nacht-/Zeit-/Route-Engine.
- `docs/JETNITY_BINDING_BUILD_ORDER.md`, `docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`, `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`, `docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`, `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`.
- `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/ACTIVE_WORK_STATUS.md`, `.jetnity/operating-mode.json`, canonical [#751](https://github.com/Jetnity/jetnity/issues/751) latest material checkpoints + newer relevant [#748](https://github.com/Jetnity/jetnity/issues/748).

Wenn ein notwendiger Contract ohne Änderung bestehender Kanonik nicht sicher nutzbar ist: **STOP und minimalen TL Scope-Amendment-Vorschlag mit Reproducer**; keine stillen Vertrags-/Typänderungen.

## 3. Nur eine begrenzte Domain-Foundation

### D1 – stabile, reine Vergleichseingabe und sichere Grenze

Unter **NEU** `lib/reiseaenderung/change-impact-foundation-v1/**` einen typisierten, providerneutralen **pure** `changeImpactFoundationV1(baseline: Trip, observed: Trip)`-ähnlichen Entry Point samt V1-Resultatvertrag definieren. Zwei Snapshots aus einem sicheren internen Aufruf, **keine untrusted API oder LLM payload authority**. Die Funktion verändert weder Inputs noch globale Flags, startet keine Client-/Server-Calls und ist deterministisch für gleiche Daten.

- Vor tiefer kanonischer Auswertung bounded Shape/Count/Text/Depth prüfen; Cycles, Getter, Proxy, Prototype-Tricks, duplicate item IDs, invalide oder oversized Snapshots fail-closed. Nutze vorhandene `reiseSchema`-/`GRENZEN`-Kanonik, nicht zweitklassige weichere Validatoren.
- Beide `id` müssen dieselbe Reise kennzeichnen, sonst `blocked_cross_trip` (nie cross-user/cross-trip correlation). `revision` ist nur gespeicherte Versionsangabe, keine extern bestätigte Aktualität; identische `revision` mit geändertem Inhalt als explizit `same_revision_unverified` markieren, nicht als bewiesene echte Aktualisierung ausgeben. Umgekehrte/unklare Revision fail-closed oder klar als nicht bewertbar kennzeichnen (V1-konsequent testen).
- Keine Annahme eines `documents[0]` Standard-Passes, keine neue Account-/Identity-/Traveller-Fact-Verarbeitung. Keine PII-, URL-, Passport-, Booking-/Payment-Rohwerte in Fehler-/Ablauf-Logs.
- Versionierter Report mit `claimScope:'stored_plan_snapshots_only'`, `authority:'user_stored_plan_not_provider_confirmed'`, `evaluation:'complete'|'partial'|'incomplete'|'blocked'`, bounded count/omitted, reasonCodes, explicit `notChecked`, reference identity + snapshot relation; Ergebnis nie `recovery_done`, `trip_safe`, `price_confirmed` oder `visa_ok`.

### D2 – tatsächliche direkte Änderungs-Evidence

Für dieselben stabilen kanonischen Day/Stage/Item-IDs minimalen source-traceable `direct_change`-Katalog aufbauen: neu/entfernt/angehängter Tag/Etappe/verschobenes gespeichertes Datum, Uhrzeit oder Zuordnung — **nur** wenn Originalfelder konkret differieren. `reiseDiff` für kanonische bisherige menschengerechte Zusammenfassung wiederverwenden, soweit sicher begrenzt; kein paralleles generisches UI-Diff. Erhalte unzugeordnete Items eindeutig ohne Doppelzählung.

**Keine Commercial-Truth-Änderung behaupten:** User-marked booking changes sind nur User-Facts; externe Bestätigung/Verfügbarkeit bleiben ungeprüft. Routen-Text, Ortsnamen und Reisedauer allein beweisen keine Verfügbarkeit/Transfer-/Anschlusszeit. Nie Preisschätzung erzeugen.

### D3 – begrenzte nachvollziehbare Abhängigkeiten ohne erfundene Kausalität

Nur **direkt belegte** kanonische Beziehungen wie dieselbe persistente `stageId`, `dayId`, identische `TripItem.id` oder echte kanonische Zeitpaar-`itemIds` verwenden. Falls ein Abreise-/Ankunftsplanpunkt oder Stage-/Day-Datum geändert wurde, dürfen andere damit verbundenen Planpunkte als `needs_review` mit eindeutigem Beziehungsgrund markiert werden, **nicht** als bewiesen defekt/storniert. Änderung von einem völlig unabhängigen Item darf nicht alle folgenden Etappen pauschal beschädigt melden. Kein Transit-/Timezone-/Minimum-Connection-Raten aus blossen Ortsnamen.

Beweisklassen sauber trennen: `direct_change` (gespeicherter Wert anders), `canonical_evaluation_delta` (wirklich differenter originaler kanonischer Status), `relation_needs_review` (gespeicherte ID-Beziehung, Auswirkungen ungeklärt), `unknown` / `not_evaluable`. Kein freier LLM-Score, Severity- oder kostenoptimierter Recovery-Algorithmus. Stabile Sortierung nach fixen Fachbereich-/ID-Schlüsseln statt Runtime Locale. Pro Claim internal refs, source function und reasonCodes.

### D4 – kanonische Vorher/Nachher-Bewertung statt zweite Truth

V1 **darf** aktuelle Evaluatoren je Snapshot aufrufen und nur nachweisbare *Planungs*-Status-Unterschiede gegenüberstellen:
- `tripZeitpruefung`: proven/possible/not_evaluable getrennt; `no_proven_conflict` != safe. Vergleiche Paar-Identitäten **nur** soweit die ursprünglichen persistenten Planpunkt-`itemIds` eindeutig reichen; Event-/Subevent-IDs NICHT cross-snapshot als stable behandeln. Nicht beweisbare neue Konflikte werden explizit `unknown`.
- `unterkunftAbdeckung`: bekannt/unklar, bekannte tatsächliche Planungslücken A vs B mit Original-Lückenobjekten; kein unqualifizierter „0 Lücken = alles bereit“-Claim.
- `flugAbdeckung`/`mobilitaetsAbdeckung`: determinable/unknown, open/selected/user-booked/covered_by_flight; keine tatsächliche Flugverspätung, Transferbuchung oder Provider-SLA.
- Baseline-Knoten/Zustand und observed-Knoten/Zustand klar beschriften und niemals ohne gemeinsames kanonisches Auswertungsniveau eine „aufgelöst“-/„neu bestätigt“-Aussage treffen.
- Ein Evaluator-Ausfall darf kein false-green erzeugen; vollständiger Report markiert partial/incomplete, andere unabhängig gesicherte Einträge erhalten bleiben nur soweit atomic cross-domain Truth ausdrücklich geschützt ist. Kein stiller Partial-PASS.

### D5 – Bounds, deterministische Outputs und Sicherheit

Arbeit über beide Snapshots begrenzen (maximale Instanz-/Paar-/Text-/Ausgabegrenzen aus kanonischem Schema ableiten oder enger wählen). Wenn Work-Limit oder Output-Cap greift: `incomplete` und sichtbarer `omitted`/reason, kein stiller Erfolg. Keine private Data-Logging- oder Browser-Storage- / Netzwerk-/DB/Provider-/LLM-/external SDK-Abhängigkeit. Keine globalen Mutable-Caches. Tests mit tief eingefrorenen Inputs, unverändertem Snapshot vor/nach, Abort nicht nötig (kein I/O), stable order unabhängig von Locale/timezone/environment. Keine Performance-Explosion durch O(n²) ungebremste Pair-Erweiterung.

### D6 – fokussierte synthetische Akzeptanz

Mindestens die folgenden eigenen Tests im NEUEN Namespace plus Regression gegen ORIGINAL Canonical-Tests:

T01 unveränderte Snapshotkopien desselben Trip → keine erfundenen Impacts, voller `notChecked`-Scope.  
T02 synthetischer Multi-Stage Zürich→Panama→Costa Rica: vorhandener Flugplanpunkt verschiebt sich A→B; tatsächliches Feld-Delta, direkte Tages-/Etappenrelationen als `needs_review` und keine erfundene Flug-/Hotel-/Visa-Wahrheit.  
T03 zwei gespeicherte Items mit kanonisch belegtem neuerdings *possible* Time-Pair; Originalstatus exakt übernommen, nicht zu `proven` hochgestuft; missing clock/timezone → `not_evaluable`.  
T04 ursprünglicher nachweisbarer kanonischer Zeitkonflikt verschwindet nur soweit die ORIGINAL canonical evaluation ihn wirklich verliert; `no_proven` ausdrücklich kein weltweites „sicher“.  
T05 Unterkunftsnacht/Etappenzeit nur als bekannte Originallücken vergleichen; unbekannte/schlecht zugeordnete Stays oder Bookings keine erfundene bestätigte Übernachtung.  
T06 Flug- und Mobilitätsabdeckung inklusive `covered_by_flight`, unbestimmbaren Verbindungen und offenen Kanten; nur gespeicherte Planung, keine Echtzeit.  
T07 same trip stable refs, Gast-/Account derselbe fachliche Vertrag, multiple gleichartige Items bleiben voneinander unterschieden, `ohneTag` nicht doppelt; andere `trip.id` fail-closed.  
T08 gleicher Revision aber anderer Inhalt, rückwärts laufende Revision, widersprüchliche Version/fehlende IDs → explizite Review-/Blocked-Klassifikation ohne spekulative Provisions.  
T09 grosse, malformed, zyklische, accessor-/proxy-/prototype-manipulierte, doppelte ID-/over-limit Daten → bounded `incomplete` oder `blocked` ohne sensitive Reflexion/Leak.  
T10 deterministic output/IDs/order unter Reordering, frozen input, repeat and same-revision content edits; no ambient clock/locale/LLM/data mutation.  
T11 genau belegte relations vs ausdrücklich unbeteiligter TripItem (kein „alle folgenden fallen aus“); multiple direct changes aggregate without double count; unknown links not guessed.  
T12 static nonactivation and security: no `fetch`, `axios`, `http`, DNS, Supabase, realtime, user upload, model, paid search, server action, API, UI or new runtime imports; `lib/readiness/provider.ts` bleibt `null`; no package/workflow/Auth/RLS/Production edits. No extra hidden writable side effects.  

Synthetische Fixtures ohne echten Nutzer, Buchungs-ID, Pass-, Zahlungs- oder Standort-Geheimnisse. Keine private Logs, kein reales Personenprofil als Test- oder PR-Evidence.

## 4. STRIKTE FILE-OWNERSHIP

**Erlaubte WRITES ausschliesslich:**

1. **NEW** `lib/reiseaenderung/change-impact-foundation-v1/**` für pure Code- und synthetische Test-Dateien (kleine kohärente Familie; kein zweiter `Trip`-Kanon).
2. **NEW** task-eigene Docs `docs/JETNITY_CHANGE_IMPACT_FOUNDATION_V1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-16.md`.
3. Optional **NEW** sanitisiertes synthetisches Evidence-Verzeichnis `docs/evidence/jetnity-change-impact-foundation-v1/**`.

**NIEMALS ÄNDERN:** diese IMMUTABLE TASK, irgendeine bestehende Datei unter `lib/reiseaenderung/**` ausser **neuen** Files im genannten Namespace; bestehendes `lib/trips/**`, `lib/mobility/**`, `types/**`, `lib/route/**`, `lib/readiness/**`, `app/**`, `components/**`, öffentliche Seiten, Provider, Account, Auth, SQL/Migrations, Supabase/RLS, `package.json`/lock, Workflows, GitHub Regeln, globales CSS, Secrets, Production/Deploy-Konfig oder #955 Dateien. Auch **keine neue UI-Route, Import in bestehende Runtime, Watch/Alert oder Hintergrundjob**. Falls etwas nur mit bestehenden Shared-Contract-Änderungen geht: **STOP für minimalen Technical-Lead-Scope-Gate**.

## 5. Multi-Agent Suitability / Merge Order

**Decision:** `SINGLE_AGENT` innerhalb dieser eng gekoppelten Foundation; `MULTI_AGENT` nur über **separate disjunkte Aufgaben** mit Trip Audit #955 hinweg. Dieser neue Writer ist **Jetnity Change Impact Foundation V1 — Codex Generation 1** in einer **neuen** Session, die der Product Owner erst erstellt. Das ist **nicht** der #955-Agent `Jetnity Trip Audit V1 — Codex Generation 1`, Session `01a141ad-1220-7462-bced-c75469dab1d3`, dessen R1/R2 Review-Fix unabhängig abgeschlossen wird.

- Baseline von verifiziertem `main@69a182ea4...`; **KEINE Abhängigkeit von ungemergtem #955** Code oder dessen Trip-Audit-Namespace.
- Schreibownership disjunkt: neues `lib/reiseaenderung/change-impact-foundation-v1/**` vs #955 `lib/trips/trip-audit-v1/**` + seine UI-Integration. Gemeinsame Kanonik nur READ-ONLY.
- Nur Technical Lead bestimmt Integrationsreihenfolge. Wenn #955 vorher gemergt wird, erneut main/merge-base/ahead/behind prüfen und exakt-head-Gates auf neue Basis neu erfüllen; kein stiller Rebase/Force-Push, kein Autor-Merge.
- Jeder neue PR-/Review-Fix-HEAD invalidiert alte Check-Gates; `CHANGES REQUIRED` geht an **denselben** Autor/dieselbe Session.

## 6. Security/PO-Gates und Original-Gates

Mode NORMAL ist keine Provider-/Source-/Production-/DB/Launch-Freigabe. Allzeit bindend: [#917](https://github.com/Jetnity/jetnity/issues/917) SOURCE_NOT_QUALIFIED; [#944](https://github.com/Jetnity/jetnity/issues/944) keine echte behördliche GET/BMDS-Kontaktaufnahme, DEV-PREP-1 Platform-Safety Datenbank-Readback blocked/migration 2 NOT ATTEMPTED; #911/#913 Privacy blocker; #934/#937 Bern Stop; #626; neue Auth/RLS/Traveller-/Passport-/Sensitive-Data-/Pricing-/Provider-/Billing-/Public-launch/SEO-Gates und USD-100/Monat-Kostengrenze. KEINE neuen externen Calls, Secrets, AI-Modelle, Zahlungen, Freigaben. Kein Full Access auf Basis der früheren **#953/#955** temporären PO-Freigaben: Die sind beendet; neue Session läuft normal mit `Für mich genehmigen`, bei DNS/Git/npm-Block **STOP** und TL fragen, nicht Mirror/Proxy/API-upload/alternate runner.

Author läuft: verpflichtende Einstiegspunkte + frische #751/neu #748 → exakte main/Branch/TASK-Blob/Mode prüfen → eigens `PLAN` → Module und T01–T12 implementieren → fokus- und original Projektchecks (Setup/Mode/Typecheck/Lint/full native-PG tests/API/schema/dead/exports/deps/Next16.4.1 Build + Auth) wahrheitsgemäss dokumentieren → task-owned REPORT/SELF_REVIEW/HANDOFF → erlaubter normaler Branch-only Commit/Push auf den bestehenden Draft PR, kein Force, keine fremden Credentials/Netztricks → tatsächlichen exakten Remote Head/Tree/CI/Auth/Vercel Preview prüfen → **STOP für unabhängigen Technical Lead**.

Keine eigene READY-/MERGE-Entscheidung durch Code-Autor, keine Production-Veröffentlichung, kein What-if/Recovery Provider, keine echten Flugdaten oder Visa-Aussagen, **KEIN AUTOMATISCHER FOLGESLICE**.

**STOP — CHANGE_IMPACT_FOUNDATION_V1 TASK_ONLY / NEW CODEX AUTHOR NOT DISPATCHED.**
