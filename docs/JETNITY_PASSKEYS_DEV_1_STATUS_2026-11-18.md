# Passkeys Dev 1 — Status

**Stand:** 19.11.2026  
**Verdikt:** `REVIEW_REQUIRED` für diesen fail-closed Draft. Live-Passkeys: `BLOCKED_OWNER_GATE`.  
**Nicht:** `READY`. Kein Merge. Keine Live-Funktion. Kein Folgeslice.

## Identität

| Feld | Wert |
| --- | --- |
| Logischer Agent | Jetnity Passkeys Dev 1 |
| Generation | 1, eigener Workstream |
| Session | https://cursor.com/agents/bc-11e8ce25-4a2a-494a-8952-f1f2a75642a2 |
| Modell | `originalModelName=grok-4.7-high-fast`, nicht Auto |
| UI-Titel | auf `Jetnity Passkeys Dev 1` gesetzt |
| Auftrag | `docs/JETNITY_PASSKEYS_DEV_1_TASK_2026-11-18.md` |
| Issue | [#1239](https://github.com/Jetnity/jetnity/issues/1239) |
| PR | Draft [#1240](https://github.com/Jetnity/jetnity/pull/1240) |
| Branch | `feat/passkeys-dev-1-20261118` |
| Übernommener Head | `cb32b49989f345536047b00fc218bb7138d8e73b` |
| Baseline | `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5` |
| Modus | `.jetnity/operating-mode.json` = `NORMAL` |
| Früherer Head | `d993dbf3b9f05cbecb7ce42ce1f922c3d2482bee`, CI [44384931535](https://github.com/Jetnity/jetnity/actions/runs/44384931535) FAILURE an `npm run check:exports` |
| Review-Head | der Branch-Tip nach dem Main-Merge und dem SDK-/Step-up-Stand. Die SHA und die frische CI stehen im PR-Kommentar. `86dfd2785d89d5630e1c397fd3880f7ad5687a5f` ist historical. |

`main` war bei der Übernahme `f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5`. Kein Rebase. Main-CI [44333651972](https://github.com/Jetnity/jetnity/actions/runs/44333651972) ist SUCCESS auf dieser SHA. Das ist die Baseline, nicht das Gate dieses PR-Heads.

## Kompatibilitätsmatrix

| Prüfung | Beobachtet | Folge |
| --- | --- | --- |
| `@supabase/supabase-js` Lock | `2.119.2` | über dem offiziellen Minimum `2.105.0`; kein Sprung auf 3.x |
| `@supabase/auth-js` Lock | `2.119.2` | `registerPasskey` und `signInWithPasskey` sind vorhanden. Der Client ignoriert `experimental.passkey`, das Flag steht einmal am Singleton |
| `@supabase/ssr` Lock | `0.6.1`, Peer `^2.43.4` | `2.119.2` liegt im Peer-Bereich. Es gibt weiter nur einen Browser-Client |
| SSR-Browser-Client | `createBrowserClient` cached ein Singleton, sobald `isSingleton` fehlt | `experimental.passkey: true` steht beim ersten Aufruf in `lib/supabase/client.ts` |
| Server | `supabase/config.toml` `[auth.passkey] enabled = false` | unverändert, nur gelesen |
| Offizielle Doku, gelesen 18.11.2026 | [Passkeys](https://supabase.com/docs/guides/auth/passkeys), [Changelog](https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta) | experimentell, Opt-in `auth.experimental.passkey`, separates Server-Enable, RP-ID und Origins |

Der Sprung von `2.57.2` auf `2.119.2` zieht `auth-js`, PostgREST, Realtime und Storage im Lock mit. Es bleibt ein Client und ein Cookie-Vertrag. Der Port ruft die Methoden nur, wenn das Laufzeitobjekt sie hat. Das Server-Flag bleibt aus, deshalb gibt es weiter keine Live-Schaltfläche. PKCE-Wiederherstellung erkennt den neuen Speicherwert `recovery` und den alten Wert `PASSWORD_RECOVERY`. Ein fehlender Verifier wird lokal abgelehnt und nicht mehr mit leerem Verifier gesendet.

## RP-ID und Origin, nur geplant

Geplante RP-ID: `jetnity.com`. Kein Schreibzugriff auf Config, Dashboard oder Vercel.

| Origin | Für RP `jetnity.com` |
| --- | --- |
| `https://jetnity.com` | hostname passt |
| `https://www.jetnity.com`, `https://dev.jetnity.com` | Subdomain passt |
| `http://localhost`, `http://127.0.0.1` | nein; Loopback ist keine Subdomain von `jetnity.com` |
| `*.vercel.app` | nein |
| `https://eviljetnity.com`, `https://jetnity.com.evil.example` | nein |

Eine spätere Änderung der RP-ID macht bereits registrierte Passkeys unbrauchbar. Production-Origins und eine eigene Dev-Origin unter `jetnity.com` müssen vor der ersten Registrierung feststehen. Vercel-Preview ist kein Passkey-Origin.

## Was der Draft tut

Passwort-Login, TOTP-Dialog und Admin-AAL2-Guard sind unverändert verdrahtet. Eine Passkey-Schaltfläche erscheint nur, wenn Server-Flag, SDK-Methoden, Browser-WebAuthn und eine zur RP-ID passende HTTPS-Origin gleichzeitig wahr sind. Heute ist das Server-Flag aus. Login und `/account/security` bleiben deshalb ohne Handlungs-Schaltfläche. Der Hinweis „nicht verfügbar“ steht nur dort, einmal, auf Deutsch oder Englisch.

Der Port delegiert Registrierung, Login, Liste, Umbenennen und Entfernen an die offizielle Schnittstelle, sobald sie existiert. Login ohne Argumente, also ohne eigene Authenticator-Auswahl. Danach liest derselbe `brauchtLoginTotpStepUp`-Vertrag das AAL. `currentLevel` wird nicht auf `aal2` geschrieben. Fehlt die AAL-Lesung, gibt es kein Weiter. Entfernen braucht die gerade geladene Kennung, ein bestätigtes Konto und eine zweite Bestätigung. Namen mit `@` oder über 120 Zeichen werden abgelehnt. Rohmeldungen und E-Mail-Adressen gehen nicht in die UI.

## Tests dieser Sitzung

`MOCK_PASS`. `HOSTED_E2E_NOT_RUN`. Kein Auth-Write, kein Owner-Login, kein echter WebAuthn-Dialog.

```text
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/auth/passkey-faehigkeit.test.ts lib/auth/passkey-port.test.ts lib/auth/passkey-ui.test.ts
```

18 Tests, 18 bestanden.

Dieselbe Form zusätzlich für `lib/auth/account-security-lage.test.ts`, `account-security-fehler.test.ts`, `ap5-s1-security-ui.test.ts`, `account-security-premium-ux-1.test.ts`, `ap5-s4-mfa-step-up.test.ts`, `mfa.test.ts`, `admin-aal-wiring.test.ts`, `lib/localization/account-security-display-3/catalog.test.ts`, `display.test.ts`, `lib/next/request-api-compat.test.ts`: bestanden.

`lib/localization/account-security-display-3/browser.test.ts`: 11/11, darunter die bestehenden Karten mit deaktivierten Passkeys und ohne Passkey-Schaltfläche.

`npx tsc -p tsconfig.json --noEmit`: Exit 0.  
`npx eslint` auf den berührten Dateien: Exit 0.  
`npm run build`: der erste Lauf hat nach erfolgreichem Compile wegen eines Next.js-Security-Hinweises mit Exit 1 aufgehört. Der Wiederholungslauf endete Exit 0 und wiederholt denselben Hinweis. Next bleibt `16.4.1`. Kein Upgrade in diesem Slice.

`d993dbf3b9f05cbecb7ce42ce1f922c3d2482bee` ist historical. Job Repository verification meldete zwei Exporte ohne Aufrufer: `PASSKEY_SDK_MINIMUM` und `passkeyEintragLesen`. Die Konstante hatte keinen Leser und ist entfernt. Das Minimum `2.105.0` bleibt in dieser Statusdatei als gelesene Herstellergrenze. `passkeyEintragLesen` bleibt die interne Normalisierung und ist nicht mehr exportiert. Gate, TOTP-Step-up und Tests sind dieselben.

CI [44588883820](https://github.com/Jetnity/jetnity/actions/runs/44588883820) auf `098e3baf98654c694f338ad233d4bb7a52b482b1` ist FAILURE und gilt nicht für den nächsten Head. Der Auth-Callback folgt dem neuen PKCE-Marker `recovery`. Die Settings-Browser-Prüfung ersetzt das dokumentierte `process.env.SUPABASE_SECRET_KEY` im Bundle. Die Official-Truth-Identität nennt `2.119.2` und die neuen Paket-Hashes. Beweislogik, SQL und historische Evidence-JSON bleiben stehen.

Nicht gelaufen und deshalb nicht grün genannt: die frische GitHub-CI dieses Heads, Hosted-Preview-Login, echtes WebAuthn auf Chrome, Safari, Android oder iOS.

## Nicht angefasst

`supabase/**`, Migrationen, Rollen, RLS, AAL2-Guards, CI-Workflows, Secrets, Vercel, Production, Einreise-Inhalte, `ROADMAP.md`, `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md`, `AGENTS.md`, PR #1238, PR #1235. Official-Truth-Beweise sind nicht umgeschrieben. Nur die Paket- und Loader-Identität folgt `2.119.2`.

## Owner-Schritt, bevor irgendetwas live sein kann

1. Technical Lead prüft diesen exakten Head und seine frische CI.
2. Getrennt: Dev-Auth-Enable, RP-ID `jetnity.com`, Origins nur `https://jetnity.com` und eine ausdrücklich gewählte `https://*.jetnity.com`-Dev-Origin. Kein `*.vercel.app`. Das Server-Flag bleibt bis dahin aus.
3. Danach ein echter Dev-Smoke mit bestätigtem Konto, Abbruch, abgelaufener Challenge, vorhandenem Credential und TOTP-Step-up. Production bleibt aus, bis das ein eigenes Gate ist.

## Stop

STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW. Cursor setzt nicht Ready, mergt nicht, startet keinen Folgeslice und keinen weiteren Agenten.
