# Jetnity – P1: versionstreuer Admin AAL2 Production Apply Gate

Stand: 27. August 2026  
Issue: #101  
Finding: `P1-AAL2-PROD-01`  
Cursor-Agent: `Jetnity quality security audit`  
Status: **RUNNER VORBEREITET / KEIN PRODUCTION APPLY AUSGEFÜHRT / KEIN READY / KEIN MERGE**

Dieser Task gilt nur für den engen fail-closed Einmal-Runner der bereits
reviewten Datei `supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`.

Er ändert die Migration nicht. Er öffnet `db:anwenden` nicht. Er schreibt
Production nicht.

---

## 1. Warum dieser Runner

Der Product Owner hat den Production-Apply am 27. August 2026 erlaubt, **wenn
der Technical Lead ihn für sinnvoll hält**. Der Technical Lead bewertet die
Härtung als sinnvoll. Die Ausführung war ohne versionstreuen Runner gestoppt,
weil Supabase MCP `apply_migration` einen eigenen Timestamp erzeugt und die
Repository-Version `20260827170000` nicht übernehmen kann.

Jetnity besitzt bereits das Muster in `scripts/db/anwenden.ts` und
`scripts/db/gate-b-tw6-bundle.ts`: Migration-SQL + exakter
`supabase_migrations.schema_migrations`-Eintrag in einer Transaktion. Der
generische Production-Pfad von `db:anwenden` bleibt auf
`PRODUCTION_GRENZE_VERSION = 20260820130000`.

---

## 2. Vertrag

| Feld | Wert |
| --- | --- |
| Datei | `20260827170000_admin_aal2_data_plane_alignment.sql` |
| Version | `20260827170000` |
| Name | `admin_aal2_data_plane_alignment` |
| Git-Blob | `4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375` |
| SHA-256 | `ac4faa87bf994a1fcbad2212384cb2308695820b63a57dc41ee9a763515ad934` |
| Production | `qscbgcdmivbbnzrcyegn` |
| Erwarteter Head vor Apply | `20260827010000_reise_anlegen_zero_stage_fail_closed` |
| Erwarteter Count `20260827170000` vor Apply | 0 |
| Erwartete Funktion vor Apply | `public.aktuelles_admin_aal2()` fehlt |

Default = lokale Probe, kein Write.

Live-Preflight:

```bash
npm run db:aal2-prod-apply -- --produktion --projekt-ref qscbgcdmivbbnzrcyegn
```

Write, nur durch den Technical Lead nach unabhängigem Exact-Head-Review:

```bash
npm run db:aal2-prod-apply -- --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn
```

`--entwicklung` ist abgelehnt. Ein anderer `--projekt-ref` ist abgelehnt.
`db:anwenden --produktion` darf diese Datei nicht nachziehen.

---

## 3. Non-Scope

- keine Änderung der Alignment-SQL
- keine historische `20260826090000`-Manipulation
- kein Development-History-Rewrite
- kein Rollen-/Auth-/Session-/MFA-/RLS-/Ownership-Umbau
- keine weiteren Production-Migrationen
- kein Provider/Payment/TW-7/AP-4/AP-7/TW-8/Homepage
- keine Lockerung der Phase-3.1-Grenze
- kein Production-Apply durch diesen Implementierungsauftrag
- keine Änderung zentraler TW-7-Continuity-Dateien
