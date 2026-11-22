# Externe Paketprüfsumme — CH→AT Production PREPARED ONLY

**Keine Production-Abfrage, keine Production-Installation, kein COMMIT-Go.**
Die 14 im `MANIFEST.json` genannten Dateien sind einzeln erneut aus GitHub im bestehenden Featurezweig gelesen, bytegenau in einer separaten **Dev-only READ ONLY/ROLLBACK**-Hashprüfung nachgerechnet und mit `SHA256SUMS` und Manifest verglichen. **14/14 stimmen überein**.

- Manifest `MANIFEST.json` SHA-256: `2ebacfbd01ea8f4349d4e6b435ef6fcf219852536ce2fb23826a1391230e93a9` (5491 Bytes).
- Checksum-Liste `SHA256SUMS` SHA-256: `0e794bfa7c725f606c3cf85c2b16ab78a438a22f445973d4a33bf27314891922` (2655 Bytes).
- `00-PRODUCTION-PREFLIGHT.READONLY.sql` SHA-256: `2bd2163109d408f8d06a104eee15a926bde9abfef3f14e82af833a6f32aba5ec`.
- `40-PRODUCTION-POSTCOMMIT.READONLY.sql` SHA-256: `8b7d5f287f6bce9b733f1b564f61f86cf96cc9306c95e469701dca97741a2e84`.
- `50-PRODUCTION-VISITOR-READBACK.ROLLBACK.sql` SHA-256: `f6462240e13df799080bb85b8e684662f9f5d9d83012da64977c2d05075d75f6`.
- `ROLLBACK_PLAN.md` SHA-256: `cde17e31a9d35bdc08e6a46b85e9e1c1124a9766ecd47ecd23575609704dc695`.
- Dev-v12-Installationsreferenz (nicht für Production ausführbar) SHA-256: `35083e5b631f55fa96041137924f693da18865ea8d18f12d7727816924c21436`.

**Gegenstand und Grenze:** Dies ist eine unabhängige *Dateiidentitäts*-Bestätigung und kein Production-Schema-, Rollen-, Kunden- oder Rollback-Abnahmelauf. Es gibt keine ausführbare Production-COMMIT-/Rollback-Datei, da der erforderliche aktuelle Production-Parent nur über eine **separat zu genehmigende** genau gebundene Read-only-Prüfung festgestellt werden darf. Ein späterer Installer bekommt eigene neue SHA-256 und eigene QA/GO; Dev-/BG1-/AAL2-Quittungen werden nicht nach Production übertragen.
