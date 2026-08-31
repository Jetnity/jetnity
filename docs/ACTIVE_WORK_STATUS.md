# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-A CLOSED / E5-B1 FIRST ATTEMPT BLOCKED & NOT MERGED / NO ACTIVE RUNTIME SLICE / LIVE-EVIDENCE WINS**

## 1. Aktueller verifizierter Main

`main@6928ea637133ff91cfb207cfd5b1175fecbc9699`

Commit:

`Close Entry Requirements E5-A continuity (#326)`

Live GitHub Evidence:

- CI #1491 / Run `33404116202`: **SUCCESS**;
- Ruleset `Jetnity main protection` / ID `21875372`: **active**;
- strict Required Checks;
- Conversation Resolution;
- merge-only;
- bypass leer.

Letzter abgeschlossener Runtime-Slice bleibt E5-A:

- Issue #323 CLOSED / completed;
- finaler TL-PASS-Head `82c2c268f26c5aa9ee73dfd8f9e0c179aa4376a2`;
- Recovery-PR #325 MERGED;
- Runtime-Merge `a4c0c57e144e694435cfe2b1970a76239f1ef7d5`;
- Continuity-PR #326 MERGED auf aktuellen Main.

## 2. Aktiver Runtime-Slice / Agent

**Keiner.**

Der erste E5-B1-Versuch wurde bewusst geschlossen.

Issue #327:

- `Entry Requirements E5-B1 – trusted airport timezone provenance`;
- **CLOSED / not_planned**.

Draft PR #328:

- **CLOSED / NOT MERGED**;
- Branch `feat/entry-requirements-trusted-timezone-e5b1-2026-08-31`;
- verworfener Agent-Head `fdf05f26928dfc556cc3b3b954eb3c61981b29c4`.

Logical Cursor Agent:

**`Jetnity entry requirements trusted event time 1`**, Generation 1

Session:

`bc-c0a4c448-2029-4b3a-8746-53985c8ca2e0`

Status: **STOPPED / CLOSED / NOT MERGED**.

Der Agent-Code ist ausschließlich Review-Evidence. Kein Teil davon gilt als Runtime-Truth.

## 3. E5-B1 Blocker – Production-live bestätigt

Der ursprüngliche Task nahm an, dass provider-belegte Airport-Timezone in `trip_items.metadata.routeItinerary` persistiert und aus diesem Store später als Trusted Truth gelesen werden könne.

Das ist ohne zusätzliche Write-Authority falsch.

Supabase Production:

- Projekt `qscbgcdmivbbnzrcyegn` / `Jetnity's Project`;
- Region `eu-central-2`;
- Status beim Check `ACTIVE_HEALTHY`.

Live `public.trip_items`:

- RLS enabled;
- FORCE RLS false;
- authenticated Owner-INSERT vorhanden;
- authenticated Owner-UPDATE vorhanden;
- authenticated Table Grants: INSERT, UPDATE, SELECT, DELETE.

Damit beweist RLS Ownership, aber nicht Provider-Provenance einzelner Metadata-Felder.

Zusätzlich Production-live:

- `public.trip_items_route_itinerary_schuetzen()` kanonisiert Flight-Metadata;
- `public.flug_route_itinerary_metadata(...)` baut Route-Segmente aktuell ohne Timezone-Felder neu;
- eine Timezone würde im bestehenden Persistenzpfad daher nicht lossless erhalten.

Bindende Schlussfolgerung:

> **Persisted does not mean provider-proven.**

> Trusted Provenance darf nur aus einer Write-Authority-Kette gelesen werden, die diese Herkunft technisch erzwingt.

## 4. Bestehende Provenance-Architektur

Bereits vorhanden:

`public.trip_item_commercial_provenance`

mit kontrollierter interner Write-Naht:

`jetnity_internal.trip_item_commercial_provenance_schreiben(...)`.

Das ist das relevante Sicherheitsmuster **server-owned provenance beside user-owned trip item**.

Diese Relation bleibt Commercial-Domain und darf nicht als Timezone-Store missbraucht werden.

Eine spätere persistente trusted Timezone/Event-Provenance benötigt eigenen fachlichen Contract und – falls DB-/RLS-/Grant-/Trigger-/Write-Authority-Änderung nötig – ein besonderes Product-Owner-Gate.

## 5. Readiness / Entry Requirements Gesamtstand

Provider-neutral abgeschlossen/vorhanden:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core.

E5-A projiziert nur bereits explizit gebundene absolute Event-Instants.

Nicht vorhanden:

- Trusted persistent airport timezone provenance;
- Local-Time + IANA → absolute Instant;
- DST Resolver;
- Trip/Route→Event-Occurrence Resolver;
- E5-A Auto-Bind;
- konkrete Workspace Deadline/Urgency Runtime;
- Task Persistence/Completion;
- Reminder/Push/E-Mail/Notification Runtime.

`requirementsProviderAus()` bleibt `null`.

## 6. Traveller Truth unverändert

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
Trip Snapshot = einzige Current Truth für die konkrete Reise.

Issuer Country ≠ Citizenship. Keine Residence→Nationality-Inferenz. Kein Default-/Primary-/Preferred-/Chosen-Pass. Kein `documents[0]` / `evaluations[0]` als Product Truth.

## 7. Product-Owner-Gates

Besondere PO-Gates bleiben insbesondere für:

- Providerwahl/Vertrag/DPA/Secrets/paid calls/Live-Aktivierung;
- Production-Migrationen, RLS, Ownership, Trigger/Grants/server-owned Write Authority mit realer Datenwirkung;
- fundamentale Auth/MFA/AAL-Änderungen;
- sensible Dokument-/MRZ-/Scan-/Biometrie-/Gesundheitsdaten;
- Payments / echte Geldbewegungen;
- neue laufende Kosten außerhalb des freigegebenen Budgets;
- Public Launch / irreversible externe Aktivierung.

## 8. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt bindend:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Cursor-Self-Review ist kein TL-PASS. Jeder neue Head invalidiert frühere Exact-Head-Gates.

## 9. Aktuellster Closure-Checkpoint

`docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`

Dieser Checkpoint ersetzt die vorbereitenden E5-B1-Aussagen aus dem geschlossenen PR #328 als kanonische Technical-Lead-Entscheidung.

## 10. Nächste Aktion

**Kein Runtime-Slice automatisch starten.**

Vor dem nächsten Runtime-Build:

1. finalen Main, PRs/Issues, CI/Vercel live prüfen;
2. E5-B1 Blocker-Checkpoint lesen;
3. #328 nur als verworfene Review-Evidence behandeln;
4. Flight/Route/Provider/DB Duplicate-/Integration-/Trust-Precheck erneut durchführen;
5. prüfen, ob der kleinste sichere Slice ausschließlich `ephemeral provider-observed airport timezone evidence` im Flight-Adapter/Contract enthält;
6. keine owner-beschreibbare Persistenz als Trusted Provenance verwenden;
7. keine UTC/DST/Event-Resolver-Logik in denselben Slice ziehen;
8. sobald persistente server-owned Provenance erforderlich wird: STOPP am Product-Owner-Gate.

**Live-Evidence gewinnt immer.**
