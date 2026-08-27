# Jetnity – Admin AAL2 Production Data-Plane Reconciliation Gate

Stand: 27. August 2026  
Typ: **P1 Security / Migration-History Reconciliation / Production Gate Preparation**  
Finding: `P1-AAL2-PROD-01`  
Status: **ALIGNMENT AUF `main` / EINMAL-RUNNER SEPARAT – KEIN PRODUCTION APPLY AUSGEFÜHRT**

Historischer Satz „KEIN PRODUCTION APPLY AUTORISIERT“ bleibt Evidence vor Issue #101.
Der Apply-Pfad selbst steht in `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_TASK_2026-08-27.md`.

Bezug:

- `docs/QS2_ADMIN_AAL2_CLOSURE_TASK.md`
- `docs/QS2_ADMIN_AAL2_CLOSURE_STATUS.md`
- `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`
- `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-27.md`

## 1. Live-Problem

Application-Layer AAL2 ist integriert. Production-Data-Layer AAL2 ist nicht aktiv.

Production `qscbgcdmivbbnzrcyegn`:

- `public.aktuelles_admin_aal2()` fehlt
- fünf administrative `darf_*()`-Capabilities prüfen nur Mindestrollen
- sensitive Admin-RLS-Policies hängen an diesen Capabilities
- administrative SECURITY-DEFINER-RPCs sind für `authenticated` ausführbar und hängen intern an denselben Capabilities

Konsequenz:

> Ein gültiges AAL1-JWT eines bereits privilegierten Moderator-/Operator-/Admin-/Owner-Kontos kann die Application-AAL2-Grenze durch direkte PostgREST/RPC-Nutzung umgehen.

Normale Endnutzerrollen erhalten dadurch keine Admin-Rechte. Das Finding bleibt dennoch **P1**, weil MFA/AAL2 gerade den privilegierten Account gegen Credential-/Session-Kompromittierung absichern soll.

## 2. Bereits genehmigter fachlicher Contract

Die kanonische Entscheidung aus P1-QS2-01 bleibt:

> administrative DB-Fähigkeit = bisherige Mindestrolle **UND** signierter aktueller Supabase-JWT-Claim `aal='aal2'`.

Nicht zulässig:

- Faktor-Existenz als AAL2-Ersatz
- `nextLevel` als aktuelle Assurance
- User-Metadata als AAL-Truth
- Break-Glass ohne AAL2
- Änderung der bestehenden Mindestrollen
- allgemeiner Auth-/RLS-/Ownership-Umbau

## 3. Migration-History-Drift

Live Development führt:

- Version `20260826052735`
- Name `admin_aal2_data_plane`

Repository führt:

- Datei `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`

Production führt keine AAL2-Data-Plane-Version.

Die fachliche Development-Semantik ist live korrekt: Helper vorhanden und alle fünf Capabilities verlangen AAL2.

### Verbindliche Reconciliation-Regel

Kein Versuch, historische Migrationen still umzubenennen, zu löschen oder Production-History zu fälschen.

Bevor Production angewandt wird, muss der Technical Lead entscheiden und belegen, wie der Forward-Only-Pfad aussieht. Bevorzugt ist eine **neue, nach aktuellem Production-Head datierte, idempotente Alignment-Migration**, die denselben engen Contract setzt und die historische Development-/Repo-Differenz dokumentiert, statt alte Historie rückwirkend zu manipulieren.

Die alte Datei bleibt historische Evidence.

## 4. Erlaubter Vorbereitungsscope

Ohne Production-Apply darf vorbereitet werden:

1. exakte Live-Inventur der fünf Capabilities und aller direkten Admin-RLS/RPC-Konsumenten;
2. byte-/semantikgenauer Vergleich Repo-Migration vs Development-Live-Funktionen;
3. forward-only Alignment-Migration als **neue** Datei vorbereiten;
4. gezielte Source-/DB-Contract-Tests für:
   - AAL1 + privilegierte Rolle => administrative Capability false
   - AAL2 + unzureichende Rolle => false
   - AAL2 + ausreichende Rolle => bestehende Capability true
   - fehlender `aal`-Claim => false
   - Break-Glass erzeugt keine DB-Rechte
   - Consumer-Self-Service-RLS bleibt unverändert
5. Rollout-/Rollback-/Verification-Playbook vorbereiten;
6. Exact-Head CI + Vercel für den Code-/Docs-PR;
7. Development/read-only Evidence erneuern, ohne Production zu verändern.

## 5. Strikter Non-Scope

Ohne neue ausdrückliche Product-Owner-Freigabe verboten:

- Production-Migration anwenden
- Production-RLS-/Capability-Änderung
- Rollenmodell ändern
- `profiles` Ownership ändern
- Auth-/Session-/MFA-Architektur umbauen
- neue Admin-Fähigkeiten hinzufügen
- Service Role in Consumer-Pfade bringen
- Secrets ändern
- Provider/Payment/Growth/Workspace-Arbeit mischen
- AP-4/AP-7/TW-7/TW-8 nebenbei starten

## 6. Pflicht-Review vor Production-Gate

Technical Lead prüft unabhängig:

- tatsächlichen Diff
- alle Capability-Consumer
- SECURITY DEFINER und `search_path`
- GRANT/REVOKE
- AAL-Truth nur aus signiertem JWT
- Mindestrollen unverändert
- Consumer-RLS Regression
- Migration-History / Forward-Only-Eigenschaft
- Transactionality
- Rollback-Fähigkeit
- Development Evidence
- exact-head GitHub Actions
- exact-head Vercel
- offene Review-Threads

Erst danach darf der Product Owner um die **konkrete** Production-Anwendung dieses exakt reviewten Heads gebeten werden.

## 7. Production-Acceptance nach ausdrücklicher Freigabe

Falls und nur falls der Product Owner später ausdrücklich den Production-Apply freigibt:

- Expected migration/head erneut live prüfen
- nur die reviewte Alignment-Migration anwenden
- danach read-only beweisen:
  - `aktuelles_admin_aal2()` existiert
  - alle fünf `darf_*()` verlangen Rolle + AAL2
  - normale Self-Service-Ownership-Policies unverändert
  - Admin-RPCs liefern mit AAL1 keine privilegierten Daten
  - AAL2 + korrekte Rolle funktioniert
- Supabase Security Advisor erneut lesen
- keine Folgemigration automatisch anwenden
- Continuity/ADR/Status aktualisieren

## 8. STOPP

Dieser Task ist eine **Gate-Vorbereitung**. Er ist keine Production-Freigabe.

Kein Cursor-Agent wurde durch das Erstellen dieses Tasks gestartet. Der Technical Lead entscheidet nach dem Live-Checkpoint, welchem exakten Cursor-Agenten ein enger Vorbereitungsscope zugewiesen wird. Feature-Arbeit TW-7 bleibt bis zur P1-Entscheidung gestoppt.