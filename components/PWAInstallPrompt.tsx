'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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

function removeNavInstallButton() {
  document.getElementById('pwa-install-nav-button')?.remove();
}

export function PWAInstallPrompt() {
  const installEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
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
      installEventRef.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setShowIosTip(false);
      installEventRef.current = null;
      removeNavInstallButton();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      removeNavInstallButton();
    };
  }, []);

  useEffect(() => {
    if (isInstalled || dismissed || (!canInstall && !canShowIosTip)) {
      removeNavInstallButton();
      return;
    }

    const timer = window.setInterval(() => {
      const signOutButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.trim().toLowerCase().includes('sair')
      );

      if (!signOutButton?.parentElement) return;
      const existing = document.getElementById('pwa-install-nav-button') as HTMLButtonElement | null;
      if (existing) return;

      const button = document.createElement('button');
      button.id = 'pwa-install-nav-button';
      button.type = 'button';
      button.textContent = 'App';
      button.title = 'Instalar como app';
      button.style.color = '#94a3b8';
      button.style.fontSize = '9px';
      button.style.fontWeight = '800';
      button.style.letterSpacing = '0.14em';
      button.style.textTransform = 'uppercase';
      button.style.padding = '2px 0';
      button.style.background = 'transparent';
      button.style.border = '0';
      button.style.cursor = 'pointer';
      button.onmouseenter = () => { button.style.color = '#f59e0b'; };
      button.onmouseleave = () => { button.style.color = '#94a3b8'; };
      button.onclick = async () => {
        const installEvent = installEventRef.current;
        if (installEvent) {
          await installEvent.prompt();
          const choice = await installEvent.userChoice.catch(() => null);
          installEventRef.current = null;
          setCanInstall(false);
          if (choice?.outcome === 'accepted') setIsInstalled(true);
          else setDismissed(true);
          return;
        }

        if (canShowIosTip) {
          setShowIosTip(true);
          window.setTimeout(() => setShowIosTip(false), 6000);
        }
      };

      signOutButton.parentElement.insertBefore(button, signOutButton);
    }, 700);

    return () => window.clearInterval(timer);
  }, [canInstall, canShowIosTip, dismissed, isInstalled]);

  if (isInstalled || dismissed || !showIosTip) return null;

  return (
    <div className="fixed right-4 top-[86px] z-50 w-72 border border-amber-500/30 bg-slate-950/95 p-3 text-[11px] leading-relaxed text-amber-100 shadow-xl md:right-6">
      No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.
    </div>
  );
}
