# Passkeys Dev 1 — Handoff

**Stand:** 18.11.2026  
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

Der Review-Head ist der Branch-Tip nach dem Commit dieser Lieferung. Die SHA steht im PR-Kommentar. Jeder neuere Commit macht diesen Stand ungültig.

## Ergebnis

Der Draft ist fail-closed. Es gibt keine Live-Passkey-Anmeldung und keine Behauptung, dass Face ID oder Touch ID genügen. `supabase/config.toml` bleibt `enabled = false`. Das installierte SDK `2.57.2` kann die offizielle API nicht ausführen. Ein Upgrade wurde nicht vorbereitet, weil der SSR-Singleton und der Sprung der Auth-Bibliothek in diesem Slice nicht als kompatibel beweisbar sind.

Passwort, TOTP und Admin-AAL2 bleiben die bestehenden Pfade. Ein Passkey, sobald das Gate einmal offen wäre, wäre ein erster Faktor und müsste danach denselben TOTP-Step-up durchlaufen.

## CI und Preview

CI und Preview des Review-Heads starten mit dem Push. Bis dahin kein CI-PASS und kein Preview-PASS. Eine Vercel-Preview auf `*.vercel.app` ist auch danach kein gültiger RP-Origin für `jetnity.com` und darf nicht als Passkey-Smoke gelten.

`HOSTED_E2E_NOT_RUN`.

## Nächster begrenzter Review-Schritt

1. Technical Lead liest den exakten PR-Head, nicht `cb32b49989f345536047b00fc218bb7138d8e73b`.
2. Prüfen, dass der Diff weder `supabase/**` noch Packages, AAL-Guards oder fremde PRs enthält.
3. Die MOCK-Tests als MOCK lesen. Sie ersetzen keinen Chrome-/Safari-/Android-/iOS-Smoke.
4. Live-Enable bleibt ein getrenntes Owner-Gate: SDK plus SSR-Nachweis, Dev-Server-Enable, feste RP-ID `jetnity.com`, Origins nur unter dieser Domain, danach erst ein bestätigtes Dev-Konto. Production bleibt aus.

## Nicht angefasst

Official Truth, Einreise, Readiness, Datenbank, Migrationen, CI, Secrets, Vercel, Supabase-Apply, Production, PR #1238 und PR #1235.

## Stop

STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW. Cursor setzt nicht Ready, mergt nicht, startet keinen Folgeslice und keinen weiteren Agenten.
