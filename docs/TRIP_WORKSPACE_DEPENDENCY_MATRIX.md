# Jetnity – Trip Workspace Dependency Matrix

Stand: 24. August 2026  
Status: **Planungshilfe für den Workspace-Workstream; überschreibt keine fremden Pläne. Neue Workspace-IA bleibt Vorschlag bis ausdrücklicher Product-Owner-Annahme. Ein Merge von PR #55 gibt die Ziel-IA und TW-1 nicht frei. Bestehende Domain-/Shared-Gates bleiben verbindlich.**  
Code-Evidence-Basis (historisch): `1ec93cc9`  
Aktueller Integrations-`main`: `b7f027ec` (S3 #54, AP-3 #53, Admin C #49 auf `main`)

Zweck: verhindern, dass der Workspace gegen unfertige Contracts implementiert wird.

---

## 1. Fremde Pläne – nur lesen

| Workstream | Authoritativer Plan | Dieser Audit darf |
| --- | --- | --- |
| Account | `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` auf `audit/account-platform` (nicht dieser `main`) | referenzieren, nicht ändern |
| Admin | `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md` / Admin-Audit-PR | nicht berühren |
| Provider | `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` auf `main` | referenzieren, nicht ändern |
| Traveller Truth | Foundation E + künftiges AP-7 | UI-Naht vorbereiten, nicht neu modellieren |
| Route | Foundation D | nutzen, nicht neu definieren |
| Shared Auth/RLS/Guest→Account | Technical Lead / Account | nicht anfassen |

Account-Slices laut Account-Plan (Evidence, nicht Eigentum):

AP-1 Shell · AP-2 Auth-UX · AP-3 Meine Reisen Lebenszyklus · AP-4 Archivieren · AP-5 Sicherheit · AP-6 Privacy · AP-7 Account-Traveller-Registry · AP-8 Reiseprofil · AP-9 Favoriten · AP-10 Buchungsübersicht · AP-11 Notifications · AP-12 Abo-Platzhalter

Provider-Slices laut `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`:

S1 Ops-Vertrag · S2 FlugNachweis · S3 Mobility/Rental Nachweis · S4 Truth-Domain Ops · S5 Commercial Provenance · S6 persistenter Cost Guard · S7 Observability · S8 Cache/Lizenz

S1–S3 liegen auf diesem `main`. S4–S8 sind fremde, noch offene Arbeit. AP-3 und Admin A–C liegen auf `main`.

---

## 2. Matrix

Legende Abhängigkeit:

- **frei** – vorhandene `main`-Contracts reichen
- **warten** – fremder Slice/Contract muss zuerst stehen oder bewusst fail-closed bleiben
- **parallel lesbar** – darf geplant werden, Runtime erst nach Gate
- **verboten jetzt** – Shared Write / neue Truth / Secrets

| Workspace-Funktion | Account | Admin | Provider | Traveller | Route | Readiness | Safety | Seasonal | Commercial |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shell / eine IA Mobile+Desktop | frei | – | – | – | – | – | – | – | – |
| Reisekopf aus Graph | frei | – | – | `party[]` schon auf main; Registry = AP-7 **warten** für accountweite Profile | Origin/Stages auf main | – | – | – | Budget nur User |
| Timeline Etappe/Tag/Item | frei | – | – | – | Route-Kompakttext frei | – | etappenbezogen erst mit Evaluation | wie Safety | – |
| `Jetzt wichtig` aus Graph-Gaps | frei | – | – | Missing Facts frei | unbestimmte Abschnitte frei | stale/open frei | orchestriert: vorhandenes Signal; fehlende Evaluation = `noch_nicht_geprueft`, nicht unavailable/clean | wie Safety | keine Preise |
| Safety in Attention | – | – | S4/S7 für ehrliche Health-Hooks **warten** vor Live | – | Relevanz nutzt Route | getrennt halten | Foundation auf main; fehlende Orchestrierung = `noch_nicht_geprueft`; `pruefung_nicht_verfuegbar` nur bei belegter Unavailability | getrennt | – |
| Seasonal in Attention | – | – | wie Safety | – | Datum/Region aus Graph | – | nicht mischen | Foundation auf main; fehlende Orchestrierung = `noch_nicht_geprueft`, nicht unavailable/clean | – |
| Official/Visa-Texte | Citizenship-Pflichtregel auf main | – | echter Requirements-Adapter **verboten jetzt** | keine Default-Citizenship; AP-7 **warten** | Transitländer aus Route | lokale Engine fail-closed frei | – | – | – |
| Flugbestand / Abdeckung | – | – | S2 auf main | – | Foundation D | – | – | – | Preis/Freshness = **S5 warten** |
| Flug suchen / übernehmen | – | – | Guest weiter fail-closed; Live-Adapter **verboten** | – | keine Heuristik | – | – | – | **S5 warten** |
| Hotelbestand / Suche | – | – | Nachweis auf main, Factory null | – | – | – | Lage nur mit Geo-Evidence | – | **S5 warten** für Freshness |
| Aktivitäten | – | – | wie Hotel | – | – | – | – | Timing nur Seasonal-Evidence | **S5 warten** |
| Mobilität manuell | – | – | S3 Nachweisvertrag auf `main`; Umgebung `null` | – | Kanten aus Graph frei | – | – | – | Live-Adapter / Commercial = **S5 + Activation warten** |
| Mietwagen manuell | – | – | S3 Nachweisvertrag auf `main`; Umgebung `null` | – | – | rental-flag in Readiness frei | – | – | wie Mobilität |
| Booking-Siegel User | frei | – | Provider-Booking **warten** / AP-10 für Konto-Übersicht | – | – | ticket/booking-checks hängen an `booked` | – | – | Source bleibt `user` |
| Guest One-Trip / Fortsetzen | AP-3 auf `main` besitzt ableitende Lebenslage – **nicht überschreiben** | – | – | Party-Übernahme existiert | – | Readiness-Übernahme existiert | – | – | Flugfelder fail-closed |
| Archiv / mehrere Reisen | AP-3 auf `main` (nur Lage); Archiv = AP-4 **warten** | – | – | – | – | – | – | – | – |
| Privacy Export/Delete von Reisen | AP-6 **warten** | – | – | – | – | – | – | – | – |
| Account-Buchungsübersicht | AP-10 **warten** | – | – | – | – | – | – | – | nicht im Workspace duplizieren |
| Admin Health der Provider | – | Slice B/C auf `main`, Workspace zeigt sie nicht | S7 | – | – | – | – | – | Workspace zeigt keine Admin-Health |
| Create-Flow Multi-Destination / keine Chips | frei als späterer Slice; Homepage-Marketing **verboten** | – | – | keine Citizenship-Pflicht beim Start | Stages wiederverwenden | – | – | – | – |

---

## 3. Was jetzt implementierbar *wäre* – und trotzdem nicht in diesem PR

Nur nach neuem ausdrücklichem Auftrag plus Technical-Lead- und Product-Owner-Freigabe:

| Slice-Idee | Warum unabhängig möglich | Trotzdem warten auf |
| --- | --- | --- |
| Gemeinsame Shell / Übersicht auch auf Desktop | reine UI-Komposition vorhandener Graph-Daten | Review dieses Audits |
| Timeline aus `stages` / `days` / `items` | Daten existieren | Review |
| Attention aus Flug-/Nächte-Abdeckung + Readiness-Stale | Ableitungen existieren | Review; Safety/Seasonal nur als ehrlicher Nicht-geprüft-Zustand |
| Planner ohne Pace-Default | PO-Regel existiert bereits | eigener Slice; kein Homepage-Relaunch |

Nicht „jetzt heimlich mitbauen“. Dieser PR bleibt docs-only.

---

## 4. Was bewusst warten muss

| Thema | Wartet auf | Wenn der Workspace zu früh baut |
| --- | --- | --- |
| Belegte Provider-Preise / Freshness-Badges | Provider S5 | Fake-frisch oder Client-Truth |
| Live Mobility/Rental-Adapter | Provider-Activation + S5 | Nachweis existiert; Umgebung bleibt `null` |
| Live-Suche irgendwelcher Domains | Provider-Activation-Gate + Kosten | Kosten/Secrets |
| Accountweite Traveller-Profile | Account AP-7 + Shared-Contract-Gate | zweite Identität |
| Archiv / gespeicherter Reise-Lebenszyklus | Account AP-4 | AP-3 auf `main` nur ableitend; kein Archiv-Write |
| Privacy-Löschpfade | Account AP-6 | unvollständige Löschung |
| Konto-Buchungsordner | Account AP-10 | Workspace würde Account klonen |
| Echte Visa-/Transit-Aussagen | Official Provider + Evidence-Vertrag | erfundene Regulatorik |
| Persistent rate-limit / cost guard | Provider S6 | Scheinsicherheit |
| Provider-Health im Workspace | Admin + S7 | Fake Healthy |
| Homepage-Positionierung | eigener späterer Block | Scope-Creep |

---

## 5. Serialität vs. Parallelität

```text
Account AP-*  ──┐
Admin A–K     ──┼── weiter parallel, eigene PRs
Provider S4–S8──┘
                 \
                  \ nach Review + PO: Workspace-Implementierung
                   \
                    TW-Foundation/IA zuerst
                    Commercial-Surfaces erst nach S5
                    Traveller-Registry-UI erst nach AP-7
                    Homepage nie in diesem Workstream
```

Gemeinsame Write-Flächen bleiben serial unter Technical Lead:

- Auth / RLS / `profiles`
- Guest→Account / Trip-Graph-Verträge
- Traveller-Registry
- Route / Official / Safety / Seasonal **Contracts**
- Provider Activation / Secrets

Workspace-UI, die diese Contracts **nur liest** und ehrliche Zustände zeigt, darf nach Freigabe parallel geschnitten werden.

---

## 6. Konfliktarme Dateigrenze für spätere Slices

Erlaubte spätere Touch Areas (Vorschlag, nicht gestartet):

- `components/trips/TripWorkspace*.tsx`
- `lib/trips/arbeitsbereich.ts` und Tests
- Übersicht-/Attention-Präsentation, sofern sie bestehende Ableitungen nur komponiert
- docs dieses Workstreams

Nicht ohne neuen Lead-Auftrag:

- `lib/readiness/engine.ts` Official-Vertrag
- `lib/safety/` / `lib/seasonal/` Domain
- `lib/route/`
- `lib/flights/nachweis.ts` und Provider-Ops
- Account-Routen und AP-3-Dateien
- Admin
- Homepage-Copy/Layout außer später ausdrücklich dem Create-Entry-Slice zugeordnete funktionale Weitergabe
