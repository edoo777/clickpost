-- Complète prompt_overrides pour une administration réelle des prompts IA (nom, fonction déjà
-- portée par `key`, statut actif/inactif, prompt système additif) — extension strictement
-- additive de 20260817000000_admin_platform_config.sql, aucune donnée existante perdue.

alter table public.prompt_overrides add column if not exists name text not null default '';
alter table public.prompt_overrides add column if not exists is_active boolean not null default true;
-- Toujours PRÉPENDU au prompt système existant (jamais un remplacement) — même principe de
-- sécurité que extra_instructions (APPENDU) : les règles anti-invention de données et le format
-- de réponse JSON strict restent toujours codés en dur, jamais éditables depuis l'Admin.
alter table public.prompt_overrides add column if not exists system_prompt_override text not null default '';

-- Lignes initiales nommées pour les quatre fonctions IA principales — inactives par défaut tant
-- que l'administrateur n'a rien personnalisé (aucun effet tant que name/system_prompt_override/
-- extra_instructions restent vides, voir le fallback dans src/lib/admin/prompt-overrides.ts).
insert into public.prompt_overrides (key, name, is_active) values
  ('copilot', 'Copilote éditorial', true),
  ('atelier', 'Atelier (génération et réécriture)', true),
  ('generateur', 'Générateur de sujets', true),
  ('rapports', 'Rapports — analyse et narration', true)
on conflict (key) do nothing;
