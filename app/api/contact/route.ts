import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanString, isEmail, optionalString } from '@/lib/api-validation';
import { badRequest, serverError } from '@/lib/http';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = cleanString(body?.email, 180).toLowerCase();
  const subject = cleanString(body?.subject, 180);
  const message = cleanString(body?.message, 4000);
  if (!email || !subject || !message) return badRequest('E-mail, assunto e mensagem são obrigatórios.');
  if (!isEmail(email)) return badRequest('Informe um e-mail válido.');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: cleanString(body?.name, 160) || 'Contato via site',
      email,
      whatsapp: optionalString(body?.whatsapp, 60),
      company: optionalString(body?.company, 160),
      source: 'contact',
      status: 'new',
      answers: [{ subject, message }]
    })
    .select('id')
    .single();

  if (error) return serverError();
  return NextResponse.json({ ok: true, id: data.id });
}
