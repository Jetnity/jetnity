# Jetnity – Admin AAL2 Production Alignment – Playbook

Stand: 27. August 2026  
Finding: `P1-AAL2-PROD-01`  
Migration: `supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`  
Status: **VORBEREITET – KEIN PRODUCTION APPLY AUTORISIERT**

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
| `creator_profiles_lesen` | `profiles` (ex `creator_profiles`) | `darf_konten_verwalten` | ja, `user_id = auth.uid()` |
| `creator_profiles_aendern` | `profiles` | `darf_konten_verwalten` | ja |
| `creator_profiles_loeschen` | `profiles` | `darf_konten_verwalten` | ja |
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

## 4. Rollout – nur nach Product-Owner-Freigabe

Voraussetzungen, die **nicht** durch dieses Playbook erfüllt werden:

1. Draft-PR #98 ist unabhängig vom Technical Lead PASS und gemergt.
2. Exact-Head CI und Vercel des gemergten `main` sind grün.
3. Product Owner gibt **ausdrücklich** den Production-Apply **dieser einen**
   Datei frei. Keine Sammelfreigabe, keine Folgemigration.

Dann, und nur dann, auf Production `qscbgcdmivbbnzrcyegn`:

1. Production-Migration-Head erneut live lesen. Erwartet vor Apply:
   `20260827010000_reise_anlegen_zero_stage_fail_closed`. Bei Drift: STOPP.
2. Nur `20260827170000_admin_aal2_data_plane_alignment.sql` anwenden.
3. Keine weitere Migration automatisch nachziehen.
4. Sofort die Verification in Abschnitt 5 ausführen.
5. Continuity/Status auf den tatsächlich angewandten Head aktualisieren.

Development darf die Datei als History-Alignment erhalten, ändert die bereits
korrekte Semantik aber nicht.

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

- Production-Apply jetzt
- Rollenmodell, Auth/Session/MFA-Umbau, neue Capabilities
- Consumer-Ownership
- Service-Role in Consumer-Pfaden
- TW-7/TW-8, AP-4/AP-7, S5-B, Provider/Payment/Secrets
