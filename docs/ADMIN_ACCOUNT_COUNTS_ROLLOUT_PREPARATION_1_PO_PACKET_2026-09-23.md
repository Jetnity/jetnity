# Admin-Kontenzahlen — Entscheidungspaket für den Product Owner

Stand: 23. September 2026  
Status: **VORBEREITET UND LOKAL GETESTET, NICHT FREIGEGEBEN**  
Das ist kein Nachweis, dass eine Freigabe erfolgt ist. Es ist kein Live-Zähler und keine Production-Aktivierung.

## Kurz

Jetnity kann intern zwei Rohzahlen zeigen: vorhandene registrierte Konten und deren Teilmenge aus den letzten festen 720 Stunden. Die Technik dafür ist lokal vorbereitet und auf einer wegwerfbaren PostgreSQL geprobt (**136/136**, inkl. exakter ACL mit Grantor/`is_grantable` und gestaffelter Installation ohne Client-EXECUTE). **Production, Preview und jeder gehostete Datenbankzugriff bleiben aus.**

Nutzen: ein Admin sieht, wie viele Konten wirklich existieren, ohne Excel, ohne Anbieter, ohne Tracking. Keine Besucher, keine „aktiven Nutzer“, kein Partner-Reach, kein Umsatz.

## Ampel

| Lage | Bedeutung |
| --- | --- |
| **PREPARED** | Lokales Installations-/Prüf-/Rollback-Paket und Enablement-Design sind geschrieben. Akzeptierte SQL-Quellen unverändert, Hashes geprüft. |
| **TESTED** | Disposable PostgreSQL 16.15, privater Socket: gewährter Lokaltest, gestaffelte Installation (Apply+REVOKE in einer Transaktion, Zustand `REVOKED_EXACT`, kein Zwischen-Commit mit Grant), Wiederholung, Fehler ohne Rest, Overloads/`WITH GRANT OPTION`/unerwartete Default-ACL verweigert. Erlaubter Moderator+AAL2 bekam 16/12 nur im gewährten Lokaltest. Abgelehnte und gestaffelte Aufrufer bekamen 42501, keine Null. |
| **NOT RUN** | Echter Browser/MFA-Adminweg; gehostete Session; Production-/Preview-Installation; frische Production-Metadaten durch diesen Agenten; voller App-Build. |
| **BLOCKED** für späteres Live-Zeigen | Ein gesperrtes Moderator-Konto und ein deaktiviertes Admin-Konto **sahen die Zahlen trotzdem**, sobald Rolle und AAL2 passten. Browserbelege der parallelen Spur fehlen. Production-Objekte fehlen noch und dürfen hier nicht erzeugt werden. |

## Was ein späterer Schritt ändern würde — nicht dieser

1. Frische Production-Metadaten/Owner/ACL lesen (nur Technical Lead, read-only).
2. Entscheiden, ob gesperrte/deaktivierte Moderationskonten die Zahlen sehen dürfen. Heute: ja. Das bleibt **NO-GO**, solange das nicht bewusst entschieden oder in einem eigenen Task korrigiert ist.
3. Nur dann: SQL auf der gemeinten Datenbank anwenden — eigener TL-Task, Product-Owner-Production-Gate.
4. Oberfläche danach getrennt einschalten, fest an das genaue Projekt/URL gebunden. Ein Flag allein darf Production nicht öffnen.
5. Parallelspur Browserbelege unabhängig reviewen. Diese Vorbereitung importiert deren unfertige Dateien nicht.

## Drei getrennte Aus-Schalter

- **Oberfläche aus:** bleibt der heutige Default. Schaltet die Anzeige aus, entzieht aber kein Datenbankrecht. Gewährtes EXECUTE bei ausgeschalteter UI ist **datenbankseitig exponiert**, nicht „unexposed“.
- **Recht sofort entziehen / gestaffelt installieren:** `REVOKE` inklusive ausdrücklich `PUBLIC`, in derselben Transaktion wie die Objekterzeugung für den gestaffelten Weg. Dann ist der Zustand `REVOKED_EXACT`: kein Client-EXECUTE/USAGE, kein Zwischen-Commit mit Grant.
- **Objekte entfernen:** nur bei `ALREADY_INSTALLED` oder `REVOKED_EXACT` nach derselben starken Identitätsprüfung (exakte `pg_get_functiondef`-Fingerprints, Owner, Schema, ACL inklusive Grantor/`is_grantable`, Default Privileges leer, keine Extra-Signaturen/Abhängigkeiten). Kein cascading Drop. `WITH GRANT OPTION` und andere Drift bleiben liegen und werden verweigert.

Die Product-Owner-Production-Freigabe für **Datenbankrechte / aufrufbare API** steht **vor** dem ersten gehosteten Grant, nicht erst vor der UI.

## Owner-/ACL-Risiko, ehrlich

Die Zählfunktion läuft als bestehendes `postgres` (kein Superuser, aber BYPASSRLS und SELECT auf `auth.users`). Es wird **keine neue** Privilegrolle gebaut. Das Risiko ist: jedes authentifizierte Konto mit Moderator+ und AAL2 kann die Aggregate auslösen — auch bei `banned`/`disabled` im Profil. Auth-Ban (kein Login) ist etwas anderes als Profilstatus.

Lokal war der Wrapper-Owner der Fixture-Executor `jetnity_proof`. In Production wäre der Owner der ausführenden Rolle, voraussichtlich `postgres`. Default-Privilegien-Zeilen für das Reporting-Schema waren lokal leer; das darf nicht als Production-Katalog gelesen werden.

## Kosten

Kein neues Abo, kein Provider, kein Tracking, keine Domain. Nur bestehende Cursor-Nutzung; Kontingent unbekannt. Eine spätere Production-Anwendung erzeugt keine erfundene Rechnung, aber auch **keine Nullkosten-Garantie**.

## Rollback und Vorbehalte

Lokales Rollback der exakt installierten Objekte: **TESTED**. Unabhängige Sentinel-Tabelle blieb. Production-Rollback wäre später dieselbe Objektliste nach frischer Identitätsprüfung.

Weiterhin geschlossen: Production-Migration, Preview-Einschalten, Provider, Payments, Launch, Domain, Tracking, neue Secrets, Budgeterhöhung.

**Keine Ready-Markierung. Kein Merge. Keine Freigabe durch dieses Paket.**
