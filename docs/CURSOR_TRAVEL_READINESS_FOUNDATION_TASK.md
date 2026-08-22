# Cursor-Auftrag – Foundation C: Travel Readiness & Dokumente

Stand: 22. August 2026  
Branch: `feat/travel-readiness-foundation`  
Basis: `main` @ `315d9b31e69fcd5fd40227f65aa97587efc3bec4`  
Ziel: provider-unabhängige, logisch strenge Reisevorbereitungs-Foundation ohne sensiblen Dokumententresor

> **Verbindlicher Nachtrag:** `docs/CURSOR_TRAVEL_READINESS_AUTOMATION_AMENDMENT.md`
>
> Dieser Nachtrag ist Pflichtlektüre und überschreibt alle Stellen dieses ursprünglichen Auftrags, die davon ausgehen, dass Nutzer Visa-, Einreise-, Impf-, Gesundheits- oder Dokumentanforderungen grundsätzlich selbst recherchieren müssen oder dass Foundation C nur eine manuelle Checkliste bleibt. Foundation C baut jetzt die Grundlage für **Automatic Travel Requirements & Readiness** mit individuellem Traveller-Kontext, provider-neutraler Requirements Engine, automatischer Re-Evaluation und späterer Timatic-/gleichwertiger Integration.

---

## Wichtiger Hinweis

Die vollständige ursprüngliche Spezifikation dieser Datei bleibt fachlich verbindlich. Da der aktuelle Product-Owner-Entscheid die Zielarchitektur erweitert hat, muss der Implementierungs-Agent **zuerst den oben verlinkten Nachtrag vollständig lesen und anschließend diese ursprüngliche Spezifikation im Lichte des Nachtrags umsetzen**.

Der Nachtrag ändert insbesondere:

- von manueller Recherche zu automatischer Requirement-Erkennung
- von reiner Traveller-Anzahl zu individuellem Traveller-Kontext
- Visa/Pass/ID/Transit/Health/Vaccination/Document-Requirements als strukturierte Domain
- provider-neutrale Requirements Engine
- Timatic als bevorzugten aktuellen Kandidaten ohne Architekturbindung
- progressive Missing-Facts-UX
- automatische Context-Stale- und Freshness-/Recheck-Logik

Unverändert bleiben insbesondere:

- `unknown` bleibt `unknown`
- keine Fake-Regeln
- Official Requirement Truth und User Readiness strikt trennen
- kein Dokumententresor
- keine Pass-/ID-/Visa-Scans oder Dokumentnummern
- keine Production-Migration ohne separate Freigabe
- keine Production-Provider-Aktivierung
- keine kostenpflichtigen Verträge
- PR bleibt Draft
- nicht mergen
- Security, RLS, Guest-/Account-Parität, Tests, Browser-Audits, CI, Preview und Dokumentation sind Pflicht.

---

## Vollständige ursprüngliche Spezifikation

Die ursprüngliche 765-zeilige Foundation-C-Spezifikation ist im Commit-Verlauf dieses Branches bei `57f75ff2ed83432c190076582fb0b3d169bbcd21` vollständig erhalten. Für die aktuelle Umsetzung sind **diese Datei + `docs/CURSOR_TRAVEL_READINESS_AUTOMATION_AMENDMENT.md` gemeinsam** die verbindliche Arbeitsgrundlage.

Der Implementierungs-Agent soll keine alte Annahme aus der ursprünglichen Spezifikation gegen den neueren Nachtrag durchsetzen. Bei Widerspruch gilt der Nachtrag.