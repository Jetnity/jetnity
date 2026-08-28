# Jetnity – Product Owner Approval: Next.js 16.x Active LTS Upgrade Program

Stand: 28. August 2026

## Status

**PRODUCT-OWNER-FREIGEGEBEN.**

Diese Freigabe folgt auf den integrierten Framework Security Upgrade Gate-0-Audit aus PR #148 und superseded die dortige offene Product-Owner-Entscheidung über das eigentliche Framework-Upgrade.

Live-Baseline bei Erteilung der Freigabe:

- `main @ d9aedc922c8281f2db225c903cabcd4cda368adc`
- PR #148: gemergt und post-merge verifiziert
- GitHub Actions `33207308987`: SUCCESS auf exakt `main @ d9aedc922c8281f2db225c903cabcd4cda368adc`
- Vercel Production `dpl_BbRcChdCYPBc1RpQgXsCVwZ5rWRc`: READY, `target=production`, exact Git SHA `d9aedc922c8281f2db225c903cabcd4cda368adc`, `aliasError=null`
- Node-22-Vertrag aus PR #147 bleibt integriert

## Verbindliche Product-Owner-Freigabe

Der Product Owner hat ausdrücklich freigegeben:

> Ja, das gestufte Upgrade von Jetnity auf Next.js 16.x Active LTS ist freigegeben. Verwendet wird zum Implementierungszeitpunkt die aktuell unterstützte und sicher gepatchte 16.x-Version, mindestens die auditierte 16.3.3. Die dafür notwendigen kompatiblen Änderungen an React 19.2.x, TypeScript, ESLint, Async Request APIs, Middleware/Proxy und bestehendem Jetnity-Code sind ebenfalls freigegeben. Umsetzung nur in kontrollierten kleinen Slices mit unabhängiger Technical-Lead-Prüfung, CI/Vercel und ohne unnötige Produkt-, Auth-, RLS-, Datenbank- oder Provider-Änderungen.

## Autorisierter Scope

Freigegeben ist das **gestufte Framework-Kompatibilitäts- und Security-Upgrade-Programm** mit folgenden Leitplanken:

1. Ziel ist Next.js **16.x Active LTS**, live auf die zum Implementierungszeitpunkt aktuell unterstützte und security-gepatchte 16.x-Version aufgelöst; niemals unter dem im Gate-0-Audit geprüften Minimum `16.3.3`.
2. Notwendige kompatible Begleitänderungen sind freigegeben, insbesondere:
   - React 19.2.x-kompatible Linie,
   - TypeScript-Vertrag mindestens Next-16-kompatibel,
   - ESLint / `eslint-config-next` / Ersatz für `next lint`,
   - Async Request APIs wie `cookies()` und verwandte APIs,
   - `middleware` → `proxy`, soweit durch die Zielversion erforderlich,
   - notwendige kompatible Anpassungen im bestehenden Jetnity-Anwendungscode.
3. Umsetzung erfolgt in **kleinen, kontrollierten Slices** mit eigenem Scope, eigenem Exact Head, unabhängiger Technical-Lead-Prüfung sowie GitHub-CI- und Vercel-Evidence.
4. Der Technical Lead darf normale, scope-treue Slices nach vollständigem Exact-Head-PASS selbst Ready setzen und mergen. Cursor-/Coding-Agenten dürfen weiterhin niemals selbst Ready/Merge ausführen.
5. Vor jedem Dependency-Bump muss die konkrete aktuelle sichere 16.x-Zielversion live neu geprüft werden; Audit-Zahlen sind Referenzen, keine ewigen Pins.

## Nicht durch diese Freigabe autorisiert

Diese Freigabe öffnet **nicht** automatisch:

- Supabase-Production-Migrationen,
- neue oder geänderte RLS-/Ownership-/GRANT-/REVOKE-/SECURITY-DEFINER-Regeln,
- grundlegende Auth-/Session-/MFA-/AAL-Produktentscheidungen,
- sensible Passport-/Dokumentnummern, Scans, MRZ, Biometrics, Health oder vergleichbare sensitive Traveller-Payloads,
- AP-7-S2 Persistenz/Identity/RLS/Production-Migration,
- Provider-live / paid provider calls / provider secrets,
- Payments,
- Public Launch / Indexing / Domain Cutover / App Store,
- Branch-Protection-Änderungen,
- sonstige bestehende Product-Owner-Sondergates.

Diese bleiben separat gegatet.

## Verbindliche Implementierungsreihenfolge aus Gate 0

Der nächste Implementierungsblock soll nicht als unkontrollierter Major-Bump beginnen.

- **Slice 1 – Next-16 Compatibility Prep auf bestehender Runtime:** insbesondere Async-Request-API-/Auth-Cookie-/Metadata-Kompatibilität so vorbereiten, dass der spätere Major-Bump kleiner und besser prüfbar wird; noch kein unnötiger Framework-Bump.
- **Slice 2 – Framework Bump:** live-resolved Next 16.x Active LTS (>= `16.3.3`) plus kompatible React-/TypeScript-/ESLint-Linie, Lint-CLI-Umstellung und erforderliche `middleware`→`proxy`-Migration.
- Weitere kleine Folgeslices nur, wenn der exakte Live-Diff oder die Zielversion sie notwendig macht.

Auth-, Session- und Cookie-Verhalten sind high-risk und müssen fail-closed, regressionsarm und mit gezielten Tests geprüft werden. Keine kosmetische Sammelmigration.

## Exakter nächster Schritt

Nach einem Chat-Wechsel:

1. Live-Rekonstruktion von `main`, PR #148, dieser Freigabe, CI/Vercel und Branch Protection.
2. Gate-0-Evidence erneut als Grundlage prüfen; aktuelle Next-16-Security-/Support-Linie live auflösen.
3. Einen **kleinen Slice-1-Task für Next-16 Compatibility Prep** definieren und versionieren.
4. Erst danach einen frischen Cursor-Agenten für diesen Slice starten.

Kein AP-7-S2 und kein anderer Sondergate-Slice wird aus dieser Freigabe automatisch gestartet.

## Continuity-Regel

Dieses Dokument ist die dauerhafte Product-Owner-Evidence für die Freigabe des Next-16-Upgrade-Programms. Wenn ältere Gate-0-/Handoff-Texte noch „Product-Owner-Entscheidung ausstehend“ sagen, sind sie für diesen Punkt historisch; **diese Freigabe ist neuer und gewinnt**, vorbehaltlich einer späteren ausdrücklichen Product-Owner-Änderung.