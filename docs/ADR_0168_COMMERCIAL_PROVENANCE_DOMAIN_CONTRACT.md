# ADR-0168 – Commercial Provenance ist ein eigener Vertrag, kein UniversalOffer

Stand: 26. August 2026  
Status: **Slice-Entscheidung für Provider S5-A; nicht gemergt, nicht Ready, keine Persistenz**

Vollständige Entscheidung: [DECISIONS.md](../DECISIONS.md) ADR-0168.

Kurz:

- Neuer provider-neutraler Contract in `lib/commercial-provenance`.
- Flight/Hotel/Activity/Mobility/Rental-Modelle bleiben domain-spezifisch.
- Kein `available`-Boolean. Snapshot ist nie live. Fehlende Freshness bleibt `unknown`.
- Keine automatische Währungsumrechnung. Keine erfundene beste Quelle.
- LLM/Assistant darf Hard Truth nicht erzeugen oder überschreiben.
- Persistenz/`trip_items` bleibt S5-B + Production-Gate.
