import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  const user = await getUserFromBearer(request).catch(() => null);
  if (!user?.email) return badRequest('Faça login para solicitar o teste grátis.', 401);

  const body = await request.json().catch(() => ({}));
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const mailerSendToken = process.env.MAILERSEND_API_TOKEN;
  const from = parseEmailFrom(process.env.EMAIL_FROM);
  const userName = String(user.user_metadata?.full_name || body?.name || 'Usuário logado');
  const message = String(body?.message || 'Solicitação de trial grátis por 15 dias.').slice(0, 2000);

  const supabase = createAdminClient();
  const { error } = await supabase.from('leads').insert({
    name: userName,
    email: user.email,
    whatsapp: body?.whatsapp || null,
    company: body?.company || null,
    source: 'trial_request',
    status: 'new',
    answers: [
      {
        subject: 'Solicitação de trial grátis por 15 dias',
        message,
        user_id: user.id,
        release_sql: `select public.grant_trial_access('${user.email}', 15);`
      }
    ]
  });

  if (error) return badRequest(error.message, 500);

  if (!adminEmail || !mailerSendToken) {
    return NextResponse.json({
      ok: true,
      emailSent: false,
      message: 'Solicitação registrada. Notificação por e-mail não configurada.'
    });
  }

  const releaseSql = `select public.grant_trial_access('${user.email}', 15);`;
  const subject = `Novo pedido de trial - ${user.email}`;
  const text = [
    'Nova solicitação de trial grátis por 15 dias.',
    '',
    `Nome: ${userName}`,
    `E-mail: ${user.email}`,
    `Mensagem: ${message}`,
    '',
    'Para liberar no Supabase, rode:',
    releaseSql
  ].join('\n');

  const html = `
    <h2>Nova solicitação de trial grátis por 15 dias</h2>
    <p><strong>Nome:</strong> ${userName}</p>
    <p><strong>E-mail:</strong> ${user.email}</p>
    <p><strong>Mensagem:</strong> ${message}</p>
    <p>Para liberar no Supabase, rode:</p>
    <pre style="background:#f6f8fa;padding:12px;border-radius:6px;white-space:pre-wrap;">${releaseSql}</pre>
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
      emailSent: false,
      message: 'Solicitação registrada. O e-mail de notificação não foi enviado.',
      details: details.slice(0, 500)
    });
  }

  return NextResponse.json({
    ok: true,
    emailSent: true,
    message: 'Solicitação recebida. O teste será analisado e liberado em até 24 horas.'
  });
}
