# Jetnity – P2-TA-04 C1 Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Account plattform audit vorbereitung 7`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #122 / C1 only.

Geprüft: Migration `20260828015304` (kanonische Production-/Repo-Version; SQL funktional identisch), historische/develop-only Author-Evidence `20260828120000`, `party_loeschen`, Runtime-Umbau von `travellerEntfernen`, Party-Cap-Trigger, Child-Limit UPDATE, Tests, ADR-0181, Continuity.

Keine RLS-Policy geändert. Kein Tabellen-REVOKE. Kein SECURITY DEFINER. Kein Auth/MFA/AAL. Kein AP-5. Kein Production-Write durch den Author. Production C1 wurde später vom Technical Lead als `20260828015304` angewendet; dieser Review-Fix verändert Supabase nicht erneut.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde SECURITY DEFINER eingeführt? | Nein. Beide neuen/geänderten Funktionen sind INVOKER. |
| Wurde authenticated Tabellen-DML entzogen? | Nein. |
| Wurde RLS/Ownership geändert? | Nein. |
| Ist der Party-Cap ein nacktes `count(*)`? | Nein. `FOR NO KEY UPDATE` auf `trips` vor der Zählung. |
| Kann `party_schreiben`-Upsert bei 20 bestehenden Zeilen scheitern? | Nein. Cap-Trigger ist AFTER INSERT / UPDATE OF trip_id,user_id; Upsert auf dieselbe Reise feuert ihn nicht. |
| Kann Reparent das Cap umgehen? | Nein. UPDATE OF trip_id zählt die Zielreise. |
| Gelten Child-Limits nur für INSERT? | Nein. Trigger ist INSERT OR UPDATE. |
| Bleibt Delete idempotent? | Ja. Fehlende Ref → `ok` / `deleted=0`. Fremde Reise → `42501`. |
| Wurde Production durch den Author angewendet? | Nein. Author-zeitliche Evidence. |
| Wurde Production später vom Technical Lead angewendet? | Ja. Live als `20260828015304` unter bestehender PO-C1-Freigabe. Dieser Review-Fix wendet Supabase nicht erneut an. |
| Wurde C2/AP-5 gestartet? | Nein. |

## 3. Risiken, die bleiben

- Exact-Head vor Stamp: Actions `33133248112` SUCCESS und Vercel `D6onnex5Amwn9x1JLp9PPi7L3hXZ` SUCCESS auf `f46fae17`. Ein Stamp danach braucht erneute Live-Gates.
- `db:sicherheit` 217/248: vorbestehende Admin-AAL2-JWT-Lücken, nicht C1.
- C2 bleibt ein grosses Privilege-Gate.
- Production C1 ist live als `20260828015304`. Die frühere Author-Zeile „Production-Apply ist nicht erfolgt“ bleibt Pre-Apply-Evidence.
- Historische/develop-only Version `20260828120000` bleibt auf `develop` und wird nicht still umgeschrieben.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice.

**Unabhängiger Technical-Lead-Re-Review:** ausstehend nach Rename/Docs-Reconciliation. Dieses Self-Review ersetzt ihn nicht.
