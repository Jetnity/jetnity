# Jetnity – Provider Readiness S2 Status

Stand: 24. August 2026
Status: **S2-B2 auf Development angewendet; PR #51 auf `origin/main` @ `2827d1cb` synchronisiert; lokale Exact-Head-Gates, GitHub Actions und Vercel auf dem Integrations-Head grün; STOPP für unabhängigen Technical-Lead-Re-Review**
Branch: `feat/provider-flight-evidence-s2`
Draft-PR: `#51`
Auftrag: `docs/PROVIDER_READINESS_S2_FLUGNACHWEIS_TASK.md`  
B2-Auftrag: `docs/PROVIDER_READINESS_S2_B2_DIRECT_TABLE_TRUST_FIX_TASK.md`  
Product-Owner-Freigabe: `docs/PROVIDER_READINESS_S2_B2_PRODUCT_OWNER_APPROVAL.md`

## 1. Was S2 ist

S2 hebt die Flug-Kontoübernahme und jede kommerzielle Flug-Persistenz auf dieselbe Trust-Grenze wie Hotels: **Browserdaten dürfen keine kommerzielle Flugwahrheit persistieren.**

S2-B1 schliesst den öffentlichen RPC `reise_anlegen`. S2-B2 schliesst den direkten `trip_items`-Tabellenvertrag für `authenticated`/`anon`.

Kein Mark Ready. Kein Merge von PR #51. Kein Live-Duffel. Keine Provideraktivierung. Keine Secrets. **Keine Production-Migration.** Kein Start von S3.

## 2. Runtime-Head

- Integrations-Exact-Head: `e2fcffde68f3ca5244697741c9a9bfc63a2d8a3d` (`origin/main` @ `2827d1cb` + S2-B2)
- Vorheriger Functional Exact Head: `1b06b28494086ab24569f48e83978f77543dfc89`
- S2-B2-Implementierung: `34a87e9f`
- Vorheriger S2-B1-Head: `f8af2059181e1f47d686893a1b5538441c6e2554`
- Draft-PR: https://github.com/Jetnity/jetnity/pull/51
- PR-Zustand nach Sync: `MERGEABLE` / `CLEAN`, bleibt Draft

## 3. Umgesetzt

- App-Grenze S2 und RPC-Grenze S2-B1 bleiben
- **S2-B2:** BEFORE-Trigger `trip_items_flug_handelsfelder_schuetzen` (ADR-0157)
- Für `kind='flight'` und `current_user in ('authenticated','anon')`: INSERT nullt die fünf Handelsfelder; UPDATE kann sie nicht ändern; `kind`-Wechsel zu `flight` erbt sie nicht
- User-Intake, manueller Buchungsstatus und Foundation-D-Itinerary bleiben
- Hotel/Activity/Mobility/Rental unverändert
- Späterer trusted Write braucht einen getrennten SECURITY DEFINER-Vertrag, kein Client-Flag
- **Main-Sync:** `origin/main` (Account AP-1 `084f7c87`, Account AP-2 `2827d1cb`) ist in den Feature-Branch gezogen. Das ist kein Merge von PR #51 und kein S3.

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
- **Supabase Development:** angewendet. `schema_migrations` enthält `20260824160000` und `20260824180000`. Trigger `trip_items_flug_handelsfelder_schuetzen` vorhanden.
- **Production `qscbgcdmivbbnzrcyegn`:** unverändert. Beide S2-Versionen fehlen. Trigger fehlt. Kein `--produktion`.

Keine Service-Role-, Auth-, MFA-, AAL- oder Capability-Änderung. Tabellengrants unverändert.

## 6. Gates auf Integrations-Head `e2fcffde`

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **1806/1806 pass** (Account-AP-1/AP-2-Tests aus `main` zusätzlich) |
| `db:rechte` / `db:rls` | **pass** |
| `db:sicherheit` | **223/223**, inkl. S2-B1- und S2-B2-Fälle |
| `db:parallelitaet` | **7/7** |
| Typecheck / Lint / Hygiene / API-Schutz / Schema-Bezug | **pass** |
| Production Build | **Exit 0**, 49 App-Routen inkl. Account-Flächen aus `main` |
| Trip-Workspace-UI-Audit | **1014/1014, 0 Fehler, WebKit + Chromium, 8 Viewports** |
| Vercel Preview `4uQEc9GNFnBYqjoxSpSkw7sQ6pow` | **READY/SUCCESS** auf `e2fcffde` |
| GitHub Actions `ci.yml` | **SUCCESS** `32732334063` auf `e2fcffde` |

Vorheriger Actions-Gap: `ci.yml` startete auf `34a87e9f` / `1b06b284` / `1063f279` nicht, weil PR #51 `CONFLICTING` gegenüber `main` war.

## 7. Empfehlung

STOPP für unabhängigen Technical-Lead-Re-Review gegen Integrations-Head `e2fcffde`. Der Review muss S2-B2 plus den `main`-Sync bewerten. Nicht Mark Ready, nicht mergen, nicht S3, Production nicht migrieren.
