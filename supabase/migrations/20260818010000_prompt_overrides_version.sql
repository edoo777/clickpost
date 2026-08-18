-- Chantier Admin : ajoute le champ "version" demandé explicitement pour l'administration des
-- prompts IA (nom, fonctionnalité, prompt système, instructions, version, statut actif/inactif,
-- date de modification — liste exacte fournie). Incrémenté à chaque enregistrement réel depuis
-- l'espace Admin (voir savePromptOverride) — jamais lié à la restauration de l'instruction
-- précédente, qui reste une action distincte. Additif, valeur par défaut 1 pour les lignes
-- existantes (déjà à leur premier état).

alter table public.prompt_overrides add column if not exists version integer not null default 1;
