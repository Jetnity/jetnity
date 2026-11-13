// COMPOSED-DEV1 SOURCE-V1. Synthetic owned PG17 proof, NOT_RUN at source delivery.
// Root separately integrates the exact prerequisites and performs all acceptance.
// No hosted target, official-source GET, HTTP/MFA, D1 or public-rule claim.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { startLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { createMa1NativeExecutor } from '../official-truth-v3-method-authority-1/native-adapter'
import { createM04NativeExecutors, M04_FIXED_SQL } from '../official-truth-v3-durable-jobs-1/native-adapter'
import { M04_TEST_BINDING, M04_TEST_LOGIN, m04Fixture, m04Canonical } from '../official-truth-v3-durable-jobs-1/fixtures'
import { createV3PostgresDurableJobs } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'

// Root A2 / 6827822422 replaces the earlier 128 total connection ceiling with 384.
const EFFECT_MS = 180_000, DRAIN_MS = 35_000, MAX_CONNECTIONS = 384, MAX_OPERATIONS = 4096
const GROUPS = ['C01', 'C02', 'C03', 'C04', 'C05'] as const
const ROOT = new URL('../../../', import.meta.url)
const TARGET_ACK = 'dev:yfvbxvijcorffwxbxahl:postgres:E18B6824905662'
// TARGET_ACK is the installer's selected context string in a synthetic cluster.
// It proves neither an external project nor independently established quiescence.
const RECOVERY_CONTEXT = 'root_independent_identity_no_consumers_controlled_quiescence_v1'
const BINDING = M04_TEST_BINDING
const TECHNICAL = [
  { login: M04_TEST_LOGIN.jobs, role: 'ot_v3_jobs_caller' },
  { login: M04_TEST_LOGIN.intake, role: 'ot_v3_intake_caller' },
  { login: 'ot_ma1_reader', role: 'ot_v3_method_reader' },
] as const
const PINS = [
  {
    "path": "lib/api/datenbank-lesen.ts",
    "bytes": 5068,
    "blob": "dc66e852527df8561f3ac4aa45744df9bd076c48",
    "sha256": "9d6ada9651d59dc808e58f9ac5bfbbce4e5417f5ffafc5e7fc06e07d2d4bb135"
  },
  {
    "path": "lib/country/katalog.ts",
    "bytes": 2499,
    "blob": "dfde5361642edbe30f1abc6f18df3200b046f448",
    "sha256": "ebaed24988b7c34ac352cdc10e7ed6031fbb25bf93f6efd280769878c7891f8c"
  },
  {
    "path": "lib/readiness/digest.ts",
    "bytes": 3013,
    "blob": "bbb6ee9d8e1e1433cbb5753b15b86b7b215d8c54",
    "sha256": "e63201d45a39f68624b1e1f9e7568b696f8a65d1ada07f16e64a2be69dcec190"
  },
  {
    "path": "lib/readiness/domain.ts",
    "bytes": 3637,
    "blob": "27ffd5d9f7b118a09741e92fee32d9cb08401927",
    "sha256": "e4b2e779f398b6a45916e7fc1a232194a0a374833cfb39884a5c312d69ded587"
  },
  {
    "path": "lib/readiness/evidence.ts",
    "bytes": 36628,
    "blob": "f1a28d5a8f7445219f8cec224a849852c012fc3a",
    "sha256": "e2db270b542443eb8b05808de7526de0d7578f42d89bdc60fd97548f327195cb"
  },
  {
    "path": "lib/readiness/official-truth-autonomous-provenance-artifact.ts",
    "bytes": 9517,
    "blob": "3c3aaeb3cc73e223b0a0cf2df1d9ceb27ff161cf",
    "sha256": "1bdf271bf078d1c46fbc0f510789129e361bfdabce7cdd6e03a27a21071f323b"
  },
  {
    "path": "lib/readiness/official-truth-ch-de-application-pilot-1/context.ts",
    "bytes": 4402,
    "blob": "25dafee0f06353785972efafe0fc2db90183372b",
    "sha256": "2e0fd2776172f5634c2f288f7f4e6b134f78b65ff214d296ca16a4f781788c7e"
  },
  {
    "path": "lib/readiness/official-truth-ch-de-source-budget-128k-1.ts",
    "bytes": 6390,
    "blob": "8212e90e15ec1c87df58525867d0d095ecabedf0",
    "sha256": "8ffe78364851f37eb25d70adbb86fba4b2831f2c49ce9848849c97ea050366f7"
  },
  {
    "path": "lib/readiness/official-truth-content-identity.ts",
    "bytes": 27496,
    "blob": "4a4c3eea77b6e634fd83525849a4aaa6e6e50c18",
    "sha256": "f48c5e31ab5e4ec0f8f3a5dae2bd769869b37396aae8e36ccb6964d2798d3df6"
  },
  {
    "path": "lib/readiness/official-truth-coverage.ts",
    "bytes": 15066,
    "blob": "42c36f522016e87cf51461f7bd3f1056d4355529",
    "sha256": "5220d545e459b9f6b372be86d6565ae59f13e1d445c2e54c4895f2f99c404039"
  },
  {
    "path": "lib/readiness/official-truth-govuk-content-api-identity-profile.ts",
    "bytes": 13601,
    "blob": "505ecc92bada48cf7ef81bd812210c1a5dac8d7b",
    "sha256": "9b756a4347248decf20eb11264e2577f1f2eb0cbcdad0018d6d86d3e37002828"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/contract.ts",
    "bytes": 61555,
    "blob": "354c18e153f90a7febb7ea8f14558626202c187e",
    "sha256": "7a7abc307b3bd9cf5bf80a85da91c5ecdb7ef7146546fe0d15fc3f25f768859c"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/import/interface.ts",
    "bytes": 2538,
    "blob": "c549d0dfe80e2283f8852022637c3d1c8e7a3d5d",
    "sha256": "d98772cb27275aa768541bb670f3ae0effaf866748aea6b3797c03ac49361bb6"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/import/service-server.ts",
    "bytes": 23971,
    "blob": "43036718191c3a733aaeaca1fde9f499174cee53",
    "sha256": "2f88077023c0215ebfd246b0dd50b3216e45e7bc342e72eae2cac10c72758b09"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/integration/coordinator.ts",
    "bytes": 22886,
    "blob": "bcdbfedc6e702185f270520a9685ab5700eaed92",
    "sha256": "98568e19e16206b3c97d7f13d442428a7c314f8b67de7633a2d3f38619184a11"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/integration/ports.ts",
    "bytes": 5699,
    "blob": "3a66e8e44ea06061dbfdc1d9a341bd2c61c5866d",
    "sha256": "6000fda06783ef7e644d9ed65bfd7ca069e9de49af579fc17f4dff11585fe299"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/integration/test-support/originals.ts",
    "bytes": 7930,
    "blob": "f7915790ce334b16e24bbea84848e318cd1d0f89",
    "sha256": "a1b360b31bcc4140ad5e8fc9d66017166c58b69f92456dd73feb4f11b34343b1"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/integration/test-support/store.ts",
    "bytes": 35281,
    "blob": "addf597505eaedfdf3da0ba925f4b2e6ef96e7ba",
    "sha256": "534529284cdc76090cd648561f3b4f51f16d7e3590f13c39067ab092e55a7d90"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/jobs/composition.ts",
    "bytes": 25086,
    "blob": "4c84ecdec8cd82dedf21d3decb7cae6d791fedc5",
    "sha256": "f9edce307a52cca4860c820adbc8c356fa3637e209dc6de4fe743070fbc69b34"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/jobs/contract.ts",
    "bytes": 27465,
    "blob": "e54779dfa4cd65372f0f375182beafd4a1d155c1",
    "sha256": "95e8233bd0fdbaa41fbb5cea03ec8a5a415161116cbdb44871d25f6c12661f06"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/jobs/owned-scope.ts",
    "bytes": 8816,
    "blob": "c80c48cca369cc8ea0c30bc5f620cada639a1e05",
    "sha256": "f1fe66e3311ddbc5c6209d046188f653e2895ad1857565ad52bc8d777046c94e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/jobs/postgres.ts",
    "bytes": 12578,
    "blob": "3c519e73fc440146bafe168983ae96d765b4a66f",
    "sha256": "e906165fcb33a9a4c84d6445d1f2d6ae61c829c8e8127afae307dfa94b0509a8"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/method/authority-postgres.ts",
    "bytes": 34286,
    "blob": "1c420f807e393556a68b48a105623a1f94016ea0",
    "sha256": "0063de3f54a0ac3f092fd5bdfb35628742aff4068eea52b1797c0163698a53c6"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/method/contract.ts",
    "bytes": 10485,
    "blob": "da6c4bd4ab930b9c2ff7c0e387fc310e9eec643b",
    "sha256": "77d88e2063bf12ee4c1ca385bb4d65b9b5fd14845da62a25556877a0329ed05e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/internal.ts",
    "bytes": 3443,
    "blob": "cd107022522a725cbbafe7589028aec5f341cefa",
    "sha256": "dc9f237166705be5346819bf4156b34846558ab8debec28d025a1352028a07ff"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/monitor.ts",
    "bytes": 15888,
    "blob": "446e727e3e3030ef4949829864abb5c531abc5a7",
    "sha256": "d535f20a230d5d7d00bc29c1a9abb17cea360efe590789ec047be6ee29d0a10e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/queue.ts",
    "bytes": 19888,
    "blob": "a6b0215def84931cddd96248cf4dbf347ce5a621",
    "sha256": "7d3930b9f24975b6a2f42fe1a486914a201650f5b8f51dc3fd17813c74de3985"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/recovery.ts",
    "bytes": 18379,
    "blob": "467904b945b53b84ab916b3f40cf67dfe47942c1",
    "sha256": "767aa7465281c7f38d8bf3b748f41d94f4204b26867b11719b77f833d259c899"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/worker.ts",
    "bytes": 8739,
    "blob": "b411123af2baa3aee1fcd3bc4a836bd93897ccf6",
    "sha256": "72cc22348f3d740ad761d33f84c191de04e997a0bea368449d96ba256454b99e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/intake-contract.ts",
    "bytes": 3840,
    "blob": "0e2e4947b03f4f444691ed8177dcc3ca98a71b69",
    "sha256": "49c4c4f5c2fd0b163be4f387af47032ed8c030fd75e7bfecd875af775bf6f69b"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/intake-server.ts",
    "bytes": 2934,
    "blob": "0605decae43995be0fd0a5183a501067e8a03685",
    "sha256": "fe83419c0709fa753aea63d538f12720027a85a3a933c7390378883784260082"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/proposal-bytes.ts",
    "bytes": 3701,
    "blob": "c731f673fe35a896a40d33a9a8d78faca599942f",
    "sha256": "4208d024e54657919617ef5a392f3eae86ff0421c32e890874643748f51aae19"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/quarantine-codec.ts",
    "bytes": 10348,
    "blob": "f33353d1e4077effad9e7527c9a6c25a703261cf",
    "sha256": "adb16487346cea677b8c49683d0d75ef177359ac4cfaf0abb944ab1a8a76a989"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts",
    "bytes": 12562,
    "blob": "8082bada0dad76c657b3c7a0367e56b4d634e5ce",
    "sha256": "a809ec68c0f6b125bfc9f66737c4895f16099a5162c44be220cfbf5f0234c7c6"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/retention-shape.ts",
    "bytes": 22054,
    "blob": "7b47357190f0d7dddc1dfca2f2c2330af6ccfb63",
    "sha256": "663867695a4a4412f8f65b384324df09b1f82aa5de2a3526dfcdb74aa99de596"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/visitor/query.ts",
    "bytes": 20238,
    "blob": "9ba1fcb92775107e4c0ec99bac96312a0b9c120a",
    "sha256": "89fc7206e5bcfaf6b6aaf5152f17df0a2fbe0e79ee7045104048e4695c9d6ec6"
  },
  {
    "path": "lib/readiness/official-truth-research-request.ts",
    "bytes": 13791,
    "blob": "b91eedb8e929dcb16e8cc031609af000de447f86",
    "sha256": "988a958416d494dc8b29a098e390269650f8a78afcd222b8f288b81cc4b554ce"
  },
  {
    "path": "lib/readiness/official-truth-source-fingerprint-v2.ts",
    "bytes": 5156,
    "blob": "72d324d019625c5028be8f47763fdd0f6ffe38e5",
    "sha256": "d8c0ddd287b0cffc4e9f0a88528ecce5c02052afdc0ab59fbb67449276388eac"
  },
  {
    "path": "lib/readiness/official-truth-trusted-fact-extractor-registry.ts",
    "bytes": 51757,
    "blob": "9f407dca147f8ba41280133dd64c7198c82c10a7",
    "sha256": "a8ef77dc8f0fb25a7bcf437c586683783c6c19c0510b1f6c8d07009a470cbb62"
  },
  {
    "path": "lib/readiness/official.ts",
    "bytes": 13839,
    "blob": "dbaf9738cee8583e1b29577896547d47d236a35c",
    "sha256": "0351c6d695dce1c4351ff283ce3a3ffec308a0f8947020420d30da5231298bd4"
  },
  {
    "path": "lib/readiness/regulierungs-anwendbarkeit.ts",
    "bytes": 108170,
    "blob": "cac99bc39eefa470f3269892808f76c6b76d8130",
    "sha256": "5e4d84e45f1a41223df722647ef545244ca5ed38b79e3622b4e259ed21b6994f"
  },
  {
    "path": "lib/readiness/rule-claims.ts",
    "bytes": 46056,
    "blob": "c61d06ca67d87e8c9b6435c23c8ac62965a251f6",
    "sha256": "52f9395ad21cd2331c986d4e767611a5f0454cd1bf1e08e73666525c0612ab3a"
  },
  {
    "path": "lib/readiness/source-registry.ts",
    "bytes": 9165,
    "blob": "672a316209cdeba279988e1691ce1e15e0dfb1b3",
    "sha256": "058c9a69f11c703594415f56ed77ed15bf9804de7ae53aae5fb46c05511e22bc"
  },
  {
    "path": "lib/readiness/temporal.ts",
    "bytes": 14833,
    "blob": "2b45246938196127124539302634e175a172b4b6",
    "sha256": "768d1dd731bb745b3ce3e8b40bb425a4a51b8ce7b757ae4eb5173e9c65dd38d8"
  },
  {
    "path": "lib/route/domain.ts",
    "bytes": 2711,
    "blob": "59de349e313f20a74a2fc0119f2244fd0b65a50b",
    "sha256": "6de9776bd37a3359e8aab549f80ba11c25b12fbf8722a510bfa8278fd5e07cb8"
  },
  {
    "path": "scripts/db/official-truth-atomic-version-refresh-1/test-lifetime.ts",
    "bytes": 9025,
    "blob": "b1a81a0f63fb0debaffa4db739adbb483ac1efc5",
    "sha256": "e7a6a5deb652019209fd9e4bd2f1ce71bef3c15a4988838ab5b35f147dbbee68"
  },
  {
    "path": "scripts/db/official-truth-integrated-pilot-1/local-cluster.ts",
    "bytes": 5280,
    "blob": "dc5a2583cd540b83062e8662cdb4b6af4befb376",
    "sha256": "f6d21b3fef8f0ad41a8ac3951972ea5cba0394cfe41037eba8d0258ed508aa10"
  },
  {
    "path": "scripts/db/official-truth-integrated-pilot-1/pg-wire.ts",
    "bytes": 30699,
    "blob": "78e92ebfb61ce6fd1aaa8c554d19ad157978d39c",
    "sha256": "9ad361433f7d0563ae892d4b24d0fee3acbcb8ea567d750f5f3cb4be6989da3b"
  },
  {
    "path": "scripts/db/official-truth-v3-durable-jobs-1/fixtures.ts",
    "bytes": 6321,
    "blob": "5280246b707f506c5d9d83929562965faea9279c",
    "sha256": "68312bc9424dc71066b6717135f4d13bf350968618dadda143b9b7e16f0bd927"
  },
  {
    "path": "scripts/db/official-truth-v3-durable-jobs-1/native-adapter.ts",
    "bytes": 13389,
    "blob": "66e7dd443c51b7db8d90d99c8b6422d1226ff237",
    "sha256": "5c34ce52023d7840e09d004d9c577a2bd4dc78efb3171e7e7b8aff07b0cf7b57"
  },
  {
    "path": "scripts/db/official-truth-v3-method-authority-1/auth-fixture.ts",
    "bytes": 6536,
    "blob": "eaa35fd57eee7b7c86de91dd77e96ef263f61d8b",
    "sha256": "cb54b668c206c5b7d26f423ca679701070bb39a7fbe43771a9c04ad232322a58"
  },
  {
    "path": "scripts/db/official-truth-v3-method-authority-1/native-adapter.ts",
    "bytes": 13880,
    "blob": "30a4731214a6bc7e4508ee0183027903d550d51d",
    "sha256": "9175bc8a52b79dc40783467949f6fb8f5f81d2eb90894af89ddf3bb77d321dcc"
  },
  {
    "path": "types/trips.ts",
    "bytes": 17666,
    "blob": "15b8506a5c005bb7a5afcc466bc26881e3083d6d",
    "sha256": "cdf7a10fa6060cc732e923c7e7239dafe58f26e1e79cd057e62ea14ebefcf3d4"
  },
  {
    "path": "scripts/db/profile-authority-integrity-1/install-candidate.sql",
    "bytes": 36608,
    "blob": "1b7e36b8100e5425a833d7c44189ab6632611308",
    "sha256": "2dda7f1bd523e5046bcc72f352a876133d1c7ed01994eb7687c6d1c9d3218774"
  },
  {
    "path": "scripts/db/profile-authority-integrity-1/observed-baseline.json",
    "bytes": 38527,
    "blob": "bd32f072ae7d8edaee67297a26adab9c3a886d73",
    "sha256": "0e586796b8cdd4c420992e7c6e6c0978fa266d49915d9dc47c2f44425a0d6fa8"
  },
  {
    "path": "scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql",
    "bytes": 10945,
    "blob": "9a8144e27405f93b9c0e5d003923efe8883bb4b4",
    "sha256": "3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-method-authority-1/install-candidate.sql",
    "bytes": 69705,
    "blob": "9c17260c202e430e4c779e47fee0a62c047c4d87",
    "sha256": "edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-method-authority-1/recovery-candidate.sql",
    "bytes": 37227,
    "blob": "477c646b4c886f4532d1f938cdf9ce2ba95711a9",
    "sha256": "c8f6a40f72b5f36d0a0808e6fe0c7444bdb93fce3cbb6c5f580b14daeb19d13d"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-intake-store-1/install-candidate.sql",
    "bytes": 124354,
    "blob": "faac74e6ab56072f01d941d24a8be28aa7895d94",
    "sha256": "f2a3f1b8a2845b2706d06dbef66c225c1836d9398e65682a01bf19d035018ac0"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-intake-store-1/recovery-candidate.sql",
    "bytes": 43309,
    "blob": "fc902540cea4c34783bdedbcde2be8a77a9fe672",
    "sha256": "ce7159cb345285b6f9877d36acc8d3f3b321f11852eb373163498524da3941db"
  },
  {
    "path": "scripts/db/official-truth-v3-human-method-transport-1/install-candidate.sql",
    "bytes": 53457,
    "blob": "6c5c36009e70468e96c8ecfe188cc4109b434716",
    "sha256": "727e83dbed7f0a6b127c3003248d85acc6b920fddc44356cdfeb8f3f57a82d2c"
  },
  {
    "path": "scripts/db/official-truth-v3-human-method-transport-1/recovery-candidate.sql",
    "bytes": 82633,
    "sha256": "c81bc8f70b55353f6f5ed974cf387c07cf807a0ccbadbcb0fcaa8374606ea459",
    "blob": "e65d8438a798a33ff5ea193b168e5b1b4710618a"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-durable-jobs-1/install-candidate.sql",
    "bytes": 442952,
    "blob": "0c340ce778efca6e3643fd2ed9ea67e06116319b",
    "sha256": "2a6547bcf68ca7f164cd415c70871f86853662cdd7053a19cc675e0d5cbe9ba1"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-durable-jobs-1/recovery-candidate.sql",
    "bytes": 163333,
    "blob": "c1c6d8a204a470a45279013e8ab5c978ee339ba0",
    "sha256": "4022e7ea644e3626e0422a2fc3ac083a670b1fcdcf93a2a3f329e673b916edfa"
  },
  {
    "path": "scripts/db/official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql",
    "bytes": 10807,
    "blob": "4de6082b084cc24538733e7232a59778edb36a1f",
    "sha256": "e0cba309cff43eb44faf0ec88b61c3ab6bba38db7270f22004917bf248bb96a2"
  },
  {
    "path": "lib/readiness/official-truth-v3-composed-dev-1.test.ts",
    "bytes": 347,
    "blob": "655f8e5e1dbbf745b1304888bd6e1196f9edd9d4",
    "sha256": "dec04dcd65b21fa2c60ced3f99f16006580fbb5f00285914e554feb5d396f352"
  },
  {
    "path": "lib/readiness/official-truth-bounded-response-body.ts",
    "bytes": 1278,
    "blob": "783d802fff48a2969b86945515b159a513df76e9",
    "sha256": "186ad6dd5ebcf03cd25586775fefe17d652863cb04a2ba72a7be64c7ee4ca0a2"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/source/aa-bern-ch-de-current-article.ts",
    "bytes": 19120,
    "blob": "2dde246f2d3c549ad0f530fd2ec2b8e921c158d8",
    "sha256": "a6e4eeac83e0b9ee03b35ebd3ccbab887097d2572abd318526faa2fa6358067e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/source/aa-ch-de-definition.ts",
    "bytes": 3109,
    "blob": "840f21c99b9f4a35e78c21281046e5743835842a",
    "sha256": "f70dc95feabec51553faffdb517c96d36ac87e4154fc1d41a6741a3654a8ce94"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/source/aa-ch-de-issuer.ts",
    "bytes": 25409,
    "blob": "5b4ec00a5c863a689d01598ee4a05b90e3b61628",
    "sha256": "4b750c5370ec53b5a44d218c149309ed715846032965916b67309e69cf20f442"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/source/aa-ch-de-owned-read.ts",
    "bytes": 13612,
    "blob": "e08f89e2a8bf2f7f9344dd8e14a88a691aea5def",
    "sha256": "18fbdc571d85d62744fd132c6e0e8987487c448c2b50fbe830c56d4158a66100"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/source/aa-ch-de-qualification.ts",
    "bytes": 8412,
    "blob": "2335a1c2a7f0a5114ec5c467f5d4700d5e85c69e",
    "sha256": "b634cf95892c6209d974b0adf4c778c889313c5130c8eec4bc921611951b0c26"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program.ts",
    "bytes": 11290,
    "blob": "3460c7a0bd5744ceabc8dcda7e1c7108e79b13f2",
    "sha256": "e56733466881e26a0368838d7c69419479b2122322d72d144c727f124654a8a5"
  },
  {
    "path": "lib/readiness/official-truth-retrieval-physical-internal.ts",
    "bytes": 17726,
    "blob": "bd995580bee6adb6b1a213b17a6001caa8f0aeff",
    "sha256": "aa37e8a42581f4ee67cfd52e677cb7d09a804ac77043e2d20b85dc24cd467e3f"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/result/composition.ts",
    "bytes": 11424,
    "blob": "45b3a6f934ce73122f09d65aad6ee29cef6bd837",
    "sha256": "4cbfd123a92d70422f5706ef3a36778662d58b90bb8ae8c10f03b87ebf37b7b0"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/result/contract.ts",
    "bytes": 17006,
    "blob": "ba1e67ec4a512cc85ade31c315bf69a05ddf6cc2",
    "sha256": "5d4bb7bd380247f7b56a841c3e930ea84da59bcfc2cc5d71e6ee5969d63a78ea"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/result/postgres.ts",
    "bytes": 23896,
    "blob": "7a11fc86cf8553f6ec792065a8a19a201237377c",
    "sha256": "80958da5e5cacfc74f88c176b9e99266354efd9f3d68464afed02edfa163da8c"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/result/source-proof.ts",
    "bytes": 24113,
    "blob": "268743bdd378583a0745fac5b0c5defe096a4138",
    "sha256": "d17f92ece2feec486a6a82988977d8a0d60efa0c201effca82377235c40fd038"
  }
] as const
function pinnedFiles(): ReadonlyMap<string, string> {
  const files = new Map<string, string>()
  for (const pin of PINS) {
    assert.equal(files.has(pin.path), false, 'unique full-file prerequisite pin')
    const bytes = readFileSync(new URL(pin.path, ROOT))
    assert.equal(bytes.length, pin.bytes, pin.path + ' complete byte count')
    assert.equal(createHash('sha256').update(bytes).digest('hex'), pin.sha256, pin.path + ' complete SHA256')
    assert.equal(createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex'), pin.blob,
      pin.path + ' immutable Git blob identity')
    const text = bytes.toString('utf8')
    assert.deepEqual(Buffer.from(text, 'utf8'), bytes, pin.path + ' exact UTF8')
    files.set(pin.path, text)
  }
  return files
}
function file(files: ReadonlyMap<string, string>, path: string): string {
  const value = files.get(path); assert.ok(typeof value === 'string', 'missing exact prerequisite ' + path); return value
}
const PAI_CATALOG_SQL = "SELECT pg_catalog.jsonb_build_object(\n  'relation',(SELECT pg_catalog.jsonb_build_object(\n    'owner',pg_catalog.pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'kind',c.relkind,\n    'acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a))\n    FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),\n  'columns',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'number',a.attnum,\n    'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'raw_acl',a.attacl,\n    'identity',a.attidentity,'not_null',a.attnotnull,\n    'collation',CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::pg_catalog.regcollation::text END,\n    'generated',a.attgenerated) ORDER BY a.attnum)\n    FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum\n    WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb),\n  'constraints',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',c.conname,'kind',c.contype,'validated',c.convalidated,'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY c.conname)\n    FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),\n  'policies',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',p.polname,'roles',(SELECT pg_catalog.jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(r) END ORDER BY r) FROM pg_catalog.unnest(p.polroles) r),\n    'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'command',p.polcmd,'permissive',p.polpermissive,\n    'with_check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY p.polname)\n    FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),\n  'functions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'set',p.proretset,'kind',p.prokind,'name',p.proname,'owner',pg_catalog.pg_get_userbyid(p.proowner),\n    'config',p.proconfig,'strict',p.proisstrict,\n    'raw_acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),\n    'returns',pg_catalog.pg_get_function_result(p.oid),'defaults',p.pronargdefaults,'language',l.lanname,'parallel',p.proparallel,\n    'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),'leakproof',p.proleakproof,'volatility',p.provolatile,\n    'body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex'),\n    'security_definer',p.prosecdef,'definition',pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.proname,p.oid)\n    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang\n    WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten',\n      'hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),'[]'::jsonb),\n  'triggers',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',t.tgname,'type',t.tgtype,'enabled',t.tgenabled,'attributes',t.tgattr::text,\n    'definition',pg_catalog.pg_get_triggerdef(t.oid,true),'function_name',p.proname) ORDER BY t.tgname)\n    FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid\n    WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND NOT t.tgisinternal\n      AND t.tgname<>'profiles_autoritaet_integritaet_v1'),'[]'::jsonb),\n  'incoming_profile_foreign_keys',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'oid',c.oid,'name',c.conname,'relation_schema',n.nspname,'relation',r.relname,\n    'validated',c.convalidated,'deferrable',c.condeferrable,'deferred',c.condeferred,\n    'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY n.nspname,r.relname,c.conname)\n    FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class r ON r.oid=c.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace\n    WHERE c.contype='f' AND c.confrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb)\n) AS value"
const PAI_PRESERVED_SQL = "SELECT pg_catalog.jsonb_build_object(\n 'profile_relation',(SELECT pg_catalog.to_jsonb(c) FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),\n 'profile_attributes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0),\n 'profile_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.adnum) FROM pg_catalog.pg_attrdef d WHERE d.adrelid='public.profiles'::pg_catalog.regclass),\n 'profile_constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(c) ORDER BY c.oid) FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass OR c.confrelid='public.profiles'::pg_catalog.regclass),\n 'profile_indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('index',pg_catalog.to_jsonb(i),'relation',pg_catalog.to_jsonb(c),'definition',pg_catalog.pg_get_indexdef(i.indexrelid)) ORDER BY i.indexrelid)\n   FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indexrelid WHERE i.indrelid='public.profiles'::pg_catalog.regclass),\n 'profile_policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),\n 'old_triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_trigger t\n   WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname<>'profiles_autoritaet_integritaet_v1'),\n 'old_functions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace\n   WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten','hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),\n 'public_namespace',(SELECT pg_catalog.to_jsonb(n) FROM pg_catalog.pg_namespace n WHERE n.nspname='public'),\n 'creator_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d\n   WHERE d.defaclrole='postgres'::pg_catalog.regrole AND (d.defaclnamespace=0 OR d.defaclnamespace='public'::pg_catalog.regnamespace)),\n 'principals',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,'super',r.rolsuper,\n   'inherit',r.rolinherit,'create_role',r.rolcreaterole,'create_db',r.rolcreatedb,'login',r.rolcanlogin,\n   'replication',r.rolreplication,'bypass',r.rolbypassrls,'connection_limit',r.rolconnlimit) ORDER BY r.oid)\n   FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')),\n 'principal_memberships',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) ORDER BY m.oid) FROM pg_catalog.pg_auth_members m\n   WHERE m.roleid IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin'))\n      OR m.member IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')))\n) AS value"
const PAI_NEW_OBJECT_SQL = "SELECT p.oid::text AS function_oid,p.proowner::regrole::text AS owner,p.prosecdef::text,p.proconfig::text,p.proacl::text,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') AS body_sha256,t.oid::text AS trigger_oid,t.tgtype::text,t.tgenabled,t.tgargs::text,t.tgattr::text FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace LEFT JOIN pg_catalog.pg_trigger t ON t.tgfoid=p.oid AND t.tgrelid='public.profiles'::regclass WHERE n.nspname='public' AND p.proname='profil_autoritaet_integritaet_pruefen_v1' ORDER BY p.oid,t.oid"
const HM04_IDENTITY_SQL = "WITH scope_schemas AS (\n  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')\n), scope_tables AS (\n  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'\n), scope_classes AS (\n  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace\n  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0\n  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0\n), scope_objects AS (\n  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n\n  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c\n  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace\n  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace\n  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid\n  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid\n  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid\n  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid\n)\nSELECT pg_catalog.jsonb_build_object(\n  'package','HM04-v1-A1',\n  'original_jobs_sha256','0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4',\n  'database',pg_catalog.jsonb_build_object('name',d.datname,'oid',d.oid),\n  'creator','postgres'::pg_catalog.regrole::oid,\n  'roles',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',r.rolname,'oid',r.oid) ORDER BY r.rolname)\n    FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner')),\n  'objects',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('catalog',o.classid::pg_catalog.regclass::text,\n    'identity',pg_catalog.pg_describe_object(o.classid,o.objid,0),'oid',o.objid) ORDER BY o.classid,o.objid) FROM scope_objects o)\n) AS hm04_identity FROM pg_catalog.pg_database d WHERE d.datname=current_database()"
const HS1_IDENTITY_SQL = "WITH scope_schemas AS (\n  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n\n  WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')\n), scope_tables AS (\n  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'\n), scope_classes AS (\n  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace\n  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0\n  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0\n), scope_objects AS (\n  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n\n  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c\n  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace\n  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace\n  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid\n  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid\n  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid\n  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid\n)\nSELECT pg_catalog.jsonb_build_object(\n  'package','HS1-v1',\n  'database',pg_catalog.jsonb_build_object('name',d.datname,'oid',d.oid),\n  'roles',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',r.rolname,'oid',r.oid) ORDER BY r.rolname)\n    FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller')),\n  'objects',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('catalog',o.classid::pg_catalog.regclass::text,\n      'identity',pg_catalog.pg_describe_object(o.classid,o.objid,0),'oid',o.objid) ORDER BY o.classid,o.objid)\n    FROM scope_objects o)\n) AS hs1_identity\nFROM pg_catalog.pg_database d WHERE d.datname=current_database()"
const GUARD_SHA256 = 'b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d'
const IDENTITY_SQL = `SELECT pg_catalog.pg_backend_pid()::text AS pid,a.backend_start::text AS birth,
session_user::text AS login,current_user::text AS role,session_user::pg_catalog.regrole::oid::text AS login_oid
FROM pg_catalog.pg_stat_activity a WHERE a.pid=pg_catalog.pg_backend_pid()`
type Identity = Readonly<{ pid: string; birth: string; login: string; role: string; login_oid: string }>
type Connected = Readonly<{ connection: LocalPgConnection; identity: Identity }>
type Native = Awaited<ReturnType<typeof createM04NativeExecutors>>
type Method = Awaited<ReturnType<typeof createMa1NativeExecutor>>
type TechnicalIdentity = Readonly<{ login: string; role: string; loginOid: string; creatorOid: string; automaticOid: string; callerOid?: string; runtimeOid?: string }>
type Receipt = Readonly<{ status: string; operationId: string; action: string; command: unknown; actorId: string; recordedAt: string; before: unknown; after: unknown }>
const text = (values: readonly (string | number | null)[]) => values.map(v => pgText(v === null ? '' : String(v)))
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const operationId = (n: number) => 'maop1_' + n.toString(16).padStart(32, '0')
function value(rows: PgRows, column = 'value'): unknown {
  assert.equal(rows.length, 1); const v = rows[0]?.[column]; assert.equal(typeof v, 'string'); return JSON.parse(v!)
}
function scalar(rows: PgRows, column: string): string {
  assert.equal(rows.length, 1); const v = rows[0]?.[column]; assert.equal(typeof v, 'string'); return v!
}
const stateError = (code: string) => (error: unknown) => error instanceof LocalPgError && error.code === code
async function connect(lifetime: OwnedTestLifetime, cluster: LocalProofCluster, login = cluster.user,
  expectedLoginOid?: string, role?: string): Promise<Connected> {
  lifetime.check()
  const connection = await LocalPgConnection.connect(cluster, login)
  // Fresh actual identity is captured before any mutation, claims or SET ROLE.
  const rows = await connection.query(IDENTITY_SQL)
  assert.equal(rows.length, 1)
  const row = rows[0]!
  assert.deepEqual(Object.keys(row).sort(), ['birth', 'login', 'login_oid', 'pid', 'role'])
  for (const key of ['pid', 'login_oid'] as const) assert.match(row[key]!, /^[1-9][0-9]{0,9}$/)
  assert.ok(row.birth && row.birth.length >= 19 && row.birth.length <= 64)
  assert.equal(row.login, login); assert.equal(row.role, login)
  if (expectedLoginOid !== undefined) assert.equal(row.login_oid, expectedLoginOid, 'original Creator-issued LOGIN identity')
  const identity: Identity = Object.freeze({ pid: row.pid!, birth: row.birth!, login, role: login, login_oid: row.login_oid! })
  if (role !== undefined) {
    assert.ok(['authenticated', 'ot_v3_jobs_caller', 'ot_v3_intake_caller', 'ot_v3_method_reader'].includes(role))
    await connection.query('SET ROLE ' + role)
    assert.deepEqual(await connection.query('SELECT session_user::text AS login,current_user::text AS role'),
      [{ login, role }])
  }
  return { connection, identity }
}
async function setClaims(connection: LocalPgConnection, person: 1 | 2 | 3): Promise<void> {
  const claims = { sub: uid(person), session_id: uid(person + 200), role: 'authenticated',
    aal: person === 3 ? 'aal1' : 'aal2', exp: Math.floor(Date.now() / 1000) + 300 }
  // Clear the alternative uid/jwt channels too; unique result columns preserve
  // the unchanged original wire parser's closed column-name contract.
  await connection.query(`SELECT pg_catalog.set_config('request.jwt.claims',$1::text,false) AS claims,
    pg_catalog.set_config('request.jwt.claim','',false) AS legacy_claim,
    pg_catalog.set_config('request.jwt.claim.sub','',false) AS legacy_sub`, text([JSON.stringify(claims)]))
  assert.deepEqual(await connection.query('SELECT auth.uid()::text AS actor'), [{ actor: uid(person) }])
  const observed = value(await connection.query('SELECT auth.jwt() AS value'))
  assert.deepEqual(observed, claims)
}


// Logical object identity and authority metadata; volatile storage statistics
// (relpages/reltuples/freeze horizons) are not privilege or function identity.
// Every selected object OID, definition, owner, ACL, role/edge/default, dependency
// and description is retained. DML histories have a separate exact snapshot.
const CATALOG_SQL = `WITH ns AS (
 SELECT oid FROM pg_catalog.pg_namespace WHERE nspname='public' OR nspname='auth' OR nspname='jetnity_ot_auth'
   OR nspname IN ('official_v3_method_private','official_v3_method_api',
     'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api')
), rel AS (
 SELECT oid FROM pg_catalog.pg_class WHERE relnamespace IN (SELECT oid FROM ns)
 UNION SELECT reltoastrelid FROM pg_catalog.pg_class WHERE relnamespace IN (SELECT oid FROM ns) AND reltoastrelid<>0
 UNION SELECT i.indexrelid FROM pg_catalog.pg_index i WHERE i.indrelid IN (
   SELECT reltoastrelid FROM pg_catalog.pg_class WHERE relnamespace IN (SELECT oid FROM ns) AND reltoastrelid<>0)
), objects AS (
 SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,oid AS objid FROM ns
 UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,oid FROM rel
 UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,oid FROM pg_catalog.pg_proc WHERE pronamespace IN (SELECT oid FROM ns)
 UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,oid FROM pg_catalog.pg_type WHERE typnamespace IN (SELECT oid FROM ns)
 UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,oid FROM pg_catalog.pg_constraint WHERE conrelid IN (SELECT oid FROM rel) OR connamespace IN (SELECT oid FROM ns)
 UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,oid FROM pg_catalog.pg_trigger WHERE tgrelid IN (SELECT oid FROM rel)
 UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,oid FROM pg_catalog.pg_policy WHERE polrelid IN (SELECT oid FROM rel)
 UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,oid FROM pg_catalog.pg_attrdef WHERE adrelid IN (SELECT oid FROM rel)
 UNION SELECT 'pg_catalog.pg_default_acl'::pg_catalog.regclass,oid FROM pg_catalog.pg_default_acl
), db AS (SELECT oid FROM pg_catalog.pg_database WHERE datname=current_database())
SELECT pg_catalog.jsonb_build_object(
 'namespaces',(SELECT COALESCE(jsonb_agg(to_jsonb(n) ORDER BY n.oid),'[]'::jsonb) FROM pg_catalog.pg_namespace n WHERE n.oid IN (SELECT oid FROM ns)),
 'classes',(SELECT COALESCE(jsonb_agg(jsonb_build_object('oid',c.oid,'name',c.relname,'namespace',c.relnamespace,'type',c.reltype,
   'owner',c.relowner,'am',c.relam,'tablespace',c.reltablespace,'toast',c.reltoastrelid,'hasindex',c.relhasindex,
   'shared',c.relisshared,'persistence',c.relpersistence,'kind',c.relkind,'natts',c.relnatts,'checks',c.relchecks,
   'rules',c.relhasrules,'triggers',c.relhastriggers,'subclass',c.relhassubclass,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,
   'populated',c.relispopulated,'replica_identity',c.relreplident,'partition',c.relispartition,
   'acl',c.relacl,'options',c.reloptions,'partbound',c.relpartbound) ORDER BY c.oid),'[]'::jsonb)
   FROM pg_catalog.pg_class c WHERE c.oid IN (SELECT oid FROM rel)),
 'attributes',(SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.attrelid,a.attnum),'[]'::jsonb) FROM pg_catalog.pg_attribute a WHERE a.attrelid IN (SELECT oid FROM rel)),
 'defaults',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.oid),'[]'::jsonb) FROM pg_catalog.pg_attrdef d WHERE d.adrelid IN (SELECT oid FROM rel)),
 'constraints',(SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.oid),'[]'::jsonb) FROM pg_catalog.pg_constraint c WHERE c.conrelid IN (SELECT oid FROM rel) OR c.connamespace IN (SELECT oid FROM ns)),
 'indexes',(SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid),'[]'::jsonb) FROM pg_catalog.pg_index i WHERE i.indrelid IN (SELECT oid FROM rel)),
 'policies',(SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.oid),'[]'::jsonb) FROM pg_catalog.pg_policy p WHERE p.polrelid IN (SELECT oid FROM rel)),
 'triggers',(SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY g.oid),'[]'::jsonb) FROM pg_catalog.pg_trigger g WHERE g.tgrelid IN (SELECT oid FROM rel)),
 'functions',(SELECT COALESCE(jsonb_agg((to_jsonb(p)-'prosrc'-'prosqlbody')||jsonb_build_object(
   'body_sha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),
   'parsed_body_sha256',CASE WHEN p.prosqlbody IS NULL THEN NULL ELSE encode(sha256(convert_to(p.prosqlbody::text,'UTF8')),'hex') END,
   'definition_sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::jsonb)
   FROM pg_catalog.pg_proc p WHERE p.pronamespace IN (SELECT oid FROM ns)),
 'types',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::jsonb) FROM pg_catalog.pg_type t WHERE t.typnamespace IN (SELECT oid FROM ns)),
 'enums',(SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.oid),'[]'::jsonb) FROM pg_catalog.pg_enum e WHERE e.enumtypid IN (SELECT oid FROM pg_catalog.pg_type WHERE typnamespace IN (SELECT oid FROM ns))),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_roles r),
 'memberships',(SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.oid),'[]'::jsonb) FROM pg_catalog.pg_auth_members m),
 'role_settings',(SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole),'[]'::jsonb) FROM pg_catalog.pg_db_role_setting s),
 'default_acls',(SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.oid),'[]'::jsonb) FROM pg_catalog.pg_default_acl a),
 'database',(SELECT to_jsonb(d)-'datfrozenxid'-'datminmxid'
   FROM pg_catalog.pg_database d WHERE d.oid IN (SELECT oid FROM db)),
 'dependencies',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype),'[]'::jsonb)
   FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM objects o WHERE (d.classid=o.classid AND d.objid=o.objid) OR (d.refclassid=o.classid AND d.refobjid=o.objid))),
 'shared_dependencies',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype),'[]'::jsonb)
   FROM pg_catalog.pg_shdepend d WHERE d.dbid IN (SELECT oid FROM db)),
 'descriptions',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid),'[]'::jsonb)
   FROM pg_catalog.pg_description d WHERE EXISTS(SELECT 1 FROM objects o WHERE d.classoid=o.classid AND d.objoid=o.objid))
) AS value`
const PROFILE_ROWS_SQL = 'SELECT id::text,user_id::text,role,created_at::text,avatar_url,email,status,last_seen_at::text,display_name FROM public.profiles ORDER BY user_id'
const AUTH_ROWS_SQL = `SELECT jsonb_build_object(
 'users',(SELECT jsonb_agg(to_jsonb(u) ORDER BY u.id) FROM auth.users u),
 'sessions',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.id) FROM auth.sessions s)) AS value`
const METHOD_HISTORY_SQL = `SELECT jsonb_build_object(
 'revisions',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.method_id,t.revision),'[]'::jsonb) FROM official_v3_method_private.revisions_v1 t),
 'heads',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.method_id),'[]'::jsonb) FROM official_v3_method_private.heads_v1 t),
 'operations',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.operation_id),'[]'::jsonb) FROM official_v3_method_private.operations_v1 t)
) AS value`
const EFFECT_HISTORY_SQL = `SELECT jsonb_build_object(
 'intake_operations',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.operation_id),'[]'::jsonb) FROM official_v3_intake_private.operations_v1 t),
 'intake_reservations',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_intake_private.reservations_v1 t),
 'intake_completions',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_intake_private.completions_v1 t),
 'occupied_slots',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.slot_id),'[]'::jsonb) FROM official_v3_jobs_private.slots_v1 t WHERE t.job_key IS NOT NULL),
 'subjects',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.job_key),'[]'::jsonb) FROM official_v3_jobs_private.subjects_v1 t),
 'queue_operations',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_jobs_private.queue_operations_v1 t),
 'execution_starts',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_jobs_private.execution_starts_v1 t),
 'execution_results',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_jobs_private.execution_results_v1 t),
 'execution_dispositions',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_jobs_private.execution_dispositions_v1 t)
) AS value`
const FINGERPRINT_SQL = 'SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.object_identity),\'[]\'::jsonb) AS value FROM official_v3_jobs_private.catalog_binding_v1 b'
async function catalog(connection: LocalPgConnection): Promise<unknown> { return value(await connection.query(CATALOG_SQL)) }
async function methodHistory(connection: LocalPgConnection): Promise<unknown> { return value(await connection.query(METHOD_HISTORY_SQL)) }
async function effectHistory(connection: LocalPgConnection): Promise<unknown> { return value(await connection.query(EFFECT_HISTORY_SQL)) }
function assertEmptyHistory(snapshot: unknown): void {
  assert.ok(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot))
  for (const [table, rows] of Object.entries(snapshot)) assert.deepEqual(rows, [], 'no history in ' + table)
}
async function proveAbsent(lifetime: OwnedTestLifetime, observer: LocalPgConnection, ids: readonly Identity[]): Promise<void> {
  const target = JSON.stringify(ids.map(({ pid, birth }) => ({ pid, birth })))
  const deadline = performance.now() + 3000
  for (let attempt = 0; attempt < 20; attempt++) {
    lifetime.check()
    const n = scalar(await observer.query(`SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity a
      JOIN pg_catalog.jsonb_to_recordset($1::jsonb) AS t(pid integer,birth timestamptz)
        ON a.pid=t.pid AND a.backend_start=t.birth`, text([target])), 'n')
    if (n === '0') return
    if (performance.now() >= deadline) break
    await lifetime.wait(10)
  }
  assert.fail('owned exact PID/birth remained after bounded close')
}


async function creatorIdentity(connection: LocalPgConnection): Promise<void> {
  assert.deepEqual(await connection.query(`SELECT session_user::text AS login,current_user::text AS role,
    r.rolcanlogin::text AS can_login,r.rolsuper::text AS superuser,r.rolinherit::text AS inherit,
    r.rolcreaterole::text AS create_role,r.rolcreatedb::text AS create_db,r.rolreplication::text AS replication,
    r.rolbypassrls::text AS bypass,r.rolconnlimit::text AS connection_limit,r.rolvaliduntil::text AS valid_until,
    r.rolconfig::text AS config,current_setting('createrole_self_grant') AS self_grant,
    (SELECT count(*)::text FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid) AS database_settings
    FROM pg_catalog.pg_roles r WHERE r.rolname=session_user`),
  [{ login: 'postgres', role: 'postgres', can_login: 'true', superuser: 'false', inherit: 'true',
    create_role: 'true', create_db: 'true', replication: 'true', bypass: 'true',
    connection_limit: '-1', valid_until: null, config: null, self_grant: '', database_settings: '0' }])
}
async function technicalIdentity(creator: LocalPgConnection, original: TechnicalIdentity, bound: boolean): Promise<void> {
  await creatorIdentity(creator)
  const x = original
  assert.deepEqual(await creator.query(`SELECT r.oid::text AS login_oid,r.rolcanlogin::text AS login,r.rolinherit::text AS inherit,
    r.rolsuper::text AS superuser,r.rolcreatedb::text AS create_db,r.rolcreaterole::text AS create_role,
    r.rolreplication::text AS replication,r.rolbypassrls::text AS bypass,r.rolconfig::text AS config,
    r.rolconnlimit::text AS connection_limit,r.rolvaliduntil::text AS valid_until,
    has_database_privilege(r.oid,current_database(),'CREATE')::text AS database_create,
    has_database_privilege(r.oid,current_database(),'CONNECT')::text AS database_connect,
    (SELECT count(*)::text FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid) AS database_settings,
    pg_has_role($2::oid,r.oid,'USAGE')::text AS creator_usage,pg_has_role($2::oid,r.oid,'SET')::text AS creator_set
    FROM pg_catalog.pg_roles r WHERE r.rolname=$1::text`, text([x.login, x.creatorOid])),
  [{ login_oid: x.loginOid, login: 'true', inherit: 'false', superuser: 'false', create_db: 'false', create_role: 'false',
    replication: 'false', bypass: 'false', config: null, connection_limit: '-1', valid_until: null,
    database_create: 'false', database_connect: 'true', database_settings: '0', creator_usage: 'false', creator_set: 'false' }])
  const actual = await creator.query(`SELECT m.oid::text AS oid,m.roleid::text AS role_oid,m.member::text AS member_oid,
    m.grantor::text AS grantor_oid,m.admin_option::text AS admin,m.inherit_option::text AS inherit,m.set_option::text AS set_option
    FROM pg_catalog.pg_auth_members m WHERE m.roleid=$1::oid OR m.member=$1::oid OR m.grantor=$1::oid ORDER BY m.oid`, text([x.loginOid]))
  const expected = [{ oid: x.automaticOid, role_oid: x.loginOid, member_oid: x.creatorOid, grantor_oid: '10',
    admin: 'true', inherit: 'false', set_option: 'false' }]
  if (bound) {
    assert.ok(x.callerOid && x.runtimeOid)
    expected.push({ oid: x.runtimeOid, role_oid: x.callerOid, member_oid: x.loginOid, grantor_oid: x.creatorOid,
      admin: 'false', inherit: 'false', set_option: 'true' })
  }
  expected.sort((a, b) => Number(a.oid) - Number(b.oid))
  assert.deepEqual(actual, expected, 'exact automatic and optional runtime edges, including original membership OIDs')
}
const HMT_WRAPPERS = [
  { name: 'official_v3_method_approve_v1', types: 'text,text,integer,text,text,integer,text,text,integer,text,text,text', target: 'approve_v1' },
  { name: 'official_v3_method_confirm_operation_v1', types: 'text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text', target: 'confirm_operation_v1' },
  { name: 'official_v3_method_revoke_v1', types: 'text,text,integer,text,text,integer', target: 'revoke_v1' },
  { name: 'official_v3_method_stage_draft_v1', types: 'text,text,integer,text,text,integer', target: 'stage_draft_v1' },
] as const
async function wrapperIdentity(bootstrap: LocalPgConnection): Promise<PgRows> {
  const all = await bootstrap.query(`SELECT p.proname,p.oid::text AS oid,p.proowner::regrole::text AS owner,
    p.prosecdef::text AS definer,l.lanname AS language,p.proconfig::text AS config,
    (p.prosqlbody IS NOT NULL)::text AS parsed
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang
    WHERE n.nspname='public' AND p.proname=ANY($1::text[]) ORDER BY p.proname`,
  text(['{' + HMT_WRAPPERS.map(x => x.name).join(',') + '}']))
  assert.equal(all.length, 4)
  for (let index = 0; index < HMT_WRAPPERS.length; index++) {
    const w = HMT_WRAPPERS[index]!, row = all[index]!
    assert.ok(row.oid)
    assert.deepEqual(row, { proname: w.name, oid: row.oid, owner: 'postgres', definer: 'false',
      language: 'sql', config: '{search_path=pg_catalog}', parsed: 'true' })
    const own = 'public.' + w.name + '(' + w.types + ')'
    const target = 'official_v3_method_api.' + w.target + '(' + w.types + ')'
    assert.deepEqual(await bootstrap.query(`SELECT d.refobjid::text AS target_oid,d.deptype::text AS dependency,
      d.objsubid::text AS subid,d.refobjsubid::text AS target_subid
      FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_proc p ON p.oid=d.refobjid
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.objid=$1::pg_catalog.regprocedure
        AND d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass AND n.nspname='official_v3_method_api'`, text([own])),
    [{ target_oid: scalar(await bootstrap.query('SELECT $1::pg_catalog.regprocedure::oid::text AS oid', text([target])), 'oid'),
      dependency: 'n', subid: '0', target_subid: '0' }], 'parsed SQL RETURN preserves its exact HMA dependency')
  }
  return all
}
// Failure-only measurement of the fourteen exact, already-pinned HM04 catalog
// SELECT expressions. This never changes guards, catalog data, JIT or application
// budgets. Its 15s window includes startup and actual owned backend disappearance.
const C03_CATALOG_COMPONENT_PINS = [
  {
    "component": "jobs-functions",
    "bytes": 10270,
    "sha256": "ab72ef1eb97f37cb16b8222bd35cec2da6fd18684c4700cc1bca83e4e066e720"
  },
  {
    "component": "jobs-relations",
    "bytes": 1874,
    "sha256": "1adf44f61c95156c13b022e8aacc29a9d594b8e8f6da0b6e427af0f56a06aefa"
  },
  {
    "component": "jobs-types",
    "bytes": 365,
    "sha256": "7df581650c5d6746705e7f9a532b3d2b8dc1a3d48387d91439d138b237a7794c"
  },
  {
    "component": "jobs-schemas",
    "bytes": 315,
    "sha256": "1ece741cca1dbe662e78d50ed0ff298545910e48d82c1001df35120e99856aca"
  },
  {
    "component": "jobs-dependencies",
    "bytes": 2962,
    "sha256": "d733c4d06d5fdf0efdaf96c2efbc0aa27070cea4ef3526d1659a349f61273095"
  },
  {
    "component": "prerequisite-functions",
    "bytes": 645,
    "sha256": "f378ff95c868b19e096b223cabb1a6ac4ed7fc84ed4dbb855a9d321c1e4c6bf1"
  },
  {
    "component": "prerequisite-relations",
    "bytes": 1950,
    "sha256": "2e73b6bf750932e04361d789bf8f7db8d94985437baf9cc93fc1d6589d2e4d72"
  },
  {
    "component": "prerequisite-types",
    "bytes": 441,
    "sha256": "2c34984dfdf6e9b0c9326a06b6615e6b943511886f284b658ac89abd66162310"
  },
  {
    "component": "prerequisite-schemas",
    "bytes": 391,
    "sha256": "9732bc8a02ef2a46b20847b9c6708324c460050ea36dcd45328a504a2a645397"
  },
  {
    "component": "prerequisite-dependencies",
    "bytes": 3038,
    "sha256": "7002cc18724092f460368cc694f80fc8cf15b6a1c38b917c1315d1176b34d408"
  },
  {
    "component": "protected-roles",
    "bytes": 838,
    "sha256": "e9e90add47c7d55ec7ab3ed595da16841b0ede2096dbab5ae2fee60b53a7419b"
  },
  {
    "component": "creator-edges",
    "bytes": 763,
    "sha256": "04f9237bd8d4dea322a0f02380c07424f171724b1463fb040c9fd9f91b47782a"
  },
  {
    "component": "creator-defaults",
    "bytes": 721,
    "sha256": "50fcf6733c38a6ccef0ed3381da2c3f9d53b49a1fd519e0408917c9759921452"
  },
  {
    "component": "database",
    "bytes": 570,
    "sha256": "a97fb6b34550ba9b9e2249295f7338907dfced08f5d5978bd971290f154fa865"
  }
] as const
async function measureC03CatalogComponents(lifetime: OwnedTestLifetime,
  common: { cluster: LocalProofCluster; observer: Connected }, files: ReadonlyMap<string, string>): Promise<void> {
  const source = file(files, 'scripts/db/official-truth-v3-hosted-durable-jobs-1/install-candidate.sql')
  const start = source.indexOf('CREATE FUNCTION official_v3_jobs_private.assert_catalog_v1()')
  assert.ok(start >= 0)
  const end = source.indexOf('\nEND $$;', start)
  assert.ok(end > start)
  const expressions = [...source.slice(start, end).matchAll(/  SELECT q\.value INTO actual_value FROM \(\n([\s\S]*?)\n  \) q;\n  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='([^']+)';/g)]
  assert.equal(expressions.length, C03_CATALOG_COMPONENT_PINS.length)
  for (const [index, match] of expressions.entries()) {
    const pin = C03_CATALOG_COMPONENT_PINS[index]!
    assert.equal(match[2], pin.component)
    assert.equal(Buffer.byteLength(match[1]!, 'utf8'), pin.bytes)
    assert.equal(createHash('sha256').update(match[1]!).digest('hex'), pin.sha256)
  }
  const started = performance.now(), deadline = started + 15_000
  let measurement: Connected | undefined, expired = false, closeRequested = false, absenceProved = false
  const closeMeasurement = () => { if (measurement && !closeRequested) { closeRequested = true; measurement.connection.close() } }
  const finiteNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
  // C03 has already failed. A real stop of this owned synthetic cluster bounds
  // acquisition/SQL/rollback too; a timeout cannot leave a measurement actor alive.
  const timer = setTimeout(() => { expired = true; lifetime.stopCluster(common.cluster) }, 15_000)
  try {
    measurement = await connect(lifetime, common.cluster)
    await measurement.connection.query('BEGIN READ ONLY')
    await measurement.connection.query('SET LOCAL ROLE ot_v3_jobs_owner')
    assert.deepEqual(await measurement.connection.query("SELECT current_user::text AS role,current_setting('transaction_read_only') AS read_only"),
      [{ role: 'ot_v3_jobs_owner', read_only: 'on' }])
    for (const [index, match] of expressions.entries()) {
      lifetime.check()
      const remaining = Math.floor(deadline - performance.now())
      assert.ok(!expired && remaining > 0 && remaining <= 15_000)
      await measurement.connection.query("SET LOCAL statement_timeout='" + remaining + "ms'; SET LOCAL lock_timeout='1s'")
      const componentStarted = performance.now()
      const planValue = value(await measurement.connection.query('EXPLAIN (ANALYZE, FORMAT JSON, SUMMARY ON) ' + match[1]!), 'QUERY PLAN')
      assert.ok(Array.isArray(planValue) && planValue.length === 1 && planValue[0] && typeof planValue[0] === 'object')
      const plan = planValue[0] as Record<string, unknown>
      const jit = plan.JIT && typeof plan.JIT === 'object' ? plan.JIT as Record<string, unknown> : {}
      const timing = jit.Timing && typeof jit.Timing === 'object' ? jit.Timing as Record<string, unknown> : {}
      console.error('COMPOSED_C03_CATALOG_COMPONENT_DIAG', JSON.stringify({
        component: C03_CATALOG_COMPONENT_PINS[index]!.component,
        wallMs: Math.ceil(performance.now() - componentStarted),
        planningMs: finiteNumber(plan['Planning Time']), executionMs: finiteNumber(plan['Execution Time']),
        jitFunctions: finiteNumber(jit.Functions), jitGenerationMs: finiteNumber(timing.Generation),
        jitInliningMs: finiteNumber(timing.Inlining), jitOptimizationMs: finiteNumber(timing.Optimization),
        jitEmissionMs: finiteNumber(timing.Emission), jitTotalMs: finiteNumber(timing.Total),
      }))
    }
    await measurement.connection.query('ROLLBACK')
    closeMeasurement()
    await proveAbsent(lifetime, common.observer.connection, [measurement.identity])
    absenceProved = true
    assert.ok(!expired && performance.now() < deadline)
    console.error('COMPOSED_C03_CATALOG_MEASUREMENT', JSON.stringify({ status: 'closed', components: expressions.length,
      elapsedMs: Math.ceil(performance.now() - started) }))
  } catch (error) {
    // No plan trees, SQL, result rows, identities or error messages are emitted.
    console.error('COMPOSED_C03_CATALOG_MEASUREMENT', JSON.stringify({ status: expired ? 'expired' : 'unavailable',
      elapsedMs: Math.ceil(performance.now() - started),
      code: error instanceof LocalPgError && /^[0-9A-Z]{5}$/.test(error.code) ? error.code : null }))
  } finally {
    closeMeasurement()
    if (measurement && !expired && !absenceProved) {
      try { await proveAbsent(lifetime, common.observer.connection, [measurement.identity]) }
      catch { lifetime.stopCluster(common.cluster) }
    }
    clearTimeout(timer)
  }
}

async function makeCommon(lifetime: OwnedTestLifetime, cluster: LocalProofCluster, files: ReadonlyMap<string, string>) {
  const bootstrap = await connect(lifetime, cluster), observer = await connect(lifetime, cluster)
  const owner = bootstrap.connection
  const version = Number(scalar(await owner.query("SELECT current_setting('server_version_num') AS version"), 'version'))
  assert.ok(Number.isInteger(version) && version >= 170000 && version < 180000, 'actual PG17 required, no fallback')
  assert.equal(scalar(await owner.query("SELECT current_setting('server_encoding') AS encoding"), 'encoding'), 'UTF8')
  assert.equal(bootstrap.identity.login_oid, '10', 'actual original owned cluster bootstrap')
  await observer.connection.query("SET statement_timeout='1s'; SET lock_timeout='1s'")
  await owner.query(file(files, 'scripts/db/official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql'))
  const creator = await connect(lifetime, cluster, 'postgres')
  await creatorIdentity(creator.connection)
  await owner.query('SET search_path=pg_catalog,public,extensions')
  const publicBaseline = await owner.query(`SELECT n.oid::text AS oid,n.nspowner::text AS owner,n.nspacl::text AS acl,
    (SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid)::text FROM pg_catalog.pg_default_acl d WHERE d.defaclnamespace=2200) AS defaults
    FROM pg_catalog.pg_namespace n WHERE n.nspname='public'`)
  assert.equal(publicBaseline[0]?.oid, '2200')
  assert.ok(publicBaseline[0]?.owner && publicBaseline[0]?.acl && publicBaseline[0]?.defaults)
  // Finite synthetic users, real auth.sessions, and real profile rows. Seed once.
  // Owner 1 is AAL2; moderator 2 is AAL2; Owner 3 is AAL1; user 8 is only a
  // foreign-key-valid rebind target. No later reset/TRUNCATE/Auth fixture helper.
  for (const person of [1, 2, 3, 8]) {
    await owner.query("INSERT INTO auth.users(id,email) VALUES($1::uuid,$2::text)", text([uid(person), 'composed-' + person + '@example.invalid']))
    await owner.query("INSERT INTO auth.sessions(id,user_id,aal) VALUES($1::uuid,$2::uuid,$3::auth.aal_level)",
      text([uid(person + 200), uid(person), person === 3 ? 'aal1' : 'aal2']))
  }
  for (const [person, role] of [[1, 'owner'], [2, 'moderator'], [3, 'owner']] as const)
    await creator.connection.query("INSERT INTO public.profiles(id,user_id,role,status) VALUES($1::uuid,$2::uuid,$3::text,'active')",
      text([uid(person + 100), uid(person), role]))
  const expected = JSON.parse(file(files, 'scripts/db/profile-authority-integrity-1/observed-baseline.json')) as { portableExpectedShape: unknown }
  assert.ok(expected.portableExpectedShape)
  assert.deepEqual(value(await owner.query(PAI_CATALOG_SQL)), expected.portableExpectedShape)
  const originalProfiles = value(await owner.query(PAI_PRESERVED_SQL))
  await creator.connection.query(file(files, 'scripts/db/profile-authority-integrity-1/install-candidate.sql'))
  assert.deepEqual(value(await owner.query(PAI_CATALOG_SQL)), expected.portableExpectedShape)
  assert.deepEqual(value(await owner.query(PAI_PRESERVED_SQL)), originalProfiles, 'PAI leaves all old profile objects/OIDs exact')
  const guard = await owner.query(PAI_NEW_OBJECT_SQL)
  assert.equal(guard.length, 1); assert.ok(guard[0]?.function_oid && guard[0]?.trigger_oid)
  assert.equal(guard[0]?.owner, 'postgres'); assert.equal(guard[0]?.prosecdef, 'false')
  assert.equal(guard[0]?.body_sha256, GUARD_SHA256); assert.equal(guard[0]?.tgtype, '27'); assert.equal(guard[0]?.tgenabled, 'O')
  const profileRows = await owner.query(PROFILE_ROWS_SQL), authRows = value(await owner.query(AUTH_ROWS_SQL))
  const technical: TechnicalIdentity[] = []
  // All three actual restrictive LOGINs, their automatic grantor10 edges and
  // database rights exist BEFORE any protected namespace/fingerprint freeze.
  for (const entry of TECHNICAL) {
    assert.deepEqual(await creator.connection.query('SELECT oid::text AS oid FROM pg_catalog.pg_roles WHERE rolname=$1::text', text([entry.login])), [])
    await creator.connection.query('CREATE ROLE ' + entry.login + ' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION')
    await creator.connection.query('GRANT CONNECT ON DATABASE postgres TO ' + entry.login)
    const rows = await creator.connection.query(`SELECT r.oid::text AS login_oid,c.oid::text AS creator_oid,m.oid::text AS automatic_oid
      FROM pg_catalog.pg_roles r JOIN pg_catalog.pg_roles c ON c.rolname='postgres'
      JOIN pg_catalog.pg_auth_members m ON m.roleid=r.oid AND m.member=c.oid AND m.grantor=10
      WHERE r.rolname=$1::text AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option`, text([entry.login]))
    assert.equal(rows.length, 1); const r = rows[0]!; assert.ok(r.login_oid && r.creator_oid && r.automatic_oid)
    const identity: TechnicalIdentity = Object.freeze({ ...entry, loginOid: r.login_oid!, creatorOid: r.creator_oid!, automaticOid: r.automatic_oid! })
    await technicalIdentity(creator.connection, identity, false)
    await assert.rejects(creator.connection.query('SET ROLE ' + entry.login), stateError('42501'))
    technical.push(identity)
  }
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql'))
  const beforeHma = await catalog(owner)
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-hosted-method-authority-1/install-candidate.sql'))
  const hmaIdentity = (await owner.query(`SELECT
    'official_v3_method_private'::pg_catalog.regnamespace::oid::text AS private_oid,
    'official_v3_method_api'::pg_catalog.regnamespace::oid::text AS api_oid,
    'ot_v3_method_reader'::pg_catalog.regrole::oid::text AS reader_oid`))[0]!
  assert.ok(hmaIdentity.private_oid && hmaIdentity.api_oid && hmaIdentity.reader_oid)
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-hosted-intake-store-1/install-candidate.sql'))
  const hsIdentity = scalar(await owner.query(HS1_IDENTITY_SQL), 'hs1_identity')
  await creator.connection.query("SELECT pg_catalog.set_config('jetnity.hmt1_target',$1::text,false) AS target_ack", text([TARGET_ACK]))
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-human-method-transport-1/install-candidate.sql'))
  const wrappers = await wrapperIdentity(owner)
  const hmtOriginalOids = scalar(await owner.query(`SELECT jsonb_agg(p.oid ORDER BY p.proname)::text AS oids
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=ANY($1::text[])`, text(['{' + HMT_WRAPPERS.map(x => x.name).join(',') + '}'])), 'oids')
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-hosted-durable-jobs-1/install-candidate.sql'))
  const hmIdentity = scalar(await owner.query(HM04_IDENTITY_SQL), 'hm04_identity')
  const fingerprints = value(await owner.query(FINGERPRINT_SQL))
  assert.ok(Array.isArray(fingerprints) && fingerprints.length > 0)
  assert.deepEqual(await wrapperIdentity(owner), wrappers, 'HM04 retains original parsed public wrappers')
  const bound: TechnicalIdentity[] = []
  for (const identity of technical) {
    await technicalIdentity(creator.connection, identity, false)
    await creator.connection.query('GRANT ' + identity.role + ' TO ' + identity.login + ' WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres')
    const r = (await creator.connection.query(`SELECT m.roleid::text AS caller_oid,m.oid::text AS runtime_oid
      FROM pg_catalog.pg_auth_members m WHERE m.roleid=$1::pg_catalog.regrole AND m.member=$2::oid AND m.grantor=$3::oid`,
      text([identity.role, identity.loginOid, identity.creatorOid])))[0]
    assert.ok(r?.caller_oid && r?.runtime_oid)
    const exact: TechnicalIdentity = Object.freeze({ ...identity, callerOid: r!.caller_oid!, runtimeOid: r!.runtime_oid! })
    await technicalIdentity(creator.connection, exact, true)
    bound.push(exact)
  }
  const runtime: Connected[] = []
  for (const x of bound) runtime.push(await connect(lifetime, cluster, x.login, x.loginOid, x.role))
  const humanOid = scalar(await owner.query("SELECT 'pai1_human'::pg_catalog.regrole::oid::text AS oid"), 'oid')
  const human = await connect(lifetime, cluster, 'pai1_human', humanOid, 'authenticated')
  await setClaims(human.connection, 1)
  const probeKey = m04Fixture('composed-empty-probe').identity.jobKey
  assert.deepEqual(value(await runtime[0]!.connection.query(M04_FIXED_SQL, text([
    m04Canonical({ operation: 'queue_read', body: { jobKey: probeKey, continuation: null }, phase: 'probe' }),
    BINDING.methodId, BINDING.revision, BINDING.methodDigest, BINDING.packageDigest, null, 5000, new Date(Date.now() + 5000).toISOString(),
  ])), 'result'), { status: 'absent' }, 'actual HM04 guard accepts all common fingerprints and role identities')
  const readerRows = await runtime[2]!.connection.query(`SELECT status FROM official_v3_method_api.read_current_v1($1::text,$2::integer,$3::text,$4::text,$5::text)`,
    text([BINDING.methodId, BINDING.revision, BINDING.methodDigest, BINDING.packageDigest, new Date().toISOString()]))
  assert.deepEqual(readerRows, [{ status: 'absent' }])
  assertEmptyHistory(await methodHistory(owner)); assertEmptyHistory(await effectHistory(owner))
  assert.equal(scalar(await owner.query('SELECT count(*)::text AS n FROM official_v3_jobs_private.slots_v1'), 'n'), '1024')
  assert.deepEqual(value(await owner.query(FINGERPRINT_SQL)), fingerprints, 'runtime binding never relearns catalog fingerprints')
  assert.deepEqual(await owner.query(PROFILE_ROWS_SQL), profileRows)
  assert.deepEqual(value(await owner.query(AUTH_ROWS_SQL)), authRows)
  assert.deepEqual(await owner.query(PAI_NEW_OBJECT_SQL), guard)
  assert.deepEqual(await owner.query(`SELECT n.oid::text AS oid,n.nspowner::text AS owner,n.nspacl::text AS acl,
    (SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid)::text FROM pg_catalog.pg_default_acl d WHERE d.defaclnamespace=2200) AS defaults
    FROM pg_catalog.pg_namespace n WHERE n.nspname='public'`), publicBaseline)
  const frozen = await catalog(owner)
  return { cluster, bootstrap, observer, creator, runtime, human, humanOid, bound, guard, profileRows, authRows,
    beforeHma, hmaIdentity, hsIdentity, hmtOriginalOids, hmIdentity, wrappers, fingerprints, frozen }
}
type Common = Awaited<ReturnType<typeof makeCommon>>
async function frozen(common: Common): Promise<void> {
  const owner = common.bootstrap.connection
  assert.deepEqual(await catalog(owner), common.frozen, 'common logical catalog/role graph cannot drift after freeze')
  assert.deepEqual(value(await owner.query(FINGERPRINT_SQL)), common.fingerprints, 'captured HM04 fingerprints never rewritten')
  assert.deepEqual(await owner.query(PAI_NEW_OBJECT_SQL), common.guard)
  for (const x of common.bound) await technicalIdentity(common.creator.connection, x, true)
}


type Action = 'stage' | 'approve' | 'revoke'
function command(action: Action, n: number) {
  const op = operationId(n), b = BINDING
  const expected = action === 'stage' ? null : action === 'approve'
    ? { revision: null, methodDigest: null, packageDigest: null, epoch: 0, status: null }
    : { revision: b.revision, methodDigest: b.methodDigest, packageDigest: b.packageDigest, epoch: 1, status: 'approved' }
  const approval = action === 'approve' ? { mode: 'until_revoked', until: null } : null
  const fullCommand = { schema: 1, operationId: op, action, ...b, predecessorRevision: null, expected, approval }
  const before = action === 'revoke' ? { ...b, epoch: 1, status: 'approved', approvalMode: 'until_revoked', approvalUntil: null } : null
  const after = action === 'stage' ? null : { ...b, epoch: action === 'approve' ? 1 : 2,
    status: action === 'approve' ? 'approved' : 'revoked', approvalMode: action === 'approve' ? 'until_revoked' : null, approvalUntil: null }
  const tuple = [op, b.methodId, b.revision, b.methodDigest, b.packageDigest] as const
  const wrapper = HMT_WRAPPERS.find(x => x.target === (action === 'stage' ? 'stage_draft_v1' : action + '_v1'))!
  const parameters = action === 'stage' ? [...tuple, null]
    : action === 'approve' ? [...tuple, null, null, null, 0, null, 'until_revoked', null] : [...tuple, 1]
  const confirmation = [op, action, b.methodId, b.revision, b.methodDigest, b.packageDigest, null,
    expected?.revision ?? null, expected?.methodDigest ?? null, expected?.packageDigest ?? null,
    expected?.epoch ?? null, expected?.status ?? null, approval?.mode ?? null, null]
  return { op, action, fullCommand, before, after, wrapper, parameters, confirmation }
}
type Command = ReturnType<typeof command>
function callSql(wrapper: (typeof HMT_WRAPPERS)[number]): string {
  return 'SELECT public.' + wrapper.name + '(' + wrapper.types.split(',').map((type, i) =>
    "NULLIF($" + (i + 1) + "::text,'')::" + type).join(',') + ') AS result'
}
function assertReceipt(receipt: unknown, expected: Command): asserts receipt is Receipt {
  assert.ok(receipt && typeof receipt === 'object' && !Array.isArray(receipt))
  const r = receipt as Receipt
  assert.deepEqual(Object.keys(r).sort(), ['action', 'actorId', 'after', 'before', 'command', 'operationId', 'recordedAt', 'status'])
  assert.equal(r.status, 'recorded'); assert.equal(r.operationId, expected.op); assert.equal(r.action, expected.action)
  assert.equal(r.actorId, uid(1)); assert.match(r.recordedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/)
  assert.deepEqual(r.command, expected.fullCommand)
  assert.deepEqual(r.before, expected.before); assert.deepEqual(r.after, expected.after)
}
async function writeHuman(common: Common, expected: Command): Promise<Receipt> {
  const r = value(await common.human.connection.query(callSql(expected.wrapper), text(expected.parameters)), 'result')
  assertReceipt(r, expected)
  return r
}
async function confirmFresh(lifetime: OwnedTestLifetime, common: Common,
  written: readonly Readonly<{ command: Command; receipt: Receipt }>[]): Promise<Identity> {
  const fresh = await connect(lifetime, common.cluster, 'pai1_human', common.humanOid, 'authenticated')
  assert.notDeepEqual([fresh.identity.pid, fresh.identity.birth], [common.human.identity.pid, common.human.identity.birth],
    'confirmation must be a separate actual authenticated backend')
  let failed = false, failure: unknown
  try {
    await setClaims(fresh.connection, 1)
    for (const entry of written) {
      const receipt = value(await fresh.connection.query(callSql(HMT_WRAPPERS[1]), text(entry.command.confirmation)), 'result')
      assertReceipt(receipt, entry.command)
      assert.deepEqual(receipt, entry.receipt, 'full actor/action/operation/method/digests/state/epoch/timestamp persists across fresh human session')
    }
  } catch (error) { failed = true; failure = error }
  finally {
    fresh.connection.close()
    try { await proveAbsent(lifetime, common.observer.connection, [fresh.identity]) }
    catch (error) { failure = failed ? new AggregateError([failure, error], 'human confirmation and drain failed') : error; failed = true }
  }
  if (failed) throw failure
  return fresh.identity
}
async function assertAdapters(native: Native, method: Method): Promise<void> {
  assert.deepEqual(native.snapshot(), { jobs: 0, intake: 0, contexts: 0, poisoned: false })
  assert.equal(native.evidence.admitted, native.evidence.drained)
  assert.equal(native.evidence.dispatched, native.evidence.acknowledged)
  assert.equal(native.evidence.lost, 0); assert.equal(native.evidence.aborted, 0)
  assert.equal(native.evidence.poisoned, false); assert.deepEqual(native.evidence.sqlCodes, [])
  assert.ok(native.evidence.calls.every(c => c.dispatched && c.committed && c.drained && c.target && c.control))
  method.assertHealthy()
  assert.equal(method.evidence.admitted, method.evidence.drained)
  assert.ok(method.evidence.calls.every(c => c.pending === 0 && c.joined && c.targetAbsent && c.controlAbsent))
}
async function assertWorkerResult(common: Common, fixture: ReturnType<typeof m04Fixture>,
  result: Awaited<ReturnType<ReturnType<typeof createV3PostgresDurableJobs>['workOnce']>>): Promise<void> {
  assert.equal(result.status, 'processed')
  assert.ok(result.status === 'processed')
  assert.equal(result.worker.acceptedRule, false)
  assert.equal(result.worker.status, 'completed')
  assert.equal(result.worker.job.state, 'succeeded')
  assert.equal(result.worker.job.jobId, fixture.ruleInput.jobId)
  assert.ok(result.worker.job.kind === 'research_job_record')
  assert.equal(result.worker.job.jobKey, fixture.identity.jobKey)
  assert.deepEqual(result.worker.job.method, { methodId: BINDING.methodId, revision: BINDING.revision })
  assert.ok(result.worker.result.kind === 'rule_research')
  const decisionRef = result.worker.result.decisionRef
  assert.equal(result.worker.result.jobId, fixture.ruleInput.jobId)
  assert.equal(result.worker.result.operationId, fixture.ruleInput.operationId)
  assert.equal(result.worker.result.jobKey, fixture.identity.jobKey)
  assert.equal(result.worker.job.resultDecisionRef, decisionRef)
  assert.deepEqual(result.results, [{ status: 'version_only', result: { status: 'unavailable' } }],
    'the real dormant integration has no version/publication ports and cannot accept a public rule')
  assert.equal(fixture.producerCalls(), 1); assert.equal(fixture.delivered.length, 1)
  const delivery = fixture.delivered[0]!, bytes = Buffer.from(delivery.text, 'utf8')
  const digest = createHash('sha256').update(bytes).digest('hex')
  const reference = { binding: delivery.binding, proposalDigest: digest, bytes: bytes.length }
  const owner = common.bootstrap.connection
  const intake = await owner.query(`SELECT o.operation_id,o.binding::text AS binding,
    pg_catalog.encode(o.original_bytes,'hex') AS original_hex,pg_catalog.convert_from(o.original_bytes,'UTF8') AS original,
    o.proposal_digest,c.outcome::text AS outcome,c.generation::text AS generation,
    o.generation::text AS captured_generation,c.lease_token::text AS completion_token,o.lease_token::text AS operation_token
    FROM official_v3_intake_private.operations_v1 o JOIN official_v3_intake_private.completions_v1 c USING(operation_id)
    WHERE o.binding->>'jobId'=$1::text`, text([fixture.ruleInput.jobId]))
  assert.equal(intake.length, 1)
  const row = intake[0]!
  assert.equal(row.operation_id, delivery.binding.operationId)
  assert.deepEqual(JSON.parse(row.binding!), delivery.binding)
  assert.equal(row.original, delivery.text); assert.equal(row.original_hex, bytes.toString('hex'))
  assert.equal(row.proposal_digest, digest); assert.equal(row.generation, '1')
  assert.equal(row.generation, row.captured_generation); assert.equal(row.completion_token, row.operation_token)
  const outcome = JSON.parse(row.outcome!) as { status: string; value: { proposalDigest: string; decision: { reference: string } } }
  assert.equal(outcome.status, 'prepared'); assert.equal(outcome.value.proposalDigest, digest)
  assert.equal(outcome.value.decision.reference, decisionRef)
  const history = await effectHistory(owner) as Record<string, Record<string, unknown>[]>
  for (const key of ['intake_operations', 'intake_reservations', 'intake_completions', 'occupied_slots',
    'subjects', 'execution_starts', 'execution_results', 'execution_dispositions']) assert.equal(history[key]!.length, 1, key + ' exactly one durable effect')
  assert.equal(history.queue_operations!.length, 3, 'enqueue, claim and complete are the only retained queue commands')
  const subject = history.subjects![0]!, start = history.execution_starts![0]!, retained = history.execution_results![0]!, disposition = history.execution_dispositions![0]!
  assert.equal(subject.job_key, fixture.identity.jobKey); assert.deepEqual(subject.current_job, result.worker.job)
  assert.equal(start.job_key, fixture.identity.jobKey)
  assert.equal(retained.attempt_key, start.attempt_key); assert.deepEqual(retained.result, result.worker.result)
  assert.deepEqual(retained.references, [reference], 'the actual committed result points to exactly the captured original')
  assert.equal(disposition.attempt_key, start.attempt_key); assert.equal(disposition.kind, 'completed'); assert.equal(disposition.failure_reason, null)
}


async function recoverUnused(lifetime: OwnedTestLifetime, common: Common, files: ReadonlyMap<string, string>): Promise<void> {
  const owner = common.bootstrap.connection, creator = common.creator.connection
  await frozen(common)
  assertEmptyHistory(await methodHistory(owner)); assertEmptyHistory(await effectHistory(owner))
  const callers = [...common.runtime, common.human]
  for (const caller of callers) caller.connection.close()
  await proveAbsent(lifetime, common.observer.connection, callers.map(x => x.identity))
  const retained = [common.bootstrap, common.creator, common.observer].map(x => ({ pid: x.identity.pid, birth: x.identity.birth }))
    .sort((a, b) => Number(a.pid) - Number(b.pid))
  assert.deepEqual(await common.observer.connection.query(`SELECT pid::text AS pid,backend_start::text AS birth
    FROM pg_catalog.pg_stat_activity WHERE datname=current_database() AND backend_type='client backend' ORDER BY pid`), retained,
  'only the three named synthetic setup/observation backends remain')
  // This is actual quiescence of our owned local inventory. The external Root /
  // operator prerequisite is independent and cannot be manufactured by this
  // catalog count or the context strings passed below.
  for (const exact of common.bound) {
    await technicalIdentity(creator, exact, true)
    await creator.query('REVOKE ' + exact.role + ' FROM ' + exact.login + ' GRANTED BY postgres RESTRICT')
    await technicalIdentity(creator, exact, false)
  }
  assertEmptyHistory(await methodHistory(owner)); assertEmptyHistory(await effectHistory(owner))
  assert.deepEqual(value(await owner.query(FINGERPRINT_SQL)), common.fingerprints)
  await creator.query(`SELECT pg_catalog.set_config('jetnity.hm04_recovery_context',$1::text,false) AS context,
    pg_catalog.set_config('jetnity.hm04_recovery_identity',$2::text,false) AS identity`,
    text([RECOVERY_CONTEXT, common.hmIdentity]))
  await creator.query(file(files, 'scripts/db/official-truth-v3-hosted-durable-jobs-1/recovery-candidate.sql'))
  assert.deepEqual(await owner.query(`SELECT to_regnamespace('official_v3_jobs_private')::text AS private,
    to_regnamespace('official_v3_jobs_api')::text AS api,to_regrole('ot_v3_jobs_owner')::text AS owner,
    to_regrole('ot_v3_jobs_caller')::text AS caller`), [{ private: null, api: null, owner: null, caller: null }])
  for (const exact of common.bound) await technicalIdentity(creator, exact, false)
  assert.equal(scalar(await owner.query(HS1_IDENTITY_SQL), 'hs1_identity'), common.hsIdentity,
    'HM04 removal restores the originally captured HS1 object identity, without relearning')
  assert.deepEqual(await wrapperIdentity(owner), common.wrappers)
  const until = scalar(await owner.query("SELECT (clock_timestamp()+interval '4 minutes')::text AS until"), 'until')
  await creator.query(`SELECT pg_catalog.set_config('jetnity.hmt1_target',$1::text,false) AS target_ack,
    pg_catalog.set_config('jetnity.hmt1_recovery_context','root-verified-unused-quiescent-v1',false) AS context,
    pg_catalog.set_config('jetnity.hmt1_original_oids',$2::text,false) AS original_oids,
    pg_catalog.set_config('jetnity.hmt1_quiescence_receipt','synthetic:composed-dev1:owned-unused-callers-ended',false) AS receipt,
    pg_catalog.set_config('jetnity.hmt1_quiescence_until',$3::text,false) AS until`,
    text([TARGET_ACK, common.hmtOriginalOids, until]))
  await creator.query(file(files, 'scripts/db/official-truth-v3-human-method-transport-1/recovery-candidate.sql'))
  assert.equal(scalar(await owner.query(`SELECT count(*)::text AS n FROM pg_catalog.pg_proc p
    WHERE p.pronamespace=2200 AND p.proname=ANY($1::text[])`,
    text(['{' + HMT_WRAPPERS.map(x => x.name).join(',') + '}'])), 'n'), '0')
  assertEmptyHistory(await methodHistory(owner))
  await creator.query(`SELECT pg_catalog.set_config('jetnity.hs1_recovery_context',$1::text,false) AS context,
    pg_catalog.set_config('jetnity.hs1_recovery_identity',$2::text,false) AS identity`,
    text([RECOVERY_CONTEXT, common.hsIdentity]))
  await creator.query(file(files, 'scripts/db/official-truth-v3-hosted-intake-store-1/recovery-candidate.sql'))
  assert.deepEqual(await owner.query(`SELECT to_regnamespace('official_v3_intake_private')::text AS private,
    to_regnamespace('official_v3_intake_api')::text AS api,to_regrole('ot_v3_intake_owner')::text AS owner,
    to_regrole('ot_v3_intake_caller')::text AS caller`), [{ private: null, api: null, owner: null, caller: null }])
  assertEmptyHistory(await methodHistory(owner))
  await creator.query(`SELECT pg_catalog.set_config('jetnity.hma1_recovery_context','root-verified-unused-quiescent-v1',false) AS context,
    pg_catalog.set_config('jetnity.hma1_recovery_private_oid',$1::text,false) AS private_oid,
    pg_catalog.set_config('jetnity.hma1_recovery_api_oid',$2::text,false) AS api_oid,
    pg_catalog.set_config('jetnity.hma1_recovery_reader_oid',$3::text,false) AS reader_oid`,
    text([common.hmaIdentity.private_oid!, common.hmaIdentity.api_oid!, common.hmaIdentity.reader_oid!]))
  await creator.query(file(files, 'scripts/db/official-truth-v3-hosted-method-authority-1/recovery-candidate.sql'))
  assert.deepEqual(await owner.query(`SELECT to_regnamespace('official_v3_method_private')::text AS private,
    to_regnamespace('official_v3_method_api')::text AS api,to_regrole('ot_v3_method_reader')::text AS reader`),
    [{ private: null, api: null, reader: null }])
  assert.deepEqual(await catalog(owner), common.beforeHma,
    'all unaffected OIDs/functions/ACLs/defaults/roles/edges return to the captured pre-HMA baseline')
  assert.deepEqual(await owner.query(PAI_NEW_OBJECT_SQL), common.guard, 'original PAI function and trigger remain installed')
  assert.deepEqual(await owner.query(PROFILE_ROWS_SQL), common.profileRows)
  assert.deepEqual(value(await owner.query(AUTH_ROWS_SQL)), common.authRows)
  assert.equal(scalar(await owner.query("SELECT to_regnamespace('jetnity_ot_auth')::oid::text AS oid"), 'oid') !== '', true)
  for (const exact of common.bound) await technicalIdentity(creator, exact, false)
}


export async function runComposedDevNative(t: TestContext): Promise<void> {
  const effectsStart = performance.now()
  const deadline = new AbortController()
  const parent = AbortSignal.any([t.signal, deadline.signal])
  const lifetime = new OwnedTestLifetime(parent)
  const originalConnect = LocalPgConnection.connect
  // Root A1 / 6827347738 selects exactly this existing ownership mechanism.
  // No patchConnect, extra global mutation, instance wrapper or fault injection.
  lifetime.installConnectOwnership()
  const timer = setTimeout(() => deadline.abort(Error('composed_dev1_effect_deadline')), EFFECT_MS)
  const clusters: LocalProofCluster[] = []
  const nativeAdapters: Native[] = [], methodAdapters: Method[] = []
  const completed: string[] = []
  let failed = false, failure: unknown
  const state: { used?: Common; unused?: Common; work?: { native: Native; method: Method;
    input: ReturnType<typeof m04Fixture>; api: ReturnType<typeof createV3PostgresDurableJobs>; approvedFresh: Identity } } = {}
  let usedAfterWork: unknown, usedAfterRevoke: unknown
  function allocate(): LocalProofCluster {
    assert.ok(clusters.length < 2, 'exactly two finite owned clusters')
    const cluster = lifetime.startCluster(startLocalProofCluster); clusters.push(cluster); return cluster
  }
  async function proof(id: (typeof GROUPS)[number], label: string, body: () => Promise<void>): Promise<void> {
    assert.equal(id, GROUPS[completed.length], 'fixed sequential group order')
    lifetime.check()
    const actor: { promise?: Promise<void> } = {}
    let runnerFailed = false, runnerFailure: unknown
    try {
      await t.test(id + ' ' + label, async () => { actor.promise = lifetime.run(body); await actor.promise })
    } catch (error) { runnerFailed = true; runnerFailure = error }
    // node:test's parent result never substitutes for the actual joined body.
    if (actor.promise) {
      const [joined] = await lifetime.drain([actor.promise])
      assert.ok(joined)
      if (joined.status === 'rejected') throw joined.reason
    } else {
      if (runnerFailed) throw runnerFailure
      assert.fail('proof body was not started')
    }
    if (runnerFailed) throw runnerFailure
    lifetime.check()
    assert.ok(performance.now() - effectsStart < EFFECT_MS, 'single effects deadline')
    completed.push(id)
  }
  try {
    const files = pinnedFiles()
    assert.equal(Buffer.byteLength(file(files, 'scripts/db/official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql'), 'utf8'), 10807)
    await proof('C01', 'both exact common packages install on actual restricted PG17 identities', async () => {
      state.used = await makeCommon(lifetime, allocate(), files)
      state.unused = await makeCommon(lifetime, allocate(), files)
      assert.equal(clusters.length, 2)
      assert.notEqual(state.used.cluster.root, state.unused.cluster.root)
      await frozen(state.used); await frozen(state.unused)
    })
    const u = state.used, empty = state.unused
    assert.ok(u && empty)
    await proof('C02', 'profile rebind, non-Owner and Owner-AAL1 are refused without history', async () => {
      const owner = u.bootstrap.connection
      const profiles = await owner.query(PROFILE_ROWS_SQL), auth = value(await owner.query(AUTH_ROWS_SQL))
      const history = await methodHistory(owner), effects = await effectHistory(owner)
      assertEmptyHistory(history); assertEmptyHistory(effects)
      await setClaims(u.human.connection, 2)
      await assert.rejects(u.human.connection.query('UPDATE public.profiles SET user_id=$1::uuid WHERE user_id=$2::uuid RETURNING id::text',
        text([uid(8), uid(1)])), stateError('23514'))
      assert.deepEqual(await owner.query(PROFILE_ROWS_SQL), profiles)
      assert.deepEqual(await methodHistory(owner), history)
      for (const person of [2, 3] as const) {
        await setClaims(u.human.connection, person)
        for (const [action, n] of [['stage', 100 + person], ['approve', 200 + person]] as const) {
          const rejected = command(action, n)
          await assert.rejects(u.human.connection.query(callSql(rejected.wrapper), text(rejected.parameters)), stateError('42501'))
          assert.deepEqual(await methodHistory(owner), history)
        }
      }
      assert.deepEqual(await owner.query(PROFILE_ROWS_SQL), profiles)
      assert.deepEqual(value(await owner.query(AUTH_ROWS_SQL)), auth)
      assert.deepEqual(await effectHistory(owner), effects)
      await frozen(u)
    })
    await proof('C03', 'public human approval, fresh full confirmation and one actual worker/S1 completion', async () => {
      assert.equal(BINDING.revision, 1)
      await setClaims(u.human.connection, 1)
      const stage = command('stage', 1), approve = command('approve', 2)
      const staged = await writeHuman(u, stage), approved = await writeHuman(u, approve)
      const approvedFresh = await confirmFresh(lifetime, u, [{ command: stage, receipt: staged }, { command: approve, receipt: approved }])
      const history = await methodHistory(u.bootstrap.connection) as Record<string, unknown[]>
      assert.equal(history.revisions!.length, 1); assert.equal(history.heads!.length, 1); assert.equal(history.operations!.length, 2)
      const enqueueTimings: { id: number; kind: string; operation: string; operations: readonly Readonly<{
        phase: string; elapsedMs: number; outcome: string; code: string | null;
        commitAcknowledged?: boolean; commitDispatched?: boolean;
      }>[] }[] = []
      const native = await createM04NativeExecutors(u.cluster, lifetime, { async beforeDrain(call) {
        if (enqueueTimings.length >= 32) return
        // Existing wire metadata only: no SQL, parameters, identities or source bytes.
        enqueueTimings.push({ id: call.id, kind: call.kind, operation: call.operation,
          operations: (call.target?.operationDiagnostics ?? []).slice(-16).map(item => ({
            phase: item.phase, elapsedMs: Math.ceil(item.elapsedMs), outcome: item.outcome,
            code: item.code && /^[0-9A-Z]{5}$/.test(item.code) ? item.code : null,
            ...(typeof item.commitAcknowledged === 'boolean' ? { commitAcknowledged: item.commitAcknowledged } : {}),
            ...(typeof item.commitDispatched === 'boolean' ? { commitDispatched: item.commitDispatched } : {}),
          })) })
      } }); nativeAdapters.push(native)
      const method = await createMa1NativeExecutor(u.cluster, lifetime); methodAdapters.push(method)
      const input = m04Fixture('composed-dev1-one-research')
      const api = createV3PostgresDurableJobs({ binding: BINDING, registry: input.originals.registry, clock: input.clock,
        methodExecutor: method.executor, jobsExecutor: native.jobs, intakeExecutor: native.intake,
        producer: input.producer, evidence: input.evidence, history: input.history })
      const enqueueStarted = performance.now()
      const enqueued = await lifetime.run(() => api.enqueueRule(input.ruleInput, lifetime.signal))
      if (enqueued.status !== 'confirmed') console.error('COMPOSED_C03_ENQUEUE_DIAG', JSON.stringify({
        status: enqueued.status, milliseconds: Math.ceil(performance.now() - enqueueStarted), timings: enqueueTimings,
        jobs: { admitted: native.evidence.admitted, dispatched: native.evidence.dispatched,
          acknowledged: native.evidence.acknowledged, aborted: native.evidence.aborted, drained: native.evidence.drained,
          sqlCodes: native.evidence.sqlCodes.filter(code => /^[0-9A-Z]{5}$/.test(code)).slice(0, 32),
          callCount: native.evidence.calls.length,
          calls: native.evidence.calls.slice(0, 32).map(call => ({ kind: call.kind, operation: call.operation,
            dispatched: call.dispatched, committed: call.committed, drained: call.drained })) },
        method: { admitted: method.evidence.admitted, dispatched: method.evidence.dispatched,
          aborted: method.evidence.aborted, drained: method.evidence.drained,
          sqlCodes: method.evidence.sqlCodes.filter(code => /^[0-9A-Z]{5}$/.test(code)).slice(0, 32) },
      }))
      if (enqueued.status !== 'confirmed') await measureC03CatalogComponents(lifetime, u, files)
      assert.equal(enqueued.status, 'confirmed')
      const result = await lifetime.run(() => api.workOnce(input.claim(), lifetime.signal))
      await assertWorkerResult(u, input, result)
      assert.ok(native.evidence.calls.some(c => c.kind === 'jobs' && c.committed))
      assert.ok(native.evidence.calls.some(c => c.kind === 'intake' && c.committed))
      assert.ok(method.evidence.admitted > 0 && method.evidence.dispatched > 0)
      await assertAdapters(native, method)
      assert.deepEqual(await methodHistory(u.bootstrap.connection), history, 'worker cannot mutate human method authority')
      assert.deepEqual(await u.bootstrap.connection.query(PROFILE_ROWS_SQL), u.profileRows)
      assert.deepEqual(value(await u.bootstrap.connection.query(AUTH_ROWS_SQL)), u.authRows)
      usedAfterWork = await effectHistory(u.bootstrap.connection)
      await frozen(u)
      state.work = { native, method, input, api, approvedFresh }
    })
    const work = state.work
    assert.ok(work)
    const actualNative = work.native, actualMethod = work.method, actualInput = work.input, actualApi = work.api, approvalSession = work.approvedFresh
    await proof('C04', 'freshly confirmed revoke refuses old epoch and retains every prior effect', async () => {
      await setClaims(u.human.connection, 1)
      const revoke = command('revoke', 3), revoked = await writeHuman(u, revoke)
      const revocationSession = await confirmFresh(lifetime, u, [{ command: revoke, receipt: revoked }])
      assert.notDeepEqual([revocationSession.pid, revocationSession.birth], [approvalSession.pid, approvalSession.birth])
      usedAfterRevoke = await methodHistory(u.bootstrap.connection)
      assert.deepEqual(await effectHistory(u.bootstrap.connection), usedAfterWork)
      await assert.rejects(u.runtime[0]!.connection.query(M04_FIXED_SQL, text([
        m04Canonical({ operation: 'queue_read', body: { jobKey: actualInput.identity.jobKey, continuation: null }, phase: 'authorized' }),
        BINDING.methodId, BINDING.revision, BINDING.methodDigest, BINDING.packageDigest, 1, 5000,
        new Date(Date.now() + 5000).toISOString(),
      ])), stateError('P7504'), 'actual last locked MA1 check rejects the previous approved epoch')
      const nativeBefore = actualNative.evidence.admitted, methodBefore = actualMethod.evidence.admitted
      const attempted = await lifetime.run(() => actualApi.workOnce(actualInput.claim(), lifetime.signal))
      // Unchanged artifact resume maps the unavailable current authority to an
      // unconfirmed worker result; this is a refusal, never a successful replay.
      assert.deepEqual(attempted, { status: 'unconfirmed' })
      assert.ok(actualNative.evidence.admitted > nativeBefore, 'actual Jobs resume probe occurred')
      assert.ok(actualMethod.evidence.admitted > methodBefore, 'fresh actual reader observes revoked authority')
      assert.equal(actualInput.producerCalls(), 1); assert.equal(actualInput.delivered.length, 1)
      await assertAdapters(actualNative, actualMethod)
      assert.deepEqual(await methodHistory(u.bootstrap.connection), usedAfterRevoke)
      assert.deepEqual(await effectHistory(u.bootstrap.connection), usedAfterWork, 'no queue/S1 changes or history deletion after revoke')
      await frozen(u)
    })
    await proof('C05', 'unused exact recovery preserves PAI/PG1 and closes actual callers', async () => {
      await recoverUnused(lifetime, empty, files)
      assert.deepEqual(await methodHistory(u.bootstrap.connection), usedAfterRevoke, 'unused recovery never touches used authority history')
      assert.deepEqual(await effectHistory(u.bootstrap.connection), usedAfterWork, 'used original bytes and completed job remain')
      await frozen(u)
      await assertAdapters(actualNative, actualMethod)
    })
    assert.deepEqual(completed, GROUPS)
  } catch (error) { failed = true; failure = error }
  finally {
    clearTimeout(timer)
    const cleanupStart = performance.now()
    const cleanupErrors: unknown[] = [], disposals: Promise<unknown>[] = []
    // Register adapter disposal first; start unconditional lifetime disposal
    // immediately afterwards, before waiting. No detached 35s-per-item budget.
    for (const native of nativeAdapters) {
      try { disposals.push(lifetime.track(native.dispose())) } catch (error) { cleanupErrors.push(error) }
    }
    for (const method of methodAdapters) {
      try { method.closeObserver() } catch (error) { cleanupErrors.push(error) }
    }
    const terminalPromise = lifetime.dispose()
    const settlements = await Promise.allSettled([...disposals, terminalPromise])
    for (const result of settlements) if (result.status === 'rejected') cleanupErrors.push(result.reason)
    const terminalResult = settlements[settlements.length - 1]
    try {
      assert.equal(LocalPgConnection.connect, originalConnect, 'exact unchanged ownership-hook restoration')
      assert.ok(terminalResult?.status === 'fulfilled', 'actual terminal ledger must be available')
      const terminal = await terminalPromise
      assert.equal(terminal.started, terminal.settled); assert.equal(terminal.pending, 0)
      assert.equal(terminal.closed, terminal.connections)
      assert.equal(terminal.stoppedClusters, clusters.length)
      assert.ok(terminal.connections <= MAX_CONNECTIONS, 'actual total connections, including adapter and COMMIT guards')
      assert.ok(terminal.started <= MAX_OPERATIONS, 'actual total registered operations, including all primitive promises')
      for (const cluster of clusters) assert.equal(existsSync(cluster.root), false, 'unchanged stop verified actual exit and removed its owned directory')
      assert.ok(performance.now() - cleanupStart <= DRAIN_MS, 'single total cleanup/drain budget')
      if (!failed) assert.equal(terminal.stoppedClusters, 2)
      t.diagnostic('COMPOSED-DEV1 synthetic terminal ' + JSON.stringify({ completed, ...terminal,
        effectsLimitMs: EFFECT_MS, cleanupLimitMs: DRAIN_MS, maxConnections: MAX_CONNECTIONS, maxOperations: MAX_OPERATIONS }))
    } catch (error) { cleanupErrors.push(error) }
    if (cleanupErrors.length) {
      failure = new AggregateError(failed ? [failure, ...cleanupErrors] : cleanupErrors, 'composed_dev1_proof_or_cleanup_failed')
      failed = true
    }
  }
  if (failed) throw failure
}
