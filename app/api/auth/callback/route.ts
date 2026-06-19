import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const redirectUrl = new URL(next.startsWith('/') ? next : '/', requestUrl.origin);

  if (!code) {
    redirectUrl.searchParams.set('auth_error', 'missing_code');
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.searchParams.set('auth_error', 'callback_failed');
  }

  return NextResponse.redirect(redirectUrl);
}
