'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  BadgeDollarSign,
  Boxes,
  BriefcaseBusiness,
  Calculator,
  ClipboardList,
  Cpu,
  CreditCard,
  Crown,
  LogOut,
  Megaphone,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  UsersRound,
  Workflow
} from 'lucide-react';
import { advisors, calculateBoardPrice, getAdvisor } from '@/lib/advisors';
import { createClient } from '@/lib/supabase/client';

type ViewName = 'landing' | 'advisors' | 'diagnostic' | 'login' | 'panel' | 'suppliers' | 'contact';
type AuthMode = 'login' | 'register';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

type SupplierForm = {
  legalName: string;
  tradeName: string;
  taxId: string;
  category: string;
  contactName: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  notes: string;
};

const iconMap = {
  BadgeDollarSign,
  Boxes,
  BriefcaseBusiness,
  Calculator,
  ClipboardList,
  Cpu,
  CreditCard,
  Crown,
  Megaphone,
  Scale,
  ShieldCheck,
  Target,
  Truck,
  UsersRound,
  Workflow
};

const heroPhrases = [
  'Vazando lucro? Estanque ineficiências que consomem margem, caixa e capacidade de crescimento.',
  'Queimando caixa? Estruture decisões executivas com disciplina financeira, logística e compras estratégicas.',
  'Crescendo no improviso? Transforme conhecimento gerencial em rotina, indicadores e execução.',
  'Precisa de board sem contratar diretoria? Advisors executivos sob demanda para decisões críticas.'
];

const emptySupplierForm: SupplierForm = {
  legalName: '',
  tradeName: '',
  taxId: '',
  category: '',
  contactName: '',
  email: '',
  whatsapp: '',
  city: '',
  state: '',
  notes: ''
};

const subscriptionPlans = {
  essential: {
    name: 'Plano Essencial',
    price: 97,
    label: '1 advisor executivo',
    description: 'Ideal para testar uma área crítica da gestão com apoio consultivo.',
    link: 'https://mpago.la/1YkeHXN'
  },
  executive: {
    name: 'Plano Executivo',
    price: 197,
    label: 'Até 4 advisors executivos',
    description: 'Mini board executivo para financeiro, operação, vendas, compras, RH ou logística.',
    link: 'https://mpago.la/2GkAEwm'
  },
  pro: {
    name: 'Board Pro',
    price: 297,
    label: 'Todos os advisors executivos',
    description: 'Acesso completo ao board estratégico para apoiar decisões de gestão em todas as áreas.',
    link: 'https://mpago.la/1rhJ6B5'
  }
};

type SubscriptionPlanKey = keyof typeof subscriptionPlans;

function getPlanByAdvisorCount(count: number): SubscriptionPlanKey | null {
  if (count <= 0) return null;
  if (count === 1) return 'essential';
  if (count <= 4) return 'executive';
  return 'pro';
}

function getPlanAdvisorLimit(planKey: SubscriptionPlanKey) {
  if (planKey === 'essential') return 1;
  if (planKey === 'executive') return 4;
  return advisors.length;
}

export function AdvisorPlatform() {
  const supabase = useMemo(() => createClient(), []);
  const [view, setView] = useState<ViewName>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<string[]>([]);
  const [activeAdvisorId, setActiveAdvisorId] = useState<string>('ceo');
  const [paidAdvisorIds, setPaidAdvisorIds] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [diagnosticAdvisorId, setDiagnosticAdvisorId] = useState('ceo');
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [chatInput, setChatInput] = useState('');
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(emptySupplierForm);
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);

  const selectedTotal = calculateBoardPrice(selectedAdvisorIds);
  const selectedPlanKey = getPlanByAdvisorCount(selectedAdvisorIds.length);
  const selectedPlan = selectedPlanKey ? subscriptionPlans[selectedPlanKey] : null;
  const activeAdvisor = getAdvisor(activeAdvisorId) ?? advisors[0];
  const diagnosticAdvisor = getAdvisor(diagnosticAdvisorId) ?? advisors[0];
  const currentScore = quizFinished ? Math.round((quizAnswers.filter(Boolean).length / diagnosticAdvisor.questions.length) * 100) : 0;
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const timer = window.setInterval(() => setPhraseIndex((current) => (current + 1) % heroPhrases.length), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (session) void loadAdvisorAccess();
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      setAlertMessage('Pagamento recebido. A liberação pode levar alguns segundos enquanto o Mercado Pago confirma o webhook.');
      setView('panel');
      void loadAdvisorAccess();
    } else if (payment === 'pending') {
      setAlertMessage('Pagamento pendente. O acesso será liberado quando o Mercado Pago confirmar a aprovação.');
    } else if (payment === 'failure') {
      setAlertMessage('Pagamento não concluído. Você pode tentar novamente pelo checkout.');
    }
  }, []);

  async function loadAdvisorAccess() {
    if (!session?.access_token) return;
    if (demoMode) {
      const fallback = selectedAdvisorIds.length ? selectedAdvisorIds : ['ceo', 'coo', 'financeiro'];
      setPaidAdvisorIds(fallback);
      setActiveAdvisorId(fallback[0]);
      return;
    }

    const response = await fetch('/api/advisors/access', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const json = await response.json().catch(() => null);
    if (json?.ok) {
      setPaidAdvisorIds(json.advisorIds || []);
      if (json.advisorIds?.[0]) setActiveAdvisorId(json.advisorIds[0]);
    }
  }

  function navigate(nextView: ViewName) {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleAdvisor(id: string) {
    setSelectedAdvisorIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function startDiagnostic(id: string) {
    setDiagnosticAdvisorId(id);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizFinished(false);
    navigate('diagnostic');
  }

  async function submitLeadAndStartQuiz(event: React.FormEvent) {
    event.preventDefault();
    if (!leadName || !leadEmail) return;
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizFinished(false);
    setAlertMessage('Usuário cadastrado. Responda ao diagnóstico gratuito.');
  }

  async function answerQuestion(answer: boolean) {
    const nextAnswers = [...quizAnswers, answer];
    setQuizAnswers(nextAnswers);
    if (quizStep + 1 >= diagnosticAdvisor.questions.length) {
      setQuizFinished(true);
      const score = Math.round((nextAnswers.filter(Boolean).length / diagnosticAdvisor.questions.length) * 100);
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          whatsapp: leadWhatsapp,
          company: leadCompany,
          agentId: diagnosticAdvisorId,
          score,
          answers: nextAnswers,
          source: 'diagnostic'
        })
      }).catch(() => null);
    } else {
      setQuizStep((current) => current + 1);
    }
  }

  async function submitAuth(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const result = authMode === 'login'
        ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
        : await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: { data: { full_name: authName } }
          });

      if (result.error) throw result.error;
      setAlertMessage(authMode === 'login' ? 'Login realizado.' : 'Conta criada. Verifique seu e-mail se a confirmação estiver ativa no Supabase.');
      if (selectedAdvisorIds.length) await startCheckout();
      else navigate('panel');
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : 'Falha na autenticação.');
    } finally {
      setIsBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPaidAdvisorIds([]);
    setSession(null);
    navigate('landing');
  }

  async function startCheckout() {
    if (!selectedAdvisorIds.length) {
      setAlertMessage('Selecione pelo menos um advisor para escolher seu plano.');
      navigate('advisors');
      return;
    }

    const planKey = getPlanByAdvisorCount(selectedAdvisorIds.length);
    const plan = planKey ? subscriptionPlans[planKey] : null;

    if (!plan) {
      setAlertMessage('Não foi possível identificar o plano selecionado.');
      return;
    }

    window.location.href = plan.link;
  }

  async function sendChatMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!chatInput.trim()) return;
    const message = chatInput.trim();
    setChatInput('');
    setChatMessages((current) => ({
      ...current,
      [activeAdvisor.id]: [...(current[activeAdvisor.id] || []), { role: 'user', content: message }]
    }));

    if (!session?.access_token) {
      setAlertMessage('Faça login para usar o advisor.');
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ advisorId: activeAdvisor.id, message })
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Falha no advisor.');
      setChatMessages((current) => ({
        ...current,
        [activeAdvisor.id]: [...(current[activeAdvisor.id] || []), { role: 'assistant', content: json.answer }]
      }));
    } catch (error) {
      setChatMessages((current) => ({
        ...current,
        [activeAdvisor.id]: [
          ...(current[activeAdvisor.id] || []),
          { role: 'assistant', content: error instanceof Error ? error.message : 'Erro ao consultar advisor.' }
        ]
      }));
    } finally {
      setIsBusy(false);
    }
  }

  async function submitSupplier(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(supplierForm)
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Falha ao cadastrar usuário.');
      setSupplierForm(emptySupplierForm);
      setAlertMessage('Cadastro recebido com sucesso. Em breve entraremos em contato para o diagnóstico.');
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : 'Erro no cadastro do usuário.');
    } finally {
      setIsBusy(false);
    }
  }

  async function submitContact(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contactEmail, subject: contactSubject, message: contactMessage })
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Falha ao enviar contato.');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      setAlertMessage('Mensagem registrada. Você poderá tratar esse lead no Supabase.');
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : 'Erro ao enviar contato.');
    } finally {
      setIsBusy(false);
    }
  }

  function renderAdvisorIcon(iconName: string) {
    const Icon = iconMap[iconName as keyof typeof iconMap] || Sparkles;
    return <Icon className="h-6 w-6 text-amber-500" />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-slate-950/90 px-4 py-5 backdrop-blur md:px-12">
        <button onClick={() => navigate('landing')} className="flex items-center gap-2 text-left">
          <TrendingUp className="h-6 w-6 text-amber-500" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-100 md:text-xs">Marques Strategic Advisor</span>
        </button>
        <div className="flex flex-wrap items-center justify-end gap-3 text-[9px] font-bold uppercase tracking-widest text-slate-400 md:gap-6 md:text-[10px]">
          <button onClick={() => navigate('advisors')} className="hover:text-amber-500">Advisors</button>
          <button onClick={() => navigate('suppliers')} className="hover:text-amber-500">Diagnóstico</button>
          <button onClick={() => navigate('contact')} className="hover:text-amber-500">Contato</button>
          {session ? (
            <>
              <button onClick={() => navigate('panel')} className="text-amber-500 hover:text-amber-400">Painel</button>
              <button onClick={signOut} className="flex items-center gap-1 hover:text-white"><LogOut className="h-3 w-3" /> Sair</button>
            </>
          ) : (
            <button onClick={() => navigate('login')} className="text-amber-500 hover:text-amber-400">Login</button>
          )}
        </div>
      </nav>

      {alertMessage && (
        <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between gap-4 border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          <span>{alertMessage}</span>
          <button onClick={() => setAlertMessage('')} className="text-amber-300">Fechar</button>
        </div>
      )}

      {view === 'landing' && (
        <section className="view-fade mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center md:py-24">
          <div className="mb-5 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-400">
            Board executivo sob demanda
          </div>
          <h1 className="max-w-4xl text-4xl font-extralight leading-tight text-white md:text-6xl">
            Consultoria estratégica com <span className="font-normal text-amber-500">advisors executivos</span> por assinatura.
          </h1>
          <p className="mt-6 min-h-16 max-w-2xl text-sm font-light leading-relaxed text-slate-400 md:text-lg">{heroPhrases[phraseIndex]}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => navigate('advisors')} className="bg-amber-500 px-8 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-950 hover:bg-amber-400">
              Conhecer advisors
            </button>
            <button onClick={() => navigate('suppliers')} className="border border-white/10 px-8 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-white hover:bg-white/5">
              Solicitar diagnóstico
            </button>
          </div>
          <div className="mt-14 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ['Diagnóstico Executivo', 'Comece gratuitamente com um diagnóstico inicial da maturidade da sua gestão.'],
              ['Plano de Ação Executivo', 'Receba recomendações práticas para reduzir perdas, melhorar controle e acelerar decisões.'],
              ['Advisor sob Demanda', 'Acesse especialistas virtuais por área da empresa para apoiar decisões estratégicas.']
            ].map(([title, desc]) => (
              <div key={title} className="border border-white/5 bg-slate-900 p-6 text-left">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 w-full text-left">
            <div className="mb-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Planos de assinatura</p>
              <h2 className="mt-2 text-2xl font-light text-white">Escolha o nível de apoio executivo ideal para sua empresa</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="border border-white/5 bg-slate-900 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Entrada gratuita</p>
                <h3 className="mt-3 text-lg font-bold text-white">Diagnóstico Executivo</h3>
                <p className="mt-2 text-3xl font-bold text-amber-500">R$ 0</p>
                <p className="mt-3 min-h-16 text-xs leading-relaxed text-slate-500">Preencha seus dados e faça um diagnóstico inicial de maturidade da gestão.</p>
                <button onClick={() => navigate('suppliers')} className="mt-6 w-full border border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/5">
                  Solicitar diagnóstico
                </button>
              </div>
              {Object.entries(subscriptionPlans).map(([key, plan]) => (
                <div key={key} className={`border p-6 ${key === 'executive' ? 'border-amber-500 bg-amber-500/5 shadow-glow' : 'border-white/5 bg-slate-900'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{plan.label}</p>
                  <h3 className="mt-3 text-lg font-bold text-white">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold text-amber-500">R$ {plan.price}<span className="text-xs text-slate-500">/mês</span></p>
                  <p className="mt-3 min-h-16 text-xs leading-relaxed text-slate-500">{plan.description}</p>
                  <a href={plan.link} target="_blank" rel="noreferrer" className="mt-6 block w-full bg-amber-500 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-950 hover:bg-amber-400">
                    Assinar agora
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {view === 'advisors' && (
        <section className="view-fade mx-auto max-w-7xl px-4 py-10 md:px-12">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-light uppercase tracking-wide text-white">Selecione seus advisors executivos</h2>
              <p className="mt-2 text-xs text-slate-500">Diagnóstico gratuito. Depois escolha: Essencial (1 advisor), Executivo (até 4) ou Board Pro (todos).</p>
            </div>
            {selectedAdvisorIds.length > 0 && (
              <div className="border border-amber-500/20 bg-slate-900 p-4 text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Plano recomendado</p>
                <p className="text-sm font-bold uppercase tracking-widest text-white">{selectedPlan?.name}</p>
                <p className="text-2xl font-bold text-amber-500">R$ {selectedTotal},00/mês</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">{selectedPlan?.label}</p>
                <button onClick={startCheckout} disabled={isBusy} className="mt-3 bg-amber-500 px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-950 disabled:opacity-60">
                  Assinar plano
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {advisors.map((advisor) => (
              <div key={advisor.id} className={`flex flex-col justify-between border p-6 transition ${selectedAdvisorIds.includes(advisor.id) ? 'border-amber-500 bg-amber-500/5 shadow-glow' : 'border-white/5 bg-slate-900'}`}>
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {renderAdvisorIcon(advisor.icon)}
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">{advisor.title}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">{advisor.boardTitle}</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={selectedAdvisorIds.includes(advisor.id)} onChange={() => toggleAdvisor(advisor.id)} className="h-4 w-4 accent-amber-500" />
                  </div>
                  <p className="mt-5 min-h-12 text-xs leading-relaxed text-slate-500">{advisor.desc}</p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Módulo selecionável</p>
                  <button onClick={() => startDiagnostic(advisor.id)} className="border border-white/10 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/5">
                    Diagnóstico
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === 'diagnostic' && (
        <section className="view-fade mx-auto max-w-2xl px-6 py-12">
          <h2 className="mb-2 text-xl font-light uppercase tracking-widest text-white">Diagnóstico gratuito</h2>
          <p className="mb-8 text-xs text-slate-500">Módulo: <span className="text-amber-500">{diagnosticAdvisor.title}</span></p>
          {!leadName || !leadEmail ? (
            <form onSubmit={submitLeadAndStartQuiz} className="space-y-4 border border-white/5 bg-slate-900 p-6">
              <input required placeholder="Nome completo" value={leadName} onChange={(e) => setLeadName(e.target.value)} className="w-full border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-amber-500" />
              <input required type="email" placeholder="E-mail" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} className="w-full border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-amber-500" />
              <input placeholder="WhatsApp" value={leadWhatsapp} onChange={(e) => setLeadWhatsapp(e.target.value)} className="w-full border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-amber-500" />
              <input placeholder="Empresa ou negócio" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} className="w-full border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-amber-500" />
              <button className="w-full bg-amber-500 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-950">Iniciar diagnóstico</button>
            </form>
          ) : quizFinished ? (
            <div className="border border-white/5 bg-slate-900 p-6">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Score de maturidade</p>
              <h3 className="mt-2 text-5xl font-bold text-amber-500">{currentScore}%</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Quanto menor o score, maior a exposição a risco, perda de margem ou falta de governança. O próximo passo é liberar este advisor para gerar plano de ação personalizado.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => { if (!selectedAdvisorIds.includes(diagnosticAdvisor.id)) setSelectedAdvisorIds([...selectedAdvisorIds, diagnosticAdvisor.id]); startCheckout(); }} className="bg-amber-500 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-950">
                  Escolher plano
                </button>
                <button onClick={() => navigate('advisors')} className="border border-white/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">Ver outros advisors</button>
              </div>
            </div>
          ) : (
            <div className="border border-white/5 bg-slate-900 p-6">
              <div className="mb-5 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
                <span>{diagnosticAdvisor.title}</span>
                <span>Questão {quizStep + 1} de {diagnosticAdvisor.questions.length}</span>
              </div>
              <p className="min-h-20 text-lg font-light leading-relaxed text-white">{diagnosticAdvisor.questions[quizStep]}</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button onClick={() => answerQuestion(true)} className="bg-amber-500 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-950">Sim</button>
                <button onClick={() => answerQuestion(false)} className="border border-white/10 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">Não</button>
              </div>
            </div>
          )}
        </section>
      )}

      {view === 'login' && (
        <section className="view-fade mx-auto max-w-md px-6 py-16">
          <h2 className="mb-6 text-center text-xl font-light uppercase tracking-widest text-white">{authMode === 'login' ? 'Acesso à consultoria' : 'Criar conta'}</h2>
          <form onSubmit={submitAuth} className="space-y-4 border border-white/5 bg-slate-900 p-6">
            {authMode === 'register' && <input required placeholder="Nome completo" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none" />}
            <input required type="email" placeholder="E-mail" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none" />
            <input required type="password" placeholder="Senha" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none" />
            <button disabled={isBusy} className="w-full bg-amber-500 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-950 disabled:opacity-60">{authMode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-center text-xs text-amber-500">
              {authMode === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Fazer login'}
            </button>
          </form>
        </section>
      )}

      {view === 'panel' && (
        <section className="view-fade mx-auto max-w-7xl px-4 py-10 md:px-12">
          {!session ? (
            <div className="border border-white/5 bg-slate-900 p-8 text-center">
              <p className="text-sm text-slate-400">Faça login para acessar seu painel.</p>
              <button onClick={() => navigate('login')} className="mt-5 bg-amber-500 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-950">Entrar</button>
            </div>
          ) : paidAdvisorIds.length === 0 ? (
            <div className="border border-white/5 bg-slate-900 p-8 text-center">
              <p className="text-sm text-slate-400">Nenhum advisor ativo. Selecione advisors e conclua o pagamento.</p>
              <button onClick={() => navigate('advisors')} className="mt-5 bg-amber-500 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-950">Contratar advisors</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
              <aside className="border border-white/5 bg-slate-900 p-4">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Advisors contratados</h3>
                <div className="space-y-2">
                  {paidAdvisorIds.map((id) => {
                    const advisor = getAdvisor(id);
                    if (!advisor) return null;
                    return <button key={id} onClick={() => setActiveAdvisorId(id)} className={`w-full border p-3 text-left text-[10px] font-bold uppercase tracking-wider ${activeAdvisorId === id ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-white/5 text-slate-400'}`}>{advisor.title}</button>;
                  })}
                </div>
              </aside>
              <div className="flex min-h-[560px] flex-col border border-white/5 bg-slate-900 p-4 md:p-6">
                <div className="mb-4 border-b border-white/5 pb-4">
                  <h2 className="text-xl font-light uppercase tracking-wider text-white">{activeAdvisor.title}</h2>
                  <p className="mt-2 text-xs text-slate-500">{activeAdvisor.desc}</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {!(chatMessages[activeAdvisor.id] || []).length && (
                    <div className="rounded-sm border border-white/5 bg-slate-950 p-4 text-xs leading-relaxed text-slate-400">
                      Módulo ativado. Envie seu problema, planilha resumida, indicadores ou contexto. O advisor vai responder em formato executivo com diagnóstico, riscos, plano de ação e KPIs.
                    </div>
                  )}
                  {(chatMessages[activeAdvisor.id] || []).map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[86%] whitespace-pre-line rounded-lg p-3.5 text-xs leading-relaxed ${message.role === 'user' ? 'bg-amber-500 text-slate-950' : 'border border-white/5 bg-slate-950 text-slate-300'}`}>{message.content}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendChatMessage} className="mt-4 flex gap-2 border-t border-white/5 pt-4">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Fazer consulta estratégica..." className="flex-1 border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-amber-500" />
                  <button disabled={isBusy} className="bg-amber-500 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-950 disabled:opacity-60">Enviar</button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {view === 'suppliers' && (
        <section className="view-fade mx-auto max-w-3xl px-6 py-12">
          <h2 className="text-2xl font-light uppercase tracking-widest text-white">Cadastro do novo usuário</h2>
          <p className="mb-8 mt-2 text-xs leading-relaxed text-slate-500">Preencha como pessoa física ou pessoa jurídica. Use CPF para empresário individual/pessoa física e CNPJ para empresas constituídas. Os dados entram no funil de diagnóstico consultivo.</p>
          <form onSubmit={submitSupplier} className="grid grid-cols-1 gap-4 border border-white/5 bg-slate-900 p-6 md:grid-cols-2">
            {[
              ['legalName', 'Nome completo ou razão social *'], ['tradeName', 'Nome fantasia ou marca'], ['taxId', 'CPF ou CNPJ *'], ['category', 'Principal desafio'],
              ['contactName', 'Contato responsável'], ['email', 'E-mail *'], ['whatsapp', 'WhatsApp'], ['city', 'Cidade'], ['state', 'UF']
            ].map(([key, label]) => (
              <input key={key} required={label.includes('*')} placeholder={label} value={supplierForm[key as keyof SupplierForm]} onChange={(e) => setSupplierForm({ ...supplierForm, [key]: e.target.value })} className="border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-amber-500" />
            ))}
            <textarea placeholder="Descreva o negócio, dores, objetivos, área crítica, faturamento aproximado ou contexto para o diagnóstico." value={supplierForm.notes} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} className="min-h-28 border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-amber-500 md:col-span-2" />
            <button disabled={isBusy} className="bg-amber-500 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-950 disabled:opacity-60 md:col-span-2">Solicitar diagnóstico</button>
          </form>
        </section>
      )}

      {view === 'contact' && (
        <section className="view-fade mx-auto max-w-xl px-6 py-16">
          <h2 className="mb-2 text-2xl font-light uppercase tracking-widest text-white">Fale com a diretoria</h2>
          <p className="mb-8 text-xs text-slate-500">marquescmateus@gmail.com</p>
          <form onSubmit={submitContact} className="space-y-4">
            <input required type="email" placeholder="Seu e-mail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full border border-white/10 bg-slate-900 p-3 text-xs text-white outline-none" />
            <input required placeholder="Assunto" value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} className="w-full border border-white/10 bg-slate-900 p-3 text-xs text-white outline-none" />
            <textarea required placeholder="Mensagem" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className="h-32 w-full border border-white/10 bg-slate-900 p-3 text-xs text-white outline-none" />
            <button disabled={isBusy} className="w-full border border-white/10 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 disabled:opacity-60">Enviar mensagem</button>
          </form>
        </section>
      )}

      <footer className="mt-12 border-t border-white/5 px-6 py-6 text-center text-[9px] uppercase tracking-widest text-slate-600">
        Marques Strategic Advisor | Consultoria executiva para pequenas e médias empresas
      </footer>
    </main>
  );
}
