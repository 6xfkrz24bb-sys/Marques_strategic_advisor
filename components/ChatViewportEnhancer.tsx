'use client';

import { useEffect } from 'react';

const CHAT_INPUT_PLACEHOLDER = 'Fazer consulta estratégica...';

function scrollConversationToBottom(messages: HTMLElement | null, behavior: ScrollBehavior = 'smooth') {
  if (!messages) return;
  window.requestAnimationFrame(() => {
    messages.scrollTo({ top: messages.scrollHeight, behavior });
  });
}

function setExpandButtonState(button: HTMLButtonElement, expanded: boolean) {
  button.classList.toggle('is-expanded', expanded);
  button.title = expanded ? 'Voltar ao painel' : 'Expandir conversa';
  button.setAttribute('aria-label', expanded ? 'Voltar ao painel' : 'Expandir conversa');
  button.innerHTML = `<span aria-hidden="true">${expanded ? '⤡' : '⤢'}</span>`;
}

export function ChatViewportEnhancer() {
  useEffect(() => {
    let messagesObserver: MutationObserver | null = null;
    let activeMessages: HTMLElement | null = null;

    function attachChatControls() {
      const input = document.querySelector<HTMLInputElement>(`input[placeholder="${CHAT_INPUT_PLACEHOLDER}"]`);
      const form = input?.closest('form') as HTMLFormElement | null;
      const shell = form?.parentElement as HTMLElement | null;
      const messages = form?.previousElementSibling as HTMLElement | null;
      const header = messages?.previousElementSibling as HTMLElement | null;

      if (!form || !shell || !messages || !header) return;

      shell.classList.add('msa-chat-shell');
      messages.classList.add('msa-chat-messages');
      header.classList.add('msa-chat-header');

      if (!header.querySelector('.msa-chat-expand-button')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'msa-chat-expand-button';
        setExpandButtonState(button, shell.classList.contains('msa-chat-expanded'));
        button.addEventListener('click', () => {
          const expanded = shell.classList.toggle('msa-chat-expanded');
          document.body.classList.toggle('msa-chat-lock', expanded);
          setExpandButtonState(button, expanded);
          scrollConversationToBottom(messages, 'auto');
        });
        header.appendChild(button);
      }

      if (activeMessages !== messages) {
        messagesObserver?.disconnect();
        activeMessages = messages;
        scrollConversationToBottom(messages, 'auto');
        messagesObserver = new MutationObserver(() => scrollConversationToBottom(messages));
        messagesObserver.observe(messages, { childList: true, subtree: true });
      }
    }

    attachChatControls();

    const appObserver = new MutationObserver(() => attachChatControls());
    appObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      appObserver.disconnect();
      messagesObserver?.disconnect();
      document.body.classList.remove('msa-chat-lock');
    };
  }, []);

  return null;
}
