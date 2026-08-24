# Jetnity – Provider Readiness S2-B1 / unabhängiger Technical-Lead-Re-Review

Stand: 24. August 2026

Status: **REQUEST CHANGES – neuer Blocker S2-B2: direkte `trip_items`-Mutation umgeht die Flug-Trust-Grenze**

Draft-PR: `#51`
Branch: `feat/provider-flight-evidence-s2`
Review-relevanter Runtime-Head: `f8af2059181e1f47d686893a1b5538441c6e2554`
Docs-only Head vor diesem Review: `ff89e4876cbfab01bfa521aa01e6628862c91721`

## 1. S2-B1 selbst ist korrekt geschlossen

Der freigegebene B1-Fix ist auf Supabase Development vorhanden und erfüllt den konkreten Auftrag für `public.reise_anlegen(jsonb)`:

- neue additive Migration `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis` ist auf Development angewendet;
- `reise_anlegen` bleibt `SECURITY INVOKER`;
- `authenticated` behält `EXECUTE`, `anon` hat kein `EXECUTE`;
- für `kind='flight'` werden `price_amount`, `price_currency`, `provider`, `external_ref` und `booking_url` in beiden RPC-INSERT-Pfaden verworfen;
- Route-Itinerary bleibt Foundation-D-Truth;
- Hotel-/Activity-/Mobility-/Rental-Verträge werden durch diesen Fix nicht global genullt;
- die neuen Direct-RPC-Regressionen sind vorhanden.

Live-Supabase-Verifikation während dieses Re-Reviews:

- Development enthält Migration `20260824160000`;
- Production enthält diese Migration nicht;
- Development-`reise_anlegen` enthält die Flight-Nulling-Regel;
- Production-`reise_anlegen` enthält sie noch nicht.

Die dokumentierten Exact-Head-Gates auf `f8af2059` sind konsistent:

- `npm test`: 1755/1755;
- DB-Rechte/RLS/Sicherheit/Parallelität grün, `db:sicherheit` 219/219;
- Production Build 38/38, Exit 0;
- Trip-Workspace UI-Audit 1014/1014, 0 Fehler;
- GitHub Actions SUCCESS;
- Vercel Preview `dpl_F4b8YUcqqsp8DBShrZeoCuBf2NMU` ist READY auf exakt `f8af2059`.

## 2. Neuer Blocker S2-B2 – direkter Tabellen-Write bleibt offen

### Befund

Die S2-Produktregel lautet weiterhin:

> Browserdaten dürfen keine kommerzielle Flugwahrheit persistieren.

B1 schützt den öffentlichen Anlage-RPC. Die Tabelle `public.trip_items` selbst bleibt aber für `authenticated` direkt schreibbar:

- `authenticated` besitzt `INSERT`, `UPDATE`, `DELETE` und `SELECT` auf `public.trip_items`;
- RLS-Policy `trip_items_anlegen` erlaubt INSERT, wenn `user_id = auth.uid()`;
- RLS-Policy `trip_items_aendern` erlaubt UPDATE eigener Zeilen;
- vorhandene Trigger schützen Graph-Revision und Route-Itinerary, aber nicht `price_amount`, `price_currency`, `provider`, `external_ref` oder `booking_url` für `kind='flight'`.

Damit kann ein angemeldeter Browser die Server Actions und `reise_anlegen` komplett umgehen und direkt über den Supabase/PostgREST-Tabellenvertrag eine eigene Flight-Zeile mutieren.

### Live-Reproduktion auf Supabase Development

Der Re-Review hat einen bestehenden eigenen Flight-Testdatensatz innerhalb einer Transaktion als Rolle `authenticated` mit passender `auth.uid()` direkt aktualisiert:

- `price_amount = 777`
- `price_currency = 'USD'`
- `provider = 'browser-direct'`
- `external_ref = 'direct-ref'`
- `booking_url = 'https://browser.example/x'`

Das UPDATE wurde akzeptiert und die Werte waren innerhalb der Transaktion lesbar. Anschließend wurde die Transaktion vollständig zurückgerollt; der Datensatz ist nachweislich wieder unverändert/null.

Dies ist ein realer Trust-Boundary-Bypass und kein theoretischer Befund.

## 3. Konsequenz

S2-B1 ist technisch korrekt, aber S2 als End-to-End-Trust-Vertrag ist noch nicht geschlossen.

Ein authentifizierter Client kann weiterhin kommerzielle Flugfelder als eigene Wahrheit persistieren, nur jetzt über `trip_items` direkt statt über `reise_anlegen`.

RLS schützt Eigentum, nicht Provenienz. Genau deshalb reicht die bestehende User-ID-Policy hier nicht.

## 4. Erforderliche Fix-Richtung

Der nächste Fix muss **S2-B2** schließen und dabei den späteren vertrauenswürdigen Provider-Pfad nicht unkontrolliert verbauen.

Verbindliches Ziel:

1. Ein direkt authentifizierter Tabellen-`INSERT` oder `UPDATE` auf `trip_items` darf für `kind='flight'` die fünf unbewiesenen Handelsfelder nicht setzen oder erhalten.
2. Bestehende normale App-Pfade für Notizen, Zeiten, Itinerary und manuellen User-Buchungsstatus bleiben funktionsfähig.
3. Hotel/Activity/Mobility/Rental dürfen nicht pauschal beschädigt werden.
4. Keine Service Role als Abkürzung.
5. Kein zweiter Route-Truth-Pfad.
6. Ein späterer vertrauenswürdiger Flight-Nachweis muss über einen explizit getrennten serverseitigen Schreibvertrag möglich bleiben.

Die konkrete DB-Architektur ist im separaten B2-Fix-Auftrag zu prüfen. Falls eine saubere Lösung eine breitere Rechte-/RPC-Neuarchitektur erfordert, muss der Cursor-Agent stoppen und den Befund melden statt Scope still zu erweitern.

## 5. Pflichtregressionen für S2-B2

Mindestens:

1. Direktes `authenticated` UPDATE eines eigenen `kind='flight'` kann `price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url` nicht als unbewiesene Werte persistieren.
2. Direktes `authenticated` INSERT eines eigenen Flight-Punkts kann diese Felder ebenfalls nicht als unbewiesene Werte persistieren.
3. `reise_anlegen`-B1-Regressions bleiben grün.
4. Nichtkommerzielle Flight-User-Intake-Felder bleiben gemäß bestehendem Vertrag möglich.
5. Manueller `booking_status`/`booking_source='user'` bleibt möglich.
6. Foundation-D Route-Itinerary bleibt unverändert geschützt.
7. Hotel/Activity/Mobility/Rental bleiben unverändert.
8. Guest→Account bleibt ohne Hochstufung.
9. DB Rights/RLS/Security/Parallelity vollständig grün.
10. Vollständige lokale Suite, Production Build, UI-Audit, GitHub Actions und Vercel auf neuem Exact Runtime Head grün.
11. Production bleibt unverändert, solange keine separate Product-Owner-Freigabe vorliegt.

## 6. Zusätzliches Integrations-Gate

Der aktuelle S2-Runtime-Head `f8af2059` ist gegenüber aktuellem `main` bereits divergiert. Aktuelles `main` enthält inzwischen Account AP-1. Vor einer späteren Merge-Entscheidung muss PR #51 nach technischem S2-Abschluss sauber auf den dann aktuellen `main` synchronisiert und erneut exakt gegatet werden.

Das ist kein Ersatz für S2-B2, sondern ein späteres Integrations-Gate.

## 7. Governance

- PR #51 bleibt Draft.
- Kein Mark Ready.
- Kein Merge.
- Kein S3.
- Keine Production-Migration.
- Keine Provider-/Secret-/Kosten-Aktivierung.
- Der bisherige Product-Owner-Satz autorisierte ausschließlich **S2-B1** und dessen eine Development-Migration. Er autorisiert nicht automatisch einen neuen S2-B2-DB-Fix.

Daher: B2-Fixauftrag vorbereiten, aber **keine neue Development-Migration anwenden**, bevor der Product Owner diesen zusätzlichen DB-Scope ausdrücklich freigegeben hat.
