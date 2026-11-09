# U1 — Liefermanifest R5

Basis-HEAD `20a4e497a4a23c7aa972d13352c155729f95a7ab`, Tree `7c0aebdc53285a31637029e8a534711b35ceefe3`. Dieses Manifest umfasst die gesamte U1-Lieferung einschließlich unveränderter R2/R3/R4-Dateien. Der enge R5-Diff besteht ausschließlich aus Produktkomponente, R5-Plan, Handoff und diesem Manifest. Die Änderungen liegen uncommittet zur Root-Prüfung vor. Kein eigener Commit oder Exact-Head-TL-PASS; das Manifest schließt sich selbst aus.

S0-Vertragscode unverändert, SHA256 `871b7eb7f4863fda0777593677b9bc265a0b6d22df99cc3caa2e1f0e59c672c4`. Root besitzt gemeinsame Guards/TASK-/Startupdateien; diese wurden in R5 nicht geändert. Der von Root bereitgestellte `U1_REVIEW_R5_TASK.md` ist keine eigene Implementierungsdatei und steht separat im Arbeitsbaum. Harness samt R4-Label, gesamte Browsermatrix, CI, Controller/Query/Presenter und shared Country/CSS bleiben bytegleich zur Basis.

| Datei | SHA256 | Bytes |
| --- | --- | ---: |
| `.github/workflows/ci.yml` | `b87e82ebf0c6ffa2569b3a2b02007d1117aaf38713ffe1bec0aa20c05e9720bb` | 12329 |
| `components/readiness/OfficialTruthVisitorV3.tsx` | `849536e878d4b072f94670c0cbfe457aa34682442e535d6f777ee5b26755f432` | 9630 |
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
| `docs/official-truth-product-v3/U1_REVIEW_R5_FIX_PLAN.md` | `e28803505ed4fa95bb9e51cc5cd566af2757ac4662552e77484ad09af66c33d5` | 6783 |
| `docs/official-truth-product-v3/U1_SELF_REVIEW_HANDOFF.md` | `2b47cddaf1dacb8afc07304b80acfc864806291de94bec9a0639cb39ce162383` | 27253 |

22 Dateien gehasht, zusätzlich dieses Manifest. 47/47 bestehende Tests, beide Typprüfungen, Lint, Bundle-/HTTP-Smoke und Diffprüfung bestanden. Kein lokaler Browserstart. Neuer tatsächlicher CI-/PNG-/UI-Nachweis bleibt erforderlich; responsive Abnahme offen. Keine DB-/Provider-/Auth-/Production-Aktion. STOP.
