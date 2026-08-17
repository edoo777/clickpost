-- Corrige une politique RLS trop permissive trouvée lors d'un audit de sécurité autonome
-- (2026-08-17) : `prompt_overrides_select_authenticated` laissait n'importe quel utilisateur
-- authentifié lire la table `prompt_overrides` entière via PostgREST
-- (`/rest/v1/prompt_overrides?select=*`), exposant le texte de configuration des prompts IA
-- (garde-fous, personnalisations internes) de TOUS les workspaces — jamais une fuite de données
-- client entre workspaces (cette table est globale à la plateforme, pas par workspace), mais une
-- exposition non voulue de configuration propriétaire à n'importe quel compte inscrit.
--
-- `prompt_overrides` reste conçue comme service_role uniquement (voir service-role.ts) : les
-- routes IA doivent malgré tout pouvoir lire, avec la session normale de l'utilisateur appelant,
-- uniquement les deux champs nécessaires à l'injection dans son propre prompt, jamais le reste
-- (nom, statut, historique, identifiant de l'administrateur ayant modifié). Remplacé par une
-- fonction SECURITY DEFINER dédiée, à portée strictement limitée.

drop policy if exists "prompt_overrides_select_authenticated" on public.prompt_overrides;
-- Plus aucune politique de lecture cliente directe : seul service_role (Admin) ou cette fonction
-- peuvent désormais lire cette table.

create or replace function public.get_active_prompt_override(p_key text)
returns table(system_prompt_override text, extra_instructions text)
language sql
security definer
set search_path = public
stable
as $$
  select po.system_prompt_override, po.extra_instructions
  from public.prompt_overrides po
  where po.key = p_key and po.is_active = true;
$$;

revoke all on function public.get_active_prompt_override(text) from public;
revoke all on function public.get_active_prompt_override(text) from anon;
grant execute on function public.get_active_prompt_override(text) to authenticated;
