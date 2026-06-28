import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanString, isEmail, optionalString } from '@/lib/api-validation';
import { badRequest, getUserFromBearer, serverError } from '@/lib/http';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const legalName = cleanString(body?.legalName, 180);
  const taxId = cleanString(body?.taxId, 32);
  const email = cleanString(body?.email, 180).toLowerCase();
  if (!legalName || !taxId || !email) {
    return badRequest('Nome/razão social, CPF/CNPJ e e-mail são obrigatórios.');
  }
  if (!isEmail(email)) return badRequest('Informe um e-mail válido.');

  const user = await getUserFromBearer(request).catch(() => null);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      user_id: user?.id ?? null,
      legal_name: legalName,
      trade_name: optionalString(body?.tradeName, 160),
      tax_id: taxId,
      category: optionalString(body?.category, 120),
      contact_name: optionalString(body?.contactName, 160),
      email,
      whatsapp: optionalString(body?.whatsapp, 60),
      city: optionalString(body?.city, 120),
      state: optionalString(body?.state, 2)?.toUpperCase() ?? null,
      notes: optionalString(body?.notes, 4000),
      score: Number.isFinite(body?.score) ? Number(body.score) : null,
      status: 'new'
    })
    .select('id')
    .single();

  if (error) return serverError();
  return NextResponse.json({ ok: true, id: data.id });
}

export async function GET(request: NextRequest) {
  const user = await getUserFromBearer(request).catch(() => null);
  if (!user) return badRequest('Não autorizado.', 401);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return serverError();
  return NextResponse.json({ ok: true, suppliers: data });
}
