'use client';

import { useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export function LoggedUserDiagnosticAutofill() {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let stopped = false;

    async function fillDiagnosticLeadForm() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user?.email || stopped) return;

      const email = session.user.email;
      const name = String(session.user.user_metadata?.full_name || email.split('@')[0] || 'Usuário logado');
      const nameInput = document.querySelector<HTMLInputElement>('input[placeholder="Nome completo"]');
      const emailInput = document.querySelector<HTMLInputElement>('input[placeholder="E-mail"]');
      const startButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.toLowerCase().includes('iniciar diagnóstico')
      );

      if (!nameInput || !emailInput || !startButton) return;

      setNativeInputValue(nameInput, name);
      setNativeInputValue(emailInput, email);
      window.setTimeout(() => startButton.click(), 150);
    }

    const timer = window.setInterval(fillDiagnosticLeadForm, 600);
    void fillDiagnosticLeadForm();

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [supabase]);

  return null;
}
