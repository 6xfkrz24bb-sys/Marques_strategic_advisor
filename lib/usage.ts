import { advisors } from '@/lib/advisors';

export type AccessRow = { advisor_id: string; expires_at: string | null };

export function parseEmailList(value?: string) {
  return (value || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email?: string) {
  return Boolean(email && parseEmailList(process.env.ADMIN_EMAILS).includes(email.toLowerCase()));
}

export function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

export function resolveMessageLimit(rows: AccessRow[]) {
  if (rows.some((row) => row.expires_at)) return { label: 'Trial 15 dias', limit: 20 };
  const activeCount = new Set(rows.map((row) => row.advisor_id)).size;
  if (activeCount <= 1) return { label: 'Plano Essencial', limit: 80 };
  if (activeCount <= 4) return { label: 'Plano Executivo', limit: 250 };
  return { label: 'Board Pro', limit: 600 };
}

export function allAdvisorRows(): AccessRow[] {
  return advisors.map((advisor) => ({ advisor_id: advisor.id, expires_at: null }));
}
