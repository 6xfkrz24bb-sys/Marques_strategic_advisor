'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type AdminUser = {
  name: string;
  email: string;
  createdAt: string | null;
  accessStatus: string;
  source: string;
  messagesSent: number;
};

type Diagnostic = {
  legal_name: string;
  trade_name: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  category: string;
  contact_name: string;
  notes: string;
  created_at: string | null;
};

type AdminCheck = {
  ok?: boolean;
  error?: string;
  summary?: {
    totalUsers: number;
    trialUsers: number;
    activeUsers: number;
    usersWithChat: number;
    usersWithBusinessForm: number;
  };
  users?: AdminUser[];
  diagnostics?: Diagnostic[];
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function empty(value?: string | number | null) {
  if (value === 0) return '0';
  return value ? String(value) : '—';
}

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState('Verificando acesso administrativo...');
  const [summary, setSummary] = useState<AdminCheck['summary'] | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const email = data.session?.user?.email || '';

      if (!token) {
        setStatus('Faça login no app primeiro e depois volte para esta página.');
        return;
      }

      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json().catch(() => null) as AdminCheck | null;

      if (!response.ok || !json?.ok) {
        setStatus(`Acesso admin não liberado para ${email}. Confira se este e-mail está na variável ADMIN_EMAILS da Vercel e se houve redeploy.`);
        setSummary(null);
        setUsers([]);
        setDiagnostics([]);
        return;
      }

      setStatus(`Acesso admin liberado para ${email}.`);
      setSummary(json.summary || null);
      setUsers(json.users || []);
      setDiagnostics(json.diagnostics || []);
    }

    void checkAdmin();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-200 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/20 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Marques Strategic Advisor</p>
        <h1 className="mt-3 text-2xl font-light uppercase tracking-widest text-white">Admin</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{status}</p>

        {summary && (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Usuários</p><p className="text-2xl font-bold text-amber-500">{summary.totalUsers}</p></div>
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Trial</p><p className="text-2xl font-bold text-amber-500">{summary.trialUsers}</p></div>
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Ativos</p><p className="text-2xl font-bold text-amber-500">{summary.activeUsers}</p></div>
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Chat</p><p className="text-2xl font-bold text-amber-500">{summary.usersWithChat}</p></div>
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Diagnóstico</p><p className="text-2xl font-bold text-amber-500">{summary.usersWithBusinessForm}</p></div>
          </div>
        )}

        {summary && (
          <div className="mt-8 space-y-8">
            <section>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-lg font-light uppercase tracking-widest text-white">Usuários cadastrados</h2>
                <p className="text-xs text-slate-500">{users.length} registro(s)</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {users.length ? users.map((user) => (
                  <article key={`${user.email}-${user.createdAt}`} className="border border-white/10 bg-slate-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{empty(user.name)}</h3>
                        <p className="mt-1 break-all text-xs text-slate-400">{empty(user.email)}</p>
                      </div>
                      <span className="shrink-0 border border-amber-500/30 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-400">{empty(user.accessStatus)}</span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div><dt className="text-[9px] uppercase text-slate-500">Origem</dt><dd className="mt-1 text-slate-200">{empty(user.source)}</dd></div>
                      <div><dt className="text-[9px] uppercase text-slate-500">Mensagens</dt><dd className="mt-1 text-slate-200">{empty(user.messagesSent)}</dd></div>
                      <div className="col-span-2"><dt className="text-[9px] uppercase text-slate-500">Cadastro</dt><dd className="mt-1 text-slate-200">{formatDate(user.createdAt)}</dd></div>
                    </dl>
                  </article>
                )) : <p className="border border-white/10 bg-slate-950 p-4 text-sm text-slate-400 md:col-span-2 xl:col-span-3">Nenhum usuário encontrado.</p>}
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-lg font-light uppercase tracking-widest text-white">Diagnósticos / empresas</h2>
                <p className="text-xs text-slate-500">{diagnostics.length} registro(s)</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {diagnostics.length ? diagnostics.map((diagnostic) => (
                  <article key={`${diagnostic.email}-${diagnostic.created_at}`} className="border border-white/10 bg-slate-950 p-4">
                    <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                      <h3 className="text-sm font-semibold text-white">{empty(diagnostic.legal_name || diagnostic.trade_name)}</h3>
                      <p className="text-xs text-slate-400">Responsável: {empty(diagnostic.contact_name)}</p>
                    </div>
                    <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                      <div><dt className="text-[9px] uppercase text-slate-500">E-mail</dt><dd className="mt-1 break-all text-slate-200">{empty(diagnostic.email)}</dd></div>
                      <div><dt className="text-[9px] uppercase text-slate-500">WhatsApp</dt><dd className="mt-1 text-slate-200">{empty(diagnostic.whatsapp)}</dd></div>
                      <div><dt className="text-[9px] uppercase text-slate-500">Segmento</dt><dd className="mt-1 text-slate-200">{empty(diagnostic.trade_name)}</dd></div>
                      <div><dt className="text-[9px] uppercase text-slate-500">Objetivo</dt><dd className="mt-1 text-slate-200">{empty(diagnostic.category)}</dd></div>
                      <div><dt className="text-[9px] uppercase text-slate-500">Cidade/UF</dt><dd className="mt-1 text-slate-200">{[diagnostic.city, diagnostic.state].filter(Boolean).join(' / ') || '—'}</dd></div>
                      <div><dt className="text-[9px] uppercase text-slate-500">Data</dt><dd className="mt-1 text-slate-200">{formatDate(diagnostic.created_at)}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-[9px] uppercase text-slate-500">Observações</dt><dd className="mt-1 whitespace-pre-wrap text-slate-200">{empty(diagnostic.notes)}</dd></div>
                    </dl>
                  </article>
                )) : <p className="border border-white/10 bg-slate-950 p-4 text-sm text-slate-400 lg:col-span-2">Nenhum diagnóstico encontrado.</p>}
              </div>
            </section>
          </div>
        )}

        <a href="/" className="mt-8 inline-block border border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/5">
          Voltar para o app
        </a>
      </section>
    </main>
  );
}
