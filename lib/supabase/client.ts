import { createBrowserClient } from '@supabase/ssr';

function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined;

  const parsed = new URL(value.trim());
  return parsed.origin;
}

export function createClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    if (typeof window === 'undefined') {
      return createBrowserClient('http://localhost:54321', 'build-time-placeholder-key');
    }
    throw new Error('Supabase client env vars ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }

  return createBrowserClient(url, publishableKey.trim());
}
