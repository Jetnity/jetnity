# Product Owner – verbindliche Review-Tiefe

Stand: 22. August 2026
Status: **verbindlicher Product-Owner-Nachtrag für PR #35 und alle folgenden Jetnity-Arbeiten**

Der Product Owner hat ausdrücklich festgelegt:

> **Jeder neue Chat und Agent muss Jetnity mindestens so gründlich prüfen wie der aktuelle unabhängige Senior-Review.**

Die globale Regel ist auf `main` in `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und `docs/CONTINUITY_STANDARD.md` verankert.

Für PR #35 gilt deshalb zusätzlich:

- Abschlussmeldungen, grüne Tests, CI und Preview ersetzen keinen unabhängigen Review.
- Der tatsächliche Head, relevante Live-DB-Grenzen und Production-Abstand werden selbst verifiziert.
- Reviews suchen aktiv nach nicht getesteten Source-of-Truth-, Legacy-, Delete/Reload-, Guest→Account-, Provider-/Evidence-/Fingerprint-, DB-/RLS-/Parallelitäts-, Cross-Domain-, Device- und Deployment-Problemen.
- Fixes werden erneut unabhängig geprüft; ein Fix darf nicht nur den gemeldeten Symptomfall schließen.
- Bekannte hochwirksame Fehler blockieren Merge auch bei vollständig grünen Tests.
- Relevante Findings und Review-Runden bleiben versioniert.

Dieser Nachtrag ändert den Foundation-E-Produktscope nicht. Er muss bei der späteren Synchronisierung mit `main` semantisch erhalten bleiben; die globale `main`-Policy ist danach die maßgebliche dauerhafte Quelle.

PR #35 bleibt Draft. Kein Mark Ready, kein Merge und keine Production-Migration ohne die bestehenden separaten Gates.
