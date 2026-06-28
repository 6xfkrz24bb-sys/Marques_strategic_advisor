import { NextRequest, NextResponse } from 'next/server';
import { getAdvisor } from '@/lib/advisors';
import { badRequest, getUserFromBearer } from '@/lib/http';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const user = await getUserFromBearer(request).catch(() => null);
  if (!user) return badRequest('Não autorizado.', 401);

  const { searchParams } = new URL(request.url);
  const advisorId = searchParams.get('advisorId') || '';
  const advisor = getAdvisor(advisorId);
  if (!advisor) return badRequest('Advisor inválido.');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role,content,created_at')
    .eq('user_id', user.id)
    .eq('advisor_id', advisor.id)
    .order('created_at', { ascending: true })
    .limit(120);

  if (error) return badRequest(error.message, 500);

  return NextResponse.json({
    ok: true,
    advisorId: advisor.id,
    messages: (data || []).map((message) => ({
      role: message.role,
      content: message.content,
      created_at: message.created_at
    }))
  });
}
