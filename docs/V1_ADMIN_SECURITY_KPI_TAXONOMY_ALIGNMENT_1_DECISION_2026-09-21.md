# V1 Admin Security KPI Taxonomy Alignment 1 – Decision

Stand: 21. September 2026  
Status: **SLICE-LOCAL PRESENTATION DECISION / NOT A PRODUCER / NOT INGESTION COMPLETE**  
Issue: #503  
Draft PR: #504

This is a slice-local decision. It does not replace `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`.

## Date

21 September 2026

## Decision

Admin Security KPI classification for recorded login failures and anomalies uses one shared presentation taxonomy:

- Login-Fehler: exact `auth_failed` or historical exact `login_failed`
- Auffälligkeiten: `type.startsWith('anomaly')` or historical exact `bot` / `suspicious` / `ddos`

`SecurityWidget` and `fasseSicherheitslageZusammen()` both call `lib/admin/security-event-taxonomy.ts`. Neither surface keeps a private string rule.

## Context

Regression Hunter RH-10.1 / RH-10.2 found two live rules for the same operator question:

- Widget: `type.includes('failed')` and regex `bot|suspicious|ddos`
- Aggregator: `type === 'auth_failed'` and `type.startsWith('anomaly')`

A historical `login_failed` fixture was therefore a Login-Fehler in the widget and a zero in the aggregator. A future type containing `failed` would inflate only the widget.

## Alternatives

1. Keep only `auth_failed` / `anomaly*` and stop counting historical names.
2. Keep only the widget’s loose substring/regex rules.
3. Union of documented historical names, with exact match where the widget was loose.

## Rationale

Alternative 3 was chosen.

- Historical types must remain readable.
- The architecture forbids reusing these names as new producers; this slice does not invent a producer.
- Exact match closes the substring-inflation hole without hiding known fixture names.
- One helper prevents the two surfaces from drifting again.

## Consequences

- Empty/error still render as `null` / em dash. Zero still means zero recorded matching rows, not “no real event”.
- Widget 24h window and summary 7-day window remain different by design. This slice does not change windows.
- Finding 5.2 ingestion remains OPEN. #487/#494 producer work stays separate.
- `startsWith('anomaly')` still matches any prefix including a hypothetical `anomalous*`. That is the inherited aggregator contract, not a new producer family.
