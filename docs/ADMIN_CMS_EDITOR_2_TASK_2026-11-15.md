# Admin CMS Editor 2 — freigegebener Task, 15.11.2026

Status: **TL APPROVED FOR THE BOUNDED DEVELOPMENT IMPLEMENTATION AFTER THIS TASK COMMIT.** Root hat den Task vor Code gelesen und legt die unten genannte Basis sowie Ownership fest. Die veröffentlichte Version bleibt unveränderlich; keine Owner-Rückfrage ist für den bereits beauftragten Dev-Scope nötig. Production, Merges, Kosten und Login/2FA bleiben beim Owner.

## 1. Auftrag und belastbarer Ausgangspunkt

Der Owner beauftragt die Fortsetzung des CMS-Editors parallel zur angemeldeten Admin-/Account-Abnahme. Neue Kosten, Production, Merges, Login/2FA und echte Erstattungen bleiben beim Owner. PRs #1196–#1198 einschließlich ihrer Dateien bleiben vollständig ausgeschlossen. Die jüngste Owner-Anweisung verlangt einen grünen CI-Lauf und einen echten relevanten Testlauf; bereits grüne unveränderte Kandidaten werden nicht erneut geprüft.

Live gelesen: PR #1206 einschließlich Beschreibung und letzter Kommentare. Head `233c7fba0867eace4fcd32fcd06a91d1128d627d`, Tree `99c0ba7006c795ab1dd9eb493febb482c3576407`, Branch `feat/admin-editorial-cms-native-20261115`, Base `feat/admin-content-inventory-completion-20261115` bei `ac10784a3bc9f0440cdf0e2a45d8391b1034b0dc`. Normal-CI 43714871926/4284 und native PG17-CI 43714871972 sind grün; native Kandidatenbelege umfassen 124 erfolgreiche Fälle. Das ist Evidenz für den unveränderten Kandidaten, keine installierte CMS-Funktion.

#1206 ist weiterhin Draft und **UNAPPLIED**. Die letzte Diskussion enthält nur den Vercel-Bot, keine neue fachliche Freigabe. Der aktuelle CMS-Stand umfasst native Tabellen/Funktionen und den strengen Command-Vertrag; Oberfläche, Runtime-Anbindung und öffentlicher Leser sind offen.

Repo-Start, AGENTS, Operating Mode, Technical-Lead-/Multi-Agent-Vorgaben und Produktqualitätsstandard wurden gelesen. Der maschinenlesbare Modus ist NORMAL. Aktuelle ausdrückliche Owner-Grenzen haben Vorrang vor historischen autonomen Merge-/Reviewregeln.

## 2. Ziel dieses Slices und ehrliche Abschlussgrenze

Implementiert werden eine echte bedienbare Editor-Komponente, ihre Zustandssteuerung, geschlossene Response-Parser, deutsche/englische Bedienoberfläche und die notwendige Admin-Seite. Die Komponente verarbeitet den bestehenden Vertrag vollständig: Entwurf speichern, bestätigten Entwurf veröffentlichen, archivieren und eine historische Revision als neuen Entwurf wiederherstellen.

Die **zurzeit gesperrte Runtime-Anbindung wird nicht durch einen Ersatzspeicher vorgetäuscht**. Solange die vier CMS-RPCs nicht gemeinsam mit der geschützten Schema-/Rechte-Lane integriert und in Dev angewendet sind, zeigt die Admin-Seite „CMS derzeit nicht verfügbar“. Schreibaktionen sind in diesem Zustand nicht möglich. Ein Komponenten-/Adapter-Test ist kein Nachweis für eine installierte Dev-Datenbank.

Das Paket kann als „Editor und Vertragsintegration vorbereitet, Runtime weiterhin gesperrt“ reviewbar werden. „CMS nutzbar“ ist erst zulässig, nachdem eine koordinierte Anbindung echte Dev-Daten liest/schreibt und der angemeldete Ablauf erfolgreich durchlaufen wurde. Öffentliche Veröffentlichung benötigt zusätzlich den separat angeschlossenen veröffentlichten Leser.

## 3. Verbindliche Basis, Ownership und Abhängigkeiten

Von Root festgelegte Basis: neuer eigener Branch von #1207 `bf93a20efd486712a8fb38b123a01cb20f11cac9`. Damit wird die bereits gebaute gespeicherte UI-Sprache verwendet. Explizit genehmigte Source-Abhängigkeit: ausschließlich `lib/admin/content/cms/contract.ts` und sein bestehender Test werden **byteidentisch** aus #1206 übernommen. Kein SQL, Workflow oder weiteres Kandidatenmaterial wird kopiert; keine semantische Parser-Duplikation. Die Übernahme und Ursprungsrevision müssen im Handoff stehen. Root prüft vor Publikation die aktuelle geschützte Dateiliste und bestätigt diese Zusammensetzung. Das ist keine Merge-Freigabe.

Root genehmigt genau diese byteidentische Source-Abhängigkeit. Es ist kein Git-/PR-Merge und kein SQL-Transfer. Branch `feat/admin-cms-editor-2-20261115`, eigener Worktree `/workspace/scratch/8d4f63afa634/jetnity-cms-editor-2`, Writer `/root/cms_editor_2`. Keine zweite Speicherung der Spracheinstellungen.

Einziger Writer dieses Slices: CMS-Agent in eigenem Worktree/Branch. Root-Worktree `/workspace/scratch/8d4f63afa634/jetnity-admin-continuation` bleibt unverändert. Übersetzungs- und Kampagnen-Agent besitzen ihre eigenen Dateien; gemeinsame Sprach-/Navigationsdateien bleiben bei Root.

Geplante eigene Dateien:

- `app/(admin)/admin/content/editor/page.tsx` — serverseitige Admin-Seite, erst nach geschütztem Pfadabgleich.
- `components/admin/content/cms-editor-2/CmsEditor.tsx` und gegebenenfalls höchstens kleine fachlich nötige Unterkomponenten.
- `lib/admin/content/cms-editor-2/responses.ts`, `state.ts`, `port.ts`, `server.ts` sowie zugehörige fokussierte Tests.
- `lib/localization/cms-editor-texte.ts` und der Katalogtest; keine Änderung gemeinsamer Kataloge.
- `scripts/admin-cms-editor-2/` — nur ein realer Komponenten-Testlauf, soweit der bestehende Testweg ihn erfordert.
- Eigenes Task-/Handoff-Dokument unter `docs/ADMIN_CMS_EDITOR_2_*`.
- Genau ein Link im bestehenden `components/admin/content/ContentInventory.tsx`, wenn der frische Pfadabgleich diesen Eingriff erlaubt; andernfalls Root-Integration dieses Links.

Kein Eingriff in `types/supabase.ts`, `scripts/db/verwendung.mjs`, BG1-/Einreise-Artefakte, bestehende Auth-/Write-Guards, globale Navigation, Paketdateien, CI-Workflows, Migrationen oder gemeinsame Strategie-Dokumente. Falls eine dieser Änderungen nötig wird, stoppt der Slice an dieser Grenze und meldet den konkreten Bedarf an Root.

## 4. Unveränderter Fachvertrag

Feste Identität aus `INSPIRATION_ZIELE`: vier bekannte GeoNames-Einträge, Content-Locale `de`, bestehende Namen, Länder und Bilder. Dies belegt Referenzidentität, keine Bildrechte oder amtlichen Reiseinformationen. Es gibt keine neuen Slugs, Uploads, Zielorte, zusätzlichen Content-Sprachen oder frei eingebbares HTML.

Editierbar sind genau `beschreibung` (1–800 Unicode-Skalarwerte, höchstens 3200 UTF-8-Bytes), `idea` (1–300 Skalarwerte, höchstens 1200 Bytes) und 1–4 eindeutige Themen in der kanonischen Reihenfolge `stadt-kultur`, `natur`, `strand`, `erholung`. Texte sind bereits getrimmt und enthalten weder C0/C1-Steuerzeichen noch `<`, `>` oder kaputte Surrogate. Unzulässige Werte werden erklärt und abgewiesen; keine stille inhaltliche Reparatur. Der Filterwert `alle` ist kein Content-Thema.

Der bestehende `parseCmsCommand` bleibt die einzige kanonische Command-Validierung. Versionen und Revisionen bleiben dezimale Bigint-Texte bis 9223372036854775807; keine Umwandlung in `Number`. `requestId` ist eine kanonische kleine UUIDv4. Unvertraute Objekte, Zusatzfelder und unzulässige Descriptor-/Proxyformen bleiben geschlossen abgewiesen.

| Aktion | Vorbedingung und Wirkung |
| --- | --- |
| `save_draft` | Nicht archivierter Eintrag; genau neue Revision und Zustandsversion; veröffentlichte Revision bleibt unverändert. |
| `publish` | Genau die aktuell gespeicherte Entwurfsrevision, nicht bereits veröffentlicht und nicht archiviert; Veröffentlichung und Zustandsversion ändern sich. |
| `archive` | Existierender Entwurf, nicht bereits archiviert; Veröffentlichung wird entfernt, Historie bleibt bestehen. |
| `restore_draft` | Eigene vorhandene Revision; Kopie als neue Revision, Archivierung aufgehoben, keine automatische Veröffentlichung. |

Jeder Befehl enthält `expectedVersion`. Ein CAS-Konflikt wird niemals durch stilles Nachladen und Überschreiben gelöst. SQL liefert P4091 für veraltete Version, P4092 für anders belegte Request-ID, P4093 für unzulässigen Zustand/erschöpfte Version, P4041 für unbekannten Eintrag/Revision, 22023 für fehlerhafte Eingabe und 42501 für fehlende aktuelle Berechtigung.

## 5. Read-/Receipt-Vertrag und UI-Zustände

Die neuen Response-Parser prüfen exakt die vorhandenen SQL-Ausgaben. Keine freie JSON-Durchleitung: Schema, erlaubte Schlüssel, feste Identität, passende Entry-ID, Bigint-Texte, nullfähige Zeiger, sortierte begrenzte Historie, kanonische Inhalte, UUIDs und endliche UTC-Zeitstempel mit sechs Nachkommastellen. Snapshots werden abgetrennt; ungültige Antworten ergeben `unavailable`, niemals einen leeren Bestand oder einen fiktiven Erfolg.

Read liefert `entry`, `preview`, `history`, `nextBeforeRevision`. Die Historie ist absteigend und ausschließlich auf den ausgewählten Content-Eintrag begrenzt. `p_before_revision` ist ein exklusiver Cursor, `p_limit` 1–50. Paginierte oder verspätete Antworten dürfen keine Revisionen eines früher ausgewählten Eintrags in die aktuelle Ansicht übernehmen. Ein wirklich vorhandener Eintrag mit `draftRevision:null` ist ein anderer Zustand als eine gescheiterte Datenabfrage.

Receipt liefert `schema:1`, `status:'recorded'`, Request-/Entry-ID, Aktion, vorherige/aktuelle Version, Entwurfs-/Publikationsrevision, Archivstatus, erzeugte Revision und `recordedAt`. Eine reine Command-Antwort wird noch nicht als dauerhaft gespeichert gemeldet. Das UI bestätigt erst nach separatem Confirm und einem dazu passenden Readback. Ist die Operation bestätigt, der aktuelle Eintrag aber inzwischen weiterentwickelt, wird dieser Sachverhalt verständlich gezeigt; ein früheres Receipt wird nicht als aktueller Editorstand ausgegeben.

Confirm kann `{schema:1,status:'unknown',requestId}` liefern. Das ist **keine bewiesene Ablehnung**. Bei Timeout, Verbindungsabbruch oder verlorenem Ack bleibt der exakt eingefrorene ursprüngliche Befehl erhalten. Eine explizite Wiederholung verwendet dieselbe Request-ID und denselben Inhalt; keine neue ID für denselben unsicheren Schreibversuch. Keine unkontrollierten automatischen Wiederholungen.

Notwendige sichtbare Zustände: Laden, vorhandener Eintrag ohne Entwurf, bereit, ungespeicherte Änderungen, in Ausführung, Bestätigung offen, CAS-Konflikt, fehlende Berechtigung/erneutes AAL2, Rate-Limit, Timeout, ungültige Antwort und nicht verfügbar. Ein aktiver Schreibversuch pro Eintrag/Intent; alte Antworten dürfen den neuen Zustand nicht bestätigen. Abbruch oder Eintragswechsel vernichtet keine unbestätigte Operation still.

## 6. Oberfläche und persistierte UI-Sprache

Pfad `/admin/content/editor` mit fester Entry-ID-Auswahl und eindeutigem Rückweg zum Content-Inventar. Die Seite verwendet unverändert `requireAdminPage({surface:'content',capability:'inhalte-moderieren'})`. Keine Berechtigungsvergabe über Query, Props oder Browserzustand.

Die Redaktion sieht unveränderliche Referenzdaten, aktuellen Entwurfs-/Publikations-/Archivstatus, beschriftete Textfelder mit verständlichen Grenzen, Themenauswahl, eine Textvorschau und die Revisionen. Lokale Vorschau heißt ausdrücklich „Ungespeicherte Vorschau“ und begründet keine Speicherung. Veröffentlichung ist erst nach verifiziertem gespeichertem Entwurf möglich. Archivierung benennt die Wirkung; Wiederherstellung sagt „als neuen Entwurf“, nicht „veröffentlicht“.

UI-Sprache wird über die vorhandene gespeicherte Einstellung `uiEinstellungenFuerSeite()` und `UiSprache` eingebunden; Änderungen an deren Speichervertrag sind ausgeschlossen. Deutsch und Englisch betreffen ausschließlich Bedientexte. Der Content-Vertrag bleibt deutsch. Alle entscheidenden Felder, Fehler, Status und Aktionen sind übersetzt; keine erfundene Übersetzung des redaktionellen Inhalts.

Mobile-first, vorhandene Jetnity-Design-Tokens, 44px-Bedienziele, vollständige Tastaturbedienung, zugeordnete Fehler, sichtbarer Fokus, Statusansagen und sinnvoller Fokus nach Konflikten. Bei 320/390px und 200%-Text keine abgeschnittene Hauptaktion. Kein globales Overflow-Verstecken.

## 7. Runtime-Grenze, Sicherheit und späterer Anschluss

Benötigt werden ausschließlich die vier statisch benannten Kandidatenfunktionen:

- `admin_cms_inspiration_read_v1(p_entry_id,p_revision,p_before_revision,p_limit)`.
- `admin_cms_inspiration_command_v1(p_request_id,p_entry_id,p_expected_version,p_action,p_payload)`.
- `admin_cms_inspiration_confirm_v1(p_request_id)`.
- `cms_inspiration_published_v1()` — öffentlicher Leser, nicht Teil der Editor-Anbindung dieses Slices.

Sie fehlen aktuell in den generierten Typen und im ausdrücklich geschlossenen `LOCAL_UNAPPLIED_RPCS`-Register. Ein heute neu angelegter statischer RPC-Aufruf würde den Schema-Scanner korrekt stoppen. Neue Grants verändern zudem die exakte BG1-Rollen-/Abhängigkeitsbasis. Deshalb helfen weder dynamische RPC-Namen noch Service Role, Auth-Metadaten, Umbenennung oder eine zweite Datenbank. Diese Auswege sind ausgeschlossen. Der Merge von #1197 allein beweist noch keine CMS-Kompatibilität.

Der Port bildet Read, Command und Confirm mit ihren echten Resultaten ab. Der aktuell erlaubte serverseitige Adapter liefert ausdrücklich `unavailable`; er erfindet keine Datenbankversion, keine Historie und kein Receipt. Es werden dafür keine öffentlich aufrufbaren Fake-Schreibendpunkte angelegt. Die eigentliche Komponente wird gegen einen deterministischen Test-Port geprüft; dieser ist ausschließlich Testmaterial und wird nicht über eine Produkt-Route ausgeliefert.

Erst nach koordinierter Freigabe/Integration der gemeinsamen Grenzen darf Root einen weiteren konkret versionierten Anschlussauftrag ausführen: Kandidat in Dev installieren, statische generierte Typen/Scanner in der zuständigen Lane ergänzen, bestehenden `requireAdminApi` und `adminWriteErlaubt` verwenden, ausschließlich den angemeldeten User-Client über die erlaubten Wrapper einsetzen, fehlende Rechte geschlossen behandeln. Admin-Capability und aktuelles AAL2 werden weiterhin vor Datenzugriff und erneut innerhalb des DB-Befehls geprüft. Kein direkter Tabellenzugriff, keine eigene Admin-Autoritätsdefinition.

Keine amtlichen Einreiseinformationen werden in den CMS-Vertrag aufgenommen. Die vollständige Kundenanzeige, Quellen-/Standpflicht und „derzeit nicht verfügbar“ bleiben Vorgaben der ausgeschlossenen Einreise-Lane; das CMS darf keine unbestätigten Einreisefakten publizieren.

## 8. Abnahmebedingungen und gebündelte Verifikation

1. Nur genehmigte eigene Dateien sind geändert; aktuelle geschützte PR-Dateien überschneiden sich nicht. Canonical-Contract-Transfer ist byteidentisch und belegt.
2. Strenge Parser und Controller decken die realen vier Aktionen, Historiencursor, CAS, Identity-Mismatch, verlorenes Ack, `unknown`, identische Wiederholung, entzogene Rechte sowie verspätete Eintragsantworten ab. Testfälle prüfen fachliche Wirkung statt Implementation nachzuerzählen.
3. Ein echter gemounteter Komponentenlauf bedient Entwurf, Vorschau, Speichern, Bestätigen, Veröffentlichen, Archivieren, Wiederherstellen sowie einen Konflikt und einen ungewissen Schreibversuch. Der Testlauf ist ausdrücklich Komponentenabnahme, keine Hosted-DB-Abnahme.
4. Die Dev-/Preview-Route zeigt bis zur erlaubten Runtime-Anbindung ehrlich `unavailable`; es gibt keine aktive Fake-Speichern-/Publish-Aktion und keinen stillen Browser-Ersatzspeicher.
5. Deutsche/englische Bedienoberfläche, Tastatur und schmale Breiten sind im selben relevanten Lauf geprüft. Keine zusätzliche Bibliothek oder Kosten.
6. Typecheck, Lint, bestehende relevante Hygiene-/Schema-Gates, Core-Suite und Build werden in einen gebündelten CI-Lauf aufgenommen. Bei einem fehlgeschlagenen Lauf zunächst alle Fehler sammeln, dann zusammen korrigieren. Kein wiederholter native PG17-Test des unveränderten #1206-Kandidaten und keine Wiederholung grüner Reviews ohne neue betroffene Änderung.
7. Handoff nennt konkrete Änderungen, Commit/Basis/Task-Version, Testbefund und noch gesperrte Runtime-Grenze. Keine Behauptung einer Dev-Publikation oder vollständigen CMS-Fertigstellung.

## 9. Stop-/Übergabepunkt

Bis Root diese Task-Version und die vorgeschlagene Quellenzusammensetzung veröffentlicht/freigibt, bleibt dieser Agent bei Read-only und Planung. Danach nur der oben begrenzte Slice im eigenen Worktree. Root übernimmt Integration, tatsächliche Dev-Abnahme und Freigabeliste; der Owner behält Merge und Production. Ist eine Änderung an geschützten Dateien erforderlich, wird sie konkret an Root gemeldet und nicht verdeckt umgangen.

## Root publication decisions — 15 November 2026

Root reviewed this concrete Task once before implementation and authorizes only its stated paths on the exact green #1207 base. The shared catalog and coverage copy remain Root-owned; no author edits another workstream. Before each final source publication, compare current #1196–#1198 changed paths. No data, policy, scanner, workflow or permission boundary is weakened to obtain green CI. Runtime blocks stay explicit.

For new mounted browser fixtures, use the already established actual-component setup: replace all required Next build constants and install any tsx name-preservation helper before serialized init callbacks in a single ordered script, including reload. Keep network/storage guards and assertions active. Do not repeat the previously diagnosed bootstrap mistake or re-review old green packages. Collect all actual failures before one grouped correction.

Code authors stop at the owned handoff; Root publishes final source/Draft PRs and performs one bounded independent review plus the required green CI and relevant real execution. User login is never simulated, copied or bypassed. No Production or genuine refund action.
