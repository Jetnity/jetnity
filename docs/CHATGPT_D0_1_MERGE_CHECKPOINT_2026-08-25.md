# ChatGPT / Technical Lead – D0-1 Merge Checkpoint

Stand: 25. August 2026  
Status: **D0-1 integriert / Product-Owner-freigegeben / post-merge Continuity läuft**

## 1. Verbindliche Live-Baseline

Aktueller `main` nach Product-Owner-freigegebenem Merge von PR #70:

`083eda22189e1dad8bd70413889d2486755d7fe6`

PR #70: **MERGED**  
Merge-Commit: `083eda22189e1dad8bd70413889d2486755d7fe6`  
Finaler freigegebener PR-Head: `549f3de1a44020641d1cad2c13a6a1a08086847d`

Vor dem Merge erneut verifiziert:

- PR mergeable;
- Exact-Head GitHub Actions Run `32906411630`: SUCCESS;
- Vercel Preview `dpl_CNJ2iLyGM9e6AA5UdGX47PCta6zd`: READY;
- 0 offene Inline-Review-Threads;
- unabhängiger Technical-Lead Final Review: TECHNICAL PASS;
- Product Owner hat PR #70 ausdrücklich aktuell zum Merge freigegeben.

Vercel Production nach Merge:

- Deployment `dpl_7Qvwxrtc7NHQCWLLzrdmNsfFKfjt`;
- Target `production`;
- Commit `083eda22189e1dad8bd70413889d2486755d7fe6`;
- Status: READY;
- Alias enthält `jetnity-app.vercel.app`.

## 2. Integrierter D0-1-Scope

D0-1 – Index Boundary Contract ist nun auf `main` integriert:

- `/reisen` und `/reisen/[tripId]` liefern HTML `noindex, nofollow`;
- `/reisen` wurde aus der öffentlichen Sitemap entfernt;
- robots-Allow-Modus schützt Reise-/Auth-/sensitive D0-1-Pfade;
- localhost / `*.vercel.app` / `NEXT_PUBLIC_ALLOW_INDEXING` Kill-Switches bleiben erhalten;
- `/planen` ohne akzeptierte Intent-Keys bleibt die öffentliche Basis;
- sobald `idee`, `ziel` oder `zielId` als akzeptierter Key vorhanden ist, wird die konkrete `/planen`-Response `noindex, nofollow` – auch bei leerem Wert, Whitespace, key-only oder Array;
- `/admin/login`, `/unauthorized` und das `(admin)`-Layout sind App-Router-kompatibel `noindex`;
- der tote `app/(admin)/admin/head.tsx` wurde entfernt;
- gezielte SEO-/robots-/sitemap-Regressionstests sind integriert.

Der frühere Technical-Lead-Blocker `P2-D0-1-TL-01` ist geschlossen.

## 3. Nicht verändert

D0-1 erzeugte keine Änderung an:

- Datenbank / Production-Migrationen;
- RLS / Ownership;
- Auth / MFA / Sessions / Guest→Account;
- Traveller / Multi-Citizenship / Multi-Document;
- Route / Transit;
- Provider / Secrets / paid calls;
- Payments;
- Tracking / Analytics / CRM / Ads;
- laufenden Kosten.

## 4. Governance

PR #71 – `docs: restore Product Owner merge governance` – wurde zuvor mit ausdrücklicher Product-Owner-Freigabe gemergt.

Seitdem gilt kanonisch:

> **Technisch fertig = review-bereit. Product Owner entscheidet Ready/Merge.**

Kein Technical-Lead-PASS, grüne CI, Vercel READY, Mergeability oder fehlende Review-Threads ersetzt die aktuelle ausdrückliche Product-Owner-Merge-Freigabe.

## 5. Offene D0/G0-Findings nach D0-1

Geschlossen durch D0-1:

- D0-P1-01;
- D0-P1-02;
- D0-P2-03;
- P2-D0-1-TL-01.

Weiter offen und nicht still in D0-1 erweitert:

- **D0-P1-03** – `/privacy` und `/terms` sind 404; eigener Legal-/PO-Slice, keine Rechtstexte erfinden;
- **D0-P2-01** – deny-all / Sitemap-/Host-Semantik widersprüchlich;
- **D0-P2-02** – Canonical-/Origin-Vertrag fehlt, `NEXT_PUBLIC_APP_URL` vs `NEXT_PUBLIC_SITE_URL`;
- **D0-P2-04** – Locale-/hreflang-Architektur fehlt;
- **D0-P2-05** – strukturierte Entity-Daten/JSON-LD Foundation unvollständig;
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02.

## 6. Nächste technische Kante

Trip Workspace darf weiterhin nicht blind mit TW-6 fortgesetzt werden:

- TW-6 benötigt dokumentierten Product-Owner-Schnitt + Guest-One-Trip-Vertrag;
- TW-7 hängt an Account-/Hub-Grenzen;
- TW-8 hängt an Provider S5 / realer Commercial Provenance.

Gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md` darf konfliktarme D0-/G0-Grundlagenarbeit früh erfolgen.

Nach Abschluss dieses post-D0-1-Continuity-Slices ist deshalb der fachlich naheliegende nächste konfliktarme Candidate:

**D0-2 – Canonical / Origin / robots-sitemap Consistency**

Das ist noch **kein Runtime-Start**. Vor D0-2 werden eigener Task/Status/Branch/Draft-PR versioniert, Scope und Shared-Contract-Grenzen geprüft und erst dann der zuständige Agent aktiviert.

D0-P1-03 Legal bleibt getrennt, weil Jetnity keine Rechtstexte erfindet.

## 7. Offene globale Risiken

- `main` Branch Protection ist live weiterhin nicht aktiviert;
- historische Draft-PRs bleiben historische Evidence und dürfen nicht als operative Wahrheit dienen;
- QS-1 P2/P3-Findings bleiben Follow-ups;
- Supabase-Development-Migrationen `20260824160000` und `20260824180000` bleiben nicht Production-approved;
- Public-/Custom-Domain-/Indexing-Aktivierung bleibt gesondert gegatet.

## 8. Continuity-Regel

Dieser Checkpoint ist die post-D0-1-Merge-Evidence. `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md` und `docs/ACTIVE_WORK_STATUS.md` werden in demselben docs-only Continuity-Slice auf den tatsächlichen Live-Stand nach PR #70 gebracht.

Kein neuer Runtime-Slice wird aus einem stale Handoff gestartet.
