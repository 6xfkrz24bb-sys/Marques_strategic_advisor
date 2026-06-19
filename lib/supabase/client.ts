import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

export function createClient() {
  const { url, publishableKey } = getSupabasePublicConfig();

  if (!url || !publishableKey) {
    throw new Error('Supabase client env vars ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }

  return createBrowserClient(url, publishableKey);
}
