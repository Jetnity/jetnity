# Official Truth Paket II – Quellenpflege 6+4, manuelle Dry-run-Warnung

Stand: 27. November 2026. Issue [#1322](https://github.com/Jetnity/jetnity/issues/1322). Hauptplan [#1319](https://github.com/Jetnity/jetnity/issues/1319) bleibt offen. Massgeblich die Kommentare [7205494648](https://github.com/Jetnity/jetnity/issues/1319#issuecomment-7205494648) und [7205720179](https://github.com/Jetnity/jetnity/issues/1319#issuecomment-7205720179).

**Status: vorbereitet, nicht angewendet.** Keine Aktivierung, kein Scheduler, kein Datenbanklauf, keine Rechtsqualifikation, kein PASS für fehlende Belege.

## Auftrag und Grenze

Die bestehende V3-/BG1-V8-/MA1-Schutzbasis bleibt unverändert. Dieses Paket hängt sich nicht in den Monitor, den Import oder die Oberfläche. Es ist eine reine Funktion: eine gespeicherte Quelle und eine manuell vorgelegte Beobachtung werden verglichen. Das Ergebnis ist eine Warnung.

Die Funktion vergibt keine Faktversion, verlängert keine Frist und schreibt nichts. `authorization` ist immer `none`. `legalQualification` ist immer `not_claimed`. `selectedSuccessor` ist immer `null`.

Dauerhafter Originalspeicher für einen späteren Lauf ist hier nicht nachgewiesen. Das PO-Mac-Archiv wurde nicht gelesen. Es gibt keinen neuen Bucket und keinen neuen Anbieter. Ein automatischer Betrieb, der Originalbytes dauerhaft ablegen müsste, bleibt **STOP**. Die Dry-run-Ausgabe behält nur Digest-Werte im Rückgabewert.

## Sechs Kern- und vier Zusatzthemen

Kern: Visum (`K1_visa`), Dokument (`K2_document`), Aufenthalt (`K3_stay`), Gesundheit (`K4_health`), Formulare (`K5_forms`), Minderjährige (`K6_minors`).

Zusatz, getrennt: Finanzmittel, Rück- oder Weiterreiseticket, Transit, Zoll. Eine fehlende Zusatzangabe wird ein Hinweis «noch nicht amtlich bestätigt». Sie sperrt die Kernthemen nicht. Ein fehlender Kernbeleg, ein Widerspruch, ein Ablauf oder eine echte Änderung sperrt genau das betroffene Thema und den betroffenen Scope.

Der Scope ist Ziel, Ausweisstaat, Dokumentart, Route und Regelklasse. `CN-HK` und `CN-MO` bleiben getrennt. Ein gewöhnlicher Pass, eine Identitätskarte und ein Transit werden nicht ineinander geschoben. Es werden keine Personendaten gespeichert.

## Änderung gegen Asset-Zeitstempel

Rechtlich relevante Text-, Tabellen- und Linkabschnitte werden abschnittsweise verglichen. Ein geänderter Abschnitt sperrt nur sein Thema und seinen Scope.

Neutrale Asset-Zeitstempel sind ausschliesslich der bereits vorhandene BMEIA-Vertrag `bmeia_theme_assets_v3`: genau vier Stylesheet- und fünfzehn Skriptreferenzen unter dem Theme-Pfad. Die TypeScript-Muster sind dieselben POSIX-Ausdrücke wie in `scripts/db/official-truth-at-source-v3/bmeia-theme-assets-v3.function.sql`. Ein gewöhnlicher Link, eine andere Anzahl oder ein anderer Pfad ist keine neutrale Änderung. Dann sperrt die Quelle fail-closed, weil nicht belegt ist, welches Thema unberührt blieb. Auch eine neutrale Asset-Abweichung autorisiert nichts.

## Thailand, synthetisch

Fixture, kein Abruf und kein amtlicher Wortlaut: die Visumbefreiung der Klasse `visa_exemption_60` geht für CH und DE von 60 auf 30 Tage, wirksam ab `2026-09-15`. Die kürzere Dauer bleibt gesperrt, bis ein Mensch sie neu qualifiziert. Der Marker `entry_before_effective_keeps_granted_duration` hält fest, dass eine individuell bereits gewährte Dauer nicht mit der neuen Regel überschrieben wird. Fehlt dieser Marker, kommt der Grund `stock_protection_missing` dazu. Die historische Originalfassung bleibt der Vergleichsmassstab.

Nicht gesperrt durch diesen Fall: `visa_exemption_15`, `visa_on_arrival_15`, `bilateral_separate`, die übrigen Kernthemen derselben 60-Tage-Klasse und der Zusatzhinweis zu den Finanzmitteln. `everyExemptionClassLocked` bleibt falsch. Wird in einer anderen Fixture jede Befreiungsklasse geändert, wird das nur gemeldet. Auch dann gibt es keine Autorisierung und keine pauschale Aufhebung.

## Retry, Widerspruch, Rückweg

Technische Störungen dürfen innerhalb von drei Versuchen manuell wiederholt werden. Der vierte Versuch wird ignoriert. Danach sperrt `technical_retry_exhausted` die Themen dieser Quelle. `unavailable` sperrt sofort und nimmt keinen späteren Treffer aus demselben Fenster an. Eine noch offene Wiederholung ist `not_reproven`, nicht eine Verlängerung.

Zwei abweichende Beobachtungen desselben Abschnitts sind ein Konflikt. Es wird kein Nachfolger gewählt. Die Rückkehr zu den historischen Bytes löscht eine bereits gesetzte Sperre nicht.

## Reproduktion

```bash
node --experimental-test-module-mocks --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-source-care-6-4/dry-run.test.ts
```

Lokal am 27. November 2026, auf diesem Arbeitsstand vor dem Push:

| Prüfung | Ergebnis |
|---|---|
| Dry-run-Testdatei, 12 Tests | 12 bestanden, 0 fehlgeschlagen |
| `tsc -p tsconfig.json --noEmit` | Exit 0 |
| `node scripts/exporte.mjs` | Exit 0, 0 Exporte ohne Aufrufer |
| `node scripts/erreichbarkeit.mjs` | Exit 0, 0 verwaiste Dateien |
| `eslint` auf die beiden neuen TypeScript-Dateien | Exit 0 |

Die Testdatei liegt in `lib/**/*.test.ts` und damit in `test:core`. Ein vollständiger `test:core`-Lauf und ein Production-Build sind in diesem Arbeitsgang nicht gelaufen. Native PostgreSQL-17-Prüfungen der bestehenden BG1-/V8-/MA1-Gates sind nicht erneut ausgeführt. Das ist kein PASS dieser Gates. Die SQL-Datei und `source-bound-renewal.ts` sind nicht geändert. Ein leerer Aufruf von `checkSourceBoundRenewal` bleibt `unavailable`.

## Offene Gates

- Draft. Kein Ready, kein Merge, kein Deploy.
- [#1319](https://github.com/Jetnity/jetnity/issues/1319) bleibt offen. Keine Rechtsabnahme, keine Publikation, kein Besucherflag.
- Dauerhafter Originalspeicher und eine neue Erneuerungsautorisierung brauchen ein eigenes PO-Go. Bis dahin STOP.
- Die Fachzähler aus #1319, einschliesslich 163/500, werden hier nicht fortgeschrieben.
- Paket I und die Oberfläche sind nicht geändert.
- CI auf dem exakten Head ist erst nach dem Push belegbar und bis dahin kein PASS.
