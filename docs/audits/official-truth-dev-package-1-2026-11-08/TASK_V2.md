## TASK DEV-PACKAGE-1 V2 — verbindliches Automatisierungsziel und bestehendes #917/#1139-Paket

**8. November 2026. Neue ausdrückliche Owner-Steuerung während des V1/R1-Finalreviews.** Sie erweitert den aktuellen Auftrag; #917 und #1139 bleiben der erste Schritt. V1/R1 wurde von beiden unabhängigen Reviewern auf seinen sieben eingefrorenen Dateien ohne materielle Findings geprüft. Diese historischen Dateireviews gelten nicht automatisch für neue V2-Bytes. Veröffentlichung steht noch aus; main bleibt 608414441651b407cf56ab976c1cd116db45de0c.

### Verbindliches Product-Owner-Zielbild

1. Einreisebestimmungen sollen vollautomatisch nach einer einmal vom Owner genehmigten Methode freigegeben werden. **Keine Owner-Einzelfreigabe pro Regel.** Nur amtliche Primärquellen; mindestens zwei übereinstimmende Quellen. Widerspruch oder Unsicherheit bedeutet keine Veröffentlichung, verständlichen Hinweis und Eskalation an Sasa.
2. Jede Regel besitzt strukturierte Fakten mit Quellen, Abrufdatum, Gültigkeit und Version.
3. Laufende automatische Quellenüberwachung, Änderungserkennung, Prüfung und Aktualisierung mit Versionierung, Prüfspur und Rollback.
4. Recherche durch das Grok-Team oder austauschbare andere Anbieter liefert ausschließlich Vorschläge an eine feste anbieterunabhängige Schnittstelle. **Nur ein Jetnity-eigener Import-Dienst prüft und schreibt akzeptierte Daten in die Datenbank.** Kein direkter Live-Schreibzugang für Researcher, TL oder KI; Betrieb muss von bestimmten Menschen, Chats und Modellen unabhängig sein.
5. Besucher geben Zielland und eine oder mehrere Staatsangehörigkeiten an. Antwort aus vorberechnetem Cache, Ziel unter einer Sekunde, mit „Stand vom …“ und amtlicher Quelle. Keine Passnummern, MRZ oder Passfotos speichern; personenbezogene Reisedokumentdaten sind kein Bestandteil dieses Zielbilds.
6. Für fehlende Kombinationen: „wird geprüft“, automatische Hintergrundrecherche, dieselbe Prüfung und danach Speicherung/Anzeige. Cache-Miss darf keine schwächere Vertrauensschwelle erhalten.

Die Timatic-/Sherpa-Nennung beschreibt den angestrebten professionellen Standard; dieses Paket behauptet weder deren konkrete technische Implementierung noch bereits erreichte funktionale Gleichwertigkeit.

### Wirkung auf bestehende Gates

Der feste Zielvertrag ersetzt ein etwaig angenommenes dauerhaftes Modell „Owner genehmigt jede einzelne Regel“. Die einmalige Methodenfreigabe mit versionierten Kriterien und die Ausnahmeeskalation bleiben menschliche Entscheidungen. Einzelfreigaben dürfen nicht als versteckte Standardvoraussetzung in Registry/Accepted Store/Import/Caching fortgeschrieben werden.

Die tatsächliche Stage1-Lücke, der spezielle historische Plattform-STOP, die noch ungeprüfte wirksame #1139-Änderung und konkrete Auth-/DB-/Rollout-Freigaben bleiben erhalten. Die neue Produktentscheidung erlaubt keine ungeprüfte Migration, keine Wiederholung des verweigerten Readbacks und keine Provider-/Production-Aktivierung. Ein vorhandener menschlicher Owner/AAL2-Guard darf weder entfernt noch durch gefälschte menschliche Claims zur Maschinenautorität umgedeutet werden.

### Rollen / Lieferung / Scope

Derselbe Autor bleibt **Jetnity Official Truth Dev Decision Package 1 — Codex Generation 1**, Session **/root/dev_package_writer**. Unmittelbare Überarbeitung in derselben Session, neue Paketversion **V2/R0**. Kein Cursor-UI-/Rename-Beleg; Cursor bleibt pausiert.

Paketpfad bleibt docs/audits/official-truth-dev-package-1-2026-11-08/. Autor besitzt weiterhin DEV_PACKAGE.md, TARGET_EVIDENCE_MATRIX.json, POSTCHECK_AND_RECOVERY.md, HANDOFF.md und neu **PRODUCT_TARGET_PLAN.md**. Root besitzt TASK.md (V1 historisch unverändert), neu **TASK_V2.md**, STAGE1_ACCEPTANCE_REPORT.md, SOURCE_MANIFEST.json und REVIEW.md. Damit genau zehn Dokumentationsdateien, keine Produktcode-/SQL-/Migrations-/CI-/Governance-Änderung.

Reviewer /root/release_live_audit liest die tatsächlichen Registry-/Accepted-Store-/Owner-Capability-Verträge und aktuellen relevanten PR-/Issue-Gates am gepinnten main und liefert genaue Sourcezuordnung. Reviewer /root/blocker_evidence_review bewertet Autoritätsgrenzen, feste Produktkriterien, Privacy, offene Entscheidungen und den abschließenden Gesamtstand. Root prüft unabhängig, persistiert und entscheidet allein über Ready/Merge.

### Zusätzliche Akzeptanzkriterien

A. PRODUCT_TARGET_PLAN.md hält die sechs Owner-Vorgaben ausdrücklich als verbindliches Ziel fest und unterscheidet vorhandenen Code, noch inerte/ungeprüfte Teile und geplante Anpassungen. Genaue gepinnte Quellen für Registry, Accepted Store, Owner-Capability und relevante Reader-/Cache-/Missing-Kombination-Verträge verwenden; keine erfundenen vorhandenen Features.

B. Konkrete Änderungsmatrix mit Wiederverwendung/Anpassung/Neubau, Abhängigkeiten und Akzeptanzbelegen. #917-Stage1 und #1139 bleiben erster technischer Schritt. Danach nur geplanter Ablauf, kein automatisch gestarteter Folgeslice.

C. Vendorneutrale Proposal-Schnittstelle und getrennte Autorität beschreiben: Recherche ohne DB-/Publishrecht; Jetnity-Prüfer/Import-Dienst mit eng definiertem Maschinenvertrag; menschliche Methodengovernance und Administration über geschützte eigene Autorität. Bestehenden Owner-Session-P1 schließen, ohne einen Dauerzwang zu manuellen Regelfreigaben oder pauschale Service-Role-Umgehung zu bauen. Auswirkung auf bestehende kryptographische/akzeptierte Proof-Verträge ausdrücklich benennen.

D. Zwei amtliche Quellen müssen dieselbe normalisierte Behauptung im gleichen Anwendungs- und Gültigkeitskontext stützen. Mehrere URLs/Modellantworten sind nicht automatisch unabhängige Belege. Noch nicht vom Owner entschiedene Details als Vorschlag/Methodenentscheidung kennzeichnen, die Mindestzahl zwei unverändert lassen. Konflikt, fehlende Bedingungen, unklare Gültigkeit oder veraltete Evidence verhindern Veröffentlichung; keine Ausnahme durch Modellkonfidenz.

E. Fakten-/Provenienz-/Methoden-/Regel-/Cache-Versionen, idempotente Verarbeitung, automatische Überwachung, Rückzug/Invalidierung, Prüfspur und sichere Wiederherstellung planen. Rollback darf keine inzwischen unzulässige/veraltete Regel wieder aktivieren. Vorhandene atomare Versions-/Persistenzverträge nach Möglichkeit verwenden.

F. Mehrfachstaatsangehörigkeiten ohne stillen „günstigsten Pass“-Schluss behandeln; Annahmen zu Reisezweck/Dauer/Transit/Reisedokumenttyp und tatsächlich verwendeter Staatsangehörigkeit sichtbar machen. Nur die wirklich produktentscheidenden offenen Punkte mit Empfehlung auflisten. Verbindliche Owner-Entscheidungen nicht erneut zur Disposition stellen.

G. Cacheantwort-Ziel unter einer Sekunde als messbares SLA/SLO mit getrenntem Recherchepfad konkretisieren; keine ungemessene Leistungsbehauptung. Cache-Miss erzeugt deduplizierte Hintergrundarbeit und ehrlichen Pending-Status. Cache-Schlüssel/Invalidierung dürfen keine verschiedenen Regelkontexte vermischen. Datenschutz auch für Proposal-Payloads, Cache, Logs, Fehler und Hintergrundjobs berücksichtigen; keine Passdaten erforderlich.

H. Bestehende Dev-Paket-/Stage1-/Recovery-Ergebnisse erhalten und neue Zielarchitektur sauber abgrenzen. Dokumentreview auf allen neun fachlichen Dateien plus abschließendem REVIEW.md, neue Hashbindung; V1/R1-PASS nicht auf V2 übertragen.

I. Verständliche Owner-Antwort: was fest entschieden ist, was an Registry/Accepted Store/#1139 konkret angepasst werden muss, was bereits belegt ist, was noch eine echte Entscheidung braucht und warum aktuell keine menschliche SQL-Ausführungsanleitung vorliegt. Keine pauschale neue Zustimmung.

### Erhaltene STOP-Grenze

Nur Repository-/bereitgestellte Artefakte, bestehende CI-Logs und öffentliche Primärquellen lesen; lokale Offline-Analyse erlaubt. Keine Datenbankabfrage, SQL-Ausführung, Auth-/Konto-/Sessionaktion, Credential-Abfrage, neue Hosted-Supabase-Inventur, Ersatzweg für die verweigerte Aktion, Provideraktivierung oder neue laufende Automatisierung. Normale spätere automatische CI eines Dokumentations-PR wird separat am tatsächlichen Head bewertet.

**Autoren RETURN/STOP: Do not mark Ready. Do not merge. Do not start a follow-up slice.**
