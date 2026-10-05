# ADR-0163 – Trip Workspace Ziel-IA und Start von TW-1

Stand: 25. August 2026  
Status: **Product-Owner-angenommen; TW-1 ausdrücklich zum Start freigegeben; kein Ready-/Merge-Gate erteilt**

## Entscheidung

Der Product Owner hat nach dem unabhängigen Technical-Lead-Review die in `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md` dokumentierte Ziel-Informationsarchitektur als Produkt- und Architektur-Richtung angenommen.

Verbindliche Leitlinien:

- **Eine Reise, eine Oberfläche.** Flight, Hotel, Activities, Mobility, Readiness, Safety und Seasonal bleiben Fachdomänen, erscheinen im Workspace aber als Teile derselben Reise und nicht als getrennte gleichrangige Apps.
- **Mobile und Desktop verwenden dieselbe Produktlogik.** Desktop darf mehr Fläche nutzen, aber keine zweite Informationsarchitektur besitzen.
- **Reise-Kopf → Aufmerksamkeit → Timeline → Details on demand** ist die Zielrichtung.
- `Jetzt wichtig` ist später nur eine abgeleitete Priorisierung vorhandener Truth-Layer und keine neue persistierte Wahrheit.
- `unknown`, `stale`, `error`, `unavailable`, `noch_nicht_geprueft` und `nichts_dringend_geprueft` bleiben fachlich getrennt.
- Fehlende Safety-/Seasonal-Evaluation darf niemals als Entwarnung oder belegte Unavailability dargestellt werden.
- Multi-Citizenship und mehrere Reisedokumente bleiben in allen relevanten Workspace-Funktionen erhalten; es gibt keinen impliziten ersten/Standard-Pass.
- LLM/Assistant erklärt vorhandene Wahrheit, erzeugt aber keine regulatorische, Safety-, Preis-, Verfügbarkeits-, Provider- oder Route-Hard-Truth.
- Bestehende Foundations und Shared Contracts werden nicht neu erfunden oder still ersetzt.

## Ausführungsentscheidung

TW-1 und TW-2 werden **nicht** in einem gemeinsamen Runtime-PR umgesetzt.

Die Reihenfolge beginnt mit:

1. **TW-1 – Shell & Geräteparität**
2. nach eigenem Technical Closure und separaten Product-Owner-Gates: TW-2 – Reiseübersicht
3. danach bevorzugt TW-4 – Aufmerksamkeit
4. danach TW-3 – Timeline

Diese Reihenfolge reduziert Scope- und Review-Risiko und verhindert, dass Navigation, Übersichtsableitungen und Attention-Logik gleichzeitig verändert werden.

## Freigabegrenze

Die Product-Owner-Freigabe vom 25. August 2026 autorisiert:

- Annahme dieser Ziel-IA als verbindliche Richtung
- Start des kontrollierten TW-1-Implementierungsauftrags
- Erstellen eines eigenen TW-1-Branches und Draft-PRs

Sie autorisiert **nicht**:

- Mark Ready
- Merge
- TW-2 oder spätere Slices
- DB-Migrationen, RLS-, Auth-, Traveller-, Route- oder Shared-Contract-Änderungen
- Provideraktivierung, Secrets, Verträge oder kostenpflichtige Calls
- Admin Slice D, Account AP-4 oder Provider S4
- Production-Migrationen

## Governance

Nach Umsetzung von TW-1: Self-Review, vollständige Gates auf Exact Head, unabhängiger Technical-Lead-Re-Review, dann STOPP für eine neue ausdrückliche Product-Owner-Entscheidung zu Ready. Merge bleibt danach ein separates Gate.
