-- Lost-ACK first query (before this file):
-- SELECT to_regclass('official_v3_guard_private.customer_information_baseline_v1');
-- NULL means no committed successor. A present table requires this complete
-- readback; never replay the installer to interpret a lost acknowledgement.
-- This file reads only. It does not call audit_v1, a sender tick, or an Owner RPC.
WITH catalog_checked AS MATERIALIZED (
 SELECT official_v3_guard_private.assert_catalog_v1()
), expected AS (
 SELECT * FROM jsonb_to_recordset('[{"signature":"official_v3_intake_private.proposal_shape_v1()","before":"4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9","after":"18259c9664e66a9d953e7ee6cf1a1e3decc7502a71832533eb68eb441a8728b9"},{"signature":"official_v3_result_private.proposal_shape_v1()","before":"4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9","after":"18259c9664e66a9d953e7ee6cf1a1e3decc7502a71832533eb68eb441a8728b9"},{"signature":"official_v3_jobs_private.context_v1(jsonb)","before":"ba1a29e05daca9ba4bc539ec98a2428a6beb4ca34072ea670977ff14d869d538","after":"d13ef1168f3fd032298fdd563e6045acd85d3a948de45d9eae16bb352f22379e"},{"signature":"official_v3_jobs_private.subject_v1(text,jsonb)","before":"9164ce950d552a47ddcf396b99432be9bffa12bb8e3e705afd83c32cb34d1225","after":"ba126e5d789cbc5ef470f98fd8c33de0b0cb548688110037d43e48baaee4f922"},{"signature":"official_v3_result_private.context_v1(jsonb)","before":"2468eee17b3168220355a5e5b73e6e06517d97ddab05922b5c7cf9377d511033","after":"d17e2c5e8e8c34561a47215ae9091ecf541e68035eebc8d4a444663b3e8cc845"},{"signature":"official_v3_result_private.subject_v1(text,jsonb)","before":"33f82eebaf249fb6943b8487c7dd29adfcb0c36be12e185255b3b884e4482548","after":"608b0d0d62fd54f5ea0032bca8df46e71924e7c565e7000f5181c32029f90828"},{"signature":"official_v3_jobs_private.assert_history_v1(text)","before":"b23d018a05fd96cd779993ba0be510a9d9feafdf94b5b598883e724f097f9399","after":"2459f719ebf1945197a8adce0276200e0075888c5a7f84b0fa89aafce1aab0ec"},{"signature":"official_v3_guard_private.jobs_catalog_v1()","before":"9e6d3f2b0dd0cd72e65ccc28dba92ddbeadcf177dcbe79101d6fc605968c90df","after":"7cb27a9753f10e052b75801a561b85e7f236fbe6e7698ce15e7249829b995dbf"},{"signature":"official_v3_guard_private.hrs_catalog_v1()","before":"97fb62a4b2effafc54f920fff0ff9f11c1ab8b55887e70f3d24aaed6cc5402d9","after":"812a79e8f5b40c6882cc919b1ccabc55b92410b7956f93b79556d31771536835"},{"signature":"official_v3_guard_private.assert_catalog_v1()","before":"29af0ef1184d7ec3991759880a59a97afe654d5a6047e06cb01e22130cbe8ea2","after":"58e7fc166e498af7938e3e166e4db2d56fe17b922b6cc9f3760fca0558eeb727"},{"signature":"official_v3_guard_private.require_open_v1()","before":"a4f788a1d8ef4dd42e8917fd56a0f0e88196db3cfd4175457ff751262be5493b","after":"cc68312c10c30965e82fd84af7d4483c7559e411d4496bf8dbc8b3dcd8ec0163"},{"signature":"public.official_v3_guard_alarm_status_v1()","before":"87df5171f5c9c01b81d6b5c70e07e1cc0a1781f1ad0350168f8ecc67ee84c7ae","after":"f43266886b99032f4ae8e95b2f6624bbbb4bf3ac051e009e9d4286800f45b03f"}]'::jsonb) AS f(signature text,before text,after text)
), definitions AS (
 SELECT bool_and(p.oid IS NOT NULL AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')=e.after) AS exact,
   jsonb_object_agg(e.signature,encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') ORDER BY e.signature COLLATE "C") AS bodies
 FROM expected e LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.signature)
)
SELECT jsonb_build_object('package','CUSTOMER-INFORMATION1','provider_digest','acfd471692524a7e8d895df6c64daf0eee6f368486b97eeb70a320d22b2c76bf',
 'installed',true,'catalog_verified',true,'definitions_verified',d.exact,
 'predecessor_verified',b.predecessor_provider_digest='7324c5e87d18de2a692e7e61123a44565ca440ecc9f8e9afddf379ede2aac32a',
 'definitions_digest_verified',b.definitions_digest='6c5d64c50389caf424d99b204e7f0f08ba64c0f669e7b9e3f8cccead2deb992f',
 'history_definition_digest_verified',b.history_definition_digest='719c2671f6d0af1881d21cd6e09f4d2dac2afb239d72759bd1d0d4647b85d355',
 'required_generation',b.required_generation,'proof_not_before',b.proof_not_before,
 'observed_generation',s.generation,'last_proof_started',s.last_proof_started,
 'admission',public.official_v3_guard_alarm_status_v1(),'bodies',d.bodies,
 'baseline_digest',encode(sha256(convert_to((to_jsonb(b)||jsonb_build_object('proof_not_before',extract(epoch FROM b.proof_not_before)))::text,'UTF8')),'hex'))
FROM official_v3_guard_private.customer_information_baseline_v1 b
CROSS JOIN official_v3_guard_private.state_v1 s CROSS JOIN definitions d CROSS JOIN catalog_checked
WHERE b.singleton AND s.singleton;
