-- Decode only serialized A-labels; reject rather than normalize submitted bytes.
-- RFC3492 arithmetic is bounded before multiplication (URL length <=500).
CREATE FUNCTION official_provenance_private.url_alabel(label text) RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' AS $$
DECLARE raw text:=pg_catalog.substr(label,5); result text:=''; p integer:=1; delimiter integer; n bigint:=128; i bigint:=0; bias bigint:=72; old_i bigint; w bigint; k bigint; t bigint; digit bigint; delta bigint; count bigint; c text; j integer; before_join text; after_join text; last_base text;
BEGIN
 delimiter:=CASE WHEN pg_catalog.strpos(pg_catalog.reverse(raw),'-')=0 THEN 0 ELSE pg_catalog.length(raw)-pg_catalog.strpos(pg_catalog.reverse(raw),'-')+1 END;
 IF delimiter>0 THEN result:=pg_catalog.substr(raw,1,delimiter-1);p:=delimiter+1;END IF;
 IF raw='' OR (p>pg_catalog.length(raw) AND result='') THEN RETURN NULL;END IF;
 WHILE p<=pg_catalog.length(raw) LOOP
  old_i:=i;w:=1;k:=36;
  LOOP
   IF p>pg_catalog.length(raw) THEN RETURN NULL;END IF;
   c:=pg_catalog.substr(raw,p,1);p:=p+1;
   digit:=CASE WHEN c BETWEEN 'a' AND 'z' THEN pg_catalog.ascii(c)-97 WHEN c BETWEEN '0' AND '9' THEN pg_catalog.ascii(c)-22 ELSE 36 END;
   IF digit>=36 OR digit>(2147483647-i)/w THEN RETURN NULL;END IF;i:=i+digit*w;
   t:=CASE WHEN k<=bias THEN 1 WHEN k>=bias+26 THEN 26 ELSE k-bias END;
   EXIT WHEN digit<t;
   IF w>2147483647/(36-t) THEN RETURN NULL;END IF;w:=w*(36-t);k:=k+36;
  END LOOP;
  count:=pg_catalog.length(result)+1;delta:=(i-old_i)/(CASE WHEN old_i=0 THEN 700 ELSE 2 END);delta:=delta+delta/count;k:=0;
  WHILE delta>455 LOOP delta:=delta/35;k:=k+36;END LOOP;bias:=k+36*delta/(delta+38);
  n:=n+i/count;i:=i%count;
  IF n>1114111 OR n BETWEEN 55296 AND 57343 OR n<128 THEN RETURN NULL;END IF;
  result:=pg_catalog.substr(result,1,i::integer)||pg_catalog.chr(n::integer)||pg_catalog.substr(result,i::integer+1);i:=i+1;
 END LOOP;
 IF result<>pg_catalog.normalize(result,'NFC') OR result~('^'||official_provenance_private.url_unicode_set('mark')) OR result !~ ('^'||official_provenance_private.url_unicode_set('valid')||'+$') OR (result~U&'[\0001-\0020\007F]' OR pg_catalog.translate(result,'#%./:<>?@[]^|'||pg_catalog.chr(92),'')<>result) THEN RETURN NULL;END IF;
 -- Compatibility with the pinned canonical Ada2.9.2 reader, including its
 -- historical first-joiner and bidi loop behavior; this is not a new IDNA policy.
 FOR j IN 1..pg_catalog.length(result) LOOP
  c:=pg_catalog.substr(result,j,1);
  IF c NOT IN (U&'\200C',U&'\200D') THEN CONTINUE;END IF;
  IF j>1 AND pg_catalog.substr(result,j-1,1)~official_provenance_private.url_unicode_set('virama') THEN RETURN result;END IF;
  IF c=U&'\200D' OR j=1 OR j=pg_catalog.length(result) THEN RETURN NULL;END IF;
  before_join:=pg_catalog.substr(result,1,j-1);after_join:=pg_catalog.substr(result,j+1);
  IF before_join~official_provenance_private.url_unicode_set('joining_left') AND after_join~official_provenance_private.url_unicode_set('joining_right') THEN RETURN result;END IF;
  RETURN NULL;
 END LOOP;
 last_base:=pg_catalog.regexp_replace(result,official_provenance_private.url_unicode_set('nsm')||'+$','');
 IF last_base='' THEN RETURN NULL;END IF;
 IF result~official_provenance_private.url_unicode_set('rtl') THEN
  IF result~('^'||official_provenance_private.url_unicode_set('ltr_first')) THEN
   IF pg_catalog.substr(last_base,1,pg_catalog.length(last_base)-1)!~('^'||official_provenance_private.url_unicode_set('ltr_allowed')||'*$') THEN RETURN NULL;END IF;
  ELSE
   IF last_base!~('^'||official_provenance_private.url_unicode_set('rtl_allowed')||'+$') OR last_base!~(official_provenance_private.url_unicode_set('rtl_last')||'$') OR (last_base~official_provenance_private.url_unicode_set('en') AND last_base~official_provenance_private.url_unicode_set('an')) THEN RETURN NULL;END IF;
  END IF;
 END IF;
 RETURN result;
END $$;
CREATE FUNCTION official_provenance_private.url_host(host text) RETURNS boolean LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' AS $$
DECLARE labels text[]; label text; address inet; raw text; parts text[]:='{}'; j integer; run integer:=0; best integer:=0; best_start integer:=0; canonical text;
BEGIN
 IF host='' OR host<>pg_catalog.lower(host) THEN RETURN false;END IF;
 IF pg_catalog.left(host,1)='[' THEN
  IF host!~'^\[[0-9a-f:]+\]$' THEN RETURN false;END IF;
  BEGIN address:=pg_catalog.substr(host,2,pg_catalog.length(host)-2)::inet;EXCEPTION WHEN invalid_text_representation THEN RETURN false;END;
  IF pg_catalog.family(address)<>6 THEN RETURN false;END IF;
  raw:=pg_catalog.encode(pg_catalog.substring(pg_catalog.inet_send(address),5,16),'hex');
  FOR j IN 1..8 LOOP
   parts[j]:=COALESCE(NULLIF(pg_catalog.ltrim(pg_catalog.substr(raw,(j-1)*4+1,4),'0'),''),'0');
   IF parts[j]='0' THEN run:=run+1;IF run>best THEN best:=run;best_start:=j-run+1;END IF;ELSE run:=0;END IF;
  END LOOP;
  IF best<2 THEN canonical:=pg_catalog.array_to_string(parts,':');
  ELSE canonical:=COALESCE(pg_catalog.array_to_string(parts[1:best_start-1],':'),'')||'::'||COALESCE(pg_catalog.array_to_string(parts[best_start+best:8],':'),'');END IF;
  RETURN host='['||canonical||']';
 END IF;
 IF (host~U&'[\0001-\0020\007F]' OR pg_catalog.translate(host,'#%/:<>?@[]^|'||pg_catalog.chr(92),'')<>host) THEN RETURN false;END IF;
 labels:=pg_catalog.string_to_array(host,'.');
 FOREACH label IN ARRAY labels LOOP IF pg_catalog.left(label,4)='xn--' AND official_provenance_private.url_alabel(label) IS NULL THEN RETURN false;END IF;END LOOP;
 label:=labels[pg_catalog.array_length(labels,1)];IF label='' THEN label:=labels[pg_catalog.array_length(labels,1)-1];END IF;
 -- "Ends in a number" triggers IPv4 parsing. Only its canonical four decimal
 -- octets are unchanged by the WHATWG serializer; hex/octal/short/trailing-dot
 -- spellings must not pass as ordinary DNS names.
 IF label~'^([0-9]+|0x[0-9a-f]*)$' THEN
  IF host!~'^(0|[1-9][0-9]{0,2})([.](0|[1-9][0-9]{0,2})){3}$' THEN RETURN false;END IF;
  FOREACH label IN ARRAY labels LOOP IF label::integer>255 THEN RETURN false;END IF;END LOOP;
 END IF;
 RETURN true;
END $$;
CREATE FUNCTION official_provenance_private.canonical_url(value text,role text) RETURNS boolean LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' AS $$
DECLARE rest text; authority text; host text; port text; path text; query text; fragment text; position integer; a text[];
BEGIN
 IF role NOT IN ('extractor','identity') OR pg_catalog.length(value) NOT BETWEEN 12 AND 500 OR value!~'^[!-~]+$' OR pg_catalog.left(value,8)<>'https://' THEN RETURN false;END IF;
 rest:=pg_catalog.substr(value,9);position:=pg_catalog.strpos(rest,'/');IF position=0 THEN RETURN false;END IF;
 authority:=pg_catalog.substr(rest,1,position-1);rest:=pg_catalog.substr(rest,position);
 a:=pg_catalog.regexp_match(authority,'^(\[[0-9a-f:]+\]|[^:]+)(:([0-9]+))?$');
 IF a IS NULL THEN RETURN false;END IF;host:=a[1];port:=a[3];
 IF NOT official_provenance_private.url_host(host) OR host='localhost' OR host LIKE '%.local' THEN RETURN false;END IF;
 IF port IS NOT NULL THEN
  IF port!~'^(0|[1-9][0-9]{0,4})$' THEN RETURN false;END IF;
  IF port::integer>65535 OR port='443' THEN RETURN false;END IF;
 END IF;
 IF role='identity' AND (port IS NOT NULL OR host LIKE '%.localhost' OR pg_catalog.strpos(value,'*')>0 OR pg_catalog.strpos(rest,'#')>0) THEN RETURN false;END IF;
 position:=pg_catalog.strpos(rest,'#');IF position>0 THEN fragment:=pg_catalog.substr(rest,position+1);rest:=pg_catalog.substr(rest,1,position-1);END IF;
 position:=pg_catalog.strpos(rest,'?');IF position>0 THEN query:=pg_catalog.substr(rest,position+1);rest:=pg_catalog.substr(rest,1,position-1);END IF;path:=rest;
 IF (path~'["<>`{}]' OR pg_catalog.strpos(path,pg_catalog.chr(92))>0) OR path~'/(\.|%2[eE]){1,2}(/|$)' THEN RETURN false;END IF;
 IF query~'["<>]' OR pg_catalog.strpos(query,pg_catalog.chr(39))>0 OR fragment~'["<>`]' THEN RETURN false;END IF;
 RETURN true;
END $$;
