# Jetnity – Automatic Travel Requirements & Readiness (Foundation C)

Stand: 22. August 2026  
Status: Draft-PR #32, nicht gemergt, kein Production-Schema  
Branch: `feat/travel-readiness-foundation`

## Ziel

Jetnity soll automatisch erkennen, was ein konkreter Reisender für eine konkrete Reise benötigt – und getrennt davon, was der Nutzer selbst vorbereitet hat.

Foundation C liefert den belastbaren Unterbau: Traveller-Kontext, provider-neutrale Requirements-Engine, Missing-Facts, Context-Stale und Freshness. Ohne echten Provider bleibt jede offizielle Aussage `unknown`.

Verbindlicher Leitsatz:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Bei Unsicherheit gilt: `unknown` bleibt `unknown`. Ein LLM ist keine regulatorische Quelle.

## Zwei Wahrheiten

1. **Official Requirement Truth** – nur eine Engine mit Provider-Evidence darf `required`, `not_required` oder `conditional` setzen.
2. **User Preparation Truth** – Nutzer-Häkchen in `trip_readiness_items`. Das ist User Evidence, keine Visa-Bestätigung.

Ein Häkchen darf niemals als „Visum passt“ oder „Einreise geprüft“ erscheinen.

Zulässig:

> Automatische Einreiseprüfung derzeit nicht verfügbar

Unzulässig:

> Deine Reise ist bereit

## Traveller-Kontext

Individuelle, datensparsame Profile in `trip_travellers` bzw. `Trip.party`.

Erlaubt: Anzeigename/neutrale Bezeichnung, Staatsangehörigkeits-Code, Wohnsitz-Code, Dokumenttyp, ausstellendes Land, optionales Ablaufdatum.

Nicht erlaubt: Pass-/Ausweis-/Visa-Nummern, Scans, Geburtsdatum, Gesundheitsakte.

Die Profile sind **trip-spezifisch**, nicht accountweit. Guest und Konto teilen dieselbe Form. Unterschiedliche Nationalitäten werden nie automatisch gleichgesetzt.

`trips.travellers` bleibt die Anzahl. Slots `traveller:1` … `traveller:N` füllen fehlende Profile.

## Requirements-Engine

`Reisegraph + Reisendenkontext + Route/Transit + Datum + Provider → strukturierte Anforderungen`

Ohne Provider: `provider_unavailable` oder `insufficient_context`. Nie eine Visa-Matrix, nie Scraping, nie Modellantwort.

Anforderungsarten: Visa, eTA, Pass, ID, Passgültigkeit, Transit, Gesundheit, Impfung, Gesundheitsdokument, Einreiseformular, Versicherung, Rück-/Weiterflug, Buchungsdokument, sonstige Einreise.

Ergebnisse: `required` | `not_required` | `conditional` | `unknown`  
Status `insufficient_context` und Freshness `provider_unavailable` / `source_temporarily_unavailable` bleiben eigene Achsen – sie werden nicht als `required`/`not_required` umgedeutet.  
Freshness: `never_checked` | `current` | `recheck_needed` | `stale` | `provider_unavailable` | `source_temporarily_unavailable`

Sichere Official-Actions gibt es nur als `open_official_source` aus einer validierten HTTPS-Evidence-URL. Ohne Provider und bei veralteter oder temporär nicht erreichbarer Quelle bleibt `action` leer. Keine URLs aus Modelltext.

Gesundheit: Pflicht, Empfehlung und allgemeiner Hinweis bleiben getrennt. Keine Impfpass-Uploads.

Transit ohne belastbare Zwischenstopps bleibt `insufficient_context` (`transit_itinerary`). Ein Abreiseort-Name allein ist kein Origin-Ländercode.

`routeFactsAusReise()` ist die einzige Origin-/Transit-Naht. Sie liefert heute bewusst leer (`quelle: 'none'`). Strukturierte Flight-/Itinerary-Ländercodes sind die nächste technische Abhängigkeit, nicht eine bereits vorhandene Graph-Fähigkeit.

Offizielle `required` / `not_required` / `conditional` Aussagen brauchen provider-neutrale Official Evidence: Provider-Identität, zeitlich plausibles `checkedAt`, Authority und/oder Rule Reference. Eine Source URL ist für das Resultat optional; wenn vorhanden, muss sie valide HTTPS sein. Official Action gibt es nur aus einer validierten HTTPS-URL. `validFrom` in der Zukunft und abgelaufenes `validUntil` bleiben nicht `current`. Unvollständige oder ungültige Evidence bleibt `unknown`. Untrusted Evidence darf Freshness nicht `current` lassen (ADR-0111).

Ein Provider darf `insufficient_context` mit strukturierten `missingFacts` zurückgeben. Nur tatsächlich fehlende Fakten werden übernommen; bekannte Angaben werden nicht erneut verlangt.

## Progressive Missing Facts

Die Engine fragt nur fehlende, relevante Angaben. Bekannte Fakten werden nicht erneut verlangt. Keine Dokumentnummern.

## User Readiness

Unverändert eigene Domäne `trip_readiness_items`, kein `trip_items.kind`. Context-Fingerprint macht alte Nutzer-Checks nach Reiseänderung `stale` / `not_applicable`.

## Offizielle Naht

`POST /api/readiness/requirements` ist geschlossen.

- Body-Cap, Rate-Limit, `Cache-Control: private, no-store`
- Browser- oder LLM-Felder (`officialResult`, `llmResult`) werden ignoriert
- Source-URLs nur `https`, ohne Credentials
- Factory gibt `null` zurück; Tests dürfen einen Port injizieren
- Kanonische Antwort und einzige neue Official-Truth ist `evaluations[]` (Traveller × Destination × Transit × Requirement Type)
- `official` bleibt eine explizit reduzierte Legacy-Zusammenfassung, immer `result: 'unknown'`, und darf keine neue Logikentscheidung treffen
- Provider-Port ist async; Throw/Timeout bleibt fail closed (`source_temporarily_unavailable` bzw. `provider_unavailable`)
- UI kann gelieferte Evaluations empfangen; ohne Lieferung bleibt der lokale fail-closed Fallback
- Teilweise Transit-Providerzeilen bleiben vollständig: fehlendes angefragtes Transitland → `unknown`; unangefragtes Transitland wird ignoriert

Bevorzugter späterer Kandidat: IATA Timatic / Timatic AutoCheck. Die Domain bleibt provider-neutral. Kein Vertrag, kein Secret, kein Fake-Adapter.

## Gast und Konto

- Gast: `localStorage` (`readinessItems`, `party`)
- Konto: `trip_readiness_items` und `trip_travellers` über RLS
- Guest → Account: nach `reise_anlegen()` zuerst Party, dann Readiness
- `reise_anlegen()` / `reise_aendern()` bleiben unverändert

## UX

Kein sechster Haupt-Tab. In der mobilen Übersicht und auf Desktop nach dem Reisekopf: **Einreise & Reisevorbereitung**.

Zuerst offizielle Prüfung und fehlende Angaben, danach die persönliche Vorbereitung. Status nicht nur über Farbe.

## Development vs Production

- `20260822010000_trip_readiness_items` und `20260822020000_trip_travellers` nur Development
- Production unverändert
- keine neuen Secrets, keine neuen laufenden Kosten

## Nachweis Draft-PR #32

Truth-Freshness-Fix (ADR-0111) auf Draft-PR #32. Exakte Zahlen folgen der Verifikation dieses Heads.

Final-Architecture-Review (ADR-0107 bis ADR-0110) auf Head `4f546a1a`:

- Tests **1251/1251**
- Typecheck, Lint, Hygiene, Auth-Konfiguration und Production-Build grün
- Trip-Workspace-Audit WebKit + Chromium: **678 Kombinationen, 0 Fehler**
- Activities-Regression: **184 Kombinationen, 0 Fehler**
- GitHub CI und Vercel Preview grün
- Preview: `https://jetnity-app-git-feat-travel-readiness-f-f8117d-jetnity-e1b93c82.vercel.app`
- Development-Migration angewendet; Production-Schema unverändert
