-- ADMIN-RUNTIME-BG1-1: three atomic Dev stores; provider transaction required. No import or activation.

SET LOCAL jetnity.admin_runtime_target='dev:yfvbxvijcorffwxbxahl:ADMIN-RUNTIME-BG1-1';

SET LOCAL search_path=pg_catalog,pg_temp; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';

SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';

DO $admin_runtime_context$
BEGIN
  IF current_user<>'postgres' OR session_user<>current_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
    OR current_setting('jetnity.admin_runtime_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:ADMIN-RUNTIME-BG1-1'
    OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='postgres' AND NOT rolsuper AND rolbypassrls)
    OR to_regclass('official_v3_guard_private.cycle4_attempt2_baseline_v1') IS NULL
    OR to_regclass('official_v3_guard_private.admin_runtime_baseline_v1') IS NOT NULL
    OR to_regnamespace('jetnity_reporting') IS NOT NULL OR to_regnamespace('jetnity_cms_private') IS NOT NULL
    OR to_regnamespace('jetnity_marketing_private') IS NOT NULL THEN
    RAISE EXCEPTION 'admin runtime exact unused Dev predecessor required' USING ERRCODE='P7931';
  END IF;
  -- Existing sender/package/checker order. Never stop or alter the scheduler.
  IF NOT pg_try_advisory_xact_lock(771106,31)
    OR NOT pg_try_advisory_xact_lock(771101,1) OR NOT pg_try_advisory_xact_lock(771102,1)
    OR NOT pg_try_advisory_xact_lock(771103,1) OR NOT pg_try_advisory_xact_lock(771104,1)
    OR NOT pg_try_advisory_xact_lock(771105,1) OR NOT pg_try_advisory_xact_lock(771106,1) THEN
    RAISE EXCEPTION 'admin runtime package operation already active' USING ERRCODE='P7931';
  END IF;
  PERFORM 1 FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'admin runtime missing guard state' USING ERRCODE='P7931'; END IF;
END $admin_runtime_context$;

CREATE TEMP TABLE admin_runtime_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE admin_runtime_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $admin_runtime_predecessor$
DECLARE expected record; actual pg_proc%ROWTYPE; old_catalog jsonb; expanded_catalog jsonb;
  item record; helper oid; old_table text; old_value jsonb;
BEGIN
  -- These are pinned source bodies, not values learned from the live database.
  FOR expected IN SELECT * FROM jsonb_to_recordset('[{"signature":"official_v3_intake_private.exact_keys_v1(jsonb,text[])","hash":"d3d8130512d809af7ec2578b88d30412e3dfec516a158c74f0a6fe1d09d486ba"},{"signature":"official_v3_intake_private.safe_data_v1(jsonb,integer)","hash":"bce43ae05fa0cff183a1de7afedd8bca5e16f0cfc3e160c9b83fec33d09f0abf"},{"signature":"official_v3_intake_private.binding_valid_v1(jsonb)","hash":"8f556b9db0b3786f9c247c9432a9e6a8631b66ee92019ac8aa082cf58aa4f7c1"},{"signature":"official_v3_intake_private.unique_json_v1(json,integer)","hash":"d9c536f2969d815c42b8cd00bbb7145808906519a575aff0dd9361f5070e7609"},{"signature":"official_v3_intake_private.proposal_shape_v1()","hash":"18259c9664e66a9d953e7ee6cf1a1e3decc7502a71832533eb68eb441a8728b9"},{"signature":"official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer)","hash":"ca39c759aa56b45e6974d3fecf953b2bf4d679c2bffbf0783f366f42fd621b85"},{"signature":"official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer)","hash":"760ebdb9782c8709c0ede579e94c30f47a74840683772e11b04a2b3f74fc598a"},{"signature":"official_v3_intake_private.proposal_retainable_v1(jsonb)","hash":"d30b3540a097ab1832d09bdd67fa922efecaecbfdbae34eb3bfdbdca635cf797"},{"signature":"official_v3_intake_private.immutable_v1()","hash":"ff1c2db432d3aa48e50b7a043982831be983dc54c6ea16155f4d690a91dcdc86"},{"signature":"official_v3_intake_private.record_v1(text)","hash":"f34089ca87adef99d16d63de7391c5c200e770928c476304d8324b4beb1844f3"},{"signature":"official_v3_intake_api.capture_v1(jsonb,text,text)","hash":"bca5dcc14b315063bff32cad0122c0fc9e3efdc576c2b599f240f2a26d003b7a"},{"signature":"official_v3_intake_api.read_v1(jsonb,text,integer)","hash":"3c3cbff368a4e196247964d35a350ef1d554d685b2a807573aa4f987bfbe17d4"},{"signature":"official_v3_intake_api.reserve_v1(jsonb,text,integer,integer)","hash":"131aa90007cb6729f9925635c98e2145f690776a56031b77a7561a068af84222"},{"signature":"official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)","hash":"601ab19f1054f47a52505a69c8f7a00b38ff870825fe468f21f2cea034b811c4"},{"signature":"official_v3_result_private.exact_keys_v1(jsonb,text[])","hash":"ee7cf54b133b5ba633b55372c6f98b06058d3fbc4ffe8bda08813fc77865cc33"},{"signature":"official_v3_result_private.nodes_v1(jsonb,integer,integer,integer)","hash":"d2bf4eb545e4c0453f4511ed6585a7643b440ba58dfc35ff1192feeae72941e3"},{"signature":"official_v3_result_private.canonical_v1(jsonb,integer)","hash":"ae2e3d355bdd0474941339c110beb90cdf0629cd5693de477985691a26d7f9f6"},{"signature":"official_v3_result_private.civil_date_v1(text)","hash":"fd5ada592127225a2d995658a74f0ba58bd5b4e7e65301a9d656a07d50eb7ea8"},{"signature":"official_v3_result_private.timestamp_v1(text)","hash":"d2139f87c826b7eaaa7846b9812a6e056240d79650f365aad2733efb2947613c"},{"signature":"official_v3_result_private.predicate_v1(jsonb)","hash":"28c043c0fc46032e63286c74bc91945c0ed9eeff1a4a09a99263038f9450b4af"},{"signature":"official_v3_result_private.expression_v1(jsonb,boolean,integer)","hash":"f68a30dc702d07b13c07142c2208410ac39e077f8ecc2695f392d774e12bdb03"},{"signature":"official_v3_result_private.context_v1(jsonb)","hash":"d17e2c5e8e8c34561a47215ae9091ecf541e68035eebc8d4a444663b3e8cc845"},{"signature":"official_v3_result_private.subject_v1(text,jsonb)","hash":"608b0d0d62fd54f5ea0032bca8df46e71924e7c565e7000f5181c32029f90828"},{"signature":"official_v3_result_private.reference_v1(jsonb)","hash":"4e23eb880cfe724da64bdb0f3a395dacbff593e1bf6b20560e623b55cc441974"},{"signature":"official_v3_result_private.safe_data_v1(jsonb,integer)","hash":"fb0338ad099a3849e03670618b22b09e4e91a0f750c760a1a36a51c4fb929292"},{"signature":"official_v3_result_private.unique_json_v1(json,integer)","hash":"4ce9ae66bc89ec89dd5f684dcb36b8306e04dd9a2d73dc0576e0d8e70932fa83"},{"signature":"official_v3_result_private.proposal_shape_v1()","hash":"18259c9664e66a9d953e7ee6cf1a1e3decc7502a71832533eb68eb441a8728b9"},{"signature":"official_v3_result_private.data_nodes_v1(jsonb,integer,integer,integer)","hash":"6aa78c456638b6fb9a291ff7a5ce2593f730027cc8eadf95e6043e2d72f1cf90"},{"signature":"official_v3_result_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer)","hash":"4b558e73233251f166c11558d8426f2956433a5dfe079acdd0090d40b3ee2181"},{"signature":"official_v3_result_private.proposal_retainable_v1(jsonb)","hash":"9264fea3daaddb89d01aea123a1d7fc83aa83cdfe78689281fbda198f46eb4dc"},{"signature":"official_v3_result_private.validate_s1_copy_v1(jsonb,jsonb,jsonb,text)","hash":"343bee988dd465557620d5211bde7017bdf236569f2705e31edcf840c8822e06"},{"signature":"official_v3_result_private.state_fingerprint_v1()","hash":"a29d456069d288346a0a2eb69aba0d58f2c22df7f38d81e2ee5c9720796d7b25"},{"signature":"official_v3_result_private.immutable_v1()","hash":"0862c8153ca0d1d26a1f70580366d1b242da401d91ec036f8734f2838e14839a"},{"signature":"official_v3_result_private.hash_v1(jsonb)","hash":"6a7d2ac8da921bb8553fcf00d9c5823aad51c9f0d7b965d733f86405f7d812a7"},{"signature":"official_v3_result_private.ref_v1(text,jsonb)","hash":"a4b35b5651099a7373d08ff29b809a3a6c21a97199c564bfad1d4c8558ad6010"},{"signature":"official_v3_result_private.time_text_v1(timestamptz)","hash":"f07bb7b06d64d88c0d2f3ad3bed101439bb95eda8147e5616e54252ba598804d"},{"signature":"official_v3_result_private.s1_shape_v1(jsonb,text)","hash":"841d087a3a3cf4a29b9e698589707d65a82d72431e55944300afef543f32de91"},{"signature":"official_v3_result_private.record_shape_v1(jsonb,text)","hash":"6d18053b7c43efb8887bffdb14ab0e9a85547dcee9bc331c5783af9ea8793ec2"},{"signature":"official_v3_result_private.binding_valid_v1(jsonb)","hash":"00ce3331c7c10b824f7ca53b23b4a9ce5eb40b597832a3cc76cc74bbac452079"},{"signature":"official_v3_result_private.catalog_v1()","hash":"a103c90fb3589a9c8819e5ec4c2eb9fbf8bd7e22a049ebe542b64d8184557a81"},{"signature":"official_v3_result_private.assert_catalog_v1()","hash":"dac7c17f36163e0c0d6c068977e85fc35975a4621e67dceda234ca639fa945ed"},{"signature":"official_v3_result_private.selected_binding_v1()","hash":"07c52251c1bf1f38b251ed6cb33d834c7319cd7e7b43e14e44a478695043daad"},{"signature":"official_v3_result_private.state_v1()","hash":"1f181715fa3cb5a84b9fb6fad2658c92138b8e1ac0bed03de0a5d47b1df1b701"},{"signature":"official_v3_result_private.assert_history_v1()","hash":"9454a79fdebfce4cb63c60bb404bf6321a9fe7c09b825e9f6ce32e750f225c3a"},{"signature":"official_v3_result_private.original_v1(jsonb,jsonb)","hash":"357efc28a494fa8e002683e760cff7e7c8c05035914c5f40f5931272e0990e3d"},{"signature":"official_v3_result_private.observations_v1(jsonb)","hash":"f6be0f59dbcc0795f2afdf85f2bd13f7eae358f8782a3cfd01737890c713613a"},{"signature":"official_v3_result_private.verification_v1(jsonb,jsonb,boolean)","hash":"c3c1bda8bc1403bdb48423f454d5ea2fa324e6bea84127729b80b31f71c302d4"},{"signature":"official_v3_result_private.fence_v1(jsonb,integer,timestamptz,text,jsonb)","hash":"0a1813c8c4b290f07e7ac47db92c39880b53241dcd96ae6276c7fd4a31e39963"},{"signature":"official_v3_result_private.keep_original_v1(jsonb,jsonb)","hash":"43b1eb6dd9d99e45a4b1c3bed80d92b5d3c4390544f6394aaa61acf322be4d14"},{"signature":"official_v3_result_private.attest_v1(jsonb,jsonb,integer,timestamptz,text)","hash":"47a2a1b76f6c088f656c235f5becdfa6f5d23d0e6b4efea7b27a6b15ae4cac17"},{"signature":"official_v3_result_private.consume_s1_v1(jsonb,jsonb,jsonb)","hash":"d0738e696a066ffddfa725d27b1e3c8f81b4c73a5cb981a5e07460bc6db42ecd"},{"signature":"official_v3_result_private.keep_decision_v1(jsonb)","hash":"91351a13b82f9c45e364126032feeea3d9a515a3e693efb37caf3bb8b0ed9bf5"},{"signature":"official_v3_result_private.prepared_v1(jsonb,jsonb,jsonb)","hash":"6c476735120c4aa69295f881e083efab1d3069a28507d6f3cb7dcf0ff5121a3a"},{"signature":"official_v3_result_private.transition_v1(jsonb,jsonb,integer,timestamptz,text,boolean)","hash":"ac7027e6d63e9edc455ee4eec6f7371bddc43cc595b7542df4a1f601c8a1b13d"},{"signature":"official_v3_result_private.publication_v1(jsonb,jsonb,integer,timestamptz,text,boolean)","hash":"0a7161f416d8184b0e0d657ed417d2bbed5df4d42bfacbbc197430126d335f7a"},{"signature":"official_v3_result_private.escalation_v1(jsonb,jsonb,integer,timestamptz,text,boolean)","hash":"a2096968e60ddf678ba4970529fe0130b90c2883cca1d3bcfde468e3c422274f"},{"signature":"official_v3_result_private.projection_binding_v1(jsonb)","hash":"2b4281e9e5160277fdcf081797401b01929c17ac084c9ca92c8b846ab9aaca14"},{"signature":"official_v3_result_private.current_projection_v1(jsonb,text)","hash":"bb464fa0264d0c26fdd71e61ba586e5dd68cb7a38992497dd270be994d2a21cb"},{"signature":"official_v3_result_private.plan_v1(jsonb)","hash":"cb6c8195f6347fe381407c9fbc17a13babfe80654a01073666e8e5c7a97f37e9"},{"signature":"official_v3_result_private.plan_current_v1(bigint,jsonb,jsonb)","hash":"56e2e7134965eb9495d1598e4f1a538af276408d7618a91b11c71c7817be86dd"},{"signature":"official_v3_result_private.suppress_v1(jsonb,jsonb,integer,timestamptz,text)","hash":"258079e814d0add8de6cd3a7da0bbe106b803863665a0c4c8f12cbd68ec909f5"},{"signature":"official_v3_result_private.monitor_claim_v1(jsonb,jsonb,integer,timestamptz,text)","hash":"d2f5f8cb1f33d926a463a65f5f49941af2c209c1275da0d4a9f9f8afc30a3971"},{"signature":"official_v3_result_private.monitor_finish_v1(jsonb,jsonb,integer,timestamptz,text)","hash":"37a5426679629449bec19e1a86c95a1f5689300aa5fdaedcb8457976f14f9e3a"},{"signature":"official_v3_result_private.command_v1(jsonb,jsonb)","hash":"365b04e28ffb7c6f6502f3af77f5afb7abf4d443d4a443c1f04f27128a1996c6"},{"signature":"official_v3_result_private.dispatch_v1(text,jsonb,text,text,integer,text,text,integer,integer,text,text)","hash":"eccdbd371a0b10f103f2d56902b21d94685e1413c3831e98a33859e8d97bab3f"},{"signature":"official_v3_jobs_private.exact_keys_v1(jsonb,text[])","hash":"ee7cf54b133b5ba633b55372c6f98b06058d3fbc4ffe8bda08813fc77865cc33"},{"signature":"official_v3_jobs_private.unique_json_v1(json,integer)","hash":"e7c99b47e34f4c422da0990f2378cb68289d9ac2c71bcb4ed8d933a20bf3f8ac"},{"signature":"official_v3_jobs_private.nodes_v1(jsonb,integer,integer,integer)","hash":"e28941594d643413964d19010b7ee9627bfee7bff904f76c28ddc246627ef6a9"},{"signature":"official_v3_jobs_private.canonical_v1(jsonb,integer)","hash":"f4a258c71cf8115a8ea5697e8b9c1735ebd1bc685170567dec5bc1aee89200ce"},{"signature":"official_v3_jobs_private.wire_v1(text)","hash":"8f8e72bc6487cb7885440aa2163fdb6bb2d2f352a5986e3ae5860570ea85930a"},{"signature":"official_v3_jobs_private.civil_date_v1(text)","hash":"fd5ada592127225a2d995658a74f0ba58bd5b4e7e65301a9d656a07d50eb7ea8"},{"signature":"official_v3_jobs_private.timestamp_v1(text)","hash":"98f15926f68b750a7839b6cae68c412cea716370bfb5d8b53f6fb1e7075ba988"},{"signature":"official_v3_jobs_private.predicate_v1(jsonb)","hash":"f4d7098f74d7257f49042b7ea56e9c4d64ee64d6a96c2d33adf9c6237b93305f"},{"signature":"official_v3_jobs_private.expression_v1(jsonb,boolean,integer)","hash":"759d342f9ee7f164f163fe9d55006564f6cffa7b3bb828bfa98257c34483dce0"},{"signature":"official_v3_jobs_private.context_v1(jsonb)","hash":"d13ef1168f3fd032298fdd563e6045acd85d3a948de45d9eae16bb352f22379e"},{"signature":"official_v3_jobs_private.subject_v1(text,jsonb)","hash":"ba126e5d789cbc5ef470f98fd8c33de0b0cb548688110037d43e48baaee4f922"},{"signature":"official_v3_jobs_private.job_v1(jsonb)","hash":"a34628ad65ba73caa89308cc819b8d1913d7b7e557bddf3b0a42cfef205cf800"},{"signature":"official_v3_jobs_private.command_v1(jsonb)","hash":"9e8167d51aa60a679d0b921c54b7524fde7b999620f466ba0dc61d93245aa48b"},{"signature":"official_v3_jobs_private.reference_v1(jsonb)","hash":"5d04a05d43200433df7361507388b5ee3944765035235490649291d3ade9213a"},{"signature":"official_v3_jobs_private.transition_v1(jsonb,jsonb,jsonb)","hash":"147cb10e9fd33e73082eaf43746552fa589e89db4b600a1fc927a2339f31b7f0"},{"signature":"official_v3_jobs_private.immutable_v1()","hash":"526c75203d670c57e7decab38466ab2a1048534bb4a16814f0e05e5c7fb47e27"},{"signature":"official_v3_jobs_private.consume_s1_v1(jsonb,jsonb,jsonb,text)","hash":"12e6ca30954f82a6628b58dd97db8de6599eb3118c90f34a45a96d4347c9a844"},{"signature":"official_v3_jobs_private.assert_history_v1(text)","hash":"33515f642611e5a0788e30f5a8744b91a6c7f14d374a613e53d2051836a72b4c"},{"signature":"official_v3_jobs_private.assert_catalog_v1()","hash":"c1f9fc5e7f3d4f0099b6e89e41d47df9165ec9b4e559807d1fff4db99bd25cfc"},{"signature":"official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"5aba833e05ecc71fa7daa4f579a6e982eddf8e67bd5306d9ef383c8a73d73b16"},{"signature":"official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"cc90f242fec962daa71edcf534c5f24eb72541571aadc42ff1d3704efe2ffc75"},{"signature":"official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"1e4fbd6ba5d2af33cccd38f5c71b68ccbcce38fa3231a9f20c2e681b79054770"},{"signature":"official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"4c2762b15f062ff3a95bcddcdd9f3f31a29ab961e8dc6d13e0895d0eca017ca1"},{"signature":"official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"4fd077e6222bf925ec8d55b7e8cd53aa7703cf279583a9aaa810daca30255160"},{"signature":"official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"1594e7681d06875e42ac601635561589ce89cdaf5ae4a5091b7a6a71c9ca27b7"},{"signature":"official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)","hash":"7c7889672fbafc7d69bb32a655a93f419354fe0c49fc1b9b1f1d549b09545ad5"},{"signature":"official_v3_guard_private.immutable_v1()","hash":"912ce0a3cee4ab57ee76be8425053f5f42963db5a2943a76f0d49d70059f963b"},{"signature":"official_v3_guard_private.require_open_v1()","hash":"6bef00ffc4fcec92365f1fa4d6d0e7842c08acd2d7719f502042347aa14fd228"},{"signature":"official_v3_guard_private.check_control_v1()","hash":"8a37a92bd1293a467665da5831d717e7675650af9a2f5ef60e1cf57899a99eb4"},{"signature":"official_v3_guard_private.hrs_catalog_v1()","hash":"5af0cb5e2ab83a5876154bbb2f51ed2605cc909866d8890135ab703a30709acb"},{"signature":"official_v3_guard_private.open_until_v1()","hash":"38a690b6246405e05f46cccca99753b4031d9efc78069c53afe83ae2cfab5aaf"},{"signature":"official_v3_guard_private.jobs_catalog_v1()","hash":"63fb9224dd0ed0a73d4ff1ee3506cf533b1b9457ce0fa1dbe42edbc29dbd268c"},{"signature":"official_v3_guard_private.intake_retired_v1(text)","hash":"d63c0b659562cd8c7072caec8dd333a4cd0f198cdb4e8af51e93d3ca7e8fc2c6"},{"signature":"official_v3_guard_private.attempt_retired_v1(text)","hash":"b771a85a239ddd20e69e6f32c21195f4f172b3cab876faba525518935e1cec1e"},{"signature":"official_v3_guard_private.alarm_status_v1()","hash":"c0d610e700e6dd48b058256ef30bcee551f39a045e70e26429baaa7c3bc0f65b"},{"signature":"official_v3_guard_private.catalog_v1()","hash":"28a3e90b0e6be9db58d5910530437b4a76bd5950663d37a1cbcf8ced8545b1db"},{"signature":"official_v3_guard_private.assert_catalog_v1()","hash":"523a12774113c55fbc7d12da00b7c7d4f87aec5f4f5f8920dd9af0e5021806ad"},{"signature":"official_v3_guard_private.check_hma_v1()","hash":"917992aba6dd635fc0e5fd0c7afacd4456cb47a020ca01be80047687caf7127a"},{"signature":"official_v3_guard_private.check_s1_v1()","hash":"fe7647b8fc342215a286d4853af53c2a91dde01cb7f5dfd131a971d91ea03204"},{"signature":"official_v3_guard_private.check_method_link_v1(jsonb,timestamptz)","hash":"9be92d807c7c15c33a77746ef94fab25654dfb3af6a83d6641c37df35d5df074"},{"signature":"official_v3_guard_private.check_jobs_v1()","hash":"a5e9fca902cbc69cb1504467b743670c78a0f0f08e32dc512c8160d65fd2c7cc"},{"signature":"official_v3_guard_private.hrs_certificate_v1()","hash":"64ec973017025af2208a28c89d462182fc218db32df190c2cd5cebe91c14d5f1"},{"signature":"official_v3_guard_private.check_hrs_v1()","hash":"de01e031c184b552e946cb30621aebfdaf1b7525c34024d73be772d4ab30397b"},{"signature":"official_v3_guard_private.content_digest_v1(text)","hash":"804261846f2acd99017f3aed14a5f3859616a913e5ab24ecf32bdd185f40dda6"},{"signature":"official_v3_guard_private.check_certificate_v1(text)","hash":"66cdca6a3635b3bd9b4c60e6751cf07ff78494ef1d726b3aa1dad9d31ae16e5e"},{"signature":"official_v3_guard_private.check_certificates_v1()","hash":"f4e8ada03aa20a08c3d1cff1973ba5757796f5edbb3b41bbeb5bee5b5c858fea"},{"signature":"official_v3_guard_private.begin_component_v1(text)","hash":"5f3029465bea4582e5b2441e5f5dada049b1d318d5d0a50752fdbdee3f22496b"},{"signature":"official_v3_guard_private.seal_component_v1(text)","hash":"efe6ac203d0f8a32c70602a16669d044477f7da86c125d9d641c5e20f1847051"},{"signature":"official_v3_guard_private.owner_session_v1()","hash":"48ba849f43068ae1f3b98a3d794ac060afc17c0c32c7b167a1495d9a6a2bdd26"},{"signature":"official_v3_guard_private.current_method_v1()","hash":"1a18f9d6c3ba0a157dea5ae199501ba173cf0818eb207a3003d0e0b314c86423"},{"signature":"official_v3_guard_private.fixed_method_v1()","hash":"8e993b52161c9495b075f962f390eb61d70da54ae9e69bc746b4b6b3560f7770"},{"signature":"official_v3_guard_private.recovery_jobs_v1()","hash":"9482816cc6a8117d74614b9937aa635c355b4cdf9192da69d0905dd122feb559"},{"signature":"official_v3_guard_private.recovery_intake_v1(jsonb)","hash":"3f5b06793ede7510c6ef9d8c2289d2700eb29ba36b6c17fb7014725a06ab7628"},{"signature":"official_v3_guard_private.recovery_hrs_v1()","hash":"2137aea654f0efba48b3f4fa1a2052b82c7894266265303aba1337e1a3a4a771"},{"signature":"official_v3_guard_private.recovery_snapshot_v1()","hash":"f9ef36de819d1b5e96a22496736b5cb8f70b1aac37f336f21af9d61615e03fce"},{"signature":"official_v3_guard_private.retired_state_v1(text)","hash":"b40984c141bc1622276e2c709a4781dcea8b34868b82a1afb56f7477b86059f7"},{"signature":"official_v3_guard_private.close_jobs_v1(text)","hash":"2a0a5de1d6a3f6d1b02d774429ceff15081fb2b7d0e36acda4f79c1550f3c953"},{"signature":"official_v3_guard_private.check_retired_jobs_v1(jsonb)","hash":"345ecbb0c138df1b0ccbd4a0b966da90f31dcdfb7fd97885160fa45e99fe4689"},{"signature":"official_v3_guard_private.check_retired_s1_v1(jsonb)","hash":"8253e8ac077ddc59b962530bec8b731fc760eca26b2696b632f16238a46a3d74"},{"signature":"official_v3_guard_private.check_retired_hrs_v1(jsonb)","hash":"55e6e0a31d062b642e7a342e0a635e678b8a8ca3baa3c93b2d4a46ca52fee288"},{"signature":"official_v3_guard_private.check_retirements_v1()","hash":"510a6fa603c2492d057eae77130a83fe88928701aa568115ae810e683cfcaf67"},{"signature":"official_v3_guard_private.incident_snapshot_v1()","hash":"4ba7e039404a7d288a2d2fa7d9d61419eb0d3c2e6383c6a662ffb2185a645960"},{"signature":"public.official_v3_guard_review_v1()","hash":"3f5cbf0a53c797a851d72d7d07c1f5deff4267d867c33249eff3b1b82316d359"},{"signature":"public.official_v3_guard_retire_v1(text,text)","hash":"f3e66fc7b829095a0b9352fa78db5780e23a6fd865872a093d2e28cba6917e03"},{"signature":"public.official_v3_guard_resume_v1(text,text)","hash":"173ddbb036a23d4e0eb1051c0434c11a72b2726a79da255f112e245dbe0a2f72"},{"signature":"public.official_v3_guard_confirm_v1(text,text,text)","hash":"80249de576440c3f7b00ee97aa86f28d826692d44edcab6e2de905c41d6294cc"},{"signature":"official_v3_guard_private.ch_de_snapshot_v1(jsonb,integer,timestamptz,text)","hash":"da2ad4db69be956317ec9d943c9353bd0237c15e553233a33fd4db802aa155ef"},{"signature":"official_v3_guard_private.latch_incident_v1(timestamptz,text)","hash":"1d84d32855553fb926147fc01fb79751432c80fa6e40e02ea979722095ffbf34"},{"signature":"official_v3_guard_private.audit_v1()","hash":"f357faa41668ae68565d12a2f9086dff86045e0af4b55b6165a4cf5303c51cc8"},{"signature":"official_v3_guard_private.original_valid_v1(jsonb,text,text)","hash":"8b0bb27a424e3d18b7bce8ef4f49c3035f91982863d75f81917e247882e570e5"},{"signature":"official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)","hash":"5df62d4eb3524bb116b0fcc6cc739f356aa4e4df776819918e7fe866cf45c940"},{"signature":"official_v3_guard_private.fingerprint_hma_v1()","hash":"2c836cbd9f1968cac8f0375adb72c83a029472d88ff356aaebd71a7101cd3962"},{"signature":"official_v3_guard_private.fingerprint_s1_v1()","hash":"570b1b640aae154e31ae043db42eb278cb82fab07aa562eca4e36c5b359da2a0"},{"signature":"official_v3_guard_private.fingerprint_jobs_v1()","hash":"78fdfd4d8e69e9790ff5cae1fc40bf016bcde4ea7ef04ce11f693835cc6f060a"},{"signature":"official_v3_guard_private.begin_hma_v1()","hash":"53aa1bd3c09d60a74c545e4b50862bcb606705cec5b7d0f18e0dbd66be94a97f"},{"signature":"official_v3_guard_private.seal_hma_v1()","hash":"882b622600de1c106fc425523a7daf75037a32320920eff87aaaa4d539c695af"},{"signature":"official_v3_guard_private.begin_s1_v1()","hash":"3df3caf2db11d909febbe9775e2490e73f2d88564d997c6e51869e9b176717c8"},{"signature":"official_v3_guard_private.seal_s1_v1()","hash":"3546d2b21a6ddd54b92e1e81d339fa0eef9baa8d813f70733000acd6450c436d"},{"signature":"official_v3_guard_private.begin_jobs_v1()","hash":"0e74fa135228d58e75e7639ff9118ea61695cf93f8bb34e19d6516d084e36e15"},{"signature":"official_v3_guard_private.seal_jobs_v1()","hash":"4c79c756a9a06cf55720ff9c341616f34b33383beb9fae7246cbaabd1e69bd2a"},{"signature":"official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,\"char\")","hash":"db98bb5781c212347bea467b95dfffbe59d2e3876c5969fc40234afc4ad9859d"},{"signature":"official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)","hash":"dc0c8e711eb360eb40022841b07a4d00f39a3a7a4edb0630bf72a8f8a622db02"},{"signature":"official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)","hash":"79e627238134e15d45f09f5acb2aac7f9cf079b147d3220b2c3bbb893f992209"},{"signature":"official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)","hash":"0b0db811d7d667ef63e607afb9cff9d48080821fd62252bf53df2f48c0e5712d"},{"signature":"official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)","hash":"9c090121b1c5471f8e78b2e2b78813d996c82ad97ce57d60e14299d7be485e88"},{"signature":"official_v3_guard_private.catalog_status_v1()","hash":"c23417ecf2a50291c347579546316c53ab4b1618b17c92a211022d63d41c6beb"},{"signature":"public.official_v3_guard_alarm_status_v1()","hash":"1630c027f7795e0370c5ed26869f966514149b4ddaae89365302375bc35e2a7f"},{"signature":"official_v3_guard_private.recovery_canonical_v1(jsonb,integer)","hash":"9ae0114402a4d9d45514b45508a03b4be6865ef92b13818acd96d244715e355d"},{"signature":"official_v3_jobs_private.rolling_usage_v2(text)","hash":"9658e2c50d2e37d96cf3cdb09dec3223df6f71256b26457961f217be5fba95b3"},{"signature":"official_v3_guard_private.ch_de_quota_v2()","hash":"ef1f6d904ca5742aaf212b82b3974a1f5ad4f88304eafb011ded94e1f7220372"},{"signature":"official_v3_jobs_private.tx_queue_claim_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"12b60c32ccf4a69b43f2bf788b1ee583aab978be01ea5099714dcc98cd3aedad"},{"signature":"official_v3_jobs_private.tx_queue_mutate_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"a1d38701d18e99e9ceee8369385a6bd637436ef52ee8e11688d110d3f32a2721"}]'::jsonb)
    AS f(signature text,hash text) LOOP
    SELECT * INTO actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash THEN
      RAISE EXCEPTION 'admin runtime predecessor function changed: %',expected.signature USING ERRCODE='P7931';
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname=ANY(ARRAY['admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1']::text[]))
    OR EXISTS(SELECT 1 FROM pg_proc p WHERE p.pronamespace='official_v3_guard_private'::regnamespace
      AND p.proname='admin_runtime_guard_v1') THEN
    RAISE EXCEPTION 'admin runtime fresh function names required' USING ERRCODE='P7931';
  END IF;
  SELECT (WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname='profiles' OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
)
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries) INTO old_catalog;
  IF old_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.cycle4_attempt2_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'admin runtime predecessor catalog mismatch' USING ERRCODE='P7905';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();

  -- CMS and campaigns use one existing moderation helper not in the old
  -- finite namespace list. Its canonical body/authority is independently pinned
  -- before it and its existing dependency edges enter the successor catalog.
  helper:=to_regprocedure('public.darf_inhalte_moderieren()');
  SELECT * INTO actual FROM pg_proc WHERE oid=helper;
  IF NOT FOUND OR actual.proowner<>'postgres'::regrole OR actual.prosecdef
    OR actual.prokind<>'f' OR actual.prorettype<>'boolean'::regtype OR actual.proretset
    OR actual.prolang<>(SELECT oid FROM pg_language WHERE lanname='sql')
    OR actual.provolatile<>'s' OR actual.proparallel<>'s' OR actual.proisstrict OR actual.proleakproof
    OR actual.pronargs<>0 OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.prosupport<>0
    OR actual.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']
    OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM '35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab'
    OR (SELECT array_agg(a::text ORDER BY a::text) FROM unnest(actual.proacl) a)
      IS DISTINCT FROM ARRAY['authenticated=X/postgres','postgres=X/postgres','service_role=X/postgres'] THEN
    RAISE EXCEPTION 'admin runtime moderation authority changed' USING ERRCODE='P7931';
  END IF;
  SELECT (WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname='profiles' OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
)
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries) INTO expanded_catalog;
  FOR item IN SELECT key,value FROM jsonb_each(old_catalog) LOOP
    IF expanded_catalog->item.key IS DISTINCT FROM item.value THEN
      RAISE EXCEPTION 'admin runtime old catalog projection changed' USING ERRCODE='P7931';
    END IF;
  END LOOP;
  FOR item IN SELECT key,value FROM jsonb_each(expanded_catalog) WHERE NOT old_catalog ? key LOOP
    IF item.key='function:'||helper
      OR (item.key LIKE 'dependency:%' AND (
        ((item.value->>'classid')::oid='pg_proc'::regclass AND (item.value->>'objid')::oid=helper)
        OR ((item.value->>'refclassid')::oid='pg_proc'::regclass AND (item.value->>'refobjid')::oid=helper)))
      OR (item.key LIKE 'description:%' AND (item.value->>'classoid')::oid='pg_proc'::regclass
        AND (item.value->>'objoid')::oid=helper)
      -- The already verified helper's postgres owner edge was outside the
      -- predecessor's finite public-function list. It is preserved, not made.
      OR (item.key LIKE 'shared:%' AND (item.value->>'classid')::oid='pg_proc'::regclass
        AND (item.value->>'objid')::oid=helper AND (item.value->>'objsubid')::integer=0
        AND (item.value->>'dbid')::oid=(SELECT oid FROM pg_database WHERE datname=current_database())
        AND (item.value->>'refclassid')::oid='pg_authid'::regclass
        AND (item.value->>'refobjid')::oid='postgres'::regrole AND item.value->>'deptype'='o') THEN CONTINUE; END IF;
    RAISE EXCEPTION 'admin runtime unreviewed old catalog expansion: %',item.key USING ERRCODE='P7931';
  END LOOP;
  INSERT INTO pg_temp.admin_runtime_before VALUES('catalog',expanded_catalog),('original_catalog',old_catalog),
    ('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r)),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('global_shared',COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype) FROM pg_shdepend d),'[]'::jsonb));
  -- Freeze and preserve every existing BG1 evidence row. No original row,
  -- incident, generation, retirement, certificate or baseline is rewritten.
  FOR old_table IN SELECT format('%I.%I',n.nspname,c.relname) FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_guard_private'
      AND c.relkind='r' ORDER BY c.oid LOOP
    EXECUTE format('LOCK TABLE %s IN SHARE MODE',old_table::regclass);
    EXECUTE format('SELECT jsonb_build_object(''count'',count(*),''digest'',encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(t)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(t)::text COLLATE "C"),''''),''UTF8'')),''hex'')) FROM %s t',old_table::regclass) INTO old_value;
    INSERT INTO pg_temp.admin_runtime_before VALUES('table:'||old_table,old_value);
  END LOOP;
END $admin_runtime_predecessor$;


-- One additive immutable successor; no historical baseline is rewritten.
CREATE TABLE official_v3_guard_private.admin_runtime_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  predecessor_provider_digest text NOT NULL CHECK (predecessor_provider_digest = '9da5d3dee7a4c3a45fea976b27fc2996e5b5d912741407c6be9954baefa1e106'),
  predecessor_catalog_digest text NOT NULL CHECK (predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_attempt2_digest text NOT NULL CHECK (predecessor_attempt2_digest ~ '^[a-f0-9]{64}$'),
  definition_digest text NOT NULL CHECK (definition_digest = '872bec621ba99e88c62b61cc2c5ab54725593bf424f18dae2c5442897d7f228b'),
  required_generation bigint NOT NULL CHECK (required_generation > 0),
  proof_not_before timestamptz NOT NULL CHECK (isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.admin_runtime_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.admin_runtime_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.admin_runtime_baseline_v1 TO postgres USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.admin_runtime_baseline_v1
  FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.admin_runtime_baseline_v1
  FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON TABLE official_v3_guard_private.admin_runtime_baseline_v1
  FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

-- Same first lock as BG1 and its existing guarded writers. The lock survives
-- function return until transaction end; freshness is checked again on return.
CREATE FUNCTION official_v3_guard_private.admin_runtime_guard_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF current_setting('transaction_isolation') IS DISTINCT FROM 'read committed' THEN
    RAISE EXCEPTION 'admin runtime transaction isolation unavailable' USING ERRCODE='P7902';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
END $$;
REVOKE ALL ON FUNCTION official_v3_guard_private.admin_runtime_guard_v1()
  FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;


-- COMPOSED DEV ONLY: explicit API target yfvbxvijcorffwxbxahl; no connection is selected by this SQL.
-- One atomic statement. Original source files are pinned; only three CREATE heads are made strict.
DO $counts_dev_install$
DECLARE
  security_before jsonb;
  security_after jsonb;
  v_routine record;
  expected record;
  acl text[];
  reporting oid;
BEGIN
  perform pg_catalog.set_config('search_path','pg_catalog,pg_temp',true);
  -- The enclosing finite Admin/BG1 transition has verified the predecessor.
  if pg_catalog.to_regclass('pg_temp.admin_runtime_before') is null then
    raise exception 'counts_dev_composed_predecessor_required' using errcode='55000';
  end if;
  security_before := (select jsonb_build_object(
  'tables', (select jsonb_agg(jsonb_build_object('oid',c.oid,'owner',c.relowner,'acl',c.relacl,
    'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) order by c.oid) from pg_class c
    where c.oid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'columns', (select jsonb_agg(to_jsonb(a) order by a.attrelid,a.attnum) from pg_attribute a
    where a.attrelid in ('auth.users'::regclass,'public.profiles'::regclass) and a.attnum>0 and not a.attisdropped),
  'constraints', (select jsonb_agg(to_jsonb(c) order by c.oid) from pg_constraint c
    where c.conrelid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'policies', (select jsonb_agg(to_jsonb(p) order by p.oid) from pg_policy p
    where p.polrelid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'source_schemas', (select jsonb_agg(to_jsonb(n) order by n.oid) from pg_namespace n where n.nspname in ('public','auth')),
  'roles', (select jsonb_agg(to_jsonb(r) order by r.oid) from pg_roles r
    where r.rolname in ('postgres','anon','authenticated','service_role','supabase_auth_admin','authenticator','pg_database_owner')),
  'memberships', (select jsonb_agg(to_jsonb(m) order by m.roleid,m.member,m.grantor) from pg_auth_members m),
  'default_acl', (select jsonb_agg(to_jsonb(d) order by d.oid) from pg_default_acl d
    where d.defaclnamespace=0 or d.defaclnamespace in ('public'::regnamespace,'auth'::regnamespace)),
  'helpers', (select jsonb_agg(to_jsonb(p) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='public' and p.proname in ('rollenrang','aktuelle_rolle','hat_rolle_mindestens',
      'aktuelles_admin_aal2','darf_konten_verwalten','profil_autoritaet_integritaet_pruefen_v1','profil_rollenwechsel_pruefen'))
      or (n.nspname='auth' and p.proname in ('uid','jwt'))),
  'profile_triggers', (select jsonb_agg(to_jsonb(t) order by t.oid) from pg_trigger t
    where t.tgrelid='public.profiles'::regclass)
));
  if current_user <> 'postgres' or session_user <> 'postgres'
     or not exists(select 1 from pg_roles where rolname='postgres' and not rolsuper and rolbypassrls)
     or current_setting('server_version_num')::integer not between 160000 and 179999
     or current_setting('statement_timeout')::interval <= interval '0 seconds'
     or current_setting('statement_timeout')::interval > interval '2 minutes' then
    raise exception 'counts_dev_executor_or_engine_not_reviewed' using errcode='42501';
  end if;
  perform set_config('lock_timeout','5s',true);
  if not pg_try_advisory_xact_lock(hashtextextended('jetnity.admin-account-counts.dev-v1',0)) then
    raise exception 'counts_dev_install_in_progress' using errcode='55P03';
  end if;
  if to_regnamespace('jetnity_reporting') is not null
     or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname='admin_account_counts_v1') then
    raise exception 'counts_dev_target_not_fresh' using errcode='55000';
  end if;
  if exists(select 1 from pg_roles where rolname='jetnity_reporting_owner')
     or exists(select 1 from pg_roles r where r.rolname in ('anon','authenticated','service_role')
       and (pg_has_role(r.oid,'postgres','MEMBER') or has_table_privilege(r.oid,'auth.users','SELECT')))
     or not has_table_privilege('postgres','auth.users','SELECT')
     or not exists(select 1 from pg_class where oid='auth.users'::regclass and relrowsecurity and not relforcerowsecurity
       and relowner='supabase_auth_admin'::regrole)
     or not exists(select 1 from pg_class where oid='public.profiles'::regclass and relrowsecurity and relowner='postgres'::regrole) then
    raise exception 'counts_dev_source_authority_changed' using errcode='42501';
  end if;
  if to_regnamespace('jetnity_internal') is not null and exists(select 1 from pg_roles r
      where r.rolname in ('anon','authenticated','service_role')
      and has_schema_privilege(r.oid,'jetnity_internal','USAGE')) then
    raise exception 'counts_dev_internal_schema_exposed' using errcode='42501';
  end if;
  for expected in select * from (values
    ('auth.users','id','uuid',true),('auth.users','created_at','timestamptz',false),
    ('auth.users','deleted_at','timestamptz',false),('auth.users','is_anonymous','bool',true),
    ('public.profiles','id','uuid',true),('public.profiles','user_id','uuid',true),('public.profiles','status','text',true)
  ) as v(relation,column_name,type_name,not_null) loop
    if not exists(select 1 from pg_attribute a where a.attrelid=expected.relation::regclass
      and a.attname=expected.column_name and a.atttypid=expected.type_name::regtype
      and a.attnotnull=expected.not_null and a.attnum>0 and not a.attisdropped) then
      raise exception 'counts_dev_source_column_changed' using errcode='55000';
    end if;
  end loop;
  if not exists(select 1 from pg_constraint c where c.conrelid='public.profiles'::regclass
      and c.contype in ('p','u') and c.convalidated and c.conkey=array[(select attnum from pg_attribute
        where attrelid='public.profiles'::regclass and attname='user_id')]::smallint[]) then
    raise exception 'counts_dev_profile_identity_not_unique' using errcode='55000';
  end if;
  if not exists(select 1 from pg_constraint c where c.conrelid='public.profiles'::regclass
      and c.contype='f' and c.convalidated and c.confrelid='auth.users'::regclass and c.confdeltype='c'
      and c.conkey=array[(select attnum from pg_attribute where attrelid='public.profiles'::regclass and attname='user_id')]::smallint[]
      and c.confkey=array[(select attnum from pg_attribute where attrelid='auth.users'::regclass and attname='id')]::smallint[]) then
    raise exception 'counts_dev_profile_auth_binding_changed' using errcode='55000';
  end if;
  for expected in select * from (values ('aktuelle_rolle','41b223309c2228d87a0ac273ac31cc9ffcaa7e3ac406059d00818b947b09cbd0',0,true,'s','u','search_path=public, pg_temp','text',null::text),
('aktuelles_admin_aal2','d3cf53b48caba5d05eef08d940f1199b7ad58a8a78acefd1e899fda0c502ff1a',0,false,'s','s','search_path=pg_catalog','bool',null::text),
('darf_konten_verwalten','35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab',0,false,'s','s','search_path=pg_catalog','bool',null::text),
('hat_rolle_mindestens','367f630edefe6788750c6cabe7f5cb1b32d7c01ee4e3246d60632bf5ccd77f10',1,true,'s','u','search_path=public, pg_temp','bool','minimum'),
('rollenrang','56d5753e4ccb189c2472c02a2737b6662c182381d03bf4de1954d069829fe850',1,false,'i','s','search_path=pg_catalog','int4','rolle'))
    as v(name,digest,nargs,definer,volatility,parallel,configuration,return_type,argument_name) loop
    if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname=expected.name) <> 1 then
      raise exception 'counts_dev_helper_identity_changed' using errcode='55000';
    end if;
    if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      join pg_language l on l.oid=p.prolang where n.nspname='public' and p.proname=expected.name
      and encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')=expected.digest
      and p.pronargs=expected.nargs and p.proowner='postgres'::regrole and p.prosecdef=expected.definer
      and p.provolatile=expected.volatility::"char" and p.proparallel=expected.parallel::"char"
      and p.prokind='f' and l.lanname='sql' and not p.proisstrict and not p.proleakproof
      and p.prorettype=expected.return_type::regtype and not p.proretset
      and p.pronargdefaults=0 and p.proargdefaults is null and p.provariadic=0 and p.prosupport=0
      and p.proallargtypes is null and p.proargmodes is null and p.probin is null and p.prosqlbody is null
      and p.proargtypes::text=case when expected.nargs=0 then '' else 'text'::regtype::oid::text end
      and p.proargnames is not distinct from case when expected.argument_name is null then null::text[] else array[expected.argument_name] end
      and p.proconfig=array[expected.configuration]
      and (select array_agg(x::text order by x::text) from unnest(p.proacl) x)
        =array['authenticated=X/postgres','postgres=X/postgres','service_role=X/postgres']) then
      raise exception 'counts_dev_helper_contract_changed' using errcode='55000';
    end if;
  end loop;
  -- counts-dev-authority-validation-boundary
  if not exists(select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid
    where t.tgrelid='public.profiles'::regclass and t.tgname='profiles_autoritaet_integritaet_v1'
      and t.tgtype=27 and t.tgenabled='O' and not t.tgisinternal and t.tgnargs=0
      and t.tgqual is null and t.tgattr::text='' and octet_length(t.tgargs)=0
      and t.tgparentid=0 and t.tgconstraint=0 and t.tgconstrrelid=0 and t.tgconstrindid=0
      and not t.tgdeferrable and not t.tginitdeferred and t.tgoldtable is null and t.tgnewtable is null
      and p.oid=to_regprocedure('public.profil_autoritaet_integritaet_pruefen_v1()')
      and p.proowner='postgres'::regrole and not p.prosecdef and p.proconfig=array['search_path=pg_catalog']
      and p.prokind='f' and p.pronargs=0 and p.prorettype='trigger'::regtype
      and p.provolatile='v' and p.proparallel='u' and not p.proisstrict and not p.proleakproof
      and p.prolang=(select oid from pg_language where lanname='plpgsql') and not p.proretset
      and p.proargtypes::text='' and p.proallargtypes is null and p.proargmodes is null and p.proargnames is null
      and p.pronargdefaults=0 and p.proargdefaults is null and p.provariadic=0 and p.prosupport=0
      and p.probin is null and p.prosqlbody is null
      and encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d'
      and p.proacl::text[] = array['postgres=X/postgres']) then
    raise exception 'counts_dev_profile_guard_changed' using errcode='55000';
  end if;
  -- Strict creation also rejects a concurrent uncooperative creator after the fresh check.
  EXECUTE $counts_producer_source$-- LOCAL / UNAPPLIED candidate — not a migration.
--
-- Metric: jetnity.admin-account-counts.v1
-- Privilege: narrow SECURITY DEFINER aggregate over protected auth.users.
-- This file must stay outside supabase/migrations/. Migration runners
-- discover that directory; applying this as Production SQL is a later
-- reserved Product-Owner gate after independent review.
--
-- SECURITY DEFINER is required because authenticated callers must not
-- receive SELECT on auth.users, yet the only truthful registration
-- measure is an aggregate of those rows. The function returns two
-- counts, one database clock and the fixed window — never row
-- identities. Authorization is evaluated before the aggregate:
--   1. auth.uid() is present;
--   2. that caller exists in auth.users, is not soft-deleted and is
--      not anonymous;
--   3. public.darf_konten_verwalten() (extracted current contract:
--      hat_rolle_mindestens('moderator') AND aktuelles_admin_aal2());
--   4. that same caller has a persisted public.profiles row whose
--      status is exactly active. banned / disabled / pending / NULL /
--      missing / unrecognized status denies. This is a feature-local
--      caller prerequisite, not a filter on the counted population.
-- Deny raises SQLSTATE 42501. It never returns a success row of zeros.
--
-- Trusted execution owner is the existing database role `postgres`,
-- represented in the local fixture as NOSUPERUSER + BYPASSRLS with
-- SELECT on auth.users. That matches the Technical-Lead 2026-09-22
-- Production metadata used as fixture evidence. This file does not
-- create a new BYPASSRLS / global privilege role, does not grant
-- auth.users to clients, and does not alter managed auth.users
-- policies. `postgres` already has broader authority than this
-- function; a later Production port still needs a fresh
-- metadata/ownership/ACL review and a reserved Product-Owner gate.
--
-- Objects are fully qualified. search_path is pinned to pg_catalog.
-- TimeZone is pinned to UTC. The window is a fixed 720-hour
-- (30×24) half-open interval, not session-DST calendar days.
-- No dynamic SQL. PUBLIC / anon / service_role execution is revoked.
-- authenticated receives only USAGE on this new schema and EXECUTE on
-- this function. No grant is made on jetnity_internal. No SELECT on
-- auth.users is granted to client roles.

create schema jetnity_reporting;

revoke all on schema jetnity_reporting from public;
revoke all on schema jetnity_reporting from anon;
revoke all on schema jetnity_reporting from authenticated;
revoke all on schema jetnity_reporting from service_role;
grant usage on schema jetnity_reporting to authenticated;

alter default privileges in schema jetnity_reporting
  revoke execute on functions from public;
alter default privileges in schema jetnity_reporting
  revoke execute on functions from anon;
alter default privileges in schema jetnity_reporting
  revoke execute on functions from authenticated;
alter default privileges in schema jetnity_reporting
  revoke execute on functions from service_role;

create function jetnity_reporting.account_counts_v1()
returns table (
  present_registered_accounts bigint,
  created_in_prior_30_days bigint,
  measured_at timestamp with time zone,
  window_start timestamp with time zone,
  definition_version text
)
language plpgsql
stable
security definer
set search_path = pg_catalog
set timezone = 'UTC'
as $$
declare
  _uid uuid;
  _caller_present boolean;
  _caller_status text;
  _measured_at timestamp with time zone;
  _window_start timestamp with time zone;
begin
  _uid := auth.uid();
  if _uid is null then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  select exists (
    select 1
      from auth.users as u
     where u.id = _uid
       and u.deleted_at is null
       and u.is_anonymous is false
  )
    into _caller_present;

  if not coalesce(_caller_present, false) then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  if not coalesce(public.darf_konten_verwalten(), false) then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  -- Feature-local caller-status prerequisite. Fully qualified because
  -- search_path is pinned to pg_catalog. A missing row leaves
  -- _caller_status NULL. Only exactly active may continue. This does
  -- not join the metric population.
  select p.status
    into _caller_status
    from public.profiles as p
   where p.user_id = _uid;

  if _caller_status is distinct from 'active' then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  -- One transaction-stable database clock. Fixed 30×24 hours, not
  -- session-DST calendar days. Half-open [window_start, measured_at).
  _measured_at := pg_catalog.now();
  _window_start := _measured_at - interval '720 hours';

  return query
  select
    count(*)::bigint,
    count(*) filter (
      where u.created_at is not null
        and u.created_at >= _window_start
        and u.created_at < _measured_at
    )::bigint,
    _measured_at,
    _window_start,
    'jetnity.admin-account-counts.v1'::text
  from auth.users as u
  where u.deleted_at is null
    and u.is_anonymous is false;
end
$$;

alter function jetnity_reporting.account_counts_v1() owner to postgres;

comment on schema jetnity_reporting is
  'LOCAL/UNAPPLIED reporting schema. Not exposed as a Data API RPC. No grant on jetnity_internal. Owned functions execute as the trusted postgres role (fixture: NOSUPERUSER+BYPASSRLS).';

comment on function jetnity_reporting.account_counts_v1() is
  'jetnity.admin-account-counts.v1: present non-anonymous auth accounts and the subset created in a fixed 720-hour half-open window. SECURITY DEFINER owned by postgres so RLS-protected auth.users can be aggregated without client SELECT or a new BYPASSRLS role. Deny is 42501, never a zero success row. created_at NULL counts in present and not in the window. Future timestamps do not count in the prior 720 hours. Metric population has no profile join; banned/internal/unconfirmed rows remain counted when the auth account belongs to the accepted population. Caller must exist, not be anonymous or soft-deleted, pass public.darf_konten_verwalten(), and have a persisted public.profiles.status of exactly active. Authorized present_count is at least 1 because that caller is themselves a present account.';

revoke all on function jetnity_reporting.account_counts_v1() from public;
revoke all on function jetnity_reporting.account_counts_v1() from anon;
revoke all on function jetnity_reporting.account_counts_v1() from service_role;
revoke all on function jetnity_reporting.account_counts_v1() from authenticated;
grant execute on function jetnity_reporting.account_counts_v1() to authenticated;
$counts_producer_source$;
  -- counts-dev-wrapper-boundary
  EXECUTE $counts_wrapper_source$-- LOCAL / UNAPPLIED wrapper — not a migration.
--
-- public.admin_account_counts_v1()
-- Zero-argument STABLE SECURITY INVOKER wrapper over the accepted
-- jetnity_reporting.account_counts_v1() producer. This file must stay
-- outside the versioned migration discovery directory. Applying this
-- as hosted SQL is a later reserved
-- Product-Owner gate after independent review.
--
-- The wrapper does not read protected auth rows, does not add another
-- elevated-definer function, does not create a role, does not grant
-- client table access, does not alter managed-auth policy, and does not
-- grant on jetnity_internal.
-- Schema exposure stays limited to this public function. The private
-- reporting schema is not added to exposed schemas.
--
-- The two bigint counts are converted to canonical decimal TEXT for
-- transport so JSON/JavaScript cannot silently round large values.
-- Counting semantics stay entirely in the accepted producer.

create function public.admin_account_counts_v1()
returns table (
  present_registered_accounts text,
  created_in_prior_30_days text,
  measured_at timestamp with time zone,
  window_start timestamp with time zone,
  definition_version text
)
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select
    pg_catalog.btrim(inner_row.present_registered_accounts::text),
    pg_catalog.btrim(inner_row.created_in_prior_30_days::text),
    inner_row.measured_at,
    inner_row.window_start,
    inner_row.definition_version
  from jetnity_reporting.account_counts_v1() as inner_row;
$$;

comment on function public.admin_account_counts_v1() is
  'LOCAL/UNAPPLIED SECURITY INVOKER wrapper over jetnity_reporting.account_counts_v1(). Transport-only canonical decimal text for the two accepted counts. Zero arguments. Deny remains the inner 42501. Not a migration and not live statistics.';

revoke all on function public.admin_account_counts_v1() from public;
revoke all on function public.admin_account_counts_v1() from anon;
revoke all on function public.admin_account_counts_v1() from service_role;
revoke all on function public.admin_account_counts_v1() from authenticated;
grant execute on function public.admin_account_counts_v1() to authenticated;
$counts_wrapper_source$;
  -- counts-dev-verification-boundary
  reporting := 'jetnity_reporting'::regnamespace;
  select array_agg(a::text order by a::text) into acl from pg_namespace n, unnest(n.nspacl) a where n.oid=reporting;
  if (select nspowner from pg_namespace where oid=reporting) <> 'postgres'::regrole
     or acl is distinct from array['authenticated=U/postgres','postgres=UC/postgres']
     or (select count(*) from pg_proc where pronamespace=reporting) <> 1
     or exists(select 1 from pg_class where relnamespace=reporting) then
    raise exception 'counts_dev_reporting_schema_not_exact' using errcode='55000';
  end if;
  for expected in select * from (values
    ('jetnity_reporting','account_counts_v1','plpgsql',true,'eaedfdc58cc572164f2bffd8dd8429e074afdd3aef9033afcfdffb3929e70e16',array['bigint','bigint','timestamptz','timestamptz','text']),
    ('public','admin_account_counts_v1','sql',false,'aed37c6c5abd5fa8c05918e345226a0712adbe60d72f01b191f91141660c5f9c',array['text','text','timestamptz','timestamptz','text'])
  ) as v(schema_name,name,language_name,definer,digest,types) loop
    if (select count(*) from pg_proc q join pg_namespace n on n.oid=q.pronamespace
      where n.nspname=expected.schema_name and q.proname=expected.name) <> 1 then
      raise exception 'counts_dev_function_count_not_exact' using errcode='55000';
    end if;
    select q.*, l.lanname into strict v_routine from pg_proc q join pg_namespace n on n.oid=q.pronamespace
      join pg_language l on l.oid=q.prolang where n.nspname=expected.schema_name and q.proname=expected.name;
    select array_agg(a::text order by a::text) into acl from unnest(v_routine.proacl) a;
    if v_routine.proowner <> 'postgres'::regrole or v_routine.prosecdef <> expected.definer
       or v_routine.lanname <> expected.language_name or v_routine.provolatile <> 's' or v_routine.proparallel <> 'u'
       or v_routine.prokind <> 'f' or v_routine.pronargs <> 0 or not v_routine.proretset or v_routine.prorettype <> 'record'::regtype
       or v_routine.proisstrict or v_routine.proleakproof or v_routine.pronargdefaults <> 0 or v_routine.proargdefaults is not null
       or v_routine.provariadic <> 0 or v_routine.prosupport <> 0 or v_routine.probin is not null or v_routine.prosqlbody is not null
       or v_routine.proargmodes is distinct from array['t','t','t','t','t']::"char"[]
       or v_routine.proargnames is distinct from array['present_registered_accounts','created_in_prior_30_days','measured_at','window_start','definition_version']
       or v_routine.proallargtypes is distinct from (select array_agg(x::regtype::oid order by nr) from unnest(expected.types) with ordinality as a(x,nr))
       or encode(sha256(convert_to(v_routine.prosrc,'UTF8')),'hex') <> expected.digest
       or acl is distinct from array['authenticated=X/postgres','postgres=X/postgres'] then
      raise exception 'counts_dev_function_contract_not_exact' using errcode='55000';
    end if;
    if not (v_routine.proconfig @> array['search_path=pg_catalog'])
       or (expected.definer and (cardinality(v_routine.proconfig) <> 2 or not exists(select 1 from unnest(v_routine.proconfig) c where lower(c)='timezone=utc')))
       or (not expected.definer and v_routine.proconfig is distinct from array['search_path=pg_catalog'])
       or has_function_privilege('anon',v_routine.oid,'EXECUTE') or has_function_privilege('service_role',v_routine.oid,'EXECUTE')
       or not has_function_privilege('authenticated',v_routine.oid,'EXECUTE') then
      raise exception 'counts_dev_function_access_not_exact' using errcode='42501';
    end if;
  end loop;
  if has_schema_privilege('anon',reporting,'USAGE') or has_schema_privilege('service_role',reporting,'USAGE')
     or not has_schema_privilege('authenticated',reporting,'USAGE')
     or has_schema_privilege('authenticated',reporting,'CREATE')
     or exists(select 1 from pg_default_acl d where d.defaclnamespace=reporting and
       (d.defaclrole <> 'postgres'::regrole or d.defaclobjtype <> 'f' or
        (select array_agg(a::text order by a::text) from unnest(d.defaclacl) a) is distinct from array['postgres=X/postgres'])) then
    raise exception 'counts_dev_reporting_access_not_exact' using errcode='42501';
  end if;
  security_after := (select jsonb_build_object(
  'tables', (select jsonb_agg(jsonb_build_object('oid',c.oid,'owner',c.relowner,'acl',c.relacl,
    'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) order by c.oid) from pg_class c
    where c.oid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'columns', (select jsonb_agg(to_jsonb(a) order by a.attrelid,a.attnum) from pg_attribute a
    where a.attrelid in ('auth.users'::regclass,'public.profiles'::regclass) and a.attnum>0 and not a.attisdropped),
  'constraints', (select jsonb_agg(to_jsonb(c) order by c.oid) from pg_constraint c
    where c.conrelid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'policies', (select jsonb_agg(to_jsonb(p) order by p.oid) from pg_policy p
    where p.polrelid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'source_schemas', (select jsonb_agg(to_jsonb(n) order by n.oid) from pg_namespace n where n.nspname in ('public','auth')),
  'roles', (select jsonb_agg(to_jsonb(r) order by r.oid) from pg_roles r
    where r.rolname in ('postgres','anon','authenticated','service_role','supabase_auth_admin','authenticator','pg_database_owner')),
  'memberships', (select jsonb_agg(to_jsonb(m) order by m.roleid,m.member,m.grantor) from pg_auth_members m),
  'default_acl', (select jsonb_agg(to_jsonb(d) order by d.oid) from pg_default_acl d
    where d.defaclnamespace=0 or d.defaclnamespace in ('public'::regnamespace,'auth'::regnamespace)),
  'helpers', (select jsonb_agg(to_jsonb(p) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='public' and p.proname in ('rollenrang','aktuelle_rolle','hat_rolle_mindestens',
      'aktuelles_admin_aal2','darf_konten_verwalten','profil_autoritaet_integritaet_pruefen_v1','profil_rollenwechsel_pruefen'))
      or (n.nspname='auth' and p.proname in ('uid','jwt'))),
  'profile_triggers', (select jsonb_agg(to_jsonb(t) order by t.oid) from pg_trigger t
    where t.tgrelid='public.profiles'::regclass)
));
  if security_after is distinct from security_before then
    raise exception 'counts_dev_preexisting_authority_changed' using errcode='55000';
  end if;
  comment on schema jetnity_reporting is 'Dev-only account-count rollout; no client access to auth.users and no Production activation.';
  comment on function jetnity_reporting.account_counts_v1() is 'Dev-only activation of the reviewed jetnity.admin-account-counts.v1 producer. Unchanged counting and active-caller/AAL2 contract.';
  comment on function public.admin_account_counts_v1() is 'Dev-only zero-argument SECURITY INVOKER transport for the reviewed account-count producer; exact decimal text counts.';
  perform pg_notify('pgrst','reload schema');
END
$counts_dev_install$;


-- LOCAL / UNAPPLIED. Not a migration and not an activation mechanism.
-- Install this file and functions-candidate.sql in ONE explicit transaction
-- only inside the owned synthetic native fixture. No hosted target is accepted.
-- No existing role, authority function, default privilege or guard is changed.

CREATE SCHEMA jetnity_cms_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_cms_private FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION jetnity_cms_private.reference_v1(p_entry_id text) RETURNS jsonb
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT jsonb_build_object('entryId', r.id, 'locale', 'de', 'name', r.name,
    'country', r.country, 'image', r.image)
  FROM (VALUES
    ('geonames:1650535', 'Bali', 'Indonesien', '/images/bali.jpg'),
    ('geonames:2267057', 'Lissabon', 'Portugal', '/images/lisbon.jpg'),
    ('geonames:2657915', 'Zermatt', 'Schweiz', '/images/zermatt.jpg'),
    ('geonames:2759794', 'Amsterdam', 'Niederlande', '/images/amsterdam.jpg')
  ) AS r(id, name, country, image) WHERE r.id = p_entry_id
$$;

CREATE FUNCTION jetnity_cms_private.text_valid_v1(p_value text, p_characters integer, p_bytes integer)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE whitespace text := ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13)
  || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195)
  || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201)
  || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279);
BEGIN
  RETURN coalesce(p_value <> '' AND char_length(p_value) <= p_characters
    AND octet_length(p_value) <= p_bytes AND p_value = btrim(p_value, whitespace)
    AND p_value !~ ('[' || chr(1) || '-' || chr(31) || chr(127) || '-' || chr(159) || '<>]'), false);
END $$;

CREATE FUNCTION jetnity_cms_private.editable_valid_v1(p_payload jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE item jsonb; position integer; previous integer := 0;
BEGIN
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
  IF (SELECT array_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(p_payload) k)
    IS DISTINCT FROM ARRAY['beschreibung', 'idea', 'themen']::text[] THEN RETURN false; END IF;
  IF jsonb_typeof(p_payload->'beschreibung') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_payload->'idea') IS DISTINCT FROM 'string'
    OR NOT jetnity_cms_private.text_valid_v1(p_payload->>'beschreibung', 800, 3200)
    OR NOT jetnity_cms_private.text_valid_v1(p_payload->>'idea', 300, 1200)
    OR jsonb_typeof(p_payload->'themen') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
  IF jsonb_array_length(p_payload->'themen') NOT BETWEEN 1 AND 4 THEN RETURN false; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'themen') LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
    position := array_position(ARRAY['stadt-kultur','natur','strand','erholung']::text[], item #>> '{}');
    IF position IS NULL OR position <= previous THEN RETURN false; END IF;
    previous := position;
  END LOOP;
  RETURN true;
END $$;

CREATE FUNCTION jetnity_cms_private.snapshot_valid_v1(p_entry_id text, p_content jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF jsonb_typeof(p_content) IS DISTINCT FROM 'object'
    OR jetnity_cms_private.reference_v1(p_entry_id) IS NULL THEN RETURN false; END IF;
  RETURN (p_content - ARRAY['beschreibung','idea','themen']) = jetnity_cms_private.reference_v1(p_entry_id)
    AND jetnity_cms_private.editable_valid_v1(jsonb_build_object(
      'beschreibung', p_content->'beschreibung', 'idea', p_content->'idea', 'themen', p_content->'themen'));
END $$;

CREATE FUNCTION jetnity_cms_private.timestamp_v1(p_value timestamptz) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT CASE WHEN p_value IS NULL THEN NULL
    ELSE to_char(p_value AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') END
$$;

CREATE FUNCTION jetnity_cms_private.decimal_valid_v1(p_value jsonb, p_zero boolean, p_null boolean)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE value text;
BEGIN
  IF p_value IS NULL THEN RETURN false; END IF;
  IF p_value = 'null'::jsonb THEN RETURN coalesce(p_null, false); END IF;
  IF jsonb_typeof(p_value) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  value := p_value #>> '{}';
  IF value !~ '^(0|[1-9][0-9]{0,18})$' THEN RETURN false; END IF;
  RETURN value::numeric <= 9223372036854775807 AND (coalesce(p_zero, false) OR value <> '0');
END $$;

CREATE FUNCTION jetnity_cms_private.revision_payload_valid_v1(p_payload jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
  RETURN (SELECT array_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(p_payload) k)
    IS NOT DISTINCT FROM ARRAY['revision']::text[]
    AND jetnity_cms_private.decimal_valid_v1(p_payload->'revision', false, false);
END $$;

CREATE FUNCTION jetnity_cms_private.request_valid_v1(
  p_request jsonb, p_request_id uuid, p_actor_id uuid, p_entry_id text, p_before bigint
) RETURNS boolean LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE key text; action text;
BEGIN
  IF jsonb_typeof(p_request) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
  IF (SELECT array_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(p_request) k)
    IS DISTINCT FROM ARRAY['action','actorId','entryId','expectedVersion','payload','requestId','schema']::text[] THEN RETURN false; END IF;
  FOREACH key IN ARRAY ARRAY['action','actorId','entryId','expectedVersion','requestId'] LOOP
    IF jsonb_typeof(p_request->key) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  END LOOP;
  IF NOT coalesce(p_request->'schema' = '1'::jsonb
    AND p_request->>'requestId' = p_request_id::text AND p_request->>'actorId' = p_actor_id::text
    AND p_request->>'entryId' = p_entry_id AND p_request->>'expectedVersion' = p_before::text
    AND p_before >= 0, false) THEN RETURN false; END IF;
  action := p_request->>'action';
  IF action = 'save_draft' THEN RETURN jetnity_cms_private.editable_valid_v1(p_request->'payload');
  ELSIF action IN ('publish','restore_draft') THEN RETURN jetnity_cms_private.revision_payload_valid_v1(p_request->'payload');
  ELSIF action = 'archive' THEN RETURN p_request->'payload' = '{}'::jsonb;
  END IF;
  RETURN false;
END $$;

CREATE FUNCTION jetnity_cms_private.receipt_valid_v1(
  p_result jsonb, p_request jsonb, p_after bigint, p_recorded_at timestamptz
) RETURNS boolean LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE key text; action text;
BEGIN
  IF jsonb_typeof(p_result) IS DISTINCT FROM 'object'
    OR p_after IS NULL OR p_after <= 0 OR p_recorded_at IS NULL OR NOT isfinite(p_recorded_at) THEN RETURN false; END IF;
  IF (SELECT array_agg(k ORDER BY k COLLATE "C") FROM jsonb_object_keys(p_result) k)
    IS DISTINCT FROM ARRAY['action','archived','beforeVersion','createdRevision','draftRevision','entryId',
      'publishedRevision','recordedAt','requestId','schema','status','version']::text[] THEN RETURN false; END IF;
  FOREACH key IN ARRAY ARRAY['action','beforeVersion','entryId','recordedAt','requestId','status','version'] LOOP
    IF jsonb_typeof(p_result->key) IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  END LOOP;
  IF jsonb_typeof(p_result->'archived') IS DISTINCT FROM 'boolean'
    OR NOT jetnity_cms_private.decimal_valid_v1(p_result->'draftRevision', false, false)
    OR NOT jetnity_cms_private.decimal_valid_v1(p_result->'publishedRevision', false, true)
    OR NOT jetnity_cms_private.decimal_valid_v1(p_result->'createdRevision', false, true) THEN RETURN false; END IF;
  IF NOT coalesce(p_result->'schema' = '1'::jsonb AND p_result->>'status' = 'recorded'
    AND p_result->'requestId' = p_request->'requestId' AND p_result->'entryId' = p_request->'entryId'
    AND p_result->'action' = p_request->'action' AND p_result->'beforeVersion' = p_request->'expectedVersion'
    AND p_result->>'version' = p_after::text
    AND p_result->>'recordedAt' = jetnity_cms_private.timestamp_v1(p_recorded_at), false) THEN RETURN false; END IF;
  IF (p_result->>'draftRevision')::bigint > p_after
    OR (p_result->>'publishedRevision')::bigint > (p_result->>'draftRevision')::bigint THEN RETURN false; END IF;
  action := p_result->>'action';
  IF action IN ('save_draft','restore_draft') THEN
    RETURN p_result->'archived' = 'false'::jsonb
      AND p_result->'createdRevision' = p_result->'draftRevision'
      AND (p_result->'publishedRevision' = 'null'::jsonb
        OR (p_result->>'publishedRevision')::bigint < (p_result->>'draftRevision')::bigint);
  ELSIF action = 'publish' THEN
    RETURN p_result->'archived' = 'false'::jsonb AND p_result->'createdRevision' = 'null'::jsonb
      AND p_result->'publishedRevision' = p_result->'draftRevision'
      AND p_result->'publishedRevision' = p_request#>'{payload,revision}';
  ELSIF action = 'archive' THEN
    RETURN p_result->'archived' = 'true'::jsonb AND p_result->'createdRevision' = 'null'::jsonb
      AND p_result->'publishedRevision' = 'null'::jsonb;
  END IF;
  RETURN false;
END $$;

CREATE TABLE jetnity_cms_private.inspiration_entries_v1 (
  entry_id text PRIMARY KEY CHECK (jetnity_cms_private.reference_v1(entry_id) IS NOT NULL),
  locale text NOT NULL CHECK (locale = 'de'),
  name text NOT NULL,
  country text NOT NULL,
  image text NOT NULL,
  sort_order integer NOT NULL UNIQUE CHECK (sort_order BETWEEN 1 AND 4),
  state_version bigint NOT NULL DEFAULT 0 CHECK (state_version >= 0),
  draft_revision bigint CHECK (draft_revision > 0),
  published_revision bigint CHECK (published_revision > 0),
  published_at timestamptz CHECK (isfinite(published_at)),
  archived boolean NOT NULL DEFAULT false,
  last_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp() CHECK (isfinite(created_at)),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp() CHECK (isfinite(updated_at)),
  CHECK (jsonb_build_object('entryId', entry_id, 'locale', locale, 'name', name, 'country', country, 'image', image)
    = jetnity_cms_private.reference_v1(entry_id)),
  CHECK ((state_version = 0) = (draft_revision IS NULL)),
  CHECK ((state_version = 0) = (last_request_id IS NULL)),
  CHECK (draft_revision <= state_version),
  CHECK (published_revision <= draft_revision),
  CHECK ((published_revision IS NULL) = (published_at IS NULL)),
  CHECK (NOT archived OR published_revision IS NULL),
  CHECK (updated_at >= created_at)
);

CREATE TABLE jetnity_cms_private.inspiration_revisions_v1 (
  entry_id text NOT NULL REFERENCES jetnity_cms_private.inspiration_entries_v1(entry_id) ON DELETE RESTRICT,
  revision bigint NOT NULL CHECK (revision > 0),
  content jsonb NOT NULL CHECK (jetnity_cms_private.snapshot_valid_v1(entry_id, content)),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL CHECK (isfinite(created_at)),
  restored_from_revision bigint CHECK (restored_from_revision > 0 AND restored_from_revision < revision),
  PRIMARY KEY (entry_id, revision),
  FOREIGN KEY (entry_id, restored_from_revision)
    REFERENCES jetnity_cms_private.inspiration_revisions_v1(entry_id, revision) ON DELETE RESTRICT
);

CREATE TABLE jetnity_cms_private.inspiration_operations_v1 (
  request_id uuid PRIMARY KEY CHECK (request_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  actor_id uuid NOT NULL,
  entry_id text NOT NULL REFERENCES jetnity_cms_private.inspiration_entries_v1(entry_id) ON DELETE RESTRICT,
  request jsonb NOT NULL CHECK (jsonb_typeof(request) = 'object'),
  result jsonb NOT NULL CHECK (jsonb_typeof(result) = 'object'),
  before_version bigint NOT NULL CHECK (before_version >= 0),
  after_version bigint NOT NULL CHECK (after_version > 0 AND after_version - before_version = 1),
  created_at timestamptz NOT NULL CHECK (isfinite(created_at)),
  UNIQUE (entry_id, after_version),
  UNIQUE (entry_id, request_id, after_version),
  CHECK (jetnity_cms_private.request_valid_v1(request, request_id, actor_id, entry_id, before_version) IS TRUE),
  CHECK (jetnity_cms_private.receipt_valid_v1(result, request, after_version, created_at) IS TRUE)
);

ALTER TABLE jetnity_cms_private.inspiration_entries_v1
  ADD CONSTRAINT cms_draft_revision_fk FOREIGN KEY (entry_id, draft_revision)
    REFERENCES jetnity_cms_private.inspiration_revisions_v1(entry_id, revision) DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT cms_published_revision_fk FOREIGN KEY (entry_id, published_revision)
    REFERENCES jetnity_cms_private.inspiration_revisions_v1(entry_id, revision) DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT cms_last_operation_fk FOREIGN KEY (entry_id, last_request_id, state_version)
    REFERENCES jetnity_cms_private.inspiration_operations_v1(entry_id, request_id, after_version) DEFERRABLE INITIALLY DEFERRED;

CREATE FUNCTION jetnity_cms_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN RAISE EXCEPTION 'cms immutable record' USING ERRCODE = '55000'; END $$;

CREATE FUNCTION jetnity_cms_private.entry_update_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF ROW(NEW.entry_id, NEW.locale, NEW.name, NEW.country, NEW.image, NEW.sort_order, NEW.created_at)
    IS DISTINCT FROM ROW(OLD.entry_id, OLD.locale, OLD.name, OLD.country, OLD.image, OLD.sort_order, OLD.created_at)
    OR OLD.state_version = 9223372036854775807 OR NEW.state_version <> OLD.state_version + 1 THEN
    RAISE EXCEPTION 'cms immutable identity or invalid state step' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER cms_entry_identity BEFORE UPDATE ON jetnity_cms_private.inspiration_entries_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_cms_private.entry_update_v1();
CREATE TRIGGER cms_entry_delete BEFORE DELETE ON jetnity_cms_private.inspiration_entries_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_entry_truncate BEFORE TRUNCATE ON jetnity_cms_private.inspiration_entries_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_revision_immutable BEFORE UPDATE OR DELETE ON jetnity_cms_private.inspiration_revisions_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_revision_truncate BEFORE TRUNCATE ON jetnity_cms_private.inspiration_revisions_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_operation_immutable BEFORE UPDATE OR DELETE ON jetnity_cms_private.inspiration_operations_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_cms_private.immutable_v1();
CREATE TRIGGER cms_operation_truncate BEFORE TRUNCATE ON jetnity_cms_private.inspiration_operations_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_cms_private.immutable_v1();

ALTER TABLE jetnity_cms_private.inspiration_entries_v1 OWNER TO postgres;
ALTER TABLE jetnity_cms_private.inspiration_revisions_v1 OWNER TO postgres;
ALTER TABLE jetnity_cms_private.inspiration_operations_v1 OWNER TO postgres;
ALTER TABLE jetnity_cms_private.inspiration_entries_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_entries_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_revisions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_revisions_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_cms_private.inspiration_operations_v1 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_cms_private FROM PUBLIC, anon, authenticated, service_role;
ALTER FUNCTION jetnity_cms_private.reference_v1(text) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.text_valid_v1(text,integer,integer) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.editable_valid_v1(jsonb) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.snapshot_valid_v1(text,jsonb) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.timestamp_v1(timestamptz) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.decimal_valid_v1(jsonb,boolean,boolean) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.revision_payload_valid_v1(jsonb) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.request_valid_v1(jsonb,uuid,uuid,text,bigint) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.receipt_valid_v1(jsonb,jsonb,bigint,timestamptz) OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.immutable_v1() OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.entry_update_v1() OWNER TO postgres;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_cms_private FROM PUBLIC, anon, authenticated, service_role;

-- Identity inventory only. These rows have no draft or published content.
INSERT INTO jetnity_cms_private.inspiration_entries_v1(entry_id, locale, name, country, image, sort_order)
SELECT id, 'de', r->>'name', r->>'country', r->>'image', ordinal::integer
FROM unnest(ARRAY['geonames:1650535','geonames:2267057','geonames:2657915','geonames:2759794'])
  WITH ORDINALITY AS ids(id, ordinal)
CROSS JOIN LATERAL (SELECT jetnity_cms_private.reference_v1(id) AS r) reference;

-- LOCAL / UNAPPLIED. Same explicit installation transaction as schema-candidate.sql.
-- Existing auth.uid/auth.jwt/role/AAL2 functions are prerequisites, never redefined.

CREATE FUNCTION jetnity_cms_private.actor_v1() RETURNS uuid
LANGUAGE plpgsql STABLE SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid;
BEGIN
  actor := auth.uid();
  IF actor IS NULL OR NOT coalesce(public.darf_inhalte_moderieren(), false)
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = actor
      AND u.deleted_at IS NULL AND u.is_anonymous IS FALSE)
    OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = actor AND p.status = 'active') THEN
    RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN actor;
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501';
END $$;

CREATE FUNCTION jetnity_cms_private.lock_actor_v1() RETURNS uuid
LANGUAGE plpgsql VOLATILE SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid;
BEGIN
  actor := auth.uid();
  IF actor IS NULL THEN RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501'; END IF;
  -- Always entry -> account -> profile. SHARE also conflicts with non-key
  -- status/role updates; KEY SHARE would not protect these prerequisites.
  PERFORM 1 FROM auth.users u WHERE u.id = actor FOR SHARE;
  PERFORM 1 FROM public.profiles p WHERE p.user_id = actor FOR SHARE;
  -- A fresh statement after any lock wait checks the actual stored status/role.
  RETURN jetnity_cms_private.actor_v1();
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501';
END $$;

CREATE FUNCTION jetnity_cms_private.selected_revision_v1(p_payload jsonb) RETURNS bigint
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF NOT jetnity_cms_private.revision_payload_valid_v1(p_payload) THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  RETURN (p_payload->>'revision')::bigint;
END $$;

CREATE FUNCTION public.admin_cms_inspiration_command_v1(
  p_request_id uuid, p_entry_id text, p_expected_version bigint, p_action text, p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  actor uuid; fresh_actor uuid; binding jsonb; receipt jsonb;
  entry jetnity_cms_private.inspiration_entries_v1%ROWTYPE;
  previous jetnity_cms_private.inspiration_operations_v1%ROWTYPE;
  selected bigint; created_revision bigint; new_content jsonb; instant timestamptz;
  next_draft bigint; next_published bigint; next_published_at timestamptz; next_archived boolean;
  violated_constraint text;
BEGIN
  -- Reject an unauthorized caller before traversing untrusted JSON content.
  actor := jetnity_cms_private.actor_v1();
  IF p_request_id IS NULL OR p_request_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    OR jetnity_cms_private.reference_v1(p_entry_id) IS NULL
    OR p_expected_version IS NULL OR p_expected_version < 0
    OR p_action IS NULL OR p_action NOT IN ('save_draft','publish','archive','restore_draft') THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023';
  END IF;
  IF p_action = 'save_draft' THEN
    IF NOT jetnity_cms_private.editable_valid_v1(p_payload) THEN
      RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  ELSIF p_action IN ('publish','restore_draft') THEN
    selected := jetnity_cms_private.selected_revision_v1(p_payload);
  ELSIF p_payload IS DISTINCT FROM '{}'::jsonb THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO entry FROM jetnity_cms_private.inspiration_entries_v1
    WHERE entry_id = p_entry_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cms entry unavailable' USING ERRCODE = 'P4041'; END IF;
  fresh_actor := jetnity_cms_private.lock_actor_v1();
  IF fresh_actor IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501'; END IF;
  binding := jsonb_build_object('schema', 1, 'requestId', p_request_id::text,
    'actorId', actor::text, 'entryId', p_entry_id, 'expectedVersion', p_expected_version::text,
    'action', p_action, 'payload', p_payload);

  SELECT * INTO previous FROM jetnity_cms_private.inspiration_operations_v1 WHERE request_id = p_request_id;
  IF FOUND THEN
    IF previous.actor_id IS DISTINCT FROM actor OR previous.request IS DISTINCT FROM binding THEN
      RAISE EXCEPTION 'cms request identity conflict' USING ERRCODE = 'P4092'; END IF;
    RETURN previous.result;
  END IF;
  IF entry.state_version <> p_expected_version THEN
    RAISE EXCEPTION 'cms stale state' USING ERRCODE = 'P4091'; END IF;
  IF entry.state_version = 9223372036854775807 THEN
    RAISE EXCEPTION 'cms state exhausted' USING ERRCODE = 'P4093'; END IF;

  instant := greatest(clock_timestamp(), entry.updated_at);
  next_draft := entry.draft_revision;
  next_published := entry.published_revision;
  next_published_at := entry.published_at;
  next_archived := entry.archived;

  IF p_action = 'save_draft' THEN
    IF entry.archived THEN RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    created_revision := coalesce(entry.draft_revision, 0) + 1;
    new_content := jetnity_cms_private.reference_v1(p_entry_id) || p_payload;
    next_draft := created_revision;
  ELSIF p_action = 'restore_draft' THEN
    SELECT content INTO new_content FROM jetnity_cms_private.inspiration_revisions_v1
      WHERE entry_id = p_entry_id AND revision = selected;
    IF NOT FOUND THEN RAISE EXCEPTION 'cms revision unavailable' USING ERRCODE = 'P4041'; END IF;
    created_revision := entry.draft_revision + 1;
    next_draft := created_revision;
    next_archived := false;
  ELSIF p_action = 'publish' THEN
    IF entry.archived OR entry.draft_revision IS DISTINCT FROM selected
      OR entry.published_revision IS NOT DISTINCT FROM selected THEN
      RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    next_published := selected;
    next_published_at := instant;
  ELSE
    IF entry.archived OR entry.draft_revision IS NULL THEN
      RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    next_archived := true;
    next_published := NULL;
    next_published_at := NULL;
  END IF;

  IF created_revision IS NOT NULL THEN
    INSERT INTO jetnity_cms_private.inspiration_revisions_v1
      (entry_id, revision, content, created_by, created_at, restored_from_revision)
    VALUES (p_entry_id, created_revision, new_content, actor, instant,
      CASE WHEN p_action = 'restore_draft' THEN selected ELSE NULL END);
  END IF;
  receipt := jsonb_build_object('schema', 1, 'status', 'recorded',
    'requestId', p_request_id::text, 'entryId', p_entry_id, 'action', p_action,
    'beforeVersion', entry.state_version::text, 'version', (entry.state_version + 1)::text,
    'draftRevision', next_draft::text, 'publishedRevision', next_published::text,
    'archived', next_archived, 'createdRevision', created_revision::text,
    'recordedAt', jetnity_cms_private.timestamp_v1(instant));
  INSERT INTO jetnity_cms_private.inspiration_operations_v1
    (request_id, actor_id, entry_id, request, result, before_version, after_version, created_at)
  VALUES (p_request_id, actor, p_entry_id, binding, receipt, entry.state_version, entry.state_version + 1, instant);
  -- Both remain uncommitted. This order also works if a caller has selected
  -- immediate checking for the otherwise deferred cross-table constraints.
  UPDATE jetnity_cms_private.inspiration_entries_v1 SET
    state_version = entry.state_version + 1, draft_revision = next_draft,
    published_revision = next_published, published_at = next_published_at,
    archived = next_archived, last_request_id = p_request_id, updated_at = instant
  WHERE entry_id = p_entry_id;
  RETURN receipt;
EXCEPTION WHEN unique_violation THEN
  GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
  IF violated_constraint = 'inspiration_operations_v1_pkey' THEN
    -- The function's entire subtransaction was rolled back, including a
    -- different entry's tentative revision/state, before this error is raised.
    RAISE EXCEPTION 'cms request identity conflict' USING ERRCODE = 'P4092';
  END IF;
  RAISE;
END $$;

CREATE FUNCTION public.admin_cms_inspiration_read_v1(
  p_entry_id text, p_revision bigint DEFAULT NULL,
  p_before_revision bigint DEFAULT NULL, p_limit integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  entry jetnity_cms_private.inspiration_entries_v1%ROWTYPE;
  preview jsonb; history jsonb; last_revision bigint; next_before text;
BEGIN
  PERFORM jetnity_cms_private.actor_v1();
  IF jetnity_cms_private.reference_v1(p_entry_id) IS NULL
    OR p_revision <= 0 OR p_before_revision <= 0
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  SELECT * INTO entry FROM jetnity_cms_private.inspiration_entries_v1 WHERE entry_id = p_entry_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'cms entry unavailable' USING ERRCODE = 'P4041'; END IF;
  SELECT jsonb_build_object('entryId', r.entry_id, 'revision', r.revision::text,
    'content', r.content, 'createdBy', r.created_by::text,
    'createdAt', jetnity_cms_private.timestamp_v1(r.created_at),
    'restoredFromRevision', r.restored_from_revision::text)
  INTO preview FROM jetnity_cms_private.inspiration_revisions_v1 r
  WHERE r.entry_id = p_entry_id AND r.revision = coalesce(p_revision, entry.draft_revision);
  IF p_revision IS NOT NULL AND NOT FOUND THEN
    RAISE EXCEPTION 'cms revision unavailable' USING ERRCODE = 'P4041'; END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('entryId', r.entry_id, 'revision', r.revision::text,
    'content', r.content, 'createdBy', r.created_by::text,
    'createdAt', jetnity_cms_private.timestamp_v1(r.created_at),
    'restoredFromRevision', r.restored_from_revision::text) ORDER BY r.revision DESC), '[]'::jsonb), min(r.revision)
  INTO history, last_revision
  FROM (SELECT * FROM jetnity_cms_private.inspiration_revisions_v1
    WHERE entry_id = p_entry_id AND (p_before_revision IS NULL OR revision < p_before_revision)
    ORDER BY revision DESC LIMIT p_limit) r;
  IF last_revision IS NOT NULL AND EXISTS (SELECT 1 FROM jetnity_cms_private.inspiration_revisions_v1
    WHERE entry_id = p_entry_id AND revision < last_revision) THEN next_before := last_revision::text; END IF;
  RETURN jsonb_build_object('schema', 1, 'entry', jsonb_build_object(
    'entryId', entry.entry_id, 'locale', entry.locale, 'name', entry.name,
    'country', entry.country, 'image', entry.image, 'version', entry.state_version::text,
    'draftRevision', entry.draft_revision::text, 'publishedRevision', entry.published_revision::text,
    'publishedAt', jetnity_cms_private.timestamp_v1(entry.published_at),
    'archived', entry.archived, 'updatedAt', jetnity_cms_private.timestamp_v1(entry.updated_at)),
    'preview', preview, 'history', history, 'nextBeforeRevision', next_before);
END $$;

CREATE FUNCTION public.admin_cms_inspiration_confirm_v1(p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE actor uuid; receipt jsonb;
BEGIN
  actor := jetnity_cms_private.actor_v1();
  IF p_request_id IS NULL OR p_request_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  SELECT result INTO receipt FROM jetnity_cms_private.inspiration_operations_v1
    WHERE request_id = p_request_id AND actor_id = actor;
  RETURN coalesce(receipt, jsonb_build_object('schema', 1, 'status', 'unknown', 'requestId', p_request_id::text));
END $$;

CREATE FUNCTION public.cms_inspiration_published_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
  SELECT jsonb_build_object('schema', 1, 'items', coalesce(jsonb_agg(jsonb_build_object(
    'entryId', e.entry_id, 'revision', r.revision::text, 'content', r.content,
    'publishedAt', jetnity_cms_private.timestamp_v1(e.published_at)) ORDER BY e.sort_order), '[]'::jsonb))
  FROM jetnity_cms_private.inspiration_entries_v1 e
  JOIN jetnity_cms_private.inspiration_revisions_v1 r ON r.entry_id = e.entry_id AND r.revision = e.published_revision
  WHERE NOT e.archived AND e.published_revision IS NOT NULL
$$;

ALTER FUNCTION jetnity_cms_private.actor_v1() OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.lock_actor_v1() OWNER TO postgres;
ALTER FUNCTION jetnity_cms_private.selected_revision_v1(jsonb) OWNER TO postgres;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_cms_private FROM PUBLIC, anon, authenticated, service_role;
ALTER FUNCTION public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb) OWNER TO postgres;
ALTER FUNCTION public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer) OWNER TO postgres;
ALTER FUNCTION public.admin_cms_inspiration_confirm_v1(uuid) OWNER TO postgres;
ALTER FUNCTION public.cms_inspiration_published_v1() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_cms_inspiration_confirm_v1(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.cms_inspiration_published_v1() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cms_inspiration_confirm_v1(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cms_inspiration_published_v1() TO anon, authenticated;


-- UNAPPLIED CANDIDATE. Install with functions-candidate.sql in one transaction.
-- No extension, new role, existing helper change or hosted apply is authorised.
DO $$ BEGIN
  IF current_user <> 'postgres' THEN RAISE EXCEPTION 'marketing installation owner mismatch' USING ERRCODE = '42501'; END IF;
END $$;
CREATE SCHEMA jetnity_marketing_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_marketing_private FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION jetnity_marketing_private.keys_v1(value jsonb, expected text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT CASE WHEN jsonb_typeof(value) = 'object'
    THEN value ?& expected AND value - expected = '{}'::jsonb ELSE false END
$$;

CREATE FUNCTION jetnity_marketing_private.uuid_v1(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT coalesce(jsonb_typeof(value) = 'string'
    AND value #>> '{}' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', false)
$$;

CREATE FUNCTION jetnity_marketing_private.version_v1(value jsonb, allow_zero boolean DEFAULT false) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT CASE WHEN jsonb_typeof(value) = 'string' AND value #>> '{}' ~ '^(0|[1-9][0-9]{0,18})$'
    THEN (allow_zero OR value #>> '{}' <> '0') AND (value #>> '{}')::numeric <= 9223372036854775807
    ELSE false END
$$;

CREATE FUNCTION jetnity_marketing_private.timestamp_v1(value timestamptz) RETURNS text
LANGUAGE sql STABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT to_char(value AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
$$;

CREATE FUNCTION jetnity_marketing_private.payload_valid_v1(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT coalesce(jetnity_marketing_private.keys_v1(value, ARRAY['label','destination','channel','contentId'])
    AND jsonb_typeof(value->'label') = 'string'
    AND length(value->>'label') BETWEEN 1 AND 80
    AND value->>'label' = btrim(value->>'label', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
    AND value->>'label' !~ U&'[\0001-\001F\007F-\009F]'
    AND jsonb_typeof(value->'destination') = 'string'
    AND value->>'destination' IN ('home','planning','inspiration')
    AND jsonb_typeof(value->'channel') = 'string'
    AND value->>'channel' IN ('newsletter','instagram','partner','qr')
    AND (value->'contentId' = 'null'::jsonb OR (jsonb_typeof(value->'contentId') = 'string'
      AND value->>'contentId' ~ '^cnt-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')), false)
$$;

CREATE FUNCTION jetnity_marketing_private.command_valid_v1(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF jetnity_marketing_private.keys_v1(value, ARRAY['schemaVersion','requestId','draftId','expectedVersion','action','payload']) IS NOT TRUE
    OR value->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR jetnity_marketing_private.uuid_v1(value->'requestId') IS NOT TRUE
    OR jetnity_marketing_private.uuid_v1(value->'draftId') IS NOT TRUE
    OR jetnity_marketing_private.version_v1(value->'expectedVersion', true) IS NOT TRUE
    OR jsonb_typeof(value->'action') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  IF value->>'action' = 'create' THEN
    RETURN value->>'expectedVersion' = '0' AND jetnity_marketing_private.payload_valid_v1(value->'payload');
  END IF;
  IF value->>'expectedVersion' = '0' THEN RETURN false; END IF;
  IF value->>'action' = 'save' THEN RETURN jetnity_marketing_private.payload_valid_v1(value->'payload'); END IF;
  IF value->>'action' = 'archive' THEN RETURN value->'payload' = '{}'::jsonb; END IF;
  IF value->>'action' = 'restore'
    AND jetnity_marketing_private.keys_v1(value->'payload', ARRAY['revision'])
    AND jetnity_marketing_private.version_v1(value->'payload'->'revision') THEN
    RETURN (value->'payload'->>'revision')::bigint <= (value->>'expectedVersion')::bigint;
  END IF;
  RETURN false;
END $$;

CREATE TABLE jetnity_marketing_private.drafts_v1 (
  draft_id uuid PRIMARY KEY CHECK (jetnity_marketing_private.uuid_v1(to_jsonb(draft_id::text))),
  version bigint NOT NULL CHECK (version > 0)
);

CREATE TABLE jetnity_marketing_private.revisions_v1 (
  draft_id uuid NOT NULL,
  version bigint NOT NULL CHECK (version > 0),
  previous_version bigint GENERATED ALWAYS AS (CASE WHEN version > 1 THEN version - 1 ELSE NULL END) STORED,
  request_id uuid NOT NULL UNIQUE CHECK (jetnity_marketing_private.uuid_v1(to_jsonb(request_id::text))),
  actor_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create','save','archive','restore')),
  state text NOT NULL CHECK (state IN ('draft','archived')),
  payload jsonb NOT NULL CHECK (jetnity_marketing_private.payload_valid_v1(payload) IS TRUE),
  saved_at timestamptz NOT NULL CHECK (isfinite(saved_at)),
  restored_from bigint,
  PRIMARY KEY (draft_id, version),
  UNIQUE (draft_id, version, request_id, actor_id, saved_at),
  CHECK ((action = 'create') = (version = 1)),
  CHECK ((action = 'archive') = (state = 'archived')),
  CHECK ((action = 'restore' AND restored_from IS NOT NULL AND restored_from > 0 AND restored_from < version)
    OR (action <> 'restore' AND restored_from IS NULL)),
  FOREIGN KEY (draft_id) REFERENCES jetnity_marketing_private.drafts_v1 (draft_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (draft_id, previous_version) REFERENCES jetnity_marketing_private.revisions_v1 (draft_id, version) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (draft_id, restored_from) REFERENCES jetnity_marketing_private.revisions_v1 (draft_id, version) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE jetnity_marketing_private.operations_v1 (
  request_id uuid PRIMARY KEY,
  draft_id uuid NOT NULL,
  version bigint NOT NULL,
  actor_id uuid NOT NULL,
  request jsonb NOT NULL,
  saved_at timestamptz NOT NULL,
  UNIQUE (draft_id, version),
  CHECK (jetnity_marketing_private.command_valid_v1(request) IS TRUE),
  CHECK ((request->>'requestId' = request_id::text
    AND request->>'draftId' = draft_id::text
    AND (request->>'expectedVersion')::numeric + 1 = version) IS TRUE),
  FOREIGN KEY (draft_id, version, request_id, actor_id, saved_at)
    REFERENCES jetnity_marketing_private.revisions_v1 (draft_id, version, request_id, actor_id, saved_at)
    DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE jetnity_marketing_private.drafts_v1 ADD CONSTRAINT drafts_current_revision_v1
  FOREIGN KEY (draft_id, version) REFERENCES jetnity_marketing_private.revisions_v1 (draft_id, version) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE jetnity_marketing_private.revisions_v1 ADD CONSTRAINT revisions_receipt_v1
  FOREIGN KEY (request_id) REFERENCES jetnity_marketing_private.operations_v1 (request_id) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX revisions_list_v1 ON jetnity_marketing_private.revisions_v1 (saved_at DESC, draft_id DESC);

ALTER TABLE jetnity_marketing_private.drafts_v1 OWNER TO postgres;
ALTER TABLE jetnity_marketing_private.revisions_v1 OWNER TO postgres;
ALTER TABLE jetnity_marketing_private.operations_v1 OWNER TO postgres;
ALTER TABLE jetnity_marketing_private.drafts_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.drafts_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.revisions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.revisions_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_marketing_private.operations_v1 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_marketing_private FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_marketing_private FROM PUBLIC, anon, authenticated, service_role;

-- UNAPPLIED. Same installation transaction as schema-candidate.sql, as postgres.
-- Existing auth/role/AAL2 implementations are prerequisites, never replaced.
CREATE FUNCTION jetnity_marketing_private.actor_v1() RETURNS uuid
LANGUAGE plpgsql STABLE SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid;
BEGIN
  actor := auth.uid();
  IF actor IS NULL OR public.darf_inhalte_moderieren() IS NOT TRUE
    OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated'
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = actor AND u.deleted_at IS NULL AND u.is_anonymous IS FALSE)
    OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = actor AND p.status = 'active') THEN
    RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN actor;
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501';
END $$;

CREATE FUNCTION jetnity_marketing_private.lock_actor_v1() RETURNS uuid
LANGUAGE plpgsql VOLATILE SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid;
BEGIN
  actor := auth.uid();
  IF actor IS NULL THEN RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501'; END IF;
  -- Resource -> account -> profile. SHARE protects non-key role/status updates.
  PERFORM 1 FROM auth.users u WHERE u.id = actor FOR SHARE;
  PERFORM 1 FROM public.profiles p WHERE p.user_id = actor FOR SHARE;
  RETURN jetnity_marketing_private.actor_v1();
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501';
END $$;

CREATE FUNCTION jetnity_marketing_private.revision_json_v1(value jetnity_marketing_private.revisions_v1) RETURNS jsonb
LANGUAGE sql STABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
  SELECT jsonb_build_object('draftId', (value).draft_id::text, 'version', (value).version::text,
    'requestId', (value).request_id::text, 'actorId', (value).actor_id::text,
    'action', (value).action, 'state', (value).state, 'payload', (value).payload,
    'savedAt', jetnity_marketing_private.timestamp_v1((value).saved_at), 'restoredFrom', (value).restored_from::text)
$$;

CREATE FUNCTION jetnity_marketing_private.chain_valid_v1(id uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = pg_catalog, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM jetnity_marketing_private.drafts_v1 d WHERE d.draft_id = id
      AND d.version = (SELECT count(*) FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id)
      AND d.version = (SELECT max(r.version) FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id)
      AND d.version = (SELECT count(*) FROM jetnity_marketing_private.operations_v1 o WHERE o.draft_id = id))
    AND NOT EXISTS (
      SELECT 1 FROM jetnity_marketing_private.revisions_v1 r
      LEFT JOIN jetnity_marketing_private.operations_v1 o ON o.request_id = r.request_id
      LEFT JOIN jetnity_marketing_private.revisions_v1 prior ON prior.draft_id = r.draft_id AND prior.version = r.previous_version
      LEFT JOIN jetnity_marketing_private.revisions_v1 restored ON restored.draft_id = r.draft_id AND restored.version = r.restored_from
      WHERE r.draft_id = id AND (
        o.draft_id IS DISTINCT FROM r.draft_id OR o.version IS DISTINCT FROM r.version
        OR o.actor_id IS DISTINCT FROM r.actor_id OR o.saved_at IS DISTINCT FROM r.saved_at
        OR o.request->>'action' IS DISTINCT FROM r.action
        OR (r.version > 1 AND (prior.version IS NULL OR r.saved_at <= prior.saved_at))
        OR CASE r.action
          WHEN 'create' THEN r.payload IS DISTINCT FROM o.request->'payload'
          WHEN 'save' THEN prior.state IS DISTINCT FROM 'draft' OR r.payload IS DISTINCT FROM o.request->'payload'
          WHEN 'archive' THEN prior.state IS DISTINCT FROM 'draft' OR r.payload IS DISTINCT FROM prior.payload
          WHEN 'restore' THEN restored.version IS NULL OR r.payload IS DISTINCT FROM restored.payload
            OR to_jsonb(r.restored_from::text) IS DISTINCT FROM o.request->'payload'->'revision'
          ELSE true END))
$$;

CREATE FUNCTION jetnity_marketing_private.enforce_chain_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  -- PostgreSQL17 fires deferred custom triggers under the COMMIT caller, after
  -- the guarded writer's definer frame has returned. This private trigger-only
  -- validator needs owner reads; no private client grant is added to make it run.
  IF TG_TABLE_SCHEMA <> 'jetnity_marketing_private' OR TG_LEVEL <> 'ROW' OR TG_WHEN <> 'AFTER'
    OR TG_TABLE_NAME NOT IN ('drafts_v1','revisions_v1','operations_v1')
    OR TG_OP NOT IN ('INSERT','UPDATE') OR (TG_OP = 'UPDATE' AND TG_TABLE_NAME <> 'drafts_v1') THEN
    RAISE EXCEPTION 'marketing invalid constraint context' USING ERRCODE = '42501'; END IF;
  IF jetnity_marketing_private.chain_valid_v1(NEW.draft_id) IS NOT TRUE THEN
    RAISE EXCEPTION 'marketing incomplete history' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;

CREATE FUNCTION jetnity_marketing_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN RAISE EXCEPTION 'marketing immutable history' USING ERRCODE = '23514'; END $$;

CREATE FUNCTION jetnity_marketing_private.advance_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF NEW.draft_id IS DISTINCT FROM OLD.draft_id OR NEW.version::numeric <> OLD.version::numeric + 1 THEN
    RAISE EXCEPTION 'marketing invalid advance' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER revisions_immutable_v1 BEFORE UPDATE OR DELETE ON jetnity_marketing_private.revisions_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER revisions_no_truncate_v1 BEFORE TRUNCATE ON jetnity_marketing_private.revisions_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER operations_immutable_v1 BEFORE UPDATE OR DELETE ON jetnity_marketing_private.operations_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER operations_no_truncate_v1 BEFORE TRUNCATE ON jetnity_marketing_private.operations_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER drafts_no_delete_v1 BEFORE DELETE ON jetnity_marketing_private.drafts_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER drafts_no_truncate_v1 BEFORE TRUNCATE ON jetnity_marketing_private.drafts_v1
  FOR EACH STATEMENT EXECUTE FUNCTION jetnity_marketing_private.immutable_v1();
CREATE TRIGGER drafts_advance_v1 BEFORE UPDATE ON jetnity_marketing_private.drafts_v1
  FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.advance_v1();
CREATE CONSTRAINT TRIGGER drafts_complete_v1 AFTER INSERT OR UPDATE ON jetnity_marketing_private.drafts_v1
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.enforce_chain_v1();
CREATE CONSTRAINT TRIGGER revisions_complete_v1 AFTER INSERT ON jetnity_marketing_private.revisions_v1
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.enforce_chain_v1();
CREATE CONSTRAINT TRIGGER operations_complete_v1 AFTER INSERT ON jetnity_marketing_private.operations_v1
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION jetnity_marketing_private.enforce_chain_v1();

CREATE FUNCTION public.admin_marketing_drafts_apply_v1(input jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  actor uuid; v_request_id uuid; id uuid; expected bigint; current_version bigint; selected bigint;
  operation jetnity_marketing_private.operations_v1%ROWTYPE;
  previous jetnity_marketing_private.revisions_v1%ROWTYPE;
  created jetnity_marketing_private.revisions_v1%ROWTYPE;
  new_payload jsonb; instant timestamptz;
BEGIN
  actor := jetnity_marketing_private.actor_v1();
  IF jetnity_marketing_private.command_valid_v1(input) IS NOT TRUE THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  v_request_id := (input->>'requestId')::uuid; id := (input->>'draftId')::uuid;
  expected := (input->>'expectedVersion')::bigint;
  -- Advisory hashes only serialize; the full immutable JSON/actor binding is
  -- compared below. A collision cannot supply identity or a successful replay.
  PERFORM pg_advisory_xact_lock(hashtextextended('jetnity.marketing.request:' || v_request_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('jetnity.marketing.draft:' || id::text, 0));
  SELECT d.version INTO current_version FROM jetnity_marketing_private.drafts_v1 d WHERE d.draft_id = id FOR UPDATE;
  IF jetnity_marketing_private.lock_actor_v1() IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501'; END IF;
  SELECT o.* INTO operation FROM jetnity_marketing_private.operations_v1 o WHERE o.request_id = v_request_id;
  IF FOUND THEN
    IF operation.actor_id IS DISTINCT FROM actor OR operation.request IS DISTINCT FROM input THEN
      RAISE EXCEPTION 'marketing request identity conflict' USING ERRCODE = 'P4092'; END IF;
    SELECT r.* INTO STRICT created FROM jetnity_marketing_private.revisions_v1 r
      WHERE r.draft_id = operation.draft_id AND r.version = operation.version;
    RETURN jsonb_build_object('schemaVersion', 1, 'action', 'apply',
      'receipt', jetnity_marketing_private.revision_json_v1(created), 'replayed', true);
  END IF;
  IF input->>'action' = 'create' THEN
    IF current_version IS NOT NULL THEN RAISE EXCEPTION 'marketing stale version' USING ERRCODE = 'P4091'; END IF;
    new_payload := input->'payload';
  ELSE
    IF current_version IS NULL THEN RAISE EXCEPTION 'marketing draft unavailable' USING ERRCODE = 'P4041'; END IF;
    IF current_version <> expected THEN RAISE EXCEPTION 'marketing stale version' USING ERRCODE = 'P4091'; END IF;
    IF current_version = 9223372036854775807 THEN RAISE EXCEPTION 'marketing version exhausted' USING ERRCODE = 'P4093'; END IF;
    SELECT r.* INTO STRICT previous FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id AND r.version = current_version;
    IF input->>'action' IN ('save','archive') AND previous.state <> 'draft' THEN
      RAISE EXCEPTION 'marketing state conflict' USING ERRCODE = 'P4093'; END IF;
    IF input->>'action' = 'restore' THEN
      selected := (input->'payload'->>'revision')::bigint;
      SELECT r.payload INTO new_payload FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id AND r.version = selected;
      IF NOT FOUND THEN RAISE EXCEPTION 'marketing revision unavailable' USING ERRCODE = 'P4041'; END IF;
    ELSIF input->>'action' = 'archive' THEN new_payload := previous.payload;
    ELSE new_payload := input->'payload'; END IF;
  END IF;
  instant := greatest(clock_timestamp(), previous.saved_at + interval '1 microsecond');
  IF input->>'action' = 'create' THEN
    INSERT INTO jetnity_marketing_private.drafts_v1(draft_id,version) VALUES(id,1);
  END IF;
  INSERT INTO jetnity_marketing_private.operations_v1(request_id,draft_id,version,actor_id,request,saved_at)
    VALUES(v_request_id,id,expected+1,actor,input,instant);
  INSERT INTO jetnity_marketing_private.revisions_v1(draft_id,version,request_id,actor_id,action,state,payload,saved_at,restored_from)
    VALUES(id,expected+1,v_request_id,actor,input->>'action',
      CASE WHEN input->>'action' = 'archive' THEN 'archived' ELSE 'draft' END,new_payload,instant,selected)
    RETURNING * INTO created;
  IF input->>'action' <> 'create' THEN
    UPDATE jetnity_marketing_private.drafts_v1 d SET version = expected+1 WHERE d.draft_id = id;
  END IF;
  -- Durable success requires the surrounding transaction's COMMIT to succeed.
  RETURN jsonb_build_object('schemaVersion',1,'action','apply',
    'receipt',jetnity_marketing_private.revision_json_v1(created),'replayed',false);
END $$;

CREATE FUNCTION public.admin_marketing_drafts_read_v1(input jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  action text; id uuid; page_limit integer := 20; filter_state text; before_version bigint;
  before_time timestamptz; before_id uuid; items jsonb := '[]'::jsonb; item jetnity_marketing_private.revisions_v1%ROWTYPE;
  last_item jetnity_marketing_private.revisions_v1%ROWTYPE; count integer := 0; more boolean := false; draft jsonb;
BEGIN
  PERFORM jetnity_marketing_private.lock_actor_v1();
  IF jsonb_typeof(input) IS DISTINCT FROM 'object' OR input->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(input->'action') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  action := input->>'action';
  IF action = 'get' THEN
    IF NOT jetnity_marketing_private.keys_v1(input,ARRAY['schemaVersion','action','draftId'])
      OR NOT jetnity_marketing_private.uuid_v1(input->'draftId') THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    SELECT jetnity_marketing_private.revision_json_v1(r) INTO draft
      FROM jetnity_marketing_private.drafts_v1 d JOIN jetnity_marketing_private.revisions_v1 r USING(draft_id,version)
      WHERE d.draft_id = (input->>'draftId')::uuid;
    RETURN jsonb_build_object('schemaVersion',1,'action','get','draft',draft);
  END IF;
  IF action NOT IN ('list','history') OR input - ARRAY['schemaVersion','action','draftId','limit','state','cursor'] <> '{}'::jsonb
    OR (action = 'list' AND input ? 'draftId') OR (action = 'history' AND input ? 'state') THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  IF input ? 'limit' THEN
    IF jsonb_typeof(input->'limit') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    IF (input->>'limit')::numeric NOT BETWEEN 1 AND 50
      OR trunc((input->>'limit')::numeric) <> (input->>'limit')::numeric THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    page_limit := (input->>'limit')::numeric::integer;
  END IF;
  IF action = 'history' THEN
    IF NOT jetnity_marketing_private.uuid_v1(input->'draftId')
      OR (input ? 'cursor' AND NOT jetnity_marketing_private.version_v1(input->'cursor')) THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    id := (input->>'draftId')::uuid; before_version := (input->>'cursor')::bigint;
    FOR item IN SELECT r.* FROM jetnity_marketing_private.revisions_v1 r
      WHERE r.draft_id = id AND (before_version IS NULL OR r.version < before_version)
      ORDER BY r.version DESC LIMIT page_limit + 1 LOOP
      IF count = page_limit THEN more := true; EXIT; END IF;
      items := items || jsonb_build_array(jetnity_marketing_private.revision_json_v1(item)); last_item := item; count := count + 1;
    END LOOP;
    RETURN jsonb_build_object('schemaVersion',1,'action','history','draftId',id::text,'items',items,
      'nextCursor',CASE WHEN more THEN last_item.version::text ELSE NULL END);
  END IF;
  IF input ? 'state' THEN
    IF jsonb_typeof(input->'state') IS DISTINCT FROM 'string' OR input->>'state' NOT IN ('draft','archived') THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    filter_state := input->>'state';
  END IF;
  IF input ? 'cursor' THEN
    IF jetnity_marketing_private.keys_v1(input->'cursor',ARRAY['savedAt','draftId']) IS NOT TRUE
      OR jetnity_marketing_private.uuid_v1(input->'cursor'->'draftId') IS NOT TRUE
      OR jsonb_typeof(input->'cursor'->'savedAt') IS DISTINCT FROM 'string'
      OR input->'cursor'->>'savedAt' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    BEGIN before_time := (input->'cursor'->>'savedAt')::timestamptz;
    EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END;
    IF jetnity_marketing_private.timestamp_v1(before_time) IS DISTINCT FROM input->'cursor'->>'savedAt' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    before_id := (input->'cursor'->>'draftId')::uuid;
  END IF;
  FOR item IN SELECT r.* FROM jetnity_marketing_private.drafts_v1 d
    JOIN jetnity_marketing_private.revisions_v1 r USING(draft_id,version)
    WHERE (filter_state IS NULL OR r.state = filter_state)
      AND (before_time IS NULL OR (r.saved_at,r.draft_id) < (before_time,before_id))
    ORDER BY r.saved_at DESC,r.draft_id DESC LIMIT page_limit + 1 LOOP
    IF count = page_limit THEN more := true; EXIT; END IF;
    items := items || jsonb_build_array(jetnity_marketing_private.revision_json_v1(item)); last_item := item; count := count + 1;
  END LOOP;
  RETURN jsonb_build_object('schemaVersion',1,'action','list','items',items,
    'nextCursor',CASE WHEN more THEN jsonb_build_object('savedAt',jetnity_marketing_private.timestamp_v1(last_item.saved_at),
      'draftId',last_item.draft_id::text) ELSE NULL END);
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_marketing_private FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_marketing_drafts_apply_v1(jsonb),public.admin_marketing_drafts_read_v1(jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_marketing_drafts_apply_v1(jsonb),public.admin_marketing_drafts_read_v1(jsonb) TO authenticated;


CREATE OR REPLACE FUNCTION jetnity_cms_private.actor_v1() RETURNS uuid
LANGUAGE plpgsql VOLATILE SET search_path = pg_catalog, pg_temp AS $admin_runtime_body$
DECLARE actor uuid;
BEGIN
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  actor := auth.uid();
  IF actor IS NULL OR NOT coalesce(public.darf_inhalte_moderieren(), false)
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = actor
      AND u.deleted_at IS NULL AND u.is_anonymous IS FALSE)
    OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = actor AND p.status = 'active') THEN
    RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501';
  END IF;
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  RETURN actor;
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501';
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION jetnity_marketing_private.actor_v1() RETURNS uuid
LANGUAGE plpgsql VOLATILE SET search_path = pg_catalog, pg_temp AS $admin_runtime_body$
DECLARE actor uuid;
BEGIN
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  actor := auth.uid();
  IF actor IS NULL OR public.darf_inhalte_moderieren() IS NOT TRUE
    OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated'
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = actor AND u.deleted_at IS NULL AND u.is_anonymous IS FALSE)
    OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = actor AND p.status = 'active') THEN
    RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501';
  END IF;
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  RETURN actor;
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501';
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION public.admin_cms_inspiration_command_v1(
  p_request_id uuid, p_entry_id text, p_expected_version bigint, p_action text, p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $admin_runtime_body$
DECLARE
  admin_runtime_result jsonb;
  actor uuid; fresh_actor uuid; binding jsonb; receipt jsonb;
  entry jetnity_cms_private.inspiration_entries_v1%ROWTYPE;
  previous jetnity_cms_private.inspiration_operations_v1%ROWTYPE;
  selected bigint; created_revision bigint; new_content jsonb; instant timestamptz;
  next_draft bigint; next_published bigint; next_published_at timestamptz; next_archived boolean;
  violated_constraint text;
BEGIN
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  -- Reject an unauthorized caller before traversing untrusted JSON content.
  actor := jetnity_cms_private.actor_v1();
  IF p_request_id IS NULL OR p_request_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    OR jetnity_cms_private.reference_v1(p_entry_id) IS NULL
    OR p_expected_version IS NULL OR p_expected_version < 0
    OR p_action IS NULL OR p_action NOT IN ('save_draft','publish','archive','restore_draft') THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023';
  END IF;
  IF p_action = 'save_draft' THEN
    IF NOT jetnity_cms_private.editable_valid_v1(p_payload) THEN
      RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  ELSIF p_action IN ('publish','restore_draft') THEN
    selected := jetnity_cms_private.selected_revision_v1(p_payload);
  ELSIF p_payload IS DISTINCT FROM '{}'::jsonb THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO entry FROM jetnity_cms_private.inspiration_entries_v1
    WHERE entry_id = p_entry_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cms entry unavailable' USING ERRCODE = 'P4041'; END IF;
  fresh_actor := jetnity_cms_private.lock_actor_v1();
  IF fresh_actor IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'cms not authorized' USING ERRCODE = '42501'; END IF;
  binding := jsonb_build_object('schema', 1, 'requestId', p_request_id::text,
    'actorId', actor::text, 'entryId', p_entry_id, 'expectedVersion', p_expected_version::text,
    'action', p_action, 'payload', p_payload);

  SELECT * INTO previous FROM jetnity_cms_private.inspiration_operations_v1 WHERE request_id = p_request_id;
  IF FOUND THEN
    IF previous.actor_id IS DISTINCT FROM actor OR previous.request IS DISTINCT FROM binding THEN
      RAISE EXCEPTION 'cms request identity conflict' USING ERRCODE = 'P4092'; END IF;
    admin_runtime_result := previous.result;
    PERFORM official_v3_guard_private.admin_runtime_guard_v1();
    RETURN admin_runtime_result;
  END IF;
  IF entry.state_version <> p_expected_version THEN
    RAISE EXCEPTION 'cms stale state' USING ERRCODE = 'P4091'; END IF;
  IF entry.state_version = 9223372036854775807 THEN
    RAISE EXCEPTION 'cms state exhausted' USING ERRCODE = 'P4093'; END IF;

  instant := greatest(clock_timestamp(), entry.updated_at);
  next_draft := entry.draft_revision;
  next_published := entry.published_revision;
  next_published_at := entry.published_at;
  next_archived := entry.archived;

  IF p_action = 'save_draft' THEN
    IF entry.archived THEN RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    created_revision := coalesce(entry.draft_revision, 0) + 1;
    new_content := jetnity_cms_private.reference_v1(p_entry_id) || p_payload;
    next_draft := created_revision;
  ELSIF p_action = 'restore_draft' THEN
    SELECT content INTO new_content FROM jetnity_cms_private.inspiration_revisions_v1
      WHERE entry_id = p_entry_id AND revision = selected;
    IF NOT FOUND THEN RAISE EXCEPTION 'cms revision unavailable' USING ERRCODE = 'P4041'; END IF;
    created_revision := entry.draft_revision + 1;
    next_draft := created_revision;
    next_archived := false;
  ELSIF p_action = 'publish' THEN
    IF entry.archived OR entry.draft_revision IS DISTINCT FROM selected
      OR entry.published_revision IS NOT DISTINCT FROM selected THEN
      RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    next_published := selected;
    next_published_at := instant;
  ELSE
    IF entry.archived OR entry.draft_revision IS NULL THEN
      RAISE EXCEPTION 'cms state conflict' USING ERRCODE = 'P4093'; END IF;
    next_archived := true;
    next_published := NULL;
    next_published_at := NULL;
  END IF;

  IF created_revision IS NOT NULL THEN
    INSERT INTO jetnity_cms_private.inspiration_revisions_v1
      (entry_id, revision, content, created_by, created_at, restored_from_revision)
    VALUES (p_entry_id, created_revision, new_content, actor, instant,
      CASE WHEN p_action = 'restore_draft' THEN selected ELSE NULL END);
  END IF;
  receipt := jsonb_build_object('schema', 1, 'status', 'recorded',
    'requestId', p_request_id::text, 'entryId', p_entry_id, 'action', p_action,
    'beforeVersion', entry.state_version::text, 'version', (entry.state_version + 1)::text,
    'draftRevision', next_draft::text, 'publishedRevision', next_published::text,
    'archived', next_archived, 'createdRevision', created_revision::text,
    'recordedAt', jetnity_cms_private.timestamp_v1(instant));
  INSERT INTO jetnity_cms_private.inspiration_operations_v1
    (request_id, actor_id, entry_id, request, result, before_version, after_version, created_at)
  VALUES (p_request_id, actor, p_entry_id, binding, receipt, entry.state_version, entry.state_version + 1, instant);
  -- Both remain uncommitted. This order also works if a caller has selected
  -- immediate checking for the otherwise deferred cross-table constraints.
  UPDATE jetnity_cms_private.inspiration_entries_v1 SET
    state_version = entry.state_version + 1, draft_revision = next_draft,
    published_revision = next_published, published_at = next_published_at,
    archived = next_archived, last_request_id = p_request_id, updated_at = instant
  WHERE entry_id = p_entry_id;
  admin_runtime_result := receipt;
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  RETURN admin_runtime_result;
EXCEPTION WHEN unique_violation THEN
  GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
  IF violated_constraint = 'inspiration_operations_v1_pkey' THEN
    -- The function's entire subtransaction was rolled back, including a
    -- different entry's tentative revision/state, before this error is raised.
    RAISE EXCEPTION 'cms request identity conflict' USING ERRCODE = 'P4092';
  END IF;
  RAISE;
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION public.admin_cms_inspiration_read_v1(
  p_entry_id text, p_revision bigint DEFAULT NULL,
  p_before_revision bigint DEFAULT NULL, p_limit integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $admin_runtime_body$
DECLARE
  admin_runtime_result jsonb;
  entry jetnity_cms_private.inspiration_entries_v1%ROWTYPE;
  preview jsonb; history jsonb; last_revision bigint; next_before text;
BEGIN
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  PERFORM jetnity_cms_private.actor_v1();
  IF jetnity_cms_private.reference_v1(p_entry_id) IS NULL
    OR p_revision <= 0 OR p_before_revision <= 0
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  SELECT * INTO entry FROM jetnity_cms_private.inspiration_entries_v1 WHERE entry_id = p_entry_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'cms entry unavailable' USING ERRCODE = 'P4041'; END IF;
  SELECT jsonb_build_object('entryId', r.entry_id, 'revision', r.revision::text,
    'content', r.content, 'createdBy', r.created_by::text,
    'createdAt', jetnity_cms_private.timestamp_v1(r.created_at),
    'restoredFromRevision', r.restored_from_revision::text)
  INTO preview FROM jetnity_cms_private.inspiration_revisions_v1 r
  WHERE r.entry_id = p_entry_id AND r.revision = coalesce(p_revision, entry.draft_revision);
  IF p_revision IS NOT NULL AND NOT FOUND THEN
    RAISE EXCEPTION 'cms revision unavailable' USING ERRCODE = 'P4041'; END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('entryId', r.entry_id, 'revision', r.revision::text,
    'content', r.content, 'createdBy', r.created_by::text,
    'createdAt', jetnity_cms_private.timestamp_v1(r.created_at),
    'restoredFromRevision', r.restored_from_revision::text) ORDER BY r.revision DESC), '[]'::jsonb), min(r.revision)
  INTO history, last_revision
  FROM (SELECT * FROM jetnity_cms_private.inspiration_revisions_v1
    WHERE entry_id = p_entry_id AND (p_before_revision IS NULL OR revision < p_before_revision)
    ORDER BY revision DESC LIMIT p_limit) r;
  IF last_revision IS NOT NULL AND EXISTS (SELECT 1 FROM jetnity_cms_private.inspiration_revisions_v1
    WHERE entry_id = p_entry_id AND revision < last_revision) THEN next_before := last_revision::text; END IF;
  admin_runtime_result := jsonb_build_object('schema', 1, 'entry', jsonb_build_object(
    'entryId', entry.entry_id, 'locale', entry.locale, 'name', entry.name,
    'country', entry.country, 'image', entry.image, 'version', entry.state_version::text,
    'draftRevision', entry.draft_revision::text, 'publishedRevision', entry.published_revision::text,
    'publishedAt', jetnity_cms_private.timestamp_v1(entry.published_at),
    'archived', entry.archived, 'updatedAt', jetnity_cms_private.timestamp_v1(entry.updated_at)),
    'preview', preview, 'history', history, 'nextBeforeRevision', next_before);
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  RETURN admin_runtime_result;
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION public.admin_cms_inspiration_confirm_v1(p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $admin_runtime_body$
DECLARE
  admin_runtime_result jsonb; actor uuid; receipt jsonb;
BEGIN
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  actor := jetnity_cms_private.actor_v1();
  IF p_request_id IS NULL OR p_request_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'cms invalid request' USING ERRCODE = '22023'; END IF;
  SELECT result INTO receipt FROM jetnity_cms_private.inspiration_operations_v1
    WHERE request_id = p_request_id AND actor_id = actor;
  admin_runtime_result := coalesce(receipt, jsonb_build_object('schema', 1, 'status', 'unknown', 'requestId', p_request_id::text));
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  RETURN admin_runtime_result;
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION public.admin_marketing_drafts_apply_v1(input jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $admin_runtime_body$
DECLARE
  admin_runtime_result jsonb;
  actor uuid; v_request_id uuid; id uuid; expected bigint; current_version bigint; selected bigint;
  operation jetnity_marketing_private.operations_v1%ROWTYPE;
  previous jetnity_marketing_private.revisions_v1%ROWTYPE;
  created jetnity_marketing_private.revisions_v1%ROWTYPE;
  new_payload jsonb; instant timestamptz;
BEGIN
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  actor := jetnity_marketing_private.actor_v1();
  IF jetnity_marketing_private.command_valid_v1(input) IS NOT TRUE THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  v_request_id := (input->>'requestId')::uuid; id := (input->>'draftId')::uuid;
  expected := (input->>'expectedVersion')::bigint;
  -- Advisory hashes only serialize; the full immutable JSON/actor binding is
  -- compared below. A collision cannot supply identity or a successful replay.
  PERFORM pg_advisory_xact_lock(hashtextextended('jetnity.marketing.request:' || v_request_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('jetnity.marketing.draft:' || id::text, 0));
  SELECT d.version INTO current_version FROM jetnity_marketing_private.drafts_v1 d WHERE d.draft_id = id FOR UPDATE;
  IF jetnity_marketing_private.lock_actor_v1() IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'marketing not authorized' USING ERRCODE = '42501'; END IF;
  SELECT o.* INTO operation FROM jetnity_marketing_private.operations_v1 o WHERE o.request_id = v_request_id;
  IF FOUND THEN
    IF operation.actor_id IS DISTINCT FROM actor OR operation.request IS DISTINCT FROM input THEN
      RAISE EXCEPTION 'marketing request identity conflict' USING ERRCODE = 'P4092'; END IF;
    SELECT r.* INTO STRICT created FROM jetnity_marketing_private.revisions_v1 r
      WHERE r.draft_id = operation.draft_id AND r.version = operation.version;
    admin_runtime_result := jsonb_build_object('schemaVersion', 1, 'action', 'apply',
      'receipt', jetnity_marketing_private.revision_json_v1(created), 'replayed', true);
    PERFORM official_v3_guard_private.admin_runtime_guard_v1();
    RETURN admin_runtime_result;
  END IF;
  IF input->>'action' = 'create' THEN
    IF current_version IS NOT NULL THEN RAISE EXCEPTION 'marketing stale version' USING ERRCODE = 'P4091'; END IF;
    new_payload := input->'payload';
  ELSE
    IF current_version IS NULL THEN RAISE EXCEPTION 'marketing draft unavailable' USING ERRCODE = 'P4041'; END IF;
    IF current_version <> expected THEN RAISE EXCEPTION 'marketing stale version' USING ERRCODE = 'P4091'; END IF;
    IF current_version = 9223372036854775807 THEN RAISE EXCEPTION 'marketing version exhausted' USING ERRCODE = 'P4093'; END IF;
    SELECT r.* INTO STRICT previous FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id AND r.version = current_version;
    IF input->>'action' IN ('save','archive') AND previous.state <> 'draft' THEN
      RAISE EXCEPTION 'marketing state conflict' USING ERRCODE = 'P4093'; END IF;
    IF input->>'action' = 'restore' THEN
      selected := (input->'payload'->>'revision')::bigint;
      SELECT r.payload INTO new_payload FROM jetnity_marketing_private.revisions_v1 r WHERE r.draft_id = id AND r.version = selected;
      IF NOT FOUND THEN RAISE EXCEPTION 'marketing revision unavailable' USING ERRCODE = 'P4041'; END IF;
    ELSIF input->>'action' = 'archive' THEN new_payload := previous.payload;
    ELSE new_payload := input->'payload'; END IF;
  END IF;
  instant := greatest(clock_timestamp(), previous.saved_at + interval '1 microsecond');
  IF input->>'action' = 'create' THEN
    INSERT INTO jetnity_marketing_private.drafts_v1(draft_id,version) VALUES(id,1);
  END IF;
  INSERT INTO jetnity_marketing_private.operations_v1(request_id,draft_id,version,actor_id,request,saved_at)
    VALUES(v_request_id,id,expected+1,actor,input,instant);
  INSERT INTO jetnity_marketing_private.revisions_v1(draft_id,version,request_id,actor_id,action,state,payload,saved_at,restored_from)
    VALUES(id,expected+1,v_request_id,actor,input->>'action',
      CASE WHEN input->>'action' = 'archive' THEN 'archived' ELSE 'draft' END,new_payload,instant,selected)
    RETURNING * INTO created;
  IF input->>'action' <> 'create' THEN
    UPDATE jetnity_marketing_private.drafts_v1 d SET version = expected+1 WHERE d.draft_id = id;
  END IF;
  -- Durable success requires the surrounding transaction's COMMIT to succeed.
  admin_runtime_result := jsonb_build_object('schemaVersion',1,'action','apply',
    'receipt',jetnity_marketing_private.revision_json_v1(created),'replayed',false);
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  RETURN admin_runtime_result;
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION public.admin_marketing_drafts_read_v1(input jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $admin_runtime_body$
DECLARE
  admin_runtime_result jsonb;
  action text; id uuid; page_limit integer := 20; filter_state text; before_version bigint;
  before_time timestamptz; before_id uuid; items jsonb := '[]'::jsonb; item jetnity_marketing_private.revisions_v1%ROWTYPE;
  last_item jetnity_marketing_private.revisions_v1%ROWTYPE; count integer := 0; more boolean := false; draft jsonb;
BEGIN
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  PERFORM jetnity_marketing_private.lock_actor_v1();
  IF jsonb_typeof(input) IS DISTINCT FROM 'object' OR input->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(input->'action') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  action := input->>'action';
  IF action = 'get' THEN
    IF NOT jetnity_marketing_private.keys_v1(input,ARRAY['schemaVersion','action','draftId'])
      OR NOT jetnity_marketing_private.uuid_v1(input->'draftId') THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    SELECT jetnity_marketing_private.revision_json_v1(r) INTO draft
      FROM jetnity_marketing_private.drafts_v1 d JOIN jetnity_marketing_private.revisions_v1 r USING(draft_id,version)
      WHERE d.draft_id = (input->>'draftId')::uuid;
    admin_runtime_result := jsonb_build_object('schemaVersion',1,'action','get','draft',draft);
    PERFORM official_v3_guard_private.admin_runtime_guard_v1();
    RETURN admin_runtime_result;
  END IF;
  IF action NOT IN ('list','history') OR input - ARRAY['schemaVersion','action','draftId','limit','state','cursor'] <> '{}'::jsonb
    OR (action = 'list' AND input ? 'draftId') OR (action = 'history' AND input ? 'state') THEN
    RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
  IF input ? 'limit' THEN
    IF jsonb_typeof(input->'limit') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    IF (input->>'limit')::numeric NOT BETWEEN 1 AND 50
      OR trunc((input->>'limit')::numeric) <> (input->>'limit')::numeric THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    page_limit := (input->>'limit')::numeric::integer;
  END IF;
  IF action = 'history' THEN
    IF NOT jetnity_marketing_private.uuid_v1(input->'draftId')
      OR (input ? 'cursor' AND NOT jetnity_marketing_private.version_v1(input->'cursor')) THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    id := (input->>'draftId')::uuid; before_version := (input->>'cursor')::bigint;
    FOR item IN SELECT r.* FROM jetnity_marketing_private.revisions_v1 r
      WHERE r.draft_id = id AND (before_version IS NULL OR r.version < before_version)
      ORDER BY r.version DESC LIMIT page_limit + 1 LOOP
      IF count = page_limit THEN more := true; EXIT; END IF;
      items := items || jsonb_build_array(jetnity_marketing_private.revision_json_v1(item)); last_item := item; count := count + 1;
    END LOOP;
    admin_runtime_result := jsonb_build_object('schemaVersion',1,'action','history','draftId',id::text,'items',items,
      'nextCursor',CASE WHEN more THEN last_item.version::text ELSE NULL END);
    PERFORM official_v3_guard_private.admin_runtime_guard_v1();
    RETURN admin_runtime_result;
  END IF;
  IF input ? 'state' THEN
    IF jsonb_typeof(input->'state') IS DISTINCT FROM 'string' OR input->>'state' NOT IN ('draft','archived') THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    filter_state := input->>'state';
  END IF;
  IF input ? 'cursor' THEN
    IF jetnity_marketing_private.keys_v1(input->'cursor',ARRAY['savedAt','draftId']) IS NOT TRUE
      OR jetnity_marketing_private.uuid_v1(input->'cursor'->'draftId') IS NOT TRUE
      OR jsonb_typeof(input->'cursor'->'savedAt') IS DISTINCT FROM 'string'
      OR input->'cursor'->>'savedAt' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    BEGIN before_time := (input->'cursor'->>'savedAt')::timestamptz;
    EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END;
    IF jetnity_marketing_private.timestamp_v1(before_time) IS DISTINCT FROM input->'cursor'->>'savedAt' THEN
      RAISE EXCEPTION 'marketing invalid request' USING ERRCODE = '22023'; END IF;
    before_id := (input->'cursor'->>'draftId')::uuid;
  END IF;
  FOR item IN SELECT r.* FROM jetnity_marketing_private.drafts_v1 d
    JOIN jetnity_marketing_private.revisions_v1 r USING(draft_id,version)
    WHERE (filter_state IS NULL OR r.state = filter_state)
      AND (before_time IS NULL OR (r.saved_at,r.draft_id) < (before_time,before_id))
    ORDER BY r.saved_at DESC,r.draft_id DESC LIMIT page_limit + 1 LOOP
    IF count = page_limit THEN more := true; EXIT; END IF;
    items := items || jsonb_build_array(jetnity_marketing_private.revision_json_v1(item)); last_item := item; count := count + 1;
  END LOOP;
  admin_runtime_result := jsonb_build_object('schemaVersion',1,'action','list','items',items,
    'nextCursor',CASE WHEN more THEN jsonb_build_object('savedAt',jetnity_marketing_private.timestamp_v1(last_item.saved_at),
      'draftId',last_item.draft_id::text) ELSE NULL END);
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  RETURN admin_runtime_result;
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION jetnity_reporting.account_counts_v1() returns table (
  present_registered_accounts bigint,
  created_in_prior_30_days bigint,
  measured_at timestamp with time zone,
  window_start timestamp with time zone,
  definition_version text
)
language plpgsql
VOLATILE
security definer
set search_path = pg_catalog
set timezone = 'UTC'
AS $admin_runtime_body$
declare
  _uid uuid;
  _caller_present boolean;
  _caller_status text;
  _measured_at timestamp with time zone;
  _window_start timestamp with time zone;
begin
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  _uid := auth.uid();
  if _uid is null then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  select exists (
    select 1
      from auth.users as u
     where u.id = _uid
       and u.deleted_at is null
       and u.is_anonymous is false
  )
    into _caller_present;

  if not coalesce(_caller_present, false) then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  if not coalesce(public.darf_konten_verwalten(), false) then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  -- Feature-local caller-status prerequisite. Fully qualified because
  -- search_path is pinned to pg_catalog. A missing row leaves
  -- _caller_status NULL. Only exactly active may continue. This does
  -- not join the metric population.
  select p.status
    into _caller_status
    from public.profiles as p
   where p.user_id = _uid;

  if _caller_status is distinct from 'active' then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  -- One transaction-stable database clock. Fixed 30×24 hours, not
  -- session-DST calendar days. Half-open [window_start, measured_at).
  _measured_at := pg_catalog.now();
  _window_start := _measured_at - interval '720 hours';

  return query
  select
    count(*)::bigint,
    count(*) filter (
      where u.created_at is not null
        and u.created_at >= _window_start
        and u.created_at < _measured_at
    )::bigint,
    _measured_at,
    _window_start,
    'jetnity.admin-account-counts.v1'::text
  from auth.users as u
  where u.deleted_at is null
    and u.is_anonymous is false;
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
end
$admin_runtime_body$;

CREATE OR REPLACE FUNCTION public.admin_account_counts_v1() returns table (
  present_registered_accounts text,
  created_in_prior_30_days text,
  measured_at timestamp with time zone,
  window_start timestamp with time zone,
  definition_version text
)
language sql
VOLATILE
security invoker
set search_path = pg_catalog
AS $admin_runtime_body$
  select
    pg_catalog.btrim(inner_row.present_registered_accounts::text),
    pg_catalog.btrim(inner_row.created_in_prior_30_days::text),
    inner_row.measured_at,
    inner_row.window_start,
    inner_row.definition_version
  from jetnity_reporting.account_counts_v1() as inner_row;
$admin_runtime_body$;

CREATE OR REPLACE FUNCTION public.cms_inspiration_published_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp SET timezone = 'UTC' AS $admin_runtime_body$
DECLARE value jsonb;
BEGIN
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  SELECT q.value INTO value FROM (
SELECT jsonb_build_object('schema', 1, 'items', coalesce(jsonb_agg(jsonb_build_object(
    'entryId', e.entry_id, 'revision', r.revision::text, 'content', r.content,
    'publishedAt', jetnity_cms_private.timestamp_v1(e.published_at)) ORDER BY e.sort_order), '[]'::jsonb))
  FROM jetnity_cms_private.inspiration_entries_v1 e
  JOIN jetnity_cms_private.inspiration_revisions_v1 r ON r.entry_id = e.entry_id AND r.revision = e.published_revision
  WHERE NOT e.archived AND e.published_revision IS NOT NULL
  ) q(value);
  PERFORM official_v3_guard_private.admin_runtime_guard_v1();
  RETURN value;
END
$admin_runtime_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog SET jit=off AS $admin_runtime_body$
WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname='profiles' OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
)
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries
$admin_runtime_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $admin_runtime_body$
DECLARE admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;
  customer official_v3_guard_private.customer_information_baseline_v1%ROWTYPE;
  refresh official_v3_guard_private.refresh_retirement_baseline_v1%ROWTYPE;
  cycle4 official_v3_guard_private.cycle4_recovery_baseline_v1%ROWTYPE;
  attempt2 official_v3_guard_private.cycle4_attempt2_baseline_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT attempt2 FROM official_v3_guard_private.cycle4_attempt2_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT cycle4 FROM official_v3_guard_private.cycle4_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT refresh FROM official_v3_guard_private.refresh_retirement_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT customer FROM official_v3_guard_private.customer_information_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT gap_baseline FROM official_v3_guard_private.gap_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT successor FROM official_v3_guard_private.recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'
    OR successor.bg1_provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950' OR successor.status_provider_digest<>'71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR successor.predecessor_baselines_digest IS DISTINCT FROM predecessor.predecessor_baselines_digest
    OR successor.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR successor.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR gap_baseline.recovery2_provider_digest<>'b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7'
    OR gap_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(successor.catalog::text,'UTF8')),'hex')
    OR gap_baseline.predecessor_recovery_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(successor)||jsonb_build_object('proof_not_before',extract(epoch FROM successor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(gap_baseline.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_gap_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(gap_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM gap_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at)) FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR customer.predecessor_provider_digest<>'7324c5e87d18de2a692e7e61123a44565ca440ecc9f8e9afddf379ede2aac32a'
    OR customer.definitions_digest<>'6c5d64c50389caf424d99b204e7f0f08ba64c0f669e7b9e3f8cccead2deb992f'
    OR customer.history_definition_digest<>'061e62165021fe13959b72bfb3135114d5c77b5119f32eb7233e1290d586d692'
    OR customer.history_guard_definition_digest<>'f4a6ee4ade45524bd8ce12e389b9958568c6e2bcda1c103d22233e1e3d32987b'
    OR customer.atomic_claim_definition_digest<>'75f43cdf119fe9bd862dd5bdcbbd6d53da974b09a6162ad999f23ab62fd3af8a'
    OR customer.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR customer.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR refresh.predecessor_provider_digest<>'cd886ead66b92ec48ee9c5c5a214f310bc6e6645e1fc15f88a78650fcb95b37f'
    OR refresh.original_evidence_digest<>'be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
    OR refresh.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(customer.catalog::text,'UTF8')),'hex')
    OR refresh.predecessor_customer_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(customer)||jsonb_build_object('proof_not_before',extract(epoch FROM customer.proof_not_before)))::text,'UTF8')),'hex')
    OR cycle4.predecessor_provider_digest<>'e71c729360c0e36e7d3a00504b8f013d716ef33c76ae35c9e8fbb484d01c67fe'
    OR cycle4.original_evidence_digest<>'5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
    OR cycle4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(refresh.catalog::text,'UTF8')),'hex')
    OR cycle4.predecessor_refresh_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(refresh)||jsonb_build_object('proof_not_before',extract(epoch FROM refresh.proof_not_before)))::text,'UTF8')),'hex')
    OR attempt2.predecessor_provider_digest<>'e12dc341cc01de2a459826e8b1c6a3a9b4dd48b40dd8cd1c765660007b7694f3'
    OR attempt2.original_evidence_digest<>'7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
    OR attempt2.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(cycle4.catalog::text,'UTF8')),'hex')
    OR attempt2.predecessor_cycle4_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(cycle4)||jsonb_build_object('proof_not_before',extract(epoch FROM cycle4.proof_not_before)))::text,'UTF8')),'hex')
    OR admin.predecessor_provider_digest<>'9da5d3dee7a4c3a45fea976b27fc2996e5b5d912741407c6be9954baefa1e106'
    OR admin.definition_digest<>'872bec621ba99e88c62b61cc2c5ab54725593bf424f18dae2c5442897d7f228b'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(attempt2.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_attempt2_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(attempt2)||jsonb_build_object('proof_not_before',extract(epoch FROM attempt2.proof_not_before)))::text,'UTF8')),'hex')
    OR admin.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $admin_runtime_body$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $admin_runtime_body$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $admin_runtime_body$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $admin_runtime_body$;

DO $admin_runtime_delta$
DECLARE additions jsonb:='[{"signature":"jetnity_reporting.account_counts_v1()","name":"jetnity_reporting.account_counts_v1","hash":"c974053e2902d65afa368a18ba2f5b3a901e2e2bc4c86c193ddab53699e8660c","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog","TimeZone=UTC"],"grantees":["authenticated","postgres"],"argumentNames":["present_registered_accounts","created_in_prior_30_days","measured_at","window_start","definition_version"],"argumentTypes":[],"defaults":0,"returnType":"record","set":true,"outputTypes":["bigint","bigint","timestamp with time zone","timestamp with time zone","text"]},{"signature":"public.admin_account_counts_v1()","name":"public.admin_account_counts_v1","hash":"aed37c6c5abd5fa8c05918e345226a0712adbe60d72f01b191f91141660c5f9c","language":"sql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog"],"grantees":["authenticated","postgres"],"argumentNames":["present_registered_accounts","created_in_prior_30_days","measured_at","window_start","definition_version"],"argumentTypes":[],"defaults":0,"returnType":"record","set":true,"outputTypes":["text","text","timestamp with time zone","timestamp with time zone","text"]},{"signature":"jetnity_cms_private.reference_v1(text)","name":"jetnity_cms_private.reference_v1","hash":"7d84a409d2ec9d15aa744edc0fa1db29b6ab171f5f05314bb5e440ded71a8f4e","language":"sql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_entry_id"],"argumentTypes":["text"],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.text_valid_v1(text,integer,integer)","name":"jetnity_cms_private.text_valid_v1","hash":"0ed9281c6aab92b312caf95573b4f42e02c2815ed4d5aa0e3ed05d7a5b1dfa3a","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_value","p_characters","p_bytes"],"argumentTypes":["text","integer","integer"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.editable_valid_v1(jsonb)","name":"jetnity_cms_private.editable_valid_v1","hash":"5b77be6cf86912719d03e2f4543c0853b3ad182dd3fcf3c7859aaec11c9895d6","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_payload"],"argumentTypes":["jsonb"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.snapshot_valid_v1(text,jsonb)","name":"jetnity_cms_private.snapshot_valid_v1","hash":"dc6404dbb10bb9317ce96d44796724b49e20b91d31a4d0e3ffc9aa8d2c9c36fb","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_entry_id","p_content"],"argumentTypes":["text","jsonb"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.timestamp_v1(timestamptz)","name":"jetnity_cms_private.timestamp_v1","hash":"c1555650add3c195cb79f6fa9bfa00ac5cabf152c21eae075d1fb52db3154a41","language":"sql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_value"],"argumentTypes":["timestamptz"],"defaults":0,"returnType":"text","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.decimal_valid_v1(jsonb,boolean,boolean)","name":"jetnity_cms_private.decimal_valid_v1","hash":"d30fd9faf485323f458f047df4810db3cbbccdba00402cf86f8462f26d47ced0","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_value","p_zero","p_null"],"argumentTypes":["jsonb","boolean","boolean"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.revision_payload_valid_v1(jsonb)","name":"jetnity_cms_private.revision_payload_valid_v1","hash":"58d1716f0d363f147f365a0a8b1944daa736beeae8c48dd36a185e896ba612bb","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_payload"],"argumentTypes":["jsonb"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.request_valid_v1(jsonb,uuid,uuid,text,bigint)","name":"jetnity_cms_private.request_valid_v1","hash":"db6fa8e4577e8c05f74323bc3c39d07cb58e4f852bd340d1f11adb6863b1a2d3","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_request","p_request_id","p_actor_id","p_entry_id","p_before"],"argumentTypes":["jsonb","uuid","uuid","text","bigint"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.receipt_valid_v1(jsonb,jsonb,bigint,timestamptz)","name":"jetnity_cms_private.receipt_valid_v1","hash":"41b52c6cfdb7be9b978ed1337d0ddeb64659064e7b1394fcbff35a1c6f67953e","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_result","p_request","p_after","p_recorded_at"],"argumentTypes":["jsonb","jsonb","bigint","timestamptz"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.immutable_v1()","name":"jetnity_cms_private.immutable_v1","hash":"a643d7664ad0a0d2e2940d506633f7d0d8bbe86900a7238ee0c999f618932ce5","language":"plpgsql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"trigger","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.entry_update_v1()","name":"jetnity_cms_private.entry_update_v1","hash":"c0efd5ba2269b5c48f0ddd7b1444e7e9685518d9b8feaba55314aab6b4dd8c7b","language":"plpgsql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"trigger","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.actor_v1()","name":"jetnity_cms_private.actor_v1","hash":"1b6047f650e61bcac552fc5c81a2d805f1229ebcb9d49aaea5fc3bc44fac4244","language":"plpgsql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"uuid","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.lock_actor_v1()","name":"jetnity_cms_private.lock_actor_v1","hash":"a5b062e9f971883620965b328596cb5f62d6a143bbfe0351d83601153c44d9d6","language":"plpgsql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"uuid","set":false,"outputTypes":[]},{"signature":"jetnity_cms_private.selected_revision_v1(jsonb)","name":"jetnity_cms_private.selected_revision_v1","hash":"4d572ebf7598aeec977938a1a44559db388612b2e8ea59bb482d3ed2c002d603","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["p_payload"],"argumentTypes":["jsonb"],"defaults":0,"returnType":"bigint","set":false,"outputTypes":[]},{"signature":"public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb)","name":"public.admin_cms_inspiration_command_v1","hash":"df8f21659ff77b5544dd26eb1db57ad4ab762af22f0814e3e1010e2818ce3754","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp","TimeZone=UTC"],"grantees":["authenticated","postgres"],"argumentNames":["p_request_id","p_entry_id","p_expected_version","p_action","p_payload"],"argumentTypes":["uuid","text","bigint","text","jsonb"],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer)","name":"public.admin_cms_inspiration_read_v1","hash":"cdaee909122ab9415e5e3a73625bff5977caacbc456aa80e3721e8d5a2af27ec","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp","TimeZone=UTC"],"grantees":["authenticated","postgres"],"argumentNames":["p_entry_id","p_revision","p_before_revision","p_limit"],"argumentTypes":["text","bigint","bigint","integer"],"defaults":3,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"public.admin_cms_inspiration_confirm_v1(uuid)","name":"public.admin_cms_inspiration_confirm_v1","hash":"d5844fdac9f991c9b8467318c412b1850cf74436a7a316ee0dc7194d62f43da7","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp","TimeZone=UTC"],"grantees":["authenticated","postgres"],"argumentNames":["p_request_id"],"argumentTypes":["uuid"],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"public.cms_inspiration_published_v1()","name":"public.cms_inspiration_published_v1","hash":"2fa3afd97927af044641e13324cabfcebbf8628554016da276bcb91396678a9f","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp","TimeZone=UTC"],"grantees":["anon","authenticated","postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.keys_v1(jsonb,text[])","name":"jetnity_marketing_private.keys_v1","hash":"7fe1e588dbd34d0038182a7ec0ccbac14e576ddcc8d48d0b42a4659a27f0668a","language":"sql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["value","expected"],"argumentTypes":["jsonb","text[]"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.uuid_v1(jsonb)","name":"jetnity_marketing_private.uuid_v1","hash":"8665556984740e134a16042ebb69b1fb26e9688b5c070d9bdcf875ce371799b5","language":"sql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["value"],"argumentTypes":["jsonb"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.version_v1(jsonb,boolean)","name":"jetnity_marketing_private.version_v1","hash":"74354031194955eda3ba419199c418c89fa81c24a343ce346db175c7a861c7ed","language":"sql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["value","allow_zero"],"argumentTypes":["jsonb","boolean"],"defaults":1,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.timestamp_v1(timestamptz)","name":"jetnity_marketing_private.timestamp_v1","hash":"bffc9a8307d196165add41611f7f29b59afaed263a01e0be77bcc45e886c0d42","language":"sql","definer":false,"volatile":"s","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["value"],"argumentTypes":["timestamptz"],"defaults":0,"returnType":"text","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.payload_valid_v1(jsonb)","name":"jetnity_marketing_private.payload_valid_v1","hash":"e7bd4ecef7712456f59c94d25eea83947af033620152b92faef69cddb9a18ab8","language":"sql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["value"],"argumentTypes":["jsonb"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.command_valid_v1(jsonb)","name":"jetnity_marketing_private.command_valid_v1","hash":"99bee9dd63067744e75fe365b0c716f2316561d9c43172b4e59e2037df4853dd","language":"plpgsql","definer":false,"volatile":"i","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["value"],"argumentTypes":["jsonb"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.actor_v1()","name":"jetnity_marketing_private.actor_v1","hash":"2b5da7d4d32ed5ee464b405b89c286155d7054473f3ec2629cdbfc574da731b6","language":"plpgsql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"uuid","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.lock_actor_v1()","name":"jetnity_marketing_private.lock_actor_v1","hash":"e9294c04e9b7770c6617ad86e2938eafb7117a4140c9c5637049d7afa0f089f1","language":"plpgsql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"uuid","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.revision_json_v1(jetnity_marketing_private.revisions_v1)","name":"jetnity_marketing_private.revision_json_v1","hash":"cdc3b05a3de5f93cf823a0430c87bf1a200f855c7e44203e9a0defbcf9214297","language":"sql","definer":false,"volatile":"s","parallel":"s","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["value"],"argumentTypes":["jetnity_marketing_private.revisions_v1"],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.chain_valid_v1(uuid)","name":"jetnity_marketing_private.chain_valid_v1","hash":"8194b085c73066ff2ffc01aa54a70c2c794288242fd1d20b2b322374ab483bd7","language":"sql","definer":false,"volatile":"s","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":["id"],"argumentTypes":["uuid"],"defaults":0,"returnType":"boolean","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.enforce_chain_v1()","name":"jetnity_marketing_private.enforce_chain_v1","hash":"3689d75c137ae86f5ce504c886f226ff9f318fbaf58d3812b66f11266f0a5789","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"trigger","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.immutable_v1()","name":"jetnity_marketing_private.immutable_v1","hash":"95715accb7eb4e190c8909274a84b7980d57efb6b6850aabe0941d0af1e61d77","language":"plpgsql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"trigger","set":false,"outputTypes":[]},{"signature":"jetnity_marketing_private.advance_v1()","name":"jetnity_marketing_private.advance_v1","hash":"0705800e4a45db999f58f19afd92182f7ccd73a32825f4db927f8ba7010bfe73","language":"plpgsql","definer":false,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"trigger","set":false,"outputTypes":[]},{"signature":"public.admin_marketing_drafts_apply_v1(jsonb)","name":"public.admin_marketing_drafts_apply_v1","hash":"ab4a9e6352c34ca1a541688268f81902445ca3583118f5d0aa19e1d2cf49a58f","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp","TimeZone=UTC"],"grantees":["authenticated","postgres"],"argumentNames":["input"],"argumentTypes":["jsonb"],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"public.admin_marketing_drafts_read_v1(jsonb)","name":"public.admin_marketing_drafts_read_v1","hash":"d06d088100c5d344018b765403e2d39dd82c2cbde4809d57ca2712a4e174f5fa","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog, pg_temp","TimeZone=UTC"],"grantees":["authenticated","postgres"],"argumentNames":["input"],"argumentTypes":["jsonb"],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"official_v3_guard_private.admin_runtime_guard_v1()","name":"official_v3_guard_private.admin_runtime_guard_v1","hash":"080e2459003f20ff851b31f6addf0cfa8eadca423978a02135a13d2c92af6489","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"void","set":false,"outputTypes":[]}]'::jsonb; replacements jsonb:='[{"signature":"official_v3_guard_private.catalog_status_v1()","name":"official_v3_guard_private.catalog_status_v1","hash":"82707dea945e6579a256e188dfd4878d72cfd521a858dd48750e5e073d874898","language":"sql","definer":true,"volatile":"s","parallel":"u","config":["search_path=pg_catalog","jit=off"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]},{"signature":"official_v3_guard_private.assert_catalog_v1()","name":"official_v3_guard_private.assert_catalog_v1","hash":"c9abf6e9d8ee128a8d9df0a107f13983d1bb7369f15866d29f660fd1df4058a4","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog"],"grantees":["postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"void","set":false,"outputTypes":[]},{"signature":"official_v3_guard_private.require_open_v1()","name":"official_v3_guard_private.require_open_v1","hash":"404175a315e84bf513b03bd5af660456dbf7711ffb858488041cedb3acec82a9","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"bigint","set":false,"outputTypes":[]},{"signature":"public.official_v3_guard_alarm_status_v1()","name":"public.official_v3_guard_alarm_status_v1","hash":"87a10f91f7b39c8cbe820370458f9252886bb8278e34347140c6d3c88b5897d7","language":"plpgsql","definer":true,"volatile":"v","parallel":"u","config":["search_path=pg_catalog"],"grantees":["anon","postgres"],"argumentNames":[],"argumentTypes":[],"defaults":0,"returnType":"jsonb","set":false,"outputTypes":[]}]'::jsonb;
  tables jsonb:='[{"name":"official_v3_guard_private.admin_runtime_baseline_v1","columns":[{"name":"singleton","type":"boolean","notNull":true,"generated":false,"hasDefault":true},{"name":"predecessor_provider_digest","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"predecessor_catalog_digest","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"predecessor_attempt2_digest","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"definition_digest","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"required_generation","type":"bigint","notNull":true,"generated":false,"hasDefault":false},{"name":"proof_not_before","type":"timestamptz","notNull":true,"generated":false,"hasDefault":false},{"name":"catalog","type":"jsonb","notNull":true,"generated":false,"hasDefault":false}],"triggers":[{"name":"immutable_v1","function":"official_v3_guard_private.immutable_v1()","type":27,"deferred":false},{"name":"immutable_truncate_v1","function":"official_v3_guard_private.immutable_v1()","type":34,"deferred":false}],"constraints":8,"baseline":true},{"name":"jetnity_cms_private.inspiration_entries_v1","columns":[{"name":"entry_id","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"locale","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"name","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"country","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"image","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"sort_order","type":"integer","notNull":true,"generated":false,"hasDefault":false},{"name":"state_version","type":"bigint","notNull":true,"generated":false,"hasDefault":true},{"name":"draft_revision","type":"bigint","notNull":false,"generated":false,"hasDefault":false},{"name":"published_revision","type":"bigint","notNull":false,"generated":false,"hasDefault":false},{"name":"published_at","type":"timestamptz","notNull":false,"generated":false,"hasDefault":false},{"name":"archived","type":"boolean","notNull":true,"generated":false,"hasDefault":true},{"name":"last_request_id","type":"uuid","notNull":false,"generated":false,"hasDefault":false},{"name":"created_at","type":"timestamptz","notNull":true,"generated":false,"hasDefault":true},{"name":"updated_at","type":"timestamptz","notNull":true,"generated":false,"hasDefault":true}],"triggers":[{"name":"cms_entry_identity","function":"jetnity_cms_private.entry_update_v1()","type":19,"deferred":false},{"name":"cms_entry_delete","function":"jetnity_cms_private.immutable_v1()","type":11,"deferred":false},{"name":"cms_entry_truncate","function":"jetnity_cms_private.immutable_v1()","type":34,"deferred":false}],"constraints":22,"baseline":false},{"name":"jetnity_cms_private.inspiration_revisions_v1","columns":[{"name":"entry_id","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"revision","type":"bigint","notNull":true,"generated":false,"hasDefault":false},{"name":"content","type":"jsonb","notNull":true,"generated":false,"hasDefault":false},{"name":"created_by","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"created_at","type":"timestamptz","notNull":true,"generated":false,"hasDefault":false},{"name":"restored_from_revision","type":"bigint","notNull":false,"generated":false,"hasDefault":false}],"triggers":[{"name":"cms_revision_immutable","function":"jetnity_cms_private.immutable_v1()","type":27,"deferred":false},{"name":"cms_revision_truncate","function":"jetnity_cms_private.immutable_v1()","type":34,"deferred":false}],"constraints":7,"baseline":false},{"name":"jetnity_cms_private.inspiration_operations_v1","columns":[{"name":"request_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"actor_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"entry_id","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"request","type":"jsonb","notNull":true,"generated":false,"hasDefault":false},{"name":"result","type":"jsonb","notNull":true,"generated":false,"hasDefault":false},{"name":"before_version","type":"bigint","notNull":true,"generated":false,"hasDefault":false},{"name":"after_version","type":"bigint","notNull":true,"generated":false,"hasDefault":false},{"name":"created_at","type":"timestamptz","notNull":true,"generated":false,"hasDefault":false}],"triggers":[{"name":"cms_operation_immutable","function":"jetnity_cms_private.immutable_v1()","type":27,"deferred":false},{"name":"cms_operation_truncate","function":"jetnity_cms_private.immutable_v1()","type":34,"deferred":false}],"constraints":12,"baseline":false},{"name":"jetnity_marketing_private.drafts_v1","columns":[{"name":"draft_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"version","type":"bigint","notNull":true,"generated":false,"hasDefault":false}],"triggers":[{"name":"drafts_no_delete_v1","function":"jetnity_marketing_private.immutable_v1()","type":11,"deferred":false},{"name":"drafts_no_truncate_v1","function":"jetnity_marketing_private.immutable_v1()","type":34,"deferred":false},{"name":"drafts_advance_v1","function":"jetnity_marketing_private.advance_v1()","type":19,"deferred":false},{"name":"drafts_complete_v1","function":"jetnity_marketing_private.enforce_chain_v1()","type":21,"deferred":true}],"constraints":5,"baseline":false},{"name":"jetnity_marketing_private.revisions_v1","columns":[{"name":"draft_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"version","type":"bigint","notNull":true,"generated":false,"hasDefault":false},{"name":"previous_version","type":"bigint","notNull":false,"generated":true,"hasDefault":true},{"name":"request_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"actor_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"action","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"state","type":"text","notNull":true,"generated":false,"hasDefault":false},{"name":"payload","type":"jsonb","notNull":true,"generated":false,"hasDefault":false},{"name":"saved_at","type":"timestamptz","notNull":true,"generated":false,"hasDefault":false},{"name":"restored_from","type":"bigint","notNull":false,"generated":false,"hasDefault":false}],"triggers":[{"name":"revisions_immutable_v1","function":"jetnity_marketing_private.immutable_v1()","type":27,"deferred":false},{"name":"revisions_no_truncate_v1","function":"jetnity_marketing_private.immutable_v1()","type":34,"deferred":false},{"name":"revisions_complete_v1","function":"jetnity_marketing_private.enforce_chain_v1()","type":5,"deferred":true}],"constraints":17,"baseline":false},{"name":"jetnity_marketing_private.operations_v1","columns":[{"name":"request_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"draft_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"version","type":"bigint","notNull":true,"generated":false,"hasDefault":false},{"name":"actor_id","type":"uuid","notNull":true,"generated":false,"hasDefault":false},{"name":"request","type":"jsonb","notNull":true,"generated":false,"hasDefault":false},{"name":"saved_at","type":"timestamptz","notNull":true,"generated":false,"hasDefault":false}],"triggers":[{"name":"operations_immutable_v1","function":"jetnity_marketing_private.immutable_v1()","type":27,"deferred":false},{"name":"operations_no_truncate_v1","function":"jetnity_marketing_private.immutable_v1()","type":34,"deferred":false},{"name":"operations_complete_v1","function":"jetnity_marketing_private.enforce_chain_v1()","type":5,"deferred":true}],"constraints":6,"baseline":false}]'::jsonb; expected record; actual pg_proc%ROWTYPE; actual_acl jsonb;
  before_catalog jsonb; after_catalog jsonb; item record; relation_id oid; namespace_id oid;
  object_class oid; object_id oid; replacement_ids oid[]:=ARRAY[]::oid[]; expected_columns jsonb;
  actual_columns jsonb; trigger_spec record; trigger_count integer; old_table text; old_value jsonb;
BEGIN
  IF (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r)
      IS DISTINCT FROM (SELECT value FROM pg_temp.admin_runtime_before WHERE kind='roles')
    OR COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
      IS DISTINCT FROM (SELECT value FROM pg_temp.admin_runtime_before WHERE kind='memberships') THEN
    RAISE EXCEPTION 'admin runtime existing roles or memberships changed' USING ERRCODE='P7931';
  END IF;
  SELECT value INTO STRICT before_catalog FROM pg_temp.admin_runtime_before WHERE kind='catalog';
  -- Signatures, bodies, all execution attributes and exact effective grants.
  FOR expected IN SELECT * FROM jsonb_to_recordset(additions||replacements)
    AS f(signature text,name text,hash text,language text,definer boolean,volatile text,parallel text,
      config jsonb,grantees jsonb,"argumentNames" jsonb,"argumentTypes" jsonb,defaults integer,"returnType" text,
      "set" boolean,"outputTypes" jsonb) LOOP
    SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    SELECT jsonb_agg(role_name ORDER BY role_name COLLATE "C") INTO actual_acl FROM (
      SELECT CASE a.grantee WHEN 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS role_name
      FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
      WHERE a.privilege_type='EXECUTE' AND NOT a.is_grantable AND a.grantor='postgres'::regrole
    ) permissions;
    IF actual.proowner<>'postgres'::regrole OR actual.prokind<>'f' OR actual.proisstrict OR actual.proleakproof
      OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
      OR actual.proparallel::text<>expected.parallel OR actual.provariadic<>0 OR actual.prosupport<>0
      OR actual.probin IS NOT NULL OR actual.prosqlbody IS NOT NULL
      OR actual.pronargs<>jsonb_array_length(expected."argumentTypes") OR actual.pronargdefaults<>expected.defaults
      OR actual.prorettype<>expected."returnType"::regtype OR actual.proretset<>expected."set"
      OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
      OR COALESCE(to_jsonb(actual.proargnames),'[]'::jsonb) IS DISTINCT FROM expected."argumentNames"
      OR ARRAY(SELECT unnest(actual.proargtypes::oid[])) IS DISTINCT FROM
        ARRAY(SELECT value::regtype::oid FROM jsonb_array_elements_text(expected."argumentTypes"))
      OR (expected."set" AND (
        actual.proargmodes IS DISTINCT FROM array_fill('t'::"char",ARRAY[jsonb_array_length(expected."outputTypes")])
        OR actual.proallargtypes IS DISTINCT FROM ARRAY(SELECT value::regtype::oid FROM jsonb_array_elements_text(expected."outputTypes"))))
      OR (NOT expected."set" AND (actual.proallargtypes IS NOT NULL OR actual.proargmodes IS NOT NULL))
      OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config
      OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash
      OR actual_acl IS DISTINCT FROM expected.grantees
      OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
        WHERE a.privilege_type<>'EXECUTE' OR a.is_grantable OR a.grantor<>'postgres'::regrole) THEN
      RAISE EXCEPTION 'admin runtime function contract changed: %',expected.signature USING ERRCODE='P7931';
    END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(replacements) r WHERE r->>'signature'=expected.signature) THEN
      IF NOT before_catalog ? ('function:'||actual.oid) THEN
        RAISE EXCEPTION 'admin runtime original function identity missing' USING ERRCODE='P7931';
      END IF;
      replacement_ids:=array_append(replacement_ids,actual.oid);
    ELSE
      IF before_catalog ? ('function:'||actual.oid) THEN
        RAISE EXCEPTION 'admin runtime new function replaced an original' USING ERRCODE='P7931';
      END IF;
      INSERT INTO pg_temp.admin_runtime_objects VALUES('pg_proc'::regclass,actual.oid);
    END IF;
  END LOOP;
  IF cardinality(replacement_ids)<>4 THEN
    RAISE EXCEPTION 'admin runtime exact four guard replacements required' USING ERRCODE='P7931';
  END IF;

  FOREACH old_table IN ARRAY ARRAY['jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'] LOOP
    namespace_id:=to_regnamespace(old_table);
    IF namespace_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_namespace n WHERE n.oid=namespace_id AND n.nspowner='postgres'::regrole)
      OR EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) a
        WHERE n.oid=namespace_id AND (a.grantor<>'postgres'::regrole OR a.is_grantable
          OR NOT(a.grantee='postgres'::regrole OR old_table='jetnity_reporting' AND a.grantee='authenticated'::regrole AND a.privilege_type='USAGE')))
      OR (old_table='jetnity_reporting' AND NOT has_schema_privilege('authenticated',namespace_id,'USAGE'))
      OR EXISTS(SELECT 1 FROM pg_proc p WHERE p.pronamespace=namespace_id
        AND NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid='pg_proc'::regclass AND o.objid=p.oid))
      OR EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace=namespace_id AND c.relkind NOT IN ('r','i'))
      OR EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace=namespace_id AND c.relkind='r'
        AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(tables) t WHERE t->>'name'=old_table||'.'||c.relname)) THEN
      RAISE EXCEPTION 'admin runtime new namespace inventory or authority changed' USING ERRCODE='P7931';
    END IF;
    INSERT INTO pg_temp.admin_runtime_objects VALUES('pg_namespace'::regclass,namespace_id);
  END LOOP;
  FOR expected IN SELECT * FROM jsonb_to_recordset(tables)
    AS t(name text,columns jsonb,triggers jsonb,constraints integer,baseline boolean) LOOP
    relation_id:=to_regclass(expected.name);
    IF relation_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=relation_id
        AND c.relkind='r' AND c.relowner='postgres'::regrole AND c.relrowsecurity AND c.relforcerowsecurity)
      OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
        WHERE c.oid=relation_id AND (a.grantor<>'postgres'::regrole OR a.grantee<>'postgres'::regrole OR a.is_grantable))
      OR EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0
        AND (a.attacl IS NOT NULL OR a.attisdropped OR a.attidentity<>''))
      OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=relation_id)<>(CASE WHEN expected.baseline THEN 1 ELSE 0 END)
      OR (expected.baseline AND NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=relation_id
        AND p.polname='owner_only' AND p.polroles=ARRAY['postgres'::regrole::oid] AND p.polpermissive AND p.polcmd='*'
        AND pg_get_expr(p.polqual,p.polrelid)='true' AND pg_get_expr(p.polwithcheck,p.polrelid)='true'))
      OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id)<>expected.constraints
      OR EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=relation_id AND (NOT c.convalidated
        OR (c.contype NOT IN ('p','u','f','c') AND NOT (c.contype='t' AND EXISTS(
          SELECT 1 FROM pg_trigger t CROSS JOIN LATERAL jsonb_array_elements(expected.triggers) declared
          WHERE t.tgconstraint=c.oid AND t.tgrelid=relation_id AND t.tgname=declared->>'name'
            AND declared->>'deferred'='true' AND c.conname=t.tgname AND c.condeferrable AND c.condeferred))))) THEN
      RAISE EXCEPTION 'admin runtime new table authority or constraint inventory changed: %',expected.name USING ERRCODE='P7931';
    END IF;
    SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid,'notNull',a.attnotnull,
      'generated',a.attgenerated='s','hasDefault',a.atthasdef) ORDER BY a.attnum) INTO actual_columns
      FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0;
    SELECT jsonb_agg(c||jsonb_build_object('type',(c->>'type')::regtype::oid) ORDER BY ordinal)
      INTO expected_columns FROM jsonb_array_elements(expected.columns) WITH ORDINALITY columns(c,ordinal);
    IF actual_columns IS DISTINCT FROM expected_columns THEN
      RAISE EXCEPTION 'admin runtime new table columns changed: %',expected.name USING ERRCODE='P7931';
    END IF;
    SELECT count(*) INTO trigger_count FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal;
    IF trigger_count<>jsonb_array_length(expected.triggers) THEN
      RAISE EXCEPTION 'admin runtime new trigger inventory changed' USING ERRCODE='P7931';
    END IF;
    FOR trigger_spec IN SELECT * FROM jsonb_to_recordset(expected.triggers)
      AS t(name text,"function" text,type integer,deferred boolean) LOOP
      IF NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=relation_id AND t.tgname=trigger_spec.name
        AND t.tgfoid=to_regprocedure(trigger_spec."function") AND t.tgtype=trigger_spec.type
        AND t.tgenabled='O' AND NOT t.tgisinternal AND t.tgnargs=0 AND t.tgqual IS NULL AND t.tgattr::text=''
        AND octet_length(t.tgargs)=0 AND t.tgparentid=0 AND t.tgoldtable IS NULL AND t.tgnewtable IS NULL
        AND t.tgdeferrable=trigger_spec.deferred AND t.tginitdeferred=trigger_spec.deferred
        AND ((NOT trigger_spec.deferred AND t.tgconstraint=0) OR (trigger_spec.deferred AND EXISTS(
          SELECT 1 FROM pg_constraint c WHERE c.oid=t.tgconstraint AND c.contype='t'
            AND c.conrelid=relation_id AND c.conname=trigger_spec.name AND c.convalidated
            AND c.condeferrable AND c.condeferred)))) THEN
        RAISE EXCEPTION 'admin runtime new trigger binding changed' USING ERRCODE='P7931';
      END IF;
    END LOOP;
    -- Complete physical and dependency closure of exactly these seven tables.
    INSERT INTO pg_temp.admin_runtime_objects
      SELECT 'pg_class'::regclass,relation_id
      UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.oid=relation_id AND c.reltoastrelid<>0
      UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i WHERE i.indrelid=relation_id
        OR i.indrelid=(SELECT reltoastrelid FROM pg_class WHERE oid=relation_id)
      UNION SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typrelid=relation_id
        OR t.typelem IN (SELECT oid FROM pg_type WHERE typrelid=relation_id)
      UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid=relation_id
      UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid=relation_id
      UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid=relation_id
      UNION SELECT 'pg_attrdef'::regclass,d.oid FROM pg_attrdef d WHERE d.adrelid=relation_id;
  END LOOP;
  -- Scoped default privileges may only describe the newly owned schemas.
  IF EXISTS(SELECT 1 FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) a
      WHERE d.defaclnamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'))
        AND (d.defaclrole<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.grantee<>'postgres'::regrole OR a.is_grantable)) THEN
    RAISE EXCEPTION 'admin runtime new default authority changed' USING ERRCODE='P7931';
  END IF;
  INSERT INTO pg_temp.admin_runtime_objects SELECT 'pg_default_acl'::regclass,d.oid FROM pg_default_acl d
    WHERE d.defaclnamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'));
  IF EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace IN (SELECT oid FROM pg_namespace
      WHERE nspname IN ('jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'))
    AND NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid='pg_class'::regclass AND o.objid=c.oid))
    OR EXISTS(SELECT 1 FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM pg_namespace
      WHERE nspname IN ('jetnity_reporting','jetnity_cms_private','jetnity_marketing_private'))
    AND NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid='pg_type'::regclass AND o.objid=t.oid)) THEN
    RAISE EXCEPTION 'admin runtime additional object outside approved closure' USING ERRCODE='P7931';
  END IF;

  after_catalog:=official_v3_guard_private.catalog_status_v1();
  FOR item IN SELECT key,value FROM jsonb_each(before_catalog) LOOP
    IF after_catalog->item.key IS NOT DISTINCT FROM item.value THEN CONTINUE; END IF;
    IF item.key LIKE 'function:%' AND split_part(item.key,':',2)::oid=ANY(replacement_ids)
      AND (after_catalog->item.key)-'definition' IS NOT DISTINCT FROM item.value-'definition' THEN CONTINUE; END IF;
    RAISE EXCEPTION 'admin runtime predecessor graph changed: %',item.key USING ERRCODE='P7931';
  END LOOP;
  FOR item IN SELECT key,value FROM jsonb_each(after_catalog) WHERE NOT before_catalog ? key LOOP
    object_class:=CASE split_part(item.key,':',1)
      WHEN 'namespace' THEN 'pg_namespace'::regclass WHEN 'function' THEN 'pg_proc'::regclass
      WHEN 'relation' THEN 'pg_class'::regclass WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
      WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
      WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
      WHEN 'default_acl' THEN 'pg_default_acl'::regclass
      WHEN 'dependency' THEN (item.value->>'classid')::oid WHEN 'shared' THEN (item.value->>'classid')::oid
      WHEN 'description' THEN (item.value->>'classoid')::oid WHEN 'label' THEN (item.value->>'classoid')::oid END;
    object_id:=CASE WHEN split_part(item.key,':',1) IN ('dependency','shared') THEN (item.value->>'objid')::oid
      WHEN split_part(item.key,':',1) IN ('description','label') THEN (item.value->>'objoid')::oid
      ELSE split_part(item.key,':',2)::oid END;
    IF object_class IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid=object_class AND o.objid=object_id) THEN
      RAISE EXCEPTION 'admin runtime unreviewed additive graph edge: %',item.key USING ERRCODE='P7931';
    END IF;
  END LOOP;
  -- Preserve foreign/shared dependencies too, including the ones outside the
  -- predecessor's named role set. Only enumerated newly created objects may add.
  IF EXISTS(SELECT value FROM jsonb_array_elements((SELECT value FROM pg_temp.admin_runtime_before WHERE kind='global_shared'))
      EXCEPT SELECT to_jsonb(d) FROM pg_shdepend d)
    OR EXISTS(SELECT 1 FROM pg_shdepend d
      WHERE NOT (SELECT value FROM pg_temp.admin_runtime_before WHERE kind='global_shared') @> jsonb_build_array(to_jsonb(d))
        AND NOT EXISTS(SELECT 1 FROM pg_temp.admin_runtime_objects o WHERE o.classid=d.classid AND o.objid=d.objid)) THEN
    RAISE EXCEPTION 'admin runtime foreign shared dependency changed' USING ERRCODE='P7931';
  END IF;
  FOR item IN SELECT kind,value FROM pg_temp.admin_runtime_before WHERE kind LIKE 'table:%' LOOP
    old_table:=substring(item.kind FROM 7);
    EXECUTE format('SELECT jsonb_build_object(''count'',count(*),''digest'',encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(t)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(t)::text COLLATE "C"),''''),''UTF8'')),''hex'')) FROM %s t',old_table::regclass) INTO old_value;
    IF old_value IS DISTINCT FROM item.value THEN
      RAISE EXCEPTION 'admin runtime historical evidence changed' USING ERRCODE='P7931';
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM jetnity_cms_private.inspiration_entries_v1)<>4
    OR EXISTS(SELECT 1 FROM jetnity_cms_private.inspiration_entries_v1 WHERE state_version<>0 OR draft_revision IS NOT NULL
      OR published_revision IS NOT NULL OR last_request_id IS NOT NULL OR archived)
    OR EXISTS(SELECT 1 FROM jetnity_cms_private.inspiration_revisions_v1)
    OR EXISTS(SELECT 1 FROM jetnity_cms_private.inspiration_operations_v1)
    OR EXISTS(SELECT 1 FROM jetnity_marketing_private.drafts_v1)
    OR EXISTS(SELECT 1 FROM jetnity_marketing_private.revisions_v1)
    OR EXISTS(SELECT 1 FROM jetnity_marketing_private.operations_v1) THEN
    RAISE EXCEPTION 'admin runtime empty store initialization required' USING ERRCODE='P7931';
  END IF;
  INSERT INTO official_v3_guard_private.admin_runtime_baseline_v1
    SELECT true,'9da5d3dee7a4c3a45fea976b27fc2996e5b5d912741407c6be9954baefa1e106',encode(sha256(convert_to(prior.catalog::text,'UTF8')),'hex'),
      encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
      '872bec621ba99e88c62b61cc2c5ab54725593bf424f18dae2c5442897d7f228b',s.generation+1,clock_timestamp(),after_catalog
    FROM official_v3_guard_private.state_v1 s CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 prior
    WHERE s.singleton AND prior.singleton;
END $admin_runtime_delta$;


DO $admin_runtime_postcheck$
DECLARE unavailable boolean:=false;
BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  BEGIN
    PERFORM official_v3_guard_private.require_open_v1();
  EXCEPTION WHEN SQLSTATE 'P7902' THEN unavailable:=true;
  END;
  IF NOT unavailable OR public.official_v3_guard_alarm_status_v1()
      IS DISTINCT FROM jsonb_build_object('schema',1,'status','unavailable') THEN
    RAISE EXCEPTION 'admin runtime requires a new regular BG1 generation' USING ERRCODE='P7931';
  END IF;
  -- NOTIFY becomes visible only with the provider's successful outer COMMIT.
  PERFORM pg_notify('pgrst','reload schema');
END $admin_runtime_postcheck$;
