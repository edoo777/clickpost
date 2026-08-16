/**
 * Administrateur de la plateforme ClickPost — un concept entièrement distinct du rôle
 * "admin/owner" d'un workspace (voir useWorkspaceSession().isAdmin, toujours limité à un seul
 * workspace). Jamais stocké en base ni dans une politique RLS : une simple liste d'e-mails
 * autorisés, lue uniquement côté serveur. Sans ADMIN_EMAILS, /admin reste inaccessible à tout le
 * monde — jamais un accès ouvert par défaut.
 */
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return false;
  const allowed = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  return allowed.includes(email.trim().toLowerCase());
}
