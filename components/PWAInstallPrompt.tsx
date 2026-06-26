'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PortugueseAdvisorNames } from '@/components/PortugueseAdvisorNames';

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

function removeInstallButtons() {
  document.getElementById('pwa-install-nav-button')?.remove();
  document.getElementById('pwa-install-floating-button')?.remove();
}

function installGuideMessage(isApple: boolean) {
  if (isApple) return 'No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.';
  return 'Para instalar: no Chrome/Edge, use o aviso do navegador ou abra o menu e escolha Instalar app / Adicionar à tela inicial.';
}

export function PWAInstallPrompt() {
  const installEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [guideMessage, setGuideMessage] = useState('');
  const canShowIosTip = useMemo(() => isAppleMobile(), []);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installEventRef.current = event as BeforeInstallPromptEvent;
    };

    const handleInstalled = () => {
      setIsStandalone(true);
      setGuideMessage('');
      installEventRef.current = null;
      removeInstallButtons();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      removeInstallButtons();
    };
  }, []);

  useEffect(() => {
    if (isStandalone) {
      removeInstallButtons();
      return;
    }

    async function handleInstallClick() {
      const installEvent = installEventRef.current;
      if (installEvent) {
        await installEvent.prompt();
        await installEvent.userChoice.catch(() => null);
        installEventRef.current = null;
        return;
      }

      setGuideMessage(installGuideMessage(canShowIosTip));
      window.setTimeout(() => setGuideMessage(''), 7000);
    }

    function styleNavButton(button: HTMLButtonElement) {
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
      button.onclick = handleInstallClick;
    }

    function styleFloatingButton(button: HTMLButtonElement) {
      button.textContent = 'App';
      button.title = 'Instalar como app';
      button.style.position = 'fixed';
      button.style.right = '16px';
      button.style.bottom = '82px';
      button.style.zIndex = '50';
      button.style.border = '1px solid rgba(245,158,11,0.28)';
      button.style.background = 'rgba(15,23,42,0.9)';
      button.style.color = '#f59e0b';
      button.style.fontSize = '9px';
      button.style.fontWeight = '900';
      button.style.letterSpacing = '0.14em';
      button.style.textTransform = 'uppercase';
      button.style.padding = '8px 11px';
      button.style.boxShadow = '0 10px 30px rgba(0,0,0,0.22)';
      button.style.cursor = 'pointer';
      button.onclick = handleInstallClick;
    }

    const timer = window.setInterval(() => {
      const signOutButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.trim().toLowerCase().includes('sair')
      );

      const floating = document.getElementById('pwa-install-floating-button');

      if (signOutButton?.parentElement) {
        floating?.remove();
        const existing = document.getElementById('pwa-install-nav-button') as HTMLButtonElement | null;
        if (!existing) {
          const button = document.createElement('button');
          button.id = 'pwa-install-nav-button';
          button.type = 'button';
          styleNavButton(button);
          signOutButton.parentElement.insertBefore(button, signOutButton);
        }
        return;
      }

      const existingFloating = document.getElementById('pwa-install-floating-button') as HTMLButtonElement | null;
      if (!existingFloating) {
        const button = document.createElement('button');
        button.id = 'pwa-install-floating-button';
        button.type = 'button';
        styleFloatingButton(button);
        document.body.appendChild(button);
      }
    }, 700);

    return () => window.clearInterval(timer);
  }, [canShowIosTip, isStandalone]);

  return (
    <>
      <PortugueseAdvisorNames />
      {!isStandalone && guideMessage && (
        <div className="fixed right-4 top-[86px] z-50 w-72 border border-amber-500/30 bg-slate-950/95 p-3 text-[11px] leading-relaxed text-amber-100 shadow-xl md:right-6">
          {guideMessage}
        </div>
      )}
    </>
  );
}
