# Auth Confirmation Callback 1 — Status

Date: 2026-09-27
Status: **REVIEW CORRECTIONS R1/R2 / AWAITING INDEPENDENT TECHNICAL-LEAD REVIEW / NO PASS**
Parent: #582, bleibt offen
Draft PR: https://github.com/Jetnity/jetnity/pull/583
Branch: `fix/auth-confirmation-callback-1`
Baseline main laut Auftrag: `2ae99dc0d37e325fe6a021d6767aca18d24ad4f3`
Task-Scaffold auf dem Branch: `82b4f44b9924df8a523cc3f55a38a2faad095334`
Writer: **Jetnity auth confirmation callback 1**, Generation **1**
Session: `bc-bdb579ac-f2b5-452e-8e48-0aeb403f4c4d`
Session URL: https://cursor.com/agents/bc-bdb579ac-f2b5-452e-8e48-0aeb403f4c4d
Reviewed head, gates do not carry forward: `716d708d1673e2e96c4028d82332a633baf677a4`
Implementation of R1/R2: `27e7587531928b34141e5451354efd2e826c94c1`
`origin/main` re-read at this handoff: `2ae99dc0d37e325fe6a021d6767aca18d24ad4f3` (unchanged)
Task model pin: `cursor-grok-4.6-high-fast` (stale for a new session; Technical Lead correction below)
Actual model: `grok-4.7-high-fast`. Same session, no switch, no new agent.
UI title: `Auth callback PKCE conflict` (not renamed; no programmable rename was used)

Cursor does not mark Ready, does not merge, and does not start a follow-up slice.

## Was der Fix tut

`lib/auth/callback-abschluss.ts` ist der einzige Eigentümer des PKCE-Tauschs im Callback.

- Der Verifier wird gelesen, bevor der Browser-Client entsteht.
- Hat die automatische Initialisierung den Code schon verbraucht, gibt es keinen zweiten Tausch.
- War der Client schon vorher da und der Code liegt noch in der Adresse, tauscht nur der explizite Aufruf.
- Danach wird `code` aus der Adresse entfernt, damit ein Neuladen nicht wie ein Replay aussieht.
- Recovery (`PASSWORD_RECOVERY` oder Hash `type=recovery`) geht nach `/auth/update-password`.
- Jedes andere Ziel bleibt bei `erlaubtesNaechstesZiel`.
- `detectSessionInUrl` am gemeinsamen Browser-Client bleibt unverändert.
- Fehler sind feste deutsche Sätze. Code, Verifier und Rohtext aus der URL erscheinen nicht.
- Nur ein noch laufender Versuch derselben Form wird geteilt. Danach wird er verworfen. Der Schlüssel enthält keinen Code und keine Hash-Tokens.
- `lib/supabase/client.ts` merkt vor dem Konstruktor nur einen Boolean, wenn die Adresse einen Code hat und der Verifier eine Wiederherstellung ist. Eine schon abgeschlossene oder noch laufende Initialisierung bleibt dadurch auf `/auth/update-password`. Eine spätere fremde Sitzung übernimmt dieses Ziel nicht.
- Der 600-ms-Timer wird beim Unmount gelöscht.

## Nachweis an den gesperrten Bibliotheken

Versionen: `@supabase/ssr` 0.6.1, `@supabase/supabase-js` 2.57.2, `@supabase/auth-js` 2.71.1.

Vor dem Fix, gleiche Bibliotheken, kein Netz nach aussen: zwei PKCE-Aufrufe. Der erste trägt einen Verifier, der zweite einen leeren. Die Fehlermeldung ist `invalid request: both auth code and code verifier should be non-empty`. Die Sitzung aus dem ersten Tausch bleibt, der Code ist aus der URL entfernt. Das erklärt den beobachteten ersten Fehler und den Erfolg nach dem Neuladen. Es ist kein Mitschnitt des iPhones.

Nach dem Fix: ein PKCE-Aufruf, Ziel gesetzt, kein zweiter Tausch. Der alte zweite Tausch bleibt als eigener Test rot, wenn man ihn wieder so aufruft.

## Gates

| Befehl | Ergebnis |
| --- | --- |
| `node --import tsx --test lib/auth/callback-abschluss.test.ts` | 24 pass, 0 fail |
| `npm test` | 3968 pass, 0 fail, 704 suites |
| `npm run typecheck` | exit 0 |
| `eslint` auf den geänderten TS-Dateien | exit 0 |
| `npm run build` | exit 0, Route `/auth/callback` statisch |
| `node scripts/exporte.mjs` | 0 Exporte ohne Aufrufer |
| `node scripts/erreichbarkeit.mjs` | 0 verwaist |
| `node scripts/api-schutz.mjs` | 12 Admin-Routen, alle geschützt |
| `node scripts/pakete.mjs` | 0 ungenutzte Abhängigkeiten |
| `node scripts/db/verwendung.mjs --pruefen` | bestanden, keine Schemaänderung |
| `git diff --check` | bestanden |
| `npm run auth:pruefen` | nicht bestanden und nicht als bestanden gewertet. Abbruch: `SUPABASE_PROJECT_REF ist weder Projekt (401) noch Branch (401)`. Keine hosted Änderung. |

## Review-Korrektur

Technical-Lead-Review von Head `716d708d1673e2e96c4028d82332a633baf677a4`: CHANGES REQUIRED, R1 und R2.

- R1: abgeschlossene Ergebnisse bleiben nicht mehr autoritativ. Derselbe Code nach geleertem Cookie-Glas scheitert ehrlich. Eine code-freie Adresse ohne Sitzung, danach eine neue Sitzung, liest `getSession` neu.
- R2: `initialize()` vor dem Helfer, Verifier und Code schon weg, Ziel ist `/auth/update-password`. Dieselbe Lage, solange der Tausch noch läuft und der Verifier zwischendurch schon fehlt. Eine frühe Anmeldung ohne Wiederherstellung bleibt auf dem erlaubten `next`. Nach Abmelden und einer neuen Sitzung wird die Wiederherstellung nicht übernommen.
- Modell: der 4.6-Pin dieses Tasks war für eine neue Session veraltet. Diese bestehende Session bleibt `grok-4.7-high-fast`. Kein neuer Agent.

Lokaler Browser auf dem schon laufenden Dev-Server `localhost:3000`, ohne `code` und ohne Mail: der explizite Fehler zeigt den deutschen Abbruchsatz, nicht `raw-token-abcdef`, und bleibt auf localhost. Der leere Callback zeigt den Satz, dass der Link keine Anmeldung enthält. Der gültige Erstlade-Tausch ist nur gegen die gesperrten Bibliotheken mit einem nachgebauten Token-Endpunkt geprüft, nicht im Browser gegen ein echtes Projekt.

## Grenzen

- Der autorisierte physische Erstlade-Test ist nicht gelaufen und ist kein PASS.
- Ein Netzfehler während des automatischen Tauschs löscht über das SDK den Verifier. Angezeigt wird der Verbindungsfehler. Ein neuer Versuch braucht einen neuen Link.
- Keine hosted Änderung, keine weitere echte Mail, keine DB, kein Secret, keine neuen Kosten.
- Traveller-Kontext ist hier nicht beteiligt: der Callback erhebt keine Staatsangehörigkeit und kein Dokument.

## Nächster Schritt

Unabhängiger Technical-Lead exact-head Review dieses Drafts. Danach, nur mit ausdrücklicher Freigabe, der physische Erstlade-Test. #582 nicht schliessen.
