# Jetnity – Traveller Context / Multi-Citizenship / Multi-Document

Stand: 22. August 2026  
Status: **Foundation E im Draft-PR / Development-Migration angewendet / Production unverändert**

Verbindliche Regeln: `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`  
Auftrag: `docs/CURSOR_FOUNDATION_E_TRAVELLER_CONTEXT_TASK.md`  
Acceptance: `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md`

---

## Ziel

Jetnity modelliert Reisende so, dass ein Traveller mehrere rechtlich relevante Optionen besitzen kann:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängige zulässige Optionen.**

Foundation E baut die provider-neutrale Traveller Truth und die Evaluationsnaht. Es baut keinen Timatic- oder anderen echten Requirements-Adapter.

---

## Kanonische Source of Truth

| Schicht | Wahrheit |
| --- | --- |
| Parent | `public.trip_travellers` – stabiler Traveller einer Reise, inkl. datensparsamem `residence_country_code` |
| Citizenships | `public.trip_traveller_citizenships` – 1:n ISO-2-Staatsbürgerschaften |
| Documents | `public.trip_traveller_documents` – 1:n Credential-Profile ohne Nummer/Scan/MRZ |
| App-Domäne | `TripTraveller.citizenships[]` + `documents[]` |
| Guest | dieselbe fachliche Form in `jetnity:reise:v3` |
| Route / Transit | bleibt Foundation-D-`routeFactsAusReise()`, traveller-neutral |

Neue Writes schreiben **nicht** mehr in die Legacy-Credential-Spalten `nationality_country_code`, `document_type`, `document_issuing_country_code`, `document_expires_on`. Diese Spalten bleiben compatibility-only nach Backfill.

---

## Daten, die bewusst nicht gespeichert werden

- Pass-/Ausweis-/Visa-Nummern
- Scans, Dokumentbilder, MRZ
- biometrische Daten
- Geburtsdatum
- Gesundheitsakte / Impfpass-Uploads
- freie Länderlabels als Truth
- erfundene Visa-/Transit-/Health-/Carrier-Aussagen

Grenzen gegen Abuse/Payload:

- höchstens 20 Traveller je Reise
- höchstens 8 Staatsbürgerschaften je Traveller
- höchstens 12 Dokumente je Traveller
- Label höchstens 40 Zeichen, ohne HTML und ohne Ausweisnummern-Muster

---

## Expand / Contract

Migration: `supabase/migrations/20260822160000_traveller_context_intelligence.sql`

1. Child-Tabellen und optionales `trip_readiness_items.traveller_id` anlegen
2. vorhandene `nationality_country_code`-Werte deterministisch als Citizenship backfillen
3. vorhandenes Dokumentprofil deterministisch als Document backfillen
4. `residence_country_code` unverändert behalten
5. Leser auf Child-Tabellen umstellen; Legacy nur noch, wenn Children leer sind
6. Legacy-Spalten **nicht droppen**

Späterer Contract-Cleanup (nicht in diesem Block): Legacy-Spalten entfernen, sobald Production backfilled ist und keine Leser mehr die alten Spalten brauchen.

---

## Guest / Account

Guest und Account teilen `TripTraveller`. Alte Singular-Guest-Objekte werden über `travellerLegacyLesen()` expandiert, nicht verworfen.

Account-Writes laufen atomar über `public.party_schreiben(jsonb)`:

- `SECURITY INVOKER`
- `search_path = public, pg_temp`
- Owner-Isolation über `auth.uid()`
- Composite-FKs verhindern Cross-Trip-/Cross-User-/Cross-Traveller-Referenzen
- fremde Citizenship-ID an einem Dokument wird abgewiesen

Guest→Account übernimmt Party (Traveller + Citizenships + Documents) über dieselbe RPC. Readiness bleibt ein nachgelagerter, fail-closed Schritt. Ein Fehler nach `reise_anlegen` hinterlässt weiterhin eine Konto-Reise ohne Party; der Browser-Entwurf bleibt erhalten.

---

## Fingerprint / Freshness

`READINESS_FINGERPRINT_VERSION = v2`.

Traveller-spezifische Einreise-/Visum-/Dokumentkarten enthalten:

- Traveller-`clientRef`
- sortierte Citizenship-Menge
- sortierte Document-Menge (Typ / Aussteller / Expiry / Citizenship-Bezug)
- Residence
- Foundation-D-Route / Transit / Destinationen / Reisedaten

Array-Reihenfolge ändert den Fingerprint nicht. Änderung an Traveller A invalidiert Traveller B nicht. Ticket-/Buchungsbestätigungen bleiben item-bezogen.

---

## Credential-Evaluationsnaht

Konzeptionell:

`Traveller + Credential Option + Route/Transit + Reisedaten → Provider/Official Evaluation`

Eine Option entsteht nur aus vorhandenen Fakten:

- ein vorhandenes Dokument → eine Option
- Traveller ohne Dokument → eine Option mit `document: null` (`optionRef=…:none`)
- keine erfundenen Pässe aus Staatsbürgerschaften

`requirementsProviderAus()` bleibt `null`. Ohne Provider darf Jetnity nicht behaupten, welcher Pass visumfrei, besser oder transitfähig ist.

Vergleich (`lib/readiness/vergleich.ts`) trennt Requirement-Ergebnisse von option-level Eligibility/Mandate.

- `result=required` bei `requirementType=visa` heisst: für diese Option ist ein Visum nötig – nicht, dass genau dieses Credential verwendet werden muss.
- Ein Winner entsteht nur bei expliziter option-level Semantik (`optionMandate=mandatory` oder `optionEligibility=not_allowed`) oder, nach explizit erlaubter Eligibility, bei belegter Reibung (`not_required` vor `required`).
- Ausstellerland ist kein Citizenship-Ersatz. `relatedCitizenshipCountryCode` bleibt `null`, solange keine gespeicherte Relation existiert.
- Geladene leere Child-Relationen sind autoritativ. Legacy-Singularfelder dürfen sie nicht wieder befüllen.
- Explizites `citizenships: []` / `documents: []` bleibt auch im gemeinsamen Parser leer.
- Document-`clientRef` ist eine stabile Identität. `citizenshipClientRef` wird nur bewusst gesetzt oder bei Citizenship-Löschung genullt.
- Traveller-spezifische Readiness ohne auflösbare Ref wird nicht trip-level.
- Widersprüchliche current Provider-Zeilen derselben Option, inklusive abweichender `officialClass`, bleiben sichtbar als `unknown` / `recheck_needed`. Evidence-URLs allein sind kein Konflikt.
- Die Requirements-API validiert vorhandene Legacy-Singularfelder strikt. `travellerLegacyLesen()` bleibt nur für Guest-/Storage-Recovery tolerant.

Ohne Evidence oder ohne option-level Semantik:

> Noch nicht zuverlässig vergleichbar.

---

## UX

Kein Workspace-Umbau. Nur `Einreise & Reisevorbereitung` erfasst mehrere Staatsbürgerschaften und Dokumente.

Erlaubte Copy ohne Provider:

- `Angaben erfasst`
- `Offizielle Prüfung noch nicht verfügbar`
- `Für eine zuverlässige Prüfung fehlen Angaben`
- `Noch nicht zuverlässig vergleichbar.`

Nicht erlaubt: `Schweizer Pass ist besser` oder vergleichbare Vorteilssprache ohne Evidence.

---

## Dev / Production-Grenze

| Umgebung | Stand |
| --- | --- |
| Development | Migrationen `20260822160000`–`20260822180000` |
| Production | unverändert; keine Foundation-E-Tabellen |

Production-Migration braucht nach Merge eine **separate** Product-Owner-Freigabe.

---

## Provider-Gate

Kein Timatic-Vertrag, kein Secret, keine laufenden Providerkosten. Die Factory bleibt fail-closed. Ein späterer Provider muss `credentialOptions[]` getrennt bewerten können, ohne die UI oder den Reisegraphen neu zu bauen.
