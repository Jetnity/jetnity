# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B3A CLOSED / E5-B3B AGENT HEAD TL-PASS / FINAL INTEGRATION GATES PENDING / NO PRODUCTION APPLY / LIVE-EVIDENCE WINS**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

> Jeder neue Head invalidiert ältere Exact-Head-Gates. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3B_REVIEW_2026-08-31.md` ← **aktuellster unabhängiger TL-Review**
2. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_HANDOFF_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_STATUS_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_TASK_2026-08-31.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`
8. E5-B1R Closure/Handoff
9. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
10. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
11. `docs/JETNITY_BINDING_BUILD_ORDER.md`
12. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Migration-/Persistenzfragen zusätzlich Supabase Production read-only prüfen.

## 2. Aktueller kanonischer main

`main@ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8`

Commit:
`Close Entry Requirements E5-B3A continuity (#342)`

Live verifiziert:

- Main CI #1529 / Run `33430799991`: **SUCCESS**;
- Vercel Production: **SUCCESS** auf exakt diesem main;
- Issue #338: CLOSED / completed;
- Parent #294: OPEN;
- Supabase Production E5-B3A Migration: weiterhin **UNAPPLIED**.

## 3. E5-B3B aktiver Integrationsstand

Issue:
**#343 – Entry Requirements E5-B3B – server-observed Flight provider retrieval timestamp evidence**

Draft-PR:
**#344**

Branch:
`feat/entry-requirements-provider-retrieval-time-e5b3b-2026-08-31`

Agent:
**`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1

Session:
`bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`

Pre-agent head:
`d3baa9c7efb5f9ef8ba658b953d752cf6adc130c`

Runtime commit:
`09d5c0e0b46e6cdbb8e08459fe953cbb54f0c433`

Finaler Agent-/Delivery-Head:
`6dc59f7e26d77f616cf390db724385b200ba6f2a`

Independent TL verdict auf diesem Agent-Head:
**PASS / no open P0-P1-P2 findings.**

Exact-head evidence auf `6dc59f7e...`:

- CI #1532 / Run `33432418195`: **SUCCESS**;
- Auth + Typecheck + Lint + full Tests + Hygiene + Production Build: SUCCESS;
- Vercel: SUCCESS;
- GitHub review threads: 0;
- main unverändert `ad7fb1fa...`, branch 0 behind;
- Supabase Production E5-B3A objects weiterhin absent/unapplied.

Der TL zieht jetzt ausschließlich Continuity-Dokumente nach. Dadurch entsteht ein neuer finaler Integrations-Head; **nur dessen neue Gates dürfen für Merge zählen**.

## 4. Was E5-B3B fachlich liefert

`FlugProviderTreffer` trägt jetzt einen required server-only Snapshot-Zeitfakt:

`retrievedAt: string`

Semantik:

- Jetnity-Serverzeit des erfolgreich gelesenen Provider-Snapshots;
- kanonisches UTC ISO mit `Z`;
- genau einmal pro Provider-Treffer;
- nicht aus Provider-/Browser-Payload;
- keine Freshness-/Availability-Garantie;
- nicht in `FlugOption` oder `FlugSegment`;
- nicht in Ranking, Browser-Antwort, Route oder Trip-Metadata.

Der aktive Duffel-Adapter mintet den Wert nach erfolgreicher HTTP-Antwort und erfolgreichem JSON-Lesen. Ein kleiner Clock-Port ist nur für deterministische Tests injizierbar; Production nutzt die Serverzeit.

Explizite Regressionen beweisen:

- Payload-Felder `retrievedAt`, `retrieved_at`, `observedAt`, `observed_at` können den Wert nicht setzen;
- 401/403/500/Timeout/unlesbares JSON liefern keinen erfolgreichen timestamped Treffer;
- invalid Mapping bleibt invalid;
- Browser serialisiert keinen Retrieval-/Observation-Zeitfaktor;
- E5-B1R/E5-B2A und Angebots-Cap bleiben intakt.

## 5. Production / Persistenz bleiben geschlossen

E5-B3B baut **keinen** Persistenz-Mint und verändert Production nicht.

Weiterhin nicht live:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`.

`flugNachweisAusUmgebung()` bleibt `null`.  
`requirementsProviderAus()` bleibt `null`.

## 6. Product-Owner-Gates bleiben bindend

Explizite Product-Owner-Freigabe bleibt erforderlich vor:

- Production-Apply der E5-B3A-Migration;
- Production-RLS/Grant/Role/Function-Mutation;
- Runtime-/Login-Principal-Allokation;
- realem Application-Writer oder Backfill;
- Provider/Vertrag/DPA/Secret/paid/live activation;
- fundamentalen Auth/MFA/AAL-Änderungen;
- sensitiven Pass/MRZ/Scan/Biometrie-/Health-Daten;
- realen Payments;
- Kosten außerhalb des freigegebenen Budgets;
- Public Launch / irreversibler externer Aktivierung.

## 7. Entry Requirements Foundation

Vorhanden:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution;
- E5-B3A repository persistence/security foundation;
- E5-B3B server-observed provider retrieval timestamp core, aktuell im finalen Integrationsprozess.

Weiterhin inaktiv:

- Production-applied Flight Event Provenance;
- TypeScript persistence mint;
- realer writer/runtime principal;
- Trip/Route → OfficialTemporalAnchor occurrence resolver;
- E5-A automatic binding;
- workspace deadline/action-window/urgency;
- task persistence/completion;
- reminders/push/email;
- real Requirements provider;
- credential/passport ranking.

## 8. Traveller-/Produktwahrheit unverändert

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

Kein Default-/Primary-/Preferred-/Chosen Passport oder Citizenship. Issuer Country != Citizenship. Keine Residence→Nationality-Inferenz. Kein `documents[0]` / `evaluations[0]` als Product Truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

## 9. FIRST NEXT ACTION

1. finalen TL-Integrations-Head nach den drei TL-Continuity-Commits live lesen;
2. gegen `6dc59f7e...` verifizieren, dass ausschließlich drei TL-Dokumente hinzugekommen sind;
3. neue Exact-Head-CI/Vercel/Threads/Main-Drift-Gates verlangen;
4. erst danach Ready/Merge-Recovery gemäß Operating Standard;
5. nach Merge Main-CI/Vercel erneut prüfen;
6. Issue #343 und Parent #294 aktualisieren;
7. docs-only Closure-Checkpoint erstellen und ebenfalls vollständig gaten;
8. **kein Production-Apply und kein automatischer Folgeslice ohne neuen autorisierten Auftrag.**

**Live-Evidence wins always.**
