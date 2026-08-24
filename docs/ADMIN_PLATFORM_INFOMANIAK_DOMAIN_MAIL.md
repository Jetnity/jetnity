# Infomaniak / Domain / Mail – Integrationseignung

Stand: 24. August 2026  
Status: **Eignungsprüfung – keine Aktivierung, keine Tokens, keine Schreiboperationen**  
Cursor-Anzeigename: `Admin platform audit`

Quellen: [Infomaniak Developer Getting Started](https://developer.infomaniak.com/getting-started), [FAQ 2581](https://www.infomaniak.com/en/support/faq/2581/discover-the-infomaniak-api), Produktmodell Abschnitt 9. Exakte Scope-Namen am Token müssen vor einer späteren Implementierung im Infomaniak Manager verifiziert werden; dieser Audit erzeugt keinen Token.

## 1. Betriebsrelevanz für Jetnity

Jetnity nutzt Infomaniak für Domains und Mail. Für die Steuerzentrale zählen:

- Existenz und Ablauf von `jetnity.ch`, `jetnity.com` und weiteren relevanten Domains
- Renewal-/Lock-Hinweise soweit die API sie liefert
- Nameserver, DNSSEC
- Mail-DNS: MX, SPF, DKIM, DMARC (API-Records und/oder unabhängige DNS-Lookups)
- Mail-Hosting- und Mailbox-Metadaten: aktiv, Quota, Alias/Weiterleitung, keine Inhalte
- Funktionsadressen `info@`, `support@`, `no-reply@` nur als technische Objekte

Nicht relevant und nicht nachbauen: voller Infomaniak Manager, kDrive, Newsletter-Inhalt, Webhosting-Filemanager, Bestellstrecken.

## 2. API-Eignung

Die offizielle API ist REST+JSON, OAuth2, Basis `https://api.infomaniak.com`. Nutzung laut Anbieter kostenlos. Limit **60 Requests/Minute**, nicht erhöhbar.

Auth:

- Bearer-Token aus dem Manager oder OAuth2 Authorization Code (`https://login.infomaniak.com/authorize`, `https://login.infomaniak.com/token`)
- Scope muss zur Route passen. Offizielles Beispiel: Scope `domains` für `GET /1/domains/account/{account}/domain/{domain}`
- Community-Clients dokumentieren zusätzlich `accounts`, `domain:read`, `dns:read`, `dns:write`, `mail`, `web`, `drive`. Das ist **keine** Jetnity-Autorität. Vor Slice H Scope-Namen am Manager-UI gegen die gewünschten GET-Routen gegenchecken.

Bekannte Betriebsrouten (aus offizieller Doku + öffentlich dokumentierten Clients):

| Bedarf | Typische Route | Richtung |
| --- | --- | --- |
| Accounts | `GET /1/accounts` | read |
| Produkte | `GET /1/products` | read |
| Domains | `GET /1/domain/account/{id}` bzw. Domain-GET | read |
| DNS-Records | `GET /2/zones/{zone}/records` | read |
| Record-Health | `GET /2/zones/{zone}/records/{id}/check` | read |
| Mail-Hostings / Mailboxen | `GET /1/mail_hostings/...` | read |
| DNS schreiben | `POST/PUT/DELETE /2/zones/...` | **write, nicht in Phase 1** |

Antwortform: `{ result: "success"|"error", data, error }`. Fehler und leere Listen müssen im Admin getrennt bleiben.

## 3. Was ohne Mailinhalte möglich ist

Ja: Domainliste, Ablauf, Produktstatus, Zone-Records, Mailbox-Namen/Status/Quota/Alias soweit die Mail-API Metadaten liefert.

Nein als Default: IMAP-Bodies, Nachrichtentexte, Anhänge, Adressbücher Dritter. Auch wenn eine Mail-API das könnte: nicht in Jetnity spiegeln.

Unabhängige DNS-Checks (MX/SPF/DKIM/DMARC über Resolver) sind source-backed, wenn der Resolver-Zeitpunkt gespeichert wird. Sie ersetzen nicht den Infomaniak-Zonenstand. Bei Abweichung: `conflict`/`unknown`, nicht still eine Seite wählen.

## 4. Scope- und Security-Empfehlung

Phase 1 (read-only), sobald ein Gate Tokens erlaubt:

1. OAuth-App oder Manager-Token **nur** mit Domain-/DNS-Read- und optional Mail-Read-Scopes. Kein `dns:write`, kein Produktbestell-Scope.
2. Token nur serverseitig (ENV oder Vault). Nie `NEXT_PUBLIC_`, nie Logs, nie Copilot-Ausgabe.
3. Server-Cache ≥ 60–120 s, Burst-Schutz unter 60/min inkl. anderer Jobs.
4. Account-Id und Domainliste allowlisten (`jetnity.ch`, `jetnity.com`, später explizit ergänzt).
5. Admin-Capability `domain-lesen` (oder vorerst `betrieb-lesen` + Owner-only, Lead entscheidet).
6. Jeder Abruf: `lastCheckedAt`, bei 401/403/429/5xx → `unavailable`/`stale`, nie letzter grüner Cache als aktuell verkaufen ohne Kennzeichnung.

Phase 2 (einzelne Writes), nur nach eigenem Gate:

- eine Aktion pro PR-Typ (z. B. nur TXT für ACME), Step-up, Diff, Audit
- die meisten NS/MX/Mailbox-Änderungen bleiben im Infomaniak Manager

## 5. Was bewusst im Manager bleiben soll

- Domain-Transfer, Registrar-Lock, Inhaberwechsel
- Nameserver-Wechsel
- MX-/SPF-Grundänderungen
- Mailbox anlegen/löschen, Passwort, Delegation
- Produktkauf, Seats, Bezahlung bei Infomaniak
- Alles, was bei Fehlbedienung Mail oder Website global bricht

## 6. Verhältnis zur Legacy-Integration

Die alte Infomaniak-Automatisierung wurde entfernt (ADR-0014/0018), inklusive `admin_email_boxes` und `dns_audit_events`. Das Ziel ist **nicht** diese Automatisierung zurückzubauen. Neu: schmaler Read-Adapter plus später optional winzige, auditierte Writes.

## 7. Kosten

API selbst: keine Nutzungsgebühr laut FAQ 2581. Laufende Kosten: bestehendes Infomaniak-Produkt, Engineering, Secret-Rotation. Kein neues Abo allein für die API.

## 8. Entscheidung

**Eignung: ja, kontrolliert, read-only zuerst.** Nicht blockierend für Slice A–C. Nicht Teil dieses Audit-PRs. Keine Tokens anlegen.
