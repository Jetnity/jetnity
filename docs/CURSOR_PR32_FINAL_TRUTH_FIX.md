# Cursor-Auftrag – PR #32 letzter Truth-Fix

Stand: 22. August 2026
Branch: `feat/travel-readiness-foundation`
PR: `#32 – Foundation C – Travel Readiness & Dokumente`
Ausgangs-Head: `175bbbc1f323854d5bfac413750eb4cd4e37ad83`

## Status

Die finale Architektur-Härtung ist weitgehend korrekt umgesetzt. Beim unabhängigen Endreview bleibt genau ein kleiner, aber wichtiger Truth-/Freshness-Punkt offen.

Bestehende Arbeit nicht verwerfen. Nur gezielt korrigieren, testen und dokumentieren. Keine Production-Migration, kein Provider, keine Secrets, keine neuen Kosten.

## Problem

`zeileUebernehmen()` setzt bei nicht vertrauenswürdiger Evidence zwar das fachliche `result` korrekt auf `unknown`, kann aber `freshness` dennoch als `current` weiterreichen, sobald ein syntaktisch vorhandenes `checkedAt` existiert.

Beispiel:

- `checkedAt` liegt deutlich in der Zukunft und wird von `officialEvidenceVertrauenswuerdig()` deshalb abgelehnt
- oder eine vorhandene `sourceUrl` ist ungültig und macht die Evidence untrusted
- `result` wird korrekt `unknown`
- `freshness` kann trotzdem `current` bleiben

Dadurch kann die UI anschließend sinngemäß „Offizielle Anforderungen wurden geprüft“ anzeigen, obwohl die Evidence gerade als nicht vertrauenswürdig verworfen wurde. Das verletzt fail-closed/Truth-Semantik.

## Fix

Wenn Evidence für ein regulatorisches Resultat **nicht vertrauenswürdig** ist, darf sie niemals eine positive Freshness wie `current` erzeugen.

Lege eine klare fail-closed-Semantik fest, z. B.:

- untrusted wegen fehlender/ungültiger checkedAt-Evidence → `never_checked`
- invalid/future checkedAt → `never_checked`
- invalid vorhandene Source URL → `never_checked` oder anderer klar nicht-current Zustand
- temporal/source outage bleibt weiterhin `source_temporarily_unavailable`
- abgelaufene gültige Evidence bleibt `recheck_needed`
- stale Context bleibt `stale`

Wichtig: Nur untrusted Evidence darf nicht `current` bleiben. Bereits korrekt erkannte `stale`, `recheck_needed` und `source_temporarily_unavailable` nicht unnötig verschlechtern.

## Tests

Mindestens ergänzen:

1. `checkedAt` deutlich > 5 Minuten in Zukunft:
   - result `unknown`
   - status nicht `current`
   - freshness **nicht `current`** (bevorzugt `never_checked`)
   - keine Action

2. vorhandene ungültige `sourceUrl` bei ansonsten vollständiger Evidence:
   - result `unknown`
   - freshness **nicht `current`**
   - keine Action

3. fehlende Source URL bei nach ADR ansonsten vertrauenswürdiger Evidence:
   - darf weiterhin current Result liefern
   - Action bleibt null

4. temporär unavailable:
   - result unknown
   - freshness `source_temporarily_unavailable`

5. expired `validUntil`:
   - result unknown
   - freshness `recheck_needed`

## Verification

Danach erneut:

- Readiness-Tests
- `npm test`
- Typecheck
- Lint
- Hygiene
- `auth:pruefen`
- Production Build
- Trip-Workspace WebKit + Chromium Audit
- Activities Regression
- GitHub CI
- Vercel Preview

DB nicht ändern.

## Abschluss

PR bleibt bis zur erneuten Human-Prüfung Draft.
Nicht mergen.
Nicht Mark Ready.
Keine Production-Migration.
