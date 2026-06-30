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

export function PromoPricing() {
  useEffect(() => {
    const apply = () => {
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
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
