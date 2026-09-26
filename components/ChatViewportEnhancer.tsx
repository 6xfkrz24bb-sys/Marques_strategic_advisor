'use client';

import { useEffect } from 'react';

const CHAT_INPUT_PLACEHOLDER = 'Fazer consulta estratégica...';
const EXPAND_ICON = '⤢';

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
  button.textContent = EXPAND_ICON;
}

export function ChatViewportEnhancer() {
  useEffect(() => {
    let messagesObserver: MutationObserver | null = null;
    let activeMessages: HTMLElement | null = null;
    let activeShell: HTMLElement | null = null;
    let activeHeader: HTMLElement | null = null;
    let lastMessageCount = -1;
    let rafId = 0;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'msa-chat-floating-button';
    setExpandButtonState(button, false);
    document.body.appendChild(button);

    function syncButtonPosition() {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        if (!activeShell || !activeHeader) {
          button.classList.remove('is-visible');
          return;
        }

        const expanded = activeShell.classList.contains('msa-chat-expanded');
        setExpandButtonState(button, expanded);
        button.classList.add('is-visible');

        if (expanded) {
          button.style.top = '';
          button.style.left = '';
          button.style.right = '';
          return;
        }

        const rect = activeHeader.getBoundingClientRect();
        button.style.top = `${Math.max(rect.top + 2, 12)}px`;
        button.style.left = `${Math.min(rect.right - 46, window.innerWidth - 58)}px`;
        button.style.right = 'auto';
      });
    }

    function attachChatControls() {
      const input = document.querySelector<HTMLInputElement>(`input[placeholder="${CHAT_INPUT_PLACEHOLDER}"]`);
      const form = input?.closest('form') as HTMLFormElement | null;
      const shell = form?.parentElement as HTMLElement | null;
      const messages = form?.previousElementSibling as HTMLElement | null;
      const header = messages?.previousElementSibling as HTMLElement | null;

      if (!form || !shell || !messages || !header) {
        activeShell = null;
        activeHeader = null;
        syncButtonPosition();
        return;
      }

      activeShell = shell;
      activeHeader = header;
      shell.classList.add('msa-chat-shell');
      messages.classList.add('msa-chat-messages');
      header.classList.add('msa-chat-header');

      if (activeMessages !== messages) {
        messagesObserver?.disconnect();
        activeMessages = messages;
        lastMessageCount = messages.children.length;
        scrollConversationToBottom(messages, 'auto');
        messagesObserver = new MutationObserver(() => {
          const nextCount = messages.children.length;
          if (nextCount !== lastMessageCount) {
            lastMessageCount = nextCount;
            scrollConversationToBottom(messages);
          }
        });
        messagesObserver.observe(messages, { childList: true });
      }

      syncButtonPosition();
    }

    button.addEventListener('click', () => {
      if (!activeShell) return;
      const expanded = activeShell.classList.toggle('msa-chat-expanded');
      document.body.classList.toggle('msa-chat-lock', expanded);
      setExpandButtonState(button, expanded);
      syncButtonPosition();
      scrollConversationToBottom(activeMessages, 'auto');
    });

    attachChatControls();
    const finder = window.setInterval(attachChatControls, 700);
    window.addEventListener('resize', syncButtonPosition);
    window.addEventListener('scroll', syncButtonPosition, { passive: true });

    return () => {
      window.clearInterval(finder);
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncButtonPosition);
      window.removeEventListener('scroll', syncButtonPosition);
      messagesObserver?.disconnect();
      button.remove();
      document.body.classList.remove('msa-chat-lock');
    };
  }, []);

  return null;
}
