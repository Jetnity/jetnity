# Jetnity – P2-TA-04 C1 Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Account plattform audit vorbereitung 7`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #122 / C1 only.

Geprüft: Migration `20260828120000`, `party_loeschen`, Runtime-Umbau von `travellerEntfernen`, Party-Cap-Trigger, Child-Limit UPDATE, Tests, ADR-0181, Continuity.

Keine RLS-Policy geändert. Kein Tabellen-REVOKE. Kein SECURITY DEFINER. Kein Auth/MFA/AAL. Kein AP-5. Kein Production-Write durch den Author.

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
| Wurde Production angewendet? | Nein. |
| Wurde C2/AP-5 gestartet? | Nein. |

## 3. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice, sobald Develop-Apply und Tests gestempelt sind.

**Unabhängiger Technical-Lead-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
