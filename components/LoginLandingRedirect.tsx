'use client';

import { useEffect } from 'react';

function clickLandingBrand() {
  const brandButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
    button.textContent?.toLowerCase().includes('marques strategic advisor')
  );

  if (brandButton) {
    brandButton.click();
    return;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function LoginLandingRedirect() {
  useEffect(() => {
    let lastRedirectAt = 0;

    const timer = window.setInterval(() => {
      const pageText = document.body.innerText.toLowerCase();
      const hasLoginSuccess = pageText.includes('login realizado');
      const isAdvisorPanel = pageText.includes('advisors contratados') || pageText.includes('nenhum advisor ativo');

      if (!hasLoginSuccess || !isAdvisorPanel) return;
      if (Date.now() - lastRedirectAt < 5000) return;

      lastRedirectAt = Date.now();
      window.setTimeout(clickLandingBrand, 250);
    }, 400);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
