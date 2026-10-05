# Jetnity – ChatGPT Technical Lead Checkpoint – 2026-08-30 FINAL

Stand: 30. August 2026  
Typ: **KANONISCHER CHAT-ÜBERGANG / TECHNICAL-LEAD-CHECKPOINT / DOCS-ONLY**  
Issue: #280

> **Live-Evidence gewinnt immer.** Dieser Checkpoint ist der beste bekannte Übergabestand, aber niemals Ersatz für einen frischen Live-Precheck von GitHub, CI, Vercel und – sobald DB/Security/Storage betroffen sind – Supabase.

## 1. Exakter Übergabe-Anker

Pre-Transition-`main` bei Erstellung dieses Checkpoints:

`498abfd26e584dcd40e59f4266e1bfc87828649f`

Dieser SHA enthält bereits den vollständig geprüften Core Repository Hygiene Audit über Recovery-PR #279.

- Source Draft PR #277: Audit: Core Repository Hygiene
- final unabhängig geprüfter Audit-Head: `a759764eefa568784bfa08029b386b978e1d2138`
- TL Final Review: PASS auf exakt diesem Head
- Draft→Ready-Connectorfehler: `Repository.fullDatabaseId`
- Recovery PR #279: **MERGED** mit exakt demselben Audit-Head
- Audit-Merge auf `main`: `498abfd26e584dcd40e59f4266e1bfc87828649f`
- Post-Merge CI #1395 / Run `33333229959`: **SUCCESS**
- Post-Merge Vercel: **SUCCESS**
- Issue #273: **CLOSED / completed**

Der Continuity-PR aus Issue #280 wird `main` nach diesem Anker noch einmal **docs-only** weiterbewegen. Daher darf ein neuer Chat den finalen `main`-SHA **nicht aus diesem Dokument erraten**, sondern muss ihn live lesen.

## 2. Rolle und verbindlicher Arbeitsmodus

Der neue Chat übernimmt vollständig die Rolle des bisherigen ChatGPT als übergreifender **Technical Lead / Hauptentwickler** für `Jetnity/jetnity`.

Verantwortung umfasst insbesondere:

- Gesamt- und Systemarchitektur
- Product Engineering und Produktlogik
- Daten-/Truth-Architektur
- Security / Privacy
- Auth / Sessions / MFA / AAL
- RLS / Ownership
- Account-/Traveller-Architektur
- Multi-Citizenship / Multi-Document / Passport-Logik
- Guest → Account
- Trip Workspace / Route / Transit / Multi-Destination
- Provider-/Commercial-Truth-Architektur
- Admin / Operations
- Marketing / Growth / SEO / AI-Search
- Mobile/Desktop/Native-Kohärenz
- Performance / Accessibility / QA / Release Readiness
- Supabase / Vercel / GitHub
- Cursor-Agent-Governance und Continuity

Verbindlicher Workflow:

1. **Live-Evidence schlägt Memory, Prompt, Handoff und Agent-Self-Review.**
2. Technical Lead steuert, entscheidet und reviewt; Cursor-Agenten implementieren nur bounded/versioned Tasks.
3. **Nur Technical Lead/ChatGPT darf Ready setzen oder mergen.** Cursor-Agenten niemals.
4. Agent-Self-Review ist niemals TL-PASS.
5. Jeder neue Head invalidiert alle vorherigen Exact-Head-Gates.
6. Bei `CHANGES REQUIRED`: derselbe Agent / dieselbe Session korrigiert den unmittelbaren Scope; danach vollständiges Re-Gating des neuen Heads.
7. Normale scope-treue PRs dürfen nach vollständigem unabhängigem TL-Review und grünen Gates autonom gemergt werden, wenn der TL absolut sicher ist. Besondere Product-Owner-Gates bleiben zwingend.
8. Kein automatischer Folgeslice. Nach Abschluss immer stoppen und neu prechecken.
9. Relevanter Fortschritt und Übergaben müssen im Repository persistiert werden.
10. Quality/Security/Truth vor Geschwindigkeit.

Bekannter GitHub-Connectorfehler:

- `markPullRequestReadyForReview` kann mit `Repository.fullDatabaseId` scheitern.
- In diesem Fall **Branch Protection nicht lockern und keinen geprüften Head verändern**.
- Bewährtes Recovery-Muster: neuen nicht-draft Recovery-PR auf exakt denselben TL-PASS-SHA erstellen → frische geschützte Gates → Expected-Head-Lock-Merge → Source Draft transport-only schließen.

## 3. GitHub – aktuelle Governance

Repository-Landschaft:

- live über Connector sichtbar: **nur `Jetnity/jetnity`**.
- alte private Repositories `Jetnity/jetnity-bets` und `Jetnity/jetnity-travel` wurden vor ihrer Löschung geprüft und danach vom Product Owner manuell gelöscht.

`main` ist jetzt geschützt.

Aktiver Repository-Ruleset:

- Name: `Jetnity main protection`
- Ruleset ID: `21875372`
- Enforcement: `active`
- Target: exakt `main`
- Bypass list: leer
- Pull Request vor Merge: Pflicht
- Required approvals: `0`
- Conversation resolution: Pflicht
- Branch up to date before merge: Pflicht
- Required checks:
  - `Typecheck, Lint & Build`
  - `Auth-Konfiguration gegen config.toml`
  - `Vercel`
- Allowed merge method: **nur Merge**
- Branch deletion: blockiert
- Force/non-fast-forward push: blockiert
- Signed commits: derzeit nicht erzwungen
- Linear history: derzeit nicht erzwungen

Ein neuer Chat darf diesen Schutz nicht ohne Product-Owner-/Governance-Gate abschwächen.

### Offene historische PRs beim letzten Live-Check

Nur folgende alten/future PRs waren noch offen:

- #52 – alter ChatGPT-Handoff-Draft
- #50 – alter Provider-Ops-Dokumentations-Draft
- #40 – Admin Platform Audit/Preparation
- #39 – Account Platform Audit/Preparation
- #28 – Trip Collaboration Foundation, future/historical

Diese sind **keine aktive Runtime-Arbeit** und dürfen nicht allein wegen Alter/Namen geschlossen oder gelöscht werden. Unique Evidence zuerst prüfen.

### Branch Hygiene

Am 30.08.2026 wurden 165 gemergte Remote-Branches nach fail-closed Exact-Tip-Revalidation gelöscht. Ein Restore-Manifest liegt in den Branch-Hygiene-Evidence-Dateien.

Weitere ungemergte/historische Branches existieren weiterhin. Sie sind kein Launch-Blocker und werden nur evidence-basiert bereinigt; Alter allein reicht nicht.

## 4. Supabase – aktuelle Wahrheit

Organisation besitzt live nur ein eigenständiges Projekt:

- Production: `qscbgcdmivbbnzrcyegn` – `Jetnity's Project` – `ACTIVE_HEALTHY`

Development-Branch des Production-Projekts:

- `develop` → project ref `yfvbxvijcorffwxbxahl` – `ACTIVE_HEALTHY`

Der alte eigenständige Supabase-Project `jetnity-bets` wurde nach Before-Image und Product-Owner-Freigabe permanent decommissioned/deleted.

### P1 Migration-History – **REPARIERT**

Alte kanonische Pointer behaupteten fälschlich noch, `20260829140000_trip_item_commercial_provenance` sei unrepariert. Das ist superseded.

Authoritative Recovery:

- PR #251: **MERGED**
- Merge SHA: `5ee8c7017180747bb29112f1c5a2cf3419fd062d`
- Production After-Image: PASS
- Fresh replay: PASS
- temporärer Replay-Branch danach gelöscht
- Production-Version `20260829140000_trip_item_commercial_provenance` ist jetzt replaybar repariert
- keine S5-B-DDL wurde dabei erneut angewandt

Development-Reconciliation/Drift ist davon getrennt und muss vor DB-naher Arbeit live neu bewertet werden. Nicht aus alten Docs ableiten.

Production-Migration-History enthält beim Übergang u. a.:

- `20260829140000_trip_item_commercial_provenance`
- `20260829210052_account_traveller_registry_persistence`
- `20260830155711_legacy_storage_policies_cleanup`
- `20260830183009_creator_media_c3_policy_decommission`

### Legacy Storage / Creator-Media – abgeschlossen

Alte Creator/MediaStudio-Storage-Welt wurde kontrolliert entfernt:

- zehn leere Legacy-Buckets gelöscht
- 24 orphaned Storage-Policies gelöscht
- `creator-media` zunächst public→private gehärtet
- C2: eine eindeutige Recovery-Kopie erstellt und echter Restore-Test byte-genau bestanden
- C3: 3 alte Source-Objekte gelöscht, 4 Policies gelöscht, leerer `creator-media`-Bucket gelöscht
- `creator-media` existiert nicht mehr
- private Recovery bleibt bewusst erhalten:
  - Bucket `jetnity-legacy-recovery`
  - `public=false`
  - genau 1 Objekt
  - 3,030,830 Bytes
  - keine User-Policies auf `creator-media`/Recovery
- Production Edge Functions: 0 nach Cleanup

Die Recovery-Kopie ist ein Production/Data-Gate. Nicht automatisch löschen.

## 5. Produkt-Nordstern

Kanonische Doctrine:

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

Arbeitsbegriff:

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler:

1. **Planen**
2. **Entscheiden**
3. **Reisebereit sein**

Leitfrage für neue Features:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

`docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md` ist ein Opportunity Register, **keine automatische Runtime-Roadmap**.

## 6. Traveller / Account – verbindliche Current Truth

Kernmodell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Dual Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Verbindlich:

- Multi-Citizenship / Multi-Document
- Issuer Country ≠ Citizenship
- Document↔Citizenship-Relation
- **kein** Default-/Primary-/Preferred-/Chosen-Pass
- **keine** Default-Citizenship
- Guest→Account Trip-Copy
- Account Registry → Trip Materialization
- Dokument-Lifecycle
- gemeinsame lokalisierte Country UX

Bereits integriert und nicht erneut als Zukunft planen:

- Foundation E
- AP-5 Gate 0 + S1–S5 + AP-5-R1
- AP-7 Gate 0 + S1–S4
- TA-DL1
- AP-UX-NAV1
- TA-CUX1
- AP-10-S1 Confirmed Booking Folder

Kernmodell speichert aktuell **keine Passnummern, Passscans, MRZ, Biometrie, DOB oder Health-Daten**.

Für Einreise-/Visa-/Requirements-Entscheidungen darf Jetnity keine option-spezifische Official Truth erfinden. Progressive Official UX erst, wenn ein echter Requirements-Provider die dafür nötige Evidence liefert.

## 7. AP-10-S1 – letzte große Produkt-Runtime-Baseline

AP-10-S1 Confirmed Booking Folder ist integriert.

Runtime-Merge:

`a4d9384e2583ae52733c87006cd578f7489cb656`

Current Behavior:

- `/account/bookings` read-only
- nur bestehendes `booking_status='booked'`
- nur `flight`, `stay`, `transfer`, `rental_car`
- kein zweites Booking-Modell
- unknown/inconsistent Trip Status fail-closed
- deterministische Sortierung vor `limit(200)`
- Empty ≠ Error
- archivierte Trips sichtbar markiert
- keine Preise/Provider-Bestätigung/Affiliate-/Conversion-/Deeplink-Claims
- owner-scoped RLS; kein Service Role
- keine DB-/Migration-/RLS-/Auth-/PII-Änderung in diesem Slice

Der heutige `main` ist neuer, weil danach Infrastruktur-, Cleanup-, Governance- und Audit-/Continuity-Arbeit integriert wurde. Nicht `main` mit der letzten Produkt-Runtime-Feature-Baseline verwechseln.

## 8. Core Repository Hygiene Audit – abgeschlossen

Authoritative Dateien:

- `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`
- `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
- `docs/evidence/CORE_REPOSITORY_HYGIENE_INVENTORY_2026-08-30.json`
- `docs/CORE_REPOSITORY_HYGIENE_STATUS_2026-08-30.md`
- `docs/CORE_REPOSITORY_HYGIENE_HANDOFF_2026-08-30.md`

Wesentliche Aussage:

**Kein aktueller Creator Hub / MediaStudio / Feed / Blog / Render Runtime-Rest** in `app/`, `components/`, `lib/`, `types/`, Config oder Workflows. Historische Migrationen/Evidence bleiben absichtlich erhalten. Der aktuelle RBAC-Name `creator` / Capability `inhalte-moderieren` ist nicht gleichbedeutend mit altem MediaStudio-Runtime-Code.

### DELETE-CANDIDATE – noch nicht umgesetzt

1. `supabase/.temp/*` – fünf getrackte CLI-Cache-Dateien; bereits in `.gitignore`; nur Placeholder, kein live Secret festgestellt.
2. `supabase/.branches/_current_branch` – getrackter lokaler CLI-Marker.
3. `public/images/prague.jpg` – unreferenziertes ~1.8-MB-Asset.

**Jeder spätere Delete-/Untrack-Slice muss `lib/project-sanitation/closure-invariants.test.ts` im selben Slice bewusst aktualisieren.**

### UPDATE-CANDIDATE – noch nicht umgesetzt

- zwei ungenutzte V1 Image-Hosts in `next.config.js`
- `components.json` Alias `@/hooks`, obwohl `hooks/` fehlt
- stale `zod`-Exception in `scripts/pakete.mjs`
- kosmetische `Mega Pro`-Copy in `check-jetnity-setup.ts`
- ungenutzter Tailwind `content/**`-Glob
- Docs-Navigation/Index/Pointer-Hygiene
- `.gitignore` Heatmap-Kommentar-Hygiene

### BLOCKED / NEEDS DECISION

- `CookieConsent.tsx` ist unmounted und enthält stale V1-Text; gleichzeitig verlinkt der reale Register-Flow `/privacy`, obwohl `/privacy` und `/terms` fehlen → Legal/PO-Gate, nicht mechanisch mounten oder Text erfinden.
- `creator`-Rolle / `inhalte-moderieren` nur bei vorgeschlagener Auth-Retirement-Änderung → Auth/PO-Gate.
- `jetnity-legacy-recovery` → Production/Data-Gate.
- ungemergte Branches mit möglicher Unique Evidence → separate Branch-Hygiene.

### HISTORICAL-EVIDENCE – schützen

Insbesondere:

- alle Supabase-Migrationen
- Legacy-/Creator-Removal-Migrationen
- C2/C3 Evidence
- Branch-Restore-Manifest
- dated Task/Status/Handoff/Self-Review-Pakete
- ADRs

Alter allein ist niemals Löschbeweis.

## 9. Privacy / Legal / PrivacyBee

Product-Owner-binding:

- PrivacyBee AG / `privacybee.io` ist der vorgesehene Provider für die website-visible Privacy Layer.

Aber Jetnity-Activation bleibt geparkt, bis eine echte erreichbare `jetnity.com` Production existiert.

Daher derzeit:

- keinen Jetnity PrivacyBee Trial/Lizenz-/Activation-Start
- keinen Preview-Link als rechtliche Production-Domain
- keinen Cookie-Banner mit erfundener/staler V1-Tracking-Copy montieren
- keine Secrets/API-Keys in Repo/Agenten
- `/terms` und `/privacy` nicht erfinden
- PrivacyBee ersetzt nicht Consent/Export/Delete, Auth, Traveller, RLS oder Commercial Truth

Der Audit hat einen **realen Legal-Gap** bestätigt: Register verlinkt `/privacy`, aber `/privacy` und `/terms` existieren nicht. Die Lösung braucht einen eigenen Legal-/Product-Owner-Slice.

## 10. Provider / Commercial Truth

Provider-/Commercial-Arbeit ist nicht automatisch live freigegeben.

- keine echten Provider-Secrets/API-Keys ohne eigenes Gate
- keine paid calls ohne Gate
- keine Production Runtime Principal-/Writer-Öffnung automatisch
- Commercial Write Gate nicht still öffnen
- keine Preise/Availability/Official Requirements erfinden
- Skyscanner- oder andere Provider-Verfügbarkeit nicht voraussetzen
- Requirements/Travel Readiness darf zunächst Contracts/Fixtures/Architecture bauen, aber option-spezifische Official Truth braucht echten Provider-Nachweis

## 11. Security / Privacy / Kosten – besondere Product-Owner-Gates

Vor folgenden Kategorien ist weiterhin ein expliziter Product-Owner-/Sonder-Gate erforderlich:

- destruktive Production-Daten-/Schema-/RLS-Änderungen
- fundamentale Auth/MFA/AAL-/Session-Änderungen
- Identity/Ownership-Materialänderungen
- Speicherung sensitiver Pass-/Dokument-/MRZ-/Biometrie-Daten
- sensible externe Datenweitergabe
- Provider-Verträge/Secrets/paid calls/Live-Aktivierung
- Commercial Write-Öffnung
- Payments
- Public Launch / Domain Cutover
- Branch-Protection-/Ruleset-Abschwächung oder fundamentale Governance-Änderung
- Kosten > **USD 100 pro Monat**

## 12. Nächste Arbeit – noch NICHT automatisch gestartet

Nach diesem Übergang läuft **kein Cursor-Agent** und kein Runtime-Slice automatisch weiter.

Sinnvolle Kandidaten nach frischem Precheck:

### Kandidat A – mechanische Repository-Hygiene

Ein kleiner, klar bounded Slice kann die drei bestätigten DELETE-CANDIDATEs bereinigen:

- Supabase CLI temp/branch metadata untracken
- `prague.jpg` entfernen
- gekoppelt `closure-invariants.test.ts` aktualisieren

Kein Legal/Auth/Provider/Production-Scope vermischen.

Danach optional ein separater kleiner Config-Hygiene-Slice für die UPDATE-CANDIDATEs.

### Kandidat B – zurück zum Produktkern

Nach dem kleinen Hygiene-Rest nicht in endlose kosmetische Bereinigung abdriften. Strategisch hoher Wert liegt bei **Requirements / Travel Readiness Provider Groundwork** und der weiteren Reisebereitschaft, unter den bestehenden Provider-/Commercial-/Official-Truth-Gates.

### Kandidat C – Legal Gap

`/privacy` / `/terms` / CookieConsent ist real, aber Product-Owner-/Legal-gated und PrivacyBee-Activation bleibt bis echter Production-Domain geparkt.

Der neue Technical Lead bewertet diese Kandidaten nach aktuellem Live-Stand. **Kein Kandidat ist durch diesen Checkpoint automatisch freigegeben.**

## 13. Pflichtlektüre im neuen Chat

In dieser Reihenfolge:

1. `JETNITY_START_HERE.md`
2. `docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_FINAL.md`
3. `docs/CHATGPT_NEW_CHAT_START_PROMPT_2026-08-30_FINAL.md`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
6. `JETNITY_HANDOFF.md`
7. `docs/ACTIVE_WORK_STATUS.md`
8. `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`
9. `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
12. Product Differentiation Doctrine + Opportunity Register
13. relevante P1 / C2 / C3 / branch-hygiene Evidence
14. danach **Live GitHub + CI + Vercel + relevante Supabase-Wahrheit**

## 14. Exakter erster Ablauf im neuen Chat

Vor jeder Änderung:

1. aktuellen `main` live lesen und bestätigen, dass der Transition-PR aus Issue #280 gemergt/post-merge grün ist;
2. offene PRs/Issues/Branches live lesen;
3. Ruleset/`main protected=true` live bestätigen;
4. aktuelle CI/Vercel-Gates prüfen;
5. Supabase Production + develop + Migration-History + relevante Storage-Wahrheit prüfen, falls der nächste Slice DB/Security/Storage berührt;
6. prüfen, dass kein Cursor-Agent noch aktiv schreibt;
7. den tatsächlichen nächsten bounded Slice empfehlen;
8. bei besonderem Product-Owner-Gate zuerst fragen;
9. erst dann Branch/Issue/Agent starten.

**Keine Arbeit aus diesem Dokument allein als aktuell behaupten, wenn Live-Evidence inzwischen abweicht.**

## 15. Übergabe-Verdikt

Jetnity ist nach dem Legacy-/Storage-/Repo-Cleanup deutlich konsolidierter:

- nur ein aktuelles GitHub-Repository
- nur ein eigenständiges aktuelles Supabase-Production-Projekt plus dessen develop branch
- alte Bets-/Travel-Repositories entfernt
- alte Creator/MediaStudio-Runtime nicht mehr vorhanden
- Creator-Media-Source Storage entfernt, private Recovery verifiziert
- P1 Migration-History repariert
- 165 sicher gemergte Branch-Refs entfernt
- `main` jetzt geschützt
- Core Repository vollständig audit-basiert klassifiziert

Der nächste Chat soll **nicht wieder bei Null anfangen und nicht alte Probleme neu eröffnen**. Er übernimmt diesen Stand, verifiziert ihn live und arbeitet von dort professionell weiter.