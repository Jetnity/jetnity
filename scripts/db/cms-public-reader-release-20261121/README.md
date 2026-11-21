# Öffentlicher CMS-Leser: getrenntes Release vom 21.11.2026

## Umfang

Dieses Paket installiert ausschließlich `public.cms_inspiration_published_v2()`.
Funktionskörper, Sprache, Volatilität, Definer, Eigentümer und Suchpfad entsprechen
dem bereits in Dev installierten Leser aus
`../admin-service-recovery-20261119/candidate.sql`. Der KI-Quotenblock dieses
älteren gemischten Pakets gehört ausdrücklich nicht zum Release.

Die Funktion liest nur die jeweils veröffentlichte Revision eines nicht
archivierten Eintrags. Sie gibt das bestehende Schema 1 mit `entryId`,
`revision`, `content` und `publishedAt` zurück. Entwürfe, andere historische
Revisionen und Akteursfelder gehören nicht zur Projektion. Der statische
Anwendungsfallback bleibt außerhalb dieses SQL-Pakets unverändert.

## Dateien und Anwendung

- `install.sql`: vollständige atomare Installation mit eigener Transaktion.
  Verweigert einen bereits vorhandenen v2, unerwarteten geschützten v1, offene
  private CMS-Grenzen sowie Änderungen an den geprüften bestehenden Katalogen.
- `provider-migration-body.sql`: exakt dieselbe Installation ohne äußeres
  BEGIN/COMMIT, für den bereits autorisierten Supabase-Migrationsanbieter.
  Der Anbieter besitzt die Transaktion. Projekt-ID immer ausdrücklich wählen.
- `readback.sql`: Transaktion mit READ ONLY und abschließendem ROLLBACK.
  Prüft exakte Definition, Attribute und Rechte, vergleicht aktuelle
  Veröffentlichungssnapshots und führt den Leser als echte Datenbankrolle
  `anon` ohne JWT aus. Ausgabe enthält nur Metadaten, öffentliche IDs/Revisionen,
  Anzahl und Laufzeit, keine privaten Inhalte.
- `protected-catalog.sql`: lesender Fingerabdruck für den Vergleich unmittelbar
  vor und nach Installation, Rücknahme oder Dev-Probe. Er ruft keinen Guard auf.
- `dev-rollback-proof.sql`: ausschließlich Dev. Setzt innerhalb einer einzigen
  Transaktion Besitzer-Fixtures mit den echten CMS-Checks/FKs/Triggern, prüft
  zwei genaue öffentliche Revisionen als `anon` und rollt sämtliche Änderungen
  zurück. Kein DDL, keine Auth-Daten, keine JWT-Identität, keine Änderung an
  Privilegien oder Schutzfunktionen. Bestehende Inhalte vorher und nachher
  separat auf Gleichheit prüfen. Bei einem Fehler zunächst ROLLBACK ausführen.
- `rollback.sql`: verweigert einen veränderten Funktionskörper, veränderte
  Attribute/Rechte sowie zusätzliche Abhängigkeiten. Entfernt ausschließlich
  den unveränderten v2 mit RESTRICT, niemals abhängige Objekte.
- `native.test.ts`: tatsächliche isolierte PostgreSQL-17-Prüfung des Installers,
  des identischen Dev-Fixtureskripts, der Leser-/Schreibrechte, der unveränderten
  Vorgänger und der verweigerten/sicheren Rücknahme.

Dev-Projekt: `yfvbxvijcorffwxbxahl`. Production-Projekt:
`qscbgcdmivbbnzrcyegn`. Das Dev-Fixtureskript niemals in Production ausführen.
Das bereits installierte Dev-v2 wird nur gelesen und geprüft; es benötigt keine
erneute Installation oder ersetzende Migration.

## Warum PUBLIC?

Das öffentliche Ausführungsrecht ist für diesen seiteneffektfreien Leser
beabsichtigt: Die ausgegebenen Snapshots sind bereits veröffentlicht. Separate
ACLs für `anon` oder `authenticated` erzeugen zusätzliche globale
Rollenabhängigkeiten in `pg_shdepend`, die der bestehende Guard überwacht.
PUBLIC erzeugt diese individuellen Rollenabhängigkeiten nicht. Dadurch erhalten
auch andere Datenbankrollen denselben öffentlichen Lesezugriff; das ist Teil
dieses expliziten Vertrages. Private Tabellen und alle Admin-Schreibfunktionen
behalten ihre bestehenden Rechte und Auth-/AAL2-Prüfungen.

Die Installation vergleicht alle bestehenden CMS-/Guard-Funktionen, öffentlichen
Admin-/Guard-Routinen, CMS-Tabellenrechte/RLS, Rollen, Mitgliedschaften und
Nicht-postgres-Rollenabhängigkeiten vor und nach der einzigen Hinzufügung.
Sie führt weder den schweren Katalogguard aus noch ändert sie seinen Zustand.
Die vollständige BG1-Laufzeitprüfung verbleibt im vorhandenen unabhängigen
Native-CI-Nachweis; diese fokussierte Prüfung behauptet keine neue BG1-Abnahme.

## Verifikation

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx \
  --test --test-concurrency=1 \
  scripts/db/cms-public-reader-release-20261121/native.test.ts
```

Der vorhandene `cms_native`-CI-Job stellt PostgreSQL 17 aus signierten Paketen
bereit. Diese Datei muss dort sowohl in der expliziten TypeScript-Prüfung als
auch in einem obligatorischen Native-Schritt enthalten sein; kein breiter
Test-Glob und kein stilles Überspringen bei fehlendem PostgreSQL.

Der Native-Nachweis verwendet die bestehenden realen CMS-Tabellen und Writer
sowie die exakten geschützten v1-/Guard-Definitionen als unveränderte Vorgänger.
Er installiert keinen vollständigen BG1-Stack und ersetzt ihn nicht durch einen
No-op: Der neue Leser und der Installer dürfen ihn nicht aufrufen. Das lokale
CMS-Fixture verwendet ausdrücklich synthetische, ausschließlich lokale
Auth-Primitiven und kann keine gehostete Anmeldung bestätigen.

Vor Production müssen sowohl diese CI-Prüfung als auch das Dev-Readback und die
rollback-only Dev-Probe auf dem tatsächlich geprüften Release-Stand bestehen.
Danach Production-Leser installieren, Release-Schalter für den geprüften Build
aktivieren, den Build vor Domainwechsel gegen die vier realen Inhalte prüfen
und erst dann separat live schalten. Der SQL-Readback allein beweist keine
korrekte Anwendungskonfiguration und keine erfolgreiche Live-Anzeige.

## Rücknahme

Zuerst den vorherigen Anwendungsbuild und den bisherigen Schalterwert
wiederherstellen; dadurch benutzen öffentliche Seiten den bisherigen Weg mit
statischem Fallback. Erst danach, falls die Entfernung notwendig ist,
`rollback.sql` auf exakt demselben Zielprojekt ausführen. Nicht gleichzeitig
anderen CMS-DDL ausführen. Bei verweigerter Rücknahme keinen neuen Löschweg
erfinden: Definition/ACL/Abhängigkeit prüfen und die vorhandene Funktion erhalten.
Die vier Veröffentlichungen und ihr gesamter Verlauf bleiben bei jedem
Release- oder Rücknahmeschritt unangetastet.

## Ausführungsstand bei Erstellung

Quellgleichheit und Provider-Transaktionsgleichheit lokal bestanden. Der lokale
Native-Start scheitert explizit mit `local_postgresql_not_available`; dies gilt
nicht als bestandene Datenbankprüfung. Hosted-Dev-, CI- und Release-Evidence
werden im übergeordneten Release-Dokument und PR nach tatsächlicher Ausführung
festgehalten.

