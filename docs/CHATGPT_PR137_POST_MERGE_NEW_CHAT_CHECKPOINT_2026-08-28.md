# Jetnity – PR #137 Post-Merge New-Chat Checkpoint

Stand: 28. August 2026

Status: **PR #137 / AP-5-S2 ist nach unabhängigem Technical-Lead-Re-Review auf `main` integriert. Issue #136 ist zum Zeitpunkt dieses Stamps noch OPEN und sollte als completed geschlossen werden. Kein automatischer Folgeslice. Kein S3–S5. Live-Evidence gewinnt immer.**

> Dieser Checkpoint superseded für den S2-Integrationsstand die Pre-Merge-/Draft-Aussagen in den S2-Author-Status-/Handoff-Dateien. Diese älteren Dateien bleiben historische Evidence ihres damaligen Zeitpunkts und werden nicht gelöscht.

## 1. Exakter integrierter Stand

- Repository: `Jetnity/jetnity`
- PR: **#137 – AP-5-S2 – eingeloggte Passwortänderung über Reauthentication**
- Issue: [#136](https://github.com/Jetnity/jetnity/issues/136) – live noch **OPEN**; Merge ist erfolgt, Close steht aus
- Author-Agent: `Cursor-Agent: Account plattform audit vorbereitung 10`
- Vor-Merge `main`: `0256905cee3e6705156ce642839983daf8b0709a` (PR #135)
- Review-Fix-Ausgangspunkt: Technical-Lead Review `5050962955` (**CHANGES REQUIRED**) auf `d0eac240`
- Final reviewed Exact Head: `e4cb805a2313fd537aeb9f1f65a8de436301d258`
- Merge-Base: `0256905cee3e6705156ce642839983daf8b0709a`
- Ahead / Behind vor Merge: `8 / 0`
- Independent Technical-Lead PASS: Review `5051115258` auf exakt `e4cb805a`
- GitHub konnte keinen formalen `APPROVE`-State speichern, weil verbundener Owner und PR-Autor derselbe Account sind; der COMMENT-Review ist die kanonische unabhängige Technical-Lead-Freigabe-Evidence.
- Exact-Head GitHub Actions: Run `33170816296` SUCCESS auf exakt `e4cb805a`
- Exact-Head Vercel Preview: `dpl_FfPQYnBjypHCwi4puvMLDNir8dEA` READY
- Inline Review Threads vor Merge: `0`
- Merge-Commit auf `main`: `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5`
- `main` nach Merge live verifiziert auf exakt `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5`
- `main` Branch Protection bleibt live `protected=false`; nicht still geändert.

Post-Merge Push-Evidence auf exakt `f11a1753`:

- GitHub Actions Run `33171851756` SUCCESS
- Jobs: Typecheck, Lint & Build SUCCESS; Auth-Konfiguration gegen config.toml SUCCESS
- Vercel Production Inspector `dpl_A7BMLsQoZwx8Y4qEdMRCsdyPmRGg` READY
- GitHub Production-Deployment `6141244223` success

## 2. S2 – integrierter Vertrag

Signed-in Passwortänderung auf `/account/security`:

1. Authentifizierte Sitzung über `getUser()`, nicht `getSession()`.
2. Explizite Nutzeraktion → `reauthenticate()` → OTP/Nonce über die bestehende Supabase-Authority.
3. Nutzer sendet Nonce + neues Passwort.
4. `updateUser({ password, nonce })`.
5. Erfolg erst nach erfolgreichem `updateUser`.
6. Truth-States: `idle` / `requesting_code` / `code_sent` / `verifying` / `updating` / `success` / `error` / `unsupported` / `unavailable`.
7. `session_required` nur bei belegter Session-Evidence (401/session-missing oder `data.user === null` ohne Fehler). `getUser()`-Netzfehler bleiben `network`. Unbekannte/5xx bleiben `unknown`.
8. Passwortregel und HIBP bleiben `lib/auth/passwort-richtlinie.ts`.
9. Recovery (`/auth/update-password`) bleibt eigene Authority: `updateUser({ password })`, kein Nonce, weiter `getSession()`.

Unverändert / ausdrücklich Non-Scope:

- kein Current-Password-Feld / kein Current-Password-Vertrag
- kein Auth-Config-Push
- kein Consumer-AAL2
- kein Logout-/Sessionlisten-Umbau (S3/S5)
- kein MFA-Step-up (S4)
- keine Migration / RLS / Ownership / Identity
- kein C2 / REVOKE / SECURITY DEFINER
- kein Provider / TW-8 / Search / Homepage / Native

## 3. Residuals – nicht in einem Folgeslice still mischen

- Recovery-UI bleibt für bereits eingeloggte Sessions mehrdeutig; die zwei Authorities bleiben getrennt
- Login-MFA bleibt abbrechbar
- Sessionliste bleibt ungebaut / `unsupported`
- Kein authentifizierter Browser-/Real-Device-Nachweis für die In-Account-Passwortänderung
- Issue #136 nach Merge noch nicht geschlossen
- `main` Branch Protection `protected=false`

## 4. Agent-Rotation

`Cursor-Agent: Account plattform audit vorbereitung 10` ist mit AP-5-S2 plus diesem Continuity-Stamp abgeschlossen und darf für eine neue logische Arbeitseinheit nicht wiederverwendet werden.

Falls nach erneuter Live-Rekonstruktion ein neuer Account-Slice tatsächlich zulässig und sinnvoll gestartet wird, muss der Rotation Standard neu geprüft werden. Die nächste frische Account-Generation wäre voraussichtlich `Cursor-Agent: Account plattform audit vorbereitung 11`; das ist **keine automatische Startfreigabe** für S3–S5.

## 5. Nächster Technical-Lead-Schritt

Kein AP-5-S3/S4/S5 wird allein durch den Merge von S2 automatisch gestartet.

Zuerst:

1. Issue #136 als completed schließen, sobald dieser Continuity-Stand akzeptiert ist.
2. Draft-PR #138 (dieser Docs-only-Stamp) unabhängig reviewen, Ready setzen und mergen, wenn er scope-treu ist.
3. Live rekonstruieren: aktuelles `main`, offene PRs/Issues, Binding Build Order, Account-/Traveller-/Provider-Gates, Product-Owner-Sondergates, Parallelkollisionen, P0–P3.

Erst danach darf entschieden werden, ob AP-5-S3 oder ein anderer Build-Order-Schritt als Nächstes dran ist.
