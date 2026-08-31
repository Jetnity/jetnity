# Jetnity – Automatic Travel Requirements & Readiness

Stand: 22. August 2026  
Status: **Foundation C abgeschlossen, auf `main`, Production-Schema verifiziert**

Abschlussnachweis: `docs/PR32_PRODUCTION_MIGRATION_ACCEPTANCE.md`

---

## Ziel

Jetnity soll automatisch erkennen, was ein konkreter Reisender für eine konkrete Reise benötigt – und getrennt davon, was der Nutzer selbst vorbereitet hat.

Verbindlicher Leitsatz:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Bei Unsicherheit gilt: `unknown` bleibt `unknown`. Ein LLM ist keine regulatorische Quelle.

---

## Zwei Wahrheiten

### Official Requirement Truth

Nur belastbare Provider-/Official-Evidence darf `required`, `not_required` oder `conditional` setzen.

### User Readiness Truth

Nutzer markieren ihren persönlichen Vorbereitungsstand, z. B. offen, erledigt oder nicht relevant.

Ein Nutzer-Häkchen ist **keine** Visa-, Impf-, Pass- oder Einreisebestätigung und verändert Official Evidence nie.

---

## Traveller Context

Foundation E ersetzt die singuläre Foundation-C-Form. Fachdokument: [docs/TRAVELLER_CONTEXT.md](TRAVELLER_CONTEXT.md).

Kanonisch:

- ein stabiler Traveller
- `citizenships[]` (ISO-2)
- `documents[]` (Typ, Aussteller, optionales Ablaufdatum, optionale Citizenship-Relation)
- optionaler Wohnsitzcode

Nicht gespeichert:

- Pass-/Ausweis-/Visa-Nummern
- Scans / MRZ / Bilder
- Geburtsdaten
- Gesundheitsakte
- biometrische Rohdaten
- Zahlungsdaten

Mehrere Reisende und mehrere Credential-Optionen werden getrennt ausgewertet. Ohne Official Evidence vergleicht Jetnity nicht und setzt Nationalitäten nicht gleich.

Guest und Account benutzen dieselbe fachliche Form. Alte Singular-Guest-Daten werden expandiert, nicht verworfen. Account-Writes laufen atomar über `party_schreiben`.

---

## Travel Requirements Engine

Fachlicher Datenfluss:

`Reisegraph + Traveller Context + Route/Transit + Datum + Provider → strukturierte Requirements → Official Evaluations → User Readiness`

Unterstützte Requirement-Kategorien umfassen:

- Visa
- eVisa / ETA / eTA / ESTA / elektronische Reisegenehmigung
- Reisepass
- Identitätsdokument
- Passgültigkeit
- freie Passseiten (`blank_passport_pages`)
- Transit
- Health
- Vaccination
- Health Document
- Entry Form
- Insurance
- Return / Onward Ticket
- Booking / Travel Document
- finanzielle Mittel (`financial_means`)
- weitere Einreiseanforderungen.

Kanonische Resultate:

- `required`
- `not_required`
- `conditional`
- `unknown`

Zusätzliche Zustände / Achsen:

- `insufficient_context`
- `provider_unavailable`
- `source_temporarily_unavailable`
- `never_checked`
- `current`
- `recheck_needed`
- `stale`.

---

## Provider-Port

Die Provider-Grenze ist async und provider-neutral.

- Ein echter Provider darf fehlschlagen oder temporär nicht erreichbar sein, ohne dass Jetnity daraus regulatorische Aussagen erfindet.
- Throw/Timeout bleibt fail closed.
- Provider kann strukturierte `missingFacts` zurückgeben.
- Bekannte Fakten werden nicht erneut angefragt.
- `evaluations[]` ist die kanonische neue Official-Truth.
- alte/Legacy-Zusammenfassungen dürfen keine neue Official-Entscheidung treffen.

Aktuell bevorzugter späterer Kandidat: **IATA Timatic / Timatic AutoCheck**.

Es besteht noch **kein Vertrag**, kein Secret und keine aktive Provider-Anbindung.

---

## Evidence Trust / Gültigkeit

Für vertrauenswürdige Official Results gelten provider-neutrale Trust-Grenzen.

Erforderlich sind u. a.:

- Provider-Identität
- zeitlich plausibles `checkedAt`
- Authority und/oder Rule Reference
- korrekter Traveller-/Destination-/Transit-Kontext
- Context Fingerprint.

Eine Source URL ist für das regulatorische Resultat nicht zwingend, aber falls vorhanden muss sie valide HTTPS sein.

Eine klickbare Official Action braucht eine validierte HTTPS-URL. `sourceUrl` bleibt Evidence- und Informationsquelle und wird niemals automatisch zu Antrag, Formular oder Termin. application/form/appointment entstehen nur aus explizitem `actionPurpose` plus validierter `actionUrl` (ADR-0202). Keine URLs aus Modelltext.

Zeitliche Regeln:

- zukünftiges `validFrom` → nicht `current`
- abgelaufenes `validUntil` → `recheck_needed`
- deutlich unplausibles zukünftiges `checkedAt` → fail closed
- untrusted Evidence darf Freshness nicht `current` lassen.

---

## Multi-Transit

Mehrere Transitländer werden getrennt behandelt.

Wenn der Provider für ein angefragtes Transitland keine Zeile liefert, bleibt dieses Transitland `unknown` statt aus der Liste zu verschwinden.

Unangefragte Transitländer aus Provider-Antworten werden ignoriert.

---

## Route-/Transit-Naht

`routeFactsAusReise()` ist die zentrale Naht für strukturierte Origin-/Transit-Fakten.

Foundation D füllt sie aus validierten Flight-Itineraries (`quelle: 'flight_itinerary'`). Ohne Itinerary bleibt sie `quelle: 'none'`.

Jetnity rät **nicht** aus Ortsnamen oder Place-Namen auf Länder.

Fachlich: [docs/ROUTE_TRANSIT_INTELLIGENCE.md](ROUTE_TRANSIT_INTELLIGENCE.md). Official Transit-Requirements brauchen weiterhin einen echten Provider.

---

## Health / Vaccination

Jetnity kann regulatorische Health-/Vaccination-Requirements als eigene Requirement-Typen behandeln.

Strikte Trennung:

- verpflichtende Einreiseanforderung
- regulatorischer Gesundheitsnachweis
- offizielle Empfehlung
- allgemeiner Reisehinweis
- unbekannt.

Keine Impfpass-Uploads oder persönliche Gesundheitsakte in Foundation C.

Ohne echten Provider macht Jetnity keine Behauptung, wer welche Impfung braucht.

---

## User Readiness / Reiseänderungen

User-Readiness liegt in `trip_readiness_items`.

Context Fingerprints sorgen dafür, dass alte Nutzer-Checks nach relevanten Änderungen nicht still weiter als aktuell gelten. Die aktuelle Identität ist `v4|sha256:…` über eine kanonische JSON-Struktur inklusive aufgelöster Dokument-Citizenship, nicht über delimiterbasierte Konkatenation. Persistierte v2- und v3-Werte werden dadurch stale.

Relevante Änderungen können u. a. sein:

- Destination
- Datum
- Route / Transit
- Traveller
- Nationalität
- Wohnsitz
- Dokumenttyp
- ausstellendes Land
- Dokumentablauf.

Je nach Änderung werden Punkte stale, recheck-needed oder nicht mehr relevant.

---

## UX

Kein sechster Haupt-Tab.

Im Trip Workspace erscheint:

**Einreise & Reisevorbereitung**

Die Oberfläche zeigt zuerst Official Status / fehlende Fakten und danach persönliche Vorbereitung.

Der Nutzer sieht u. a.:

- offen
- erledigt
- erneut prüfen
- nicht relevant
- fehlende Traveller-Fakten
- Official Requirement Status, sobald Evidence vorhanden ist
- eine Checkliste je `OfficialEvaluation` (Traveller × Credential-Option × Destination/Transit × Requirement Type), nicht nur eine Summe pro Reisendem.

Offizielle Einzelzeilen nutzen fail-closed Ergebnis-/Freshness-Copy, strukturierte Visa-/eTA-Labels und purpose-spezifische Action-Texte. `checkedAt` ist Jetnity-Prüfzeit, nicht „Quelle zuletzt aktualisiert“. Status wird nicht nur über Farbe vermittelt. Relative Zeitfenster (`Ab 72 Std. vor Ankunft möglich`, Pflichtfrist vs. Empfehlung) erscheinen nur aus einer normalisierten `temporalRule`, niemals als konkretes Kalenderdatum.

---

## API / Security

`POST /api/readiness/requirements` ist geschlossen und fail closed.

Schutzmaßnahmen:

- Body-Cap
- Rate-Limit
- `Cache-Control: private, no-store`
- Browser-/LLM-Felder können Official Truth nicht setzen
- kein Client-Secret
- kein Service-Role-Weg im Browser
- Official Source URLs nur HTTPS ohne Credentials.

---

## Persistenz / Supabase Production

Production-Migrationen:

- `20260822010000_trip_readiness_items`
- `20260822020000_trip_travellers`

Beide sind auf Production angewendet und verifiziert.

RLS:

- aktiv auf beiden Tabellen
- Policies nur für `authenticated`
- Owner-Grenze `user_id = auth.uid()`
- `anon` / `public` ohne Tabellenrechte.

---

## Qualitätsnachweis

Finaler Foundation-C-Stand vor Merge:

- `npm test`: **1252/1252**
- Typecheck grün
- Lint grün
- Hygiene grün
- Auth-Konfiguration grün
- Production-Build grün
- Trip-Workspace-Audit WebKit + Chromium: **678 Kombinationen, 0 Fehler**
- Activities-Regression: **184 Kombinationen, 0 Fehler**
- GitHub CI grün
- Vercel Preview READY

Nach Merge:

- `main` Squash-Merge: `b50d2ce9ebc4e50da858f67258f94f887b183f79`
- Vercel Production für diesen Merge-Commit: **READY**
- Supabase Production-Schema: verifiziert.

---

## Noch offen

Foundation C selbst ist abgeschlossen. Noch fehlen für das volle Nutzerziel:

1. strukturierte Origin-/Transit-Ländercodes aus Flight-Itineraries: Foundation D, auf `main` und Production
2. 1:n Traveller Context: Foundation E, Draft PR, Development-Migration angewendet, Production unverändert
3. echter vertrauenswürdiger Travel-Requirements-Provider
4. Preis-/Lizenz-/Datenschutzprüfung für Timatic oder gleichwertigen Provider.

Bis dahin gilt:

> **Keine Fake-Regeln. Keine regulatorischen Aussagen ohne Evidence. `unknown` bleibt `unknown`.**