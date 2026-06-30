'use client';

import { useEffect, useState } from 'react';
import { advisors } from '@/lib/advisors';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type DeliverableType = 'report' | 'spreadsheet' | 'presentation';

type AdvisorState = {
  id: string;
  title: string;
};

const labels: Record<DeliverableType, string> = {
  report: 'Relatório',
  spreadsheet: 'Planilha',
  presentation: 'Apresentação'
};

function detectActiveAdvisor(): AdvisorState | null {
  const panel = document.querySelector<HTMLElement>('[data-advisor-panel="active"]');
  const advisorId = panel?.dataset.advisorId;
  const advisorTitle = panel?.dataset.advisorTitle;
  const byId = advisorId ? advisors.find((advisor) => advisor.id === advisorId) : null;
  if (byId) return { id: byId.id, title: byId.title };

  const visibleText = document.body.innerText || '';
  if (!visibleText.toLowerCase().includes('advisors contratados')) return null;
  const byTitle = advisors.find((advisor) => visibleText.includes(advisor.title));
  if (byTitle) return { id: byTitle.id, title: byTitle.title };
  return advisorId && advisorTitle ? { id: advisorId, title: advisorTitle } : null;
}

export function AdvisorDeliverables() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [activeAdvisor, setActiveAdvisor] = useState<AdvisorState | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [busyType, setBusyType] = useState<DeliverableType | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    let mounted = true;
    client.auth.getUser().then(({ data }) => {
      if (mounted) setIsAuthenticated(Boolean(data.user));
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const update = () => setActiveAdvisor(detectActiveAdvisor());
    update();
    window.addEventListener('click', update, true);
    window.addEventListener('popstate', update);
    const interval = window.setInterval(update, 2500);
    return () => {
      window.removeEventListener('click', update, true);
      window.removeEventListener('popstate', update);
      window.clearInterval(interval);
    };
  }, []);

  async function generate(type: DeliverableType) {
    if (!activeAdvisor) return;
    setBusyType(type);
    setStatus('Gerando...');
    try {
      if (!supabase) throw new Error('Sessão indisponível. Tente novamente.');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Faça login novamente para gerar entregáveis.');

      const response = await fetch('/api/deliverables/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ advisorId: activeAdvisor.id, type })
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || 'Não foi possível gerar o arquivo agora.');
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const fileName = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `entregavel-${activeAdvisor.id}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus('Arquivo baixado');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao gerar entregável.');
    } finally {
      setBusyType(null);
    }
  }

  if (!isAuthenticated || !activeAdvisor) return null;

  return (
    <aside className="fixed bottom-24 left-4 right-4 z-30 border border-amber-500/20 bg-slate-950/95 p-4 text-slate-200 shadow-2xl backdrop-blur md:bottom-6 md:left-auto md:right-6 md:w-80">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500">Entregáveis do Advisor</p>
      <p className="mt-1 truncate text-xs text-slate-400">{activeAdvisor.title}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.keys(labels) as DeliverableType[]).map((type) => (
          <button
            key={type}
            onClick={() => generate(type)}
            disabled={Boolean(busyType)}
            className="bg-amber-500 px-2 py-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyType === type ? '...' : labels[type]}
          </button>
        ))}
      </div>
      {status && <p className="mt-3 text-[11px] text-slate-300">{status}</p>}
    </aside>
  );
}
