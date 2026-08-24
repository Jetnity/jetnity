# Admin Slice B – Read-only System Health

Stand: 24. August 2026
Status: **IMPLEMENTATION TASK – Current-Main-Re-Sync nach Slice-A-Merge**

Verantwortlicher Cursor-Agent: `Admin platform audit`

Branch: `feat/admin-system-health`
Base: aktueller `main` `1ec93cc9` (Admin Slice A / PR #44 gemergt)
Historische Stack-Basis: `feat/admin-control-center-ia` / PR #44

## Ziel

Baue den ersten professionellen, **rein lesenden System-Health-Bereich** des Jetnity Admin Control Centers.

Ein Admin soll auf einen Blick sehen können, welche technischen Jetnity-Systeme tatsächlich beobachtbar sind, wann sie zuletzt geprüft wurden und ob die vorhandene Quelle einen belastbaren Zustand liefert.

**Wichtigste Produktregel:** Kein Fake-Green. Ein Dienst darf nur dann als gesund/operativ dargestellt werden, wenn eine reale, benannte und hinreichend frische Quelle genau diese Aussage trägt.

## Verbindliche Architekturgrenzen

1. **Read-only only.** Keine Restart-, Redeploy-, Retry-, Repair-, Clear-Cache-, Migrate-, Rotate-, Block-, Refund- oder sonstige Write-Aktion.
2. Keine neue Datenbankmigration, kein neues RLS, keine Capability-Neudefinition, keine Service-Role-Ausweitung.
3. Keine neuen Secrets, API-Keys, Tokens, OAuth-Verbindungen, Providerverträge oder kostenpflichtigen Dienste ohne separates Product-Owner-Gate.
4. Keine Client-seitigen Secrets oder direkten Browser-Aufrufe zu Management-APIs.
5. Keine autonome Copilot-Aktion. Copilot Pro darf höchstens vorhandene Health-Daten später erklären; das ist **nicht** Teil dieses Slices.
6. Keine Änderungen an Account, Homepage, Trip Workspace, Provider-Readiness oder Travel-Truth.
7. Slice A bleibt die Basis. Bestehende Guards (`requireAdminPage`, `requireAdminApi`, RLS) bleiben Autorisierungsquelle.
8. PR bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.

## Systeme im Zielbild

Mindestens diese Systeme müssen im Modell und in der UI vorgesehen sein:

- **App / Deployment**
- **Vercel**
- **Supabase**
- **GitHub / CI**
- **Infomaniak**

Weitere Systeme nur, wenn sie bereits real im Repository verankert sind und ohne Scope-Ausweitung sauber belegt werden können.

## Ehrliches Health-Modell

Definiere eine zentrale, typisierte Health-Form. Keine ad-hoc Texte pro Karte.

Mindestens:

- `id`
- Anzeigename
- `status`
- `source`
- `checkedAt`
- optional `sourceUpdatedAt`
- `freshness`
- kurze belastbare Zusammenfassung
- optional technischer Detailhinweis für Admins

Statuswerte müssen semantisch trennscharf sein. Empfohlene Richtung:

- `healthy` – reale, frische Quelle bestätigt den geprüften Zustand
- `degraded` – reale Quelle meldet Einschränkung/Teilproblem
- `unavailable` – reale Prüfung ist fehlgeschlagen oder Dienst nicht erreichbar
- `unknown` – Quelle reicht nicht für eine Aussage
- `not_configured` – für diesen Check fehlt eine freigegebene/konfigurierte Quelle
- `stale` entweder als eigener Status oder eindeutig als Freshness-Zustand; **stale darf niemals grün aussehen**

Keine Ableitung `ENV vorhanden => healthy`.
Keine Ableitung `letzter Build war grün => Plattform aktuell healthy`, wenn die Quelle dafür nicht reicht.
Keine Ableitung `HTTP 200 irgendeiner Jetnity-Seite => alle Systeme healthy`.

## Source / Freshness Contract

Jede sichtbare Aussage muss beantworten können:

1. **Welche Quelle?**
2. **Wann geprüft?**
3. **Was beweist diese Quelle konkret?**
4. **Wie lange gilt die Aussage als frisch?**

Freshness muss zentral und deterministisch berechnet werden. Keine dauerhaft grünen Karten aus einem alten Snapshot.

Wenn eine Quelle nicht vorhanden oder nicht freigegeben ist, muss die UI `Nicht verbunden`, `Nicht konfiguriert`, `Unbekannt` oder eine gleichwertig ehrliche Form zeigen – niemals erfundene Demo-Werte.

## Zulässige Live-Evidence in Slice B

Der Agent soll zuerst den vorhandenen Code und die vorhandene Runtime-Konfiguration prüfen.

Er darf eine reale read-only Quelle anbinden, **nur wenn**:

- sie bereits ohne neues Secret / neue Berechtigung / neue Kosten sicher verfügbar ist,
- die Abfrage serverseitig erfolgt,
- Timeout und Fehlerzustand fail-closed modelliert sind,
- die Abfrage konservativ gecacht/revalidiert wird,
- Rate-Limits respektiert werden,
- keine personenbezogenen oder unnötigen Betriebsdaten exponiert werden.

Wenn Vercel-, Supabase-Management-, GitHub- oder Infomaniak-Health einen neuen Token/Secret/Vertrag benötigt: **nicht aktivieren**. Adapter/Contract darf vorbereitet werden, sichtbarer Zustand bleibt `not_configured`/`unknown`, und die spätere Aktivierungsanforderung wird dokumentiert.

## UI / IA

System Health gehört in das bestehende Admin Control Center aus Slice A.

Anforderungen:

- eigene klar benannte Admin-Seite oder sauberer Control-Center-Einstieg
- Desktop und Mobile hochwertig
- auf einen Blick Status + Freshness + Quelle
- keine überladene Monitoring-Konsole
- Details progressiv, z. B. kompakter Expand/Detailbereich
- Fehler/Unknown/Stale visuell eindeutig; nicht alles grün
- Accessibility: semantische Status-Texte, nicht nur Farbe
- keine dekorativen Zahlen oder Charts ohne echte Quelle

## App-/Deployment-Wahrheit

Wenn Build-/Deployment-Metadaten aus vorhandener Vercel-Runtime verfügbar sind, darf Jetnity sie als **Deployment-Metadaten** zeigen (z. B. Environment, Commit SHA, Deployment-Identität), aber nur als das, was sie sind.

Sie beweisen nicht automatisch Vercel-Plattform-Health, Datenbank-Health oder GitHub-CI-Health.

## GitHub-/CI-Wahrheit

Nur ein tatsächlich gelesener Workflow-/Commit-Status darf als CI-Zustand erscheinen. Wenn keine sichere source-backed Abfrage vorhanden ist, `not_configured`/`unknown`.

Ein alter CI-Lauf muss nach definierter Freshness sichtbar stale werden.

## Supabase-Wahrheit

Unterscheide sauber:

- App kann auf ihre Datenquelle zugreifen
- Supabase-Projekt/Management-Plattform ist healthy

Das sind nicht dieselben Aussagen. Keine Management-Health behaupten, wenn nur ein App-DB-Read belegt ist.

Keine Service-Role nur für Health hinzufügen.

## Vercel-Wahrheit

Unterscheide sauber:

- diese App läuft in einer Vercel-Deployment-Umgebung
- das konkrete Deployment ist bekannt
- Vercel-Plattform/Projekt ist aktuell healthy

Nur die belegte Ebene anzeigen.

## Infomaniak-Wahrheit

Keine Domain-/Mail-/DNS-/Hosting-Health erfinden. Ohne bereits vorhandene sichere Quelle: `not_configured`/`unknown` plus klarer Hinweis, welche spätere read-only Integration dafür nötig wäre.

## Fehler-, Timeout- und Cache-Verhalten

Jede echte externe Read-Abfrage braucht:

- begrenzten Timeout
- kontrolliertes Fehler-Mapping
- kein Throw bis zur ganzen Admin-Seite, wenn nur ein Dienst ausfällt
- konservatives Caching/Revalidation
- keine aggressive Polling-Schleife
- kein Client-Refresh im Sekundentakt
- stale/last-known darf nur mit explizitem Alter und entsprechender Kennzeichnung angezeigt werden

## Tests – Pflicht

Mindestens automatisiert abdecken:

1. echte frische Success-Evidence => `healthy`
2. Quelle fehlt => `not_configured` oder `unknown`, niemals healthy
3. Timeout/Fehler => `unavailable`/`unknown`, Seite bleibt nutzbar
4. alte Evidence => stale/nicht grün
5. Teilfehler eines Systems beeinflusst nicht die anderen Karten
6. Status ist textuell/accessibility-seitig erkennbar, nicht nur über Farbe
7. kein Health-Write / keine Mutation im Slice-B-Pfad
8. keine neuen Client-seitigen Secret-/Management-API-Aufrufe
9. Admin-Schutz bleibt erhalten
10. bestehende Slice-A-Tests bleiben grün

## Vollständige Gates vor Handoff

- relevante Unit-/Contract-Tests
- vollständige Testsuite
- Typecheck
- Lint
- Hygiene-Checks
- Production Build
- Admin/UI-Audit auf relevanten Viewports
- `check:api-schutz` bzw. vorhandene Admin-Security-Gates
- GitHub Actions CI auf dem **Exact Head**
- Vercel Preview READY auf demselben **Exact Head**

## Pflicht-Dokumentation

Neu/aktualisiert mindestens:

- `docs/ADMIN_PLATFORM_SLICE_B_STATUS.md`
- `docs/ADMIN_PLATFORM_SLICE_B_HANDOFF.md`
- `docs/ADMIN_PLATFORM_SLICE_B_SELF_REVIEW.md`
- relevante ADR/`ARCHITECTURE.md`/`ROADMAP.md`
- `docs/ACTIVE_WORK_STATUS.md`

Dokumentiere pro System ausdrücklich:

- aktuelle Quelle
- was sie beweist
- was sie **nicht** beweist
- Freshness/TTL
- Fehlerverhalten
- ob später ein Secret/Token/Vertrag nötig wäre

## Stop-Kriterium

Nach Erfüllung des Scopes und der Gates wartet der Agent auf den unabhängigen ChatGPT/Technical-Lead-Review.

Nicht selbst mit einem weiteren Admin-Slice beginnen.
Nicht Mark Ready.
Nicht mergen.

## Arbeitsweise

Proaktiv prüfen. Wenn im bestehenden Admin eine irreführende Health-Behauptung direkt im Slice-B-Pfad gefunden wird, innerhalb dieses Scopes sauber korrigieren und mit Regressionstest absichern.

Keine theoretischen Nebenprojekte eröffnen. Nur konkrete Defekte mit relevantem Einfluss auf Health-Truth, Security, Source-of-Truth oder Rollout anfassen.