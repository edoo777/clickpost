"use client";

import { NotesView } from "@/components/ideas-bank/notes/NotesView";
import { useTranslations } from "@/lib/i18n/locale-provider";

/**
 * Onglet « Banque d'idées » de la Boîte à idées — simplifié à la seule vue Notes (Cartes/
 * Tableau/Kanban retirés de cette section à la demande explicite). NotesView elle-même n'est ni
 * modifiée ni ré-implémentée ici : ce composant ne fait que l'exposer directement, sans
 * sélecteur de vue ni barre de filtres Idée (celle-ci ne s'appliquait qu'à Cartes/Tableau/Kanban).
 */
export function IdeasBankListView() {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("pageTitle.ideasBankPage")}</h1>
        <p className="text-sm text-muted-foreground">{t("ideasBank.listView.notes")}</p>
      </header>
      <NotesView />
    </div>
  );
}
