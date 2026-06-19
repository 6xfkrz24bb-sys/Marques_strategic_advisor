'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function TrialRequestButton() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function requestTrial() {
    if (!session?.access_token) {
      setMessage('Faça login ou crie sua conta antes de solicitar o teste grátis.');
      return;
    }

    setIsBusy(true);
    setMessage('');

    try {
      const response = await fetch('/api/trial/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ message: 'Solicitação feita pelo botão de trial grátis do site.' })
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Não foi possível registrar a solicitação.');
      setMessage(json.message || 'Solicitação recebida. Liberação em até 24 horas.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao solicitar teste grátis.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] md:bottom-6 md:left-6">
      {message && (
        <div className="mb-2 max-w-xs border border-amber-500/30 bg-slate-950/95 p-3 text-[11px] leading-relaxed text-amber-100 shadow-xl">
          {message}
        </div>
      )}
      <button
        type="button"
        onClick={requestTrial}
        disabled={isBusy}
        className="rounded-full border border-amber-400/30 bg-amber-500 px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-950 shadow-xl transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy ? 'Enviando...' : 'Teste grátis 15 dias'}
      </button>
    </div>
  );
}
