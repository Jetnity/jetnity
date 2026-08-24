# Admin Slice A – Self-Review

Stand: 24. August 2026  
Agent: `Admin platform audit`  
Branch: `feat/admin-control-center-ia`

## Adversarielle Prüfung

1. **Wird Automatik vorgetäuscht?** Nein. Copilot-Menü/Auto/`/api/admin/copilot/actions` sind entfernt. Sichtbar bleibt nur `Copilot Pro folgt` ohne Fetch.
2. **Gibt es erfundene Notifications?** Nein. Badge `3`, Blog-/Session-/Moderations-Items und `/admin/notifications` sind entfernt.
3. **Sieht Navigation wie Autorisierung aus?** Nein. `adminNavIstNurUx()` und Tests halten fest, dass Ausblenden keine Sperre ist. `requireAdminPage` / `requireAdminApi` / RLS bleiben unverändert die Gates.
4. **Behaupten Refunds eine Geldbewegung?** Nein. Texte in `lib/admin/ehrliche-zustaende.ts` und die Refund-Karte sprechen von lokaler Notiz in `refunds`.
5. **Behauptet die Blockliste Enforcement?** Nein. Banner und Toasts sagen `nicht enforced`.
6. **Wird Break-Glass als Schreibrecht behandelt?** Nein. `adminWriteErlaubt` lässt nur `grant === 'role'` durch; Schreibrouten antworten 403.
7. **Neue Autorität oder Schema?** Nein. Keine Migration, keine neue Capability, keine RLS-Änderung, keine Service-Role-Ausweitung.
8. **Fremde Workstreams berührt?** Nein. Account/Trip/Traveller/Route/Safety/Seasonal/Homepage unverändert.
9. **Stub-Seiten als fertig lesbar?** Nein. Gemeinsame `AdminFolgtSeite` mit ausdrücklichem Platzhaltertext.

## Offene Risiken

- IP-Blockliste bleibt lokal und ungeprüft durch Middleware. Das ist ehrlich, aber operativ wirkungslos.
- Refund bleibt eine lokale Tabellennotiz. Ein späterer Provider darf diese Semantik nicht still überschreiben.
- Capability-Nav kann Break-Glass-Nutzer von `/admin/users` wegführen; die Seite lehnt ohne Rolle weiterhin selbst ab.
- System Health fehlt bewusst. Die RLS-Karten dürfen nicht als Infrastruktur-Grün gelesen werden; der Titel sagt das jetzt.

## Lokal gelaufene Gates

1715/1715 Tests, Typecheck, Lint, `check:api-schutz`, Hygiene und Production-Build sind lokal grün. `db:sicherheit` / Preview / Production wurden nicht behauptet.

Dieser Self-Review ersetzt keinen unabhängigen Review und keine Product-Owner-Freigabe.
