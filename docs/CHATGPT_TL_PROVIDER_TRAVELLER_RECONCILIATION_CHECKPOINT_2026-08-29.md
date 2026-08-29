# Jetnity – Provider / Traveller Current-State Reconciliation Checkpoint

Stand: 29. August 2026  
Status: **CURRENT-STATE CHECKPOINT / LIVE-RECONSTRUCTED / DOCS ONLY**

> Live-Evidence gewinnt immer. Vor jedem neuen Slice gilt `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

## 1. Baseline dieses Checkpoints

- Repository: `Jetnity/jetnity`
- Live-`main` vor diesem Docs-Slice: `3bb81004b4daf981a83bfcd2fef27864dd002155`
- `main` Branch Protection: `protected=false` – weiterhin Governance-Risiko.
- Dieser Slice ändert ausschließlich Current-State-/Continuity-Dokumentation. Keine Runtime, keine Providerverbindung, keine Supabase-Mutation.

## 2. Provider – tatsächlich integriert

### Shared Provider Core

- ADR-0199 / `lib/server/providers/core/*` ist integriert.
- Finaler unabhängig gegateter Implementierungs-Head: `191235a536b0c14c71ff175336f588c6b737a673`.
- Draft-Transport #187 wurde wegen des bekannten GitHub Draft→Ready-Connectorfehlers geschlossen; Recovery-PR #197 transportierte denselben gegateten SHA.
- Merge `c5aae6b533bee3c0ee747803e196bd3a2235dc8a`; Post-Merge-Continuity `085c95b22130232c5b5819ef8a4bcc302cc0f52b`.
- Core enthält server-only Transport, bounded response I/O, Timeout, Retry/Backoff, 429/Retry-After, Rate-Limit-Preflight, Secret-Redaction, Observability und fail-closed Request-/Config-Grenzen.
- Core erzeugt **keine** Commercial Provenance und besitzt keinen forgebaren Live-/Trust-Schalter.

### Skyscanner Flights

- Offline Adapter Foundation ist integriert (Recovery-PR #186).
- `lib/providers/flights/domain.ts`
- `lib/providers/skyscanner/flights/contracts.ts`
- `lib/providers/skyscanner/flights/adapter.ts`
- Aktueller Adapter ist strikt Fixture-only (`evidenceMode='fixture'`), ohne Netzwerk, Secret, `live_api`, `persisted_snapshot` oder Trusted-Live-Constructor.
- Nächster Provider-Implementierungskandidat nach einem frischen Slice-Precheck: serverseitiger Skyscanner Create/Poll-Lifecycle über den Shared Provider Core, zuerst dependency-injected/mock/offline. **Kein echter Key, kein realer Call und keine Live-Truth-Promotion in diesem ersten Transport-Slice.**
- Refresh Prices / echte Quote-Freshness bleibt ein späterer eigener Wahrheits-/Freshness-Schritt; TW-8 darf nicht aus bloßem Create/Poll-Fixture-Test geöffnet werden.

### HBX Hotels

- Contract-/Audit-Evidence ist integriert über Recovery-PR #199; Merge `897f8e0b1975eddf96f88e6f2746a11e93eb8fe4`.
- Post-Merge CI #1240 SUCCESS, Vercel SUCCESS.
- HBX bleibt Jetnitys **erster konkreter Hotels-Adapter-Zielprovider**; Booking.com Demand und Expedia Rapid bleiben spätere Hotelprovider.
- Contract hält mTLS, API-Key/X-Signature, fail-closed 5xx-Retry-Grenzen, Pricing-Modell und Boards-Taxonomie getrennt.
- Keine HBX-Runtime, Credentials, Signup, Calls oder Booking-/Merchant-Aktivierung.

### Viator Activities

- Contract-/Audit-Evidence ist integriert über Recovery-PR #200; Merge `a9f9c3a6d0c31f7676aa686148939948a7858012`.
- Post-Merge CI #1243 SUCCESS, Vercel SUCCESS.
- Viator bleibt erster spezialisierter Activities-Zielprovider.
- Full-access Affiliate / Redirect-Modell ist der bevorzugte Jetnity-Fit; Booking/Payment bleibt bei Viator.
- `/availability/check` ist die spätere relevante Current-Availability-/Price-Evidence-Fläche; Search/Preview darf nicht als Live-Quote ausgegeben werden.
- Keine Viator-Runtime, Credentials, Signup, Calls oder Redirect-Aktivierung.

### 12Go Mobility

- Contract-/Audit-Evidence ist integriert über Recovery-PR #201; Merge `d31e6966fdcb66d0e327a5960194a035676251c1`.
- Post-Merge CI #1245 SUCCESS, Vercel SUCCESS.
- Eindeutige ADR: **ADR-0200**; ADR-0199 bleibt Shared Provider Core.
- 12Go bleibt erster spezialisierter Mobility-Zielprovider.
- Öffentliche Affiliate-/URL-Evidence ist **keine API- oder Commercial-Truth-Evidence**.
- Auth, private API-Endpunkte, Payloads, Quotas, Sandbox und Rate-Limits bleiben UNKNOWN, bis 12Go nach Zustimmung offizielle/vertrauliche Unterlagen bereitstellt.
- Synthetische Jetnity-Fixtures dürfen nicht als 12Go-API-kompatibel dargestellt werden.
- Keine 12Go-Runtime, Credentials, API-Anfrage, Calls oder Affiliate-Aktivierung.

## 3. Commercial Provenance / Production – frisch read-only verifiziert

Supabase Production Project: `qscbgcdmivbbnzrcyegn`.

Am 29. August 2026 read-only gegen Production verifiziert:

- Migration `20260829140000` ist in `supabase_migrations.schema_migrations` registriert.
- `public.trip_item_commercial_provenance` existiert.
- Provenance-Zeilen: **0**.
- `jetnity_commercial_writer`: NOLOGIN vorhanden.
- `jetnity_commercial_runtime`: NOLOGIN + NOINHERIT vorhanden.
- interner Writer: `jetnity_internal.trip_item_commercial_provenance_schreiben(_eingabe jsonb)`, `SECURITY DEFINER`.
- EXECUTE auf Writer: `postgres` + `jetnity_commercial_writer`; **nicht** `authenticated`, **nicht** `anon`.
- `authenticated` auf Provenance-Tabelle: SELECT ja; INSERT/UPDATE/DELETE nein.
- `authenticated` und `anon` sind weder Mitglied von `jetnity_commercial_writer` noch `jetnity_commercial_runtime`.

Folgerung: S5-B Persistenzgrundlage ist real auf Production, aber der normale Product-/Provider-Runtime-Write-Pfad bleibt geschlossen. Es gibt weiterhin **keinen realen Provider-Snapshot**.

## 4. Traveller / Multi-Citizenship – tatsächlich integriert

Aktueller Current-Gap-Audit wurde unabhängig geprüft und über Recovery-PR #202 integriert; Merge `3bb81004b4daf981a83bfcd2fef27864dd002155`. Post-Merge CI #1248 SUCCESS, Vercel SUCCESS.

Kanonisches Modell bleibt:

> ein Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.

Bereits korrekt:

- mehrere Citizenships und mehrere Documents als 1:n;
- Issuer Country ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- kein Default-Pass / keine Default-Citizenship;
- historischer `documents[0]`-Fallback geschlossen;
- historischer First-Evaluation-/`evaluations[0]`-Truth-Kollaps geschlossen und fail-closed;
- Guest→Account Trip-Copy erhält Citizenships, Documents und Relation;
- AP-7 Gate 0 + Dual-Authority-Freigabe + AP-7-S1 Domain Contract integriert.

Tatsächlich noch offen:

- **AP-7-S2 Account-Registry Persistence / Identity / RLS** – keine account-scoped Traveller-Tabellen vorhanden;
- Registry CRUD / Lifecycle / UX;
- explizite Registry→Trip Runtime-Materialisierung;
- Requirements Provider bleibt `null`;
- spätere option-scharfe Official-/Safety-/Booking-Dokumentdarstellung erst bei echter Provider-Evidence;
- P3 Write-Hygiene: Duplicate-Country in `party_schreiben` kann einen unreferenzierten Duplicate-`clientRef` still verwerfen; verweist ein Dokument auf den verworfenen Ref, scheitert die Transaktion fail-closed mit `FOREIGN_CITIZENSHIP` – keine dangling Relation.

Keine Passnummern, Scans, MRZ, Biometrie oder Health-Daten im Kernmodell.

## 5. Was ausdrücklich NICHT fertig oder aktiviert ist

- kein echter Skyscanner/HBX/Viator/12Go API-Key oder Secret;
- keine echten Provider-Calls;
- kein Production Provider Runtime Principal;
- kein `live_api`-Commercial-Provenance-Snapshot;
- kein `persisted_snapshot` aus einem realen Provider;
- keine TW-8 Commercial Surfaces;
- keine Provider-Orchestrierung / Multi-Provider-Fanout;
- AP-7-S2 nicht gebaut;
- Legal Runtime `/privacy` / `/terms` weiterhin gesonderter AP-6-Block;
- `main protected=false` bleibt offen.

## 6. Product-Owner-/Hard Gates

Weiter ausdrücklich Product-Owner-/Sondergate vor der Aktion bei:

- realen Providerverträgen / Signup mit bindenden Bedingungen / Production-Secrets / paid calls / Live-Aktivierung;
- Production-Provider-Runtime-Principal oder Öffnung des S5-B Write-Pfads;
- Production-Migrationen oder große Identity/RLS-/Ownership-Vertragsänderungen;
- neuer Speicherung besonders sensitiver Pass-/MRZ-/Biometrie-/Dokumentdaten;
- Payments/Geldbewegungen;
- Kosten > USD 100/Monat;
- fundamentaler Build-Order-/Business-/Launch-Entscheidung.

Normale scope-treue Implementierungs- und Mergeentscheidungen bleiben Technical-Lead-autonom nach independent Exact-Head Review.

## 7. Exakter nächster kontrollierter Schritt

**Noch keinen neuen produktiven Slice aus diesem Checkpoint automatisch starten.**

Zuerst:

1. diesen Current-State-Checkpoint + globale Pointer integrieren und post-merge verifizieren;
2. danach neuen Slice gemäß Binding Precheck live rekonstruieren;
3. wenn unverändert sinnvoll: **Skyscanner Flights Server Create/Poll Transport Foundation** als eigener Task/Branch/Draft-PR mit neuem Cursor-Agenten.

Der erste Skyscanner-Transport-Slice soll:

- ausschließlich server-only sein;
- `lib/server/providers/core/*` konsumieren, keinen zweiten Transport-Kern bauen;
- feste offizielle Skyscanner Create/Poll-Endpunkte besitzen;
- Create/Poll-Lifecycle inkl. SessionToken, bounded Poll-Budget, Abort/Timeout und 429 behandeln;
- offizielle Request-/Response-Formen fail-closed parsen/normalisieren;
- Tests ausschließlich über dependency-injected/mock HTTP durchführen;
- `x-api-key` und andere Secrets niemals loggen/exponieren;
- **keinen** echten Credential-, Live-Call-, `live_api`-, S5-B-Persistenz- oder TW-8-Pfad aktivieren.

Echte Authentication, Live-Provider-Antwort, Commercial-Provenance-Promotion und Refresh-Price/Freshness bleiben nachgelagerte, separat gegatete Slices.

## 8. Recovery-Merksatz

Ein neuer Chat startet bei `JETNITY_START_HERE.md`, liest diesen Checkpoint als aktuelle Provider-/Traveller-Evidence, verifiziert dann Live-`main`, PRs, CI/Vercel und relevante Supabase-/Production-Evidence. Er startet keinen Slice aus Erinnerung oder aus einem alten self-expiring Statusblock.
