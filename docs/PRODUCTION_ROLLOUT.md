# Jetnity – kontrollierter Production-Rollout Phase 3.1

**Stand:** 20. August 2026  
**Status:** vorbereitet, **nicht ausgeführt**. Production bleibt unverändert, bis eine ausdrückliche Freigabe vorliegt.

Diese Datei ist die einzige Anleitung, Airports, Places und die vier Schema-Nachträge nach Production zu bringen. Sie ersetzt keinen Freigabeschritt.

Zugehörige Entscheidung: ADR-0069 in [DECISIONS.md](../DECISIONS.md). Fachlich: [FLUGHAFEN.md](FLUGHAFEN.md), [ORTE.md](ORTE.md), [DATENBANK.md](DATENBANK.md).

---

## 1. Bestätigter Production-Stand (vor dem Rollout)

| Fakt | Wert |
| --- | --- |
| Letzte Migration | `20260820080000` |
| `public.airports` | 40 historische Zeilen |
| `public.places` | existiert nicht |
| `trips.origin_place_id` / `trip_stages.place_id` | existieren nicht |
| Modellweg | aus |
| Duffel-Flugsuche | aus |

---

## 2. Geprüfte Migrationsreihenfolge

Genau diese vier Dateien, in dieser Reihenfolge, nicht früher und nicht durcheinander:

| # | Datei | Art | Wirkung auf Bestand |
| --- | --- | --- | --- |
| 1 | `20260820100000_reise_anlegen_handelsfelder.sql` | `CREATE OR REPLACE FUNCTION` `reise_anlegen` | Keine Tabelle, keine Zeile. Schreibt optionale Handelsfelder, wenn die Nutzlast sie trägt. |
| 2 | `20260820110000_airports_referenz.sql` | additive Spalten + CHECKs + Index | Bestehende 40 Airport-Zeilen bleiben. Neue Spalten sind nullable. Constraints gelten nur, wenn Werte gesetzt sind oder dem Muster entsprechen. |
| 3 | `20260820120000_places_referenz.sql` | neue Tabelle `places`, nullable FKs, `reise_anlegen` | Bestehende Reisen bekommen `origin_place_id` / `place_id` = null und bleiben lesbar. Auth-Nutzer und Profile werden nicht angefasst. |
| 4 | `20260820130000_reise_aendern_places.sql` | `CREATE OR REPLACE FUNCTION` `reise_aendern` | Keine Tabelle. Schreibt optionale Ortsreferenzen aus der Nutzlast. |

Geprüft:

- Alle Änderungen sind additiv oder ersetzen eine Funktion mit derselben Signatur.
- Keine `DROP TABLE`, kein Truncate, kein Umschreiben von `auth.users` oder `profiles`.
- Keine Aktivierung von `JETNITY_MODELL_AKTIV` oder `JETNITY_FLIGHT_AKTIV`.
- Kein Duffel-Token, keine Live-API.
- `20260820110000` zerstört die 40 Airport-Zeilen nicht. Ein späterer Import **upsertet** über `iata`. `--bereinigen` ist im Production-Modus abgelehnt, damit historische Zeilen ausserhalb des OurAirports-Filters nicht gelöscht werden.
- Bestehende Reisen ohne Place-ID bleiben gültig (`NULL` ist erlaubt, der Lese-Pfad behandelt fehlende IDs als null).

Wenn `20260820110000` an einem CHECK scheitert, hat eine historische Airport-Zeile ein ungültiges IATA/ICAO/Lat/Lon. Dann den Rollout **abbrechen**, nicht importieren. Der read-only Check meldet solche Zeilen vorher.

---

## 3. Sicherheitsmechanismus

Die Importer dürfen Production nicht mehr „aus Versehen“ beschreiben. Der Development-Schutz (`ziel()`: nur Branch) bleibt. Production ist ein **zweiter, engerer** Weg.

| Schicht | Verhalten |
| --- | --- |
| Default | Probe. Nichts wird geschrieben. |
| Development | `--schreiben --entwicklung`. `ziel()` verlangt einen Supabase-**Branch**. Ein eigenständiges Projekt wird abgelehnt. |
| Production | `--schreiben --produktion --projekt-ref <exakter Ref>`. |
| Ref-Bestätigung | `--projekt-ref` muss **zeichenweise** mit `SUPABASE_PROJECT_REF` übereinstimmen. Kein stiller Default-Ref im Repository. |
| Management API | `/v1/projects/{ref}` muss 200 sein (eigenständiges Projekt). Ein Branch (`/v1/branches/{ref}` = 200) wird im Production-Modus abgelehnt. |
| Unklar | Jeder andere Status, fehlender Token, fehlender Ref → sofort abbrechen. |
| `--bereinigen` | Im Production-Modus abgelehnt. |
| `--entwicklung` + `--produktion` | Abgelehnt. |
| Secrets | Token, JWT und Schlüssel werden nicht geloggt. |
| CI / Build / Merge | rufen den Import nicht auf. `prebuild` und `npm test` enthalten keinen Import. |

`npm run db:anwenden` ist ebenfalls geschützt: ohne Flags nur Development-Branch. Production-Schema nur mit `--produktion --projekt-ref <Ref> --bis 20260820130000`. Ohne `--bis` oder mit einem höheren Grenzwert bricht der Lauf ab.

Zwei getrennte Aussagen, kein Widerspruch:

- **Tatsächlicher Production-Stand:** `20260821100000_trip_items_booking_status` (PR #29), `20260821120000_trip_items_mobility` (PR #30) und `20260821200000_trip_items_rental_car` (PR #31) sind nach ausdrücklicher Nutzerfreigabe auf Production angewendet. Mietwagen-Nachweis: [PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md](PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md).
- **Playbook-Grenze:** Automatische Production-Läufe von `npm run db:anwenden` stoppen bei `20260820130000`. Das ist eine Guardrail gegen unbeabsichtigtes Nachziehen späterer Dateien, kein Gegenbeweis zum realen Production-Stand. Die Mietwagen-Migration wurde über den freigegebenen Supabase-Branch-Migrationsweg übernommen, nicht über diese Guardrail.

Eine Production-Anwendung späterer Migrationen braucht eine neue ausdrückliche Freigabe. Die Production-Mietwagensuche bleibt aus.

**Foundation C (Travel Readiness):** `20260822010000_trip_readiness_items` bleibt ausschließlich Development. Diese Datei aktiviert weder Production-Readiness noch einen Anforderungs-Provider. Keine Production-Migration ohne neue ausdrückliche Freigabe.

`npm run production:pruefen` ist vollständig read-only: nur `SELECT` auf Bestand und PostgreSQL-Metadaten (Rechte, RLS, Policies). Kein HTTP-POST, kein INSERT/UPDATE/DELETE.

---

## 4. Manuelle Release-Schritte

Erst nach ausdrücklicher Freigabe. Jeder Schritt ist idempotent, ausser einem gescheiterten CHECK in Schritt 2.

Umgebung lokal setzen (nicht committen):

```bash
export SUPABASE_PROJECT_REF='<production-project-ref>'
export SUPABASE_ACCESS_TOKEN='<pat>'
```

Den Ref aus dem Supabase-Dashboard kopieren. Nicht raten.

### Schritt 0 – Vorab, read-only (unter 1 Minute)

```bash
npm run production:pruefen -- --produktion --projekt-ref "$SUPABASE_PROJECT_REF" --vorab
```

Prüft nur historische Airport-Constraints und die Kill Switches. Places dürfen fehlen, 40 Airports sind hier kein Fehler. Schreibt nichts. Schlägt der Constraint-Check fehl: **nicht** Schema anwenden.

### Schritt A – Schema (wenige Minuten)

```bash
npm run db:anwenden -- --produktion --projekt-ref "$SUPABASE_PROJECT_REF" --bis 20260820130000 --probe
npm run db:anwenden -- --produktion --projekt-ref "$SUPABASE_PROJECT_REF" --bis 20260820130000
```

`--probe` muss genau die vier Dateien aus Abschnitt 2 zeigen. Der Ausgang muss `20260820080000` sein. Spätere Dateien nach `20260820130000` werden gemeldet und nicht angewendet. Weicht Production davon ab: **abbrechen**.

Scheitert eine Migration: **Rollout abbrechen.** Nicht importieren.

### Schritt B – Airports upserten (ca. 5–10 Minuten)

```bash
npm run airports:importieren -- --schreiben --produktion --projekt-ref "$SUPABASE_PROJECT_REF"
```

Ohne `--bereinigen`. Erwartete Grösse um 5 332 Zeilen, akzeptiert 4 000–8 000. Pflichtcodes: ZRH, GVA, BSL, LHR, JFK, DXB, BKK sowie HND oder NRT.

Ein zweiter Lauf desselben Befehls ist sicher (UPSERT).

### Schritt C – Places aus GeoNames + Production-Airports (ca. 20–45 Minuten)

```bash
npm run places:importieren -- --schreiben --produktion --projekt-ref "$SUPABASE_PROJECT_REF"
```

Airports müssen schon in Production liegen, weil Flughafen-Orte daraus kopiert werden. Erwartete Grösse um 124 811, akzeptiert 100 000–200 000. GeoNames-Dumps können sich ändern; nicht auf die Development-Zahl hart prüfen.

### Schritt D – Read-only Verifikation

```bash
npm run production:pruefen -- --produktion --projekt-ref "$SUPABASE_PROJECT_REF"
```

Der Check schreibt nichts, auch nicht bei fehlerhaftem RLS: Schreibschutz kommt aus `role_table_grants`, `pg_policies` und `relrowsecurity`. Er prüft Tabelle, Anzahlen, Pflichtbeispiele, Fantasieorte, Rechte (SELECT ja, INSERT/UPDATE/DELETE/TRUNCATE nein), lesbare Reisen ohne Place-ID sowie die Code-Kill-Switches für Modell und Duffel.

### Schritt E – Code

Erst wenn A–D grün sind, den Draft-PR reviewen. Merge bleibt eine eigene Freigabe. Mark Ready nicht ohne den Importnachweis.

---

## 5. Erwartete Dauer

| Schritt | Dauer |
| --- | --- |
| Vorab-Check | unter 1 Minute |
| Schema (4 Migrationen) | unter 2 Minuten |
| Airport-Import | 5–10 Minuten |
| Place-Download + Import | 20–45 Minuten (Dump-Grösse und Management-API) |
| Read-only Check | unter 2 Minuten |
| **Summe** | **etwa 30–60 Minuten** |

Kein Cron, kein Deploy-Hook, kein Merge-Hook.

---

## 6. Rollback- und Fehlerstrategie

Airports und Places sind Referenzdaten. Der normale Rollback ist **kein** `DROP TABLE`.

| Lage | Handlung |
| --- | --- |
| Schemafehler vor Import | Abbrechen. Production-Code nicht mergen. Den Fehler in der Migration oder in den historischen Airport-Zeilen beheben, erneut `--probe`. |
| Teilimport Airports | Denselben Production-Import erneut ausführen. UPSERT ergänzt fehlende IATA und überschreibt bekannte. |
| Teilimport Places | Denselben Production-Import erneut ausführen. UPSERT über `places.id`. |
| Importfehler nach erfolgreichem Schema | Kein Code-Merge. Bestand mit `production:pruefen` lesen. Danach denselben Import wiederholen. |
| Falsches Ziel erkannt | Die Schutzschichten müssen bereits abgebrochen haben. Nichts nachträglich löschen. |
| Destruktiver Rollback | Nicht vorgesehen. Tabellen nicht droppen, historische Airports nicht truncaten. |

Funktionen (`reise_anlegen`, `reise_aendern`) können durch erneutes Anwenden derselben Datei ersetzt werden. Nullable Spalten können stehen bleiben; sie stören Alt-Reisen nicht.

---

## 7. Was dieser Rollout bewusst nicht tut

- Modellweg nicht einschalten
- Duffel nicht einschalten, kein Test- und kein Live-Token
- Hotelsuche, Aktivitätensuche, Transfers und Mietwagen in Production nicht einschalten; Foundation existiert, Provider und Production-Freigabe fehlen
- Production nicht aus CI, Build oder Merge befüllen
- Duffel-Sandbox nicht als Merge-Blocker behandeln; das ist eine nachgelagerte Provider-Verifikation

---

## 8. Nach dem Rollout

Production hat dann Schema und Referenzdaten. Die Suche gegen `public.places` / `public.airports` wird wirksam, sobald der Code dort läuft. Kill Switches bleiben aus:

- `JETNITY_MODELL_AKTIV` nicht auf `true`
- `JETNITY_FLIGHT_AKTIV` nicht auf `true`
- `JETNITY_HOTEL_AKTIV` nicht auf `true`
- `JETNITY_ACTIVITY_AKTIV` nicht auf `true`
- `JETNITY_MOBILITY_AKTIV` nicht auf `true`
- `JETNITY_RENTAL_CAR_AKTIV` nicht auf `true`
- kein `DUFFEL_ACCESS_TOKEN` in Production
