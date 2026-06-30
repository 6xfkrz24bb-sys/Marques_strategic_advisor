'use client';

import { useEffect } from 'react';

const replacements = [
  ['R$ 97', 'R$ 40'],
  ['R$ 197', 'R$ 81'],
  ['R$ 297', 'R$ 120'],
  ['R$ 150', 'R$ 120']
] as const;

const promoLinks = [
  ['1YkeHXN', 'https://mpago.la/1KXMPVj'],
  ['2GkAEwm', 'https://mpago.la/1J6kvsP'],
  ['1rhJ6B5', 'https://mpago.la/1fAwqT7']
] as const;

function applyPromotionalPricing() {
  document.querySelectorAll('p, span, h2, h3, a, button').forEach((node) => {
    if (!(node instanceof HTMLElement) || !node.textContent) return;
    if (node.children.length > 0 && node.tagName !== 'BUTTON') return;

    let text = node.textContent;
    replacements.forEach(([from, to]) => {
      text = text.replaceAll(from, to);
    });

    if (text !== node.textContent) node.textContent = text;
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
