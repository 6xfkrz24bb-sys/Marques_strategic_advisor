import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined;

  const parsed = new URL(value.trim());
  return parsed.origin;
}

function findMatchingIntegrationSecret(url: string) {
  const urlSuffix = '_SUPABASE_URL';

  for (const [name, value] of Object.entries(process.env)) {
    if (!value || name.startsWith('NEXT_PUBLIC_') || !name.endsWith(urlSuffix)) continue;

    try {
      if (normalizeSupabaseUrl(value) !== url) continue;
    } catch {
      continue;
    }

    const prefix = name.slice(0, -urlSuffix.length);
    return process.env[`${prefix}_SUPABASE_SECRET_KEY`]
      || process.env[`${prefix}_SUPABASE_SERVICE_ROLE_KEY`];
  }

  return undefined;
}

export function createAdminClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const secretKey = url
    ? findMatchingIntegrationSecret(url)
      || process.env.SUPABASE_SECRET_KEY
      || process.env.SUPABASE_SERVICE_ROLE_KEY
    : undefined;

  if (!url || !secretKey) {
    throw new Error('Supabase admin env vars ausentes. Configure SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createSupabaseClient(url, secretKey.trim(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
