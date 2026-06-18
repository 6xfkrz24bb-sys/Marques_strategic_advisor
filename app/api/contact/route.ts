import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest } from '@/lib/http';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.subject || !body?.message) return badRequest('E-mail, assunto e mensagem são obrigatórios.');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: body.name ?? 'Contato via site',
      email: body.email,
      whatsapp: body.whatsapp ?? null,
      company: body.company ?? null,
      source: 'contact',
      status: 'new',
      answers: [{ subject: body.subject, message: body.message }]
    })
    .select('id')
    .single();

  if (error) return badRequest(error.message, 500);
  return NextResponse.json({ ok: true, id: data.id });
}
