# Supabase Migration-History Repair – Replay Verification

Stand: 30. August 2026  
Status: **EXECUTED / FRESH REPLAY PASS / TEMP BRANCH DELETED**  
Issue: #249  
PR: #250

Vollständige Ausführungs-/Recovery-Evidence: `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_EXECUTION_EVIDENCE_2026-08-30.md`.

## 1. Zweck

Beweisen, dass der reparierte History-Body von `20260829140000` auf einer frischen Replay-Datenbank die erwarteten S5-B-Objekte erzeugt und nachfolgende Migrationen weiterlaufen können, ohne S5-B-DDL erneut auf Production auszuführen.

## 2. Production-Voraussetzung – erfüllt

Vor Branch-Erstellung war Production bereits transaktional repariert und unabhängig nachgeprüft:

- Version `20260829140000`
- Name `trip_item_commercial_provenance`
- Production `statement_count=1`
- Body-MD5 `bd4b613da5037b3c7535d17451dd8e67`
- erster ausführbarer Inhalt `create schema if not exists jetnity_internal;`
- Production-Katalog unverändert gegenüber dem exact Before-Image

## 3. Kostenfreigabe

Aktuell abgefragter Supabase-Branch-Preis:

**USD 0.01344 / Stunde**

Der Product Owner hat diesen konkreten Betrag ausdrücklich freigegeben.

## 4. Temporärer Replay-Branch

| Feld | Wert |
| --- | --- |
| Name | `p1-replay-20260829140000-2026-08-30` |
| Branch ID | `d8aec9d4-fdd9-4d28-a68f-c5400e59ea8e` |
| Project Ref | `efobhwzkjarnkthgpmur` |
| Parent | `qscbgcdmivbbnzrcyegn` |
| `with_data` | `false` |
| beobachteter Status | `FUNCTIONS_DEPLOYED` / `ACTIVE_HEALTHY` |

Kein `MIGRATIONS_FAILED` wurde beobachtet.

Der bestehende `develop`-Branch wurde dafür nicht verwendet oder verändert.

## 5. Replay-Ergebnis – PASS

Read-only auf dem frischen Branch bestätigt:

- History-Version `20260829140000` genau einmal vorhanden
- alter Prosa-Marker nicht vorhanden
- Supabase normalisierte den replayten kanonischen Body in **42 ausführbare History-Statements**
- Statement 1 enthält den kanonischen Kommentarblock und `create schema if not exists jetnity_internal;`
- Provenance-Tabellenerstellung in Statement 18
- Writer-Funktion in Statement 30
- `public.reise_anlegen` in Statement 39
- `public.trip_item_commercial_provenance` vorhanden
- RLS aktiv
- Owner-Policy vorhanden (`policy_count=1`)
- Provenance-Rowcount `0`
- Commercial Runtime Gate geschlossen
- Rollen `jetnity_commercial_runtime` und `jetnity_commercial_writer` vorhanden / NOLOGIN
- spätere Account-Migration `20260829210052` vorhanden
- letzte History-Version auf dem Branch `20260829210052`

Damit ist bewiesen, dass die reparierte History den früher blockierten Fresh-Replay nicht mehr an `20260829140000` scheitern lässt.

## 6. Warum der Branch 42 Statements speichert

Production hält nach dem engen Repair den vollständigen kanonischen Repo-Body als ein `statements`-Element. Beim tatsächlichen Fresh-Replay hat Supabase diesen Body in 42 ausführbare History-Statements normalisiert.

Das ist kein erneuter Defekt:

- der Prosa-Marker ist weg;
- Statement 1 stammt aus der kanonischen Migration;
- die erwarteten S5-B-Objekte wurden erzeugt;
- nachfolgende Migrationen wurden ebenfalls erfolgreich angewendet.

## 7. Raw Function-MD5 Differenz – geprüft und erklärt

Raw `pg_get_functiondef()` MD5:

- Production: `7e7bfe10d20c2f13274d1eb04a75150e`
- Fresh Replay: `c59b9935cba45e9dcfcc9f4d920aec83`

Die Definitionen wurden unabhängig aus beiden Datenbanken gelesen. Production enthält den historisch manuell angewendeten, minifizierten Source; Fresh Replay den kanonisch formatierten Repo-Source inklusive Kommentarzeilen.

Nach Entfernen von `--`-Kommentaren und Whitespace war der `prosrc`-Fingerprint auf beiden Seiten exakt:

`767161b569ebcb5001ec4b753b5b4928`

Damit wurde keine erkannte semantische Writer-Funktionsabweichung festgestellt.

## 8. Branch Cleanup

Nach erfolgreicher Replay-Evidence wurde Branch `d8aec9d4-fdd9-4d28-a68f-c5400e59ea8e` gelöscht.

Supabase Ergebnis: `success=true`.

Damit entstehen aus diesem Replay-Branch keine weiteren stündlichen Kosten.

## 9. Ergebnis

**Fresh Replay PASS.**

P1 darf nach finalem Git exact-head CI/Vercel-Gate in PR #250 integriert werden.

Nicht Teil dieser Verification:

- bestehendes `develop` reconciliieren/resetten/rebasen
- AP-7
- Provider Live / Commercial Write Activation
- PITR
- Branch Protection
- Legacy-/Infrastructure-Cleanup
