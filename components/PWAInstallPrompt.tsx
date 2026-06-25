'use client';

import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isAppleMobile() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const canShowIosTip = useMemo(() => isAppleMobile(), []);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
      setShowIosTip(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice.catch(() => null);
      if (choice?.outcome === 'accepted') setIsInstalled(true);
      setInstallEvent(null);
      return;
    }

    if (canShowIosTip) {
      setShowIosTip((current) => !current);
      return;
    }
  }

  if (isInstalled || dismissed || (!installEvent && !canShowIosTip)) return null;

  return (
    <div className="fixed right-4 top-[96px] z-50 max-w-[calc(100vw-2rem)] md:right-6 md:top-[92px]">
      {showIosTip && (
        <div className="mb-2 w-72 border border-amber-500/30 bg-slate-950/95 p-3 text-[11px] leading-relaxed text-amber-100 shadow-xl">
          No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="rounded-full border border-amber-400/30 bg-slate-900/95 px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-amber-400 shadow-xl transition hover:bg-slate-800"
        >
          Instalar app
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar instalação do app"
          className="rounded-full border border-white/10 bg-slate-900/95 px-3 py-3 text-[10px] font-extrabold text-slate-300 shadow-xl transition hover:bg-slate-800"
        >
          ×
        </button>
      </div>
    </div>
  );
}
