'use client';

import { useEffect } from 'react';

export function AutoDismissAlerts() {
  useEffect(() => {
    let lastMessage = '';
    let timeoutId: number | undefined;

    function scheduleClose() {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
      const closeButton = buttons.find((button) => button.textContent?.trim().toLowerCase() === 'fechar');
      if (!closeButton) return;

      const container = closeButton.parentElement;
      const currentMessage = container?.textContent || '';
      if (!currentMessage || currentMessage === lastMessage) return;

      lastMessage = currentMessage;
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        closeButton.click();
        lastMessage = '';
      }, 3000);
    }

    const observer = new MutationObserver(scheduleClose);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    scheduleClose();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return null;
}
