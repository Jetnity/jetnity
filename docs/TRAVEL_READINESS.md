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

Jetnity besitzt trip-spezifische, individuelle Traveller-Profile in `trip_travellers` bzw. `Trip.party`.

Erlaubte, datensparsame Fakten:

- Anzeigename / neutrale Bezeichnung
- Staatsangehörigkeits-Code
- Wohnsitz-Code
- Reisedokumenttyp
- ausstellendes Land
- optional Ablaufdatum des Dokuments.

Nicht Teil dieser Foundation:

- Pass-/Ausweis-/Visa-Nummern
- Scans
- Geburtsdaten
- Gesundheitsakte
- biometrische Rohdaten
- Zahlungsdaten.

Mehrere Reisende werden getrennt ausgewertet; unterschiedliche Nationalitäten werden niemals automatisch gleichgesetzt.

Guest und Account benutzen dieselbe fachliche Form. Guest-Daten liegen lokal und werden bei Kontoübernahme idempotent übertragen.

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
- Transit
- Health
- Vaccination
- Health Document
- Entry Form
- Insurance
- Return / Onward Ticket
- Booking / Travel Document
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

Eine klickbare Official Action wird nur aus validierter HTTPS-Evidence erzeugt. Keine URLs aus Modelltext.

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

Aktuell liefert sie bewusst `quelle: 'none'`, solange der Reisegraph keine belastbaren Flight-/Itinerary-Ländercodes bereitstellt.

Jetnity rät **nicht** aus Ortsnamen oder Place-Namen auf Länder.

Das ist die nächste strukturelle Abhängigkeit für vollautomatische Transitprüfung.

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

Context Fingerprints sorgen dafür, dass alte Nutzer-Checks nach relevanten Änderungen nicht still weiter als aktuell gelten.

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
- Official Requirement Status, sobald Evidence vorhanden ist.

Status wird nicht nur über Farbe vermittelt.

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

1. strukturierte Origin-/Transit-Ländercodes aus echten Flight-/Itinerary-Daten
2. echter vertrauenswürdiger Travel-Requirements-Provider
3. Preis-/Lizenz-/Datenschutzprüfung für Timatic oder gleichwertigen Provider.

Bis dahin gilt:

> **Keine Fake-Regeln. Keine regulatorischen Aussagen ohne Evidence. `unknown` bleibt `unknown`.**