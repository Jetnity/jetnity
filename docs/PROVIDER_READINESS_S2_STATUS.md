# Jetnity – Provider Readiness S2 Status

Stand: 24. August 2026  
Status: **S2-B2 auf Supabase Development angewendet / lokale Exact-Head-Gates grün / Vercel READY / GitHub Actions auf dem neuen Head nicht gestartet / STOPP für unabhängigen Technical-Lead-Re-Review**  
Branch: `feat/provider-flight-evidence-s2`  
Draft-PR: `#51`  
Auftrag: `docs/PROVIDER_READINESS_S2_FLUGNACHWEIS_TASK.md`  
B2-Auftrag: `docs/PROVIDER_READINESS_S2_B2_DIRECT_TABLE_TRUST_FIX_TASK.md`  
Product-Owner-Freigabe: `docs/PROVIDER_READINESS_S2_B2_PRODUCT_OWNER_APPROVAL.md`

## 1. Was S2 ist

S2 hebt die Flug-Kontoübernahme und jede kommerzielle Flug-Persistenz auf dieselbe Trust-Grenze wie Hotels: **Browserdaten dürfen keine kommerzielle Flugwahrheit persistieren.**

S2-B1 schliesst den öffentlichen RPC `reise_anlegen`. S2-B2 schliesst den direkten `trip_items`-Tabellenvertrag für `authenticated`/`anon`.

Kein Mark Ready. Kein Merge. Kein Live-Duffel. Keine Provideraktivierung. Keine Secrets. **Keine Production-Migration.** Kein Start von S3.

## 2. Runtime-Head

- Functional Exact Head: `1b06b28494086ab24569f48e83978f77543dfc89`
- S2-B2-Implementierung: `34a87e9f`
- Test-Fix: `1b06b284`
- Leerer CI-Retrigger: `1063f279` (kein Runtime-Delta)
- Vorheriger S2-B1-Head: `f8af2059181e1f47d686893a1b5538441c6e2554`
- Draft-PR: https://github.com/Jetnity/jetnity/pull/51

## 3. Umgesetzt

- App-Grenze S2 und RPC-Grenze S2-B1 bleiben
- **S2-B2:** BEFORE-Trigger `trip_items_flug_handelsfelder_schuetzen` (ADR-0157)
- Für `kind='flight'` und `current_user in ('authenticated','anon')`: INSERT nullt die fünf Handelsfelder; UPDATE kann sie nicht ändern; `kind`-Wechsel zu `flight` erbt sie nicht
- User-Intake, manueller Buchungsstatus und Foundation-D-Itinerary bleiben
- Hotel/Activity/Mobility/Rental unverändert
- Späterer trusted Write braucht einen getrennten SECURITY DEFINER-Vertrag, kein Client-Flag

## 4. Persistenzpfade

| Pfad | S2-Zustand |
| --- | --- |
| Konto `flugInReiseUebernehmen` | identifiers + `FlugNachweis`; Umgebung `null` → fail-closed |
| Guest `gastFlugUebernehmen` | fail-closed |
| Guest → Account | Flug-Handelsfelder gestrichen |
| Direkter RPC `reise_anlegen` | B1: Flug-Handelsfelder verworfen |
| Direkter `trip_items` INSERT/UPDATE | B2: Flug-Handelsfelder für authenticated/anon verworfen bzw. unveränderlich |

## 5. Datenbank

- Additive Migration: `20260824180000_trip_items_flug_handelsfelder_guard.sql`
- **Supabase Development:** angewendet. `schema_migrations.version = 20260824180000`. Trigger enabled.
- **Production:** unverändert. Kein `--produktion`.
- B1-Migration `20260824160000` bleibt auf Development.

Keine Service-Role-, Auth-, MFA-, AAL- oder Capability-Änderung. Tabellengrants unverändert.

## 6. Gates auf Functional Head `1b06b284`

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **1755/1755 pass** |
| `db:rechte` / `db:rls` | **pass** |
| `db:sicherheit` | **223/223**, inkl. vier neuer S2-B2-Fälle; B1-Fälle grün |
| `db:parallelitaet` | **7/7** |
| Typecheck / Lint / Hygiene / API-Schutz / Schema-Bezug | **pass** |
| Production Build | **38/38, Exit 0** |
| Trip-Workspace-UI-Audit | **1014/1014, 0 Fehler, WebKit + Chromium, 8 Viewports** |
| Vercel Preview `CZBH83Y2oczVKfU6S9FrPUiouN2c` | **READY** auf `1b06b284` |
| GitHub Actions `ci.yml` | **nicht gestartet** auf `34a87e9f` / `1b06b284` / `1063f279`. Letzte Actions-Suite dieser PR: `ff89e487` SUCCESS |

## 7. Empfehlung

STOPP für unabhängigen Technical-Lead-Re-Review. Der Review muss den offenen GitHub-Actions-Gap auf dem neuen Head ausdrücklich bewerten. Nicht Mark Ready, nicht mergen, nicht S3, Production nicht migrieren.
