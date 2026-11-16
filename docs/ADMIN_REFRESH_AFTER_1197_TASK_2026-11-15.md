# Admin-Pakete nach #1197 aktualisieren – 15.11.2026

## Auftrag und Grenzen

Der Product Owner hat nach dem Merge von #1197 ausdrücklich beauftragt, alle vorhandenen Admin-Pakete auf den neuen Main-Stand zu bringen, Korrekturen zu bündeln und genau einen gemeinsamen CI-Lauf als Freigabekandidat vorzulegen. Die zuvor gesperrten acht Pakete dürfen hierfür integriert werden. Ihre Einzel-PRs bleiben offen; weder Main noch Production werden verändert.

- Bestehende Pakete #1199–#1212 werden in einem isolierten Integrationsbranch zusammengeführt; keine neue Produktphase.
- #1198 bleibt Eigentum des anderen Chats; seine Typen-/Datenbankverträge werden nicht vorweggenommen.
- Keine Supabase-Abfragen, Geodaten-Übertragung oder Ortskatalog-Importausführung. Der externe Runner bleibt ungestartet.
- Keine Anmeldung/2FA, Production-Aktion, Kostenfreigabe oder PR-Merges.
- Kontozähler und CMS/Kampagnen bleiben bei nicht erfüllten Datenbank-/Rechteverträgen gesperrt. Der Merge von #1197 ersetzt keine kompatible Installation.
- Übersetzungen waren in den Einzelpaketen grün. Echte Konto-Security-Abnahme wartet auf die Anmeldung des Owners.

## Ausgangsstände

Verifizierter Main nach #1197: `b20b4805f882eefe52fe35d049a6db6720807a2a`.

| Paket | Branch | Eingebundener Quellstand |
| --- | --- | --- |
| #1199 | `feat/admin-operations-completion-20261115` | `1ba0c2b45a6a0a89120c240e0e1a89645a6e6355` |
| #1200 | `feat/admin-content-inventory-completion-20261115` | `ac10784a3bc9f0440cdf0e2a45d8391b1034b0dc` |
| #1201 | `feat/admin-native-rental-status-20261115` | `ef6e3e32debf1dd21f322f41c57d2714d34d9365` |
| #1202 | `feat/admin-account-counts-dev-20261115` | `1ef8feb21033f6e326a5077311236ae095519b90` |
| #1203 | `feat/admin-refund-journal-20261115` | `89f8a8904fb713f706f6787085020c8a14d16a37` |
| #1204 | `fix/trip-edit-structure-preservation-20261115` | `1c04adba157709204b860bab58cb881a91305f53` |
| #1205 | `feat/account-language-settings-20261115` | `304900d4e4d9587bcbed075409e730227fe7cecf` |
| #1206 | `feat/admin-editorial-cms-native-20261115` | `233c7fba0867eace4fcd32fcd06a91d1128d627d` |
| #1207 | `feat/admin-marketing-links-20261115` | `bf93a20efd486712a8fb38b123a01cb20f11cac9` |
| #1208 | `feat/account-admin-translations-2-20261115` | `28432962c683b2ae20e9e2091992ec8e458050c6` |
| #1209 | `feat/admin-marketing-draft-store-20261115` | `f481b7f0b1fe57e2fee38ae159ccb26c58485fc0` |
| #1210 | `feat/admin-cms-editor-2-20261115` | `8761e7585d99f2ddddb640d0e6e18c7343b27472` |
| #1211 | `feat/account-security-translations-3-20261115` | `f4363205b16991143c9111c33b059ca1619b786b` |
| #1212 | `feat/places-catalog-refresh-3-20261115` | `329bd93ebbe1ff732ae6836e2f93b5518069e573` |

## Umsetzung und Prüfung

1. Bestehende Paketköpfe gegen den Main-Stand integrieren; gemeinsame Vorgänger nur einmal übernehmen.
2. Konflikte anhand beider vollständiger Verträge lösen; bestehende Auth-/BG1-/Datenbankgrenzen erhalten.
3. Relevante lokale Prüfungen und unabhängige Quellprüfung bündeln. Native PostgreSQL-Prüfung läuft in der normalen CI; der lokale Executor erlaubt keine Unix-Sockets.
4. Ein neuer gemeinsamer Draft-PR und ein regulärer CI-Lauf. Ergebnis und offene echte Abnahmen werden im Handoff/PR festgehalten.

## Zuständigkeit

Root ist Integrations-Writer und verantwortet Konfliktlösung sowie Handoff. admin_refresh_review prüft den Source-Erhalt unabhängig; translation_status prüft bestehende Nachweise. cms_refresh_review schreibt ausschließlich die zwei bisherigen Admin-Native-Workflows, ihre Integration in `.github/workflows/ci.yml`, drei direkt gebundene CI-Vertragstests und den vorhandenen CI-Inhalts-Pin in `official-truth-aa-revision-probe-1-policy.ts`. Alle ursprünglichen Jobs, Prüfungen, Laufzeitgrenzen und historischen Pins bleiben erhalten. Geteilte Dateien haben nur einen Writer.

## Auswirkungen

Die Aktualisierung führt bereits beauftragte Admin-/Account- und Reisebearbeitungspakete zusammen. Neue DB-Rechte, Runtime-RPCs, Production-Aktivierung und automatischer Import gehören nicht zur Source-Integration. Amtliche Einreisequellen und alle 26 Themen bleiben dem integrierten #1197-Vertrag entsprechend vollständig sichtbar; fehlende Angaben bleiben als derzeit nicht verfügbar markiert. Keine neue Providerintegration oder zusätzliche Kostenstelle.
