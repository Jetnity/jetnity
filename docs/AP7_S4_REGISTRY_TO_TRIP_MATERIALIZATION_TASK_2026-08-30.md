# Jetnity – AP-7-S4 Account Registry → Trip Snapshot Materialization Task

Stand: 30. August 2026  
Status: **TECHNICAL-LEAD AUTHORIZED / BOUNDED RUNTIME SLICE / NO SCHEMA CHANGE**  
Issue: **#222**  
Cursor-Agent: **`Account plattform audit vorbereitung 18`**  
Baseline: **`main @ b6ec2e431a3d92cc7b5fd4fdc0857d7f8fe4072e`**

> Live-Evidence gewinnt immer. Dieser Auftrag ist exakt auf AP-7-S4 begrenzt. Cursor bleibt Draft, setzt niemals Ready, merged niemals und startet keinen Folgeslice.

## 1. Ziel

Ein angemeldeter Nutzer soll einen bereits in seiner privaten Account Traveller Registry gespeicherten Reisenden **bewusst und explizit** in eine konkrete Reise übernehmen können.

Die Übernahme materialisiert einen **neuen, trip-eigenen Snapshot**. Sie erzeugt **keine Live-Verknüpfung** zwischen Registry und Reise.

Verbindliche Authority-Grenze:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Nach einer erfolgreichen Übernahme dürfen spätere Registry-Änderungen oder Registry-Löschungen den bestehenden Trip Snapshot niemals still verändern oder löschen.

## 2. Zuerst lesen / live prüfen

Vor Codeänderung mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
6. `docs/AP7_DUAL_AUTHORITY_PRODUCT_OWNER_APPROVAL_2026-08-28.md`
7. `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_STATUS_2026-08-28.md`
8. `docs/AP7_S3_ACCOUNT_TRAVELLER_REGISTRY_CRUD_UI_STATUS_2026-08-29.md`
9. `lib/traveller/account-registry.ts` + Tests
10. `lib/traveller/account-registry-daten.ts`
11. `lib/readiness/reisende-aktionen.ts`
12. bestehende `party_schreiben`-/Traveller-Write-Verträge und Tests
13. aktuelle Trip-Workspace-/Traveller-UI, in die die explizite Auswahl fachlich am kleinsten und saubersten passt.

Vor Implementierung `origin/main`, PR-Head, Merge-Base und relevante Parallel-Workstreams erneut prüfen. Wenn `main` materially driftet oder ein Scope-Konflikt entsteht: STOP/BLOCKED melden, nicht improvisieren.

## 3. Verbindliche Architektur

### 3.1 Source

- Source ist ausschließlich ein owner-zugänglicher `account_travellers`-Eintrag mit seinen Citizenship-/Document-Metadaten über bestehende AP-7-S2/S3 owner-only RLS.
- Kein Service Role.
- Kein Admin-/Support-Bypass.
- Kein fremdes Registry-Profil.

### 3.2 Projection

Die bestehende AP-7-S1 Pure-Domain-Projektion in `lib/traveller/account-registry.ts` ist der kanonische Vertrag und muss wiederverwendet werden.

Nicht zulässig:

- Registry `id` oder `clientRef` als Trip-Identität weiterverwenden;
- eigene zweite Projektionslogik bauen, die S1 semantisch dupliziert;
- `citizenships[0]`, `documents[0]` oder First-Item-Semantik verwenden;
- Default-/Primary-/Preferred-/Chosen-Credential erzeugen;
- Issuer Country als Citizenship ableiten.

Für jeden Materialisierungsvorgang müssen frische trip-eigene UUIDs/clientRefs für Traveller, jede Citizenship und jedes Document entstehen. Die Document→Citizenship-Relation muss auf die **neuen trip-eigenen Citizenship-clientRefs/IDs** zeigen.

### 3.3 Destination / Write path

- Ziel ist genau eine konkrete bestehende Reise.
- Bestehende Trip-Write-/Ownership-/RLS-Grenzen bleiben unverändert.
- Bevorzugt bestehenden atomaren/fail-closed Traveller-Schreibweg (`party_schreiben` und vorhandene server action/helper contracts) wiederverwenden.
- Keine direkte Child-Tabellenmutation aus Client-Code.
- Keine partielle Snapshot-Erzeugung: bei ungültiger Projection, Limits, Ownership-/RLS-/Write-Fehlern muss der Vorgang ehrlich scheitern.
- Bestehende Trip-Reisende dürfen nicht still überschrieben werden.
- Maximalgrenzen des bestehenden Trip Traveller Context bleiben verbindlich.

Wenn der vorhandene Write-Vertrag den vollständigen neuen Snapshot nicht atomar/sicher aufnehmen kann und dafür Schema/RPC/RLS geändert werden müsste: **STOP/BLOCKED**. Nicht in diesem Slice das Schema erweitern.

## 4. Produkt-UX

Implementiere die kleinste echte Product Surface, auf der ein Nutzer bei einer konkreten Reise einen gespeicherten Reisenden bewusst hinzufügen kann.

Pflicht:

- klare Aktion wie „Gespeicherten Reisenden hinzufügen“ / fachlich gleichwertige Formulierung;
- Registry-Liste zeigt nur ausreichend sichere, nicht-sensitive Display-Fakten;
- kein automatisches Vorauswählen eines Reisenden;
- keine automatische Auswahl einer Citizenship oder eines Dokuments;
- explizite Bestätigung/Action pro Übernahme;
- ehrliche Loading-/Empty-/Error-/Success-Zustände;
- Empty State unterscheidet „keine gespeicherten Reisenden“ von Ladefehler;
- bei vollem Trip-Traveller-Limit verständliche Meldung statt verstecktem Fehler;
- mobile-first, semantische Controls, Keyboard-Fokus, Labels/ARIA wo nötig;
- bestehende UI-/Designsystem-Muster wiederverwenden, kein Redesign des Trip Workspace.

Die UI darf erklären, dass eine Kopie für diese Reise erzeugt wird und spätere Änderungen am gespeicherten Reisenden diese Reise nicht automatisch verändern.

## 5. Zu kopierende Wahrheit

Nur Daten, die bereits in beiden freigegebenen Modellen existieren und durch S1/S2/S3 erlaubt sind:

- Registry label nur soweit der bestehende TripTraveller-/UI-Vertrag diesen fachlich korrekt abbildet; **nicht** durch neue Schema-Felder erzwingen;
- residence country;
- alle Citizenships bis bestehendem Limit;
- alle Document-Metadaten bis bestehendem Limit;
- document type `passport | national_id | unknown`;
- issuing country getrennt von citizenship;
- explizite optionale Document→Citizenship-Relation;
- `expires_on` / bestehend äquivalentes Trip-Dokument-Feld.

Keine erfundenen oder fehlenden Fakten auffüllen.

## 6. Harte Non-Scope-Grenzen

In diesem Slice verboten:

- jede neue Supabase Migration;
- Schema-/RLS-/GRANT-/REVOKE-/Ownership-/SECURITY-DEFINER-Änderung;
- Production- oder Development-Supabase-Mutation;
- Reparatur der bekannten malformed S5-B Migration-History;
- Auth/Session/MFA/AAL-Änderung;
- Service Role;
- Guest→Registry Import, Auto-Import, Dedup oder Backfill;
- Registry→Trip Live-FK, Registry provenance column oder späteres Auto-Sync;
- Änderung bestehender Trip Snapshots nach Registry-Edit;
- Passport-/Dokumentnummern;
- Scans/Bilder;
- MRZ;
- Biometrics;
- DOB/Geburtsdatum;
- Health-/Medical-Daten;
- Visa-/Einreise-Hard-Truth;
- automatische „bester Pass“-Entscheidung;
- Provider Runtime/Secrets/paid calls/live activation;
- TW-8;
- Payments;
- Branch Protection;
- Homepage/Issue #110;
- Collaboration/Issue #20;
- AP-8–AP-12;
- global current-state/continuity files (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`) – diese bleiben TL-owned.

## 7. Security / Privacy / Truth Acceptance

Muss im Self-Review ausdrücklich nachgewiesen werden:

1. Source Registry owner-only über bestehende RLS.
2. Destination Trip über bestehenden autorisierten Write-Pfad.
3. Kein Registry-Identifier wird als Trip-Identifier wiederverwendet.
4. Keine Live-Verbindung nach Materialisierung.
5. Registry edit/delete verändert den Trip Snapshot nicht.
6. Kein fremdes Registry-Profil lesbar/übernehmbar.
7. Keine sensiblen Credential-Payloads oder neue Freitext-Hintertür.
8. Kein First-Item-/Default-Credential-Verhalten.
9. Issuer != Citizenship bleibt erhalten.
10. Nullable Document→Citizenship bleibt nullable und korrekt remapped.
11. Fehler führen nicht zu stiller Teilwahrheit.

## 8. Tests – Mindestumfang

Focused Tests plus vollständige Repo-Gates.

Mindestens testen:

- S1-Projektion wird tatsächlich im Runtime-Pfad verwendet;
- frische disjunkte Traveller-/Citizenship-/Document-IDs und clientRefs;
- Multi-Citizenship vollständig erhalten;
- Multi-Document vollständig erhalten;
- issuer/citizenship unabhängig;
- nullable Document→Citizenship;
- relation remapped auf neue Trip-Snapshot-Identitäten;
- no `documents[0]` / `citizenships[0]` / primary/default/chosen/preferred semantics;
- kein sensitive field payload;
- Registry source missing / invalid / unauthorized → fail closed;
- Trip missing / unauthorized → fail closed;
- Trip slot limit → kein Write;
- `party_schreiben`-/Write failure → ehrlicher Fehler;
- bestehende Trip-Reisende werden nicht still ersetzt;
- erneute explizite Materialisierung erzeugt einen **neuen** unabhängigen Snapshot und wird nicht aufgrund Registry-ID still dedupliziert;
- UI Loading / Empty / Error / Success;
- action is explicit, no auto-materialization on page load;
- auth behavior;
- Typecheck, Lint, Tests, hygiene checks, Production build.

Falls browser-/real-device Evidence nicht wirklich ausgeführt wurde, darf sie nicht erfunden werden.

## 9. Gefährliche Muster aktiv suchen

Vor Handoff mindestens repo-/diff-spezifisch prüfen:

- `documents[0]`
- `citizenships[0]`
- `primary`
- `defaultPassport`
- `defaultCitizenship`
- `preferredDocument`
- `chosenCredential`
- `selectedCredential`
- Registry IDs in Trip-Payloads
- Passport-/Document-Number-Felder
- MRZ / scan / biometric / birthdate / health
- Migrationen oder `supabase/migrations` im Diff
- Service Role / admin bypass
- direkte Child-Table Writes aus Client-Code
- Guest→Registry behavior
- Trip→Registry FK/provenance additions.

Treffer fachlich klassifizieren; harmlose Test-/Dokumentreferenzen nicht blind entfernen.

## 10. Deliverables

Agent liefert auf demselben Branch:

1. Runtime/UI für explizite Registry→Trip Materialisierung;
2. notwendige kleine server/helper integration ohne Schemaänderung;
3. focused Tests;
4. `docs/AP7_S4_REGISTRY_TO_TRIP_MATERIALIZATION_STATUS_2026-08-30.md`;
5. `docs/AP7_S4_REGISTRY_TO_TRIP_MATERIALIZATION_SELF_REVIEW_2026-08-30.md`;
6. `docs/AP7_S4_REGISTRY_TO_TRIP_MATERIALIZATION_HANDOFF_2026-08-30.md`;
7. exakten finalen Head, Diff-Scope, Tests, CI-/Vercel-Evidence soweit tatsächlich vorhanden, Risiken und verbleibende Non-Scope-Arbeit.

Keine globalen Continuity-Dateien ändern.

## 11. STOP-Regel

Nach Implementierung, Self-Review und finalem Push:

- PR bleibt **Draft**;
- nicht Ready setzen;
- nicht mergen;
- keine Production-/Supabase-Mutation;
- keinen AP-7-S5/AP-8/Provider-/anderen Folgeslice starten;
- STOP für unabhängigen Technical-Lead Exact-Head Review.

Bei Technical-Lead **CHANGES REQUIRED**: exakt dieser Agent/diese Session behebt die Findings. Jeder neue Head invalidiert vorherige Gates.