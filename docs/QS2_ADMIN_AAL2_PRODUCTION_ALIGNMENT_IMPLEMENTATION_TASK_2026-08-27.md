# Jetnity – Admin AAL2 Production Data-Plane Alignment – Implementierungsauftrag

Stand: 27. August 2026  
Typ: **P1 Security / forward-only Migration Preparation**  
Finding: `P1-AAL2-PROD-01`  
Cursor-Agent: `Jetnity quality security audit`  
Status: **CONTROL START – IMPLEMENTIERUNG VORBEREITEN, KEIN PRODUCTION APPLY**

## 1. Verbindliche Live-Baseline

Vor Arbeitsbeginn erneut live prüfen. Zum Zeitpunkt dieses Auftrags:

- Repository: `Jetnity/jetnity`
- `main`: `4362502bf23c1c54f721af48c0f7bdd6fcbdee3b`
- PR #97 ist integriert
- Production Supabase: `qscbgcdmivbbnzrcyegn`
- Development Supabase: `yfvbxvijcorffwxbxahl`
- Production Migration-Head: `20260827010000_reise_anlegen_zero_stage_fail_closed`
- Development enthält zusätzlich historische `20260826052735_admin_aal2_data_plane`
- Repo enthält historische Datei `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`

Wenn eine dieser Baselines live abweicht: **STOPP, Drift dokumentieren und nicht blind fortsetzen.**

## 2. Problem

Application-Layer AAL2 ist integriert. Production-Data-Layer AAL2 ist nicht aktiv.

Production live:

- `public.aktuelles_admin_aal2()` fehlt
- fünf `public.darf_*()`-Capabilities prüfen aktuell nur Mindestrollen
- 14 direkte Admin-RLS-Policies referenzieren diese Capabilities
- vier administrative `SECURITY DEFINER`-RPCs sind für `authenticated` ausführbar und prüfen intern `darf_betrieb_lesen()`

Dadurch kann ein gültiges AAL1-JWT eines bereits privilegierten Kontos direkte PostgREST/RPC-Pfade verwenden, obwohl der Application-Guard AAL2 verlangt.

## 3. Verbindlicher Zielvertrag

Administrative DB-Fähigkeit bleibt:

> bisherige Mindestrolle **UND** aktueller signierter Supabase-JWT-Claim `aal='aal2'`.

Die bisherigen Mindestrollen dürfen nicht verändert werden:

- `darf_betrieb_lesen()` → mindestens `moderator`
- `darf_betrieb_eingreifen()` → mindestens `operator`
- `darf_konten_verwalten()` → mindestens `moderator`
- `darf_inhalte_moderieren()` → mindestens `moderator`
- `darf_konfiguration_verwalten()` → mindestens `admin`

Fail-closed:

- `aal='aal2'` → Assurance erfüllt
- `aal='aal1'`, fehlend, malformed oder nicht lesbar → Assurance false
- Faktor-Existenz, `nextLevel`, User Metadata oder Break-Glass ersetzen AAL2 nicht

## 4. Erlaubter Implementierungsscope

Der Cursor-Agent darf ausschließlich:

1. von aktuellem `main` arbeiten;
2. eine **neue forward-only Alignment-Migration** nach dem aktuellen Production-Head erstellen;
3. bevorzugter Dateiname, sofern bei Arbeitsbeginn weiterhin frei:
   - `supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`
4. die historische Datei `20260826090000_admin_aal2_data_plane.sql` **nicht** umbenennen, löschen oder rückwirkend verändern;
5. die neue Migration idempotent auf denselben engen AAL2-Vertrag ausrichten;
6. Grants/Revoke und `search_path` explizit erhalten/härten;
7. Tests/Evidence hinzufügen, die mindestens folgende Matrix beweisen:
   - AAL1 + privilegierte Rolle => Capability false
   - fehlender AAL-Claim + privilegierte Rolle => false
   - AAL2 + unzureichende Rolle => false
   - AAL2 + ausreichende Rolle => true
   - bestehende Mindestrollen unverändert
   - normale Consumer-Self-Service-RLS bleibt unverändert
   - Break-Glass erzeugt keine DB-Rechte
8. die vier Admin-`SECURITY DEFINER`-RPCs und alle 14 direkten Admin-RLS-Consumer gegen den Capability-Pfad inventarisieren;
9. Rollout-, Verification- und Rollback-/Recovery-Playbook dokumentieren;
10. Status/Handoff aktualisieren, sodass ein neuer Chat den genauen Stand ohne Chatverlauf rekonstruieren kann.

## 5. Strikter Non-Scope

Verboten in diesem Auftrag:

- **kein Production-Apply**
- keine Production-RLS-/Capability-Writes
- keine Änderung des Rollenmodells
- kein allgemeiner Auth-/Session-/MFA-Umbau
- keine Consumer-Ownership-Änderung
- keine neue Admin-Capability
- kein Service-Role-Einsatz in Consumer-Pfaden
- keine Provider-/Payment-/Growth-/Workspace-Arbeit
- kein TW-7/TW-8/AP-4/AP-7/S5-B
- keine Secrets
- keine neue laufende Infrastruktur/Kosten
- keine Branch-/PR-Hygiene-Löschaktion

## 6. Pflicht-Self-Review des Cursor-Agenten

Vor Übergabe an den Technical Lead adversarial prüfen:

- ist die neue Migration wirklich forward-only?
- kollidiert die Versionsnummer mit keinem inzwischen hinzugekommenen Migration-File?
- sind Rolle und AAL logisch mit `AND` verknüpft?
- kommt AAL ausschließlich aus `auth.jwt()`?
- ist fehlendes AAL fail-closed?
- bleiben alle fünf Mindestrollen exakt gleich?
- bleiben Grants für `authenticated`/`service_role` und Revoke für `public`/`anon` korrekt?
- haben Helper/Capabilities einen sicheren `search_path`?
- verändert die Migration keine Tabellenstruktur, Ownership oder Consumer-RLS-Semantik außer dem bestehenden Admin-Capability-Zweig?
- sind die 14 RLS-Policies und vier SECURITY-DEFINER-RPCs vollständig erfasst?
- gibt es eine sichere Verifikation nach einem späteren Production-Apply?
- ist klar dokumentiert, dass der Apply weiterhin Product-Owner-Gate ist?

## 7. Erwartete Deliverables

Mindestens:

- neue Alignment-Migration
- zielgerichtete Tests bzw. statische Contract-Tests
- `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_STATUS_2026-08-27.md`
- `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_PLAYBOOK_2026-08-27.md`
- aktualisierte Continuity/Handoff-Stelle, falls der Implementierungsstand sonst nicht eindeutig auffindbar wäre
- Draft-PR mit exaktem Head und vollständigem Scope/Non-Scope

## 8. Übergabe-Gate

Nach Fertigstellung:

1. **STOPP**
2. kein Ready
3. kein Merge
4. kein Production-Apply
5. Cursor-Agent meldet exakten Branch, Head SHA, Diff-Dateien, lokale Tests und bekannte Restpunkte
6. unabhängiger Technical Lead prüft den exakten Head, GitHub Actions, Vercel, Migration-Semantik, Supabase-Development-Evidence und Review-Threads
7. erst bei Technical-Lead-PASS darf der PR normal integriert werden
8. selbst nach Merge bleibt der eigentliche Production-Apply ein separates ausdrückliches Product-Owner-Gate

## 9. Continuity-Regel

Alle neuen wesentlichen Findings, Abweichungen und Entscheidungen werden im Repository dokumentiert. Kein zukünftiger Chat darf diesen Task blind als aktuell annehmen; zuerst immer Live-Evidence gegen GitHub, CI, Vercel und Supabase prüfen.
