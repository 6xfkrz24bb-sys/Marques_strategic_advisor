import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function parseExternalReference(value?: string | null) {
  if (!value) return null;
  const [userId, advisorCsv] = value.split('|');
  if (!userId || !advisorCsv) return null;
  return { userId, advisorIds: advisorCsv.split(',').filter(Boolean) };
}

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ ok: false, error: 'MERCADOPAGO_ACCESS_TOKEN ausente.' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const paymentId = body?.data?.id || body?.id || body?.resource?.split('/').pop();

  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'sem payment id' });
  }

  const client = new MercadoPagoConfig({ accessToken });
  const paymentClient = new Payment(client);
  const payment = await paymentClient.get({ id: String(paymentId) });

  const externalReference = payment.external_reference || undefined;
  const parsed = parseExternalReference(externalReference);
  if (!parsed) return NextResponse.json({ ok: true, ignored: true, reason: 'external_reference inválida' });

  const supabase = createAdminClient();
  const approved = payment.status === 'approved';
  const paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .update({
      provider_reference: String(payment.id),
      status: payment.status || 'unknown',
      paid_until: approved ? paidUntil : null,
      metadata: {
        payment_id: payment.id,
        payment_method_id: payment.payment_method_id,
        payment_type_id: payment.payment_type_id,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount
      },
      updated_at: new Date().toISOString()
    })
    .eq('external_reference', externalReference)
    .select('id')
    .maybeSingle();

  if (approved) {
    const rows = parsed.advisorIds.map((advisorId) => ({
      user_id: parsed.userId,
      advisor_id: advisorId,
      subscription_id: subscription?.id ?? null,
      status: 'active',
      expires_at: paidUntil
    }));

    await supabase
      .from('advisor_access')
      .upsert(rows, { onConflict: 'user_id,advisor_id' });
  }

  return NextResponse.json({ ok: true });
}
