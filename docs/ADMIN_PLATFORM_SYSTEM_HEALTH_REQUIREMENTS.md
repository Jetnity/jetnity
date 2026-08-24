# Jetnity Admin Platform – System Health / Infrastruktur

Stand: 24. August 2026  
Status: **verbindlicher Bestandteil des Admin-Platform-Audits und der späteren Steuerzentrale**  
Branch: `audit/admin-platform`

## 1. Ziel

Die Jetnity-Steuerzentrale soll dem Betreiber auf einen Blick belastbar zeigen, ob die für Jetnity kritische Infrastruktur korrekt arbeitet. Dazu gehören insbesondere **Vercel** und **Supabase**.

Das Ziel ist kein Nachbau der Vercel- oder Supabase-Dashboards. Jetnity aggregiert die für Betrieb, Sicherheit und Entscheidungen relevanten Zustände und verlinkt für Tiefenanalyse kontrolliert auf die jeweiligen Originalsysteme.

## 2. Grundregeln

- **read-only zuerst**;
- jeder Zustand braucht eine belastbare Quelle;
- jede Anzeige braucht `lastCheckedAt` / Freshness;
- `unknown`, `stale`, `unavailable` und Fehlerzustände müssen sichtbar sein;
- Jetnity darf niemals einen grünen Status erfinden, wenn keine aktuelle Evidence vorliegt;
- keine Secrets, Tokens, Connection Strings oder sensible Environment-Werte im UI oder Log;
- Infrastrukturstatus ist Betriebs-Evidence, keine zweite Source of Truth für Produktdaten;
- Copilot Pro darf analysieren und Handlungsvorschläge erstellen, aber keine kritischen Infrastrukturänderungen autonom durchführen.

## 3. Vercel – mindestens zu auditieren / planen

Soweit über offizielle, sichere Schnittstellen belastbar verfügbar:

- Production-Deployment: gesund / fehlgeschlagen / läuft / unbekannt;
- aktuell produktiver Deployment-/Commit-Stand;
- letzter erfolgreicher Build/Deployment;
- fehlgeschlagene oder abgebrochene Deployments;
- Preview-vs-Production-Zuordnung;
- Runtime-/Serverfehler und relevante 5xx-Signale;
- Deployment-/Build-Freshness;
- Domain-/Deployment-Zuordnung;
- relevante Environment-Health nur als Status, ohne Secret-Werte;
- direkter sicherer Deep-Link zum Vercel-Originalsystem für Detailanalyse.

Der Audit-Agent soll prüfen, welche dieser Daten über offizielle Vercel-APIs tatsächlich belastbar abrufbar sind und welche zusätzliche Telemetrie nötig wäre.

## 4. Supabase – mindestens zu auditieren / planen

Soweit technisch und sicher belastbar verfügbar:

- Datenbank-Erreichbarkeit / Health;
- Auth-Erreichbarkeit und Auth-Fehlersignale;
- API-/PostgREST-Health;
- Storage-Health;
- wichtige RLS-/Security-Gates bzw. deren letzter verifizierter Prüfstatus;
- Schema-/Migration-Drift bzw. erwarteter Migrationsstand;
- relevante DB-/Auth-/API-Fehler;
- Ressourcen-/Verbindungszustand, soweit offiziell verfügbar und sinnvoll;
- Zeitpunkt des letzten erfolgreichen Health-Checks;
- direkter sicherer Deep-Link zum Supabase-Originalsystem für Detailanalyse.

Der Audit-Agent soll ausdrücklich zwischen **echtem Live-Health**, zuletzt bestandenen CI-/Security-Gates und bloß konfiguriertem Soll-Zustand unterscheiden. Diese drei Dinge dürfen im Admin nicht vermischt werden.

## 5. Gemeinsames System-Health-Modell

Für jede überwachte Komponente soll ein einheitlicher Zustand geprüft werden, zum Beispiel:

- `healthy`
- `degraded`
- `incident`
- `unknown`
- `stale`
- `disabled`

Jeder Eintrag sollte, soweit sinnvoll, mindestens enthalten:

- System/Komponente;
- aktueller Status;
- Severity;
- kurze verständliche Zusammenfassung;
- Quelle / Evidence-Typ;
- `lastCheckedAt`;
- bekannte Auswirkungen;
- empfohlene nächste Aktion;
- Deep-Link zum Originalsystem;
- optional Trend / seit wann verändert.

## 6. Steuerzentrale / UX

Auf der Admin-Startseite soll eine kompakte Infrastruktur-Zusammenfassung sichtbar sein, z. B.:

- Vercel Production
- Supabase DB
- Supabase Auth
- Supabase Storage
- GitHub / CI
- Cron / Jobs
- externe Provider
- Domains / E-Mail
- Payments / Bexio später

Nur auffällige oder wichtige Zustände sollen prominent werden. Detailseiten dürfen tiefer gehen.

## 7. Jetnity Copilot Pro

Copilot Pro soll Infrastrukturstatus nicht nur wiederholen, sondern intelligent interpretieren können, z. B.:

- `Vercel-Deployment fehlgeschlagen, Production läuft weiterhin auf dem vorherigen stabilen Stand.`
- `Supabase Auth zeigt erhöhte Fehlersignale, DB und Storage sind unauffällig.`
- `CI ist grün, aber der letzte Live-Health-Check ist stale; daher kein grüner Gesamtstatus.`

Copilot soll:

- Ursache/Hypothesen von belegten Fakten unterscheiden;
- betroffene Systeme und Nutzerwirkung erklären;
- Priorität vorschlagen;
- sinnvolle nächste Prüfungen vorbereiten;
- bei kritischen Aktionen Human-/Product-Owner-Gates respektieren.

## 8. Verbotene Abkürzungen

- kein `green by default`;
- kein Status allein aus einem UI-String ohne Evidence;
- CI grün bedeutet nicht automatisch Production gesund;
- Vercel READY bedeutet nicht automatisch jede App-Funktion gesund;
- Supabase-Projekt erreichbar bedeutet nicht automatisch Auth/RLS/Storage gesund;
- keine Service-Role- oder Management-API-Secrets in Client-Code;
- keine automatischen Production-Rollbacks, DB-Migrationen, RLS-Änderungen oder Environment-Änderungen in dieser Auditphase.

## 9. Pflicht-Lieferobjekt des Admin-Audits

Der Admin-Agent muss in seinen Audit-/Zielarchitektur-Unterlagen einen eigenen Abschnitt **System Health / Infrastructure Observability** liefern und mindestens dokumentieren:

1. heutiger Ist-Zustand;
2. vorhandene Vercel-/Supabase-Integrationen und Monitoring-Pfade;
3. belastbar verfügbare offizielle Datenquellen;
4. erforderliche Berechtigungen/Scopes und Security-Risiken;
5. Zielmodell und UI-Informationsarchitektur;
6. Health-/Freshness-/Unknown-Semantik;
7. Copilot-Pro-Nutzung;
8. Implementierungsslices;
9. Kosten-/Rate-Limit-Auswirkungen;
10. klare Abgrenzung zu den nativen Vercel-/Supabase-Dashboards.

Diese Anforderungen sind Teil des verbindlichen Admin-Platform-Produkts und dürfen im Audit nicht ausgelassen werden.
