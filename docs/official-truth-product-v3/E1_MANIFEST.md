# E1 — stabiles Dateimanifest nach Review R1

Autor **Jetnity Official Truth V3 Integration 1 — Codex Generation 1**, Session `/root/v3_integration_writer`, 2026-11-09 UTC. Basis `3f8c84239e1e847af4b63be6134db34854aa3914`, Draft #1167. Die Pins beziehen sich auf die tatsächlichen lokalen E1-Arbeitsdateien nach dem engen R1-Fix, nicht auf einen bereits veröffentlichten Implementierungscommit.

27/27 E1-Tests und 235/235 vollständiger V3-Modulkorpus bestanden; TypeScript, fokussiertes ESLint und unveränderte ursprüngliche Root-Probe jeweils Exit 0. Eigenständiger Root-Review, Guardunion, neuer Exact Head und vollständige CI bleiben erforderlich. Kein Ready, Merge, DB-/Provider-/Productionzugriff. Autor STOP.

## Eigene Lieferdateien

| Pfad | SHA-256 | Git-Blob (ohne Schreiben) |
| --- | --- | --- |
| `lib/readiness/official-truth-product-v3/integration/coordinator.test.ts` | `7d9e4ba0ab3adc8359cf591264106d6f8528b7112a6fa607f9e64b0e1bea852e` | `e23d00822f8d196d758002e56b13a6d26ff5d456` |
| `lib/readiness/official-truth-product-v3/integration/coordinator.ts` | `98568e19e16206b3c97d7f13d442428a7c314f8b67de7633a2d3f38619184a11` | `bcdbfedc6e702185f270520a9685ab5700eaed92` |
| `lib/readiness/official-truth-product-v3/integration/ports.ts` | `6000fda06783ef7e644d9ed65bfd7ca069e9de49af579fc17f4dff11585fe299` | `3a66e8e44ea06061dbfdc1d9a341bd2c61c5866d` |
| `lib/readiness/official-truth-product-v3/integration/test-support/fixture.ts` | `79000659ebfd007984ca8a6e98b75f062f81b3eed40ecbb02aee1b6ca6ee56af` | `5b2ecf3bc472304b9447df64c3650466b4a8541d` |
| `lib/readiness/official-truth-product-v3/integration/test-support/originals.ts` | `a1b360b31bcc4140ad5e8fc9d66017166c58b69f92456dd73feb4f11b34343b1` | `f7915790ce334b16e24bbea84848e318cd1d0f89` |
| `lib/readiness/official-truth-product-v3/integration/test-support/store.ts` | `534529284cdc76090cd648561f3b4f51f16d7e3590f13c39067ab092e55a7d90` | `addf597505eaedfdf3da0ba925f4b2e6ef96e7ba` |
| `docs/official-truth-product-v3/E1_IMPLEMENTATION_PLAN.md` | `40619f28ff06967d4c87eddbdcbf8f9065735f075bc5d7f00c27a10ca517bc69` | `df4c1154d8f832b89b52108a3d0a67f4f0e8ece9` |
| `docs/official-truth-product-v3/E1_CONTRACT.md` | `ccbe672a373cbff1ada3974b5e1948b3b707039cde39d3847cf779ef8e625455` | `d747e0048d94313170b0d9a614417342be073b46` |
| `docs/official-truth-product-v3/E1_REVIEW_R1_FIX_PLAN.md` | `f7f6009af38ace91ea146243983de684f17d46b4b2732341d1d8661164dd6ffc` | `4bfced6d3aa472995c44afa731feecf1968a786b` |
| `docs/official-truth-product-v3/E1_SELF_REVIEW_HANDOFF.md` | `aeeb726b4c63d26f9232b0bd7d8d2b1ad83963bd067edb9c1d23269896fe2ce8` | `0a1d11ab34426e822ce218f651954cb471ba3a6a` |

Dieses Manifest führt seine eigene Prüfsumme nicht rekursiv. Root kann sie separat mit `sha256sum docs/official-truth-product-v3/E1_MANIFEST.md` prüfen; der Autor meldet sie im STOP-Handoff. Alle zehn obigen Dateien wurden außerdem einzeln mit `git diff --no-index --check /dev/null <Pfad>` geprüft: keine Whitespacebefunde; Exit 1 bezeichnet hier ausschließlich die vorhandene neue Datei.

## Unveränderte R1-Grenze

`integration/coordinator.ts` und `integration/ports.ts` sind gegenüber dem vor R1 geprüften Stand bytegleich. R1 verändert ausschließlich `test-support/fixture.ts`, `test-support/store.ts`, die beiden zusätzlichen dauerhaften Regressionen in `coordinator.test.ts` und eigene Dokumentation. Die unveränderte ursprüngliche Root-Probe hat SHA-256 `c14be38cf909ffab2f36b444952a7e1b180764fecef46466ceed6bb5115cfbbd`.

Roots E1_TASK_V1, E1_REVIEW_R1_TASK, E1_INPUT_SNAPSHOT_R1/R2, zentrale Dokumente, CI und sämtliche S0/I1/U1/M1-Dateien sind Root beziehungsweise den ursprünglichen Autoren zugeordnet und nicht Teil dieser Eigenlieferliste. Alle 17 Pins aus E1_INPUT_SNAPSHOT_R2 wurden separat bestätigt. Die drei bekannten zentralen Inventarfehler werden nicht versteckt oder durch dieses Manifest freigegeben.
