# TA-DL1 – Adversarial Self-Review

Stand: 30. August 2026  
Cursor-Agent: `Account plattform audit vorbereitung 19`  
Reviewed Head: der Commit dieses Stamps; live am Draft-PR #227 prüfen.

## Verdict

**READY FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**  
Kein Author-PASS. Kein Ready. Kein Merge.

## Scope

In scope: derived Kalendertags-Darstellung vorhandener `expiresOn`-Metadaten.

Nicht angefasst: Migrationen, Schema, RLS, Grants, Auth/MFA/AAL, Service Role, Provider, persistierter Status, Credential-Wahl, Visa/Einreise, AP-8+/TW-8/Payments/Homepage/Collaboration, Migration-History-Repair.

## Adversarial checks

| Risiko | Ergebnis |
| --- | --- |
| `documents[0]` / Default-Credential | nicht vorhanden |
| UTC-`Date('YYYY-MM-DD')` als Wahrheit | Helper parst nur Kalenderkomponenten; Feb 31 bleibt unknown |
| Referenztag am Ablaufdatum | `not_expired` |
| Reisebeginn genau = Ablauf | `expires_during_trip` |
| Reiseende genau = Ablauf | `expires_on_or_after_trip_end` |
| nur Start oder nur Ende | `trip_dates_incomplete`, keine volle Einordnung |
| Start nach Ende | `trip_dates_invalid` |
| mehrere Dokumente | unabhängige Ergebnisse, Issuer/Citizenship ändern nichts |
| „läuft bald ab in N Tagen“ | nicht implementiert |
| Visa/Einreise/Bordkarte | TA-DL1-Copy verneint Zulässigkeit, behauptet sie nicht |
| Server erfindet „heute“ | Account liest Geräte-Kalendertag erst clientseitig |
| persistierter Lifecycle | kein Write, keine neue Spalte |

## Gates (lokal, nach Type-Fix)

- `npm test` 2738/2738
- `npm run typecheck` pass
- `npm run lint` 0 errors
- Hygiene dead/exports/deps/api-schutz/schema-bezug pass
- `npm run build` pass

Exact-Head auf Implementation Head `12f2ad08`:

- CI #1298 / Run `33280831211` = SUCCESS
- Vercel Preview `6cEEj5siu7r8hUrrsjptjPRSv2i6` = SUCCESS

Der unabhängige Reviewer prüft den live exact Head, falls ein Continuity-Stamp danach liegt.

## Offen / nicht behauptet

- Authentifizierter Browser-/Real-Device-Durchlauf in dieser Umgebung nicht möglich
- Unabhängiger Technical-Lead-Review ausstehend
