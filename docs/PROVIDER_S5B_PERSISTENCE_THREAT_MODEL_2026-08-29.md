# Provider S5-B – Persistence Threat Model

Stand: 29. August 2026  
Status: **SLICE THREAT MODEL / KEIN PRODUCTION-APPLY / KEIN PASS**  
Auftrag: `docs/PROVIDER_S5B_PERSISTENCE_IMPLEMENTATION_TASK_2026-08-29.md`

## 1. Angreifer

| Angreifer | Ziel |
| --- | --- |
| `anon` | Provenance lesen oder schreiben, ohne Konto |
| Eigener `authenticated` User | Direct-DML oder RPC, um Provider-Hard-Truth für eigene Items zu fälschen |
| Fremder `authenticated` User | Cross-user Read/Write |
| Kompromittierter Client | `sourceKind=live_api`, gefälschter Actor, Stay-Preis als Quote |
| Manipulierte REST-/RPC-Payload | `reise_anlegen`, Direct `trip_items`, erfundener Provenance-INSERT |

## 2. Zu schützende Assets

Provider-Herkunft, Price/Currency-Evidence, `externalRef`, Affiliate-Evidence, Snapshot-Zeit. Nicht: `CommercialBewertung`, Pass/MRZ, Traveller-Credentials.

## 3. Trust Boundary

Nur eine serverseitig geprüfte S5-A-Provider-Quote darf Provider-Hard-Truth minten. Persistiert wird ausschließlich `persisted_snapshot` / `snapshot`. Client-`sourceKind` und Client-`persistenz` sind keine Autorität.

## 4. Bypass-Pfade und Schließung

| Pfad | Schließung |
| --- | --- |
| Direct Data-API DML auf der neuen Tabelle | Kein INSERT/UPDATE/DELETE-Grant; keine Write-Policy |
| Direct `trip_items` DML | Erweiterte Guard-Matrix; Flight-Triggername unverändert |
| `reise_anlegen` | SECURITY INVOKER + Guard + JSON setzt keine Providerfelder mehr |
| Vorhandene Trigger/RPCs | `reise_aendern` schreibt Commercial-Felder nicht; Guard fängt Direct-Updates |
| Legacy-Flachfelder | Keine zweite Hard-Truth; Projektion nur durch trusted Write; ohne Zeile = `unknown` |
| Guest-Promotion | Strip Stay/Activity/Note vollständig; Transfer/Rental nur Preis; keine Provenance-Zeile |
| PostgREST-RPC auf den Write | Funktion liegt in `jetnity_internal`, nicht in `[api].schemas` |
| `service_role` | Weder Table-DML noch EXECUTE |

## 5. Warum Grants + RLS + privilegierter Write gemeinsam fail-closed sind

- **Grants** verhindern, dass die Tabelle im API-Graph als schreibbar erscheint und dass TRUNCATE/INSERT ohne Policy möglich wäre.
- **RLS** verhindert Cross-user Read, selbst wenn SELECT gewährt ist.
- **Privilegierter Write** ist der einzige Weg, eine Zeile zu erzeugen. Ohne EXECUTE für PostgREST-Rollen kann ein kompromittierter Client die Funktion nicht über REST aufrufen.
- Jede Schicht allein wäre unzureichend: RLS ohne REVOKE ließe Direct-INSERT sichtbar; REVOKE ohne RLS wäre bei einem späteren SELECT-Grant blind für Ownership; eine öffentliche RPC würde Client-Payload zur Wahrheit machen.

## 6. Residuals

- Ein Superuser oder künftiges versehentliches EXECUTE-Grant an `authenticated` plus Schema-Exposure würde Own-Item-Minting erlauben. Ownership-Check und Source-Härtung bleiben dann die zweite Linie.
- User-Intake-Preise auf Transfer/Rental bleiben sichtbar, sind aber nicht Provider-Hard-Truth.
- Kein realer Provider-Snapshot existiert. TW-8 bleibt geschlossen.
- Production ist nicht angewendet.
