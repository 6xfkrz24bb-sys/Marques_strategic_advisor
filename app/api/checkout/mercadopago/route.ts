import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';
import { advisors, type Advisor } from '@/lib/advisors';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer, serverError } from '@/lib/http';

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function calculatePromotionalBoardPrice(ids: string[]) {
  const count = Array.from(new Set(ids)).length;
  if (count === 0) return 0;
  if (count === 1) return 40;
  if (count <= 4) return 81;
  return 150;
}

function getPromotionalPlanName(ids: string[]) {
  const count = Array.from(new Set(ids)).length;
  if (count === 1) return 'Plano Essencial Promocional';
  if (count <= 4) return 'Plano Executivo Promocional';
  return 'Board Pro Promocional';
}

export async function POST(request: NextRequest) {
  const user = await getUserFromBearer(request).catch(() => null);
  if (!user) return badRequest('Faça login antes de contratar advisors.', 401);

  const body = await request.json().catch(() => null);
  const advisorIds: string[] = Array.isArray(body?.advisorIds) ? Array.from(new Set(body.advisorIds.map((id: unknown) => String(id)))) : [];
  const selected = advisorIds
    .map((id) => advisors.find((advisor) => advisor.id === id))
    .filter((advisor): advisor is Advisor => Boolean(advisor));

  if (!selected.length) return badRequest('Selecione pelo menos um advisor.');

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return badRequest('MERCADOPAGO_ACCESS_TOKEN não configurado.', 500);

  const siteUrl = getSiteUrl();
  const amount = calculatePromotionalBoardPrice(advisorIds);
  const externalReference = `${user.id}|${advisorIds.join(',')}|${Date.now()}`;
  const supabase = createAdminClient();

  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      provider: 'mercadopago',
      external_reference: externalReference,
      status: 'pending',
      amount_cents: Math.round(amount * 100),
      currency: 'BRL',
      metadata: { advisorIds, pricingRule: 'launch_promo_2026', planName: getPromotionalPlanName(advisorIds) }
    })
    .select('id')
    .single();

  if (subError) return serverError();

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const created = await preference.create({
    body: {
      external_reference: externalReference,
      metadata: {
        user_id: user.id,
        advisor_ids: advisorIds.join(','),
        subscription_id: sub.id,
        pricing_rule: 'launch_promo_2026'
      },
      items: [
        {
          id: advisorIds.join(','),
          title: `${getPromotionalPlanName(advisorIds)} - Marques Advisors`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
          description: 'Acesso mensal promocional aos advisors executivos selecionados.'
        }
      ],
      payer: {
        email: user.email || undefined
      },
      back_urls: {
        success: `${siteUrl}/?payment=success`,
        pending: `${siteUrl}/?payment=pending`,
        failure: `${siteUrl}/?payment=failure`
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/webhooks/mercadopago`
    }
  });

  await supabase
    .from('subscriptions')
    .update({ provider_reference: String(created.id), updated_at: new Date().toISOString() })
    .eq('id', sub.id);

  return NextResponse.json({ ok: true, checkoutUrl: created.init_point, sandboxUrl: created.sandbox_init_point, preferenceId: created.id });
}
