# DiscoverCars V2 — Jetnity-konfiguriertes Artefakt — Amendment V1

**Versionierter Technical-Lead-Auftrag V1; Implementierung nach explizitem Root-IMPLEMENT.** Endliche Source-Vervollständigung des bestehenden PR #1084 / Issue #1083. Root seedet diesen unveränderlichen Auftrag vor dem Originalsession-Dispatch.

## 1. Autor und frisch geprüfte Ausgangslage

Einziger Writer: **Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1**, Originalsession **bc-1885a130-36a8-4dcf-86bc-48aa6121c24e**, Originalmodell **grok-4.7-high-fast**. Bestehender Branch `feat/discovercars-v2-official-widget-optin-1`, bestehender Draft #1084; kein neuer Agent/Branch/PR. Identität vor Code aus echter Session-/run-info-Evidence bestätigen.

Live lesend am 31.10.2026: #1084 OPEN/DRAFT/UNMERGED, Head **729e9344f00316d0559ca8b800555a49909e58f3**, Tree **32765392bb365490e29513026074677666347ad8**. Gegen main **36efd23835373f4a9cac28175bbefacc9cc45c58**: Merge-Base **b7ebc399b92303eacda9afdaa1786f245492051f**, **13 voraus / 35 zurück**. Frühere 13/0-Angaben sind historisch. Root prüft vor Seed/Dispatch erneut; jede neue Head-SHA entwertet frühere Exact-Head-Gates.

Autor liest Start/Operating Standard/aktuellen Handoff/ACTIVE_WORK_STATUS/Continuity/AGENTS/Mode, seinen unveränderten V1-Task Blob **f4b0996471eb67b811382c1102f88285944335e5**, spätere eigene Amendments und die [Root-Provenienzentscheidung6548820711](https://github.com/Jetnity/jetnity/pull/1084#issuecomment-6548820711). Vor Code echte Identität, aktuelle Git-Werte, Task-Blob und genau die Dateien unten dokumentieren. Nach explizitem Root-IMPLEMENT erlaubt dieser Auftrag die endliche Umsetzung und normalen sicheren Main-Sync im eigenen Branch ohne zusätzliche PRE-CODE-Warteschleife. Unbekannte Originalidentität oder konkrete fremde Schreibkollision zuerst melden. Keine Force-/Rebase-Aktion oder fremde Konfliktlösung.

## 2. Zweck und genaue Ausnahme vom alten Exportvertrag

Die öffentliche Zuordnung **a_aid=jetnity** ist bereits belegt. Der echte eingefrorene allgemeine Export enthält `data-aff-code="a_aid"`, aber keinen Affiliate-Wert. Der bereits gelesene offizielle Loader liest `data-aff-value` und verwendet bei Fehlen leer. Root hat deshalb eine nachvollziehbare Jetnity-Konfiguration beschlossen; kein neuer Account-/Credential-/Owner-/Katalognachweis ist nötig.

Der ursprüngliche Export bleibt unverändert als Evidence. Dieses Amendment erlaubt **zusätzlich** eine gesondert bezeichnete Jetnity-konfigurierte Variante mit genau einem neuen Attribut. Sie ist kein erneut aus dem Partnerkonto exportiertes oder unverändert vom Generator geliefertes Original. Kein vorhandener Hash, Source-Receipt oder Audit wird rückwirkend auf die neue Variante umgedeutet.

| Artefakt | Datei unter `lib/providers/discovercars/widget/` | Bytes / SHA-256 |
| --- | --- | --- |
| Unverändertes Original | `discovercars-widget-allgemein.html` und bestehende `.sha256` | 835 / `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa` |
| Neu: Jetnity-konfiguriert | `discovercars-widget-jetnity-konfiguriert.html` und neue `.sha256` | 860 / `7c803587919b4aecfa8f05bdbf1b90fed2027b5dd11a0d0b9c0bea7b955dc7e3` |

Originalquelle: Head **729e9344…**, Blob **1581be9a4377a7b53416971332b447b982345763**. Exakte Ableitung: unmittelbar nach dem einmaligen `data-aff-code="a_aid"` genau die 25 UTF-8-Bytes **` data-aff-value="jetnity"`** einfügen. Kein BOM, keine zusätzliche abschließende Zeile, kein Neuformatieren oder Umordnen. Das Entfernen genau dieser Einfügung muss die vollständigen 835 Originalbytes zurückgeben. Der erwartete 860-Byte-Hash wurde von Root und im Read-only-Review offline hergeleitet; der Autor rechnet ihn unabhängig nach.

Alle anderen Bytes bleiben gleich: Loader-URL, allgemeiner leerer Standort, Deutsch, CHF, UTM, Farben, Texte, async, Logo/Powered-by und übrige Attribute. Keine neue Affiliate-ID, kein Channel/Sub-ID, kein Trip-/Personen-/Orts-/Datumsparameter und keine Änderung der bestehenden V1-Linkouts.

## 3. Kleinster Source-Vertrag und Dateiscope

Erlaubt sind ausschließlich:

- die **zwei neuen** konfigurierten Artefaktdateien oben;
- `lib/providers/discovercars/widget/export.ts`: additive, fest benannte Metadaten/Attributbindung und eine ausdrücklich nicht ausführende Prüfung der neuen Variante;
- `lib/providers/discovercars/widget/export.test.ts`: vorhandene Originalprüfungen erhalten, die wenigen neuen Ableitungs-/Bindungsprüfungen hinzufügen;
- eigene `docs/JETNITY_DISCOVERCARS_V2_WIDGET_OPTIN_1_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-29.md` für aktuellen Stand und nachprüfbare Provenienz.

Die vorhandene `WIDGET_EXPORT_DATEI`-/26-Attribut-Identität bleibt das Original. Der konfigurierte Datensatz besitzt eine eigene feste Datei-/Byte-/Hash-/Provenienzidentität und 27 feste Attribute. Ein neuer Prüfaufruf oder eine geschlossene Variantenkennung unterscheidet beide ausdrücklich; keine allgemeine caller-supplied Allowlist, keine automatische Umdeutung von Original zu konfiguriert und kein stilles Ersetzen bestehender Originalkonstanten. Der strukturelle Parser kann wiederverwendet werden; unbekannte Varianten, doppelte/abweichende Attribute und Zusatzinhalt bleiben gesperrt.

Neue Metadaten/Source-Prüfer verleihen keinerlei Ausführungsrecht. Bestehende Ausführungsfunktionen liefern weiterhin Ablehnung, `widgetDarfAusfuehren()` bleibt false, `WIDGET_LAUFZEIT` bleibt `CONSENT_BLOCKED`. `vertrag.ts` und seine ursprünglichen 835-Byte-Metadaten brauchen für diesen additiven Schritt keine Änderung. Keine Node-fs/crypto-Abhängigkeit in Browsermodule einführen; Hashberechnung bleibt in den vorhandenen Node-Tests.

Die tatsächlich gelesenen `harness.tsx`, `browser.ts` und `synthetische-pruefseite.html` unter `scripts/discovercars-v2-widget-optin-1/` binden keine Exportdatei/Hashwerte; sie bleiben unverändert. Die neue Attribut-/Artefakterwartung gehört in den bestehenden `export.test.ts`-Prüfharness. Keine zusätzliche Browserrunde oder UI-/Resize-Teständerung allein wegen dieser neuen Datenvariante.

Read-only bleiben insbesondere: ursprüngliches HTML samt `.sha256`; `components/**`; `vertrag.ts`, Lifecycle-/V1-/Affiliate-Quellen; Host `apps/widgets-host/**`; Host-Audit-Harness/Evidence; CMP und gemeinsame Visibility; unveränderliche Tasks; shared Status/README; Root-Packages/Locks/CI; Auth/DB/RLS/Supabase; Env/DNS/Vercel/Protection. Keine echten Anbieter-/CMP-Aufrufe, kein Account-/persönlicher Browserzugriff, keine Keys und keine externen Nachrichten. Ein konkreter außerhalb dieser Liste nötiger Eingriff wird mit minimaler Begründung an Root gemeldet und nicht eigenmächtig erledigt.

## 4. Begrenzte Abnahme

1. Das Original bleibt exakt 835 Bytes/alter Hash/26 Attribute; sein Git-Blob und seine `.sha256` bleiben unverändert. Die neue Datei ist exakt 860 Bytes/neuer Hash/27 Attribute. Inverse Byte-Ableitung belegt, dass ausschließlich die freigegebene Einfügung erfolgte.
2. Die neue Source-Prüfung erkennt genau die feste konfigurierte Variante und ihren öffentlichen Wert `jetnity`. Fehlender/falscher/doppelter Affiliate-Wert, Zusatzattribut, fremde Scriptquelle, zusätzlicher Script-/Frame-Inhalt und vertauschte Variantenidentität werden abgelehnt. Bestehende Original-Negativfälle bleiben wirksam. Eine gültige Source-Prüfung startet nichts; keine Variante erhält einen ausführbaren Rückgabepfad.
3. Fokussierte Export-/bestehende Vertragsprüfungen sowie erforderliche Repo-Lint-/Type-/Build-/native App/Auth-/Preview-Gates auf dem tatsächlich gelieferten Head wahrheitsgemäß ausweisen. Keine Timeout-/Retry-/Skip-Abschwächung und keine optionalen breiten Testkampagnen. Ein neuer Head hat keinen geerbten CI-/Preview-PASS.

Die geklärte öffentliche ID und das neue Feld sind **Source-/Konfigurationsnachweis**, keine echte Widgetsuche, Redirect-, Account-Klick- oder Provisionsbestätigung. Der unabhängige DiscoverCars-Runtimeaudit bleibt nach Roots aktueller Entscheidung **unvollständig / BLOCKED_TRANSPORT**; dieser Auftrag löst ihn weder erneut aus noch erklärt ihn für bestanden.

## 5. Lieferung und spätere Root-Koordination

Liefern: echte Originalsession/Modell, Task-Blob, finaler Head/Tree/Main/Merge-Base/Ahead/Behind, vollständige schmale Dateiliste, beide Artefaktidentitäten, unabhängige Byte-/Hash-/Attributbelege, tatsächliche Gate-Ergebnisse und die genaue noch fehlende Runtime-Abnahme. Own STATUS/HANDOFF unterscheiden den unveränderten Originalbeleg von der neu konfigurierten Source; beide bleiben aktuell erkennbar.

Für Root ausdrücklich übergeben: bestehender Host-Parser/Frozen-Export, CMP-/Host-Policy-Pins und der alte 31-Paare-DC-Auditvertrag sind weiterhin an das **835-Byte-Original mit leerem aff_value** gebunden. Die neue 860-Byte-Variante darf diese Pins nicht still übernehmen. Root koordiniert deren spätere gesonderte, versionsgebundene Anpassung und tatsächliche Runtime-Abnahme. Dieser Autor ändert oder erfindet dafür keine Host-/CMP-/Network-/Policy-ID. Kein bestehender Vendor-Capture wird als Antwort für die neue aff_value-Konfiguration ausgegeben.

Root entscheidet erst nach unabhängiger Prüfung über weitere Integration. **Draft behalten, kein Ready/Merge, keine Source-Auswahl im Host, kein Deployment, keine Provider-Ausführung und kein automatischer Folgeslice.** Unmittelbare CHANGES-REQUIRED-Fixes erfolgen in derselben Originalsession.
