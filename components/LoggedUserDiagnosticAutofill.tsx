'use client';

import { useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function clickFirstAdvisorDiagnostic() {
  const advisorsNav = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => button.textContent?.trim().toLowerCase() === 'advisors'
  );
  advisorsNav?.click();

  window.setTimeout(() => {
    const advisorSection = Array.from(document.querySelectorAll<HTMLElement>('section')).find((section) =>
      section.textContent?.toLowerCase().includes('selecione seus advisors executivos')
    );
    const diagnosticButton = Array.from(advisorSection?.querySelectorAll<HTMLButtonElement>('button') || []).find((button) =>
      button.textContent?.trim().toLowerCase() === 'diagnóstico'
    );
    diagnosticButton?.click();
  }, 450);
}

export function LoggedUserDiagnosticAutofill() {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let stopped = false;
    let supplierRedirected = false;
    let lastAlertText = '';
    let alertTimer: number | undefined;

    async function handleLoggedUserDiagnostic() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user?.email || stopped) return;

      const pageText = document.body.textContent?.toLowerCase() || '';
      if (!supplierRedirected && pageText.includes('cadastro do novo usuário')) {
        supplierRedirected = true;
        clickFirstAdvisorDiagnostic();
        return;
      }

      const email = session.user.email;
      const name = String(session.user.user_metadata?.full_name || email.split('@')[0] || 'Usuário logado');
      const nameInput = document.querySelector<HTMLInputElement>('input[placeholder="Nome completo"]');
      const emailInput = document.querySelector<HTMLInputElement>('input[placeholder="E-mail"]');
      const startButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.toLowerCase().includes('iniciar diagnóstico')
      );

      if (nameInput && emailInput && startButton) {
        setNativeInputValue(nameInput, name);
        setNativeInputValue(emailInput, email);
        window.setTimeout(() => startButton.click(), 150);
      }

      const closeButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.trim().toLowerCase() === 'fechar'
      );
      const alertText = closeButton?.parentElement?.textContent || '';
      if (closeButton && alertText && alertText !== lastAlertText) {
        lastAlertText = alertText;
        if (alertTimer) window.clearTimeout(alertTimer);
        alertTimer = window.setTimeout(() => {
          closeButton.click();
          lastAlertText = '';
        }, 3000);
      }
    }

    const timer = window.setInterval(handleLoggedUserDiagnostic, 600);
    void handleLoggedUserDiagnostic();

    return () => {
      stopped = true;
      window.clearInterval(timer);
      if (alertTimer) window.clearTimeout(alertTimer);
    };
  }, [supabase]);

  return null;
}
