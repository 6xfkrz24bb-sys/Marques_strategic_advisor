import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { firstEnvValue, normalizeSupabaseUrl } from '@/lib/supabase/config';

const SUPABASE_ADMIN_KEY_ENVS = ['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

export function createAdminClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const secretKey = firstEnvValue(SUPABASE_ADMIN_KEY_ENVS);

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
