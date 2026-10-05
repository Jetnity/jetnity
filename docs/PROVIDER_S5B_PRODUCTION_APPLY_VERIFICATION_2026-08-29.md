# Provider S5-B – Production Apply Verification

Stand: 29. August 2026  
Status: **INTEGRIERT / PRODUCTION-MIGRATION ANGEWENDET / POST-APPLY VERIFIED / PROVIDER-RUNTIME WEITERHIN GESCHLOSSEN**

> Live-Evidence gewinnt immer. Dieses Dokument ist Continuity-Evidence des verifizierten Zustands am 29. August 2026 und ersetzt keine neue Live-Prüfung.

## 1. Integration

- Ursprünglicher Authoring-PR: Draft-PR #182.
- Final unabhängig geprüfter Implementation-Head: `ffe1cbc1aea49491576c4eb32ab8f306500c95e3`.
- Die drei TL-Funde `S5B-TL-182-01`, `S5B-TL-182-02`, `S5B-TL-182-03` wurden vor PASS geschlossen.
- Draft→Ready scheiterte am bekannten GitHub-Connector-GraphQL-Defekt `Repository.fullDatabaseId`; kein Codeproblem.
- Non-Draft-Recovery-Carrier: PR #183, exakt derselbe geprüfte Head, keine Codeänderung.
- Merge auf `main`: `3b684f64f28bc4a2732e34cd642837aab5ea70ec`.
- GitHub Actions main-push CI #1177 / Run `33257663936`: **SUCCESS** auf exakt diesem Merge-Commit.
- Vercel Production `dpl_HCcMosdez6t1kruUetdLuNmv7P3Z`: **READY** auf exakt `3b684f64...`.
- Im geprüften Production-Zeitfenster nach Integration keine Vercel `error`/`fatal` Runtime-Logs beobachtet.

## 2. Supabase Preview-Evidence vor Production

Vor Production wurde eine echte Supabase-Development-Branch auf dem aktuellen Postgres-17-Stack erstellt und die S5-B-Struktur dort ausgeführt.

Verifiziert wurden insbesondere:

- Migration/DDL ist auf Supabase/Postgres 17 ausführbar.
- `public.trip_item_commercial_provenance` existiert mit RLS.
- authenticated: Owner-SELECT erlaubt; INSERT/UPDATE/DELETE direkt verweigert.
- anon: kein SELECT.
- Cross-Owner-SELECT liefert keine fremden Provenance-Zeilen.
- `authenticated` und `service_role` haben kein EXECUTE auf `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)`.
- Positiver kontrollierter Persistenz-Write funktioniert nur nach expliziter test-only Writer-Authority und mit gültigem `auth.uid()`.
- Stay-Direkt-DML mintet keine Price-/Provider-Hard-Truth.
- Transfer-Direkt-DML behält nur erlaubten User-Intake-Preis/-Währung und nullt Provider/Ref/Booking-URL.
- Supabase Security Advisor meldete keine neue extern ausführbare S5-B SECURITY-DEFINER-Funktion.

Die temporäre kostenpflichtige Validation-Branch wurde nach Abschluss gelöscht. Sie wurde ausdrücklich **nicht** nach Production gemergt.

## 3. Production Apply

Das bereits durch Product Owner freigegebene Gate `S5B-G0-PO-MIG-01` deckte die S5-B-Persistenzgrundlage ab. Die Production-Anwendung erfolgte danach TL-kontrolliert.

Production-Supabase:

- Projekt: `qscbgcdmivbbnzrcyegn`.
- Vorheriger Migrations-Head: `20260828015304_traveller_write_contract_integrity`.
- Neuer registrierter Repo-Migrationsstand: `20260829140000_trip_item_commercial_provenance`.
- Kein Provider wurde aktiviert.
- Keine Provider-Secrets, Verträge oder Paid Calls wurden hinzugefügt.
- Kein Runtime-Login wurde der Commercial-Writer-Kette zugeordnet.

## 4. Production Security / Ownership Verification

Post-Apply wurde auf Production direkt verifiziert:

- `public.trip_item_commercial_provenance`: vorhanden.
- RLS: **enabled**.
- Owner-Read-Policy `trip_item_commercial_provenance_lesen`: vorhanden.
- authenticated SELECT: **ja**.
- authenticated INSERT/UPDATE/DELETE: **nein**.
- anon SELECT: **nein**.
- authenticated EXECUTE auf internem Writer: **nein**.
- service_role EXECUTE auf internem Writer: **nein**.
- `jetnity_commercial_writer`: einziger vorgesehener EXECUTE-Träger.
- `jetnity_commercial_runtime` ist Mitglied von Writer, bleibt aber NOLOGIN/NOINHERIT und ist nicht an authenticated/service_role gebunden.
- `jetnity_internal.commercial_write_runtime_gate.production_write_path_allocated = false`.
- `public.reise_anlegen(jsonb)` ist SECURITY INVOKER.
- Guard-Trigger `trip_items_flug_handelsfelder_schuetzen` ist aktiv.

Damit ist die frühere S5-B-Trust-Lücke geschlossen, bei der untrusted Client-Pfade für Stay/Activity Provider-/Preis-Hard-Truth in Legacy-Felder minten konnten. Transfer/Rental-Car dürfen weiterhin den definierten User-Intake-Preis/-Currency-Vertrag nutzen, aber keine Provider-/Reference-/Booking-URL-Hard-Truth minten.

## 5. Wichtige Source-Normalization-Notiz

Die kanonische Repository-Migration `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql` enthält zusätzlich eine explizite vollständige Neudefinition des `reise_anlegen`-Funktionskörpers.

Production bewahrt den vorher bereits live vorhandenen `reise_anlegen`-Funktionskörper als SECURITY INVOKER und erzwingt die S5-B-Handelsfeldgrenze zusätzlich auf Datenbankebene über den neuen Guard-Trigger. Der sicherheitsrelevante Effekt wurde verifiziert. **Byte-identische Function-Source-Equivalence zwischen Repository-Migrationsdatei und Production wird deshalb nicht behauptet.**

Das ist Continuity-/Schema-Source-Normalization-Debt, keine festgestellte offene Commercial-Truth-Bypass-Lücke. Eine spätere Normalisierung muss separat reviewt werden und darf nicht still als bereits erledigt gelten.

## 6. Security Advisor Residuals

Der Production-Security-Advisor zeigt für die neue Provenance-Tabelle die erwartete authenticated-GraphQL-Sichtbarkeit aufgrund des Owner-SELECT-Grants. Der tatsächliche Zugriff bleibt durch RLS auf den Owner begrenzt.

Weiterhin existieren ältere, nicht durch S5-B eingeführte Advisor-Warnungen, unter anderem zu bestehenden authenticated-exponierten Tabellen und bestehenden Admin-SECURITY-DEFINER-RPCs. Diese gehören in einen separaten Security-Audit-Slice und sind kein Grund, den abgeschlossenen S5-B-Persistenz-Slice falsch als offen zu führen.

## 7. Harte Grenze / nächster echte Gate

S5-B **Persistence Foundation** ist integriert und Production-verifiziert.

Noch **nicht** freigegeben oder aktiviert:

- reales Provider-API / Provider-Vertrag,
- Provider-Secrets,
- Paid Calls,
- Zuweisung eines echten serverseitigen Runtime-Principals,
- Umschalten von `production_write_path_allocated` auf true,
- realer Provider Commercial-Provenance-Snapshot,
- TW-8 / TW-9.

Der nächste kritische Provider-Schritt ist deshalb ein eigener grober Produkt-/Security-/Commercial-Entscheidungspunkt: Auswahl und gestufte Aktivierung des ersten realen Provider-Pfads. Bis zu dieser Entscheidung bleibt TW-8 geschlossen.

## 8. Zuerst lesen beim nächsten Chat

1. `JETNITY_START_HERE.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. dieses Dokument
4. `docs/ADR_0197_PROVIDER_S5B_OPTION_C_TARGET_ARCHITECTURE.md`
5. `docs/ADR_0198_PROVIDER_S5B_COMMERCIAL_PROVENANCE_PERSISTENCE.md`
6. `docs/PROVIDER_S5B_PERSISTENCE_THREAT_MODEL_2026-08-29.md`
7. `docs/PROVIDER_S5B_PERSISTENCE_IMPLEMENTATION_TASK_2026-08-29.md`
8. PR #182 und Recovery-PR #183 als Review-/Integration-Evidence.
