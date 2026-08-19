-- Suite du correctif précédent : la révocation directe sur `anon`/`authenticated` ne suffisait
-- pas tant qu'un GRANT EXECUTE subsistait sur PUBLIC (comportement par défaut de PostgreSQL à la
-- création d'une fonction, voir le même piège documenté dans
-- `20260729031509_f1_3_security_hardening.sql`). `ensure_default_subscription()` est un
-- déclencheur uniquement (comme `handle_new_user()`) : personne ne doit pouvoir l'invoquer
-- directement via /rest/v1/rpc.
revoke execute on function public.ensure_default_subscription() from public, anon, authenticated;
