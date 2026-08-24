# Jetnity Account Platform – AP-1 Implementierungsauftrag

Stand: 24. August 2026
Status: **AP-1 umgesetzt auf `feat/account-ap1` – Draft, wartet auf Review**
Verantwortlicher Cursor-Agent: `Account plattform audit vorbereitung`
Implementierungsbranch: `feat/account-ap1`
Audit-Referenz: PR #39 / `audit/account-platform`

## Ziel

AP-1 baut das persönliche Account-Zuhause von Jetnity als konfliktarmen UI-/IA-Slice. Kein zweites Trip-Workspace-Dashboard und keine neue Source of Truth.

## Verbindlicher Scope

- `app/account/layout.tsx` mit kompakter, professioneller Account-Navigation.
- `/account` als persönliche Übersicht:
  - klare Begrüßung / Account-Einstieg,
  - nächste bzw. aktive Reise ausschließlich aus bestehenden `reisenLaden()`-Daten,
  - klarer CTA zum Fortsetzen,
  - ehrlicher Empty- und Error-Zustand.
- Link aus der bestehenden Navigation nur für `sitzung === konto`.
- Bestehendes `/account/security` unter Einstellungen auffindbar machen und visuell an Jetnity V2 angleichen.
- Mobile-first, danach Tablet/Laptop/Desktop konsistent.

## Explizit NICHT in AP-1

- keine neue Tabelle oder Migration,
- keine Änderung an Auth-/MFA-/AAL-Verträgen,
- keine RLS-/Rollen-/Capability-Änderung,
- keine Guest→Account-Persistenzänderung,
- keine Traveller-Registry,
- keine Privacy-/Billing-/Payment-/Bexio-Implementierung,
- keine Route-/Readiness-/Safety-/Seasonal-Änderung,
- keine Workspace-Karten oder Fachbereichs-Dashboards in die Account-Übersicht kopieren,
- keine Homepage-Änderung.

## Produktregel

**Account = persönliches dauerhaftes Zuhause des Kunden.**

**Trip Workspace = operative Kommandozentrale einer einzelnen Reise.**

Die Account-Übersicht soll Orientierung geben und zur richtigen Reise führen, nicht die operative Reiseoberfläche duplizieren.

## Pflichtregressionen / Tests

1. Navigation unterscheidet `gast`, `konto`, `unbekannt` korrekt.
2. Account-Übersicht: Empty, Error und eine kommende/aktive Reise sauber getrennt.
3. Die Übersicht enthält keine Flug-/Hotel-/Readiness-/Safety-/Seasonal-Workspace-Widgets.
4. Bestehende Guest/Account- und Trip-Tests bleiben grün.
5. Typecheck, Lint, Hygiene, Production Build grün.
6. UI-Audit auf den bestehenden Viewports für die neue Account-Shell.
7. Keine neue DB-/Migration-Evidence vortäuschen, weil AP-1 keine DB ändert.

## Arbeitsweise

- Derselbe Agent `Account plattform audit vorbereitung` implementiert AP-1 vollständig.
- Vor Code den aktuellen `main`-Stand und die Audit-Dokumente aus PR #39 lesen.
- Nur AP-1 umsetzen; keine AP-2/AP-3-Arbeiten vorziehen.
- Nach Umsetzung Self-Review + vollständige relevante Gates.
- Fortschritt/Handoff im Repository dokumentieren.
- Danach unabhängiger ChatGPT/Technical-Lead-Review.

## Harte Gates

- PR bleibt Draft.
- Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Keine Production-Migration in AP-1.
