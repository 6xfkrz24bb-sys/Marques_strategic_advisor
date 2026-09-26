'use client';

import { useEffect } from 'react';
import { advisors } from '@/lib/advisors';

const planLinks = {
  essential: 'https://mpago.la/1KXMPVj',
  executive: 'https://mpago.la/1J6kvsP',
  pro: 'https://mpago.la/1fAwqT7'
};

const linkMap: Record<string, keyof typeof planLinks> = {
  '1YkeHXN': 'essential',
  '1KXMPVj': 'essential',
  '2GkAEwm': 'executive',
  '1J6kvsP': 'executive',
  '1rhJ6B5': 'pro',
  '1fAwqT7': 'pro'
};

function selectedIds() {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
    .map((checkbox, index) => (checkbox.checked ? advisors[index]?.id : null))
    .filter((id): id is string => Boolean(id));
}

function planFromCount(count: number): keyof typeof planLinks | null {
  if (count <= 0) return null;
  if (count === 1) return 'essential';
  if (count <= 4) return 'executive';
  return 'pro';
}

function redirectToPlan(plan: keyof typeof planLinks | null) {
  if (!plan) return;
  window.location.assign(planLinks[plan]);
}

export function PromoCheckoutBridge() {
  useEffect(() => {
    const applyLinks = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href*="mpago.la"]').forEach((anchor) => {
        const found = Object.entries(linkMap).find(([token]) => anchor.href.includes(token));
        if (found) anchor.href = planLinks[found[1]];
      });
    };

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href*="mpago.la"]');
      const button = target?.closest<HTMLButtonElement>('button');

      if (anchor) {
        const found = Object.entries(linkMap).find(([token]) => anchor.href.includes(token));
        if (!found) return;
        event.preventDefault();
        event.stopPropagation();
        redirectToPlan(found[1]);
      }

      if (button?.textContent?.trim().toLowerCase() === 'assinar plano') {
        const plan = planFromCount(selectedIds().length);
        if (!plan) return;
        event.preventDefault();
        event.stopPropagation();
        redirectToPlan(plan);
      }
    }

    applyLinks();
    const observer = new MutationObserver(applyLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', onClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}
