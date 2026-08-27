# Jetnity – PR #108 Post-Merge / New-Chat Checkpoint

Stand: 27. August 2026  
Status: **POST-MERGE CONTINUITY / AP-4 INTEGRATED / LIVE-EVIDENCE GEWINNT**

> Dieser Checkpoint ist die jüngste Continuity-Evidence nach PR #108. Er ersetzt keine Live-Verifikation. Jeder neue Chat / Technical Lead prüft zuerst den tatsächlichen `main`, offene PRs/Issues, GitHub Actions, Vercel und bei DB-Bezug Supabase.

## 1. Verifizierter Integrationsanker

PR #108 `AP-4 Account Archive Lifecycle` wurde durch ChatGPT / Technical Lead unabhängig auf Exact Head

`88146dd57146515fe9e78417ecb36a93ca311c36`

final reviewed und mit Exact-Head-Schutz gemergt.

Technical-Lead Final-Re-Review: `5045192389` – **PASS**.

Merge-Commit / Integrationsanker:

`70cac163a79c3cd4098a72a0df241eb75c47738f`

Post-Merge-Gates auf exakt diesem SHA:

- GitHub Actions CI Run `33111852882`: **completed / success**
- Job `Auth-Konfiguration gegen config.toml`: **success**
- Job `Typecheck, Lint & Build`: **success**
- Production Build im CI: **success**
- Vercel Production Deployment `dpl_8bvcVH5kCvSFhauw6QooL4xPvuwW`: **READY**
- Vercel Production Deployment SHA: exakt `70cac163a79c3cd4098a72a0df241eb75c47738f`

Wichtig: Durch diesen Docs-Checkpoint entsteht danach ein neuer `main`-Commit. `70cac163...` ist deshalb der verifizierte **AP-4-Integrationsanker**, nicht dauerhaft als bewegliche aktuelle `main`-SHA zu behandeln.

## 2. AP-4 – verbindlicher Endzustand

AP-4 ist **integriert**. Ältere Sätze in AP-4-Status/Handoff/Roadmap wie `Draft-Runtime`, `nicht auf main`, `Re-Review ausstehend` sind historische Pre-Merge-Evidence.

Integriert ist:

- Konto-Reisen können ausdrücklich archiviert werden.
- Archivierte Reisen werden aus Aktiv / Kommend / Vergangen / Ohne Datum getrennt.
- `/reisen` besitzt einen separaten Abschnitt `Archiv`, wenn in der geladenen Auswahl archivierte Reisen existieren.
- Gast-Reisen erhalten keinen Archiv-Lifecycle.
- `/account` behandelt archivierte Reisen weiterhin nicht als `Fortsetzen`.
- Restore erfindet keinen früheren Status.
- Restore-Provenienz: `trips.metadata.account_archive.previous_status` mit exakt `draft | planned | booked`.
- Historische `archived`-Reise ohne gültige Provenienz bleibt fail-closed / nicht automatisch wiederherstellbar.
- Restore entfernt nur `account_archive.previous_status`; andere Metadata und Geschwister unter `account_archive` bleiben erhalten; Namespace nur weg, wenn danach leer.
- Einziger AP-4-Write: `reiseArchivLebenszyklus` über bestehenden `konto()` / `auth.getUser()`-Vertrag und Owner-RLS.
- Kein Service Role, kein `user_id` aus Client-Nutzlast.
- Optimistic Guard matcht gelesenen Status **und** `updated_at`.
- Production wurde read-only verifiziert: Trigger `trips_aktualisiert_am` ist `BEFORE UPDATE` auf `public.trips`; `setze_aktualisiert_am()` setzt `new.updated_at := now()`. Damit schützt der Guard auch gegen konkurrierende Metadata-Updates bei unverändertem Status.
- Keine AP-4-Migration, keine RLS-/Ownership-/Auth-/MFA-/AAL-Änderung.
- Keine erfundene AP-4-Größengrenze für `trips.metadata`.
- TW7-A-Kartenidentität / `TripSummary.stages` / `reiseOrte()` / `stageCount` / `itemCount` bleiben erhalten.

## 3. Review-Funde aus PR #108 – geschlossen

Technical-Lead Review vor dem PASS hatte drei echte Funde:

1. `P1-AP4-TL-01`: Restore durfte nicht den kompletten `account_archive`-Namespace löschen. **Geschlossen.**
2. `P1-AP4-TL-02`: status-only Stale Guard war unzureichend. **Geschlossen durch Status + `updated_at`.**
3. `P2-AP4-TL-03`: unbegründete 8-KB-Grenze für `trips.metadata`. **Entfernt.**

Diese Funde dürfen von späteren Chats nicht wieder als offen geführt werden, sofern Live-Code nicht erneut regressiert.

## 4. AP-4 verbleibende Evidence Debt

Kein Merge-Blocker, aber weiterhin ausdrücklich offen:

- Kein authentifizierter Browser-/Real-Device-Beweis des neuen Archivieren/Wiederherstellen-UI-Flows wurde in AP-4 geliefert.

Dies ist QA-Evidence-Debt, **kein** Grund, die bereits grün integrierte AP-4-Logik als ungeprüft oder nicht integriert zu behandeln. Wenn später ein echter Account-Browser-E2E-Slice existiert, Archivieren → Archiv → Wiederherstellen auf Mobile/Desktop mit echter Account-Session mitprüfen.

## 5. Visitor Search – neu bestätigter Restfehler

Issue #109 ist offen und dokumentiert einen echten Restfehler der bereits integrierten Visitor Search:

`Visitor Search residual: country aliases must outrank same-name cities`

Live-Device-Beispiele vom 27. August 2026:

- `Peru` zeigt gleichnamige Städte statt des Landes vorne.
- `China` zeigt gleichnamige Städte statt des Landes vorne.
- `Schweiz` kann `Schweizer-Reneke` vor dem Land anzeigen.

Production-Daten sind vorhanden, aber kanonische Namen sind u. a. `Republic of Peru`, `People’s Republic of China`, `Switzerland`; die normalen Nutzerbegriffe liegen als Aliase/Keywords vor. Der aktuelle Ranking-Vertrag kann einen starken Stadt-Namenspräfix gegen einen exakten Länder-Alias zu hoch priorisieren.

Issue #109 ist **nur dokumentierter Follow-up**. Kein automatischer Runtime-Start und nicht in AP-4 ziehen.

## 6. Homepage Hero – Product-Owner-Wunsch weiterhin future

Issue #110 ist offen:

`Homepage Hero future slice: natural multi-destination route intent without redesign`

Verbindliche Richtung:

- aktuelle Hero-Design-/Farbrichtung grundsätzlich erhalten;
- natürliche Eingaben verstehen, z. B. `Peru`, `Lima und Cusco`, `Thailand, Kambodscha und Vietnam`;
- keine IATA-/interne-ID-Kenntnis vom Nutzer verlangen;
- kein großer Planner auf der Homepage;
- kanonische Place-ID-/Trip-Create-/Route-Wahrheit wiederverwenden, keine zweite Orts-/Reise-Truth;
- Ambiguität klären statt still falsch wählen.

Issue #110 ist **nicht automatisch freigegeben**.

## 7. Account / Traveller nach AP-4

- AP-1 / AP-2 / AP-3 / AP-4 sind integriert.
- P1-TA-02 bleibt durch PR #84 geschlossen.
- P2-TA-06 (`documents[0]`-Fallback bei fehlenden `credentialOptions`) bleibt ein latentes Legacy-/Future-Caller-Risiko; nicht automatisch vorziehen.
- AP-7 Account-Traveller-Registry bleibt gated: Shared-Contract-/Product-Owner-/Identity-/RLS-/Sensitive-Data-Entscheidung nötig; nicht still starten.
- Kein automatischer AP-5-Folgeslice nur weil AP-4 abgeschlossen ist.

Traveller-Wahrheit bleibt:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass, keine Default-Citizenship, issuer ≠ citizenship.

## 8. Andere Workstreams

Kein anderer Workstream erhält durch den AP-4-Merge automatisch eine Freigabe.

- Trip Workspace: TW7-A integriert; TW-8 nicht automatisch freigegeben.
- Provider: S5-A integriert; S5-B nicht automatisch starten.
- Admin: Production-AAL2 `20260827170000` ist angewendet und verifiziert, exakt einmal. Kein zweiter Apply.
- Growth/Discoverability: kein automatischer Folgeslice.
- Native: spätere Phase.
- Guardian / What-if Simulator: spätere Programme, nicht vorziehen.

## 9. Merge-/Agenten-Governance

Weiter bindend:

- **Autonom mergen ist erlaubt. Blind mergen ist verboten.**
- Feature-/Audit-Autor ist nicht unabhängiger Finalreviewer.
- Exakter Cursor-Anzeigename verwenden.
- Neue logische Arbeitseinheit → Rotation gemäß `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md`, wenn dort gefordert.
- Kein automatischer Folgeslice.
- Live-Evidence gewinnt über diesen Checkpoint.
- Jede materielle Aktion im Repository persistieren.

Für AP-4 ist `Account plattform audit vorbereitung 3` nach Merge abgeschlossen. Ein späterer neuer Account-Slice ist eine neue logische Arbeitseinheit und darf nicht still als Fortsetzung dieses Agenten behandelt werden.

## 10. Bekannte Governance-Risiken

Zum Zeitpunkt des AP-4-Finalreviews war `main` weiterhin nicht branch-protected. Dieser Punkt bleibt live neu zu verifizieren und ist nicht durch AP-4 behoben.

## 11. New-Chat Start

Ein neuer Chat / Technical Lead:

1. liest zuerst `JETNITY_START_HERE.md` und die dortige Governance;
2. liest anschließend diesen Checkpoint als jüngste Post-PR-#108-Continuity;
3. verifiziert live aktuellen `main`, offene PRs/Issues, CI, Vercel und relevante Supabase-Wahrheit;
4. behandelt ältere AP-4-Draft-/Pre-Merge-Sätze ausdrücklich als historische Evidence;
5. bestimmt erst dann den nächsten Slice aus Build Order + aktuellen Product-Owner-Entscheidungen;
6. startet **nicht automatisch** #109, #110, AP-7, P2-TA-06, TW-8, S5-B oder einen anderen Folgeslice.
