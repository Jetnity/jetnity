# Jetnity – Traveller Context / Multi-Citizenship / Multi-Document

Stand: 23. August 2026  
Status: **Foundation E abgeschlossen, auf `main` und Production verifiziert**

Verbindliche Regeln:

- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`

Acceptance: `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md`  
Production-Acceptance: `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`

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
| Route / Transit | Foundation-D-Route Truth, traveller-neutral |

Legacy-Credential-Spalten bleiben compatibility-only; kanonische neue Truth liegt in den Child-Relationen.

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

## Production-Stand

Foundation E ist vollständig gemergt und auf Production verifiziert.

Production-Migrationen:

- `20260822160000_traveller_context_intelligence`
- `20260822170000_traveller_context_fk_delete`
- `20260822180000_traveller_context_rereview`

Verifiziert wurden unter anderem:

- Child-Tabellen und RLS
- Composite-FKs und Delete-Semantik
- `party_schreiben(jsonb)` als atomarer, owner-isolierter Write-Pfad
- `SECURITY INVOKER`
- `FOR NO KEY UPDATE` für Child-Limits
- vollständiger Legacy-Nationalitäts-Backfill
- **0** erfundene Document↔Citizenship-Backfill-Relationen

---

## Guest / Account

Guest und Account teilen `TripTraveller`. Alte Singular-Guest-Objekte werden über den Legacy-Leser expandiert, nicht verworfen.

Account-Writes laufen atomar über `public.party_schreiben(jsonb)`:

- `SECURITY INVOKER`
- `search_path = public, pg_temp`
- Owner-Isolation über `auth.uid()`
- Composite-FKs verhindern Cross-Trip-/Cross-User-/Cross-Traveller-Referenzen
- fremde Citizenship-ID an einem Dokument wird abgewiesen

Guest→Account übernimmt Party (Traveller + Citizenships + Documents) über dieselbe RPC. Readiness bleibt ein nachgelagerter, fail-closed Schritt. Bei einem späteren Sync-Fehler bleibt der lokale Guest-Entwurf erhalten und die Schritte sind retry-fähig.

---

## Citizenship – progressive Pflicht statt globale Pflicht

Verbindliche Product-Owner-Entscheidung: `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`.

Die Staatsbürgerschaft ist **beim einfachen Reise-Start nicht global verpflichtend**. Sie wird jedoch zur **harten fachlichen Pflichtvoraussetzung**, sobald Jetnity eine Official-/Regulatory-Funktion ausführen soll, deren Ergebnis von Citizenship abhängt.

Beispiele:

- Visum / Visa-Befreiung
- ETA / eTA / ESTA / elektronische Reisegenehmigung
- Einreiseberechtigung
- Transitbestimmungen
- staatsbürgerschaftsabhängige Dokumentanforderungen
- staatsbürgerschaftsabhängige Health-/Vaccination-/Health-Document-Anforderungen

Fehlt die erforderliche Citizenship-Truth, darf Jetnity keine definitive Official-Entscheidung erzeugen. Ergebnis bleibt `insufficient_context` / `unknown`, und die UI fragt gezielt die fehlenden Angaben ab.

Jetnity darf Staatsbürgerschaft niemals still aus Wohnsitz, aktuellem Standort, Abflugland, Sprache, Domain oder Profilmarkt ableiten.

Mehrere Staatsbürgerschaften pro Traveller bleiben kanonisch unterstützt.

---

## Fingerprint / Freshness

Traveller-spezifische Einreise-/Visum-/Dokumentkarten berücksichtigen im Context Fingerprint:

- Traveller-Identität
- sortierte Citizenship-Menge
- sortierte Document-Menge (Typ / Aussteller / Expiry / Citizenship-Bezug)
- Residence
- Foundation-D-Route / Transit / Destinationen / Reisedaten

Array-Reihenfolge ändert den Fingerprint nicht. Relevante Traveller-/Credential-/Route-Änderungen invalidieren Official-/Readiness-Kontext fail-closed.

---

## Credential-Evaluationsnaht

Konzeptionell:

`Traveller + Credential Option + Route/Transit + Reisedaten → Provider/Official Evaluation`

Eine Option entsteht nur aus vorhandenen Fakten:

- ein vorhandenes Dokument → eine Option
- Traveller ohne Dokument → eine Option mit `document: null`
- keine erfundenen Pässe aus Staatsbürgerschaften

`requirementsProviderAus()` bleibt `null`. Ohne Provider darf Jetnity nicht behaupten, welcher Pass visumfrei, besser oder transitfähig ist.

Vergleich trennt Requirement-Ergebnisse von option-level Eligibility/Mandate.

- `required` bei `visa` heißt: für diese Option ist ein Visum nötig – nicht, dass genau dieses Credential verwendet werden muss.
- Ein Winner entsteht nur bei expliziter option-level Semantik bzw. belastbarer Official Evidence.
- Ausstellerland ist kein Citizenship-Ersatz.
- `relatedCitizenshipCountryCode` bleibt `null`, solange keine gespeicherte Relation existiert.
- Geladene leere Child-Relationen sind autoritativ; Legacy-Singularfelder dürfen sie nicht wieder befüllen.
- Document-`clientRef` ist stabile Identität.
- Traveller-spezifische Readiness ohne auflösbare Ref wird nicht trip-level degradiert.
- widersprüchliche current Provider-Zeilen derselben Option bleiben sichtbar als `unknown` / `recheck_needed`.
- Evidence-URL-Unterschied allein ist kein semantischer Konflikt.
- Requirements-API validiert kontrollierte Legacy-Singularfelder strikt; toleranter Legacy-Leser bleibt nur für Guest-/Storage-Recovery.

Ohne Evidence oder ohne option-level Semantik:

> **Noch nicht zuverlässig vergleichbar.**

---

## UX

Citizenship und Credentials werden progressiv abgefragt – nicht pauschal am ersten Screen.

Erlaubte Copy ohne Provider bzw. bei fehlendem Kontext:

- `Angaben erfasst`
- `Offizielle Prüfung noch nicht verfügbar`
- `Für eine zuverlässige Prüfung fehlen Angaben`
- `Noch nicht zuverlässig vergleichbar.`

Empfohlene Citizenship-Copy, sobald sie fachlich benötigt wird:

> **Damit wir deine Einreise-, Transit- und Gesundheitsanforderungen zuverlässig prüfen können, benötigen wir die Staatsbürgerschaft der betroffenen Reisenden.**

Nicht erlaubt: stille Default-Staatsbürgerschaft oder Vorteilssprache wie `Schweizer Pass ist besser` ohne Evidence.

---

## Provider-Gate

Kein Timatic-Vertrag, kein Secret, keine laufenden Providerkosten. Die Factory bleibt fail-closed. Ein späterer Provider muss mehrere Traveller/Citizenships/Credential-Optionen getrennt bewerten können, ohne UI oder Reisegraph neu zu bauen.
