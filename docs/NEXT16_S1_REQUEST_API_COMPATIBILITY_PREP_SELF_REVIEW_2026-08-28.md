# Jetnity – Next 16 Compatibility Prep S1 Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Cursor-Agent: Jetnity framework compatibility 1`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: `docs/NEXT16_S1_REQUEST_API_COMPATIBILITY_PREP_TASK_2026-08-28.md` auf Draft-PR #150 / Branch `feat/next16-s1-request-api-compat-prep-2026-08-28`.

Geprüft gegen den tatsächlichen Diff zu `origin/main @ 2fdf8a18`:

- Factories + alle gefundenen Caller
- Guest-Quota-Cookie
- identifizierte Request-API-Pages
- neue/angepasste Tests
- keine `package.json`-/Lockfile-Änderung
- kein `middleware.ts`
- kein `supabase/migrations`

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Bleibt irgendeine Factory synchron? | Nein. Alle drei plus Alias sind `async` mit `await cookies()`. |
| Wird irgendwo eine Factory-Promise als Client benutzt? | Nein. Source-Scan-Test und manuelle Inventur: jeder Aufruf hat `await`. Default-Parameter in `flughafenReferenzLesen` entfernt. |
| Wurde Cookie-Semantik verändert? | Nein. RSC no-op `set`/`remove`; mutable `set`/`delete`-Fallback unverändert. Bestehendes `@ts-ignore` für `delete` nicht neu. |
| Wurde Service-Role ausgeweitet? | Nein. `modelldienst()` bleibt cookie-los, nicht exportiert, nur Kontingent-RPCs. |
| Kann ein Quota-Fehler fail-open werden? | Nein. Fehlender Dienst / fehlgeschlagene RPC bleibt `{ ok: false }`. |
| Wurde `jetnity_gast` verändert? | Nein. Name, httpOnly, sameSite=lax, path=/, 30 Tage, Production-`secure`, 32 Hexzeichen. Ungültige Kennungen werden ersetzt. |
| Wurde `/planen` auf Truthy-Params verwässert? | Nein. `Object.hasOwn` bleibt. Await liefert dasselbe Objekt an `planenRobots`. |
| Geht Login/Register `next` noch durch `anmeldeSeiteZiel`? | Ja. Admin-MFA weiter durch `erlaubtesAdminZiel`. |
| Wurde `[tripId]` Guest-vs-Account verändert? | Nein. Nur `await` vor derselben `istKontoKennung` / `reiseLaden`-Verzweigung. |
| Wurde `unauthorized` Copy-Pfad verändert? | Nein. `grund === 'lookup-failed'` nach Await. |
| Wurden Route-Handler-`new URL(req.url).searchParams` umgebaut? | Nein. |
| Wurde ein Framework-Dependency geändert? | Nein. `npm ci` liess Lockfile unberührt. |
| Wurde Ready/Merge ausgeführt oder empfohlen als PASS? | Nein. STOPP für unabhängigen TL-Review. |
| Wurde S2 gestartet? | Nein. |
| Wurde Generation 2 wegen UI-Titel erfunden? | Nein. |

## 3. Bewusst belassene Residuals

- Admin Users behält das historische `as any` auf dem Client.
- `cookies().delete` bleibt hinter dem bestehenden `@ts-ignore`.
- Sichtbarer Cursor-Titel weicht ab; logischer Name ist korrekt persistiert.

## 4. Risiken, die bleiben

- P1 Auth-/Cookie- und `/planen`-Metadata-Regression in echter Preview/SSR.
- P2 `main protected=false`.
- Unit-Source-Scans ersetzen keine unabhängige Preview-Verifikation.

## 5. Urteil des Autors

S1 ist scope-treu implementiert und lokal gegated. Product-Truth sollte unverändert sein.

**Unabhängiger Technical-Lead Exact-Head-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
