# Jetnity Admin Platform – Slice A Implementierungsauftrag

Stand: 24. August 2026
Status: **zur Implementierung freigegeben**
Verantwortlicher Cursor-Agent: `Admin platform audit`
Implementierungsbranch: `feat/admin-control-center-ia`
Audit-Referenz: PR #40 / `audit/admin-platform`

## Ziel

Slice A macht aus dem bestehenden gehärteten Backoffice eine ehrliche, professionelle Jetnity-Steuerzentrale auf IA-/UI-Ebene. Vorhandene gute Strukturen werden weiterverwendet. Keine neuen Integrationen und keine neue Datenwahrheit.

## Verbindlicher Scope

- vorhandene Admin-Home von Setup-Guide/Legacy-Scheinzuständen zu einer ehrlichen operativen Lageansicht umbauen,
- toten Copilot-`Auto`-Button entfernen oder eindeutig als nicht verfügbar kennzeichnen; keine nicht vorhandene Automatik vortäuschen,
- erfundene Notifications/Badges entfernen,
- Setup-Guide entfernen oder auf reale, belegte nächste Ops-Schritte reduzieren,
- Sidebar auf die Ziel-IA ausrichten; Stub-Seiten nicht als fertige Module präsentieren,
- Payments/Refunds ehrlich kennzeichnen: lokale/operative Sicht, keine echte provider-backed Geldbewegung vortäuschen,
- IP-Blocklist ehrlich kennzeichnen: derzeit nicht enforced,
- Capability-aware Navigation als UI-Hilfe; serverseitige Gates bleiben alleinige Autorisierung,
- Break-Glass-/Write-Fehler nur dort auf korrekte 403-Semantik bringen, wo der bestehende Contract das bereits eindeutig verlangt; keine neue Capability oder RLS-Regel einführen.

## Explizit NICHT in Slice A

- keine neue Tabelle oder Migration,
- keine Rollen-/Capability-/RLS-Neudefinition,
- keine Service-Role-Ausweitung,
- keine Payment-/Refund-Providerintegration,
- kein Bexio live,
- keine Ads-Integration,
- kein Infomaniak-Token oder DNS/Mail-Write,
- kein System-Health-Backend in diesem Slice,
- kein Copilot-Pro-Execute-Pfad,
- keine Account-/Trip-/Traveller-/Route-/Readiness-/Safety-/Seasonal-Änderung,
- keine Homepage-Änderung.

## Produktregel

**Admin = interne intelligente Steuerzentrale von Jetnity.**

Sie darf nur reale Zustände zeigen. `unknown`, `nicht verbunden`, `nicht enforced` oder `später` ist besser als erfundenes Grün, erfundene Automatik oder scheinbar funktionierende Writes.

## Pflichtregressionen / Tests

1. Bestehende Admin-Auth-/Capability-Gates bleiben unverändert wirksam.
2. `check:api-schutz` bleibt grün.
3. Keine Fake-Notification/Badge/Auto-Funktion mehr in den betroffenen Oberflächen.
4. Refund/IP-Block-Texte behaupten keine Wirkung, die technisch nicht existiert.
5. Capability-aware Nav blendet nur UX-seitig aus; Tests dürfen keine Autorisierung aus UI-Hiding ableiten.
6. Typecheck, Lint, Hygiene, Production Build grün.
7. gezielte UI-/Unit-Tests für die neue IA und ehrliche Zustände.
8. bestehende Account-/Trip-/Seasonal-/Safety-Regressionen bleiben unberührt.

## Arbeitsweise

- Derselbe Agent `Admin platform audit` implementiert Slice A vollständig.
- Vor Code aktuellen `main`-Stand sowie Audit-Dokumente aus PR #40 lesen.
- Nur Slice A; System Health bleibt separater nächster Slice.
- Nach Umsetzung Self-Review + vollständige relevante Gates.
- Fortschritt/Handoff im Repository dokumentieren.
- Danach unabhängiger ChatGPT/Technical-Lead-Review.

## Harte Gates

- PR bleibt Draft.
- Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Keine Production-Migration in Slice A.
- Keine Provider-/Secret-/Kosten-Aktivierung.
