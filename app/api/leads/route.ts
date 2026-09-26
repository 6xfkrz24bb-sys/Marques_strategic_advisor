import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanString, isEmail, optionalString, safeArray } from '@/lib/api-validation';
import { badRequest, serverError } from '@/lib/http';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = cleanString(body?.name, 160);
  const email = cleanString(body?.email, 180).toLowerCase();
  if (!name || !email) return badRequest('Nome e e-mail são obrigatórios.');
  if (!isEmail(email)) return badRequest('Informe um e-mail válido.');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name,
      email,
      whatsapp: optionalString(body?.whatsapp, 60),
      company: optionalString(body?.company, 160),
      agent_id: optionalString(body?.agentId, 80),
      score: Number.isFinite(body?.score) ? Math.max(0, Math.min(100, Number(body.score))) : null,
      answers: safeArray(body?.answers, 100),
      source: cleanString(body?.source, 60) || 'diagnostic',
      status: 'new'
    })
    .select('id')
    .single();

  if (error) return serverError();
  return NextResponse.json({ ok: true, id: data.id });
}
