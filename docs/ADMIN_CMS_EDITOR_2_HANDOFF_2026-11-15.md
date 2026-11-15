# Admin CMS Editor 2 — Implementierungs-Handoff

Stand: 15.11.2026. **Editor-Komponente und Vertragsgrenze vorbereitet; CMS-Runtime bleibt UNAVAILABLE.** Noch keine grüne CI oder tatsächliche Browser-Ausführung dieses neuen Slices behauptet. Root veröffentlicht den fertigen Quellstand und führt den einmaligen CI-/Komponentenlauf aus.

## Auftrag, Basis und Ownership

- Unveränderlicher Task vor Implementierung: `ed63daf47871a24866ea362118d7337fca682d63`, `docs/ADMIN_CMS_EDITOR_2_TASK_2026-11-15.md`.
- Branch: `feat/admin-cms-editor-2-20261115`, Basis #1207 `bf93a20efd486712a8fb38b123a01cb20f11cac9`.
- Writer: `/root/cms_editor_2`, eigener Worktree `/workspace/scratch/8d4f63afa634/jetnity-cms-editor-2`.
- Durch den CMS-Agenten keine bestehende Produktdatei, gemeinsame Katalogdatei, CI-Konfiguration, Paketdatei, Datenbankdatei, Rolle, Policy, Auth-Guard oder Scanner-Datei geändert. Die nachfolgend genannte gemeinsame Katalog-/Inventar-Integration stammt separat von Root. Keine Arbeit an #1196–#1198. Root führt vor Remote-Publikation den aktuellen geschützten Pfadabgleich durch.
- Kein Remote-Write, Push, Ready, Merge, Hosted-DDL, Login, Production-Zugriff oder finanzieller Vorgang durch diesen Agenten.

## Exakte Source-Abhängigkeit

Die genehmigten beiden Dateien wurden aus #1206 `233c7fba0867eace4fcd32fcd06a91d1128d627d` byteidentisch übernommen. Der abschließende lokale Hash-Abgleich stimmt mit dem Root-Transferbeleg überein:

| Datei | SHA-256 |
| --- | --- |
| `lib/admin/content/cms/contract.ts` | `78e7239e5ff0b375e499a3e883043068d157f90c8764af1e57203398a32f8031` |
| `lib/admin/content/cms/contract.test.ts` | `f5c46a5e4a5c6ed01c907a33815e9fe73a1492371c4c4ee088b7b1875f55ecc6` |

Keine SQL-/Workflow-Dateien wurden übertragen. Die vorhandene kanonische Command-Validierung wurde nicht umgeschrieben oder dupliziert.

## Gebaut

### Strenge Verträge und Editor-Steuerung

`lib/admin/content/cms-editor-2/responses.ts` liest ausschließlich die im Kandidaten festgelegten Read-/Receipt-/Confirm-Formate. Es validiert feste Referenzidentität, dezimale Bigint-Texte ohne Number-Konvertierung, exakte Schlüssel, Dateneigenschaften ohne Getter-Ausführung, gültige UTC-Zeitstempel, Revisionen, Zeiger und den exklusiven Cursor pro Content-Eintrag. Widersprüche zwischen Vorschau und Historie, falsche Entry-IDs, unzulässige Publikationszustände und Revisionen oberhalb des aktuellen Entwurfs werden abgewiesen. Redaktionelle Text-/Themenwerte laufen durch den unveränderten Command-Parser. Die Antwortdaten werden als getrennte Snapshots zurückgegeben.

`state.ts` hält genau einen expliziten Schreib-Intent. Eine Transport-Antwort gilt noch nicht als Speicherung: Erst ein separates Confirm und passender aktueller Readback setzen einen Erfolg. Ein bestätigter, inzwischen überholter Vorgang wird als solcher bezeichnet. Bei Timeout, `unknown`, ungültiger Antwort oder verlorener Bestätigung bleibt derselbe eingefrorene Befehl mit derselben Request-ID erhalten. Der Benutzer kann ausdrücklich prüfen oder nach Abschluss des ursprünglichen Transports genau denselben Auftrag wiederholen. Es gibt keinen automatischen Schreib-Retry und keine Ersatz-ID. Späte Antworten dürfen keinen neuen Eintrag oder neuen UI-Stand bestätigen.

CAS-Konflikte erhalten die Eingabe und verlangen vor Neuladen ein ausdrückliches Verwerfen. Entzogene Berechtigung/Anmeldung sperrt die Editoransicht wieder. Historienseiten einer anderen Zustandsversion werden nicht angehängt. Eintragswechsel ist bei ungespeichertem oder unbestätigtem Stand gesperrt; der eigene Rückweg und Browser-Unload warnen vor Verlust. Die Komponente führt keinen Browser-Speicher als Ersatzdatenbank ein.

### Oberfläche und Route

`components/admin/content/cms-editor-2/CmsEditor.tsx` ist die tatsächliche React-Komponente für Auswahl, Text-/Themenbearbeitung, ungespeicherte Vorschau, Speichern, Publizieren, Archivierung, Historie und Wiederherstellung als neuen Entwurf. Alle entscheidenden Bedien-, Lade-, Fehler-, Bestätigungs- und Grenztexte sind in `lib/localization/cms-editor-texte.ts` deutsch und englisch vorhanden. Die gespeicherte Kontosprache kommt aus dem bestehenden #1205/#1207-Reader; der Content bleibt ausdrücklich deutsch.

Die neue Server-Route `/admin/content/editor?entry=<kanonische-ID>` verlangt den bestehenden Content-Admin-Guard, bevor Kontosprache oder Editor geladen werden. Query-Eingaben wählen nur eine feste Referenz, keine Rechte oder Schreibziele. `server.ts` bleibt ausdrücklich `unavailable`; `port.ts` enthält ausschließlich den künftig benötigten Transportvertrag und einen Adapter, der keine Daten oder Erfolge erfindet. Die Produktseite erhält keinen Test-Port, keine Schreib-API und keine dynamischen RPC-Aufrufe. Daher erscheinen derzeit keine benutzbaren Speichern-/Publizieren-Aktionen in Dev.

**Root-Integration abgeschlossen:** Root hat den einzelnen Link vom Content-Inventar auf `/admin/content/editor`, die CMS-Gruppe im gemeinsamen Sprachkatalog, den eigenen Katalogtest und die begrenzte Marketing-Key-Prüfung im selben Worktree ergänzt. Diese bestehenden Dateien wurden zur Vermeidung von Konflikten ausschließlich von Root geändert.

## Verifikation

Lokales Node: **22.23.5**. Keine lokalen Browser-, Socket- oder PostgreSQL-Starts.

- Die neuen fokussierten Pure-Suiten liefen nach dem gebündelten Review-Fix erfolgreich: **19/19**, ohne Skip. Sie decken Response-Grenzen, vier echte Lifecycle-Aktionen, Commit-Bestätigung, CAS, Bigint-Genauigkeit, ungültige Identitäten/Proxies, historischen Read, Cursor, späte Auswahlantworten, neue Historienversion, Rate-Limit, entzogene Rechte und ungewissen Schreibausgang mit identischer Wiederholung ab. Die drei neuen Review-Gruppen prüfen zusätzlich zehn Kombinationen aus ursprünglichem Timeout/Unknown und abgelehntem Retry, sechs Auth-Verlust-Grenzen sowie die interne Link-Klassifizierung.
- TypeScript für den Worktree: `tsc --noEmit --incremental false --pretty false` erfolgreich.
- ESLint aller neuen Produkt-/Testdateien erfolgreich ohne Warnungen. Ein anfangs unbenutzter Test-Typeimport wurde in der gemeinsamen Abschlusskorrektur entfernt.
- Der Browser-Fixture-Bundle wurde mit esbuild erfolgreich kompiliert; keine unersetzten `process.env`-Konstanten. Dies war nur Kompilation, keine Browser-Abnahme.
- `git diff --check` erfolgreich; kanonischer Source-Transfer abschließend byteidentisch bestätigt.
- React-Skill angewendet: kleine serverseitige Ladegrenze hinter bestehendem Guard, parallele unabhängige Seiteneingaben, tatsächliche Client-Komponente, stabile Controller-Initialisierung, keine neue Bibliothek, beschriftete Felder, Fokus-/Statusführung, Fehlerzuordnung, Touch-Ziele, kein Overflow-Verstecken.

Reproduktion der Pure-Suiten mit Node 22:

```bash
node --import tsx --test lib/admin/content/cms-editor-2/responses.test.ts lib/admin/content/cms-editor-2/state.test.ts lib/admin/content/cms-editor-2/navigation.test.ts lib/localization/cms-editor-texte.test.ts
```

`lib/admin/content/cms-editor-2/browser.test.ts` wird vom bestehenden Core-Glob erfasst. Dieser neue, noch auszuführende Komponentenlauf mountet **die Produktkomponente und Produktions-CSS**. Er bedient Speichern → Confirm → Publizieren → Archivieren → Wiederherstellen in Deutsch/Englisch bei 320/390/1280px, prüft Tastatur, Fehlerzuordnung und 200%-Text, einen CAS-Konflikt, einen ungewissen Schreibversuch mit identischer Wiederholung sowie die unverfügbare Produktruntime nach Reload. Nur der explizite CMS-Transport wird kontrolliert. Netzwerk-, Navigation-, Cookie- und Storage-Versuche werden weiterhin hart gesammelt und als Fehler gewertet. Der `__name`-Shim steht zusammen mit der Isolation in **einem geordneten Init-Script**, auch beim Reload.

Root kann den neuen tatsächlichen Komponentenlauf zusammen mit allen erforderlichen Gates in genau einem CI-Lauf ausführen. Die unveränderte native #1206-Evidenz wurde nicht erneut gestartet.

## Ein gebündelter Fix nach der unabhängigen Root-Review

1. **Abgelehnte Wiederholung:** Ein Pending-Intent trägt nun einen bleibenden `uncertainOutcome`-Status. Ein Rate-Limit, Rechteentzug oder anderer Ablehnungsgrund bei einem späteren Retry kann den möglicherweise bereits erfolgten ursprünglichen Commit nicht widerlegen. Der eingefrorene Originalbefehl und seine Request-ID bleiben deshalb erhalten; neue Intents, Eintragswechsel und Discard bleiben gesperrt. Nur eine passende Confirm-/Readback-Kette löst den offenen Intent auf.
2. **Interne Clientnavigation:** `navigation.ts` installiert eine Capture-Grenze vor React-/Next-Link-Handlern für alle internen Links des Dokuments. Sie liest den Controller synchron und schützt deshalb auch Sidebar-Links und den programmatisch per Enter angeklickten Link der tatsächlichen Admin-Navigationssuche. Neuer Tab, Download und Hashsprung bleiben als nicht verlassende Aktionen getrennt. Browser-Unload bleibt abgesichert. Es wurden keine gemeinsamen Navigationsdateien geändert und keine Browserdaten gespeichert.
3. **Auth-Verlust an jedem Read-Punkt:** Fehlende aktuelle Rechte oder Anmeldung schließen Snapshot, Revisionenauswahl und Schreiboberfläche auch bei Historienabruf, Confirm und Readback. Ein ungewisser Intent bleibt dabei erhalten. Ein späterer Timeout öffnet einen geschlossenen Guard nicht wieder; erst eine gültige autorisierte Antwort kann die Prüfung fortsetzen.

Der CI-Fixture mountet zusätzlich die **unveränderten tatsächlichen Komponenten AdminSidebar und AdminNavigationSearch sowie Next Link**, mit ausdrücklich kontrollierter Router-Transportgrenze. Für ungespeicherte Eingabe und einen offenen Intent werden Sidebar-Klick und Tastaturauswahl in der Suche blockiert; nach ausdrücklichem Verwerfen bzw. bestätigtem Abschluss darf derselbe Next-Link-Handler den Editor tatsächlich unmounten. Weitere tatsächliche Komponentenfälle schließen die Oberfläche nach Auth-Verlust an allen drei Read-Punkten und bestätigen, dass ein Rate-Limit nach einem ungewissen Retry keine neue Request-ID freigibt. Das ist weiterhin eine Komponentenprüfung, keine Anmeldung und kein vollständiger Preview-Router-E2E-Nachweis.

Alle festgestellten Korrekturen wurden gemeinsam umgesetzt. Ein fokussierter Pure-/TypeScript-/Lint-Batch ist grün. Der erweiterte Fixture-Bundle wurde vor einem Browserstart auf alle Build-Konstanten geprüft; die zusätzlich importierten Next-Client-Hooks benötigten sieben explizite Client-Defaults aus dem installierten Next-Paket. Diese wurden zusammen ergänzt, während Netzwerk-/Storage-/Runtime-Assertions und der geordnete Init-Shim erhalten blieben. Kein lokaler Browser, Socket oder PostgreSQL-Prozess wurde gestartet.

## Verbleibende Grenze

Echtes Lesen/Schreiben im Dev-CMS ist weiterhin gesperrt, bis die zuständige Lane BG1, generierte Typen, geschlossenes RPC-Register und den Dev-Apply koordiniert hat. Danach benötigt die Runtime den vorhandenen API-Guard, aktuelles AAL2, den bestehenden Write-Gate und den angemeldeten User-Client. Kein Service-Role-, Auth-Metadaten- oder dynamischer RPC-Ersatz.

Der öffentliche CMS-Leser ist nicht angeschlossen. Selbst im erfolgreichen Komponentenfall sagt die Publish-Bestätigung ausdrücklich, dass nur die CMS-Veröffentlichung bestätigt und die öffentliche Anzeige noch nicht angebunden ist. Ein Browser-Fixture beweist weder Benutzeranmeldung noch Hosted-Installation oder öffentliche Publikation. Ein kompletter Seitenwechsel/Reload speichert keine lokale Kopie eines offenen Auftrags; ein zukünftiger echter Runtime-Anschluss muss bei Rückkehr über den serverseitigen Bestand und das Operationsjournal abgleichen, ohne einen alten Vorgang als gescheitert zu erfinden.

Keine echte CMS-Verfügbarkeit, Einreise-Freigabe, Produktionsabnahme oder Merge-Freigabe wird aus diesem Slice abgeleitet.

## Root final integration and publication gate

Root checked the three targeted corrections, without another whole-package review. The final root-owned catalog integration tests, scoped lint and all five unchanged hygiene gates pass under Node 22.23.5. The author's full TypeScript and focused correction batch include the final shared catalog. The copied command contract/test remain byte-identical to #1206. The current 517-path excluded inventory has no overlap, including the latest #1197 file list. No dependency symlink is published.

The branch's Preview uses only the existing public Development URL and public anon key. Source CI and the actual new component browser run remain pending publication. Sasa's reported signed-in in-app session remains inaccessible to the available connected-browser tool; the separate test browser still shows Vercel sign-in. No credentials, cookies or tokens were transferred, no assistant login/2FA was performed and no hosted acceptance is claimed.
