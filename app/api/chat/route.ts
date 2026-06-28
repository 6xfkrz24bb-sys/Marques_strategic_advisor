import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { advisors, getAdvisor } from '@/lib/advisors';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, getUserFromBearer } from '@/lib/http';
import { isAdminEmail, monthStartIso, resolveMessageLimit, type AccessRow } from '@/lib/usage';

const responsePlaybook = `
Regras de resposta para produto SaaS consultivo:
- Responda em português do Brasil, com tom executivo, claro e prático.
- Seja objetivo por padrão: responda em até 8 linhas ou 2 a 4 bullets quando a pergunta for simples.
- Comece pela resposta direta e evite repetir contexto já informado pelo usuário.
- Só entregue resposta longa quando o usuário pedir aprofundamento, detalhamento, plano completo, roteiro, diagnóstico completo, tabela ou passo a passo.
- Na primeira resposta sobre um problema, não entregue uma consultoria completa nem um projeto inteiro.
- Entregue valor suficiente para gerar clareza, mas convide o usuário a aprofundar.
- Use esta estrutura apenas quando o problema exigir análise executiva:
  1. Diagnóstico direto: uma conclusão objetiva sobre o problema.
  2. Por que isso acontece: causas prováveis em linguagem simples.
  3. Consequências para o negócio: impactos em margem, caixa, pessoas, cliente, risco ou crescimento.
  4. Risco se nada for feito: cenário provável de deterioração.
  5. Próximo passo recomendado: uma ação inicial, prática e priorizada.
  6. Para aprofundar: diga exatamente o que o usuário pode digitar, por exemplo: "Digite aprofundar para eu montar um plano de ação com responsáveis, prazos e KPIs".
- Se o usuário digitar "aprofundar", entregue um plano de ação mais detalhado com etapas, responsáveis, prazo sugerido e indicadores.
- Se faltar contexto, faça no máximo 3 perguntas objetivas antes de aprofundar.
`;

function safeGeminiModel() {
  const value = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim().replace(/^models\//, '');
  return /^[a-zA-Z0-9_.-]+$/.test(value) ? value : 'gemini-2.5-flash';
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.advisorId || !body?.message) return badRequest('Advisor e mensagem são obrigatórios.');

  const user = await getUserFromBearer(request).catch(() => null);
  if (!user) return badRequest('Não autorizado.', 401);

  const advisor = getAdvisor(body.advisorId);
  if (!advisor) return badRequest('Advisor inválido.');

  const supabase = createAdminClient();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const admin = isAdminEmail(user.email);
  let usageNote = '';

  if (!demoMode && !admin) {
    const { data: rowsData, error: rowsError } = await supabase
      .from('advisor_access')
      .select('advisor_id,expires_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

    if (rowsError) return badRequest(rowsError.message, 500);
    const rows = (rowsData || []) as AccessRow[];

    if (!rows.some((row) => row.advisor_id === advisor.id)) return badRequest('Advisor não contratado ou acesso expirado.', 403);

    const policy = resolveMessageLimit(rows);
    const { count, error: countError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', monthStartIso());

    if (countError) return badRequest(countError.message, 500);
    const used = count || 0;
    if (used >= policy.limit) return badRequest(`Limite atingido no ${policy.label}.`, 429);
    usageNote = `\n\n---\nUso restante: ${Math.max(policy.limit - used - 1, 0)}/${policy.limit} (${policy.label}).`;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return badRequest('GEMINI_API_KEY não configurada no backend.', 500);

  const { data: recentMessages } = await supabase
    .from('chat_messages')
    .select('id,role,content,created_at')
    .eq('user_id', user.id)
    .eq('advisor_id', advisor.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(16);

  const history = (recentMessages || [])
    .reverse()
    .map((message) => {
      const label = message.role === 'user' ? 'Usuário' : 'Advisor';
      return `${label}: ${String(message.content || '').slice(0, 3000)}`;
    })
    .join('\n\n');

  const prompt = String(body.message).slice(0, 12000);
  const contextualPrompt = history
    ? `Histórico recente desta conversa com o usuário:\n\n${history}\n\nMensagem atual do usuário:\n${prompt}\n\nResponda considerando o histórico acima, mantendo continuidade e priorizando objetividade.`
    : prompt;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: safeGeminiModel(),
    systemInstruction: `${advisor.systemPrompt}\n\n${responsePlaybook}`
  });

  const result = await model.generateContent(contextualPrompt);
  const text = `${result.response.text() || 'Não consegui gerar resposta nesta tentativa.'}${usageNote}`;

  await supabase.from('chat_messages').insert([
    { user_id: user.id, advisor_id: advisor.id, role: 'user', content: prompt },
    { user_id: user.id, advisor_id: advisor.id, role: 'assistant', content: text }
  ]);

  return NextResponse.json({ ok: true, answer: text, advisors: advisors.length });
}
