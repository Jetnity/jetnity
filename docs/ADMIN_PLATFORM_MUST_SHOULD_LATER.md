# Admin Platform – Must / Should / Later

Stand: 24. August 2026  
Cursor-Anzeigename: `Admin platform audit`

Gilt für die **spätere Implementierung**, nicht für diesen Audit-PR. Nichts davon ist ohne Freigabe zu bauen.

## Must fix – bevor die Fläche „Steuerzentrale“ heißen darf

1. Toten Copilot-Execute-Pfad und die Zusage „Auto – sicher ausführen“ entfernen.
2. Erfundene Notifications/Badges entfernen.
3. Setup-Guide mit Control-Center-/Creator-Links entfernen oder ersetzen.
4. Refund und IP-Block ehrlich kennzeichnen (lokal / nicht durchgesetzt).
5. Break-Glass-Writes als 403 statt 500; Reads nicht als „alles ruhig“ lesbar machen.
6. Home-KPIs mit Quelle; Payouts/Conversion nicht als belastbare Business-Wahrheit verkaufen, solange Payments ohne Ingest sind.
7. System Health mindestens als explizites `unknown` (nicht als RLS-Karten-Ersatz), sobald Home „Zustand der Website“ behauptet.
8. Keine neuen Stub-Nav-Einträge, die Fertigstellung vortäuschen.

Ohne diese Punkte bleibt das Produkt ein irreführendes Backoffice.

## Should improve – hoher Nutzen, nach Slice 0 / frühen PRs

1. Vercel-/Supabase-/GitHub-Health read-only mit Freshness.
2. Provider- und Modellkosten-Board aus vorhandener Wahrheit.
3. Confirmation + Audit-Akteur für Rolle, Ban, Refund, Block.
4. Event-Taxonomie und echte Security-Event-Produzenten.
5. Admin-AAL2 oder Step-up für Writes.
6. Rate-Limit und CSRF-Härtung auf Admin-Writes.
7. Command Palette über autorisierte Ziele.
8. Minimierte Support-Reiseansicht nach Lead-Contract.
9. Capability-aware Navigation.
10. Mobile Notfall-Lage (Status + Alerts).
11. IP-Validierung; Enforcement nur nach eigener Freigabe.
12. `admin_payments_summary_30d` search_path härten (klein, bei nächster DB-Arbeit).

## Later – bewusst später, eigene Gates

1. Infomaniak read-only, danach einzelne Writes.
2. Copilot Pro als Analyst, erst wenn Evidence existiert.
3. Bexio-Anbindung.
4. Payment-Provider-Ingest und echte Refunds.
5. Google Ads.
6. Affiliate-/Abo-/VAT-Ops.
7. Volles Analytics/BI und CSV-Export.
8. Content-Moderation nur bei echtem V2-Bedarf.
9. Localization-Admin.
10. Gespeicherte Filter/Views.
11. Passkeys für Admin.
12. Job/Queue-System, falls wieder welche existieren.

## Nicht tun

- zweiten Admin bauen
- Creator Hub / virtuelle Creator zurückholen
- Service Role in den Browser oder in ungeprüfte Admin-Reads
- Trip-/Traveller-Truth per Admin-Policy aufweichen
- grüne Defaults ohne Evidence
- Seasonal/Safety/Readiness/Route-Contracts in Admin-PRs mitschleifen
