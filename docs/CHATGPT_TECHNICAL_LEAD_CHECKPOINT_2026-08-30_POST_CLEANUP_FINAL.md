# Jetnity – Technical Lead Checkpoint – 2026-08-30 POST-CLEANUP FINAL

Stand: 30. August 2026  
Status: **KANONISCHER CURRENT-STATE-CHECKPOINT / POST-CLEANUP FINAL / LIVE-EVIDENCE GEWINNT**  
Issue: #286

> Dieser Checkpoint **superseded** den früheren `docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_FINAL.md` für Current-State-Fragen. Der ältere Checkpoint bleibt historische Evidence für den Stand vor dem letzten mechanischen Cleanup.

## 1. Current Main Anchor

Pre-Handoff-Refresh-`main`:

`0f7d80fa48d958a8708af982806b99966289b2bd`

Dieser SHA enthält bereits den letzten mechanischen Repository-Cleanup aus PR #283.

- PR #283: `Cleanup: final mechanical repository leftovers`
- geprüfter PR-Head: `204511f552d58e246cd08fd8b724eb98edd4dc49`
- Merge auf `main`: `0f7d80fa48d958a8708af982806b99966289b2bd`
- Post-Merge CI #1399 / Run `33334863504`: **SUCCESS**
- Post-Merge Vercel: **SUCCESS**
- Issue #282: **CLOSED / completed**

Der docs-only Handoff-Refresh aus Issue #286 bewegt `main` danach erneut weiter. Der nächste Chat muss deshalb den finalen `main` live lesen.

## 2. Was jetzt vollständig abgeschlossen ist

### Legacy-/Old-Jetnity-Bereinigung

Abgeschlossen und nicht erneut als offene Arbeit behandeln:

- alte Creator Hub / MediaStudio / Feed / Blog / Render Runtime entfernt
- alte GitHub-Repositories `Jetnity/jetnity-bets` und `Jetnity/jetnity-travel` geprüft und gelöscht
- alter eigenständiger Supabase `jetnity-bets` geprüft und gelöscht
- zehn alte leere Legacy-Storage-Buckets entfernt
- 24 orphaned Legacy-Storage-Policies entfernt
- `creator-media` Source-Bucket nach Hardening, Backup und echtem Restore-Proof vollständig entfernt
- private Recovery `jetnity-legacy-recovery` bewusst retained
- 165 sicher gemergte GitHub-Branch-Refs fail-closed entfernt
- P1 Migration-History repariert und replay-verifiziert
- Core Repository Hygiene Audit vollständig abgeschlossen
- GitHub `main` geschützt
- letzte mechanische DELETE-CANDIDATEs D-01/D-02/D-03 abgeschlossen

### PR #283 – letzter mechanischer Cleanup

Entfernt:

- `supabase/.temp/cli-latest`
- `supabase/.temp/gotrue-version`
- `supabase/.temp/pooler-url`
- `supabase/.temp/postgres-version`
- `supabase/.temp/rest-version`
- `supabase/.branches/_current_branch`
- `public/images/prague.jpg`

Gekoppelt aktualisiert:

- `lib/project-sanitation/closure-invariants.test.ts`

Der Lock-Test verlangt jetzt ausdrücklich, dass diese abgeschlossenen Kandidaten **abwesend bleiben**. `.gitignore` ignoriert `supabase/.temp/` und `supabase/.branches/` weiterhin, sodass lokale Supabase-CLI-Metadaten künftig nicht erneut getrackt werden sollen.

Damit sind die im Core Repository Hygiene Audit bestätigten **mechanischen DELETE-CANDIDATEs vollständig abgearbeitet**.

## 3. Was bewusst NICHT gelöscht wurde

Diese Dinge sind keine alten aktiven Jetnity-Runtime-Reste und dürfen nicht mechanisch gelöscht werden:

- alle Supabase-Migrationen und Replay-History
- C2/C3 Restore-/Cleanup-Evidence
- Branch-Restore-Manifest und Branch-Hygiene-Evidence
- datierte Task/Status/Handoff/Self-Review-Pakete
- ADRs / Decisions
- private `jetnity-legacy-recovery`
- ungemergte Branches mit möglicher Unique Evidence
- aktuelle RBAC-Begriffe wie `creator`, solange kein eigener Auth-Retirement-Slice sie evidence-basiert entfernt

Alter oder ein alter Produktname allein ist niemals Löschbeweis.

## 4. Verbleibende Repository-Hygiene

Es gibt **keine bestätigten offenen mechanischen DELETE-CANDIDATEs** aus dem Audit mehr.

Es gibt weiterhin kleine `UPDATE-CANDIDATE`, die nicht mit Legacy-Runtime gleichzusetzen sind:

- zwei alte/unbenutzte V1 Image-Hosts in `next.config.js`
- `components.json` Alias `@/hooks`, obwohl `hooks/` fehlt
- stale `zod`-Exception in `scripts/pakete.mjs`
- kosmetische `Mega Pro`-Copy in `check-jetnity-setup.ts`
- ungenutzter Tailwind `content/**`-Glob
- optionale Docs-Navigation/Index-Hygiene
- optionale `.gitignore` Kommentar-Hygiene

Diese sind kleine Config-/Hygiene-Verbesserungen, **keine Alt-Jetnity-Bereinigungsblocker**. Nicht automatisch mit Product-Core-Arbeit vermischen.

## 5. GitHub Governance

Repository:

- aktuelles Repository: `Jetnity/jetnity`

`main` ist geschützt über:

- Ruleset: `Jetnity main protection`
- Ruleset ID: `21875372`
- Enforcement: `active`
- Target: exakt `main`
- Bypass list: leer
- PR vor Merge: Pflicht
- Required approvals: `0`
- Conversation resolution: Pflicht
- Branch up to date: Pflicht
- Required checks:
  - `Typecheck, Lint & Build`
  - `Auth-Konfiguration gegen config.toml`
  - `Vercel`
- Allowed merge method: nur `Merge`
- Force/non-fast-forward push: blockiert
- Branch deletion: blockiert

### Bekannter Connector-Bug – kein Jetnity-Fehler

`markPullRequestReadyForReview` kann im ChatGPT↔GitHub-Connector wegen `Repository.fullDatabaseId` scheitern.

Das ist **kein Fehler in Jetnity, kein GitHub-Ruleset-Fehler und kein Grund, den Workflow zu ändern oder Sicherheit abzuschwächen**.

Wenn er auftritt:

1. geprüften Head nicht verändern;
2. Ruleset nicht lockern;
3. neuen nicht-draft Recovery-PR auf exakt denselben TL-PASS-SHA erstellen;
4. frische Required Checks abwarten;
5. Expected-Head-Lock-Merge;
6. Source Draft transport-only schließen.

Neue kleine TL-eigene PRs können bei Bedarf direkt non-draft erstellt werden, wenn kein Cursor-Agent-Workflow verletzt wird; Review-/Exact-Head-/Protected-main-Gates bleiben trotzdem Pflicht.

## 6. Supabase Current Truth

Production:

- project ref `qscbgcdmivbbnzrcyegn`
- `ACTIVE_HEALTHY`

Development branch:

- `develop`
- project ref `yfvbxvijcorffwxbxahl`
- `ACTIVE_HEALTHY`

P1 Migration-History ist **repariert**, nicht offen:

- PR #251 merged
- Merge `5ee8c7017180747bb29112f1c5a2cf3419fd062d`
- Production After-Image PASS
- Fresh replay PASS
- temporärer Replay-Branch gelöscht
- `20260829140000_trip_item_commercial_provenance` replaybar repariert

Production-History enthält beim Übergang u. a.:

- `20260829140000_trip_item_commercial_provenance`
- `20260829210052_account_traveller_registry_persistence`
- `20260830155711_legacy_storage_policies_cleanup`
- `20260830183009_creator_media_c3_policy_decommission`

Storage/Recovery:

- `creator-media`: existiert nicht mehr
- `jetnity-legacy-recovery`: privat
- genau 1 Recovery-Objekt
- 3,030,830 Bytes
- keine zugehörigen User-Policies
- Production Edge Functions nach Cleanup: 0

Recovery-Bucket bleibt Production/Data-Gate und darf nicht automatisch gelöscht werden.

Development-Reconciliation/Drift muss vor migrationsnaher Arbeit immer live neu geprüft werden.

## 7. Product North Star

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler:

1. **Planen**
2. **Entscheiden**
3. **Reisebereit sein**

Leitfrage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Kanonische Doctrine:

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

Opportunity Register:

`docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`

Das Opportunity Register ist keine automatische Runtime-Roadmap.

## 8. Traveller / Account Current Truth

Verbindliches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Dual Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Verbindlich:

- Multi-Citizenship / Multi-Document
- Issuer Country ≠ Citizenship
- Document↔Citizenship-Relation
- kein Default-/Primary-/Preferred-/Chosen-Pass
- keine Default-Citizenship
- Guest→Account Trip-Copy
- Account Registry → Trip Materialization
- keine Passnummern, Passscans, MRZ, Biometrie, DOB oder Health-Daten im aktuellen Kernmodell
- keine option-spezifische Official Requirements/Entry Truth ohne echten Provider-Nachweis

Bereits integriert:

- Foundation E
- AP-5 Gate 0 + S1–S5 + AP-5-R1
- AP-7 Gate 0 + S1–S4
- TA-DL1
- AP-UX-NAV1
- TA-CUX1
- AP-10-S1 Confirmed Booking Folder

## 9. Letzte große Produkt-Runtime-Baseline

AP-10-S1 Confirmed Booking Folder ist integriert.

Runtime-Merge:

`a4d9384e2583ae52733c87006cd578f7489cb656`

Current Behavior:

- `/account/bookings` read-only
- bestehendes `booking_status='booked'`
- `flight`, `stay`, `transfer`, `rental_car`
- kein zweites Booking-Modell
- fail-closed bei unknown/inconsistent Trip Status
- deterministische Sortierung vor `limit(200)`
- Empty ≠ Error
- archivierte Trips markiert
- keine erfundenen Preise/Provider-/Affiliate-/Conversion-Claims
- owner-scoped RLS; kein Service Role

Der aktuelle `main` ist neuer wegen Cleanup/Governance/Continuity, nicht weil danach eine neue große Produktfunktion integriert wurde.

## 10. Privacy / Legal / PrivacyBee

Product-Owner-binding:

- PrivacyBee AG / `privacybee.io` ist vorgesehener Provider für die website-visible Privacy Layer.

Activation bleibt geparkt, bis echte erreichbare `jetnity.com` Production existiert.

Current Legal Gap:

- Register verlinkt `/privacy`
- `/privacy` fehlt
- `/terms` fehlt
- `CookieConsent.tsx` ist unmounted und enthält stale V1-Copy

Nicht mechanisch mounten und keine Legal-Copy erfinden. Eigener Legal-/Product-Owner-Slice erforderlich.

## 11. Provider / Commercial Truth

Weiterhin gated:

- Provider-Secrets/API-Keys
- paid calls
- Production Runtime Principal-/Writer-Öffnung
- Commercial Write Gate
- Payments
- öffentliche Preis-/Availability-Claims ohne Evidence
- option-spezifische Visa/Entry Official Truth ohne echten Requirements-Provider

Requirements / Travel Readiness Provider Groundwork bleibt strategisch sinnvoll, solange Contracts/Architecture/Fixtures die Gates respektieren.

## 12. Product-Owner-Gates

Explizite Freigabe bzw. nachweisbare bestehende Freigabe vor:

- destruktiven Production-Daten-/Schema-/RLS-Änderungen
- fundamentalen Auth/MFA/AAL-/Session-Änderungen
- materiellen Identity-/Ownership-Änderungen
- sensitiver Pass-/Dokument-/MRZ-/Biometrie-Speicherung
- sensibler externer Datenweitergabe
- Provider-Verträgen/Secrets/paid calls/Live-Aktivierung
- Commercial Write-Öffnung
- Payments
- Public Launch / Domain Cutover
- Branch-Protection-/Ruleset-Abschwächung
- fundamentaler Product-/Build-Order-Änderung
- Infrastrukturkosten > **USD 100/Monat**

## 13. Agentenstatus

Core-Hygiene-Agent `Jetnity core repository hygiene audit 1`:

- completed
- stopped

Aktiver Cursor-Implementierungsagent beim Übergang:

- **keiner**

Keinen Agenten automatisch aus diesem Checkpoint starten.

## 14. Empfohlene nächste Kandidaten

Nach Live-Precheck neu priorisieren. Kein Kandidat ist automatisch gestartet.

### A – kleiner Config-Hygiene-Slice

Optional die verbleibenden `UPDATE-CANDIDATE` bereinigen. Das ist kein Legacy-Blocker.

### B – zurück zum Produktkern

Strategisch wichtiger als endlose Kosmetik:

- Requirements / Travel Readiness Provider Groundwork
- Reisebereitschaft und Decision Support
- echte Provider-/Official-Truth-Verträge vorbereiten, ohne Live-/Commercial-Gates zu öffnen

### C – Legal Gap

`/privacy`, `/terms`, Consent/PrivacyBee separat Product-Owner-/Legal-gated lösen.

Der neue TL soll nach Live-Evidence entscheiden, ob A noch sinnvoll vor B ist oder direkt der Produktkern Vorrang hat.

## 15. Verbindlicher Technical-Lead-Workflow

1. Live-Evidence schlägt Prompt/Memory/Handoff/Agent-Self-Review.
2. TL steuert, entscheidet, reviewt.
3. Cursor implementiert nur klar bounded/versioned Tasks.
4. Nur TL darf Ready setzen oder mergen.
5. Agent Self-Review ≠ TL PASS.
6. Jeder Head-Wechsel invalidiert frühere Exact-Head-Gates.
7. Bei CHANGES REQUIRED: gleicher Agent/dieselbe Session → neuer Head → vollständiges Re-Gating.
8. Normale scope-treue PRs darf TL nach unabhängigem Review und grünen Gates autonom mergen, wenn absolut sicher.
9. Product-Owner-Gates bleiben bestehen.
10. Kein automatischer Folgeslice.
11. Relevanter Fortschritt und Übergabe werden im Repository persistiert.

## 16. Pflicht im neuen Chat

Der neue Chat beginnt mit dem Universal-Prompt des Product Owners und liest zuerst:

1. `JETNITY_START_HERE.md`
2. **diesen** POST-CLEANUP-FINAL-Checkpoint
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
5. `JETNITY_HANDOFF.md`
6. `docs/ACTIVE_WORK_STATUS.md`
7. Core Repository Hygiene Audit + Matrix
8. Build Order / Account Plan / Product Doctrine

Danach live verifizieren:

- finalen `main`
- letzte Merges
- offene PRs/Issues/Branches
- Exact Heads / Ahead / Behind / Diffs
- CI und Vercel
- Ruleset/Protection
- relevante Supabase-/Migration-/RLS-/Storage-Wahrheit
- Review Threads
- Cursor-Agent-Status
- PO-Gates und aktuelle Risiken

**Keine Arbeit aus diesem Dokument allein als live behaupten, wenn aktuelle Evidence abweicht.**

## 17. Übergabe-Verdikt

Die aktive Jetnity-Codebasis ist nach dem letzten mechanischen Cleanup von den bestätigten alten Jetnity-Runtime-/CLI-/Asset-Resten bereinigt.

Bewusst erhaltene historische Migrationen/Evidence/Recovery-Artefakte sind **kein Cleanup-Rückstand**, sondern notwendige Nachweis- und Recovery-Struktur.

Der nächste Chat soll deshalb nicht erneut eine allgemeine Alt-Jetnity-Bereinigung starten, sondern Current Truth live rekonstruieren und dann gezielt den nächsten Produkt-/Config-/Legal-Slice priorisieren.