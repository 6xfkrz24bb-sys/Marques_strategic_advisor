import { NextRequest, NextResponse } from 'next/server';
import { advisors } from '@/lib/advisors';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer } from '@/lib/http';

function parseEmailFrom(value?: string) {
  const fallbackEmail = 'no-reply@trial.mailersend.com';
  if (!value) return { email: fallbackEmail, name: 'Marques Strategic Advisor' };

  const match = value.match(/^(.*)<(.+)>$/);
  if (match) {
    return {
      name: match[1].trim() || 'Marques Strategic Advisor',
      email: match[2].trim()
    };
  }

  return { email: value.trim(), name: 'Marques Strategic Advisor' };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(request: NextRequest) {
  const user = await getUserFromBearer(request).catch(() => null);
  if (!user?.email) return badRequest('Faça login para solicitar o teste grátis.', 401);

  const body = await request.json().catch(() => ({}));
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const mailerSendToken = process.env.MAILERSEND_API_TOKEN;
  const from = parseEmailFrom(process.env.EMAIL_FROM);
  const userName = String(user.user_metadata?.full_name || body?.name || user.email.split('@')[0] || 'Usuário logado');
  const message = String(body?.message || 'Solicitação de trial grátis por 15 dias.').slice(0, 2000);
  const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createAdminClient();

  const { error: accessError } = await supabase.from('advisor_access').upsert(
    advisors.map((advisor) => ({
      user_id: user.id,
      advisor_id: advisor.id,
      status: 'active',
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    })),
    { onConflict: 'user_id,advisor_id' }
  );

  if (accessError) {
    return badRequest(`Não foi possível liberar o teste grátis: ${accessError.message}`, 500);
  }

  const { error: leadError } = await supabase.from('leads').insert({
    name: userName,
    email: user.email,
    whatsapp: body?.whatsapp || null,
    company: body?.company || null,
    source: 'trial_request',
    status: 'trial_granted',
    answers: [
      {
        subject: 'Trial grátis liberado automaticamente por 15 dias',
        message,
        user_id: user.id,
        expires_at: expiresAt,
        advisors_released: advisors.length
      }
    ]
  });

  if (!adminEmail || !mailerSendToken) {
    return NextResponse.json({
      ok: true,
      trialGranted: true,
      emailSent: false,
      message: 'Teste grátis liberado por 15 dias. Notificação por e-mail não configurada.',
      leadSaved: !leadError,
      leadError: leadError?.message
    });
  }

  const subject = `Trial liberado automaticamente - ${user.email}`;
  const text = [
    'Novo trial grátis liberado automaticamente por 15 dias.',
    '',
    `Nome: ${userName}`,
    `E-mail: ${user.email}`,
    `Mensagem: ${message}`,
    `Advisors liberados: ${advisors.length}`,
    `Vencimento: ${expiresAt}`,
    '',
    leadError ? `Observação: o lead não foi salvo. Erro: ${leadError.message}` : 'Lead salvo no Supabase.'
  ].join('\n');

  const html = `
    <h2>Trial grátis liberado automaticamente por 15 dias</h2>
    <p><strong>Nome:</strong> ${escapeHtml(userName)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(user.email)}</p>
    <p><strong>Mensagem:</strong> ${escapeHtml(message)}</p>
    <p><strong>Advisors liberados:</strong> ${advisors.length}</p>
    <p><strong>Vencimento:</strong> ${escapeHtml(expiresAt)}</p>
    <p>${leadError ? `O lead não foi salvo: ${escapeHtml(leadError.message)}` : 'Lead salvo no Supabase.'}</p>
  `;

  const mailResponse = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mailerSendToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [{ email: adminEmail, name: 'Mateus Marques' }],
      subject,
      text,
      html
    })
  });

  if (!mailResponse.ok) {
    const details = await mailResponse.text().catch(() => '');
    return NextResponse.json({
      ok: true,
      trialGranted: true,
      emailSent: false,
      message: 'Teste grátis liberado por 15 dias. O e-mail de notificação não foi enviado.',
      details: details.slice(0, 500),
      leadSaved: !leadError,
      leadError: leadError?.message
    });
  }

  return NextResponse.json({
    ok: true,
    trialGranted: true,
    emailSent: true,
    message: 'Teste grátis liberado por 15 dias. Você já pode acessar seus advisors.',
    leadSaved: !leadError,
    leadError: leadError?.message
  });
}
