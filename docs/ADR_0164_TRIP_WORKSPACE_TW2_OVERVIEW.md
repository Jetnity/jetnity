# ADR-0164 – Trip Workspace TW-2 Reiseübersicht

Stand: 25. August 2026  
Status: **Technical-Lead-Entscheidung innerhalb der verbindlichen Build-Reihenfolge; TW-2 als eigener normaler Slice vorbereitet**

## Entscheidung

TW-2 verdichtet die bestehende Reise-Wahrheit zu einer schnell erfassbaren Reiseübersicht. Es erzeugt **keine neue fachliche oder persistierte Reise-Wahrheit**.

Verbindlich:

- Die Übersicht beantwortet in den ersten Sekunden: Was ist diese Reise? Wann/wohin? Für wie viele Personen? Was ist bereits abgedeckt? Wo fehlt noch etwas?
- Ein angezeigter Reise-/Fortschrittszustand ist **rein abgeleitet** und wird nicht als neuer `trips.status`, neuer Lifecycle-Enum oder neue DB-Spalte gespeichert.
- Falls zeitliche Phasen wie aktiv/kommend/vergangen benötigt werden, ist die bestehende AP-3-Date-only-Logik wiederzuverwenden oder fachlich identisch abzuleiten. Kein zweites Lifecycle-Modell.
- Booking-/Coverage-Aussagen verwenden ausschließlich bestehende kanonische Ableitungen/Bestände. `unknown` oder unvollständige Daten dürfen nicht als vollständig/erledigt erscheinen.
- `party[]` darf als Anzahl/Personenkontext angezeigt werden. TW-2 baut **keine Traveller Registry** und nimmt keine Citizenship/Document-Defaults an.
- Guest und Account zeigen bei demselben Reisegraphen dieselbe fachliche Übersicht. Unterschiedlich darf nur Ablage/Account-Kontext sein.
- Pace/Interessen werden visuell nach hinten gestuft; sie sind keine primäre Reiseidentität.
- Safety/Seasonal/Readiness dürfen in TW-2 nicht zu einem globalen grünen Gesamtstatus zusammengerührt werden. Fehlende Evaluation bleibt `unknown`/ungeprüft. Die Priorisierung dieser Signale ist TW-4.
- LLM/Assistant erzeugt keine Overview-Hard-Truth.

## Explizit nicht entschieden / nicht in TW-2

- kein `Jetzt wichtig` / Attention-Aggregator (TW-4)
- keine Timeline/Etappen-Komposition (TW-3)
- kein Create-Flow / Multi-Destination (TW-6)
- keine neue Safety-/Seasonal-Orchestrierung
- keine Provideraktivierung oder kommerzielle Suche
- keine DB-/Migration-/RLS-/Auth-/MFA-/AAL-/Traveller-/Route-Contract-Änderung
- keine Production-Migration

## Qualitätsgrenze

Eine hübsche Zusammenfassung ist kein Beweis. Jede Übersichtsaussage muss auf eine vorhandene Source of Truth zurückführbar sein. Error ≠ Empty ≠ Unknown ≠ Stale ≠ Unavailable ≠ ungeprüft ≠ clean.

## Autonomie / Gates

Dieser Slice ist durch `docs/JETNITY_BINDING_BUILD_ORDER.md` gedeckt und fällt bei unverändertem Scope unter `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.

Nach Implementierung: Self-Review → vollständige Exact-Head-Gates → GitHub Actions/Vercel → unabhängiger ChatGPT/Technical-Lead-Review. Bei PASS und ohne besonderes Product-Owner-Gate darf der Technical Lead Ready/Merge selbst durchführen.
