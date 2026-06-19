import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { advisors, getAdvisor } from '@/lib/advisors';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer } from '@/lib/http';

const responsePlaybook = `
Regras de resposta para produto SaaS consultivo:
- Responda em português do Brasil, com tom executivo, claro e prático.
- Na primeira resposta sobre um problema, não entregue uma consultoria completa nem um projeto inteiro.
- Entregue valor suficiente para gerar clareza, mas convide o usuário a aprofundar.
- Use esta estrutura:
  1. Diagnóstico direto: uma conclusão objetiva sobre o problema.
  2. Por que isso acontece: causas prováveis em linguagem simples.
  3. Consequências para o negócio: impactos em margem, caixa, pessoas, cliente, risco ou crescimento.
  4. Risco se nada for feito: cenário provável de deterioração.
  5. Próximo passo recomendado: uma ação inicial, prática e priorizada.
  6. Para aprofundar: diga exatamente o que o usuário pode digitar, por exemplo: "Digite aprofundar para eu montar um plano de ação com responsáveis, prazos e KPIs".
- Se o usuário digitar "aprofundar", entregue um plano de ação mais detalhado com etapas, responsáveis, prazo sugerido e indicadores.
- Se faltar contexto, faça no máximo 3 perguntas objetivas antes de aprofundar.
`;

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
    systemInstruction: `${advisor.systemPrompt}\n\n${responsePlaybook}`
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
