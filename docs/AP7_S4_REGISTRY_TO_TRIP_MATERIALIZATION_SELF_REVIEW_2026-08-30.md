# Jetnity – AP-7-S4 Registry → Trip Snapshot Materialization Self-Review

Stand: 30. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 18`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: AP-7-S4 Runtime/UI auf Draft-PR #223, Task `docs/AP7_S4_REGISTRY_TO_TRIP_MATERIALIZATION_TASK_2026-08-30.md`.

Baseline-Re-Fetch: `origin/main` = `b6ec2e431a3d92cc7b5fd4fdc0857d7f8fe4072e` (0 behind).

Geprüft gegen den tatsächlichen Dateisatz dieses Stamps, nicht gegen Chat-Absicht.

Diff-Scope gegen `origin/main`:

- Task + Status/Self-Review/Handoff
- S4 helpers/tests/copy
- `registryMitClientLaden`
- `registryTripUebernahmeOrchestrieren` + `registryTravellerInReiseUebernehmen`
- Trip-page/Konto/Reisendenkontext UI
- write-path inventory lock
- Review-Fix: `account-registry-trip-orchestrierung.test.ts`

Keine Datei unter `supabase/migrations`.

Technical-Lead CHANGES REQUIRED auf `40204e22` (Kommentar `5465241982`) sind in derselben Session behoben: kleine injizierbare Orchestrierungsnaht, keine Schema-/RPC-/RLS-/Auth-Änderung.

## 2. Acceptance gegen Code

| Pflicht | Nachweis |
| --- | --- |
| Explizite Owner-Aktion | Client sendet nur `{ tripId, registryTravellerId }` nach Bestätigung. Kein Page-Load-Write. |
| S1-Projektion wiederverwendet | `registryTravellerAlsFrischenTripSnapshot` ruft `accountRegistryTravellerProjektieren`. Action-Datei importiert keine zweite Projektion. |
| Frische trip-eigene IDs/clientRefs | Generator + S1 rejecten Registry-Universum und Duplikate. Tests belegen Disjunktheit und Re-Materialisierung. |
| Vollständige Citizenships/Documents | Snapshot und `travellerAlsPayload` behalten 2+2+nullable Relation im Test. |
| Issuer ≠ Citizenship | `national_id` mit Issuer `DE` bleibt unabhängig. |
| Nullable Relation remapped | Passport-Refs zeigen auf neue Citizenship-clientRefs; unlinked Document bleibt `null`. |
| Bestehende Trip-Reisende unberührt | Write sendet nur den neuen Snapshot an `party_schreiben` (Upsert per frischer clientRef). |
| Limit fail-closed | `registryTripLimitErreicht` **vor Registry-Read und Write**; Orchestrierungstest beweist 0 Registry-/Write-Calls. UI zeigt Limit-Text und deaktiviert Aktionen. |
| Registry missing/invalid/unauthorized | Orchestrierung: leere RLS-Menge, 500-Abbildungsfehler, fremde ID → `ok: false`, `partySchreiben === 0`. |
| Trip missing/unauthorized | Orchestrierung: fehlende/RLS-leere Reise → 0 Registry-Read, 0 Write. |
| Write failure ehrlich | Orchestrierung reicht die `party_schreiben`-Meldung durch; kein Success-Copy. |
| Bestehende Reisende bleiben | Success-Payload enthält nur den neuen Snapshot; `traveller:1` und Registry-`clientRef` fehlen. |
| Action-Auth explizit | Action übergibt `konto().benutzerId`; `benutzerId: null` stoppt vor jedem Read/Write. |
| Empty ≠ Error | UI-Copy und getrennte `role="status"` / `role="alert"`. |
| Kein Guest-Pfad | `GastArbeitsbereich` enthält die Action/Komponente nicht. Registry-Load erst nach Konto-Reise. |

## 3. Security / Privacy / Truth

| # | Anforderung | Ergebnis |
| --- | --- | --- |
| 1 | Source Registry owner-only über bestehende RLS | Ja. `registryMitClientLaden` nutzt authenticated Client, kein Service Role. Fremde IDs erscheinen als leere Menge / nicht gefunden. |
| 2 | Destination Trip über bestehenden autorisierten Write-Pfad | Ja. Dieselbe `partySchreiben`-Hilfe wie `travellerSetzen`. Inventory-Test bleibt: RPC nur in `reisende-aktionen.ts`. |
| 3 | Kein Registry-Identifier als Trip-Identifier | Ja. Frische UUIDs; Payload-Test enthält keine Registry-IDs/clientRefs. |
| 4 | Keine Live-Verbindung nach Materialisierung | Ja. Kein FK, keine provenance-Spalte, keine Registry-ID im Trip-Payload. |
| 5 | Registry edit/delete ändert den Trip Snapshot nicht | Ja. Nach dem Write gibt es keine Rückreferenz. Bestehende Dual-Authority bleibt. |
| 6 | Kein fremdes Registry-Profil lesbar/übernehmbar | Ja. Owner-RLS + explizite ID-Suche. Extra Keys in der Action-Eingabe werden abgelehnt. |
| 7 | Keine sensiblen Credential-Payloads | Ja. Display-Projektion hat nur Label/Wohnsitz/Länder/Dokumenttyp/Issuer. Keine Nummern/MRZ/DOB/Health-Felder. |
| 8 | Kein First-Item-/Default-Credential | Ja. Runtime-Quellen enthalten kein `documents[0]` / `citizenships[0]` / default/preferred/chosen. UI hat keine Radio-/Vorauswahl. |
| 9 | Issuer ≠ Citizenship bleibt erhalten | Ja. Getrennte Felder, Test mit DE-Issuer neben CH/RS-Citizenships. |
| 10 | Nullable Document→Citizenship korrekt remapped | Ja. Linked Refs werden über die neue Citizenship-Karte gesetzt; unlinked bleibt null. |
| 11 | Fehler führen nicht zu stiller Teilwahrheit | Ja. Projektion/Limit/Read/Write-Fehler returnen `{ ok: false }` vor oder statt Success. Write-Fehler-Test beweist die Provider-Meldung, nicht `erfolg`. Kein partielles Child-Write aus Client-Code. |
| 12 | S4-Action-Auth ist orchestriert, nicht nur Regex | Ja. Naht erhält `benutzerId` von `konto()`; unauthenticated Lauf ruft Trip/Registry/`party_schreiben` nicht auf. |

## 4. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde ein Schema/RLS/Grant geändert? | Nein. |
| Gibt es Service Role oder privilegierten Bypass? | Nein. |
| Wird Registry-ID still als `traveller:N` oder Trip-ID wiederverwendet? | Nein. |
| Wird beim Laden automatisch materialisiert? | Nein. |
| Kann die UI ein Credential vorauswählen? | Nein. |
| Wird Guest→Registry importiert? | Nein. |
| Schreibt Client-Code Child-Tabellen? | Nein. |
| Ready/Merge/Folgeslice? | Nein. STOPP für unabhängigen TL-Review. |

## 5. Risiken, die bleiben

- Ohne authentifizierten Preview-Klick bleibt mobile/a11y real-device Evidence residual.
- Die Fläche steckt in der bestehenden, standardmäßig geschlossenen Vorbereitung. Das ist scope-treu, aber leichter zu übersehen.
- Gleicher Registry-Eintrag kann bewusst mehrfach als neuer Snapshot erscheinen. Das ist kein Dedup-Bug.
- Dieses Self-Review erzeugt keinen PASS.

## 6. Urteil des Autors

Der Slice bleibt im autorisierten Runtime-Rahmen: S1-Projektion, bestehender atomarer Trip-Write, keine Schema-/RLS-/Auth-Änderung. Dual-Authority ist in Copy und Code gehalten. Die sechs TL-Write-/Auth-Forderungen sind jetzt als Orchestrierungsverhalten getestet (2715/2715 lokal auf `390cc0d0`).

**Unabhängiger Technical-Lead Exact-Head Re-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
