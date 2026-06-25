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

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function appendToChatInput(text: string) {
  const input = document.querySelector<HTMLInputElement>('input[placeholder="Fazer consulta estratégica..."]');
  if (!input) return false;
  const separator = input.value.trim() ? ' ' : '';
  setNativeInputValue(input, `${input.value}${separator}${text}`);
  input.focus();
  return true;
}

function updateChatInput(baseText: string, text: string) {
  const input = document.querySelector<HTMLInputElement>('input[placeholder="Fazer consulta estratégica..."]');
  if (!input) return false;
  const separator = baseText.trim() && text.trim() ? ' ' : '';
  setNativeInputValue(input, `${baseText}${separator}${text}`);
  input.focus();
  return true;
}

function createButton(label: string, compact = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.border = '1px solid rgba(255,255,255,0.14)';
  button.style.background = 'rgba(255,255,255,0.05)';
  button.style.color = '#f8fafc';
  button.style.padding = compact ? '0 12px' : '0 14px';
  button.style.fontSize = '11px';
  button.style.fontWeight = '900';
  button.style.letterSpacing = '0.08em';
  button.style.textTransform = 'uppercase';
  button.style.minHeight = '44px';
  button.style.whiteSpace = 'nowrap';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.gap = '6px';
  return button;
}

export function ChatInputEnhancements() {
  useEffect(() => {
    let recognition: SpeechRecognition | null = null;
    let isListening = false;
    let baseTranscript = '';
    let lastFinalTranscript = '';

    function stopListening(micButton: HTMLButtonElement) {
      isListening = false;
      micButton.textContent = 'Falar';
      micButton.style.borderColor = 'rgba(255,255,255,0.14)';
      micButton.style.background = 'rgba(255,255,255,0.05)';
    }

    function attachControls() {
      const input = document.querySelector<HTMLInputElement>('input[placeholder="Fazer consulta estratégica..."]');
      const form = input?.closest('form');
      if (!input || !form || form.querySelector('[data-chat-enhancement="true"]')) return;

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.txt,.csv,.md,.json,.xml';
      fileInput.style.display = 'none';
      fileInput.dataset.chatEnhancement = 'true';

      const micButton = createButton('Falar');
      micButton.dataset.chatEnhancement = 'true';
      micButton.title = 'Falar por voz';
      micButton.setAttribute('aria-label', 'Falar por voz');

      const fileButton = createButton('Anexar', true);
      fileButton.dataset.chatEnhancement = 'true';
      fileButton.title = 'Anexar arquivo de texto, CSV, JSON ou Markdown';
      fileButton.setAttribute('aria-label', 'Anexar arquivo');

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
        micButton.textContent = 'Ouvindo...';
        micButton.style.borderColor = 'rgba(245,158,11,0.75)';
        micButton.style.background = 'rgba(245,158,11,0.18)';

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
