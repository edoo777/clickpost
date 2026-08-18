-- Langue de l'interface (FR/EN) — Chantier internationalisation. Distincte de `profiles.language`
-- (préférence de langue en texte libre déjà existante, ex. "Espagnol", utilisée ailleurs) : ce
-- nouveau champ pilote spécifiquement la langue de l'interface ET la langue attendue des
-- générations IA (prompts). Additif, valeur par défaut 'fr' pour tous les profils existants —
-- aucun changement de comportement pour un utilisateur qui ne touche jamais au sélecteur.

alter table public.profiles add column if not exists ui_locale text not null default 'fr'
  check (ui_locale in ('fr', 'en'));
