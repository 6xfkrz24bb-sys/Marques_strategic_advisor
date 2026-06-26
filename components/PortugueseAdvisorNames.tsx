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
  ['Diretor de Projetos', 'Diretor de Projetos Estratégicos']
] as const;

function applyPortugueseNames() {
  const elements = document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,span,button');

  elements.forEach((element) => {
    const text = element.textContent?.trim();
    if (!text) return;

    const match = names.find(([current]) => current === text);
    if (match) element.textContent = match[1];
  });
}

export function PortugueseAdvisorNames() {
  useEffect(() => {
    applyPortugueseNames();
    const timer = window.setInterval(applyPortugueseNames, 700);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
