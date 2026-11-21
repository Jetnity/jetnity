# Passkeys Dev 1 — Handoff

**Stand:** 19.11.2026  
**An:** ChatGPT / Technical Lead, unabhängiger Exact-Head-Review  
**Verdikt:** `REVIEW_REQUIRED`  
**Live-Passkeys:** `BLOCKED_OWNER_GATE`

## Session

- Agent: Jetnity Passkeys Dev 1
- Generation: 1
- Session: https://cursor.com/agents/bc-11e8ce25-4a2a-494a-8952-f1f2a75642a2
- Modell: `grok-4.7-high-fast`, nicht Auto
- UI-Titel gesetzt: ja, `Jetnity Passkeys Dev 1`
- Branch: `feat/passkeys-dev-1-20261118`
- PR: Draft https://github.com/Jetnity/jetnity/pull/1240
- Issue: https://github.com/Jetnity/jetnity/issues/1239
- Übernommener Head: `cb32b49989f345536047b00fc218bb7138d8e73b`
- Baseline: `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5`
- Modus: `NORMAL`

`86dfd2785d89d5630e1c397fd3880f7ad5687a5f` hatte CI [44403042174](https://github.com/Jetnity/jetnity/actions/runs/44403042174) SUCCESS. Dieser Stand ist nach dem Merge von `main@9f065a555754c76c64a4f02868797c70f1f49310` und dem SDK-/Step-up-Commit historical. Der Review-Head ist der neue Branch-Tip. Seine CI steht im PR-Kommentar. Jeder neuere Commit macht diesen Stand ungültig.

## Ergebnis

Der Draft ist fail-closed. Es gibt keine Live-Passkey-Anmeldung und keine Behauptung, dass Face ID oder Touch ID genügen. `supabase/config.toml` schaltet Dev-Passkeys ein. Production wird davon nicht geschrieben. Installiert sind `@supabase/supabase-js` und Auth-JS `2.119.2` im bestehenden SSR-Singleton `0.6.1`, mit einmaligem `experimental.passkey`. Schreiben braucht einen frischen Passwort- oder TOTP/AAL2-Beweis. Ein abgebrochener Login-Step-up ruft `signOut` auf.

Passwort, TOTP und Admin-AAL2 bleiben die bestehenden Pfade. Ein Passkey, sobald das Gate einmal offen wäre, wäre ein erster Faktor und müsste danach denselben TOTP-Step-up durchlaufen. Bricht dieser Dialog ab oder scheitert die lokale Abmeldung, bleibt die AAL1-Sitzung unbestätigt und die Weiterleitung aus. Der Dev-Guard-Alarm von [44595752922](https://github.com/Jetnity/jetnity/actions/runs/44595752922) gehört nicht in diesen Fix und wird nicht umgangen.

## CI und Preview

Die CI von `d993dbf3b` ist historical und rot. Die CI des korrigierten Heads ist erst nach dem Push das Gate und wird im PR-Kommentar mit ihrem echten Ergebnis genannt. Eine Vercel-Preview auf `*.vercel.app` ist kein gültiger RP-Origin für `jetnity.com` und kein Passkey-Smoke.

`HOSTED_E2E_NOT_RUN`.

## Nächster begrenzter Review-Schritt

1. Technical Lead liest den exakten PR-Head, nicht `cb32b49989f345536047b00fc218bb7138d8e73b`.
2. Prüfen, dass der Diff weder `supabase/**` noch AAL-Guards oder fremde PRs enthält. Das Package-Diff ist der bestellte Sprung auf `2.119.2`. Die Official-Truth-Pins nennen nur diese neue Paketidentität.
3. Die MOCK-Tests als MOCK lesen. Sie ersetzen keinen Chrome-/Safari-/Android-/iOS-Smoke.
4. Live-Enable bleibt ein getrenntes Owner-Gate: SDK plus SSR-Nachweis, Dev-Server-Enable, feste RP-ID `jetnity.com`, Origins nur unter dieser Domain, danach erst ein bestätigtes Dev-Konto. Production bleibt aus.

## Nicht angefasst

Einreise-Inhalte, Datenbank, Migrationen, CI-Workflows, Secrets, Vercel, Supabase-Apply, Production, PR #1238 und PR #1235. Die Official-Truth-Beweise sind nicht umgeschrieben. Nur die Paket- und Loader-Identität folgt dem bestellten SDK-Stand `2.119.2`.

## Stop

STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW. Cursor setzt nicht Ready, mergt nicht, startet keinen Folgeslice und keinen weiteren Agenten.
