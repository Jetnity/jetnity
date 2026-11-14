    -- Reuse only bytes computed at the same canonical depth in this invocation.
    -- Two exact-text entries share a 64KiB key+value cap. No validation is skipped.
    DECLARE member_name text; child_value jsonb; child_key text COLLATE "C";
      child_canonical text; child_bytes bigint; canonical_parts text[]:='{}';
    BEGIN
      IF official_v3_jobs_private.exact_keys_v1(e,
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId']) IS TRUE THEN
        -- This is the original canonical object's exact ASCII member order.
        FOREACH member_name IN ARRAY ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId'] LOOP
          child_value:=e->member_name;
          IF member_name IN ('expected','next') THEN
            child_key:=child_value::text;
            IF child_key COLLATE "C" = canonical_memo_key_one COLLATE "C" THEN
              child_canonical:=canonical_memo_value_one;
            ELSIF child_key COLLATE "C" = canonical_memo_key_two COLLATE "C" THEN
              child_canonical:=canonical_memo_value_two;
            ELSE
              child_canonical:=official_v3_jobs_private.canonical_v1(child_value,1);
              child_bytes:=octet_length(child_key)::bigint+octet_length(child_canonical)::bigint;
              IF child_bytes<=65536 THEN
                IF child_bytes+canonical_memo_bytes_two<=65536 THEN
                  canonical_memo_key_one:=canonical_memo_key_two;
                  canonical_memo_value_one:=canonical_memo_value_two;
                  canonical_memo_bytes_one:=canonical_memo_bytes_two;
                ELSE
                  canonical_memo_key_one:=NULL; canonical_memo_value_one:=NULL; canonical_memo_bytes_one:=0;
                END IF;
                canonical_memo_key_two:=child_key; canonical_memo_value_two:=child_canonical;
                canonical_memo_bytes_two:=child_bytes::integer;
              END IF;
            END IF;
          ELSE
            child_canonical:=official_v3_jobs_private.canonical_v1(child_value,1);
          END IF;
          canonical_parts:=array_append(canonical_parts,'"'||member_name||'":'||child_canonical);
        END LOOP;
        envelope_canonical:='{'||array_to_string(canonical_parts,',')||'}';
      ELSE
        envelope_canonical:=official_v3_jobs_private.canonical_v1(e,0);
      END IF;
    END;
