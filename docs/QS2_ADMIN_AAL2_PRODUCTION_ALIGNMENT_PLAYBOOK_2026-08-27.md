# Jetnity – Admin AAL2 Production Alignment – Playbook

Stand: 27. August 2026  
Finding: `P1-AAL2-PROD-01`  
Migration: `supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`  
Status: **ALIGNMENT AUF `main` / EINMAL-RUNNER VORBEREITET – KEIN PRODUCTION APPLY AUSGEFÜHRT**

Dieses Playbook gilt nur für die reviewte Alignment-Migration. Es ist keine
Production-Freigabe. Der Apply bleibt ein ausdrückliches Product-Owner-Gate.

---

## 1. Vertrag

Administrative DB-Fähigkeit nach Apply:

> unveränderte Mindestrolle **UND** signierter JWT-Claim `auth.jwt() ->> 'aal' = 'aal2'`.

| Fähigkeit | Mindestrolle | Zusätzlich |
| --- | --- | --- |
| `darf_betrieb_lesen()` | `moderator` | AAL2 |
| `darf_betrieb_eingreifen()` | `operator` | AAL2 |
| `darf_konten_verwalten()` | `moderator` | AAL2 |
| `darf_inhalte_moderieren()` | `moderator` | AAL2 |
| `darf_konfiguration_verwalten()` | `admin` | AAL2 |

Fail-closed:

- `aal='aal2'` → Assurance true
- `aal='aal1'`, fehlend, leer, malformed → false
- Faktor-Existenz, `nextLevel`, User-Metadata, Break-Glass ersetzen AAL2 nicht
- Break-Glass bleibt UI-Grant ohne zusätzliche DB-Rechte

Helper und Capabilities: `SECURITY INVOKER`, `search_path = pg_catalog`.
EXECUTE: `authenticated`, `service_role`. Kein EXECUTE für `public`/`anon`.

---

## 2. Inventar der direkten Consumer

Diese Migration ändert keine Policies und keine RPC-Körper. Sie ändert nur die
fünf Capability-Funktionen plus `aktuelles_admin_aal2()`. Dadurch erben alle
Consumer den AAL2-Zweig automatisch.

### 14 direkte Admin-RLS-Policies

| Policy | Tabelle | Capability | Self-Service bleibt |
| --- | --- | --- | --- |
| `profiles_lesen` | `profiles` (ex `creator_profiles`; umbenannt in `20260817120300`) | `darf_konten_verwalten` | ja, `user_id = auth.uid()` |
| `profiles_aendern` | `profiles` | `darf_konten_verwalten` | ja |
| `profiles_loeschen` | `profiles` | `darf_konten_verwalten` | ja |
| `security_events_lesen` | `security_events` | `darf_betrieb_lesen` | nein |
| `payments_lesen` | `payments` | `darf_betrieb_lesen` | nein |
| `refunds_lesen` | `refunds` | `darf_betrieb_lesen` | nein |
| `stripe_webhooks_lesen` | `stripe_webhooks` | `darf_betrieb_lesen` | nein |
| `blocked_ips_lesen` | `blocked_ips` | `darf_betrieb_lesen` | nein |
| `blocked_ips_eingriff_anlegen` | `blocked_ips` | `darf_betrieb_eingreifen` | nein |
| `blocked_ips_eingriff_aendern` | `blocked_ips` | `darf_betrieb_eingreifen` | nein |
| `blocked_ips_eingriff_loeschen` | `blocked_ips` | `darf_betrieb_eingreifen` | nein |
| `refunds_eingriff_anlegen` | `refunds` | `darf_betrieb_eingreifen` | nein |
| `payments_eingriff_aendern` | `payments` | `darf_betrieb_eingreifen` | nein |
| `model_usage_lesen` | `model_usage` | `darf_betrieb_lesen` | nein |

### Vier administrative SECURITY-DEFINER-RPCs

Alle für `authenticated` ausführbar, intern `darf_betrieb_lesen()`:

- `admin_payments_summary_30d()`
- `admin_reisen_kennzahlen()`
- `admin_reisen_zeitreihe(integer)`
- `admin_security_overview()`

Ohne Capability liefern sie keine privilegierten Zeilen.

### Legacy-Capabilities ohne aktuelle Tabelle

`darf_inhalte_moderieren()` und `darf_konfiguration_verwalten()` bleiben
bestehen und erhalten ebenfalls AAL2. Ihre früheren Tabellen wurden entfernt;
`npm run db:sicherheit` prüft die Funktionen direkt.

Consumer-Trip-/Traveller-RLS (`trips`, `trip_*`) hängt nicht an `darf_*()`.

---

## 3. History / Forward-only

| Umgebung | AAL2-Data-Plane-Version |
| --- | --- |
| Repository historisch | `20260826090000_admin_aal2_data_plane.sql` – **nicht ändern** |
| Development live | `20260826052735_admin_aal2_data_plane` |
| Production live | **keine** |
| Neue Alignment-Datei | `20260827170000_admin_aal2_data_plane_alignment.sql` |

Production-Head vor diesem Slice: `20260827010000_reise_anlegen_zero_stage_fail_closed`.

Die Alignment-Migration ist `CREATE OR REPLACE` und damit auf Development
semantisch idempotent. Sie fälscht keine Historical Versions.

---

## 4. Rollout – nur über den Einmal-Runner

PR #98 ist gemergt. Die Alignment-Datei liegt auf `main`. Der Product Owner hat
den Production-Apply am 27. August 2026 erlaubt, wenn der Technical Lead ihn
für sinnvoll hält. **Dieser Slice führt den Apply nicht aus.**

Nicht zulässig:

- Supabase MCP `apply_migration` (erzeugt einen eigenen Timestamp)
- `db:anwenden --produktion` (Phase-3.1-Grenze bleibt `20260820130000`)
- Dateiglob oder Folgemigration
- Development-Write über diesen Runner

Datei-Identität, die der Runner hart prüft:

| Feld | Wert |
| --- | --- |
| Version / Name | `20260827170000` / `admin_aal2_data_plane_alignment` |
| Git-Blob | `4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375` |
| SHA-256 | `ac4faa87bf994a1fcbad2212384cb2308695820b63a57dc41ee9a763515ad934` |
| Production | `qscbgcdmivbbnzrcyegn` |
| Head vor Apply | `20260827010000_reise_anlegen_zero_stage_fail_closed` |

Lokale Probe, kein Write:

```bash
npm run db:aal2-prod-apply
```

Live-Preflight, kein Write:

```bash
npm run db:aal2-prod-apply -- --produktion --projekt-ref qscbgcdmivbbnzrcyegn
```

Write, nur durch den Technical Lead nach unabhängigem Exact-Head-Review und
unverändert passendem Live-Preflight:

```bash
npm run db:aal2-prod-apply -- --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn
```

Der Runner:

1. prüft Blob/SHA-256/Version/Name;
2. bestätigt das Production-Ziel über `zielFuerAuftrag` / `produktionsZiel`;
3. bricht ab, wenn der Head nicht exakt `20260827010000` ist, `20260827170000`
   schon existiert oder `aktuelles_admin_aal2()` unerwartet vorhanden ist;
4. nimmt einen Preflight-Snapshot der aktuellen `profiles_*`- und Trip/Traveller-RLS-Definitionen;
5. wendet in **einer** Transaktion Datei-SQL → exakten History-Eintrag → harte Contract-Verification an und committet erst danach;
6. jeder Verify-Fehler rollt Migration und History zurück;
7. prüft nach COMMIT read-only denselben Vertrag, den RLS-Snapshot und `historyStimmtMitDatei()`;
8. erhebt Advisors read-only und zieht keine weitere Migration nach.

Rollback-sichere Development-Evidence, kein persistenter Write:

```bash
npm run db:aal2-prod-apply -- --entwicklung-probe
```

Development darf die Datei später als History-Alignment erhalten, ändert die
bereits korrekte Semantik aber nicht. Dieser Runner committet Development nicht.

---

## 5. Verification nach einem späteren Apply

Read-only, fail-closed:

1. `public.aktuelles_admin_aal2()` existiert.
2. Funktionskörper liest nur `auth.jwt() ->> 'aal'` und `coalesce(..., false)`.
3. Alle fünf `darf_*()` enthalten `hat_rolle_mindestens('<unverändert>') AND aktuelles_admin_aal2()`.
4. `SECURITY INVOKER` + `search_path = pg_catalog`.
5. EXECUTE nur `authenticated`/`service_role`.
6. AAL1 + privilegierte Rolle: Capability false; Admin-RPCs ohne privilegierte Zeilen.
7. Fehlender AAL-Claim: false.
8. AAL2 + unzureichende Rolle: false.
9. AAL2 + ausreichende Rolle: bisherige Capability true.
10. Eigenes `profiles`-Lesen über `user_id = auth.uid()` bleibt ohne Admin-AAL möglich.
11. Trip-Consumer-RLS unverändert.
12. Supabase Security Advisor erneut lesen; neue Advisor-Treffer nicht pauschal als Leak werten.

---

## 6. Rollback / Recovery

Die Migration ist `CREATE OR REPLACE` ohne Tabellen-DDL. Ein naives
„History löschen“ ist verboten.

Falls nach einem späteren Apply ein akuter Produktionsfehler entsteht:

1. **Nicht** die historische `20260826090000` nachträglich auf Production
   anwenden oder umbenennen.
2. Eine **neue** forward-only Recovery-Migration schreiben, die den zuletzt
   ausdrücklich genehmigten Capability-Vertrag setzt.
3. Recovery ebenfalls nur nach Technical-Lead-Review und ausdrücklicher
   Product-Owner-Freigabe.
4. Ein Zurücksetzen auf „nur Rolle, ohne AAL2“ wäre ein erneutes Öffnen von
   P1-AAL2-PROD-01 und braucht eine neue ausdrückliche Product-Owner-Entscheidung.

Ohne Apply gibt es nichts zurückzunehmen. Dieser Slice ändert Production nicht.

---

## 7. Non-Scope

Nicht Teil dieses Playbooks:

- Production-Apply durch den Implementierungsauftrag des Runners
- Rollenmodell, Auth/Session/MFA-Umbau, neue Capabilities
- Consumer-Ownership
- Service-Role in Consumer-Pfaden
- TW-7/TW-8, AP-4/AP-7, S5-B, Provider/Payment/Secrets
- generisches Öffnen von `db:anwenden`
