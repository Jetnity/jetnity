# ADR-0200 – 12Go Mobility Adapter Contract (proposed)

Stand: 29. August 2026  
Status: **PROPOSED / NOT ACCEPTED / AUDIT EVIDENCE ONLY**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/190  
Vollvertrag: `docs/PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT_2026-08-29.md`

Dieser ADR ist **kein** Architecture-Accept und **keine** Aktivierung. Er lebt nur in dieser Datei; Draft-PR #190 trägt keinen `DECISIONS.md`-Eintrag und ändert keine globale Current-State-Datei. **ADR-0199** ist der integrierte Provider Adapter Core (`docs/ADR_0199_PROVIDER_ADAPTER_CORE_FOUNDATION.md`) und wird hier nicht geändert.

Die strategische Zielentscheidung ist bereits getroffen: **12Go bleibt Jetnitys erstes Mobility-Spezialziel.** Affiliate-Enrollment, API-Antrag, vertrauliche Terms, Credentials, paid calls und Production-Aktivierung bleiben Product-Owner-Gates und werden durch diesen ADR nicht ausgelöst.

## Entscheidung (vorgeschlagen, nicht angenommen)

1. Ein späterer 12Go-Adapter ist ein **provider-spezifischer Mobility-Adapter**, nicht ein Shared-Core und nicht ein UniversalOffer.
2. Schichten: `lib/mobility/*` = provider-neutrale Mobility-Domäne/Port; `lib/server/providers/core/*` = shared server Transport-Härtung (ADR-0199); `lib/provider-ops` = vorhandene Inbound-Kill-/Cost-/Ops-Guards, **kein** Transport-Kern; `lib/providers/twelve-go/mobility/*` = 12Go-spezifische Mapping-/Parser-/Attributions-Semantik **nach** offiziellen API-Docs. Offline-Foundation braucht keine Shared-Core-Edits. Kein zweiter generischer Transport-Kern.
3. Jetnity-Domänen bleiben getrennt: `mobility` ≠ `rental_cars` ≠ `flights`. 12Go-Flüge, 12Go-„Car rent“, Daytrips, Rail Passes, Tours und Helicopters gehören **nicht** in diesen Adapter.
4. Der kleinste ehrliche Live-Pfad ist **Affiliate-Redirect** nach genehmigtem Affiliate-Status: 12Go bleibt Booking-/Payment-Intermediär. Jetnity wird in diesem Slice weder Reseller noch Merchant of Record.
5. In-Workspace-Suchergebnisse dürfen später nur aus einem **von 12Go freigegebenen, serverseitigen API-Pfad** kommen, der den vorhandenen Transport-Kern nutzt. Scraping ist durch 12Go Consumer Terms verboten. iframe-Widgets sind durch Affiliate-Traffic-Regeln verboten.
6. Solange der API-Vertrag confidential/approval-gated ist, bleiben Auth, Endpunkte, Quotas, Error-Codes und Payload-Felder `UNKNOWN`. Die Normalized-Form ist eine **Jetnity-eigene synthetische Testform**. `offerRef` ist test-lokal und spiegelt keine echte 12Go-Offer-/Service-/Trip-ID. Parser/Transport dürfen nicht aus Fixtures allein gebaut werden.
7. Öffentliche Consumer-URL, Affiliate-Deeplink, Widget, Fahrplan, Data-Feed oder White-Label-Seite autorisieren **nicht** `sourceKind=live_api` und keine vertrauenswürdige Current-Quote. Redirect/Cookie ist Attribution, nicht Preis-/Freshness-/Availability-Evidence. Kein `persisted_snapshot` ohne allokierten S5-B-Runtime-Writer.
8. Kommerzielle Affiliate-/Deep-Link-Erzeugung bleibt aus, bis Jetnity genehmigten Affiliate-Status/Terms oder andere schriftliche Zustimmung hat. Öffentliche `/travel/{slug}`-Muster sind nur Navigations-Evidence. Partner-ID ist Attribution-Metadaten, kein Secret; Client-supplied IDs/URLs minten keine Trusted Attribution.
9. S5-B-Persistenzgrundlage ist bereits auf Production (`20260829140000_trip_item_commercial_provenance`, verifiziert). Kein reales Provider-Snapshot. Runtime-Write-Pfad/Principal-Allocation bleibt geschlossen (`production_write_path_allocated=false`) und extra-gated. Nur eine echte authentifizierte/genehmigte 12Go-Server-API-Antwort unter dem tatsächlichen Vertrag darf später einen `live_api`-Kandidaten erzeugen, und nur wenn Preis/Währung/Kontext nachweislich ausreichen. TW-8 bleibt geschlossen, bis echte Commercial Provenance existiert.
10. Dieser ADR entsperrt weder Enrollment/API-Antrag noch Provider-Live, Secrets, paid calls oder Commercial-Provenance-Writes.

## Kontext

Jetnity hat eine provider-neutrale Mobility-Foundation (`lib/mobility`, `MobilityProvider`, Production-Suche aus) und einen integrierten server-only Transport-Kern (ADR-0199 / `lib/server/providers/core/*`; Checkpoint `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md`). Der erste Flight-Adapter-Foundation-Schnitt (Skyscanner, offline) existiert. 12Go ist ein öffentlicher multimodal Ground/Sea-Aggregator mit Affiliate-Programm. Die API wird öffentlich erwähnt, ist aber hinter Consent + vertraulichen Bedingungen.

## Alternativen

1. **Nur Deeplink ohne Suche.** Ehrliche Unavailable-Suche plus „Auf 12Go prüfen“. Weniger Truth-Risiko, weniger Nutzen.
2. **White Label / 12Go-Subdomain.** Kein Jetnity-Reisegraph; verlässt den Workspace.
3. **Reseller-Portal.** Agent bucht und zahlt Deposit. Falsches Produktmodell für Jetnity-Consumer.
4. **Scraping / inoffizielle Wrapper.** Vertrags- und Truth-Bruch. Verboten.
5. **Rental und Flüge in denselben Adapter falten.** Widerspricht ADR-0168 und dem Task.
6. **Zweiten generischen Transport-Kern vorschlagen.** Widerspricht ADR-0199.

## Begründung

Ohne genehmigte API gibt es keinen legalen, ehrlichen Weg zu 12Go-Suchwahrheit innerhalb Jetnitys Graph. Der Affiliate-Redirect respektiert Search≠Booking und hält Payments außerhalb Jetnitys, darf aber erst nach Affiliate-Approval kommerziell erzeugt werden. Die Domaintrennung verhindert, dass 12Go-Inventar Jetnitys getrennte Commercial Domains überschreibt. Der vorhandene Adapter-Core ist der einzige Outbound-HTTP-Kern.

## Konsequenzen

- Keine Runtime in diesem Slice.
- Spätere Offline-Foundation braucht keine Shared-Core-Edits.
- Späterer Live-Transport nutzt `lib/server/providers/core/*`; 12Go-Mapping bleibt provider-spezifisch.
- Persistenzgrundlage ist bereits auf Production; Runtime-Write-Path bleibt extra-gated.
- Product Owner muss vor Enrollment/API-Antrag/Credentials/paid calls/Production-Aktivierung entscheiden; dieser Audit stellt keinen Antrag.
