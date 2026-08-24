# Jetnity – Provider-Readiness Matrix

Stand: 24. August 2026  
Status: **vollständig für den Audit-Block / keine Aktivierungsfreigabe**  
Quelle: verifizierter Code auf `audit/provider-readiness`  
Begründung der Zellen: `docs/PROVIDER_READINESS_AUDIT.md`

## Legende

| Wert | Bedeutung |
| --- | --- |
| `ready` | Jetnity-seitiger Vertrag existiert und ist fail-closed getestet |
| `partial` | Vertrag oder Verhalten vorhanden, aber lückenhaft oder inkonsistent |
| `missing` | Für Providerphase nötig, im Code nicht vorhanden |
| `blocked` | Bewusst gesperrt oder extern abhängig; kein stilles Weiterbauen |

Fehlende konkrete Anbieter-Adapter sind `blocked` (Reihenfolge/Zugang), nicht `missing` als Foundation-Defekt.

---

## 1. Kernmatrix

| Domäne | Request | Response / Truth | Evidence / Provenance | Failure | Cache / Lizenz | Cost Guard | Security | Observability |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Flights | `partial` | `partial` | `missing` | `partial` | `missing` | `partial` | `partial` | `missing` |
| Hotels | `ready` | `ready` | `partial` | `ready` | `missing` | `partial` | `ready` | `missing` |
| Activities | `ready` | `ready` | `partial` | `ready` | `missing` | `partial` | `ready` | `missing` |
| Mobility | `partial` | `partial` | `missing` | `partial` | `missing` | `partial` | `partial` | `missing` |
| Rental Cars | `partial` | `partial` | `missing` | `partial` | `missing` | `partial` | `ready` | `missing` |
| Readiness | `ready` | `ready` | `ready` | `partial` | `missing` | `partial` | `ready` | `missing` |
| Safety | `partial` | `ready` | `ready` | `ready` | `missing` | `partial` | `ready` | `missing` |
| Seasonal | `ready` | `ready` | `ready` | `ready` | `missing` | `partial` | `ready` | `missing` |

---

## 2. Begründung je Domäne

### Flights

| Dimension | Wert | Begründung |
| --- | --- | --- |
| Request | `partial` | Schmale `FlugSuchanfrage`, PII-arm. `currency` wird nicht an Duffel gesendet. Kein Body-Cap/`Content-Type`-Guard. Keine Auth. |
| Response / Truth | `partial` | Mapping fail-closed, Route Truth getrennt. Persistenz vertraut Browser-`FlugOption`. |
| Evidence / Provenance | `missing` | Kein `FlugNachweis`, kein `retrievedAt`/`freshUntil` auf der Option. |
| Failure | `partial` | Timeout/unavailable/invalid/partial/rate_limited orchestriert. Kein `Retry-After`, kein Dedup, Übernahme nach Provider-Down weiter offen. |
| Cache / Lizenz | `missing` | `no-store`, keine Attribution, kein Stale-Label für gespeicherte Preise. |
| Cost Guard | `partial` | In-Memory 8/24. Production hart aus. Kein globales/DB-Limit, keine Dedup-Suche. |
| Security | `partial` | Server-only Token, Test-Token-Gate, `booking_url` null. Übernahme ist tamperbar. Search öffentlich. |
| Observability | `missing` | Nur Response-Status. Kein Health, keine Latency/Spend-Metrik. |

**Blocked:** Production-Live-Token (`lib/flights/zustand.ts`). Duffel-Live und zweiter Search-Provider sind Product-Owner-Gates.

### Hotels

| Dimension | Wert | Begründung |
| --- | --- | --- |
| Request | `ready` | Graph-Kontext server-autoritativ; Body-Cap; nur Counts, keine PII. Client-`rooms`/`children` sind eine dokumentierte Asymmetrie, kein Trust-Bruch der Übernahme. |
| Response / Truth | `ready` | `HotelOption` + Quartier-Evidenz; Client-Leak-Scan; Ranking provisionsneutral. |
| Evidence / Provenance | `partial` | `HotelNachweis`-Vertrag inkl. stale/changed/invalid. Umgebung `null`. Keine Offer-Freshness-Felder. |
| Failure | `ready` | Timeout/unavailable/partial/invalid/rate_limited; `Retry-After`; Übernahme fail-closed ohne Nachweis. |
| Cache / Lizenz | `missing` | `no-store`; keine Provider-ToS-/Attribution-Felder. |
| Cost Guard | `partial` | In-Memory, Production aus, `JETNITY_HOTEL_AKTIV`. |
| Security | `ready` | Factory `server-only`; Übernahme nur IDs + Graph + Nachweis; `booking_url` null. |
| Observability | `missing` | Keine Provider-Metriken. |

**Blocked:** Konkreter Adapter und Zugang (Booking.com/HBX) – `docs/HOTEL_PROVIDER_STRATEGY.md`. Factory bleibt `null`.

### Activities

| Dimension | Wert | Begründung |
| --- | --- | --- |
| Request | `ready` | Tageskontext aus Graph; Teilnehmerzahl; keine Citizenship. |
| Response / Truth | `ready` | Option-Zod, Konflikt nur bei vollständigen Fenstern, Ranking ohne Neutral 0,5. |
| Evidence / Provenance | `partial` | `ActivityNachweis` bindet Timeslot. Umgebung `null`. |
| Failure | `ready` | Gleiche Orchestrierung wie Hotels. |
| Cache / Lizenz | `missing` | wie Hotels. |
| Cost Guard | `partial` | In-Memory, Production aus. |
| Security | `ready` | Nachweis-Übernahme, Leak-Scan, keine Secrets. |
| Observability | `missing` | wie Hotels. |

**Blocked:** Kein gewählter Activity-Anbieter. Factory `null`.

### Mobility

| Dimension | Wert | Begründung |
| --- | --- | --- |
| Request | `partial` | Port existiert. API vertraut Client-Origin/Destination. Auto-Suche im Workspace. |
| Response / Truth | `partial` | Domain-Typen und Abdeckungskanten ready. Kein Option-Zod. Ranking ohne Graph-Anreicherung. |
| Evidence / Provenance | `missing` | Nachweis-Stub; keine async Kontextbindung. |
| Failure | `partial` | Status-Taxonomie da; Timeout HTTP 504 weicht ab; Übernahme immer fail-closed. |
| Cache / Lizenz | `missing` | `no-store`; keine Attribution. |
| Cost Guard | `partial` | In-Memory; Auto-Suche würde Limits und spätere Kosten verbrennen. |
| Security | `partial` | Keine PII; Client darf Suchparameter setzen; Client-Sicht streicht Provider-IDs. |
| Observability | `missing` | keine. |

**Blocked:** Factory `null`. Manuelle Persistenz ist User-Evidence, kein Provider-Offer.

### Rental Cars

| Dimension | Wert | Begründung |
| --- | --- | --- |
| Request | `partial` | Schema vorhanden. Keine Such-UI, daher kein produktiver Request-Pfad. |
| Response / Truth | `partial` | Starke Preis-/Zeitraum-Invarianten. Kein Option-Zod. |
| Evidence / Provenance | `missing` | Nachweis-Stub. |
| Failure | `partial` | Orchestrierung wie Mobility; UI zeigt nur unavailable. |
| Cache / Lizenz | `missing` | wie Mobility. |
| Cost Guard | `partial` | In-Memory; keine Auto-Suche (besser als Mobility). |
| Security | `ready` | Keine Fahrer-/Zahlungsdaten; Place-Hints sind keine Facts. |
| Observability | `missing` | keine. |

**Blocked:** Factory `null`. Such-UX fehlt bewusst, bis ein Anbieter gewählt ist.

### Readiness

| Dimension | Wert | Begründung |
| --- | --- | --- |
| Request | `ready` | Geschlossene API, Zod, Credential-Minimierung, keine Passnummern/MRZ. |
| Response / Truth | `ready` | `evaluations[]` kanonisch; Legacy `official` immer `unknown`. |
| Evidence / Provenance | `ready` | Trust Gate Provider+checkedAt+Authority/RuleRef; untrusted ≠ `current`. |
| Failure | `partial` | Throw → unknown. Kein explizites Timeout/`AbortSignal`. |
| Cache / Lizenz | `missing` | `no-store`; keine Timatic-/Lizenz-Displayregeln. |
| Cost Guard | `partial` | In-Memory 20/80; kein `JETNITY_READINESS_AKTIV`. |
| Security | `ready` | Citizenship nur hier, weil Official davon abhängt; keine Biometrie. |
| Observability | `missing` | keine. |

**Blocked:** `requirementsProviderAus()` = `null`. Echter Regulatory-Adapter erst nach Product-Owner-Gates.

### Safety

| Dimension | Wert | Begründung |
| --- | --- | --- |
| Request | `partial` | Graph-Schema ready, LLM-Felder wirkungslos. API setzt `party: []`. Provider-Request traveller-neutral. |
| Response / Truth | `ready` | Getrennte Ebenen; `seasonal_pattern` verworfen; `checked_empty` ≠ sicher. |
| Evidence / Provenance | `ready` | Provider+checkedAt+Authority; Presentation nur trusted+current+affected. |
| Failure | `ready` | 4 s Timeout, AbortSignal, Fact-Cap, malformed → unavailable. |
| Cache / Lizenz | `missing` | keine Redistributionsregeln für Advisory-Feeds. |
| Cost Guard | `partial` | In-Memory; kein Live-Provider. |
| Security | `ready` | Keine Citizenship im Outbound-Port. |
| Observability | `missing` | keine. |

**Blocked:** `safetyProviderAus()` = `null`.

### Seasonal

| Dimension | Wert | Begründung |
| --- | --- | --- |
| Request | `ready` | Kanonische Stages + Route-Kontakte; Citizenship/LLM werden ignoriert und getestet. `party: []` ist hier korrekt traveller-neutral. |
| Response / Truth | `ready` | Acute rejected; ohne `freshUntil` kein `current`; Tradeoff-Sprache. |
| Evidence / Provenance | `ready` | Authority/Freshness/Reference Period/Travel Window getrennt. |
| Failure | `ready` | Timeout + AbortSignal; unavailable ≠ Muster. |
| Cache / Lizenz | `missing` | Climate-/Seasonal-Lizenz unbekannt, bewusst nicht angenommen. |
| Cost Guard | `partial` | In-Memory; Factory `null`. |
| Security | `ready` | Traveller-neutraler Port. |
| Observability | `missing` | keine. |

**Blocked:** `seasonalProviderAus()` = `null`.

---

## 3. Adapter- und Gate-Übersicht

| Domäne | Port | Factory | Nachweis | Production | Konkreter Adapter |
| --- | --- | --- | --- | --- | --- |
| Flights | `FlugProvider` | Duffel-Test | fehlt | hart aus | Development only |
| Hotels | `HotelProvider` | `null` | Vertrag, Umgebung `null` | hart aus | `blocked` |
| Activities | `ActivityProvider` | `null` | Vertrag, Umgebung `null` | hart aus | `blocked` |
| Mobility | `MobilityProvider` | `null` | Stub | hart aus | `blocked` |
| Rental Cars | `RentalCarProvider` | `null` | Stub | hart aus | `blocked` |
| Readiness | `RequirementsProvider` | `null` | Official Trust Gate | compute-on-read | `blocked` |
| Safety | `SafetyProvider` | `null` | Evidence Trust Gate | compute-on-read | `blocked` |
| Seasonal | `SeasonalProvider` | `null` | Evidence Trust Gate | compute-on-read | `blocked` |

---

## 4. Cross-Domain-Zellen

| Thema | Wert | Begründung |
| --- | --- | --- |
| Route / Stage / Transit | `ready` | Eine Quelle: `routeFactsAusGraph`. Provider überschreibt sie nicht. |
| Traveller / Citizenship / Documents | `ready` | Foundation E. Readiness outbound, Safety intern bedingt, Seasonal excluded. |
| Offer vs Booking | `partial` | Search-Ports existieren. Booking/Affiliate unverbunden. Flights-Persistenz ohne Nachweis. |
| Price / Currency | `partial` | Domain-Felder vorhanden. Keine Währungsabstimmung Flights. Kein Stale-Preis-Label. |
| Shared Operational Contract | `missing` | Acht Kopien statt eines minimalen Vertrags. Vorschlag: `docs/PROVIDER_READINESS_SHARED_CONTRACT_PROPOSAL.md`. |
| Admin Provider Health | `missing` | Nicht Teil von Admin Slice A. Keine Fake-Health einführen. |
| Routing / POI / Live-Status / Monitoring | `missing` | Inventarisiert, bewusst später. |

---

## 5. Lesart für den nächsten Agenten

- `ready` in einer Zelle heißt **nicht** „Provider einschalten“.
- Jede `blocked`-Factory bleibt `null`, bis ein eigener Provider-Auftrag inkl. Vertrag/Secret/Kostenfreigabe existiert.
- P0/P1 aus dem Audit müssen geschlossen sein, bevor die erste bezahlte oder persistierende Aktivierung diskutiert wird.
- Matrix-Änderungen nur nach erneutem Code-Beweis, nicht aus Chat-Erinnerung.
