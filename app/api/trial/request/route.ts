import { NextRequest, NextResponse } from 'next/server';
import { advisors } from '@/lib/advisors';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer } from '@/lib/http';

type TrialAccessRow = {
  advisor_id: string;
  status: string;
  expires_at: string | null;
};

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

function hasFutureDate(value: string | null) {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}

function isActiveAccess(row: TrialAccessRow) {
  return row.status === 'active' && (row.expires_at === null || hasFutureDate(row.expires_at));
}

async function getUserAccessRows(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('advisor_access')
    .select('advisor_id,status,expires_at')
    .eq('user_id', userId);

  return { supabase, rows: (data || []) as TrialAccessRow[], error };
}

async function sendTrialNotification(params: {
  adminEmail?: string;
  mailerSendToken?: string;
  from: { email: string; name: string };
  userName: string;
  userEmail: string;
  message: string;
  expiresAt: string;
  leadError?: string;
}) {
  const { adminEmail, mailerSendToken, from, userName, userEmail, message, expiresAt, leadError } = params;
  if (!adminEmail || !mailerSendToken) return false;

  const subject = `Trial liberado automaticamente - ${userEmail}`;
  const text = [
    'Novo trial grátis liberado automaticamente por 15 dias.',
    '',
    `Nome: ${userName}`,
    `E-mail: ${userEmail}`,
    `Mensagem: ${message}`,
    `Advisors liberados: ${advisors.length}`,
    `Vencimento: ${expiresAt}`,
    '',
    leadError ? `Observação: o lead não foi salvo. Erro: ${leadError}` : 'Lead salvo no Supabase.'
  ].join('\n');

  const html = `
    <h2>Trial grátis liberado automaticamente por 15 dias</h2>
    <p><strong>Nome:</strong> ${escapeHtml(userName)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(userEmail)}</p>
    <p><strong>Mensagem:</strong> ${escapeHtml(message)}</p>
    <p><strong>Advisors liberados:</strong> ${advisors.length}</p>
    <p><strong>Vencimento:</strong> ${escapeHtml(expiresAt)}</p>
    <p>${leadError ? `O lead não foi salvo: ${escapeHtml(leadError)}` : 'Lead salvo no Supabase.'}</p>
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

  return mailResponse.ok;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromBearer(request).catch(() => null);

  if (!user?.email) {
    return NextResponse.json({
      ok: true,
      trialAvailable: true,
      hasRequestedTrial: false,
      alreadyHasAccess: false
    });
  }

  const { rows, error } = await getUserAccessRows(user.id);
  if (error) return badRequest(`Não foi possível consultar o acesso: ${error.message}`, 500);

  const hasRequestedTrial = rows.length > 0;
  const alreadyHasAccess = rows.some(isActiveAccess);

  return NextResponse.json({
    ok: true,
    trialAvailable: !hasRequestedTrial,
    hasRequestedTrial,
    alreadyHasAccess
  });
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

  const { supabase, rows, error: existingAccessError } = await getUserAccessRows(user.id);

  if (existingAccessError) return badRequest(`Não foi possível consultar o acesso: ${existingAccessError.message}`, 500);

  const hasPermanentAccess = rows.some((row) => row.status === 'active' && row.expires_at === null);
  const hasActiveTrial = rows.some((row) => row.status === 'active' && hasFutureDate(row.expires_at));
  const hasRequestedTrial = rows.length > 0;

  if (hasPermanentAccess) {
    return NextResponse.json({
      ok: true,
      trialGranted: false,
      alreadyHasAccess: true,
      hasRequestedTrial: true,
      trialAvailable: false,
      message: 'Você já possui acesso ativo aos advisors.'
    });
  }

  if (hasActiveTrial) {
    return NextResponse.json({
      ok: true,
      trialGranted: false,
      alreadyHasAccess: true,
      hasRequestedTrial: true,
      trialAvailable: false,
      message: 'Seu teste grátis já está ativo.'
    });
  }

  if (hasRequestedTrial) {
    return NextResponse.json(
      {
        ok: false,
        trialGranted: false,
        hasRequestedTrial: true,
        trialAvailable: false,
        error: 'Teste grátis já utilizado neste cadastro.'
      },
      { status: 409 }
    );
  }

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

  const emailSent = await sendTrialNotification({
    adminEmail,
    mailerSendToken,
    from,
    userName,
    userEmail: user.email,
    message,
    expiresAt,
    leadError: leadError?.message
  }).catch(() => false);

  return NextResponse.json({
    ok: true,
    trialGranted: true,
    hasRequestedTrial: true,
    trialAvailable: false,
    emailSent,
    message: 'Acesso liberado por 15 dias.',
    leadSaved: !leadError,
    leadError: leadError?.message
  });
}
