# Official Truth Produktziel V3 — Implementierungsprogramm V1

**Product-Owner-Auftrag 9. November 2026, Europe/Zurich.** Der Owner beauftragt jetzt ausdrücklich Code, Tests und PRs für das Produktziel V3, parallel wo technisch unabhängig, zuerst ein gemeinsames Datenformat. Damit ist die frühere Plan-only-/kein-Folgeslice-Grenze für diese benannten Implementierungen aufgehoben. **Datenbank- und Production-Aktivierung bleiben bis zur ausdrücklichen Freigabe von Dev-Paket und konkreter Methode gesperrt.** Keine Methode genehmigt sich selbst; automatisch werden später Regeln innerhalb einer einmal genehmigten Methode geprüft.

## Verifizierte Baseline
main `ce3366e26de73961d4682236af92347bfc3a4ca8`, Tree `34550fc83fb64cc27c08e0cb918a2f0a20cb648b`; NORMAL, Ruleset21875372 unverändert. Main-CI42532553997 success, Production dpl_8PHbgbvk281DiTv1XV9AkAanRq8H READY auf dieser SHA. [V3-Checkpoint](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6728501636), [Produktplan](https://github.com/Jetnity/jetnity/blob/ce3366e26de73961d4682236af92347bfc3a4ca8/docs/audits/official-truth-dev-package-1-2026-11-08/PRODUCT_TARGET_PLAN.md). Alle vorhandenen zwölf PRs sind Draft; insbesondere #1131 und #1135 werden weder übernommen noch still integriert. Ändert sich main, wird Drift geprüft.

## Reihenfolge und grobe Aufwandsschätzung
Schätzungen sind Engineering-Aufwand einschließlich fokussierter Tests/Review, keine Laufzeitzusage.
- **S0 Gemeinsamer Vertrag und Testkorpus:** 2–4 Arbeitsstunden. Anbieterneutraler Proposal-/Methoden-/Quellenentscheidung-/Versions-/Cache-/Job-Vertrag, Runtime-Validierung, Datenminimierung. Ein Contract-Owner. Erst Review/Freeze, dann parallele Implementierung.
- **I1 Import und Proposal-Schnittstelle:** 1–2 Arbeitstage. Strikte Quarantäne, deterministische V3-Prüfung, optionaler Gegenbeleg, relevante Konflikte/Eskalation, Idempotenz und Integration in vorhandene Proof-/Accepted-Store-Grenzen.
- **U1 Besucherabfrage und vorberechnete Projektion:** 0,5–1,5 Arbeitstage. Zielland+mehrere Staatsangehörigkeiten, getrennte bedingte Antworten, Stand/Quelle, ehrlich gekennzeichnete Testdaten im isolierten Testweg, Cache-/pending-/error-Zustände; keine öffentliche Navigation/Aktivierung.
- **M1 Überwachung, Versionierung, Queue und Recovery:** 1–2 Arbeitstage. Endliche überwachte Quellenjobs, Änderungserkennung, unveränderliche Prüfspur, CAS/Deduplizierung/Lease/Backoff, Konflikterhalt, nachweisgebundene Wiederannahme/Rollback; deaktivierte Adapter und isolierte Tests.
- **E1 Integration und Abnahme:** 1–2 Arbeitstage nach den parallelen Teilen. Echte Verbindungen zwischen Proposal→Verifier→Versions-/Cacheprojektion→Besucherzustand und Miss→Research-Port→erneute Prüfung in lokalen Testumgebungen; Fehler-/Konkurrenz-/Privacy-/Performance-Tests; p95 messen und Server-/Netz-/Rendergrenzen ehrlich trennen.
- **D0 #917/#1139 Dev-Paket:** parallel, zunächst 2–4 Stunden Evidenz-/Artefakt-Abgleich. Kein seriöser Abschlusstermin für fehlende Zielnachweise oder bestehende Plattformgrenzen. Keine Erledigt-Markierung ohne tatsächlichen Nachweis.

Erste überprüfbare Gesamtfassung grob 3–5 Arbeitstage bei Parallelität und verfügbaren Werkzeugen; Aktivierung ist nicht darin zugesagt.

## Verbindlicher gemeinsamer Datenvertrag S0 — TASK V1
**Logischer Autor:** Jetnity Official Truth V3 Shared Contract 1 — Codex Generation 1.
Geplanter Bereich `lib/readiness/official-truth-product-v3/`; S0 besitzt nur `contract.ts`, `contract.test.ts`, `fixtures.ts` (nur klar synthetische Daten ohne real wirkende Visa-Aussage) und `docs/official-truth-product-v3/S0_*.md`. Der genaue Dateiplan wird nach bestehenden Verträgen abgeglichen; keine neuen Migrationen oder RPCs in S0.

Acceptance Criteria:
1. Vorhandene Staats-/Requirement-/Quellen-/Claim-/Research-Identitäten und Validierungsregeln lesen und wiederverwenden. Neue Envelopes müssen eine explizite Kompatibilitätszuordnung haben; keine zweite konkurrierende Truth-Registry.
2. Striktes versioniertes, anbieterneutrales Proposal-Format mit globalem Regelkontext, Job/Operation-ID, strukturierten untrusted Vorschlägen und Quellenreferenzen. Researcher kann weder accepted/trusted, Registryfreigabe, Methode/Owner-Claim noch Schreibberechtigung liefern. Unknown keys/zu große/tiefe Payloads/PII-Felder ablehnen; Fehler spiegeln keine Payloads.
3. Besucherinput ausschließlich Zielland plus deduplizierte/sortierte Staatsangehörigkeiten, begrenzte Menge, gültige Ländercodes. Keine Passnummer/MRZ/Fotos, Nutzer-/Trip-/Session-ID, versteckter Fragebogen oder stiller bester-Pass-Default.
4. Regelbedingungen bleiben globale strukturierte Bedingungen; keine persönliche Einreisezusage. Mehrere Staatsangehörigkeiten behalten getrennte Ergebniszellen und Versionsreferenzen.
5. Methodenrevision und ihr Status getrennt von Vorschlägen. Die konkrete Methode bleibt DRAFT/NOT_APPROVED; Produktionsregister/Adapter bleiben disabled/unbound. Der Vertrag selbst ist keine Zustimmung.
6. V3-Quellenentscheid unterscheidet klare qualifizierte Zielland-Primärquelle, unklare Pflichtquelle, echte vergleichbare Konflikte und normale optionale Gegenprüfungsabwesenheit. Optionales Fehlen/Ausfall allein kein Blocker; bekannte echte Konflikte benötigen positiven methodengültigen Auflösungsbeleg. Primär-/Gegenquellenidentität, Kontext, Zeit und rechtliche Gültigkeit binden; keine Mehrheitsentscheidung.
7. Versionierte unveränderliche Evidence-/Decision-/Projection-Referenzen, predecessor/CAS, operations id, withdrawal/conflict/reaccept/recovery-Pläne. Kein neuer Hash oder Boolean wird als Herkunftsautorität behandelt; serialisierter Input ist kein Trusted-Receipt.
8. Public Response: accepted/pending/conflict/unavailable/error beziehungsweise passend benannte ehrliche Zustände; Stand ist Quellenprüfzeit, nicht Cachebauzeit. Fehlende zweite Staatsangehörigkeit darf nicht durch ersten Treffer verdeckt werden. Queue-Auftrag deduplizierbar, keine genau-einmalige Zusage.
9. Sinnvolle adversariale Vertrags-/Normalisierungs-/Zeit-/Mehrfach-/Privacy-Tests in bestehender Node/tsx-Testkonvention. Kein Secret/Netz/DB für S0. Keine bestehende Suite abschwächen.
10. Selbstprüfung mit echten Befehlen/Resultaten, Dateiliste, Risiken, offene Integrationsgrenzen und Hand-off. Root prüft unabhängig und friert exakte Bytes vor I1/U1/M1 ein.

## Multi-Agent Suitability
**MULTI_AGENT mit serieller S0-Foundation.** Jetzt S0-Code, unabhängiger Wiederverwendungs-/UI-/Monitoring-Read-only-Abgleich und D0-Dev-Paket-Evidenz parallel. Nach S0-Review drei getrennte Autoren für I1/U1/M1. Disjunkte Ownership; shared contract nur S0-Owner über versionierten Review-Fix. Root koordiniert Integration/Architektur-/Entscheidungsdocs. Jeder unabhängig reviewbare Slice eigener Branch/Draft-PR; abhängige Branches dürfen nur auf ausdrücklich gepinntem S0-Head basieren. Keine heimlichen Imports aus anderen offenen Drafts.

## Harte Grenzen für alle Autoren
- Bestehende #917-Plattformgrenze und #1131-Ready-STOP bleiben eigenständig. Kein Retry, Umformulieren, Alternativoperator, delegierter Datenbankaufruf oder menschlicher Ersatz-SQL-Lauf.
- Keine Hosted-DB-/Auth-/RLS-/ACL-/Migration-/Credential-Abfrage oder -Mutation, kein Apply, keine Provider-/Researcher-Livecalls, kein Scheduler starten, keine neuen Kosten/Secrets.
- #917/#1139 nur anhand zulässig vorhandener Artefakte vorbereiten; fehlende tatsächliche Ziel-/Recovery-Evidence nicht erfinden. Vorhandenen #1142-Kandidaten wiederverwenden.
- Ausführbarer Code und lokale synthetische Tests sind erlaubt; DB-/Production-Aktivierung erst nach Ownerfreigabe des vollständigen Dev-Pakets und der Methode. Preview darf keine tatsächlichen DB-/Provider-Aufrufe ermöglichen; #968 beachten.
- Untrusted Research niemals als amtliche Wahrheit anzeigen. Beispielmaterial ausschließlich in isolierten Tests, mit deutlicher Testkennzeichnung; kein produktiver Fallback auf Fixtures.
- Keine Änderungen an fremden Workstreams, zentraler Governance/CI/Dependencies oder bestehender Rechte-/Sessionlogik ohne expliziten Teilauftrag.
- **do not mark Ready; do not merge; do not start a follow-up slice.** Nur Root/TL darf PASS/Ready/Merge entscheiden. Bei CHANGES REQUIRED derselbe Autor/dieselbe Session, neue Head-Gates.
- STOP nach Lieferung des eigenen benannten Umfangs. Kein Agentenselfreview ist TL-PASS.

## Deliverables
Code+Tests statt weiterer reiner Planung; versionierte Task-/Status-/Handoff-Evidence, Draft-PRs, exakte Heads, klare erreichbare und noch ungebundene Grenzen. Erst Root-TL-Review macht ein Modul akzeptierbar; kein automatischer Launch.
