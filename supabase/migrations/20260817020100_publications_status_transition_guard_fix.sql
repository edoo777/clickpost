-- Corrige la migration précédente (publications_status_transition_guard) : la première version
-- interdisait à tort deux transitions légitimes déjà utilisées par le code applicatif —
-- "publishing" -> "scheduled" (nouvelle tentative automatique non épuisée, voir
-- src/lib/linkedin/scheduler.ts recordAttempt) et "approved"/"failed" -> "publishing" (verrou de
-- course pris par la route de publication manuelle, src/app/api/social/linkedin/publish, avant
-- même que la publication ne soit passée par "scheduled"). Additif : remplace seulement le corps
-- de la fonction, aucune table ni donnée touchée.

create or replace function public.publications_check_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'scheduled' and old.status not in ('approved', 'scheduled', 'failed', 'publishing') then
    raise exception 'Transition de statut refusée : une publication doit être "approved" avant de devenir "scheduled" (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  -- "approved"/"failed" -> "publishing" : verrou de course pris par la route de publication
  -- manuelle (approuvée mais pas encore "scheduled", ou nouvelle tentative après échec).
  if new.status = 'publishing' and old.status not in ('approved', 'scheduled', 'failed', 'publishing') then
    raise exception 'Transition de statut refusée : "publishing" nécessite une approbation préalable (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  if new.status = 'published' and old.status not in ('approved', 'scheduled', 'publishing', 'failed') then
    raise exception 'Transition de statut refusée : "published" nécessite une approbation préalable (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  return new;
end;
$$;
