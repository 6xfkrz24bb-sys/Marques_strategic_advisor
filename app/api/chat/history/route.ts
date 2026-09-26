import { NextRequest, NextResponse } from 'next/server';
import { getAdvisor } from '@/lib/advisors';
import { badRequest, getUserFromBearer, serverError } from '@/lib/http';
import { createAdminClient } from '@/lib/supabase/admin';

function messageOrder(role: string) {
  return role === 'user' ? 0 : 1;
}

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
    .select('id,role,content,created_at')
    .eq('user_id', user.id)
    .eq('advisor_id', advisor.id)
    .order('created_at', { ascending: false })
    .limit(120);

  if (error) return serverError();

  const chronologicalMessages = [...(data || [])].sort((a, b) => {
    const timeA = Date.parse(a.created_at || '');
    const timeB = Date.parse(b.created_at || '');
    if (timeA !== timeB) return timeA - timeB;
    return messageOrder(a.role) - messageOrder(b.role);
  });

  return NextResponse.json({
    ok: true,
    advisorId: advisor.id,
    messages: chronologicalMessages.map((message) => ({
      role: message.role,
      content: message.content,
      created_at: message.created_at
    }))
  });
}
