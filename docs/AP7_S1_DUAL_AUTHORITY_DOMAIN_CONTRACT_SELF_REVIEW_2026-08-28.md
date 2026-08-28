# Jetnity – AP-7-S1 Dual-Authority Domain Contract Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 12`**  
Typ: adversarial Self-Review nach CHANGES REQUIRED `5455673104`, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Review-Fix gegen Exact Head `c88ac2e3dc9dfdc5d9a4a5dcec67a353c60f61c8` (Kommentar `5455673104`). Dieselbe Session / Generation 12 / Draft-PR #145.

Geprüft gegen den tatsächlichen Dateisatz: `lib/traveller/account-registry.ts`, Tests, Status, Handoff, ADR-0187-Nachtrag.

Keine Änderung an `app/`, `components/`, `supabase/migrations`, Grants, RLS, Auth-Config, Branch Protection, UI/CRUD, Provider-Runtime.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Ist Registry strukturell als `TripTraveller` zuweisbar? | Nein. Fakten liegen unter `facts`. Compile-Zeit-Regression (`extends` + `@ts-expect-error`) ohne Casts. |
| Kopiert die Projektion Registry-Identität? | Nein. Explizite trip-owned UUIDs. Gleichheit Quelle↔Snapshot wird abgelehnt. Relation wird remappt. |
| Kopiert die Projektion Registry-Zeitstempel in Kinder? | Nein. Traveller/Citizenship/Document bekommen `jetzt`. |
| Wird fehlende Authority still zu `account_registry`? | Nein. Pflichtfeld. Flache Trip-Form wird nicht befördert. |
| Sind Refs nur „nicht traveller:N“? | Nein. UUID-backed. `person:0` und `document:passport:CH` fail-closed. Zwei gleiche Pass-Fakten bleiben unterscheidbar. |
| Gibt es `new Date()`-Materialisierung? | Nein. `jetzt` ist Pflicht. |
| Default-Pass / Issuer=Citizenship / Schema/UI? | Nein. |
| Ready/Merge/S2? | Nein. STOPP für unabhängigen TL-Re-Review. |

## 3. Risiken, die bleiben

- Persistenz könnte die Materialisierung später wieder durch kopierte Registry-IDs ersetzen, wenn S2 den Vertrag nicht liest.
- Guest-Auto-Transfer bleibt trip-scoped und ist kein Registry-Import.
- `main` `protected=false`.
- Dieser Review-Fix erzeugt einen neuen Head und invalidiert `c88ac2e3` / `ed8f79b4`.
- Dieses Self-Review erzeugt keinen PASS.

## 4. Urteil des Autors

Die sechs Findings aus `5455673104` sind im Domain-Contract und in den Tests nachgezogen. Non-Scope gehalten.

**Unabhängiger Technical-Lead-Re-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
