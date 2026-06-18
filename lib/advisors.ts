export type Advisor = {
  id: string;
  title: string;
  boardTitle: string;
  price: number;
  icon: string;
  desc: string;
  questions: string[];
  systemPrompt: string;
};

const executiveStructure = `Use esta estrutura, em português do Brasil, com linguagem executiva e objetiva:
1. Diagnóstico inicial
2. Causa provável
3. Riscos envolvidos
4. Recomendações executivas
5. Plano de ação prático com priorização
6. Indicadores de acompanhamento (KPIs)
7. Próxima melhor decisão`;

export const advisors: Advisor[] = [
  {
    id: 'ceo',
    title: 'CEO Advisor',
    boardTitle: 'Chief Executive Officer',
    price: 80,
    icon: 'Crown',
    desc: 'Estratégia corporativa, priorização, governança e decisões de crescimento.',
    questions: [
      'A empresa possui plano estratégico formal para os próximos 12 meses?',
      'As metas estão claramente desdobradas por área e responsável?',
      'A diretoria acompanha indicadores críticos semanalmente?',
      'Existe clareza sobre quais iniciativas geram maior EBITDA?',
      'A empresa tem rotina de gestão e governança de decisões?',
      'Os principais riscos do negócio estão mapeados e priorizados?',
      'O modelo de crescimento atual é escalável sem aumentar a mesma proporção de custos?',
      'Existe plano de sucessão para funções críticas?',
      'A empresa mede produtividade gerencial por entrega e não apenas por esforço?',
      'A liderança possui rituais de execução com plano de ação e follow-up?'
    ],
    systemPrompt: `Você é o CEO Advisor da Marques Strategic Advisor, consultor de alta performance para pequenas e médias empresas. Ajude o cliente a priorizar decisões, crescimento, margem, governança, pessoas e execução. ${executiveStructure}`
  },
  {
    id: 'coo',
    title: 'COO Advisor',
    boardTitle: 'Chief Operating Officer',
    price: 70,
    icon: 'Workflow',
    desc: 'Processos, produtividade, rotina de gestão, padronização e escala operacional.',
    questions: [
      'Os processos críticos estão documentados em fluxos claros?',
      'A empresa mede produtividade por processo e por equipe?',
      'Existem gargalos operacionais recorrentes sem dono definido?',
      'As áreas trabalham com SLA interno?',
      'Há rotina de melhoria contínua com ganhos mensuráveis?',
      'O retrabalho é medido e tratado como custo?',
      'A operação consegue crescer sem depender dos mesmos gestores para tudo?',
      'Existe matriz de responsabilidades clara entre áreas?',
      'Os indicadores operacionais são acompanhados em painel executivo?',
      'Os planos de ação têm prazos, donos e status atualizados?'
    ],
    systemPrompt: `Você é o COO Advisor da Marques Strategic Advisor. Foque em processos, produtividade, governança operacional, eliminação de gargalos e escala. ${executiveStructure}`
  },
  {
    id: 'financeiro',
    title: 'CFO - Tesouraria',
    boardTitle: 'Chief Financial Officer',
    price: 60,
    icon: 'CreditCard',
    desc: 'Fluxo de caixa, capital de giro, DRE, margem e disciplina financeira.',
    questions: [
      'Seu fechamento financeiro ocorre em menos de 5 dias úteis?',
      'Existe fluxo de caixa projetado para pelo menos 13 semanas?',
      'A empresa separa caixa operacional, investimentos e distribuição de lucros?',
      'As margens por produto, cliente ou canal são revisadas mensalmente?',
      'Existe controle de inadimplência por aging e plano de cobrança?',
      'A empresa tem orçamento anual e forecast revisado mensalmente?',
      'As despesas fixas são acompanhadas por centro de custo?',
      'O capital de giro é acompanhado por ciclo financeiro?',
      'A diretoria recebe DRE gerencial com indicadores de margem?',
      'Existe política clara de aprovação de pagamentos?'
    ],
    systemPrompt: `Você é o CFO e Diretor Executivo de Tesouraria da Marques Strategic Advisor. Foque em caixa, capital de giro, DRE, margem, liquidez e disciplina financeira. ${executiveStructure}`
  },
  {
    id: 'controller',
    title: 'Controller Advisor',
    boardTitle: 'Controladoria Executiva',
    price: 60,
    icon: 'Calculator',
    desc: 'Orçamento, centros de custo, DRE gerencial, auditoria e controles internos.',
    questions: [
      'A empresa possui DRE gerencial confiável e recorrente?',
      'Centros de custo e contas contábeis estão corretamente estruturados?',
      'Existe conciliação entre financeiro, fiscal e contábil?',
      'O orçamento é comparado com realizado todos os meses?',
      'As provisões são registradas antes do fechamento?',
      'Existe matriz de alçadas para compras e pagamentos?',
      'Os principais controles internos são testados periodicamente?',
      'Relatórios gerenciais são usados para decisões, não apenas fechamento?',
      'Há auditoria de cadastros, contratos e pagamentos recorrentes?',
      'O EBITDA é acompanhado com ajustes e explicações gerenciais?'
    ],
    systemPrompt: `Você é o Controller Advisor da Marques Strategic Advisor. Foque em controladoria, DRE gerencial, orçamento, controles internos, compliance financeiro e EBITDA. ${executiveStructure}`
  },
  {
    id: 'pricing',
    title: 'Pricing Advisor',
    boardTitle: 'Estratégia de Preços e Margem',
    price: 55,
    icon: 'BadgeDollarSign',
    desc: 'Precificação, margem de contribuição, elasticidade e política comercial.',
    questions: [
      'A precificação considera custo total, impostos, frete e margem desejada?',
      'A empresa conhece margem por SKU, canal e cliente?',
      'Existe política formal de descontos e aprovações?',
      'A margem perdida por desconto é medida mensalmente?',
      'O preço é revisado quando custos relevantes mudam?',
      'Existe análise de elasticidade ou sensibilidade de preço?',
      'Produtos de curva A possuem estratégia específica de margem?',
      'A equipe comercial é remunerada por margem e não apenas faturamento?',
      'A empresa monitora preços concorrentes de forma estruturada?',
      'Há governança para exceções comerciais?'
    ],
    systemPrompt: `Você é o Pricing Advisor da Marques Strategic Advisor. Foque em margem, precificação, elasticidade, política comercial, rentabilidade por cliente e captura de valor. ${executiveStructure}`
  },
  {
    id: 'comercial',
    title: 'CSO - Vendas',
    boardTitle: 'Chief Sales Officer',
    price: 50,
    icon: 'Target',
    desc: 'Pipeline, CRM, metas, conversão, ticket médio e expansão de receita.',
    questions: [
      'O processo de vendas está formalizado em playbook?',
      'O CRM é usado diariamente com disciplina e dados confiáveis?',
      'As metas anuais estão desdobradas por vendedor e canal?',
      'Existe análise de perda de vendas por motivo?',
      'O forecast tem erro inferior a 10%?',
      'O comissionamento prioriza margem e mix estratégico?',
      'O ticket médio cresceu nos últimos 12 meses?',
      'Clientes de curva A possuem plano de crescimento?',
      'A equipe comercial recebe treinamento técnico recorrente?',
      'O ciclo de vendas é medido e gerenciado?'
    ],
    systemPrompt: `Você é o CSO Advisor da Marques Strategic Advisor. Foque em vendas, pipeline, CRM, conversão, metas e crescimento rentável. ${executiveStructure}`
  },
  {
    id: 'marketing',
    title: 'CMO - Marketing',
    boardTitle: 'Chief Marketing Officer',
    price: 50,
    icon: 'Megaphone',
    desc: 'Posicionamento, branding, aquisição, conteúdo, funil e ROI de campanhas.',
    questions: [
      'A empresa conhece seu CAC por canal?',
      'O LTV do cliente é pelo menos 3x maior que o CAC?',
      'Existe ROI calculado por campanha?',
      'Marketing e vendas compartilham o mesmo funil?',
      'A estratégia de SEO e conteúdo gera leads qualificados?',
      'A marca possui posicionamento claro e consistente?',
      'Há régua de relacionamento automatizada?',
      'A taxa de conversão das landing pages é monitorada?',
      'A empresa mede NPS ou satisfação do cliente?',
      'Existe estratégia ativa de retenção e recompra?'
    ],
    systemPrompt: `Você é o CMO Advisor da Marques Strategic Advisor. Foque em posicionamento, geração de demanda, ROI, funil, marca e crescimento. ${executiveStructure}`
  },
  {
    id: 'supply-chain',
    title: 'Supply Chain Advisor',
    boardTitle: 'Diretor de Supply Chain',
    price: 50,
    icon: 'Boxes',
    desc: 'S&OP, demanda, estoque, abastecimento, nível de serviço e capital empatado.',
    questions: [
      'A empresa possui rotina formal de S&OP mensal?',
      'A acuracidade de previsão de demanda é medida?',
      'O estoque é classificado por curva ABC e giro?',
      'Existem rupturas recorrentes em itens críticos?',
      'Há excesso de estoque parado ou obsoleto?',
      'O nível de serviço é acompanhado por cliente/canal?',
      'Compras, vendas e logística usam a mesma previsão?',
      'O capital empatado em estoque tem meta definida?',
      'A política de estoque considera lead time e variabilidade?',
      'Há plano para reduzir ruptura sem aumentar estoque total?'
    ],
    systemPrompt: `Você é o Supply Chain Advisor da Marques Strategic Advisor. Foque em S&OP, estoque, demanda, nível de serviço, abastecimento e capital de giro. ${executiveStructure}`
  },
  {
    id: 'logistica',
    title: 'CSCO - Logística',
    boardTitle: 'Diretor de Logística',
    price: 40,
    icon: 'Truck',
    desc: 'Malha logística, frete, armazenagem, transportadores, auditoria e nível de serviço.',
    questions: [
      'Sua operação possui visibilidade de custos por rota?',
      'A ocupação média dos veículos está acima de 85%?',
      'Existe processo formal de auditoria de frete?',
      'O lead time é medido contra SLA por rota?',
      'O custo logístico é acompanhado como % do faturamento?',
      'Há WMS ou controle estruturado de armazenagem?',
      'Sua malha logística foi revisada nos últimos 12 meses?',
      'Existem oportunidades de backhaul ou triangulação mapeadas?',
      'Transportadores são avaliados por custo e performance?',
      'A logística reversa é gerenciada como processo?'
    ],
    systemPrompt: `Você é o CSCO Advisor da Marques Strategic Advisor. Foque em custo logístico, malha, armazenagem, transportes, auditoria de frete, nível de serviço e saving. ${executiveStructure}`
  },
  {
    id: 'procurement',
    title: 'CPO - Procurement',
    boardTitle: 'Chief Procurement Officer',
    price: 40,
    icon: 'BriefcaseBusiness',
    desc: 'Strategic sourcing, TCO, SRM, compliance, contratos e redução de custos.',
    questions: [
      'Strategic sourcing é aplicado em categorias de curva A?',
      'A matriz de Kraljic é usada para estratégia de fornecimento?',
      'O TCO é critério relevante de decisão?',
      'Fornecedores críticos possuem plano de mitigação de risco?',
      'Existe bidding sistemático para renovações relevantes?',
      'Compras possui metas de saving validadas?',
      'Itens transacionais são automatizados?',
      'SLAs de fornecedores são monitorados?',
      'Existe programa de SRM para parceiros estratégicos?',
      'A política de compras reduz riscos fiscais e trabalhistas?'
    ],
    systemPrompt: `Você é o CPO Advisor da Marques Strategic Advisor. Foque em sourcing, negociação, TCO, contratos, SRM, compliance e saving. ${executiveStructure}`
  },
  {
    id: 'juridico',
    title: 'General Counsel',
    boardTitle: 'Diretor Jurídico',
    price: 60,
    icon: 'Scale',
    desc: 'Contratos, governança, riscos, LGPD, compliance e proteção patrimonial.',
    questions: [
      'A estrutura societária protege o patrimônio pessoal dos sócios?',
      'Existe programa formal de compliance?',
      'O passivo trabalhista é monitorado?',
      'Contratos com clientes e fornecedores são revisados periodicamente?',
      'A marca e propriedade intelectual estão protegidas?',
      'Existe manual de governança decisória?',
      'A empresa cumpre a LGPD com evidências?',
      'O acordo de sócios está atualizado?',
      'O contencioso é gerido por risco e valor envolvido?',
      'As principais obrigações legais possuem donos internos?'
    ],
    systemPrompt: `Você é o General Counsel Advisor da Marques Strategic Advisor. Foque em risco contratual, compliance, LGPD, governança, blindagem patrimonial e passivos. ${executiveStructure}`
  },
  {
    id: 'rh',
    title: 'CHRO - RH',
    boardTitle: 'Chief Human Resources Officer',
    price: 40,
    icon: 'UsersRound',
    desc: 'Cultura, liderança, desempenho, cargos e salários, clima e produtividade.',
    questions: [
      'O turnover voluntário está abaixo da média do setor?',
      'Existe onboarding formal e documentado?',
      'Pesquisa de clima é realizada e gera plano de ação?',
      'Líderes passam por avaliação de desempenho?',
      'Há matriz de sucessão para posições críticas?',
      'O passivo trabalhista é monitorado?',
      'Existe orçamento de treinamento e desenvolvimento?',
      'Cargos e salários estão atualizados?',
      'Entrevistas de desligamento geram ações concretas?',
      'Metas de RH estão ligadas ao resultado financeiro?'
    ],
    systemPrompt: `Você é o CHRO Advisor da Marques Strategic Advisor. Foque em pessoas, cultura, liderança, desempenho, remuneração, produtividade e risco trabalhista. ${executiveStructure}`
  },
  {
    id: 'technology',
    title: 'CTO - Tecnologia e IA',
    boardTitle: 'Chief Technology Officer',
    price: 60,
    icon: 'Cpu',
    desc: 'ERP, automações, IA, integrações, segurança, dados e eficiência digital.',
    questions: [
      'A empresa possui ERP bem parametrizado e com dados confiáveis?',
      'Processos repetitivos são automatizados?',
      'Há integrações entre financeiro, estoque, vendas e logística?',
      'A empresa possui política mínima de segurança da informação?',
      'Backups e acessos críticos são gerenciados?',
      'Existe roadmap de tecnologia com ROI esperado?',
      'Indicadores são extraídos automaticamente dos sistemas?',
      'IA já é usada em processos administrativos ou comerciais?',
      'Há controle de licenças, SaaS e custos de tecnologia?',
      'Os dados mestres são padronizados e auditáveis?'
    ],
    systemPrompt: `Você é o CTO Advisor da Marques Strategic Advisor. Foque em sistemas, automações, IA, integração de dados, segurança, ERP e produtividade digital. ${executiveStructure}`
  },
  {
    id: 'risk-compliance',
    title: 'Risk & Compliance',
    boardTitle: 'Diretor de Riscos e Compliance',
    price: 50,
    icon: 'ShieldCheck',
    desc: 'Controles internos, riscos corporativos, auditoria, LGPD e prevenção de perdas.',
    questions: [
      'A empresa possui mapa de riscos atualizado?',
      'Riscos críticos possuem responsáveis e planos de mitigação?',
      'Há trilha de aprovação para despesas relevantes?',
      'Cadastros críticos são auditados?',
      'Existe política antifraude ou canal de denúncias?',
      'A LGPD é tratada com processos documentados?',
      'Fornecedores críticos passam por due diligence?',
      'Há testes periódicos de controles internos?',
      'Perdas operacionais são medidas e classificadas?',
      'A diretoria recebe reporte periódico de riscos?'
    ],
    systemPrompt: `Você é o Risk & Compliance Advisor da Marques Strategic Advisor. Foque em controles internos, riscos corporativos, fraudes, compliance, auditoria e prevenção de perdas. ${executiveStructure}`
  },
  {
    id: 'pmo',
    title: 'PMO Advisor',
    boardTitle: 'Diretor de Projetos',
    price: 40,
    icon: 'ClipboardList',
    desc: 'Projetos, cronograma, ROI, status executivo, governança e execução.',
    questions: [
      'Projetos estratégicos possuem business case aprovado?',
      'Cada projeto tem cronograma, dono, escopo e ROI definidos?',
      'A empresa usa status report executivo semanal?',
      'Riscos e impedimentos são tratados em fórum adequado?',
      'Existe priorização formal de portfólio?',
      'Os benefícios prometidos são medidos após a implantação?',
      'Mudanças de escopo têm aprovação formal?',
      'Há rotina de governança de projetos?',
      'Projetos atrasados possuem plano de recuperação?',
      'A liderança sabe quais projetos devem parar ou continuar?'
    ],
    systemPrompt: `Você é o PMO Advisor da Marques Strategic Advisor. Foque em gestão de projetos, governança, cronograma, ROI, priorização e execução. ${executiveStructure}`
  }
];

export function getAdvisor(id: string) {
  return advisors.find((advisor) => advisor.id === id);
}

export function calculateBoardPrice(ids: string[]) {
  const unique = Array.from(new Set(ids));
  const total = unique.reduce((sum, id) => sum + (getAdvisor(id)?.price ?? 0), 0);
  return unique.length >= 6 ? Math.min(total, 250) : total;
}
