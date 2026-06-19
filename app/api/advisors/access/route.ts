import { NextRequest, NextResponse } from 'next/server';
import { advisors } from '@/lib/advisors';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer } from '@/lib/http';

function parseEmailList(value?: string) {
  return (value || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function userHasConfiguredAccess(email: string | undefined, envName: 'ADMIN_EMAILS' | 'TRIAL_EMAILS') {
  if (!email) return false;
  return parseEmailList(process.env[envName]).includes(email.toLowerCase());
}

export async function GET(request: NextRequest) {
  const user = await getUserFromBearer(request).catch(() => null);
  if (!user) return badRequest('Não autorizado.', 401);

  const allAdvisorIds = advisors.map((advisor) => advisor.id);

  if (userHasConfiguredAccess(user.email, 'ADMIN_EMAILS')) {
    return NextResponse.json({ ok: true, advisorIds: allAdvisorIds, accessType: 'admin' });
  }

  if (userHasConfiguredAccess(user.email, 'TRIAL_EMAILS')) {
    return NextResponse.json({ ok: true, advisorIds: allAdvisorIds, accessType: 'trial' });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('advisor_access')
    .select('advisor_id,status,expires_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

  if (error) return badRequest(error.message, 500);
  return NextResponse.json({ ok: true, advisorIds: data.map((row: { advisor_id: string }) => row.advisor_id), accessType: 'subscription' });
}
