-- Émet l'événement produit "signup" au moment exact et fiable où un compte est réellement créé
-- (insertion dans auth.users), plutôt que côté client (signUp() ne donne pas encore de session
-- tant que l'e-mail n'est pas confirmé — /auth/callback est aussi partagé avec le flux de
-- réinitialisation de mot de passe, donc pas un point fiable pour distinguer une vraie inscription
-- de laquelle). Étend `handle_new_user()` (F1.1) qui bypasse déjà la RLS de `profiles` de la même
-- façon (SECURITY DEFINER) — même principe appliqué ici à `product_events`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.product_events (event_name, user_id) values ('signup', new.id);
  return new;
end;
$$;
