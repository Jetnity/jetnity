# Passkeys Dev 1 — Self-Review

**Stand:** 18.11.2026  
**Verdikt des Autors:** `REVIEW_REQUIRED`  
**Live-Passkeys:** `BLOCKED_OWNER_GATE`  
**Dieses Self-Review ist kein Technical-Lead-PASS.**

## Scope

Geschrieben wurden der fail-closed Port, die Login- und Konto-Anbindung und die drei Nachweisdateien. Nicht geschrieben wurden `package.json`, `package-lock.json`, `supabase/**`, `lib/supabase/client.ts`, Admin-Guards, MFA-Step-up-Logik und alle gesperrten Official-Truth-/Einreise-/CI-Pfade.

Der globale Browser-Client bleibt ohne `experimental.passkey`. Ein zweiter SSR-Client wäre wegen des Singletons in `@supabase/ssr` `0.6.1` entweder wirkungslos oder ein eigener Cookie-Client. Beides wäre ein Session-Vertrag. Deshalb STOP vor dem SDK-Schritt.

## Auth-Sicherheit

- Server-Flag `false` gewinnt vor Browser-WebAuthn. Der bestehende Hinweis auf Face ID / Touch ID bleibt.
- Ohne die fünf Methoden `registerPasskey`, `signInWithPasskey`, `passkey.list`, `passkey.update` und `passkey.delete` gibt es keine Schaltfläche.
- Origin muss `https` und `jetnity.com` oder eine Subdomain davon sein. Preview- und Loopback-Origins bleiben zu.
- Registrierung liest `getUser` und lehnt anonyme sowie unbestätigte Konten ab.
- `signInWithPasskey` wird ohne eigene `authenticatorSelection` aufgerufen. Die Auswahl bleibt die der offiziellen Bibliothek, sobald sie existiert.
- Nach einem erfolgreichen Fake-Login mit `currentLevel=aal1` und `nextLevel=aal2` ist das Ergebnis `totp_step_up`. Der Port schreibt `currentLevel` nicht.
- Ist die AAL-Lesung fehlerhaft, ist das Ergebnis `aal_unbekannt` und `onWeiter` läuft nicht.
- Entfernen ohne zweite Bestätigung oder mit einer Kennung außerhalb der geladenen Liste ruft `delete` nicht auf.
- Nutzersätze kommen aus dem Katalog. Rohmeldungen, Token und E-Mail-Adressen werden nicht übernommen.
- Kein privater Schlüssel, kein zusätzlicher Passkey-Speicher, kein Service-Role-Client.

## Was ein Reviewer nachsehen sollte

1. `getServerSnapshot` der Login-Anzeige ist absichtlich immer geschlossen. Die Schaltfläche kann erst nach der Client-Prüfung erscheinen, und auch dann nur bei offenem Gate.
2. `PasskeyVerwaltung` lädt im nächsten Task, nicht im Render-Commit. Solange das Gate zu ist, wird die Komponente von `SecurityMFA` nicht eingehängt. Der Browser-Test mit `passkeysServerAktiviert={false}` sah weiterhin keine Passkey-Schaltfläche.
3. Ein späterer SDK-Bump ist kein stiller Folgecommit dieses Autors. Er braucht eine eigene Session-/TOTP-Regression und die Owner-Freigabe für den Singleton-Opt-in.
4. Next.js `16.4.1` hat beim Build einen bekannten Security-Hinweis gedruckt. Dieser Slice aktualisiert Next nicht.

## Evidence-Grenzen

| Behauptung | Grad |
| --- | --- |
| Lock `2.119.2` mit `registerPasskey` und `signInWithPasskey` | lokal gelesen. Server-Flag bleibt aus |
| `config.toml` Passkeys aus | gelesen, Datei unverändert |
| AAL-Step-up im Fake | MOCK_PASS |
| Security-Karten ohne Passkey-Schaltfläche | Playwright-Harness, 11/11, synthetische Auth |
| Typecheck und zweiter Production-Build | lokal Exit 0 |
| CI [44384931535](https://github.com/Jetnity/jetnity/actions/runs/44384931535) auf `d993dbf3b` | FAILURE, nur `check:exports`; die übrigen sieben Prüffamilien dieses Laufs waren erfolgreich |
| SDK | `@supabase/supabase-js` `2.119.2`, SSR bleibt `0.6.1`, eine Browser-Session, Server-Flag aus |
| Schreibzugang | Passwort oder frisches TOTP/AAL2 im Port. `getUser()` allein schreibt nicht |
| Login-Abbruch | `signOut({ scope: 'local' })` bei AAL-Fehler, Challenge-Fehler und Dialog-Schliessen |
| Echter WebAuthn-Dialog | `HOSTED_E2E_NOT_RUN` |
| Gehostete Supabase-Auth-Config | nicht gelesen; Repo-Config bleibt die fail-closed Authority |

## Stop

Kein Ready aus dieser Datei.
