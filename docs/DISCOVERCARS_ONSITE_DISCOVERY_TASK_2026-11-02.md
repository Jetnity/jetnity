# DiscoverCars onsite discovery — task and initial plan

Date: 2 November 2026, Europe/Zurich.
Owner request: do for DiscoverCars what was done for 12Go; maximize useful rental information customers can see on Jetnity.
Baseline: main `cd6ccc33e926897379999de918d21d90111ec77e`, independently fetched; operating mode NORMAL.
Branch: `codex/discovercars-onsite-20261102`. Root Codex is the sole implementation writer; specialists are read-only reviewers. No external agent messaging is authorized by this task.

## Goal and acceptance

Improve the existing Organisieren → Mobilität → Mietwagen experience around the same trip. Establish the best supported integration for the existing DiscoverCars affiliate account before choosing the implementation. Preserve user control over pickup, return, dates, driver criteria, saved rentals and booking status. Show as much genuine provider information as the verified interface permits; never label a search form as a vehicle-result list.

1. Verify available account tools, official API/widget/white-label documentation and the actual generated widget contract.
2. Implement the strongest useful currently available integration, including a responsive on-page entry and honest external continuation where required. Native prices/details need an authorized structured source, not invented endpoints or copied website internals.
3. Protect private trip/account data. No implicit rental station, airport, age, residence, dates, one-way or reservation claims from itinerary hints. No payment/account changes or bookings.
4. Preserve the existing rental persistence/manual workflow, guest/account behavior and other providers. No database migration or new paid infrastructure planned.
5. Explicitly identify any provider-access dependency that prevents native vehicle cards. Prepare a concrete access request if needed; do not send it without the user's instruction.
6. Meaningful contract/lifecycle/security tests, typecheck, lint, hygiene, production build, independent review; actual browser evidence where available. The current Jetnity domain access denial must not be bypassed or called a successful live test.

## Modules and boundaries

Expected ownership: `lib/providers/discovercars/**`, DiscoverCars-specific rental UI, narrow `components/trips/MietwagenBereich.tsx` integration, provider-specific route/widget documents if justified, related tests and continuity documentation. Read existing rental domain, widget-host and consent contracts before selecting the route. Any shared-contract edit must be narrow, explicit and reviewed. Keep `rentalCarProviderAus()` closed unless actual API access and its contract are verified. No guessed API credentials, no broad content-security weakening, no changes to browser permissions, auth, RLS, billing, other providers or deployments during discovery.

## Initial facts and open questions

- Existing account portal advertises the official affiliate URL `https://www.discovercars.com/?a_aid=jetnity`, widget generator and location landing-page generator. No API entitlement has yet been shown.
- Official B4B page distinguishes Booking Widget, Search API, Full API and White-label. Public existence is not account entitlement.
- The current app has generic/BKK affiliate links. Its rental data provider factory is null. A generic DiscoverCars widget artifact exists in the separate widget host, but its source is unselected.
- 12Go's live native timetable comes from its documented public timetable service; that does not establish an equivalent DiscoverCars public feed.
- User's current request authorizes researching and implementing this integration. It does not authorize signing provider terms, purchases, external messages, new secrets or invented access.

## Sequence

Evidence and independent architecture audit → final bounded implementation plan → code and tests → independent exact-head review → preview/CI → report the actual completion and remaining provider/browser dependencies. Routine branch and review work proceeds autonomously. Any genuinely ungranted production/provider/contract action must be presented as a concrete final approval, not as a speculative early blocker.

## Reviewer instructions

Read-only code and evidence audit. Distinguish FACT / INFERENCE / RISK. Do not edit, do not mark Ready, do not merge, do not start a follow-up slice. No browser use in parallel with the root; no provider/account writes, purchases, messages, secret reads or calls to private APIs. Return specific file/contract findings and the smallest defensible implementation path.
## Umsetzung nach Quellenprüfung

Das Partnerkonto bietet den offiziellen Widget-Generator und Links, aber keinen belegten Search-API-Zugang. Der Generator wurde am 2026-11-02 mit Partnercode `jetnity`, Deutsch/CHF, leerem Ort und neutralen Jetnity-Texten bedient; der ausgegebene Code bleibt Anbieter-Artefakt. Zunächst wird dieser in einem lokalen, undurchsichtigen Sandbox-Rahmen funktional geprüft. Erst bei belegter Kompatibilität folgen `lib/providers/discovercars/widget/`, `/embed/discovercars` und eine kleine `DiscoverCarsSuche`-Komponente im bestehenden Mietwagenbereich.

Geplantes Verhalten: ausdrückliches Anzeigen pro Reise/Mount vor allen Anbieteranfragen; klares externes Ergebnisziel; Orts-/Datums-/Fahrerwahl im offiziellen Formular; keine privaten Reiseparameter; jederzeit ausblenden und allgemeiner Partnerlink als Ausweg. Bestehende Mietwagen und manuelle Erfassung bleiben unverändert. Der API-Adapter und der alte unvollständige gemeinsame CMP-/Widget-Host bleiben geschlossen. Kein neues Paket, keine Migration, keine zusätzliche bezahlte Infrastruktur. Risiken: Drittanbieter-Cookies/Netzwerk erst nach bewusster Anzeige, isolierter Ursprung ohne Zugriff auf Jetnity-Daten, Anbieteränderungen/Ladeausfälle, Responsive-/Kalenderbedienung, korrekte Affiliate-Übergabe. Geprüft werden Header/Methoden/Parameter, Rahmen-Lebenszyklus, tatsächliches Formular und externe Suchübergabe, mobile Größen, Fachregressionen und sämtliche Repository-Gates.

## Verifizierte Präzisierung vor Produktimplementierung

Der undurchsichtige Zwischenrahmen wurde im lokalen Versuch vom Anbieter abgelehnt. Das vom offiziellen Loader erzeugte Formular funktioniert dagegen direkt auf `widget.discovercars.com` im eigenen Anbieter-Ursprung. Daher **keine neue Route und kein Drittskript auf Jetnity**, sondern ein direkter, sandboxierter Anbieterrahmen nach ausdrücklichem Anzeigen. Der 31-Parameter-Vertrag und die JSON-String-Höhenmeldung sind beobachtet. `allow-same-origin` betrifft ausschließlich den fremden Anbieterursprung. `credentialless` ist zusätzliche, browserabhängige Isolation; es ist keine Cookie-/Tracking-Zusage. `referrerPolicy=origin` sendet nur die öffentliche Herkunft, keine privaten Pfade. Die getestete Übergabe enthält `a_aid=jetnity`, ohne die im früheren Draft #1084 vorgeschlagene Veränderung des offiziellen Exports. Die alte Draft-Implementierung, ihr HOLD und ihre CMP-/Host-Pins werden nicht geändert oder gemergt.

Der Auftrag „dasselbe mit DiscoverCars wie mit 12Go“ umfasst die Umsetzung und Prüfung dieses bereits bestehenden kostenlosen Partnerwegs. Es werden keine neuen Verträge, Kosten oder Secrets benötigt. Vertrags-/API-Zugangsfragen werden konkret vorbereitet und nicht ohne Sendefreigabe verschickt. Der neue eigene Anzeigeentscheid ersetzt keine CMP-Einwilligung: vorhandene Ablehnungen, inkonsistente Zustände und verlorene bereits beobachtete CMP sperren weiter. Browser-Verweigerungen für jetnity.com bleiben respektiert. [Prüfstand](DISCOVERCARS_ONSITE_EVIDENCE_2026-11-02.md).
