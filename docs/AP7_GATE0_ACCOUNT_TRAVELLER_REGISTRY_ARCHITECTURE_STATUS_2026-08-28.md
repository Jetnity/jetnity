# Jetnity – AP-7 Gate 0 Account-Traveller-Registry Architecture Status

Stand: 28. August 2026  
Status: **REVIEW-FIX FÜR 5455299179 / AUDIT + ARCHITECTURE ONLY / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Workstream: Account / Traveller  
Logical Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 11`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/144  
Branch: `audit/ap7-account-traveller-registry-gate0-2026-08-28`  
Task: `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_TASK_2026-08-28.md`

> Live-Evidence gewinnt. Dieses Self-Review ist kein PASS. Kein Ready. Kein Merge. Kein AP-7-Runtime.

## 0. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Cursor-Agent: Account plattform audit vorbereitung 11` |
| Sichtbarer Cursor-Titel | `Account traveller registry architecture` |
| Cloud-Run | https://cursor.com/agents/bc-400e9cce-e82f-48f1-860a-fb6a3a6f90e3 |
| Rename-/Title-Fähigkeit | **keine** in den verfügbaren Cursor-Namespaces |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` (PO-Supersession `a172ed79`: sichtbar exakt = Best Effort, kein Arbeitsblocker) |
| Generation | **11 bleibt 11.** Keine Generation 12 wegen UI-Titel. |

Dieser Agent behauptet nicht, die sichtbare UI sei umbenannt.

## 1. Live-Rekonstruktion

| Feld | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Task-Baseline `origin/main` | `1947285cc4d7d6fb98c77ec60a04c96f96f3f483` – Merge PR #143 |
| `origin/main` nach Re-Fetch vor Stamp | `1947285cc4d7d6fb98c77ec60a04c96f96f3f483` |
| Branch-Start vor Authoring | `a172ed795333e54437395a2630b940cc0ad5410a` – naming-gate supersession |
| Merge-Base gegen `origin/main` | `1947285c` |
| Ahead / Behind vor Authoring | **4 / 0** inkl. Remote-Commit `8eb272ce` (Task-Namensgate) |
| Authoring-Head nach Rebase | `38af535a5349a2e8cc590826e7c2e77375e66a9b` |
| Ahead / Behind nach Authoring, vor SHA-Korrektur | **6 / 0** |
| Draft-PR | #144 OPEN / Draft |
| `main` Branch Protection | zuletzt `protected=false`; dieser Slice ändert das nicht |
| Supabase in diesem Run | **nicht** abgefragt, **nicht** mutiert |
| Browser / Real-Device | **nein** – Docs-only |

Post-PR-#143-Evidence laut Task (nicht in diesem Run neu gegen Actions/Vercel verifiziert):

- GitHub Actions run `33188008696`: SUCCESS auf Baseline-`main`
- Vercel Production `dpl_3mhanrnvtDgaQeApjhsx4R6BzPQE`: READY auf Baseline-`main`

### 1.1 Exact Head dieses Stamps

| Feld | Wert |
| --- | --- |
| `origin/main` Re-Fetch | `1947285cc4d7d6fb98c77ec60a04c96f96f3f483` – 0 behind |
| Prior reviewed Head | `a0ef801fd7fa39685fab9a1fe69d411f736ea78c` – **invalidated** by this review-fix |
| Review-Fix Head | `5367f084bf9c9aee7103b0ef0f1b9323c6e9011c` – 8 / 0 vor diesem Stamp |
| Review-Head | Stamp-Commit nach `5367f084`; live an PR #144 lesen |
| Merge-Base | `1947285c` |

Ein weiterer Continuity-Stamp nach dem Review-Head invalidiert dieses Gate.

## 2. Task / Scope / Non-Scope

**Scope:** Read-only Rekonstruktion der live trip-scoped Traveller-Architektur und Architekturvergleich für eine mögliche accountweite Traveller Registry.

**Non-Scope (unverändert hart):** keine AP-7-Runtime; keine Schema-/Migrationsdatei; keine Supabase-Mutation; kein RLS/GRANT/REVOKE/SECURITY DEFINER; kein Auth/Session/MFA/AAL; kein Default-Vorschlag für Passnummern/Scans/MRZ/Biometrie; keine AP-5-S3/S4/S5-Runtime; kein Provider-Runtime/paid/live; kein TW-8/TW-9; kein Search/Homepage/Native; keine Branch Protection; kein Cleanup; kein Ready; kein Merge; kein Folge-Implementierungsslice.

## 3. Current live architecture

Rekonstruiert aus Repo-Migrationen, Typen, App-Code und ADRs. Historische Audits (PR #76, #105) sind Evidence ihres Zeitpunkts, nicht Current Truth.

### 3.1 `trip_travellers` – trip-scoped Parent

- Tabelle: `public.trip_travellers` (`20260822020000_trip_travellers.sql`)
- Schlüssel: `id` UUID; stabile Client-Identität `client_ref` unique je `(user_id, trip_id, client_ref)`
- Ownership: `user_id` + Composite-FK `(trip_id, user_id) → trips(id, user_id)` ON DELETE CASCADE
- Persistierte Fakten: `label`, `residence_country_code`; Legacy-Singularspalten `nationality_country_code` / `document_*` sind **DEPRECATED compatibility-only**
- Party-Cap: höchstens **20** je `(user_id, trip_id)` via `trip_traveller_party_limit_pruefen()` AFTER INSERT OR UPDATE (C1 `20260828015304`, ADR-0181)
- Domain: `Trip.party?: TripTraveller[]` – ausdrücklich **keine accountweiten Profile** (`types/trips.ts`)
- `trips.travellers` ist **Kopfzahl 1–20**, keine Identität

### 3.2 `trip_traveller_citizenships`

- 1:n Child; unique `(traveller_id, country_code)`; unique client_ref je Traveller
- Composite-FK `(traveller_id, trip_id, user_id)` CASCADE
- Limit **8** je Traveller, Trigger AFTER INSERT OR UPDATE
- ISO-2 only; keine freien Labels

### 3.3 `trip_traveller_documents`

- 1:n Child; Typ `passport | national_id | unknown`
- Felder: `document_type`, `issuing_country_code`, `expires_on`, optionales `citizenship_id`
- Document↔Citizenship nur über explizite Relation, **nicht** über Issuer
- FK `citizenship_id` ON DELETE SET NULL (`20260822170000`)
- Limit **12** je Traveller
- Tabellenkommentar: keine Nummern, Scans, MRZ, Biometrie

### 3.4 Child limits and ownership / RLS

| Grenze | App / Zod | RPC `party_schreiben` | DB-Trigger |
| --- | --- | --- | --- |
| 20 Traveller / Reise | ja | Payload-Länge | `trip_travellers_party_limit` |
| 8 Citizenships / Traveller | ja | ja | `trip_traveller_citizenships_limit` |
| 12 Documents / Traveller | ja | ja | `trip_traveller_documents_limit` |

RLS auf Parent und Children: `user_id = auth.uid()` für SELECT/INSERT/UPDATE/DELETE. Keine Capability-Policies. `anon` hat kein GRANT.

Write-Vertrag (ADR-0180 / ADR-0181):

- Unterstützt: `party_schreiben` / `party_loeschen`, beide **SECURITY INVOKER**
- Authenticated Direkt-DML bleibt privilegiert, ist aber **kein** unterstützter Produktvertrag
- C2 (REVOKE / optional DEFINER) ist **nicht** gestartet und bleibt Product-Owner-gated
- Kein Service-Role-Produktpfad

### 3.5 Guest → Account and `party[]`

- Gast: dieselbe `Trip`-Form in `localStorage` `jetnity:reise:v3` (ADR-0042)
- Übernahme auf `/reisen` läuft **automatisch** (`GastreiseBruecke`), nicht als Registry-Consent
- Reihenfolge: `reise_anlegen` (ohne party) → `partyUebernehmen` → `party_schreiben` → optional Readiness → lokalen Entwurf erst nach Erfolg löschen
- Kopiert wird der volle trip-scoped Kontext: label, residence, citizenships, documents inkl. `citizenshipClientRef`
- Es entsteht **kein** accountweites Profil. Ohne Registry ist das der Normalfall.

### 3.6 Readiness / credential options

- Kanonisch: `credentialOptionsAus` – N Dokumente → N Optionen; 0 Dokumente → genau eine `:none`
- `optionRef = travellerClientRef:documentClientRef` bzw. `:none`
- P2-TA-06 / ADR-0178 / PR #113 ist **integriert**: `travellerNormalisieren` kollabiert nicht mehr auf `documents[0]`
- Issuer wird nie als Citizenship gelesen
- Vergleich bleibt fail-closed ohne ausreichende Official-Evidence

### 3.7 Official-evaluation option scope

- P1-TA-02 / ADR-0167 / PR #84 integriert
- Kanonische Wahrheit: `OfficialEvaluation[]`
- Legacy-`official.result` bleibt immer `unknown`
- `officialAusEvaluations` aggregiert Darstellung nur bei homogenem Scope (Traveller × Credential-Option × Destination × Transit)
- `officialFuerItem` ist fail-closed; kein Fallback auf fremde Evaluations

### 3.8 Account identity / profile

- `profiles`: `user_id`, email, display_name, avatar, role, status, timestamps
- Präferenzen ausdrücklich später (AP-8). Prefs ≠ Citizenship/Dokumente
- Kein FK von `profiles` zu Traveller-Zeilen
- ADR-0102 / ADR-0117 lehnen accountweite Traveller-Profile ohne eigenen ADR ab

### 3.9 Privacy / export / delete

- AP-6a/6b **nicht gebaut**. Kein Consumer-Export, keine Kontolöschung, `/privacy`/`/terms` 404
- Heutiges Konto-Delete (wenn Auth-User gelöscht wird): CASCADE `profiles` + `trips` + Traveller-Children
- Gast-Local-Storage ist kein Konto
- Ein späteres AP-6b muss trip-scoped `party` exportieren/löschen **ohne** eine Registry vorauszusetzen
- Sensible Payloads existieren heute nicht und dürfen nicht „mitexportiert“ werden

### 3.10 Admin / support visibility

- Admin sieht Nutzer-PII über `konten-verwalten` + AAL2 (`darf_konten_verwalten`)
- Keine Admin-Policies und keine Admin-UI auf `trip_traveller*`
- Support-Einsicht in fremde Reisen bleibt ADR-0041 zurückgestellt
- Keine Support-Registry-Nebenwahrheit

### 3.11 Native / multi-client

- Vertrag: ein Produkt, eine Wahrheit, mehrere Clients
- Native darf Traveller Registry, Multi-Citizenship und Credential-Auswahl nicht vereinfachen oder neu modellieren
- Heutiger teilbarer Vertrag: Domain-Typen + INVOKER-RPCs + Guest-`Trip.party` + Empty≠Error + dieselben Ausschlüsse
- Ein AP-7-Registry-API existiert nicht und darf von Native nicht vorweggenommen werden

### 3.12 Stale / recheck today

- Nur trip-scoped Fingerprints (`trip_readiness_items.context_fingerprint`, Official-Evaluation-Freshness)
- Traveller-/Dokument-/Citizenship-Änderung macht betroffene Entry/Visa/Document-Checks `stale`
- Kein accountweites Invalidierungsmodell

### 3.13 Collaboration / participation

- Kein Runtime. Issue #20 / historische Drafts sind Future Evidence
- Heute: alleiniger Trip-Owner liest/schreibt party
- Registry×Collaboration ist deshalb **ungebaut und ungegated** – jeder AP-7-Vertrag muss das als spätere Naht offenhalten, nicht still mitlösen

## 4. Options considered

### Option A – Trip-scoped bleibt einzig kanonisch + wiederverwendbare Vorlagen

Account speichert nur **Templates** (Kopiervorlagen). Jede Reise bleibt alleinige Current Truth. Einsetzen in eine Reise ist immer Kopie nach `party[]`. Kein Live-Link.

**Stärken:** minimale RLS-Änderung; historische Reisen bleiben unberührt; Guest→Account unverändert; Foundation E bleibt; geringstes Migrationsrisiko.

**Schwächen:** keine erstklassige Personenidentität; Dokument-Lifecycle und Native-Vertrag bleiben schwach; Nutzer muss Änderungen manuell in jede Reise tragen; Drift zwischen Vorlage und Reisen ist unsichtbar.

### Option B-live – Account-Registry als einzige Current Truth, Reisen referenzieren live

Account-Zeile ist die Wahrheit; `trip_travellers` hält nur eine Referenz. Edit nach Reiseerstellung ändert historische Readiness/Partei.

**Abgelehnt.** Verletzt historische Trip-Korrektheit, macht Stale/Readiness cross-trip, verkompliziert RLS/Collaboration und widerspricht ADR-0102 ohne Gewinn an Einfachheit.

### Option B / C – Dual-Authority: Account-Registry für Wiederverwendung + trip-owned Snapshot als einzige Trip-Current-Truth

Account besitzt wiederverwendbare Traveller-/Citizenship-/Document-Identitäten. Beim Einfügen in eine Reise entsteht ein **Snapshot** in den bestehenden Foundation-E-Tabellen. Optionaler Provenienz-Link (`account_traveller_id` o. ä.) ist Herkunft, nicht Live-Wahrheit. Registry-Edit ändert keine bestehende Reise, bis der Nutzer ausdrücklich „diese Reise aktualisieren“ wählt.

Das ist die im Task genannte „true account-scoped canonical Traveller Registry with trip-specific snapshots/participation“, **ohne** die Plan-Fehlinterpretation „Current Truth wird account-scoped verschoben“.

**Stärken:** Wiederverwendung ohne Geschichtsverfälschung; Multi-Citizenship/Dokumente bleiben 1:n; Foundation E bleibt Trip-Vertrag; Guest bleibt trip-only bis Opt-in; Native/Web teilen dieselben zwei Schichten; Readiness-Stale bleibt trip-scoped; RLS bleibt owner-scoped in beiden Schichten.

**Schwächen:** zwei Wahrheiten müssen benannt bleiben (Registry ≠ Trip); Identity/RLS-Änderung trotzdem PO-gated; Import/Dedup braucht UX-Disziplin; Collaboration später extra.

### Option D – Nichts bauen / nur UX „gilt nur für diese Reise“

Ehrlich, aber Binding Build Order §2 nennt die fehlende Registry als Produktlücke. Als Dauerzustand akzeptabel nur nach ausdrücklicher PO-Entscheidung gegen Wiederverwendung.

## 5. Recommended architecture

**Empfehlung: Option B/C Dual-Authority. Nicht Option A als Endzustand. Nicht Option B-live. Nicht still „Current Truth nach Account verschieben“.**

Begründung gegen die Pflichtkriterien:

| Kriterium | Warum Dual-Authority |
| --- | --- |
| Nutzer-Einfachheit | Personen und Dokumente einmal pflegen, in neue Reisen einsetzen; bestehende Reisen bleiben „wie damals“ |
| Multi-Citizenship / Multi-Document | Registry und Snapshot tragen dieselben 1:n-Arrays; kein Default-Pass |
| Historische Trip-Korrektheit | Snapshot ist die einzige Trip-Truth; kein Retro-Write |
| Privacy / Minimierung | dieselben Felder wie Foundation E; keine Nummern/Scans/MRZ/Biometrie |
| RLS-Einfachheit | zwei owner-scoped Schichten (`user_id = auth.uid()`); keine Cross-User-Joins; kein Service Role |
| Guest → Account | Gast bleibt trip-only; Registry-Import später **opt-in**, getrennt von heutiger automatischer Trip-Übernahme |
| Provider / Readiness | Fingerprints bleiben trip-scoped; Registry-Edit stale’t andere Reisen nicht automatisch |
| Native / Web | dieselben Domain-Typen + RPCs; Native darf Snapshot nicht durch Live-Link ersetzen |
| Wartbarkeit | Foundation E nicht neu bauen; ADR-0102 wird präzisiert, nicht heimlich entsorgt |

Trade-off: mehr Modell als Templates-only. Der Mehraufwand ist der Preis für eine echte Personenidentität ohne Geschichtsverfälschung.

**Diese Empfehlung ist kein Product-Owner-Ja und kein Implementierungsauftrag.**

## 6. Required architectural answers

| Frage | Gate-0-Antwort (Empfehlung, nicht Freigabe) |
| --- | --- |
| Kanonische Identität eines Account-Travellers? | Stabile UUID + account-scoped `client_ref` des Owners. Nicht Email, nicht `profiles.id`, nicht Positionsindex, nicht Label. |
| Keying ohne Positionsidentität? | Überall `client_ref` / UUID. Verboten: `documents[0]`, `evaluations[0]`, `traveller:1` als Personenidentität. `traveller:N` bleibt nur Slot-Default der Kopfzahl. |
| Trips referenzieren/snapshotten ohne Retro-Write? | Insert = Kopie in `trip_travellers` + Children. Provenienz-Link optional und nicht-autoritativ. |
| Edit nach Reiseerstellung? | Ändert nur die Registry. Bestehende Snapshots unverändert. Refresh nur durch ausdrückliche Trip-Aktion. |
| Shared vs trip-spezifisch? | Shared: wiederverwendbare Fakten (label, residence, citizenships, documents type/issuer/expiry, explizite Document↔Citizenship-Refs). Trip-spezifisch: Teilnahme, **alle** Credential-Optionen first-class im Snapshot, Readiness/Official, historische Snapshot-Werte. Keine trip-weite Credential-Wahl im Snapshot. |
| Mehrere Citizenships/Dokumente first-class? | Ja, dieselben Limits 8/12. Kein Default. Alle Optionen bleiben first-class. |
| Document ↔ Citizenship ohne Issuer=Citizenship? | Explizite `citizenshipClientRef` / `citizenship_id`. Issuer bleibt getrennt. Fehlt die Relation → `null`, nicht raten. |
| Explizite Trip-Wahl ohne globalen Default-Pass? | **Kein** `chosenCredentialOptionRef` und kein anderes trip-weites Wahlfeld im Traveller-Snapshot oder in der Registry. Eine spätere explizite Credential-Auswahl braucht einen eigenen **trip-scoped, kontext-/evaluations-scharfen** Entscheidungsvertrag (mindestens Traveller + Credential-Option + relevantes Destination-/Route-/Transit-/Segment-/Evaluation-Kontext/Fingerprint) oder bleibt bewusst unspezifiziert, bis Provider-/Readiness-Evidence den Scope festlegt. Muss ein Credential für eine ganze Route einheitlich gelten, folgt das nur aus expliziter regulatorischer/Provider-Evidence als **route-scoped** Entscheidung, nie als globaler Traveller-Default. |
| Guest→Account ohne Registry? | Heutiger Automatismus bleibt trip-scoped Kopie. Registry entsteht nicht still. Import in die Registry später opt-in, Person für Person, nie Bulk-Merge. |
| Import / Dedup ohne stilles Mergen zweier Menschen? | Kein automatisches Match über Label/Residence/Citizenship-Set. Höchstens Vorschlag „ähnlich“; Merge nur nach explizitem Confirm. Im Zweifel zwei Personen. |
| Delete / Detach / Archive / Retention? | Registry-Delete/Archive: keine historischen Snapshots löschen; nur künftige Wiederverwendung beenden. Trip-Delete bleibt CASCADE der Reise. Detach = Provenienz-Link lösen, Snapshot behalten. Konto-Delete (später AP-6b) löscht Registry **und** Owner-Trips; das ist ein eigenes PO-Gate. |
| Readiness stale bei Fact-Change? | Snapshot-Änderung: heutige trip-Fingerprints. Registry-Änderung: **keine** Cross-Trip-Stale, außer der Nutzer refresht eine Reise. |
| Sichere vs ausgeschlossene Felder? | Sicher wie heute: label, ISO-2 citizenship/residence, document type, issuer, expiry, explizite Citizenship-Ref. **Default ausgeschlossen:** Pass-/Ausweis-/Visa-Nummern, Scans, MRZ, Biometrie, Geburtsdatum, Gesundheitsakte. Jede spätere Speicherung = eigenes PO+Security/Privacy-Gate, nicht Kernmodell. |
| Minimale RLS/Ownership-Invarianten? | Registry-Zeilen `user_id = auth.uid()`. Kein Cross-Owner-Read. Snapshots bleiben trip-owner-scoped. Kein Service Role. Keine Admin-Support-Registry. SECURITY INVOKER. Composite-FKs gegen Cross-Trip/Cross-User. C2 bleibt separates PO-Gate. |
| Collaboration × account-owned travellers? | Heute irrelevant (kein Runtime). Später: Collaborator sieht/editiert nur Trip-Snapshots, nie die fremde Registry. Keine stille Registry-Kopie zum Collaborator. |
| Migration / Rollback / Kompatibilität? | Expand/Contract. Bestehende `trip_travellers` bleiben gültig ohne Registry-Link. Rollback = Registry-Tabellen unbenutzt lassen; Trip-Vertrag unverändert. Guest-Form unverändert. Kein Big-Bang-Backfill. |
| Web und Native? | Derselbe Domainvertrag und dieselben RPCs. Native speichert keine zweite Registry und macht aus dem Provenienz-Link keinen Live-Default. |

## 7. Security / privacy boundary

Gate 0 default = Datenminimierung.

Nicht Teil des empfohlenen Kernmodells: Passnummern, Scans, MRZ, Biometrie oder gleichwertige Payloads.

Falls später nützlich: eigenes Product-Owner- + Security/Privacy-Gate. Nicht normalisieren.

Keine Secrets. Kein Service-Role-Produktpfad. Kein Production-Write in diesem Slice.

## 8. RLS / Identity boundary

Eine echte accountweite Registry **ändert** Identity/Ownership/RLS und braucht deshalb vor Implementation ein Product-Owner-Gate plus ADR-Nachfolger zu ADR-0102/0117.

Gate 0 beschreibt nur Invarianten. Dieser Slice fügt keine Tabellen, Policies, GRANTs, REVOKEs, SECURITY-DEFINER-Funktionen oder Migrationen hinzu und mutiert Supabase nicht.

Kritische Korrektur am Plan-Satz „Current Truth würde von trip-scoped auf account-scoped verschoben“: das wäre Option B-live und wird **nicht** empfohlen. Trip-Current-Truth bleibt der Snapshot.

## 9. Unresolved risks

1. Product Owner kann Dual-Authority, Templates-only oder „keine Registry“ wählen. Ohne diese Entscheidung ist AP-7 nicht startbar.
2. Heutige Guest→Account-Übernahme ist automatisch trip-scoped. Ein späterer Agent könnte das fälschlich als Registry-Opt-in lesen.
3. C2 (REVOKE/DEFINER) ist orthogonal und darf nicht in AP-7 gemischt werden.
4. Collaboration ist ungeplant; ein naiver Live-Link würde später Familien-/Gruppenreisen undichte machen.
5. Dedup-UX kann zwei reale Personen zusammenlegen, wenn Confirm zu schwach ist.
6. AP-6b Delete/Export existiert nicht; Registry vor Privacy-Vertrag erhöht Löschkomplexität.
7. `main` Branch Protection bleibt `protected=false`.
8. Production-Schema wurde in diesem Run nicht live gegen Supabase geprüft (DOC-CLAIM für C1/`20260828015304`).
9. Sichtbarer Cursor-Titel weicht ab; logischer Name bleibt 11.

## 10. Product-Owner decision required before implementation

Vor jedem AP-7-Runtime, Schema oder RLS:

1. Dual-Authority (Empfehlung) **oder** Templates-only **oder** bewusst keine Registry?
2. Bestätigung: Trip-Snapshot bleibt Trip-Current-Truth; kein Live-Rewrite?
3. Registry-Import aus Gast/bestehenden Reisen nur opt-in, nie still?
4. Keine Passnummern/Scans/MRZ/Biometrie im Kern?
5. Production-Migration / Identity-RLS-Freigabe für neue Registry-Tabellen?
6. Reihenfolge zu AP-6a/6b: Plan sagt nicht automatisch nach AP-6b; Privacy-Delete vorher oder bewusst später?

Erst danach: neuer Implementierungs-ADR + frischer Task + frische Agenten-Generation.

## 11. Finished vs unfinished

**Fertig in diesem Slice (Docs/Architecture):**

- Live-Rekonstruktion der 11 Pflichtflächen
- Optionsvergleich inkl. abgelehntem Live-Link
- Empfehlung Dual-Authority mit Begründungen
- Antworten auf alle Pflichtfragen
- ADR-0186 als **Gate-0-Empfehlungsstatus**, nicht als PO-Freigabe
- Status / Handoff / Self-Review / minimale Continuity

**Nicht fertig / nicht autorisiert:**

- AP-7-Runtime, Schema, RLS, RPCs, UI
- Product-Owner-Entscheidung
- Unabhängiger Technical-Lead-PASS
- AP-5-S3/S4/S5, AP-6, TW-8, Native, Provider-live

## 12. Exact first unfinished next step

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #144.

Nicht Ready. Nicht mergen. Keinen AP-7-Implementierungsslice starten.
