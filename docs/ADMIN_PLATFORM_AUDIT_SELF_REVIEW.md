# Admin Platform Audit – adversarieller Self-Review

Stand: 24. August 2026  
Reviewer: derselbe Cursor-Agent `Admin platform audit` (nicht unabhängig im Sinne des ChatGPT-Reviews)  
Zweck: das eigene Audit aktiv zu widerlegen, bevor der Workstream als fertig gemeldet wird.

## 1. Was dieser Review nicht ist

Er ersetzt nicht den unabhängigen ChatGPT-/Lead-Review. Er sucht Lücken, Überclaims und blinde Flecken in den soeben erzeugten Dokumenten.

## 2. Versuche, das Audit zu widerlegen

### 2.1 „Der Admin ist professionell genug, ein Control Center existiert faktisch.“

Widerlegt durch Code: Analytics/Marketing/Content/Settings/Localization sind einzeilige Stubs. Home hat keine Deployments, keine Provider, keine Alerts, keine Copilot-Evidence. Topbar lügt. **Claim im Audit bleibt: kein Control Center.**

### 2.2 „Refunds sind gefährlich, weil sie Geld bewegen.“

Teilweise zu scharf. Der Code schreibt nur `refunds` und setzt `payments.status`. Es gibt keinen Stripe-Call. Das finanzielle Risiko ist **Wahrnehmungs- und Abgleichsrisiko**, kein nachweisbarer Live-Geldfluss in diesem Repo. Das Audit wurde entsprechend auf „Finanztheater / lokale Buchhaltung“ präzisiert. Ein späterer Ingest würde dasselbe UI gefährlich machen – das bleibt ein Must-Label, kein Must-Disable ohne PO.

### 2.3 „IP-Block ist ein Security-Loch, weil jeder Operator IPs sperrt und Traffic stirbt.“

Umgekehrt: die Tabelle wird **nicht** gelesen. Risiko ist False Assurance, nicht False Positive-Blocking. Enforcement als Must wäre eine stille Produktänderung. Korrekt als Should + eigenes Gate.

### 2.4 „Admin kann Reisen sehen, weil Owner alles darf.“

Widerlegt durch `trips_lesen`: nur `user_id = auth.uid()`. Owner ist keine Trip-Ausnahme. Support-Lücke ist real; eine weite Policy wäre der größere Fehler.

### 2.5 „Infomaniak-Scopes sind verbindlich `domain:read` / `dns:read`.“

Nicht haltbar. Offizielle Doku nennt im Beispiel `domains`. Community-CLIs nennen andere Strings. Das Audit darf keine Scope-Liste als verifiziert verkaufen. Dokumentiert als „am Manager verifizieren“.

### 2.6 „System Health kann ohne Tokens gebaut werden.“

Live-Health braucht Secrets. Ohne Tokens bleibt nur `unknown` oder App-Probes. Slice B ohne Secret-Gate darf nicht „Vercel gesund“ zeigen.

### 2.7 „Account-Konflikte sind vollständig, weil das Account-Modell gelesen wurde.“

Unvollständig: der Account-Audit-Agent hat in diesem Branch noch keine eigenen Artefakte. Der sichtbare Account-Code ist schmal (`/account/security`). Weitere Account-Seiten können auf `main` fehlen oder in einem anderen Branch entstehen. Konfliktliste ist aus **Modell + heutigem main-nahen Code**, nicht aus einem fertigen Account-Audit.

### 2.8 „PR #38 blockt das Admin-Audit.“

Policy blockt unkoordinierte **Kernimplementierung**. Doku-Audit ist erlaubt. CI von #38 war zum Prüfzeitpunkt grün; das ist kein Closure/PASS und kein Merge.

### 2.9 „Empty-vs-Error ist überall gelöst.“

Für lesende Payments/Security/Users/Home weitgehend ja. Lücken: Break-Glass-leere Reads, tote Event-Tabelle, Payouts=0, Fake-Topbar. Das Audit darf Phase-1.4 nicht als vollständig wahrheitsfest verkaufen.

### 2.10 „Copilot Pro kann zuerst gebaut werden, weil Vision es will.“

Ohne Evidence halluziniert er. Slice I nach A–C ist richtig. Ein früher Chat ohne Health/Kosten wäre ein Rückfall in die tote Topbar.

### 2.11 „Ich habe alle Admin-APIs gelesen.“

Zehn Routen unter `app/api/admin` wurden erfasst (5 Payments, 5 Security). Kein weiterer Admin-API-Ordner gefunden. Risiko: dynamische oder nicht `api/admin`-pfade. `check:api-schutz` gilt nur unter `app/api/admin`. Server Actions (`users/actions.ts`) sind ein zweiter Write-Pfad – im Audit enthalten.

### 2.12 „Production-Admin-Verhalten ist verifiziert.“

Nein. Kein Login gegen Production, keine Messung, ob `payments` leer ist. Nicht als Live-Evidence behaupten.

### 2.13 Fehlende Pflichtdatei

`docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md` existiert nicht. Das ist ein Prozessdefekt, kein Admin-Runtime-Defekt. Gemeldet, nicht „still ersetzt“.

### 2.14 Traveller-Context im Admin

Nicht relevant für heutige Flächen (keine Traveller-Einsicht). Wird relevant in Slice E. Policy eingehalten: keine Credential-Sammlung vorgeschlagen.

## 3. Korrigierte Überclaims

| Ursprüngliche Schärfe | Korrektur |
| --- | --- |
| Refund als Live-Payment-Risiko | lokales Buchungsrisiko + zukünftiges Provider-Risiko |
| Infomaniak-Scopes als fest | verifizieren |
| Account-Konflikt vollständig | unvollständig bis Account-Audit da ist |
| System Health ohne Token | nur unknown/probes |

## 4. Bewusst offene Audit-Lücken

- keine Browser-Session im Admin
- keine `db:sicherheit`-Ausführung gegen Live-Development in diesem Bericht, falls Secrets fehlen
- keine vollständige DECISIONS-Historie zeilenweise zitiert; ADRs stichprobenartig
- Google-Ads-API nicht tief spezifiziert (Later, eigenes Gate)
- `pg_cron` Extension existiert laut DATENBANK.md, App-Crons nicht – tiefer Cron-Inventory nicht gemacht
- Localization/i18n-Runtime außerhalb Admin nicht vollständig kartiert

Diese Lücken ändern das Gesamturteil nicht: Ist-Admin ≠ Ziel-Control-Center; Fundament wiederverwenden.

## 5. Urteil

Das Audit ist **als Vorbereitungsstand fertig**, wenn die Lieferobjekte im Branch liegen und keine Implementierung eingeschleust wurde.

Es ist **nicht** unabhängig reviewed und **nicht** implementierungsfreigegeben.

Self-Review-Ergebnis: keine zurückgehaltenen kritischen Runtime-Funde. Kein Mark Ready. Kein Merge-Antrag über Doku-Review hinaus.
