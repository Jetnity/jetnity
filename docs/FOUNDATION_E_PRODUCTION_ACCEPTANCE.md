# Foundation E – Production Acceptance

Stand: 23. August 2026  
Status: **abgeschlossen / auf `main` / Production-Migration verifiziert**

## Ergebnis

Foundation E – Traveller Context / Multi-Citizenship / Multi-Document ist vollständig abgeschlossen.

- PR #35 wurde nach ausdrücklicher Product-Owner-Freigabe gemergt.
- Squash-Merge-Commit auf `main`: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`.
- Finaler PR-Head: `52601ea0f770cf4265a5bdf5cb2356557ef7dcde`.
- Final geprüfter Runtime-/DB-Code-Head des Closure-Gates: `b1f9d6543aa153bacaa126f71d39c6a434dfbebb`.
- Unabhängiger Closure-Check: `docs/PR35_CHATGPT_INDEPENDENT_CLOSURE_CHECK.md` – PASS.
- GitHub CI und Vercel waren auf dem finalen PR-Stand grün; Vercel Production nach Merge ebenfalls erfolgreich.

## Production-Migration

Nach separater ausdrücklicher Product-Owner-Freigabe am 23.08.2026 wurden exakt die drei bereits auf Development geprüften Foundation-E-Migrationen über den bestehenden Supabase-Development-Branch nach Production gemergt:

- `20260822160000_traveller_context_intelligence`
- `20260822170000_traveller_context_fk_delete`
- `20260822180000_traveller_context_rereview`

Vor dem Merge wurde unmittelbar verifiziert:

- Development endet bei `20260822180000`.
- Production endet bei `20260822150000`.
- Der Abstand besteht aus genau diesen drei Foundation-E-Migrationen; keine unbekannte Migration / kein Drift dazwischen.

Supabase nahm den Merge erfolgreich an. Während des Apply-Zustands stand Production kurz auf `RUNNING_MIGRATIONS`; anschließend wieder auf `FUNCTIONS_DEPLOYED` / `ACTIVE_HEALTHY`.

Die Production-Migrationshistorie wurde danach erneut direkt geprüft und enthält alle drei Foundation-E-Versionen.

## Production-Struktur – direkt verifiziert

Auf Production bestätigt:

- `public.trip_traveller_citizenships` existiert.
- `public.trip_traveller_documents` existiert.
- `public.trip_readiness_items.traveller_id` existiert.
- RLS ist auf `trip_traveller_citizenships`, `trip_traveller_documents`, `trip_readiness_items` und `trip_travellers` aktiv.
- Für beide neuen Child-Tabellen existieren jeweils vier Owner-Policies (SELECT / INSERT / UPDATE / DELETE).
- Die Policies gelten für `authenticated` und prüfen `user_id = auth.uid()`.

Composite-FKs auf Production:

- Citizenship → Traveller: `ON DELETE CASCADE`.
- Document → Traveller: `ON DELETE CASCADE`.
- Document → Citizenship: `ON DELETE SET NULL (citizenship_id)` – nur die relationale Spalte wird genullt; NOT-NULL-Reisekontext bleibt erhalten.
- Readiness → Traveller: `ON DELETE CASCADE`.

## Funktionen / Trigger / Parallelität

Direkt auf Production bestätigt:

- `public.party_schreiben(jsonb)` ist `SECURITY INVOKER`.
- `party_schreiben` trägt `search_path=public, pg_temp`.
- `authenticated` darf `party_schreiben` ausführen.
- `anon` und `public` dürfen `party_schreiben` nicht ausführen.
- `trip_traveller_kinder_limit_pruefen()` ist `SECURITY INVOKER` und trägt `search_path=public, pg_temp`.
- Child-Limit-Funktion verwendet `FOR NO KEY UPDATE`.
- Limit-Trigger existieren auf Citizenship- und Document-Child-Tabellen.
- `updated_at`-Trigger existieren auf beiden Child-Tabellen.

Die bereits vor Production ausgeführten Development-Nachweise bleiben maßgeblich für die Verhaltensprüfung:

- `npm test`: 1353/1353
- DB-Security: 210/210
- DB-Parallelität: 7/7
- UI-Audit: 838/838, WebKit + Chromium, 8 Viewports
- Production-Build: 38/38 Seiten

## Backfill- / Truth-Verifikation auf Production

Nach der Migration wurde der vorhandene Production-Datenbestand read-only geprüft:

- vorhandene Legacy-Nationalität ohne erwartetes Citizenship-Child: **0**
- vorhandenes Legacy-Dokument ohne erwartetes Document-Child: **0**
- durch den alten Backfill fälschlich erzeugte Document↔Citizenship-Relationen: **0**

Damit ist der Expand/Contract-Backfill vollständig, ohne eine nicht belegte Beziehung zwischen Dokument und Staatsbürgerschaft zu erfinden.

## Produkt- und Sicherheitsgrenzen bleiben bestehen

Foundation E aktiviert weiterhin **nicht**:

- keinen echten Travel-Requirements-Provider
- kein Timatic / Timatic AutoCheck
- keine Provider-Secrets
- keine Passnummern
- keine Scans / MRZ / biometrischen Daten
- kein LLM als regulatorische Truth-Quelle
- keine erfundenen Visa-/Transit-/Dokumentvorteile

`unknown` bleibt `unknown`, solange keine belastbare Provider-Evidence existiert.

## Abschluss

Foundation E ist damit vollständig abgeschlossen:

- Code: ✅
- unabhängige Reviews: ✅
- Merge nach `main`: ✅
- Vercel Production: ✅
- Production-Migration: ✅
- RLS / FK / Function / Trigger / Backfill-Verifikation: ✅

Foundation E ist **nicht erneut zu bauen**. Spätere Funktionen müssen den kanonischen Traveller Context wiederverwenden und dürfen keine parallele Citizenship-/Document-Wahrheit einführen.

Der nächste Produktblock richtet sich ausschließlich nach dem aktuellsten `ROADMAP.md` / `docs/ACTIVE_WORK_STATUS.md`; echte Provider bleiben bis zur separaten Providerphase deaktiviert.
