# Jetnity – Admin AAL2 Production Alignment – Status

Stand: 27. August 2026  
Finding: `P1-AAL2-PROD-01`  
Cursor-Agent: `Jetnity quality security audit`  
Branch: `fix/admin-aal2-production-alignment-2026-08-27`  
Status: **CONTROL START / AUTORENARBEIT NOCH NICHT ABGESCHLOSSEN / KEIN PRODUCTION APPLY**

## Live-Baseline bei Start

- `main`: `84f54194cf7461c5f785f4da490dba060c93e999`
- Branch wurde exakt von diesem `main` erstellt
- Production Supabase: `qscbgcdmivbbnzrcyegn`
- Development Supabase: `yfvbxvijcorffwxbxahl`
- Production Migration-Head: `20260827010000_reise_anlegen_zero_stage_fail_closed`
- Development enthält zusätzlich `20260826052735_admin_aal2_data_plane`
- keine offene konkurrierende AAL2-Implementierungs-PR festgestellt

## Bestätigte Live-Sicherheitslücke

Production besitzt aktuell **keine** `public.aktuelles_admin_aal2()`-Funktion. Die fünf administrativen `darf_*()`-Capabilities prüfen nur Mindestrollen.

Live inventarisiert wurden:

- 14 direkte Admin-RLS-Policies, die über `darf_betrieb_lesen()`, `darf_betrieb_eingreifen()` oder `darf_konten_verwalten()` geschützt werden;
- vier administrative `SECURITY DEFINER`-RPCs für `authenticated`, die intern `darf_betrieb_lesen()` prüfen:
  - `admin_payments_summary_30d()`
  - `admin_reisen_kennzahlen()`
  - `admin_reisen_zeitreihe(integer)`
  - `admin_security_overview()`

Damit bleibt ein privilegierter AAL1-Direktzugriff auf die Datenebene technisch möglich, obwohl der Application Guard AAL2 verlangt.

## Development-Evidence

Development besitzt live die gewünschte Semantik:

- `aktuelles_admin_aal2()` liest ausschließlich `auth.jwt() ->> 'aal'`
- fehlender/anderer Claim => false
- alle fünf `darf_*()` kombinieren unveränderte Mindestrolle **AND** AAL2
- Helper und Capabilities sind `SECURITY INVOKER`
- `search_path = pg_catalog`
- EXECUTE: `authenticated`, `service_role`
- kein EXECUTE für `public`, `anon`

Diese Semantik entspricht der historischen Repo-Migration `20260826090000_admin_aal2_data_plane.sql`.

## Forward-only Entscheidung

Die historische Development-Version `20260826052735` und die Repo-Datei `20260826090000` werden nicht umbenannt, gelöscht oder rückwirkend repariert.

Der neue Implementierungsslice soll eine neue Alignment-Migration **nach** dem aktuellen Production-Head `20260827010000` liefern. Bevorzugt ist, sofern bei Autor-Start weiterhin kollisionsfrei:

`supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`

## Aktueller Scope

Jetzt erlaubt:

- neue Alignment-Migration vorbereiten
- Contract-/Regression-Tests hinzufügen
- alle Admin-RLS-/RPC-Consumer dokumentieren
- Rollout-/Verification-/Recovery-Playbook erstellen
- CI/Vercel auf dem exakten PR-Head
- Development/read-only Evidence erneuern

Nicht erlaubt:

- Production-Migration
- Production-RLS-/Capability-Write
- Rollen-/Ownership-/Auth-Umbau
- TW-7 oder andere Feature-Arbeit
- Provider/Payment/Secrets/Kosten

## Übergabe

Der Autoren-Slice stoppt als Draft. Der unabhängige Technical Lead prüft danach exakten Head, Diff, Tests, CI, Vercel, Migration-Semantik, Supabase-Evidence und Review-Threads. Auch ein erfolgreicher Merge autorisiert **nicht** den Production-Apply; dafür bleibt eine separate ausdrückliche Product-Owner-Freigabe erforderlich.
