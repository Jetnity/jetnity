# Jetnity – Supabase Migration-History Repair Handoff

Stand: 30. August 2026  
Status: **PRODUCTION REPAIR EXECUTED / AFTER-IMAGE PASS / FRESH REPLAY PASS / TEMP BRANCH DELETED / FINAL EXACT-HEAD RE-GATE REQUIRED**

## 1. Current Truth

Der P1-Defekt an Supabase Migration-History `20260829140000` ist technisch repariert und durch einen frischen Replay-Branch bewiesen.

Zentrale Audit-/Recovery-Evidence:

- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_EXECUTION_EVIDENCE_2026-08-30.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_BEFORE_IMAGE_2026-08-30.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_STATUS_2026-08-30.md`

Live-Evidence gewinnt weiterhin vor Dokumentation.

## 2. Transport

| Fakt | Wert |
| --- | --- |
| PR | #250 |
| Issue | #249 |
| Branch | `repair/supabase-migration-history-20260829140000-2026-08-30` |
| Merge-Base bei Slice-Start | `c29ac5de3e0ab998ff830490a9a3e85299c399e0` |
| Finaler Agent-Review-Head | `16cf73d64dd08ade70a9bd2fa985d4a84931b29f` |
| Agent exact-head Actions | `33314079382` SUCCESS |
| Agent exact-head Vercel | `7JmqJjGKLRsahWa3BV3RdQCZy7w9` READY |
| Logical Cursor-Agent | `Jetnity infrastructure migration repair 2` |
| Cursor Session | `bc-b4f2b6bd-ce40-4ddc-8204-1650eec68589` |

Der nachträgliche Evidence-Commit erzeugt einen neuen Git-Head; deshalb sind die Agent-Gates nicht der finale Merge-Gate. Der aktuelle PR-Head muss erneut live gegatet werden.

## 3. Was auf Production tatsächlich geändert wurde

Genau eine Metadatenzelle:

- Relation `supabase_migrations.schema_migrations`
- Version `20260829140000`
- Name blieb `trip_item_commercial_provenance`
- ausschließlich Spalte `statements`

Vorher:

- ein Prosa-Marker
- MD5 `414f7318235ac388e97fd74f97536ca1`

Nachher:

- vollständiger kanonischer Repository-SQL-Body
- MD5 `bd4b613da5037b3c7535d17451dd8e67`
- erster ausführbarer Inhalt `create schema if not exists jetnity_internal;`

Kein S5-B-DDL wurde erneut auf Production ausgeführt.

## 4. Production After-Image

Unverändert gegenüber Before-Image außer der History-Zelle:

- Provenance-Tabelle OID `282263`
- RLS an, FORCE RLS aus
- Rowcount `0`
- Table ACL unverändert
- genau eine Owner-SELECT-Policy
- Runtime Gate geschlossen
- Writer-/Runtime-Rollen unverändert
- exakt drei Membership-Records unverändert
- Writer-Funktion SECURITY DEFINER / `search_path=""`
- Raw Function-MD5 weiterhin `7e7bfe10d20c2f13274d1eb04a75150e`

## 5. Backup / Rollback

Vor dem Production-Write wurde Supabase Pro und der aktuelle tägliche Backup-/Restore-Vertrag erneut verifiziert. PITR wurde nicht aktiviert.

Zusätzlich ist der ursprüngliche History-Marker inklusive exaktem Body und Hash versioniert erhalten. Ein enger History-only Rollback ist daher rekonstruierbar, war aber nicht erforderlich.

Siehe vollständige Details in `SUPABASE_MIGRATION_HISTORY_REPAIR_EXECUTION_EVIDENCE_2026-08-30.md`.

## 6. Fresh Replay – PASS

Temporärer Branch:

- Name `p1-replay-20260829140000-2026-08-30`
- Branch ID `d8aec9d4-fdd9-4d28-a68f-c5400e59ea8e`
- Project Ref `efobhwzkjarnkthgpmur`
- Parent `qscbgcdmivbbnzrcyegn`
- Status `FUNCTIONS_DEPLOYED` / `ACTIVE_HEALTHY`

Beweis:

- kein `MIGRATIONS_FAILED`
- Prosa-Marker abwesend
- Supabase normalisierte den Replay in 42 ausführbare History-Statements
- `create schema` Statement 1
- Provenance-Tabelle Statement 18
- Writer-Funktion Statement 30
- `reise_anlegen` Statement 39
- Tabelle/RLS/Policy/Gate/Rollen vorhanden
- spätere Migration `20260829210052` erfolgreich vorhanden

Raw Function-MD5 differierte wegen Formatierung/Kommentaren. Nach Entfernen von Kommentaren und Whitespace war `prosrc` auf Production und Replay exakt gleich: `767161b569ebcb5001ec4b753b5b4928`.

## 7. Kosten / Cleanup des Testbranches

Branch-Preis vor Erstellung: **USD 0.01344/Stunde**, vom Product Owner ausdrücklich freigegeben.

Der temporäre Replay-Branch wurde nach der Evidence gelöscht; Supabase bestätigte `success=true`. Damit läuft kein Testbranch-Kostenposten weiter.

Der bestehende Development-Branch `yfvbxvijcorffwxbxahl` wurde nicht reset, rebased, merged oder gelöscht.

## 8. Finaler PR-Gate

Vor Ready/Merge von #250 noch zwingend:

1. aktuellen PR-Head live lesen
2. finalen Diff gegen Scope prüfen
3. `docs/ACTIVE_WORK_STATUS.md` darf nicht im Diff sein
4. exact-head GitHub Actions SUCCESS
5. exact-head Vercel SUCCESS/READY
6. dann Technical-Lead Ready/Merge
7. danach Issue #249 schließen und Main/Post-Merge-Evidence verifizieren

## 9. Danach

Kein Development-Reconciliation-Slice startet automatisch.

Als nächster bewusst gewählter Arbeitsblock folgt nach abgeschlossenem P1 die **nicht-destruktive Jetnity Legacy & Infrastructure Cleanup Gate-0 Inventur**. Keine Löschung startet ohne Inventar, Before-Image, Abhängigkeitsnachweis, Recovery-/Rollback-Pfad und After-Checks.
