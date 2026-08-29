# ADR-0199 – Provider Adapter Core Foundation

**Datum:** 29. August 2026  
**Status:** Implementiert im Repository auf Draft-PR #187. **Kein Ready. Kein Merge. Kein Follow-up-Slice. Keine Provideraktivierung.**  
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
- Kein Ready/Merge durch den Autor. Independent Technical-Lead Exact-Head-Review ist der nächste Schritt.

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
