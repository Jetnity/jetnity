# Admin in Dev – Nachtauftrag 16. November 2026

## Auftrag und Lieferung

Der Owner beauftragt die BG1-kompatible Vorbereitung der Installation von Kontozählern, CMS und Kampagnen sowie deren Runtime-Anbindung. Der Ortskatalog-Runner in #1212 soll mit einem externen Befehl lauffähig und CI-grün sein, wird aber nicht gestartet. Production, Merges, Kosten und Anmeldung/2FA bleiben beim Owner; die echte Konto-Abnahme folgt nach seiner Anmeldung. Keine Geodaten-/Massenausgaben im Chat.

Alle Änderungen dieser Runde werden **einmal gemeinsam über #1212** veröffentlicht und geprüft. Der bereits grüne Sammelstand #1213 wird vollständig übernommen, einschließlich aller früheren Admin-Pakete, und um den aktuellen Main ergänzt. #1198 ist inzwischen gemergt. #1213 bleibt der historische Nachweis der vorigen Runde; seine Branch-Spitze wird nicht parallel gepusht. Das genaue Ergebnis des gemeinsamen Laufs und die Freigabe stehen in #1212.

## Sicherheits- und Arbeitsplan

- Installation: geprüften BG1-Vorgänger und alle bestehenden Katalog-/Rechtebindungen vor jeder Änderung exakt verlangen; atomare, endliche Erweiterung ausschließlich für die drei bekannten Kandidaten. Historische Baselines bleiben erhalten. Neue Objekte, Rollenabhängigkeiten und Funktionen werden selbst geschützt; keine breite Neuübernahme einer aktuellen Datenbank als vertrauenswürdige Baseline. Eine neue reguläre BG1-Generation ist Voraussetzung der Runtime-Freigabe.
- Runtime: festes Dev-Projekt und genau die Preview-Branch von #1212, explizites Server-Flag, unveränderter Session-Client-Zielabgleich. Bestehende Auth-/Rollen-/AAL2-/Write-Gates, Same-Origin, begrenzte Requests und direkte BG1-Durchsetzung innerhalb der DB. Keine Service-Role als Nutzerersatz. Production bleibt geschlossen.
- Zustandswahrheit: persistente CAS-Versionen und idempotente Vorgangskennungen; bestätigten Commit tatsächlich rücklesen. Nach unklarem Ausgang bleiben nur Kennungen in der URL. Ohne Originalauftrag keine automatische Neuübermittlung; fehlender Nachweis bleibt unbekannt und sperrt weitere Schreibaktionen.
- Typen: generiertes Live-Schema bleibt unverändert, solange diese Installation nicht belegt ist. Ein endlicher, nativer SQL-Vertrag ergänzt genau die vorgesehenen RPCs in `types/admin-dev-runtime.ts`; der geschlossene Scanner bindet jeden Namen an seine konkrete Serverdatei und SQL-Definition.
- Prüfung: lokale gezielte Prüfungen und eine gemeinsame CI mit echtem isoliertem PostgreSQL-/Browserlauf. Keine wiederholten Prüfungen bereits unveränderter Pakete. Kein Ortsimport, kein erfundener Hosted- oder Konto-PASS.

## Vorbereitete Dev-Installation

`scripts/db/admin-runtime-bg1-1/provider-migration-body.sql` ist der atomare, ausschließlich für `yfvbxvijcorffwxbxahl` vorbereitete Provider-Transaktionskörper. `node scripts/db/admin-runtime-bg1-1/build.mjs --check` kontrolliert ihn offline; dieser Befehl installiert nichts. Der Körper liegt absichtlich außerhalb automatisch entdeckter Migrationen. Der genaue ungeänderte BG1-Vorgänger muss vorhanden und aktuell sein; Teilinstallation, Abweichungen oder Wiederanwendung brechen vollständig ab.

Nach einer späteren erfolgreichen Dev-Installation muss zuerst die nächste reguläre, vollständige BG1-Generation bestätigen. Erst danach ist `JETNITY_ADMIN_DEV_RUNTIME_ENABLED=true` für die Preview-Branch `feat/places-catalog-refresh-3-20261115` im bestehenden Dev-Projekt sinnvoll. Vorher bleibt die Oberfläche ausdrücklich nicht verfügbar; das Flag ersetzt keine Datenbank-, Rollen- oder AAL2-Prüfung. Installation, Schalter und echte angemeldete Abnahme werden im PR getrennt als tatsächlich erfolgt oder noch offen ausgewiesen.

## Zuständigkeiten

Root: Integration, gemeinsames Dev-Gate, endliche Typ-/Scanner-Verträge, Import-Einstieg, CI und #1212. `admin_refresh_review`: atomare BG1-Installation und Counts-Aktivierung. `cms_refresh_review`: CMS-Runtime, UI-Transport und veröffentlichter Leser. `translation_status`: Kampagnen-Runtime und persistente DE/EN-Oberfläche. Jede Datei hat einen Writer; geteilte Änderungen werden durch Root integriert.

Details und Abschluss werden direkt in #1212 gepflegt. Der Morgenbericht ist für den nächsten Morgen in Zürich eingerichtet und bleibt bei höchstens fünf Zeilen.
