# Integrated pilot internal contracts

Status: implementation in progress; no activation authority.

Preserve #855 payload/C/H and #861 historical custody envelopes byte-for-byte. Global definition stays C({id,version,scope}); custody stays C({kind,schemaVersion:1,value}); new generic dependency manifests use separately identified version-1 codecs. Receipt, content identity v2, review v3 and applicability v1 are separate namespaces; v2 facts cannot enter this producer.

Private execution captures actual definition references and exact successful fact before public cloning. Composition consumes the existing #898 one-shot result with genuine seal/fact and original registry references. No reselection. A membership ledger binds exact predecessor and closes on terminal failure/success.

New original-observation/validity/accepted-origin contracts will retain exact initial/final identity, hash/MIME/times, source-bearing scope, qualification and derivation/acceptance contract pins. Issuance occurs only around actual controlled retrieval and successful canonical Evidence acceptance in the isolated developer lifecycle. No historical row, accepted boolean or caller DTO issues an origin.

Historical bundle input: recordFingerprint, authoritative canonical receipt payload bytes, separate canonical CustodyDependencyBindingV1 bytes, and full typed artifact bytes/Pins. Verification returns only historical integrity, never current execution/acceptance. Exact typed roots and role edges derive from bytes. Limits remain #859/#863: 262144 receipt bytes, 256 union nodes, 1024 role edges, 1048576 bytes per artifact, 8388608 total artifact bytes, longest depth 8, structural depth 32. No partial/truncated closure.

Detailed implemented schemas and failure mapping will be recorded alongside their tests before delivery. The real source pilot cannot borrow synthetic predecessors.
