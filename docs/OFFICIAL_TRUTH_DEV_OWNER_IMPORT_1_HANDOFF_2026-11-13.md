# Dev Owner Import 1 — lokaler Handoff

Stand: 13.11.2026. Author: `/root/hosted_batch_fix_g4`, bestehende Generation-4-Sitzung. Umsetzung des Root-Auftrags einschließlich Präzisierungen V1.1–V1.3; kein unabhängiges TL-Review und keine Live-Abnahme.

Basis: Task-Commit `a16590eb363da69cc5c3190bc7fb9a58dcd17a60` auf `a88d4496b451bc5ac2a7f78206488e489fe315bb`. `origin/main` wurde vor Handoff frisch per `ls-remote` als `63544e820e912bd275556588c956a09b99b1cf90` bestätigt. Die echte Methodenfreigabe aus dem Task bleibt bestehen; dieser Code erteilt keine weitere Freigabe.

## Änderung und Schutz

- Neue Seite `/admin/official-truth/import` mit eigener `DevOwnerImportPanel.tsx` und Rücklink zur bestehenden Methodenseite. Ausschließlich ein ausdrücklicher Klick sendet den festen POST `/api/internal/readiness/ch-de-owner-import`; kein Render-/Mount-Start oder automatischer Retry.
- Neuer `ch-de-owner-import-contract.ts`: fester Body, begrenzte Anfrage/Antwort, striktes minimales DTO, Same-Origin-Cookies, keine Weiterleitung. Bestätigte Veröffentlichung, Abschluss ohne bestätigte Veröffentlichung, busy und offener Ausgang bleiben getrennt. Ein HTTP 200 allein ist kein Erfolg. Die Einmal-Sperre gilt je Panel-Instanz; Reload oder neuer Tab erzeugen keine globale Einmalgarantie.
- Neuer Handler: feste Preview-/Dev-Auswahl, exakter Server-Zielabgleich und vollständige Origin-/Method-/Pfad-/Body-Prüfung vor Auth-I/O. Danach unveränderter zentraler `requireAdminApi`, Capability, Owner, `grant=role` und aktuelles AAL2. Der unveränderte Proxy führt für diesen festen internen Pfad keinen Auth-Lookup aus. Beim GET bleibt der geerbte Admin-Layout-Guard bestehen; eine Ziel-vor-Auth-Garantie für den gesamten GET wird nicht behauptet.
- `ch-de-server.ts` erhält nur den vorgezogenen lesenden Methodencheck über die vorhandene MA1-Factory und `resolveCurrent`. Grund für diesen Ort ist die bestehende endliche Importgrenze der privaten PG-Executors. Kein Receipt verlässt den Check. Der bestehende Runtime-Factory-Körper, Tick und alle späteren Methoden-/Epoch-/Widerrufs-/Quellen-/Claim-Grenzen bleiben unverändert.
- Vollständiges Await des bestehenden Tick-Arbeitsbudgets von 30 Sekunden samt tatsächlichem Drain; Hosting `maxDuration=60`. Kein vorzeitig antwortendes Rennen oder Zehn-Sekunden-Wrapper. `vercel.json` ergänzt nur diesen festen Funktionspfad mit `regions: ["fra1"]`; die zwei bisherigen Einträge und der Build-Befehl bleiben unverändert. Siehe installierte Next-16.4.1-Anleitung und [Vercel-Regionskonfiguration](https://vercel.com/docs/functions/configuring-functions/region).
- `scripts/api-schutz.mjs` prüft zusätzlich genau diese geschützte POST-Route. Der bestehende aktuelle Deployment-Witness in `audit.mjs` und sein Negativtest berücksichtigen den dritten Regionseintrag. Dies ist die mit #1198 bereits abgestimmte Audit-Fläche; keine Umbenennung/Verschiebung.

## Prüfstand

Lokal Node 24.22.1 mit bestehender Root-Installation, keine neuen Dependencies. Abschließender fokussierter Lauf: **126 Tests PASS, 0 FAIL, 0 SKIP**. Enthalten sind echte Proxy+Handler-Ausführung mit instrumentiertem Auth-I/O, aktuelle zentrale Owner-/AAL2-Guards, MA1-Dekodierung, Tick, HUI, private Importgrenze, echte inerte Panel-SSR sowie Client-Doppelklick-/Abbruch-/Ergebnisbehandlung. Das API-Inventar wird auch mit fehlender Route, entferntem Gate, fehlender Ablehnung und falschem HTTP-Handler negativ ausgeführt. Kein Test greift auf ein echtes Konto, eine DB oder eine Quelle zu.

`npm run typecheck`, Scoped ESLint und API-/Dead-Code-/Export-/Dependency-/Schema-Guards: **PASS**. API-Inventar: 13 bestehende Admin-Routen plus der feste Dev-Import. Vorherige Testläufe wurden vollständig ausgewertet: zwei reine TypeScript-Testfehler wurden gemeinsam korrigiert; der anschließende neue Proxy-Positivtest hatte eine falsche Client-Zählererwartung samt Folgefehlern. Der bestehende Guard erstellt getrennte Clients für Identität und AAL; die korrigierte Erwartung und isolierter Zustand je Teiltest bestehen den vollständigen Schlusslauf.

Installations-Audit: **lokal blockiert, kein PASS**. `collect()` stoppt bei der gemeinsam genutzten Installation mit `one loaded native Sharp binary required`; lokal gilt zudem Node 24 statt des unveränderten Node-22-Vertrags. Keine Lockerung, Skip oder gefälschte Installations-Evidence. Der reguläre frische Node-22-Lauf bleibt Gate.

Alle 79 aktuellen HDP-Pins stimmen mit den Dateien überein; ausschließlich vier vorhandene aktuelle Einträge wurden angepasst: `ch-de-server.ts`, `audit.mjs`, `audit.test.mjs`, `vercel.json`. Alle anderen Manifestfelder und historischen Receipts bleiben identisch. HUI bleibt vollständig bytegleich: Sein `api-schutz.mjs`-Pin ist ein historischer `consumedParentSourcePins`-Beleg auf `e932aa20…`, keine neue Kandidaten-Evidence. Die aktuelle Guard-Änderung wird durch Kandidaten-Diff, Verhaltenstest und neuen CI-Lauf geprüft.

## Offene Gates und Grenzen

Unabhängiges Root-Review, vollständiger neuer Neun-Job-Lauf unter Node 22, Build und exakte Preview sowie echter Quellenimport/DB-/Besucher-Nachweis: **NOT_RUN durch diesen Author**. Erst Root startet anschließend den realen Dev-Lauf. Er benötigt weiterhin akzeptierte Version, passenden Head/Projektion sowie `source`, `checkedAt`, `ruleVersion` und Besucherantwort `accepted` mit `synthetic:false`.

Request-Body-Prüfung, bestehende Auth-Schritte und Methodenvorcheck verbrauchen zusammen mit dem Tick die Hosting-Laufzeit. Es gibt keinen neuen gemeinsamen absoluten Deadline-Wrapper um diese Schritte. Ein Hosting-Abbruch oder verlorener Response kann deshalb einen offenen Ausgang hinterlassen; der Browser-Wartewert von 65 Sekunden beweist keine Rücknahme. Vor erneutem ausdrücklichem Start ist der gespeicherte Stand zu prüfen. Dauerhafte Parallelitäts-/Idempotenzgrenzen bleiben die vorhandenen Runtime-Claims.

Bytegleich geprüft: Proxy, Methodenseite/Panel, HUI-Manifest, Methodenauswahl, bestehender Tick, Cron-Route, öffentliche CH→DE-Route und historische Audit-Kontrolle. Keine SQL-/Schema-/Rollen-/Auth-/Secret-/ENV-/Kostenänderung; kein Hosted-Aufruf und keine Wiederholung der Owner-Freigabe. **STOPP nach lokalem Commit. Kein Push, Ready, Merge, Production oder Folgeslice.**
