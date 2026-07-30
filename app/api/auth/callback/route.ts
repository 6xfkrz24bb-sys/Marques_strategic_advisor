import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const requestedPath = requestUrl.searchParams.get('next');
  const redirectUrl = new URL(
    requestedPath?.startsWith('/') &&
      !requestedPath.startsWith('//') &&
      !requestedPath.includes('\\')
      ? requestedPath
      : '/',
    requestUrl.origin,
  );

  // Keep this origin check as a final guard against URL parser edge cases.
  if (redirectUrl.origin !== requestUrl.origin) {
    redirectUrl.href = new URL('/', requestUrl.origin).href;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL('/', requestUrl.origin);
      loginUrl.searchParams.set('authError', 'Não foi possível confirmar o acesso. Solicite um novo link.');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(redirectUrl);
}
