import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';

marked.setOptions({
  gfm: true,
  breaks: true,
});

// Render fenced code blocks with syntax highlighting.
marked.use({
  renderer: {
    code(token: any) {
      const text: string = token.text ?? '';
      const lang: string = (token.lang ?? '').trim().split(/\s+/)[0] ?? '';
      const language = lang && hljs.getLanguage(lang) ? lang : '';
      let highlighted: string;
      try {
        highlighted = language
          ? hljs.highlight(text, { language }).value
          : hljs.highlightAuto(text).value;
      } catch {
        highlighted = escapeHtml(text);
      }
      const label = language
        ? `<span class="code-lang">${escapeHtml(language)}</span>`
        : '';
      return `<pre class="code-block">${label}<code class="hljs language-${language || 'plaintext'}">${highlighted}</code></pre>`;
    },
  },
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Open external links in a new tab without leaking the opener.
DOMPurify.addHook('afterSanitizeAttributes', (node: any) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const SANITIZE_OPTS = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'del', 's',
    'code', 'pre',
    'blockquote',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class'],
};

/**
 * Convert Markdown source into sanitized HTML ready for {@html}.
 * Safe to call on every streamed chunk (handles partial input gracefully).
 */
export function renderMarkdown(src: string): string {
  if (!src) return '';
  const raw = marked.parse(src) as string;
  return DOMPurify.sanitize(raw, SANITIZE_OPTS);
}
