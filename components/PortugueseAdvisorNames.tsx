'use client';

import { useEffect } from 'react';

const names = [
  ['CEO Advisor', 'CEO'],
  ['Chief Executive Officer', 'Diretor Executivo Geral'],
  ['COO Advisor', 'COO'],
  ['Chief Operating Officer', 'Diretor de Operações'],
  ['CFO - Tesouraria', 'CFO'],
  ['Chief Financial Officer', 'Diretor Financeiro e Tesouraria'],
  ['Controller Advisor', 'Controller'],
  ['Controladoria Executiva', 'Diretor de Controladoria'],
  ['Pricing Advisor', 'Pricing'],
  ['Estratégia de Preços e Margem', 'Diretor de Preços e Margem'],
  ['CSO - Vendas', 'CSO'],
  ['Chief Sales Officer', 'Diretor Comercial e Vendas'],
  ['CMO - Marketing', 'CMO'],
  ['Chief Marketing Officer', 'Diretor de Marketing'],
  ['Supply Chain Advisor', 'Supply Chain'],
  ['Diretor de Supply Chain', 'Diretor de Cadeia de Suprimentos'],
  ['CSCO - Logística', 'CSCO'],
  ['CPO - Procurement', 'CPO'],
  ['Chief Procurement Officer', 'Diretor de Compras Estratégicas'],
  ['General Counsel', 'Jurídico'],
  ['Diretor Jurídico', 'Diretor Jurídico e Contratos'],
  ['CHRO - RH', 'CHRO'],
  ['Chief Human Resources Officer', 'Diretor de Recursos Humanos'],
  ['CTO - Tecnologia e IA', 'CTO'],
  ['Chief Technology Officer', 'Diretor de Tecnologia e IA'],
  ['Risk & Compliance', 'Riscos e Compliance'],
  ['PMO Advisor', 'PMO'],
  ['Diretor de Projetos', 'Diretor de Projetos Estratégicos'],
  ['Cadastro do novo usuário', 'Peça seu diagnóstico']
] as const;

const copy = [
  [
    'Preencha como pessoa física ou pessoa jurídica. Use CPF para empresário individual/pessoa física e CNPJ para empresas constituídas. Os dados entram no funil de diagnóstico consultivo.',
    'Informe os dados do negócio para o advisor entender contexto, porte, estrutura e prioridades. Quanto mais claro o desafio, melhor será o diagnóstico.'
  ]
] as const;

const placeholders = [
  ['Nome completo ou razão social *', 'Empresa, negócio ou nome do responsável *'],
  ['Nome fantasia ou marca', 'Segmento de atuação / tipo de negócio'],
  ['CPF ou CNPJ *', 'Faturamento mensal ou anual *'],
  ['Principal desafio', 'Principal objetivo do diagnóstico'],
  ['Contato responsável', 'Estrutura organizacional / nº de colaboradores'],
  ['E-mail *', 'E-mail do responsável *'],
  ['WhatsApp', 'WhatsApp para contato'],
  ['Cidade', 'Cidade / região de atuação'],
  ['UF', 'UF / Estado'],
  [
    'Descreva o negócio, dores, objetivos, área crítica, faturamento aproximado ou contexto para o diagnóstico.',
    'Descreva com detalhes as principais dores do negócio, objetivos, gargalos, área crítica, faturamento aproximado, estrutura atual e qualquer contexto que ajude o advisor a preparar um diagnóstico mais preciso.'
  ]
] as const;

function applyBusinessDiagnosticForm() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('section'));
  const section = sections.find((item) => {
    const text = item.textContent?.toLowerCase() || '';
    return text.includes('peça seu diagnóstico') || text.includes('cadastro do novo usuário');
  });

  document.getElementById('business-diagnostic-note')?.remove();

  if (!section) return;

  section.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((field) => {
    const current = field.getAttribute('placeholder') || '';
    const match = placeholders.find(([from]) => from === current);
    if (match) field.setAttribute('placeholder', match[1]);

    if (field instanceof HTMLTextAreaElement) {
      field.style.minHeight = '190px';
      field.style.resize = 'vertical';
    }
  });

  const submitButton = Array.from(section.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
    button.textContent?.trim().toLowerCase() === 'solicitar diagnóstico'
  );
  if (submitButton) submitButton.textContent = 'Enviar informações para diagnóstico';
}

function applyPortugueseNames() {
  const elements = document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,span,button');

  elements.forEach((element) => {
    const text = element.textContent?.trim();
    if (!text) return;

    const match = names.find(([current]) => current === text);
    if (match) element.textContent = match[1];

    const copyMatch = copy.find(([current]) => current === text);
    if (copyMatch) element.textContent = copyMatch[1];
  });

  applyBusinessDiagnosticForm();
}

export function PortugueseAdvisorNames() {
  useEffect(() => {
    applyPortugueseNames();
    const timer = window.setInterval(applyPortugueseNames, 400);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
