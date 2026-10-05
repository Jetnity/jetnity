# Jetnity – AP-4 Restore-Provenienz-Entscheid

Stand: 27. August 2026  
Status: **TECHNICAL-LEAD SLICE DECISION**

## Entscheidung

AP-4 darf beim Wiederherstellen einer archivierten Reise keinen früheren Status erfinden.

Für neu durch AP-4 archivierte Reisen wird der unmittelbar vor dem Archivieren gelesene Status (`draft`, `planned` oder `booked`) als namespaced Begleitinformation in der bereits vorhandenen `trips.metadata` erhalten. Beim Restore darf ausschließlich dieser gültig belegte Status wieder gesetzt werden.

Für historische `archived`-Zeilen ohne gültige AP-4-Restore-Provenienz gilt fail-closed: kein Default auf `draft`, `planned` oder `booked`.

## Begründung

`trips.status` enthält bereits vier Werte und `archived` ersetzt beim Archivieren den vorherigen Zustand. Ohne Provenienz wäre ein Restore semantisch nicht verlustfrei. Eine neue DB-Spalte/Migration ist für diesen kleinen Slice nicht nötig; `trips.metadata` ist bestehende, auf Objekt/Größe begrenzte Begleitinformation, nach der nicht gefiltert oder sortiert wird.

## Grenzen

- keine Migration
- keine neue Statusart
- keine zweite Lifecycle-Wahrheit
- bestehende Metadata-Keys müssen erhalten bleiben
- RLS unverändert
- kein Service Role
- bei Stale/Concurrent Change fail-closed

Die vollständige Implementierungs-Spec steht in `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_TASK_2026-08-27.md`.
