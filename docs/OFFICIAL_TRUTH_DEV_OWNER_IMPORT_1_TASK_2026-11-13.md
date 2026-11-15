# Dev Owner Import 1 — TASK V1

Stand: 13.11.2026. Begrenzte Fortsetzung von Draft #1197.
Author: /root/hosted_batch_fix_g4, dieselbe erreichbare Sitzung.
Root bleibt unabhängiger Technical Lead. Do not mark Ready. Do not merge. Do not start a follow-up slice.

## Baseline und abgeschlossene Live-Schritte

- Modus NORMAL. Main 63544e820e912bd275556588c956a09b99b1cf90.
- #1197 a88d4496b451bc5ac2a7f78206488e489fe315bb, CI4228 alle neun Jobs SUCCESS.
- Preview dpl_7UxkgpTGxadZqoS4vahpambG9yaT READY auf exakt a88d4496.
- Dev yfvbxvijcorffwxbxahl ist installiert. Production qscbgcdmivbbnzrcyegn bleibt separat gegatet.
- PO hat Dev-Passwort und TOTP selbst eingerichtet. Frischer Readback: ein bestätigter aktiver Owner, ein verifizierter Faktor, kein unbestätigter Faktor. Tatsächliche Owner-Seite verlangt Owner, grant=role, Capability und aktuelles AAL2 und ist erreichbar.
- PO hat die konkrete Methode ausdrücklich mit „Für Dev freigegeben“ genehmigt.
- Stage maop1_0d378d71de9224f85fd7db7cc749d77f und Approve maop1_8236611d7632521599ce761a7a14f871 wurden über die echte Owner-Sitzung ausgeführt und jeweils in einer separaten Anfrage bestätigt.
- Frischer unabhängiger Readback: eine Revision, ein Head, zwei Operationen; Revision 1, epoch 1, status approved, approval_mode until_revoked, approval_until null. Beide Operationen gehören zum tatsächlichen aktiven Owner. Beide festgelegten Digests stimmen.
- Auswahl hmr1_fad09ef526aeea7eeeb3fb1f22c894f1; method_id jetnity-destination-primary-ch-de-visa; Betriebsende exklusiv 2027-11-13T00:00:00.000Z.
- Die Browser-Evidence und die exakten Ausführungszeiten liegen im Root-Review; keine Geheimnisse oder Personenkennungen in Dokumente übernehmen.

## Konkretes Problem und Entscheidung

Der vollständige reguläre runOfficialTruthV3ChDeTick ist vorhanden. Der bisherige Scheduler-Einstieg benötigt CRON_SECRET. Frische Vercel-Metadaten zeigen weder einen allgemeinen noch einen Branch-spezifischen CRON_SECRET. Der Diagnose-Build führt nur SOURCE_CHECK_ONLY aus.
Für den ersten tatsächlichen Dev-Import wird deshalb ein kleiner, expliziter manueller Owner-Start ergänzt. Er ruft den vorhandenen Tick auf. Der private Scheduler-Einstieg und seine Bearer-Prüfung bleiben unverändert. Keine neue Rolle, kein neuer Schlüssel, keine künstliche Queue-/Ergebniszeile, kein Build-/Diagnose-Hook mit verstecktem Import.

## Umsetzungsplan und Scope

1. Ergänze eine separate POST-Route unter der vorhandenen Admin-/Official-Truth-Oberfläche und einen kleinen manuellen Startknopf auf der geschützten Methodenseite.
2. Nutze die bestehenden Owner-/Capability-/AAL2-Guards und dieselben festen Dev-Ziel- und Preview-Grenzen wie der bestehende Methodenweg. Falsches oder unselektiertes Ziel muss vor Auth-/DB-/Quellen-I/O abgelehnt werden.
3. Der Server darf ausschließlich den vorhandenen festen CH→DE-Tick ausführen. Keine vom Client wählbaren Methoden, Ziele, Quellen, Rollen, Credentials, Zeitfenster oder SQL. Kein GET mit Seiteneffekt. Exakte Origin-/Body-/Content-Type-Prüfung, begrenzte Anfrage und Antwort.
4. Die aktuellen Methoden-, Quellen-, Lease-, Zeit-, Ressourcen-, Rollback- und Cleanup-Prüfungen des vorhandenen Runtime-Pfads bleiben unverändert. Ein fehlender, widerrufener, abgelaufener oder abweichender Methodenstand darf keinen akzeptierten Import erzeugen. Wenn ein sicherer vorgezogener Methodencheck schon vorhanden ist, wiederverwenden; keine zweite Autoritätslogik erfinden.
5. UI führt ausschließlich nach ausdrücklichem Klick aus, verhindert Doppelklick/Autoretry und stellt busy, complete ohne neue Veröffentlichung, tatsächlich published, unavailable und offenen Ausgang ehrlich dar. Ein verlorener Response ist keine bewiesene Rücknahme. Kein Erfolg allein wegen HTTP 200.
6. Relevante aktuelle Next-Anleitung in node_modules/next/dist/docs lesen. Vor Implementierung bestehenden Methoden-HTTP-Vertrag und Runtime-Tick prüfen. Bei mehreren TSX-Änderungen die vorhandene React-Review-Anleitung anwenden.

Voraussichtliche Dateien: neue Admin-Route, kleiner Client-Bereich oder separate Komponente, Methodenseite, enges server-/clientseitiges Vertragsmodul falls nötig, passende Verhaltenstests und ein knapper Handoff. API-Schutz-Inventar nur soweit die neue geschützte Route es erfordert. Kleine Doku-/Bezeichnungsänderungen bündeln.

## Grenzen

Keine SQL-/Schema-/RLS-/Grant-/Role-/Auth- oder Vercel-Konfigurationsänderung. Kein Service-Role-Ersatz. Keine Änderung der freigegebenen Methode, ihrer Digests, ihrer Auswahl oder der vier HMT-RPCs. Keine Änderung des privaten Cron-Guards, der Quellenqualifikation, des produktiven Zieles oder der Freigabefrist.
Keine neuen Abhängigkeiten, Kosten, Provider oder externen Schlüssel. Keine Secret-Werte lesen/ausgeben.
Keine Änderung von #1198-Dateien. Die beiden gemeinsamen audit.mjs/audit.test.mjs nicht umbenennen oder verschieben; Überschneidungen melden.
#917 bleibt geschlossen und wird nicht wiederholt; #1131 bleibt NOT_REQUIRED. RESEARCH_ONLY-Daten nicht in den Pilotimport mischen.
Das bereits genehmigte Hintergrundschutzpaket ist ein späterer gebündelter Schritt vor Production, nicht Teil dieses engen Startwegs.

## Prüfung und Abnahme

- Aussagekräftige Negativtests für fehlende Sitzung, falsche Rolle/Grant, fehlendes AAL2, falsches Dev-Ziel/Preview, Origin-/Method-/Body-Missbrauch und ausbleibendes Runtime-I/O bei Ablehnung.
- Verhaltenstest für den erlaubten festen Delegationspfad, ehrliche Ergebnis-/Fehlerbehandlung, keinen automatischen Start und keine Doppelausführung.
- Bestehende relevante Methoden-/Runtime-Tests; TypeScript, Lint und betroffene Guards. Keine künstlichen Skips oder Lockerung von Budgets.
- Root prüft den gesamten neuen Diff unabhängig. Danach ein vollständiger frischer grüner Neun-Job-Lauf und Preview auf dem neuen exakten Head. Bei CI-Fehlern alle Fehler des vollständigen Laufs sammeln und gemeinsam beheben.
- Erst Root startet danach den echten Dev-Import. Erfolg verlangt echten Quellimport, akzeptierte Version plus passenden Head/Projektion, source/checkedAt/ruleVersion und Besucherantwort accepted mit synthetic:false. HTTP 200 oder Jobabschluss allein reichen nicht.

## Deliverable und STOPP

Nur im zugewiesenen isolierten Worktree arbeiten. Vor Handoff origin/main und eigenen exakten Head prüfen. Knappen Self-Review mit geänderten Dateien, Testresultaten, Risiken und offenen Gates liefern. Lokal committen, nicht remote publizieren. STOPP für unabhängigen Root-Review; kein Live-Aufruf, Ready, Merge, Production oder Folgeslice.

## Root-Präzisierung V1.1 — eigene Dev-Seite

13.11.2026, dieselbe Sitzung: Der manuelle Start liegt auf der eigenen kleinen Seite `/admin/official-truth/import`, mit Rücklink zur Methodenseite. Die bestehende Methodenpage, `MethodAuthorityPanel.tsx`, HMT/HUI und deren Pins bleiben bytegleich. Kein neuer Hauptnavigationsbereich. Für den neuen POST stehen Dev-Auswahl, Server-Ziel und vollständige Request-Prüfung vor jedem Auth-/Profil-/AAL-/DB-/Quellen-I/O. Der vorhandene Admin-Layout-Guard des GET wird nicht verändert. Der Tick behält sein gemeinsames 30-Sekunden-Arbeitsbudget und seinen vollständig abgewarteten Drain; die Route erhält `maxDuration=60`, keine Zehn-Sekunden-Hülle oder vorzeitige Antwort. Der vorhandene lesende `resolveCurrent`-Vorcheck darf nur vorab verweigern und ersetzt keine Runtime-Fence.

## Root-Präzisierung V1.2 — bestehender Ausführungsort

13.11.2026: Die neue Node-Route wird wie die beiden bestehenden CH→DE-Einstiege in Frankfurt ausgeführt. Dafür ist ausschließlich ein zusätzlicher `functions`-Eintrag für `app/api/admin/official-truth/import/route.ts` mit `regions: ["fra1"]` in `vercel.json` freigegeben. Die installierte Next-16.4.1-Anleitung markiert `preferredRegion` als veraltet; die aktuelle Vercel-Anleitung nennt hierfür `functions[path].regions`. Vorhandene Einträge und `buildCommand` bleiben unverändert. Der bestehende aktuelle Deployment-Witness in `scripts/next-16-4-1-security-patch-p1/audit.mjs`, sein Negativtest und zwingende aktuelle HDP-Pins werden im selben Batch fortgeschrieben; historische Controls, Receipts und PASS-Aussagen bleiben unverändert. Diese enge Ausnahme ersetzt nur das entsprechende Konfigurationsverbot oben. Keine ENV-, Dashboard-, Cron-, Budget- oder Kostenänderung. Die bekannte gemeinsame Audit-Fläche bleibt nach Absprache bei #1197; keine Umbenennung oder Verschiebung.

## Root-Präzisierung V1.3 — vollständiger HTTP-Pfad vor Auth-I/O

13.11.2026: Der bestehende Proxy prüft `/api/admin` bereits vor dem Handler mit `getUser()`. Deshalb ersetzt der feste POST-Pfad `/api/internal/readiness/ch-de-owner-import` den zuvor geplanten API-Pfad; die Admin-Seite bleibt `/admin/official-truth/import`. `proxy.ts` bleibt bytegleich. Der neue Handler behält den vollständigen zentralen Guard, Owner, `grant=role` und aktuelles AAL2. Vertrag, Verhaltenstests, genau ein `fra1`-Eintrag, aktueller Deployment-Witness und erforderliche aktuelle Pins werden zusammen nachgeführt. `scripts/api-schutz.mjs` nimmt ausschließlich diese zusätzliche geschützte Route auf und verweigert bei fehlender Route, fehlendem Gate oder fehlender POST-Ablehnung. Ein Verhaltenstest führt den echten Proxy und Handler aus: falsches Ziel, Origin oder Body verursachen insgesamt kein Supabase-/Auth-/Runtime-I/O. Keine breite Pfadausnahme und keine Änderung des bestehenden Auth-Schutzes.
