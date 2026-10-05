-- Unrelated sentinel objects. Rollback must preserve them.
-- Not part of the account-count package identity.
CREATE TABLE IF NOT EXISTS public.jetnity_rollout_sentinel (
  id integer PRIMARY KEY,
  note text NOT NULL
);

INSERT INTO public.jetnity_rollout_sentinel (id, note)
VALUES (1, 'unrelated-sentinel')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.jetnity_rollout_sentinel IS
  'LOCAL rehearsal sentinel. Not an account-count object. Rollback must leave it in place.';
