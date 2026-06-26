'use client';

import { useEffect } from 'react';

function forceTop() {
  const topOptions: ScrollToOptions = { top: 0, left: 0, behavior: 'auto' };
  window.scrollTo(topOptions);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  window.setTimeout(() => window.scrollTo(topOptions), 80);
  window.setTimeout(() => window.scrollTo(topOptions), 250);
}

function clickBrandHome() {
  const brandButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
    button.textContent?.toLowerCase().includes('marques strategic advisor')
  );

  brandButton?.click();
  forceTop();
}

function ensureBackToTopButton() {
  if (document.getElementById('back-to-home-top')) return;

  const button = document.createElement('button');
  button.id = 'back-to-home-top';
  button.type = 'button';
  button.textContent = '↑ Início';
  button.title = 'Voltar para o início da página';
  button.style.position = 'fixed';
  button.style.left = '14px';
  button.style.bottom = '18px';
  button.style.zIndex = '55';
  button.style.border = '1px solid rgba(255,255,255,0.14)';
  button.style.background = 'rgba(15,23,42,0.92)';
  button.style.color = '#cbd5e1';
  button.style.borderRadius = '999px';
  button.style.padding = '10px 13px';
  button.style.fontSize = '9px';
  button.style.fontWeight = '900';
  button.style.letterSpacing = '0.12em';
  button.style.textTransform = 'uppercase';
  button.style.boxShadow = '0 14px 34px rgba(0,0,0,0.28)';
  button.style.cursor = 'pointer';
  button.style.opacity = '0';
  button.style.pointerEvents = 'none';
  button.style.transition = 'opacity 180ms ease';
  button.onclick = clickBrandHome;

  document.body.appendChild(button);
}

function updateButtonVisibility() {
  const button = document.getElementById('back-to-home-top') as HTMLButtonElement | null;
  if (!button) return;

  const shouldShow = window.scrollY > 260;
  button.style.opacity = shouldShow ? '1' : '0';
  button.style.pointerEvents = shouldShow ? 'auto' : 'none';
}

export function NavigationTopReset() {
  useEffect(() => {
    ensureBackToTopButton();
    updateButtonVisibility();

    const handleNavClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const nav = target?.closest('nav');
      const button = target?.closest('button');
      if (!nav || !button) return;
      window.setTimeout(forceTop, 0);
    };

    document.addEventListener('click', handleNavClick, true);
    window.addEventListener('scroll', updateButtonVisibility, { passive: true });

    const timer = window.setInterval(() => {
      ensureBackToTopButton();
      updateButtonVisibility();
    }, 1000);

    return () => {
      document.removeEventListener('click', handleNavClick, true);
      window.removeEventListener('scroll', updateButtonVisibility);
      window.clearInterval(timer);
      document.getElementById('back-to-home-top')?.remove();
    };
  }, []);

  return null;
}
