# Jetnity – Rollback vom 20.11.2026: Dev-Incident-Review und Release-Nachtest

**Status:** DEV-ONLY / NICHT LIVE / KEIN NEUER PRODUCTION-DEPLOY.
**Incident:** Neues Source-Release mit #1260–#1263 wurde nach echten Problemen sofort auf das zuvor funktionierende Production-Deployment zurückgerollt. Owner-Screenshots 17:32 zeigten graue Flug-/Hotel-Frames; Owner-Nachtest 17:38 zeigte bei beiden Anbietern wieder reale Ergebnisse auf der zurückgerollten Version.
**Release-Vorgabe:** Der nächste Production-Cutover benötigt eine **neue ausdrückliche Owner-Freigabe**, nachdem ein echter, angemeldeter Dev-Endtest aller unten genannten Bereiche stattgefunden hat.

## 1. Ursachen und präzise Evidenzgrenzen

| Bereich | Erkenntnis / Ursache | Korrektur oder noch offene Voraussetzung |
| --- | --- | --- |
| Hotel-Einbettung | `lib/providers/stay22/suche.ts` erzeugt ausdrücklich `https://www.stay22.com/embed/gm`. Die in #1260 erstmals wirksame **Seiten-CSP** unter `next.config.js` enthielt diesen Host **nicht** in `frame-src`. Browserfehler-Screenshots auf dem fehlerhaften Deploy und Wiedergabe nach Rollback sind damit kausal vereinbar. | Exakt **`https://www.stay22.com`** zu `frame-src` ergänzt; keine Anbieter-API und kein Sandbox-/CMP-Bypass. Echt-Frame-Nachtest in Dev erforderlich. |
| Flug-Widget | Der separate Vercel-Host ist laut veröffentlichtem Hosting-Vertrag und Vercel-Alias **`https://jetnity-flight-widget.vercel.app`**; dieser fehlte ebenso in `frame-src`. Die Widget-Sandbox und eigene CSP bleiben unverändert. | Exakt diesen Origin ergänzt; kein pauschales `*.vercel.app`, kein zusätzlicher Script-/Connect-Host für die Jetnity-Seite. Echte Suchergebnisse, Filter und Provider-Handoff in Dev prüfen. |
| KI als gesperrt gemeldet | Das Modell-Gate in `lib/modell/konfiguration.ts` verweigert jeden Aufruf, wenn `JETNITY_MODELL_AKTIV` nicht `true`/`1` ist oder serverseitige Modell-Konfiguration fehlt. Der **Production**-Schlüssel-/Schalterstatus ist über die redigierte Vercel-ENV-Liste nicht abschliessend nachgewiesen. **Eine Seiten-CSP sperrt nicht selbst den serverseitigen Modellaufruf.** | Keine Live-/Modell-/Kostenaktivierung; in isoliertem Dev mit expliziter QA-Freigabe die drei bestehenden Pfade einmalig prüfen. Bei geschlossener Konfiguration **BLOCKED**, nicht PASS; Operator-/Owner-Gate separat. |
| Reisewetter | Browser ruft First-Party-`/api/reisewetter` auf; `connect-src 'self'` ist in #1260 vorhanden. Route benötigt zusätzlich angemeldete Sitzung, Einwilligungsheader, zugehöriges Vercel-Environment und atomaren RPC. Read-only gegen die bisherige Dev-Projektkennung meldete `public.reisewetter_reservieren_v1()` **nicht vorhanden**. Das beweist keine Ursache für den früheren **Production**-Fehler, erklärt aber, warum ein Dev-Wetter-E2E ohne kompletten BG1-kompatiblen Dev-Einbau nicht bestanden werden kann. | Wetter-Kandidat-SQL enthält ausdrücklich „nicht isoliert in geschützte Datenbank installieren“. **Keine eigenmächtige Installation**; erst eine separat koordinierte, kompatible Dev-Komposition und einen echten signierten QA-Aufruf nachweisen. Bei Fehler nur Status/Grund protokollieren, keine Secrets oder Nutzerinformationen. |
| Abmelden | Der globale Logout verwendet eine serverseitige Supabase-Action und leitet nur bei bestätigter `signOut()`-Antwort weiter. Der Live-Test meldet, dass eine Sitzung bestehen blieb, aber ohne Netzwerk-/Auth-Fehlerklasse oder Response-Nachweis; eine CSP-Ursache ist **nicht** belegt. | **Kein** erfundener Success-Redirect, lokaler Token-Reset, MFA-Bypass oder Änderung der globalen Logout-Semantik. Mit echtem Dev-Konto einmal nachstellen und im Browser den fehlgeschlagenen POST/Auth-Status ermitteln; erst anschliessend einen engen Source-Fix in diesem Workstream reviewen. |
| Mietwagen-Stornofrist 24/48 Std. | Der Anbieter liefert `cancellation.details.hours_before_pickup` **pro Angebot**; 24 und 48 Stunden dürfen sich zwischen zwei Angeboten unterscheiden. Eine allgemeine Stornofrist wurde nicht belegt. | Text kennzeichnet die Frist nun ausdrücklich „laut diesem Angebot“; fehlende Frist wird nicht geschätzt. Synthetischer Test für 24/48/unbekannt/nicht erstattbar; echte Angebots- und Bedingungen-Abnahme beim Anbieter nötig, keine Buchung. |

**Wichtig:** Nur die CSP-Lücke der beiden geprüften Drittanbieter-Frames ist auf Quellniveau konkret als zusammenhängende Ursache gefunden und als minimaler Fix umgesetzt. Die anderen Fehler haben voneinander unabhängige Runtime-/Sitzungs-/Backend-Gates. Diese werden nicht als „behoben“ ausgegeben, bevor echte Dev-Beweise vorliegen.

## 2. Sicherheitsgrenzen der Quellkorrektur

- In `next.config.js` ausschliesslich zwei **exakte, verifizierte `frame-src`-Origins** ergänzt. `script-src`, `connect-src`, `form-action`, `frame-ancestors`, `X-Frame-Options`, Cookie-Grenzen, Anbieter-Sandbox, Consent und API-Frame-Nonces unverändert.
- `lib/security/next-16-4-6-headers.test.ts` prüft beide neuen Origins und weiterhin fehlende Wildcard-Freigaben. Zusätzliche Mietwagen-Regressionen prüfen getrennte Anbieterfristen.
- `main`-Autodeploy bleibt ausdrücklich OFF. Kein Supabase-/Vercel-Production-Write, kein Provider-/Kosten-/Secret-Write. Andere PRs (Official Truth, Passkeys, UI-Feinschliff) nicht verändern.

## 3. Pflicht: **ein** echter Dev-Endtest vor einem neuen Release

Auf dem **exakten** Dev-Preview-Build, nach unabhängig bestätigter Supabase-Dev-/Preview-Trennung und grüner vollständiger CI, durch Work mit eigenem, bereits autorisiertem QA-Login und TOTP im Browser – **keine Zugangsdaten im Chat**:

1. **Flüge:** Reise ZRH→BKK/HKT→ZRH; Suchmaske, Ladezeit, echtes Anbieter-iframe, Preise/Filter sowie sichere Weiterleitung (ohne Buchung). In Browser-DevTools dokumentieren: tatsächlicher `iframe.src`-Origin, `frame-src`-Response-CSP und **keine** `securitypolicyviolation` für den Rahmen. Grauer Fehlerbereich = FAIL.
2. **Hotels:** Bangkok mit gültigem Etappen-Zeitraum/Gästen/Zimmern; echte Stay22-Liste, Karte, Marker, Ansichtswechsel sowie Partnerweiterleitung ohne Buchung. Dasselbe Origin-/CSP-/Network-Protokoll; Consent-Ablehnung muss weiterhin den Frame sperren.
3. **KI:** Dev-Kontingent respektieren. Ein minimaler Test für Erstellen, Änderung-fail-closed, Reisebegleiter-Antwort und Save→Reload der getrennten Reise, ohne Original zu beschädigen. Nur wenn Dev-Modell-Gate und Kontingent wirklich aktiv sind als E2E-PASS melden. Keine erzwungenen Quoten-Resets.
4. **Wetter:** Termin innerhalb des tatsächlichen Vorhersagehorizonts verwenden; mit ausdrücklichem Consent und signiertem Dev-Konto den `/api/reisewetter`-Status und die sichere Quote beobachten. Vor dem Test erforderliche Dev-RPC-Komposition **ohne** Umgehung des BG1-Guards/ohne Production-Kopplung nachweisen. `401`, `403`, `429`, `503` nicht als Vorhersage-PASS werten.
5. **Abmelden:** Mit separatem QA-Konto regulär anmelden und TOTP bestätigen, danach globale Abmeldung mit tatsächlicher Server-Action-Rückmeldung, neu laden, Session-Ausschluss beweisen. Bei Fehler den Status ohne Token/Kennung protokollieren; kein Erfolg durch blosses Navigieren.
6. **Stornofristen:** Zwei unterschiedliche aktuelle DiscoverCars-Angebote (24 vs. 48 Std. nur falls vom Anbieter wirklich geliefert) und ihre tatsächlichen Mietbedingungen vergleichen; unbekannte Fristen ehrlich anzeigen, keine globale Garantie.

**STOP-Gate:** Bis alle sechs Bereiche in einem echten isolierten Dev-Browserlauf mit nachprüfbaren Belegen bestanden sind, gibt es **keinen neuen Production-Deploy**. Ein Source-CI-SUCCESS oder HTTP 200 genügt nicht.

## 4. PR-Kapazität / Arbeitsgrenze

Am 20.11. waren die bereits laufenden PRs #1240 (Passkeys), #1254 (Official Truth) und #1264 (UI-Feinschliff) die drei vorhandenen offenen PRs. Dieser Incident wird **ausschliesslich in einem einzigen eigenen Dev-Branch** gebündelt; keine Änderungen an diesen drei PRs. Das bestehende Limit von höchstens drei offenen PRs wird nicht stillschweigend ausgehebelt. Eine PR-Öffnung und vollständige PR-CI können erst erfolgen, sobald ein Platz regulär frei ist oder der Owner eine Ausnahme ausdrücklich zulässt. Keine Behauptung eines bereits vollständig grünen Endtests.
