# Official Truth Accepted Store Trip Integration 1 — TL AMENDMENT R4

Date: 2026-11-08. Work #1155 / DRAFT #1156.
Technical Lead: ChatGPT / Root.
Author: **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**, same session `/root/accepted_store_trip_integration_writer`.
Preceding head: `3797a52b9a9e66b43f1d14b36510db93572384a0`; immutable main baseline remains `e1fe0c696ade9f39b417772b5c065f87530204d6`.

## One bounded disposal request after business cancellation

R1 requires actual bounded provisional cleanup, including interrupted requests. R3 correctly closes the business lifetime to every new request after cancellation. Record this precise, separate disposal exception so cleanup cannot be confused with reopening cancelled work.

**Approve in the new `database-server.ts` only: one explicit disposal lifetime, at most 5,000 milliseconds monotonically, for the one fixed service-only cleanup RPC.**

- The binding, service endpoint and credentials are code-owned and already checked for the current operation. No request-selected URL, method, headers, key, token or cleanup target.
- If no reservation token was actually acquired, do not start a disposal request. Closed default binding still performs zero network/client/source/DB work.
- Use direct bounded native fetch/REST POST to `official_truth_trip_store_cleanup_v1` with its exact token payload. Do not construct another Auth/SSR SDK client, trigger refresh or create a replacement business scope.
- One attempt; no retry, timer extension, unbounded response, Promise.race or abandoned request. Compose and enforce the disposal signal, fully own response/body completion and await actual settlement. This exception does not promise instantaneous physical peer closure.
- The disposal lifetime may operate after the business parent was aborted; this is the only purpose of the exception. It cannot publish, fetch a source, read/construct positive truth, refresh authority, confirm a result as successful, move a witness or extend a lease.
- Failure or lost disposal ACK remains uncertainty. Return only a sanitized internal outcome; never claim rollback or deletion merely because fetch was aborted or an error was swallowed.
- The SQL cleanup remains globally serialized, count/byte bounded and restricted to provisional reservations/stages. A committed operation/version/custody/history must survive it, including Finalize races.
- Expired orphan cleanup remains available on the next explicitly invoked internal cleanup/operation as already allowed by R1. There is no schedule, automatic live loop, hosted job or claim that an abandoned row was physically deleted when no subsequent cleanup ran.
- Required native cases cover cancellation before/after Reserve, Finalize/cleanup race, lost process, lost cleanup ACK and subsequent bounded sweep. State/row checks must distinguish committed history, provisional residue and known deletion.

This is an engineering implementation decision within the existing package. All hard business/result/I/O gates otherwise remain; the known SDK bookkeeping-drain P2 is unchanged. No hosted or source activation gate is lifted. No author Ready/merge/following slice.

## Evidence persistence

The original measured CH→DE preflight bundle is now also retained losslessly as `docs/evidence/official-truth-accepted-store-trip-integration-1/preflight-r1-bundle.json.gz`, so its complete bytes and embedded 42 source files are recoverable independently of a temporary reviewer workspace.

Compressed SHA-256: `9cb93fac3f5f28a19db67134806f4f6e9db66eb4aca0c76bceb0d2bfe84b4c39`.
Decompressed original SHA-256: `33a763bd2eba1eee325e3608e99c219e1508b5862aa9045b1f9133282f6b3bab`.
Compression changes no source/proof bytes and grants no additional acceptance. Historical R2/R3 records remain unchanged.
