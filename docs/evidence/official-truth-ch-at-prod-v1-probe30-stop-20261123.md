# Jetnity CH→AT Production V1 — autorisierte Probe 30 STOP (23.11.2026)

**Release-Urteil: STOP / KEIN INSTALLATION-COMMIT / KEIN OWNER-AAL2-SCHRITT.**

## Freigegebener Ablauf und tatsächlich verbrauchte Schritte

1. Das alte `00-PRODUCTION-PREFLIGHT.READONLY.sql` wurde nicht wiederholt: am 22.11.2026 war der bekannte `42P01`-Fehler bereits belegt (`official_v3_at_private.whole_originals_v2` existiert in Production nicht). Für die ausdrückliche Owner-Auswahl `00/01` wurde nur das schematolerante **01** verwendet.
2. **Ein Production-READONLY für `01-PRODUCTION-CATALOG-V2.READONLY.sql`** mit vorher in Dev bestätigtem SHA-256 `c495cef4f5fb37d3e28e326ce81ed21b2e878d535070fcdecdace2425c03aa22` lief erfolgreich mit `BEGIN REPEATABLE READ READ ONLY` und `ROLLBACK`. V1-Parent-`official_v3_guard_private.bg1_production_http_allocator_v4` vorhanden, 34 relevante Katalogobjekte und 8 benannte Funktionen mit **unverändertem** Owner/ACL/RLS/Funktions-SHA ggü. dem früheren Katalogsnapshot vom 22.11.2026 21:03 UTC.
3. **Eine Production-Probe `30-PRODUCTION-V1-V2.PROBE-ROLLBACK.sql`** mit SHA-256 `cefcd3654d79d02bb0b7554d5724d36f43cbc5d0e8a32baa82e2cc0bf81c708d` wurde genau einmal versucht. Sie **verweigerte selbst** den Schritt mit SQLSTATE **P7905**, `AT_PROD_V2_HISTORIC_SOURCE_OR_CRON_MISMATCH`, im ersten `DO $pre$`-Prüfblock **vor dem ersten `CREATE TABLE`**. Damit wurden **keine Installations-DDL/DML-Schritte begonnen**, kein Production-Fakt, keine neue Cron, kein BG1-v5 und kein neuer Owner-Beleg angelegt.
4. Strikter STOP: `31-PRODUCTION-V1-V2.INSTALL-COMMIT.sql` **NICHT ausgeführt**; `40-PRODUCTION-POSTCOMMIT.READONLY.sql` und `50-PRODUCTION-VISITOR-READBACK.ROLLBACK.sql` wegen fehlendem Install-PASS **NICHT** ausgeführt. `32/33` **NICHT** ausgeführt, da keine Installation stattgefunden hat. Keine weitere Production-Read-Abfrage oder Wiederholung ohne neues eigenes Go.

## Exakte verweigerte historische Precondition (Ursache noch nicht isoliert)

Es genügt *eine* der folgenden Abweichungen, damit die transparente Fehlermeldung erscheint:

- Anzahl `official_v3_at_production_private.source_pins_v1` ist nicht exakt **3**.
- Anzahl `official_v3_at_production_private.first_originals_v1` ist nicht exakt **3**.
- Zu wenige übereinstimmende `source_pins_v1`/`first_originals_v1`-Originale mit historischer Original-SHA, Byteanzahl, `research_only=true`, `source_qualified=false`, den zwei `legal_source_approved/customer_rule_approved=false`-Kennzeichen und nachgerechneter Body-SHA (Ziel genau 3).
- Einer der drei **historischen** Pins stimmt nicht mit der exakten alten Quellenedition überein (BMI-Matrix SHA `fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778`, 498415 Bytes; BMI-General SHA `ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e`, 91655 Bytes; BMEIA-alt SHA `7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18`, 172460 Bytes).
- Nicht exakt **3** aktive Production-Crons unter Benutzer und DB `postgres` mit den streng gebundenen Namen, fünfminütigen Schedules und exakten Befehlen `enqueue_v1()`, `collect_v1()`, `renew_ch_v1()`.

Die erfolgreiche `01`-Abfrage enthält **nur Katalog-Metadaten** und nicht die Datenzeilen oder vollständigen Cron-Ausführungseinstellungen; sie kann deshalb nicht beweisen, welche dieser Alternativen abweicht. **Keine Ursache raten und keine Schranke lockern.**

## Bereits vorbereitete Rücknahme, aber nicht aktiviert

- Das unveränderte, zuvor von Chief of Staff bestätigte `32-PRODUCTION-V1-V2.ROLLBACK-PROBE.sql` ist auf die gezielte V6-Fail-Closed-Rücknahme vorbereitet, SHA-256 `ee6aeab74f2649878856b8991834b121f09b3784f966c1c5a611d3bd3cbb8507`.
- Das unveränderte `33-PRODUCTION-V1-V2.ROLLBACK-COMMIT.sql`, SHA-256 `cf50526bd7a59050922a364fc3631787a47c15e025c2aa52dcdf8261901c5fa4`, ist **für eine *tatsächlich installierte* v5-Version** ausgelegt und wäre bei der aktuellen, vor-Installations-DDL gestoppten Probe **nicht anwendbar**. Ohne eigene neue PO-Freigabe keines davon ausführen.
- Kein Wiederanlauf CH→DE Zyklus12, kein Live-Frontend-Deploy, keine neuen Rechte, Keys, Kosten, MFA-/Owner-/Passkey-Aktionen.

**Nächster sicherer Schritt:** Nur mit einem **neuen, eng begrenzten Production-READONLY-Go** die fünf obigen Source-/Cron-Prädikate getrennt als Booleans und Counts lesen, ohne HTML-Originalbody oder Benutzer-/Secret-Daten auszugeben. Dann den konkreten Fehler in Dev korrigieren, vollständiges neues Exact-Head-Review/Hashes und ein **neues** Production-Probe-/Installations-Go einholen.
