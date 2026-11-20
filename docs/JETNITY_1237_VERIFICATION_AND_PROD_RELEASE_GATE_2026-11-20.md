# Jetnity – #1237 Datenbank-Readback, KI-Unterkunftskorrektur und Production-Release-Gate
**Stand:** 20. November 2026 · **Geltung:** Dev-Read-only und Vorbereitung · **Kein Production-Deploy**

## 1. Originalreise: unabhängiger Dev-Datenbanknachweis
Der Owner hatte am 20.11.2026 in der isolierten Dev-Vorschau eine neue eigenständige Bangkok/Krabi-Reise gespeichert und danach in der ursprünglichen Reise die Test-Aktivität, -Unterkunft und -Notiz gezeigt. Ein unabhängiger **ausschliesslich lesender** SQL-Readback auf Supabase Dev `yfvbxvijcorffwxbxahl` ergab für die ursprüngliche, vom Browser gezeigte Reise:
- Genau **eine Originalreise**, **Revision 4**, **7 Reisetage**, **2 Etappen**, **21 Planpunkte**; **6 Punkte an Bangkok-Tag 3**.
- Je **eine Test-Aktivität**, **Test-Unterkunft** und **Test-Notiz** mit dem vereinbarten Titel; die „Nacht in Bangkok“-Unterkünfte sind weiter vorhanden.
- **0 ungeplante Punkte** und **0 verwaiste Tageszuordnungen**. Die Originalreise ist seit dem **19.11.2026** nicht mehr aktualisiert; *alle* Tages- und Punkt-`updated_at`-Werte liegen **vor** der separaten Neuerstellung vom 20.11.2026.
- Vom gleichen Dev-Konto wurde zwischen 12:05 und 12:25 UTC am 20.11. eine **separate neue Reise** „7 Tage Bangkok und Krabi“ gespeichert: **7 Tage, 2 Etappen, 26 Punkte**; eine ihrer Positionen trägt tatsächlich die falsche Kombination **`kind=stay` + „Letzter Morgen in Krabi“**. Diese Fehlklassifikation ist damit nicht nur eine UI-Screenshot-Annahme, sondern als aktueller Dev-Datensatz nachgewiesen.

**Präzise Beweisgrenze:** Die Zeitstempel und die aktuelle vollständige Zuordnung belegen, dass die normalen Schreibwege die Originalreise während der Erstellung nicht verändert haben. Ein vor dem ersten Test hinterlegter unveränderlicher Hash jeder einzelnen Punkt-ID existiert nicht; daher ist dies **kein unabhängiger kryptografischer Vorher-/Nachher-ID-Vergleich**. Aus der Abfrage wurden keinerlei Dateninhalte, Konto- oder Reise-IDs in den PR übertragen; nur Zählungen und Zeitgrenzen. **Keine SQL-Schreiboperation** durchgeführt.

## 2. Fix für künftige KI-Neuerstellungen
Der bestehende modellvalidierte `punktSchema`-Prüfer in `lib/reisevorschlag/schema.ts` ordnet ein als `stay` gemeldetes „Letzter Morgen / Letzter Vormittag / Last morning …“ deterministisch zu **`activity`** um. Das Objekt beschreibt einen Tagesabschnitt und keine neue Unterkunft oder Hotelnacht. Alle tatsächlichen „Nacht in …“-/„Nächte am …“-Punkte bleiben **`stay`**.
- Dieselbe Typprüfung wird beim **Modellantwort-Entwurf** und bei der **serverseitigen Konto-Übernahme** von untrusted Browser-Vorschlägen verwendet; Guest-/Account-Mapping erhalten denselben korrigierten Typ. Damit braucht die Korrektur **keinen weiteren Modellversuch** und **keine Quotenauffüllung**.
- Der Systemprompt benennt die Unterscheidung zwischen tatsächlicher Übernachtung und Morgen-/Abreiseaktivität zusätzlich, ohne sich ausschliesslich darauf zu verlassen.
- Neue synthetische Regression prüft Modell- und Save-Schema, Gast-/Konto-Abbildung, echte Unterkünfte als unverändert, 7-Tage-Entwurf und **nur eine** bestehende Quotenreservierung/Modellanfrage.
- Die **bereits früher gespeicherte** fehlerhafte Dev-Testreise bleibt unverändert, bis sie über einen ausdrücklich bestätigten eigenen Korrekturweg bearbeitet wird. Kein stilles Eingreifen in Nutzerinhalte, kein Production-Migration-Write. Das behebt den Erzeugungsfehler für neue Vorschläge, nicht rückwirkend alle alten Datensätze.

## 3. Reihenfolge und Releasegrenzen
- **Qualitätsschritt 2 #1261** ist bereits normal in `main@c4544f9f` gemergt, Exact-Head-CI **#4624 12/12 grün**; die Issues #1139 (Account-/Sessionstatus), #1087 (Consent), #968 (vollständig nachgewiesene Preview-Secret-Isolation) bleiben offen. **Kein zweiter PR oder Merge für #1261**.
- KI-Fix **#1262** ist normal in `main@159ba348` gemergt; CI **#4627 12/12 grün** nach gezieltem BG1-Retry. Echte Dev-Screenshots vom 20.11. 14:47–14:49 zeigen: unsicherer Reiseänderungsvorschlag fail-closed verworfen und **konkrete** unverbindliche Krabi-Tagesidee angezeigt. Keine Übernahme der gefährlichen Änderung.
- **#1260** (Next.js 16.4.6, CSP und Security-Header) ist nur als Source auf main gemergt, **nicht** auf jetnity.com ausgerollt. `vercel.json` hat `git.deploymentEnabled.main=false`. Beide Vercel-Domain-Aliase `jetnity.com` und `www.jetnity.com` stehen unverändert auf dem bewussten alten `dpl_8fitMFHnsYX2RPYBGtPXJGkJFwaA`.
- **Wichtiger separat verifizierter Production-Blocker:** Die Production-Datenbank-Prüfbedingung `model_usage_funktion_werte` erlaubt derzeit **`reisevorschlag` und `reiseaenderung`**, jedoch **nicht** `reisebegleiter`. Die bestehende additive, noch **UNAPPLIED** Migration `supabase/migrations/20260917090000_modell_reisebegleiter.sql` erweitert ausschliesslich diese Prüfbedingung, ohne Kostengrenzen zu ändern. **Owner-Genehmigung für Production-Installation und Rückrollplan erforderlich**, falls der Reisebegleiter nach dem Deploy tatsächlich live funktionieren soll. Kein Workaround über Quoten/Role/Function-Switch.

## 4. Production: gebündelte Prüfliste **nach separater ausdrücklicher Owner-Freigabe**
**Vorher (kein Deploy):** Exakten neuesten Main-SHA nach diesem PR und vollständige Post-Merge-CI grün verifizieren; Release-Commit und bisheriges öffentliches Deployment notieren, `main`-Autodeploy OFF rücklesen. Alle erforderlichen TLS-Subdomains für HSTS `includeSubDomains` prüfen. Keine neuen Keys, Ausgabenlimits, Providerrechte oder Migrationen ohne eigene Freigabe. Die Production-Begleiter-Migration ist ein **separates Owner-Gate**.

**Erst nach bewusstem Vercel-Deploy/Promotion** auf jetnity.com in dieser Reihenfolge prüfen:
1. **Karte:** Bei einer bestehenden Testreise Karte, Pins, mehrere Stopps und Routeninteraktion prüfen, Browserkonsole auf CSP-Verletzung untersuchen; keine Google-Maps-Quota-Umgehung.
2. **Wetter:** Im Reiseplan mit nötiger Zustimmung die echten Vorhersagen und die „nicht verfügbar“-/Quota-Anzeige kontrollieren; auf fehlende CSP-Blockade und richtige serverseitige OpenWeather-Konfiguration achten.
3. **Mietwagen:** Station, Zeitraum, Fahrer sowie korrekte Anbieter-/Consent-Sperren prüfen; Affiliate-Link nur mit dokumentierter Freigabe öffnen, **keine Buchung, Zahlung oder ungeprüfte Tracking-Freigabe**.
4. **Login:** Mit Owner-kontrolliertem QA-Konto anmelden, MFA/TOTP nur direkt im Browser, danach Refresh, Session und Logout prüfen; **kein Passwort oder 2FA im Chat**. Auth-/Passkey-Serverfreigaben werden dadurch nicht erteilt.
5. **KI:** Erstelle eine **separate** 7-Tage-Bangkok/Krabi-Reise und prüfe Vorschau, Tages-/Unterkunftstypen, Speichern und Neuladen. Öffne die Originalreise, vergleiche bestehende Aktivitäten/Unterkünfte/Notizen; teste „einen belegten Tag verschieben, ohne Punkte zu verändern“ (muss sicher verweigert werden). Frage den Reisebegleiter nach einem Tag in Krabi (konkrete gekennzeichnete Idee oder ehrliche Nichtverfügbarkeit). **Vorher** die separate Production-`reisebegleiter`-Prüfbedingung mit Owner-AAL2/Migrations-Gate freigeben und prüfen; andernfalls diesen dritten KI-Pfad als **BLOCKED**, nicht PASS, kennzeichnen. Bestehende rollierende KI-Quoten beachten.
6. **Header:** Direkte Responses der Production-Origin auf CSP, XFO, nosniff, Referrer, Permissions, HSTS `max-age=31536000; includeSubDomains` und fehlendes `X-Powered-By` prüfen; die strengere `/embed/`-CSP der Karte/Partner nicht überlagern.

**Sofort-Rollback bei einer Regression:** Die beiden Domain-Aliase über Vercels **Rollback/Promote des zuvor bekannten guten** Deployments `dpl_8fitMFHnsYX2RPYBGtPXJGkJFwaA` zurückschalten, beide Zuweisungen unabhängig rücklesen und Karte/Wetter/Login erneut testen. Ein Git-Revert allein oder ein Source-Merge setzt Vercel-Aliase nicht zuverlässig zurück. **Datenbankänderungen werden dadurch nicht rückgängig gemacht**; falls die separate Migration später bewilligt wird, braucht sie eine eigene transaktionale Rollback-Freigabe. HSTS im Browser bleibt u. U. zwischengespeichert und wird nicht durch einen Alias-Rollback gelöscht; eine Deaktivierung erfordert bei Bedarf `Strict-Transport-Security: max-age=0` über gültiges HTTPS.

**Status:** `PREPARED / UNAPPLIED / NO PRODUCTION DEPLOY`. Owner entscheidet separat über Production-Build, mögliche Begleiter-Migration, Kostengates und Login/2FA.

## 5. Gebündelte Owner-Freigaben (Stand 20.11.2026, 15:40 Zürich)

**Ist-Zustand Production (öffentlicher Header-Readback 20.11.):** `jetnity.com` sendet weiterhin `X-Powered-By: Next.js`, keine CSP und die Vercel-Standard-HSTS ohne `includeSubDomains`; `www.jetnity.com` leitet per 308 auf `jetnity.com`. Damit ist **#1260 nachweislich nicht live**. Die Vercel-API für Alias-/Deployment-Lesen ist diesem Agenten-Zugang verweigert (403/404); die Alias-Zuordnung auf `dpl_8fitMFHnsYX2RPYBGtPXJGkJFwaA` stammt aus dem letzten dokumentierten Readback und ist vor dem Deploy im Vercel-Dashboard einmal abzulesen.

**Was mit dem Deploy live geht:** alle seit dem gepinnten Build auf `main` gemergten PRs, nach Git-Historie #1252 (KI-Schutz), #1255, #1257 (Reiseintegration S1–S4: Hotel-Gäste/Zimmer, Rückweg zur Reise, Merkliste-Herkunft, Mietwagen-Consent), #1259 (Admin/CMS, Production weiter auf CMS-v1, `JETNITY_CMS_PUBLIC_V2_ENABLED` aus), #1260 (Next 16.4.6, Security-Header), #1261 (Qualitätsschritt 2), #1262 und #1263 (KI-Korrekturen). Die Prüfliste in §4 ergänzt deshalb einen Punkt: **Hotel/Merkliste** – Hotelsuche aus einer Etappe öffnen (Erwachsene/Kinder/Zimmer sichtbar), Angebot merken, „nur gemerkt, nicht gebucht“ sichtbar, „Zur Reise zurück“ führt zum richtigen Reiseplan.

### Freigabe A – Production-Deploy (Vercel, durch Owner oder mit erteiltem Vercel-Zugang)
1. Voraussetzung: Main-CI auf dem Merge-Commit von #1263 vollständig grün.
2. Vercel → `jetnity-app` → Deployments → **Create Deployment** → Branch `main`, exakt dieser Commit, Ziel Production. Da `main`-Autodeploy aus ist und die Domains bisher nicht automatisch umgehängt wurden, bleibt `jetnity.com` dabei zunächst auf dem alten Build.
3. Prüfliste §4 (Karte, Wetter, Mietwagen, Login/2FA, KI, Hotel/Merkliste, Header) **zuerst auf der Deployment-URL** des neuen Builds (gleiche Production-Variablen), dann **Promote to Production**.
4. Nach Promote: Kurzcheck auf `jetnity.com` (Startseite, eine Reise öffnen, Login, Header).
5. Rollback: Vercel **Instant Rollback** auf `dpl_8fitMFHnsYX2RPYBGtPXJGkJFwaA`, beide Domains rücklesen. Kein Git-Revert nötig.

### Freigabe B – Production-Datenbank für den Live-Reisebegleiter (eine additive Prüfbedingung)
- **Inhalt:** ausschliesslich die vorhandene Migration `supabase/migrations/20260917090000_modell_reisebegleiter.sql`: Prüfbedingung `model_usage_funktion_werte` erlaubt zusätzlich `reisebegleiter`. Keine Änderung an RLS, Rechten, Reservierungsfunktion, Preisen oder Deckeln; der Begleiter teilt das bestehende gemeinsame Tageskontingent und den bestehenden Tageskostendeckel. **Keine neuen Kosten über den bestehenden Deckel hinaus.**
- **Vorher (SELECT):** `pg_get_constraintdef` von `model_usage_funktion_werte` zeigt genau `reisevorschlag`, `reiseaenderung`; Version `20260917090000` fehlt in `supabase_migrations.schema_migrations`.
- **Ausführung (eine Transaktion):** Migrationsdatei unverändert ausführen und Version `20260917090000` / Name `modell_reisebegleiter` in `supabase_migrations.schema_migrations` eintragen.
- **Nachher (SELECT):** Prüfbedingung enthält genau die drei Werte; keine weiteren Objekte verändert.
- **Rollback (eine Transaktion):** Prüfbedingung entfernen und mit den zwei alten Werten als `NOT VALID` neu anlegen (blockiert neue Begleiter-Zeilen, bereits gezählte Nutzung bleibt für den Kostendeckel erhalten), Versionseintrag entfernen.
- **Reihenfolge:** B vor dem KI-Punkt der Prüfliste. Ohne B bleibt der dritte KI-Pfad in Production **BLOCKED** (ehrliche Fehlermeldung, keine Reise beschädigt), nicht PASS.

### Freigabe C – KI in Production (nur Kontrolle durch Owner, kein Agenten-Eingriff)
- In Vercel Production-Scope nur **Existenz** prüfen: `JETNITY_MODELL_AKTIV` (genau `true`/`1`), `OPENAI_API_KEY`, `JETNITY_MODELL_NAME`, `JETNITY_MODELL_AUFWAND`, `SUPABASE_SERVICE_ROLE_KEY`. Fehlt eine davon, bleibt die KI auf jetnity.com aus und der KI-Punkt ist BLOCKED. Werte niemals in Chat/PR.
- Notbremse nach Aktivierung: `JETNITY_MODELL_AKTIV` entfernen bzw. auf einen anderen Wert setzen und neu deployen; Reisen bleiben unverändert.
