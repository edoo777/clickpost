-- Verrou de sécurité au niveau base de données pour les transitions de statut sensibles de
-- `publications` — corrige un contournement réel de l'approbation trouvé lors d'un audit
-- autonome (2026-08-17) : plusieurs surfaces UI (Kanban, tableau, formulaire, calendrier)
-- permettaient de faire passer une publication directement à "scheduled" sans passer par
-- l'approbation, et le planificateur LinkedIn réel (`processDueLinkedInPublications`, voir
-- src/lib/linkedin/scheduler.ts) publie automatiquement tout ce qui est "scheduled" — un contenu
-- jamais approuvé pouvait donc être publié réellement sur LinkedIn sans validation humaine.
--
-- Les correctifs côté application (garde-fous UI + route API) restent nécessaires pour une bonne
-- expérience utilisateur, mais ne sont jamais la seule protection : n'importe quel appel direct au
-- client Supabase (RLS "publications_update_by_membership" n'autorise que sur l'appartenance au
-- workspace, jamais sur le statut ou le rôle) pouvait contourner tous les garde-fous côté client.
-- Ce trigger s'applique à toute écriture, y compris `service_role` (les triggers ne sont jamais
-- court-circuités par service_role, contrairement à la RLS) — les chemins légitimes existants
-- (planificateur, route de publication manuelle) respectent déjà cet ordre de transitions.

-- Une nouvelle ligne (INSERT — ex. création rapide depuis une colonne du Kanban) ne doit jamais
-- apparaître directement dans un statut qui suppose une approbation ou une publication déjà
-- effectuée : ces statuts ne sont atteignables que par une transition contrôlée (fonction
-- ci-dessous). Fonction séparée de la vérification UPDATE : `old` n'existe pas pour un INSERT.
create or replace function public.publications_check_insert_status()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status in ('scheduled', 'publishing', 'published') then
    raise exception 'Création refusée : une publication ne peut pas être créée directement avec le statut "%"', new.status
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger publications_enforce_insert_status
  before insert on public.publications
  for each row
  when (new.status in ('scheduled', 'publishing', 'published'))
  execute function public.publications_check_insert_status();

create or replace function public.publications_check_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'scheduled' and old.status not in ('approved', 'scheduled', 'failed') then
    raise exception 'Transition de statut refusée : une publication doit être "approved" avant de devenir "scheduled" (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  if new.status = 'publishing' and old.status not in ('scheduled', 'publishing') then
    raise exception 'Transition de statut refusée : "publishing" ne peut être atteint que depuis "scheduled" (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  -- "failed" est inclus : une tentative automatique ou manuelle échouée reste republiable
  -- manuellement (voir ManualPublishPanel/LinkedInPublishAction) sans repasser par l'approbation,
  -- puisque le contenu a déjà été approuvé avant sa première tentative.
  if new.status = 'published' and old.status not in ('approved', 'scheduled', 'publishing', 'failed') then
    raise exception 'Transition de statut refusée : "published" nécessite une approbation préalable (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger publications_enforce_status_transition
  before update on public.publications
  for each row
  when (new.status is distinct from old.status)
  execute function public.publications_check_status_transition();
