# U1 — Liefermanifest R4

Basis-HEAD `b8a65f8b4d341768f69df01ba1ca96f8eba4ee14`, Tree `e94bec8d4d987973e924053dbc77eeb7a5c250e9`. Dieses Manifest umfasst die gesamte U1-Lieferung einschließlich unveränderter R2/R3-Dateien. Der enge R4-Diff besteht ausschließlich aus dem isolierten Mount, R4-Plan, Handoff und diesem Manifest. Alle R4-Änderungen liegen uncommittet zur Root-Prüfung vor. Kein eigener Commit oder Exact-Head-TL-PASS; das Manifest schließt sich selbst aus.

S0-Vertragscode unverändert, SHA256 `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`. Root besitzt gemeinsame Guards/TASK-/Startupdateien; diese wurden im R4 nicht geändert.

| Datei | SHA256 | Bytes |
| --- | --- | ---: |
| `.github/workflows/ci.yml` | `b87e82ebf0c6ffa2569b3a2b02007d1117aaf38713ffe1bec0aa20c05e9720bb` | 12329 |
| `components/readiness/OfficialTruthVisitorV3.tsx` | `6a0a7ea1989e4f13b8abb8e9546cb5bc2b71ada0953a421600a6a86e74fa9df0` | 9466 |
| `lib/readiness/official-truth-product-v3/visitor/controller.test.ts` | `821bc479a89cbd8dafe8e084ac7d505be68929a2dc58527d701d4fbba04361f7` | 15732 |
| `lib/readiness/official-truth-product-v3/visitor/controller.ts` | `d432402228b55b1649d5f62d02716bda6d302d1fafefbdbc809a014c38b6debf` | 9573 |
| `lib/readiness/official-truth-product-v3/visitor/presentation.test.ts` | `898d95a077b33bed15e29eb593faf3609aaadaaba4d4609d6f0a8b6edcab3688` | 6126 |
| `lib/readiness/official-truth-product-v3/visitor/presentation.ts` | `53289515eecc57376e2fca40adffd07f5fb3c513a8ccc8dffc764be7389e4cfe` | 17871 |
| `lib/readiness/official-truth-product-v3/visitor/query.test.ts` | `c2224893c81b669c7ec6be73e065802dd8a5a675464ec58f39b805103a7aeddc` | 19548 |
| `lib/readiness/official-truth-product-v3/visitor/query.ts` | `89fc7206e5bcfaf6b6aaf5152f17df0a2fbe0e79ee7045104048e4695c9d6ec6` | 20238 |
| `lib/readiness/official-truth-product-v3/visitor/test-fixtures.ts` | `da773db6fe75077044add8a739587890d5384915a0413b32b408f8767e92b515` | 12046 |
| `scripts/official-truth-product-v3-ui/benchmark.ts` | `f18a1e7c2170e3a2b8676a4513e6872ac585b927434df6823d5ed5332b45b6fa` | 1688 |
| `scripts/official-truth-product-v3-ui/browser.mjs` | `1fee7a0522426739286888fb424adc19465ea1000701f8eed80dcbe72695d0b0` | 660 |
| `scripts/official-truth-product-v3-ui/ci-contract.test.mjs` | `2f933fd114663702d2686ce275df86f4a2ef7a7ecd3c13d4809164d48540362b` | 4144 |
| `scripts/official-truth-product-v3-ui/evidence.mjs` | `9b5f8efedc0b8940a6b7c7dd4b386a704c89975e41a99b182ea609e4bb7f67fd` | 2333 |
| `scripts/official-truth-product-v3-ui/mount.tsx` | `b203a92c51606e09559a3420a23b6966230482ca50ef87655697a6258803f111` | 2932 |
| `scripts/official-truth-product-v3-ui/run.mjs` | `c8075413a906fabb1cae315b90e2cc98e48c4e9ff50eb94bb1e7acf6aebfbc2e` | 18724 |
| `scripts/official-truth-product-v3-ui/synthetic-server.ts` | `293f8909e96bb1c6f1291e5d08284a3f3f57ce24d4b14c9e9f9114b6d6e3e8d9` | 3512 |
| `scripts/official-truth-product-v3-ui/tsconfig.json` | `298827891fbd79214e03f8014f780785d357fc5eb1eda88282eb3c2a4c6452f7` | 122 |
| `docs/official-truth-product-v3/U1_IMPLEMENTATION_PLAN.md` | `6bcff6a5b4c6e1068d75585b286cbd805031072256187f4c20f6eed39f1565e3` | 7138 |
| `docs/official-truth-product-v3/U1_CONTRACT.md` | `a8aa3c6069173465beb0885459c15a568e30d47427a866d69ce6d409784e2ef6` | 10489 |
| `docs/official-truth-product-v3/U1_REVIEW_R4_FIX_PLAN.md` | `2c92ec39db02e4ad8fc84f995e982d6e91c0e10654b71868ba2ffc275d89240f` | 4505 |
| `docs/official-truth-product-v3/U1_SELF_REVIEW_HANDOFF.md` | `b2ff851962eb1af75d34f56ae346509839ecc4aa0f3ca2ed6576ef781206e88d` | 20560 |

21 Dateien gehasht, zusätzlich dieses Manifest. Keine DB-/Provider-/Auth-/Production-Aktion. Neuer tatsächlicher CI-/PNG-/UI-Nachweis erforderlich. STOP.
