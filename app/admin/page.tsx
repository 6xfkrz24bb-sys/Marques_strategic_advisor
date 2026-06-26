'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
};

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState('Verificando acesso administrativo...');
  const [summary, setSummary] = useState<AdminCheck['summary'] | null>(null);

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
        return;
      }

      setStatus(`Acesso admin liberado para ${email}.`);
      setSummary(json.summary || null);
    }

    void checkAdmin();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-200">
      <section className="mx-auto max-w-3xl border border-white/10 bg-slate-900 p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Marques Strategic Advisor</p>
        <h1 className="mt-3 text-2xl font-light uppercase tracking-widest text-white">Admin Check</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{status}</p>

        {summary && (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Usuários</p><p className="text-2xl font-bold text-amber-500">{summary.totalUsers}</p></div>
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Trial</p><p className="text-2xl font-bold text-amber-500">{summary.trialUsers}</p></div>
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Ativos</p><p className="text-2xl font-bold text-amber-500">{summary.activeUsers}</p></div>
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Chat</p><p className="text-2xl font-bold text-amber-500">{summary.usersWithChat}</p></div>
            <div className="border border-white/5 bg-slate-950 p-4"><p className="text-[9px] uppercase text-slate-500">Diagnóstico</p><p className="text-2xl font-bold text-amber-500">{summary.usersWithBusinessForm}</p></div>
          </div>
        )}

        <a href="/" className="mt-6 inline-block border border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/5">
          Voltar para o app
        </a>
      </section>
    </main>
  );
}
