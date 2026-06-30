'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

const GOOGLE_ADS_TRIAL_CONVERSION_ID = 'AW-18130712066/Th23ClfxqsgcEILsssVD';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function reportGoogleAdsTrialConversion(userId?: string) {
  if (typeof window.gtag !== 'function') return;

  const conversionKey = `google-ads-trial-conversion:${GOOGLE_ADS_TRIAL_CONVERSION_ID}:${userId || 'anonymous'}`;
  if (window.sessionStorage.getItem(conversionKey)) return;

  window.gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_TRIAL_CONVERSION_ID
  });
  window.sessionStorage.setItem(conversionKey, 'true');
}

export function TrialRequestButton() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(true);
  const [hasCheckedTrial, setHasCheckedTrial] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setIsAuthLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function checkTrialAvailability() {
      setHasCheckedTrial(false);

      if (isAuthLoading) return;

      if (!session?.access_token) {
        setShouldShowButton(true);
        setHasCheckedTrial(true);
        return;
      }

      const response = await fetch('/api/trial/request', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).catch(() => null);
      const json = await response?.json().catch(() => null);

      if (cancelled) return;

      if (json?.ok) {
        setShouldShowButton(Boolean(json.trialAvailable));
      } else {
        setShouldShowButton(false);
        setMessage('Não foi possível verificar o trial agora. Tente novamente em instantes.');
      }

      setHasCheckedTrial(true);
    }

    void checkTrialAvailability();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, session?.access_token]);

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
      if (!response.ok || !json?.ok) {
        if (json?.trialAvailable === false || json?.hasRequestedTrial) setShouldShowButton(false);
        throw new Error(json?.error || 'Não foi possível registrar a solicitação.');
      }
      if (json.trialGranted) reportGoogleAdsTrialConversion(session.user.id);
      setShouldShowButton(false);
      setMessage(json.message || 'Acesso liberado por 15 dias.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao solicitar teste grátis.');
    } finally {
      setIsBusy(false);
    }
  }

  if (isAuthLoading || (session && !hasCheckedTrial)) return null;
  if (!shouldShowButton && !message) return null;

  return (
    <div className="fixed bottom-20 left-4 z-30 max-w-[calc(100vw-2rem)] md:bottom-6 md:left-6">
      {message && (
        <div className="mb-2 max-w-xs border border-amber-500/30 bg-slate-950/95 p-3 text-[11px] leading-relaxed text-amber-100 shadow-xl">
          {message}
        </div>
      )}
      {shouldShowButton && (
        <button
          type="button"
          onClick={requestTrial}
          disabled={isBusy}
          className="rounded-full border border-amber-400/30 bg-amber-500 px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-950 shadow-xl transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? 'Enviando...' : 'Teste grátis 15 dias'}
        </button>
      )}
    </div>
  );
}
