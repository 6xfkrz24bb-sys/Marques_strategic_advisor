import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminConfig } from '@/lib/supabase/config';

export function createAdminClient() {
  const { url, secretKey } = getSupabaseAdminConfig();

  if (!url || !secretKey) {
    throw new Error('Supabase admin env vars ausentes. Configure SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
