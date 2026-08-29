# ADR-0198 – Provider S5-B persistiert Option C mit privilegierter Write-Authority

Stand: 29. August 2026  
Status: **IMPLEMENTIERT IM REPOSITORY / DRAFT-PR #182 / KEINE PRODUCTION-ANWENDUNG / KEIN TW-8**  
Volltext-Kurzform auch in [DECISIONS.md](../DECISIONS.md) ADR-0198.

S5-A bleibt unverändert ADR-0168. ADR-0197 bleibt die Zielarchitektur. Dieser ADR übersetzt sie in Schema + RLS + Write-Authority.

---

## Entscheidung

1. Commercial Provenance liegt in `public.trip_item_commercial_provenance`, 1:1 auf `trip_item_id`, `ON DELETE CASCADE`.
2. Persistiert wird nur S5-A-Evidence. `source_kind='persisted_snapshot'`, `persistenz='snapshot'`. Keine Bewertungs-Spalten.
3. `authenticated` darf owner-only SELECT. `anon` hat keinen Zugriff. Direct INSERT/UPDATE/DELETE sind für `authenticated`/`anon`/`service_role` entzogen.
4. Der einzige Write ist `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)`: SECURITY DEFINER, `search_path=''`, nicht in `[api].schemas`, EXECUTE nur für die NOLOGIN-Rolle `jetnity_commercial_writer`.
5. Client-`sourceKind`/`persistenz`/`akteur` werden nicht übernommen. User-Intake/Manual/Assistant werden abgelehnt. Der Pfad mintet nach struktureller S5-A-Prüfung.
6. Legacy-Flachfelder sind keine zweite Provider-Hard-Truth. Derselbe trusted Pfad schreibt eine Display-Projektion (`price_*`, `provider`, `external_ref`). `booking_url` wird nicht erfunden. Ohne Provenance-Zeile bleibt Legacy `unknown`.
7. Die Flight-Guard-Trigger **behalten** den Namen `trip_items_flug_handelsfelder_schuetzen` und erweitern die Matrix: Stay/Activity/Note leeren die ganze Legacy-Menge; Transfer/Rental behalten User-Intake-Preis und leeren Provider/Ref/URL.
8. `reise_anlegen` übernimmt untrusted JSON nicht mehr als Provider-Hard-Truth. Guest→Account mintet keine Provenance.
9. Keine History, kein Backfill, kein Service Role im Produktpfad, keine Provider-Aktivierung, kein TW-8.

## Kontext

PO-Gate `S5B-G0-PO-MIG-01` wurde am 29. August 2026 freigegeben. Production-Apply bleibt TL-kontrolliert nach unabhängigem Exact-Head-PASS. Cursor wendet Production nicht an.

## Alternativen

1. *Additive Spalten auf `trip_items`.* Würde den Owner-Write-Vertrag wiederholen.
2. *EXECUTE an `authenticated` plus App-Validierung.* REST/RPC-Bypass durch kompromittierten Client.
3. *Service Role als Write-Pfad.* Verboten im Produktpfad.
4. *Nur Trigger ohne eigene Relation.* Kein persistierter S5-A-Vertrag.

## Konsequenzen

- Repository enthält Schema + Tests. Production ist unverändert, bis der Technical Lead unter der bestehenden PO-Freigabe anwendet.
- TW-8 bleibt geschlossen, bis mindestens ein serverseitig nachgewiesener realer Snapshot existiert.
- Self-Review ist kein PASS. Cursor setzt kein Ready und merget nicht.
