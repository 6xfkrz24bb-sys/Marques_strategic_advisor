import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';
import pptxgen from 'pptxgenjs';
import { NextRequest, NextResponse } from 'next/server';
import { getAdvisor } from '@/lib/advisors';
import { badRequest, getUserFromBearer, serverError } from '@/lib/http';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail, type AccessRow } from '@/lib/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DeliverableType = 'report' | 'spreadsheet' | 'presentation';
type StructuredDeliverable = {
  title: string;
  executiveSummary: string;
  diagnosis: string;
  rootCauses: string[];
  risks: string[];
  recommendations: string[];
  actionItems: string[];
  kpis: string[];
  nextDecision: string;
  slides: { title: string; bullets: string[] }[];
};

const mimeByType: Record<DeliverableType, string> = {
  report: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  spreadsheet: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  presentation: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

const extensionByType: Record<DeliverableType, string> = { report: 'docx', spreadsheet: 'xlsx', presentation: 'pptx' };

function safeGeminiModel() {
  const value = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim().replace(/^models\//, '');
  return /^[a-zA-Z0-9_.-]+$/.test(value) ? value : 'gemini-2.5-flash';
}

function sanitizeFileName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 80) || 'entregavel';
}

function asStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 12) : fallback;
}

function normalizeDeliverable(value: Partial<StructuredDeliverable> | null, advisorTitle: string): StructuredDeliverable {
  return {
    title: String(value?.title || `Entregável Executivo - ${advisorTitle}`).slice(0, 140),
    executiveSummary: String(value?.executiveSummary || 'Síntese executiva gerada a partir do histórico recente da conversa com o advisor.'),
    diagnosis: String(value?.diagnosis || 'Diagnóstico inicial: priorizar clareza de problema, impactos financeiros, responsáveis e cadência de execução.'),
    rootCauses: asStringArray(value?.rootCauses, ['Causa raiz a validar: ausência de indicadores, processo decisório fragmentado ou baixa cadência de execução.']),
    risks: asStringArray(value?.risks, ['Risco de perda de margem, piora de caixa, retrabalho gerencial ou atraso na decisão crítica.']),
    recommendations: asStringArray(value?.recommendations, ['Definir uma prioridade executiva, dono, prazo, indicador e rotina semanal de acompanhamento.']),
    actionItems: asStringArray(value?.actionItems, ['Formalizar plano de ação de 30 dias com responsáveis, marcos e KPIs.']),
    kpis: asStringArray(value?.kpis, ['EBITDA/margem', 'Caixa projetado', 'SLA de execução', 'Aderência ao plano de ação']),
    nextDecision: String(value?.nextDecision || 'Decidir a prioridade número 1 da próxima semana e alocar responsável executivo.'),
    slides: Array.isArray(value?.slides) && value.slides.length
      ? value.slides.slice(0, 8).map((slide) => ({ title: String(slide.title || 'Slide executivo'), bullets: asStringArray(slide.bullets, []) }))
      : [
          { title: 'Síntese executiva', bullets: ['Contexto crítico', 'Diagnóstico', 'Decisão recomendada'] },
          { title: 'Plano de ação', bullets: ['Responsável', 'Prazo', 'KPI de controle'] }
        ]
  };
}

async function generateStructuredContent(advisor: NonNullable<ReturnType<typeof getAdvisor>>, history: string): Promise<StructuredDeliverable> {
  const fallback = normalizeDeliverable(null, advisor.title);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: safeGeminiModel(), systemInstruction: advisor.systemPrompt });
    const result = await model.generateContent(`Com base no histórico abaixo, gere um entregável executivo em JSON válido, sem markdown, com as chaves: title, executiveSummary, diagnosis, rootCauses[], risks[], recommendations[], actionItems[], kpis[], nextDecision, slides[] onde cada slide tem title e bullets[]. Português do Brasil.\n\nHistórico:\n${history || 'Sem histórico suficiente; gere um plano executivo inicial para este advisor.'}`);
    const raw = result.response.text().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return normalizeDeliverable(JSON.parse(raw), advisor.title);
  } catch {
    return fallback;
  }
}

function section(title: string, items: string[]) {
  return [new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }), ...items.map((item) => new Paragraph({ children: [new TextRun('• '), new TextRun(item)] }))];
}

async function buildDocx(content: StructuredDeliverable) {
  const doc = new Document({ sections: [{ children: [
    new Paragraph({ text: content.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: 'Sumário executivo', heading: HeadingLevel.HEADING_1 }),
    new Paragraph(content.executiveSummary),
    new Paragraph({ text: 'Diagnóstico', heading: HeadingLevel.HEADING_1 }),
    new Paragraph(content.diagnosis),
    ...section('Causas raiz', content.rootCauses),
    ...section('Riscos', content.risks),
    ...section('Recomendações', content.recommendations),
    ...section('Plano de ação', content.actionItems),
    ...section('KPIs', content.kpis),
    new Paragraph({ text: 'Próxima decisão', heading: HeadingLevel.HEADING_1 }),
    new Paragraph(content.nextDecision)
  ] }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

async function buildXlsx(content: StructuredDeliverable) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Marques Strategic Advisor';
  const summary = workbook.addWorksheet('Resumo Executivo');
  summary.addRows([['Título', content.title], ['Sumário', content.executiveSummary], ['Diagnóstico', content.diagnosis], ['Próxima decisão', content.nextDecision]]);
  summary.columns = [{ width: 24 }, { width: 100 }];
  const plan = workbook.addWorksheet('Plano de Ação');
  plan.addRow(['Tipo', 'Item']);
  [['Causa raiz', content.rootCauses], ['Risco', content.risks], ['Recomendação', content.recommendations], ['Ação', content.actionItems], ['KPI', content.kpis]].forEach(([label, items]) => {
    (items as string[]).forEach((item) => plan.addRow([label, item]));
  });
  plan.columns = [{ width: 22 }, { width: 100 }];
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function buildPptx(content: StructuredDeliverable) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  const title = pptx.addSlide();
  title.background = { color: '020617' };
  title.addText(content.title, { x: 0.7, y: 1.5, w: 11.8, h: 0.8, color: 'F59E0B', fontSize: 30, bold: true });
  title.addText(content.executiveSummary, { x: 0.7, y: 2.5, w: 11.2, h: 1.5, color: 'E2E8F0', fontSize: 16, fit: 'shrink' });
  content.slides.forEach((item) => {
    const slide = pptx.addSlide();
    slide.background = { color: '020617' };
    slide.addText(item.title, { x: 0.6, y: 0.5, w: 12, h: 0.5, color: 'F59E0B', fontSize: 24, bold: true });
    slide.addText(item.bullets.map((bullet) => `• ${bullet}`).join('\n'), { x: 0.8, y: 1.3, w: 11.5, h: 4.5, color: 'E2E8F0', fontSize: 18, breakLine: false, fit: 'shrink' });
  });
  return Buffer.from(await pptx.write({ outputType: 'nodebuffer' }) as Buffer);
}

async function validateAccess(supabase: ReturnType<typeof createAdminClient>, userId: string, email: string | undefined, advisorId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || isAdminEmail(email)) return true;
  const { data, error } = await supabase.from('advisor_access').select('advisor_id,expires_at').eq('user_id', userId).eq('status', 'active').or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);
  if (error) throw error;
  return ((data || []) as AccessRow[]).some((row) => row.advisor_id === advisorId);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const type = body?.type as DeliverableType;
  if (!body?.advisorId || !['report', 'spreadsheet', 'presentation'].includes(type)) return badRequest('Advisor e tipo de entregável são obrigatórios.');

  const user = await getUserFromBearer(request).catch(() => null);
  if (!user) return badRequest('Não autorizado.', 401);

  const advisor = getAdvisor(body.advisorId);
  if (!advisor) return badRequest('Advisor inválido.');

  const supabase = createAdminClient();
  try {
    const hasAccess = await validateAccess(supabase, user.id, user.email, advisor.id);
    if (!hasAccess) return badRequest('Advisor não contratado ou acesso expirado.', 403);
  } catch {
    return serverError();
  }

  const { data: recentMessages } = await supabase.from('chat_messages').select('id,role,content,created_at').eq('user_id', user.id).eq('advisor_id', advisor.id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(20);
  const history = (recentMessages || []).reverse().map((message) => `${message.role === 'user' ? 'Usuário' : 'Advisor'}: ${String(message.content || '').slice(0, 3000)}`).join('\n\n');
  const content = await generateStructuredContent(advisor, history);
  const fileName = `${sanitizeFileName(content.title)}-${Date.now()}.${extensionByType[type]}`;
  const buffer = type === 'report' ? await buildDocx(content) : type === 'spreadsheet' ? await buildXlsx(content) : await buildPptx(content);

  await supabase.from('generated_deliverables').insert({
    user_id: user.id,
    advisor_id: advisor.id,
    deliverable_type: type,
    title: content.title,
    file_name: fileName,
    mime_type: mimeByType[type],
    metadata: { source: 'advisor_chat', message_count: recentMessages?.length || 0, generated_at: new Date().toISOString() }
  });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeByType[type],
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store'
    }
  });
}
