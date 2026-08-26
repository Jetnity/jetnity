# QS-2 Admin AAL2 Closure – Status

Stand: 26. August 2026

Status: **APPLICATION + DEVELOPMENT DATA-PLANE IMPLEMENTIERT / STOPP für erneuten unabhängigen Technical-Lead-Review. Kein Ready. Kein Merge. Keine Production-Migration.**

Branch: `fix/qs2-admin-aal2-guard`
Baseline: `main @ 8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`
Finding: `P1-QS2-01`
Task: `docs/QS2_ADMIN_AAL2_CLOSURE_TASK.md`
ADR: ADR-0168

## Freigaben

Der Product Owner hat am 26. August 2026 zuerst die zentrale verpflichtende Admin-AAL2-Regel und nach dem unabhängigen Technical-Lead-Finding zusätzlich ausdrücklich **Admin RLS AAL2** freigegeben.

Die zweite Freigabe gilt nur für das enge Hardening der bestehenden administrativen DB-Fähigkeiten. Kein allgemeiner RLS-/Ownership-/Rollen-Umbau und keine Production-Migration vor erneutem Review.

## Application-Layer

Admin-Zugang = verifizierte Identität + ausreichende Rolle/Capability bzw. zulässiger Break-Glass-Pfad + `currentLevel === 'aal2'`.

Die Wahrheit sitzt zentral in `evaluateAdminAccess()`:

- Rolle + AAL1 → kein Admin, Step-up `/admin/mfa`
- Rolle + AAL2 → bestehende Rollen-/Capability-Semantik
- Break-Glass + AAL1 → kein Zugang
- Break-Glass + AAL2 → bestehende Break-Glass-Oberfläche, weiterhin keine zusätzlichen DB-Rechte
- unzureichende Rolle + AAL2 → forbidden
- Rollen-Lookup kaputt → lookup-failed
- AAL-Lookup kaputt → aal-lookup-failed / fail closed
- `requireAdminApi()` → maschinenlesbare 403/503, kein HTML-Redirect
- Return-Ziele nur interne Admin-Pfade
- kein TOTP-Faktor → kein Bypass, ehrlicher Weg nach `/account/security`

`/admin/mfa` liegt in `(public)` und nicht hinter `requireAdminPage`; Middleware verlangt weiterhin eine verifizierte Sitzung.

## Data-Plane-Hardening

Neu: `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`.

Die Migration führt `public.aktuelles_admin_aal2()` ein. Nur der signierte Supabase-JWT-Claim `aal='aal2'` ergibt true; fehlender oder anderer Wert ist fail closed.

Alle fünf bestehenden administrativen DB-Fähigkeiten behalten exakt ihre bisherigen Mindestrollen und verlangen zusätzlich aktuelles AAL2:

- `darf_betrieb_lesen()` → moderator + AAL2
- `darf_betrieb_eingreifen()` → operator + AAL2
- `darf_konten_verwalten()` → moderator + AAL2
- `darf_inhalte_moderieren()` → moderator + AAL2
- `darf_konfiguration_verwalten()` → admin + AAL2

Damit übernehmen bestehende RLS-Policies und administrative SECURITY-DEFINER-RPCs dieselbe AAL2-Grenze, ohne Policies, Ownership oder Rollenmodell neu zu erfinden.

Consumer-/Self-Service-Pfade bleiben unverändert. Beispiel: eigenes Profil bleibt über `user_id = auth.uid()` erreichbar; nur der administrative Fremdzugriff über `darf_konten_verwalten()` verlangt AAL2.

## Development-Supabase-Evidence

Entwicklungsprojekt: `yfvbxvijcorffwxbxahl` (`develop`). Production `qscbgcdmivbbnzrcyegn` wurde **nicht** migriert.

Migration `admin_aal2_data_plane` wurde erfolgreich nur auf `develop` angewandt.

Adversarial DB-Repro mit vorhandenem Development-Owner-Konto, jeweils innerhalb einer zurückgerollten Transaktion:

- AAL1: `aktuelles_admin_aal2=false`, `darf_betrieb_lesen=false`, direkte Probezeile in `payments` über RLS **0 sichtbar**.
- AAL2: `aktuelles_admin_aal2=true`, `darf_betrieb_lesen=true`, dieselbe Art Probezeile **1 sichtbar**.
- SECURITY-DEFINER-RPC `admin_security_overview()` mit AAL1: **0 Zeilen**.
- dieselbe RPC mit AAL2: **17 Zeilen**.

Die Probezeilen wurden durch `ROLLBACK` nicht persistiert.

Zusätzlicher Source-Contract-Test: `lib/auth/admin-aal-datenbank.test.ts` beweist, dass jede administrative Fähigkeit weiterhin Rolle **und** AAL2 verlangt und dass die AAL-Hilfsfunktion ausschließlich `auth.jwt()->>'aal'` verwendet.

## Security Review

Application:

- Magic-Link-Ziel bleibt `${site}/admin`; AAL1 wird zentral am Guard gestoppt.
- Consumer-OAuth/`next` kann `/admin` nicht als Consumer-Ziel setzen; spätere Navigation trifft den Guard.
- bestehende AAL1-Sitzung trifft Layout-/API-Guard.
- Break-Glass ohne AAL2 wird blockiert.
- API bleibt JSON-fail-closed.
- Return-Target-Allowlist verhindert Open Redirect.

Data Plane:

- Rolle allein reicht nicht mehr für administrative Fähigkeiten.
- AAL2 allein reicht ebenfalls nicht; Mindestrolle bleibt erhalten.
- SECURITY-DEFINER-Admin-RPCs hängen weiterhin an denselben Fähigkeiten und übernehmen dadurch AAL2.
- Consumer-Ownership-RLS wurde nicht verschärft.
- keine neuen Secrets, keine paid calls, keine Provider-/Payment-Produktlogik.

Residual: Noch kein Live-Browser-TOTP gegen ein echtes Admin-Konto in dieser Umgebung. Das ist kein Ersatz für die bereits serverseitig und auf Development-DB belegte AAL-Grenze, bleibt aber ein späterer End-to-End-Nachweis.

## Gates

Frühere Application-Gates auf Runtime-Head `d81affe7`:

- `npm test` — 2038/2038 pass
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run check:setup:ci` — pass
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` — pass
- `npm run auth:pruefen` — 55/55
- `npm run build` — pass

Nach RLS-Erweiterung muss der **neue Exact Head** erneut vollständig durch GitHub Actions und Vercel laufen. Bis diese Evidence grün ist, bleibt der Slice ausdrücklich nicht review-clean.

## Parallelität / Production

- `main` bleibt unverändert `8ab4e666` zum Zeitpunkt dieser Statusaktualisierung.
- Production-Supabase wurde nicht verändert.
- Development-Branch enthält weiterhin die bereits bekannten Development-only-Migrationen plus `admin_aal2_data_plane`.
- `docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## Nächster Schritt

**STOPP.** Exact-Head CI/Vercel abwarten, danach erneuter unabhängiger ChatGPT-/Technical-Lead-Security-Review einschließlich Diff, Development-RLS-Evidence und offener Review-Threads. Kein Ready, kein Merge, keine Production-Migration, kein Folgeslice.