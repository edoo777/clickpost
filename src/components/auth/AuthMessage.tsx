interface AuthMessageProps {
  kind: "success" | "error";
  children: React.ReactNode;
}

/** Bannière de statut partagée (succès/erreur) pour les formulaires d'authentification. */
export function AuthMessage({ kind, children }: AuthMessageProps) {
  const className =
    kind === "success"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";

  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm font-medium ${className}`}>
      {children}
    </p>
  );
}
