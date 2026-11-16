# Account Security Translations 3 — Auftrag vom 15.11.2026

## Autorisierung und Reihenfolge

Sasa fordert weitere autonome Dev-Arbeit, höchstens drei neue Pakete bis zum Merge der acht abgenommenen PRs; Priorität CMS-/Kampagnen-Datenbank, danach Übersetzungen, danach Ortskatalog. Nichts mergen. Die acht grünen PRs #1199/#1200/#1201/#1203/#1204/#1205/#1207/#1208 bleiben in Head, Branch und Metadaten unverändert. #1196–#1198 und alle ihre geänderten Dateien bleiben absolut unberührt. Production, neue Kosten, Anmeldung/2FA und echte Erstattungen bleiben beim Owner.

CMS-/Kampagnen-Anbindung wurde zuerst live geprüft und bleibt an den fremden BG1-/Types-/Scanner-Dateien blockiert. Dieser Befund ist in #1206/#1209/#1210 dokumentiert; kein neues Paket wurde dafür eröffnet. Daher ist dieser Folge-PR das **erste neue Paket dieser Runde**, anschließend ist höchstens ein Ortskatalog-Paket vorgesehen. Keinen weiteren Slice starten.

## Ausgangspunkt und Zuständigkeit

- Live main: `63544e820e912bd275556588c956a09b99b1cf90`, Operating Mode NORMAL.
- Explizite gestapelte Basis: #1208 `28432962c683b2ae20e9e2091992ec8e458050c6`; dessen gespeicherter Locale-Reader ist vorhandene Abhängigkeit, keine neue Präferenzspeicherung.
- Neuer Branch: `feat/account-security-translations-3-20261115`.
- Worktree: `/workspace/scratch/8d4f63afa634/jetnity-security-translations-3`.
- Logischer Writer: `/root/translations_scope_3`. Keine Änderung einer Cursor-UI-Session behauptet. Root führt Veröffentlichung, eine unabhängige Diffprüfung, gemeinsamen CI-Abschluss und echte Dev-Abnahme aus.
- Aktuelle Schutzliste: 517 Entry-Pfade; weitere 133 Pfade kennzeichnen die unveränderten grünen PRs als Integrationsabhängigkeiten. Ihre Branches bleiben eingefroren. Nur die unten ausdrücklich benannte Testanpassung in diesem **neuen** Folge-PR ist erforderlich; kein Eingriff in #1205 selbst.
- MULTI_AGENT: Autor schreibt ausschließlich diesen Scope; Root betreut Shared-Contract-Grenzen und Publikation, getrennte Orts-Lane bleibt bis zum nächsten Schritt lesend. Kein zusätzlicher Reviewzyklus unveränderter grüner Pakete.

## Ziel und Produktnutzen

Die vorhandene gespeicherte Kontosprache soll den aktiven Sicherheitsbereich verständlich in Deutsch und Englisch anzeigen: Passwort, aktuelle Sitzung, Abmelden, Authenticator, Passkeys und bestehende Bestätigungsdialoge. Der gesamte bestehende Sicherheitsablauf und seine Wahrheit bleiben unverändert. Das spart Sprachwechsel und Fehlbedienung an sicherheitsrelevanten Aktionen.

## Dateien

Erlaubte bestehende Produktdateien:
- `app/account/security/page.tsx`
- `components/account/SecurityPasswort.tsx`
- `components/account/SecuritySitzung.tsx`
- `components/account/SecurityLogout.tsx`
- `components/account/SecurityMFA.tsx`
- `components/account/SecurityMfaStepUp.tsx`

Neue eigene Dateien:
- `lib/localization/account-security-texte.ts`
- `lib/localization/account-security-display-3.ts`
- `lib/localization/account-security-display-3/{catalog,display,browser}.test.ts`
- `scripts/account-security-display-3/harness.tsx` sowie nur erforderliche kleine eigene Testfixtures.
- dieser Task und `docs/ACCOUNT_SECURITY_TRANSLATIONS_3_HANDOFF_2026-11-15.md`.

Ausdrücklich genehmigte Folge-PR-Testintegration:
- `lib/auth/account-security-premium-ux-1.test.ts`: die bisherigen hartkodierten deutschen Quelltext-Anzeigeassertions an tatsächliche lokalisierte Anzeige-/Accessibility-Ausgaben anpassen. Alle bisherigen Sicherheits-, Semantik-, Link-, Tasten- und Fokusgrenzen erhalten. Keine Attrappe, kein unbenutzter Text, keine abgeschwächte Assertion oder zusätzliche Skips zum Grünmachen.

Weitere Pfade zuerst konkret an Root melden. Keine Entry-Pfade, gemeinsame Katalogaggregation, `types/supabase.ts`, `scripts/db/verwendung.mjs`, Auth-Guards, Logout-/Passwort-/MFA-Aktionen, Lockfile, package.json, CI-Workflows, globale Dokumente oder Einstellungen-Writer verändern.

## Umsetzung

1. Relevante AGENTS-/Produkt-/Design-Regeln sowie installierte Next-Dokumentation für asynchrone Server-Komponenten/Metadaten lesen.
2. Ein eigener getypter DE/EN-Katalog, direkt in den oben benannten Flächen verwendet. Bestehenden `kontoAnzeigesprache`-Reader request-scoped einmal wiederverwenden; ungesetzte/nicht unterstützte Sprache bleibt DE.
3. Server-Seite und Metadaten berücksichtigen die gelesene Sprache; die Locale wird als reine Anzeigepräferenz in die bestehenden Komponenten gereicht. Am gemeinsam verwendeten Step-up-Dialog bleibt sie optional mit DE-Default.
4. Labels, Hilfen, Status, Fehler, Grenzen, Dialoge, Lade- und Accessibility-Texte übersetzen. Identitäten, rohe Diagnostik, Codes, URLs, IDs, Session-/Faktorwerte und Wahrheitszustände nicht umdeuten.
5. Falls eine reine Anzeigezuordnung bestehender Fehler-/Lagecodes nötig ist, in eigener Datei; keine neue Auth- oder Autorisierungslogik. Unbekannt bleibt unbekannt, unavailable bleibt unavailable, ein JWT-Snapshot wird nicht zur aktuellen Sitzungsbestätigung.
6. Bestehende Tokens, Abmessungs-/Fokusregeln und Formvalidierung erhalten; keine neue Library oder Kosten.

## Harte Sicherheitsgrenzen

- Keine Passwort-, MFA-, Passkey-, Session-, Logout-, Cookie-, Token-, E-Mail-, DB- oder Rechteänderung.
- Keine neue API, RPC, Persistenz, Service Role oder Admin-Befugnis.
- Geänderte Texte dürfen weder aktivierte Passkeys behaupten noch Autorität aus der Locale oder User-Metadaten ableiten.
- Buttons müssen dieselben Aktionen mit denselben Schutzbedingungen und Request-Verträgen auslösen.
- Shared Step-up muss ohne neue Prop sein bisheriges DE-Verhalten erhalten.
- Keine sensitive Diagnose/Werte aus Fixtures in Produktionscode übernehmen.
- Echte Abnahme nur durch vorhandene legitime Sitzung; neue Anmeldung/2FA, falls erforderlich, durch Sasa. Während der Abnahme keine Credential-/Faktor-/Logout-Mutation.

## Evidence und Tests

- Neuer Katalog: vollständige DE/EN-Keyparität, Interpolation, Anzeige-Mapping der vorhandenen Zustands-/Fehlercodes.
- Relevante bestehende Auth-/Anzeige-Tests mitlaufen lassen; alle Fehler eines Laufs sammeln und gemeinsam beheben.
- Ein sinnvoller montierter Browserlauf mit echten Produktkomponenten und Produktions-CSS, gesteuertem bestehenden Auth-Testport, sichtbaren DE/EN-Flows einschließlich verfügbar/unverfügbar/Fehler und Step-up. Kein neuer Skip, kein echter Credential-/Provideraufruf. Dieser Nachweis ist kein Hosted-Loginbeweis.
- Keine lokalen Browser-/Port-Starts wiederholt versuchen: die bekannten Sandbox-Grenzen gelten; die bestehende CI führt die echten Browserfälle aus. Node22 und vorhandene Abhängigkeiten verwenden, ohne neue Installation/Paketänderung.
- Vor Veröffentlichung gebündelter Typecheck, fokussierter Lint und alle relevanten lokalen reinen Tests; eine vollständige normale CI auf endgültigem neuen Source-Stand.
- Root prüft den vollständigen neuen Diff einmal auf Scope, Auth-Unverändertheit und geschützte Pfade. Nur konkrete gesammelte Befunde werden korrigiert.
- Danach eine echte Dev-Seite mit gespeicherter Sprache ansehen und normale Persistenzübernahme bestätigen; DE am Ende wiederherstellen. Keine redundanten Review-/Beweisrunden.

## Handoff / STOPP

Handoff enthält Ausgangsquelle, konkrete Dateien, Sprachabdeckung, unveränderte Sicherheitsaktionen, Prüfungen samt allen Fehlern und gebündelter Korrektur, Kostenfreiheit im vorhandenen Stack und offene Grenzen. CI-/Head-Details gehören auf GitHub, nicht in den höchstens fünfzeiligen Chatbericht. Die globalen Architektur-/Roadmap-Dateien sind Entry-Lane-geschützt; Fortschritt deshalb im eigenen Task/Handoff und neuen PR festhalten.

**do not mark Ready; do not merge; do not start a follow-up slice.** Keine Veröffentlichung durch den Autor; Root übernimmt den neuen Draft-PR. Am fertigen, lokal geprüften Diff stoppen und Root informieren. Wenn ein zusätzlicher gesperrter Pfad wirklich nötig ist, konkrete Grenze melden; niemals Schutzregister, Typen oder Tests umgehen.

## Root-Ergänzung: gebündelte vorhandene Anzeigetests

Nach Quellprüfung sind zusätzlich genau diese vorhandenen Tests ausschließlich im neuen Folge-Branch für ehrliche Anzeige-/Katalogintegration freigegeben: `lib/auth/ap5-s1-security-ui.test.ts`, `lib/auth/ap5-s3-logout-scopes.test.ts`, `lib/auth/ap5-s4-mfa-step-up.test.ts`, `lib/auth/ap5-s5-honest-session-view.test.ts` und `scripts/e2e/admin-account-counts-browser-flows-1/test.mjs`. Alle fünf liegen außerhalb der 517 unveränderlichen Entry-Pfade. Der letzte Pfad nur, falls seine deutsche Erfolgs-Assertion tatsächlich an Inline-Quelltext gekoppelt ist. Alle bisherigen Auth-, AAL2-, Logout-Scope-, Session-Wahrheits-, Enrollment-, Fehler- und Accessibility-Assertions bleiben fachlich erhalten. Keine duplizierten unbenutzten Strings, keine Skips, keine abgeschwächten Verhaltensgrenzen. Die acht bestehenden PRs und ihre Quellen bleiben unverändert; diese notwendige Testintegration ist Teil des neuen abhängigen Übersetzungspakets.
