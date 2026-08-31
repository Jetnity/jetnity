# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-A CLOSED / E5-B1 PREPARED / DRAFT PR #328 / AGENT DISPATCH PENDING / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter aktueller Main

Aktueller Baseline-Main beim E5-B1-Task-Cut:

`main@6928ea637133ff91cfb207cfd5b1175fecbc9699`

Live verifiziert:

- E5-A Issue #323: **CLOSED / completed**;
- E5-A Runtime PR #325: **MERGED**;
- E5-A Runtime-Merge `a4c0c57e144e694435cfe2b1970a76239f1ef7d5`;
- E5-A Continuity PR #326: **MERGED**;
- aktueller Main-Merge `6928ea637133ff91cfb207cfd5b1175fecbc9699`;
- Main CI **#1491 / Run `33404116202`: SUCCESS** exakt auf `6928ea...`;
- Vercel Production **`dpl_9gLJih2vBvzKExiikYy9vrix7Cuc`: READY** exakt auf `6928ea...`;
- Ruleset **`Jetnity main protection` / ID `21875372`**: active, strict Required Checks, Conversation Resolution, merge-only, Bypass leer;
- Issue #294 bleibt **OPEN** als bindender Entry-Requirements-/Travel-Companion-Zieltracker.

Letzter vollständig geschlossener Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`

## 2. Aktiver vorbereiteter Slice

**Entry Requirements E5-B1 – Trusted Airport Timezone Provenance**

- Issue: **#327**;
- Draft PR: **#328**;
- Branch: `feat/entry-requirements-trusted-timezone-e5b1-2026-08-31`;
- Baseline: `main@6928ea637133ff91cfb207cfd5b1175fecbc9699`;
- Binding Task: `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_TASK_2026-08-31.md`;
- Logical Agent: **`Jetnity entry requirements trusted event time 1`**;
- Generation: **1**;
- Agent-Session: **noch nicht belegt**;
- Status: **PREPARED / DRAFT PR OPEN / DISPATCH PENDING / NO RUNTIME DELIVERY YET**.

Kein anderer aktueller Runtime-Slice ist autorisiert. Offene PRs #52/#50/#40/#39/#28 sind historische Drafts und keine Current Runtime Truth.

## 3. Ergebnis des frischen E5-B1 Duplicate-/Integration-Prechecks

Der Technical Lead hat vor dem Task-Cut die tatsächliche Flight-/Route-/Readiness-Architektur neu geprüft.

### Bereits vorhanden und zwingend wiederzuverwenden

- `lib/readiness/temporal.ts`: E4 Official Temporal Rules;
- `lib/readiness/temporal-projection.ts`: E5-A-Arithmetik für bereits absolute Event-Instants;
- `lib/flights/domain.ts`: provider-neutrale Flugdomäne;
- `lib/flights/zeit.ts`: bewusst zonenlose lokale Airport-Wall-Clock-Semantik;
- `lib/flights/duffel/antwort.ts` + `mapping.ts`: bestehender Duffel Adapter Boundary;
- `lib/flights/konto-uebernahme.ts`: server-proofed Account-Adoption-Trust-Boundary;
- `lib/flights/aktionen.ts`: serverseitig nachgewiesene Flight-Persistenz;
- `lib/route/domain.ts`, `schema.ts`, `itinerary.ts`, `metadata.ts`, `kanonisieren.ts`: kanonische Route-/Metadata-/Trusted-vs-Untrusted-Grenze;
- `lib/route/kontakte.ts`: lokale Airport-Zeitkontakte ohne erfundene Zone.

### Gefundene konkrete Lücke

- Flight-Segmentzeiten sind absichtlich lokale Flughafenzeiten und tragen heute keine Timezone;
- Route Truth trägt ebenfalls keine IANA-/Offset-Wahrheit;
- Jetnitys Duffel-Schema reduziert strukturierte Airport-Objekte heute auf `iata_code` und verwirft dadurch Duffels vorhandenes `time_zone`;
- `public.airports` / aktueller OurAirports-Import tragen keine Jetnity-Timezone-Truth;
- Repository-Code-Suche fand keinen bestehenden IANA-/Timezone-/Temporal-Resolver und keine Timezone-Library;
- Browser-/Local-Storage-/Guest-Routen sind untrusted; Account-Flight-Adoption wird dagegen serverseitig nachgewiesen.

### Architekturentscheidung für den kleinsten sicheren Slice

Nicht sofort Event-Resolver + Zeitzonenumrechnung bauen.

Zuerst E5-B1:

> **Explizit provider-belegte Airport-Timezone-Provenance erhalten, aber lokale Zeit noch nicht in UTC umrechnen.**

Damit wird die heutige Data-Loss-Lücke geschlossen, ohne eine zweite Timezone-Wahrheit oder Heuristik zu erzeugen.

## 4. E5-B1 Binding Truth

Timezone darf nur Trusted Truth werden, wenn sie:

1. aus der bereits bestehenden serverseitig validierten Flight-Provider-Response stammt;
2. exakt dem Departure-/Arrival-Endpunkt des konkreten Flight-Segments zugeordnet ist;
3. als bounded tz-database/IANA-Identifier validiert wurde.

Verboten:

- IATA → Timezone raten;
- Country/City/Name → Timezone raten;
- Default-Timezone;
- `first match`;
- `Z` an lokale Zeit hängen;
- Server-Timezone verwenden;
- fehlende Zone als bekannte Zone behandeln.

Fehlend/ungültig bleibt `null` / unavailable.

## 5. E5-B1 Scope

Geplant ist ausschließlich:

- optionale Departure-/Arrival-Timezone-Provenance im normalisierten `FlugSegment`;
- bestehendes Duffel `time_zone` an der vorhandenen Adaptergrenze validieren und erhalten;
- Timezone durch server-proven `FlugOption -> FlugMomentaufnahme -> Trusted Route Itinerary -> trip_items.metadata` tragen;
- Trusted DB-Metadata-Lesen so gestalten, dass belegte Timezone erhalten bleibt;
- untrusted Browser-/Local-Storage-/Guest-Itinerary daran hindern, Trusted Timezone zu behaupten;
- timezone-lose bestehende Itinerary-v1 rückwärtskompatibel halten;
- bestehende `surfaceFromAirportCode` Trusted-/Untrusted-Grenze erhalten.

## 6. Hard Non-Scope

E5-B1 enthält **nicht**:

- Local Time + IANA → UTC/Offset-Konvertierung;
- DST Gap-/Ambiguity-Resolver;
- neue Timezone-Library nur zur Vorwegnahme eines späteren Slices;
- Trip/Route → Event-Occurrence Resolver;
- automatische Bindung von E4-Ankern;
- automatische E5-A-Projektion;
- konkrete Workspace-Deadlines;
- `too early / upcoming / actionable / overdue`;
- Task-/Completion-Persistenz;
- Reminder/Push/E-Mail/Notifications;
- Airport-DB-Timezone-Migration/Import-Ausbau;
- Supabase Migration/RLS/Auth/MFA/AAL;
- neuen Provider/Vendor/Secret/API-Key/paid call/Live-Aktivierung;
- Requirements Provider Aktivierung; `requirementsProviderAus()` bleibt `null`;
- Credential Ranking / automatische beste Passauswahl;
- E5-B2 oder sonstigen Folgeslice.

## 7. Product-Owner-Gate Assessment

**Aktuell kein besonderer Product-Owner-Gate für E5-B1.**

Der Slice enthält keine:

- Production-Migration;
- RLS-/Ownership-Änderung;
- Auth-/MFA-/AAL-Änderung;
- neue sensible Speicherung;
- Providerwahl/Vertrag/DPA/Secret/paid call;
- neue laufende Infrastrukturkosten;
- Payments;
- Public-Launch-Aktion.

Wenn Implementierung in einen dieser Bereiche driftet: **STOPP / kein Scope-Creep / neu entscheiden.**

Supabase wird in E5-B1 nicht verändert.

## 8. Traveller / Product Truth bleibt unverändert

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
Trip Snapshot = einzige Current Truth der konkreten Reise.

Issuer Country ≠ Citizenship. Keine Residence→Nationality-Inferenz. Kein Default-/Primary-/Preferred-/Chosen-Pass. Kein `documents[0]` / `evaluations[0]` als Product Truth.

E5-B1 rankt keine Credentials und wählt keinen Pass.

## 9. Readiness-Unterbau auf Main

Bereits abgeschlossen und nicht zu duplizieren:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration / Deduplizierung;
- E5-A Exact Event-Instant Projection Core.

P3 / intentional residual nach E5-A: Noch kein sicherer Trip/Route→absolute Event-Instant-Pfad. E5-B1 schließt davon nur die **Timezone-Provenance-Data-Loss-Lücke**, nicht den gesamten Resolver.

## 10. Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt bindend:

- PR erforderlich;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Cursor darf niemals Ready oder Merge ausführen. `docs/ACTIVE_WORK_STATUS.md` ist TL-owned. Agent-Self-Review ist kein TL-PASS. Jeder neue Head invalidiert ältere Exact-Head-Gates.

## 11. Nächster exakter Schritt

1. TL stößt auf Draft PR #328 den exakten Agenten **`Jetnity entry requirements trusted event time 1`**, Generation 1, an.
2. tatsächliche Cursor-Session-Evidence erst nach sichtbarer Agent-Antwort dokumentieren; nichts erfinden.
3. Agent implementiert ausschließlich den versionierten Task und liefert:
   - `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_STATUS_2026-08-31.md`;
   - `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_HANDOFF_2026-08-31.md`;
   - `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_SELF_REVIEW_2026-08-31.md`;
   - vollständige Gates.
4. Agent STOPP; kein Ready, kein Merge, kein Folgeslice.
5. TL prüft anschließend exakten finalen Head, jede geänderte Datei, Scope, Trust Boundary, Legacy-Kompatibilität, Tests, CI/Vercel/Threads/Mergeability unabhängig.
6. Findings → CHANGES REQUIRED im selben Agenten/Session-Kontext.
7. PASS/Ready/Merge nur durch TL nach vollständiger Evidence.
8. Post-Merge finalen Main + CI + Vercel Production + Continuity erneut verifizieren.
9. **Kein E5-B2 automatisch.**

**Live-Evidence gewinnt immer.**
