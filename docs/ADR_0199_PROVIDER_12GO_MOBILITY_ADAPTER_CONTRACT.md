# ADR-0199 – 12Go Mobility Adapter Contract (proposed)

Stand: 29. August 2026  
Status: **PROPOSED / NOT ACCEPTED / AUDIT EVIDENCE ONLY**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/190  
Vollvertrag: `docs/PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT_2026-08-29.md`

Dieser ADR ist **kein** Architecture-Accept und **keine** Providerwahl. Er hält die Audit-Empfehlung fest, damit ein späterer Technical-Lead-Review sie annehmen, ändern oder verwerfen kann.

## Entscheidung (vorgeschlagen, nicht angenommen)

1. Ein späterer 12Go-Adapter ist ein **provider-spezifischer Mobility-Adapter**, nicht ein Shared-Core und nicht ein UniversalOffer.
2. Jetnity-Domänen bleiben getrennt: `mobility` ≠ `rental_cars` ≠ `flights`. 12Go-Flüge, 12Go-„Car rent“, Daytrips, Rail Passes, Tours und Helicopters gehören **nicht** in diesen Adapter.
3. Der kleinste ehrliche Live-Pfad ist **Affiliate-Redirect**: 12Go bleibt Booking-/Payment-Intermediär. Jetnity wird in diesem Slice weder Reseller noch Merchant of Record.
4. In-Workspace-Suchergebnisse dürfen später nur aus einem **von 12Go freigegebenen, serverseitigen API-Pfad** kommen. Scraping ist durch 12Go Consumer Terms verboten. iframe-Widgets sind durch Affiliate-Traffic-Regeln verboten.
5. Solange der API-Vertrag confidential/approval-gated ist, bleiben Auth, Endpunkte, Quotas, Error-Codes und Payload-Felder `UNKNOWN`. Fixtures dürfen sie nicht erfinden.
6. Fixture-/Test-/Affiliate-Link-Evidence darf niemals `live_api` oder `persisted_snapshot` minten.
7. Dieser ADR entsperrt weder TW-8 noch Provider-Live, Secrets, paid calls oder Commercial-Provenance-Writes.

## Kontext

Jetnity hat eine provider-neutrale Mobility-Foundation (`lib/mobility`, `MobilityProvider`, Production-Suche aus). Der erste Flight-Adapter-Foundation-Schnitt (Skyscanner, offline) existiert. 12Go ist ein öffentlicher multimodal Ground/Sea-Aggregator mit Affiliate-Programm. Die API ist öffentlich als vorhanden genannt, aber hinter Consent + vertraulichen Bedingungen.

## Alternativen

1. **Nur Deeplink ohne Suche.** Ehrliche Unavailable-Suche plus „Auf 12Go prüfen“. Weniger Truth-Risiko, weniger Nutzen.
2. **White Label / 12Go-Subdomain.** Kein Jetnity-Reisegraph; verlässt den Workspace.
3. **Reseller-Portal.** Agent bucht und zahlt Deposit. Falsches Produktmodell für Jetnity-Consumer.
4. **Scraping / inoffizielle Wrapper.** Vertrags- und Truth-Bruch. Verboten.
5. **Rental und Flüge in denselben Adapter falten.** Widerspricht ADR-0168 und dem Task.

## Begründung

Ohne genehmigte API gibt es keinen legalen, ehrlichen Weg zu 12Go-Suchwahrheit innerhalb Jetnitys Graph. Der Affiliate-Redirect respektiert Search≠Booking und hält Payments außerhalb Jetnitys. Die Domaintrennung verhindert, dass 12Go-Inventar Jetnitys getrennte Commercial Domains überschreibt.

## Konsequenzen

- Keine Runtime in diesem Slice.
- Spätere Implementation braucht einen eigenen, extra gegateten Task.
- Shared-Core-Edits bleiben verboten, bis der Shared Adapter Core akzeptiert ist.
- Product Owner muss vor Enrollment/API-Antrag entscheiden; dieser Audit stellt keinen Antrag.
