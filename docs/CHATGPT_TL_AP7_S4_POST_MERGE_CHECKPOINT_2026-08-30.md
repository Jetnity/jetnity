# Jetnity – Technical-Lead AP-7-S4 Post-Merge Checkpoint

Stand: 30. August 2026  
Status: **AP-7-S4 COMPLETE / POST-MERGE GREEN / NO AUTOMATIC FOLLOW-UP**

> Live-Evidence gewinnt immer. Dieser Checkpoint dokumentiert den zuletzt vollständig verifizierten Stand. Vor jedem neuen Slice erneut `main`, PRs/Issues, CI, Vercel, Supabase und relevante Shared Contracts live prüfen.

## 1. Current main

AP-7-S4 wurde integriert.

- Source Draft PR: **#223 – AP-7-S4 – Registry → Trip Snapshot materialization**
- Issue: **#222 – CLOSED / completed**
- Cursor-Agent: **`Account plattform audit vorbereitung 18`**
- finaler Source-/Recovery-Head: `f366ea839dfd3560b4ca2f0b4ec054f0ed8c463a`
- Recovery PR wegen bekanntem Draft→Ready-Connectorfehler: **#224**
- Merge-Commit / neuer `main`: `e33341b30019fb1a57c2cc6f2cd8c0b0a3a85f40`

## 2. Independent Technical-Lead Review

Erster Review auf `40204e2218db097e50a4016c1a66569ca4275eed` ergab **CHANGES REQUIRED**: Die Runtime-Architektur war korrekt, aber die verbindliche Test-Acceptance deckte die S4-Write-/Authorization-Orchestrierung noch nicht tief genug ab.

Derselbe Agent / dieselbe Session wurde erneut aktiviert. Der Review-Fix führte eine kleine testbare Orchestrierungsnaht ein und bewies explizit:

1. unauthenticated → fail closed, kein Trip-/Registry-/Write-Aufruf;
2. Trip missing / RLS-hidden → fail closed, kein Registry-/Party-Write;
3. Registry missing / invalid / RLS-hidden → fail closed, kein Write;
4. Trip-Slot-Limit → kein Registry-Read und kein `party_schreiben`;
5. `party_schreiben` failure → ehrliche Fehlermeldung, kein Success-State;
6. bestehende Trip-Reisende werden nicht still ersetzt; geschrieben wird nur der neue inkrementelle Snapshot.

Der finale Exact-Head-Re-Review auf `f366ea839dfd3560b4ca2f0b4ec054f0ed8c463a` erhielt **TECHNICAL-LEAD PASS**.

## 3. AP-7-S4 Product Truth

Ein angemeldeter Owner kann in einer konkreten Konto-Reise bewusst einen gespeicherten Account-Registry-Reisenden auswählen und als **neuen unabhängigen trip-owned Snapshot** übernehmen.

Verbindlich bleibt:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

S4 verwendet den bestehenden AP-7-S1-Projektionsvertrag und den bestehenden atomaren Traveller-Write-Pfad `party_schreiben`.

Materialisierung erzeugt frische trip-eigene Identitäten / `clientRef`s für:

- Traveller;
- jede Citizenship;
- jedes Document.

Erhalten bleiben:

- Residence Country;
- alle Citizenships bis zum bestehenden Limit;
- alle unterstützten Document-Metadaten bis zum bestehenden Limit;
- `passport | national_id | unknown`;
- Issuing Country unabhängig von Citizenship;
- optionale Document→Citizenship-Relation, remapped auf neue Trip-Citizenship-Refs;
- `expiresOn`.

Nicht eingeführt:

- Registry-ID als Trip-ID;
- Live Registry→Trip FK/Referenz;
- automatischer Sync nach Registry-Edit/Delete;
- Guest→Registry Import oder Dedup;
- Default-/Primary-/Preferred-/Chosen-Pass oder Citizenship;
- `documents[0]`-/`citizenships[0]`-Wahrheit;
- Pass-/Dokumentnummern;
- Scan/MRZ/Biometrie/DOB/Health;
- automatische Best-Pass-/Visa-/Entry-Entscheidung.

## 4. Exact-head gates

Source final head `f366ea839dfd3560b4ca2f0b4ec054f0ed8c463a`:

- CI #1291 / run `33279176614`: **SUCCESS**;
- Vercel Preview `dpl_AsQGw7AmakovtqzhsTZ93AACrvjt`: **READY**;
- GitHub Review-Threads: **0**.

Recovery PR #224, gleicher Exact Head:

- CI #1292 / run `33279576332`: **SUCCESS**;
- Vercel Preview `dpl_BK8hR1Ufw6vqhwNyc5ddfzYcdbbR`: **READY**;
- GitHub Review-Threads: **0**.

Post-Merge `main @ e33341b30019fb1a57c2cc6f2cd8c0b0a3a85f40`:

- CI #1293 / run `33279680487`: **SUCCESS**;
- Vercel Production `dpl_6GZsxWbYwuY4LxFG8D8GoqK5Cxm8`: **READY**;
- Vercel exact `githubCommitSha`: `e33341b30019fb1a57c2cc6f2cd8c0b0a3a85f40`.

## 5. Supabase / Security / Privacy

AP-7-S4 hat **keine** Supabase-Mutation durchgeführt.

Keine Änderung an:

- Migrationen;
- Schema;
- RLS;
- GRANT/REVOKE;
- Ownership;
- SECURITY DEFINER/INVOKER;
- Auth / Sessions / MFA / AAL;
- Production-/Development-Daten.

Die bestehenden AP-7-S2 owner-only Registry-RLS sowie die bestehenden trip-scoped Ownership-/RLS-Verträge bleiben maßgeblich.

## 6. AP-7 cumulative status

Integriert sind jetzt:

- AP-7 Gate 0 / Dual-Authority PO approval;
- AP-7-S1 pure Domain Contract;
- AP-7-S2 Registry Persistence / Identity / owner-only RLS auf Production;
- AP-7-S3 echte `/account/travellers` CRUD/UI;
- **AP-7-S4 explizite Registry → Trip Snapshot Runtime-Materialisierung**.

S1–S4 dürfen nicht erneut als zukünftige Arbeit geplant werden.

## 7. Known risks / gates

Unverändert offen:

- **P1 Infrastructure Debt:** malformed Production migration-history body für Version `20260829140000_trip_item_commercial_provenance`; vor Rebase/Reset/Replay/migrationsnaher Arbeit separat behandeln. History-Repair bleibt Product-Owner-gated.
- **P2 Governance:** `main protected=false`.
- Provider/Commercial Runtime bleibt unvollständig; echte Provider, Secrets, paid calls und Live-Aktivierung bleiben gegated.
- TW-8 bleibt hinter Provider S5 + realer Commercial Provenance.

## 8. Agent status

`Account plattform audit vorbereitung 18` ist nach AP-7-S4 **STOPPED / completed**.

Keine aktive Cursor-Generation ist durch diesen Checkpoint für einen Folgeslice autorisiert.

## 9. Next-step rule

**Kein automatischer Folgeslice.**

Vor dem nächsten Agenten:

1. aktuellen `main` und Post-Merge-Gates live re-checken;
2. `docs/JETNITY_BINDING_BUILD_ORDER.md` und `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` gegen den jetzt integrierten AP-7-S1–S4-Stand reconciliieren;
3. verbleibende Traveller-/Document-Lifecycle-/Multi-Citizenship-Produktlücken bestimmen;
4. migrationsnahe Kandidaten gegen den bekannten Supabase-Replay-P1 prüfen;
5. erst danach einen bounded Slice festlegen;
6. neue logische Einheit → frischer Cursor-Agent; Review-Fix → derselbe Agent.

Ein möglicher fachlicher Kandidat ist die nächste Traveller-/Document-Lifecycle- oder kontextabhängige Credential-Options-Arbeit. **Dieser Checkpoint autorisiert sie nicht automatisch und autorisiert insbesondere keine automatische „bester Pass“-Entscheidung.**
