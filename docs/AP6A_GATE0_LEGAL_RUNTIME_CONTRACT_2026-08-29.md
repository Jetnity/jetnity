# AP-6a Gate 0 – Runtime-Vertrag für `/privacy` und `/terms`

Stand: 29. August 2026  
Status: **CONTRACT ONLY / KEIN RUNTIME / KEIN RECHTSTEXT**  
Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 16`**

Dieser Vertrag gilt erst nach dem Product-Owner-/Legal-Content-Gate.  
Code-Anker: `lib/legal/ap6a-gate0-vertrag.ts`.

## 1. Routen

| Route | Datei (Runtime, noch nicht bauen) | Inhalt |
| --- | --- | --- |
| `/privacy` | `app/(public)/privacy/page.tsx` | nur freigegebene Datenschutzerklärung |
| `/terms` | `app/(public)/terms/page.tsx` | nur freigegebene Nutzungsbedingungen |

Nicht still mitbauen:

- `/impressum`
- `/datenschutz`
- Redirect-Aliase

außer Product Owner / Legal das ausdrücklich als Extra-Input freigibt. Live sind beide verwandten Pfade ebenfalls 404.

## 2. Layout und UX

- Layout: bestehendes `app/(public)/layout.tsx` (Skip-Link, PublicNavbar, Footer, BackToTop).
- Kein neues Farbsystem, keine neue Legal-Marke.
- Eine sichtbare `h1` je Seite. Semantisch `<main>` + Artikelstruktur.
- Mobile/Desktop: dieselben Public-Tokens; Touch-Ziele wie Footer (`min-h-10` / `min-h-11`).
- Sprache der Seiten-UI: Deutsch, solange Legal keine weitere Sprachfassung liefert.
- Versions-/Stand-Zeile nur mit dem von Legal gelieferten Datum. Kein erfundenes „Stand“.
- Empty ≠ Error: eine fehlende Freigabe ist kein leerer 200 mit „keine Daten“. Ohne Freigabe wird die Seite nicht gebaut.

## 3. Metadata / Canonical / robots

- `metadataBase` / Canonical / OG: bestehende D0-2-Wahrheit `https://jetnity.com`.
- Canonical-Pfade: `https://jetnity.com/privacy`, `https://jetnity.com/terms`.
- `robots`: `noindex, nofollow` (und GoogleBot analog), solange das Public-Indexing-Gate nicht ausdrücklich `darfIndexieren` wahr macht.
- `SITEMAP_OEFFENTLICHE_PFADE` bleibt `['/', '/planen']`, bis Public Indexing **und** eine bewusste Sitemap-Aufnahme entschieden sind. Legal-Seiten sind kein stilles Sitemap-Mitglied.
- Live `robots.txt` bleibt deny-all, bis dasselbe Indexing-Gate.
- `*.vercel.app` darf nicht als kanonische Produktdomain erscheinen.

Bestehende Helfer: `htmlRobots()`, `oeffentlicheMetadataOrigin()`, `robotsDokument()`. Runtime darf sie wiederverwenden, nicht umgehen.

`kanonischeUrl()` akzeptiert heute nur `'/' | '/planen'`. Ein Runtime-Slice muss Legal-Pfade dort oder in einem gleichwertigen Helfer ergänzen – das ist Technik, keine Indexing-Freigabe.

## 4. Verlinkung

Heute:

| Fläche | `/privacy` | `/terms` |
| --- | --- | --- |
| `RegisterForm` Checkbox | ja | ja |
| `CookieConsent` (nicht gemountet) | ja | nein |
| Footer | nein | nein |
| PublicNavbar | nein | nein |
| `LoginForm` | nein | nein |

Runtime-Minimum nach Content-Gate:

1. Register-Links bleiben und müssen **200** treffen.
2. Footer bekommt beide Links in der bestehenden „Jetnity“-Spalte oder einer neuen „Rechtliches“-Gruppe – bestehende Tokens, keine zweite Footer-Wahrheit.
3. Login: entweder dieselben zwei Links **oder** Entfernen/Ersetzen der Konformitätsbehauptung. Beides ist PO/Legal, nicht Agent-Erfindung.
4. CookieConsent nicht still verdrahten.

## 5. Accessibility

- Sichtbare `h1`.
- Links als echte `<a>` / Next `Link`, nicht klickbare Divs.
- Checkbox-Fehlerzustand auf Register bleibt (`aria-invalid`, `role="alert"`).
- Fokus und Kontrast nach Design-System.
- Kein Accordion, das den Rechtstext versteckt, ohne Legal das so freizugeben.

## 6. Was Runtime nicht darf

- Rechtstexte, Haftungs-, Gerichtsstands- oder Konformitätssätze erfinden.
- Consent in DB, Cookie-Banner-Wahrheit „Views/Likes“, Tracking live.
- Export, Kontolöschung, RLS, Auth/MFA/AAL, Service Role.
- Public Indexing, Domain Cutover, Branch Protection.
- Die bestehende Register-Checkbox als persistierten Consent verkaufen (das ist AP-6b).
- OAuth live schalten. Residual: `handleOAuth` prüft `accept` nicht; Google/Apple sind `enabled = false`. Falls OAuth später frei wird, braucht Legal/Auth einen eigenen Entscheid – nicht dieser Gate-0-Slice.

## 7. Acceptance für den späteren Runtime-Slice

1. Production-Alias `/privacy` und `/terms` HTTP **200**, kein 404.
2. Register-Links treffen dieselben Routen.
3. Footer-Links treffen dieselben Routen, sobald PO das so freigibt (Gate 0 empfiehlt ja).
4. Mobile und Desktop: gleiche Inhalte, bedienbare Links.
5. `h1` + semantische Struktur.
6. HTML-robots und robots.txt bleiben fail-closed deny, bis Public-Indexing-Gate.
7. Sitemap enthält die Legal-Routen nicht vor diesem Gate.
8. Kein erfundener Legal-Claim. Die heutige Zeile „DSGVO & CH-DSG konform“ darf nur bleiben, wenn Legal sie ausdrücklich freigibt; sonst entfernen oder ersetzen.
9. Keine Consent-Tabelle, keine Migration.
10. Inventory-Test von Gate 0 wird im Runtime-Slice bewusst angepasst, nicht still gebrochen.

## 8. Grenze zu AP-6b

AP-6a Runtime darf Seiten, Footer-Links und ehrliche Copy bauen.

AP-6b bleibt serial danach:

- Consent-Version + Zeitstempel
- Datenexport
- Kontolöschung inkl. Ownership/Auth
- Migration + RLS
- Suppression für späteres CRM
