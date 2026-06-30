'use client';

import { useEffect } from 'react';

const copyIcon = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
`;

function isTableLine(line: string) {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3;
}

function isSeparatorLine(line: string) {
  if (!isTableLine(line)) return false;
  return line
    .trim()
    .slice(1, -1)
    .split('|')
    .every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
}

function rowToCells(line: string) {
  return line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim().replace(/<br\s*\/?>(\s*)/gi, ' ').replace(/\*\*/g, ''));
}

function markdownTablesToTsv(content: string) {
  const lines = content.split(/\r?\n/);
  const tables: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!isTableLine(lines[index]) || !isSeparatorLine(lines[index + 1] || '')) continue;

    const rows: string[][] = [];
    rows.push(rowToCells(lines[index]));
    index += 2;

    while (index < lines.length && isTableLine(lines[index])) {
      if (!isSeparatorLine(lines[index])) rows.push(rowToCells(lines[index]));
      index += 1;
    }

    tables.push(rows.map((row) => row.join('\t')).join('\n'));
  }

  return tables.join('\n\n');
}

function hasMarkdownTable(content: string) {
  const lines = content.split(/\r?\n/);
  return lines.some((line, index) => isTableLine(line) && isSeparatorLine(lines[index + 1] || ''));
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  area.style.top = '0';
  document.body.appendChild(area);
  area.focus();
  area.select();
  document.execCommand('copy');
  area.remove();
}

function enhanceBubble(bubble: HTMLElement) {
  if (bubble.dataset.copyEnhanced === 'true') return;
  const content = bubble.innerText.trim();
  if (!content) return;

  const tableReady = hasMarkdownTable(content);
  const clipboardText = tableReady ? markdownTablesToTsv(content) || content : content;

  bubble.dataset.copyEnhanced = 'true';
  bubble.style.position = 'relative';

  const actionRow = document.createElement('div');
  actionRow.dataset.copyToolbar = 'true';
  actionRow.style.marginTop = '10px';
  actionRow.style.display = 'flex';
  actionRow.style.flexDirection = 'column';
  actionRow.style.alignItems = 'flex-start';
  actionRow.style.gap = '6px';

  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `${copyIcon}<span>${tableReady ? 'Copiar Excel' : 'Copiar'}</span>`;
  button.title = tableReady ? 'Copiar tabela para colar no Excel' : 'Copiar resposta';
  button.setAttribute('aria-label', button.title);
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.gap = '6px';
  button.style.border = '1px solid rgba(245,158,11,0.35)';
  button.style.background = 'rgba(245,158,11,0.10)';
  button.style.color = '#fbbf24';
  button.style.padding = '6px 8px';
  button.style.fontSize = '10px';
  button.style.fontWeight = '800';
  button.style.letterSpacing = '0.10em';
  button.style.textTransform = 'uppercase';
  button.style.cursor = 'pointer';

  const helper = document.createElement('span');
  helper.textContent = tableReady ? 'Toque em Copiar Excel e cole direto no Excel ou Google Sheets.' : '';
  helper.style.color = '#94a3b8';
  helper.style.fontSize = '10px';
  helper.style.lineHeight = '1.4';

  button.onclick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const original = button.innerHTML;
    try {
      await writeClipboard(clipboardText);
      button.innerHTML = `${copyIcon}<span>Copiado</span>`;
      helper.textContent = tableReady ? 'Copiado em formato de colunas. Agora cole no Excel.' : 'Resposta copiada.';
      window.setTimeout(() => {
        button.innerHTML = original;
        helper.textContent = tableReady ? 'Toque em Copiar Excel e cole direto no Excel ou Google Sheets.' : '';
      }, 2200);
    } catch {
      helper.textContent = 'Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.';
    }
  };

  actionRow.appendChild(button);
  if (tableReady) actionRow.appendChild(helper);
  bubble.appendChild(actionRow);
}

export function ChatCopyEnhancements() {
  useEffect(() => {
    function enhanceAll() {
      document
        .querySelectorAll<HTMLElement>('div.whitespace-pre-line.text-slate-300')
        .forEach((bubble) => enhanceBubble(bubble));
    }

    enhanceAll();
    const observer = new MutationObserver(enhanceAll);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(enhanceAll, 1200);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
