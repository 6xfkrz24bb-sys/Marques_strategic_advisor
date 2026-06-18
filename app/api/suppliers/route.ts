import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer } from '@/lib/http';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.legalName || !body?.taxId || !body?.email) {
    return badRequest('Razão social, CNPJ/CPF e e-mail são obrigatórios.');
  }

  const user = await getUserFromBearer(request).catch(() => null);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      user_id: user?.id ?? null,
      legal_name: body.legalName,
      trade_name: body.tradeName ?? null,
      tax_id: body.taxId,
      category: body.category ?? null,
      contact_name: body.contactName ?? null,
      email: body.email,
      whatsapp: body.whatsapp ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      notes: body.notes ?? null,
      score: body.score ?? null,
      status: 'new'
    })
    .select('id')
    .single();

  if (error) return badRequest(error.message, 500);
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

  if (error) return badRequest(error.message, 500);
  return NextResponse.json({ ok: true, suppliers: data });
}
