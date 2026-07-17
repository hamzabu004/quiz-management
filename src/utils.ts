import katex from 'katex';

/**
 * Formats standard LaTeX string formulas into beautiful inline styled HTML components.
 * Matches $$ ... $$ for display math and $ ... $ or \( ... \) for inline math
 */
export function formatLaTeX(text: string): string {
  if (!text) return '';

  let formatted = text;

  // Replace block math $$ ... $$
  formatted = formatted.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="my-3 overflow-x-auto text-center">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false, output: 'html' })}</div>`;
    } catch (e) {
      return `<div class="my-3 py-2 px-4 rounded bg-lumina-container-lowest text-center font-mono text-sm overflow-x-auto border border-white/5 text-red-500">${math}</div>`;
    }
  });

  // Replace inline math \( ... \)
  formatted = formatted.replace(/\\\((.*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false, output: 'html' });
    } catch (e) {
      return `<span class="font-mono text-xs md:text-sm italic font-medium text-red-500 px-1 mx-0.5">${math}</span>`;
    }
  });

  // Replace inline math $ ... $
  formatted = formatted.replace(/\$((?:[^$]|\\[$])*?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false, output: 'html' });
    } catch (e) {
      return `<span class="font-mono text-xs md:text-sm italic font-medium text-red-500 px-1 mx-0.5">${math}</span>`;
    }
  });

  return formatted;
}

/**
 * Capitalizes string nicely
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Creates a unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}
