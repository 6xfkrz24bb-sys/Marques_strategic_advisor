import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer } from '@/lib/http';

export async function GET(request: NextRequest) {
  const user = await getUserFromBearer(request).catch(() => null);
  if (!user) return badRequest('Não autorizado.', 401);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('advisor_access')
    .select('advisor_id,status,expires_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

  if (error) return badRequest(error.message, 500);
  return NextResponse.json({ ok: true, advisorIds: data.map((row: { advisor_id: string }) => row.advisor_id) });
}
