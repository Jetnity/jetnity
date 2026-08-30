# Supabase Migration-History Repair – Replay Verification

Stand: 30. August 2026  
Status: **POST-WRITE PLAYBOOK / CURSOR CREATES OR DELETES NO BRANCH**  
Issue: #249

Dieser Schritt ist **nicht** Teil der Cursor-Vorbereitung. Er gilt erst, nachdem der Technical Lead den Production-History-Body für `20260829140000` transaktional ersetzt und die After-Probe bestanden hat.

## 1. Zweck

Beweisen, dass der ersetzte History-Body auf einer **leeren** Replay-Datenbank die S5-B-Objekte erzeugen kann. Production selbst darf dabei nicht erneut das Repo-SQL ausführen.

## 2. Wer darf was

| Aktion | Cursor-Agent | Technical Lead nach PASS |
| --- | --- | --- |
| Production `statements` ersetzen | nein | ja, einmalig, fail-closed |
| Neuen temporären Supabase-Branch erzeugen | nein | ja |
| Bestehenden `develop` reset/rebase/mergen | nein | nein, nicht in diesem Slice |
| Temporären Branch nach Evidence löschen | nein | ja |
| PITR aktivieren | nein | nein |

## 3. Ablauf nach After-Probe PASS

1. Production After-Image sichern: Version, Name, `statement_count=1`, Body-MD5 = `bd4b613da5037b3c7535d17451dd8e67`, erstes ausführbares SQL = `create schema if not exists jetnity_internal;`.
2. Production-Katalog erneut read-only prüfen: Tabelle, OID `282263` sofern unverändert, RLS an, 0 Rows, Gate `false`, Function-MD5 `7e7bfe10d20c2f13274d1eb04a75150e`.
3. **Neuen** temporären Preview-Branch aus dem reparierten Production-Parent anlegen. Nicht `develop` wiederverwenden.
4. Warten, bis der Branch `ACTIVE_HEALTHY` / `FUNCTIONS_DEPLOYED` ist. Jeder `MIGRATIONS_FAILED` = STOP.
5. Read-only prüfen:
   - History-Version `20260829140000` vorhanden
   - Statement 0 ist SQL, nicht der Prosa-Marker
   - `public.trip_item_commercial_provenance` existiert
   - RLS an, Owner-SELECT-Policy vorhanden
   - Gate `production_write_path_allocated=false`
6. Evidence versionieren.
7. Temporären Branch löschen, sofern er nur zur Probe diente.
8. `develop` bleibt unangetastet. Extra-Versionen `20260826052735`, `20260828120000` und S2-Versionsdrift sind ein späterer, eigener Plan.

## 4. Abbruch

- Preview nicht healthy
- Statement 0 weiter Prosa oder semantisch anders als der Repo-Body
- Provenance-Tabelle fehlt auf dem Preview
- Production-Katalog hat sich gegenüber dem Before-Image verändert

Kein Nachbessern im selben Schwung. Kein Re-Apply der Repo-Datei auf Production.

## 5. Kosten

Ein temporärer Supabase-Preview-Branch kann kostenpflichtig sein. Er bleibt kurzlebig und unter der USD-100-Richtlinie. Keine neuen Provider, Secrets oder paid API-Calls.
