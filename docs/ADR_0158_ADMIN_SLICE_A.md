# ADR-0158 – Admin Slice A bleibt ehrliche Steuerzentralen-IA ohne neue Autorität

Stand: 24. August 2026  
Status: **verbindliche Integrationsentscheidung für Draft-PR #44**

## Kontext

Admin Slice A wurde ursprünglich auf einem älteren `main` mit der Kennung ADR-0155 dokumentiert. Seit Provider Readiness S2 auf `main` liegt, sind ADR-0155 bis ADR-0157 dort bereits verbindlich durch Provider-/Flight-Trust-Entscheidungen belegt. Beim Current-Main-Sync von PR #44 darf deshalb keine zweite ADR-0155 entstehen und keine Provider-Entscheidung überschrieben werden.

## Entscheidung

- Die Admin-Slice-A-Entscheidung erhält konfliktfrei die Kennung **ADR-0158**.
- Das vorhandene gehärtete Admin-Backoffice wird als ehrliche Steuerzentrale auf IA-/UI-Ebene weiterverwendet. Es entsteht kein zweites Admin.
- Capability-aware Navigation ist nur UX. Autorisierung bleibt ausschließlich bei `requireAdminPage`, `requireAdminApi` und RLS.
- Persistente Admin-Writes (lokale Refund-Notiz, IP-Blockliste schreiben/entfernen) antworten bei Break-Glass mit **403**, bevor die Datenbank erreicht wird. Keine neue Capability und keine RLS-Änderung.
- Refunds und IP-Blockliste werden als lokale/operative Sicht gekennzeichnet. Es gibt keine Provider-Geldbewegung und keine Enforcement-Behauptung der Blockliste.
- Toter Copilot-Execute/Auto, erfundene Notifications/Badges und Legacy-Setup-Scheinzustände bleiben entfernt. Stub-Seiten sind ausdrücklich als `folgt` gekennzeichnet.
- Provider S2 und die aktuelle globale Wahrheit von `main` bleiben vollständig erhalten.

## Nicht Teil dieser Entscheidung

- kein System Health / Slice B
- kein Provider- oder Cost-Board / Slice C
- keine neue Tabelle oder Migration
- keine Rollen-/Capability-/RLS-Neudefinition
- keine Service-Role-Ausweitung
- keine Provider-, Bexio-, Ads-, Infomaniak-, Payment- oder Secret-Aktivierung
- keine Account-/Trip-/Traveller-/Route-/Readiness-/Safety-/Seasonal-Änderung

## Konsequenz

Historische Slice-A-Dokumente, die ADR-0155 nennen, bleiben Evidence ihres damaligen Branch-Stands und werden nicht rückwirkend umgeschrieben. Ab dem Current-Main-Sync ist **ADR-0158** die eindeutige Kennung für die Admin-Slice-A-Entscheidung. Vor Ready/Merge müssen aktuelle Status-/Handoff-Dokumente auf diesen neuen Integrationsstand verweisen.

Technical Closure ersetzt keine ausdrückliche aktuelle Product-Owner-Freigabe für Mark Ready oder Merge.
