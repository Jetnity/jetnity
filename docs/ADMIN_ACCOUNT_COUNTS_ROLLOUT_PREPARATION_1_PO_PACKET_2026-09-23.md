# Admin-Kontenzahlen — Entscheidungspaket für den Product Owner

Stand: 23. September 2026  
Status: **VORBEREITET, NICHT FREIGEGEBEN**  
Das ist kein Nachweis, dass eine Freigabe erfolgt ist. Es ist kein Live-Zähler und keine Production-Aktivierung.

## Kurz

Jetnity kann intern zwei Rohzahlen zeigen: vorhandene registrierte Konten und deren Teilmenge aus den letzten festen 720 Stunden. Die Technik dafür ist lokal vorbereitet und wird auf einer wegwerfbaren PostgreSQL geprobt. **Production, Preview und jeder gehostete Datenbankzugriff bleiben aus.**

Nutzen: ein Admin sieht, wie viele Konten wirklich existieren, ohne Excel, ohne Anbieter, ohne Tracking. Keine Besucher, keine „aktiven Nutzer“, kein Partner-Reach, kein Umsatz.

## Ampel

| Lage | Bedeutung |
| --- | --- |
| **PREPARED** | Lokales Installations-/Prüf-/Rollback-Paket und Enablement-Design sind geschrieben. Akzeptierte SQL-Quellen unverändert, Hashes geprüft. |
| **TESTED** | Wird nach der lokalen Probe nachgetragen. Bis dahin nicht behaupten. |
| **NOT RUN** | Echter Browser/MFA-Adminweg; gehostete Session; Production-/Preview-Installation; frische Production-Metadaten durch diesen Agenten. |
| **BLOCKED** für späteres Live-Zeigen | `profiles.status` banned/disabled sperrt privilegierte Aufrufer **nicht**. Browserbelege der parallelen Spur fehlen. Production-Objekte fehlen noch und dürfen hier nicht erzeugt werden. |

## Was ein späterer Schritt ändern würde — nicht dieser

1. Frische Production-Metadaten/Owner/ACL lesen (nur Technical Lead, read-only).
2. Entscheiden, ob gesperrte/deaktivierte Moderationskonten die Zahlen sehen dürfen. Heute: ja, wenn Rolle und AAL2 passen. Das ist ein **NO-GO**, solange das nicht bewusst entschieden oder getrennt korrigiert ist.
3. Nur dann: SQL auf der gemeinten Datenbank anwenden — eigener TL-Task, Product-Owner-Production-Gate.
4. Oberfläche danach getrennt einschalten, fest an das genaue Projekt/URL gebunden. Ein Flag allein darf Production nicht öffnen.
5. Parallelspur Browserbelege unabhängig reviewen. Diese Vorbereitung wartet nicht auf deren unfertige Dateien und übernimmt sie nicht.

## Drei getrennte Aus-Schalter

- **Oberfläche aus:** bleibt der heutige Default. Schaltet die Anzeige aus, entzieht aber kein Datenbankrecht.
- **Recht sofort entziehen:** `REVOKE` inklusive ausdrücklich `PUBLIC`.
- **Objekte entfernen:** nur wenn Signatur/Owner/ACL noch exakt zum Paket passen. Kein `CASCADE`. Nach einem REVOKE verweigert das strikte Rollback — das ist Absicht, kein Defekt.

## Owner-/ACL-Risiko, ehrlich

Die Zählfunktion läuft als bestehendes `postgres` (kein Superuser, aber BYPASSRLS und SELECT auf `auth.users`). Es wird **keine neue** Privilegrolle gebaut. Das Risiko ist: jedes authentifizierte Konto mit Moderator+ und AAL2 kann die Aggregate auslösen — auch bei `banned`/`disabled` im Profil. Auth-Ban (kein Login) ist etwas anderes als Profilstatus.

## Kosten

Kein neues Abo, kein Provider, kein Tracking, keine Domain. Nur bestehende Cursor-Nutzung; Kontingent unbekannt. Eine spätere Production-Anwendung erzeugt keine erfundene Rechnung, aber auch **keine Nullkosten-Garantie** (eine SECURITY-DEFINER-Funktion plus Admin-Lesen bleibt Betrieb, kein neues Produktmodul).

## Rollback und Vorbehalte

Lokales Rollback ist geprobt, sobald TESTED nachgetragen ist. Production-Rollback wäre später dieselbe Objektliste, nach frischer Identitätsprüfung.

Weiterhin geschlossen: Production-Migration, Preview-Einschalten, Provider, Payments, Launch, Domain, Tracking, neue Secrets, Budgeterhöhung.

**Keine Ready-Markierung. Kein Merge. Keine Freigabe durch dieses Paket.**
