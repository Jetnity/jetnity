# 12Go Widget V2 — R6: Parent-Integration und gemeinsame Sichtbarkeit

**Unveränderlicher Technical-Lead-Auftrag R6 V1 · 31. Oktober 2026.** Umsetzung ausschließlich durch die unten genannte bestehende Originalsession nach Roots ausdrücklichem IMPLEMENT. Keine Produktänderung durch diesen Task-Seed.

Dieser versionierte Auftrag ersetzt die unveröffentlichten lokalen R6-Entwürfe V1/V2. **Die gemeinsame Sichtbarkeitsseam gehört in diesem konkreten Auftrag ausschließlich dem 12Go-Autor.** Der DiscoverCars-Autor bearbeitet derzeit nur seine konfigurierte Artefaktkorrektur [#1084/6548979511](https://github.com/Jetnity/jetnity/pull/1084#issuecomment-6548979511) und besitzt diese gemeinsamen Dateien nicht. Die 12Go-Arbeit wartet weder auf einen DiscoverCars-Commit noch auf dessen blockierten Runtime-Audit.

## 1. Zweck, bestehende Session und akzeptierter Ausgangspunkt

Vervollständige den echten **bedingten** 12Go-Consumer in **Reise → Organisieren → Mobilität → Verbindungen**, einschließlich Rückzug beim Verlassen der tatsächlich sichtbaren Fläche. Er muss den akzeptierten produktiven CMP-Vertrag und das feste Host-Protokoll verbrauchen können. Aktuelle produktive Release-/Policy-Denials bleiben bestehen; positive Ausführung wird ausschließlich mit nichtproduktiven Modul-Fixtures nachgewiesen.

| Feld | Exakter Ausgangspunkt |
| --- | --- |
| Repository / PR / Tracking | `Jetnity/jetnity`, Draft #1086, #1085 / #1087 |
| Branch | `feat/12go-v2-official-search-widget-optin-1` |
| Einziger Implementierer | **Jetnity 12Go Official Search Widget V2 Opt-In 1 — Cursor Generation 1** |
| Originalsession / Modell | **`bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c`**, tatsächliches `grok-4.7-high-fast` aus vorhandener Session-Evidence bestätigen |
| Live gelesener 12Go-Head | **`4b20d8f51b1b8301f76dd73432016bcd38030ead`**, bisheriger Tree `5030aeb585701e6c1dc721c46be80cb6131f88ee` |
| Akzeptierter CMP-Main | **`32445c90c2d33695cbd8f69ea3cb7498768dda67`**; #1096 gemergt, R5-Code entspricht dem akzeptierten `b079eb969cdb136c7511ae40c32b1c7aa6d3e5c8` |
| Gegen diesen Main aktuell | **15 voraus / 48 zurück**, merge-base **`b7ebc399b92303eacda9afdaa1786f245492051f`**; keine alten CI-/Preview-Pässe übernehmen |
| Produktiver CMP-Entry | `lib/privacy/privacybee-cmp/produktion.ts`, Blob **`704ba9b6cac6376bfc9ed5284983ffd2ef99295d`** auf main324 |
| Produktive CMP-Tabelle | `lib/privacy/privacybee-cmp/produktionspolitik.ts`, Blob **`817f7e80c18155494fc44ec1fc4b13cd59052ac7`**; beide Zeilen weiterhin null, Release weiterhin false |
| Versionierter Host-12Go-Auftrag | `docs/JETNITY_WIDGETS_HOST_S2_12GO_SELECTION_AMENDMENT_V1_2026-10-31.md`, Blob **`b5380cf9451b2a13573ecff572f98f46d12be080`** |
| Host-Seed / tatsächlicher Dispatch | **`a4b6b01d0b3a806545764952b3cc0b7556286385`** / [#1097/6548946708](https://github.com/Jetnity/jetnity/pull/1097#issuecomment-6548946708); korrigierte Host-Lieferung f056b01d63ac7d61650864734a9b44eb6484989e in unabhängiger Prüfung, noch nicht angenommen |
| Host-Protokoll | `docs/JETNITY_WIDGETS_HOST_S2_PROTOCOL_2026-10-31.md`, Blob **`b5763434c66438dbd3f2b1b3866f91e39febbdb1`** am Host-Seed; Rev1-Nachrichten bleiben laut Amendment unverändert |

Unverändert lesen: ursprünglicher 12Go TASK V1 Blob `80c48fb6c9ff0004853896367a066519ae20d473`, R3-Amendment sowie R5-Amendment `docs/JETNITY_12GO_WIDGET_V2_R5_TASK_AMENDMENT_V1_2026-10-31.md`, Blob `6a84f74247c39872b6806091eb9220b0337cccc4`; ursprünglicher CMP-S2-Task und Production-Capability-Amendment bleiben ebenfalls unverändert. Dieser neue Auftrag erweitert gezielt den alten 12Go-Schreibbereich und ersetzt dessen rein synthetische Consumer-/opaque-Sandbox-Beschränkung durch den unten festgelegten Vertrag. Die historischen Aufgaben werden nicht umgeschrieben.

## 2. Bereits ausgewählter 12Go-Vertrag; tatsächlicher Host-Commit noch offen

Die folgenden Literale sind **bereits Roots Entscheidungen im unveränderlichen Host-Amendment**, keine vom 12Go-Autor zu erforschenden oder zu erfindenden Werte:

| Bindung | Verbindlicher Wert |
| --- | --- |
| providerId | `twelvego` |
| policyId | `twelvego-general-chf-20261031-r1` |
| requiredOptional | ausschließlich `ANALYTICS_STORAGE` |
| processingPolicyRevision | `twelvego-load-affiliate-analytics-v1` |
| disclosureRevision | `twelvego-general-disclosure-v1` |
| networkPolicyRevision | `twelvego-general-network-v1` |
| parentOrigin | `https://jetnity.com` |
| childOrigin | `https://jetnity-widgets.vercel.app` |
| embedPath | `/embed/twelvego`, ohne Query |
| protocolRevision | `1` |
| artifactSha256 | `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e` |
| sandbox | `allow-scripts allow-same-origin allow-forms allow-popups` |

**`hostSelectionCommit` ist noch nicht bekannt.** Root pinnt ihn ausschließlich aus dem tatsächlich gelieferten und unabhängig akzeptierten Host-Commit. Weder der Task-Seed `a4b6b01d` noch ein alter unselektierter Host-Head darf als bereits angenommene Auswahl eingesetzt werden. Der Parent benötigt keinen erfundenen Commitwert und legt keinen eigenen CMP-Record an.

Die feste Resource-/Headerliste gehört dem Host-Autor. Nicht in den Parent kopieren, durch eigene CSP ergänzen oder aus Fixtures neu ableiten. Kein `allow-popups-to-escape-sandbox`, keine Top-Navigation. Der unveränderte Export kann ein benanntes Suchziel `undefined` verwenden; kein garantiert sicherer neuer Tab und kein außerhalb der Sandbox erfolgreiches Ergebnisseitenverhalten behaupten.

**Implementierung kann nach dem Main-Sync beginnen:** Der akzeptierte CMP-Entry und der versionierte Rev1-/12Go-Vertrag reichen für die vollständige bedingte Parent-Anbindung mit Offline-Fixtures. Die noch fehlende Host-Source-Annahme und spätere passende CMP-Auswahl blockieren die echte Freischaltung, nicht diese Arbeit. DiscoverCars, ein PrivacyBee-Katalogvorschlag oder eine erneute allgemeine Owner-Genehmigung sind keine zusätzliche Startabhängigkeit.

## 3. Same-session ACK und genau eine gemeinsame Schreibzuständigkeit

Vor Bearbeitung die tatsächliche bestehende Originalsession, den gespeicherten Namen und das Originalmodell aus bereits verfügbarer Session-Evidence bestätigen; Projektstart, Operating Standard, aktuelle Continuity, eigenen PR und die oben gepinnten Aufgaben lesen. Im bestehenden PR einen kompakten ACK mit aktuellen Head-/Tree-/Main-/Merge-Base-/Ahead-/Behind-Werten und genauem Umfang posten und im bereits erteilten IMPLEMENT direkt weiterarbeiten. Kein zusätzlicher Warte-/Owner-/PRE-CODE-Zyklus und kein Ersatzagent. Kein Zugriff auf Cursor-Credentials oder Auth-Speicher zur Wiederherstellung; der vorhandene originale GitHub-Router ist bestätigt.

**Erster Code-Schritt nach Root-IMPLEMENT:** akzeptierten main324 beziehungsweise den von Root dann ausdrücklich bestätigten neueren akzeptierten Main normal integrieren. Kein Rebase/Force-Push; keine bewegliche Host-/DC-Spitze oder ungeprüfte Cross-Branch-Cherry-Picks. Bei einem konkreten Konflikt außerhalb dieses Schreibbereichs die betroffenen Zeilen melden, statt fremde Änderungen aufzulösen.

### Beschreibbar

| Bereich | Endlicher Zweck |
| --- | --- |
| **Neu: `components/trips/MobilityWidgetScope.tsx`** | Eine kleine lokale React-Sichtbarkeits-/Scope-Seam, Default geschlossen; keine Consent-Autorität |
| **`components/trips/TripWorkspace.tsx`** | Nur Import, schmale lokale Scope-Ableitung und Provider um den bestehenden `mobilitaetssuche`-Knoten |
| **`components/trips/MobilitaetBereich.tsx`** | Nur vorhandenen äußeren Scope lesen und tatsächlichen `unterbereich` in derselben Seam weiterreichen |
| `components/trips/TwelveGoAffiliateLinks.tsx` | Bestehenden Einbau eng an den wirklichen Consumer anbinden; V1-Ziel-/Streckensemantik erhalten |
| `components/trips/TwelveGoWidget*.tsx` | Parent-Karte, tatsächlicher Frame, Lade-/Fehler-/Entfernen-/Retry-Lifecycle und eindeutig getrennte Testkomponenten |
| `lib/providers/twelve-go/widget/**` | Schmaler Parent-Rev1-Adapter, delegierte Freigabe, ausdrücklich angepasster Sandbox-Vertrag, fokussierte Tests |
| `scripts/twelve-go-widget-v2/**` | Nichtproduktive Modul-Fixtures und bestehende begrenzte Evidence |
| Eigene vorhandene 12Go PLAN/STATUS/HANDOFF/REPORT/SELF_REVIEW/PRIVACY_NOTICE-Dokumente | Wahrheitsgemäße Source-/Consumer-/Release-Abgrenzung und spätere gemeinsame Seam-Übergabe |

Die drei gemeinsamen Dateien gehören **ausschließlich dieser Originalsession**. Änderungen dort bleiben auf Context-Weitergabe und lokale Identität beschränkt. Kein Routing-/History-/Layout-/Karten-/manuelles Formular-Refactoring.

### Read-only

DiscoverCars-Komponenten und `lib/providers/discovercars/**`, `MietwagenBereich.tsx`, Shared-CMP-/Consent-Quellen, `apps/widgets-host/**`, V1 `lib/providers/twelve-go/affiliate/**`, Gast-/Konto-Wrapper, `app/embed/twelve-go/route.ts` (gesperrter 404 bleibt), globale Styles/Layout/Privacy-Seite, andere Trip-Module, Packages/Locks/Workflows, DB/Auth/RLS/Supabase, Secrets/Env/DNS/Vercel/Protection, gemeinsame Statusdateien und immutable Aufgaben. Keine Änderung an Frozen-Exportbytes. Keine zweite generische Embed-/CMP-Schicht.

## 4. Minimale gemeinsame Sichtbarkeit auf der tatsächlichen Oberfläche

Die gelesene main324-Quelle bindet:

- `TripWorkspace.tsx`, Blob `feb4fb5c1a6920d50313212f57eaf3df9eeb1082`: `detailOffen` entsteht aus tatsächlichem Modus/Detailzustand; `aktiveDomain` aus der bereinigten Detailauswahl. Der Mobility-Knoten bleibt nach Besuch unter `FlaecheHuelle` gemountet, mit `hidden` und `inert` bei `!detailOffen || aktiveDomain !== 'mobilitaet'`.
- `MobilitaetBereich.tsx`, Blob `93090ee2c323b9b28892c72dd7e2b83b86e36070`: `unterbereich` ist die wirkliche Auswahl `verbindungen | mietwagen`; Verbindungen bleiben gemountet und Mietwagen nach dem ersten Besuch ebenfalls.
- `GastArbeitsbereich.tsx` und `KontoArbeitsbereich.tsx` übergeben bereits denselben `<MobilitaetBereich ... />`-Knoten als `mobilitaetssuche`. Dafür sind keine Wrapper- oder Auth-Änderungen nötig.

Verwende **eine** kleine Context-Definition mit beispielsweise folgendem verbindlich zu dokumentierenden Read-Vertrag:

```ts
type MobilityWidgetScope = Readonly<{
  workspaceActive: boolean
  activeArea: 'verbindungen' | 'mietwagen' | null
  scopeKey: string | null
}>
// useMobilityWidgetScope(); Default: false / null / null
```

Der äußere Provider sitzt direkt um den bereits vorhandenen `mobilitaetssuche`-ReactNode. Sein **`workspaceActive = detailOffen && aktiveDomain === 'mobilitaet'`** entspricht exakt der bestehenden Sichtbarkeit. Kein zusätzlicher, davon abweichender Modus- oder DOM-Heuristikpfad. Außen bleibt `activeArea=null`; `MobilitaetBereich` ergänzt innen den tatsächlichen `unterbereich`, bei inaktivem Workspace weiterhin null. Der neue Provider bleibt an derselben Stelle; vorhandene Panels/Formulare werden nicht bedingt entfernt oder durch wechselnde React-Keys neu aufgebaut.

Die lokale Scope-Identität unterscheidet Reise/Quelle, relevanten Workspace-/Detail-/Tages-/Routenkontext sowie relevante Etappen-/Datumsreihenfolgeänderungen aus bereits vorhandenen Props. Sie bleibt bei gewöhnlichem Re-render stabil. Nur dafür erforderliche lokale Werte verwenden; kein vollständiger Trip-/Traveller-Export, kein neuer Datenabruf. Der Scope ist ausschließlich Parent-Speicher, kein URL-, Message-, Sub-ID-, DOM-Attribut-, Cookie- oder Storage-Feld. Die technische Ableitung darf innerhalb der neuen kleinen Datei liegen; kein neues Trip-Modell oder Resolver-Framework.

12Go darf ausschließlich bei **`workspaceActive && activeArea === 'verbindungen'`** und gültigem Scope ausführen. Fehlender Provider-Kontext bleibt geschlossen. Bei Wechsel nach Mietwagen, Schließen des Details oder Wechsel der Domain/Ansicht muss der tatsächliche 12Go-Frame sofort aus dem Renderpfad verschwinden, obwohl der Consumer gemountet bleibt. Cleanup pensioniert zusätzlich Capability, Listener, Timer und Pending-Arbeit. Unmount-Cleanup allein ist unzureichend.

Das Context-Modul enthält keine Anbieter-Loader und manipuliert keine Consent-Auswahl. DiscoverCars kann die später akzeptierten Exporte bei einer eigenen freigegebenen Integration lesen; dieser Task ändert oder aktiviert keinen DC-Consumer.

## 5. Akzeptierte öffentliche CMP-Fassade verwenden

Produktiver Entry auf main324:

```ts
requestProductionExecution(providerId, scopeKey): ProductionCapability | null
checkProductionExecution(capability): boolean
consumeProductionGrant(capability): ProductionGrant | null
releaseProductionExecution(capability): void
```

`ProductionCapability` ist ein intern registrierter Handle mit readonly `providerId`, `src`, `childOrigin`, `sandbox`, `protocolRevision`. Der einmalige Grant liefert `policyId`, `artifactSha256`, `parentGeneration`. Feldkopien sind keine gültigen Handles. Die Fassade prüft gebackene Release-/Kill-Entscheidung, tatsächlichen Host/API, Source-Record und gemeinsamen Store selbst.

**Keine direkte produktive Orchestrierung** von `selectProvider`, `bindReviewedPolicy`, `issueWork` oder `startLocalContext` im Provider-Consumer. Deren sichere Reihenfolge **select → bind → issue → fresh start** ist bereits intern gekapselt. Keine Policy-/API-/Host-/Release-Props, keine Factory, keine eigene Zustimmung, keine zweite Store-Instanz und keine nachträgliche Bindung eines alten Tokens.

Der Consumer darf den vorhandenen gemeinsamen Snapshot/Subscribe-Vertrag für UI und zeitnahen Widerruf verwenden. Die tatsächliche Ausführungsautorität bleibt bei den vier Funktionen. Ein `grant_informative`, CMP-Eventdetail, gespeichertes Boolean, iframe-Load oder Host-Ready ersetzt keinen gültigen Handle. Preferences nur über den vorhandenen offiziellen Einstieg und bei tatsächlicher CMP-Bereitschaft.

Ablauf:

1. Nur ein neuer bewusster 12Go-Klick im aktuellen sichtbaren Scope ruft `requestProductionExecution('twelvego', scopeKey)` auf. Null: kein Frame, ehrlicher Zustand und funktionierende V1-Links.
2. Nur der aktuelle registrierte Handle darf genau einen Frame reservieren. Keine Rekonstruktion aus seinen Feldern. Vor Mount und Nachrichtenverarbeitung den aktuellen aktiven Scope beachten.
3. Ein gültiges Ready des aktuellen Frames wird gegen Source/Origin/Schema/Challenge geprüft. Unmittelbar vor Grant erneut Sichtbarkeit/Scope/Handle und `checkProductionExecution` prüfen; dann `consumeProductionGrant` genau einmal. Ohne asynchronen Zwischenraum nur die gelieferten drei Grant-Felder plus geprüfte Rev1-Ready-Bindung senden.
4. Check bleibt nach Consume zur Überwachung gültig. Erforderlicher Consent-Verlust, unbrauchbare API, Policy-/Scopewechsel oder Lifecycle-Ende entfernt den Frame und ruft idempotentes Release auf.
5. Wiedergewonnene Zustimmung, Wiederöffnung, Re-render oder Ready sind kein neuer Klick. Ein Retry benötigt eine neue bewusste Anfrage und einen neuen Handle. Altes Cleanup darf einen neueren Handle nicht freigeben.

Analytics-only wird aus dem gültigen Record angewandt; keine pauschale Pflicht zur Werbung. Die gemeinsame CMP-Reservierung begrenzt beide Anbieter zusammen auf einen Kontext, auch bei Doppelklick/StrictMode. Keine private Umgehung, wenn ein anderer Kontext reserviert ist.

Die alten immer-false-/synthetischen Hilfen dürfen innerhalb des eigenen Scopes in eine echte **bedingte Delegation** umgebaut werden. Keine zwei true-Konstanten als Freischaltung. Die produktiven CMP-Denials werden nicht verändert; `node:crypto`-Exportprüfung und Vendor-Insertion gehören nicht in den Browser-Parent.

## 6. Tatsächlicher Host-Frame und Rev1-Bindung

Normaler Pfad: `MobilitaetBereich → TwelveGoAffiliateLinks → TwelveGoWidgetEinbau`. Dieser Pfad erreicht den tatsächlichen bedingten Consumer, nicht nur den bisherigen Absatz und nicht nur eine getrennte Harness-Komponente.

Frame-`src` ist ausschließlich die vom gültigen Handle bestätigte **`https://jetnity-widgets.vercel.app/embed/twelvego`** ohne Query. Kein `srcdoc`, Inline-Vendor-HTML, alternativer öffentlicher URL-/Env-/Prop-Schalter, Parent-Script, Proxy oder privater Main-App-Embed. Kein Preconnect/Prefetch vor bewusster gültiger Anfrage. Referrer-Policy verhindert Übertragung der privaten Parent-URL.

Der Source-Vertrag ersetzt hier ausdrücklich `allow-scripts` allein durch genau **`allow-scripts allow-same-origin allow-forms allow-popups`** für diesen separaten HTTPS-Host. Nur dort gilt diese Kombination. Kein Top-Navigation-/Escape-Token und keine Anwendung auf `srcdoc`/private Jetnity-URL. Die alte opaque-Origin-Assertion in `rahmen.ts` wird eng korrigiert, alle weiterhin verbotenen Pfade behalten negative Prüfungen.

Rev1: Type `jetnity-widget-host`, `revision:1`, Provider `twelvego`; exakte erlaubte Keys, JSON-Grenze 2048, 64-lowercase-hex Challenge/Artefakt, Policy-ID `[a-z0-9-]{1,64}`, ganzzahlige Generationen innerhalb 0…1_000_000. `ready`: type/revision/kind/provider/challenge/frameGeneration. `grant` ergänzt parentGeneration/policyId/artifactSha256. Keine privaten Scope-/Reise-/Tages-/Traveller-Daten in Messages.

Ready nur bei **`event.origin === capability.childOrigin`** und **`event.source === iframe.contentWindow`** des aktuellen Frames. `postMessage` erhält den exakten Child-TargetOrigin, niemals `*`. Falsche Source/Origin/Schema/Provider/Generation, wiederverwendete Challenge oder verspätete Arbeit werden abgewiesen. Reload/neues Ready ohne neue passende bewusste Entscheidung entfernt den alten Frame; kein Auto-Regrant.

Timeout, Fehler, Widerruf, Kategorie-/Scopeverlust, Unterbereichwechsel und Unmount entfernen den gesamten Frame ohne Warten auf Ack. Child-Revoke ist höchstens ergänzend. Kein Zustand behauptet, ein Ready beweise bereits sichtbare Formularfelder, funktionierende Suche oder Affiliate-Provision.

Der gemeinsame Child-Origin bleibt eine bekannte Grenze: Pfade trennen keinen same-origin Speicher. Teardown stoppt neue Arbeit des entfernten Dokuments, löscht aber keine schon übertragenen Daten oder Provider-Speicher und schließt keine schon geöffneten Suchziele.

## 7. Unveränderter Export, V1 und verständliche Oberfläche

Allgemeiner Export: `lib/providers/twelve-go/widget/quelle/12go-widget-allgemein.html`, **472 UTF-8-Bytes**, SHA-256 **`3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e`**, Blob `cb3623b12f9e86df93ceabd27d915e1a0943597c`. Rohbytes, Powered-by und neutrale Sub-ID `jetnity-mobility-search` bleiben unverändert. Die protokollrelative Scriptquelle wird ausschließlich im akzeptierten Host auf HTTPS aufgelöst.

Die 470-Byte-Datei Bangkok–Koh Chang bleibt Referenz; keine automatische Route, Reisezeit, Passagierzahl, Alter oder Wohnsitz im Widget. Besucher wählen Start/Ziel/Datum selbst. Provider-Standarddaten sind zu prüfen; keine erfundenen Jetnity-Fahrpläne, Preise, native Angebote oder Buchungsfunktion.

V1-Verbindungen und manuelle Erfassung bleiben bei fehlender Policy, Ablehnung, Fehler oder Timeout benutzbar. Laden/Fehler/Entfernen/Retry und Fokus sind verständlich, ohne technische Host-/Policy-Begriffe im normalen Nutzerfluss. Bei aktueller produktiver Sperre keine funktionierende eingebettete Suche behaupten. Ein deaktivierter Informationspfad ist Vorbereitung, nicht die fertige veröffentlichte Funktion.

## 8. Endliche Offline-Evidence am tatsächlichen Flow

Keine echten Provider-/CMP-Anfragen, Partnerkonten, Credentials, Auth-/DB-Aktionen oder echte Suche. Bestehende Harnesses verwenden; Fixtures/Modul-Aliases sind ausschließlich unter `scripts/` beziehungsweise Tests und werden nicht produktiv importiert. Kein öffentlicher Fixture-Schalter.

1. **Echter Kontext:** tatsächlichen `TripWorkspace` samt `MobilitaetBereich` und 12Go-Einbau in den vorhandenen Gast-/Konto-Seams mit synthetischen Daten und echten Organisieren-/Mobilität-/Unterbereich-Controls montieren. Tatsächliche Wrapper-Wiring belegen; Fixture-Snapshots nicht als Login-/DB-PASS ausgeben. Initial/Hydration/restaurierter CMP-State/Re-render erzeugen weder Child noch Providerverkehr.
2. **Bedingter positiver Pfad:** akzeptierte öffentliche CMP-Fassade mit testinternem Policy-Modul und lokal erfülltem Host; bewusster Klick → ein Frame → korrektes Ready → einmaliger echter Grant. V1 bleibt unabhängig bedienbar.
3. **Versteckter, weiterhin gemounteter Consumer:** 12Go → Mietwagen → Verbindungen, Schließen/Wiederöffnen und Domain-/Moduswechsel durch tatsächliche Controls. Frame und pending Grant verschwinden sofort; Rückkehr startet nichts. Mietwagen bleibt sein heutiger unveränderter Pfad. **Kein Warten auf einen implementierten DC-Consumer und kein DC-Dateiedit.** Bestehende manuelle Eingaben/Mount-Stabilität nachweisen.
4. **Kontext-/Consent-Wechsel:** Reisewechsel, relevante Tages-/Routen-/Etappenänderung, erforderlicher Category-Loss, kaputte API, Unmount sowie altes Ready/Completion. Neue Zustimmung belebt alten Handle nicht wieder; altes Release beendet keinen neuen. Nur die betroffenen Consumer-Lücken prüfen, nicht alle internen CMP-Tests neu entwickeln.
5. **Protokoll/Teardown:** falsche Source/Origin, Replay/Doppelklick/Timeout und lokaler tatsächlich asynchron arbeitender Child-Canary. Nach Frame-Abbau keine neue Canary-Arbeit. Parent-Lifecycle/Sandbox-Assertions auf echte Komponenten binden.
6. **Darstellung:** echte vorhandene CSS-/Tailwind-/White-Mint-Reihenfolge und Workspace-Vorfahren; 320/390/768/1440 px und 200 % Root-Schrift; keine Überbreite/Clipping der Parent-Controls oder Fixture-Felder, Powered-by erreichbar, Tastatur/Entfernen/Fokus. Nicht ausgeführten Browser-Zoom/Screenreader/Hardwaretest nicht behaupten.

Alle externen URL-Anfragen werden lokal erfüllt oder blockiert, das Ledger umfasst den ganzen Ablauf bis nach letztem Teardown. Unerwartete nichtlokale Versuche lassen den Author-Check scheitern. Keine Produktionsaufrufe für „nur einen visuellen Blick“. Originalhash/V1-Verhalten erhalten; bestehende fokussierte Source-/Frame-/Controllerprüfungen nicht abschwächen.

## 9. Lieferung und konkrete Reihenfolge bis zur echten Fertigstellung

Eigene Dokumentation nennt: unveränderte Originalsession, finalen Head/Tree, aktuellen Main/Merge-Base/Ahead/Behind, tatsächlichen Diff, die drei gemeinsam übernommenen Dateien und deren endgültige Read-Exporte, akzeptierten CMP-Anker, Host-Auftragsblob sowie Status des tatsächlichen Host-Acceptance-Commits. Der spätere DC-Autor darf die gemeinsame Seam ausschließlich aus diesem von Root akzeptierten festen Commit konsumieren.

Fokussierte Tests, Typecheck/Lint/Build, native exakte App/Auth-CI und passendes Preview mit tatsächlichem passed/pending/failed-Status liefern. Jeder neue Head braucht neues Gating; Autor-Self-Review ist kein TL-PASS.

**Konkrete Reihenfolge, ohne neue allgemeine Owner-Frage:**

1. Nach Roots IMPLEMENT dieses versionierten R6-Auftrags integriert der Originalautor akzeptierten Main und implementiert Parent + minimale gemeinsame Sichtbarkeit mit Offline-Fixtures.
2. Parallel liefert der eigene Host-Autor seine separat beauftragte 12Go-Source-Auswahl. Root nimmt den wirklichen Head unabhängig an und pinnt erst dann `hostSelectionCommit`.
3. Root lässt die passende 12Go-CMP-Quellauswahl/Disclosure/Release-Bindung in der zuständigen Originalsession vornehmen und überprüft das Gesamtpaket. Der 12Go-Parentautor verändert dafür weder CMP noch Host. DC bleibt unabhängig blockiert.
4. Root übernimmt den tatsächlichen Dedicated-Host-/HTTPS-/Cookie-/Storage-/Form-/Such-/Redirect-/Widerrufs- und Deployment-Abgleich. Erst die echte nutzbare Suche mit überprüfter sichtbarer Affiliate-Erhaltung schließt die Funktion ab; kein Kauf oder Provisionsnachweis wird daraus verlangt.

Der tatsächliche HostSelectionCommit und die noch null/false CMP-Auswahl sind **Freischaltungsabhängigkeiten**. Für die hier beauftragte Offline-Implementierung besteht nach Main-Sync und exklusiver Scope-Zuweisung kein weiterer DC-/Katalog-/Owner-Sequenzblocker.

**Draft lassen. Kein Ready, Merge, Deploy, Release-/Policy-/Env-Schalter, echter Provideraufruf oder automatischer Folgeslice. STOP für unabhängige TL-Prüfung. Unmittelbare Korrekturen bleiben in derselben Originalsession.**

## Quellen der Task-Prüfung

- main324 TripWorkspace Blob `feb4fb5c1a6920d50313212f57eaf3df9eeb1082`; MobilitaetBereich Blob `93090ee2c323b9b28892c72dd7e2b83b86e36070`.
- main324 GastArbeitsbereich Blob `43a74568e93b1fa60b585f1f8a1fcdddb677340c`; KontoArbeitsbereich Blob `7cb91f6e0ede0fa832750c6c10896f787bfe8938`.
- 12Go Einbau Blob `3c4be6ae9171f6e2bc55f65d3c9f90d7f60bc283`; Affiliate-Mount Blob `71d96c62c2fcc5787e43760d93d0f4ab64769847` bei `4b20d8f5`.
- 11 aktuelle Git-Dateiinhalte samt exakten Refs und lokal nachgerechneten Blob-SHAs in `provider-review/12go-r6-independent-parent-task-source-2026-10-31.json`.
