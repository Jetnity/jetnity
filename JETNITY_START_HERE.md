# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 29. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – muss zuerst der relevante Live-Stand rekonstruiert werden. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

Verbindliche Regel:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

Aktuellster Provider-/Traveller-Checkpoint:

`docs/CHATGPT_TL_PROVIDER_TRAVELLER_RECONCILIATION_CHECKPOINT_2026-08-29.md`

Dieser Einstieg ersetzt keine Live-Prüfung. Vor Änderung, Review, Ready oder Merge immer `origin/main`, relevante PRs/Heads, CI, Vercel, Supabase/Production-Evidence und parallele Workstreams live verifizieren.

---

## 1. Aktueller Live-Baseline-Kontext

Baseline vor dem aktuellen Docs-Reconciliation-Slice:

`main @ 3bb81004b4daf981a83bfcd2fef27864dd002155`

Aktueller Docs-Workstream:

- Branch: `docs/provider-traveller-current-state-reconciliation-2026-08-29`
- Draft-PR: **#203**
- Scope: ausschließlich Current-State-/Continuity-Dokumentation.
- Kein Cursor-Coding-Agent in diesem Slice.
- Keine Runtime-, Provider-, Supabase-, RLS-, Auth-, UI- oder Production-Mutation.

**Self-expiring:** Sobald PR #203 auf `main` liegt, ist die Pre-Merge-Klausel historisch. Danach zuerst Post-Merge-CI/Vercel verifizieren und erst anschließend den nächsten Slice neu rekonstruieren.

`main` Branch Protection war bei der letzten Live-Prüfung weiterhin `protected=false` – Governance-Risiko, aber kein Grund historische Arbeit neu zu bauen.

---

## 2. Provider – Current Truth

### Integriert

- **Shared Provider Adapter Core / ADR-0199** – integriert und post-merge verifiziert.
  - server-only Transport
  - Timeout
  - bounded Response-I/O
  - Retry/Backoff
  - 429 / Retry-After
  - Rate-Limit-Preflight
  - Secret-Redaction
  - Observability
  - fail-closed Config-/Request-Grenzen
  - kein forgebarer Trust-/Live-Schalter
  - keine Commercial-Provenance-Mint-Funktion

- **Skyscanner Flights Offline Adapter Foundation** – integriert.
  - Fixture-only
  - kein Netzwerk
  - keine Secrets
  - kein `live_api`
  - kein `persisted_snapshot`
  - kein Trusted-Live-Constructor

- **HBX Hotels Contract/Audit** – integriert und post-merge verifiziert.
  - HBX bleibt erster konkreter Hotels-Zielprovider.
  - Booking.com Demand und Expedia Rapid bleiben spätere Hotelprovider.
  - mTLS-/Pricing-/Boards-/Retry-Grenzen dokumentiert.
  - keine Runtime/Activation.

- **Viator Activities Contract/Audit** – integriert und post-merge verifiziert.
  - Viator bleibt erster spezialisierter Activities-Zielprovider.
  - Affiliate/Redirect-Modell bevorzugt; Booking/Payment bleibt bei Viator.
  - keine Runtime/Activation.

- **12Go Mobility Contract/Audit / ADR-0200** – integriert und post-merge verifiziert.
  - 12Go bleibt erster spezialisierter Mobility-Zielprovider.
  - vertrauliche API-Details bleiben bis Approval/First-Party-Dokumenten UNKNOWN.
  - synthetische Fixtures sind nicht als 12Go-API-kompatibel zu behandeln.
  - keine Runtime/Activation.

### Noch nicht vorhanden

- kein echter Provider-API-Key / Secret;
- keine echten Provider-Calls;
- kein Production Provider Runtime Principal;
- kein echter `live_api`-Quote-Snapshot;
- kein echter `persisted_snapshot` aus Providerantwort;
- kein Provider Orchestrator / Multi-Provider-Fanout;
- TW-8 bleibt geschlossen.

### Nächster Provider-Kandidat – noch NICHT gestartet

Nach erfolgreicher Integration dieses Docs-Checkpoints und einem **frischen Slice-Precheck**:

**Skyscanner Flights Server Create/Poll Transport Foundation**

Erster Transport-Slice nur dependency-injected/mock/offline, server-only und über `lib/server/providers/core/*`. Kein echter Key, kein realer Call, kein `live_api`, keine Production-Persistenz, kein TW-8.

Echte Authentication/Live-Providerantwort, Commercial-Provenance-Promotion und Refresh-Price/Freshness bleiben getrennte spätere Gates.

---

## 3. Commercial Provenance / Production – Current Truth

Supabase Production Project: `qscbgcdmivbbnzrcyegn`.

Am 29. August 2026 frisch read-only verifiziert:

- Migration `20260829140000` registriert;
- `public.trip_item_commercial_provenance` existiert;
- **0 Provenance-Zeilen**;
- `jetnity_commercial_writer` = NOLOGIN;
- `jetnity_commercial_runtime` = NOLOGIN + NOINHERIT;
- interner Writer `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)` = SECURITY DEFINER;
- `authenticated` / `anon` können den Writer nicht ausführen;
- `authenticated` hat SELECT auf der Provenance-Tabelle, aber kein INSERT/UPDATE/DELETE;
- `authenticated` / `anon` sind weder Writer- noch Runtime-Rollenmitglieder.

**Folgerung:** S5-B-Persistenzgrundlage ist real auf Production. Der normale Product-/Provider-Runtime-Write-Pfad bleibt geschlossen. Kein realer Provider-Snapshot existiert.

---

## 4. Traveller / Multi-Citizenship – Current Truth

Der aktuelle Traveller/Multi-Citizenship Current-Gap-Audit ist integriert (Recovery-PR #202) und post-merge verifiziert.

Kanonisches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Bereits korrekt:

- 1:n Citizenships;
- 1:n Documents;
- Issuer Country ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-Pass;
- keine Default-Citizenship;
- historischer `documents[0]`-Fallback geschlossen;
- historischer First-Evaluation-Kollaps geschlossen/fail-closed;
- Guest→Account Trip-Copy erhält Arrays und Relation;
- AP-7 Gate 0 + Dual-Authority-Freigabe + AP-7-S1 Domain Contract integriert.

Noch offen:

- **AP-7-S2 Account-Registry Persistence / Identity / RLS**;
- Registry CRUD / Lifecycle / UX;
- Registry→Trip Runtime-Materialisierung;
- Requirements Provider bleibt `null`;
- spätere option-scharfe Official-/Safety-/Booking-Dokumentdarstellung nur bei echter Evidence;
- einige P3-Hygiene-/Compatibility-Punkte laut aktuellem Audit.

Keine Passnummern, Scans, MRZ, Biometrie oder Health-Daten im Kernmodell.

---

## 5. Trip Workspace / Account / Legal – wichtige Gates

- TW-1 bis TW-7-A sind weitgehend integriert.
- **TW-8 Commercial Surfaces bleibt geschlossen**, bis reale Provider-Commercial-Provenance vorhanden ist.
- TW-9 bleibt danach als Polish/Accessibility/Performance/Closure-Phase.
- AP-5 Security-Slices S1–S5 sind integriert.
- AP-6a Legal Foundation Gate 0 ist integriert; echte `/privacy`-/`/terms`-Runtime und freigegebene Inhalte bleiben gesondert offen.
- AP-7-S1 ist integriert; AP-7-S2 ist nicht gebaut.

---

## 6. Besondere Product-Owner-Gates

Technical Lead arbeitet normal autonom. Eine ausdrückliche Product-Owner-Entscheidung bleibt erforderlich insbesondere vor:

- Production-Migrationen oder destruktiven/schwer rücknehmbaren Production-Datenänderungen;
- großen produktiven RLS-/Ownership-/Identity-Vertragsänderungen;
- fundamentalen Auth-/Session-/MFA-/AAL-Änderungen;
- Speicherung besonders sensitiver Pass-/MRZ-/Biometrie-/Dokumentdaten;
- neuer sensibler externer Datenweitergabe;
- realen Providerverträgen, Production-Secrets, paid calls oder Live-Aktivierung;
- Production Provider Runtime Principal / Öffnung des S5-B Write-Pfads;
- realen Payments/Geldbewegungen;
- neuen laufenden Kosten über USD 100/Monat;
- fundamentalen Produkt-, Geschäftsmodell-, Build-Order- oder Public-Launch-Entscheidungen.

Normale scope-treue technische Implementierung/Review/Merge bleibt Technical-Lead-autonom nach independent Exact-Head Review.

---

## 7. Verbindliche Pflichtlektüre

Jeder neue Chat / Technical Lead liest vor einem neuen Slice mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. bei Chatwechsel: `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`
5. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
6. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
7. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
8. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
9. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
10. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
11. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
12. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
13. `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
14. `docs/JETNITY_BINDING_BUILD_ORDER.md`
15. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
16. `docs/ACTIVE_WORK_STATUS.md`
17. `docs/CHATGPT_TL_PROVIDER_TRAVELLER_RECONCILIATION_CHECKPOINT_2026-08-29.md`
18. den relevanten Slice-Task/Status/Handoff/ADR und live GitHub/Supabase/Vercel-Evidence.

Historische Checkpoints bleiben Evidence ihres damaligen Zustands. Sie sind nicht Current Truth, wenn spätere Live-Evidence oder dieser aktuelle Checkpoint sie superseden.

---

## 8. Verbindlicher Workflow

1. **Live-Rekonstruktion / Duplicate-History-Gate vor jedem neuen Slice.**
2. Versionierter Task auf eigener Branch.
3. Eigener Draft-PR.
4. `@cursor` mit exaktem Agentennamen und Scope/Non-Scope.
5. Agent endet mit STOP; Agent-Self-Review ist kein PASS.
6. Independent Technical-Lead Exact-Head Review.
7. Findings → gleicher Agent / gleiche Session korrigiert.
8. Neuer Head invalidiert alle alten Gates.
9. Exact-Head CI + Vercel + relevante Production-Evidence.
10. Technical-Lead PASS.
11. Nur Technical Lead setzt Ready / merged.
12. Post-Merge-Verifikation.
13. Continuity aktualisieren, sodass ein anderer Chat exakt übernehmen kann.
14. Erst dann neuer Slice – wieder mit Live-Rekonstruktion.

Globale Current-State-Dateien sind Technical-Lead-owned. Parallelagenten dürfen ihre Workstream-spezifischen Status/Handoffs pflegen, aber nicht konkurrierend die globale Projektwahrheit überschreiben.

---

## 9. Exakter nächster Schritt

**Solange PR #203 offen ist:**

Independent Exact-Head-Review dieses Docs-only Reconciliation-Slices → CI/Vercel → PASS → Integration → Post-Merge-Verifikation.

**Nach Integration von #203:**

Neuen Slice vollständig live rekonstruieren. Wenn keine neue Evidence die Reihenfolge ändert, versionierten Task für **Skyscanner Flights Server Create/Poll Transport Foundation** erstellen und einen neuen, isolierten Cursor-Agenten starten.

Kein echter Provider-Key/Call, kein `live_api`, keine S5-B-Write-Öffnung und kein TW-8 in diesem ersten Transport-Slice.
