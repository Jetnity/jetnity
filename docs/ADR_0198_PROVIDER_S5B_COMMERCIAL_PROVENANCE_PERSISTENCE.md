# ADR-0198 – Provider S5-B persistiert Option C mit privilegierter Write-Authority

Stand: 29. August 2026  
Status: **PERSISTENZ-FOUNDATION IMPLEMENTIERT UND PRODUCTION-VERIFIZIERT (`20260829140000`) / RUNTIME-WRITE-PFAD GESCHLOSSEN / KEIN REALER SNAPSHOT / KEIN TW-8**  
Volltext-Kurzform auch in [DECISIONS.md](../DECISIONS.md) ADR-0198. Current-Apply-Evidence: `docs/PROVIDER_S5B_PRODUCTION_APPLY_VERIFICATION_2026-08-29.md`.

S5-A bleibt unverändert ADR-0168. ADR-0197 bleibt die Zielarchitektur. Dieser ADR übersetzt sie in Schema + RLS + Write-Authority.

---

## Entscheidung

1. Commercial Provenance liegt in `public.trip_item_commercial_provenance`, 1:1 auf `trip_item_id`, `ON DELETE CASCADE`.
2. Persistiert wird nur S5-A-Evidence. `source_kind='persisted_snapshot'`, `persistenz='snapshot'`. Keine Bewertungs-Spalten.
3. `authenticated` darf owner-only SELECT. `anon` hat keinen Zugriff. Direct INSERT/UPDATE/DELETE sind für `authenticated`/`anon`/`service_role` entzogen.
4. Der einzige Write ist `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)`: SECURITY DEFINER, `search_path=''`, nicht in `[api].schemas`, EXECUTE nur für die NOLOGIN-Rolle `jetnity_commercial_writer`. `anon`/`authenticated`/`service_role` erhalten kein EXECUTE.
5. Die SQL-Funktion akzeptiert **nur** die serverseitig gebaute Nutzlast `vertrag=jetnity.commercial_persistence.v1` / `mint=s5a_validated_snapshot` aus `commercialPersistenzNutzlastBauen()`. Rohe Client-Quotes (`sourceKind`, `akteur`, `providerId`) werden abgelehnt und nicht nach `persisted_snapshot` umgedeutet.
6. `auth.uid()` ist Pflicht und muss dem Item-Owner entsprechen. NULL-Principal ist fail-closed. `jetnity_commercial_runtime` (NOLOGIN, NOINHERIT) ist der vorgesehene spätere Invoker und darf SET ROLE auf den Writer, erbt aber keine Privilegien. `production_write_path_allocated` bleibt `false`: die Funktion ist **kein** ausführbarer Production-Write-Pfad, bis ein späteres Gate eine Login-Rolle zuweist.
7. Legacy-Flachfelder sind keine zweite Provider-Hard-Truth. Derselbe trusted Pfad schreibt eine Display-Projektion (`price_*`, `provider`, `external_ref`). `booking_url` wird nicht erfunden. Ohne Provenance-Zeile bleibt Legacy `unknown`.
8. Die Flight-Guard-Trigger **behalten** den Namen `trip_items_flug_handelsfelder_schuetzen` und erweitern die Matrix: Stay/Activity/Note leeren die ganze Legacy-Menge; Transfer/Rental behalten User-Intake-Preis und leeren Provider/Ref/URL.
9. `reise_anlegen` übernimmt untrusted JSON nicht mehr als Provider-Hard-Truth. Guest→Account mintet keine Provenance.
10. Keine History, kein Backfill, kein Service Role im Produktpfad, keine Provider-Aktivierung, kein TW-8.

## Kontext

PO-Gate `S5B-G0-PO-MIG-01` wurde am 29. August 2026 freigegeben. Die Persistenz-Foundation ist danach TL-kontrolliert auf Production angewendet und verifiziert. **Offen bleibt** die Runtime-Principal-/Write-Pfad-Allokation (`production_write_path_allocated=false`), nicht ein erneutes Foundation-Apply. Cursor allokiert den Write-Pfad nicht und mintet nichts.

## Alternativen

1. *Additive Spalten auf `trip_items`.* Würde den Owner-Write-Vertrag wiederholen.
2. *EXECUTE an `authenticated` plus App-Validierung.* REST/RPC-Bypass durch kompromittierten Client.
3. *Service Role als Write-Pfad.* Verboten im Produktpfad.
4. *Nur Trigger ohne eigene Relation.* Kein persistierter S5-A-Vertrag.

## Konsequenzen

- Persistenz-Foundation existiert im Repository und ist Production-verifiziert. Runtime-Write-Pfad bleibt geschlossen, bis ein späteres Gate eine Login-Rolle zuweist.
- TW-8 bleibt geschlossen, bis mindestens ein serverseitig nachgewiesener realer Snapshot existiert.
- Self-Review ist kein PASS. Cursor setzt kein Ready und merget nicht.

## Nachtrag 29. August 2026 – TL-182-01/02/03

Technical-Lead CHANGES REQUIRED auf `8e597487` geschlossen im Repository:

1. Invocation-Vertrag + fail-closed NULL-Principal + geschlossenes Production-Write-Gate.
2. Kanonische S5-A-Nutzlast statt roher Client-JSON.
3. Isolierte lokale DB-Evidence über `npm run db:s5b-persistenz-lokal`. Production unverändert.
