-- Corrige la migration précédente (20260818000000_ideas_derived_from.sql) : "Réutiliser ce
-- contenu" part toujours d'une Publication déjà publiée/prête (voir
-- src/components/publications/RepurposeContentModal.tsx), jamais d'une Idée — la contrainte de
-- clé étrangère pointait par erreur vers `ideas(id)`, ce qui aurait rejeté toute écriture réelle
-- (l'identifiant fourni est celui d'une publication, absent de la table `ideas`). Aucune ligne
-- n'a encore été écrite dans cette colonne (fonctionnalité tout juste ajoutée dans la même
-- session) : correction sûre, aucune donnée perdue.

alter table public.ideas drop constraint if exists ideas_derived_from_id_fkey;
alter table public.ideas add constraint ideas_derived_from_id_fkey
  foreign key (derived_from_id) references public.publications(id) on delete set null;
