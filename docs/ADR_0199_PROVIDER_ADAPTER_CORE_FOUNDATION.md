# ADR-0199 – Provider Adapter Core Foundation

**Datum:** 29. August 2026  
**Status:** Self-expiring. Solange Draft-PR #187 offen: implementiert im Repository, **kein Ready, kein Merge, kein Follow-up-Slice, keine Provideraktivierung.** Sobald #187 gemergt: Kern integriert; nächster Schritt zuerst Post-Merge-Verifikation + TL-Continuity, nicht automatisch Skyscanner-Server-Transport.  
**Cursor-Agent:** `Jetnity provider adapter core 1`

## Entscheidung

Jetnity bekommt einen provider-neutralen, serverseitigen Transport-Kern unter `lib/server/providers/core/`.

1. Der Kern ist **Outbound-HTTP-Infrastruktur**, kein UniversalProvider und keine Fachwahrheit.
2. Trust kommt aus dem Code-Pfad. Es gibt keine forgebaren Felder wie `trusted`, `live` oder `sourceKind`.
3. Credentials dürfen den injizierten HTTP-Client erreichen, erscheinen aber nie in Fehlern, Observer-Events, zurückgegebener Metadaten oder Snapshots.
4. Timeout, Retry und Rate-Limit sind explizit, begrenzt und fail-closed. Ungültige Konfiguration wird abgelehnt, nicht ins Unendliche geklemmt.
5. Tests bleiben vollständig offline über injizierten HTTP-Client, Clock, Sleeper und Timeout-Scheduler.
6. Der Kern mint keine Commercial Provenance und erzeugt kein `live_api` / `persisted_snapshot`.
7. `lib/provider-ops` bleibt der **Inbound**-Operationsvertrag (Request-Härtung, Cost Guard, Outcome-Taxonomie). Die beiden Schichten werden nicht vermischt.
8. Die vorhandene Skyscanner-Fixture-Foundation unter `lib/providers/` bleibt unverändert fixture-only.

## Kontext

Nach der Offline-Skyscanner-Foundation (PR #185) braucht der nächste reale Adapter eine gemeinsame, secret-sichere Transportgrenze. Ohne sie würde jeder Adapter Timeout/Retry/Redaction selbst erfinden.

Dieser Slice implementiert nur die gemeinsame Grenze. Create/Poll, Provider-Keys, S5-B-Runtime und TW-8 bleiben ausserhalb.

## Alternativen

1. *Jeden Adapter mit eigenem fetch/retry bauen.* Würde Secret-Leaks und unbegrenzte Retries verdoppeln.
2. *`lib/provider-ops` um Outbound-HTTP erweitern.* Vermischt Inbound-Härtung mit Provider-Calls und würde den S1-Vertrag aufblasen.
3. *Sofort Skyscanner Create/Poll mitbauen.* Überschreitet den versionierten Auftrag und öffnet unbeabsichtigt Live-Transport.

## Konsequenzen

- Zukünftige Server-Adapter, zuerst Skyscanner Flights Live Prices, sollen diesen Kern nutzen.
- Duffel behält vorerst seinen eigenen HTTP-Pfad. Eine Migration ist ein späterer, extra gegateter Slice.
- Self-expiring: solange #187 offen ist der nächste Schritt der unabhängige Technical-Lead Exact-Head-Review. Nach Merge zuerst Post-Merge-Verifikation + TL-Continuity, nicht automatisch Skyscanner-Server-Transport. Autor setzt kein Ready/Merge.

## Nachtrag – Technical-Lead Review 5058500841 (29. August 2026)

Dieser Nachtrag präzisiert die Transportgrenze. Er erweitert den Slice nicht.

### Harte Body-Grenze

`Content-Length` ist nur ein Early-Reject, nie eine vertrauenswürdige Länge. Der Kern liest den Response-Body als Stream und bricht ab, sobald die Max-Grenze während des Lesens überschritten würde. Ein fehlendes oder bewusst zu klein angegebenes `Content-Length` darf den Body nicht zuerst vollständig materialisieren.

### `retry_exhausted` vs. `rate_limited`

`retry_exhausted` bedeutet ausschließlich: eine retrybare Operation hat ihre zulässigen Versuche tatsächlich benutzt. Wenn `maxAttempts=1` oder `retryOn429=false` ist und deshalb kein Retry stattfindet, bleibt der Endfehler `rate_limited`. Das gilt für HTTP-429 und für einen preflight-`rate_limited`-Outcome.

### Injizierte Observer- und Preflight-Fehler

- `observer.record(...)` darf die Transportgrenze nicht verlassen. Ein Telemetriefehler lässt einen sonst erfolgreichen Request erfolgreich. Exception-Text, Bodies und Secrets erscheinen nicht in Errors oder Events.
- `rateLimit.preflight(...)` ist fail-closed. Ein Throw oder ein ungültiger Outcome verhindert den HTTP-Call, wird nicht retried und wird zu `rate_limited` mit der generischen Meldung `Provider rate-limit guard failed.` normalisiert. Der geworfene Wert wird nicht weitergereicht.

### Server-only Trust-Grenze

Die bestehende Repo-Konvention ist `import 'server-only'` (Next-Compile-Time-Grenze, kein zusätzliches npm-Paket). Jedes Runtime-Modul unter `lib/server/providers/core/` trägt diese Markierung, inklusive `exports.ts`, `executor.ts` und `http.ts`. Ein Client-Import eines Alternativpfads scheitert mechanisch an der Compile-Time-Grenze. `node:test` lädt nur über `scripts/server-only-test-register.mjs` einen lokalen Stub; ohne diesen Stub scheitert der Alternativimport. Kein neues npm-Paket.

### `retry_exhausted` nach einem früheren, anderen Retry

`lastFailure` beweist nur, dass irgendwann retried wurde. `retry_exhausted` gilt nur, wenn der **aktuelle** Fehler selbst retrybar ist und ein Retry-Pfad wirklich benutzt wurde. Ein späteres `401` bleibt `authentication`. Ein späteres `429` mit `retryOn429=false` oder ein späteres disabled Preflight bleibt `rate_limited`.

## Nachtrag – Technical-Lead Review 5463847278 (29. August 2026)

Dieser Nachtrag präzisiert Secret- und Rate-Limit-Verträge. Er erweitert den Slice nicht.

### Request-ID Secret Boundary

`requestIdHeaderName` muss ein gültiger HTTP-Header-Name sein. Bekannte sensitive Namen (`authorization`, `set-cookie`, `x-api-key` und die übrige Default-Liste) sind `invalid_configuration`, bevor irgendein HTTP-Call möglich ist. Normale provider-spezifische Request-ID-Header bleiben zulässig. Der gelesene Wert bleibt über `readSafeRequestId` bounded.

### Eine Rate-Limit-Wahrheit

Retry / Retry-After (`retryOn429`, `honorRetryAfter`, `maxRetryAfterMs`) gehören ausschließlich zu `ProviderRetryPolicy`. `ProviderRateLimitPolicy` trägt nur den optionalen `preflight`-Hook. Deklarierte Duplikatfelder auf der Rate-Limit-Policy werden als `invalid_configuration` abgelehnt, nicht still ignoriert.

Ein Preflight-Outcome `rate_limited.retryAfterMs` darf nur `null` oder endlich, nichtnegativ und bounded sein. `NaN`, `Infinity`, negative oder überhöhte Werte fail-closen als `rate_limited` ohne HTTP und ohne Raw-Leak.

### Continuity / PR #196

`origin/main` inkl. Binding Slice Precheck / Continuity Gate bleibt erhalten. Globale Current-State-Flächen, die dieser Slice berührt, sind self-expiring: nach einem Merge von #187 ist der Kern integriert; der nächste Schritt ist zuerst Post-Merge-Verifikation + TL-Continuity, nicht automatisch Skyscanner-Server-Transport. Keine erfundene Merge-SHA.
