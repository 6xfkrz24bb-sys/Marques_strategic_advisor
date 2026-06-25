'use client';

import { useEffect } from 'react';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionResultItem = {
  0: { transcript: string };
  isFinal?: boolean;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<SpeechRecognitionResultItem>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const micIcon = `
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14.5a3 3 0 0 0 3-3v-5a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19 11.5a7 7 0 0 1-14 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 18.5v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
`;

const stopIcon = `
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>
  </svg>
`;

const clipIcon = `
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="m21.4 11.6-8.7 8.7a6 6 0 0 1-8.5-8.5l9.4-9.4a4 4 0 0 1 5.7 5.7l-9.4 9.4a2 2 0 0 1-2.8-2.8l8.7-8.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function findChatInput() {
  return document.querySelector<HTMLInputElement>('input[placeholder="Fazer consulta estratégica..."]');
}

function appendToChatInput(text: string) {
  const input = findChatInput();
  if (!input) return false;
  const separator = input.value.trim() ? ' ' : '';
  setNativeInputValue(input, `${input.value}${separator}${text}`);
  input.focus();
  return true;
}

function updateChatInput(baseText: string, text: string) {
  const input = findChatInput();
  if (!input) return false;
  const separator = baseText.trim() && text.trim() ? ' ' : '';
  setNativeInputValue(input, `${baseText}${separator}${text}`);
  input.focus();
  return true;
}

function createIconButton(icon: string, label: string) {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = icon;
  button.title = label;
  button.setAttribute('aria-label', label);
  button.style.border = '1px solid rgba(255,255,255,0.16)';
  button.style.background = 'rgba(255,255,255,0.04)';
  button.style.color = '#e5e7eb';
  button.style.width = '46px';
  button.style.minWidth = '46px';
  button.style.height = '46px';
  button.style.padding = '0';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.flex = '0 0 46px';
  button.style.borderRadius = '0';
  button.style.cursor = 'pointer';
  button.style.boxSizing = 'border-box';
  return button;
}

function alignChatForm(form: HTMLFormElement, input: HTMLInputElement) {
  const submitButton = Array.from(form.querySelectorAll<HTMLButtonElement>('button')).find((button) => button.type !== 'button');

  form.style.display = 'grid';
  form.style.gridTemplateColumns = 'minmax(0,1fr) 46px 46px minmax(78px,96px)';
  form.style.gap = '8px';
  form.style.alignItems = 'stretch';
  form.style.width = '100%';
  form.style.maxWidth = '100%';
  form.style.overflow = 'hidden';

  input.style.minWidth = '0';
  input.style.width = '100%';
  input.style.boxSizing = 'border-box';
  input.style.height = '46px';

  if (submitButton) {
    submitButton.style.width = '100%';
    submitButton.style.minWidth = '0';
    submitButton.style.height = '46px';
    submitButton.style.paddingLeft = '8px';
    submitButton.style.paddingRight = '8px';
    submitButton.style.boxSizing = 'border-box';
  }
}

export function ChatInputEnhancements() {
  useEffect(() => {
    let recognition: SpeechRecognition | null = null;
    let isListening = false;
    let baseTranscript = '';
    let lastFinalTranscript = '';

    function stopListening(micButton: HTMLButtonElement) {
      isListening = false;
      micButton.innerHTML = micIcon;
      micButton.title = 'Falar por voz';
      micButton.setAttribute('aria-label', 'Falar por voz');
      micButton.style.borderColor = 'rgba(255,255,255,0.16)';
      micButton.style.background = 'rgba(255,255,255,0.04)';
      micButton.style.color = '#e5e7eb';
    }

    function attachControls() {
      const input = findChatInput();
      const form = input?.closest('form');
      if (!input || !form || form.querySelector('[data-chat-enhancement="true"]')) return;

      alignChatForm(form, input);

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.txt,.csv,.md,.json,.xml';
      fileInput.style.display = 'none';
      fileInput.dataset.chatEnhancement = 'true';

      const micButton = createIconButton(micIcon, 'Falar por voz');
      micButton.dataset.chatEnhancement = 'true';

      const fileButton = createIconButton(clipIcon, 'Anexar arquivo');
      fileButton.dataset.chatEnhancement = 'true';

      micButton.onclick = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
          appendToChatInput('Use o microfone do teclado do celular para ditar sua mensagem.');
          return;
        }

        if (isListening && recognition) {
          recognition.stop();
          stopListening(micButton);
          return;
        }

        recognition = new Recognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        recognition.continuous = false;
        isListening = true;
        baseTranscript = input.value.trim();
        lastFinalTranscript = '';
        micButton.innerHTML = stopIcon;
        micButton.title = 'Parar gravação';
        micButton.setAttribute('aria-label', 'Parar gravação');
        micButton.style.borderColor = 'rgba(245,158,11,0.85)';
        micButton.style.background = 'rgba(245,158,11,0.18)';
        micButton.style.color = '#f59e0b';

        recognition.onresult = (event) => {
          const pieces = Array.from(event.results).map((result) => result[0].transcript.trim()).filter(Boolean);
          const transcript = pieces.join(' ').trim();
          if (!transcript) return;
          updateChatInput(baseTranscript, transcript);
          lastFinalTranscript = transcript;
        };

        recognition.onerror = () => {
          stopListening(micButton);
          if (!lastFinalTranscript) appendToChatInput('Não consegui capturar o áudio. Use o microfone do teclado ou digite a mensagem.');
        };

        recognition.onend = () => {
          stopListening(micButton);
        };

        recognition.start();
      };

      fileButton.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const maxBytes = 700_000;
        if (file.size > maxBytes) {
          appendToChatInput(`Arquivo selecionado: ${file.name}. O MVP aceita arquivos de texto até 700KB. Para PDF/Excel, envie um resumo ou convertemos na próxima etapa.`);
          fileInput.value = '';
          return;
        }
        try {
          const text = await file.text();
          const content = text.slice(0, 18000);
          appendToChatInput(`Arquivo anexado: ${file.name}\n\nConteúdo do arquivo:\n${content}`);
        } catch {
          appendToChatInput(`Não consegui ler o arquivo ${file.name}. Use TXT, CSV, MD, JSON ou XML nesta versão inicial.`);
        } finally {
          fileInput.value = '';
        }
      };

      form.insertBefore(fileInput, form.firstChild);
      form.insertBefore(micButton, form.children[form.children.length - 1]);
      form.insertBefore(fileButton, form.children[form.children.length - 1]);
      alignChatForm(form, input);
    }

    const timer = window.setInterval(attachControls, 700);
    attachControls();

    return () => {
      window.clearInterval(timer);
      if (recognition) recognition.stop();
    };
  }, []);

  return null;
}
