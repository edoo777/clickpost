-- Formulaire de contact du site public (/contact) — additif, aucune table existante modifiée.
-- Écriture publique uniquement (RLS) : n'importe quel visiteur non authentifié peut soumettre un
-- message, mais AUCUN rôle client (anon ou authenticated) ne peut relire, modifier ou supprimer
-- les soumissions — seule la clé service_role (jamais exposée au navigateur) peut les consulter,
-- exactement le principe inverse de `social_connections` (qui interdit tout accès client), ici
-- appliqué à une table où seule l'écriture doit être publique.

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  persona text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index contact_submissions_created_at_idx on public.contact_submissions (created_at desc);

alter table public.contact_submissions enable row level security;

-- Écriture publique (formulaire non authentifié) — jamais de lecture, mise à jour ou suppression
-- accordée ici : ces opérations restent réservées à service_role.
create policy "Anyone can submit a contact message"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true);
