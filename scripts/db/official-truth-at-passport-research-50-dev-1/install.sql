-- Official Truth AT 50-passport RESEARCH_ONLY staging; zero positive rules.
-- Source: verified immutable 2026-11-06 Austrian BMI visa matrix (3-byte-hash bound originals).
-- Original user's passport-priority.csv SHA256: 4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358.
-- The special XK country code is researched but deliberately not recognized as ISO 3166.
-- This script never calls V3 MA1 owner approval, changes a protected schema,
-- or publishes a rule. It may run in DEV ONLY. No user data.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';
DO $preflight$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.at_dev_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-50-RESEARCH-1'
    OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
    OR to_regnamespace('jetnity_entry_research_private') IS NOT NULL
    OR NOT official_v3_at_private.source_current_v3()
    OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
    OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2 WHERE source_id='bmi-visa-nationality-matrix'
     AND editorial_edition='2026-11-06' AND body_bytes=498415
     AND body_digest='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
     AND body_digest=encode(sha256(original_body),'hex'))<>1 THEN
    RAISE EXCEPTION 'AT_50_RESEARCH_EXACT_DEV_SOURCE_REQUIRED' USING ERRCODE='P7981'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF NOT pg_try_advisory_xact_lock(771101,1) OR NOT pg_try_advisory_xact_lock(771102,1) THEN
 RAISE EXCEPTION 'AT_50_RESEARCH_COMPTETING_PROTECTED_OPERATION' USING ERRCODE='P7981'; END IF;
END $preflight$;
CREATE TEMP TABLE at_50_before(value jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO at_50_before VALUES(official_v3_guard_private.catalog_status_v1());
CREATE TEMP TABLE at_50_priority(
 rank integer PRIMARY KEY CHECK(rank BETWEEN 1 AND 50),
 code text NOT NULL UNIQUE CHECK(code ~ '^[A-Z]{2}$'),
 bmi_html_name text NOT NULL
) ON COMMIT DROP;
INSERT INTO at_50_priority(rank,code,bmi_html_name) VALUES
(1,'IN','Indien'),
(2,'TR','T&uuml;rkei'),
(3,'CN','China'),
(4,'DE','Deutschland'),
(5,'PL','Polen'),
(6,'IT','Italien'),
(7,'US','Vereinigte Staaten von Amerika'),
(8,'UA','Ukraine'),
(9,'RO','Rum&auml;nien'),
(10,'FR','Frankreich'),
(11,'NL','Niederlande'),
(12,'GB','Gro&szlig;britannien und Nordirland'),
(13,'AT','&Ouml;sterreich'),
(14,'ES','Spanien'),
(15,'HU','Ungarn'),
(16,'SY','Syrien'),
(17,'CZ','Tschechische Republik'),
(18,'AF','Afghanistan'),
(19,'CH','Schweiz'),
(20,'RU','Russische F&ouml;deration'),
(21,'HR','Kroatien'),
(22,'BE','Belgien'),
(23,'IQ','Irak'),
(24,'PT','Portugal'),
(25,'BG','Bulgarien'),
(26,'BR','Brasilien'),
(27,'GR','Griechenland'),
(28,'IR','Iran'),
(29,'SK','Slowakei'),
(30,'PK','Pakistan'),
(31,'ER','Eritrea'),
(32,'TH','Thailand'),
(33,'SO','Somalia'),
(34,'VN','Vietnam'),
(35,'SE','Schweden'),
(36,'NG','Nigeria'),
(37,'EG','&Auml;gypten'),
(38,'XK','Kosovo'),
(39,'KR','S&uuml;dkorea'),
(40,'LK','Sri Lanka'),
(41,'DK','D&auml;nemark'),
(42,'PH','Philippinen'),
(43,'JP','Japan'),
(44,'LB','Libanon'),
(45,'RS','Serbien'),
(46,'LT','Litauen'),
(47,'CA','Kanada'),
(48,'CM','Kamerun'),
(49,'MA','Marokko'),
(50,'IL','Israel');
CREATE TEMP TABLE at_50_raw ON COMMIT DROP AS
WITH src AS(SELECT convert_from(original_body,'UTF8') html FROM official_v3_at_private.whole_originals_v2
 WHERE source_id='bmi-visa-nationality-matrix'),
chunks AS(SELECT ord,segment FROM src CROSS JOIN LATERAL
 regexp_split_to_table(html,'<details>[[:space:]]*<summary([[:space:]]+class="sum_letter")?>')
 WITH ORDINALITY AS p(segment,ord)),
named AS(SELECT ord,substring(segment FROM '^([^<]+)</summary>') AS country,
 btrim(split_part(segment,'</summary>',2),chr(32)||chr(9)||chr(10)||chr(13)) AS detail_fragment FROM chunks)
SELECT p.rank,p.code,p.bmi_html_name,n.detail_fragment FROM at_50_priority p
LEFT JOIN named n ON p.bmi_html_name=n.country AND n.detail_fragment LIKE '<dl>%';
-- Exactly 49 original nationality matrix sections + 1 Austrian home-country entry
-- checked against the second official BMI general source. No invented AT matrix row.
DO $source_shape$
BEGIN
 IF (SELECT count(*) FROM at_50_priority)<>50
 OR (SELECT count(*) FROM at_50_raw)<>50
 OR (SELECT count(*) FROM at_50_raw WHERE detail_fragment IS NOT NULL)<>49
 OR (SELECT count(*) FROM at_50_raw WHERE code='AT' AND detail_fragment IS NULL)<>1
 OR (SELECT string_agg(code,' ' ORDER BY rank) FROM at_50_priority) IS DISTINCT FROM
  'IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'
 THEN RAISE EXCEPTION 'AT_50_SOURCE_PRIORITY_OR_MATRIX_MISMATCH' USING ERRCODE='P7981'; END IF;
END $source_shape$;
CREATE TEMP TABLE at_50_matrix ON COMMIT DROP AS
WITH cell AS(SELECT r.rank,r.code,dd.ordinality,dd.m[1] AS raw_cell FROM at_50_raw r
 CROSS JOIN LATERAL regexp_matches(r.detail_fragment,'(?s)<dd>(.*?)</dd>','g')
 WITH ORDINALITY AS dd(m,ordinality))
SELECT rank,code,count(*) AS cell_count,jsonb_agg(raw_cell ORDER BY ordinality) AS cells
FROM cell GROUP BY rank,code;
DO $matrix_shape$
BEGIN
 IF (SELECT count(*) FROM at_50_matrix)<>49
 OR EXISTS(SELECT 1 FROM at_50_matrix WHERE cell_count<>8)
 OR (SELECT cells->>0 FROM at_50_matrix WHERE code='CH') IS DISTINCT FROM 'EU-Freiz&uuml;gigkeit'
 OR (SELECT cells->>0 FROM at_50_matrix WHERE code='DE') IS DISTINCT FROM 'EU-Freiz&uuml;gigkeit'
 OR (SELECT cells->>0 FROM at_50_matrix WHERE code='IN') IS DISTINCT FROM 'Ja'
 THEN RAISE EXCEPTION 'AT_50_OFFICIAL_MATRIX_STRUCTURE_CHANGED' USING ERRCODE='P7981'; END IF;
END $matrix_shape$;
CREATE SCHEMA jetnity_entry_research_private;
REVOKE ALL ON SCHEMA jetnity_entry_research_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_entry_research_private.passport_visa_v1(
 destination_code text NOT NULL DEFAULT 'AT' CHECK(destination_code='AT'),
 rank integer NOT NULL UNIQUE CHECK(rank BETWEEN 1 AND 50),
 citizenship_country_code text NOT NULL CHECK(citizenship_country_code ~ '^[A-Z]{2}$'),
 official_bmi_name_html text NOT NULL,
 raw_matrix_cells jsonb,
 matrix_evidence_present boolean NOT NULL,
 source_matrix_sha256 text NOT NULL CHECK(source_matrix_sha256='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'),
 priority_file_sha256 text NOT NULL CHECK(priority_file_sha256='4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358'),
 source_edition date NOT NULL CHECK(source_edition='2026-11-06'::date),
 source_retrieved_at timestamptz NOT NULL,
 review_state text NOT NULL DEFAULT 'RESEARCH_ONLY' CHECK(review_state='RESEARCH_ONLY'),
 accepted_facts integer NOT NULL DEFAULT 0 CHECK(accepted_facts=0),
 publishing_enabled boolean NOT NULL DEFAULT false CHECK(publishing_enabled=false),
 PRIMARY KEY(destination_code,citizenship_country_code),
 CHECK(matrix_evidence_present = (raw_matrix_cells IS NOT NULL)),
 CHECK((citizenship_country_code='AT' AND NOT matrix_evidence_present)
    OR (citizenship_country_code<>'AT' AND matrix_evidence_present AND jsonb_array_length(raw_matrix_cells)=8))
);
CREATE TABLE jetnity_entry_research_private.topic_sources_v1(
 destination_code text NOT NULL DEFAULT 'AT' CHECK(destination_code='AT'),
 topic text NOT NULL,
 official_research_url text,
 context_note text NOT NULL,
 direct_official_form_url text,
 official_form_name text,
 cost_information text,
 fake_site_warning text,
 verification_state text NOT NULL DEFAULT 'RESEARCH_ONLY' CHECK(verification_state='RESEARCH_ONLY'),
 positive_publication_allowed boolean NOT NULL DEFAULT false CHECK(positive_publication_allowed=false),
 PRIMARY KEY(destination_code,topic),
 CHECK(official_research_url IS NULL OR official_research_url LIKE 'https://%'),
 CHECK((direct_official_form_url IS NULL AND official_form_name IS NULL)
   OR (direct_official_form_url LIKE 'https://%' AND official_form_name IS NOT NULL
      AND fake_site_warning IS NOT NULL AND cost_information IS NOT NULL))
);
CREATE TABLE jetnity_entry_research_private.passport_topics_v1(
 destination_code text NOT NULL DEFAULT 'AT' CHECK(destination_code='AT'),
 passport_code text NOT NULL,
 topic text NOT NULL,
 status text NOT NULL DEFAULT 'derzeit nicht verfügbar' CHECK(status='derzeit nicht verfügbar'),
 verified_rule_ref text,
 accepted_facts integer NOT NULL DEFAULT 0 CHECK(accepted_facts=0),
 PRIMARY KEY(destination_code,passport_code,topic),
 FOREIGN KEY(destination_code,passport_code) REFERENCES jetnity_entry_research_private.passport_visa_v1(destination_code,citizenship_country_code),
 FOREIGN KEY(destination_code,topic) REFERENCES jetnity_entry_research_private.topic_sources_v1(destination_code,topic),
 CHECK(verified_rule_ref IS NULL)
);
INSERT INTO jetnity_entry_research_private.passport_visa_v1(
 rank,citizenship_country_code,official_bmi_name_html,raw_matrix_cells,
 matrix_evidence_present,source_matrix_sha256,priority_file_sha256,source_edition,source_retrieved_at)
SELECT r.rank,r.code,r.bmi_html_name,m.cells,m.cells IS NOT NULL,
 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',
 '4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358',
 '2026-11-06'::date,(SELECT source_retrieved_at FROM official_v3_at_private.whole_originals_v2
 WHERE source_id='bmi-visa-nationality-matrix')
FROM at_50_raw r LEFT JOIN at_50_matrix m ON m.code=r.code ORDER BY r.rank;
INSERT INTO jetnity_entry_research_private.topic_sources_v1(
 topic,official_research_url,context_note,direct_official_form_url,official_form_name,cost_information,fake_site_warning)
VALUES
('visa','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html','Die BMI-Liste unterscheidet gewöhnliche, diplomatische und Sonderpässe; eine Tabellenzeile allein autorisiert keine allgemeine positive Aussage.',NULL,NULL,NULL,NULL),
('electronic_travel_authorization','https://travel-europe.europa.eu/etias/faq','ETIAS ist am 17.11.2026 laut EU noch nicht in Betrieb. Keine Anträge und keine Gebühr fällig; nach Start EUR 20 bei direkter EU-Antragstellung.',NULL,NULL,'Derzeit keine Anmeldung; bei späterem Start EUR 20 (Befreiungen beachten)','Nur die verlinkte amtliche Stelle verwenden. Drittanbieter können unnötige Zusatzgebühren verlangen oder persönliche Daten sammeln.'),
('stay_limit','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html','Drittstaaten grundsätzlich 90 Tage in 180 Tagen, EU/EWR/CH-Freizügigkeit ausgenommen; Sonderabkommen gesondert prüfen.',NULL,NULL,NULL,NULL),
('passport','https://eausweise.oesterreich.gv.at/de/themen/bauen_und_wohnen/umzug/2/1/Seite.180653','Drittstaaten-Passpflicht, andere Staatsangehörigkeiten gesondert prüfen.',NULL,NULL,NULL,NULL),
('identity_document','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html','Personalausweis wird nach Nationalität und Dokumentklasse unterschieden.',NULL,NULL,NULL,NULL),
('passport_validity','https://eausweise.oesterreich.gv.at/de/themen/bauen_und_wohnen/umzug/2/1/Seite.180653','Drittstaaten grundsätzlich 3 Monate über Schengen-Ausreise und in letzten 10 Jahren ausgestellt; EU/EWR/CH nach anderer Regel.',NULL,NULL,NULL,NULL),
('blank_passport_pages','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/','Botschaft verlangt zwei freie Seiten für dortige Visa-C/D-Anträge, nicht als allgemeine Einreise-Regel.',NULL,NULL,NULL,NULL),
('required_vaccinations',NULL,'Keine universelle Einreiseimpfpflicht nachgewiesen; individuelle Ausgangs-/Transitländer und aktuelle Schutzregeln prüfen.',NULL,NULL,NULL,NULL),
('recommended_vaccinations','https://www.gesundheit.gv.at/leben/gesundheitsvorsorge/auf-reisen/impfschutz-auf-reisen.html','Gesundheitsportal: persönliche Reiseimpfungen abhängig von Route, Gesundheitsstatus, Aufenthaltsdauer; keine Einreise-Pflicht daraus ableiten.',NULL,NULL,NULL,NULL),
('health_measures','https://www.gesundheit.gv.at/leben/gesundheitsvorsorge/auf-reisen/impfschutz-auf-reisen.html','Allgemeine Reisegesundheit, keine verbindliche für jeden Pass geltende aktuelle Einreisevorschrift.',NULL,NULL,NULL,NULL),
('health_documents',NULL,'Keine allgemein gültige aktuelle amtliche Gesundheitsformularpflicht nachgewiesen.',NULL,NULL,NULL,NULL),
('insurance','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/','Für österreichisches Schengen-Visum C verlangt die Botschaft eine Reise-Krankenversicherung; nicht für jeden visafreien Reisenden.',NULL,NULL,NULL,NULL),
('entry_forms','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/','Schengenvisum C nur bei individuell begründeter Antragspflicht; Formular selbst ist gebührenfrei.','https://www.bmeia.gv.at/fileadmin/user_upload/Allgemein/Formulare_ab_2023/Antragsformular_Visum_C1_Schengenvisum_DE-ES.pdf?1698071193=','Antragsformular Schengen-Visum C','Formular kostenlos; Visagebühr bei Antrag gesondert','Nur die verlinkte amtliche Stelle verwenden. Drittanbieter können unnötige Zusatzgebühren verlangen oder persönliche Daten sammeln.'),
('form_costs','https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en','Schengenvisum C EU-Regel: typischerweise EUR 90 Erwachsene / EUR 45 Kinder 6-12, Ausnahmen und Servicegebühren beachten.','https://www.bmeia.gv.at/fileadmin/user_upload/Allgemein/Formulare_ab_2023/Antragsformular_Visum_C1_Schengenvisum_DE-ES.pdf?1698071193=','Antragsformular Schengen-Visum C','Formular kostenlos; Visum C meist 90 EUR Erwachsene / 45 EUR Kinder 6–12','Nur die verlinkte amtliche Stelle verwenden. Drittanbieter können unnötige Zusatzgebühren verlangen oder persönliche Daten sammeln.'),
('fraud_warnings','https://travel-europe.europa.eu/etias/faq','EU warnt vor inoffiziellen ETIAS-Seiten, die Daten sammeln und zusätzliche Gebühren verlangen.',NULL,NULL,'ETIAS aktuell nicht beantragbar','Nur die verlinkte amtliche Stelle verwenden. Drittanbieter können unnötige Zusatzgebühren verlangen oder persönliche Daten sammeln.'),
('entry_fees','https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en','EU-Schengenvisumgebühr nur wenn Visumantrag tatsächlich benötigt und anwendbar; Ausnahmen nicht pauschal ausschliessen.',NULL,NULL,NULL,NULL),
('onward_return_ticket','https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en','EU-Visumantrag verlangt Belege für Rückkehrabsicht, nicht in jedem Fall zwingend ein gekauftes Rückflugticket.',NULL,NULL,NULL,NULL),
('financial_means','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/','Nachweis ausreichender Geldmittel für Visumantrag; keine belegte pauschale Summe für alle Passinhaber.',NULL,NULL,NULL,NULL),
('booking_or_travel_document','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/','Unterkunfts- oder Einladungsnachweis für Visumantrag, nicht automatisch für alle.',NULL,NULL,NULL,NULL),
('transit','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html','BMI-Zeilen enthalten separate Flughafentransitvisumpflicht und Ausnahmen je Pass/Aufenthaltstitel.',NULL,NULL,NULL,NULL),
('minors','https://www.oesterreich.gv.at/.syndication?pageId=fd7753ff-b8a0-47d2-9f56-9a6ec5e6cd90','Amtliche Elternreisehinweise; Einzelfall und Zielland-Rechtslage prüfen.',NULL,NULL,NULL,NULL),
('parental_consent','https://www.oesterreich.gv.at/.syndication?pageId=fd7753ff-b8a0-47d2-9f56-9a6ec5e6cd90','Schriftliche Einverständniserklärung je nach Reisebegleitung und Zielstaat empfohlen, keine pauschale österreichische Pflicht belegt.',NULL,NULL,NULL,NULL),
('customs','https://www.bmf.gv.at/themen/zoll/Kontrolle-von-Barmitteln.html','Barmittel ab 10.000 EUR bei EU-Ein/Ausreise deklarieren; nur falls diese Grenze überschritten ist.','https://afs-formulare.bmf.gv.at/IDOC/FormServlet?fid=7306','Barmittelerklärung CC2 (DOK-Online)','Formularkosten amtlich nicht beziffert','Nur die verlinkte amtliche Stelle verwenden. Drittanbieter können unnötige Zusatzgebühren verlangen oder persönliche Daten sammeln.'),
('dual_nationals',NULL,'Keine umfassende amtliche Regel für mehrere Staatsangehörigkeiten in diesem Review belegt.',NULL,NULL,NULL,NULL),
('recent_changes','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html','BMI-Liste redaktioneller Stand 06.11.2026; EES läuft, ETIAS noch nicht beantragbar.',NULL,NULL,NULL,NULL),
('official_actions','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/','Amtliche Direktlinks für tatsächlich benötigte Anträge; Fake-/Drittanbieter-Warnung und Kosten nur bei belegtem Fall.','https://www.bmeia.gv.at/fileadmin/user_upload/Allgemein/Formulare_ab_2023/Antragsformular_Visum_C1_Schengenvisum_DE-ES.pdf?1698071193=','Antragsformular Schengen-Visum C','Formular kostenlos; Visa-Antragsgebühren individuell','Nur die verlinkte amtliche Stelle verwenden. Drittanbieter können unnötige Zusatzgebühren verlangen oder persönliche Daten sammeln.');
INSERT INTO jetnity_entry_research_private.passport_topics_v1(passport_code,topic)
SELECT v.citizenship_country_code,s.topic FROM jetnity_entry_research_private.passport_visa_v1 v
CROSS JOIN jetnity_entry_research_private.topic_sources_v1 s;
-- Every new research table has forced RLS and NO external API entry point.
ALTER TABLE jetnity_entry_research_private.passport_visa_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_entry_research_private.passport_visa_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_entry_research_private.topic_sources_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_entry_research_private.topic_sources_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_entry_research_private.passport_topics_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_entry_research_private.passport_topics_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON jetnity_entry_research_private.passport_visa_v1 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY owner_only ON jetnity_entry_research_private.topic_sources_v1 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY owner_only ON jetnity_entry_research_private.passport_topics_v1 TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_entry_research_private FROM PUBLIC,anon,authenticated,service_role;
-- Research rows cannot be modified into official results.
CREATE FUNCTION jetnity_entry_research_private.deny_change_v1() RETURNS trigger
 LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $deny$
 BEGIN RAISE EXCEPTION 'RESEARCH_ONLY immutable origin' USING ERRCODE='P7982'; END $deny$;
REVOKE ALL ON FUNCTION jetnity_entry_research_private.deny_change_v1() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_entry_research_private.passport_visa_v1
 FOR EACH ROW EXECUTE FUNCTION jetnity_entry_research_private.deny_change_v1();
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_entry_research_private.topic_sources_v1
 FOR EACH ROW EXECUTE FUNCTION jetnity_entry_research_private.deny_change_v1();
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_entry_research_private.passport_topics_v1
 FOR EACH ROW EXECUTE FUNCTION jetnity_entry_research_private.deny_change_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_entry_research_private.passport_visa_v1
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_entry_research_private.deny_change_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_entry_research_private.topic_sources_v1
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_entry_research_private.deny_change_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_entry_research_private.passport_topics_v1
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_entry_research_private.deny_change_v1();
DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1)<>50
  OR (SELECT count(*) FROM jetnity_entry_research_private.passport_topics_v1)<>1300
  OR (SELECT count(*) FROM jetnity_entry_research_private.topic_sources_v1)<>26
  OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1
      WHERE matrix_evidence_present)<>49
  OR EXISTS(SELECT 1 FROM jetnity_entry_research_private.passport_visa_v1 WHERE review_state<>'RESEARCH_ONLY' OR accepted_facts<>0 OR publishing_enabled)
  OR EXISTS(SELECT 1 FROM jetnity_entry_research_private.passport_topics_v1 WHERE accepted_facts<>0 OR status<>'derzeit nicht verfügbar')
  OR EXISTS(SELECT 1 FROM jetnity_entry_research_private.topic_sources_v1 WHERE direct_official_form_url IS NOT NULL
      AND (fake_site_warning IS NULL OR cost_information IS NULL OR official_form_name IS NULL))
  OR has_schema_privilege('anon','jetnity_entry_research_private','USAGE')
  OR has_schema_privilege('authenticated','jetnity_entry_research_private','USAGE')
  OR has_schema_privilege('service_role','jetnity_entry_research_private','USAGE')
  OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT value FROM at_50_before LIMIT 1)
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_50_RESEARCH_BOUNDARY_CHANGED' USING ERRCODE='P7982'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
