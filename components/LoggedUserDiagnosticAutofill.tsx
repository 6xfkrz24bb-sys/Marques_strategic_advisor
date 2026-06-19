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

function clickAdvisorPanel() {
  const panelButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
    const text = button.textContent?.trim().toLowerCase();
    return text === 'painel' || text === 'meus advisors';
  });
  panelButton?.click();
}

function ensureAdvisorPanelShortcut(isLogged: boolean) {
  const existing = document.getElementById('advisor-panel-shortcut');
  if (!isLogged) {
    existing?.remove();
    return;
  }

  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).forEach((button) => {
    if (button.textContent?.trim().toLowerCase() === 'painel') button.textContent = 'Meus advisors';
  });

  if (existing) return;

  const button = document.createElement('button');
  button.id = 'advisor-panel-shortcut';
  button.type = 'button';
  button.textContent = 'Meus advisors';
  button.onclick = clickAdvisorPanel;
  button.style.position = 'fixed';
  button.style.right = '16px';
  button.style.bottom = '18px';
  button.style.zIndex = '60';
  button.style.border = '1px solid rgba(255,255,255,0.16)';
  button.style.background = 'rgba(15,23,42,0.96)';
  button.style.color = '#f8fafc';
  button.style.borderRadius = '999px';
  button.style.padding = '14px 18px';
  button.style.fontSize = '10px';
  button.style.fontWeight = '900';
  button.style.letterSpacing = '0.12em';
  button.style.textTransform = 'uppercase';
  button.style.boxShadow = '0 20px 40px rgba(0,0,0,0.35)';
  document.body.appendChild(button);
}

function makeCardsClickable() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('div.border'));
  cards.forEach((card) => {
    const text = card.textContent?.trim().toLowerCase() || '';
    const isDiagnostic = text.startsWith('diagnóstico') && text.includes('comece gratuitamente');
    const isActionPlan = text.startsWith('plano de ação') && text.includes('recomendações práticas');
    const isAdvisorDemand = text.startsWith('advisor sob demanda') && text.includes('especialistas virtuais');

    if (!isDiagnostic && !isActionPlan && !isAdvisorDemand) return;
    if (card.dataset.shortcutReady === 'true') return;

    card.dataset.shortcutReady = 'true';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.style.cursor = 'pointer';
    card.style.transition = 'border-color 180ms ease, transform 180ms ease, background 180ms ease';
    card.style.position = 'relative';

    const label = document.createElement('div');
    label.textContent = isDiagnostic ? 'Iniciar diagnóstico →' : 'Ir para meus advisors →';
    label.style.marginTop = '18px';
    label.style.color = '#f59e0b';
    label.style.fontSize = '10px';
    label.style.fontWeight = '900';
    label.style.letterSpacing = '0.12em';
    label.style.textTransform = 'uppercase';
    card.appendChild(label);

    const action = () => {
      if (isDiagnostic) clickFirstAdvisorDiagnostic();
      else clickAdvisorPanel();
    };

    card.onclick = action;
    card.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action();
      }
    };
    card.onmouseenter = () => {
      card.style.borderColor = 'rgba(245,158,11,0.65)';
      card.style.transform = 'translateY(-2px)';
    };
    card.onmouseleave = () => {
      card.style.borderColor = 'rgba(255,255,255,0.05)';
      card.style.transform = 'translateY(0)';
    };
  });
}

function adjustMarketingCopy() {
  const footer = document.querySelector('footer');
  if (footer) {
    const currentText = footer.textContent?.toLowerCase() || '';
    if (currentText.includes('pequenas e médias empresas') || currentText.includes('consultoria executiva')) {
      footer.textContent = 'MARQUES STRATEGIC ADVISOR | BOARD EXECUTIVO';
    }
  }

  const headings = Array.from(document.querySelectorAll<HTMLElement>('h3, h2'));
  headings.forEach((heading) => {
    const normalized = heading.textContent?.trim().toLowerCase();
    if (normalized === 'diagnóstico executivo') heading.textContent = 'Diagnóstico';
    if (normalized === 'plano de ação executivo') heading.textContent = 'Plano de ação';
  });

  const planTitle = headings.find((heading) =>
    heading.textContent?.trim().toLowerCase().includes('escolha o nível de apoio executivo ideal para sua empresa')
  );
  if (planTitle) planTitle.textContent = 'Escolha o nível de apoio ideal para sua empresa';
}

export function LoggedUserDiagnosticAutofill() {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let stopped = false;
    let supplierRedirected = false;
    let lastAlertText = '';
    let alertTimer: number | undefined;

    async function handleLoggedUserDiagnostic() {
      adjustMarketingCopy();
      makeCardsClickable();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      ensureAdvisorPanelShortcut(Boolean(session?.user?.email));
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
      ensureAdvisorPanelShortcut(false);
      if (alertTimer) window.clearTimeout(alertTimer);
    };
  }, [supabase]);

  return null;
}
