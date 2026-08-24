# Jetnity Copilot Pro – Autonomy-Matrix

Stand: 24. August 2026  
Status: **verbindlicher Vorschlag für spätere Implementierung**  
Cursor-Anzeigename: `Admin platform audit`

Copilot Pro ist ein Betriebsassistent über Evidence, kein Chatfenster und kein autonomer Operator.

Heutiger Code: kein Copilot. Die Topbar-Aktionen Assist/Auto/Simulate sind tot und teilweise gefährlich beschriftet. Sie dürfen so nicht zurückkommen.

## 1. Stufen

| Stufe | Bedeutung |
| --- | --- |
| **Analysieren** | liest autorisierte Evidence, erklärt, priorisiert |
| **Vorbereiten** | erzeugt Report, Checkliste, Diff-Entwurf, Tickettext |
| **Nach Freigabe ausführen** | dieselbe Admin-API wie ein Mensch, inkl. Confirm, AAL2, Audit |
| **Niemals autonom** | auch nicht mit „Auto“, auch nicht bei Incident |

## 2. Matrix

| Aktion | Analysieren | Vorbereiten | Nach Freigabe | Niemals autonom |
| --- | --- | --- | --- | --- |
| Systemlage erklären (Vercel/Supabase/CI) | ja | Daily Briefing | — | Status erfinden / grün defaulten |
| Anomalien (5xx, Failed Login, Kosten, Quota) | ja | Alert-Draft | Ticket anlegen wenn es einen Contract gibt | Production rollback |
| RLS-/Security-Gate-Ergebnisse zitieren | ja | Härungsvorschlag | — | RLS/Policies ändern |
| Nutzer suchen, erlaubte Metadaten zeigen | ja | Support-Zusammenfassung | — | Passwörter/MFA-Secrets, Credential-Klartext |
| Rolle / Status ändern | Risiko erklären | Diff „vorher → nachher“ | ja, Owner-Rangregeln bleiben | ja ohne Mensch |
| Refund / Transfer / Payout | Abweichung zeigen | Refund-Antrag | ja, Finance-Gate + Provider | ja |
| Payment- oder Bexio-Buchung | Abgleich erklären | Buchungsentwurf | ja | ja |
| Werbebudget / Ads live | Spend-Lage | Kampagnenentwurf | ja, Budget-Hard-Limit | Spend erhöhen |
| Provider/API kostenpflichtig aktivieren | Status/Limits | Gate-Checkliste | Product Owner | ja |
| Secrets anzeigen oder rotieren | Presence/Health | Rotation-Runbook | getrennter Secret-Prozess | Secret-Wert ausgeben |
| Domain / DNS / Mailbox schreiben | Health erklären | Change-Diff | einzelnes Gate | ja |
| Kill Switch schalten | Drift zeigen | Vorschlag | Owner + Audit | ja |
| Feature Flag Production | Wirkung erklären | Vorschlag | ja | ja |
| DB-/RLS-Migration anwenden | Drift vs. erwarteter Stand | PR-Text | menschliches Deploy-Gate | ja |
| Konten/Daten endgültig löschen | offene Anfrage zeigen | Löschprotokoll | Privacy-Gate | ja |
| Trip-/Traveller-/Route-/Readiness-/Safety-/Seasonal-Truth ändern | Graph-Qualität | Hinweis an Support | nur definierte Supportfälle | Admin-Shortcut |
| Wiederkehrende Reports | ja | ja, Zeitplan | Versand an Allowlist | Versand an beliebige Empfänger |
| Modelle aufrufen | ja, mit Kontingent | ja | — | unlimitierter öffentlicher Endpoint |

## 3. Technische Grenzen

- Dieselben Capabilities wie die manuelle Fläche; kein Copilot-Bypass.
- Jede Execute-Stufe erzeugt eine Audit-Zeile mit Prompt-Id, Evidence-Ids, Akteur, Bestätigung.
- LLM-Text ist untrusted. Zahlen kommen aus Evidence-Objekten, nicht aus dem Modell.
- Kill Switch und Token-Limits wie `JETNITY_MODELL_AKTIV` / `model_usage`. Eigener Admin-Copilot-Switch empfohlen.
- Timeout, Max Tokens, kein Tool, das Management-APIs schreibend exponiert.
- Break-Glass-Sitzungen: nur Analysieren, nie Execute.

## 4. Erste sinnvolle Automatisierungen (nach Evidence)

1. Tägliches Lage-Briefing aus Health + Reisen + Modellkosten.
2. „Was ist seit gestern neu kritisch?“
3. Runbook: Deployment ERROR, Production noch READY.
4. Support-Entwurf: Nutzer N, Reise-Aggregate, offene Fragen – ohne Graph-Write.

Das sind Vorbereitungsjobs, keine Execution-Jobs.
