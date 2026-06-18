import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { advisors, getAdvisor } from '@/lib/advisors';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer } from '@/lib/http';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.advisorId || !body?.message) return badRequest('Advisor e mensagem são obrigatórios.');

  const user = await getUserFromBearer(request).catch(() => null);
  if (!user) return badRequest('Não autorizado.', 401);

  const advisor = getAdvisor(body.advisorId);
  if (!advisor) return badRequest('Advisor inválido.');

  const supabase = createAdminClient();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (!demoMode) {
    const { data: access, error: accessError } = await supabase
      .from('advisor_access')
      .select('advisor_id')
      .eq('user_id', user.id)
      .eq('advisor_id', advisor.id)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .maybeSingle();

    if (accessError) return badRequest(accessError.message, 500);
    if (!access) return badRequest('Advisor não contratado ou acesso expirado.', 403);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return badRequest('GEMINI_API_KEY não configurada no backend.', 500);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction: advisor.systemPrompt
  });

  const prompt = String(body.message).slice(0, 12000);
  const result = await model.generateContent(prompt);
  const text = result.response.text() || 'Não consegui gerar resposta nesta tentativa.';

  await supabase.from('chat_messages').insert([
    { user_id: user.id, advisor_id: advisor.id, role: 'user', content: prompt },
    { user_id: user.id, advisor_id: advisor.id, role: 'assistant', content: text }
  ]);

  return NextResponse.json({ ok: true, answer: text, advisors: advisors.length });
}
