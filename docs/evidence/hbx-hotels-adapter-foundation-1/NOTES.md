# HBX hotels adapter foundation 1 — evidence notes

Text evidence only. No screenshots: Task v1 forbids treating Preview as HBX
access and says no visual proof is required for an unimported fixture module.

Identity: `identity.json`  
Commands: `commands-results.txt`  
Ownership: `ownership-diff.txt`  
Import boundary: `import-boundary.txt`

Sibling Admin PRs #545 and #547 were re-read for path disjointness only.
They remain TL-review-pending and were not merged into this branch.

R1 (review 5280919883): first freeze 328464df silently trimmed rateKey before
hash. Adapter now hashes original bytes after nonblank/length validation.

Main sync: TL-authorized merge of 88bf3a07 (#547). R1 freeze 5417569d invalidated.
No HBX runtime change. Indexing section preserved.
