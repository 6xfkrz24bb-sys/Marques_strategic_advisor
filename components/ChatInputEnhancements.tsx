'use client';

import { useEffect } from 'react';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<{ 0: { transcript: string } }>;
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
  const separator = input.value.trim() ? '\n\n' : '';
  setNativeInputValue(input, `${input.value}${separator}${text}`);
  input.focus();
  return true;
}

function createButton(label: string) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.border = '1px solid rgba(255,255,255,0.12)';
  button.style.background = 'rgba(255,255,255,0.04)';
  button.style.color = '#f8fafc';
  button.style.padding = '0 12px';
  button.style.fontSize = '10px';
  button.style.fontWeight = '800';
  button.style.letterSpacing = '0.08em';
  button.style.textTransform = 'uppercase';
  button.style.minHeight = '44px';
  return button;
}

export function ChatInputEnhancements() {
  useEffect(() => {
    let recognition: SpeechRecognition | null = null;
    let isListening = false;

    function attachControls() {
      const input = document.querySelector<HTMLInputElement>('input[placeholder="Fazer consulta estratégica..."]');
      const form = input?.closest('form');
      if (!input || !form || form.querySelector('[data-chat-enhancement="true"]')) return;

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.txt,.csv,.md,.json,.xml';
      fileInput.style.display = 'none';
      fileInput.dataset.chatEnhancement = 'true';

      const micButton = createButton('🎙️');
      micButton.dataset.chatEnhancement = 'true';
      micButton.title = 'Falar por voz';

      const fileButton = createButton('📎');
      fileButton.dataset.chatEnhancement = 'true';
      fileButton.title = 'Anexar arquivo de texto, CSV, JSON ou Markdown';

      micButton.onclick = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
          appendToChatInput('Meu navegador não liberou ditado por voz neste dispositivo.');
          return;
        }

        if (isListening && recognition) {
          recognition.stop();
          return;
        }

        recognition = new Recognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.continuous = false;
        isListening = true;
        micButton.textContent = '⏹️';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ');
          appendToChatInput(transcript);
        };
        recognition.onerror = () => {
          appendToChatInput('Não consegui capturar o áudio. Tente novamente ou digite a mensagem.');
        };
        recognition.onend = () => {
          isListening = false;
          micButton.textContent = '🎙️';
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
