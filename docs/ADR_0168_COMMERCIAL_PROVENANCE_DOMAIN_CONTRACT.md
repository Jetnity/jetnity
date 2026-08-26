# ADR-0168 – Commercial Provenance ist ein eigener Vertrag, kein UniversalOffer

Stand: 26. August 2026  
Status: **S5-A integriert auf `main` via PR #83 / `3b317bc6`. S5-B nicht gestartet. Keine Persistenz.**

Vollständige Entscheidung: [DECISIONS.md](../DECISIONS.md) ADR-0168.

Kurz:

- Neuer provider-neutraler Contract in `lib/commercial-provenance`.
- Flight/Hotel/Activity/Mobility/Rental-Modelle bleiben domain-spezifisch.
- Kein `available`-Boolean. Snapshot ist nie live. Fehlende Freshness bleibt `unknown`.
- Keine automatische Währungsumrechnung. Keine erfundene beste Quelle.
- LLM/Assistant darf Hard Truth nicht erzeugen oder überschreiben.
- Actor↔Source ist fail-closed: User darf keine Provider-Live-/Snapshot-Herkunft behaupten. Untrusted Input hat keinen `system`-Default.
- Optionale Composition prüft Domain, Provider-ID und `externalRef`.
- User-Intake/Manual brauchen keinen Provider und kein `retrievedAt`; massgeblich ist `observedAt`.
- `externalRef` ist provider-scoped.
- Persistenz/`trip_items` bleibt S5-B + Production-Gate.
- Bestehende provider-belegte Truth darf nicht durch User-/Manual-/LLM-Wahrheit ersetzt werden.
- Fehlende Affiliate-Evidence bleibt `unknown`. Widersprüchliche `amount`/`amountStatus`-Paare werden abgewiesen.
- Provider-Refresh braucht identische Domain, identische `providerId` und identische belegte `externalRef`. Fehlende Ref auf einer oder beiden Seiten ist kein stiller Refresh. `providerOfferId` ist in S5-A kein gleichwertiger Refresh-Schlüssel.
- Current-Quote-Display braucht belegte `quotedCurrency`. `requestedCurrency` darf fehlen; dann gilt die Quote-Währung. `requested != quoted` bleibt mismatch ohne Conversion.
