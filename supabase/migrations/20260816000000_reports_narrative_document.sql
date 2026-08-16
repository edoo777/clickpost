-- Évolution du module Rapports vers un générateur de rapport narratif (F-Rapports v2).
-- Extension strictement additive de la migration 20260815000000_reports.sql : aucune donnée
-- existante perdue, seuls le nom d'une colonne et les valeurs autorisées de report_type changent.

-- Nouveau type de rapport "executive", en plus de "internal"/"client".
alter table public.reports drop constraint if exists reports_report_type_check;
alter table public.reports add constraint reports_report_type_check
  check (report_type in ('internal', 'client', 'executive'));

-- ai_analysis contenait déjà un blob jsonb flexible (sortie IA seule) ; il porte désormais
-- l'intégralité du rapport (KPI mesurés + narration Claude, voir ReportDocument côté
-- application) — renommage pour rester fidèle à son contenu réel, aucun changement de type.
alter table public.reports rename column ai_analysis to document;
