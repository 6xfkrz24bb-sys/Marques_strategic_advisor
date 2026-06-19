import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined;

  const parsed = new URL(value.trim());
  return parsed.origin;
}

export function createAdminClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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
