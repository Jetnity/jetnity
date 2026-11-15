# Account Security Translations 3 — Autorenübergabe, 15.11.2026

## Status und Autorität

**Lokale Implementierung fertig; Root-Diffprüfung, normale CI/Build/Browserfälle und angemeldete Dev-Abnahme offen. Kein Ready, kein Merge und keine Veröffentlichung durch den Autor.**

Ausgangspunkt ist #1208 `28432962c683b2ae20e9e2091992ec8e458050c6`, neuer abhängiger Branch `feat/account-security-translations-3-20261115`. Auftrag und Ergänzung: `docs/ACCOUNT_SECURITY_TRANSLATIONS_3_TASK_2026-11-15.md`. Alle Änderungen gehören ausschließlich in diesen Folge-PR. Die acht grünen PRs bleiben unverändert; #1196–#1198 und ihre 517 reservierten Dateien werden nicht geändert. Dieses Paket beansprucht keine CMS-/Kampagnen-Datenbankaktivierung.

## Produktänderung

Der aktive Bereich `/account/security` verwendet die bereits gespeicherte Kontosprache DE/EN. `kontoAnzeigesprache` bleibt unverändert; Seite und `generateMetadata` benutzen denselben bestehenden request-scoped React-Cache. Fehlende/nicht verfügbare unterstützte Sprache bleibt Deutsch. Die Sprache wird als reine Anzeigeprop weitergereicht. Alle Client-Komponenten haben einen DE-Default; insbesondere bleibt der gemeinsam verwendete Step-up-Dialog für bisherige Aufrufer kompatibel.

192 getypte zweisprachige Texte decken Seitentitel, Metadaten, Ankernavigation, Ladeanzeige, Passwort-/Nonce-Hinweise und Regeln, Passwortstärke, aktuelle Sitzung/AAL/Token-Gültigkeit, lokale Browserhinweise, Logout-Scopes und Bestätigung, TOTP-Liste/Einrichtung/Fehler, Passkeys und den vorhandenen Step-up-Dialog ab. Ein eigener Katalog wird direkt konsumiert; der zentrale Admin-Katalogaggregator gehört nicht zu diesem Paket.

Die eigene reine Anzeigeprojektion verwendet die bestehenden Lage-/Fehlercodes und Parameter. Sie entscheidet keine Berechtigung, ändert keinen Zustandsautomaten und erweitert keine Datenlesung. Bereits sichtbare MFA-Meldungen speichern einen Textschlüssel statt einen fest übersetzten Satz und wechseln deshalb bei neuer Anzeigeprop korrekt mit. Nutzerdefinierte Faktornamen bleiben unverändert; nur der bereits vorhandene generische Fallback wird übersetzt. Zeitwerte behalten ihre Bedeutung und die lokale Zeitzone; ihre Darstellung verwendet DE/EN. Der unveränderte datensparsame Browser-/Plattformhinweis wird lediglich mit einem lokalisierten UI-Präfix angezeigt.

## Dateien

- Produkt: `app/account/security/page.tsx`; `components/account/SecurityPasswort.tsx`, `SecuritySitzung.tsx`, `SecurityLogout.tsx`, `SecurityMFA.tsx`, `SecurityMfaStepUp.tsx`.
- Eigener Katalog und Projektion: `lib/localization/account-security-texte.ts`, `lib/localization/account-security-display-3.ts`.
- Eigene Prüfungen: `lib/localization/account-security-display-3/catalog.test.ts`, `display.test.ts`, `browser.test.ts`.
- Eigener synthetischer Browseraufbau: `scripts/account-security-display-3/harness.tsx`, `auth-fixture.ts`.
- Ausdrücklich genehmigte Anzeigeintegration bestehender Tests: `lib/auth/account-security-premium-ux-1.test.ts`, `ap5-s1-security-ui.test.ts`, `ap5-s3-logout-scopes.test.ts`, `ap5-s4-mfa-step-up.test.ts`, `ap5-s5-honest-session-view.test.ts` sowie `scripts/e2e/admin-account-counts-browser-flows-1/test.mjs`.
- Eigene Dokumentation: Task und dieser Handoff. Globale Architektur-/Roadmap-Dateien bleiben wegen der Entry-Zuständigkeit unverändert.

## Unveränderte Sicherheitsverträge

Passwort-Reauthentication, Nonce-/Passwortvalidierung, Update-Nutzlast, Logout-Scopes, globale Bestätigung, aktuelle User-Prüfung, TOTP-Enrollment, Challenge/Verify, verifiziertes Unenroll, AAL-Rechecks, Refresh und Post-Unenroll-/Logout-Behandlung sind unverändert. Keine Guards, Aktionen, Auth-Modelle, Rollen, Session-/Cookie-/Tokenbehandlung, Links, IDs oder Serverkonfiguration wurden geändert. Die Sprache hat keine Autorisierungswirkung.

Nicht verfügbar bleibt nicht verfügbar; Lesefehler werden weder zur leeren Liste noch zur Erfolgsmeldung. Andere Sitzungen bleiben unsupported ohne erfundene Gerätezahl. Token-Ablauf bleibt ausdrücklich vom Sitzungsende/letzter Aktivität getrennt. Passkeys bleiben von der Serverkonfiguration abhängig. Der bestehende Hinweis auf bis zu einer Stunde weiter gültige Tokens bleibt in beiden Sprachen erhalten. Raw-Providerdiagnostik bleibt durch die bestehenden Klassifizierer von der UI ausgeschlossen. Eine erfolgreiche Bestätigung wird nicht mit einer erfolgreichen Faktorentfernung verwechselt; fehlgeschlagene Nachprüfung nach tatsächlicher Entfernung wird weiterhin ausdrücklich angezeigt.

## Lokaler Prüflauf und gebündelte Korrektur

Runtime für alle lokalen Befehle: `/home/agent/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node` (Node 22); bestehende Abhängigkeiten, keine Installation.

| Prüfung | Tatsächliches Ergebnis |
|---|---|
| `next typegen` und vollständiger `tsc -p tsconfig.json --noEmit --incremental false` | PASS |
| ESLint aller sechs UI-Dateien, eigenen Helper-/Test-/Harness-Dateien und sechs angepassten Tests | PASS, 0 Fehler; 3 bereits vorhandene Warnungen: synchroner State im bestehenden MFA-Effect und zwei ungenutzte Variablen im historischen E2E-Script |
| Relevante Pure-/Auth-/Anzeige-Tests, erster gesamter Lauf | 150/151 PASS; ein Fehler in meiner neuen Erwartung für den bereits bestehenden normalisierten Browsernamen |
| Gebündelte Korrektur | Erwartung `Chromium` auf den tatsächlich unverändert gelieferten Wert `Chromium-Browser` korrigiert; Produktdaten/Normalisierung unverändert. Anschließend Hinweis aus Export-Gate: ursprünglichen DE-Step-up-Titel im Katalog direkt weiterverwenden statt ungenutzt zu lassen |
| Derselbe vollständige fokussierte Testlauf danach | **151/151 PASS**, keine Skips |
| Eigener Browserbundle und tatsächliches Produktions-CSS kompilieren | PASS; Bundle enthält die echte Logout-Serveraktion, Komponenten, Zustandsautomaten und Auth-Operationen |
| Browserausführung/Real-Device | Lokal bewusst **NOT RUN**, gemäß Sandbox-/Task-Grenze; keine Browser-/Portstarts versucht |
| Production-Build und volle normale CI | **NOT RUN durch Autor**; Root veröffentlicht einmal den endgültigen Stand und wartet auf normale CI |
| Export-/Erreichbarkeitsprüfung | Erreichbarkeit PASS, keine verwaiste Datei; Exportprüfung fand nach Herauslösen des Step-up-Titels eine allein dadurch ungenutzte ursprüngliche Konstante. Der neue Katalog konsumiert diese weiterhin direkt als deutschen Originaltitel; keine Auth-Datei geändert. Abschließende Exportprüfung PASS, 0 Exporte ohne Aufrufer; anschließender vollständiger fokussierter Lauf erneut 151/151 PASS. |
| `git diff --check` | PASS |

Exakter fokussierter Testbefehl (nach Korrektur):

```bash
/home/agent/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/localization/account-security-display-3/catalog.test.ts lib/localization/account-security-display-3/display.test.ts lib/auth/ap5-*.test.ts lib/auth/account-security-lage.test.ts lib/auth/account-password-aenderung.test.ts lib/auth/account-security-premium-ux-1.test.ts lib/auth/account-session-view.test.ts lib/auth/account-logout-scopes.test.ts lib/auth/account-mfa-step-up.test.ts lib/auth/account-security-faktoren.test.ts lib/auth/account-security-fehler.test.ts lib/auth/passwort-richtlinie.test.ts
```

### Historischer separater Source-Pin-Fehler — unverändert offen

Zusätzlich wurde das wegen der erlaubten Anzeigeassertions betroffene historische Script vollständig ausgeführt:

```bash
/home/agent/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node --test scripts/e2e/admin-account-counts-browser-flows-1/test.mjs
```

**51/52 PASS, ein bewusst nicht umgangener Source-Identitäts-Guard.** `read-only source pins still include caller-status and the #557 producer` ruft `detectProductDrift()` aus `scripts/e2e/admin-account-counts-browser-flows-1/source-pins.mjs` und danach `assertPinnedSources()` aus `scripts/e2e/admin-account-counts-browser-acceptance-1/source-manifest.mjs` auf. Der Guard vergleicht die unveränderten historischen Pins aus `scripts/e2e/admin-account-counts-browser-acceptance-1/constants.mjs`: Produktbaseline `f0237baf8809e5528b5f73e918f0e37a7d9b4477`, Integrationsbaseline `4381d20bfaa7f60f140823cc311d44409934197a`, ausführbare #557-Quellbaseline `9cf7aedd8dd190b4764d8ac178e23d9f8b42c773`. Maßgeblich bleiben die unveränderten `BLOB_PINS`, nicht ein neu eingeführter aktueller Pin. Die Flow-Konstanten nennen zusätzlich den damaligen Produktstand `fa7f651c023eb361fb142cbb931bc702f3a3d213`.

Der Lauf meldet Abweichungen für `server`, `client`, `roles`, `adminHome`, `config` (in diesem Slice vollständig unverändert) sowie `securityPage` und `securityMfa`. Für die zwei hier noch nicht committed geänderten Security-Dateien verweigert er zusätzlich die Ableitung einer neuen Identität aus einem dirty Worktree. Die übrigen 51 Fälle, einschließlich aller ehrlich auf den direkt konsumierten Katalog umgestellten Anzeigen, bestehen. **Kein Pin, Manifest, Guard, Produktionswert oder alter PR wurde geändert; kein Skip hinzugefügt.** Dieser historische Harness wird dadurch nicht als aktuelle angemeldete Abnahme ausgegeben.

**Nicht Teil der normalen Core-CI:** `.github/workflows/ci.yml` ruft `npm run test:core` auf. `scripts/official-truth-v3-test-selection.mjs` nimmt `lib/**/*.test.ts`, den Operating-Mode-Test und die vorgegebenen Dev-PG-Prep-Tests auf; das separate `scripts/e2e/.../test.mjs` gehört nicht dazu und wird dort auch nicht indirekt referenziert. Die tatsächlich aufgelöste Core-Auswahl wurde read-only geprüft: alle drei neuen `account-security-display-3`-Tests sind enthalten; dieses historische Script ist nicht enthalten. Es wurde keine CI-Selektion verändert. Eine neue ausführbare Abnahme dieses historischen Harness verlangt eine eigene legitime Integration seiner alten Quellbaseline; sie wird hier nicht vorgetäuscht.

## Vorbereiteter CI-Browsernachweis

Der eigene Harness montiert echte Security-Komponenten mit Produktions-CSS. Esbuild ersetzt ausschließlich die zwei vorhandenen Supabase-IO-Einstiege `@/lib/supabase/client` und `@/lib/supabase/server` durch die eigene test-only Fixture. Auch `accountLogoutScopeAction` und alle fachlichen Auth-Operationen laufen tatsächlich. Es existiert keine Testprop, Fixture-Route oder alternative Auth-Aktion im Produkt.

Das synthetische Dokument wird direkt durch Playwright geliefert; Netzwerkversuche außerhalb dieses Dokuments, Browserstorage, Cookies und Seitenfehler werden gesammelt und führen zum Fehler. Es werden keine Tokens, echten Nutzer oder Credentials eingesetzt. Dieser Nachweis ist ausdrücklich **kein Hosted-Login- oder Persistenzbeweis**.

Die Fälle decken DE/EN-Karten auf schmaler Breite, feste Scope-Zuordnung samt globaler Bestätigung, Passwortvalidierung und unveränderte Nutzlast, fehlende Anmeldung, unsupported/Fehler/leer, sprachwechselnde bestehende Fehler ohne Auth-Neuladen, bewusst gestartetes Enrollment, Nutzername/Faktor-ID-Grenzen und verifiziertes Entfernen samt Escape/Fokusrückgabe, invalidem Code, Busy-Schutz, AAL-Recheck und tatsächlicher Post-Unenroll-Bestätigung ab. Der bei Enrollment bereits vorher kurzlebige Erfolgs-Toast bleibt kurzlebig; die Prüfung verwendet den danach tatsächlich gelesenen verifizierten Listenstand.

## Datenbank, Kosten und offene Grenzen

Keine Migration, Tabelle, RPC, Typen-, Rollen-, ACL-/RLS- oder Schreibänderung. Keine neue API, Library, Installation oder laufende Kosten. Kein Production-Zugriff, echter Passwort-/MFA-/Logout-Eingriff oder Refund.

Die geschützte Account-Hauptübersicht, Rahmen-/Hauptnavigation, zentrale Admin-Katalogaggregation und Einreise-Anzeigen gehören nicht zu diesem Paket. Der gespeicherte Locale-Reader wird wiederverwendet; dieses Paket behauptet keine neue Präferenzpersistenz.

Nächster Schritt ausschließlich durch Root: einmal vollständigen neuen Diff prüfen, einen Draft veröffentlichen, normale CI einschließlich echter montierter Browserfälle abschließen und anschließend einmal die legitime angemeldete Dev-Seite mit vorhandener gespeicherter Sprache ansehen. Dabei keine Credentials/Faktoren/Sessions verändern; DE nach der Abnahme wiederherstellen. Danach STOPP für diesen Autor, keine weitere Lane beginnen.

## Technical-Lead-Prüfung vor Veröffentlichung

Root hat den vollständigen neuen Produkt-/Katalog-/Test-Diff einmal geprüft: reine Darstellung, unveränderte Auth-Aktionen und Guards, korrekte Fehler-/Unverfügbar-Semantik, erhaltene Faktornamen, keine Überschneidung mit den 517 Entry-Pfaden. Erreichbarkeit und Paketverwendung bestehen. Der parallel zuerst gemeldete ungenutzte Originaltitel ist im endgültigen Katalog direkt wiederverwendet und durch den abschließenden Autorenlauf behoben. Keine Auth-Helper-/Export-Ausnahme oder Schutzregisteränderung.

Der neue Remote-Branch besitzt ausschließlich zwei eigene Preview-Variablen für den bereits bestehenden Dev-Branch (öffentliche Supabase-URL/Anon-Konfiguration). Ein erster Konfigurationsversuch vor Existenz des Git-Branches wurde von Vercel abgewiesen; nach Anlage des eigenen Branches wurden beide Variablen erfolgreich exakt branchbezogen angelegt. Keine globale Preview-/Production-Variable, kein Credential, keine Berechtigung geändert. Normale CI und echte Dev-Abnahme werden anschließend im neuen PR dokumentiert, ohne erneuten Source-Commit für reine Testergebnisse.

## Gelesene technische Grundlagen

Installierte Next-Dokumentation: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` und `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (Servergrenze, async Page/Metadata und React-cache). Projektregeln/Task und bestehende Auth-Tests bleiben maßgeblich. Supabase-Anleitung sowie aktueller [Changelog](https://supabase.com/changelog.md) und [Sign-out-Vertrag](https://supabase.com/docs/reference/javascript/auth-signout) wurden gelesen; keine Supabase-API-/Konfigurationsänderung daraus abgeleitet. Vercel-React-Regeln für minimale serialisierte Props, request-scoped Cache, Effects und Accessibility angewendet; kein zusätzlicher Reviewzyklus der acht grünen Pakete.
