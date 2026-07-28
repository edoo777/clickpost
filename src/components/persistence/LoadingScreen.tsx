export function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-background text-foreground"
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
      />
      <p className="text-sm text-muted-foreground">Chargement de votre espace de travail…</p>
    </div>
  );
}
