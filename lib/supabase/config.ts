const SUPABASE_URL_ENV = 'NEXT_PUBLIC_SUPABASE_URL';
const SUPABASE_PUBLIC_KEY_ENVS = ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

export function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined;

  try {
    return new URL(value.trim()).origin;
  } catch {
    return undefined;
  }
}

export function firstEnvValue(names: readonly string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return undefined;
}

export function getSupabasePublicConfig() {
  return {
    url: normalizeSupabaseUrl(process.env[SUPABASE_URL_ENV]),
    publishableKey: firstEnvValue(SUPABASE_PUBLIC_KEY_ENVS)
  };
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const fallbackUrl = configuredUrl || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');

  return normalizeSupabaseUrl(fallbackUrl) || 'http://localhost:3000';
}

export function getAuthCallbackUrl() {
  return `${getSiteUrl()}/api/auth/callback`;
}
