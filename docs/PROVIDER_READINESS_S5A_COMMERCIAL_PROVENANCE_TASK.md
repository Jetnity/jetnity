# Provider S5-A – Commercial Provenance Domain Contract

Stand: 26. August 2026  
Agent: `Jetnity provider readiness audit`  
Typ: **DOMAIN / APPLICATION FOUNDATION ONLY**  
Branch: `feat/provider-s5-commercial-provenance-contract`  
Baseline: `main @ c4ea47aa0b22ac6fd5e04862e7184f5a436210e1` (PR #82 / TW6-A integriert; PR #84 / P1-TA-02 bleibt auf `main`)

Status: siehe `docs/PROVIDER_READINESS_S5A_COMMERCIAL_PROVENANCE_STATUS.md`.

`docs/ACTIVE_WORK_STATUS.md` wird in diesem Slice **nicht** geändert.

---

## 1. Auftrag

Baue ausschließlich eine provider-neutrale Domain-/Application-Foundation für kommerzielle Provenance.

Jetnity darf Preise, Providerdaten und Buchungsinformationen später nur dann als kommerzielle Wahrheit darstellen, wenn Herkunft, Beobachtungszeitpunkt, Freshness und Währung technisch nachvollziehbar sind.

Noch kein realer Provider. Noch kein TW-8. Noch keine Production-Aktivierung. Noch keine Commercial-UI.

## 2. Ist-Vertrag vor Änderung

Verifiziert auf `origin/main @ 71230c28`, PR #77 MERGED (`75dfb430`).

| Fläche | Ist |
| --- | --- |
| Flight/Hotel/Activity/Mobility/Rental-Optionen | `provider` + `externalRef` + Betrag/Währung |
| `trip_items` | `priceAmount` / `priceCurrency` / `provider` / `externalRef` / `bookingUrl` |
| Beobachtungszeit | **fehlt** (`retrievedAt` / `observedAt`) |
| Freshness | **fehlt** (`freshUntil`, Commercial-Stale) |
| Währung | eine Quote-Währung; kein `requestedCurrency` vs `quotedCurrency` |
| Affiliate | Search-Übernahme `booking_url = null`; kein Attributionsvertrag |
| Multi-Provider | kein Konfliktvertrag; keine „beste“ Quelle |
| S1 `lib/provider-ops` | Operationsvertrag, keine Commercial-Truth |
| Official/Safety/Seasonal | eigene Evidence/Freshness, **nicht** für Offers |
| Duffel | sendet Request-`currency` nicht; Production hart aus |

Audit-Evidence: `docs/PROVIDER_S4_S8_PROVENANCE_AUDIT.md` §5.

## 3. Zielvertrag

Gemeinsame Primitiven, **kein** UniversalOffer:

- Provider-/Source-Identität;
- `retrievedAt` / `observedAt` als belegter Abrufzeitpunkt;
- `freshUntil` nur wenn quellenbelegt;
- `requestedCurrency` vs `quotedCurrency`;
- getrennter Preis-/Commercial-Status;
- External/Provider-Referenz als Provenance, nicht als Trust;
- Affiliate nur bei Evidence, sonst `absent`/`unknown`;
- Multi-Provider-Konflikt ohne erfundene Gewinnerquelle;
- LLM/Assistant darf den Vertrag nicht erzeugen oder überschreiben.

Zustände bleiben getrennt: `current` / `stale` / `unknown` / `unavailable` / `error` / `partial`.  
Kein boolean `available`. Ein persistierter Snapshot ist niemals live.

## 4. Non-Scope

Keine echten Provider, Secrets, paid calls, Preis-/Availability-Abfragen, TW-6/TW-8, Payments, Affiliate-Live, S5-B/S6/S7/S8-Runtime, Auth/Account/Traveller, DB-Migration, RLS, Production, `docs/ACTIVE_WORK_STATUS.md`.

## 5. Persistence-Gate (dokumentieren, nicht bauen)

Wenn S5-B Persistenz braucht: exakte Schema-/RLS-Anforderung dokumentieren, Production-Gate markieren, **STOPP**. Keine Migration in S5-A.

## 6. STOPP

Nicht Ready. Nicht mergen. Kein S5-B. Kein TW-8. Keine Provideraktivierung.  
Unabhängiger Review: ChatGPT / Technical Lead.
