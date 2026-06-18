import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest } from '@/lib/http';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email) return badRequest('Nome e e-mail são obrigatórios.');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: body.name,
      email: body.email,
      whatsapp: body.whatsapp ?? null,
      company: body.company ?? null,
      agent_id: body.agentId ?? null,
      score: Number.isFinite(body.score) ? body.score : null,
      answers: body.answers ?? [],
      source: body.source ?? 'diagnostic',
      status: 'new'
    })
    .select('id')
    .single();

  if (error) return badRequest(error.message, 500);
  return NextResponse.json({ ok: true, id: data.id });
}
