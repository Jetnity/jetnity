# S0 — Gemeinsamer Runtime-Vertrag, Umsetzungsplan

**Autor:** Jetnity Official Truth V3 Shared Contract 1 — Codex Generation 1

**Session:** `/root/v3_contract_writer`

**Auftrag:** `PROGRAM_V1.md`, S0 TASK V1; Issue #1162, Draft-PR #1163

**Basis:** main `ce3366e26de73961d4682236af92347bfc3a4ca8`; Seedhead `7f940d5620ef194c86a82b570751b2fea94fef92`

**Status:** Implementierung; keine Technical-Lead-Abnahme.

## Ziel und Dateien

Ein gemeinsamer, ruhender Wire-Vertrag verbindet später Import, öffentliche bedingte Regelübersicht und Überwachung. S0 schreibt ausschließlich `lib/readiness/official-truth-product-v3/contract.ts`, `contract.test.ts` und `docs/official-truth-product-v3/S0_*.md`. Synthetische Helfer bleiben möglichst in der Testdatei. Root besitzt das Programm und zentrale Architektur-/Entscheidungs-/Continuity-Dokumente.

Die Leser prüfen bounded JSON, bekannte Schlüssel, strukturierte Fakten/Bedingungen, Identitäten und Beziehungen. Ihre Ergebnisse sind **gelesene Records, keine akzeptierten Claims, keine Herkunftsreceipts und keine Methodenfreigabe**. Es wird kein alternativer Auswertungsgraph und kein produktiver Adapter implementiert.

## Wiederverwendung und API

- Länder: `landescodeLesen` plus `istKatalogLand`; ein bis fünf normalisierte Staatsangehörigkeiten, keine weitere Besuchereingabe.
- Regelkontext: `RegelScope`/`EvidenceAtom`, `regelScopeAusEvidenceScope`, vorhandene Requirement-/Faktarten; je globale Zelle genau eine Staatsangehörigkeit. V3 ergänzt explizite Routenart und bekannte/unbedingte/ungeklärte strukturierte Bedingungen. Die Bedingungen kommen aus `RegulierungsAusdruckV2`, nicht aus einem Besucherprofil.
- Fakten: `RegelFakt`/`RegelFaktV2` und `regelFaktKanonischLesen`, ohne Aufruf einer Annahmefunktion mit einem Researchervorschlag.
- Quellen: `QuellenRegistry`, bestehende Content-/Representation-Identitäten und `ev2_`-Evidence-IDs. Eine URL-/Quellenklasse ist kein Zielland-Zuständigkeitsnachweis.
- Forschung: bestehende `OfficialTruthRechercheAnfrage` und `officialTruthRechercheEntscheiden`; zusätzlicher Deduplizierungsschlüssel bindet vollständigen V3-Kontext und Methodenrevision.
- Kalender: `civilDateOrdinalLesen`; kanonische UTC-Zeitstempel werden zusätzlich gegen Normalisierungen ungültiger Kalendertage geprüft.
- Öffentliche Leser: Besucherinput, globaler Kontext, untrusted Proposal, Draft-Methodenrevision, Quellenentscheidungsrecord, Versions-/Transitionsrecord, Jobrecord und öffentliche Projektions-/Antwortrecords.

Quellenentscheidung und Konfliktauflösung enthalten exakte Evidence-/Kontext-/Methodenreferenzen. Optionale Nichtverfügbarkeit darf eine weiterhin klare Pflichtquelle nicht allein blockieren. Ein bekannter Konflikt benötigt einen positiven, an dieselbe Methode und den Konflikt gebundenen Auflösungsrecord und später echten Reproof. Ein normalisiertes JSON-Objekt stellt diesen Reproof nicht her.

## Sicherheits- und Integrationsgrenzen

Es gibt keine Änderungen an Datenbank, SQL, Auth, RLS, ACL, Sessions, Credentials, Provider, Scheduler, Routen oder Navigation; keine neuen Abhängigkeiten und keine neuen laufenden Kosten. Register und produktive Ports bleiben unbound. Die konkrete Methode bleibt `DRAFT`/`NOT_APPROVED`. Ein separat besessener, später zu bindender Methoden-Autoritätsport wird als Anschluss beschrieben; Proposal-JSON kann ihn nicht ersetzen.

Der Legacy-Store schließt bedingte Schema-1- sowie Schema-2-Fakten aus. S0 dokumentiert diese Inkompatibilität; kein Cast, keine Reduktion auf einen unbedingten Fakt, keine Integration von #1135. Die Grenzen #917/#1139 und #1131 bleiben unberührt.

## Prüfung und Übergabe

Gezielte Node-22-/tsx-Tests behandeln Normalisierung, unbekannte Länder, gemischte Staatsangehörigkeitszustände, fehlende und widersprüchliche Quellen, ungültige Kalendertage, Zeitgrenzen, Kontext-/Versionsbindung, JSON/Getter/Zyklen/Größen/PII und Versuch einer selbstbehaupteten Autorität. Danach gezieltes Lint und TypeScript; reale Kommandos und Ergebnisse stehen im Self-Review/Handoff. Kein Build-/CI-/Production-Erfolg wird ohne Lauf behauptet.

Root prüft die gelieferten Bytes unabhängig und friert S0 für I1/U1/M1 ein. Der Autor committet oder pusht nicht, setzt kein Ready, mergt nicht und beginnt keinen Folgeslice. STOP nach Übergabe; derselbe Autor bleibt für unmittelbare Review-Fixes erreichbar.

## R2-Präzisierung im selben Scope

Der unabhängige [TL-Review R2](https://github.com/Jetnity/jetnity/pull/1163#issuecomment-6728933459) präzisiert historische Auflösungsdaten, fortschreibbare begrenzte Konflikthistorie und kompatible nicht identische Aussagen. Die Korrektur bleibt vollständig in denselben S0-Dateien: eigener gesetzlicher Tag am historischen Auflösungsrecord; begrenzte reine Archivseite mit exakter Vorgänger-/Entfernungsbindung und unbound Archivanschluss; normalisierte unbedingte Legacy/V1/V2-Gleichheit sowie methodengebundener kompatibler Vergleichsrecord. Hinzu kommen die konkreten Regressionen für Dokumentunabhängigkeit, wiederverwendbare Evidence unter mehreren Bedingungen und Quellenanzeige aus dem gepinnten Registry-Snapshot. Kein kanonischer Reader wird gelockert und keine Archiv-/Datenbankoperation ausgeführt.

## R3 — neutrale Discovery unbekannter Kombinationen

Der [TL-Auftrag R3](https://github.com/Jetnity/jetnity/pull/1163#issuecomment-6729202622) erweitert denselben S0-Scope auf Basis des publizierten Heads `19c4736a73f639daaf5337465386155607792a4f`. Eine vollständig unbekannte Zielland-/Staatsangehörigkeitskombination hat noch keinen globalen Regelkontext. Sie benötigt deshalb eine eigene methodengebundene Discovery-Identität, ohne Dokument, Route, Zweck, Faktart oder gesetzliche Aussage zu erfinden. Mehrere Staatsangehörigkeiten ergeben getrennte Einzelpaare.

Geplant sind zwei kleine öffentliche Funktionen: `createV3CombinationDiscoveryIdentity` normalisiert genau das Länderpaar und die Methodenreferenz und bildet einen getrennten Deduplizierungsschlüssel; `readV3CombinationDiscoveryJobRecord` liest die eigene Jobhülle mit derselben Revision-/Lease-/Attempt-/Backoff-Prüfung wie Regeljobs. Erfolgreiche Discovery trägt ausschließlich eine eigene Ergebnisreferenz. Ein solcher Record beweist weder tatsächliches Enqueue noch gefundene oder angenommene Regeln.

Die bestehende PublicResponse-Form bleibt kompatibel. Eine zusätzliche explizite `jobKind: 'combination_discovery'`-Pending-Variante enthält die geprüfte Discovery-Identität und bindet deren Schlüssel an Zielland und Staatsangehörigkeitszelle. Die vorhandene Regel-Pending-Form behält ihre Bedeutung und darf optional `jobKind: 'rule_research'` nennen. Ein Namespacewechsel oder Regeljob kann keine Discovery-Bestätigung ersetzen; U1/M1 benötigen weiterhin die tatsächliche Bestätigung ihres separat besessenen Jobports.

Geändert werden ausschließlich die bisherigen fünf S0-Dateien. Bounded JSON, Länder-, Methoden-, ID- und Zeitprimitive werden wiederverwendet; die bestehenden Lifecycle-Felder und Prüfungen werden intern gemeinsam genutzt. Keine Datenbankänderung, Abhängigkeit, neue Laufzeitbindung, Queue, Worker, Kosten oder Aktivierung. Risiken sind vertauschte Jobarten, ungebundene Pending-Identitäten und versehentliche Rechtsdefaults; fokussierte Positiv-/Negativtests decken genau diese Grenzen einschließlich Lease-Reclaim, Backoff, PII und Größen ab. Danach Node-22-Vertragstests, TypeScript, Lint und Exporthygiene; Root prüft und pinnt die neuen Bytes erneut.
