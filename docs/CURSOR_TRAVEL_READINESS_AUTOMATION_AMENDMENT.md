# Cursor-Nachtrag – Foundation C: Automatic Travel Requirements & Readiness

Stand: 22. August 2026  
Branch: `feat/travel-readiness-foundation`  
Draft-PR: `#32 – Foundation C – Travel Readiness & Dokumente`  
Status: **verbindlicher Produkt- und Architektur-Nachtrag**

Dieser Nachtrag ergänzt und überschreibt `docs/CURSOR_TRAVEL_READINESS_FOUNDATION_TASK.md` überall dort, wo der ursprüngliche Auftrag davon ausgeht, dass Nutzer Visa-, Einreise-, Impf-, Gesundheits- oder Dokumentanforderungen grundsätzlich selbst recherchieren müssen oder dass Foundation C dauerhaft nur eine manuelle Checkliste bleiben soll.

## Ziel

Jetnity soll automatisch erkennen und auswerten, was ein konkreter Reisender für eine konkrete Reise benötigt. Dazu gehören Visa/eVisa/ETA/ESTA/Visa on Arrival, Pass/ID und Passgültigkeit, Transit, verpflichtende Impf-/Health-Nachweise, Einreiseformulare, Rück-/Weiterflugnachweise, Versicherungsnachweise und weitere verpflichtende Dokumente.

Der Nutzer soll diese Anforderungen nicht selbst im Internet zusammensuchen müssen.

## Travel Requirements Engine

Foundation C baut eine provider-neutrale Engine:

`Reisegraph + Reisendenkontext + Route/Transit + Reisedatum + vertrauenswürdige Requirements-Datenquelle → strukturierte Anforderungen → Jetnity Readiness → konkrete Nutzeraktionen`

Ein LLM darf erklären, priorisieren und fehlende Angaben erkennen, aber keine regulatorische Wahrheit erfinden. Ohne belastbare Evidence niemals selbst `required` oder `not_required` für Visa, Impfungen, Dokumente oder Transit setzen.

## Provider

Aktuell bevorzugter Kandidat für die spätere echte Integration ist IATA Timatic / Timatic AutoCheck. Jetnitys Domain bleibt provider-neutral.

In diesem PR keine Verträge, Accounts, Kosten, Secrets, Fake-Timatic-Adapter, globale hartcodierte Visa-Matrix, unkontrolliertes Scraping oder LLM-Regeln.

## Traveller Context

Die reine Anzahl `travellers` reicht nicht. Foundation C schafft individuellen, datensparsamen Reisendenkontext und dokumentiert das Datenmodell per ADR.

Mögliche notwendige Fakten: Traveller-ID, Anzeigename/neutrale Bezeichnung, Staatsangehörigkeits-Ländercode, Wohnsitz-Ländercode, Reisedokumenttyp, ausstellendes Land, optional Dokument-Ablaufdatum falls nötig.

Nicht speichern: Pass-/Ausweis-/Visa-Nummern, Kreditkartendaten, Dokumentscans, biometrische Rohdaten. Kein Dokumententresor.

Mehrere Reisende müssen getrennt ausgewertet werden. Unterschiedliche Nationalitäten dürfen nie automatisch dieselben Requirements bekommen.

## Progressive Missing Facts

Bekannte Reise- und Traveller-Fakten wiederverwenden. Die Engine bestimmt strukturierte `missingFacts`; Jetnity fragt nur fehlende relevante Angaben ab und prüft danach automatisch erneut.

## Requirement Domain

Scope mindestens: Trip, Traveller, Destination, Transit, optional Segment/Stage.

Requirement Types mindestens: `visa`, `electronic_travel_authorization`, `passport`, `identity_document`, `passport_validity`, `transit`, `health`, `vaccination`, `health_document`, `entry_form`, `insurance`, `onward_or_return_ticket`, `booking_or_travel_document`, `other_entry_requirement`.

Result mindestens: `required`, `not_required`, `conditional`, `unknown`, `insufficient_context`, `provider_unavailable`.

Evidence mindestens: Provider, Autorität/Source, belastbare Source URL falls vorhanden, `checkedAt`, optional `validFrom`/`validUntil`, Rule-Reference, Context Fingerprint, Traveller-ID, Destination-/Transit-Country-Code. Browser darf Official Evidence nicht frei behaupten.

## Health

Regulatorische Impf-/Health-Anforderungen automatisch erkennen können, ohne Gesundheitsakte. Pflicht, regulatorischer Nachweis, offizielle Empfehlung, allgemeiner Reisehinweis und unknown strikt unterscheiden. Keine Impfpass-Uploads, Diagnosen oder unnötige Gesundheitsdaten.

## Truth, Re-Evaluation und Freshness

Official Requirement Truth und User Readiness strikt getrennt. Nutzer-`done` verändert Official Evidence nie.

Relevante Änderungen machen Evaluations stale: Destination/Land, Transit, Datum/Route, Traveller, Nationalität/Wohnsitz, Dokumenttyp/ausstellendes Land/Ablaufdatum.

Zusätzlich zeitliche Freshness: aktuell geprüft, Recheck nötig, veraltet, Provider nicht erreichbar, Quelle temporär nicht verfügbar. Alte Regeln nicht dauerhaft als aktuell behandeln.

## Provider Interface

Input muss relevante strukturierte Fakten aufnehmen können: Origin, Destinations, Transit Itinerary, Travel Dates, Traveller Nationality, Residence, Document Type, Issuing Country und weitere tatsächlich nötige Fakten. Output wird in Jetnitys eigene Domain normalisiert.

Ohne echten Providerzugang ehrlich `provider_unavailable` oder `insufficient_context`.

## UX

Fünf Hauptbereiche bleiben: `Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`.

Keinen sechsten Haupt-Tab erzwingen. In der Übersicht `Einreise & Reisevorbereitung` oder ähnlich verständlich. Nicht wie eine bloße manuelle Checkliste.

Nur Evidence darf konkrete `required`/`not_required`-Aussagen erzeugen. Ohne Provider: `Automatische Einreiseprüfung derzeit nicht verfügbar.`

Sichere Actions später vorbereiten: offizielle Information/Antrag/ETA/eVisa/Formular öffnen, Deadline, offenen Punkt. Keine URL aus Modelltext, keine Fake-Links oder offenen Redirects.

## Guest / Account / Security

Gast und Konto gleiche fachliche Form; Guest lokal und idempotent übernehmbar; Account privat mit RLS. Per ADR entscheiden, ob Traveller-Fakten tripspezifisch oder sicher accountweit wiederverwendbar sind.

Datenminimierung, kein öffentlicher Cache, keine Cross-User-/Cross-Trip-Leaks, keine sensitiven Werte in Logs/Analytics/Query Strings, keine Service Role im Client, keine Secrets im Browser.

## Migrationen

Nur Development. Versioniert, Typen/Constraints/FKs/Indizes/RLS/Reproduzierbarkeit/Security-Checks vollständig. Keine Production-Migration ohne separate ausdrückliche Freigabe.

## Tests und Audits

Zusätzlich zum ursprünglichen Auftrag mindestens: mehrere Traveller unterschiedlicher Nationalität; keine Vermischung; insufficient context; bekannte Fakten nicht erneut fragen; Traveller gelöscht → Evaluation weg; Direktflug/Transit/Multi-Country; Destination/Datum geändert; Provider required/not_required/conditional; unavailable ohne Erfindung; LLM kann Official Truth nicht überschreiben; Pflicht vs Empfehlung Health; stale/freshness; Cross-user/Cross-trip; Browser kann Official Evidence nicht fälschen; Source URL validiert; keine Dokumentnummern oder sensitiven Logs.

Bestehende WebKit-/Chromium-Audits plus mehrere Traveller, unterschiedliche Requirements, Missing-Facts, alle Result-Zustände, stale/recheck, lange Texte, mehrere Länder/Transit, 280–430 px, Landscape, Desktop. Keine horizontale Verschiebung; Status nie nur über Farbe.

## Dokumentation / ADR

Dauerhaft aktualisieren: `docs/TRAVEL_READINESS.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `docs/REISEN.md`, `docs/DATENBANK.md` und bei Bedarf Vision/Design/Logic Standard.

ADRs mindestens für automatische Travel Requirements, Traveller Context/Datenmodell, provider-neutrale Engine, Official Truth vs User Readiness, Health Requirement vs persönliche Gesundheitsdaten, Context Fingerprint + Freshness/Recheck, Timatic als bevorzugten Kandidaten ohne Architekturbindung.

## Definition of Done

Reviewbar erst wenn individueller Traveller Context, Requirements Engine Domain, provider-neutrale Adaptergrenze, Timatic/equivalent vorbereitbar, kein Fake-Provider, Requirements pro Traveller, Visa/Passport/ID/Transit/Health/Vaccination/Document-Kategorien, Context-Stale, Freshness/Recheck, Requirements/Readiness getrennt, Guest/Account geklärt, RLS/Security, progressive Missing-Facts-UX und alle ursprünglichen Tests/DB-Checks/Audits/Build/CI/Preview grün sind.

## Harte Grenzen

- Nicht mergen.
- PR nicht Ready setzen.
- Keine Production-Migration.
- Keine Production-Provider-Aktivierung.
- Keine kostenpflichtigen Verträge.
- Keine Fake-Visa-/Impf-/Passregeln.
- Keine regulatorischen Behauptungen aus einem LLM.
- Kein Dokumententresor.

Arbeite den bestehenden Draft-PR mit diesem Nachtrag selbstständig weiter und bringe ihn zu einem technisch vollständig reviewbaren Stand.