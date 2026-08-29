# Jetnity – Search + PrivacyBee Post-Merge New-Chat Checkpoint

Stand: 29. August 2026

Status: **SAUBERER CHAT-ÜBERGABEPUNKT / SEARCH #109 CLOSED COMPLETED / PRIVACYBEE #169 CLOSED COMPLETED / KEIN AKTIVER RUNTIME-AGENT / KEIN PRODUKT-FOLGESLICE / LIVE-EVIDENCE GEWINNT IMMER**

Dieser Checkpoint ist die neueste versionierte New-Chat-Übergabe-Evidence nach:

- PrivacyBee Schweiz Gate 0 Closeout auf `main` (PR #175 + #176)
- Visitor Search Country-Alias Recovery auf `main` (PR #173 / Transport #177)

Er superseded ausschließlich spätere operative Aussagen älterer Dateien, die Issue #109 oder #169 noch als offen, Draft-PR #173/#171 als aktuellen Runtime-Block oder einen Search-/PrivacyBee-Runtime-Agenten als aktiv führen. Historische Authoring-Evidence bleibt erhalten und wird nicht gelöscht.

Draft-PR #178 ist **nur** dieser Docs-/Continuity-Nachzug. **#178 ist nicht integriert**, solange er offen/Draft ist. Dieser Stamp behauptet keinen Merge von #178.

Author dieses Continuity-Stamps: logischer Agent **`Visitor search correctness 1`**. Cloud-Run: `https://cursor.com/agents/bc-020d3296-0cd7-4e36-8373-47578af701ce`. Cursor exponiert keine programmierbare Rename-/Title-Fähigkeit; der UI-Anzeigename wird nicht als geändert behauptet.

## 1. Live-Rekonstruktion — immer zuerst erneut prüfen

Repository: `Jetnity/jetnity`

Diese Werte sind Evidence ihres Zeitpunkts (29. August 2026, nach 11:28 UTC). Ein neuer Chat **muss** sie live erneut verifizieren, bevor er sie als aktuelle Wahrheit verwendet.

| Fakt | Live-Wert bei diesem Stamp |
| --- | --- |
| `origin/main` | `ade03511341433d8d0b6f09b8d8342890381d3d5` — *Merge reviewed Visitor Search country-alias recovery* |
| `main` Branch Protection | `protected=false` (historisches P2-Governance-Risiko; nicht still ändern) |
| Aktiver Search-/PrivacyBee-Runtime-Agent | **keiner** |
| Draft-PR #178 | **OPEN Draft**, Docs-only Continuity. Nicht integriert. Nicht Ready/Merge durch den Autor. |
| Historische offene PRs | live neu abfragen; **niemals blind mergen oder schliessen**. Zum Stamp-Zeitpunkt u. a. Draft #88, #52, #50, #40, #39, #28. |

> **Live-Evidence gewinnt immer.** Chat-Erinnerung, dieser Checkpoint und ältere Statusdateien sind Evidence ihres Zeitpunkts.

## 2. Search — Issue #109 CLOSED / COMPLETED

| Feld | Wert |
| --- | --- |
| Issue | [#109](https://github.com/Jetnity/jetnity/issues/109) **CLOSED / COMPLETED** 2026-08-29T11:28:39Z |
| Close-Kommentar | `5462109797` |
| Author Exact Head | `d44d9a7f4c993be30834fb2e67c8487bd69f46ea` |
| Independent TL PASS | Review `5057950183` auf exakt diesem Head; P0=0 / blocking P1=0 |
| Author Exact-Head CI | Actions `33249650241` SUCCESS |
| Transport | PR #177 MERGED (same SHA). Canonical Draft-PR #173 MERGED. Merge-Commit = aktuelles `main` `ade03511` |
| Transport CI | Actions `33249997900` SUCCESS auf `d44d9a7f` |
| Post-Merge `main` CI | Actions `33250075305` auf `ade03511`: Jobs Typecheck/Lint/Tests/Hygiene/Production-Build und Auth-config **SUCCESS**. TL-Closeout zitiert den Run als SUCCESS. Workflow-Wrap live erneut prüfen. |
| Post-Merge Vercel Production | `dpl_EC8WeJj3Mry1N1zSyZtz4qYpVjAL` READY / GitHub Production deployment `6155203525` SUCCESS auf `ade03511` |
| Preview-HTTP | bleibt Vercel-SSO; kein Content-Beweis |

Live Production API smoke 2026-08-29 11:26 UTC, `GET https://jetnity-app.vercel.app/api/search/places`, HTTP 200, `x-vercel-cache: MISS`:

| Klasse | Live-Ergebnis |
| --- | --- |
| Peru | country `geonames:3932488` first; IL/IN cities remain, typed |
| China | country `geonames:1814991` first; same-name cities remain, typed |
| Schweiz | country `geonames:2658434` first, label `Schweiz` · Land; Schweizer-Reneke below |
| Congo | CD `geonames:203312` und CG `geonames:2260494`; beide Label `Congo`, disambiguiert mit Name+Code |
| LI / AS / SI | kurze/geteilte Exact-Aliase vollständig, Länder first, disambiguiert |
| Kokos / Illes / Feroeer | Trim-/Whitespace-End-Token-Klasse; jeweiliges Land first |
| Paris `ziel` | Region/Stadt, **keine** Country-Zeile |
| Zürich `abreise` | city `geonames:2657896` dann `airport:ZRH`; kein Länder-Alias-Leak |

Residual **P2**: Real-Device Mobile Safari Visual-QA wurde nach Merge nicht erneut gelaufen. Öffnet den Country-Alias-Defekt nicht erneut. Gehört in den nächsten Search-/Homepage-UX-Slice.

Keine Country-Allowlist. Keine DB-/RLS-/Auth-/Provider-Mutation. Place-ID-Wahrheit und Typ/ARIA bleiben.

Issue #110 bleibt **OPEN / NOT STARTED**.

## 3. PrivacyBee Schweiz Gate 0 — Issue #169 CLOSED / COMPLETED

| Feld | Wert |
| --- | --- |
| Issue | [#169](https://github.com/Jetnity/jetnity/issues/169) **CLOSED / COMPLETED** 2026-08-29T11:12:00Z |
| Content Head | `278138ade951344be539df0767e02fa9fc4e24f8` |
| Content TL PASS | Review `5057706933` auf `278138ad` |
| Content Transport | PR #175 MERGED → `6c5e8c167f3a6b991bd6b6f5e05180ddbe4df7fd` |
| Closeout Head | `2f5ad34e16d6bd1b9e83201a1e64567b908accd8` |
| Closeout TL PASS | Review `5057818282` auf `2f5ad34e` |
| Closeout Transport | PR #176 MERGED → `dda5f3def6e018b9fdaba49180a902142ea8cddd` |
| Post-Merge CI (PrivacyBee-main) | Actions `33249385759` SUCCESS auf `dda5f3de` |
| Post-Merge Vercel Production (PrivacyBee-main) | `dpl_EEXBHtfcFqKVvX284quLLF4MuCsF` READY auf `dda5f3de` |
| Aktivierung / Login / Trial / Order / Runtime | **keine** |
| Neue laufende Kosten | **0** |

Bestehendes Konto (ohne Secrets): Der Product Owner hat bereits ein Konto bei PrivacyBee Schweiz (`privacybee.io`). Das senkt Signup-Reibung, **nicht** Vendor-/Security-/Legal-Gates. Konkreter Account-Stand (Domain, Tarif, AVV, Snippets) bleibt `account-evidence-required`. Dieser Agent hat das Konto nicht geöffnet und speichert keine Zugangsdaten.

Author-PR #171 ist historisch/superseded durch #175/#176. Ob #171 noch offen ist, live neu prüfen; nicht blind schliessen.

## 4. Was ausdrücklich nicht gestartet / nicht autorisiert ist

Kein aktiver Runtime-Agent. Kein Produkt-Folgeslice durch diesen Checkpoint.

Nicht starten:

- Issue #110 / Homepage-Mehrziel-Runtime
- AP-7-S2 (ausdrückliches Product-Owner-Gate)
- AP-6a substantive Legal-Runtime (`/privacy` `/terms` bleiben Production-404, solange live nicht anders belegt) — **geparkt / Release-Trust-Blocker** vor öffentlicher Registrierung/Launch
- AP-6b / Consumer-Export-Delete
- PrivacyBee Widget/Script/Banner/Aktivierung
- Provider-live / Secrets / paid calls
- TW-8 / TW-9
- Branch Protection ändern
- Cleanup historischer PRs

## 5. Kosten

- Search-Recovery und dieser Continuity-Stamp: **keine** neuen laufenden Kosten.
- PrivacyBee-Audit: **keine**. Öffentlicher Zukunftspreis ist nur Vendor-Evidence, keine Bestellung.

## 6. Offene Gates / Entscheidungen

| Gate | Stand |
| --- | --- |
| Issue #109 | CLOSED / COMPLETED |
| Issue #169 | CLOSED / COMPLETED |
| Issue #110 | NOT STARTED |
| AP-7-S2 | Product-Owner-Gate; nicht gestartet |
| AP-6a Legal-Runtime | geparkt / release-blocking |
| Draft-PR #178 | Docs-only; unabhängiger TL-Review; Autor setzt kein Ready/Merge |
| `main` protected=false | historisches P2 |
| Mobile Safari Real-Device | Residual P2, nächster UX-Slice |

## 7. Exakt erster noch nicht abgeschlossener nächster Schritt

Live-Evidence gewinnt.

- **Solange Draft-PR #178 offen und unmerged ist:** unabhängiger Technical-Lead Exact-Head-Review von #178. Autor-Agent setzt **kein Ready** und **kein Merge**.
- **Sobald #178 gemergt ist:** die Transport-/Review-Klausel ist historisch. Exakt erster unfertiger Produktschritt = Live-Rekonstruktion + Binding-Build-Order-Auswahl. Kein Produkt-Slice ist dadurch autorisiert.

## 8. Continuity-Regel

> **No relevant Jetnity progress may exist only in chat memory.**

Ein neuer Chat beginnt bei `JETNITY_START_HERE.md`, liest `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, verwendet bei Bedarf `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`, verifiziert `origin/main`, offene PRs/Issues, CI, Vercel und Branch Protection **live** und behandelt diesen Checkpoint als Evidence seines Zeitpunkts.

Historische offene PRs müssen live neu abgefragt werden und dürfen niemals blind gemergt oder geschlossen werden.
