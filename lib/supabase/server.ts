import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined;

  const parsed = new URL(value.trim());
  return parsed.origin;
}

export async function createClient() {
  const cookieStore = await cookies();
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase server env vars ausentes.');
  }

  return createServerClient(url, publishableKey.trim(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamadas a partir de Server Components podem não conseguir gravar cookies.
        }
      }
    }
  });
}
