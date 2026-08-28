# Jetnity – AP-7-S1 Dual-Authority Domain Contract Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 12`**  
Typ: adversarial Self-Review nach CHANGES REQUIRED `5455836506`, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Review-Fix #3 (Continuity-only) gegen Exact Head `e9f96e792326e2ccf27bfd8041e6ae2ebcff1a45` (Kommentar `5455836506`). Dieselbe Session / Generation 12 / Draft-PR #145. Domain-Contract nicht angefasst.

Geprüft gegen den tatsächlichen Dateisatz: `docs/ACTIVE_WORK_STATUS.md` (PR-Tabelle und §10), Scan der übrigen Slice-Continuity (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, Status/Handoff).

Keine Änderung an `app/`, `components/`, `supabase/migrations`, Grants, RLS, Auth-Config, Branch Protection, UI/CRUD, Provider-Runtime.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Ist Registry strukturell als `TripTraveller` zuweisbar? | Nein. Fakten liegen unter `facts`. Compile-Zeit-Regression ohne Casts. |
| Kopiert die Projektion Registry-Identität? | Nein. Explizite trip-owned UUIDs. |
| Darf Snapshot-ID einer anderen Registry-Zeile oder einem Registry-`clientRef` gleichen? | Nein. Ein Registry-Universum aus Parent + allen Citizenship-/Document-`id`/`clientRef`. Jede Snapshot-Identität, deren `id` oder `clientRef` darin vorkommt, ist fail-closed. Cross-Entity- und id↔clientRef-Tests vorhanden. Snapshot-globale Eindeutigkeit bleibt. |
| Kopiert die Projektion Registry-Zeitstempel in Kinder? | Nein. Alle Zeilen bekommen `jetzt`. |
| Wird fehlende Authority still zu `account_registry`? | Nein. Pflichtfeld. |
| Sind Refs nur „nicht traveller:N“? | Nein. UUID-backed. |
| Gibt es `new Date()`-Materialisierung? | Nein. `jetzt` ist Pflicht. |
| Wird Canonical Continuity nach Merge von #145 falsch? | Nein. Dual-State auch in der PR-Tabelle und in `## 10. Nächster Schritt`. Keine residuale unguarded `DRAFT/AKTIV`- oder `next step = review`-Zeile. Kein erfundener Merge-SHA. |
| Default-Pass / Issuer=Citizenship / Schema/UI? | Nein. |
| Ready/Merge/S2? | Nein. STOPP für unabhängigen TL-Re-Review. |

## 3. Risiken, die bleiben

- Persistenz könnte die Materialisierung später wieder durch kopierte oder kreuzkollidierende Registry-IDs ersetzen, wenn S2 den Vertrag nicht liest.
- Guest-Auto-Transfer bleibt trip-scoped und ist kein Registry-Import.
- `main` `protected=false`.
- Dieser Review-Fix erzeugt einen neuen Head und invalidiert `e9f96e79`.
- Dieses Self-Review erzeugt keinen PASS.

## 4. Urteil des Autors

Das Continuity-Finding aus `5455836506` ist geschlossen. Domain-Contract unverändert. Non-Scope gehalten. Exact-Head CI/Vercel bleibt live vom unabhängigen Reviewer zu prüfen.

**Unabhängiger Technical-Lead-Re-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
