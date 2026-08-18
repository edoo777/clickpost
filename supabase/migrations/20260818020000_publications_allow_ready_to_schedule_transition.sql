-- Corrige publications_check_status_transition() (voir 20260817020100) : "ready_to_schedule" est
-- une colonne réelle du pipeline (une publication approuvée peut y être déplacée avant d'être
-- programmée, voir PublicationsKanban.tsx/PublicationsTable.tsx), mais n'était pas incluse dans
-- les statuts autorisés à devenir "scheduled" ou "publishing" — une publication qui y arrivait
-- restait bloquée en base, quel que soit le code applicatif. Additif : remplace seulement le corps
-- de la fonction, aucune table ni donnée touchée.

create or replace function public.publications_check_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'scheduled' and old.status not in ('approved', 'ready_to_schedule', 'scheduled', 'failed', 'publishing') then
    raise exception 'Transition de statut refusée : une publication doit être "approved" avant de devenir "scheduled" (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  -- "approved"/"ready_to_schedule"/"failed" -> "publishing" : verrou de course pris par la route de
  -- publication manuelle (approuvée mais pas encore "scheduled", ou nouvelle tentative après échec).
  if new.status = 'publishing' and old.status not in ('approved', 'ready_to_schedule', 'scheduled', 'failed', 'publishing') then
    raise exception 'Transition de statut refusée : "publishing" nécessite une approbation préalable (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  if new.status = 'published' and old.status not in ('approved', 'ready_to_schedule', 'scheduled', 'publishing', 'failed') then
    raise exception 'Transition de statut refusée : "published" nécessite une approbation préalable (statut actuel : %)', old.status
      using errcode = '22023';
  end if;

  return new;
end;
$$;
