'use client';

import { useEffect } from 'react';

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function findChatInput(target?: EventTarget | null) {
  const form = target instanceof HTMLFormElement ? target : null;
  return form?.querySelector<HTMLInputElement>('input[placeholder="Fazer consulta estratégica..."]') || null;
}

function clearAndFocus(input: HTMLInputElement) {
  setNativeInputValue(input, '');
  input.focus({ preventScroll: true });
}

export function ChatSubmitEnhancements() {
  useEffect(() => {
    function handleSubmit(event: SubmitEvent) {
      const input = findChatInput(event.target);
      if (!input || !input.value.trim()) return;

      window.setTimeout(() => clearAndFocus(input), 0);
      window.setTimeout(() => clearAndFocus(input), 120);
      window.setTimeout(() => clearAndFocus(input), 700);
    }

    document.addEventListener('submit', handleSubmit, false);
    return () => document.removeEventListener('submit', handleSubmit, false);
  }, []);

  return null;
}
