# Jetnity – Provider Readiness S2 Status

Stand: 24. August 2026  
Status: **S2-B1 auf Supabase Development angewendet / Exact-Head-Gates grün / STOPP für unabhängigen Technical-Lead-Re-Review**  
Branch: `feat/provider-flight-evidence-s2`  
Draft-PR: `#51`  
Auftrag: `docs/PROVIDER_READINESS_S2_FLUGNACHWEIS_TASK.md`  
B1-Auftrag: `docs/PROVIDER_READINESS_S2_B1_DB_TRUST_FIX_TASK.md`  
Product-Owner-Freigabe: `docs/PROVIDER_READINESS_S2_B1_PRODUCT_OWNER_APPROVAL.md`

## 1. Was S2 ist

S2 hebt die Flug-Kontoübernahme und jede kommerzielle Flug-Persistenz auf dieselbe Trust-Grenze wie Hotels: **Browserdaten dürfen keine kommerzielle Flugwahrheit persistieren.**

S2-B1 schliesst denselben Vertrag an der Datenbankgrenze: `public.reise_anlegen(jsonb)` übernimmt für `kind='flight'` keine unbewiesenen Handelsfelder aus der JSON-Nutzlast.

Kein Mark Ready. Kein Merge. Kein Live-Duffel. Keine Provideraktivierung. Keine Secrets. Keine kostenpflichtigen Calls. **Keine Production-Migration.** Kein Start von S3.

## 2. Runtime-Head

- Exact Runtime Head: `f8af2059181e1f47d686893a1b5538441c6e2554`
- S2-B1-Implementierungs-Commit: `f8af2059`
- Vorheriger S2-App-Head: `f61bf7f03d503b1eb62cc324d35a7b659b3e4157`
- Base: `main` @ `01761eb9ba80828e87ca2da201901e0e211e1719`
- Draft-PR: https://github.com/Jetnity/jetnity/pull/51

Ein späterer reiner Docs-Commit nach diesem Head ist kein neues Runtime-Gate.

## 3. Umgesetzt

- `FlugNachweis` analog `HotelNachweis`: optionId plus Legs, Passagiere, Kabine, Währung, Gültigkeit
- Konto-Schema nur `tripId`, `dayId`, `optionId`
- `flugNachweisAusUmgebung()` = `null`; Server Action übergibt keinen Client-Suchkontext
- Guest-Übernahme fail-closed
- Guest → Account streicht unbewiesene Flug-Handelsfelder
- `booking_url` bleibt `null`
- Route Truth bleibt Foundation D
- **S2-B1:** `reise_anlegen` nullt für `kind='flight'` `price_amount`, `price_currency`, `provider`, `external_ref` und `booking_url` in beiden INSERT-Pfaden (ADR-0156)

## 4. Persistenzpfade

| Pfad | S2-Zustand |
| --- | --- |
| Konto `flugInReiseUebernehmen` | identifiers + `FlugNachweis`; Umgebung `null` → fail-closed |
| Guest `gastFlugUebernehmen` | fail-closed |
| Guest → Account `alsNutzlast` / `reiseAusNutzlastAnlegen` | Flug-Handelsfelder gestrichen; Route-Itinerary bleibt Foundation-D-Intake |
| Direkter Server-Action-Missbrauch | Zod akzeptiert keine Browser-`FlugOption` mehr |
| Direkter authentifizierter RPC `reise_anlegen` | Flug-Handelsfelder werden DB-seitig verworfen; User-Intake und Itinerary bleiben |

## 5. Datenbank

- Neue additive Migration: `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis.sql`
- **Supabase Development:** angewendet. `schema_migrations.version = 20260824160000`. Funktion bleibt SECURITY INVOKER. `authenticated` behält EXECUTE. `anon` hat kein EXECUTE.
- **Production:** unverändert. Kein `--produktion`. Keine Production-Anwendung.

Keine Service-Role-, Auth-, MFA-, AAL- oder Capability-Änderung.

## 6. Bewusst nicht geändert

- kein Live-Duffel / kein echter Adapter
- kein persistenter Suchkontext-Speicher (S5)
- kein Mobility-/Rental-Nachweis (S3)
- kein persistenter Cost Guard (S6)
- keine Homepage-/Account-/Admin-Featurearbeit
- keine Production-Migration

## 7. Gates auf Exact Head `f8af2059`

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **1755/1755 pass** |
| `db:rechte` | **pass** – 51 Tabellenrechte, jedes durch eine Policy gedeckt |
| `db:rls` | **pass** – Exit 0 |
| `db:sicherheit` | **219/219**, inkl. drei neuer S2-B1-Direkt-RPC-Fälle |
| `db:parallelitaet` | **7/7** |
| Typecheck / Lint / Hygiene / API-Schutz / Schema-Bezug | **pass** |
| Production Build | **38/38, Exit 0** |
| Trip-Workspace-UI-Audit | **1014/1014, 0 Fehler, WebKit + Chromium, 8 Viewports** |
| GitHub Actions `32720806500` | **SUCCESS** |
| Vercel Preview `F4b8YUcqqsp8DBShrZeoCuBf2NMU` | **READY** (GitHub: success / Deployment has completed, SHA `f8af2059`) |

## 8. Empfehlung

STOPP für unabhängigen Technical-Lead-Re-Review gegen Exact Head `f8af2059`. Nicht Mark Ready, nicht mergen, nicht S3 starten, Production nicht migrieren.
