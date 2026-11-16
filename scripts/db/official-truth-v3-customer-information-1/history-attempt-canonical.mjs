// Finite attempt-preimage shortcut only. Every miss keeps the complete general
// canonical path. All reuse belongs to the existing invocation-local16KiB memo.
import { historyFixedCanonicalBlock } from './history-canonical-fixed.mjs'
import { historyCanonicalShape, historyCanonicalExact, historyCanonicalParts,
  historyCanonicalExpressions } from './history-command-canonical.mjs'

const attempt = historyCanonicalShape(['subject', 'claim', 'leasedJob', 'authority'])
const claim = historyCanonicalShape(['operationId', 'jobKey', 'leaseId', 'leaseMilliseconds'])

/** The only admitted root is depth0. Claim and leasedJob are depth1; the reused
 * job serializer checks its actual children at depth2 and lease leaves at3. */
export function historyAttemptCanonicalBlock(valueExpr, depthExpr, targetExpr) {
  historyCanonicalExpressions(valueExpr, depthExpr, targetExpr)
  return `DECLARE hca_value jsonb:=(${valueExpr}); hca_depth integer:=(${depthExpr});
  hca_claim jsonb; hca_job jsonb; hca_authority jsonb; hca_subject jsonb;
  hca_claim_text text COLLATE "default"; hca_job_text text COLLATE "default";
  hca_authority_text text COLLATE "default"; hca_subject_text text COLLATE "default";
  hca_parts text[] COLLATE "default"; hca_claim_parts text[] COLLATE "default";
BEGIN
  ${targetExpr}:=NULL;
  IF hca_value IS NOT NULL AND hca_depth=0 AND jsonb_typeof(hca_value)='object' THEN
    IF ${historyCanonicalExact('hca_value', attempt)} THEN
      hca_authority:=hca_value->'authority'; hca_subject:=hca_value->'subject';
      IF jsonb_typeof(hca_authority)='object' AND jsonb_typeof(hca_subject)='object' THEN
        hca_authority_text:=subtree_memo->>('1:'||hca_authority::text);
        hca_subject_text:=subtree_memo->>('1:'||hca_subject::text);
        IF hca_authority_text IS NOT NULL AND hca_subject_text IS NOT NULL THEN
          hca_claim:=hca_value->'claim'; hca_job:=hca_value->'leasedJob';
          IF jsonb_typeof(hca_claim)='object' THEN
            IF ${historyCanonicalExact('hca_claim', claim)} THEN
              hca_claim_parts:=${historyCanonicalParts('hca_claim', claim)};
              IF array_position(hca_claim_parts,NULL::text) IS NULL THEN
                hca_claim_text:='{'||array_to_string(hca_claim_parts,',')||'}';
              END IF;
            END IF;
          END IF;
          IF hca_claim_text IS NOT NULL THEN
            ${historyFixedCanonicalBlock('hca_job', '1', 'hca_job_text', ['research', 'discovery'])}
            IF hca_job_text IS NOT NULL THEN
              hca_parts:=${historyCanonicalParts('hca_value', attempt, { authority: 'hca_authority_text',
    claim: 'hca_claim_text', leasedJob: 'hca_job_text', subject: 'hca_subject_text' })};
              IF array_position(hca_parts,NULL::text) IS NULL THEN
                ${targetExpr}:='{'||array_to_string(hca_parts,',')||'}';
              END IF;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
END;`
}
