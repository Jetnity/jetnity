# Widgets Host S2 — Network and Initial-Load Audit Amendment V1

**IMMUTABLE AMENDMENT V1, 31.10.2026, Europe/Zurich.** TL-adoptierte finite Fortsetzung des bestehenden S2 TASK V1 §9. Dieses Dokument wird vor dem Dispatch versioniert. Phase A ist Source-Vorbereitung nach Root-Dispatch, Phase B benötigt erst die gesonderte konkrete TL-Lauffreigabe; beides ist keine Production-Aktivierung. Maßgebend bleiben der bestehende Owner-Auftrag und [#1087/6547934161](https://github.com/Jetnity/jetnity/issues/1087#issuecomment-6547934161). Kein Katalog-, Support- oder neues PO-Gate.

## Baseline, Eigentümer und gültige Grenzen

Repository **Jetnity/jetnity**, bestehender Branch **feat/widgets-host-s2**, bestehender Draft **#1097**. Akzeptierter dormant Host-S2-Kern: **bff2d130228d50a857d4e5611a9b3477084ac8df**, Tree **61a2693e110e33b14af865c974bffb83e1e4909b**, main/merge-base **36efd23835373f4a9cac28175bbefacc9cc45c58**, 7 voraus/0 zurück. [Root Source-PASS6548226152](https://github.com/Jetnity/jetnity/pull/1097#issuecomment-6548226152). Native CI/Preview sind eigene Gates, noch kein Gesamt-PASS. Bestehender S2-Task-Blob **e4ae6b5d6291792d1fe798029849d66119fcf3f5** bleibt unverändert. Jede neue HEAD-SHA invalidiert frühere Exact-Head-Gates.

Nur der ursprüngliche Autor setzt diese bestehende Paketabhängigkeit um. Kein neuer Branch/PR/Writer, kein automatischer Produktslice. Das autorisierte Ziel sind die angefragten funktionsfähigen Widgets; dieser vorbereitende Audit allein erfüllt das Ziel nicht. Root steuert und reviewed, Cursor implementiert, nur Root darf Ready/merge.

Vor Phase B trägt Root den dann unabhängig geprüften **AUDIT_HEAD / TREE**, Auditpolicy-Digest, Review und einmalige Run-Freigabe in einen neuen headgebundenen Kommentar ein. Es besteht jetzt keine Run-Freigabe. Aktuelle Start/Handoff/Operating-Standard/AGENTS/Mode und diesen neuen Task-Blob vor jeder Fortsetzung lesen. SINGLE_AGENT Implementierung; paralleles unabhängiges Review bleibt read-only.

## 1. Eine Frage, ein weiterführender Autor

**Frage:** Erzeugt ein unveränderter DiscoverCars-General-Export bei genau einem gewöhnlichen Initial Load `gtm.js`, `metaData`, `consent_changed` oder zusätzliche Analytics-/Werbe-Requestversuche über die bereits belegten Widget-Ressourcen und den GTM-Health-Aufruf hinaus?

Nur die verifizierte Originalsession **bc-fd77a5a3-17dd-4479-9594-f6238f61583f**, **Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1**, ursprüngliches Modell **grok-4.7-high-fast**. Aktuelle Identität erneut aus tatsächlichem run-info belegen. Der R3-Kern wurde unabhängig source-geprüft; dieses Dokument erteilt kein zusätzliches Live-Recht aus dieser vorherigen Prüfung. Keine neue Writer-Session.

## 2. Zwei getrennte Freigaben

**Phase A — nur Source:** Nach Root-Freigabe einen lokalen, test-only Audit-Harness und dessen feste Policy unter `scripts/widgets-host-s2/` sowie einen knappen eigenen Report unter `docs/evidence/widgets-host-s2/` liefern. Bestehende Abhängigkeiten verwenden. Die nachfolgend exakt beschriebene kleine Netzwerkpolicy-Naht im Host darf vorbereitet werden. Beide Produktionsregistry-Einträge bleiben selected:false; keine globale Konfiguration oder Besucherroute ändern. Keine Provider-/CMP-Verbindung. Root prüft den exakten Source-Diff, die Netzwerk-/Redaktionslogik und die echte Produktionsnaht unabhängig.

Der Harness benutzt den akzeptierten **Produktionsserializer, Shell-/Header-Erzeuger, Bootstrap und Grant-Controller**. Nur die bestehende, nicht produktiv erreichbare Prüfnaht erhält eine lokale, digest-bound Audit-Auswahl. Kein nachgebautes HTML als Ersatzbeweis, kein manipuliertes Fenster-Origin, kein `bypassCSP`, kein Überschreiben ausgelieferter CSP-Header. Die Produktionsregistry bleibt für beide Provider aus. Die bisherige Naht hat frame-src none. Die folgende eng erlaubte Source-Ergänzung soll den geprüften Auditplan durch denselben tatsächlichen Header-Erzeuger tragen; kein Header-Rewrite im Harness.

### Phase A: genaue Source-Ergänzung und Ownership

Erlaubte Produktpfade nur **apps/widgets-host/lib/production-wire.mjs**, **apps/widgets-host/lib/decide.mjs**, zugehörige vorhandene Typdeklaration **decide.d.mts**, **apps/widgets-host/tests/s2.test.mjs** sowie bei Bedarf **ein kleines host-eigenes statisches Netzwerkpolicy-Modul**. Keine Änderung an Challenge/Grant-Protokoll, gehashten Artefakten, Registry-Auswahl, CMP/Parent-Quellen, Paketen, Workflows, DB oder Environment. Eigener lokaler Audit-Harness/Policy/Tests unter **scripts/widgets-host-s2/** und eigene versionierte Evidenz/Report/Handoff sind erlaubt. Alte unveränderliche Taskdateien bleiben unangetastet.

Die Source-Erweiterung ist endlich: Ein bekannter source-owned Auditpolicy-Identifier muss Provider, Artefaktdigest, Origins und Protokoll binden und im tatsächlichen Serializer/Clientplan erhalten bleiben. Der tatsächliche Shell-Header-Erzeuger darf für genau den gebundenen DiscoverCars-Auditplan zusätzlich **frame-src https://widget.discovercars.com/de/locations/** erzeugen. Das einzige äußere Providerskript bleibt der eingefrorene DiscoverCars-Loader; direkte connect/img/font/form/popups und andere Frame-Ziele bleiben geschlossen. Nonces, no-store/noindex/no-referrer, verbotener Top-Level-Start und exakte Parent-Window-/Origin-Prüfungen bleiben unverändert.

Kein frei vom Browser gelieferter Allowlist-String, keine URL-/Query-/Storage-/Env-Policywahl, keine Wildcards, kein generic network-policy framework. Unbekannte/mismatched/missing Policy bleibt geschlossen. Der Auditplan wird nur über die bestehende **interne buildShell/serializer Prüfnaht** geliefert; decide(request) verwendet ausschließlich die weiterhin unselektierte Produktionsregistry. Ein direkter öffentlicher Aufruf kann deshalb auch nach dieser Vorbereitung keine Audit-Auswahl erhalten. Der genaue Compiler-/CSP-Vertrag und seine Default-Deny-Fälle werden unabhängig prüfbar im Report benannt.

Gezielte Offline-Tests: bekannter Auditplan trägt seine Bindung bis zu Header/Bootstrap; unbekannter/falscher Provider/Hash/Policy kann kein Frame-Ziel öffnen; tatsächliche Produktionsregistry weiterhin null, keine Vendor-URL im unselektierten Shell-HTML; unveränderte einmalige Grant- und Parent-Teardown-Eigenschaften. Vor dem echten Lauf außerdem Route/Redirect/Method/Query/Count/Deadline/Redaction anhand lokaler Fixtures prüfen. Kein echter GET während Phase A. Bisherige fokussierte Host-Tests und Nested-Build/Typecheck sowie geforderte native App/Auth-Gates wahrheitsgemäß auf dem neuen Head berichten.

**Phase B — genau ein Lauf:** Erst ein gesonderter Root-Kommentar auf dem geprüften Audit-HEAD erlaubt dem genannten Originalautor den unten beschriebenen Lauf im eigenen üblichen Harness. Phase A, grünes CI oder ein Report sind keine automatische Ausführungsfreigabe. Keine automatischen Wiederholungen oder Erweiterungen. Root nutzt keine externe Playwright-Ausweichspur; seine aktuelle CUA besitzt die benötigte Kontext-/Interception-Funktion nicht.

## 3. Lokale Grenze und feste Auswahl

- Frischer nicht persistenter, abgemeldeter Browserkontext ohne importierte Cookies, Storage, Auth, persönliche Profile oder reale Reise-/Kontodaten. Service Worker blockieren; jede Netzwerkinterception vor der ersten Navigation installieren und auf alle Frames/neuen Seiten anwenden.
- Ausschließlich lokal erfüllen: Parent `https://jetnity.com` und Child `https://jetnity-widgets.vercel.app/embed/discovercars`, mit den tatsächlichen Headern und exakt diesen Origins. Beide öffentlichen Seiten werden dabei nicht angefragt. Keine Preview-Alias-Ausnahme.
- Unveränderten General-Export aus `729e9344f00316d0559ca8b800555a49909e58f3` verwenden: **835 Bytes**, SHA-256 **`5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa`**. Auswahl/Grant binden Provider, Origins, Protokoll, Auditpolicy und Artefaktdigest. Challenge/Window-/Lifecycle-Prüfungen bleiben wirksam.
- Genau ein bewusstes Startsignal im lokalen Parent verbraucht genau einen Audit-Intent. Kein fingierter PrivacyBee-Status, kein CMP-Skript und kein automatischer Grant aus wiederhergestelltem State. Dies ist eine ausdrücklich freigegebene Prüferentscheidung, kein Besucher-Consent-Nachweis.
- Für diesen Initial Load nur `allow-scripts allow-same-origin` am nachweislich getrennten Child; keine Form-/Popup-/Top-Navigation-Freigabe. Das echte Vendor-Dokument bleibt ein eigener verschachtelter Origin.

## 4. Geschlossene Netzwerkpolicy

Default: vor Übertragung sperren. Für die folgenden **exakten HTTPS-Ziele** nur `GET` und den genannten Ressourcentyp zulassen; keine Origin-/Pfadpräfix-Wildcards, keine zusätzlichen Queryparameter oder doppelten Parameter. Externe Freigaben dürfen keine automatischen Redirects oder Wiederholungen auslösen. HTTP-3xx wird nicht verfolgt und nicht als ausführbare Weiterleitung an den Browser weitergegeben; der Pfad endet mit `BLOCKED_REDIRECT`, sein Nachweis ist gegebenenfalls nicht entscheidbar. Diese Vorabwirkung wird in Phase A an einer lokalen Redirect-Fixture belegt. Keine POST-/Beacon-/WebSocket-/sonstigen Transport-Ausnahmen.

Phase A benennt die tatsächliche Sperrmethode je Transportklasse und belegt sie ausschließlich mit lokalen Fixtures. Eine HTTP-Interception allein ist kein Nachweis für WebSocket oder andere davon unabhängige Browsertransporte. Kann eine geforderte Klasse im vorhandenen Harness nicht vor Übertragung gesperrt werden, lautet die Disposition `BLOCKED_TRANSPORT`; Phase B startet nicht. Dafür werden keine zusätzliche Infrastruktur oder ungeprüfte Ausweich-Runner aufgebaut. Die CSP-Pfadfreigabe für das nested Document ersetzt nicht den zusätzlichen exakten 31-Paare-Queryvergleich im Audit-Interceptor; der Report schreibt diese Querybindung nicht der CSP allein zu.

| Rolle | Exakte Freigabe |
| --- | --- |
| Loader, Script | `https://www.discovercars.com/widget.js?v1` |
| Ein nested Document | `https://widget.discovercars.com/de/locations/` mit genau den 31 aus Export + Loader + festem Child-Origin abgeleiteten Querypaaren; Vergleich gegen `nested-static-url-derivation.json`. Keine Suchroute. |
| Drei Scripts | Auf `https://widget.discovercars.com`: `/assets/widget/js/vendor/bundle.min.js?v=1.0.4611`, `/assets/vendor/js/typeahead.bundle.min.js?v=1.0.4611`, `/assets/widget/js/app/autocomplete.js?v=1.0.4611` |
| Gateway, Script | Nur `https://widget.discovercars.com/gtmgtg/`, ohne Query. **Keine** Freigabe von `/gtmgtg/*` oder weiteren First-Party-Messpfaden. |
| Health, Script | Höchstens einmal `https://www.googletagmanager.com/gtm.js?id=GTM-TRL7LT&gtg_health=1`; exakt diese zwei Parameter. Das ist der statisch belegte Health-Aufruf, keine generelle GTM-/gtag-Freigabe. |
| Sieben Images | Auf `https://widget.discovercars.com`, ohne Query: `/assets/common/img/svg/icons/widget-checkmark.svg`, `/assets/common/img/logos/discovercars.svg`, `/assets/common/img/svg/icons/widget-search.svg`, `/assets/mobile/img/svg/checkbox.svg`, `/assets/common/img/svg/icons/widget-pickup.svg`, `/assets/common/img/svg/icons/widget-dropoff.svg`, `/assets/common/img/svg/icons/widget-down-arrow.svg` |
| Zwei Fonts | `https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2` und `https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmWUlfBBc4.woff2`, ohne Query |

Herleitung: aktuelle statische HTML-/Loader-/GTM-Captures im [TL-Policy-Paket6547934161](https://github.com/Jetnity/jetnity/issues/1087#issuecomment-6547934161) und [bestehender Initial-Load-Beleg](https://github.com/Jetnity/jetnity/pull/1084#issuecomment-6507263046). Die sieben Images sind im HTML/CSS konkret referenziert; die beiden Fonts sind dessen lateinische 400-/700-Schnitte. Der ältere Beleg nennt zwei Roboto-Dateien, belegt deren konkrete Dateinamen aber nicht. Andere im Stylesheet enthaltene Sprites/Sprachfonts sind kein Anlass für eine vorsorgliche Freigabe.

Alle zusätzlichen Analytics-/Werbeziele — auch auf DiscoverCars oder hinter dem Gateway — vor Übertragung abbrechen und als **Versuch** protokollieren. Insbesondere keine Google-Analytics-/Ads-, Meta-, TikTok-, UET-, Reddit-, Brevo-, Baidu- oder weiteren Pixel-Bootstraps nachladen. Kein Freischalten, um einen nachgelagerten Request sichtbar zu machen. Unerwartete Ressourcen/Versionsabweichungen bleiben gesperrt; Auswirkung und Source-Drift berichten, nicht still korrigieren. Kein Zugriff auf Autocomplete, Suche, Fehler-POST oder Buchung.

## 5. Harte Laufgrenzen und sanitisiertes Beweispaket

Vor Start: keine externe Anfrage. Danach **höchstens 15 Sekunden Netzfreigabe mit Abschaltung beim 100. beobachteten Requestversuch**, einschließlich gesperrter Versuche. Eine monotone absolute Deadline beginnt unmittelbar vor dem einzigen Startsignal; jede externe Freigabe prüft sie erneut. Kein Neustart durch Redirects oder Ladeereignisse. Beim 100. Versuch wird geschlossen: Dieser und alle später eintreffenden Versuche bleiben gesperrt. Bereits erzeugte Nachläufer werden vollständig als blockierte Late-Attempts separat gezählt. Eine Beobachtungszahl über 100 wird als `BUDGET_REACHED` ausgewiesen und niemals zu einem vermeintlichen <=100-PASS gekürzt.

Bei Deadline, Zählergrenze, unerwarteter Navigation/Popup oder Submission alle weiteren Requests sperren, laufende Transporte soweit technisch möglich abbrechen, Frame entfernen und Kontext schließen. Bereits begonnene oder beim Schließen noch hängende Transporte ausdrücklich als solche beenden beziehungsweise markieren. Null Eingaben, Such-/Buchungsaktionen, synthetische GTM-/Consent-Ereignisse oder Vendor-API-Aufrufe. Keine Wiederholung nach einem Fehler ohne neue exakt begrenzte Root-Freigabe.

Vollständiger Ledger des begrenzten Scopes, einschließlich Vor-Start-Phase, Abbrüchen und Schlussprüfung nach Teardown:

- **Netz:** lokale Sequenznummer, relative Zeit, Phase, Kontextrolle, Methode/Ressourcentyp, fest benannter Baseline-Endpunkt oder sanitisiertes Origin/Pfadmuster, Query-**Schlüsselnamen**, allow/block-Grund, Status/Fehler. Jeder Versuch erhält einen Endzustand; hängende Versuche explizit markieren. Keine HAR-/Trace-/Video-/Screenshot-Roharchive.
- **Events:** natürliche relevante Data-Layer-Ereignisse ausschließlich lesend beobachten; bekannte Ereignisnamen aus fester Whitelist, sonst nur `other` plus Anzahl. Keine Payloads oder Function-/Push-Patches. Leselücken/Pruning/unlesbare Frames explizit ausweisen; fehlende Beobachtung nicht als vollständige Ereignisabwesenheit ausgeben. Handshake nur mit Zählern/Zuständen, ohne Challenges/IDs.
- **Storage:** vor Start und vor Teardown für Parent/Host/Vendor jeweils Zugriff möglich/gesperrt, Anzahl/Änderung von Cookie- und Storage-Einträgen sowie aggregierte Cookie-Flags. Keine Cookiezeilen, Namen mit möglichen IDs, Schlüssel-/Cookie-/Storagewerte oder Visitor-/Session-/Advertising-IDs exportieren. Keine Werte hashen und dann als vermeintlich anonym exportieren. Nur bekannte öffentliche Artefaktdigests gehören zur Provenienz.
- Keine Query-, Body-, Header-, Console- oder Datenlayer-Rohwerte. Unbekannte dynamische Hosts/Pfadsegmente redigieren. Keine gespeicherten Login-/Buchungs-/Reiseinformationen. Root erhält exakten Audit-HEAD/Tree, Policy-/Artefaktdigests, UTC-Fenster, Budgetzähler, alle Dispositionen und diese Sanitization-Regeln.

## 6. Aussagegrenze und Abschluss

Ergebnis lautet ausschließlich: natürliche Aktivierung/Requestversuche innerhalb dieses einen Initial Loads **beobachtet**, **nicht beobachtet** oder wegen Blockade/Drift/Lücke **nicht entscheidbar**. Geblockte Bootstrap-Versuche belegen keine durchgeführte nachgelagerte Datenübertragung. Ein 15-Sekunden-Lauf beweist keine dauerhafte Inaktivität.

Kein deployed TLS-/Redirect-/Vercel-Protection-PASS, kein realer CMP-/Consent-UI-PASS, kein Formular-/Such-/Attributions-PASS, kein vollständiger Speicher-/Cross-Provider-/Widerrufsnachweis. Der äußere Host-CSP begrenzt nicht die internen Requests des unabhängigen Vendor-Iframes; die Vorab-Sperre im Prüfharness ist eine Audit-Grenze und kein behauptetes Produktfeature.

Nach dem einmaligen Lauf Report liefern und stoppen. Kein Ready/Merge/Deployment, keine Produktionsauswahl, kein Katalog-/Supportvorgang und keine automatische nächste Prüfphase. Root entscheidet anhand des konkreten Befunds den verbleibenden Verarbeitungspfad.

## Phase-A-Übergabe und Stop

Die genaue Baseline-Allowlist oben ist von Root für diesen Audit ausgewählt, einschließlich maximal eines Health-Requests und der zwei aus dem tatsächlichen CSS abgeleiteten Latin-Fonts. Sie ist keine Produktionspolicy oder Rechtsbewertung. Keine eigenständige Erweiterung bei Versionsdrift. Die bisher nur lokal gespeicherte statische Herleitung wird unten als überprüfbarer Datenvertrag mitgeführt.

Vor Implementierung einmal den tatsächlichen run-info-Namen/Session/Modell, neuen Task-Blob/Head, die konkret gewählten Pfade und den kurzen PRE-CODE-Plan auf #1097 bestätigen und STOP. Root prüft und gibt die endliche Phase-A-Implementierung frei. Kein neuer Owner-Entscheid erforderlich. Nach Source-Implementierung exact HEAD/Tree/main/merge-base/ahead/behind, Diff, fokussierte Belege und native CI/Preview melden und STOP für unabhängiges Review. Phase B ist bis zu dem späteren konkreten Root-Kommentar strikt gesperrt. Do not mark Ready, do not merge, do not deploy, do not activate, do not start a follow-up.

## Kanonische nested-URL für den Audit

Der aktuelle Loader aus statischem GET hat SHA256 **9198baa5b50ab50aaeee81b90764e1a1c3e621a30b5957d0d7ae88be05a6a186** (12299 Bytes); das abgeleitete HTML **cb0cc414fbbdd32be15f0daa18b13d4b7df022417b6ab62e78564825dac27f3d** (146805 Bytes); das Gateway-Skript **14b5a4984fd3253f7e35a6a256d7b1c756ae3b1c14a836b4bb44263c902f6808** (701252 Bytes), Erhebung31.10.2026. Capture-Hashes belegen diese Erhebung, nicht dauerhafte Unveränderlichkeit. Für diese drei Antworten vor lokaler Auslieferung den Referenzhash vergleichen: Abweichungen nicht ausführen, sondern `SOURCE_DRIFT` melden. Nur Gleichheit/Abweichung und bekannten Referenzdigest exportieren, keine neuen möglicherweise dynamischen Antwortdaten oder Roharchive. Keine Aufweitung bei Drift. Public aff_code/utm-Parameter sind keine private Nutzerinformation; fehlendes aff_value bleibt leer und wird nicht erfunden. Dieser Audit belegt keine Attribution.

Genau31 Querypaare, keine zusätzlichen/doppelten Paare; die vom Browser ggf. anders kodierte, aber gleichwertige Form darf nur nach dekodiertem Paarvergleich behandelt werden. Pfad/Origin/Methode bleiben exakt:


```text
https://widget.discovercars.com/de/locations/?currency=chf&pickup_from=&pickup_to=&utm_source=jetnity&utm_medium=widget&aff_code=a_aid&aff_value=&aff_channel=&aff_data1=&aff_data2=&tspc=&autocomplete=on&style_form_bg_color=%23f5f5ef&style_form_font_color=%23173e33&style_submit_bg_color=%23163d32&style_submit_font_color=%23ffffff&submit_text=Mietwagen+suchen&title_text=Mietwagen+suchen+und+vergleichen&style_title_color=%23173e33&layout_benefits=on&layout_description=on&layout_description_text=W%C3%A4hle+deinen+Abholort+und+deine+Mietdaten.&layout_logo_style=on+white&layout_powered_by=on&layout_style_form_bg_color=%23f5f5ef&layout_title=on&layout_top_logo=&layout_supplier_logos=&responsive=on&localization_currency_box=&widget_origin=https%3A%2F%2Fjetnity-widgets.vercel.app
```
