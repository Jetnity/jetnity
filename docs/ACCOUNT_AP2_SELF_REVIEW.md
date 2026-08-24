# Jetnity Account AP-2 – Self-Review

Stand: 24. August 2026  
Reviewer: implementierender Agent  
Runtime-Head: `7683503ea001b7212e15c0d00a3cfa1a106082ad`  
Ergebnis: **technisch abgeschlossen für unabhängigen Review – kein Ready, kein Merge**

## Auftragstreue

Der Slice hält `docs/ACCOUNT_AP2_AUTH_UX_TASK.md`. Keine Scope-Erweiterung in AP-3, keine DB, keine Provider-Aktivierung, keine Legal-Erfindung.

## Scope A – OAuth Enablement

- Quelle ist `tomlWert(..., 'auth.external.{google,apple}.enabled') === true`.
- Lesen serverseitig in `oauthFreigabeLesen()`. Client rendert nur die übergebene Freigabe.
- Fehlendes/unklares Flag = keine Schaltfläche.
- Kein Schluss von Env-Namen auf Aktivierung.
- Live-`config.toml` bleibt `enabled = false` für Google und Apple.

## Scope B – `next`

- Eine zentrale Funktion: `erlaubtesNaechstesZiel()`.
- Login, Register, Callback und OAuth-`redirectTo` benutzen sie.
- Erlaubt: `/account`, `/account/...`, `/reisen`, `/reisen/...` inkl. Query/Hash am erlaubten Pfad.
- Verworfen: absolute URLs, `//…`, Backslash, Encoding-/Slash-Tricks, `/admin`, `/account-evil`.
- Default: `/reisen`.

## Scope C – Gates

- `app/(public)/login/page.tsx` und `register/page.tsx` rufen `auth.getUser()` und `anmeldeSeiteZiel()`.
- Ohne User bleibt die Seite stehen.
- Kein neues Auth-Modell, keine MFA/AAL-Änderung, keine Service-Role.

## Scope D – Enumeration

- `registerOeffentlicheFehlercopy()` macht Bestandskonto-Texte öffentlich ununterscheidbar.
- Erfolg und dieser Fall nutzen `REGISTER_NEUTRALE_ANTWORT` ohne „bereits“, „existiert“ oder „gesendet“.
- Fachliche Feldfehler bleiben unterscheidbar.

## Scope E – Gast `/reisen`

- `gastReisenPrimaerCta(gastspeicher.aktiv)` ist die einzige Quelle.
- Mit aktivem Entwurf: primär Fortsetzen, sekundär Neue Reise.
- Ohne Entwurf: kein Fortsetzen-Zustand.
- Kein zweiter Draft-Store, kein automatisches Löschen, kein Guest→Account-Vertragswechsel.

## Scope F – Footer

- `FooterSitzung` rendert `sitzungseintraege()` wie die Navbar.
- Hartes Anmelden/Registrieren im Footer ist entfernt.
- AP-1-Account-Navigation bleibt unverändert (`lib/account/navigation.test.ts` grün).

## Scope G – MFA a11y

- `role="dialog"`, `aria-labelledby`, `aria-describedby`, Label am Codefeld.
- Initialfokus auf das Codefeld, Fokus zurück nach Schliessen.
- Tab bleibt im Dialog; Escape verhindert Schliessen (nur Abbrechen).
- Fehler per `role="alert"` und erneuter Fokus; Trefferflächen `min-h-11`.
- Kein neues MFA-Backend.

## Pflicht-Regressionen

1–8 `next`: `lib/auth/naechstes-ziel.test.ts`  
9–10 OAuth: `lib/auth/oauth-anbieter.test.ts`  
11–12 Gast-CTA: `lib/trips/gast-reisen-cta.test.ts`  
13 Register-Copy: `lib/auth/register-meldung.test.ts`  
14 Gate: `lib/auth/anmelde-gatter.test.ts`  
15 MFA a11y: `lib/auth/mfa-dialog-a11y.test.ts` (Quellvertrag, kein Browser-A11y-Lauf)  
16 AP-1-Navigation: `lib/account/navigation.test.ts` grün  
17 Empty ≠ Error: Account-Übersicht- und `/reisen`-Kontozweig unverändert; Audit 48/48

Nicht behauptet: ein echter Screenreader- oder Real-Device-Test des MFA-Dialogs.

## Legal

Bestehende `/terms`- und `/privacy`-Links bleiben. Keine neuen rechtlichen Texte.

## Rest-Risiken

- `next=/account` umgeht den `/reisen`-Übernahmeort, bis die Reisen-Seite geöffnet wird.
- Footer- und Navbar-Chrome lesen die Sitzung weiter per Client-`getSession()`; Autorität der Login-/Register-Seiten ist `getUser()`.
- Preview wurde remote als success gemeldet, nicht zusätzlich manuell im Browser abgeklickt.

## Empfehlung

Unabhängiger Technical-Lead-Review von PR #48. Danach erst Product-Owner-Entscheidung über Ready/Merge. AP-3 nicht starten.
