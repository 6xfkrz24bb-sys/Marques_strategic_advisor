'use client';

import { useEffect } from 'react';

type PromoPlan = {
  oldValue: string;
  newValue: string;
};

const promoPlans: PromoPlan[] = [
  { oldValue: '97', newValue: '40' },
  { oldValue: '197', newValue: '81' },
  { oldValue: '297', newValue: '120' },
  { oldValue: '150', newValue: '120' }
];

const promoLinks = [
  ['1YkeHXN', 'https://mpago.la/1KXMPVj'],
  ['2GkAEwm', 'https://mpago.la/1J6kvsP'],
  ['1rhJ6B5', 'https://mpago.la/1fAwqT7']
] as const;

function renderPromotionalPrice(element: HTMLElement, plan: PromoPlan) {
  if (element.dataset.promoApplied === plan.newValue) return;

  element.dataset.promoApplied = plan.newValue;
  element.innerHTML = `
    <span class="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
      De <span class="line-through decoration-amber-500/70 decoration-2">R$ ${plan.oldValue}/mês</span>
    </span>
    <span class="mt-1 block text-3xl font-bold text-amber-500">
      R$ ${plan.newValue}<span class="text-xs text-slate-500">/mês</span>
    </span>
  `;
}

function applyPromotionalPricing() {
  document.querySelectorAll<HTMLElement>('p').forEach((element) => {
    const text = element.textContent || '';
    const plan = promoPlans.find(({ oldValue, newValue }) => {
      const hasOriginalValue = text.includes(`R$ ${oldValue}`) || text.includes(`R$ ${oldValue},00`);
      const alreadyShowsPromo = element.dataset.promoApplied === newValue;
      return hasOriginalValue || alreadyShowsPromo;
    });

    if (!plan) return;
    renderPromotionalPrice(element, plan);
  });

  document.querySelectorAll<HTMLElement>('p, h2, h3, span').forEach((element) => {
    if (!element.textContent || element.children.length > 0) return;
    if (element.textContent.trim() === 'Planos de assinatura') {
      element.textContent = 'Campanha promocional de lançamento';
    }
  });

  document.querySelectorAll<HTMLAnchorElement>('a[href*="mpago.la"]').forEach((anchor) => {
    const mapped = promoLinks.find(([oldToken]) => anchor.href.includes(oldToken));
    if (mapped) anchor.href = mapped[1];
    anchor.textContent = 'Assinar promoção';
  });
}

export function PromoPricing() {
  useEffect(() => {
    const timers = [0, 200, 700, 1500].map((delay) => window.setTimeout(applyPromotionalPricing, delay));

    const handleClick = () => {
      window.setTimeout(applyPromotionalPricing, 80);
      window.setTimeout(applyPromotionalPricing, 300);
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return null;
}
