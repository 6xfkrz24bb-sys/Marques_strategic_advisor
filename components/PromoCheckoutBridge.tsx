'use client';

import { useEffect, useMemo } from 'react';
import { advisors } from '@/lib/advisors';
import { createClient } from '@/lib/supabase/client';

const pendingKey = 'msa-promo-pending-ids';
const linkMap: Record<string, string[]> = {
  '1YkeHXN': ['ceo'],
  '2GkAEwm': ['ceo', 'coo', 'financeiro', 'comercial'],
  '1rhJ6B5': advisors.map((advisor) => advisor.id)
};

function selectedIds() {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
    .map((checkbox, index) => (checkbox.checked ? advisors[index]?.id : null))
    .filter((id): id is string => Boolean(id));
}

function nav(label: string) {
  Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .find((button) => button.textContent?.trim().toLowerCase() === label)
    ?.click();
}

export function PromoCheckoutBridge() {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let busy = false;

    async function checkout(ids: string[]) {
      const advisorIds = Array.from(new Set(ids));
      if (!advisorIds.length) return nav('advisors');

      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        window.sessionStorage.setItem(pendingKey, JSON.stringify(advisorIds));
        nav('login');
        return;
      }

      if (busy) return;
      busy = true;
      const response = await fetch('/api/checkout/mercadopago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({ advisorIds })
      });
      const json = await response.json().catch(() => null);
      busy = false;
      if (json?.checkoutUrl) window.location.assign(json.checkoutUrl);
    }

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href*="mpago.la"]');
      const button = target?.closest<HTMLButtonElement>('button');

      if (anchor) {
        event.preventDefault();
        event.stopPropagation();
        const found = Object.entries(linkMap).find(([token]) => anchor.href.includes(token));
        void checkout(found?.[1] || selectedIds());
      }

      if (button?.textContent?.trim().toLowerCase() === 'assinar plano') {
        event.preventDefault();
        event.stopPropagation();
        void checkout(selectedIds());
      }
    }

    async function resume() {
      const pending = window.sessionStorage.getItem(pendingKey);
      if (!pending) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) return;
      window.sessionStorage.removeItem(pendingKey);
      void checkout(JSON.parse(pending) as string[]);
    }

    document.addEventListener('click', onClick, true);
    const { data: listener } = supabase.auth.onAuthStateChange(() => void resume());
    void resume();

    return () => {
      document.removeEventListener('click', onClick, true);
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
