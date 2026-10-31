# CMP S2 — produktive Policy- und Capability-Naht — Amendment V1

**IMMUTABLE AMENDMENT V1, 31.10.2026, Europe/Zurich. Vor Dispatch im bestehenden Branch versioniert. Source-Vorbereitung nach Roots IMPLEMENT; keine Aktivierung.** Endliche Fortsetzung des bereits beauftragten DiscoverCars-/12Go-Pakets. Keine neue Produktfunktion, Katalog-/Supportwartepflicht oder zusätzliche allgemeine Owner-Freigabe.

## 1. Ausgangspunkt und ein Autor

Bestehender Draft **#1096**, Branch `feat/privacybee-cmp-widget-consent-s2`. Geprüfter CMP-R4-Anker **334828ac12c754c1895f95623358876e29ee7fb9**, Tree **391e9c20e1e27690b7f0a967b98b3df80902da26**; Main-Anker **36efd23835373f4a9cac28175bbefacc9cc45c58**. Vor Dispatch/Implementierung aktuelle Werte erneut feststellen. S2 TASK V1, Blob **b460b21bdeb2ee4434766fee6b775f594a09a2a0**, bleibt unverändert.

Einziger Writer: **Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1**, Originalsession **bc-dc782027-b7e1-4592-a7ae-b4f709161135**, Originalmodell **grok-4.7-high-fast** über echtes run-info bestätigen. Vorhandene Session und PR fortsetzen; keine neue Writer-Session, kein neuer Branch/PR. Projektstart/AGENTS/Operating Standard/aktuelle Continuity/Mode, S2-Task, R4-Evidence sowie dieses Amendment lesen. PRE-CODE mit echter Identität, Head/Tree/Main/Merge-Base/Ahead/Behind und endlicher Dateiliste; danach STOP bis Roots explizitem IMPLEMENT. SINGLE_AGENT; parallele Reviews read-only.

## 2. Konkretes Ergebnis und zulässige Vorbereitung jetzt

Heute sind `productionPolicy()` und `productionStart()` absichtlich nicht produktiv; `BundleDecision.productionExecute` ist für den lokalen S2-Pfad false. R4 hat echte Snapshot-, Intent-, Policy-Anforderungs-, Epoch- und Lifecycle-Logik geliefert. Diese wird wiederverwendet, nicht durch einen zweiten Consent-Store ersetzt.

Jetzt implementieren: einen vollständigen bedingten Produktionspfad über genau diesen Store, eine feste source-owned Policy-Tabelle für die beiden Provider und die vier unten definierten Consumer-Aufrufe. Mit später eingesetzten vollständigen Root-Policy-Pins und dem bestehenden Paket-Release muss derselbe gelieferte Pfad produktive Autorität ausstellen können; keine weitere TODO-/Stub-Implementierung hinter dem Grant.

**Die Source-Vorbereitung ist bereits ohne fertige Kategoriezuordnung ausführbar.** Beide echten Tabelleneinträge bleiben `null`, `CMP_RELEASE_AUTHORIZED` bleibt false, keine Dummy-Policy wird ausgewählt. Positive Nachweise verwenden ausschließlich separat liegende synthetische Testauswahlen am gleichen Algorithmus. Keine öffentliche Fixture-Prop, Query, Storage-, ENV- oder Caller-Boolean-Umgehung.

Root liefert nach dem endlichen Host-/Provider-Audit die tatsächlich geprüften Werte. Deren spätere Übernahme ist eine ausdrücklich von Root bezeichnete Source-Datenänderung in derselben Originalsession mit neuen Exact-Head-Gates; keine erneute generische Owner-Anfrage. Ohne diese Werte ist die Naht fertig vorbereitet, das sichtbare Widget aber weiterhin nicht fertig veröffentlicht. Banner-only-Veröffentlichung bleibt ausgeschlossen.

## 3. Exklusiver kleiner Schreibbereich

- Neu `lib/privacy/privacybee-cmp/produktionspolitik.ts`: unveränderliche Datentypen, zwei echte deny/default-Einträge und strikte Auswahlvalidierung.
- Neu `lib/privacy/privacybee-cmp/produktion.ts`: vier öffentliche Store-/Capability-Operationen, sichere readonly Frame-Metadaten und höchstens ein kleiner privater Handle-/Spent-Nachweis.
- Bestehend `bundle.ts`, `steuerung.ts`, `abo.ts` im selben Verzeichnis: Produktionsauswahl an die Tabelle anschließen, vollständige Policy-Bindung und atomare Veröffentlichung im vorhandenen Store. Bestehenden lokalen Algorithmus und R4-Fixes erhalten.
- `bootstrap.ts`/`freigabe.ts` nur soweit nötig, um den bereits serverseitig eingebrannten Release-/Kill-Deny auch für die produktive Naht eindeutig lesbar zu machen. Allenfalls ein nicht sensibles Bootstrap-Release-Ergebnis; kein roher ENV-Wert, Header-/Dynamic-Rendering-Wechsel oder neuer Aktivierungsschalter. `vertrag.ts` nur für nötige Typen; Release bleibt false.
- Fokussierte zugehörige Tests, bestehende `scripts/privacybee-cmp-widget-consent-s2/**` sowie eigene S2-Report/Handoff/Status/Disclosure-Dokumente und scrubbed Evidence.

Alles andere read-only: Provider-/Trip-/Visibility-/Host-Quellen, `app/layout.tsx`, Legal-Laufzeit und `/privacy`, Styles, Pakete/Lockfiles/Workflows, DB/Auth/RLS/Supabase, Env/DNS/Vercel/Protection, gemeinsame Statusdateien und unveränderliche Tasks. Keine neuen Produkt-Controls in diesem Source-Auftrag. `WidgetConsentChoice` und S1 `grant_informative` bleiben informativ; ihre alten false-Helfer werden nicht in eine pauschale Ausführungsfreigabe umgedeutet.

## 4. Source-owned Produktionspolicy: genau zwei Datensätze

`productionPolicy(providerId)` liest ausschließlich die interne Tabelle und liefert `null` oder einen validierten, tief unveränderlichen Record. Kein Caller kann eine Policy oder ein enabled-Feld an die produktive Startfunktion übergeben. Bestehende reine lokale Tests dürfen weiter eine ausdrücklich synthetische Policy benutzen.

Der minimale Produktionsrecord bindet diese Werte als feste Source-Literale:

| Feld | Herkunft / Bedeutung |
| --- | --- |
| `providerId` | ausschließlich `discovercars` oder `twelvego` |
| `policyId` | Roots eindeutige vollständige Bundle-/Host-Selection-ID, identisch zur akzeptierten Host-Auswahl |
| `requiredOptional` | nicht leere, eindeutige Liste dokumentierter optionaler PrivacyBee-Kategorien, tatsächlich für diesen Provider ausgewählt |
| `processingPolicyRevision`, `disclosureRevision` | Roots geprüfter Verarbeitungspfad und genau dazugehöriger factual Notice-Stand |
| `artifactSha256` | unten festes allgemeines Originalartefakt |
| `parentOrigin`, `childOrigin`, `embedPath`, `protocolRevision` | feste unten genannte Origins, genau ein Providerpfad, Revision 1 |
| `networkPolicyRevision`, `hostSelectionCommit` | Roots genau akzeptierte produktive Host-/Netzwerkauswahl und deren Source-Provenienz; kein Audit-Seed als Freigabe |
| `sandbox` | exakt Roots akzeptierte Rechte für diesen separaten Host; keine geratenen Forms-/Popup-/Navigationsrechte |

Bekannte feste Werte: Parent `https://jetnity.com`; Child `https://jetnity-widgets.vercel.app`; DiscoverCars `/embed/discovercars`, SHA-256 `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa` (835 Bytes); 12Go `/embed/twelvego`, SHA-256 `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e` (472 Bytes). Keine zusätzlichen Queryparameter, Nutzer-/Reise-/Kontodaten oder 12Go-Bangkok-Referenzdatei.

Root hat für 12Go bereits die enge technische Zuordnung ANALYTICS_STORAGE für die beobachtete Lade-/Affiliate-Messung angenommen ([6547934161](https://github.com/Jetnity/jetnity/issues/1087#issuecomment-6547934161)); dies allein ist kein vollständiger produktiver Policyrecord. Noch nicht ausgewählt: DiscoverCars-Kategorien sowie die vollständigen produktiven Processing-/Disclosure-/Network-/Sandbox-Pins und finalen Host-Selection-Heads beider Provider. Diese nicht aus Hosts, GTM-Anwesenheit, dem anderen Provider, Kataloglabels oder einem Fixture ableiten. Notwendige Kategorien dürfen keine optionale Freigabe ersetzen; auch nicht pauschal alle optionalen Kategorien verlangen. `purposeSeparationVerified=false` bleibt wahr, eine autorisierte untrennbare Bundle-Policy behauptet keine Zwecktrennung.

Bei Änderung eines gebundenen Policywertes benötigt die Auswahl eine neue `policyId`; Host und CMP müssen dieselbe ID/Artefaktbindung verwenden. Kategoriengleichheit allein macht eine alte Capability nicht gültig. Keine Runtime-Anfrage zur vermeintlichen Bestätigung eines Commit-Pins; tatsächliche Deployment-/Policy-Übereinstimmung belegt Root vor Release. Unbekannte, unvollständige oder mismatched Records ergeben null. Keine ausführbaren Platzhalterstrings.

## 5. Vier konkrete Consumer-Aufrufe

Aus `lib/privacy/privacybee-cmp/produktion.ts` exportieren; bestehende Snapshot-/Subscription-Aufrufe aus `abo.ts` erhalten. Interface mit den lokalen DC-R5-/12Go-R6-Consumer-Drafts abgestimmt:

```ts
requestProductionExecution(providerId, scopeKey): ProductionCapability | null
checkProductionExecution(capability): boolean
consumeProductionGrant(capability): {
  policyId: string; artifactSha256: string; parentGeneration: number
} | null
releaseProductionExecution(capability): void
```

`ProductionCapability` ist ein intern ausgestellter Handle, keine strukturell nachbaubare Kombination aus Boolean, Policyobjekt und Tokenfeldern. Eine sichere readonly Beschreibung für den Provider-Mount darf beiliegen: Provider, exakter `src`/Child-Origin, Sandbox und Protokollrevision aus der ausgewählten Source-Policy. Der scopeKey ist ausschließlich flüchtiger Parent-Kontext, kein vom Provider gelieferter Autoritätsnachweis. Scope/Tripdaten, aktuelle Kategorien und interne Epoch-/Tokenfelder bleiben Parent-intern und werden nicht in Host-Messages gestreut. Der Capability-Nachweis ist eine Anwendungssperre, kein kryptografisches Besucherzertifikat.

### Request: ausschließlich neue ausdrückliche Provider-Aktion

`requestProductionExecution` benutzt den tatsächlichen Browserhost, den bestehenden Source-Release plus wirksamen serverseitigen Kill-Deny, die interne Source-Policy und eine neue vollständige Lektüre von `window.PrivacyBee`. Keine API-/Snapshot-/Host-/Policy-/enabled-Parameter aus dem Consumer. SSR, unlizenzierter Host, fehlende Freigabe, Policy oder unbrauchbare API liefern null.

Der vorhandene Store wird atomar benutzt. Ggf. zuerst den tatsächlichen lokalen Scope über den bestehenden `reset_context`-Vertrag synchronisieren, dann **select → bind → issue → fresh start**. Kein retroaktives Binden eines früher ausgegebenen Tokens. Policyidentität muss vor Ausgabe in Slot/WorkToken/Live-Reservierung gebunden sein, nicht nur die Kategorienliste. Fehlgeschlagener Start hinterlässt keine später automatisch ausführbare Auswahl.

Ein bestehender Live-/Pending-Kontext wird nicht implizit verdrängt. Doppelklick/zweiter Provider liefern keine zweite Reservierung; der Consumer entfernt/pensioniert zuerst den alten Kontext. Ein später wiederhergestelltes CMP-Ergebnis, Ready, Reload, Re-render oder Reopen ruft keinen neuen Request auf. S1 `grant_informative` erzeugt keinen produktiven Intent.

### Check und einmaliger Grant

`checkProductionExecution` prüft Handle-Provenienz, aktuellen Store/Scope/Epoch/Policytuple, vorhandene Reservierung, Source-Release/Host und die erneut gelesene echte API. Es erzeugt weder Auswahl noch neue Capability. Erforderlicher Category-Loss, unbrauchbare API oder Policywechsel pensioniert die passende Arbeit; eine Änderung nicht erforderlicher Kategorien allein tut dies nicht. Nach gültigem einmaligem `consume` bleibt der Check für den laufenden Kontext wahr, bis eine echte Invalidation eintritt.

`consumeProductionGrant` führt dieselbe frische Prüfung unmittelbar durch und verbraucht genau eine Grant-Möglichkeit. Zweiter Consume liefert null. `parentGeneration` ist monoton, nie recycelt und im bestehenden Rev1-Bereich 0–1.000.000; kein Date.now-Wert, Wraparound oder Wiederverwendung bei Überlauf. Ein später abgebrochener Versand erfordert Release und eine neue bewusste Auswahl.

CMP besitzt weder iframe noch Host-Ready-Parser. Der Provider prüft unmittelbar vorher aktuelle Sichtbarkeit/Scope, exakten Event-Origin und aktuelles iframe.contentWindow, Provider/Revision/Schema sowie unbenutztes Challenge. Erst dann Consume; anschließend ohne await echoed Challenge/FrameGeneration mit genau den drei gelieferten Grant-Feldern in die vorhandene Rev1-Nachricht übernehmen und an den exakten Child-TargetOrigin senden. Kein neuer Protokollparameter und keine Scope-/Tripdaten.

### Release und alte Handles

Release ist idempotent und pensioniert nur die zu diesem Handle gehörende Reservierung. Späte Cleanup-/Check-/Async-Arbeit mit einem alten Handle darf einen neueren Kontext nicht pensionieren. Der vorhandene gemeinsame Store bleibt die einzige Quelle von CMP/Intent/Live-Zustand. Keine Persistenz, Cookies oder zweite Zustimmungsliste. Der Consumer entfernt das ganze iframe unmittelbar bei aktuellem Sichtbarkeits-/Scope-/Consentverlust, Fehler, Timeout oder Unmount; kein Warten auf ein Child-Ack.

Der alte stets falsche `productionStart`-Stub darf nicht neben der neuen Fassade weiter als produktive Consumer-API dokumentiert bleiben: entweder passend intern anbinden oder eindeutig auf den lokalen Prüfpfad begrenzen. Positive `localContext`-/Fixture-Ergebnisse und legacy false-Helfer werden nicht zur Produktionsautorität umgedeutet. Alle vier Operationen müssen vollständig implementiert sein.

## 6. Fokussierte Evidence und ehrliche Lieferung

Nur Offline-Fixtures; kein echter PrivacyBee-/Provider-/Host-Aufruf. Die tatsächliche Produktionsquelle bleibt deny und enthält keine Testauswahl. Positive Tests dürfen den Registry-/Browser-Eingang nur über nicht produktiv importierte Tests/Module-Mocks injizieren und müssen denselben gelieferten Produktionsalgorithmus/Fassadenpfad ausführen, nicht eine zweite Implementierung.

Nachweisen: tatsächliche null-Registry und false-Release verweigern auch bei allen CMP-Werten; source-selektierte synthetische Policy plus echter Fassadenaufruf kann einmal autorisieren; unbekannte/fehlende/necessary-only/mismatched Pins und strukturell gefälschter Handle verweigern. Bindung vor issue, gemischte Kategorien, erforderlicher Loss und Regrant, stale Scope/Epoch/Policy mit gleichen Kategorien, einmaliger Consume bei weiterhin gültigem Check, fremder/alter Handle, Doubleclick/zweiter Provider, idempotenter Release und verspäteter Cleanup gegen neueren Kontext erhalten die R4-Eigenschaften. Der vorhandene lokale Frame-Harness konsumiert die neue Naht und beweist Abbau; keine echte Anbieteroberfläche behaupten.

Bestehende fokussierte CMP-/Legacy-/Bootstrap-Gates behalten; nur konkret geänderte Risiken ergänzen. Erforderliche Typecheck/Lint/Build/native CI/Preview auf dem finalen Head ehrlich melden. Kein erneutes allgemeines Testframework oder private Profile. Handoff liefert vier tatsächliche Signaturen/Quellpfade, Handle-/Lifecycle-Vertrag, genaue Root-Datenfelder und verbleibende null/false-Werte; kein fertiges Widget oder wirksamer Besucher-Consent behaupten.

## 7. Roots endlicher Anschluss nach dem Audit

Root liefert je Provider einen konkreten Review-Beleg mit vollständigem literal Policyrecord, akzeptierter Host-Selection/Netzwerk-/Sandbox-Quelle und factual Disclosure-Stand. Der gleiche CMP-Autor übernimmt ausschließlich diese Daten in die vorbereitete Tabelle. Der DC-Autor konsumiert danach die angenommene Fassade und besitzt die gemeinsame Visibility-Seam; 12Go konsumiert deren angenommenen Commit. Kein Provider-Writer ändert gemeinsame Policies oder erfindet eine Ersatzfreigabe.

Erst das unabhängig geprüfte vollständige Veröffentlichungspaket darf den bestehenden CMP-Source-Release einschalten; kein reiner Banner-Release. Host-Audit-Auswahl, Source-PASS, grüne CI oder diese Vorbereitung sind keine Produktions-Policy. Originalexports, V1-Fallbacks, Host-Rev1 und Root-owned reale Formular-/Netzwerk-/Deploymentprüfungen bleiben erhalten.

**STOP nach Source-/Datenlieferung für unabhängiges Review. Kein Ready, Merge, Deployment, ENV-/DNS-/Accountzugriff, reale Provider-/CMP-Ausführung oder automatischer Folgeslice. Unmittelbare Korrekturen bleiben in derselben Originalsession.**

Quellen: [CMP-R4-Controller](https://github.com/Jetnity/jetnity/blob/334828ac12c754c1895f95623358876e29ee7fb9/lib/privacy/privacybee-cmp/steuerung.ts), [derzeitige Bundle-/Produktionsentscheidung](https://github.com/Jetnity/jetnity/blob/334828ac12c754c1895f95623358876e29ee7fb9/lib/privacy/privacybee-cmp/bundle.ts), [bestehender Store](https://github.com/Jetnity/jetnity/blob/334828ac12c754c1895f95623358876e29ee7fb9/lib/privacy/privacybee-cmp/abo.ts), [Host-Rev1-Vertrag](https://github.com/Jetnity/jetnity/blob/bff2d130228d50a857d4e5611a9b3477084ac8df/docs/JETNITY_WIDGETS_HOST_S2_PROTOCOL_2026-10-31.md). Aktuelle Read-only-Quellen waren die SHA-verifizierten lokalen CMP-R4-/Host-R3-Snapshots; kein neuer externer Abruf durch diese Review-Lane.
