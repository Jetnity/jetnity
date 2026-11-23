\set ON_ERROR_STOP on
-- Native PostgreSQL 17-only isolated fixture. No network, no live credentials,
-- no real travellers, no fact publications, no Owner sessions.
BEGIN;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='2s';
CREATE SCHEMA official_v3_at_source_watch_private;
\ir asset-only-v2.function.sql
DO $tests$
DECLARE
 old_html text;
 asset_html text;
 v_source CONSTANT text := 'bmeia-bern-how-to-apply';
BEGIN
 old_html:='<html><head>'
 ||repeat('<link rel="stylesheet" href="/typo3conf/ext/theme_bmeia/Resources/Public/CSS/bootstrap.css?1794830959" media="all">',4)
 ||repeat('<script src="/typo3conf/ext/theme_bmeia/Resources/Public/JS/jquery.js?1794830959"></script>',15)
 ||'</head><body><a href="/visum">Visum nicht erforderlich</a>'
 ||'<table><tr><td>06.11.2026</td></tr></table>'
 ||'<input type="hidden" value="amtlicher-datensatz">'
 ||'</body></html>';
 asset_html:=replace(replace(old_html,
  'bootstrap.css?1794830959','frontend.css?1795421682'),
  'jquery.js?1794830959','slick.js?1795421682');
 IF NOT official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,asset_html)
 THEN RAISE EXCEPTION 'PG17: expected CSS/JS references PASS'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'nicht erforderlich','erforderlich'))
 THEN RAISE EXCEPTION 'PG17: changed visible visa text accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'06.11.2026','07.11.2026'))
 THEN RAISE EXCEPTION 'PG17: changed official date accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'<td>06.11','<td>07.11'))
 THEN RAISE EXCEPTION 'PG17: changed table accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'href="/visum"','href="/visum-neu"'))
 THEN RAISE EXCEPTION 'PG17: changed normal link accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'amtlicher-datensatz','falscher-datensatz'))
 THEN RAISE EXCEPTION 'PG17: changed data accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'/typo3conf/ext/theme_bmeia/Resources/Public/JS/slick.js','https://evil.example/outside.js'))
 THEN RAISE EXCEPTION 'PG17: changed external script accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'rel="stylesheet"','rel="alternate"'))
 THEN RAISE EXCEPTION 'PG17: changed stylesheet tag accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'</head>','<script src="/typo3conf/ext/theme_bmeia/Resources/Public/JS/additional.js?1795421682"></script></head>'))
 THEN RAISE EXCEPTION 'PG17: added script accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2('bmi-general-entry',old_html,asset_html)
 THEN RAISE EXCEPTION 'PG17: other official source accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,NULL)
 THEN RAISE EXCEPTION 'PG17: missing content accepted'; END IF;
 IF official_v3_at_source_watch_private.bmeia_asset_only_v2(v_source,old_html,
   replace(asset_html,'</body>','<script>dangerousChange()</script></body>'))
 THEN RAISE EXCEPTION 'PG17: injected inline script accepted'; END IF;
END $tests$;
SELECT 'BMEIA_PG17_ALL_NEGATIVE_CASES_PASS' AS tested;
ROLLBACK;
DO $rollback$
BEGIN
 IF to_regnamespace('official_v3_at_source_watch_private') IS NOT NULL
 OR to_regprocedure('official_v3_at_source_watch_private.bmeia_asset_only_v2(text,text,text)') IS NOT NULL
 THEN RAISE EXCEPTION 'PG17_ROLLBACK_LEAK'; END IF;
END $rollback$;
SELECT 'BMEIA_PG17_ROLLBACK_PASS' AS tested;