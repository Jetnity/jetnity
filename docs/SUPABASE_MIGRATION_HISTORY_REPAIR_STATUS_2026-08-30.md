# Jetnity – Supabase Migration-History Repair Status

Stand: 30. August 2026  
Status: **PRODUCTION REPAIR EXECUTED / AFTER-IMAGE PASS / FRESH REPLAY PASS / TEMP BRANCH DELETED / FINAL DOCS HEAD RE-GATE REQUIRED**  
Issue: #249  
PR: #250  
Logical Cursor-Agent: **`Jetnity infrastructure migration repair 2`**

> Live-Evidence gewinnt. Vollständige Ausführungs-/Recovery-Evidence: `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_EXECUTION_EVIDENCE_2026-08-30.md`.

## 1. Review-Vorgeschichte

| Feld | Wert |
| --- | --- |
| Merge-Base `main` | `c29ac5de3e0ab998ff830490a9a3e85299c399e0` |
| Erster CHANGES-REQUIRED Head | `17c9f4f00fcb01f52b80a5c2c2264fff815c1b6e` |
| Zweiter CHANGES-REQUIRED Head | `f857210428a2d6ef7d1a4e9744c35ea74778fe10` |
| Finaler Agent-Review-Head | `16cf73d64dd08ade70a9bd2fa985d4a84931b29f` |
| Actions auf Agent-Review-Head | `33314079382` SUCCESS |
| Vercel auf Agent-Review-Head | `7JmqJjGKLRsahWa3BV3RdQCZy7w9` SUCCESS/READY |
| Technical-Lead Review | **PASS vor Production-Ausführung** |

Der Agent führte selbst keinen Production-/Development-Write aus. Die Production-Ausführung erfolgte erst nach unabhängiger Technical-Lead-Prüfung und Product-Owner-Freigabe des Reparaturumfangs.

## 2. Production Before-Image

Unmittelbar vor dem Write weiterhin exakt:

- Version `20260829140000`
- Name `trip_item_commercial_provenance`
- `statement_count=1`
- Marker-MD5 `414f7318235ac388e97fd74f97536ca1`
- Provenance-Tabelle OID `282263`, RLS an, FORCE RLS aus, Rowcount `0`
- exact Table ACL / Owner-Policy / Function ACL / Function config
- Runtime Gate geschlossen
- exact Writer-/Runtime-Rollenattribute
- exact drei Membership-Records inkl. grantor / admin / inherit / set options
- Writer Function-MD5 `7e7bfe10d20c2f13274d1eb04a75150e`

## 3. Production Repair

Die einzige Production-Mutation war das transaktionale Ersetzen von:

`supabase_migrations.schema_migrations.statements`

für exakt Version `20260829140000` / Name `trip_item_commercial_provenance`.

Kanonischer Repo-Body:

- Git blob `e25ab1b7efb48157828968993749a25fa30cc660`
- MD5 `bd4b613da5037b3c7535d17451dd8e67`
- SHA-256 `e85ded3f0fdbdc5a97bca8af796fa4ce9b0283cb27d06f83ab26f0cd16f11404`

Fail-closed innerhalb derselben Transaktion:

- kanonischer Body-Hash
- exact History Before-Image
- exact Katalog Before-Image
- UPDATE-Rowcount exakt `1`
- exact History After-Image
- Katalog After-Image unverändert

Kein S5-B-DDL wurde auf Production erneut ausgeführt.

## 4. Production After-Image

PASS:

- Version/Name unverändert
- `statement_count=1`
- Body-MD5 jetzt `bd4b613da5037b3c7535d17451dd8e67`
- erster ausführbarer Inhalt `create schema if not exists jetnity_internal;`
- Tabelle OID `282263`, RLS/ACL/Policy unverändert
- Rowcount `0`
- Gate unverändert geschlossen
- Rollen/Memberships unverändert
- Function-MD5 weiterhin `7e7bfe10d20c2f13274d1eb04a75150e`

## 5. Backup / Recovery

- Supabase Organization `Jetnity` ist Pro.
- Pro-Daily-Backup/Restore mit 7 Tagen Retention wurde vor Write erneut gegen die aktuelle Supabase-Dokumentation verifiziert.
- PITR wurde nicht aktiviert.
- exact ursprünglicher Marker-Body + MD5 sind im versionierten Before-Image und in der Execution-Evidence erhalten.
- Ein enger History-only Rollback ist deshalb weiterhin rekonstruierbar; er war nicht erforderlich.

## 6. Fresh Replay

Freigegebener aktueller Branch-Preis: **USD 0.01344/Stunde**.

Temporärer Replay-Branch:

- Name `p1-replay-20260829140000-2026-08-30`
- Branch ID `d8aec9d4-fdd9-4d28-a68f-c5400e59ea8e`
- Project Ref `efobhwzkjarnkthgpmur`
- Status `FUNCTIONS_DEPLOYED` / `ACTIVE_HEALTHY`

Replay PASS:

- Version `20260829140000` vorhanden, Marker abwesend
- Supabase normalisierte den replayten Body in 42 ausführbare History-Statements
- `create schema ...` in Statement 1
- Provenance-Tabelle in Statement 18
- Writer-Funktion in Statement 30
- `reise_anlegen` in Statement 39
- Tabelle/RLS/Policy/Gate/Rollen vorhanden
- spätere Migration `20260829210052` ebenfalls erfolgreich angewendet

Raw Function-MD5 differiert wegen historischer Production-Minifizierung vs. kanonisch formatierter Replay-Quelle. Nach Entfernen von Kommentaren und Whitespace ist `prosrc` auf Production und Replay identisch: `767161b569ebcb5001ec4b753b5b4928`.

## 7. Kostenende

Der temporäre Branch wurde nach Evidence gelöscht; Supabase bestätigte `success=true`.

Der bestehende `develop`-Branch `yfvbxvijcorffwxbxahl` blieb unangetastet.

## 8. Aktueller Gate-Zustand

Der technische P1-Repair selbst ist **PASS**.

Durch diese nachträgliche Evidence-Dokumentation entsteht jedoch ein neuer Git-Head. Deshalb gilt vor Ready/Merge erneut:

1. exact-head GitHub Actions SUCCESS
2. exact-head Vercel SUCCESS/READY
3. PR-Diff final gegen Scope prüfen
4. erst dann Ready/Merge nach Technical-Lead-Protokoll

Kein Development-Reconciliation-Slice und kein Cleanup-Slice startet automatisch.
